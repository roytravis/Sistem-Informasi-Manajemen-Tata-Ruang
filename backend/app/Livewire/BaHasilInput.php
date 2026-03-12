<?php

namespace App\Livewire;

use Livewire\Component;
use Livewire\Attributes\Layout;
use App\Models\Penilaian;
use App\Models\BaHasilPenilaian;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BaHasilInput extends Component
{
    public $penilaianId;
    public $penilaian;

    public $nomor_ba = '';
    public $tanggal_ba = '';
    public $validitas_kegiatan = 'BENAR';
    public $rekomendasi_lanjutan = '';

    public $members = []; 
    public $existingSignatures = [];
    public $newSignatures = [];

    public function mount($penilaianId)
    {
        $this->penilaianId = $penilaianId;
        $this->tanggal_ba = now()->format('Y-m-d');
        $this->loadData();
    }

    public function loadData()
    {
        $this->penilaian = Penilaian::with([
            'kasus.pemegang',
            'kasus.tim.users',
            'kasus.penanggung_jawab',
            'formulirAnalisis',
            'baHasilPenilaian'
        ])->findOrFail($this->penilaianId);

        if (!$this->penilaian->formulirAnalisis) {
            session()->flash('error', 'Formulir Analisis belum dibuat. Harap selesaikan analisis terlebih dahulu.');
            return;
        }

        $baHasil = $this->penilaian->baHasilPenilaian;
        if ($baHasil) {
            $this->nomor_ba = $baHasil->nomor_ba;
            $this->tanggal_ba = $baHasil->tanggal_ba;
            $this->validitas_kegiatan = $baHasil->validitas_kegiatan;
            $this->rekomendasi_lanjutan = $baHasil->rekomendasi_lanjutan;

            if (is_array($baHasil->tanda_tangan_tim)) {
                foreach ($baHasil->tanda_tangan_tim as $sig) {
                    $key = $sig['role'] === 'pemegang' ? 'pemegang' : 'user_' . ($sig['role']); 
                    // To handle unique keys, we construct member keys
                    $this->existingSignatures[$sig['role']] = $sig['signature_path'] ?? null;
                }
            }
        }

        // Build Member List
        $m = [];
        $kasus = $this->penilaian->kasus;

        // 1. Pemegang
        $m['pemegang'] = [
            'id' => 'pemegang',
            'role' => 'pemegang',
            'nama' => $kasus->pemegang ? $kasus->pemegang->nama_pelaku_usaha : '-',
            'nip' => null,
            'jabatan' => 'Pelaku Usaha',
        ];

        // 2. Koordinator Lapangan
        $koordinator = $kasus->penanggung_jawab;
        if (!$koordinator && $kasus->permohonan && $kasus->permohonan->tim) {
            $koordinator = $kasus->permohonan->tim->users->firstWhere('pivot.jabatan_di_tim', 'Koordinator Lapangan');
        }
        if ($koordinator) {
            $m['koordinator_' . $koordinator->id] = [
                'id' => 'koordinator_' . $koordinator->id,
                'role' => 'koordinator_' . $koordinator->id,
                'nama' => $koordinator->nama,
                'nip' => $koordinator->nip,
                'jabatan' => 'Koordinator Lapangan',
            ];
        }

        // 3. Tim (Ketua Tim & Petugas Lapangan)
        if ($kasus->permohonan && $kasus->permohonan->tim) {
            foreach ($kasus->permohonan->tim->users as $user) {
                $jabatan = $user->pivot->jabatan_di_tim;
                if (in_array($jabatan, ['Ketua Tim', 'Petugas Lapangan'])) {
                    $m['tim_' . $user->id] = [
                        'id' => 'tim_' . $user->id,
                        'role' => 'tim_' . $user->id,
                        'nama' => $user->nama,
                        'nip' => $user->nip,
                        'jabatan' => $jabatan,
                    ];
                }
            }
        }

        $this->members = $m;
    }

    public function save()
    {
        $this->validate([
            'tanggal_ba' => 'required|date',
            'validitas_kegiatan' => 'required|in:BENAR,TIDAK BENAR',
            'rekomendasi_lanjutan' => 'required|string',
        ]);

        $finalNomorBa = $this->nomor_ba;
        if (empty($finalNomorBa)) {
            $finalNomorBa = 'BA-HP/' . now()->format('Ymd') . '/' . strtoupper(Str::random(4));
        }

        $processedSignatures = [];
        foreach ($this->members as $key => $member) {
            $path = null;
            $newSig = $this->newSignatures[$key] ?? null;
            $oldSig = $this->existingSignatures[$key] ?? null;

            if (!empty($newSig)) {
                if (Str::startsWith($newSig, 'data:image')) {
                    $path = $this->saveSignatureFile($newSig, 'ttd_bahp_' . Str::slug($member['role']));
                }
            } elseif (!empty($oldSig)) {
                $path = $oldSig;
            }

            $processedSignatures[] = [
                'role' => $member['role'],
                'nama' => $member['nama'],
                'nip' => $member['nip'],
                'jabatan' => $member['jabatan'],
                'signature_path' => $path
            ];
        }

        try {
            DB::beginTransaction();

            $baHasil = BaHasilPenilaian::updateOrCreate(
                ['penilaian_id' => $this->penilaianId],
                [
                    'nomor_ba' => $finalNomorBa,
                    'tanggal_ba' => $this->tanggal_ba,
                    'validitas_kegiatan' => $this->validitas_kegiatan,
                    'rekomendasi_lanjutan' => $this->rekomendasi_lanjutan,
                    'tanda_tangan_tim' => $processedSignatures,
                    'snapshot_petugas' => $processedSignatures,
                ]
            );

            // Check completion
            $requiredSignersCount = count($this->members);
            $signedCount = count(array_filter($processedSignatures, fn($sig) => !empty($sig['signature_path'])));

            if ($signedCount >= $requiredSignersCount && $requiredSignersCount > 0) {
                $kasus = $this->penilaian->kasus;
                $kasus->update(['status' => 'Selesai Dinilai (Verifikasi)']);
                if ($kasus->permohonanPenilaian) {
                    $kasus->permohonanPenilaian->update(['status' => 'Selesai Dinilai (Verifikasi)']);
                }
            }

            DB::commit();
            return redirect()->route('penilaian.ba-hasil', ['penilaianId' => $this->penilaianId])->with('success', 'Berita Acara Hasil Penilaian berhasil disimpan.');

        } catch (\Exception $e) {
            DB::rollBack();
            session()->flash('error', 'Gagal menyimpan: ' . $e->getMessage());
        }
    }

    private function saveSignatureFile($base64Image, $prefix)
    {
        if (preg_match('/^data:image\/(\w+);base64,/', $base64Image, $type)) {
            $data = substr($base64Image, strpos($base64Image, ',') + 1);
            $type = strtolower($type[1]);
            $data = base64_decode($data);
            $fileName = 'signatures/' . $prefix . '_' . Str::uuid() . '.' . $type;
            Storage::disk('public')->put($fileName, $data);
            return $fileName;
        }
        return null;
    }

    #[Layout('layouts.app')]
    public function render()
    {
        return view('livewire.ba-hasil-input');
    }
}
