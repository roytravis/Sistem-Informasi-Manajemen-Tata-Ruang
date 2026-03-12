<div>
    {{-- Flash --}}
    @if(session('success'))
        <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
            {{ session('success') }}
        </div>
    @endif

    <div class="bg-white p-6 rounded-lg shadow-lg">
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">Persetujuan Edit Formulir</h2>
            <button wire:click="$refresh" class="text-blue-600 hover:underline text-sm">Refresh Data</button>
        </div>

        @if($requests->isEmpty())
            <div class="p-12 text-center">
                <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-gray-500 text-lg">Tidak ada permohonan edit yang menunggu persetujuan.</p>
            </div>
        @else
            <div class="grid gap-4">
                @foreach($requests as $req)
                    <div class="bg-white border-l-4 border-blue-500 rounded-r-lg shadow-sm p-5 hover:shadow-md transition-shadow">
                        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div class="flex-grow">
                                {{-- Status & Date --}}
                                <div class="flex items-center gap-2 mb-2">
                                    <span class="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded uppercase">Pending</span>
                                    <span class="text-xs text-gray-500">
                                        Diajukan: {{ $req->created_at->translatedFormat('d F Y, H:i') }}
                                    </span>
                                </div>

                                {{-- Info grid --}}
                                <div class="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                    <div>
                                        <p class="text-gray-600">Pemohon:</p>
                                        <p class="font-semibold text-gray-900 text-base">{{ $req->user?->nama ?? '-' }}</p>
                                        <p class="text-xs text-gray-500">{{ $req->user?->role ?? '-' }}</p>
                                    </div>
                                    <div>
                                        <p class="text-gray-600">Data Kasus:</p>
                                        <p class="font-semibold text-gray-900">
                                            {{ $req->penilaian?->kasus?->pemegang?->nama_pelaku_usaha ?? 'N/A' }}
                                        </p>
                                        <p class="text-xs text-gray-500">
                                            No. Permohonan: {{ $req->penilaian?->kasus?->nomor_permohonan ?? '-' }}
                                        </p>
                                    </div>
                                </div>

                                {{-- Reason --}}
                                <div class="mt-3 bg-gray-50 p-3 rounded text-sm border border-gray-100">
                                    <p class="font-semibold text-gray-700 mb-1">Alasan Permohonan:</p>
                                    <p class="text-gray-800 italic">"{{ $req->alasan_permohonan }}"</p>
                                </div>

                                {{-- Link to formulir --}}
                                @if($req->penilaian?->kasus?->id)
                                    <div class="mt-3">
                                        <a href="{{ route('penilaian.detail', $req->penilaian->kasus->id) }}"
                                           target="_blank"
                                           class="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline">
                                            Lihat Formulir Saat Ini
                                            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                            </svg>
                                        </a>
                                    </div>
                                @endif
                            </div>

                            {{-- Action buttons --}}
                            <div class="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-2 md:mt-0">
                                <button wire:click="openRejectModal({{ $req->id }})"
                                        wire:loading.attr="disabled"
                                        class="px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-md font-medium text-sm transition-colors disabled:opacity-50">
                                    Tolak
                                </button>
                                <button wire:click="approve({{ $req->id }})"
                                        wire:loading.attr="disabled"
                                        wire:confirm="Apakah Anda yakin ingin MENYETUJUI permohonan ini?"
                                        class="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md font-medium text-sm shadow-sm transition-colors disabled:bg-green-400">
                                    <span wire:loading.remove wire:target="approve({{ $req->id }})">Setujui Edit</span>
                                    <span wire:loading wire:target="approve({{ $req->id }})">Memproses...</span>
                                </button>
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>
        @endif
    </div>

    {{-- ====================== MODAL: REJECT ====================== --}}
    @if($showRejectModal)
        <div class="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 px-4"
             wire:click.self="closeRejectModal">
            <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 class="text-xl font-bold mb-3 text-gray-800">Tolak Permohonan Edit</h3>
                <p class="text-sm text-gray-600 mb-4">
                    Masukkan alasan penolakan yang akan dikirimkan kepada pemohon.
                </p>

                <form wire:submit="reject">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Alasan Penolakan *</label>
                        <textarea wire:model="alasanPenolakan"
                                  class="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                  rows="3"
                                  placeholder="Contoh: Data sudah benar, tidak perlu diubah..."
                                  required></textarea>
                        @error('alasanPenolakan') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                    </div>

                    <div class="flex justify-end gap-3 pt-2 border-t">
                        <button type="button" wire:click="closeRejectModal"
                                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 font-medium transition-colors">
                            Batal
                        </button>
                        <button type="submit"
                                class="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 font-medium transition-colors disabled:bg-red-300"
                                wire:loading.attr="disabled">
                            <span wire:loading.remove>Tolak Permohonan</span>
                            <span wire:loading>Memproses...</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    @endif
</div>
