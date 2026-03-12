<?php

namespace App\Livewire;

use App\Models\EditRequest;
use App\Models\Kasus;
use App\Models\Penilaian;
use App\Models\PermohonanPenilaian;
use App\Notifications\EditRequestNotification;
use App\Notifications\StageCompletionNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('components.layouts.app')]
#[Title('Detail Penilaian')]
class PenilaianDetail extends Component
{
    // --- Route param ---
    public int $id;

    // --- Data state ---
    public ?array $kasusData = null;
    public ?int $penilaianId = null;
    public bool $initialPenilaianExists = false;

    // --- Form data ---
    public array $desk_study = [];
    public array $pemeriksaan = [];
    public array $pengukuran = [];
    public string $catatan = '';

    // --- Signatures (saved paths keyed by user_id) ---
    public array $signatures = [];

    // --- Read-only & Edit Request ---
    public bool $isReadOnly = false;
    public ?array $editRequest = null; // latest edit request data

    // --- UI ---
    public bool $showRequestModal = false;
    public string $requestAlasan = '';
    public string $error = '';
    public bool $pageLoading = true;

    // --- Structures for tables ---
    public array $pemeriksaanStruktur = [];
    public array $pengukuranStruktur = [];

    public function mount(int $id)
    {
        $this->id = $id;
        $this->initStructures();
        $this->loadData();
    }

    private function initStructures()
    {
        $this->pemeriksaanStruktur = [
            ['no' => '1', 'komponen' => 'Lokasi Usaha', 'rowSpan' => 7, 'subKomponen' => 'Alamat'],
            ['no' => null, 'komponen' => null, 'rowSpan' => null, 'subKomponen' => 'Desa/Kelurahan'],
            ['no' => null, 'komponen' => null, 'rowSpan' => null, 'subKomponen' => 'Kecamatan'],
            ['no' => null, 'komponen' => null, 'rowSpan' => null, 'subKomponen' => 'Kabupaten/Kota'],
            ['no' => null, 'komponen' => null, 'rowSpan' => null, 'subKomponen' => 'Provinsi'],
            ['no' => null, 'komponen' => null, 'rowSpan' => null, 'subKomponen' => 'Lintang'],
            ['no' => null, 'komponen' => null, 'rowSpan' => null, 'subKomponen' => 'Bujur'],
            ['no' => '2', 'komponen' => 'Kegiatan Pemanfaatan Ruang', 'rowSpan' => 1, 'subKomponen' => 'Jenis'],
        ];

        $this->pengukuranStruktur = [
            ['no' => '1', 'main' => 'Luas Tanah', 'rowSpan' => 2, 'sub' => 'Luas Tanah yang digunakan kegiatan Pemanfaatan Ruang', 'unit' => 'm²'],
            ['no' => null, 'main' => null, 'rowSpan' => null, 'sub' => 'Luas Tanah yang dikuasai', 'unit' => 'm²'],
            ['no' => '2', 'main' => 'KDB', 'rowSpan' => 1, 'sub' => 'Luas Lantai Dasar Bangunan', 'unit' => 'm²'],
            ['no' => '3', 'main' => 'KLB', 'rowSpan' => 2, 'sub' => 'Jumlah Lantai Bangunan', 'unit' => 'lantai'],
            ['no' => null, 'main' => null, 'rowSpan' => null, 'sub' => 'Luas Seluruh Lantai Bangunan', 'unit' => 'm²'],
            ['no' => '4', 'main' => 'Ketinggian Bangunan', 'rowSpan' => 1, 'sub' => 'Ketinggian Bangunan', 'unit' => 'm'],
            ['no' => '5', 'main' => 'KDH', 'rowSpan' => 2, 'sub' => 'Luas Tanah yang Terdapat Vegetasi', 'unit' => 'm²'],
            ['no' => null, 'main' => null, 'rowSpan' => null, 'sub' => 'Luas Tanah yang Tertutup Perkerasan yang masih dapat meresapkan air', 'unit' => 'm²'],
            ['no' => '6', 'main' => 'Koefisien Tapak Basemen', 'rowSpan' => 1, 'sub' => 'Luas Basemen', 'unit' => 'm²'],
            ['no' => '7', 'main' => 'Garis Sempadan Bangunan', 'rowSpan' => 1, 'sub' => 'Jarak Bangunan Terdepan dengan Pagar', 'unit' => 'm'],
            ['no' => '8', 'main' => 'Jarak Bebas Bangunan', 'rowSpan' => 2, 'sub' => 'Jarak Bangunan Terbelakang dengan Garis Batas Petak Belakang', 'unit' => 'm'],
            ['no' => null, 'main' => null, 'rowSpan' => null, 'sub' => 'Jarak Bangunan Samping dengan Garis Batas Petak Samping', 'unit' => 'm'],
        ];
    }

