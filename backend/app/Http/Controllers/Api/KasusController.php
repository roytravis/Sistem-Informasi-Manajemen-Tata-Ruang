<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kasus;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class KasusController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        // PERBARUI: Memuat relasi baru 'tim' dan 'penanggung_jawab' (yang sudah menunjuk ke kolom baru)
        $query = Kasus::with(['pemegang', 'penanggung_jawab', 'tim']);

        if ($request->has('jenis') && in_array($request->jenis, ['KKPR', 'PMP_UMK'])) {
            $query->where('jenis', $request->jenis);
        }

        if ($request->get('sortBy') === 'prioritas') {
            $query->orderBy('prioritas_score', 'desc');
        } else {
            $query->latest();
        }

        $kasus = $query->paginate(10);
        return response()->json($kasus);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Kasus::class);

        // PERBARUI: Ubah validasi dari 'user_id' menjadi 'tim_id' dan 'penanggung_jawab_id'
        $validatedData = $request->validate([
            'jenis' => 'required|in:KKPR,PMP_UMK',
            'nomor_permohonan' => 'required|string|unique:kasuses,nomor_permohonan',
            'pemegang_id' => 'required|exists:pemegangs,id',
            'tim_id' => 'nullable|exists:tims,id', // Validasi untuk tim
            'penanggung_jawab_id' => 'nullable|exists:users,id', // Validasi untuk penanggung jawab
            'prioritas_score' => 'sometimes|integer|min:0|max:100'
        ]);

        $kasus = Kasus::create($validatedData);
        // PERBARUI: Muat relasi baru setelah membuat kasus
        return response()->json($kasus->load(['pemegang', 'penanggung_jawab', 'tim']), 201);
    }

    public function show(Kasus $kasus)
    {
        // PERBAIKAN: Load permohonan dengan tim sebelum authorization check
        // agar KasusPolicy bisa mengecek keanggotaan tim dengan benar
        $kasus->load(['permohonan.tim']);
        
        // Check authorization and return proper error message
        if (!auth()->user()->can('view', $kasus)) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses ke data ini. Hanya anggota tim yang ditugaskan yang dapat mengakses penilaian ini.'
            ], 403);
        }
        
        // PERBAIKAN: Muat juga relasi penilaian beserta data penilainya
        return response()->json($kasus->load(['pemegang', 'penanggung_jawab', 'surveis.petugas', 'tim', 'penilaian.penilai']));
    }

    public function update(Request $request, Kasus $kasus)
    {
        // PERBAIKAN: Load permohonan sebelum authorization check
        $kasus->load(['permohonan.tim']);
        
        $this->authorize('update', $kasus);
        
        // PERBARUI: Ubah validasi dari 'user_id' menjadi 'tim_id' dan 'penanggung_jawab_id'
        $validatedData = $request->validate([
            'jenis' => 'sometimes|in:KKPR,PMP_UMK',
            'nomor_permohonan' => ['sometimes', 'string', Rule::unique('kasuses')->ignore($kasus->id)],
            'pemegang_id' => 'sometimes|exists:pemegangs,id',
            'status' => 'sometimes|string|in:Baru,Proses Survei,Survei Selesai,Menunggu Penilaian,Penilaian Selesai - Patuh,Penilaian Selesai - Tidak Patuh,Proses Keberatan,Selesai',
            'prioritas_score' => 'sometimes|integer|min:0|max:100',
            'tim_id' => 'nullable|exists:tims,id',
            'penanggung_jawab_id' => 'nullable|exists:users,id',
        ]);

        $kasus->update($validatedData);
        // PERBARUI: Muat relasi baru setelah update
        return response()->json($kasus->load(['pemegang', 'penanggung_jawab', 'tim']));
    }

    public function destroy(Kasus $kasus)
    {
        // PERBAIKAN: Load permohonan sebelum authorization check
        $kasus->load(['permohonan.tim']);
        
        $this->authorize('delete', $kasus);
        
        $kasus->delete();
        return response()->json(null, 204);
    }

    /**
     * PENAMBAHAN: Fungsi baru untuk menangani proses verifikasi kasus.
     */
    public function verifikasi(Request $request, Kasus $kasus)
    {
        // PERBAIKAN: Load permohonan sebelum authorization check
        $kasus->load(['permohonan.tim']);
        
        // 1. Otorisasi: Pastikan pengguna memiliki hak untuk verifikasi
        $this->authorize('verifikasi', $kasus);

        // 2. Validasi: Pastikan input 'hasil' valid
        $validated = $request->validate([
            'hasil' => 'required|string|in:Patuh,Tidak Patuh',
        ]);

        // 3. Tentukan status baru berdasarkan hasil verifikasi
        $newStatus = ($validated['hasil'] === 'Patuh')
            ? 'Penilaian Selesai - Patuh'
            : 'Penilaian Selesai - Tidak Patuh';
        
        // 4. Update status kasus
        $kasus->update(['status' => $newStatus]);

        // 5. Kembalikan respons dengan data kasus yang sudah diperbarui
        // PERBARUI: Muat relasi tim juga
        return response()->json($kasus->load(['pemegang', 'penanggung_jawab', 'tim']));
    }
}
