<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pemegang;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PemegangController extends Controller
{
    public function index(Request $request)
    {
        if ($request->has('all')) {
            // PERBARUI: Urutkan berdasarkan nama pelaku usaha
            $pemegangs = Pemegang::orderBy('nama_pelaku_usaha')->get();
            return response()->json($pemegangs);
        }

        $pemegangs = Pemegang::orderBy('nama_pelaku_usaha')->paginate(10);
        return response()->json($pemegangs);
    }

    public function store(Request $request)
    {
        // PERBARUI: Validasi disesuaikan dengan field formulir baru
        // PENAMBAHAN: Aturan validasi untuk email dan nomor_handphone
        $validatedData = $request->validate([
            'nama_pelaku_usaha' => 'required|string|max:255',
            'nomor_identitas' => 'required|string|max:255|unique:pemegangs,nomor_identitas',
            'kegiatan' => 'required|string|max:255',
            'alamat' => 'required|string',
            'desa_kelurahan' => 'required|string|max:255',
            'kecamatan' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'nomor_handphone' => 'nullable|string|max:255',
        ]);

        $pemegang = Pemegang::create($validatedData);
        return response()->json($pemegang, 201);
    }

    public function show(Pemegang $pemegang)
    {
        return response()->json($pemegang);
    }

    public function update(Request $request, Pemegang $pemegang)
    {
        // PERBARUI: Validasi disesuaikan untuk proses update
        // PENAMBAHAN: Aturan validasi untuk email dan nomor_handphone
        $validatedData = $request->validate([
            'nama_pelaku_usaha' => 'required|string|max:255',
            'nomor_identitas' => ['required', 'string', 'max:255', Rule::unique('pemegangs')->ignore($pemegang->id)],
            'kegiatan' => 'required|string|max:255',
            'alamat' => 'required|string',
            'desa_kelurahan' => 'required|string|max:255',
            'kecamatan' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'nomor_handphone' => 'nullable|string|max:255',
        ]);

        $pemegang->update($validatedData);
        return response()->json($pemegang);
    }

    public function destroy(Pemegang $pemegang)
    {
        $pemegang->delete();
        return response()->json(null, 204);
    }
}