    private function loadData()
    {
        $this->pageLoading = true;
        $user = Auth::user();

        try {
            // Try to find as Kasus first
            $kasus = Kasus::with([
                'pemegang',
                'penilaian.baHasilPenilaian',
                'tim.users',
                'penanggung_jawab',
                'permohonan.tim.users',
            ])->find($this->id);

            // If not found as Kasus, try as PermohonanPenilaian and initiate
            if (!$kasus) {
                $permohonan = PermohonanPenilaian::with('pemegang', 'tim.users')->findOrFail($this->id);

                $kasus = Kasus::updateOrCreate(
                    ['nomor_permohonan' => $permohonan->nomor_permohonan],
                    [
                        'jenis'              => 'PMP_UMK',
                        'pemegang_id'        => $permohonan->pemegang_id,
                        'tim_id'             => $permohonan->tim_id,
                        'penanggung_jawab_id' => $permohonan->penanggung_jawab_id,
                        'prioritas_score'    => $permohonan->prioritas_score,
                        'status'             => $permohonan->status,
                    ]
                );

                if ($permohonan->status === 'Baru') {
                    $permohonan->update(['status' => 'Menunggu Penilaian']);
                    $kasus->update(['status' => 'Menunggu Penilaian']);
                }

                // Reload with relations
                $kasus->load([
                    'pemegang',
                    'penilaian.baHasilPenilaian',
                    'tim.users',
                    'penanggung_jawab',
                    'permohonan.tim.users',
                ]);

                // Update the ID to reflect the Kasus ID going forward
                $this->id = $kasus->id;
            }

            // Store kasus data as array for view
            $this->kasusData = [
                'id'     => $kasus->id,
                'status' => $kasus->status,
                'pemegang' => $kasus->pemegang ? [
                    'nama_pelaku_usaha' => $kasus->pemegang->nama_pelaku_usaha,
                    'nomor_identitas'   => $kasus->pemegang->nomor_identitas,
                    'alamat'            => $kasus->pemegang->alamat,
                    'desa_kelurahan'    => $kasus->pemegang->desa_kelurahan,
                    'kecamatan'         => $kasus->pemegang->kecamatan,
                    'kegiatan'          => $kasus->pemegang->kegiatan,
                    'email'             => $kasus->pemegang->email,
                    'nomor_handphone'   => $kasus->pemegang->nomor_handphone,
                ] : null,
                'tim' => $kasus->tim ? [
                    'id'    => $kasus->tim->id,
                    'users' => $kasus->tim->users->map(fn($u) => [
                        'id'    => $u->id,
                        'nama'  => $u->nama,
                        'nip'   => $u->nip,
                        'role'  => $u->role,
                        'pivot' => ['jabatan_di_tim' => $u->pivot->jabatan_di_tim ?? ''],
                    ])->toArray(),
                ] : null,
            ];

            $penilaianData = $kasus->penilaian;
            $pemegang = $kasus->pemegang;
            $fullAlamat = implode(', ', array_filter([$pemegang?->alamat, $pemegang?->desa_kelurahan, $pemegang?->kecamatan]));
            $kegiatan = $pemegang?->kegiatan ?? '';

            if ($penilaianData) {
                $this->penilaianId = $penilaianData->id;
                $this->initialPenilaianExists = true;

                // Load edit request status
                $latestEditRequest = EditRequest::where('penilaian_id', $penilaianData->id)
                    ->latest()
                    ->first();

                if ($latestEditRequest) {
                    $this->editRequest = [
                        'id'               => $latestEditRequest->id,
                        'status'           => $latestEditRequest->status,
                        'alasan_penolakan' => $latestEditRequest->alasan_penolakan,
                    ];
                }

                // --- READ-ONLY LOGIC ---
                if ($penilaianData->baHasilPenilaian) {
                    $this->isReadOnly = true;
                } elseif (in_array($kasus->status, ['Baru', 'Menunggu Penilaian', 'Draft'])) {
                    $this->isReadOnly = false;
                } elseif ($latestEditRequest && $latestEditRequest->status === 'approved') {
                    $this->isReadOnly = false;
                } else {
                    // Check if all team member signatures are complete
                    $teamMembers = $kasus->tim?->users?->filter(fn($u) => $u->pivot->jabatan_di_tim === 'Petugas Lapangan') ?? collect();
                    $signedUserIds = collect($penilaianData->tanda_tangan_tim ?? [])->pluck('user_id')->toArray();
                    $allSignaturesComplete = $teamMembers->isNotEmpty() && $teamMembers->every(fn($m) => in_array($m->id, $signedUserIds));
                    $this->isReadOnly = $allSignaturesComplete;
                }

                // --- HYDRATE FORM DATA ---
                $deskStudyData = $penilaianData->desk_study;
                if (empty($deskStudyData)) {
                    $deskStudyData = [[
                        'pernyataan_mandiri_lokasi' => $fullAlamat,
                        'pernyataan_mandiri_jenis'  => $kegiatan,
                        'hasil_kesesuaian'          => 'Sesuai',
                    ]];
                } else {
                    $deskStudyData = array_map(fn($item) => array_merge(['hasil_kesesuaian' => 'Sesuai'], $item), $deskStudyData);
                }
                $this->desk_study = $deskStudyData;

                $this->pemeriksaan = array_pad(
                    array_map(fn($item) => array_merge(['pernyataan_mandiri' => '', 'hasil_pemeriksaan' => 'Sesuai'], $item ?? []),
                        $penilaianData->pemeriksaan ?? []),
                    8,
                    ['pernyataan_mandiri' => '', 'hasil_pemeriksaan' => 'Sesuai']
                );

                $this->pengukuran = array_pad(
                    $penilaianData->pengukuran ?? [],
                    12,
                    ['hasil_pengukuran' => '', 'keterangan' => '']
                );

                $this->catatan = $penilaianData->catatan ?? '';

                // Signatures
                if ($penilaianData->tanda_tangan_tim) {
                    foreach ($penilaianData->tanda_tangan_tim as $sig) {
                        $this->signatures[$sig['user_id']] = $sig['signature_path'];
                    }
                }
            } else {
                // New form
                $this->isReadOnly = false;
                $this->initialPenilaianExists = false;
                $this->desk_study = [[
                    'pernyataan_mandiri_lokasi' => $fullAlamat,
                    'pernyataan_mandiri_jenis'  => $kegiatan,
                    'ketentuan_rtr_jenis'       => '',
                    'ketentuan_rtr_arahan'      => '',
                    'hasil_kesesuaian'          => 'Sesuai',
                ]];
                $this->pemeriksaan = array_fill(0, 8, ['pernyataan_mandiri' => '', 'hasil_pemeriksaan' => 'Sesuai']);
                $this->pengukuran = array_fill(0, 12, ['hasil_pengukuran' => '', 'keterangan' => '']);
                $this->catatan = '';
            }

        } catch (\Exception $e) {
            Log::error("PenilaianDetail loadData error: " . $e->getMessage());
            $this->error = 'Gagal memuat detail data. ' . $e->getMessage();
        } finally {
            $this->pageLoading = false;
        }
    }

