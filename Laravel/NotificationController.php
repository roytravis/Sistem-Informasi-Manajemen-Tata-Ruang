<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PermohonanPenilaian;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Mengambil jumlah notifikasi tugas baru untuk user yang sedang login.
     * Tugas dianggap baru jika statusnya 'Menunggu Penilaian', 'Baru', atau 'Proses Survei'
     * dan ditugaskan ke tim user atau user itu sendiri.
     */
    public function getCount(Request $request)
    {
        $user = $request->user();
        
        // 1. Ambil semua ID Tim dimana user ini menjadi anggota
        // Relasi 'tims' sudah didefinisikan di model User (belongsToMany)
        $teamIds = $user->tims()->pluck('tims.id');

        // 2. Query Permohonan Penilaian
        $count = PermohonanPenilaian::query()
            ->where(function($query) use ($teamIds, $user) {
                // Logika: User mendapat notifikasi jika:
                // a. Tugas diberikan kepada Tim-nya
                $query->whereIn('tim_id', $teamIds)
                // b. ATAU Tugas diberikan langsung kepadanya sebagai Koordinator (Penanggung Jawab)
                      ->orWhere('penanggung_jawab_id', $user->id);
            })
            // Filter Status Tugas yang dianggap "Perlu Perhatian" / "Baru"
            ->whereIn('status', ['Menunggu Penilaian', 'Baru', 'Proses Survei'])
            ->count();

        return response()->json([
            'count' => $count,
            'message' => 'Notification count retrieved successfully'
        ]);
    }
}