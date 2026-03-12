<?php

namespace App\Livewire;

use Livewire\Component;
use Livewire\Attributes\Layout;
use App\Models\BeritaAcara;
use Carbon\Carbon;

class BeritaAcaraPreview extends Component
{
    public $ba;
    public $timPenilai = [];
    public $tanggalBeritaAcaraStr;
    public $alasanText;
    public $signatureMap = [];

    public function mount($baId)
    {
        $beritaAcara = BeritaAcara::with(['pemegang', 'koordinator', 'timPenilai', 'permohonanPenilaian.tim.users'])->findOrFail($baId);
        $this->ba = $beritaAcara;

        // Ambil data tim dari permohonan penilaian jika ada
        $timUsers = collect([]);
        if ($beritaAcara->permohonanPenilaian && $beritaAcara->permohonanPenilaian->tim) {
            $timUsers = $beritaAcara->permohonanPenilaian->tim->users;
        }

        $allMembers = $beritaAcara->timPenilai->map(function ($user) use ($timUsers) {
            $timUser = $timUsers->firstWhere('id', $user->id);
            $jabatan = $timUser ? $timUser->pivot->jabatan_di_tim : 'Petugas Lapangan';

            return [
                'id' => $user->id,
                'nama' => $user->nama,
                'nip' => $user->nip,
                'jabatan' => $jabatan,
                'role' => $user->role,
            ];
        });

        $koordinator = $beritaAcara->koordinator;
        if ($koordinator && !$allMembers->contains('id', $koordinator->id)) {
             $timUser = $timUsers->firstWhere('id', $koordinator->id);
             $jabatan = $timUser ? $timUser->pivot->jabatan_di_tim : 'Koordinator Lapangan';

             $allMembers->push([
                'id' => $koordinator->id,
                'nama' => $koordinator->nama,
                'nip' => $koordinator->nip,
                'jabatan' => $jabatan,
                'role' => $koordinator->role,
             ]);
        }

        $rolePriority = [
            'Ketua Tim' => 1,
            'Koordinator Lapangan' => 2,
            'Petugas Lapangan' => 3,
        ];

        $this->timPenilai = $allMembers->sortBy(function ($member) use ($rolePriority) {
            return $rolePriority[$member['jabatan']] ?? 99;
        })->values()->all();

        // Peta tanda tangan
        $this->signatureMap = collect($beritaAcara->tanda_tangan_tim ?? [])->reduce(function ($carry, $item) {
            $carry[$item['user_id']] = $item['signature_path'];
            return $carry;
        }, []);

        Carbon::setLocale('id'); 
        $date = Carbon::parse($beritaAcara->tanggal_ba);

        $this->tanggalBeritaAcaraStr = [
            'weekday' => $date->translatedFormat('l'),
            'day' => $date->format('d'),
            'month' => $date->translatedFormat('F'),
            'year' => $date->format('Y'),
        ];

        if ($beritaAcara->alasan === 'Lainnya') {
            $this->alasanText = $beritaAcara->keterangan_lainnya;
        } elseif ($beritaAcara->alasan === 'Tidak dapat dihubungi') {
            $this->alasanText = 'dapat dihubungi';
        } elseif ($beritaAcara->alasan === 'Lokasi tidak ditemukan') {
            $this->alasanText = 'ditemukan';
        }
    }

    #[Layout('layouts.app')]
    public function render()
    {
        return view('livewire.berita-acara-preview');
    }
}
