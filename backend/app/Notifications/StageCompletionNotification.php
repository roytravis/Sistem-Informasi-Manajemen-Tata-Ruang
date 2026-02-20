<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\Kasus;
use App\Models\User;

class StageCompletionNotification extends Notification
{
    use Queueable;

    protected $kasus;
    protected $stage;
    protected $completedBy;

    /**
     * Create a new notification instance.
     *
     * @param Kasus $kasus The assessment case
     * @param int $stage The stage number (1-4)
     * @param User $completedBy The user who completed the stage
     */
    public function __construct(Kasus $kasus, int $stage, User $completedBy)
    {
        $this->kasus = $kasus;
        $this->stage = $stage;
        $this->completedBy = $completedBy;
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

        // Load penilaian relation if not already loaded (needed for Stage 4 URL)
        if (!$this->kasus->relationLoaded('penilaian')) {
            $this->kasus->load('penilaian');
        }

        $namaPelakuUsaha = $this->kasus->pemegang->nama_pelaku_usaha ?? 'N/A';
        $nomorPermohonan = $this->kasus->nomor_permohonan;
        
        // Define stage details
        $stageDetails = [
            1 => [
                'name' => 'FORMULIR PEMERIKSAAN DAN PENGUKURAN',
                'next' => 'Berita Acara Pemeriksaan'
            ],
            2 => [
                'name' => 'BERITA ACARA PEMERIKSAAN',
                'next' => 'Formulir Analisis Penilaian'
            ],
            3 => [
                'name' => 'FORMULIR ANALISIS PENILAIAN',
                'next' => 'Berita Acara Hasil Penilaian'
            ],
            4 => [
                'name' => 'BERITA ACARA HASIL PENILAIAN',
                'next' => null // Final stage
            ]
        ];

        $currentStage = $stageDetails[$this->stage] ?? null;
        
        if (!$currentStage) {
            return [];
        }

        $message = "Tahap {$this->stage} ({$currentStage['name']}) telah diselesaikan oleh {$this->completedBy->nama} untuk penilaian #{$nomorPermohonan} ({$namaPelakuUsaha}).";
        
        if ($currentStage['next']) {
            $message .= " Tahap selanjutnya: {$currentStage['next']}.";
        } else {
            $message .= " Penilaian telah selesai dan siap untuk verifikasi.";
        }

        // Determine action URL based on stage
        // Note: Stage 4 requires penilaian ID, not kasus ID
        $actionUrls = [
            1 => "/penilaian/{$this->kasus->id}", // FORMULIR PEMERIKSAAN (uses kasus ID)
            2 => "/penilaian/{$this->kasus->id}/berita-acara-pemeriksaan", // BA PEMERIKSAAN (uses kasus ID)
            3 => "/penilaian/{$this->kasus->id}/formulir-analisis", // FORMULIR ANALISIS (uses kasus ID)
            4 => "/penilaian/{$this->kasus->penilaian->id}/ba-hasil/preview", // BA HASIL PENILAIAN (uses penilaian ID)
        ];

        return [
            'type' => 'stage_completion',
            'kasus_id' => $this->kasus->id,
            'nomor_permohonan' => $nomorPermohonan,
            'nama_pelaku_usaha' => $namaPelakuUsaha,
            'stage' => $this->stage,
            'stage_name' => $currentStage['name'],
            'next_stage' => $currentStage['next'],
            'completed_by' => $this->completedBy->nama,
            'message' => $message,
            'action_url' => $actionUrls[$this->stage] ?? "/penilaian/{$this->kasus->id}",
            'created_at' => now(),
        ];
    }
}
