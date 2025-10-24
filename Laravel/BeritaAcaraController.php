<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BeritaAcara;
use App\Models\PermohonanPenilaian; // Ditambahkan
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BeritaAcaraController extends Controller
{
    /**
     * Menyimpan Berita Acara baru.
     */
    public function store(Request $request)
    {
        // --- PERUBAHAN: Validasi disesuaikan ---
        $validatedData = $request->validate([
            'nomor_ba' => 'required|string|max:255|unique:berita_acaras,nomor_ba',
            'pemegang_id' => 'required|exists:pemegangs,id',
            'tim_id' => 'required|exists:tims,id', // Ditambahkan
            'koordinator_id' => 'nullable|exists:users,id', // Diubah menjadi nullable
            'alasan' => 'required|string|in:Tidak dapat dihubungi,Lokasi tidak ditemukan,Lainnya',
            'keterangan_lainnya' => 'nullable|string|required_if:alasan,Lainnya',
            'tanggal_ba' => 'required|date',
            'tanda_tangan_tim' => 'required|array|min:1',
            'tanda_tangan_tim.*.user_id' => 'required|exists:users,id',
            'tanda_tangan_tim.*.signature' => 'required|string',
        ]);

        try {
            DB::beginTransaction();
            
            // 1. Proses penyimpanan tanda tangan
            $tandaTanganPaths = [];
            foreach ($validatedData['tanda_tangan_tim'] as $tandaTangan) {
                $path = $this->saveSignature($tandaTangan['signature'], 'ttd_ba_' . $tandaTangan['user_id']);
                $tandaTanganPaths[] = [
                    'user_id' => $tandaTangan['user_id'],
                    'signature_path' => $path
                ];
            }

            // 2. Buat Berita Acara (BA)
            $beritaAcara = BeritaAcara::create([
                'nomor_ba' => $validatedData['nomor_ba'],
                'pemegang_id' => $validatedData['pemegang_id'],
                'koordinator_id' => $validatedData['koordinator_id'],
                'alasan' => $validatedData['alasan'],
                'keterangan_lainnya' => $validatedData['keterangan_lainnya'],
                'tanggal_ba' => $validatedData['tanggal_ba'],
                'tanda_tangan_tim' => $tandaTanganPaths,
            ]);
            
            $timPenilaiIds = array_column($validatedData['tanda_tangan_tim'], 'user_id');
            $beritaAcara->timPenilai()->attach($timPenilaiIds);

            // 3. (REQUIREMENT BARU) Buat PermohonanPenilaian terkait
            // Buat nomor permohonan unik berdasarkan nomor BA
            $nomorPermohonan = 'PMP-' . $validatedData['nomor_ba'];

            PermohonanPenilaian::create([
                'nomor_permohonan' => $nomorPermohonan,
                'status' => 'Penilaian Tidak Terlaksana', // Status sesuai permintaan
                'pemegang_id' => $validatedData['pemegang_id'],
                'tim_id' => $validatedData['tim_id'],
                'penanggung_jawab_id' => $validatedData['koordinator_id'],
                'berita_acara_id' => $beritaAcara->id, // Tautkan BA yang baru dibuat
                'prioritas_score' => 0, // Default score
            ]);

            DB::commit();

            return response()->json($beritaAcara->load('pemegang', 'koordinator', 'timPenilai'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            // Berikan pesan error yang lebih spesifik jika memungkinkan
            if (str_contains($e->getMessage(), 'Duplicate entry')) {
                 return response()->json(['message' => 'Gagal menyimpan: Nomor Berita Acara atau Nomor Permohonan sudah ada.'], 409);
            }
            return response()->json(['message' => 'Gagal menyimpan berita acara: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Menampilkan detail Berita Acara untuk preview.
     */
    public function show(BeritaAcara $beritaAcara)
    {
        // Muat semua relasi yang dibutuhkan untuk preview
        // PERBAIKAN: timPenilai sekarang memuat 'jabatan' dari tabel user
        // dan 'tim_penilai' (data anggota) dari relasi BA
        $beritaAcara->load(['pemegang', 'koordinator', 'timPenilai' => function($query) {
            // Kita perlu mengambil data user (nama, nip) dan juga 'jabatan' dari tabel user
            // 'tim_penilai' akan berisi data anggota tim yang tanda tangan di BA
        }]);

        // Cek relasi timPenilai
        $timPenilai = $beritaAcara->timPenilai;
        $koordinator = $beritaAcara->koordinator;

        // Kita perlu menggabungkan data tim penilai dari relasi dan koordinator
        // Ini untuk memastikan data di preview lengkap
        $allMembers = $timPenilai->map(function ($user) {
            return [
                'id' => $user->id,
                'nama' => $user->nama,
                'nip' => $user->nip,
                'jabatan' => $user->jabatan, // Ambil jabatan dari tabel users
                'role' => $user->role,
            ];
        });

        // Jika koordinator ada dan belum ada di list, tambahkan
        if ($koordinator && !$allMembers->contains('id', $koordinator->id)) {
             $allMembers->push([
                'id' => $koordinator->id,
                'nama' => $koordinator->nama,
                'nip' => $koordinator->nip,
                'jabatan' => $koordinator->jabatan,
                'role' => $koordinator->role,
             ]);
        }
        
        // Ganti data relasi 'tim_penilai' dengan data yang sudah digabung
        $beritaAcara->tim_penilai = $allMembers;
        unset($beritaAcara->timPenilai); // Hapus relasi asli agar tidak duplikat
        
        return response()->json($beritaAcara);
    }

    /**
     * Fungsi untuk menyimpan gambar tanda tangan.
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
        Storage::disk('public')->put($fileName, $data);
        return $fileName;
    }
}
