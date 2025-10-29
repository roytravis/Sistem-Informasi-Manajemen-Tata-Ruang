<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PermohonanPenilaian;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class PermohonanPenilaianController extends Controller
{
    public function index(Request $request)
    {
        // PERBAIKAN: Eager load relasi 'beritaAcara'
        $query = PermohonanPenilaian::with(['pemegang', 'kasus.penilaian', 'beritaAcara']);

        // --- PERUBAHAN LOGIKA FILTER 'PENDING' ---
        if ($request->query('status') === 'pending') {
            // Tampilkan yang statusnya 'Baru', 'Menunggu Penilaian', atau 'Draft'
            $query->whereIn('status', ['Baru', 'Menunggu Penilaian', 'Draft']);
        }
        // --- AKHIR PERUBAHAN ---

        $penilaians = $query->latest()->paginate(15);
        
        return response()->json($penilaians);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'pemegang_id' => 'required|exists:pemegangs,id',
            'tim_id' => 'nullable|exists:tims,id',
            'penanggung_jawab_id' => 'nullable|exists:users,id',
        ]);

        $validatedData['nomor_permohonan'] = now()->timestamp . '-' . Str::random(5);
        
        // Status default saat dibuat manual adalah 'Menunggu Penilaian'
        $validatedData['status'] = 'Menunggu Penilaian';


        $penilaian = PermohonanPenilaian::create($validatedData);
        return response()->json($penilaian->load('pemegang'), 201);
    }

    public function show(PermohonanPenilaian $permohonanPenilaian)
    {
        return response()->json($permohonanPenilaian->load('pemegang'));
    }

    public function update(Request $request, PermohonanPenilaian $permohonanPenilaian)
    {
        $validatedData = $request->validate([
            'pemegang_id' => 'required|exists:pemegangs,id',
            'tim_id' => 'nullable|exists:tims,id',
            'penanggung_jawab_id' => 'nullable|exists:users,id',
        ]);

        $permohonanPenilaian->update($validatedData);
        return response()->json($permohonanPenilaian->load('pemegang'));
    }

    public function destroy(PermohonanPenilaian $permohonanPenilaian)
    {
        // Hapus juga BA terkait jika ada, untuk menghindari data yatim
        if ($permohonanPenilaian->beritaAcara) {
            $permohonanPenilaian->beritaAcara->delete();
        }
        
        $permohonanPenilaian->delete();
        return response()->json(null, 204);
    }
}
