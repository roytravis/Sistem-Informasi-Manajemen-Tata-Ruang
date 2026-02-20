<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kasus;
use App\Models\Survei;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SurveiController extends Controller
{
    /**
     * Menyimpan data survei baru untuk sebuah kasus.
     * Disesuaikan sepenuhnya dengan Formulir Pemeriksaan dan Pengukuran dari Juknis (Lampiran V).
     */
    public function store(Request $request, Kasus $kasus)
    {
        // Validasi data input sesuai dengan struktur formulir di Juknis
        $validatedData = $request->validate([
            // Data Pemeriksaan
            'data_pemeriksaan.luas_tanah_dikuasai' => 'required|numeric',
            'data_pemeriksaan.jenis_kegiatan' => 'required|string',
            'data_pemeriksaan.indikasi_program' => 'nullable|string',
            'data_pemeriksaan.persyaratan_pelaksanaan' => 'nullable|string',
            'data_pemeriksaan.jaringan_utilitas' => 'nullable|string',

            // Data Pengukuran Intensitas
            'data_pengukuran.kdb' => 'nullable|numeric',
            'data_pengukuran.klb' => 'nullable|numeric',
            'data_pengukuran.kdh' => 'nullable|numeric',
            'data_pengukuran.ktb' => 'nullable|numeric',

            // Data Ketentuan Tata Bangunan
            'data_tata_bangunan.tinggi_bangunan' => 'nullable|numeric',
            'data_tata_bangunan.jumlah_lantai' => 'nullable|integer',
            'data_tata_bangunan.gsb' => 'nullable|numeric',
            'data_tata_bangunan.jbb' => 'nullable|numeric',

            // Data Lokasi & Dokumentasi
            'lokasi_lat' => 'required|numeric',
            'lokasi_lng' => 'required|numeric',
            'foto' => 'required|image|mimes:jpeg,png,jpg|max:2048',

            // Tanda Tangan
            'tanda_tangan_petugas' => 'required|string',
            'tanda_tangan_pemegang' => 'required|string',
        ]);

        // Proses Tanda Tangan (simpan sebagai file gambar dari data base64)
        $tandaTanganPetugasPath = $this->saveSignature($validatedData['tanda_tangan_petugas'], 'ttd_petugas');
        $tandaTanganPemegangPath = $this->saveSignature($validatedData['tanda_tangan_pemegang'], 'ttd_pemegang');

        // Proses Upload Foto
        $fotoPath = $request->file('foto')->store('survei_fotos', 'public');

        // Membuat record survei baru dengan data_formulir yang terstruktur
        $survei = $kasus->surveis()->create([
            'petugas_id' => Auth::id(),
            'tanggal_survey' => now(),
            'lokasi_lat' => $validatedData['lokasi_lat'],
            'lokasi_lng' => $validatedData['lokasi_lng'],
            'data_formulir' => [
                'pemeriksaan' => $validatedData['data_pemeriksaan'],
                'pengukuran' => $validatedData['data_pengukuran'],
                'tata_bangunan' => $validatedData['data_tata_bangunan'],
            ],
            'foto_path' => $fotoPath, // Menyimpan path foto ke kolom yang benar
            'tanda_tangan_petugas' => $tandaTanganPetugasPath,
            'tanda_tangan_pemegang' => $tandaTanganPemegangPath,
        ]);

        // Setelah survei berhasil disimpan, status kasus diubah menjadi "Survei Selesai"
        $kasus->update(['status' => 'Survei Selesai']);

        return response()->json($survei, 201);
    }

    /**
     * Menyimpan gambar tanda tangan dari string base64 ke storage.
     */
    private function saveSignature($base64Image, $prefix)
    {
        // Mengekstrak data gambar dari format base64
        if (preg_match('/^data:image\/(\w+);base64,/', $base64Image, $type)) {
            $data = substr($base64Image, strpos($base64Image, ',') + 1);
            $type = strtolower($type[1]); // jpg, png, gif

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
