import { useState, useEffect, useMemo, useRef } from 'react'; // Tambahkan useRef
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
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
    const [kasus, setKasus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- State Baru untuk Data Manual ---
    const [manualData, setManualData] = useState({
        nomorBa: '',
        nomorSpt: '',
        tandaTanganPemegang: null, // Akan menyimpan data URL base64
        namaPemegangTTD: '', // Nama pemegang yang akan dicetak di bawah TTD
        tandaTanganKoordinator: null,
        namaKoordinatorTTD: '',
    });
    const [isDataSubmitted, setIsDataSubmitted] = useState(false); // Status form manual
    const [manualError, setManualError] = useState('');
    const [submitManualLoading, setSubmitManualLoading] = useState(false);
    const pemegangSigRef = useRef(null); // Ref untuk canvas tanda tangan pemegang
    const koordinatorSigRef = useRef(null); // Ref untuk TTD koordinator

    useEffect(() => {
        const fetchBaData = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/penilaian/pmp-umk/${id}`);
                setKasus(response.data);
                
                if (!response.data.penilaian) {
                    setError('Data penilaian untuk kasus ini tidak ditemukan. Berita Acara tidak dapat dibuat.');
                } else {
                    let existingManualData = null;
                    try {
                        const baRes = await api.get(`/ba-pemeriksaan/${response.data.penilaian.id}`);
                        if (baRes.data) {
                            existingManualData = baRes.data;
                        }
                    } catch (fetchBaErr) {
                        console.warn("Data BA pemeriksaan belum ada, akan dibuat baru.", fetchBaErr);
                    }
                    
                    if (existingManualData) {
                        setManualData({
                            nomorBa: existingManualData.nomor_ba || '',
                            nomorSpt: existingManualData.nomor_spt || '',
                            tandaTanganPemegang: existingManualData.tanda_tangan_pemegang || null, 
                            namaPemegangTTD: existingManualData.nama_pemegang || response.data.pemegang?.nama_pelaku_usaha || '',
                            tandaTanganKoordinator: existingManualData.tanda_tangan_koordinator || null,
                            namaKoordinatorTTD: existingManualData.nama_koordinator || response.data.penanggung_jawab?.nama || '',
                        });
                    } else {
                         setManualData(prev => ({
                             ...prev,
                             namaPemegangTTD: response.data.pemegang?.nama_pelaku_usaha || '',
                             namaKoordinatorTTD: response.data.penanggung_jawab?.nama || '' 
                         }));
                    }
                }
            } catch (err) {
                setError('Gagal memuat data untuk Berita Acara.');
            } finally {
                setLoading(false);
            }
        };
        fetchBaData();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    const processedData = useMemo(() => {
        // PERBAIKAN: Cukup periksa kasus saja, karena penilaian sudah dicek di useEffect
        if (!kasus) return null; 

        const { pemegang, penilaian, tim, penanggung_jawab } = kasus;

        // Pastikan penilaian ada sebelum mencoba mengakses updated_at
        const tglPenilaian = penilaian ? new Date(penilaian.updated_at) : new Date(); 
        const tglOptions = { timeZone: 'Asia/Jakarta' };
        const hari = tglPenilaian.toLocaleDateString('id-ID', { ...tglOptions, weekday: 'long' });
        const tanggal = tglPenilaian.toLocaleDateString('id-ID', { ...tglOptions, day: 'numeric' });
        const bulan = tglPenilaian.toLocaleDateString('id-ID', { ...tglOptions, month: 'long' });
        const tahun = tglPenilaian.toLocaleDateString('id-ID', { ...tglOptions, year: 'numeric' });

        const koordinator = penanggung_jawab;
        const petugasLapangan = tim?.users?.filter(u => u.id !== koordinator?.id) || [];
        const semuaPetugas = [koordinator, ...petugasLapangan].filter(Boolean); 

        // Pastikan penilaian ada sebelum mencoba mengakses pemeriksaan/pengukuran
        const pem = penilaian?.pemeriksaan || [];
        const png = penilaian?.pengukuran || [];

        // Pastikan penilaian ada sebelum mencoba mengakses tanda_tangan_tim
        const signatureMap = (penilaian?.tanda_tangan_tim || []).reduce((acc, sig) => {
            acc[sig.user_id] = sig.signature_path;
            return acc;
        }, {});

        return {
            pemegang,
            penilaian, // Tetap sertakan penilaian untuk referensi lain jika perlu
            koordinator,
            petugasLapangan,
            semuaPetugas,
            signatureMap,
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
    }, [kasus]); // Dependensi hanya pada kasus

    const handleManualChange = (e) => {
        const { name, value } = e.target;
        setManualData(prev => ({ ...prev, [name]: value }));
    };

    const handleDataSubmit = async (e) => {
        e.preventDefault();
        setManualError('');
        
        if (!manualData.nomorBa.trim() || !manualData.nomorSpt.trim() || !manualData.namaPemegangTTD.trim()) {
            setManualError('Nomor Berita Acara, Nomor SPT, dan Nama Pemegang (untuk TTD) wajib diisi.');
            return;
        }
        
        // Cek dulu apakah data penilaian ada sebelum melanjutkan
        if (!kasus?.penilaian?.id) {
             setManualError('Tidak dapat menyimpan BA karena ID Penilaian tidak ditemukan.');
             return;
        }
        
        if (!manualData.tandaTanganPemegang && pemegangSigRef.current.isEmpty()) {
            setManualError('Tanda tangan Pemegang Pernyataan Mandiri wajib diisi.');
            return;
        }

        // PERBAIKAN: Gunakan kasus?.penanggung_jawab untuk cek koordinator
        const koordinatorExists = kasus?.penanggung_jawab; 
        if (koordinatorExists && !manualData.namaKoordinatorTTD.trim()) {
             setManualError('Nama Koordinator (untuk TTD) wajib diisi.');
            return;
        }
         // Pastikan koordinatorSigRef.current tidak null sebelum memanggil isEmpty()
        if (koordinatorExists && !manualData.tandaTanganKoordinator && (!koordinatorSigRef.current || koordinatorSigRef.current.isEmpty())) {
            setManualError('Tanda Tangan Koordinator Lapangan wajib diisi.');
            return;
        }

        // Pastikan pemegangSigRef.current tidak null sebelum memanggil isEmpty() atau toDataURL()
        const ttdPemegangBase64 = pemegangSigRef.current && !pemegangSigRef.current.isEmpty() 
            ? pemegangSigRef.current.toDataURL() 
            : manualData.tandaTanganPemegang;
        
        // Pastikan koordinatorSigRef.current tidak null sebelum memanggil isEmpty() atau toDataURL()
        const ttdKoordinatorBase64 = koordinatorExists 
            ? (koordinatorSigRef.current && !koordinatorSigRef.current.isEmpty() 
                ? koordinatorSigRef.current.toDataURL() 
                : manualData.tandaTanganKoordinator) 
            : null;

        if (!ttdPemegangBase64) {
             setManualError('Tanda tangan Pemegang Pernyataan Mandiri wajib diisi.');
             return;
        }
         if (koordinatorExists && !ttdKoordinatorBase64) {
            setManualError('Tanda Tangan Koordinator Lapangan wajib diisi.');
            return;
        }

        const dataToSave = {
            penilaian_id: kasus.penilaian.id, // Ambil dari kasus yang sudah pasti ada
            nomor_ba: manualData.nomorBa,
            nomor_spt: manualData.nomorSpt,
            tanda_tangan_pemegang: ttdPemegangBase64, 
            nama_pemegang: manualData.namaPemegangTTD,
            tanda_tangan_koordinator: ttdKoordinatorBase64,
            nama_koordinator: manualData.namaKoordinatorTTD,
        };

        setSubmitManualLoading(true);
        try {
            await api.post('/ba-pemeriksaan', dataToSave); 

            setManualData(prev => ({
                ...prev, 
                tandaTanganPemegang: ttdPemegangBase64,
                tandaTanganKoordinator: ttdKoordinatorBase64 
            }));
            setIsDataSubmitted(true); // Tampilkan preview
        } catch (err) {
            setManualError(err.response?.data?.message || 'Gagal menyimpan data manual. Coba lagi.');
        } finally {
            setSubmitManualLoading(false);
        }
    };

    if (loading) return <div className="text-center py-10">Memuat data...</div>;
    // Tampilkan error utama jika ada, sebelum mengecek form
    if (error) return <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>; 
    // Jika tidak loading dan tidak error utama, baru cek form/preview
    if (!kasus) return <div className="text-center py-10">Data kasus tidak ditemukan.</div>; // Tambahan cek kasus


    // --- Render Form Input Manual Jika Belum Submit ---
    if (!isDataSubmitted) {
        return (
            <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-8">
                 <div className="mb-6 flex justify-between items-center no-print">
                    <Link to="/penilaian" className="text-blue-600 hover:underline">&larr; Kembali</Link>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Input Data Berita Acara</h2>
                {manualError && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{manualError}</p>}
                <form onSubmit={handleDataSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="nomorBa" className="block text-sm font-medium text-gray-700">Nomor Berita Acara *</label>
                        <input type="text" id="nomorBa" name="nomorBa" value={manualData.nomorBa} onChange={handleManualChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                    </div>
                    <div>
                        <label htmlFor="nomorSpt" className="block text-sm font-medium text-gray-700">Nomor Surat Perintah Tugas *</label>
                        <input type="text" id="nomorSpt" name="nomorSpt" value={manualData.nomorSpt} onChange={handleManualChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                    </div>
                     <div>
                        <label htmlFor="namaPemegangTTD" className="block text-sm font-medium text-gray-700">Nama Pemegang (untuk TTD) *</label>
                        <input type="text" id="namaPemegangTTD" name="namaPemegangTTD" value={manualData.namaPemegangTTD} onChange={handleManualChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                        <p className="text-xs text-gray-500 mt-1">Nama ini akan dicetak di bawah tanda tangan pemegang.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tanda Tangan Pemegang Pernyataan Mandiri / Wakilnya *</label>
                        {manualData.tandaTanganPemegang && (
                            <div className="mb-2 p-2 border rounded-md inline-block">
                                <p className='text-xs text-gray-500 mb-1'>Tanda Tangan Tersimpan:</p>
                                <img src={manualData.tandaTanganPemegang} alt="TTD Pemegang Tersimpan" className="h-20 border"/>
                            </div>
                        )}
                        <div className="mt-1 border border-gray-300 rounded-md bg-gray-50 pemegang-signature-canvas">
                            <SignatureCanvas 
                                ref={pemegangSigRef} 
                                penColor='black' 
                                canvasProps={{ className: 'w-full h-40' }} 
                            />
                        </div>
                        <button type="button" onClick={() => { pemegangSigRef.current?.clear(); setManualData(prev => ({...prev, tandaTanganPemegang: null})); }} className="text-sm text-blue-600 hover:underline mt-1">Ulangi Tanda Tangan</button>
                    </div>

                    {/* PERBAIKAN: Gunakan kasus?.penanggung_jawab untuk kondisi */}
                    {kasus?.penanggung_jawab && (
                        <>
                            <div>
                                <label htmlFor="namaKoordinatorTTD" className="block text-sm font-medium text-gray-700">Nama Koordinator Lapangan (untuk TTD) *</label>
                                <input type="text" id="namaKoordinatorTTD" name="namaKoordinatorTTD" value={manualData.namaKoordinatorTTD} onChange={handleManualChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tanda Tangan Koordinator Lapangan *</label>
                                {manualData.tandaTanganKoordinator && (
                                    <div className="mb-2 p-2 border rounded-md inline-block">
                                        <p className='text-xs text-gray-500 mb-1'>Tanda Tangan Tersimpan:</p>
                                        <img src={manualData.tandaTanganKoordinator} alt="TTD Koordinator Tersimpan" className="h-20 border"/>
                                    </div>
                                )}
                                <div className="mt-1 border border-gray-300 rounded-md bg-gray-50 koordinator-signature-canvas">
                                    <SignatureCanvas 
                                        ref={koordinatorSigRef} 
                                        penColor='black' 
                                        canvasProps={{ className: 'w-full h-40' }} 
                                    />
                                </div>
                                <button type="button" onClick={() => { koordinatorSigRef.current?.clear(); setManualData(prev => ({...prev, tandaTanganKoordinator: null})); }} className="text-sm text-blue-600 hover:underline mt-1">Ulangi Tanda Tangan</button>
                            </div>
                        </>
                    )}

                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg" disabled={submitManualLoading}>
                            {submitManualLoading ? 'Menyimpan...' : 'Lanjutkan ke Preview'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // --- Render Preview Jika Data Manual Sudah Submit ---
    // PERBAIKAN: Cek processedData setelah form input dirender
    if (!processedData) return <div className="text-center py-10">Data penilaian tidak lengkap untuk preview.</div>; 

    const { 
        pemegang, koordinator, petugasLapangan, semuaPetugas, signatureMap, 
        tanggalBA, dataPemeriksaan, dataPengukuran 
    } = processedData;

    return (
        <div>
            <PrintStyles />
            
            <div className="mb-6 flex justify-between items-center no-print px-4 py-3 bg-white shadow-sm sm:px-6 lg:px-8">
                 <div>
                    <button onClick={() => setIsDataSubmitted(false)} className="text-blue-600 hover:underline text-sm mr-4">
                        &larr; Ubah Data Manual
                    </button>
                    <Link to="/penilaian" className="text-blue-600 hover:underline text-sm">&larr; Kembali ke Dashboard</Link>
                </div>
                <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                    Cetak / Simpan PDF
                </button>
            </div>

            {/* --- Area Preview Dokumen --- */}
            <div className="printable-area max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 md:p-12 font-serif text-black">
                {/* Header */}
                <div className="text-center uppercase font-bold">
                    <h2 className="text-lg tracking-wider">BERITA ACARA PEMERIKSAAN DAN PENGUKURAN</h2>
                    <h3 className="text-lg tracking-wider">PERNYATAAN MANDIRI PELAKU USAHA MIKRO DAN KECIL</h3>
                    <div className="border-b-2 border-black mt-2 mb-2 w-full"></div>
                    <p className="text-base normal-case">Nomor: {manualData.nomorBa || '..............................'}</p>
                </div>

                {/* Body */}
                <div className="mt-8 text-justify leading-loose">
                    <p className="indent-8">
                        Pada hari ini, {tanggalBA.hari} tanggal {tanggalBA.tanggal} bulan {tanggalBA.bulan} tahun {tanggalBA.tahun}, 
                        kami yang bertanda tangan di bawah ini:
                    </p>
                    
                    <div className="mt-4 ml-8 space-y-4 text-sm">
                        {/* Periksa apakah semuaPetugas ada sebelum mapping */}
                        {semuaPetugas && semuaPetugas.map((petugas) => ( 
                            <div key={petugas.id} className="grid grid-cols-[80px_10px_auto]">
                                <span>Nama</span><span>:</span><span className="font-semibold">{petugas.nama}</span>
                                <span>NIP/NIK</span><span>:</span><span>{petugas.nip || '-'}</span>
                                <span>Jabatan</span><span>:</span><span>{petugas.pivot?.jabatan_di_tim || petugas.role}</span>
                           </div>
                        ))}
                    </div>

                    <p className="mt-4 indent-8">
                        Berdasarkan Surat Perintah Tugas Nomor {manualData.nomorSpt || '.....................'}, telah melakukan pemeriksaan dan
                        pengukuran terhadap lokasi kegiatan Pemanfaatan Ruang dengan hasil sebagai berikut:
                    </p>

                    <h4 className="font-bold text-center mt-6 mb-2">Hasil Pemeriksaan dan Pengukuran</h4>
                    <h5 className="font-semibold mb-2">Pernyataan Mandiri Pelaku Usaha Mikro dan Kecil</h5>
                    
                    {/* Periksa apakah pemegang ada sebelum mengakses propertinya */}
                    {pemegang && ( 
                    <table className="w-full border border-gray-300 text-sm mb-4">
                        <tbody>
                            <DataRow label="Nama Pelaku Usaha" value={pemegang.nama_pelaku_usaha} />
                            <DataRow label="Nomor Identitas" value={pemegang.nomor_identitas} />
                            <DataRow label="Alamat" value={pemegang.alamat} />
                            <DataRow label="Nomor Telepon" value={pemegang.nomor_handphone} />
                            <DataRow label="Email" value={pemegang.email} />
                        </tbody>
                    </table>
                    )}

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

                    <p className="mt-6 indent-8">
                        Demikian Berita Acara ini dibuat dalam rangkap secukupnya untuk dipergunakan sebagaimana mestinya.
                    </p>
                </div>

                {/* --- Bagian Tanda Tangan --- */}
                <div className="mt-12">
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
                            {/* Periksa apakah pemegang ada */}
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
                    </div>
                    
                    {/* Tanda Tangan Petugas Lapangan (dari penilaian) */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-10 mt-10 text-center">
                        {/* Periksa apakah petugasLapangan ada sebelum mapping */}
                        {petugasLapangan && petugasLapangan.map((petugas, index) => ( 
                            <div key={petugas.id} className="signature-block mt-4">
                                <p>Petugas Lapangan {index + 1}</p>
                                <div className="h-28 w-full my-2 flex items-center justify-center signature-image-container"> 
                                    {signatureMap[petugas.id] ? (
                                        <img src={`http://127.0.0.1:8000/storage/${signatureMap[petugas.id]}`} alt={`Tanda Tangan ${petugas.nama}`} className="h-full object-contain"/>
                                    ) : (
                                        <span className="text-gray-400 text-sm">(Belum TTD di Penilaian)</span>
                                    )}
                                </div>
                                <p className="font-bold underline">({petugas.nama})</p>
                                <p>NIP/NIK: {petugas.nip || '..............................'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

