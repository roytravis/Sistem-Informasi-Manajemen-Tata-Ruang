<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\PermohonanPenilaian;

class AssessmentAssigned extends Notification
{
    use Queueable;

    protected $permohonan;

    /**
     * Create a new notification instance.
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
        return [
            'permohonan_id' => $this->permohonan->id,
            'nomor_permohonan' => $this->permohonan->nomor_permohonan,
            'nama_pelaku_usaha' => $this->permohonan->pemegang->nama_pelaku_usaha,
            'status' => $this->permohonan->status,
            'message' => 'Permohonan penilaian baru #' . $this->permohonan->nomor_permohonan . ' perlu ditindaklanjuti.',
            'created_at' => now(),
        ];
    }
}