    // --- Computed helpers ---

    public function getIsDeskStudyTidakSesuaiProperty(): bool
    {
        return collect($this->desk_study)->contains('hasil_kesesuaian', 'Tidak Sesuai');
    }

    public function getPetugasLapanganProperty(): array
    {
        if (!$this->kasusData || !isset($this->kasusData['tim']['users'])) return [];
        return collect($this->kasusData['tim']['users'])
            ->filter(fn($u) => ($u['pivot']['jabatan_di_tim'] ?? '') === 'Petugas Lapangan')
            ->values()
            ->toArray();
    }

    public function getHasBaHasilProperty(): bool
    {
        if (!$this->penilaianId) return false;
        $penilaian = Penilaian::with('baHasilPenilaian')->find($this->penilaianId);
        return $penilaian && $penilaian->baHasilPenilaian !== null;
    }

    // --- EDIT REQUEST ACTIONS ---

    public function openRequestModal()
    {
        $this->requestAlasan = '';
        $this->showRequestModal = true;
    }

    public function closeRequestModal()
    {
        $this->showRequestModal = false;
        $this->requestAlasan = '';
    }

    public function submitEditRequest()
    {
        $this->validate([
            'requestAlasan' => 'required|string|min:5',
        ]);

        try {
            // Check for existing pending
            $existing = EditRequest::where('penilaian_id', $this->penilaianId)
                ->where('status', 'pending')
                ->first();

            if ($existing) {
                session()->flash('error', 'Permohonan edit Anda sedang diproses dan menunggu persetujuan.');
                $this->closeRequestModal();
                return;
            }

            $editRequest = EditRequest::create([
                'penilaian_id'      => $this->penilaianId,
                'user_id'           => Auth::id(),
                'status'            => 'pending',
                'alasan_permohonan' => $this->requestAlasan,
            ]);

            // Notify Ketua Tim
            $penilaian = Penilaian::with('kasus.tim.users')->find($this->penilaianId);
            $ketuaTim = collect();

            if ($penilaian?->kasus?->tim) {
                $ketuaTim = $penilaian->kasus->tim->users()
                    ->wherePivot('jabatan_di_tim', 'Ketua Tim')
                    ->get();
            }

            if ($ketuaTim->isEmpty()) {
                $ketuaTim = \App\Models\User::whereIn('role', ['Ketua Tim', 'Admin'])->get();
            }

            if ($ketuaTim->isNotEmpty()) {
                Notification::send($ketuaTim, new EditRequestNotification($editRequest, 'requested'));
            }

            $this->editRequest = [
                'id'               => $editRequest->id,
                'status'           => 'pending',
                'alasan_penolakan' => null,
            ];

            $this->closeRequestModal();
            session()->flash('success', 'Permohonan edit berhasil dikirim ke Ketua Tim.');
        } catch (\Exception $e) {
            session()->flash('error', 'Gagal mengirim permohonan: ' . $e->getMessage());
        }
    }

