<?php

namespace App\Livewire;

use Livewire\Component;
use Livewire\Attributes\Layout;
use App\Models\Penilaian;

class BaHasilPreview extends Component
{
    public $penilaianId;
    public $baHasil;
    public $penilaian;
    public $tanggalBA;

    public function mount($penilaianId)
    {
        $this->penilaianId = $penilaianId;
        $this->loadData();
    }

    public function loadData()
    {
        $this->penilaian = Penilaian::with([
            'kasus.pemegang',
            'baHasilPenilaian'
        ])->findOrFail($this->penilaianId);
        
        $this->baHasil = $this->penilaian->baHasilPenilaian;

        if (!$this->baHasil) {
            session()->flash('error', 'Berita Acara Hasil Penilaian belum dibuat.');
            return;
        }

        \Carbon\Carbon::setLocale('id');
        $tgl = \Carbon\Carbon::parse($this->baHasil->tanggal_ba);
        $this->tanggalBA = [
            'hari' => $tgl->translatedFormat('l'),
            'tanggal' => $tgl->format('d'),
            'bulan' => $tgl->translatedFormat('F'),
            'tahun' => $tgl->format('Y')
        ];
    }

    #[Layout('layouts.app')]
    public function render()
    {
        return view('livewire.ba-hasil-preview');
    }
}
