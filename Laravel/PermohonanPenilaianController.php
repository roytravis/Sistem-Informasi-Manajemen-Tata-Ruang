<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PermohonanPenilaian;
use App\Models\Tim;
use App\Models\User;
use App\Notifications\AssessmentAssigned; // Import Notification
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Notification;

class PermohonanPenilaianController extends Controller
{
    public function index(Request $request)
    {
        // PERBAIKAN: Menggunakan Closure untuk Eager Loading Nested Relations
        // Ini lebih aman daripada notasi titik ('kasus.penilaian.formulirAnalisis')
        // karena memastikan sub-relasi dimuat dalam konteks model Penilaian.
        // Hal ini penting agar 'has_formulir_analisis' di model Penilaian bisa mendeteksi data yang sudah di-load.
        $query = PermohonanPenilaian::with([
            'pemegang', 
            'beritaAcara',
            'kasus' => function ($q) {
                // Memuat relasi nested di dalam Kasus -> Penilaian
                $q->with(['penilaian' => function ($qPenilaian) {
                    $qPenilaian->with([
                        'baPemeriksaan',
                        'formulirAnalisis', // <-- Target Utama Perbaikan: Pastikan relasi ini dimuat
                        'latestEditRequest'
                    ]);
                }]);
            }
        ]);

        // LOGIKA BARU: Filter berdasarkan ID spesifik (dari Notifikasi)
        if ($request->has('id')) {
            $query->where('id', $request->query('id'));
        } else {
            // Jika tidak ada ID, baru kita terapkan filter status standar
            if ($request->query('status') === 'pending') {
                $query->whereIn('status', ['Baru', 'Menunggu Penilaian', 'Draft']);
            }
        }

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
        $validatedData['status'] = 'Menunggu Penilaian';

        $penilaian = PermohonanPenilaian::create($validatedData);
        $penilaian->load('pemegang'); // Load pemegang untuk data notifikasi

        // --- KIRIM NOTIFIKASI ---
        $usersToNotify = collect();

        // 1. Jika ditugaskan ke Tim, notifikasi semua anggota tim
        if (!empty($validatedData['tim_id'])) {
            $tim = Tim::with('users')->find($validatedData['tim_id']);
            if ($tim) {
                $usersToNotify = $usersToNotify->merge($tim->users);
            }
        }

        // 2. Jika ditugaskan ke Koordinator (Penanggung Jawab), notifikasi dia
        if (!empty($validatedData['penanggung_jawab_id'])) {
            $koordinator = User::find($validatedData['penanggung_jawab_id']);
            if ($koordinator) {
                // Hindari duplikasi jika koordinator juga anggota tim
                if (!$usersToNotify->contains('id', $koordinator->id)) {
                    $usersToNotify->push($koordinator);
                }
            }
        }

        // Kirim notifikasi menggunakan Facade
        if ($usersToNotify->isNotEmpty()) {
            Notification::send($usersToNotify, new AssessmentAssigned($penilaian));
        }
        // --- AKHIR KIRIM NOTIFIKASI ---

        return response()->json($penilaian, 201);
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
        if ($permohonanPenilaian->beritaAcara) {
            $permohonanPenilaian->beritaAcara->delete();
        }
        
        $permohonanPenilaian->delete();
        return response()->json(null, 204);
    }
}