    // --- SAVE ACTIONS ---

    public function saveSignatureData($userId, $base64)
    {
        // Called from Alpine.js when user draws a signature
        // Store temporarily — will be processed on save/draft
        $this->dispatch('signature-stored', userId: $userId);
    }

    public function saveDraft($signatureDataJson = '[]')
    {
        $this->error = '';
        $signatureData = json_decode($signatureDataJson, true) ?? [];

        try {
            DB::beginTransaction();

            $payload = [
                'desk_study'   => $this->desk_study,
                'pemeriksaan'  => $this->pemeriksaan,
                'pengukuran'   => $this->pengukuran,
                'catatan'      => $this->catatan,
            ];

            // Process signatures
            $this->processSignatures($signatureData, $payload);

            $penilaian = Penilaian::updateOrCreate(
                ['kasus_id' => $this->id],
                $payload
            );

            // Update status to Draft
            $kasus = Kasus::find($this->id);
            $finalStatuses = ['Menunggu Verifikasi', 'Penilaian Selesai - Patuh', 'Penilaian Selesai - Tidak Patuh', 'Proses Keberatan', 'Selesai', 'Penilaian Tidak Terlaksana'];

            $permohonan = PermohonanPenilaian::where('nomor_permohonan', $kasus->nomor_permohonan)->first();
            if ($permohonan && !in_array($permohonan->status, $finalStatuses)) {
                $permohonan->update(['status' => 'Draft']);
                if (!in_array($kasus->status, $finalStatuses)) {
                    $kasus->update(['status' => 'Draft']);
                }
            }

            DB::commit();

            session()->flash('success', 'Draft berhasil disimpan!');
            return $this->redirect(route('penilaian'), navigate: false);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("PenilaianDetail saveDraft error: " . $e->getMessage());
            $this->error = 'Gagal menyimpan draft: ' . $e->getMessage();
        }
    }

