<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EditRequest;
use App\Models\Penilaian;
use App\Models\User;
use App\Notifications\EditRequestNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests; // PERBAIKAN: Authorization

class EditRequestController extends Controller
{
    use AuthorizesRequests; // PERBAIKAN: Enable authorization
    /**
     * User mengajukan permohonan edit.
     */
    public function requestEdit(Request $request)
    {
        $request->validate([
            'penilaian_id' => 'required|exists:penilaians,id',
            'alasan' => 'required|string|min:5'
        ]);

        // PERBAIKAN: Verify user is team member before allowing edit request
        $penilaian = Penilaian::with('kasus.permohonan.tim.users')->findOrFail($request->penilaian_id);
        $this->authorize('update', $penilaian->kasus);

        // Cek jika sudah ada request pending untuk penilaian ini
        $existing = EditRequest::where('penilaian_id', $request->penilaian_id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Permohonan edit Anda sedang diproses dan menunggu persetujuan.'], 409);
        }

        // Cek jika sudah approved (user refresh halaman tapi belum selesai edit)
        $approved = EditRequest::where('penilaian_id', $request->penilaian_id)
            ->where('status', 'approved')
            ->first();

        if ($approved) {
            return response()->json(['message' => 'Permohonan edit Anda sudah disetujui. Silakan lakukan pengeditan.'], 200);
        }

        // Buat request baru
        $editRequest = EditRequest::create([
            'penilaian_id' => $request->penilaian_id,
            'user_id' => Auth::id(),
            'status' => 'pending',
            'alasan_permohonan' => $request->alasan
        ]);

        // --- KIRIM NOTIFIKASI KE KETUA TIM ---
        $penilaian = Penilaian::with('kasus.tim.users')->find($request->penilaian_id);
        
        $ketuaTim = collect();

        // 1. Cari Ketua Tim spesifik di tim yang menangani kasus ini
        if ($penilaian->kasus && $penilaian->kasus->tim) {
            $ketuaTim = $penilaian->kasus->tim->users()
                ->wherePivot('jabatan_di_tim', 'Ketua Tim')
                ->get();
        }

        // 2. Fallback: Jika tidak ada tim spesifik/ketua, kirim ke semua user role 'Ketua Tim' atau 'Admin'
        if ($ketuaTim->isEmpty()) {
            $ketuaTim = User::whereIn('role', ['Ketua Tim', 'Admin'])->get();
        }

        if ($ketuaTim->isNotEmpty()) {
            // Pastikan class Notification di-import dengan benar
            Notification::send($ketuaTim, new EditRequestNotification($editRequest, 'requested'));
        }

        return response()->json($editRequest, 201);
    }

    /**
     * Ketua Tim melihat daftar request yang pending.
     */
    public function getPendingRequests(Request $request)
    {
        // Hanya Ketua Tim atau Admin yang boleh lihat
        if (!in_array($request->user()->role, ['Admin', 'Ketua Tim'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $requests = EditRequest::with(['penilaian.kasus.pemegang', 'user'])
            ->where('status', 'pending')
            ->latest()
            ->get();

        return response()->json($requests);
    }

    /**
     * Ketua Tim memproses (Setuju/Tolak) request.
     */
    public function processRequest(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['Admin', 'Ketua Tim'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'action' => 'required|in:approve,reject',
            'alasan_penolakan' => 'required_if:action,reject'
        ]);

        $editRequest = EditRequest::findOrFail($id);

        if ($request->action === 'approve') {
            $editRequest->update([
                'status' => 'approved',
                'processed_at' => now()
            ]);
            // Kirim notifikasi ke user pemohon
            $editRequest->user->notify(new EditRequestNotification($editRequest, 'approved'));
        } else {
            $editRequest->update([
                'status' => 'rejected',
                'alasan_penolakan' => $request->alasan_penolakan,
                'processed_at' => now()
            ]);
            // Kirim notifikasi ke user pemohon
            $editRequest->user->notify(new EditRequestNotification($editRequest, 'rejected'));
        }

        return response()->json($editRequest);
    }

    /**
     * Helper untuk Frontend: Cek status terakhir request user untuk penilaian ini.
     */
    public function checkStatus($penilaianId)
    {
        // Ambil request terakhir (paling baru dibuat)
        $latestRequest = EditRequest::where('penilaian_id', $penilaianId)
            ->latest()
            ->first();

        if (!$latestRequest) {
            return response()->json(null); // Belum pernah request
        }

        return response()->json($latestRequest);
    }
}