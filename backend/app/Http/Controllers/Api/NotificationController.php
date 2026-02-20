<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Mengambil daftar notifikasi user yang belum dibaca.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Ambil notifikasi database (unread)
        $notifications = $user->unreadNotifications()
                              ->latest()
                              ->take(10) // Ambil 10 terbaru
                              ->get();

        return response()->json($notifications);
    }

    /**
     * Menghitung jumlah notifikasi yang belum dibaca.
     */
    public function getCount(Request $request)
    {
        $user = $request->user();
        $count = $user->unreadNotifications()->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Menandai notifikasi spesifik sebagai sudah dibaca.
     */
    public function markAsRead(Request $request, $id)
    {
        $user = $request->user();
        
        $notification = $user->notifications()->where('id', $id)->first();

        if ($notification) {
            $notification->markAsRead();
        }

        return response()->json(['message' => 'Notification marked as read']);
    }

    /**
     * Menandai semua notifikasi sebagai sudah dibaca.
     */
    public function markAllRead(Request $request)
    {
        $user = $request->user();
        $user->unreadNotifications->markAsRead();

        return response()->json(['message' => 'All notifications marked as read']);
    }
}