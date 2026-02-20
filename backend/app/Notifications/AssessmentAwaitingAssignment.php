<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\PermohonanPenilaian;

class AssessmentAwaitingAssignment extends Notification
{
    use Queueable;

    protected $permohonan;

    /**
     * Create a new notification instance.
     *
     * @param PermohonanPenilaian $permohonan The assessment awaiting team assignment
     */
    public function __construct(PermohonanPenilaian $permohonan)
    {
        $this->permohonan = $permohonan;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        // Load pemegang relation if not already loaded
        if (!$this->permohonan->relationLoaded('pemegang')) {
            $this->permohonan->load('pemegang');
        }

        $namaPelakuUsaha = $this->permohonan->pemegang->nama_pelaku_usaha ?? 'N/A';
        $nomorPermohonan = $this->permohonan->nomor_permohonan;

        return [
            'type' => 'awaiting_assignment',
            'permohonan_id' => $this->permohonan->id,
            'nomor_permohonan' => $nomorPermohonan,
            'nama_pelaku_usaha' => $namaPelakuUsaha,
            'message' => "Permohonan penilaian #{$nomorPermohonan} ({$namaPelakuUsaha}) memerlukan penugasan tim.",
            'action_url' => "/penilaian?id={$this->permohonan->id}",
            'created_at' => now(),
        ];
    }
}
