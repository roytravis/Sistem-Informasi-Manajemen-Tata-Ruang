<x-layouts.app :title="$pageTitle">
    <div class="bg-white rounded-lg shadow-md p-8">
        <div class="text-center">
            <div class="mb-4">
                <svg class="mx-auto h-16 w-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-800 mb-2">{{ $pageTitle }}</h1>
            <p class="text-gray-500">Halaman ini akan tersedia di phase berikutnya.</p>
            <p class="text-sm text-gray-400 mt-4">
                Login berhasil sebagai <strong class="text-gray-600">{{ auth()->user()->nama }}</strong>
                ({{ auth()->user()->role }})
            </p>
        </div>
    </div>
</x-layouts.app>