    public function saveForm($signatureDataJson = '[]')
    {
        $this->error = '';
        $signatureData = json_decode($signatureDataJson, true) ?? [];

        if ($this->isReadOnly) return;

        // --- Validation ---
        $errors = $this->validateFormData();
        if (!empty($errors)) {
            $this->error = 'Harap lengkapi semua field yang ditandai merah.';
            return;
        }

        // Check if current user has signed (if they're a team member)
        $user = Auth::user();
        $petugasLapangan = $this->petugasLapangan;
        $currentUserIsMember = collect($petugasLapangan)->contains(fn($m) => $m['id'] === $user->id);

        if ($currentUserIsMember) {
            $newSigUserIds = collect($signatureData)->pluck('user_id')->toArray();
            $currentUserHasSigned = isset($this->signatures[$user->id]) || in_array($user->id, $newSigUserIds);

            if (!$currentUserHasSigned) {
                $this->error = 'Anda harus memberikan tanda tangan sebelum menyimpan.';
                return;
            }
        }

        try {
            DB::beginTransaction();

            $payload = [
                'desk_study'  => $this->desk_study,
                'catatan'     => $this->catatan,
            ];

            // If desk study "Tidak Sesuai", clear pemeriksaan/pengukuran
            if ($this->isDeskStudyTidakSesuai) {
                $payload['pemeriksaan'] = array_fill(0, 8, ['pernyataan_mandiri' => '', 'hasil_pemeriksaan' => 'Sesuai']);
                $payload['pengukuran'] = array_fill(0, 12, []);
            } else {
                $payload['pemeriksaan'] = $this->pemeriksaan;
                $payload['pengukuran'] = $this->pengukuran;
            }

            // Process signatures
            $this->processSignatures($signatureData, $payload);

            $penilaian = Penilaian::updateOrCreate(
                ['kasus_id' => $this->id],
                $payload
            );

            // Update status
            $kasus = Kasus::find($this->id);
            $kasus->update(['status' => 'Berita Acara Pemeriksaan']);

            $permohonan = PermohonanPenilaian::where('nomor_permohonan', $kasus->nomor_permohonan)->first();
            if ($permohonan) {
                $permohonan->update(['status' => 'Berita Acara Pemeriksaan']);
            }

            // Auto-lock edit request
            $activeRequest = EditRequest::where('penilaian_id', $penilaian->id)
                ->where('status', 'approved')
                ->latest()
                ->first();

            if ($activeRequest) {
                $activeRequest->update([
                    'status'       => 'completed',
                    'processed_at' => now(),
                ]);
            }

            // Send stage completion notifications
            try {
                $kasus->load('permohonan.tim.users', 'penanggung_jawab');
                $recipients = [];

                if ($kasus->penanggung_jawab) {
                    $recipients[] = $kasus->penanggung_jawab;
                }

                if ($kasus->permohonan?->tim) {
                    $ketuaTim = $kasus->permohonan->tim->users()
                        ->wherePivot('jabatan_di_tim', 'Ketua Tim')
                        ->first();

                    if ($ketuaTim && !in_array($ketuaTim->id, array_column($recipients, 'id'))) {
                        $recipients[] = $ketuaTim;
                    }
                }

                $recipients = array_filter($recipients, fn($u) => $u->id !== $user->id);

                if (!empty($recipients)) {
                    Notification::send(array_values($recipients), new StageCompletionNotification($kasus, 1, $user));
                }
            } catch (\Exception $e) {
                Log::error("Stage notification error: " . $e->getMessage());
            }

            DB::commit();

            $msg = $this->initialPenilaianExists
                ? 'Perubahan berhasil disimpan! Formulir akan terkunci kembali.'
                : 'Penilaian berhasil disimpan!';
            session()->flash('success', $msg);
            return $this->redirect(route('penilaian'), navigate: false);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("PenilaianDetail save error: " . $e->getMessage());
            $this->error = 'Gagal menyimpan penilaian: ' . $e->getMessage();
        }
    }

