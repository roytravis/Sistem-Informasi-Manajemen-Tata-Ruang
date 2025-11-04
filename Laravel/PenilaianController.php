<?php

// 1. Perbaikan Namespace
namespace App\Http\Controllers\Api;

// Tambahkan use DB dan use Log
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log; // Ditambahkan untuk logging
use App\Http\Controllers\Controller;
use App\Models\Kasus; // Pastikan ini diimport
use App\Models\Penilaian; // Pastikan ini diimport
use App\Models\PermohonanPenilaian; // Pastikan ini diimport
use Illuminate\Http\Request; // Pastikan ini diimport
use Illuminate\Validation\Rule; // Pastikan ini diimport
use Illuminate\Support\Facades\Storage; // Pastikan ini diimport
use Illuminate\Support\Str;
// --- TAMBAHKAN IMPORTS BARU ---
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\File;
// --- AKHIR IMPORTS ---

class PenilaianController extends Controller
{
    /**
     * Menampilkan daftar semua kasus yang berjenis PMP UMK untuk dinilai.
     */
    public function indexPmpUmk(Request $request)
    {
        $query = Kasus::with('pemegang')
                      ->where('jenis', 'PMP_UMK')
                      ->latest();
        $pmpUmkList = $query->paginate(15);
        return response()->json($pmpUmkList);
    }

