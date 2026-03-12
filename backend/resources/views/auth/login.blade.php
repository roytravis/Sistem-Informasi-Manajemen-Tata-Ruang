<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login — SIMANTRA</title>

    {{-- Tailwind CSS via CDN --}}
    <script src="https://cdn.tailwindcss.com"></script>

    {{-- Inter Font --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center bg-gray-50">

    <div class="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 class="text-2xl font-bold text-center text-gray-800 mb-6">Login SIMANTRA</h2>

        <form method="POST" action="{{ route('login') }}">
            @csrf

            {{-- Error Messages --}}
            @if($errors->any())
                <div class="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">
                    @foreach($errors->all() as $error)
                        <p>{{ $error }}</p>
                    @endforeach
                </div>
            @endif

            {{-- NIP Field --}}
            <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="nip">NIP</label>
                <input id="nip"
                       type="text"
                       name="nip"
                       value="{{ old('nip') }}"
                       class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                       required
                       autofocus />
            </div>

            {{-- Password Field --}}
            <div class="mb-6">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="password">Password</label>
                <input id="password"
                       type="password"
                       name="password"
                       class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                       required />
            </div>

            {{-- Submit Button --}}
            <div class="flex items-center justify-between">
                <button type="submit"
                        class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full transition-colors">
                    Login
                </button>
            </div>
        </form>
    </div>

</body>
</html>
