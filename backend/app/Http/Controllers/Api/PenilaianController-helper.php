    /**
     * Helper method to send stage completion notifications
     * to Koordinator Lapangan and Ketua Tim
     */
    private function sendStageCompletionNotifications($kasus, $stage, $completedBy)
    {
        try {
            // Load permohonan and tim if not already loaded
            if (!$kasus->relationLoaded('permohonan')) {
                $kasus->load('permohonan.tim.users', 'penanggung_jawab');
            }

            $recipients = [];

            // Get Koordinator Lapangan (penanggung_jawab)
            if ($kasus->penanggung_jawab) {
                $recipients[] = $kasus->penanggung_jawab;
            }

            // Get Ketua Tim from the assigned team
            if ($kasus->permohonan && $kasus->permohonan->tim) {
                $ketuaTim = $kasus->permohonan->tim->users()
                    ->wherePivot('jabatan_di_tim', 'Ketua Tim')
                    ->first();
                
                if ($ketuaTim && !in_array($ketuaTim->id, array_column($recipients, 'id'))) {
                    $recipients[] = $ketuaTim;
                }
            }

            // Send notifications to all recipients
            if (!empty($recipients)) {
                Notification::send($recipients, new StageCompletionNotification($kasus, $stage, $completedBy));
                Log::info("Stage {$stage} completion notifications sent to " . count($recipients) . " recipients for Kasus ID {$kasus->id}");
            } else {
                Log::warning("No recipients found for stage completion notification for Kasus ID {$kasus->id}");
            }
        } catch (\Exception $e) {
            // Log error but don't fail the main operation
            Log::error("Error sending stage completion notifications for Kasus ID {$kasus->id}: " . $e->getMessage());
        }
    }
