<div>
    <style>
        @media print {
            body * { visibility: hidden; }
            .printable-area, .printable-area * { visibility: visible; }
            .printable-area { 
                position: absolute; 
                left: 0; 
                top: 0; 
                width: 100%;
                font-family: 'Times New Roman', Times, serif;
                font-size: 12pt;
            }
            .no-print { display: none; }
        }
        .ba-content { line-height: 2; }
        .signature-block { page-break-inside: avoid; }
    </style>

    <div class="mb-6 flex justify-between items-center no-print px-4 py-3 bg-white shadow-sm sm:px-6 lg:px-8">
        <a href="{{ route('penilaian') }}" class="text-blue-600 hover:underline">&larr; Kembali ke Dashboard Penilaian</a>
        <button onclick="window.print()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Cetak PDF
        </button>
    </div>

    <div class="bg-white p-8 md:p-12 rounded-lg shadow-lg max-w-4xl mx-auto printable-area font-serif text-black mb-12">
        <div class="text-center uppercase font-bold">
            <h2 class="text-lg tracking-wider">BERITA ACARA</h2>
            <h3 class="text-lg tracking-wider">TIDAK TERLAKSANANYA PENILAIAN PERNYATAAN MANDIRI</h3>
            <h3 class="text-lg tracking-wider">PELAKU USAHA MIKRO DAN KECIL (UMK)</h3>
            <div class="border-b-2 border-black mt-2 mb-2 w-full"></div>
            <p class="text-base normal-case">Nomor: {{ $ba->nomor_ba }}</p>
        </div>

        <div class="mt-8 text-justify ba-content">
            <p class="indent-8">
                Pada hari ini, {{ $tanggalBeritaAcaraStr['weekday'] }} tanggal {{ $tanggalBeritaAcaraStr['day'] }} bulan {{ $tanggalBeritaAcaraStr['month'] }} tahun {{ $tanggalBeritaAcaraStr['year'] }},
                kami yang bertanda tangan di bawah ini selaku Tim Penilai PMP UMK:
            </p>

            <div class="mt-4 ml-8 space-y-2">
                @foreach($timPenilai as $penilai)
                    <div class="grid grid-cols-[80px_10px_auto]">
                        <span>Nama</span><span>:</span><span>{{ $penilai['nama'] }}</span>
                        <span>NIP/NIK</span><span>:</span><span>{{ $penilai['nip'] ?: '..............................' }}</span>
                        <span>Jabatan</span><span>:</span><span>{{ $penilai['jabatan'] }}</span>
                    </div>
                @endforeach
            </div>

            <p class="mt-4 indent-8">
                Dengan ini menyatakan bahwa penilaian pernyataan mandiri pelaku Usaha Mikro dan Kecil (UMK)
                atas nama <strong>{{ $ba->pemegang->nama_pelaku_usaha ?? '-' }}</strong> tidak dapat dilaksanakan, dikarenakan:
            </p>
            <p class="mt-4 indent-8">
                Pemegang pernyataan mandiri pelaku UMK tidak <strong>{{ $alasanText }}</strong>.
                Hal tersebut mengakibatkan penilaian pernyataan mandiri pelaku UMK tidak terlaksana sebagaimana seharusnya.
            </p>
            <p class="mt-4 indent-8">
                Demikian Berita Acara ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
            </p>
        </div>

        <div class="mt-12">
            <h4 class="font-semibold text-center">Tanda Tangan Tim Penilai</h4>
            <div class="grid grid-cols-2 gap-x-8 gap-y-10 mt-6 text-center">
                @foreach($timPenilai as $member)
                    <div class="signature-block mt-4">
                        <p>{{ $member['jabatan'] }}</p>
                        <div class="h-24 w-full my-2 flex items-center justify-center">
                            @if(isset($signatureMap[$member['id']]))
                                <img src="{{ asset('storage/' . $signatureMap[$member['id']]) }}" alt="Tanda Tangan {{ $member['nama'] }}" class="h-full object-contain" crossorigin="anonymous" />
                            @endif
                        </div>
                        <p class="font-bold underline">({{ $member['nama'] }})</p>
                        <p>NIP/NIK: {{ $member['nip'] ?: '..............................' }}</p>
                    </div>
                @endforeach
            </div>
        </div>
    </div>
</div>
