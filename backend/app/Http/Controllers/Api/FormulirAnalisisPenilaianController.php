<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FormulirAnalisisPenilaian;
use App\Models\Penilaian;
use App\Models\EditRequest; // Import Model EditRequest
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests; // PERBAIKAN: Authorization
use App\Notifications\StageCompletionNotification; // Stage completion notifications
use Illuminate\Support\Facades\Notification; // For sending notifications

class FormulirAnalisisPenilaianController extends Controller
{
    use AuthorizesRequests; // PERBAIKAN: Enable authorization
    /**
     * Menampilkan data formulir analisis berdasarkan ID Penilaian.
     */
    public function show(Penilaian $penilaian)
    {
        // PERBAIKAN: Load kasus and permohonan for authorization
        $penilaian->load('kasus.permohonan.tim.users');
        
        // PERBAIKAN: Verify user has access to this Kasus
        $this->authorize('view', $penilaian->kasus);
        $formulir = FormulirAnalisisPenilaian::where('penilaian_id', $penilaian->id)->first();
        
        if (!$formulir) {
            return response()->json(['message' => 'Formulir analisis belum ada.'], 404);
        }

        return response()->json($formulir);
    }

    /**
     * Menyimpan atau memperbarui data formulir analisis.
     */
    public function store(Request $request, Penilaian $penilaian)
    {
        // PERBAIKAN: Load kasus and permohonan for authorization
        $penilaian->load('kasus.permohonan.tim.users');
        
        // PERBAIKAN: Verify user can update this assessment
        $this->authorize('update', $penilaian->kasus);
        // 1. Validasi Input Lengkap
        $validatedData = $request->validate([
            'lokasi_kesesuaian_pmp_eksisting' => 'nullable|string',
            'jenis_kesesuaian_pmp_eksisting' => 'nullable|string',
            'jenis_ketentuan_rtr' => 'nullable|string',
            'jenis_kesesuaian_rtr' => 'nullable|string',
            'luas_digunakan_ketentuan_rtr' => 'nullable|string',
            'luas_digunakan_kesesuaian_rtr' => 'nullable|string',
            'luas_dikuasai_ketentuan_rtr' => 'nullable|string',
            'luas_dikuasai_kesesuaian_rtr' => 'nullable|string',
            'kdb_ketentuan_rtr' => 'nullable|string',
            'kdb_kesesuaian_rtr' => 'nullable|string',
            'kdb_rasio_manual' => 'nullable|string',
            'kdb_persen_manual' => 'nullable|string',
            'klb_luas_tanah' => 'nullable|string',
            'klb_ketentuan_rtr' => 'nullable|string',
            'klb_kesesuaian_rtr' => 'nullable|string',
            'klb_rasio_manual' => 'nullable|string',
            
            // Kolom Ketinggian Bangunan
            'ketinggian_ketentuan_rtr' => 'nullable|string',
            'ketinggian_kesesuaian_rtr' => 'nullable|string',

            'kdh_luas_tanah' => 'nullable|string',
            'kdh_perbandingan_vegetasi' => 'nullable|string',
            'kdh_ketentuan_rtr' => 'nullable|string',
            'kdh_kesesuaian_rtr' => 'nullable|string',
            'kdh_rasio_manual' => 'nullable|string',
            'ktb_luas_tanah' => 'nullable|string',
            'ktb_ketentuan_rtr' => 'nullable|string',
            'ktb_kesesuaian_rtr' => 'nullable|string',
            'ktb_rasio_manual' => 'nullable|string',
            'ktb_persen_manual' => 'nullable|string',
            'gsb_ketentuan_rtr' => 'nullable|string',
            'gsb_kesesuaian_rtr' => 'nullable|string',
            'jbb_ketentuan_rtr' => 'nullable|string',
            'jbb_kesesuaian_rtr' => 'nullable|string',
            
            // Validasi Tanda Tangan
            'tanda_tangan_tim' => 'nullable|array',
            'tanda_tangan_tim.*.user_id' => 'required_with:tanda_tangan_tim|exists:users,id',
            'tanda_tangan_tim.*.signature' => 'required_with:tanda_tangan_tim|string',
        ]);

        try {
            DB::beginTransaction();

            // 2. Proses Penyimpanan Tanda Tangan
            $tandaTanganPaths = [];
            if (!empty($validatedData['tanda_tangan_tim'])) {
                foreach ($validatedData['tanda_tangan_tim'] as $tandaTangan) {
                    // Cek apakah ini base64 image baru
                    if (Str::startsWith($tandaTangan['signature'], 'data:image')) {
                         // Simpan file baru
                         $path = $this->saveSignature($tandaTangan['signature'], 'ttd_analisis_' . $tandaTangan['user_id']);
                         $tandaTanganPaths[] = [
                            'user_id' => $tandaTangan['user_id'],
                            'signature_path' => $path
                        ];
                    } else {
                        // Gunakan path lama jika bukan base64 (tidak berubah)
                        $tandaTanganPaths[] = [
                            'user_id' => $tandaTangan['user_id'],
                            'signature_path' => $tandaTangan['signature']
                        ];
                    }
                }
            }
            
            // Gabungkan dengan TTD yang sudah ada di database untuk user lain (merge)
            $existingFormulir = FormulirAnalisisPenilaian::where('penilaian_id', $penilaian->id)->first();
            $existingSignatures = $existingFormulir?->tanda_tangan_tim ?? [];
            
            // Buat map user_id -> signature data
            $existingSigMap = collect($existingSignatures)->keyBy('user_id');

            // Timpa atau tambah signature baru
            foreach ($tandaTanganPaths as $newSig) {
                $existingSigMap[$newSig['user_id']] = $newSig;
            }

            // Masukkan data TTD yang sudah digabung kembali ke validatedData
            $validatedData['tanda_tangan_tim'] = $existingSigMap->values()->all();

            // 3. Simpan/Update Formulir ke Database
            $formulir = FormulirAnalisisPenilaian::updateOrCreate(
                ['penilaian_id' => $penilaian->id],
                $validatedData
            );

            // --- 4. LOGIKA PENTING: AUTO-LOCK (Set Status Request ke 'Completed') ---
            // Cek apakah ada edit request yang statusnya 'approved' untuk penilaian ini.
            // Jika ada, artinya user sedang dalam sesi edit yang diizinkan.
            // Setelah user menekan tombol simpan, sesi edit dianggap selesai.
            $activeRequest = EditRequest::where('penilaian_id', $penilaian->id)
                ->where('status', 'approved')
                ->latest()
                ->first();

            // Ubah status menjadi 'completed' agar frontend kembali mengunci form (Read-Only)
            if ($activeRequest) {
                $activeRequest->update([
                    'status' => 'completed',
                    'processed_at' => now()
                ]);
            }
            // -----------------------------------------------------------------------

            // --- DYNAMIC STATUS UPDATE: Stage 3 Completed ---
            // After FORMULIR ANALISIS PENILAIAN is saved, update status to next stage
            $penilaianWithKasus = Penilaian::with('kasus')->find($penilaian->id);
            
            if ($penilaianWithKasus && $penilaianWithKasus->kasus) {
                $kasus = $penilaianWithKasus->kasus;
                $kasus->update(['status' => 'Menunggu Berita Acara Hasil Penilaian']);
                
                $permohonan = \App\Models\PermohonanPenilaian::where('nomor_permohonan', $kasus->nomor_permohonan)->first();
                if ($permohonan) {
                    $permohonan->update(['status' => 'Menunggu Berita Acara Hasil Penilaian']);
                }
                
                Log::info("Status updated to 'Menunggu Berita Acara Hasil Penilaian' for Kasus ID {$kasus->id} after Stage 3 completed.");
                
                // --- SEND STAGE COMPLETION NOTIFICATIONS ---
                // Notify Koordinator Lapangan and Ketua Tim about Stage 3 completion
                $this->sendStageCompletionNotifications($kasus, 3, $request->user());
                // --- END NOTIFICATIONS ---
            }
            // --- END DYNAMIC STATUS UPDATE ---

            DB::commit();
            return response()->json($formulir, 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error saving Formulir Analisis: " . $e->getMessage());
            return response()->json(['message' => 'Gagal menyimpan formulir analisis: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Fungsi helper untuk menyimpan tanda tangan base64 menjadi file.
     */
    private function saveSignature($base64Image, $prefix)
    {
        if (preg_match('/^data:image\/(\w+);base64,/', $base64Image, $type)) {
            $data = substr($base64Image, strpos($base64Image, ',') + 1);
            $type = strtolower($type[1]); // jpg, png, gif

            if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png'])) {
                throw new \InvalidArgumentException('Tipe gambar tidak valid.');
            }
            $data = base64_decode($data);

            if ($data === false) {
                throw new \RuntimeException('Gagal melakukan decode base64.');
            }
        } else {
            throw new \InvalidArgumentException('Format data URI gambar tidak sesuai.');
        }

        $fileOnlyName = $prefix . '_' . Str::uuid() . '.' . $type;
        $fullPath = 'signatures/' . $fileOnlyName;

        if (!Storage::disk('public')->put($fullPath, $data)) {
             throw new \RuntimeException("Gagal menyimpan file tanda tangan ke disk: {$fullPath}");
        }
        
        return $fileOnlyName;
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