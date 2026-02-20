<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BaPemeriksaan;
use App\Models\Penilaian;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests; // PERBAIKAN: Authorization
use App\Notifications\StageCompletionNotification; // Stage completion notifications
use Illuminate\Support\Facades\Notification; // For sending notifications

class BaPemeriksaanController extends Controller
{
    use AuthorizesRequests; // PERBAIKAN: Enable authorization
    public function show(Penilaian $penilaian)
    {
        // PERBAIKAN: Load kasus and permohonan for authorization
        $penilaian->load('kasus.permohonan.tim.users');
        
        // PERBAIKAN: Verify user has access to this Kasus
        $this->authorize('view', $penilaian->kasus);
        try {
            $baPemeriksaan = BaPemeriksaan::where('penilaian_id', $penilaian->id)->first();
            if (!$baPemeriksaan) {
                return response()->json(null, 200);
            }
            return response()->json($baPemeriksaan);
        } catch (\Exception $e) {
            Log::error("Error fetching BaPemeriksaan: " . $e->getMessage());
            return response()->json(['message' => 'Gagal mengambil data Berita Acara Pemeriksaan.'], 500);
        }
    }

    public function store(Request $request)
    {
        // PERBAIKAN: Verify user can update this assessment
        $penilaian = Penilaian::with('kasus.permohonan.tim.users')->findOrFail($request->penilaian_id);
        $this->authorize('update', $penilaian->kasus);
        $baPemeriksaan = BaPemeriksaan::where('penilaian_id', $request->penilaian_id)->first();

        $validatedData = $request->validate([
            'penilaian_id' => 'required|exists:penilaians,id',
            'nomor_ba' => [
                'required',
                'string',
                'max:255',
                Rule::unique('ba_pemeriksaans')->ignore($baPemeriksaan->id ?? null),
            ],
            'nomor_spt' => 'required|string|max:255',
            'nama_pemegang' => 'required|string|max:255',
            'tanda_tangan_pemegang' => 'nullable|string', // Base64 - can be added later by Koordinator/Ketua Tim
            
            'nama_koordinator' => 'nullable|string|max:255',
            'tanda_tangan_koordinator' => 'nullable|string', // Base64
            
            // Validasi Array Tanda Tangan Tim
            'tanda_tangan_tim' => 'nullable|array',
            'tanda_tangan_tim.*.user_id' => 'required|exists:users,id',
            'tanda_tangan_tim.*.nama' => 'required|string',
            'tanda_tangan_tim.*.signature' => 'nullable|string', // Base64 atau Path
        ]);

        try {
            // Proses Tanda Tangan Tim (Simpan file jika base64)
            $processedSignatures = [];
            
            // Ambil data lama untuk merge jika perlu
            $existingSignatures = $baPemeriksaan && $baPemeriksaan->tanda_tangan_tim ? collect($baPemeriksaan->tanda_tangan_tim)->keyBy('user_id') : collect([]);

            if (!empty($validatedData['tanda_tangan_tim'])) {
                foreach ($validatedData['tanda_tangan_tim'] as $sig) {
                    $path = null;
                    
                    // Cek jika signature dikirim (tidak null)
                    if (!empty($sig['signature'])) {
                        // Jika format base64, simpan sebagai file
                        if (Str::startsWith($sig['signature'], 'data:image')) {
                            $path = $this->saveSignature($sig['signature'], 'ttd_ba_tim_' . $sig['user_id']);
                        } else {
                            // Jika bukan base64, asumsikan itu path lama yang dikirim balik
                            $path = $sig['signature'];
                        }
                    } else {
                        // Jika kosong, coba ambil dari data lama
                        $path = $existingSignatures[$sig['user_id']]['signature_path'] ?? null;
                    }

                    $processedSignatures[] = [
                        'user_id' => $sig['user_id'],
                        'nama' => $sig['nama'],
                        'nip' => $sig['nip'] ?? null,
                        'signature_path' => $path
                    ];
                }
            }

            // Update atau Create Data
            $dataToSave = [
                'penilaian_id' => $validatedData['penilaian_id'],
                'nomor_ba' => $validatedData['nomor_ba'],
                'nomor_spt' => $validatedData['nomor_spt'],
                'nama_pemegang' => $validatedData['nama_pemegang'],
                'tanda_tangan_pemegang' => $validatedData['tanda_tangan_pemegang'], // Disimpan direct (existing logic)
                'nama_koordinator' => $validatedData['nama_koordinator'],
                'tanda_tangan_koordinator' => $validatedData['tanda_tangan_koordinator'], // Disimpan direct
                'tanda_tangan_tim' => $processedSignatures, // JSON Array baru
            ];

            $result = BaPemeriksaan::updateOrCreate(
                ['penilaian_id' => $validatedData['penilaian_id']],
                $dataToSave
            );

            // --- DYNAMIC STATUS UPDATE: Stage 2 Completed ---
            // After BERITA ACARA PEMERIKSAAN is saved, update status to next stage
            $penilaian = Penilaian::with('kasus')->findOrFail($validatedData['penilaian_id']);
            
            if ($penilaian && $penilaian->kasus) {
                $kasus = $penilaian->kasus;
                $kasus->update(['status' => 'Menunggu ANALISIS']);
                
                $permohonan = \App\Models\PermohonanPenilaian::where('nomor_permohonan', $kasus->nomor_permohonan)->first();
                if ($permohonan) {
                    $permohonan->update(['status' => 'Menunggu ANALISIS']);
                }
                
                Log::info("Status updated to 'Menunggu ANALISIS' for Kasus ID {$kasus->id} after Stage 2 completed.");
                
                // --- SEND STAGE COMPLETION NOTIFICATIONS ---
                // Notify Koordinator Lapangan and Ketua Tim about Stage 2 completion
                $this->sendStageCompletionNotifications($kasus, 2, $request->user());
                // --- END NOTIFICATIONS ---
            }
            // --- END DYNAMIC STATUS UPDATE ---

            return response()->json($result, 201);

        } catch (\Exception $e) {
            Log::error("Error saving BaPemeriksaan: " . $e->getMessage());
            if (str_contains($e->getMessage(), 'Duplicate entry') && str_contains($e->getMessage(), 'nomor_ba')) {
                 return response()->json(['message' => 'Gagal menyimpan: Nomor Berita Acara sudah digunakan.'], 409);
            }
            return response()->json(['message' => 'Gagal menyimpan data: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Helper: Simpan base64 ke file storage
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
            return null; // Atau throw error
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