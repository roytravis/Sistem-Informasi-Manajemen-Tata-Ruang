<?php

namespace App\Livewire;

use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Url;
use Livewire\Attributes\Validate;
use App\Models\Tim;
use App\Models\User;
use App\Models\BeritaAcara;
use App\Models\PermohonanPenilaian;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\Pemegang;

class BeritaAcaraForm extends Component
{
    #[Url]
    public $pemegang_id;

    #[Url]
    public $tim_id;

    #[Url]
    public $koordinator_id;

    #[Validate('required|string|max:255|unique:berita_acaras,nomor_ba')]
    public $nomor_ba = '';

    #[Validate('required|string|in:Tidak dapat dihubungi,Lokasi tidak ditemukan,Lainnya')]
    public $alasan = '';

    #[Validate('nullable|string|required_if:alasan,Lainnya')]
    public $keterangan_lainnya = '';

    #[Validate('required|date')]
    public $tanggal_ba = '';

    // Kami akan menggunakan array untuk menyimpan signature base64 per user_id
    // kuncinya adalah user_id, nilainya adalah gambar base64
    public $signatures = [];

    public $timPenilaiMembers = [];
    public $loading = true;

    public function mount()
    {
        $this->tanggal_ba = now()->format('Y-m-d');

        if (!$this->pemegang_id || !$this->tim_id) {
            session()->flash('error', 'Data Pelaku Usaha atau Tim tidak valid. Silakan kembali dan coba lagi.');
            $this->loading = false;
            return;
        }

        $tim = Tim::with('users')->find($this->tim_id);

        if (!$tim || $tim->users->isEmpty()) {
            session()->flash('error', 'Tim yang dipilih tidak ditemukan atau tidak memiliki anggota.');
            $this->loading = false;
            return;
        }

        $allMembers = $tim->users;

        // Sort members by role priority
        $rolePriority = [
            'Ketua Tim' => 1,
            'Koordinator Lapangan' => 2,
            'Petugas Lapangan' => 3
        ];

        $sortedMembers = $allMembers->sortBy(function ($member) use ($rolePriority) {
            $role = $member->pivot->jabatan_di_tim ?? '';
            return $rolePriority[$role] ?? 99;
        })->values()->all();

        $this->timPenilaiMembers = $sortedMembers;

        foreach ($this->timPenilaiMembers as $member) {
            $this->signatures[$member->id] = null;
        }

        $this->loading = false;
    }

    public function submit()
    {
        $this->validate();

        if (empty($this->timPenilaiMembers)) {
            session()->flash('error', 'Tidak bisa menyimpan karena tim tidak memiliki anggota.');
            return;
        }

        // Pastikan semua anggota tim memiliki tanda tangan
        $allSigned = true;
        foreach ($this->timPenilaiMembers as $member) {
            if (empty($this->signatures[$member->id])) {
                $allSigned = false;
                break;
            }
        }

        if (!$allSigned) {
            session()->flash('error', 'Semua anggota tim harus memberikan tanda tangan.');
            return;
        }

        try {
            DB::beginTransaction();
            
            // 1. Proses penyimpanan tanda tangan
            $tandaTanganPaths = [];
            foreach ($this->timPenilaiMembers as $member) {
                $base64Image = $this->signatures[$member->id];
                $path = $this->saveSignature($base64Image, 'ttd_ba_' . $member->id);
                $tandaTanganPaths[] = [
                    'user_id' => $member->id,
                    'signature_path' => $path
                ];
            }

            // 2. Buat Berita Acara (BA)
            $beritaAcara = BeritaAcara::create([
                'nomor_ba' => $this->nomor_ba,
                'pemegang_id' => $this->pemegang_id,
                'koordinator_id' => $this->koordinator_id,
                'alasan' => $this->alasan,
                'keterangan_lainnya' => $this->alasan === 'Lainnya' ? $this->keterangan_lainnya : null,
                'tanggal_ba' => $this->tanggal_ba,
                'tanda_tangan_tim' => $tandaTanganPaths,
            ]);
            
            $timPenilaiIds = collect($this->timPenilaiMembers)->pluck('id')->toArray();
            $beritaAcara->timPenilai()->attach($timPenilaiIds);

            // 3. (REQUIREMENT BARU) Buat PermohonanPenilaian terkait
            // Buat nomor permohonan unik berdasarkan nomor BA
            $nomorPermohonan = 'PMP-' . $this->nomor_ba;

            PermohonanPenilaian::create([
                'nomor_permohonan' => $nomorPermohonan,
                'status' => 'Penilaian Tidak Terlaksana', // Status sesuai permintaan
                'pemegang_id' => $this->pemegang_id,
                'tim_id' => $this->tim_id,
                'penanggung_jawab_id' => $this->koordinator_id,
                'berita_acara_id' => $beritaAcara->id, // Tautkan BA yang baru dibuat
                'prioritas_score' => 0, // Default score
            ]);

            DB::commit();

            return redirect()->route('penilaian.ba-preview', ['baId' => $beritaAcara->id]);
        } catch (\Exception $e) {
            DB::rollBack();
            if (str_contains($e->getMessage(), 'Duplicate entry')) {
                 session()->flash('error', 'Gagal menyimpan: Nomor Berita Acara atau Nomor Permohonan sudah ada.');
            } else {
                 session()->flash('error', 'Gagal menyimpan berita acara: ' . $e->getMessage());
            }
        }
    }

    private function saveSignature($base64Image, $prefix)
    {
        if (preg_match('/^data:image\/(\w+);base64,/', $base64Image, $type)) {
            $data = substr($base64Image, strpos($base64Image, ',') + 1);
            $type = strtolower($type[1]);

            if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png'])) {
                throw new \Exception('invalid image type');
            }
            $data = base64_decode($data);

            if ($data === false) {
                throw new \Exception('base64_decode failed');
            }
        } else {
            throw new \Exception('did not match data URI with image data');
        }

        $fileName = 'signatures/' . $prefix . '_' . Str::uuid() . '.' . $type;
        Storage::disk('public')->put($fileName, $data);
        return $fileName;
    }

    #[Layout('layouts.app')]
    public function render()
    {
        return view('livewire.berita-acara-form');
    }
}
