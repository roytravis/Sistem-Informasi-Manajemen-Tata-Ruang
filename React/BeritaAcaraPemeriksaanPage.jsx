import { useState, useEffect, useMemo, useRef } from 'react'; // Tambahkan useRef
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios'; // <-- PERBAIKAN 1: Import api
import SignatureCanvas from 'react-signature-canvas'; // Import SignatureCanvas

/**
 * Komponen untuk styling cetak.
 * Ini memastikan hanya area yang relevan yang dicetak dan
 * diformat agar terlihat seperti dokumen resmi (font Times New Roman).
 */
const PrintStyles = () => (
    <style>
        {`
            @page {
                size: A4; /* Ukuran kertas cetak */
                margin: 2cm 1.5cm; /* Margin halaman */
            }

            @media print {
                /* Sembunyikan semua elemen di luar area cetak */
                body * {
                    visibility: hidden !important;
                }
                .printable-area, .printable-area * {
                    visibility: visible !important;
                }
                .printable-area {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    box-shadow: none !important;
                    border: none !important;
                    font-size: 12pt; /* Ukuran font standar dokumen */
                    color: #000;
                    background-color: #fff !important;
                }
                
                /* Sembunyikan elemen no-print */
                .no-print {
                    display: none !important;
                }

                /* Atur font dokumen */
                .printable-area div, .printable-area p, .printable-area span, .printable-area th, .printable-area td, .printable-area li {
                    color: #000 !important;
                    font-family: 'Times New Roman', Times, serif !important;
                }
                
                /* Atur tabel agar rapi */
                .printable-area table {
                    width: 100% !important;
                    border-collapse: collapse !important;
                    page-break-inside: auto !important;
                }
                .printable-area tr {
                    page-break-inside: avoid !important;
                 }
                .printable-area th, .printable-area td {
                    border: 1px solid #777 !important; /* Border lebih tipis */
                    padding: 4px 6px !important;
                    vertical-align: top !important;
                    word-wrap: break-word;
                }
                 .printable-area th {
                    background-color: #f8f8f8 !important;
                    font-weight: bold;
                 }
                 
                /* Hindari tanda tangan terpotong antar halaman */
                .signature-block {
                    page-break-inside: avoid !important;
                 }
                 .signature-image-container img {
                     max-height: 5rem !important;
                 }
            
                /* --- PERBAIKAN CSS PRINT --- */
                /* Sembunyikan canvas tanda tangan pemegang & koordinator saat print */
                .pemegang-signature-canvas, .koordinator-signature-canvas {
                    display: none !important;
                }
                /* Tampilkan gambar tanda tangan pemegang & koordinator saat print jika ada */
                .pemegang-signature-image img, .koordinator-signature-image img {
                   display: inline-block !important; /* Pastikan gambar ditampilkan */
                   visibility: visible !important;
                }
                /* --- AKHIR PERBAIKAN CSS PRINT --- */
            }

            /* --- PERBAIKAN CSS SCREEN --- */
            /* Sembunyikan elemen gambar ttd pemegang & koordinator di layar SAAT FORM INPUT AKTIF */
            /* (Kita bisa target elemen parent atau menggunakan state, tapi ini lebih simpel) */
            /* Kita asumsikan saat form aktif, preview tidak dirender, jadi ini tidak perlu */
            /* @media screen { */
            /* Selector lebih spesifik jika diperlukan */
            /* } */

             /* Tampilkan elemen gambar ttd pemegang & koordinator di layar SAAT PREVIEW AKTIF */
             /* (Ini seharusnya default jika tidak ada @media screen yang menyembunyikan) */
            /* @media screen { */
                 /* .pemegang-signature-image, .koordinator-signature-image { display: block; }  */
            /* } */
            /* --- AKHIR PERBAIKAN CSS SCREEN --- */
        `}
    </style>
);


/**
 * Komponen untuk menampilkan baris data di tabel.
 */
const DataRow = ({ label, value, unit = '' }) => (
    <tr>
        <td className="w-2/5 p-2 border border-gray-300">{label}</td>
        <td className="w-3/5 p-2 border border-gray-300">
            {value || '-'} {unit.replace(/&sup2;/g, '²')}
        </td>
    </tr>
);

