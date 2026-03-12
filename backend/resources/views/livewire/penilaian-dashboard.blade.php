<div>
    {{-- Flash Success --}}
    @if(session('success'))
        <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
            {{ session('success') }}
        </div>
    @endif

    <div class="bg-white p-6 rounded-lg shadow-lg">
        {{-- Page Header --}}
        <div class="sm:flex sm:justify-between sm:items-center mb-4">
            <div>
                <h2 class="text-3xl font-bold text-gray-900">Dashboard Penilaian PMP UMK</h2>
                <p class="mt-1 text-gray-600">Daftar permohonan penilaian untuk Pelaku UMK.</p>
            </div>

            {{-- Add button: Admin only --}}
            @if($user->role === 'Admin')
                <a href="{{ route('penilaian.tambah') }}"
                   class="mt-4 sm:mt-0 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition">
                    + Tambah Permohonan Baru
                </a>
            @endif
        </div>

        {{-- Tab Filters --}}
        <div class="border-b border-gray-200 mb-4">
            <nav class="-mb-px flex space-x-6">
                <button wire:click="$set('filter', 'pending')"
                        class="py-3 px-1 border-b-2 font-medium text-sm transition
                        {{ $filter === 'pending' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700' }}">
                    Menunggu Penilaian
                </button>
                <button wire:click="$set('filter', 'all')"
                        class="py-3 px-1 border-b-2 font-medium text-sm transition
                        {{ $filter === 'all' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700' }}">
                    Semua Permohonan
                </button>
            </nav>
        </div>

        {{-- Data Table --}}
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="text-left py-3 px-4 uppercase font-semibold text-sm">Nama Pelaku Usaha</th>
                        <th class="text-left py-3 px-4 uppercase font-semibold text-sm">NIB</th>
                        <th class="text-left py-3 px-4 uppercase font-semibold text-sm">Status</th>
                        <th class="text-left py-3 px-4 uppercase font-semibold text-sm">Aksi</th>
                    </tr>
                </thead>
                <tbody class="text-gray-700 divide-y divide-gray-200">
                    @forelse($pmpList as $p)
                        @php
                            $tidakTerlaksana = $p->status === 'Penilaian Tidak Terlaksana' && $p->berita_acara_id;
                            $isDraft = $p->status === 'Draft';
                            $penilaian = $p->kasus?->penilaian;
                            $sudahDinilai = $penilaian && !$isDraft;
                            $baPemeriksaanDibuat = $penilaian && ($penilaian->baPemeriksaan ?? null);

                            // Formulir Analisis detection
                            $formulirAnalisisDibuat = $penilaian && ($penilaian->has_formulir_analisis || $penilaian->formulirAnalisis);

                            // Signature checks
                            $teamUsers = $p->tim?->users ?? collect();
                            $petugasOnly = $teamUsers->filter(fn($u) => $u->pivot->jabatan_di_tim === 'Petugas Lapangan');

                            $checkAllSigned = function($sigs, $members) {
                                if (!$sigs || !is_array($sigs) || $members->isEmpty()) return false;
                                $signedIds = collect($sigs)->pluck('user_id')->toArray();
                                return $members->every(fn($m) => in_array($m->id, $signedIds));
                            };

                            $formulirSignaturesComplete = $checkAllSigned($penilaian?->tanda_tangan_tim ?? [], $petugasOnly);

                            $deskStudy = $penilaian?->desk_study ?? [];
                            $isDeskStudyTidakSesuai = is_array($deskStudy) && collect($deskStudy)->contains('hasil_kesesuaian', 'Tidak Sesuai');

                            $baLapanganTeamSigned = $penilaian?->baPemeriksaan?->tanda_tangan_tim
                                ? $checkAllSigned($penilaian->baPemeriksaan->tanda_tangan_tim, $petugasOnly) : false;
                            $baLapanganPemegangSigned = !!($penilaian?->baPemeriksaan?->tanda_tangan_pemegang ?? false);
                            $baLapanganKoordSigned = !!($penilaian?->baPemeriksaan?->tanda_tangan_koordinator ?? false);
                            $baLapanganComplete = $baLapanganTeamSigned && $baLapanganPemegangSigned && $baLapanganKoordSigned;

                            $analisisSignaturesComplete = $penilaian?->formulirAnalisis?->tanda_tangan_tim
                                ? $checkAllSigned($penilaian->formulirAnalisis->tanda_tangan_tim, $teamUsers) : false;

                            $isFinalized = $p->status === 'Selesai Dinilai (Verifikasi)' || $p->kasus?->status === 'Selesai Dinilai (Verifikasi)';

                            $showBaLapangan = ($formulirSignaturesComplete && !$isDeskStudyTidakSesuai) || ($isFinalized && $baPemeriksaanDibuat);
                            $showAnalisis = ($formulirSignaturesComplete && $baLapanganComplete && $baPemeriksaanDibuat) || ($isFinalized && $formulirAnalisisDibuat);
                            $showBaHasil = ($formulirSignaturesComplete && $baLapanganComplete && $analisisSignaturesComplete && $formulirAnalisisDibuat) || ($isFinalized && $penilaian?->baHasilPenilaian);

                            $editRequest = $penilaian?->latestEditRequest;
                            $isEditMode = $editRequest && $editRequest->status === 'approved';

                            // Effective status for badge
                            $effectiveStatus = $p->status;
                            if ($effectiveStatus === 'Menunggu Berita Acara Hasil Penilaian' && $formulirAnalisisDibuat && !$analisisSignaturesComplete) {
                                $effectiveStatus = 'Proses Formulir Analisis';
                            }
                        @endphp
                        <tr class="hover:bg-gray-50">
                            <td class="py-3 px-4">
                                <div>{{ $p->pemegang?->nama_pelaku_usaha ?? '-' }}</div>
                                @if($isEditMode)
                                    <div class="mt-1">
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200 animate-pulse">
                                            Izin Edit Aktif
                                        </span>
                                    </div>
                                @endif
                            </td>
                            <td class="py-3 px-4 font-mono">{{ $p->pemegang?->nomor_identitas ?? '-' }}</td>
                            <td class="py-3 px-4">
                                <div class="flex flex-col gap-1">
                                    {{-- Status Badge --}}
                                    @if($tidakTerlaksana)
                                        <span class="py-1 px-3 rounded-full text-xs font-medium bg-gray-200 text-gray-800">Penilaian Tidak Terlaksana</span>
                                    @elseif($effectiveStatus === 'Draft')
                                        <span class="py-1 px-3 rounded-full text-xs font-medium bg-blue-200 text-blue-800">Draft</span>
                                    @elseif($isDeskStudyTidakSesuai)
                                        <span class="py-1 px-3 rounded-full text-xs font-medium bg-red-200 text-red-800">Penilaian Tidak Dapat Dilanjutkan</span>
                                    @elseif($effectiveStatus === 'Selesai Dinilai (Verifikasi)')
                                        <span class="py-1 px-3 rounded-full text-xs font-medium bg-teal-200 text-teal-800">Selesai Dinilai (Verifikasi)</span>
                                    @else
                                        <span class="py-1 px-3 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">{{ $effectiveStatus ?: 'Menunggu' }}</span>
                                    @endif

                                    {{-- Team assignment indicator --}}
                                    @if(!$p->tim_id)
                                        <span class="py-1 px-2 rounded text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                            ⏳ Belum Ditugaskan
                                        </span>
                                    @else
                                        <span class="text-xs text-gray-600">Tim: {{ $p->tim?->nama_tim ?? 'N/A' }}</span>
                                    @endif
                                </div>
                            </td>
                            <td class="py-3 px-4">
                                <div class="flex flex-wrap gap-2">
                                    {{-- Assign Team button (Ketua Tim, no team assigned) --}}
                                    @if(!$p->tim_id && $isKetuaTim)
                                        <button wire:click="openAssignModal({{ $p->id }})"
                                                class="bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-md text-sm flex items-center gap-1 transition"
                                                title="Tugaskan Tim Penilai">
                                            <span>🔔</span> Tugaskan Tim
                                        </button>
                                    @endif

                                    {{-- Main action button (Nilai / Detail / Lanjut) — links to Phase 3 pages --}}
                                    @if(!$tidakTerlaksana && $p->tim_id)
                                        @if($p->kasus?->id)
                                            <a href="{{ route('penilaian.detail', $p->kasus->id) }}"
                                               class="font-semibold py-1 px-3 rounded-md text-sm text-white transition
                                               {{ $isDraft ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700' }}">
                                                {{ $isDraft ? 'Lanjut' : ($sudahDinilai ? 'Detail' : 'Nilai') }}
                                            </a>
                                        @else
                                            <a href="{{ route('penilaian.detail', $p->id) }}"
                                               class="bg-blue-600 hover:bg-blue-700 font-semibold py-1 px-3 rounded-md text-sm text-white transition">
                                                Nilai
                                            </a>
                                        @endif
                                    @endif

                                    {{-- BA Pemeriksaan (Lapangan) --}}
                                    @if($showBaLapangan && !$tidakTerlaksana && $p->kasus?->id)
                                        <a href="{{ route('penilaian.ba-pemeriksaan', $p->kasus->id) }}"
                                           class="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-1 px-3 rounded-md text-sm transition"
                                           title="Berita Acara Pemeriksaan Lapangan">
                                            BA Lapangan
                                        </a>
                                    @endif

                                    {{-- Detail BA (for Tidak Terlaksana) --}}
                                    @if($tidakTerlaksana)
                                        <a href="{{ route('penilaian.ba-preview', $p->berita_acara_id) }}"
                                           class="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-1 px-3 rounded-md text-sm transition"
                                           title="Lihat Berita Acara Tidak Terlaksana">
                                            Detail BA
                                        </a>
                                    @endif

                                    {{-- Formulir Analisis --}}
                                    @if($showAnalisis && $p->kasus?->id)
                                        <a href="{{ route('penilaian.formulir-analisis', $p->kasus->id) }}"
                                           class="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1 px-3 rounded-md text-sm relative transition">
                                            Analisis
                                            @if($isEditMode)
                                                <span class="absolute -top-1 -right-1 flex h-3 w-3">
                                                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                                </span>
                                            @endif
                                        </a>
                                    @endif

                                    {{-- BA Hasil Penilaian --}}
                                    @if($showBaHasil && $penilaian?->id)
                                        <a href="{{ route('penilaian.ba-hasil', $penilaian->id) }}"
                                           class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-3 rounded-md text-sm transition"
                                           title="Berita Acara Hasil Penilaian Akhir">
                                            BA Hasil
                                        </a>
                                    @endif

                                    {{-- Edit button (Admin/Ketua Tim, not Tidak Terlaksana) --}}
                                    @if(!$tidakTerlaksana && $canEditDelete)
                                        <a href="{{ route('penilaian.edit', $p->id) }}"
                                           class="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded-md text-sm transition">
                                            Edit
                                        </a>
                                    @endif

                                    {{-- Delete button (Admin/Ketua Tim) --}}
                                    @if($canEditDelete)
                                        <button wire:click="deletePermohonan({{ $p->id }})"
                                                wire:confirm="Apakah Anda yakin ingin menghapus data permohonan ini?"
                                                class="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md text-sm transition">
                                            Hapus
                                        </button>
                                    @endif
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="4" class="text-center py-10 text-gray-500">Tidak ada data.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        {{-- Pagination --}}
        <div class="mt-4">
            {{ $pmpList->links() }}
        </div>
    </div>

    {{-- ====================== MODAL: ASSIGN TEAM ====================== --}}
    @if($showAssignModal)
        <div class="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50"
             wire:click.self="closeAssignModal">
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h3 class="text-xl font-bold mb-4">Tugaskan Tim Penilai</h3>
                <p class="text-sm text-gray-600 mb-4">
                    Permohonan: <strong>{{ $assignPemegangNama }}</strong><br>
                    Nomor: {{ $assignNomorPermohonan }}
                </p>

                <form wire:submit="assignTeam">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tim Penilai *</label>
                        <select wire:model="assignTimId"
                                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required>
                            <option value="">Pilih Tim Penilai</option>
                            @foreach($tims as $tim)
                                <option value="{{ $tim->id }}">{{ $tim->nama_tim }}</option>
                            @endforeach
                        </select>
                        @error('assignTimId') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                    </div>
                    <div class="flex justify-end space-x-2">
                        <button type="button" wire:click="closeAssignModal"
                                class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Batal</button>
                        <button type="submit"
                                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">Tugaskan Tim</button>
                    </div>
                </form>
            </div>
        </div>
    @endif
</div>
