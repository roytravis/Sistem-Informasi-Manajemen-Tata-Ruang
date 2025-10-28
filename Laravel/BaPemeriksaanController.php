<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BaPemeriksaan;
use App\Models\Penilaian; // Import model Penilaian untuk Route Model Binding
use Illuminate\Http\Request;
use Illuminate\Validation\Rule; // Import Rule untuk validasi unique
use Illuminate\Support\Facades\Log; // Untuk logging error jika diperlukan

class BaPemeriksaanController extends Controller
{
    /**
     * Menampilkan data BA Pemeriksaan berdasarkan ID Penilaian.
     * Menggunakan Route Model Binding: Laravel otomatis mencari Penilaian berdasarkan {penilaian} di URL.
     *
     * @param  \App\Models\Penilaian  $penilaian
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Penilaian $penilaian)
    {
        try {
            // Cari BaPemeriksaan yang memiliki 'penilaian_id' sama dengan ID Penilaian yang ditemukan
            $baPemeriksaan = BaPemeriksaan::where('penilaian_id', $penilaian->id)->first();

            // Jika tidak ditemukan, kembalikan null agar frontend tahu data belum ada
            if (!$baPemeriksaan) {
                return response()->json(null, 200); // 200 OK dengan body null
            }

            // Jika ditemukan, kembalikan data BA Pemeriksaan
            return response()->json($baPemeriksaan);

        } catch (\Exception $e) {
            // Log error untuk debugging di server
            Log::error("Error fetching BaPemeriksaan for Penilaian ID {$penilaian->id}: " . $e->getMessage());
            // Kembalikan response error ke client
            return response()->json(['message' => 'Gagal mengambil data Berita Acara Pemeriksaan.'], 500); // 500 Internal Server Error
        }
    }

    /**
     * Menyimpan data BA Pemeriksaan yang baru atau memperbarui jika sudah ada
     * (berdasarkan penilaian_id).
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // 1. Cari dulu data BA yang mungkin sudah ada
        $baPemeriksaan = BaPemeriksaan::where('penilaian_id', $request->penilaian_id)->first();

        // 2. Validasi input dari request
        $validatedData = $request->validate([
            'penilaian_id' => 'required|exists:penilaians,id', // Pastikan penilaian_id ada di tabel penilaians
            'nomor_ba' => [
                'required',
                'string',
                'max:255',
                // 'nomor_ba' harus unik, TAPI abaikan (ignore) record yang sedang kita edit
                // (diidentifikasi dari $baPemeriksaan yang kita cari di langkah 1)
                Rule::unique('ba_pemeriksaans')->ignore($baPemeriksaan->id ?? null),
            ],
            'nomor_spt' => 'required|string|max:255',
            'nama_pemegang' => 'required|string|max:255',
            // Pastikan tanda tangan dikirim sebagai string (base64 data URL)
            'tanda_tangan_pemegang' => 'required|string',
            // --- VALIDASI BARU ---
            'nama_koordinator' => 'nullable|string|max:255',
            'tanda_tangan_koordinator' => 'nullable|string',
        ]);

        try {
            // 3. Gunakan updateOrCreate:
            //    - Cari record BaPemeriksaan dengan 'penilaian_id' yang sesuai.
            //    - Jika ditemukan, update record tersebut dengan $validatedData.
            //    - Jika tidak ditemukan, buat record baru dengan $validatedData.
            $baPemeriksaan = BaPemeriksaan::updateOrCreate(
                ['penilaian_id' => $validatedData['penilaian_id']], // Kunci pencarian
                $validatedData // Data untuk di-insert atau di-update
            );

            // 4. Kembalikan data yang baru disimpan/diupdate
            return response()->json($baPemeriksaan, 201); // 201 Created (atau 200 OK jika update)

        } catch (\Exception $e) {
            Log::error("Error saving BaPemeriksaan: " . $e->getMessage());
             // Cek jika error karena duplikasi nomor BA (meskipun sudah divalidasi)
            if (str_contains($e->getMessage(), 'Duplicate entry') && str_contains($e->getMessage(), 'nomor_ba')) {
                 return response()->json(['message' => 'Gagal menyimpan: Nomor Berita Acara sudah digunakan.'], 409); // 409 Conflict
            }
            // Error lainnya
            return response()->json(['message' => 'Gagal menyimpan data Berita Acara Pemeriksaan.'], 500);
        }
    }

    // Method update dan destroy bisa ditambahkan jika diperlukan di masa depan
    // public function update(Request $request, BaPemeriksaan $baPemeriksaan) { ... }
    // public function destroy(BaPemeriksaan $baPemeriksaan) { ... }
}
