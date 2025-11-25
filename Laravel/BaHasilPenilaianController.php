<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BaHasilPenilaian;
use App\Models\Penilaian;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BaHasilPenilaianController extends Controller
{
    /**
     * Menampilkan data untuk halaman Berita Acara Hasil Penilaian.
     * Mengambil data dari Penilaian, Kasus, Pemegang, Tim, Formulir Analisis, dan BA Hasil (jika ada).
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

        if (!$penilaian->formulirAnalisis) {
            return response()->json(['message' => 'Formulir Analisis belum dibuat. Harap selesaikan analisis terlebih dahulu.'], 400);
        }

        return response()->json($penilaian);
    }

    /**
     * Menyimpan atau memperbarui Berita Acara Hasil Penilaian (Kesimpulan).
     */
    public function store(Request $request)
    {
        $request->validate([
            'penilaian_id' => 'required|exists:penilaians,id',
            'validitas_kegiatan' => 'required|in:BENAR,TIDAK BENAR',
            'rekomendasi_lanjutan' => 'required|in:Melanjutkan kegiatan Pemanfaatan Ruang,Dilakukan pembinaan sesuai ketentuan peraturan perundang-undangan',
        ]);

        try {
            DB::beginTransaction();

            // Generate Nomor BA jika belum ada (Format contoh: BA-HP/TIMESTAMP/RANDOM)
            $nomorBa = 'BA-HP/' . now()->format('Ymd') . '/' . strtoupper(Str::random(4));

            $baHasil = BaHasilPenilaian::updateOrCreate(
                ['penilaian_id' => $request->penilaian_id],
                [
                    'nomor_ba' => $request->nomor_ba ?? $nomorBa, // Gunakan existing jika update, atau baru
                    'tanggal_ba' => now(),
                    'validitas_kegiatan' => $request->validitas_kegiatan,
                    'rekomendasi_lanjutan' => $request->rekomendasi_lanjutan,
                    // Snapshot petugas bisa ditambahkan logicnya disini jika perlu menyimpan state static
                ]
            );

            DB::commit();
            return response()->json($baHasil, 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal menyimpan Berita Acara: ' . $e->getMessage()], 500);
        }
    }
}