    /**
     * Menampilkan detail satu kasus PMP UMK untuk dinilai.
     */
    public function showPmpUmk(Kasus $kasus)
    {
        if ($kasus->jenis !== 'PMP_UMK') {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        // Memastikan relasi 'penanggung_jawab' dimuat bersama relasi lainnya
        return response()->json($kasus->load([
            'pemegang',
            'penilaian',
            'tim.users',
            'penanggung_jawab' // Relasi koordinator
        ]));
    }

    /**
     * Menjembatani data dari 'PermohonanPenilaian' ke 'Kasus'.
     */
    public function initiatePenilaian(PermohonanPenilaian $permohonanPenilaian)
    {
        // Menggunakan updateOrCreate untuk memastikan jika kasus sudah ada, datanya diperbarui.
        $kasus = Kasus::updateOrCreate(
            ['nomor_permohonan' => $permohonanPenilaian->nomor_permohonan],
            [
                'jenis' => 'PMP_UMK',
                'pemegang_id' => $permohonanPenilaian->pemegang_id,
                'tim_id' => $permohonanPenilaian->tim_id,
                'penanggung_jawab_id' => $permohonanPenilaian->penanggung_jawab_id,
                'prioritas_score' => $permohonanPenilaian->prioritas_score,
                // Status kasus akan mengikuti status permohonan saat dibuat/diupdate
                'status' => $permohonanPenilaian->status,
            ]
        );
         // Jika permohonan statusnya 'Baru', update jadi 'Menunggu Penilaian'
        if ($permohonanPenilaian->status == 'Baru') {
            $permohonanPenilaian->update(['status' => 'Menunggu Penilaian']);
            // Update juga status kasus yang baru dibuat/diupdate
            $kasus->update(['status' => 'Menunggu Penilaian']);
        }

        return response()->json(['kasus_id' => $kasus->id]);
    }

    /**
     * Menyimpan hasil penilaian untuk sebuah kasus PMP UMK.
     */
    public function storePenilaian(Request $request, Kasus $kasus)
    {
        // --- TAMBAHKAN LOGGING DI SINI ---
        Log::info('Received data for storePenilaian for Kasus ID: ' . $kasus->id, $request->except('tanda_tangan_tim'));
        // --- AKHIR PENAMBAHAN LOGGING ---

        // Pastikan validasi dan logika penyimpanan ada di sini
        $isDeskStudyTidakSesuai = false;
        $deskStudies = $request->input('desk_study', []);
        foreach ($deskStudies as $deskStudy) {
            if (isset($deskStudy['hasil_kesesuaian']) && $deskStudy['hasil_kesesuaian'] === 'Tidak Sesuai') {
                $isDeskStudyTidakSesuai = true;
                break;
            }
        }

        // Definisikan aturan validasi dasar
        $rules = [
            'desk_study' => 'required|array|min:1',
            'desk_study.*.pernyataan_mandiri_lokasi' => 'required|string',
            'desk_study.*.pernyataan_mandiri_jenis' => 'required|string',
            'desk_study.*.ketentuan_rtr_jenis' => 'required|string',
            'desk_study.*.ketentuan_rtr_arahan' => 'required|string',
            'desk_study.*.hasil_kesesuaian' => 'required|string|in:Sesuai,Tidak Sesuai',
            'pengukuran' => 'nullable|array',
            'pengukuran.*.hasil_pengukuran' => 'nullable|numeric',
            // --- PERBAIKAN VALIDASI KETERANGAN (CASE INSENSITIVE) ---
            // Terima "Tidak Sesuai" dan "Tidak sesuai"
            'pengukuran.*.keterangan' => ['nullable', 'string', Rule::in([
                "",
                "Sesuai",
                "Tidak Sesuai", // Terima S besar
                "Tidak sesuai", // Terima s kecil
                "Tidak Ada Ketentuan",
                "Belum Dapat Dinilai",
                "penilaian tidak dapat dilanjutkan"
            ])],
            // --- AKHIR PERBAIKAN ---
            'catatan' => 'nullable|string',
            'tanda_tangan_tim' => 'nullable|array',
            'tanda_tangan_tim.*.user_id' => 'required|exists:users,id',
            'tanda_tangan_tim.*.signature' => 'required|string',
        ];

        // Validasi kondisional untuk 'pemeriksaan'
        if (!$isDeskStudyTidakSesuai) {
            $rules['pemeriksaan'] = 'required|array';
            $rules['pemeriksaan.*.pernyataan_mandiri'] = 'required|string';
            $rules['pemeriksaan.*.hasil_pemeriksaan'] = 'required|string|in:Sesuai,Tidak Sesuai';
        } else {
            $rules['pemeriksaan'] = 'nullable|array';
            // Jika tidak sesuai, pemeriksaan dan pengukuran tidak wajib diisi datanya tapi array-nya boleh ada
            $rules['pemeriksaan.*.pernyataan_mandiri'] = 'nullable|string';
            $rules['pemeriksaan.*.hasil_pemeriksaan'] = 'nullable|string|in:Sesuai,Tidak Sesuai';
        }


        $validatedData = $request->validate($rules);

        // --- PERBAIKAN: Inisialisasi payload hanya dengan data formulir ---
        $payload = [
            'desk_study' => $validatedData['desk_study'],
            'pemeriksaan' => $validatedData['pemeriksaan'] ?? null,
            'pengukuran' => $validatedData['pengukuran'] ?? null,
            'catatan' => $validatedData['catatan'] ?? null,
        ];
        // --- AKHIR PERBAIKAN ---

        // 4. Bungkus dalam Transaksi Database
        try {
            DB::beginTransaction();

            // Proses penyimpanan tanda tangan tim
            $tandaTanganPaths = [];
            if (!empty($validatedData['tanda_tangan_tim'])) {
                foreach ($validatedData['tanda_tangan_tim'] as $tandaTangan) {
                    $path = $this->saveSignature($tandaTangan['signature'], 'ttd_penilai_' . $tandaTangan['user_id']);
                    $tandaTanganPaths[] = [
                        'user_id' => $tandaTangan['user_id'],
                        'signature_path' => $path
                    ];
                }
            }

            $existingPenilaian = Penilaian::where('kasus_id', $kasus->id)->first();
            // 2. Null Check (gunakan operator nullsafe)
            $existingSignatures = $existingPenilaian?->tanda_tangan_tim ?? [];

            $existingSigMap = collect($existingSignatures)->keyBy('user_id');

            foreach ($tandaTanganPaths as $newSig) {
                // Update atau tambahkan tanda tangan baru
                $existingSigMap[$newSig['user_id']] = $newSig;
            }

            // --- PERBAIKAN: Tambahkan tanda_tangan_tim ke payload SETELAH di-merge ---
            $payload['tanda_tangan_tim'] = $existingSigMap->values()->all();
            // --- AKHIR PERBAIKAN ---

            // --- TAMBAHKAN LOGGING PAYLOAD ---
            Log::info("Final payload being saved to DB for Kasus ID {$kasus->id}: ", $payload);
            // --- AKHIR LOGGING PAYLOAD ---

            $penilaian = Penilaian::updateOrCreate(
                ['kasus_id' => $kasus->id],
                $payload
            );

            // --- PERBAIKAN LOGIKA STATUS ---
            // 6. Status Guard: Hanya update jika status belum final
            // Definisikan status final agar mudah dikelola
            $finalStatuses = [
                'Menunggu Verifikasi',
                'Penilaian Selesai - Patuh',
                'Penilaian Selesai - Tidak Patuh',
                'Proses Keberatan',
                'Selesai',
                'Penilaian Tidak Terlaksana' // Tambahkan ini jika relevan
            ];

            // Update status kasus jika belum final
            if (!in_array($kasus->status, $finalStatuses)) {
                $kasus->update(['status' => 'Menunggu Verifikasi']);
            }

            // Update status permohonan jika belum final
            $permohonan = PermohonanPenilaian::where('nomor_permohonan', $kasus->nomor_permohonan)->first();
            if ($permohonan && !in_array($permohonan->status, $finalStatuses)) {
                $permohonan->update(['status' => 'Menunggu Verifikasi']);
            }
            // --- AKHIR PERBAIKAN ---

            DB::commit(); // Commit transaksi jika semua berhasil

            return response()->json($penilaian, 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            // Tangani error validasi secara spesifik jika perlu
            DB::rollBack();
            // Kembalikan pesan error validasi yang lebih jelas
            Log::warning("Validation failed during assessment save for Kasus ID {$kasus->id}: " . json_encode($e->errors()));
            return response()->json(['message' => 'Data yang dikirim tidak valid. Periksa kembali isian formulir.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollBack(); // Rollback jika ada error
            Log::error("Error saving assessment for Kasus ID {$kasus->id}: " . $e->getMessage()); // Log error dengan detail
            return response()->json(['message' => 'Gagal menyimpan penilaian. Terjadi kesalahan internal.'], 500);
        }
    }

    /**
     * Menyimpan Draft Penilaian.
     */
    public function saveDraft(Request $request, Kasus $kasus)
    {
        // --- TAMBAHKAN LOGGING DI SINI ---
        Log::info('Received data for saveDraft for Kasus ID: ' . $kasus->id, $request->except('tanda_tangan_tim'));
        // --- AKHIR PENAMBAHAN LOGGING ---

        // --- PERBAIKAN: Validasi disamakan dengan storePenilaian tapi dibuat nullable ---
        $validatedData = $request->validate([
            'desk_study' => 'nullable|array',
            'desk_study.*.pernyataan_mandiri_lokasi' => 'nullable|string',
            'desk_study.*.pernyataan_mandiri_jenis' => 'nullable|string',
            'desk_study.*.ketentuan_rtr_jenis' => 'nullable|string',
            'desk_study.*.ketentuan_rtr_arahan' => 'nullable|string',
            'desk_study.*.hasil_kesesuaian' => 'nullable|string|in:Sesuai,Tidak Sesuai',
            'catatan' => 'nullable|string',
            'pemeriksaan' => 'nullable|array',
            'pengukuran' => 'nullable|array',
            // Tambahkan validasi untuk tanda tangan (nullable)
            'tanda_tangan_tim' => 'nullable|array',
            'tanda_tangan_tim.*.user_id' => 'required_with:tanda_tangan_tim|exists:users,id',
            'tanda_tangan_tim.*.signature' => 'required_with:tanda_tangan_tim|string',
        ]);
        // --- AKHIR PERBAIKAN VALIDASI ---

        // --- PERBAIKAN: Payload menyertakan semua field ---
        $payload = [
            'desk_study' => $validatedData['desk_study'] ?? null,
            'catatan' => $validatedData['catatan'] ?? null,
            'pemeriksaan' => $validatedData['pemeriksaan'] ?? null,
            'pengukuran' => $validatedData['pengukuran'] ?? null,
        ];
        // --- AKHIR PERBAIKAN PAYLOAD ---

        try {
            DB::beginTransaction();

            // --- PERBAIKAN: Tambahkan logika penyimpanan tanda tangan (sama seperti storePenilaian) ---
            $tandaTanganPaths = [];
            if (!empty($validatedData['tanda_tangan_tim'])) {
                foreach ($validatedData['tanda_tangan_tim'] as $tandaTangan) {
                    // Hanya proses jika ada data signature (frontend mungkin kirim array kosong)
                    if (!empty($tandaTangan['signature'])) {
                        $path = $this->saveSignature($tandaTangan['signature'], 'ttd_penilai_' . $tandaTangan['user_id']);
                        $tandaTanganPaths[] = [
                            'user_id' => $tandaTangan['user_id'],
                            'signature_path' => $path
                        ];
                    }
                }
            }

            $existingPenilaian = Penilaian::where('kasus_id', $kasus->id)->first();
            $existingSignatures = $existingPenilaian?->tanda_tangan_tim ?? [];
            $existingSigMap = collect($existingSignatures)->keyBy('user_id');

            foreach ($tandaTanganPaths as $newSig) {
                // Update atau tambahkan tanda tangan baru
                $existingSigMap[$newSig['user_id']] = $newSig;
            }

            // Hanya tambahkan ke payload jika ada data signature baru atau lama
            if ($existingSigMap->isNotEmpty()) {
                $payload['tanda_tangan_tim'] = $existingSigMap->values()->all();
            } else if (empty($validatedData['tanda_tangan_tim'])) {
                // Jika frontend mengirim array kosong (misal, setelah clear),
                // kita biarkan $payload['tanda_tangan_tim'] tidak diset,
                // sehingga updateOrCreate tidak akan menimpanya.
                // Jika kita ingin *menghapus* ttd, kita harus set $payload['tanda_tangan_tim'] = [];
                // Untuk draft, lebih aman untuk *tidak* menghapus, hanya menambah/update.
            }
            // --- AKHIR PERBAIKAN TANDA TANGAN ---

            // --- TAMBAHKAN LOGGING PAYLOAD ---
            Log::info("Final payload being saved to DB for Kasus ID {$kasus->id}: ", $payload);
            // --- AKHIR LOGGING PAYLOAD ---

            // 3. Simpan atau perbarui data Penilaian
            $penilaian = Penilaian::updateOrCreate(
                ['kasus_id' => $kasus->id],
                $payload
            );

            // 4. Update status PermohonanPenilaian terkait menjadi 'Draft' HANYA JIKA BELUM FINAL
            $permohonan = PermohonanPenilaian::where('nomor_permohonan', $kasus->nomor_permohonan)->first();
             $finalStatuses = [
                'Menunggu Verifikasi',
                'Penilaian Selesai - Patuh',
                'Penilaian Selesai - Tidak Patuh',
                'Proses Keberatan',
                'Selesai',
                'Penilaian Tidak Terlaksana'
            ];
            if ($permohonan && !in_array($permohonan->status, $finalStatuses)) {
                $permohonan->update(['status' => 'Draft']);
                // Update juga status kasus jika belum final
                 if (!in_array($kasus->status, $finalStatuses)) {
                    $kasus->update(['status' => 'Draft']);
                }
            }


            DB::commit();

            return response()->json($penilaian, 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error saving draft for Kasus ID {$kasus->id}: " . $e->getMessage());
            return response()->json(['message' => 'Gagal menyimpan draft. Terjadi kesalahan internal.'], 500);
        }
    }


    /**
     * Fungsi helper untuk menyimpan tanda tangan base64
     */
    private function saveSignature($base64Image, $prefix)
    {
        if (preg_match('/^data:image\/(\w+);base64,/', $base64Image, $type)) {
            $data = substr($base64Image, strpos($base64Image, ',') + 1);
            $type = strtolower($type[1]);

            if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png'])) {
                // Sebaiknya throw exception agar bisa ditangkap di try-catch utama
                throw new \InvalidArgumentException('Tipe gambar tidak valid.');
            }
            $data = base64_decode($data);

            if ($data === false) {
                throw new \RuntimeException('Gagal melakukan decode base64.');
            }
        } else {
            throw new \InvalidArgumentException('Format data URI gambar tidak sesuai.');
        }

        $fileName = 'signatures/' . $prefix . '_' . Str::uuid() . '.' . $type;
        // Gunakan try-catch untuk penanganan error I/O
        try {
            if (!Storage::disk('public')->put($fileName, $data)) {
                 throw new \RuntimeException("Gagal menyimpan file tanda tangan ke disk: {$fileName}");
            }
            // --- TAMBAHKAN LOGGING SUKSES ---
            Log::info("Successfully saved signature file to: {$fileName}");
            // --- AKHIR LOGGING ---
        } catch (\Exception $e) {
             Log::error("Error saving signature file {$fileName}: " . $e->getMessage());
             throw $e; // Re-throw exception agar transaksi di rollback
        }
        return $fileName; // Kembalikan path relatif
    }

    // --- FUNGSI BARU UNTUK MENGAMBIL GAMBAR ---
    /**
     * Mengambil file gambar tanda tangan dari storage.
     */
    public function getSignatureImage($filename)
    {
        $path = 'signatures/' . $filename;
        // Dapatkan path fisik lengkap ke file di dalam storage/app/public
        $storagePath = Storage::disk('public')->path($path);

        // Gunakan File::exists untuk mengecek path fisik
        if (!File::exists($storagePath)) {
            Log::warning("Signature file not found at path: {$storagePath}");
            return response()->json(['message' => 'File tidak ditemukan.'], 404);
        }

        Log::info("Serving signature file from path: {$storagePath}");

        // response()->file() secara otomatis menangani header Content-Type dan Content-Length
        return response()->file($storagePath);
    }
    // --- AKHIR FUNGSI BARU ---
}

