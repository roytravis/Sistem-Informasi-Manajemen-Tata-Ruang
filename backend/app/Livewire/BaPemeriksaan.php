<?php

namespace App\Livewire;

use Livewire\Component;
use Livewire\Attributes\Layout;
use App\Models\Kasus;
use App\Models\BaPemeriksaan as BaPemeriksaanModel;
use App\Models\Penilaian;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Notification;
use App\Notifications\StageCompletionNotification;

class BaPemeriksaan extends Component
{
    public $kasusId;
    public $kasus;
    public $isDataSubmitted = false;
    public $isFinal = false;

    // Form data
    public $nomorBa = '';
    public $nomorSpt = '';
    public $namaPemegangTTD = '';
    public $tandaTanganPemegang = null;
    public $namaKoordinatorTTD = '';
    public $tandaTanganKoordinator = null;

    public $teamSignatures = []; // existing signatures
    public $newSignatures = []; // user input from canvas

    // Computed for view
    public $petugasLapanganList = [];
    public $koordinator = null;

    public function mount($kasusId)
    {
        $this->kasusId = $kasusId;
        $this->loadData();
    }

    public function loadData()
    {
        $kasus = Kasus::with(['pemegang', 'penilaian.pemeriksaan', 'penilaian.pengukuran', 'tim.users'])->findOrFail($this->kasusId);
        $this->kasus = $kasus;

        if (!$kasus->penilaian) {
            session()->flash('error', 'Data penilaian belum tersedia.');
            return;
        }

        if ($kasus->penilaian->ba_hasil_penilaian) {
            $this->isFinal = true;
            $this->isDataSubmitted = true;
        }

        $baPemeriksaan = BaPemeriksaanModel::where('penilaian_id', $kasus->penilaian->id)->first();
        
        $this->petugasLapanganList = $kasus->tim ? $kasus->tim->users->filter(function($u) {
            return ($u->pivot->jabatan_di_tim ?? '') === 'Petugas Lapangan';
        })->values()->all() : [];

        $this->koordinator = $kasus->tim ? $kasus->tim->users->filter(function($u) {
            return ($u->pivot->jabatan_di_tim ?? '') === 'Koordinator Lapangan';
        })->first() : null;

        if ($baPemeriksaan && $baPemeriksaan->nomor_ba) {
            $this->nomorBa = $baPemeriksaan->nomor_ba;
            $this->nomorSpt = $baPemeriksaan->nomor_spt;
            $this->tandaTanganPemegang = $baPemeriksaan->tanda_tangan_pemegang;
            $this->namaPemegangTTD = $baPemeriksaan->nama_pemegang ?? $kasus->pemegang->nama_pelaku_usaha;
            $this->tandaTanganKoordinator = $baPemeriksaan->tanda_tangan_koordinator;
            $this->namaKoordinatorTTD = $baPemeriksaan->nama_koordinator ?? ($this->koordinator ? $this->koordinator->nama : '');

            if (is_array($baPemeriksaan->tanda_tangan_tim)) {
                $teamSigs = [];
                foreach ($baPemeriksaan->tanda_tangan_tim as $sig) {
                    if (!empty($sig['signature_path'])) {
                        $teamSigs[$sig['user_id']] = $sig['signature_path'];
                    }
                }
                $this->teamSignatures = $teamSigs;
            }

            // Check completion
            $teamSignedCount = is_array($baPemeriksaan->tanda_tangan_tim) ? count($baPemeriksaan->tanda_tangan_tim) : 0;
            $hasPemegang = !empty($baPemeriksaan->tanda_tangan_pemegang);
            $hasKoord = !empty($baPemeriksaan->tanda_tangan_koordinator);
            
            if ($hasPemegang && $hasKoord && ($teamSignedCount >= count($this->petugasLapanganList))) {
                $this->isDataSubmitted = true;
            }
        } else {
            $this->namaPemegangTTD = $kasus->pemegang ? $kasus->pemegang->nama_pelaku_usaha : '';
            $this->namaKoordinatorTTD = $this->koordinator ? $this->koordinator->nama : '';
        }
    }

