<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BaPemeriksaan;
use App\Models\Penilaian;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BaPemeriksaanController extends Controller
{
    public function show(Penilaian $penilaian)
    {
        try {
            $baPemeriksaan = BaPemeriksaan::where('penilaian_id', $penilaian->id)->first();
            if (!$baPemeriksaan) {
                return response()->json(null, 200);
            }
            return response()->json($baPemeriksaan);
        } catch (\Exception $e) {
            Log::error("Error fetching BaPemeriksaan: " . $e->getMessage());
            return response()->json(['message' => 'Gagal mengambil data Berita Acara Pemeriksaan.'], 500);
        }
    }

    public function store(Request $request)
    {
        $baPemeriksaan = BaPemeriksaan::where('penilaian_id', $request->penilaian_id)->first();

        $validatedData = $request->validate([
            'penilaian_id' => 'required|exists:penilaians,id',
            'nomor_ba' => [
                'required',
                'string',
                'max:255',
                Rule::unique('ba_pemeriksaans')->ignore($baPemeriksaan->id ?? null),
            ],
            'nomor_spt' => 'required|string|max:255',
            'nama_pemegang' => 'required|string|max:255',
            'tanda_tangan_pemegang' => 'required|string', // Base64
            
            'nama_koordinator' => 'nullable|string|max:255',
            'tanda_tangan_koordinator' => 'nullable|string', // Base64
            
            // Validasi Array Tanda Tangan Tim
            'tanda_tangan_tim' => 'nullable|array',
            'tanda_tangan_tim.*.user_id' => 'required|exists:users,id',
            'tanda_tangan_tim.*.nama' => 'required|string',
            'tanda_tangan_tim.*.signature' => 'nullable|string', // Base64 atau Path
        ]);

        try {
            // Proses Tanda Tangan Tim (Simpan file jika base64)
            $processedSignatures = [];
            
            // Ambil data lama untuk merge jika perlu
            $existingSignatures = $baPemeriksaan && $baPemeriksaan->tanda_tangan_tim ? collect($baPemeriksaan->tanda_tangan_tim)->keyBy('user_id') : collect([]);

            if (!empty($validatedData['tanda_tangan_tim'])) {
                foreach ($validatedData['tanda_tangan_tim'] as $sig) {
                    $path = null;
                    
                    // Cek jika signature dikirim (tidak null)
                    if (!empty($sig['signature'])) {
                        // Jika format base64, simpan sebagai file
                        if (Str::startsWith($sig['signature'], 'data:image')) {
                            $path = $this->saveSignature($sig['signature'], 'ttd_ba_tim_' . $sig['user_id']);
                        } else {
                            // Jika bukan base64, asumsikan itu path lama yang dikirim balik
                            $path = $sig['signature'];
                        }
                    } else {
                        // Jika kosong, coba ambil dari data lama
                        $path = $existingSignatures[$sig['user_id']]['signature_path'] ?? null;
                    }

                    $processedSignatures[] = [
                        'user_id' => $sig['user_id'],
                        'nama' => $sig['nama'],
                        'nip' => $sig['nip'] ?? null,
                        'signature_path' => $path
                    ];
                }
            }

            // Update atau Create Data
            $dataToSave = [
                'penilaian_id' => $validatedData['penilaian_id'],
                'nomor_ba' => $validatedData['nomor_ba'],
                'nomor_spt' => $validatedData['nomor_spt'],
                'nama_pemegang' => $validatedData['nama_pemegang'],
                'tanda_tangan_pemegang' => $validatedData['tanda_tangan_pemegang'], // Disimpan direct (existing logic)
                'nama_koordinator' => $validatedData['nama_koordinator'],
                'tanda_tangan_koordinator' => $validatedData['tanda_tangan_koordinator'], // Disimpan direct
                'tanda_tangan_tim' => $processedSignatures, // JSON Array baru
            ];

            $result = BaPemeriksaan::updateOrCreate(
                ['penilaian_id' => $validatedData['penilaian_id']],
                $dataToSave
            );

            return response()->json($result, 201);

        } catch (\Exception $e) {
            Log::error("Error saving BaPemeriksaan: " . $e->getMessage());
            if (str_contains($e->getMessage(), 'Duplicate entry') && str_contains($e->getMessage(), 'nomor_ba')) {
                 return response()->json(['message' => 'Gagal menyimpan: Nomor Berita Acara sudah digunakan.'], 409);
            }
            return response()->json(['message' => 'Gagal menyimpan data: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Helper: Simpan base64 ke file storage
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
            return null; // Atau throw error
        }

        $fileName = 'signatures/' . $prefix . '_' . Str::uuid() . '.' . $type;
        Storage::disk('public')->put($fileName, $data);
        return $fileName;
    }
}