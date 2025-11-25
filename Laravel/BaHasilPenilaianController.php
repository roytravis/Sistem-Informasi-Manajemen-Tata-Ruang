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

class BaHasilPenilaianController extends Controller
{
    /**
     * Menampilkan data untuk Form Input atau Preview.
     */
    public function show($penilaianId)
    {
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
}