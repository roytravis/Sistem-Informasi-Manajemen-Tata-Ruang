<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PermohonanPenilaian;
use App\Models\Tim;
use App\Models\User;
use App\Notifications\AssessmentAwaitingAssignment; // TAMBAHAN: Import notifikasi untuk penugasan tim
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
            'tim.users',  // PERBAIKAN: Load tim dengan users untuk authorization check di frontend
            'beritaAcara',
            'kasus' => function ($q) {
                // Memuat relasi nested di dalam Kasus -> Penilaian
                $q->with(['penilaian' => function ($qPenilaian) {
                    $qPenilaian->with([
                        'baPemeriksaan',
                        'formulirAnalisis', // <-- Target Utama Perbaikan: Pastikan relasi ini dimuat
                        'baHasilPenilaian', // <-- TAMBAHAN: Load BA Hasil Penilaian untuk cek status
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
                // PERBAIKAN: Items stay in "Menunggu Penilaian" tab until status is "Selesai Dinilai (Verifikasi)"
                // This covers all stages including partial BA Hasil saves (where record exists but not all signatures)
                // We now check the STATUS rather than record existence, since partial saves create the record
                $query->where('status', '!=', 'Selesai Dinilai (Verifikasi)')
                      ->where('status', '!=', 'Penilaian Tidak Terlaksana');
            }
        }

        $penilaians = $query->latest()->paginate(15);
        
        return response()->json($penilaians);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'pemegang_id' => 'required|exists:pemegangs,id',
            'tim_id' => 'nullable|exists:tims,id', // PERBAIKAN: nullable untuk workflow baru
            'penanggung_jawab_id' => 'nullable|exists:users,id', // PERBAIKAN: nullable untuk workflow baru
        ]);

        $validatedData['nomor_permohonan'] = now()->timestamp . '-' . Str::random(5);
        $validatedData['status'] = 'Menunggu Penilaian';

        $penilaian = PermohonanPenilaian::create($validatedData);
        $penilaian->load('pemegang'); // Load pemegang untuk data notifikasi

        // --- KIRIM NOTIFIKASI (LOGIKA BARU) ---
        if (empty($validatedData['tim_id'])) {
            // WORKFLOW BARU: Tidak ada tim ditugaskan → Notifikasi Ketua Tim untuk menugaskan
            $ketuaTimUsers = User::where('role', 'Ketua Tim')->get();
            
            if ($ketuaTimUsers->isNotEmpty()) {
                Notification::send($ketuaTimUsers, new AssessmentAwaitingAssignment($penilaian));
                \Illuminate\Support\Facades\Log::info(
                    "Sent awaiting assignment notification to {$ketuaTimUsers->count()} Ketua Tim for permohonan {$penilaian->id}"
                );
            }
        } else {
            // WORKFLOW LAMA: Tim sudah ditugaskan → Notifikasi anggota tim (backward compatibility)
            $usersToNotify = collect();

            // 1. Jika ditugaskan ke Tim, notifikasi semua anggota tim
            $tim = Tim::with('users')->find($validatedData['tim_id']);
            if ($tim) {
                $usersToNotify = $usersToNotify->merge($tim->users);
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

        // --- NOTIFICATION: Capture old values before update ---
        $oldTimId = $permohonanPenilaian->tim_id;
        $oldPenanggungJawabId = $permohonanPenilaian->penanggung_jawab_id;
        
        $permohonanPenilaian->update($validatedData);
        
        // PERBAIKAN: Notifikasi saat Tim ditugaskan (tim_id berubah dari null ke ada nilai)
        if ($oldTimId !== $permohonanPenilaian->tim_id && $permohonanPenilaian->tim_id) {
            // Load pemegang relation for notification data
            $permohonanPenilaian->load('pemegang');
            
            // Get all team members from the newly assigned Tim
            $tim = Tim::with('users')->find($permohonanPenilaian->tim_id);
            
            if ($tim && $tim->users->isNotEmpty()) {
                // PERBAIKAN: Gunakan AssessmentAssigned karena Kasus belum dibuat saat penugasan
                // (Kasus baru dibuat saat klik "Nilai")
                foreach ($tim->users as $member) {
                    $member->notify(new AssessmentAssigned($permohonanPenilaian));
                }
                
                \Illuminate\Support\Facades\Log::info(
                    "Sent team assignment notification to {$tim->users->count()} members for PermohonanPenilaian {$permohonanPenilaian->id}"
                );
            }
        }
        
        // Check if penanggung_jawab was changed and a new one was assigned
        if ($oldPenanggungJawabId !== $permohonanPenilaian->penanggung_jawab_id 
            && $permohonanPenilaian->penanggung_jawab_id) {
            
            // Load pemegang for notification
            $permohonanPenilaian->load('pemegang');
            
            // Send notification to the new Koordinator Lapangan
            $koordinator = User::find($permohonanPenilaian->penanggung_jawab_id);
            
            if ($koordinator) {
                // Don't notify if koordinator is already in the team (avoid duplicate)
                $tim = Tim::with('users')->find($permohonanPenilaian->tim_id);
                $alreadyNotified = $tim && $tim->users->contains('id', $koordinator->id);
                
                if (!$alreadyNotified) {
                    // PERBAIKAN: Gunakan AssessmentAssigned untuk konsistensi
                    $koordinator->notify(new AssessmentAssigned($permohonanPenilaian));
                    
                    \Illuminate\Support\Facades\Log::info(
                        "Sent coordinator assignment notification to user {$koordinator->nama} for PermohonanPenilaian {$permohonanPenilaian->id}"
                    );
                }
            }
        }
        // --- END NOTIFICATION ---
        
        // PERBAIKAN: Load tim relationship untuk respons frontend
        return response()->json($permohonanPenilaian->load(['pemegang', 'tim']));
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