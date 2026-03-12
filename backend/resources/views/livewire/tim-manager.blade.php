<div>
    {{-- Page Header --}}
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Manajemen Tim Penilai</h1>
        <button wire:click="openCreateTimModal"
                class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition">
            + Tambah Tim Baru
        </button>
    </div>

    {{-- Flash Success --}}
    @if(session('success'))
        <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
            {{ session('success') }}
        </div>
    @endif

    {{-- Tim Cards Grid --}}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @forelse($tims as $tim)
            <div class="bg-white p-6 rounded-lg shadow-md flex flex-col">
                <h3 class="text-xl font-bold mb-2">{{ $tim->nama_tim }}</h3>
                <p class="text-gray-600 mb-4 flex-grow">{{ $tim->deskripsi ?: 'Tidak ada deskripsi.' }}</p>

                {{-- Members List --}}
                <div class="mb-4">
                    <h4 class="font-semibold text-sm mb-2">Anggota:</h4>
                    <ul class="list-disc pl-5 text-sm">
                        @forelse($tim->users as $user)
                            <li>
                                {{ $user->nama }}
                                <span class="text-gray-500">({{ $user->pivot->jabatan_di_tim }})</span>
                            </li>
                        @empty
                            <li class="text-gray-400">Belum ada anggota</li>
                        @endforelse
                    </ul>
                </div>

                {{-- Action Buttons --}}
                <div class="mt-auto pt-4 border-t flex flex-wrap gap-2">
                    <button wire:click="openMemberModal({{ $tim->id }})"
                            class="bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-1 px-3 rounded transition">
                        Kelola Anggota
                    </button>
                    <button wire:click="openEditTimModal({{ $tim->id }})"
                            class="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold py-1 px-3 rounded transition">
                        Edit
                    </button>
                    <button wire:click="confirmDeleteTim({{ $tim->id }})"
                            class="bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-1 px-3 rounded transition">
                        Hapus
                    </button>
                </div>
            </div>
        @empty
            <div class="col-span-full text-center py-10 text-gray-500">
                Belum ada tim penilai. Klik tombol di atas untuk menambahkan.
            </div>
        @endforelse
    </div>

    {{-- ====================== MODAL: TIM CREATE/EDIT ====================== --}}
    @if($showTimModal)
        <div class="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50"
             wire:click.self="closeTimModal">
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h3 class="text-xl font-bold mb-4">{{ $editingTimId ? 'Edit Tim' : 'Tambah Tim Baru' }}</h3>

                <form wire:submit="saveTim">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700">Nama Tim *</label>
                        <input wire:model="nama_tim" type="text"
                               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required>
                        @error('nama_tim') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700">Deskripsi</label>
                        <textarea wire:model="deskripsi" rows="3"
                                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"></textarea>
                        @error('deskripsi') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                    </div>
                    <div class="flex justify-end space-x-2">
                        <button type="button" wire:click="closeTimModal"
                                class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Batal</button>
                        <button type="submit"
                                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    @endif

    {{-- ====================== MODAL: MANAGE MEMBERS ====================== --}}
    @if($showMemberModal)
        <div class="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50"
             wire:click.self="closeMemberModal">
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <h3 class="text-xl font-bold mb-4">Kelola Anggota: {{ $managingTimName }}</h3>

                {{-- Flash for member operations --}}
                @if(session('member_success'))
                    <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
                        {{ session('member_success') }}
                    </div>
                @endif

                {{-- Add Member Form --}}
                <form wire:submit="addMember" class="flex items-end gap-2 mb-6 p-4 border rounded-md">
                    <div class="flex-grow">
                        <label class="block text-sm font-medium text-gray-700">Anggota Baru</label>
                        <select wire:model="selectedUserId"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            <option value="">Pilih Pengguna</option>
                            @foreach($availableUsers as $user)
                                <option value="{{ $user->id }}">{{ $user->nama }} ({{ $user->role }})</option>
                            @endforeach
                        </select>
                        @error('selectedUserId') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Jabatan</label>
                        <select wire:model="jabatan"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            <option value="Ketua Tim">Ketua Tim</option>
                            <option value="Petugas Lapangan">Petugas Lapangan</option>
                            <option value="Koordinator Lapangan">Koordinator Lapangan</option>
                        </select>
                    </div>
                    <button type="submit"
                            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 h-10 transition">
                        Tambah
                    </button>
                </form>

                {{-- Current Members --}}
                <h4 class="font-semibold mb-2">Anggota Saat Ini:</h4>
                <div class="space-y-2 max-h-60 overflow-y-auto">
                    @forelse($currentMembers as $member)
                        <div class="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                            <div>
                                <p class="font-semibold">{{ $member->nama }}</p>
                                <p class="text-sm text-gray-600">{{ $member->pivot->jabatan_di_tim }}</p>
                            </div>
                            <button wire:click="removeMember({{ $member->id }})"
                                    class="text-red-500 hover:text-red-700 text-sm font-semibold transition">
                                Hapus
                            </button>
                        </div>
                    @empty
                        <p class="text-gray-500">Belum ada anggota.</p>
                    @endforelse
                </div>

                <div class="flex justify-end mt-6">
                    <button wire:click="closeMemberModal"
                            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    @endif

    {{-- ====================== MODAL: DELETE CONFIRM ====================== --}}
    @if($showDeleteModal)
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50"
             wire:click.self="closeDeleteModal">
            <div class="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
                <h3 class="text-lg font-bold text-gray-800 mb-4">Konfirmasi Hapus Tim</h3>
                <p class="text-gray-600 mb-6">Apakah Anda yakin ingin menghapus tim ini? Semua anggota akan dilepas dari tim.</p>
                <div class="flex justify-end space-x-2">
                    <button wire:click="closeDeleteModal"
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition">
                        Batal
                    </button>
                    <button wire:click="deleteTim"
                            class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition">
                        Ya, Hapus
                    </button>
                </div>
            </div>
        </div>
    @endif
</div>
