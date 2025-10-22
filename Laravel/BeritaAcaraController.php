<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BeritaAcara;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage; // Ditambahkan
use Illuminate\Support\Str; // Ditambahkan

class BeritaAcaraController extends Controller
{
    /**
     * Menyimpan Berita Acara baru.
     */
    public function store(Request $request)
    {
        // --- PERUBAHAN: Validasi disesuaikan untuk menerima tanda tangan ---
        $validatedData = $request->validate([
            'nomor_ba' => 'required|string|max:255|unique:berita_acaras,nomor_ba',
            'pemegang_id' => 'required|exists:pemegangs,id',
            'koordinator_id' => 'required|exists:users,id',
            'alasan' => 'required|string|in:Tidak dapat dihubungi,Lokasi tidak ditemukan,Lainnya',
            'keterangan_lainnya' => 'nullable|string|required_if:alasan,Lainnya',
            'tanggal_ba' => 'required|date',
            // Validasi untuk data tanda tangan digital
            'tanda_tangan_tim' => 'required|array|min:1',
            'tanda_tangan_tim.*.user_id' => 'required|exists:users,id',
            'tanda_tangan_tim.*.signature' => 'required|string',
        ]);

        try {
            DB::beginTransaction();
            
            // --- PERUBAHAN: Proses penyimpanan tanda tangan ---
            $tandaTanganPaths = [];
            foreach ($validatedData['tanda_tangan_tim'] as $tandaTangan) {
                $path = $this->saveSignature($tandaTangan['signature'], 'ttd_ba_' . $tandaTangan['user_id']);
                $tandaTanganPaths[] = [
                    'user_id' => $tandaTangan['user_id'],
                    'signature_path' => $path
                ];
            }

            $beritaAcara = BeritaAcara::create([
                'nomor_ba' => $validatedData['nomor_ba'],
                'pemegang_id' => $validatedData['pemegang_id'],
                'koordinator_id' => $validatedData['koordinator_id'],
                'alasan' => $validatedData['alasan'],
                'keterangan_lainnya' => $validatedData['keterangan_lainnya'],
                'tanggal_ba' => $validatedData['tanggal_ba'],
                'tanda_tangan_tim' => $tandaTanganPaths, // Simpan path tanda tangan
            ]);
            
            // Ekstrak user_id dari data tanda tangan untuk dilampirkan ke relasi
            $timPenilaiIds = array_column($validatedData['tanda_tangan_tim'], 'user_id');
            $beritaAcara->timPenilai()->attach($timPenilaiIds);

            DB::commit();

            return response()->json($beritaAcara->load('pemegang', 'koordinator', 'timPenilai'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal menyimpan berita acara: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Menampilkan detail Berita Acara untuk preview.
     */
    public function show(BeritaAcara $beritaAcara)
    {
        // Muat semua relasi yang dibutuhkan untuk preview
        return response()->json($beritaAcara->load('pemegang', 'koordinator', 'timPenilai'));
    }

    /**
     * --- PENAMBAHAN: Fungsi untuk menyimpan gambar tanda tangan ---
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
