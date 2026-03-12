<div>
    {{-- Page Header --}}
    <div class="bg-white p-6 rounded-lg shadow-lg">
        <div class="sm:flex sm:justify-between sm:items-center mb-6">
            <div>
                <h2 class="text-3xl font-bold text-gray-900">Manajemen Pemegang Usaha</h2>
                <p class="mt-1 text-gray-600">Kelola daftar pemegang usaha di sini.</p>
            </div>
            <button wire:click="openCreateModal"
                    class="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300">
                + Tambah Pemegang Usaha
            </button>
        </div>

        {{-- Search Bar --}}
        <div class="mb-4">
            <input wire:model.live.debounce.300ms="search"
                   type="text"
                   placeholder="Cari nama, nomor identitas, kegiatan, kecamatan..."
                   class="w-full sm:w-96 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-4">
        </div>

        {{-- Flash Success (within component) --}}
        @if(session('success'))
            <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
                {{ session('success') }}
            </div>
        @endif

        {{-- Data Table --}}
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Nama Pelaku Usaha</th>
                        <th class="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Nomor Identitas</th>
                        <th class="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Kegiatan</th>
                        <th class="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Kecamatan</th>
                        <th class="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Aksi</th>
                    </tr>
                </thead>
                <tbody class="text-gray-700 divide-y divide-gray-200">
                    @forelse($pemegangs as $pemegang)
                        <tr class="hover:bg-gray-50 transition duration-150">
                            <td class="py-3 px-4">{{ $pemegang->nama_pelaku_usaha }}</td>
                            <td class="py-3 px-4 font-mono">{{ $pemegang->nomor_identitas }}</td>
                            <td class="py-3 px-4">{{ $pemegang->kegiatan }}</td>
                            <td class="py-3 px-4">{{ $pemegang->kecamatan }}</td>
                            <td class="py-3 px-4">
                                <button wire:click="openEditModal({{ $pemegang->id }})"
                                        class="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded-md text-sm mr-2 transition">
                                    Edit
                                </button>
                                <button wire:click="confirmDelete({{ $pemegang->id }})"
                                        class="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md text-sm transition">
                                    Hapus
                                </button>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="text-center py-10 text-gray-500">Tidak ada data pemegang usaha.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        {{-- Pagination --}}
        <div class="mt-4">
            {{ $pemegangs->links() }}
        </div>
    </div>

    {{-- ====================== MODAL: ADD / EDIT ====================== --}}
    @if($showModal)
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50"
             wire:click.self="closeModal">
            <div class="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
                <h3 class="text-xl font-bold text-gray-800 mb-6">
                    {{ $editingId ? 'Edit' : 'Tambah' }} Pemegang Usaha
                </h3>

                <form wire:submit="save" class="space-y-4">
                    {{-- Nama Pelaku Usaha --}}
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Nama Pelaku Usaha *</label>
                        <input wire:model="nama_pelaku_usaha" type="text"
                               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        @error('nama_pelaku_usaha') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                    </div>

                    {{-- Nomor Identitas --}}
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Nomor Identitas Pelaku Usaha *</label>
                        <input wire:model="nomor_identitas" type="text"
                               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        @error('nomor_identitas') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                    </div>

                    {{-- Kegiatan --}}
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Kegiatan Pemanfaatan Ruang *</label>
                        <input wire:model="kegiatan" type="text"
                               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        @error('kegiatan') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                    </div>

                    {{-- Email & Phone (side by side) --}}
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Email (Opsional)</label>
                            <input wire:model="email" type="email"
                                   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                            @error('email') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Nomor Handphone (Opsional)</label>
                            <input wire:model="nomor_handphone" type="text"
                                   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                            @error('nomor_handphone') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                        </div>
                    </div>

                    {{-- Lokasi Kegiatan --}}
                    <fieldset class="border p-4 rounded-md mt-4">
                        <legend class="text-sm font-medium text-gray-700 px-1">Lokasi Kegiatan Pemanfaatan Ruang</legend>
                        <div class="space-y-4 pt-2">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Alamat *</label>
                                <input wire:model="alamat" type="text"
                                       class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                                @error('alamat') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Desa/Kelurahan *</label>
                                    <input wire:model="desa_kelurahan" type="text"
                                           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                                    @error('desa_kelurahan') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Kecamatan *</label>
                                    <input wire:model="kecamatan" type="text"
                                           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                                    @error('kecamatan') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                                </div>
                            </div>
                        </div>
                    </fieldset>

                    {{-- Buttons --}}
                    <div class="flex justify-end space-x-2 pt-4">
                        <button type="button" wire:click="closeModal"
                                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition">
                            Batal
                        </button>
                        <button type="submit"
                                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition">
                            Simpan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    @endif

    {{-- ====================== MODAL: DELETE CONFIRM ====================== --}}
    @if($showDeleteModal)
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50"
             wire:click.self="closeDeleteModal">
            <div class="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
                <h3 class="text-lg font-bold text-gray-800 mb-4">Konfirmasi Hapus</h3>
                <p class="text-gray-600 mb-6">Apakah Anda yakin ingin menghapus data pemegang usaha ini? Tindakan ini tidak dapat dibatalkan.</p>
                <div class="flex justify-end space-x-2">
                    <button wire:click="closeDeleteModal"
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition">
                        Batal
                    </button>
                    <button wire:click="delete"
                            class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition">
                        Ya, Hapus
                    </button>
                </div>
            </div>
        </div>
    @endif
</div>
