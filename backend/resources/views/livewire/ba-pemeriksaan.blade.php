<div>
    @if($isDataSubmitted)
        {{-- ==================== PREVIEW / PRINT MODE ==================== --}}
        <style>
            @media print {
                body * { visibility: hidden; }
                .printable-area, .printable-area * { visibility: visible; }
                .printable-area { 
                    position: absolute; 
                    left: 0; 
                    top: 0; 
                    width: 100%;
                }
                .no-print { display: none !important; }
            }
        </style>

        <div class="mb-6 flex justify-between items-center no-print">
            <a href="{{ route('penilaian.detail', ['id' => $kasus->penilaian->id]) }}" class="text-blue-600 hover:underline">&larr; Kembali ke Detail Penilaian</a>
            <div class="space-x-2">
                @if(!$isFinal)
                    <button wire:click="toggleEditMode" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md">
                        Edit Data
                    </button>
                @endif
                <button onclick="window.print()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md">
                    Cetak PDF
                </button>
            </div>
        </div>

        <div class="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto printable-area font-serif text-black">
            <div class="text-center font-bold mb-6">
                <h2 class="text-xl uppercase underline">BERITA ACARA PEMERIKSAAN LAPANGAN</h2>
                <h3 class="text-lg uppercase">DALAM RANGKA PENILAIAN PERNYATAAN MANDIRI PELAKU USAHA MIKRO DAN KECIL (UMK)</h3>
            </div>

            <div class="mb-4">
                <p>Nomor SPT: {{ $nomorSpt }}</p>
                <p>Nomor Berita Acara: {{ $nomorBa }}</p>
            </div>

            <p class="mb-4 text-justify">
                Pada hari ini, <strong>{{ $tanggalBA['hari'] ?? '' }}</strong> tanggal <strong>{{ $tanggalBA['tanggal'] ?? '' }}</strong> bulan <strong>{{ $tanggalBA['bulan'] ?? '' }}</strong> tahun <strong>{{ $tanggalBA['tahun'] ?? '' }}</strong>, Tim Penilai berdasarkan Keputusan Kepala Dinas PUTR... telah melakukan pemeriksaan lokasi dengan hasil sebagai berikut:
            </p>

            <div class="mb-6 ml-4">
                <p><strong>A. IDENTITAS PELAKU USAHA</strong></p>
                <table class="w-full ml-4">
                    <tr><td class="w-1/3">Nama Pelaku Usaha</td><td class="w-4">:</td><td>{{ $kasus->pemegang->nama_pelaku_usaha ?? '-' }}</td></tr>
                    <tr><td>Nomor NIB</td><td>:</td><td>{{ $kasus->pemegang->nib ?? '-' }}</td></tr>
                    <tr><td>Alamat</td><td>:</td><td>{{ $kasus->pemegang->alamat ?? '-' }}</td></tr>
                </table>
            </div>

            <div class="mb-6 ml-4">
                <p><strong>B. DATA LOKASI DAN KESESUAIAN KEGIATAN PEMANFAATAN RUANG (KKPR)</strong></p>
                <table class="w-full ml-4">
                    <tr><td class="w-1/3">Alamat Lokasi</td><td class="w-4">:</td><td>{{ $kasus->pemeriksaan->lokasi_kegiatan ?? '-' }}</td></tr>
                    <tr><td class="w-1/3">Titik Koordinat</td><td class="w-4">:</td><td>{{ $kasus->pemeriksaan->titik_koordinat ?? '-' }}</td></tr>
                    <tr><td>Kecamatan / Kelurahan</td><td>:</td><td>{{ $kasus->pemeriksaan->kecamatan ?? '-' }} / {{ $kasus->pemeriksaan->kelurahan ?? '-' }}</td></tr>
                    <tr><td>Peruntukan Pola Ruang</td><td>:</td><td>{{ $kasus->pemeriksaan->rencana_tata_ruang ?? '-' }}</td></tr>
                </table>
            </div>

            <p class="mb-8 text-justify">
                Berita acara ini dibuat dan ditandatangani oleh Tim Penilai, Koordinator Lapangan, dan Pelaku Usaha Pembina UMK dalam keadaan sadar dan tanpa tekanan dari pihak manapun...
            </p>

            <div class="grid grid-cols-2 gap-8 text-center mt-8">
                <div>
                    <p>Mengetahui,</p>
                    <p class="font-bold">Koordinator Lapangan</p>
                    <div class="h-24 flex justify-center items-center my-2">
                         @if($tandaTanganKoordinator)
                             <img src="{{ asset('storage/' . $tandaTanganKoordinator) }}" class="h-full object-contain" crossorigin="anonymous">
                         @endif
                    </div>
                    <p class="font-bold underline">{{ $namaKoordinatorTTD }}</p>
                    <p>NIP. {{ $koordinator ? $koordinator->nip : '................' }}</p>
                </div>
                <div>
                    <p>Yang Membuat Pernyataan,</p>
                    <p class="font-bold">Pelaku Usaha</p>
                    <div class="h-24 flex justify-center items-center my-2">
                         @if($tandaTanganPemegang)
                             <img src="{{ asset('storage/' . $tandaTanganPemegang) }}" class="h-full object-contain" crossorigin="anonymous">
                         @endif
                    </div>
                    <p class="font-bold underline">{{ $namaPemegangTTD }}</p>
                </div>
            </div>

            <div class="mt-8">
                <p class="font-bold text-center">Tim Penilai</p>
                <div class="grid grid-cols-2 gap-6 mt-4 text-center">
                    @foreach($petugasLapanganList as $petugas)
                        <div>
                            <p>Petugas Lapangan</p>
                            <div class="h-20 flex justify-center items-center my-2">
                                 @if(isset($teamSignatures[$petugas['id']]))
                                     <img src="{{ asset('storage/' . $teamSignatures[$petugas['id']]) }}" class="h-full object-contain" crossorigin="anonymous">
                                 @endif
                            </div>
                            <p class="font-bold underline">{{ $petugas['nama'] }}</p>
                            <p>NIP. {{ $petugas['nip'] ?: '................' }}</p>
                        </div>
                    @endforeach
                </div>
            </div>
        </div>

    @else
        {{-- ==================== INPUT FORM MODE ==================== --}}
        <div class="mb-6">
            <a href="{{ route('penilaian.detail', ['id' => $kasus->penilaian->id ?? 0]) }}" class="text-blue-600 hover:underline">&larr; Kembali ke Detail Penilaian</a>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-lg" x-data="signaturePads()">
            <h2 class="text-2xl font-bold mb-6 border-b pb-4">Input Berita Acara Pemeriksaan</h2>

            @if (session()->has('error'))
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    {{ session('error') }}
                </div>
            @endif
            @if (session()->has('success'))
                <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                    {{ session('success') }}
                </div>
            @endif

            <form wire:submit.prevent="save">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nomor Berita Acara *</label>
                        <input type="text" wire:model="nomorBa" class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required>
                        @error('nomorBa') <span class="text-red-500 text-xs">{{ $message }}</span> @enderror
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nomor SPT *</label>
                        <input type="text" wire:model="nomorSpt" class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required>
                        @error('nomorSpt') <span class="text-red-500 text-xs">{{ $message }}</span> @enderror
                    </div>
                </div>

                <div class="border-t pt-6 mb-6">
                    <h3 class="text-lg font-semibold mb-4 text-gray-800">Tanda Tangan Pelaku Usaha</h3>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nama Pelaku Usaha *</label>
                        <input type="text" wire:model="namaPemegangTTD" class="w-full rounded-md border-gray-300 shadow-sm" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tanda Tangan</label>
                        @if($tandaTanganPemegang)
                            <div class="mb-2 p-2 border bg-gray-50 flex flex-col items-center">
                                <img src="{{ asset('storage/' . $tandaTanganPemegang) }}" class="h-24 object-contain">
                                <span class="text-xs text-green-600 font-semibold mt-1">✓ Sudah ditandatangani</span>
                                <button type="button" @click="showPad('pemegang')" class="text-xs text-blue-600 mt-1 mt-2">Ganti Tanda Tangan</button>
                            </div>
                        @else
                            <button type="button" @click="showPad('pemegang')" class="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-3 rounded border">Isi Tanda Tangan</button>
                        @endif

                        <div x-show="padsVisible['pemegang']" class="mt-2" style="display: none;">
                            <div class="border border-gray-300 rounded-md bg-white touch-none" style="height: 150px;" x-ref="canvasContainer_pemegang" x-init="initPad('pemegang')">
                                <canvas id="signature-pad-pemegang" class="w-full h-full cursor-crosshair"></canvas>
                            </div>
                            <button type="button" @click="clearPad('pemegang')" class="text-xs text-red-600 hover:underline mt-1">Hapus / Ulang</button>
                        </div>
                    </div>
                </div>

                <div class="border-t pt-6 mb-6">
                    <h3 class="text-lg font-semibold mb-4 text-gray-800">Tanda Tangan Koordinator Lapangan</h3>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nama Koordinator *</label>
                        <input type="text" wire:model="namaKoordinatorTTD" class="w-full rounded-md border-gray-300 shadow-sm" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tanda Tangan</label>
                        @if($tandaTanganKoordinator)
                            <div class="mb-2 p-2 border bg-gray-50 flex flex-col items-center">
                                <img src="{{ asset('storage/' . $tandaTanganKoordinator) }}" class="h-24 object-contain">
                                <span class="text-xs text-green-600 font-semibold mt-1">✓ Sudah ditandatangani</span>
                                <button type="button" @click="showPad('koordinator')" class="text-xs text-blue-600 mt-1 mt-2">Ganti Tanda Tangan</button>
                            </div>
                        @else
                            <button type="button" @click="showPad('koordinator')" class="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-3 rounded border">Isi Tanda Tangan</button>
                        @endif

                        <div x-show="padsVisible['koordinator']" class="mt-2" style="display: none;">
                            <div class="border border-gray-300 rounded-md bg-white touch-none" style="height: 150px;" x-ref="canvasContainer_koordinator" x-init="initPad('koordinator')">
                                <canvas id="signature-pad-koordinator" class="w-full h-full cursor-crosshair"></canvas>
                            </div>
                            <button type="button" @click="clearPad('koordinator')" class="text-xs text-red-600 hover:underline mt-1">Hapus / Ulang</button>
                        </div>
                    </div>
                </div>

                <div class="border-t pt-6 mb-8">
                    <h3 class="text-lg font-semibold mb-4 text-gray-800">Tanda Tangan Petugas Lapangan</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        @foreach($petugasLapanganList as $petugas)
                            <div class="border rounded p-4 bg-gray-50">
                                <p class="font-semibold">{{ $petugas['nama'] }}</p>
                                <p class="text-xs text-gray-500 mb-3">NIP: {{ $petugas['nip'] ?: 'Belum diisi' }}</p>
                                
                                @if(isset($teamSignatures[$petugas['id']]))
                                    <div class="mb-2 p-2 border bg-white flex flex-col items-center">
                                        <img src="{{ asset('storage/' . $teamSignatures[$petugas['id']]) }}" class="h-20 object-contain">
                                        <span class="text-xs text-green-600 font-semibold mt-1">✓ Sudah ditandatangani</span>
                                        <button type="button" @click="showPad('team_{{ $petugas['id'] }}')" class="text-xs text-blue-600 mt-2">Ganti Tanda Tangan</button>
                                    </div>
                                @else
                                    <button type="button" @click="showPad('team_{{ $petugas['id'] }}')" class="text-sm bg-white hover:bg-gray-100 text-gray-800 py-1 px-3 rounded border w-full">Isi Tanda Tangan</button>
                                @endif

                                <div x-show="padsVisible['team_{{ $petugas['id'] }}']" class="mt-2" style="display: none;">
                                    <div class="border border-gray-300 rounded-md bg-white touch-none" style="height: 150px;" x-ref="canvasContainer_team_{{ $petugas['id'] }}" x-init="initPad('team_{{ $petugas['id'] }}')">
                                        <canvas id="signature-pad-team_{{ $petugas['id'] }}" class="w-full h-full cursor-crosshair"></canvas>
                                    </div>
                                    <button type="button" @click="clearPad('team_{{ $petugas['id'] }}')" class="text-xs text-red-600 hover:underline mt-1">Hapus / Ulang</button>
                                </div>
                            </div>
                        @endforeach
                    </div>
                </div>

                <div class="flex justify-end pt-4 border-t">
                    <button type="submit" @click="saveSignatures" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg shadow-md disabled:bg-blue-300" wire:loading.attr="disabled">
                        <span wire:loading.remove>Simpan Berita Acara</span>
                        <span wire:loading>Menyimpan...</span>
                    </button>
                </div>
            </form>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js"></script>
        <script>
            document.addEventListener('alpine:init', () => {
                Alpine.data('signaturePads', () => ({
                    pads: {},
                    padsVisible: {
                        'pemegang': {{ $tandaTanganPemegang ? 'false' : 'true' }},
                        'koordinator': {{ $tandaTanganKoordinator ? 'false' : 'true' }},
                        @foreach($petugasLapanganList as $p)
                           'team_{{ $p['id'] }}': {{ isset($teamSignatures[$p['id']]) ? 'false' : 'true' }},
                        @endforeach
                    },

                    showPad(key) {
                        this.padsVisible[key] = true;
                        setTimeout(() => this.resizeCanvas(key), 50); // Ensure pad initializes properly after shown
                    },

                    initPad(key) {
                        const canvas = document.getElementById('signature-pad-' + key);
                        if (canvas) {
                            const pad = new SignaturePad(canvas, { backgroundColor: 'rgba(255, 255, 255, 0)', penColor: 'black' });
                            this.pads[key] = pad;
                            this.resizeCanvas(key);
                            
                            window.addEventListener("resize", () => {
                                 if(this.padsVisible[key]) this.resizeCanvas(key);
                            });
                        }
                    },

                    resizeCanvas(key) {
                        const canvas = document.getElementById('signature-pad-' + key);
                        if (!canvas) return;
                        const ratio = Math.max(window.devicePixelRatio || 1, 1);
                        const data = this.pads[key] ? this.pads[key].toData() : null;
                        canvas.width = canvas.offsetWidth * ratio;
                        canvas.height = canvas.offsetHeight * ratio;
                        canvas.getContext("2d").scale(ratio, ratio);
                        if (data && this.pads[key]) this.pads[key].fromData(data);
                    },

                    clearPad(key) {
                        if (this.pads[key]) {
                            this.pads[key].clear();
                            @this.set('newSignatures.' + key, null);
                        }
                    },

                    saveSignatures() {
                        Object.keys(this.pads).forEach(key => {
                            if (this.padsVisible[key] && !this.pads[key].isEmpty()) {
                                @this.set('newSignatures.' + key, this.pads[key].toDataURL());
                            }
                        });
                    }
                }));
            });
        </script>
    @endif
</div>
