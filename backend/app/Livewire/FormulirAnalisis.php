<?php

namespace App\Livewire;

use Livewire\Component;
use Livewire\Attributes\Layout;
use App\Models\Kasus;
use App\Models\Penilaian;
use App\Models\FormulirAnalisisPenilaian;
use App\Models\EditRequest;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\PermohonanPenilaian;
use Illuminate\Support\Facades\DB;

class FormulirAnalisis extends Component
{
    public $kasusId;
    public $kasus;
    public $isReadOnly = false;
    public $isDataSubmitted = false;

    // Form properties matching the database columns
    public $lokasi_kesesuaian_pmp_eksisting;
    public $jenis_kesesuaian_pmp_eksisting;
    public $jenis_ketentuan_rtr;
    public $jenis_kesesuaian_rtr;
    public $luas_digunakan_ketentuan_rtr;
    public $luas_digunakan_kesesuaian_rtr;
    public $luas_dikuasai_ketentuan_rtr;
    public $luas_dikuasai_kesesuaian_rtr;
    
    // KDB
    public $kdb_ketentuan_rtr;
    public $kdb_kesesuaian_rtr;
    public $kdb_rasio_manual;
    public $kdb_persen_manual;
    
    // KLB
    public $klb_luas_tanah;
    public $klb_ketentuan_rtr;
    public $klb_kesesuaian_rtr;
    public $klb_rasio_manual;
    
    // Ketinggian Bangunan
    public $ketinggian_ketentuan_rtr;
    public $ketinggian_kesesuaian_rtr;

    // KDH
    public $kdh_luas_tanah;
    public $kdh_perbandingan_vegetasi;
    public $kdh_ketentuan_rtr;
    public $kdh_kesesuaian_rtr;
    public $kdh_rasio_manual;
    
    // KTB
    public $ktb_luas_tanah;
    public $ktb_ketentuan_rtr;
    public $ktb_kesesuaian_rtr;
    public $ktb_rasio_manual;
    public $ktb_persen_manual;
    
    // GSB & JBB
    public $gsb_ketentuan_rtr;
    public $gsb_kesesuaian_rtr;
    public $jbb_ketentuan_rtr;
    public $jbb_kesesuaian_rtr;

    public $teamSignatures = []; // Existing signatures
    public $newSignatures = [];  // Input signatures from canvas
    public $requiredMembers = []; // Users who need to sign

    public function mount($kasusId)
    {
        $this->kasusId = $kasusId;
        $this->loadData();
    }

    public function loadData()
    {
        $this->kasus = Kasus::with(['pemegang', 'penilaian.pemeriksaan', 'penilaian.pengukuran', 'permohonan.tim.users'])->findOrFail($this->kasusId);

        if (!$this->kasus->penilaian) {
            session()->flash('error', 'Penilaian belum tersedia.');
            return;
        }

        // Setup required members to sign (everyone in the team)
        if ($this->kasus->permohonan && $this->kasus->permohonan->tim) {
             // Sort them
             $users = $this->kasus->permohonan->tim->users;
             $rolePriority = ['Ketua Tim' => 1, 'Koordinator Lapangan' => 2, 'Petugas Lapangan' => 3];
             
             $this->requiredMembers = collect($users)->sortBy(function($m) use ($rolePriority) {
                 return $rolePriority[$m->pivot->jabatan_di_tim ?? ''] ?? 99;
             })->values()->all();
        }

        // Determine if read only
        $activeRequest = EditRequest::where('penilaian_id', $this->kasus->penilaian->id)
                ->where('status', 'approved')
                ->latest()
                ->first();
                
        $formulir = FormulirAnalisisPenilaian::where('penilaian_id', $this->kasus->penilaian->id)->first();
        
        if ($formulir) {
            $this->isDataSubmitted = true;
            $this->isReadOnly = !$activeRequest; // Read only if no active edit request
            $this->fillFormulirData($formulir);
        } else {
            $this->isDataSubmitted = false;
            $this->isReadOnly = false;
            // Pre-fill some defaults if needed (e.g. from pemeriksaan)
        }
    }

    private function fillFormulirData($formulir)
    {
        $fields = [
            'lokasi_kesesuaian_pmp_eksisting', 'jenis_kesesuaian_pmp_eksisting', 'jenis_ketentuan_rtr', 'jenis_kesesuaian_rtr',
            'luas_digunakan_ketentuan_rtr', 'luas_digunakan_kesesuaian_rtr', 'luas_dikuasai_ketentuan_rtr', 'luas_dikuasai_kesesuaian_rtr',
            'kdb_ketentuan_rtr', 'kdb_kesesuaian_rtr', 'kdb_rasio_manual', 'kdb_persen_manual',
            'klb_luas_tanah', 'klb_ketentuan_rtr', 'klb_kesesuaian_rtr', 'klb_rasio_manual',
            'ketinggian_ketentuan_rtr', 'ketinggian_kesesuaian_rtr',
            'kdh_luas_tanah', 'kdh_perbandingan_vegetasi', 'kdh_ketentuan_rtr', 'kdh_kesesuaian_rtr', 'kdh_rasio_manual',
            'ktb_luas_tanah', 'ktb_ketentuan_rtr', 'ktb_kesesuaian_rtr', 'ktb_rasio_manual', 'ktb_persen_manual',
            'gsb_ketentuan_rtr', 'gsb_kesesuaian_rtr', 'jbb_ketentuan_rtr', 'jbb_kesesuaian_rtr'
        ];

        foreach ($fields as $field) {
            $this->$field = $formulir->$field;
        }

        if (is_array($formulir->tanda_tangan_tim)) {
            foreach ($formulir->tanda_tangan_tim as $sig) {
                if (!empty($sig['signature_path'])) {
                    $this->teamSignatures[$sig['user_id']] = $sig['signature_path'];
                }
            }
        }
    }

