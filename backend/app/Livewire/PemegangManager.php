<?php

namespace App\Livewire;

use App\Models\Pemegang;
use Illuminate\Validation\Rule;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;
use Livewire\WithPagination;

#[Layout('components.layouts.app')]
#[Title('Pemegang Usaha')]
class PemegangManager extends Component
{
    use WithPagination;

    // --- Search ---
    public string $search = '';

    // --- Modal State ---
    public bool $showModal = false;
    public bool $showDeleteModal = false;
    public ?int $editingId = null;
    public ?int $deletingId = null;

    // --- Form Fields ---
    public string $nama_pelaku_usaha = '';
    public string $nomor_identitas = '';
    public string $kegiatan = '';
    public string $alamat = '';
    public string $desa_kelurahan = '';
    public string $kecamatan = '';
    public string $email = '';
    public string $nomor_handphone = '';

    // Reset pagination when search changes
    public function updatingSearch()
    {
        $this->resetPage();
    }

    // --- Validation Rules ---
    protected function rules(): array
    {
        $uniqueRule = Rule::unique('pemegangs', 'nomor_identitas');
        if ($this->editingId) {
            $uniqueRule = $uniqueRule->ignore($this->editingId);
        }

        return [
            'nama_pelaku_usaha' => 'required|string|max:255',
            'nomor_identitas'   => ['required', 'string', 'max:255', $uniqueRule],
            'kegiatan'          => 'required|string|max:255',
            'alamat'            => 'required|string',
            'desa_kelurahan'    => 'required|string|max:255',
            'kecamatan'         => 'required|string|max:255',
            'email'             => 'nullable|email|max:255',
            'nomor_handphone'   => 'nullable|string|max:255',
        ];
    }

    // --- Actions ---

    public function openCreateModal()
    {
        $this->resetForm();
        $this->editingId = null;
        $this->showModal = true;
    }

    public function openEditModal(int $id)
    {
        $pemegang = Pemegang::findOrFail($id);
        $this->editingId        = $pemegang->id;
        $this->nama_pelaku_usaha = $pemegang->nama_pelaku_usaha;
        $this->nomor_identitas   = $pemegang->nomor_identitas;
        $this->kegiatan          = $pemegang->kegiatan;
        $this->alamat            = $pemegang->alamat;
        $this->desa_kelurahan    = $pemegang->desa_kelurahan;
        $this->kecamatan         = $pemegang->kecamatan;
        $this->email             = $pemegang->email ?? '';
        $this->nomor_handphone   = $pemegang->nomor_handphone ?? '';
        $this->showModal = true;
    }

    public function save()
    {
        $validated = $this->validate();

        if ($this->editingId) {
            $pemegang = Pemegang::findOrFail($this->editingId);
            $pemegang->update($validated);
            session()->flash('success', 'Data pemegang usaha berhasil diperbarui.');
        } else {
            Pemegang::create($validated);
            session()->flash('success', 'Data pemegang usaha berhasil ditambahkan.');
        }

        $this->closeModal();
    }

    public function confirmDelete(int $id)
    {
        $this->deletingId = $id;
        $this->showDeleteModal = true;
    }

    public function delete()
    {
        Pemegang::findOrFail($this->deletingId)->delete();
        $this->showDeleteModal = false;
        $this->deletingId = null;
        session()->flash('success', 'Data pemegang usaha berhasil dihapus.');
    }

    public function closeModal()
    {
        $this->showModal = false;
        $this->resetForm();
        $this->resetValidation();
    }

    public function closeDeleteModal()
    {
        $this->showDeleteModal = false;
        $this->deletingId = null;
    }

    private function resetForm()
    {
        $this->nama_pelaku_usaha = '';
        $this->nomor_identitas = '';
        $this->kegiatan = '';
        $this->alamat = '';
        $this->desa_kelurahan = '';
        $this->kecamatan = '';
        $this->email = '';
        $this->nomor_handphone = '';
    }

    public function render()
    {
        $pemegangs = Pemegang::query()
            ->when($this->search, function ($query) {
                $query->where('nama_pelaku_usaha', 'like', '%' . $this->search . '%')
                      ->orWhere('nomor_identitas', 'like', '%' . $this->search . '%')
                      ->orWhere('kegiatan', 'like', '%' . $this->search . '%')
                      ->orWhere('kecamatan', 'like', '%' . $this->search . '%');
            })
            ->orderBy('nama_pelaku_usaha')
            ->paginate(10);

        return view('livewire.pemegang-manager', [
            'pemegangs' => $pemegangs,
        ]);
    }
}
