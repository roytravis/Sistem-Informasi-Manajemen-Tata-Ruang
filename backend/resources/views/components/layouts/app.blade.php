<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title ?? 'SIMANTRA' }} — Sistem Informasi Manajemen Tata Ruang</title>

    {{-- Tailwind CSS via CDN (no Node.js build required) --}}
    <script src="https://cdn.tailwindcss.com"></script>

    {{-- Inter Font --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <style>
        body { font-family: 'Inter', sans-serif; }
        /* Fade-in animation for dropdowns */
        @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fadeInDown 0.15s ease-out; }
    </style>

    @livewireStyles
</head>
<body class="min-h-screen bg-gray-100 font-sans">

    {{-- Navigation Bar --}}
    <nav class="bg-white shadow-md sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">

                {{-- Brand --}}
                <a href="{{ route('penilaian') }}" class="text-xl font-bold text-blue-600 flex-shrink-0">
                    SIMANTRA
                </a>

                {{-- Main Navigation --}}
                <div class="hidden md:flex items-center space-x-6">
                    <a href="{{ route('penilaian') }}"
                       class="text-sm font-medium transition-colors {{ request()->routeIs('penilaian') ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-600' }}">
                        Dashboard Penilaian
                    </a>

                    {{-- Persetujuan Edit (Admin / Ketua Tim only) --}}
                    @if(in_array(auth()->user()->role ?? '', ['Admin', 'Ketua Tim']))
                        <a href="{{ route('persetujuan-edit') }}"
                           class="text-sm font-medium transition-colors {{ request()->routeIs('persetujuan-edit') ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-600' }}">
                            Persetujuan Edit
                        </a>
                    @endif

                    {{-- Management pages (Admin / Sekretariat / Ketua Tim) --}}
                    @if(in_array(auth()->user()->role ?? '', ['Admin', 'Sekretariat', 'Ketua Tim']))
                        <a href="{{ route('pemegangs') }}"
                           class="text-sm font-medium transition-colors {{ request()->routeIs('pemegangs') ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-600' }}">
                            Pemegang Usaha
                        </a>
                        <a href="{{ route('tims') }}"
                           class="text-sm font-medium transition-colors {{ request()->routeIs('tims') ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-600' }}">
                            Manajemen Tim
                        </a>
                    @endif
                </div>

                {{-- Right: Notifications, User Info, Logout --}}
                <div class="flex items-center gap-4">

                    {{-- Notification Bell (placeholder — will be Livewire component in Phase 2) --}}
                    <div class="relative" x-data="{ open: false }" @click.outside="open = false">
                        <button @click="open = !open"
                                class="relative p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-100 focus:outline-none"
                                title="Notifikasi">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </button>

                        {{-- Dropdown (placeholder) --}}
                        <div x-show="open" x-transition class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-100 animate-fade-in-down">
                            <div class="px-4 py-3 bg-gray-50 border-b">
                                <h3 class="text-sm font-semibold text-gray-700">Notifikasi</h3>
                            </div>
                            <div class="px-4 py-6 text-center text-gray-500 text-sm">
                                Notifikasi akan tersedia di Phase 2.
                            </div>
                        </div>
                    </div>

                    {{-- User Info --}}
                    <div class="hidden sm:block text-right">
                        <span class="block text-gray-800 text-sm font-semibold">{{ auth()->user()->nama ?? 'Guest' }}</span>
                        <span class="block text-gray-500 text-xs">{{ auth()->user()->role ?? '' }}</span>
                    </div>

                    <div class="h-8 w-px bg-gray-300 mx-1 hidden sm:block"></div>

                    {{-- Logout --}}
                    <form method="POST" action="{{ route('logout') }}">
                        @csrf
                        <button type="submit"
                                class="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-semibold py-2 px-4 rounded-lg text-sm transition-colors border border-red-200">
                            Logout
                        </button>
                    </form>
                </div>
            </div>
        </div>

        {{-- Mobile Navigation --}}
        <div class="md:hidden border-t border-gray-200 px-4 py-2 space-y-1">
            <a href="{{ route('penilaian') }}" class="block text-sm py-2 {{ request()->routeIs('penilaian') ? 'text-blue-600 font-semibold' : 'text-gray-600' }}">
                Dashboard Penilaian
            </a>
            @if(in_array(auth()->user()->role ?? '', ['Admin', 'Ketua Tim']))
                <a href="{{ route('persetujuan-edit') }}" class="block text-sm py-2 {{ request()->routeIs('persetujuan-edit') ? 'text-blue-600 font-semibold' : 'text-gray-600' }}">
                    Persetujuan Edit
                </a>
            @endif
            @if(in_array(auth()->user()->role ?? '', ['Admin', 'Sekretariat', 'Ketua Tim']))
                <a href="{{ route('pemegangs') }}" class="block text-sm py-2 {{ request()->routeIs('pemegangs') ? 'text-blue-600 font-semibold' : 'text-gray-600' }}">
                    Pemegang Usaha
                </a>
                <a href="{{ route('tims') }}" class="block text-sm py-2 {{ request()->routeIs('tims') ? 'text-blue-600 font-semibold' : 'text-gray-600' }}">
                    Manajemen Tim
                </a>
            @endif
        </div>
    </nav>

    {{-- Flash Messages --}}
    @if(session('success'))
        <div class="max-w-7xl mx-auto mt-4 px-4 sm:px-6 lg:px-8">
            <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {{ session('success') }}
            </div>
        </div>
    @endif

    @if(session('error'))
        <div class="max-w-7xl mx-auto mt-4 px-4 sm:px-6 lg:px-8">
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {{ session('error') }}
            </div>
        </div>
    @endif

    {{-- Page Content --}}
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {{ $slot }}
    </main>

    {{-- Alpine.js for dropdown interactions (lightweight, no build) --}}
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

    @stack('scripts')
    @livewireScripts
</body>
</html>