    public function requestEdit()
    {
        // Panggil saat tombol ajukan edit diklik
        EditRequest::create([
            'penilaian_id' => $this->kasus->penilaian->id,
            'user_id' => auth()->id(),
            'status' => 'pending',
        ]);
        session()->flash('success', 'Permintaan edit telah diajukan dan menunggu persetujuan.');
        $this->loadData();
    }

    public function save()
    {
        if ($this->isReadOnly) return;

        $user = auth()->user();
        if (!$user) return;

        // Process Signatures
        $teamPayload = [];
        $hasCurrentUserSigned = false;
        
        foreach ($this->requiredMembers as $member) {
            $newSig = $this->newSignatures['member_'.$member['id']] ?? null;
            $oldSig = $this->teamSignatures[$member['id']] ?? null;
            
            if ($member['id'] === $user->id) {
                if ($newSig || $oldSig) $hasCurrentUserSigned = true;
            }

            if ($newSig) {
                $teamPayload[] = [
                     'user_id' => $member['id'],
                     'signature' => $newSig
                ];
            } elseif ($oldSig) {
                $teamPayload[] = [
                     'user_id' => $member['id'],
                     'signature' => $oldSig // Just pass path through
                ];
            }
        }

        if (!$hasCurrentUserSigned) {
            session()->flash('error', 'Anda harus memberikan tanda tangan sebelum menyimpan.');
            return;
        }

        try {
            DB::beginTransaction();
            
            // Save Images
            $tandaTanganPaths = [];
            foreach ($teamPayload as $sig) {
                 if (Str::startsWith($sig['signature'], 'data:image')) {
                     $path = $this->saveSignatureFile($sig['signature'], 'ttd_analisis_' . $sig['user_id']);
                     $tandaTanganPaths[] = [
                          'user_id' => $sig['user_id'],
                          'signature_path' => $path
                     ];
                 } else {
                     $tandaTanganPaths[] = [
                          'user_id' => $sig['user_id'],
                          'signature_path' => $sig['signature']
                     ];
                 }
            }

            $fields = [
                'lokasi_kesesuaian_pmp_eksisting', 'jenis_kesesuaian_pmp_eksisting', 'jenis_ketentuan_rtr', 'jenis_kesesuaian_rtr',
                'luas_digunakan_ketentuan_rtr', 'luas_digunakan_kesesuaian_rtr', 'luas_dikuasai_ketentuan_rtr', 'luas_dikuasai_kesesuaian_rtr',
                'kdb_ketentuan_rtr', 'kdb_kesesuaian_rtr', 'kdb_rasio_manual', 'kdb_persen_manual',
                'klb_luas_tanah', 'klb_ketentuan_rtr', 'klb_kesesuaian_rtr', 'klb_rasio_manual',
                'ketinggian_ketentuan_rtr', 'ketinggian_kesesuaian_rtr',
                'kdh_luas_tanah', 'kdh_perbandingan_vegetasi', 'kdh_ketentuan_rtr', 'kdh_kesesuaian_rtr', 'kdh_rasio_manual',
                'ktb_luas_tanah', 'ktb_ketentuan_rtr', 'ktb_kesesuaian_rtr', 'ktb_rasio_manual', 'ktb_persen_manual',
                'gsb_ketentuan_rtr', 'gsb_kesesuaian_rtr', 'jbb_ketentuan_rtr', 'jbb_kesesuaian_rtr'
            ];

            $dataToSave = [];
            foreach ($fields as $field) {
                $dataToSave[$field] = $this->$field;
            }
            $dataToSave['tanda_tangan_tim'] = $tandaTanganPaths;

            $formulir = FormulirAnalisisPenilaian::updateOrCreate(
                ['penilaian_id' => $this->kasus->penilaian->id],
                $dataToSave
            );

            // Auto-lock by closing any edit request
            EditRequest::where('penilaian_id', $this->kasus->penilaian->id)
                ->where('status', 'approved')
                ->update(['status' => 'completed', 'processed_at' => now()]);

            // Update status
            $requiredUserIdsCount = count($this->requiredMembers);
            $signedUserIdsCount = count($tandaTanganPaths);

            if ($signedUserIdsCount >= $requiredUserIdsCount && $requiredUserIdsCount > 0) {
                // Advance stage
                $newStatus = 'Menunggu Berita Acara Hasil Penilaian';
                $this->kasus->update(['status' => $newStatus]);
                if ($this->kasus->permohonanPenilaian) {
                    $this->kasus->permohonanPenilaian->update(['status' => $newStatus]);
                }
            } else {
                $newStatus = 'Proses Formulir Analisis';
                $this->kasus->update(['status' => $newStatus]);
                if ($this->kasus->permohonanPenilaian) {
                    $this->kasus->permohonanPenilaian->update(['status' => $newStatus]);
                }
            }

            DB::commit();
            $this->loadData();
            session()->flash('success', 'Formulir analisis berhasil disimpan.');

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
            return 'signatures/' . basename($fileName);
        }
        return null;
    }

    #[Layout('layouts.app')]
    public function render()
    {
        return view('livewire.formulir-analisis');
    }
}
