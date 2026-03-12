<div>
    <div class="mb-6 flex justify-between items-center no-print">
        <a href="{{ route('penilaian.detail', ['id' => $kasus->penilaian->id ?? 0]) }}" class="text-blue-600 hover:underline">&larr; Kembali ke Detail Penilaian</a>
        <div class="space-x-2">
            @if($isReadOnly)
                <button wire:click="requestEdit" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow-md" onclick="return confirm('Ajukan permintaan edit?')">
                    Ajukan Edit
                </button>
            @endif
            <button onclick="window.print()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md">
                Cetak PDF
            </button>
        </div>
    </div>

    @if (session()->has('success'))
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{{ session('success') }}</div>
    @endif
    @if (session()->has('error'))
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{{ session('error') }}</div>
    @endif

    <div class="bg-white p-8 rounded-lg shadow-lg" x-data="signaturePads()">
        <h2 class="text-2xl font-bold mb-6 text-center border-b pb-4">FORMULIR ANALISIS PENILAIAN PERNYATAAN MANDIRI PELAKU UMK</h2>

        <form wire:submit.prevent="save">
            <!-- IDENTITAS PELAKU USAHA -->
            <div class="mb-6">
                <h3 class="text-lg font-semibold mb-2">1. Identitas Pelaku Usaha (Data OSS)</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded border">
                    <div>
                        <p class="text-sm text-gray-500">Nama Pelaku Usaha/Perusahaan</p>
                        <p class="font-medium">{{ $kasus->pemegang->nama_pelaku_usaha ?? '-' }}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Nomor NIB</p>
                        <p class="font-medium">{{ $kasus->pemegang->nib ?? '-' }}</p>
                    </div>
                    <div class="md:col-span-2">
                        <p class="text-sm text-gray-500">Alamat</p>
                        <p class="font-medium">{{ $kasus->pemegang->alamat ?? '-' }}</p>
                    </div>
                </div>
            </div>

            <!-- DATA LOKASI DAN KKPR -->
            <div class="mb-6">
                <h3 class="text-lg font-semibold mb-2">2. Data Lokasi dan KKPR</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded border">
                    <div>
                        <p class="text-sm text-gray-500">Alamat Lokasi</p>
                        <p class="font-medium">{{ $kasus->penilaian->pemeriksaan->lokasi_kegiatan ?? '-' }}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Koordinat</p>
                        <p class="font-medium">{{ $kasus->penilaian->pemeriksaan->titik_koordinat ?? '-' }}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Kecamatan</p>
                        <p class="font-medium">{{ $kasus->penilaian->pemeriksaan->kecamatan ?? '-' }}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Kelurahan/Desa</p>
                        <p class="font-medium">{{ $kasus->penilaian->pemeriksaan->kelurahan ?? '-' }}</p>
                    </div>
                </div>
            </div>

            <!-- ANALISIS KESESUAIAN -->
            <div class="mb-6 overflow-x-auto">
                <h3 class="text-lg font-semibold mb-2">3. Analisis Kesesuaian KDB, KLB, KDH, GSB, JBB</h3>
                <table class="min-w-full border-collapse border border-gray-300">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="border border-gray-300 px-4 py-2" rowspan="2">No</th>
                            <th class="border border-gray-300 px-4 py-2" rowspan="2">Aspek</th>
                            <th class="border border-gray-300 px-4 py-2" colspan="2">Ketentuan (RTR/OSS)</th>
                            <th class="border border-gray-300 px-4 py-2" colspan="2">Kesesuaian (Hasil Ukur)</th>
                        </tr>
                        <tr>
                            <th class="border border-gray-300 px-4 py-2 text-sm italic">Input Manual</th>
                            <th class="border border-gray-300 px-4 py-2 text-sm italic">Input Manual/Hasil Hitung</th>
                            <th class="border border-gray-300 px-4 py-2 text-sm italic">Input Manual</th>
                            <th class="border border-gray-300 px-4 py-2 text-sm italic">Input Manual/Hasil Hitung</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- KDB -->
                        <tr>
                            <td class="border border-gray-300 px-4 py-2 text-center" rowspan="2">A</td>
                            <td class="border border-gray-300 px-4 py-2 font-medium" colspan="5">Koefisien Dasar Bangunan (KDB)</td>
                        </tr>
                        <tr>
                            <td class="border border-gray-300 px-4 py-2 text-sm">
                                <b>Luas yang digunakan</b><br>
                                <input type="number" step="any" wire:model="luas_digunakan_ketentuan_rtr" class="w-full text-xs mt-1 border border-gray-300 rounded" {{ $isReadOnly ? 'disabled' : '' }}> m²
                            </td>
                            <td class="border border-gray-300 px-4 py-2 text-sm text-center align-middle">
                                <div><b>Rasio Maks/Min</b></div>
                                <input type="number" step="any" wire:model="kdb_ketentuan_rtr" class="w-20 text-xs mt-1 border border-gray-300 rounded" {{ $isReadOnly ? 'disabled' : '' }}>
                            </td>
                            <td class="border border-gray-300 px-4 py-2 text-sm">
                                <b>Luas yang digunakan (Ukur)</b><br>
                                <input type="number" step="any" wire:model="luas_digunakan_kesesuaian_rtr" class="w-full text-xs mt-1 border border-gray-300 rounded" {{ $isReadOnly ? 'disabled' : '' }}> m²
                            </td>
                            <td class="border border-gray-300 px-4 py-2 text-sm">
                                <div class="grid grid-cols-2 gap-2">
                                    <div>
                                        <b>Rasio (X)</b><br>
                                        <input type="number" step="any" wire:model="kdb_rasio_manual" class="w-full text-xs mt-1 border border-gray-300 rounded" {{ $isReadOnly ? 'disabled' : '' }}>
                                    </div>
                                    <div>
                                        <b>Persentase (%)</b><br>
                                        <input type="number" step="any" wire:model="kdb_persen_manual" class="w-full text-xs mt-1 border border-gray-300 rounded" {{ $isReadOnly ? 'disabled' : '' }}>
                                    </div>
                                </div>
                            </td>
                        </tr>

                        <!-- KLB -->
                        <tr>
                            <td class="border border-gray-300 px-4 py-2 text-center" rowspan="2">B</td>
                            <td class="border border-gray-300 px-4 py-2 font-medium" colspan="5">Koefisien Lantai Bangunan (KLB)</td>
                        </tr>
                        <tr>
                            <td class="border border-gray-300 px-4 py-2 text-sm">
                                <b>Luas Tanah</b><br>
                                <input type="number" step="any" wire:model="klb_luas_tanah" class="w-full text-xs mt-1 border border-gray-300 rounded" {{ $isReadOnly ? 'disabled' : '' }}> m²
                            </td>
                            <td class="border border-gray-300 px-4 py-2 text-sm text-center align-middle">
                                <div><b>Rasio Maks</b></div>
                                <input type="number" step="any" wire:model="klb_ketentuan_rtr" class="w-20 text-xs mt-1 border border-gray-300 rounded" {{ $isReadOnly ? 'disabled' : '' }}>
                            </td>
                            <td class="border border-gray-300 px-4 py-2 text-sm">
                                <b>(Hasil Ukur Luas Bangunan)</b><br>
                                <input type="text" wire:model="klb_kesesuaian_rtr" class="w-full text-xs mt-1 border border-gray-300 rounded" {{ $isReadOnly ? 'disabled' : '' }}>
                            </td>
                            <td class="border border-gray-300 px-4 py-2 text-sm text-center">
                                <div><b>Rasio (X)</b></div>
                                <input type="number" step="any" wire:model="klb_rasio_manual" class="w-20 text-xs mt-1 border border-gray-300 rounded" {{ $isReadOnly ? 'disabled' : '' }}>
                            </td>
                        </tr>

                        <!-- GSB -->
                        <tr>
                            <td class="border border-gray-300 px-4 py-2 text-center">D</td>
                            <td class="border border-gray-300 px-4 py-2 font-medium">Garis Sempadan Bangunan (GSB)</td>
                            <td class="border border-gray-300 px-4 py-2 text-sm" colspan="2">
                                <input type="text" wire:model="gsb_ketentuan_rtr" class="w-full text-xs mt-1 border border-gray-300 rounded" {{ $isReadOnly ? 'disabled' : '' }}>
                            </td>
                            <td class="border border-gray-300 px-4 py-2 text-sm" colspan="2">
                                <input type="text" wire:model="gsb_kesesuaian_rtr" class="w-full text-xs mt-1 border border-gray-300 rounded" {{ $isReadOnly ? 'disabled' : '' }}>
                            </td>
                        </tr>

                        <!-- JBB -->
                        <tr>
                            <td class="border border-gray-300 px-4 py-2 text-center">E</td>
                            <td class="border border-gray-300 px-4 py-2 font-medium">Jarak Bebas Bangunan (JBB)</td>
                            <td class="border border-gray-300 px-4 py-2 text-sm" colspan="2">
                                <input type="text" wire:model="jbb_ketentuan_rtr" class="w-full text-xs mt-1 border border-gray-300 rounded" {{ $isReadOnly ? 'disabled' : '' }}>
                            </td>
                            <td class="border border-gray-300 px-4 py-2 text-sm" colspan="2">
                                <input type="text" wire:model="jbb_kesesuaian_rtr" class="w-full text-xs mt-1 border border-gray-300 rounded" {{ $isReadOnly ? 'disabled' : '' }}>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- TANDA TANGAN TIM PENILAI -->
            <div class="border-t pt-6 mb-8 mt-8">
                <h3 class="text-lg font-semibold mb-4 text-gray-800">4. Tanda Tangan Anggota Tim</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    @foreach($requiredMembers as $member)
                        <div class="border rounded p-4 bg-gray-50 text-center">
                            <p class="font-semibold">{{ $member['pivot']['jabatan_di_tim'] }}</p>
                            <p class="font-bold underline">{{ $member['nama'] }}</p>
                            <p class="text-xs text-gray-500 mb-3">NIP: {{ $member['nip'] ?: '-' }}</p>
                            
                            @if(isset($teamSignatures[$member['id']]))
                                <div class="mb-2 p-2 border bg-white flex flex-col items-center">
                                    <img src="{{ asset('storage/' . $teamSignatures[$member['id']]) }}" class="h-20 object-contain">
                                    <span class="text-xs text-green-600 font-semibold mt-1">✓ Sudah ditandatangani</span>
                                    @if(!$isReadOnly)
                                    <button type="button" @click="showPad('member_{{ $member['id'] }}')" class="text-xs text-blue-600 mt-2">Ganti</button>
                                    @endif
                                </div>
                            @elseif(!$isReadOnly)
                                <button type="button" @click="showPad('member_{{ $member['id'] }}')" class="text-sm bg-white hover:bg-gray-100 text-gray-800 py-1 px-3 rounded border w-full">Tanda Tangan</button>
                            @endif

                            <div x-show="padsVisible['member_{{ $member['id'] }}']" class="mt-2" style="display: none;">
                                <div class="border border-gray-300 rounded-md bg-white touch-none" style="height: 150px;" x-ref="canvasContainer_member_{{ $member['id'] }}" x-init="initPad('member_{{ $member['id'] }}')">
                                    <canvas id="signature-pad-member_{{ $member['id'] }}" class="w-full h-full cursor-crosshair"></canvas>
                                </div>
                                <button type="button" @click="clearPad('member_{{ $member['id'] }}')" class="text-xs text-red-600 hover:underline mt-1">Hapus / Ulang</button>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>

            @if(!$isReadOnly)
                <div class="flex justify-end pt-4 border-t">
                    <button type="submit" @click="saveSignatures" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg shadow-md disabled:bg-opacity-50" wire:loading.attr="disabled">
                        <span wire:loading.remove>Simpan Formulir</span>
                        <span wire:loading>Menyimpan...</span>
                    </button>
                </div>
            @endif
        </form>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js"></script>
    <script>
        document.addEventListener('alpine:init', () => {
            Alpine.data('signaturePads', () => ({
                pads: {},
                padsVisible: {},

                showPad(key) {
                    this.padsVisible[key] = true;
                    setTimeout(() => this.resizeCanvas(key), 50);
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
</div>
