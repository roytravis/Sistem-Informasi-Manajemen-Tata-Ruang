<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tim;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TimController extends Controller
{
    /**
     * Menampilkan daftar semua tim.
     */
    public function index()
    {
        $tims = Tim::with('users')->orderBy('nama_tim')->get();
        return response()->json($tims);
    }

    /**
     * Menyimpan tim baru.
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'nama_tim' => 'required|string|unique:tims,nama_tim|max:255',
            'deskripsi' => 'nullable|string',
        ]);

        $tim = Tim::create($validatedData);
        return response()->json($tim, 201);
    }

    /**
     * Menampilkan detail satu tim beserta anggotanya.
     */
    public function show(Tim $tim)
    {
        return response()->json($tim->load('users'));
    }

    /**
     * Memperbarui data tim.
     */
    public function update(Request $request, Tim $tim)
    {
        $validatedData = $request->validate([
            'nama_tim' => ['required', 'string', 'max:255', Rule::unique('tims')->ignore($tim->id)],
            'deskripsi' => 'nullable|string',
        ]);

        $tim->update($validatedData);
        return response()->json($tim->load('users'));
    }

    /**
     * Menghapus tim.
     */
    public function destroy(Tim $tim)
    {
        $tim->delete();
        return response()->json(null, 204);
    }

    /**
     * Menambahkan anggota ke dalam tim.
     */
    public function addMember(Request $request, Tim $tim)
    {
        $validatedData = $request->validate([
            'user_id' => 'required|exists:users,id',
            // PERUBAHAN: Menambahkan 'Koordinator Lapangan' sebagai jabatan yang valid di dalam tim
            'jabatan_di_tim' => ['required', Rule::in(['Ketua Tim', 'Petugas Lapangan', 'Koordinator Lapangan'])],
        ]);

        // Cek apakah user sudah ada di tim
        if ($tim->users()->where('user_id', $validatedData['user_id'])->exists()) {
            return response()->json(['message' => 'User sudah menjadi anggota tim ini.'], 409);
        }

        $tim->users()->attach($validatedData['user_id'], ['jabatan_di_tim' => $validatedData['jabatan_di_tim']]);

        // --- NOTIFICATION: Notify new member about active assessments ---
        // Get all active Kasus assigned to this team (exclude completed/finalized)
        $activeKasuses = $tim->kasuses()
            ->with('pemegang') // Eager load for notification data
            ->whereNotIn('status', [
                'Selesai Dinilai (Verifikasi)',
                'Ditolak',
                'Dibatalkan'
            ])
            ->get();

        // Send notification to the newly added member for each active Kasus
        if ($activeKasuses->isNotEmpty()) {
            $newMember = User::find($validatedData['user_id']);
            
            foreach ($activeKasuses as $kasus) {
                $newMember->notify(new \App\Notifications\TeamMemberAssignedNotification(
                    $kasus,
                    $validatedData['jabatan_di_tim']
                ));
            }
            
            \Illuminate\Support\Facades\Log::info(
                "Sent {$activeKasuses->count()} team assignment notification(s) to user {$newMember->nama} for team {$tim->nama_tim}"
            );
        }
        // --- END NOTIFICATION ---

        return response()->json($tim->load('users'));
    }

    /**
     * Menghapus anggota dari tim.
     */
    public function removeMember(Request $request, Tim $tim)
    {
        $validatedData = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $tim->users()->detach($validatedData['user_id']);

        return response()->json($tim->load('users'));
    }
}

