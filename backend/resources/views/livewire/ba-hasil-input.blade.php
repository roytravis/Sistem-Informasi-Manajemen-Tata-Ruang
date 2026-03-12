<div class="px-4 py-6 sm:px-0" x-data="signaturePads()">
    <div class="mb-6">
        <a href="{{ route('penilaian.detail', ['id' => $penilaianId]) }}" class="text-blue-600 hover:underline">
            &larr; Batal dan Kembali
        </a>
    </div>

    <div class="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
        <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Input Berita Acara Hasil Penilaian</h2>
        
        @if (session()->has('error'))
            <div class="bg-red-100 text-red-700 p-3 rounded-md mb-4">{{ session('error') }}</div>
        @endif

        <form wire:submit.prevent="save" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Nomor Berita Acara</label>
                    <input type="text" wire:model="nomor_ba" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Auto-generate jika kosong">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Tanggal Berita Acara</label>
                    <input type="date" wire:model="tanggal_ba" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700">Validitas Kegiatan</label>
                <div class="mt-2 space-x-4">
                    <label class="inline-flex items-center">
                        <input type="radio" wire:model="validitas_kegiatan" value="BENAR" class="text-blue-600 border-gray-300">
                        <span class="ml-2">BENAR</span>
                    </label>
                    <label class="inline-flex items-center">
                        <input type="radio" wire:model="validitas_kegiatan" value="TIDAK BENAR" class="text-blue-600 border-gray-300">
                        <span class="ml-2">TIDAK BENAR</span>
                    </label>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700">Rekomendasi Lanjutan</label>
                <textarea wire:model="rekomendasi_lanjutan" rows="4" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required placeholder="Masukkan rekomendasi terhadap hasil penilaian..."></textarea>
            </div>

            <div class="pt-6 border-t">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Tanda Tangan Pihak Terkait</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    @foreach($members as $key => $member)
                        <div class="border rounded p-4 bg-gray-50 text-center">
                            <p class="font-semibold">{{ $member['jabatan'] }}</p>
                            <p class="font-bold underline">{{ $member['nama'] }}</p>
                            <p class="text-xs text-gray-500 mb-3">NIP: {{ $member['nip'] ?: '-' }}</p>
                            
                            @if(isset($existingSignatures[$key]))
                                <div class="mb-2 p-2 border bg-white flex flex-col items-center">
                                    <img src="{{ asset('storage/' . $existingSignatures[$key]) }}" class="h-20 object-contain">
                                    <span class="text-xs text-green-600 font-semibold mt-1">✓ Sudah ditandatangani</span>
                                    <button type="button" @click="showPad('{{ $key }}')" class="text-xs text-blue-600 mt-2">Ganti</button>
                                </div>
                            @else
                                <button type="button" @click="showPad('{{ $key }}')" class="text-sm bg-white hover:bg-gray-100 text-gray-800 py-1 px-3 rounded border w-full">Tanda Tangan</button>
                            @endif

                            <div x-show="padsVisible['{{ $key }}']" class="mt-2" style="display: none;">
                                <div class="border border-gray-300 rounded-md bg-white touch-none" style="height: 150px;" x-ref="canvasContainer_{{ $key }}" x-init="initPad('{{ $key }}')">
                                    <canvas id="signature-pad-{{ $key }}" class="w-full h-full cursor-crosshair"></canvas>
                                </div>
                                <button type="button" @click="clearPad('{{ $key }}')" class="text-xs text-red-600 hover:underline mt-1">Hapus / Ulang</button>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>

            <div class="flex justify-end pt-4 border-t">
                <button type="submit" @click="saveSignatures" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg shadow-md disabled:bg-opacity-50" wire:loading.attr="disabled">
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
