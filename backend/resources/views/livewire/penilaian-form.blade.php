<div>
    {{-- Back link --}}
    <div class="mb-6">
        <a href="{{ route('penilaian') }}" class="text-blue-600 hover:underline text-sm">
            &larr; {{ $isEditMode ? 'Batal dan Kembali ke Dashboard Penilaian' : 'Kembali ke Dashboard Penilaian' }}
        </a>
    </div>

    <div class="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">
            {{ $isEditMode ? 'Edit Permohonan Penilaian' : 'Tambah Permohonan Penilaian Baru' }}
        </h2>

        @unless($isEditMode)
            <p class="text-sm text-gray-600 mb-6">
                Buat permohonan penilaian baru untuk pelaku usaha.
                Penugasan tim akan dilakukan oleh Ketua Tim setelah permohonan dibuat.
            </p>
        @endunless

        {{-- Error --}}
        @if(session('error'))
            <div class="bg-red-100 text-red-700 p-3 rounded-md mb-4">{{ session('error') }}</div>
        @endif

        <form wire:submit="save" class="space-y-4">

            {{-- Current NIB (edit mode only) --}}
            @if($isEditMode && $currentNib)
                <div class="p-3 bg-gray-100 rounded-md">
                    <label class="block text-sm font-medium text-gray-500">Nomor Induk Berusaha (NIB)</label>
                    <p class="text-lg font-mono text-gray-800">{{ $currentNib }}</p>
                </div>
            @endif

            {{-- Pelaku Usaha --}}
            <div>
                <label for="pemegang_id" class="block text-sm font-medium text-gray-700">Pelaku Usaha *</label>
                <select wire:model="pemegang_id" id="pemegang_id"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required>
                    <option value="">Pilih Pelaku Usaha</option>
                    @foreach($pemegangs as $p)
                        <option value="{{ $p->id }}">{{ $p->nama_pelaku_usaha }} - (NIB: {{ $p->nomor_identitas }})</option>
                    @endforeach
                </select>
                <p class="mt-1 text-sm text-gray-500">Pilih pelaku usaha yang akan dinilai</p>
                @error('pemegang_id') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
            </div>

            {{-- Tim Penilai (edit mode or optional add) --}}
            @if($isEditMode)
                <div>
                    <label for="tim_id" class="block text-sm font-medium text-gray-700">Tim Penilai (Opsional)</label>
                    <select wire:model="tim_id" id="tim_id"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        <option value="">Pilih Tim Penilai</option>
                        @foreach($tims as $tim)
                            <option value="{{ $tim->id }}">{{ $tim->nama_tim }}</option>
                        @endforeach
                    </select>
                </div>
            @endif

            {{-- Info box (add mode only) --}}
            @unless($isEditMode)
                <div class="bg-blue-50 border-l-4 border-blue-400 p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-blue-700">
                                <strong>Catatan:</strong> Setelah permohonan dibuat, Ketua Tim akan menerima notifikasi
                                dan dapat menugaskan tim penilai serta koordinator lapangan untuk memulai penilaian.
                            </p>
                        </div>
                    </div>
                </div>
            @endunless

            {{-- Submit --}}
            <div class="flex justify-end pt-2">
                <button type="submit"
                        class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors disabled:bg-blue-400"
                        wire:loading.attr="disabled">
                    <span wire:loading.remove>{{ $isEditMode ? 'Simpan Perubahan' : 'Simpan Permohonan' }}</span>
                    <span wire:loading>Menyimpan...</span>
                </button>
            </div>
        </form>
    </div>
</div>
