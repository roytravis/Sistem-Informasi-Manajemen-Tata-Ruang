<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BaHasilPenilaian;
use App\Models\Penilaian;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests; // PERBAIKAN: Authorization
use App\Notifications\StageCompletionNotification; // Stage completion notifications
use Illuminate\Support\Facades\Notification; // For sending notifications

class BaHasilPenilaianController extends Controller
{
    use AuthorizesRequests; // PERBAIKAN: Enable authorization
    /**
     * Menampilkan data untuk Form Input atau Preview.
     */
    public function show($penilaianId)
    {
        // PERBAIKAN: Load kasus and permohonan for authorization
        $penilaian = Penilaian::with('kasus.permohonan.tim.users')->findOrFail($penilaianId);
        $this->authorize('view', $penilaian->kasus);
        
        $penilaian = Penilaian::with([
            'kasus.pemegang',
            'kasus.tim.users',
            'kasus.penanggung_jawab', // Koordinator
            'formulirAnalisis',
            'baHasilPenilaian'
        ])->findOrFail($penilaianId);

        // Validasi: Formulir Analisis harus ada
        if (!$penilaian->formulirAnalisis) {
            return response()->json(['message' => 'Formulir Analisis belum dibuat. Harap selesaikan analisis terlebih dahulu.'], 400);
        }

        return response()->json($penilaian);
    }