    private function processSignatures(array $signatureData, array &$payload)
    {
        $tandaTanganPaths = [];
        foreach ($signatureData as $sig) {
            if (!empty($sig['signature']) && !empty($sig['user_id'])) {
                $path = $this->saveSignatureFile($sig['signature'], 'ttd_penilai_' . $sig['user_id']);
                $tandaTanganPaths[] = [
                    'user_id'        => $sig['user_id'],
                    'signature_path' => $path,
                ];
            }
        }

        $existingPenilaian = Penilaian::where('kasus_id', $this->id)->first();
        $existingSignatures = $existingPenilaian?->tanda_tangan_tim ?? [];
        $existingSigMap = collect($existingSignatures)->keyBy('user_id');

        foreach ($tandaTanganPaths as $newSig) {
            $existingSigMap[$newSig['user_id']] = $newSig;
        }

        $payload['tanda_tangan_tim'] = $existingSigMap->values()->all();
    }

    private function saveSignatureFile($base64Image, $prefix): string
    {
        if (preg_match('/^data:image\/(\w+);base64,/', $base64Image, $type)) {
            $data = substr($base64Image, strpos($base64Image, ',') + 1);
            $type = strtolower($type[1]);

            if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png'])) {
                throw new \InvalidArgumentException('Tipe gambar tidak valid.');
            }
            $data = base64_decode($data);
            if ($data === false) {
                throw new \RuntimeException('Gagal melakukan decode base64.');
            }
        } else {
            throw new \InvalidArgumentException('Format data URI gambar tidak sesuai.');
        }

        $fileOnlyName = $prefix . '_' . Str::uuid() . '.' . $type;
        $fullPath = 'signatures/' . $fileOnlyName;

        Storage::disk('public')->put($fullPath, $data);

        return $fileOnlyName;
    }

    private function validateFormData(): array
    {
        $errors = [];
        foreach ($this->desk_study as $i => $item) {
            if (empty(trim($item['pernyataan_mandiri_lokasi'] ?? ''))) $errors["desk_study.{$i}.pernyataan_mandiri_lokasi"] = true;
            if (empty(trim($item['pernyataan_mandiri_jenis'] ?? ''))) $errors["desk_study.{$i}.pernyataan_mandiri_jenis"] = true;
            if (empty(trim($item['ketentuan_rtr_jenis'] ?? ''))) $errors["desk_study.{$i}.ketentuan_rtr_jenis"] = true;
            if (empty(trim($item['ketentuan_rtr_arahan'] ?? ''))) $errors["desk_study.{$i}.ketentuan_rtr_arahan"] = true;
        }
        if (!$this->isDeskStudyTidakSesuai) {
            foreach ($this->pemeriksaan as $i => $item) {
                if (empty(trim($item['pernyataan_mandiri'] ?? ''))) $errors["pemeriksaan.{$i}.pernyataan_mandiri"] = true;
            }
        }
        return $errors;
    }

    public function render()
    {
        return view('livewire.penilaian-detail');
    }
}