    public function save()
    {
        $this->validate([
            'nomorBa' => 'required|string|max:255',
            'nomorSpt' => 'required|string|max:255',
            'namaPemegangTTD' => 'required|string|max:255',
        ]);

        $pemegangSig = !empty($this->newSignatures['pemegang']) ? $this->newSignatures['pemegang'] : $this->tandaTanganPemegang;
        $koordinatorSig = !empty($this->newSignatures['koordinator']) ? $this->newSignatures['koordinator'] : $this->tandaTanganKoordinator;

        $user = auth()->user();
        $isKoord = $user && $this->koordinator && $this->koordinator->id === $user->id;

        if ($isKoord && empty($koordinatorSig)) {
            session()->flash('error', 'Anda harus memberikan tanda tangan Koordinator sebelum menyimpan.');
            return;
        }

        $teamPayload = [];
        $currentUserHasSigned = false;
        $currentUserIsMember = false;

        foreach ($this->petugasLapanganList as $member) {
             if ($user && $member['id'] === $user->id) {
                 $currentUserIsMember = true;
             }

             $newSig = $this->newSignatures['team_'.$member['id']] ?? null;
             $oldSig = $this->teamSignatures[$member['id']] ?? null;
             
             if (!empty($newSig)) {
                 $teamPayload[] = [
                     'user_id' => $member['id'],
                     'nama' => $member['nama'],
                     'nip' => $member['nip'] ?? null,
                     'signature' => $newSig
                 ];
                 if ($user && $member['id'] === $user->id) $currentUserHasSigned = true;
             } elseif (!empty($oldSig)) {
                 $teamPayload[] = [
                     'user_id' => $member['id'],
                     'nama' => $member['nama'],
                     'nip' => $member['nip'] ?? null,
                     'signature' => $oldSig
                 ];
                 if ($user && $member['id'] === $user->id) $currentUserHasSigned = true;
             }
        }

        if ($currentUserIsMember && !$currentUserHasSigned) {
            session()->flash('error', 'Anda harus memberikan tanda tangan sebelum menyimpan.');
            return;
        }

        try {
            // Process signatures
            $processedSigs = [];
            foreach ($teamPayload as $sig) {
                $path = null;
                if (!empty($sig['signature'])) {
                    if (str_starts_with($sig['signature'], 'data:image')) {
                        $path = $this->saveSignatureFile($sig['signature'], 'ttd_ba_tim_' . $sig['user_id']);
                    } else {
                        $path = $sig['signature'];
                    }
                }
                $processedSigs[] = [
                     'user_id' => $sig['user_id'],
                     'nama' => $sig['nama'],
                     'nip' => $sig['nip'] ?? null,
                     'signature_path' => $path
                ];
            }

            $ba = BaPemeriksaanModel::updateOrCreate(
                ['penilaian_id' => $this->kasus->penilaian->id],
                [
                    'nomor_ba' => $this->nomorBa,
                    'nomor_spt' => $this->nomorSpt,
                    'nama_pemegang' => $this->namaPemegangTTD,
                    'tanda_tangan_pemegang' => $pemegangSig,
                    'nama_koordinator' => $this->namaKoordinatorTTD,
                    'tanda_tangan_koordinator' => $koordinatorSig,
                    'tanda_tangan_tim' => $processedSigs
                ]
            );

            // Update status to "Menunggu ANALISIS"
            $kasus = Kasus::find($this->kasusId);
            if ($kasus) {
                $kasus->update(['status' => 'Menunggu ANALISIS']);
                if ($kasus->permohonanPenilaian) { // Changed permohonan to permohonanPenilaian
                    $kasus->permohonanPenilaian->update(['status' => 'Menunggu ANALISIS']);
                }
                // We're omitting StageCompletionNotification here to keep it simple, or it can be added if needed
            }

            $this->loadData();
            $this->isDataSubmitted = true;
            session()->flash('success', 'Data berhasil disimpan.');

        } catch (\Exception $e) {
            if (str_contains($e->getMessage(), 'Duplicate entry') && str_contains($e->getMessage(), 'nomor_ba')) {
                session()->flash('error', 'Gagal menyimpan: Nomor Berita Acara sudah digunakan.');
            } else {
                session()->flash('error', 'Gagal menyimpan data: ' . $e->getMessage());
            }
        }
    }

    public function toggleEditMode()
    {
        $this->isDataSubmitted = false;
    }

    private function saveSignatureFile($base64Image, $prefix)
    {
        if (preg_match('/^data:image\/(\w+);base64,/', $base64Image, $type)) {
            $data = substr($base64Image, strpos($base64Image, ',') + 1);
            $type = strtolower($type[1]);
            if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png'])) {
                throw new \Exception('Tipe gambar tidak valid');
            }
            $data = base64_decode($data);
        } else {
            return null;
        }

        $fileName = 'signatures/' . $prefix . '_' . Str::uuid() . '.' . $type;
        Storage::disk('public')->put($fileName, $data);
        return $fileName;
    }

    #[Layout('layouts.app')]
    public function render()
    {
        $tanggalBA = null;
        if ($this->isDataSubmitted) {
            $tgl = now();
            \Carbon\Carbon::setLocale('id');
            $tanggalBA = [
                'hari' => $tgl->translatedFormat('l'),
                'tanggal' => $tgl->format('d'),
                'bulan' => $tgl->translatedFormat('F'),
                'tahun' => $tgl->format('Y')
            ];
        }

        return view('livewire.ba-pemeriksaan', ['tanggalBA' => $tanggalBA]);
    }
}