    /**
     * Menyimpan Berita Acara Hasil Penilaian baru.
     */
    public function store(Request $request)
    {
        // PERBAIKAN: Verify user can update this assessment
        $penilaian = Penilaian::with('kasus.permohonan.tim.users')->findOrFail($request->penilaian_id);
        $this->authorize('update', $penilaian->kasus);
        $request->validate([
            'penilaian_id' => 'required|exists:penilaians,id',
            'tanggal_ba' => 'required|date',
            'validitas_kegiatan' => 'required|in:BENAR,TIDAK BENAR',
            'rekomendasi_lanjutan' => 'required|string',
            'signatures' => 'required|array', // Array of signatures from frontend
            'nomor_ba' => 'nullable|string|max:255', // Validasi input nomor_ba (nullable)
        ]);

        try {
            DB::beginTransaction();

            // 1. Generate Nomor BA (Jika tidak diinput manual oleh user)
            // Logic: Jika request->nomor_ba ada dan tidak kosong, gunakan itu. Jika tidak, generate.
            $finalNomorBa = $request->nomor_ba;
            if (empty($finalNomorBa)) {
                // Format: BA-HP/YYYYMMDD/XXXX (Random 4 char)
                $finalNomorBa = 'BA-HP/' . now()->format('Ymd') . '/' . strtoupper(Str::random(4));
            }

            // 2. Proses Tanda Tangan
            $processedSignatures = [];
            foreach ($request->signatures as $sig) {
                $path = null;
                
                // Cek apakah signature berupa base64 image baru
                if (!empty($sig['signature_data']) && Str::startsWith($sig['signature_data'], 'data:image')) {
                    $path = $this->saveSignature($sig['signature_data'], 'ttd_bahp_' . Str::slug($sig['role']));
                } elseif (!empty($sig['existing_path'])) {
                    // Gunakan path lama jika ada (misal dari re-save)
                    $path = $sig['existing_path'];
                }

                $processedSignatures[] = [
                    'role' => $sig['role'],
                    'nama' => $sig['nama'],
                    'nip' => $sig['nip'],
                    'jabatan' => $sig['jabatan'],
                    'signature_path' => $path
                ];
            }

            // 3. Simpan Data (Update atau Create)
            $baHasil = BaHasilPenilaian::updateOrCreate(
                ['penilaian_id' => $request->penilaian_id],
                [
                    'nomor_ba' => $finalNomorBa, // Gunakan nomor yang sudah difinalisasi
                    'tanggal_ba' => $request->tanggal_ba,
                    'validitas_kegiatan' => $request->validitas_kegiatan,
                    'rekomendasi_lanjutan' => $request->rekomendasi_lanjutan,
                    'tanda_tangan_tim' => $processedSignatures,
                    // Simpan snapshot statis data petugas untuk keperluan arsip
                    'snapshot_petugas' => $processedSignatures, 
                ]
            );

            // UPDATE STATUS: Only change to "Selesai Dinilai (Verifikasi)" when ALL signatures are complete
            // Load relationships needed to count required signers
            $penilaian = Penilaian::with('kasus.permohonan.tim.users', 'kasus.penanggung_jawab')->findOrFail($request->penilaian_id);
            
            if ($penilaian && $penilaian->kasus) {
                $kasus = $penilaian->kasus;
                
                // Count required team members (Petugas Lapangan + Koordinator Lapangan + Ketua Tim)
                $requiredSignersCount = 0;
                
                // Petugas Lapangan + Ketua Tim from tim
                if ($kasus->permohonan && $kasus->permohonan->tim) {
                    $petugas = $kasus->permohonan->tim->users->filter(fn($u) => $u->pivot->jabatan_di_tim === 'Petugas Lapangan');
                    $requiredSignersCount += $petugas->count();
                    
                    // Ketua Tim
                    $ketua = $kasus->permohonan->tim->users->firstWhere('pivot.jabatan_di_tim', 'Ketua Tim');
                    if ($ketua) $requiredSignersCount++;
                }
                
                // Koordinator Lapangan
                if ($kasus->penanggung_jawab) {
                    $requiredSignersCount++;
                }
                
                // Check if all required signatures are present
                $signedCount = count(array_filter($processedSignatures, fn($sig) => !empty($sig['signature_path'])));
                $allSigned = $signedCount >= $requiredSignersCount && $requiredSignersCount > 0;
                
                Log::info("BA Hasil signature check: {$signedCount}/{$requiredSignersCount} signatures for Kasus ID {$kasus->id}");
                
                if ($allSigned) {
                    // All signatures complete - update status
                    $kasus->update(['status' => 'Selesai Dinilai (Verifikasi)']);
                    
                    // Update PermohonanPenilaian status
                    $permohonan = \App\Models\PermohonanPenilaian::where('nomor_permohonan', $kasus->nomor_permohonan)->first();
                    if ($permohonan) {
                        $permohonan->update(['status' => 'Selesai Dinilai (Verifikasi)']);
                    }
                    
                    Log::info("Status updated to 'Selesai Dinilai (Verifikasi)' for Kasus ID {$kasus->id} after BA Hasil Penilaian saved.");
                    
                    // --- SEND STAGE COMPLETION NOTIFICATIONS ---
                    // Notify Koordinator Lapangan and Ketua Tim about Stage 4 completion (final stage)
                    $this->sendStageCompletionNotifications($kasus, 4, $request->user());
                    // --- END NOTIFICATIONS ---
                } else {
                    Log::info("BA Hasil saved but signatures incomplete ({$signedCount}/{$requiredSignersCount}) for Kasus ID {$kasus->id}. Status NOT updated.");
                }
            }

            DB::commit();
            return response()->json($baHasil, 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error saving BA Hasil Penilaian: " . $e->getMessage());
            return response()->json(['message' => 'Gagal menyimpan Berita Acara: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Helper: Simpan base64 ke file
     */
    private function saveSignature($base64Image, $prefix)
    {
        if (preg_match('/^data:image\/(\w+);base64,/', $base64Image, $type)) {
            $data = substr($base64Image, strpos($base64Image, ',') + 1);
            $type = strtolower($type[1]);

            if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png'])) {
                throw new \Exception('Tipe gambar tidak valid');
            }
            $data = base64_decode($data);
            if ($data === false) {
                throw new \Exception('Gagal decode base64');
            }
        } else {
            throw new \Exception('Format data URI tidak valid');
        }

        $fileName = 'signatures/' . $prefix . '_' . Str::uuid() . '.' . $type;
        Storage::disk('public')->put($fileName, $data);
        return $fileName;
    }

    /**
     * Helper method to send stage completion notifications
     * to Koordinator Lapangan and Ketua Tim
     */
    private function sendStageCompletionNotifications($kasus, $stage, $completedBy)
    {
        try {
            // Load permohonan and tim if not already loaded
            if (!$kasus->relationLoaded('permohonan')) {
                $kasus->load('permohonan.tim.users', 'penanggung_jawab');
            }

            $recipients = [];

            // Get Koordinator Lapangan (penanggung_jawab)
            if ($kasus->penanggung_jawab) {
                $recipients[] = $kasus->penanggung_jawab;
            }

            // Get Ketua Tim from the assigned team
            if ($kasus->permohonan && $kasus->permohonan->tim) {
                $ketuaTim = $kasus->permohonan->tim->users()
                    ->wherePivot('jabatan_di_tim', 'Ketua Tim')
                    ->first();
                
                if ($ketuaTim && !in_array($ketuaTim->id, array_column($recipients, 'id'))) {
                    $recipients[] = $ketuaTim;
                }
            }

            // Exclude the user who completed the action (they don't need a self-notification)
            $recipients = array_filter($recipients, fn($user) => $user->id !== $completedBy->id);
            $recipients = array_values($recipients);

            // Send notifications to remaining recipients
            if (!empty($recipients)) {
                Notification::send($recipients, new StageCompletionNotification($kasus, $stage, $completedBy));
                Log::info("Stage {$stage} completion notifications sent to " . count($recipients) . " recipients for Kasus ID {$kasus->id}");
            } else {
                Log::warning("No recipients found for stage completion notification for Kasus ID {$kasus->id}");
            }
        } catch (\Exception $e) {
            // Log error but don't fail the main operation
            Log::error("Error sending stage completion notifications for Kasus ID {$kasus->id}: " . $e->getMessage());
        }
    }
}