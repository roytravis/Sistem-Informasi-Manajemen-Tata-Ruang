<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\Kasus;

class TeamMemberAssignedNotification extends Notification
{
    use Queueable;

    protected $kasus;
    protected $assignedRole;

    /**
     * Create a new notification instance.
     *
     * @param Kasus $kasus The assessment case
     * @param string $assignedRole The role assigned (e.g., 'Koordinator Lapangan', 'Petugas Lapangan')
     */
    public function __construct(Kasus $kasus, string $assignedRole)
    {
        $this->kasus = $kasus;
        $this->assignedRole = $assignedRole;
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
        if (!$this->kasus->relationLoaded('pemegang')) {
            $this->kasus->load('pemegang');
        }

        $namaPelakuUsaha = $this->kasus->pemegang->nama_pelaku_usaha ?? 'N/A';
        $nomorPermohonan = $this->kasus->nomor_permohonan;

        return [
            'type' => 'team_assignment',
            'kasus_id' => $this->kasus->id,
            'nomor_permohonan' => $nomorPermohonan,
            'assigned_role' => $this->assignedRole,
            'nama_pelaku_usaha' => $namaPelakuUsaha,
            'message' => "Anda ditugaskan sebagai {$this->assignedRole} untuk penilaian #{$nomorPermohonan} ({$namaPelakuUsaha}).",
            'action_url' => "/penilaian/{$this->kasus->id}",
            'created_at' => now(),
        ];
    }
}
