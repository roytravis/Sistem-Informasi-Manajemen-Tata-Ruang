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
        $pemegang = $penilaian->kasus->pemegang->nama_pelaku_usaha ?? 'N/A';
        $nomor = $penilaian->kasus->nomor_permohonan ?? '-';

        if ($this->type === 'requested') {
            return [
                'type' => 'edit_request',
                'edit_request_id' => $this->editRequest->id,
                'penilaian_id' => $penilaian->id,
                'message' => "Permohonan edit formulir dari {$this->editRequest->user->nama} untuk kasus #{$nomor} ({$pemegang}).",
                'action_url' => "/penilaian/persetujuan-edit"
            ];
        } elseif ($this->type === 'approved') {
            return [
                'type' => 'edit_status',
                'penilaian_id' => $penilaian->id,
                'message' => "Permohonan edit Anda untuk kasus #{$nomor} telah DISETUJUI. Silakan edit sekarang.",
                'action_url' => "/penilaian/{$penilaian->id}/formulir-analisis"
            ];
        } elseif ($this->type === 'rejected') {
            return [
                'type' => 'edit_status',
                'penilaian_id' => $penilaian->id,
                'message' => "Permohonan edit Anda untuk kasus #{$nomor} DITOLAK.",
                'action_url' => "/penilaian/{$penilaian->id}/formulir-analisis"
            ];
        }
    }
}