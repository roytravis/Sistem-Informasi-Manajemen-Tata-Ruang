<div>
    {{-- Print Styles --}}
    <style>
        @page { size: 21cm 33cm; margin: 1.5cm 1cm 1.5cm 1cm; }
        @media print {
            body * { visibility: hidden !important; }
            .printable-area, .printable-area * { visibility: visible !important; }
            .printable-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: none !important; font-size: 11pt; color: #000; background-color: #fff !important; }
            .no-print { display: none !important; }
            .printable-area div, .printable-area p, .printable-area span, .printable-area strong, .printable-area label { color: #000 !important; background-color: transparent !important; font-family: 'Times New Roman', Times, serif; }
            .printable-area table { width: 100% !important; border-collapse: collapse !important; }
            .printable-area th, .printable-area td { border: 1px solid #ccc !important; padding: 3px 5px !important; vertical-align: top !important; }
            .printable-area th { background-color: #f8f8f8 !important; font-weight: bold; }
            .printable-area textarea, .printable-area input, .printable-area select { display: none !important; }
            .printable-area .print-text-block { padding: 0; min-height: 1.1em; display: block !important; }
            .signature-canvas-container { display: none !important; }
            .signature-image-container { display: block !important; text-align: center; }
            .signature-image-container img { max-height: 4.5rem !important; display: inline-block; }
        }
        @media screen { .print-text-block { display: none; } .signature-image-container { display: block; } }
    </style>

    {{-- Loading --}}
    @if($pageLoading)
        <p class="text-center py-10">Memuat formulir...</p>
    @elseif($error && !$kasusData)
        <div class="px-4 py-6 sm:px-0 max-w-2xl mx-auto">
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                <p class="text-sm font-medium text-yellow-800">{{ $error }}</p>
                <p class="mt-2 text-sm text-yellow-700">Silakan hubungi Ketua Tim jika Anda merasa seharusnya memiliki akses.</p>
            </div>
            <div class="mt-4">
                <a href="{{ route('penilaian') }}" class="text-blue-600 hover:underline">← Kembali ke Dashboard Penilaian</a>
            </div>
        </div>
    @elseif($kasusData)

    {{-- Top Bar --}}
    <div class="mb-6 flex justify-between items-center no-print px-4 py-3 bg-white shadow-sm sm:px-6 lg:px-8">
        <a href="{{ route('penilaian') }}" class="text-blue-600 hover:underline">&larr; Kembali ke Dashboard Penilaian</a>
        <div class="flex items-center space-x-2">
            <button onclick="window.print()" class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg text-sm">
                Print
            </button>

            {{-- Edit Request Button --}}
            @if($initialPenilaianExists && in_array(auth()->user()->role, ['Admin', 'Koordinator Lapangan', 'Ketua Tim', 'Petugas Lapangan']))
                @if(!$this->hasBaHasil)
                    @if(($editRequest['status'] ?? null) === 'pending')
                        <button disabled class="bg-orange-100 text-orange-700 font-bold py-2 px-4 rounded-lg text-sm shadow-sm border border-orange-300 cursor-not-allowed">
                            Menunggu Persetujuan
                        </button>
                    @elseif(($editRequest['status'] ?? null) === 'approved')
                        <span class="bg-green-100 text-green-800 font-bold py-2 px-4 rounded-lg text-sm border border-green-300">
                            Mode Edit Aktif
                        </span>
                    @elseif(($editRequest['status'] ?? null) === 'rejected')
                        <div class="flex items-center gap-2">
                            <span class="text-red-600 font-semibold text-xs bg-red-50 px-2 py-1 rounded border border-red-200">Ditolak</span>
                            <button wire:click="openRequestModal" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md">
                                Ajukan Lagi
                            </button>
                        </div>
                    @elseif($isReadOnly)
                        <button wire:click="openRequestModal" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md">
                            Ajukan Edit
                        </button>
                    @endif
                @endif
            @endif
        </div>
    </div>

    {{-- Rejection notice --}}
    @if(($editRequest['status'] ?? null) === 'rejected')
        <div class="max-w-6xl mx-auto mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow no-print">
            <p class="font-bold">Permohonan Edit Ditolak</p>
            <p class="text-sm">Alasan: "{{ $editRequest['alasan_penolakan'] ?? '-' }}"</p>
        </div>
    @endif

    {{-- Main Form --}}
    <div class="printable-area max-w-6xl mx-auto bg-white rounded-lg shadow-lg mb-8"
         x-data="penilaianForm(@js($this->petugasLapangan), @js(auth()->user()->id))"
         x-on:signature-stored.window="onSignatureStored($event.detail)">

        <form @submit.prevent="submitForm" class="p-6 md:p-8 space-y-3">

            {{-- Edit mode info --}}
            @if(!$isReadOnly && ($editRequest['status'] ?? null) === 'approved')
                <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 no-print">
                    <p class="text-blue-700 text-sm font-medium">Anda sedang dalam mode edit. Silakan lakukan perubahan dan simpan untuk mengunci kembali formulir.</p>
                </div>
            @endif

            {{-- Title --}}
            <div class="text-center pt-2">
                <h2 class="text-xl md:text-2xl font-bold text-gray-800">FORMULIR PEMERIKSAAN DAN PENGUKURAN</h2>
                <p class="text-gray-600">Penilaian Pernyataan Mandiri Pelaku Usaha Mikro dan Kecil</p>
            </div>

            {{-- Error --}}
            @if($error)
                <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 no-print" role="alert">
                    <p class="font-bold">Gagal Menyimpan</p>
                    <p>{{ $error }}</p>
                </div>
            @endif

            {{-- Read-only notice --}}
            @if($isReadOnly && $initialPenilaianExists)
                <div class="border-l-4 p-4 no-print {{ $this->hasBaHasil ? 'bg-green-100 border-green-500 text-green-700' : 'bg-blue-100 border-blue-500 text-blue-700' }}" role="alert">
                    <p class="font-bold">{{ $this->hasBaHasil ? 'Status Final' : 'Mode Tampilan (Read Only)' }}</p>
                    <p>{{ $this->hasBaHasil ? 'Penilaian telah selesai (Final). Data tidak dapat diubah lagi.' : "Formulir ini terkunci. Klik tombol 'Ajukan Edit' untuk mengubah data." }}</p>
                </div>
            @endif

            {{-- ==================== SECTION 1: Data Pelaku UMK ==================== --}}
            <fieldset class="border p-3 rounded-md">
                <legend class="text-lg font-semibold px-2">1. Data Pelaku UMK</legend>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mt-1 text-sm p-1">
                    <p><strong class="font-medium text-gray-600 w-32 inline-block">Nama Pelaku Usaha</strong>: {{ $kasusData['pemegang']['nama_pelaku_usaha'] ?? '-' }}</p>
                    <p><strong class="font-medium text-gray-600 w-32 inline-block">Nomor Induk Berusaha</strong>: {{ $kasusData['pemegang']['nomor_identitas'] ?? '-' }}</p>
                    <p class="md:col-span-2"><strong class="font-medium text-gray-600 w-32 inline-block">Alamat</strong>: {{ $kasusData['pemegang']['alamat'] ?? '-' }}</p>
                    <p><strong class="font-medium text-gray-600 w-32 inline-block">Email</strong>: {{ $kasusData['pemegang']['email'] ?? '-' }}</p>
                    <p><strong class="font-medium text-gray-600 w-32 inline-block">Nomor Telepon</strong>: {{ $kasusData['pemegang']['nomor_handphone'] ?? '-' }}</p>
                </div>
            </fieldset>

            {{-- ==================== SECTION 2: Desk Study ==================== --}}
            <fieldset class="border p-3 rounded-md">
                <legend class="text-lg font-semibold px-2">2. Kesesuaian dengan Rencana Tata Ruang (Desk Study)</legend>
                <div class="overflow-x-auto mt-1">
                    <table class="min-w-full text-sm">
                        <thead class="bg-gray-100 text-left">
                            <tr>
                                <th colspan="2" class="p-1 border font-semibold">Ketentuan berdasarkan Pernyataan Mandiri Pelaku UMK</th>
                                <th colspan="2" class="p-1 border font-semibold">Ketentuan dalam RTR</th>
                                <th rowspan="2" class="p-1 border font-semibold align-middle">Hasil Kesesuaian</th>
                            </tr>
                            <tr>
                                <th class="p-1 border font-medium">Lokasi Usaha</th>
                                <th class="p-1 border font-medium">Jenis Kegiatan Usaha</th>
                                <th class="p-1 border font-medium">Jenis Peruntukan</th>
                                <th class="p-1 border font-medium">Arahan/Ketentuan</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($desk_study as $idx => $item)
                                <tr class="border-b">
                                    <td class="p-2 align-top">
                                        <textarea wire:model="desk_study.{{ $idx }}.pernyataan_mandiri_lokasi"
                                                  class="w-full border rounded-md p-1 text-sm {{ $isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300' }}"
                                                  rows="3" placeholder="Alamat & Koordinat" {{ $isReadOnly ? 'disabled' : '' }}></textarea>
                                        <div class="print-text-block whitespace-pre-wrap break-words text-sm">{{ $item['pernyataan_mandiri_lokasi'] ?? '' }}</div>
                                    </td>
                                    <td class="p-2 align-top">
                                        <textarea wire:model="desk_study.{{ $idx }}.pernyataan_mandiri_jenis"
                                                  class="w-full border rounded-md p-1 text-sm {{ $isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300' }}"
                                                  rows="3" placeholder="Jenis Kegiatan" {{ $isReadOnly ? 'disabled' : '' }}></textarea>
                                        <div class="print-text-block whitespace-pre-wrap break-words text-sm">{{ $item['pernyataan_mandiri_jenis'] ?? '' }}</div>
                                    </td>
                                    <td class="p-2 align-top">
                                        <textarea wire:model="desk_study.{{ $idx }}.ketentuan_rtr_jenis"
                                                  class="w-full border rounded-md p-1 text-sm {{ $isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300' }}"
                                                  rows="3" placeholder="Zona Kawasan" {{ $isReadOnly ? 'disabled' : '' }}></textarea>
                                        <div class="print-text-block whitespace-pre-wrap break-words text-sm">{{ $item['ketentuan_rtr_jenis'] ?? '' }}</div>
                                    </td>
                                    <td class="p-2 align-top">
                                        <textarea wire:model="desk_study.{{ $idx }}.ketentuan_rtr_arahan"
                                                  class="w-full border rounded-md p-1 text-sm {{ $isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300' }}"
                                                  rows="3" placeholder="Arahan Pemanfaatan" {{ $isReadOnly ? 'disabled' : '' }}></textarea>
                                        <div class="print-text-block whitespace-pre-wrap break-words text-sm">{{ $item['ketentuan_rtr_arahan'] ?? '' }}</div>
                                    </td>
                                    <td class="p-2 align-top">
                                        <select wire:model.live="desk_study.{{ $idx }}.hasil_kesesuaian"
                                                class="w-full border rounded-md p-1 text-sm {{ $isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300' }}"
                                                {{ $isReadOnly ? 'disabled' : '' }}>
                                            <option value="Sesuai">Sesuai</option>
                                            <option value="Tidak Sesuai">Tidak Sesuai</option>
                                        </select>
                                        <div class="print-text-block text-sm">{{ $item['hasil_kesesuaian'] ?? 'Sesuai' }}</div>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </fieldset>

            {{-- ==================== SECTION 3: Pemeriksaan ==================== --}}
            @php $isPemeriksaanDisabled = $isReadOnly || $this->isDeskStudyTidakSesuai; @endphp
            <fieldset class="border p-3 rounded-md transition-opacity {{ $isPemeriksaanDisabled ? 'bg-gray-50 opacity-60 cursor-not-allowed' : '' }}">
                <legend class="text-lg font-semibold px-2">3. Pemeriksaan</legend>
                @if($this->isDeskStudyTidakSesuai && !$isReadOnly)
                    <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-2 my-1 text-xs no-print" role="alert">
                        Formulir Pemeriksaan dinonaktifkan karena hasil Desk Study adalah "Tidak Sesuai".
                    </div>
                @endif
                <div class="overflow-x-auto mt-1">
                    <table class="min-w-full text-sm">
                        <thead class="bg-gray-100 text-left">
                            <tr>
                                <th class="p-1 border font-semibold w-10">No.</th>
                                <th colspan="2" class="p-1 border font-semibold">Komponen</th>
                                <th class="p-1 border font-semibold">Ketentuan berdasarkan Pernyataan Mandiri</th>
                                <th class="p-1 border font-semibold">Hasil Pemeriksaan</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($pemeriksaanStruktur as $idx => $item)
                                <tr class="border-b">
                                    @if($item['no'])
                                        <td class="p-2 align-top text-center" rowspan="{{ $item['rowSpan'] }}">{{ $item['no'] }}</td>
                                        <td class="p-2 align-top font-medium text-gray-700" rowspan="{{ $item['rowSpan'] }}">{{ $item['komponen'] }}</td>
                                    @endif
                                    <td class="p-2 align-top pl-4 text-gray-600">{{ $item['subKomponen'] }}</td>
                                    <td class="p-2 align-top">
                                        <input type="text" wire:model="pemeriksaan.{{ $idx }}.pernyataan_mandiri"
                                               class="w-full border rounded-md p-1 text-sm {{ $isPemeriksaanDisabled ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300' }}"
                                               {{ $isPemeriksaanDisabled ? 'disabled' : '' }}>
                                        <div class="print-text-block whitespace-pre-wrap break-words text-sm">{{ $pemeriksaan[$idx]['pernyataan_mandiri'] ?? '' }}</div>
                                    </td>
                                    <td class="p-2 align-top">
                                        <select wire:model="pemeriksaan.{{ $idx }}.hasil_pemeriksaan"
                                                class="w-full border rounded-md p-1 text-sm {{ $isPemeriksaanDisabled ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300' }}"
                                                {{ $isPemeriksaanDisabled ? 'disabled' : '' }}>
                                            <option value="Sesuai">Sesuai</option>
                                            <option value="Tidak Sesuai">Tidak Sesuai</option>
                                        </select>
                                        <div class="print-text-block text-sm">{{ $pemeriksaan[$idx]['hasil_pemeriksaan'] ?? 'Sesuai' }}</div>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </fieldset>

            {{-- ==================== SECTION 4: Pengukuran ==================== --}}
            @php $isPengukuranDisabled = $isReadOnly || $this->isDeskStudyTidakSesuai; @endphp
            <fieldset class="border p-3 rounded-md transition-opacity {{ $isPengukuranDisabled ? 'bg-gray-50 opacity-60 cursor-not-allowed' : '' }}">
                <legend class="text-lg font-semibold px-2">4. Pengukuran</legend>
                @if($this->isDeskStudyTidakSesuai && !$isReadOnly)
                    <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-2 my-1 text-xs no-print" role="alert">
                        Formulir Pengukuran dinonaktifkan karena hasil Desk Study adalah "Tidak Sesuai".
                    </div>
                @endif
                <div class="overflow-x-auto mt-1">
                    <table class="min-w-full text-sm">
                        <thead class="bg-gray-100 text-left">
                            <tr>
                                <th class="p-1 border font-semibold w-10">No.</th>
                                <th colspan="2" class="p-1 border font-semibold">Komponen yang Dinilai</th>
                                <th class="p-1 border font-semibold">Hasil Pengukuran</th>
                                <th class="p-1 border font-semibold">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($pengukuranStruktur as $idx => $item)
                                <tr class="border-b">
                                    @if($item['no'])
                                        <td class="p-2 align-top text-center" rowspan="{{ $item['rowSpan'] }}">{{ $item['no'] }}</td>
                                        <td class="p-2 align-top font-medium text-gray-700" rowspan="{{ $item['rowSpan'] }}">{{ $item['main'] }}</td>
                                    @endif
                                    <td class="p-2 align-top pl-4 text-gray-600">{{ $item['sub'] }}</td>
                                    <td class="p-2 align-top">
                                        <div class="flex items-center">
                                            <input type="number" step="any" wire:model="pengukuran.{{ $idx }}.hasil_pengukuran"
                                                   class="w-full border rounded-md p-1 text-sm {{ $isPengukuranDisabled ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300' }}"
                                                   {{ $isPengukuranDisabled ? 'disabled' : '' }}>
                                            @if($item['unit'])
                                                <span class="ml-2 text-sm text-gray-500">{{ $item['unit'] }}</span>
                                            @endif
                                        </div>
                                        <div class="print-text-block text-sm">{{ ($pengukuran[$idx]['hasil_pengukuran'] ?? '') . ($item['unit'] ? ' ' . $item['unit'] : '') }}</div>
                                    </td>
                                    <td class="p-2 align-top">
                                        <select wire:model="pengukuran.{{ $idx }}.keterangan"
                                                class="w-full border rounded-md p-1 text-sm {{ $isPengukuranDisabled ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300' }}"
                                                {{ $isPengukuranDisabled ? 'disabled' : '' }}>
                                            <option value="">Pilih Keterangan</option>
                                            <option value="Sesuai">Sesuai</option>
                                            <option value="Tidak Sesuai">Tidak Sesuai</option>
                                            <option value="Tidak Ada Ketentuan">Tidak Ada Ketentuan</option>
                                            <option value="Belum Dapat Dinilai">Belum Dapat Dinilai</option>
                                            <option value="penilaian tidak dapat dilanjutkan">penilaian tidak dapat dilanjutkan</option>
                                        </select>
                                        <div class="print-text-block text-sm whitespace-normal">{{ $pengukuran[$idx]['keterangan'] ?? '' }}</div>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </fieldset>

            {{-- ==================== Catatan ==================== --}}
            <div>
                <label for="catatan" class="block text-sm font-medium text-gray-700 font-semibold">Catatan Tambahan:</label>
                <textarea id="catatan" wire:model="catatan" rows="3"
                          class="mt-1 block w-full rounded-md shadow-sm {{ $isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300' }}"
                          {{ $isReadOnly ? 'disabled' : '' }}></textarea>
                <div class="print-text-block whitespace-pre-wrap break-words text-sm mt-1 p-1 border border-transparent">{{ $catatan }}</div>
            </div>

            {{-- ==================== SECTION 5: Petugas Penilai ==================== --}}
            <div class="pt-4 border-t mt-4">
                <h3 class="text-lg font-semibold px-2 mb-2">5. Petugas Penilai (Petugas Lapangan)</h3>
                <div class="space-y-2">
                    @php $petugasLapangan = $this->petugasLapangan; @endphp
                    @if(count($petugasLapangan) > 0)
                        @foreach($petugasLapangan as $member)
                            @php
                                $canSign = auth()->user()->id === $member['id'];
                                $signaturePath = $signatures[$member['id']] ?? null;
                                $signatureUrl = $signaturePath
                                    ? url('api/signatures/' . $signaturePath) . '?t=' . time()
                                    : null;
                            @endphp
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 p-2 border rounded-md">
                                <div>
                                    <label class="block text-xs font-medium text-gray-700 font-semibold">Nama Petugas</label>
                                    <p class="mt-0.5 p-1 border rounded-md bg-gray-50 text-sm">{{ $member['nama'] }}</p>
                                    <label class="block text-xs font-medium text-gray-700 font-semibold mt-0.5">NIP/NIK</label>
                                    <p class="mt-0.5 p-1 border rounded-md bg-gray-50 text-sm">{{ $member['nip'] ?? 'Tidak tersedia' }}</p>
                                    <label class="block text-xs font-medium text-gray-700 font-semibold mt-0.5">Jabatan</label>
                                    <p class="mt-0.5 p-1 border rounded-md bg-gray-50 text-sm">{{ $member['pivot']['jabatan_di_tim'] ?? $member['role'] }}</p>
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-gray-700 font-semibold">Tanda Tangan:</label>
                                    {{-- Saved signature image --}}
                                    <div class="my-0.5 signature-image-container">
                                        @if($signatureUrl)
                                            <img src="{{ $signatureUrl }}" alt="Tanda Tangan {{ $member['nama'] }}"
                                                 class="mx-auto h-24 border rounded bg-white">
                                        @else
                                            <div class="h-24 border rounded bg-white flex items-center justify-center text-gray-400 text-xs">(Belum TTD)</div>
                                        @endif
                                    </div>

                                    {{-- Signature canvas (only if not read-only and can sign) --}}
                                    @if(!$isReadOnly && $canSign)
                                        <div class="signature-canvas-container"
                                             x-data="signaturePad({{ $member['id'] }})"
                                             x-init="initPad()">
                                            <div class="border border-gray-300 rounded-md bg-white">
                                                <canvas x-ref="canvas" class="w-full" style="height: 160px;"></canvas>
                                            </div>
                                            <button type="button" @click="clearPad()"
                                                    class="text-xs text-blue-600 hover:underline mt-0.5 no-print">Ulangi</button>
                                        </div>
                                    @elseif(!$isReadOnly && !$canSign)
                                        <p class="text-xs text-gray-500 italic mt-1">Hanya {{ $member['nama'] }} yang dapat menandatangani</p>
                                    @endif
                                </div>
                            </div>
                        @endforeach
                    @else
                        <p class="text-gray-500 text-sm">Tidak ada 'Petugas Lapangan' yang ditugaskan ke tim ini.</p>
                    @endif
                </div>
            </div>

            {{-- ==================== Submit/Draft Buttons ==================== --}}
            @if(!$isReadOnly)
                <div class="flex justify-end pt-3 no-print space-x-3">
                    <button type="button" @click="saveDraft()"
                            class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md disabled:bg-gray-400"
                            :disabled="saving">
                        <span x-show="!draftSaving">Save Draft</span>
                        <span x-show="draftSaving">Menyimpan...</span>
                    </button>

                    <button type="submit"
                            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md disabled:bg-blue-400"
                            :disabled="saving">
                        <span x-show="!formSaving">{{ $initialPenilaianExists ? 'Simpan' : 'Simpan Hasil Penilaian' }}</span>
                        <span x-show="formSaving">Menyimpan...</span>
                    </button>
                </div>
            @endif
        </form>
    </div>

    {{-- ====================== MODAL: REQUEST EDIT ====================== --}}
    @if($showRequestModal)
        <div class="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 px-4"
             wire:click.self="closeRequestModal">
            <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 class="text-xl font-bold mb-3 text-gray-800">Permohonan Edit Data</h3>
                <p class="text-sm text-gray-600 mb-4">
                    Formulir ini terkunci. Untuk melakukan perubahan data yang sudah tersimpan,
                    Anda perlu mengajukan permohonan kepada Ketua Tim.
                </p>

                <form wire:submit="submitEditRequest">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Alasan Perubahan:</label>
                    <textarea wire:model="requestAlasan"
                              class="w-full border border-gray-300 p-2 rounded mb-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              rows="3"
                              placeholder="Contoh: Koreksi salah ketik pada luas tanah..."></textarea>
                    @error('requestAlasan') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror

                    <div class="flex justify-end gap-3 pt-2 border-t">
                        <button type="button" wire:click="closeRequestModal"
                                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 font-medium transition-colors">Batal</button>
                        <button type="submit"
                                class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 font-medium transition-colors disabled:bg-blue-300"
                                wire:loading.attr="disabled">
                            <span wire:loading.remove>Kirim Permohonan</span>
                            <span wire:loading>Mengirim...</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    @endif

    @endif {{-- end kasusData check --}}

    {{-- ====================== SIGNATURE PAD JS (CDN) ====================== --}}
    @push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/signature_pad@4.2.0/dist/signature_pad.umd.min.js"></script>
    @endpush

    <script>
        // Alpine component for the main form (handles signature collection + submit)
        function penilaianForm(petugasLapangan, currentUserId) {
            return {
                saving: false,
                draftSaving: false,
                formSaving: false,
                signaturePads: {},

                registerPad(userId, pad) {
                    this.signaturePads[userId] = pad;
                },

                collectSignatures() {
                    let sigs = [];
                    for (const [userId, pad] of Object.entries(this.signaturePads)) {
                        if (pad && !pad.isEmpty()) {
                            sigs.push({
                                user_id: parseInt(userId),
                                signature: pad.toDataURL()
                            });
                        }
                    }
                    return JSON.stringify(sigs);
                },

                saveDraft() {
                    this.saving = true;
                    this.draftSaving = true;
                    let sigs = this.collectSignatures();
                    @this.call('saveDraft', sigs).then(() => {
                        this.saving = false;
                        this.draftSaving = false;
                    }).catch(() => {
                        this.saving = false;
                        this.draftSaving = false;
                    });
                },

                submitForm() {
                    this.saving = true;
                    this.formSaving = true;
                    let sigs = this.collectSignatures();
                    @this.call('saveForm', sigs).then(() => {
                        this.saving = false;
                        this.formSaving = false;
                    }).catch(() => {
                        this.saving = false;
                        this.formSaving = false;
                    });
                }
            };
        }

        // Alpine component for individual signature pads
        function signaturePad(userId) {
            return {
                pad: null,
                userId: userId,

                initPad() {
                    this.$nextTick(() => {
                        const canvas = this.$refs.canvas;
                        if (canvas && typeof SignaturePad !== 'undefined') {
                            this.pad = new SignaturePad(canvas, {
                                penColor: 'black',
                                backgroundColor: 'rgb(255, 255, 255)'
                            });

                            // Resize canvas to match container
                            const resize = () => {
                                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                                canvas.width = canvas.offsetWidth * ratio;
                                canvas.height = canvas.offsetHeight * ratio;
                                canvas.getContext('2d').scale(ratio, ratio);
                                this.pad.clear();
                            };
                            resize();

                            // Register this pad with the parent form
                            const parentData = Alpine.closestDataStack(this.$el).find(d => d.registerPad);
                            if (parentData) {
                                parentData.registerPad(this.userId, this.pad);
                            }
                        }
                    });
                },

                clearPad() {
                    if (this.pad) this.pad.clear();
                }
            };
        }
    </script>
</div>
