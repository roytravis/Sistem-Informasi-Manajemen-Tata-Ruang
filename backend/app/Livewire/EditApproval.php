<?php

namespace App\Livewire;

use App\Models\EditRequest;
use App\Models\User;
use App\Notifications\EditRequestNotification;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('components.layouts.app')]
#[Title('Persetujuan Edit')]
class EditApproval extends Component
{
    // Reject modal state
    public bool $showRejectModal = false;
    public ?int $rejectingId = null;
    public string $alasanPenolakan = '';

    public ?int $processingId = null;

    public function approve(int $id)
    {
        $this->processingId = $id;
        $editRequest = EditRequest::findOrFail($id);

        $editRequest->update([
            'status'       => 'approved',
            'processed_at' => now(),
        ]);

        // Notify requester
        $editRequest->user->notify(new EditRequestNotification($editRequest, 'approved'));

        session()->flash('success', 'Permohonan edit berhasil disetujui.');
        $this->processingId = null;
    }

    public function openRejectModal(int $id)
    {
        $this->rejectingId = $id;
        $this->alasanPenolakan = '';
        $this->showRejectModal = true;
    }

    public function closeRejectModal()
    {
        $this->showRejectModal = false;
        $this->rejectingId = null;
        $this->alasanPenolakan = '';
    }

    public function reject()
    {
        $this->validate([
            'alasanPenolakan' => 'required|string|min:3',
        ]);

        $editRequest = EditRequest::findOrFail($this->rejectingId);

        $editRequest->update([
            'status'           => 'rejected',
            'alasan_penolakan' => $this->alasanPenolakan,
            'processed_at'     => now(),
        ]);

        // Notify requester
        $editRequest->user->notify(new EditRequestNotification($editRequest, 'rejected'));

        $this->closeRejectModal();
        session()->flash('success', 'Permohonan edit berhasil ditolak.');
    }

    public function render()
    {
        $requests = EditRequest::with(['penilaian.kasus.pemegang', 'user'])
            ->where('status', 'pending')
            ->latest()
            ->get();

        return view('livewire.edit-approval', [
            'requests' => $requests,
        ]);
    }
}
