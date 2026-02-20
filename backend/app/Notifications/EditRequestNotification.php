<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\EditRequest;

class EditRequestNotification extends Notification
{
    use Queueable;

    protected $editRequest;
    protected $type; // 'requested', 'approved', 'rejected'

    public function __construct(EditRequest $editRequest, $type)
    {
        $this->editRequest = $editRequest;
        $this->type = $type;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toArray($notifiable)
    {
        $penilaian = $this->editRequest->penilaian;
        
        // Pastikan relasi kasus dimuat atau akses foreign key langsung
        $pemegang = $penilaian->kasus->pemegang->nama_pelaku_usaha ?? 'N/A';
        $nomor = $penilaian->kasus->nomor_permohonan ?? '-';
        
        // PERBAIKAN UTAMA:
        // 1. Ambil 'kasus_id' karena route frontend /penilaian/:id menggunakan Kasus ID, bukan Penilaian ID.
        // 2. Ubah action_url untuk mengarah ke PenilaianDetailPage (dashboard detail kasus).
        $kasusId = $penilaian->kasus_id; 

        if ($this->type === 'requested') {
            return [
                'type' => 'edit_request',
                'edit_request_id' => $this->editRequest->id,
                'penilaian_id' => $penilaian->id,
                'message' => "Permohonan edit formulir dari {$this->editRequest->user->nama} untuk kasus #{$nomor} ({$pemegang}).",
                // URL untuk Ketua Tim memproses (tetap)
                'action_url' => "/penilaian/persetujuan-edit"
            ];
        } elseif ($this->type === 'approved') {
            return [
                'type' => 'edit_status',
                'penilaian_id' => $penilaian->id,
                'message' => "Permohonan edit Anda untuk kasus #{$nomor} telah DISETUJUI. Silakan edit sekarang.",
                // PERBAIKAN: Redirect ke halaman PenilaianDetailPage (/penilaian/{kasus_id})
                // Sebelumnya salah mengarah ke /formulir-analisis
                'action_url' => "/penilaian/{$kasusId}" 
            ];
        } elseif ($this->type === 'rejected') {
            return [
                'type' => 'edit_status',
                'penilaian_id' => $penilaian->id,
                'message' => "Permohonan edit Anda untuk kasus #{$nomor} DITOLAK.",
                // PERBAIKAN: Redirect ke halaman PenilaianDetailPage agar user bisa melihat alasan penolakan
                'action_url' => "/penilaian/{$kasusId}" 
            ];
        }
    }
}