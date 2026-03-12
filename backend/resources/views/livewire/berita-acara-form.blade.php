<div class="px-4 py-6 sm:px-0" x-data="signaturePads()">
    <div class="mb-6">
        <a href="{{ route('penilaian.tambah') }}" class="text-blue-600 hover:underline">
            &larr; Batal dan Kembali
        </a>
    </div>

    <div class="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Berita Acara Tidak Terlaksananya Penilaian</h2>
        
        @if (session()->has('error'))
            <div class="bg-red-100 text-red-700 p-3 rounded-md mb-4">{{ session('error') }}</div>
        @endif

        @if($loading)
            <div class="text-center py-10">Memuat data...</div>
        @else
            <form wire:submit.prevent="submit" class="space-y-6">
                <div>
                    <label for="nomor_ba" class="block text-sm font-medium text-gray-700">Nomor Berita Acara</label>
                    <input type="text" wire:model="nomor_ba" id="nomor_ba" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required>
                    @error('nomor_ba') <span class="text-red-500 text-xs">{{ $message }}</span> @enderror
                </div>
                
                <div>
                    <label for="tanggal_ba" class="block text-sm font-medium text-gray-700">Tanggal Berita Acara</label>
                    <input type="date" wire:model="tanggal_ba" id="tanggal_ba" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required>
                    @error('tanggal_ba') <span class="text-red-500 text-xs">{{ $message }}</span> @enderror
                </div>
                
                <fieldset>
                    <legend class="text-sm font-medium text-gray-700">Alasan Tidak Terlaksana</legend>
                    <div class="mt-2 space-y-2">
                        @foreach(['Tidak dapat dihubungi', 'Lokasi tidak ditemukan', 'Lainnya'] as $alasanOption)
                            <div class="flex items-center">
                                <input id="alasan_{{ Str::slug($alasanOption) }}" wire:model.live="alasan" type="radio" value="{{ $alasanOption }}" class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" required>
                                <label for="alasan_{{ Str::slug($alasanOption) }}" class="ml-3 block text-sm text-gray-800">{{ $alasanOption }}</label>
                            </div>
                        @endforeach
                    </div>
                    @error('alasan') <span class="text-red-500 text-xs">{{ $message }}</span> @enderror
                </fieldset>
                
                @if($alasan === 'Lainnya')
                    <div>
                        <label for="keterangan_lainnya" class="block text-sm font-medium text-gray-700">Keterangan Lainnya</label>
                        <textarea wire:model="keterangan_lainnya" id="keterangan_lainnya" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required></textarea>
                        @error('keterangan_lainnya') <span class="text-red-500 text-xs">{{ $message }}</span> @enderror
                    </div>
                @endif

                <div class="pt-4 border-t">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Tanda Tangan Tim Penilai</h3>
                    <div class="space-y-4">
                        @foreach($timPenilaiMembers as $member)
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700">
                                    {{ $member['pivot']['jabatan_di_tim'] ?? 'Anggota Tim' }}: {{ $member['nama'] }}
                                </label>
                                <div class="mt-1 border border-gray-300 rounded-md bg-white touch-none" style="height: 150px;" x-ref="canvasContainer_{{ $member['id'] }}" x-init="initPad({{ $member['id'] }})">
                                    <canvas id="signature-pad-{{ $member['id'] }}" class="w-full h-full cursor-crosshair"></canvas>
                                </div>
                                <div class="flex justify-between items-center mt-1">
                                    <button
                                        type="button"
                                        @click="clearPad({{ $member['id'] }})"
                                        class="text-sm text-blue-600 hover:underline">
                                        Ulangi Tanda Tangan
                                    </button>
                                    <span x-show="signed[{{ $member['id'] }}]" class="text-xs text-green-600" style="display: none;">✓ Sudah diisi</span>
                                    <span x-show="!signed[{{ $member['id'] }}]" class="text-xs text-red-500">Belum diisi</span>
                                </div>
                                @error('signatures.' . $member['id']) <span class="text-red-500 text-xs block mt-1">{{ $message }}</span> @enderror
                            </div>
                        @endforeach
                    </div>
                </div>

                <div class="flex justify-end pt-4">
                    <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300" @click="saveSignatures" wire:loading.attr="disabled">
                        <span wire:loading.remove>Simpan & Lihat Preview</span>
                        <span wire:loading>Menyimpan...</span>
                    </button>
                </div>
            </form>
        @endif
    </div>

    <script src="https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js"></script>
    <script>
        document.addEventListener('alpine:init', () => {
            Alpine.data('signaturePads', () => ({
                pads: {},
                signed: {},

                initPad(memberId) {
                    const canvas = document.getElementById('signature-pad-' + memberId);
                    const container = this.$refs['canvasContainer_' + memberId];
                    if (canvas && container) {
                        // Set the canvas size to match the container
                        function resizeCanvas() {
                            const ratio = Math.max(window.devicePixelRatio || 1, 1);
                            // Set actual size in memory
                            canvas.width = canvas.offsetWidth * ratio;
                            canvas.height = canvas.offsetHeight * ratio;
                            // Set visual size
                            canvas.style.width = canvas.offsetWidth + "px";
                            canvas.style.height = canvas.offsetHeight + "px";
                            const ctx = canvas.getContext("2d");
                            ctx.scale(ratio, ratio);
                        }

                        // Call initially and on resize
                        window.addEventListener("resize", () => {
                             if(this.pads[memberId]) {
                                 const data = this.pads[memberId].toData();
                                 resizeCanvas();
                                 this.pads[memberId].fromData(data);
                             } else {
                                 resizeCanvas();
                             }
                        });
                        resizeCanvas();
                        
                        const pad = new SignaturePad(canvas, {
                            backgroundColor: 'rgba(255, 255, 255, 0)',
                            penColor: 'black'
                        });
                        
                        pad.addEventListener("endStroke", () => {
                            this.signed[memberId] = !pad.isEmpty();
                            // Optional: auto-save to livewire component on stroke end
                            // @this.set('signatures.' + memberId, pad.toDataURL());
                        });
                        
                        this.pads[memberId] = pad;
                        this.signed[memberId] = false;
                    }
                },

                clearPad(memberId) {
                    if (this.pads[memberId]) {
                        this.pads[memberId].clear();
                        this.signed[memberId] = false;
                        @this.set('signatures.' + memberId, null);
                    }
                },

                saveSignatures() {
                    let hasErrors = false;
                    Object.keys(this.pads).forEach(memberId => {
                        if (!this.pads[memberId].isEmpty()) {
                            @this.set('signatures.' + memberId, this.pads[memberId].toDataURL());
                        } else {
                            hasErrors = true;
                        }
                    });
                    
                    if (hasErrors) {
                        // The submit will happen, and Livewire will fail validation
                        // if any signatures are missing (handled by the controller logic)
                    }
                }
            }));
        });
    </script>
</div>
