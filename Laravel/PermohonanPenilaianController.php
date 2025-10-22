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
        // PERBAIKAN: Tambahkan query builder untuk filtering
        $query = PermohonanPenilaian::with(['pemegang', 'kasus.penilaian']);

        // Jika ada parameter 'status=pending', filter hanya yang belum dinilai
        if ($request->query('status') === 'pending') {
            // Logika: Tampilkan permohonan yang relasi kasus->penilaian nya tidak ada.
            // Ini secara efektif menyaring yang sudah punya hasil penilaian.
            $query->whereDoesntHave('kasus.penilaian');
        }

        $penilaians = $query->latest()->paginate(15);
        
        return response()->json($penilaians);
    }

    public function store(Request $request)
    {
        // PERBAIKAN: Validasi untuk 'prioritas_score' dihapus
        $validatedData = $request->validate([
            'pemegang_id' => 'required|exists:pemegangs,id',
            'tim_id' => 'nullable|exists:tims,id',
            'penanggung_jawab_id' => 'nullable|exists:users,id',
        ]);

        // Buat nomor permohonan secara otomatis
        $validatedData['nomor_permohonan'] = now()->timestamp . '-' . Str::random(5);


        $penilaian = PermohonanPenilaian::create($validatedData);
        return response()->json($penilaian->load('pemegang'), 201);
    }

    public function show(PermohonanPenilaian $permohonanPenilaian)
    {
        return response()->json($permohonanPenilaian->load('pemegang'));
    }

    public function update(Request $request, PermohonanPenilaian $permohonanPenilaian)
    {
        // PERBAIKAN: Validasi untuk 'prioritas_score' dihapus
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
        $permohonanPenilaian->delete();
        return response()->json(null, 204);
    }
}
