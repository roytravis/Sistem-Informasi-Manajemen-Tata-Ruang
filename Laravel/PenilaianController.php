<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kasus;
use App\Models\Penilaian;
use App\Models\PermohonanPenilaian;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
        
        // PENJELASAN: Tidak ada perubahan kode fungsional di sini.
        // Relasi 'tim.users' secara default sudah memuat semua kolom dari tabel users,
        // termasuk kolom 'nip'. Data NIP/NIK sudah otomatis tersedia di response API.
        return response()->json($kasus->load(['pemegang', 'penilaian', 'tim.users']));
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
                'status' => 'Menunggu Penilaian',
                'pemegang_id' => $permohonanPenilaian->pemegang_id,
                'tim_id' => $permohonanPenilaian->tim_id,
                'penanggung_jawab_id' => $permohonanPenilaian->penanggung_jawab_id,
                'prioritas_score' => $permohonanPenilaian->prioritas_score,
            ]
        );
        return response()->json(['kasus_id' => $kasus->id]);
    }

    /**
     * Menyimpan hasil penilaian untuk sebuah kasus PMP UMK.
     */
    public function storePenilaian(Request $request, Kasus $kasus)
    {
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
            // PERUBAHAN: Menambahkan 'Tidak sesuai' ke dalam aturan validasi.
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
                // Gunakan user_id untuk nama file yang unik
                $path = $this->saveSignature($tandaTangan['signature'], 'ttd_penilai_' . $tandaTangan['user_id']);
                $tandaTanganPaths[] = [
                    'user_id' => $tandaTangan['user_id'],
                    'signature_path' => $path
                ];
            }
        }
        
        // Menggabungkan tanda tangan baru dengan yang sudah ada (jika ada)
        $existingPenilaian = Penilaian::where('kasus_id', $kasus->id)->first();
        $existingSignatures = $existingPenilaian->tanda_tangan_tim ?? [];
        
        // Buat map dari tanda tangan yang ada untuk kemudahan pencarian
        $existingSigMap = collect($existingSignatures)->keyBy('user_id');
        
        // Gabungkan tanda tangan baru ke dalam map, menimpa yang lama jika ada
        foreach($tandaTanganPaths as $newSig) {
            $existingSigMap[$newSig['user_id']] = $newSig;
        }

        $payload['tanda_tangan_tim'] = $existingSigMap->values()->all();

        $penilaian = Penilaian::updateOrCreate(
            ['kasus_id' => $kasus->id],
            $payload
        );
        
        $kasus->update(['status' => 'Menunggu Verifikasi']);

        return response()->json($penilaian, 201);
    }

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
        Storage::disk('public')->put($fileName, $data);
        return $fileName;
    }
}

