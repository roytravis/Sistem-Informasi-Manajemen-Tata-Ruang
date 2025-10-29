<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller; // Pastikan ini ada
use App\Models\Kasus;
use App\Models\Penilaian;
use App\Models\PermohonanPenilaian;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PenilaianController extends Controller // Pastikan extends Controller
{
    /**
     * Menampilkan daftar semua kasus yang berjenis PMP UMK untuk dinilai.
     * (Method ini sepertinya tidak ada di versi sebelumnya, ditambahkan jika perlu)
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
     * (Method ini sepertinya tidak ada di versi sebelumnya, ditambahkan jika perlu)
     */
    public function initiatePenilaian(PermohonanPenilaian $permohonanPenilaian)
    {
        // Menggunakan updateOrCreate untuk memastikan jika kasus sudah ada, datanya diperbarui.
        $kasus = Kasus::updateOrCreate(
            ['nomor_permohonan' => $permohonanPenilaian->nomor_permohonan],
            [
                'jenis' => 'PMP_UMK',
                // JANGAN ubah status permohonan di sini, biarkan apa adanya (bisa jadi 'Draft')
                // 'status' => 'Menunggu Penilaian', // Baris ini sebaiknya disesuaikan
                'pemegang_id' => $permohonanPenilaian->pemegang_id,
                'tim_id' => $permohonanPenilaian->tim_id,
                'penanggung_jawab_id' => $permohonanPenilaian->penanggung_jawab_id,
                'prioritas_score' => $permohonanPenilaian->prioritas_score,
            ]
        );
         // Jika permohonan statusnya 'Baru', update jadi 'Menunggu Penilaian'
        if ($permohonanPenilaian->status == 'Baru') {
            $permohonanPenilaian->update(['status' => 'Menunggu Penilaian']);
        }

        return response()->json(['kasus_id' => $kasus->id]);
    }

    /**
     * Menyimpan hasil penilaian untuk sebuah kasus PMP UMK.
     * (Kode lengkap method ini ada di versi sebelumnya, pastikan isinya benar)
     */
    public function storePenilaian(Request $request, Kasus $kasus)
    {
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
            'pengukuran.*.keterangan' => ['nullable', 'string', Rule::in(["Sesuai", "Tidak sesuai", "Tidak Ada Ketentuan", "Belum Dapat Dinilai", "penilaian tidak dapat dilanjutkan"])],
            'catatan' => 'nullable|string',
            // Validasi untuk tanda tangan tim
            'tanda_tangan_tim' => 'nullable|array',
            'tanda_tangan_tim.*.user_id' => 'required|exists:users,id',
            'tanda_tangan_tim.*.signature' => 'required|string',
        ];

        if (!$isDeskStudyTidakSesuai) {
            $rules['pemeriksaan'] = 'required|array';
            $rules['pemeriksaan.*.pernyataan_mandiri'] = 'required|string';
            $rules['pemeriksaan.*.hasil_pemeriksaan'] = 'required|string|in:Sesuai,Tidak Sesuai';
        } else {
            $rules['pemeriksaan'] = 'nullable|array';
        }

        $validatedData = $request->validate($rules);
        
        $payload = [
            'desk_study' => $validatedData['desk_study'],
            'pemeriksaan' => $validatedData['pemeriksaan'] ?? null,
            'pengukuran' => $validatedData['pengukuran'] ?? null,
            'catatan' => $validatedData['catatan'] ?? null,
        ];

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
        $existingSignatures = $existingPenilaian->tanda_tangan_tim ?? [];
        
        $existingSigMap = collect($existingSignatures)->keyBy('user_id');
        
        foreach($tandaTanganPaths as $newSig) {
            $existingSigMap[$newSig['user_id']] = $newSig;
        }

        $payload['tanda_tangan_tim'] = $existingSigMap->values()->all();

        $penilaian = Penilaian::updateOrCreate(
            ['kasus_id' => $kasus->id],
            $payload
        );
        
        // --- PERUBAHAN ---
        // 1. Update status kasus (existing)
        $kasus->update(['status' => 'Menunggu Verifikasi']);
        
        // 2. Update status permohonan terkait (NEW)
        $permohonan = PermohonanPenilaian::where('nomor_permohonan', $kasus->nomor_permohonan)->first();
        if ($permohonan) {
            $permohonan->update(['status' => 'Menunggu Penilaian']);
        }
        // --- AKHIR PERUBAHAN ---

        return response()->json($penilaian, 201);
    }

    /**
     * --- FITUR BARU: Menyimpan Draft Penilaian ---
     */
    public function saveDraft(Request $request, Kasus $kasus)
    {
        // 1. Validasi data draft (hanya desk_study dan catatan)
        $validatedData = $request->validate([
            'desk_study' => 'nullable|array',
            'desk_study.*.pernyataan_mandiri_lokasi' => 'nullable|string',
            'desk_study.*.pernyataan_mandiri_jenis' => 'nullable|string',
            'desk_study.*.ketentuan_rtr_jenis' => 'nullable|string',
            'desk_study.*.ketentuan_rtr_arahan' => 'nullable|string',
            'desk_study.*.hasil_kesesuaian' => 'nullable|string|in:Sesuai,Tidak Sesuai',
            'catatan' => 'nullable|string',
        ]);

        // 2. Siapkan data untuk disimpan
        $payload = [
            'desk_study' => $validatedData['desk_study'] ?? null,
            'catatan' => $validatedData['catatan'] ?? null,
            // Biarkan 'pemeriksaan' dan 'pengukuran' apa adanya (jangan null)
        ];

        // 3. Simpan atau perbarui data Penilaian (parsial)
        $penilaian = Penilaian::updateOrCreate(
            ['kasus_id' => $kasus->id],
            $payload
        );

        // 4. Update status PermohonanPenilaian terkait menjadi 'Draft'
        $permohonan = PermohonanPenilaian::where('nomor_permohonan', $kasus->nomor_permohonan)->first();
        if ($permohonan) {
            $permohonan->update(['status' => 'Draft']);
        }

        return response()->json($penilaian, 200);
    }
    // --- AKHIR FITUR BARU ---


    /**
     * Fungsi helper untuk menyimpan tanda tangan base64
     */
    private function saveSignature($base64Image, $prefix)
    {
        if (preg_match('/^data:image\/(\w+);base64,/', $base64Image, $type)) {
            $data = substr($base64Image, strpos($base64Image, ',') + 1);
            $type = strtolower($type[1]);

            if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png'])) {
                throw new \Exception('invalid image type');
            }
            $data = base64_decode($data);

            if ($data === false) {
                throw new \Exception('base64_decode failed');
            }
        } else {
            throw new \Exception('did not match data URI with image data');
        }

        $fileName = 'signatures/' . $prefix . '_' . Str::uuid() . '.' . $type;
        // Pastikan disk 'public' terkonfigurasi dengan benar di config/filesystems.php
        Storage::disk('public')->put($fileName, $data); 
        return $fileName; // Kembalikan path relatif
    }
}
