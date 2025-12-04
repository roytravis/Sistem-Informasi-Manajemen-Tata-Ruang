<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EditRequest;
use App\Models\Penilaian;
use App\Models\User; // Tambahkan import User
use App\Notifications\EditRequestNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;

class EditRequestController extends Controller
{
    // User mengajukan permohonan edit
    public function requestEdit(Request $request)
    {
        $request->validate([
            'penilaian_id' => 'required|exists:penilaians,id',
            'alasan' => 'required|string'
        ]);

        // Cek jika sudah ada request pending
        $existing = EditRequest::where('penilaian_id', $request->penilaian_id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Permohonan edit sedang diproses.'], 409);
        }

        $editRequest = EditRequest::create([
            'penilaian_id' => $request->penilaian_id,
            'user_id' => Auth::id(),
            'status' => 'pending',
            'alasan_permohonan' => $request->alasan
        ]);

        // Kirim Notifikasi ke Ketua Tim yang terkait dengan Kasus ini
        // Atau ke semua Ketua Tim jika assignment logic berbeda
        $penilaian = Penilaian::with('kasus.tim.users')->find($request->penilaian_id);
        
        // Ambil Ketua Tim dari tim yang menangani kasus ini
        $ketuaTim = null;
        if ($penilaian->kasus && $penilaian->kasus->tim) {
            $ketuaTim = $penilaian->kasus->tim->users()
                ->wherePivot('jabatan_di_tim', 'Ketua Tim')
                ->get();
        }

        // Fallback: Jika tidak ada tim spesifik, kirim ke user dengan role 'Ketua Tim' (Opsional)
        if (!$ketuaTim || $ketuaTim->isEmpty()) {
            $ketuaTim = User::where('role', 'Ketua Tim')->get();
        }

        if ($ketuaTim->isNotEmpty()) {
            Notification::send($ketuaTim, new EditRequestNotification($editRequest, 'requested'));
        }

        return response()->json($editRequest, 201);
    }

    // Ketua Tim melihat daftar pending requests
    public function getPendingRequests(Request $request)
    {
        // Hanya Ketua Tim atau Admin
        if (!in_array($request->user()->role, ['Admin', 'Ketua Tim'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $requests = EditRequest::with(['penilaian.kasus.pemegang', 'user'])
            ->where('status', 'pending')
            ->latest()
            ->get();

        return response()->json($requests);
    }

    // Ketua Tim memproses (Setuju/Tolak)
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
            $editRequest->user->notify(new EditRequestNotification($editRequest, 'approved'));
        } else {
            $editRequest->update([
                'status' => 'rejected',
                'alasan_penolakan' => $request->alasan_penolakan,
                'processed_at' => now()
            ]);
            $editRequest->user->notify(new EditRequestNotification($editRequest, 'rejected'));
        }

        return response()->json($editRequest);
    }

    // Cek status terakhir request untuk penilaian tertentu
    public function checkStatus($penilaianId)
    {
        $latestRequest = EditRequest::where('penilaian_id', $penilaianId)
            ->latest()
            ->first();

        return response()->json($latestRequest);
    }
}