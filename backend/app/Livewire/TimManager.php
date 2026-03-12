<?php

namespace App\Livewire;

use App\Models\Tim;
use App\Models\User;
use Illuminate\Validation\Rule;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('components.layouts.app')]
#[Title('Manajemen Tim')]
class TimManager extends Component
{
    // --- Tim Modal State ---
    public bool $showTimModal = false;
    public ?int $editingTimId = null;
    public string $nama_tim = '';
    public string $deskripsi = '';

    // --- Member Modal State ---
    public bool $showMemberModal = false;
    public ?int $managingTimId = null;
    public string $managingTimName = '';
    public int|string $selectedUserId = '';
    public string $jabatan = 'Petugas Lapangan';

    // --- Delete Modal ---
    public bool $showDeleteModal = false;
    public ?int $deletingTimId = null;

    // --- Tim CRUD ---

    public function openCreateTimModal()
    {
        $this->resetTimForm();
        $this->editingTimId = null;
        $this->showTimModal = true;
    }

    public function openEditTimModal(int $id)
    {
        $tim = Tim::findOrFail($id);
        $this->editingTimId = $tim->id;
        $this->nama_tim = $tim->nama_tim;
        $this->deskripsi = $tim->deskripsi ?? '';
        $this->showTimModal = true;
    }

    public function saveTim()
    {
        $uniqueRule = Rule::unique('tims', 'nama_tim');
        if ($this->editingTimId) {
            $uniqueRule = $uniqueRule->ignore($this->editingTimId);
        }

        $validated = $this->validate([
            'nama_tim'  => ['required', 'string', 'max:255', $uniqueRule],
            'deskripsi' => 'nullable|string',
        ]);

        if ($this->editingTimId) {
            Tim::findOrFail($this->editingTimId)->update($validated);
            session()->flash('success', 'Tim berhasil diperbarui.');
        } else {
            Tim::create($validated);
            session()->flash('success', 'Tim baru berhasil dibuat.');
        }

        $this->closeTimModal();
    }

    public function confirmDeleteTim(int $id)
    {
        $this->deletingTimId = $id;
        $this->showDeleteModal = true;
    }

    public function deleteTim()
    {
        Tim::findOrFail($this->deletingTimId)->delete();
        $this->showDeleteModal = false;
        $this->deletingTimId = null;
        session()->flash('success', 'Tim berhasil dihapus.');
    }

    public function closeTimModal()
    {
        $this->showTimModal = false;
        $this->resetTimForm();
        $this->resetValidation();
    }

    public function closeDeleteModal()
    {
        $this->showDeleteModal = false;
        $this->deletingTimId = null;
    }

    private function resetTimForm()
    {
        $this->nama_tim = '';
        $this->deskripsi = '';
    }

    // --- Member Management ---

    public function openMemberModal(int $timId)
    {
        $tim = Tim::findOrFail($timId);
        $this->managingTimId = $tim->id;
        $this->managingTimName = $tim->nama_tim;
        $this->selectedUserId = '';
        $this->jabatan = 'Petugas Lapangan';
        $this->showMemberModal = true;
    }

    public function addMember()
    {
        $this->validate([
            'selectedUserId' => 'required|exists:users,id',
            'jabatan'        => ['required', Rule::in(['Ketua Tim', 'Petugas Lapangan', 'Koordinator Lapangan'])],
        ]);

        $tim = Tim::findOrFail($this->managingTimId);

        // Check if user already in team
        if ($tim->users()->where('user_id', $this->selectedUserId)->exists()) {
            $this->addError('selectedUserId', 'User sudah menjadi anggota tim ini.');
            return;
        }

        $tim->users()->attach($this->selectedUserId, ['jabatan_di_tim' => $this->jabatan]);

        // Send notifications for active assessments (replicate API logic)
        $activeKasuses = $tim->kasuses()
            ->with('pemegang')
            ->whereNotIn('status', ['Selesai Dinilai (Verifikasi)', 'Ditolak', 'Dibatalkan'])
            ->get();

        if ($activeKasuses->isNotEmpty()) {
            $newMember = User::find($this->selectedUserId);
            foreach ($activeKasuses as $kasus) {
                $newMember->notify(new \App\Notifications\TeamMemberAssignedNotification(
                    $kasus,
                    $this->jabatan
                ));
            }
        }

        $this->selectedUserId = '';
        session()->flash('member_success', 'Anggota berhasil ditambahkan.');
    }

    public function removeMember(int $userId)
    {
        $tim = Tim::findOrFail($this->managingTimId);
        $tim->users()->detach($userId);
        session()->flash('member_success', 'Anggota berhasil dihapus dari tim.');
    }

    public function closeMemberModal()
    {
        $this->showMemberModal = false;
        $this->managingTimId = null;
        $this->managingTimName = '';
        $this->resetValidation();
    }

    // --- Render ---

    public function render()
    {
        $tims = Tim::with('users')->orderBy('nama_tim')->get();

        // Available users for member modal (filtered by role)
        $availableUsers = collect();
        if ($this->showMemberModal) {
            $availableUsers = User::whereIn('role', ['Ketua Tim', 'Petugas Lapangan', 'Koordinator Lapangan'])
                ->orderBy('nama')
                ->get();
        }

        // Current members for the managed tim
        $currentMembers = collect();
        if ($this->managingTimId) {
            $currentMembers = Tim::findOrFail($this->managingTimId)->users;
        }

        return view('livewire.tim-manager', [
            'tims'            => $tims,
            'availableUsers'  => $availableUsers,
            'currentMembers'  => $currentMembers,
        ]);
    }
}
