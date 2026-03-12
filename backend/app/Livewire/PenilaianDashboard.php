<?php

namespace App\Livewire;

use App\Models\PermohonanPenilaian;
use App\Models\Tim;
use App\Models\User;
use App\Notifications\AssessmentAssigned;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;
use Livewire\WithPagination;

#[Layout('components.layouts.app')]
#[Title('Dashboard Penilaian')]
class PenilaianDashboard extends Component
{
    use WithPagination;

    // --- Filter ---
    public string $filter = 'pending';

    // --- Assign Team Modal ---
    public bool $showAssignModal = false;
    public ?int $assignPermohonanId = null;
    public string $assignPemegangNama = '';
    public string $assignNomorPermohonan = '';
    public int|string $assignTimId = '';

    // Reset pagination when filter changes
    public function updatingFilter()
    {
        $this->resetPage();
    }

    // --- Helpers ---

    /**
     * Check if the current user can edit/delete permohonan.
     */
    private function canEditDelete(): bool
    {
        return in_array(Auth::user()->role, ['Admin', 'Ketua Tim']);
    }

    /**
     * Check if the current user is authorized for a specific permohonan.
     */
    private function isUserAuthorized(PermohonanPenilaian $p): bool
    {
        $user = Auth::user();
        if ($user->role === 'Admin') return true;

        // Allow access if finalized
        $isFinalized = $p->status === 'Selesai Dinilai (Verifikasi)' ||
            optional($p->kasus)->status === 'Selesai Dinilai (Verifikasi)';
        if ($isFinalized && in_array($user->role, ['Koordinator Lapangan', 'Ketua Tim', 'Petugas Lapangan'])) {
            return true;
        }

        // Check if user is coordinator
        if ($p->penanggung_jawab_id === $user->id) return true;

        // Check if user is in assigned team
        if ($p->tim && $p->tim->users) {
            return $p->tim->users->contains('id', $user->id);
        }

        return false;
    }

    // --- Assign Team Actions ---

    public function openAssignModal(int $permohonanId)
    {
        $permohonan = PermohonanPenilaian::with('pemegang')->findOrFail($permohonanId);
        $this->assignPermohonanId = $permohonan->id;
        $this->assignPemegangNama = $permohonan->pemegang->nama_pelaku_usaha ?? '-';
        $this->assignNomorPermohonan = $permohonan->nomor_permohonan ?? '-';
        $this->assignTimId = $permohonan->tim_id ?? '';
        $this->showAssignModal = true;
    }

    public function assignTeam()
    {
        $this->validate([
            'assignTimId' => 'required|exists:tims,id',
        ]);

        $permohonan = PermohonanPenilaian::findOrFail($this->assignPermohonanId);
        $oldTimId = $permohonan->tim_id;
        $permohonan->update(['tim_id' => $this->assignTimId]);

        // Send notifications to team members if tim changed
        if ($oldTimId !== (int) $this->assignTimId) {
            $permohonan->load('pemegang');
            $tim = Tim::with('users')->find($this->assignTimId);

            if ($tim && $tim->users->isNotEmpty()) {
                foreach ($tim->users as $member) {
                    $member->notify(new AssessmentAssigned($permohonan));
                }
            }
        }

        $this->closeAssignModal();
        session()->flash('success', 'Tim penilai berhasil ditugaskan.');
    }

    public function closeAssignModal()
    {
        $this->showAssignModal = false;
        $this->assignPermohonanId = null;
        $this->assignTimId = '';
        $this->resetValidation();
    }

    // --- Delete Action ---

    public function deletePermohonan(int $id)
    {
        $permohonan = PermohonanPenilaian::findOrFail($id);

        if ($permohonan->beritaAcara) {
            $permohonan->beritaAcara->delete();
        }

        $permohonan->delete();
        session()->flash('success', 'Data permohonan berhasil dihapus.');
    }

    // --- Render ---

    public function render()
    {
        $user = Auth::user();

        $query = PermohonanPenilaian::with([
            'pemegang',
            'tim.users',
            'beritaAcara',
            'kasus' => function ($q) {
                $q->with(['penilaian' => function ($qPenilaian) {
                    $qPenilaian->with([
                        'baPemeriksaan',
                        'formulirAnalisis',
                        'baHasilPenilaian',
                        'latestEditRequest',
                    ]);
                }]);
            },
        ]);

        // Apply filter
        if ($this->filter === 'pending') {
            $query->where('status', '!=', 'Selesai Dinilai (Verifikasi)')
                  ->where('status', '!=', 'Penilaian Tidak Terlaksana');
        }

        $pmpList = $query->latest()->paginate(15);

        // Available tims for assign modal
        $tims = collect();
        if ($this->showAssignModal) {
            $tims = Tim::orderBy('nama_tim')->get();
        }

        return view('livewire.penilaian-dashboard', [
            'pmpList'        => $pmpList,
            'tims'           => $tims,
            'user'           => $user,
            'canEditDelete'  => $this->canEditDelete(),
            'isKetuaTim'     => $user->role === 'Ketua Tim',
        ]);
    }
}