/**
 * Halaman Preview Berita Acara Pemeriksaan dan Pengukuran.
 */
export default function BeritaAcaraPemeriksaanPage() {
    const { id } = useParams(); // Ini adalah kasus_id
    const [kasus, setKasus] = useState(null); // State untuk menyimpan data kasus lengkap
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State untuk data manual BA
    const [manualData, setManualData] = useState({
        nomorBa: '',
        nomorSpt: '',
        tandaTanganPemegang: null, 
        namaPemegangTTD: '', 
        tandaTanganKoordinator: null,
        namaKoordinatorTTD: '',
    });
    const [isDataSubmitted, setIsDataSubmitted] = useState(false); // Kontrol tampilan form/preview
    const [manualError, setManualError] = useState('');
    const [submitManualLoading, setSubmitManualLoading] = useState(false);
    
    // Refs untuk signature pads
    const pemegangSigRef = useRef(null); 
    const koordinatorSigRef = useRef(null); 

    // Fetch data kasus dan BA yang mungkin sudah ada
    useEffect(() => {
        const fetchBaData = async () => {
            setLoading(true);
            setError(''); 
            try {
                // Panggil API untuk data kasus (yang sudah diperbaiki controllernya)
                const response = await api.get(`/penilaian/pmp-umk/${id}`);
                setKasus(response.data); // Simpan data kasus lengkap
                
                // Cek apakah ada data penilaian
                if (!response.data.penilaian) {
                    setError('Data penilaian untuk kasus ini tidak ditemukan. Berita Acara tidak dapat dibuat.');
                    setLoading(false); 
                    return; 
                } 
                
                // Coba ambil data BA yang mungkin sudah ada
                let existingManualData = null;
                try {
                    const baRes = await api.get(`/ba-pemeriksaan/${response.data.penilaian.id}`);
                    if (baRes.data) {
                        existingManualData = baRes.data;
                    }
                } catch (fetchBaErr) {
                    // Abaikan error jika BA belum ada, ini normal
                    if (fetchBaErr.response?.status !== 404) {
                         console.warn("Gagal fetch data BA:", fetchBaErr);
                    }
                }
                
                // --- PERUBAHAN LOGIKA ---
                // Isi form dengan data BA lama atau data default
                if (existingManualData) {
                    // Jika BA sudah ada, isi state manualData
                    setManualData({
                        nomorBa: existingManualData.nomor_ba || '',
                        nomorSpt: existingManualData.nomor_spt || '',
                        tandaTanganPemegang: existingManualData.tanda_tangan_pemegang || null, 
                        // Gunakan nama pemegang dari BA jika ada, fallback ke data kasus
                        namaPemegangTTD: existingManualData.nama_pemegang || response.data.pemegang?.nama_pelaku_usaha || '', 
                        tandaTanganKoordinator: existingManualData.tanda_tangan_koordinator || null,
                         // Gunakan nama koordinator dari BA jika ada, fallback ke data kasus
                        namaKoordinatorTTD: existingManualData.nama_koordinator || response.data.penanggung_jawab?.nama || '',
                    });
                     // Set state untuk langsung menampilkan PREVIEW
                     setIsDataSubmitted(true); 
                } else {
                     // Jika BA baru, isi nama default dari data kasus
                     setManualData(prev => ({
                         ...prev,
                         namaPemegangTTD: response.data.pemegang?.nama_pelaku_usaha || '',
                         // Nama koordinator diambil dari kasus yang sudah dimuat
                         namaKoordinatorTTD: response.data.penanggung_jawab?.nama || '' 
                     }));
                     // Pastikan state menampilkan mode INPUT
                     setIsDataSubmitted(false);
                }
                // --- AKHIR PERUBAHAN LOGIKA ---
                
            } catch (err) {
                 // Tangani error fetch data kasus utama
                setError(`Gagal memuat data kasus: ${err.response?.data?.message || err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchBaData();
    }, [id]); 

    // Handler untuk tombol print
    const handlePrint = () => {
        window.print();
    };

    // Mengolah data untuk ditampilkan di preview (menggunakan useMemo)
    const processedData = useMemo(() => {
        if (!kasus) return null; 

        const { pemegang, penilaian, tim, penanggung_jawab } = kasus;

        const tglBaInput = manualData.nomorBa ? new Date() : (penilaian ? new Date(penilaian.updated_at) : new Date()); 
        const tglOptions = { timeZone: 'Asia/Jakarta' };
        const hari = tglBaInput.toLocaleDateString('id-ID', { ...tglOptions, weekday: 'long' });
        const tanggal = tglBaInput.toLocaleDateString('id-ID', { ...tglOptions, day: 'numeric' });
        const bulan = tglBaInput.toLocaleDateString('id-ID', { ...tglOptions, month: 'long' });
        const tahun = tglBaInput.toLocaleDateString('id-ID', { ...tglOptions, year: 'numeric' });

        // Koordinator diambil dari kasus (sudah dimuat API)
        const koordinator = penanggung_jawab; 
        
        // --- PERBAIKAN 2: Filter anggota tim ---
        // Ambil HANYA 'Petugas Lapangan'
        const petugasLapangan = tim?.users?.filter(u => u.pivot?.jabatan_di_tim === 'Petugas Lapangan') || []; 
        // --- AKHIR PERBAIKAN 2 ---

        const semuaPetugas = [koordinator, ...petugasLapangan].filter(Boolean); 

        const pem = penilaian?.pemeriksaan || [];
        const png = penilaian?.pengukuran || [];

        // Signature map HANYA untuk TTD Petugas Lapangan dari PENILAIAN
        const signatureMap = (penilaian?.tanda_tangan_tim || []).reduce((acc, sig) => {
            // Cek apakah user ID tanda tangan ada di dalam array petugasLapangan
            if (petugasLapangan.some(p => p.id === sig.user_id)) {
                 acc[sig.user_id] = sig.signature_path;
            }
            return acc;
        }, {});

        return {
            pemegang,
            penilaian, 
            koordinator, 
            petugasLapangan, 
            semuaPetugas, 
            signatureMap, // Hanya TTD petugas dari penilaian
            tanggalBA: { hari, tanggal, bulan, tahun },
            dataPemeriksaan: {
                alamat: pem[0]?.pernyataan_mandiri,
                desa: pem[1]?.pernyataan_mandiri,
                kecamatan: pem[2]?.pernyataan_mandiri,
                kabupaten: pem[3]?.pernyataan_mandiri,
                provinsi: pem[4]?.pernyataan_mandiri,
                lintang: pem[5]?.pernyataan_mandiri,
                bujur: pem[6]?.pernyataan_mandiri,
                jenisKegiatan: pem[7]?.pernyataan_mandiri,
            },
            dataPengukuran: {
                luasDigunakan: png[0]?.hasil_pengukuran,
                luasDikuasai: png[1]?.hasil_pengukuran,
                kdb: png[2]?.hasil_pengukuran,
                klb_lantai: png[3]?.hasil_pengukuran,
                klb_luas: png[4]?.hasil_pengukuran,
                tinggi: png[5]?.hasil_pengukuran,
                kdh_vegetasi: png[6]?.hasil_pengukuran,
                kdh_perkerasan: png[7]?.hasil_pengukuran,
                ktb: png[8]?.hasil_pengukuran,
                gsb: png[9]?.hasil_pengukuran,
                jbb_belakang: png[10]?.hasil_pengukuran,
                jbb_samping: png[11]?.hasil_pengukuran,
            }
        };
    }, [kasus, manualData.nomorBa]); // Recalculate if kasus or nomorBa changes

    // Handler perubahan input form manual
    const handleManualChange = (e) => {
        const { name, value } = e.target;
        setManualData(prev => ({ ...prev, [name]: value }));
    };

    // Handler submit form manual
    const handleDataSubmit = async (e) => {
        e.preventDefault();
        setManualError('');
        
        // Validasi field wajib
        if (!manualData.nomorBa.trim() || !manualData.nomorSpt.trim() || !manualData.namaPemegangTTD.trim()) {
            setManualError('Nomor Berita Acara, Nomor SPT, dan Nama Pemegang (untuk TTD) wajib diisi.');
            return;
        }
        
        // Cek ID Penilaian
        if (!kasus?.penilaian?.id) {
             setManualError('Tidak dapat menyimpan BA karena ID Penilaian tidak ditemukan.');
             return;
        }
        
        // Validasi TTD Pemegang (wajib jika canvas kosong & tidak ada ttd lama)
        if (pemegangSigRef.current && pemegangSigRef.current.isEmpty() && !manualData.tandaTanganPemegang) {
            setManualError('Tanda tangan Pemegang Pernyataan Mandiri wajib diisi.');
            return;
        }

        // Validasi TTD Koordinator (jika ada koordinator)
        const koordinatorExists = kasus?.penanggung_jawab; 
        if (koordinatorExists && !manualData.namaKoordinatorTTD.trim()) {
             setManualError('Nama Koordinator (untuk TTD) wajib diisi.');
            return;
        }
        if (koordinatorExists && koordinatorSigRef.current && koordinatorSigRef.current.isEmpty() && !manualData.tandaTanganKoordinator) {
            setManualError('Tanda Tangan Koordinator Lapangan wajib diisi.');
            return;
        }

        // Ambil data TTD (baru atau lama)
        const ttdPemegangBase64 = pemegangSigRef.current && !pemegangSigRef.current.isEmpty() 
            ? pemegangSigRef.current.toDataURL() 
            : manualData.tandaTanganPemegang;
        
        const ttdKoordinatorBase64 = koordinatorExists 
            ? (koordinatorSigRef.current && !koordinatorSigRef.current.isEmpty() 
                ? koordinatorSigRef.current.toDataURL() 
                : manualData.tandaTanganKoordinator) 
            : null;

        // Validasi ulang TTD (jika ttd lama null)
        if (!ttdPemegangBase64) {
             setManualError('Tanda tangan Pemegang Pernyataan Mandiri wajib diisi.');
             return;
        }
         if (koordinatorExists && !ttdKoordinatorBase64) {
            setManualError('Tanda Tangan Koordinator Lapangan wajib diisi.');
            return;
        }

        // Siapkan data untuk dikirim ke API
        const dataToSave = {
            penilaian_id: kasus.penilaian.id, 
            nomor_ba: manualData.nomorBa,
            nomor_spt: manualData.nomorSpt,
            tanda_tangan_pemegang: ttdPemegangBase64, 
            nama_pemegang: manualData.namaPemegangTTD,
            tanda_tangan_koordinator: ttdKoordinatorBase64,
            nama_koordinator: manualData.namaKoordinatorTTD,
        };

        setSubmitManualLoading(true);
        try {
            // Panggil API untuk menyimpan data
            const response = await api.post('/ba-pemeriksaan', dataToSave); 
            
            // Update state manualData dengan data dari response (termasuk TTD baru)
            setManualData(prev => ({
                ...prev, 
                tandaTanganPemegang: response.data.tanda_tangan_pemegang, 
                tandaTanganKoordinator: response.data.tanda_tangan_koordinator 
            }));
            setIsDataSubmitted(true); // Pindah ke tampilan preview
        } catch (err) {
            setManualError(err.response?.data?.message || 'Gagal menyimpan data manual. Coba lagi.');
        } finally {
            setSubmitManualLoading(false);
        }
    };

    // ----- Tampilan Komponen -----

    // Tampilkan loading jika data masih diambil
    if (loading) return <div className="text-center py-10">Memuat data...</div>;
    // Tampilkan error utama jika terjadi
    if (error) return <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>; 
    // Tampilkan jika data kasus tidak ada (setelah loading selesai)
    if (!kasus) return <div className="text-center py-10">Data kasus tidak ditemukan.</div>; 

    // --- Render Form Input Jika isDataSubmitted false ---
    if (!isDataSubmitted) {
        return (
            <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-8">
                 {/* Tombol Kembali */}
                 <div className="mb-6 flex justify-between items-center no-print">
                    <Link to="/penilaian" className="text-blue-600 hover:underline">&larr; Kembali</Link>
                </div>
                {/* Judul Form */}
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Input Data Berita Acara</h2>
                {/* Tampilkan error form jika ada */}
                {manualError && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{manualError}</p>}
                
                {/* Form Input */}
                <form onSubmit={handleDataSubmit} className="space-y-4">
                    {/* Input Nomor BA */}
                    <div>
                        <label htmlFor="nomorBa" className="block text-sm font-medium text-gray-700">Nomor Berita Acara *</label>
                        <input type="text" id="nomorBa" name="nomorBa" value={manualData.nomorBa} onChange={handleManualChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                    </div>
                    {/* Input Nomor SPT */}
                    <div>
                        <label htmlFor="nomorSpt" className="block text-sm font-medium text-gray-700">Nomor Surat Perintah Tugas *</label>
                        <input type="text" id="nomorSpt" name="nomorSpt" value={manualData.nomorSpt} onChange={handleManualChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                    </div>
                    {/* Input Nama Pemegang TTD */}
                     <div>
                        <label htmlFor="namaPemegangTTD" className="block text-sm font-medium text-gray-700">Nama Pemegang (untuk TTD) *</label>
                        <input type="text" id="namaPemegangTTD" name="namaPemegangTTD" value={manualData.namaPemegangTTD} onChange={handleManualChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                        <p className="text-xs text-gray-500 mt-1">Nama ini akan dicetak di bawah tanda tangan pemegang.</p>
                    </div>
                    {/* Input TTD Pemegang */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tanda Tangan Pemegang Pernyataan Mandiri / Wakilnya *</label>
                        {/* Tampilkan TTD lama jika ada */}
                        {manualData.tandaTanganPemegang && (
                            <div className="mb-2 p-2 border rounded-md inline-block">
                                <p className='text-xs text-gray-500 mb-1'>Tanda Tangan Tersimpan:</p>
                                <img src={manualData.tandaTanganPemegang} alt="TTD Pemegang Tersimpan" className="h-20 border"/>
                            </div>
                        )}
                        {/* Canvas TTD Pemegang */}
                        <div className="mt-1 border border-gray-300 rounded-md bg-gray-50 pemegang-signature-canvas">
                            <SignatureCanvas 
                                ref={pemegangSigRef} 
                                penColor='black' 
                                canvasProps={{ className: 'w-full h-40' }} 
                            />
                        </div>
                        {/* Tombol Ulangi TTD Pemegang */}
                        <button type="button" onClick={() => { pemegangSigRef.current?.clear(); setManualData(prev => ({...prev, tandaTanganPemegang: null})); }} className="text-sm text-blue-600 hover:underline mt-1">Ulangi Tanda Tangan</button>
                    </div>

                    {/* --- Input TTD Koordinator (Muncul jika ada koordinator di data 'kasus') --- */}
                    {kasus?.penanggung_jawab && ( 
                        <>
                            {/* Input Nama Koordinator TTD */}
                            <div>
                                <label htmlFor="namaKoordinatorTTD" className="block text-sm font-medium text-gray-700">Nama Koordinator Lapangan (untuk TTD) *</label>
                                <input 
                                    type="text" 
                                    id="namaKoordinatorTTD" 
                                    name="namaKoordinatorTTD" 
                                    // Pastikan value diambil dari manualData
                                    value={manualData.namaKoordinatorTTD} 
                                    onChange={handleManualChange} 
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
                                    required 
                                />
                            </div>
                            {/* Input TTD Koordinator */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tanda Tangan Koordinator Lapangan *</label>
                                {/* Tampilkan TTD lama jika ada */}
                                {manualData.tandaTanganKoordinator && (
                                    <div className="mb-2 p-2 border rounded-md inline-block">
                                        <p className='text-xs text-gray-500 mb-1'>Tanda Tangan Tersimpan:</p>
                                        <img src={manualData.tandaTanganKoordinator} alt="TTD Koordinator Tersimpan" className="h-20 border"/>
                                    </div>
                                )}
                                {/* Canvas TTD Koordinator */}
                                <div className="mt-1 border border-gray-300 rounded-md bg-gray-50 koordinator-signature-canvas">
                                    <SignatureCanvas 
                                        ref={koordinatorSigRef} 
                                        penColor='black' 
                                        canvasProps={{ className: 'w-full h-40' }} 
                                    />
                                </div>
                                {/* Tombol Ulangi TTD Koordinator */}
                                <button type="button" onClick={() => { koordinatorSigRef.current?.clear(); setManualData(prev => ({...prev, tandaTanganKoordinator: null})); }} className="text-sm text-blue-600 hover:underline mt-1">Ulangi Tanda Tangan</button>
                            </div>
                        </>
                    )}
                    {/* --- Akhir Input TTD Koordinator --- */}

                    {/* Tombol Submit */}
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg" disabled={submitManualLoading}>
                            {submitManualLoading ? 'Menyimpan...' : 'Lanjutkan ke Preview'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // --- Render Preview Jika isDataSubmitted true ---
    // Pastikan processedData sudah siap sebelum render preview
    if (!processedData) return <div className="text-center py-10">Menyiapkan data preview...</div>; 

    // Destructuring data untuk preview
    const { 
        pemegang, koordinator, petugasLapangan, semuaPetugas, signatureMap, 
        tanggalBA, dataPemeriksaan, dataPengukuran 
    } = processedData;

    return (
        <div>
            {/* Sisipkan style cetak */}
            <PrintStyles />
            
            {/* Tombol Aksi di Atas Preview */}
            <div className="mb-6 flex justify-between items-center no-print px-4 py-3 bg-white shadow-sm sm:px-6 lg:px-8">
                 <div>
                    {/* Tombol Kembali ke Form Input */}
                    <button onClick={() => setIsDataSubmitted(false)} className="text-blue-600 hover:underline text-sm mr-4">
                        &larr; Ubah Data Manual
                    </button>
                    {/* Tombol Kembali ke Dashboard */}
                    <Link to="/penilaian" className="text-blue-600 hover:underline text-sm">&larr; Kembali ke Dashboard</Link>
                </div>
                {/* Tombol Cetak */}
                <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                    Cetak / Simpan PDF
                </button>
            </div>

            {/* --- Area Preview Dokumen --- */}
            <div className="printable-area max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 md:p-12 font-serif text-black">
                {/* Header BA */}
                <div className="text-center uppercase font-bold">
                    <h2 className="text-lg tracking-wider">BERITA ACARA PEMERIKSAAN DAN PENGUKURAN</h2>
                    <h3 className="text-lg tracking-wider">PERNYATAAN MANDIRI PELAKU USAHA MIKRO DAN KECIL</h3>
                    <div className="border-b-2 border-black mt-2 mb-2 w-full"></div>
                    <p className="text-base normal-case">Nomor: {manualData.nomorBa || '..............................'}</p>
                </div>

                {/* Body BA */}
                <div className="mt-8 text-justify leading-loose">
                    {/* Paragraf Pembuka */}
                    <p className="indent-8">
                        Pada hari ini, {tanggalBA.hari} tanggal {tanggalBA.tanggal} bulan {tanggalBA.bulan} tahun {tanggalBA.tahun}, 
                        kami yang bertanda tangan di bawah ini:
                    </p>
                    
                    {/* Daftar Tim */}
                    <div className="mt-4 ml-8 space-y-4 text-sm">
                        {semuaPetugas && semuaPetugas.length > 0 ? semuaPetugas.map((petugas) => ( 
                            <div key={petugas.id} className="grid grid-cols-[80px_10px_auto]">
                                <span>Nama</span><span>:</span><span className="font-semibold">{petugas.nama}</span>
                                <span>NIP/NIK</span><span>:</span><span>{petugas.nip || '-'}</span>
                                <span>Jabatan</span><span>:</span><span>{petugas.pivot?.jabatan_di_tim || petugas.role}</span>
                           </div>
                        )) : <p>Data tim tidak tersedia.</p>}
                    </div>

                    {/* Paragraf Berdasarkan SPT */}
                    <p className="mt-4 indent-8">
                        Berdasarkan Surat Perintah Tugas Nomor {manualData.nomorSpt || '.....................'}, telah melakukan pemeriksaan dan
                        pengukuran terhadap lokasi kegiatan Pemanfaatan Ruang dengan hasil sebagai berikut:
                    </p>

                    {/* Hasil Pemeriksaan & Pengukuran */}
                    <h4 className="font-bold text-center mt-6 mb-2">Hasil Pemeriksaan dan Pengukuran</h4>
                    {/* Data Pemegang */}
                    <h5 className="font-semibold mb-2">Pernyataan Mandiri Pelaku Usaha Mikro dan Kecil</h5>
                    {pemegang ? ( 
                    <table className="w-full border border-gray-300 text-sm mb-4">
                        <tbody>
                            <DataRow label="Nama Pelaku Usaha" value={pemegang.nama_pelaku_usaha} />
                            <DataRow label="Nomor Identitas" value={pemegang.nomor_identitas} />
                            <DataRow label="Alamat" value={pemegang.alamat} />
                            <DataRow label="Nomor Telepon" value={pemegang.nomor_handphone} />
                            <DataRow label="Email" value={pemegang.email} />
                        </tbody>
                    </table>
                    ) : <p>Data pemegang tidak tersedia.</p>}

                    {/* Data Pemeriksaan */}
                    <h5 className="font-semibold mb-2 mt-4">A. Pemeriksaan</h5>
                    <table className="w-full border border-gray-300 text-sm mb-4">
                        <tbody>
                            <DataRow label="Lokasi Usaha - Alamat" value={dataPemeriksaan.alamat} />
                            <DataRow label="Lokasi Usaha - Desa/Kelurahan" value={dataPemeriksaan.desa} />
                            <DataRow label="Lokasi Usaha - Kecamatan" value={dataPemeriksaan.kecamatan} />
                            <DataRow label="Lokasi Usaha - Kabupaten/Kota" value={dataPemeriksaan.kabupaten} />
                            <DataRow label="Lokasi Usaha - Provinsi" value={dataPemeriksaan.provinsi} />
                            <DataRow label="Koordinat Lokasi - Lintang" value={dataPemeriksaan.lintang} />
                            <DataRow label="Koordinat Lokasi - Bujur" value={dataPemeriksaan.bujur} />
                            <DataRow label="Jenis Kegiatan Pemanfaatan Ruang" value={dataPemeriksaan.jenisKegiatan} />
                        </tbody>
                    </table>
                    
                    {/* Data Pengukuran */}
                    <h5 className="font-semibold mb-2 mt-4">B. Pengukuran (Opsional)</h5>
                    <table className="w-full border border-gray-300 text-sm">
                        <tbody>
                            <DataRow label="Luas Tanah yang digunakan kegiatan Pemanfaatan Ruang" value={dataPengukuran.luasDigunakan} unit="m&sup2;" />
                            <DataRow label="Luas Tanah yang dikuasai" value={dataPengukuran.luasDikuasai} unit="m&sup2;" />
                            <DataRow label="KDB - Luas Lantai Dasar Bangunan" value={dataPengukuran.kdb} unit="m&sup2;" />
                            <DataRow label="KLB - Jumlah Lantai Bangunan" value={dataPengukuran.klb_lantai} unit="lantai" />
                            <DataRow label="KLB - Luas Seluruh Lantai Bangunan" value={dataPengukuran.klb_luas} unit="m&sup2;" />
                            <DataRow label="Ketinggian Bangunan" value={dataPengukuran.tinggi} unit="m" />
                            <DataRow label="KDH - Luas Tanah yang Terdapat Vegetasi" value={dataPengukuran.kdh_vegetasi} unit="m&sup2;" />
                            <DataRow label="KDH - Luas Tanah yang Tertutup Perkerasan..." value={dataPengukuran.kdh_perkerasan} unit="m&sup2;" />
                            <DataRow label="Koefisien Tapak Basemen" value={dataPengukuran.ktb} unit="m&sup2;" />
                            <DataRow label="Garis Sempadan Bangunan" value={dataPengukuran.gsb} unit="m" />
                            <DataRow label="Jarak Bebas Bangunan (Batas Petak Belakang)" value={dataPengukuran.jbb_belakang} unit="m" />
                            <DataRow label="Jarak Bebas Bangunan (Batas Petak Samping)" value={dataPengukuran.jbb_samping} unit="m" />
                        </tbody>
                    </table>

                    {/* Paragraf Penutup */}
                    <p className="mt-6 indent-8">
                        Demikian Berita Acara ini dibuat dalam rangkap secukupnya untuk dipergunakan sebagaimana mestinya.
                    </p>
                </div>

                {/* --- Bagian Tanda Tangan --- */}
                <div className="mt-12">
                    {/* TTD Pemegang dan Koordinator */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-10 text-center">
                        {/* Tanda Tangan Pemegang */}
                        <div className="signature-block mt-4">
                            <p>Pemegang Pernyataan Mandiri Pelaku UMK/ Wakilnya</p>
                            <div className="h-28 w-full my-2 flex items-center justify-center pemegang-signature-image"> 
                                {manualData.tandaTanganPemegang ? (
                                    <img src={manualData.tandaTanganPemegang} alt={`Tanda Tangan ${manualData.namaPemegangTTD}`} className="h-full object-contain"/>
                                ) : (
                                    <span className="text-gray-400 text-sm">(Tanda Tangan Belum Ada)</span>
                                )}
                            </div>
                            <p className="font-bold underline">({manualData.namaPemegangTTD || pemegang?.nama_pelaku_usaha || '......................'})</p> 
                        </div>
                        
                        {/* Tanda Tangan Koordinator */}
                        {koordinator && (
                            <div className="signature-block mt-4">
                                <p>Koordinator Lapangan,</p>
                                <div className="h-28 w-full my-2 flex items-center justify-center koordinator-signature-image"> 
                                    {manualData.tandaTanganKoordinator ? (
                                        <img src={manualData.tandaTanganKoordinator} alt={`Tanda Tangan ${manualData.namaKoordinatorTTD}`} className="h-full object-contain"/>
                                    ) : (
                                        <span className="text-gray-400 text-sm">(Tanda Tangan Belum Ada)</span>
                                    )}
                                </div>
                                <p className="font-bold underline">({manualData.namaKoordinatorTTD || koordinator.nama})</p>
                                <p>NIP: {koordinator.nip || '..............................'}</p>
                            </div>
                        )}
                         {/* Placeholder jika tidak ada koordinator */}
                         {!koordinator && <div className="signature-block mt-4"></div>}
                    </div>
                    
                    {/* Tanda Tangan Petugas Lapangan */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-10 mt-10 text-center">
                        {/* Gunakan petugasLapangan (sudah difilter) */}
                        {petugasLapangan && petugasLapangan.length > 0 ? petugasLapangan.map((petugas, index) => ( 
                            <div key={petugas.id} className="signature-block mt-4">
                                <p>Petugas Lapangan {index + 1}</p>
                                <div className="h-28 w-full my-2 flex items-center justify-center signature-image-container"> 
                                    {/* Gunakan signatureMap (sudah difilter) */}
                                    {/* --- PERBAIKAN 1: Ganti URL Tanda Tangan --- */}
                                    {signatureMap[petugas.id] ? ( 
                                        <img src={`${api.defaults.baseURL}/signatures/${signatureMap[petugas.id]}`} alt={`Tanda Tangan ${petugas.nama}`} className="h-full object-contain"/>
                                    ) : (
                                    // --- AKHIR PERBAIKAN 1 ---
                                        <span className="text-gray-400 text-sm">(Belum TTD di Penilaian)</span>
                                    )}
                                </div>
                                <p className="font-bold underline">({petugas.nama})</p>
                                <p>NIP/NIK: {petugas.nip || '..............................'}</p>
                            </div>
                        )) : (
                            <>
                             <div className="signature-block mt-4"><p className="text-gray-400 text-sm">(Tidak ada Petugas Lapangan 1)</p></div>
                             <div className="signature-block mt-4"><p className="text-gray-400 text-sm">(Tidak ada Petugas Lapangan 2)</p></div>
                            </>
                        )}
                        {/* Placeholder ganjil */}
                        {petugasLapangan && petugasLapangan.length % 2 !== 0 && <div className="signature-block mt-4"></div>}
                    </div>
                </div>
            </div>
            {/* --- Akhir Area Preview --- */}
        </div>
    );
}