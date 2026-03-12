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
            .no-print { display: none !important; }
        }
        .ba-content { line-height: 1.8; }
        .signature-block { page-break-inside: avoid; }
    </style>

    <div class="mb-6 flex justify-between items-center no-print">
        <a href="{{ route('penilaian.detail', ['id' => $penilaianId]) }}" class="text-blue-600 hover:underline">&larr; Kembali ke Detail Penilaian</a>
        <div class="space-x-2">
            <a href="{{ route('penilaian.ba-hasil.input', ['penilaianId' => $penilaianId]) }}" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md inline-block">
                Edit Data
            </a>
            <button onclick="window.print()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md">
                Cetak PDF
            </button>
        </div>
    </div>

    @if(!$baHasil)
        <div class="bg-red-100 text-red-700 p-3 rounded-md mb-4">{{ session('error') }}</div>
    @else
        <div class="bg-white p-8 md:p-12 rounded-lg shadow-lg max-w-4xl mx-auto printable-area font-serif text-black mb-12">
            <div class="text-center mb-8 uppercase font-bold text-lg">
                <h2>BERITA ACARA HASIL PENILAIAN</h2>
                <h2>PERNYATAAN MANDIRI PELAKU USAHA MIKRO DAN KECIL (UMK)</h2>
                <div class="border-b-2 border-black mt-2 mb-2 w-full mx-auto max-w-lg"></div>
                <p class="text-base normal-case">Nomor: {{ $baHasil->nomor_ba }}</p>
            </div>

            <div class="ba-content text-justify">
                <p class="indent-8 mb-4">
                    Pada hari ini <strong>{{ $tanggalBA['hari'] }}</strong> tanggal <strong>{{ $tanggalBA['tanggal'] }}</strong> bulan <strong>{{ $tanggalBA['bulan'] }}</strong> tahun <strong>{{ $tanggalBA['tahun'] }}</strong>, telah dilaksanakan Penilaian Pernyataan Mandiri Pelaku Usaha Mikro dan Kecil (UMK) terhadap Pemanfaatan Ruang:
                </p>

                <div class="ml-8 mb-4">
                    <table class="w-full">
                        <tr><td class="w-1/3">Nama Pelaku Usaha</td><td class="w-4">:</td><td>{{ $penilaian->kasus->pemegang->nama_pelaku_usaha ?? '-' }}</td></tr>
                        <tr><td>Nomor NIB</td><td>:</td><td>{{ $penilaian->kasus->pemegang->nib ?? '-' }}</td></tr>
                        <tr><td>Alamat</td><td>:</td><td>{{ $penilaian->kasus->pemegang->alamat ?? '-' }}</td></tr>
                    </table>
                </div>

                <p class="mb-4">
                    Dengan hasil penilaian sebagai berikut:
                </p>

                <div class="ml-8 mb-4 space-y-2">
                    <p>1. Kesesuaian Kegiatan Pemanfaatan Ruang (KKPR) dinyatakan <strong class="uppercase border-b border-black inline-block min-w-16 text-center">{{ $baHasil->validitas_kegiatan === 'BENAR' ? 'SESUAI' : 'TIDAK SESUAI' }}</strong>.</p>
                    <p>2. Pernyataan Mandiri dinyatakan <strong class="uppercase border-b border-black inline-block min-w-16 text-center">{{ $baHasil->validitas_kegiatan }}</strong>.</p>
                </div>

                <p class="mb-2 font-bold">Rekomendasi / Tindak Lanjut:</p>
                <div class="p-4 border border-gray-400 min-h-[100px] mb-8 bg-gray-50 whitespace-pre-wrap">{{ $baHasil->rekomendasi_lanjutan }}</div>
                
                <p class="indent-8 mb-8">
                    Demikian Berita Acara ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.
                </p>
            </div>

            <div class="signature-block mt-12">
                <h4 class="font-bold text-center mb-6">TANDA TANGAN PIHAK TERKAIT</h4>
                <div class="grid grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-6 text-center">
                    @if(is_array($baHasil->tanda_tangan_tim))
                        @foreach($baHasil->tanda_tangan_tim as $member)
                            <div>
                                <p class="text-sm font-semibold">{{ $member['jabatan'] }}</p>
                                <div class="h-24 w-full my-2 flex items-center justify-center">
                                    @if(!empty($member['signature_path']))
                                        <img src="{{ asset('storage/' . $member['signature_path']) }}" alt="Tanda Tangan" class="h-full object-contain" crossorigin="anonymous" />
                                    @endif
                                </div>
                                <p class="font-bold underline">{{ $member['nama'] }}</p>
                                <p class="text-sm">NIP. {{ $member['nip'] ?: '......................' }}</p>
                            </div>
                        @endforeach
                    @endif
                </div>
            </div>
        </div>
    @endif
</div>
