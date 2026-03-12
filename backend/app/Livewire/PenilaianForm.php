<?php

namespace App\Livewire;

use App\Models\Pemegang;
use App\Models\PermohonanPenilaian;
use App\Models\Tim;
use App\Models\User;
use App\Notifications\AssessmentAssigned;
use App\Notifications\AssessmentAwaitingAssignment;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('components.layouts.app')]
class PenilaianForm extends Component
{
    // Route param: null = add, set = edit
    public ?int $permohonanId = null;

    // Form fields
    public int|string $pemegang_id = '';
    public int|string $tim_id = '';

    // Edit-mode info
    public string $currentNib = '';
    public bool $isEditMode = false;

    // UI state
    public bool $loading = false;

    public function mount(?int $permohonanId = null)
    {
        $this->permohonanId = $permohonanId;

        if ($permohonanId) {
            $this->isEditMode = true;
            $permohonan = PermohonanPenilaian::with('pemegang')->findOrFail($permohonanId);
            $this->pemegang_id = $permohonan->pemegang_id ?? '';
            $this->tim_id = $permohonan->tim_id ?? '';
            $this->currentNib = $permohonan->pemegang->nomor_identitas ?? '';
        }
    }

    public function getTitle(): string
    {
        return $this->isEditMode ? 'Edit Permohonan' : 'Tambah Permohonan';
    }

    protected function rules(): array
    {
        return [
            'pemegang_id' => 'required|exists:pemegangs,id',
            'tim_id'      => 'nullable',
        ];
    }

    public function save()
    {
        $this->validate();

        $this->loading = true;

        try {
            if ($this->isEditMode) {
                // --- UPDATE ---
                $permohonan = PermohonanPenilaian::findOrFail($this->permohonanId);
                $oldTimId = $permohonan->tim_id;

                $permohonan->update([
                    'pemegang_id' => $this->pemegang_id,
                    'tim_id'      => $this->tim_id ?: null,
                ]);

                // Notify team if tim changed
                if ($oldTimId !== $permohonan->tim_id && $permohonan->tim_id) {
                    $permohonan->load('pemegang');
                    $tim = Tim::with('users')->find($permohonan->tim_id);
                    if ($tim && $tim->users->isNotEmpty()) {
                        foreach ($tim->users as $member) {
                            $member->notify(new AssessmentAssigned($permohonan));
                        }
                    }
                }

                session()->flash('success', 'Permohonan berhasil diperbarui.');
            } else {
                // --- CREATE ---
                $permohonan = PermohonanPenilaian::create([
                    'pemegang_id'       => $this->pemegang_id,
                    'tim_id'            => $this->tim_id ?: null,
                    'nomor_permohonan'  => now()->timestamp . '-' . Str::random(5),
                    'status'            => 'Menunggu Penilaian',
                ]);

                $permohonan->load('pemegang');

                // Notifications
                if (empty($this->tim_id)) {
                    $ketuaTimUsers = User::where('role', 'Ketua Tim')->get();
                    if ($ketuaTimUsers->isNotEmpty()) {
                        Notification::send($ketuaTimUsers, new AssessmentAwaitingAssignment($permohonan));
                    }
                } else {
                    $tim = Tim::with('users')->find($this->tim_id);
                    if ($tim && $tim->users->isNotEmpty()) {
                        foreach ($tim->users as $member) {
                            $member->notify(new AssessmentAssigned($permohonan));
                        }
                    }
                }

                session()->flash('success', 'Permohonan baru berhasil ditambahkan.');
            }

            return $this->redirect(route('penilaian'), navigate: false);
        } catch (\Exception $e) {
            session()->flash('error', 'Terjadi kesalahan: ' . $e->getMessage());
        } finally {
            $this->loading = false;
        }
    }

    public function render()
    {
        return view('livewire.penilaian-form', [
            'pemegangs' => Pemegang::orderBy('nama_pelaku_usaha')->get(),
            'tims'      => Tim::orderBy('nama_tim')->get(),
        ]);
    }
}
