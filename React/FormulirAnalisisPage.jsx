import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js'; // PERBAIKAN: Path disesuaikan ke root
import SignatureCanvas from 'react-signature-canvas';
import { useAuth } from '../context/AuthContext';

// --- Komponen-komponen Reusable ---

// (SOLUSI) Memoize semua komponen reusable untuk mencegah re-render yang tidak perlu
const TableHeader = memo(({ children, colSpan = 1, rowSpan = 1, className = "" }) => (
    <th className={`py-2 px-3 border border-gray-300 bg-gray-100 font-semibold align-middle ${className}`} colSpan={colSpan} rowSpan={rowSpan}>
        {children}
    </th>
));

const TableCell = memo(({ children, className = "" }) => (
    <td className={`py-2 px-3 border border-gray-300 align-middle ${className}`}>
        {children}
    </td>
));

const ReadOnlyInput = memo(({ value, className = "" }) => (
    <div className={`w-full p-2 text-sm bg-gray-100 rounded-md min-h-[38px] flex items-center ${className}`}>
        {value || '-'}
    </div>
));

const ManualInput = memo(({ name, value, onChange, onBlur, placeholder = "", type = "text", title = "", className = "" }) => (
    <input
        dir="ltr" // Memaksa input menjadi LTR
        type={type}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        onBlur={onBlur} // Menambahkan onBlur handler
        placeholder={placeholder}
        title={title} // Menambahkan tooltip
        style={{ textAlign: 'left' }}
        className={`w-full p-2 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[38px] ${className}`}
    />
));

const SelectInput = memo(({ name, value, onChange, children, className = "" }) => (
    <select
        name={name}
        value={value ?? ''}
        onChange={onChange}
        className={`w-full p-2 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[38px] ${className}`}
    >
        {children}
    </select>
));

// (PERBAIKAN Poin 6 & SOLUSI BUG FOKUS)
// Komponen ini harus didefinisikan di luar render function
// dan dibungkus dengan memo() untuk mencegah re-render yang tidak perlu.
const InputWithUnit = memo(({ children, unit, className = "" }) => (
    <div className={`flex items-center gap-2 w-full ${className}`}>
        {/* Tambahkan flex-shrink-0 agar div input tidak 'mengecil' saat diketik */}
        <div className="flex-grow min-w-[6rem] flex-shrink-0">
            {children}
        </div>
        {/* Tambahkan flex-shrink-0 agar span satuan tidak 'mengecil' */}
        {unit && <span className="text-gray-600 w-8 flex-shrink-0">{unit}</span>}
    </div>
));

// (SOLUSI) Memoize dan perbaiki penanganan ref untuk menghindari inline callback
const PetugasPenilaiSignature = memo(({ member, signaturePath, signatureRefs, memberId }) => {
    const baseUrl = api.defaults.baseURL;
    const imageUrl = signaturePath ? `${baseUrl}/signatures/${signaturePath}?t=${new Date().getTime()}` : null;

    // Buat callback yang stabil untuk ref canvas
    const setCanvasRef = useCallback(el => {
        if (signatureRefs) {
            signatureRefs.current[memberId] = el;
        }
    }, [signatureRefs, memberId]);

    // Buat callback yang stabil untuk tombol clear
    const handleClear = useCallback(() => {
        if (signatureRefs?.current[memberId]) {
            signatureRefs.current[memberId].clear();
        }
    }, [signatureRefs, memberId]);
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 p-3 border rounded-md signature-block">
            {/* Info Petugas */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Nama Petugas</label>
                <p className="mt-0.5 p-2 border rounded-md bg-gray-100 text-sm min-h-[38px]">{member.nama}</p>
                <label className="block text-sm font-medium text-gray-700 mt-1">Jabatan</label>
                <p className="mt-0.5 p-2 border rounded-md bg-gray-100 text-sm min-h-[38px]">{member.pivot?.jabatan_di_tim || member.role}</p>
            </div>
            {/* Tanda Tangan */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Tanda Tangan:</label>
                {/* 1. Tampilan Gambar */}
                <div className="my-1 signature-image-container">
                    {imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={`Tanda Tangan ${member.nama}`} 
                            className="mx-auto h-20 border rounded bg-white object-contain"
                        />
                    ) : (
                        <div className="h-20 border rounded bg-white flex items-center justify-center text-gray-400 text-sm">(Belum TTD)</div>
                    )}
                </div>
                {/* 2. Canvas Tanda Tangan */}
                <div className='signature-canvas-container'>
                    <div className="border border-gray-300 rounded-md bg-white">
                        {/* Gunakan ref callback yang stabil */}
                        <SignatureCanvas ref={setCanvasRef} penColor='black' canvasProps={{className: 'w-full h-20'}} />
                    </div>
                    {/* Gunakan handler klik yang stabil */}
                    <button type="button" onClick={handleClear} className="text-sm text-blue-600 hover:underline mt-1 no-print">Ulangi</button>
                </div>
            </div>
        </div>
    );
});

// (SOLUSI 3) Fungsi sanitasi numerik, dipanggil hanya saat submit
const sanitizeNumericValue = (value) => {
    // Jika null, undefined, atau bukan string, kembalikan string kosong atau nilai aslinya
    if (typeof value !== 'string' || !value) {
        // Pastikan null/undefined menjadi string kosong
        // Perbaikan: Gunakan '??' untuk menyederhanakan
        return value ?? ''; 
    }
    
    // 1. Hapus semua karakter yang BUKAN angka, titik, atau koma.
    const filtered = value.replace(/[^0-9.,]/g, '');
    
    // 2. Ganti SEMUA koma (,) menjadi titik (.).
    const dotsOnly = filtered.replace(/,/g, '.');

    // 3. Pastikan hanya ada SATU titik desimal.
    //    Misal: "1.5.5" -> "1.55" | "1..5" -> "1.5"
    const parts = dotsOnly.split('.');
    let finalValue = parts.shift(); // Ambil bagian pertama (sebelum titik pertama)
    
    if (parts.length > 0) {
        // Jika ada bagian setelah titik, gabungkan sisa bagiannya.
        // Ini juga menangani "1." -> ["1", ""] -> "1" + "." + "" = "1."
        finalValue += '.' + parts.join(''); 
    }

    // Logika ini tidak akan mengubah "1." menjadi "1", sesuai permintaan.
    return finalValue;
};


// --- Komponen Utama Halaman ---

export default function FormulirAnalisisPage() {
    const { id: kasusId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [kasus, setKasus] = useState(null);
    const [penilaian, setPenilaian] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState('');

    const signatureRefs = useRef({});

    // State untuk form analisis (data yang akan disimpan)
    // (PERBAIKAN Poin 1, 2, 3, 4) Merapikan state
    const [formData, setFormData] = useState({
        lokasi_kesesuaian_pmp_eksisting: 'Sesuai',
        jenis_kesesuaian_pmp_eksisting: 'Sesuai',
        jenis_ketentuan_rtr: '',
        jenis_kesesuaian_rtr: 'Sesuai',
        luas_digunakan_ketentuan_rtr: '',
        luas_digunakan_kesesuaian_rtr: 'Sesuai',
        luas_dikuasai_ketentuan_rtr: '',
        luas_dikuasai_kesesuaian_rtr: 'Sesuai',
        // C.1 KDB
        kdb_ketentuan_rtr: '',
        kdb_kesesuaian_rtr: 'Sesuai',
        kdb_luas_lantai_dasar_rasio: '', // (Poin 3)
        kdb_perbandingan_manual: '', // (Poin 2)
        // C.2 KLB
        klb_luas_tanah: '',
        klb_ketentuan_rtr: '',
        klb_kesesuaian_rtr: 'Sesuai',
        klb_luas_seluruh_lantai_rasio: '', // (Poin 4)
        // Ketinggian Bangunan
        ketinggian_ketentuan_rtr: '',
        ketinggian_kesesuaian_rtr: 'Sesuai',
        // C.3 KDH
        kdh_luas_tanah: '',
        kdh_rasio_manual: '', // Dipindah dari kolom perhitungan
        kdh_perbandingan_manual: '', // (Inferred) Mengganti nama kdh_perbandingan_vegetasi
        kdh_ketentuan_rtr: '',
        kdh_kesesuaian_rtr: 'Sesuai',
        // C.4 KTB
        ktb_luas_tanah: '',
        ktb_ketentuan_rtr: '',
        ktb_kesesuaian_rtr: 'Sesuai',
        ktb_luas_basemen_rasio: '', // (Inferred) Dipindah
        ktb_perbandingan_manual: '', // (Inferred) Dipindah
        // C.5 GSB
        gsb_ketentuan_rtr: '',
        gsb_kesesuaian_rtr: 'Sesuai',
        // C.6 JBB
        jbb_ketentuan_rtr: '',
        jbb_kesesuaian_rtr: 'Sesuai',
        tanda_tangan_tim: [], // { user_id, signature }
    });

    // Ambil data pre-fill (pemegang & penilaian)
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const kasusRes = await api.get(`/penilaian/pmp-umk/${kasusId}`);
                if (!kasusRes.data || !kasusRes.data.penilaian) {
                    throw new Error('Data penilaian tidak ditemukan untuk kasus ini.');
                }
                setKasus(kasusRes.data);
                setPenilaian(kasusRes.data.penilaian);

                // Cek apakah data analisis sudah ada
                try {
                    const analisisRes = await api.get(`/formulir-analisis/${kasusRes.data.penilaian.id}`);
                    if (analisisRes.data) {
                        // Jika ada, isi formData dengan data yang tersimpan
                        setFormData(prev => ({
                            ...prev,
                            ...analisisRes.data, // Spread original data

                            // (SOLUSI) Paksa semua field numerik (terutama ketentuan) menjadi string
                            // Ini untuk mencegah bug controlled input di mana 'null' menyebabkan input menolak digit kedua
                            kdb_ketentuan_rtr: String(analisisRes.data.kdb_ketentuan_rtr ?? ''),
                            klb_ketentuan_rtr: String(analisisRes.data.klb_ketentuan_rtr ?? ''),
                            kdh_ketentuan_rtr: String(analisisRes.data.kdh_ketentuan_rtr ?? ''),
                            ktb_ketentuan_rtr: String(analisisRes.data.ktb_ketentuan_rtr ?? ''),
                            gsb_ketentuan_rtr: String(analisisRes.data.gsb_ketentuan_rtr ?? ''),
                            jbb_ketentuan_rtr: String(analisisRes.data.jbb_ketentuan_rtr ?? ''),
                            ketinggian_ketentuan_rtr: String(analisisRes.data.ketinggian_ketentuan_rtr ?? ''),
                            luas_digunakan_ketentuan_rtr: String(analisisRes.data.luas_digunakan_ketentuan_rtr ?? ''),
                            luas_dikuasai_ketentuan_rtr: String(analisisRes.data.luas_dikuasai_ketentuan_rtr ?? ''),
                            
                            // Input numerik manual lainnya
                            klb_luas_tanah: String(analisisRes.data.klb_luas_tanah ?? ''),
                            kdh_luas_tanah: String(analisisRes.data.kdh_luas_tanah ?? ''),
                            ktb_luas_tanah: String(analisisRes.data.ktb_luas_tanah ?? ''),

                            // (PERBAIKAN) Menyesuaikan state yang di-load dan juga paksa ke string
                            kdb_luas_lantai_dasar_rasio: String(analisisRes.data.kdb_rasio_manual ?? ''),
                            kdb_perbandingan_manual: String(analisisRes.data.kdb_persen_manual ?? ''),
                            klb_luas_seluruh_lantai_rasio: String(analisisRes.data.klb_rasio_manual ?? ''),
                            kdh_rasio_manual: String(analisisRes.data.kdh_rasio_manual ?? ''),
                            kdh_perbandingan_manual: String(analisisRes.data.kdh_perbandingan_vegetasi ?? ''),
                            ktb_luas_basemen_rasio: String(analisisRes.data.ktb_rasio_manual ?? ''),
                            ktb_perbandingan_manual: String(analisisRes.data.ktb_persen_manual ?? ''),
                            
                            // Pastikan ttd disimpan sebagai path
                            tanda_tangan_tim: (analisisRes.data.tanda_tangan_tim || []).map(sig => ({
                                user_id: sig.user_id,
                                signature: sig.signature_path // simpan path, bukan base64
                            })),
                        }));
                    }
                } catch (analisisErr) {
                    // Abaikan jika 404 (data belum ada)
                    if (analisisErr.response?.status !== 404) {
                        throw analisisErr;
                    }
                }

            } catch (err) {
                setError(err.message || 'Gagal memuat data yang diperlukan.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [kasusId]);
    
    // Data pre-fill dari Pemegang (A. Data Pelaku UMK)
    const dataPelakuUMK = useMemo(() => {
        if (!kasus) return null;
        const { pemegang } = kasus;
        return {
            nama: pemegang?.nama_pelaku_usaha,
            nomor_identitas: pemegang?.nomor_identitas,
            telepon: pemegang?.nomor_handphone,
            email: pemegang?.email,
            alamat: [pemegang?.alamat, pemegang?.desa_kelurahan, pemegang?.kecamatan].filter(Boolean).join(', ')
        };
    }, [kasus]);

    // Data pre-fill dari Penilaian (B & C)
    const dataPrefill = useMemo(() => {
        if (!penilaian || !kasus) return {};
        const pem = penilaian.pemeriksaan || [];
        const png = penilaian.pengukuran || [];
        const pemegang = kasus.pemegang || {};

        return {
            // B.1 Lokasi
            lokasi_pmp: [pemegang.alamat, pemegang.desa_kelurahan, pemegang.kecamatan, pemegang.kabupaten, pemegang.provinsi, `Lat: ${pem[5]?.pernyataan_mandiri}`, `Bujur: ${pem[6]?.pernyataan_mandiri}`].filter(Boolean).join('\n'),
            lokasi_eksisting: [pem[0]?.pernyataan_mandiri, pem[1]?.pernyataan_mandiri, pem[2]?.pernyataan_mandiri, pem[3]?.pernyataan_mandiri, pem[4]?.pernyataan_mandiri, `Lat: ${pem[5]?.pernyataan_mandiri}`, `Bujur: ${pem[6]?.pernyataan_mandiri}`].filter(Boolean).join('\n'),
            // B.2 Jenis
            jenis_pmp: pemegang.kegiatan,
            jenis_eksisting: pem[7]?.pernyataan_mandiri,
            // C.0 Umum
            luas_digunakan: png[0]?.hasil_pengukuran,
            luas_dikuasai: png[1]?.hasil_pengukuran,
            // C.1 KDB
            kdb_luas_lantai_dasar: png[2]?.hasil_pengukuran,
            // C.2 KLB
            klb_jumlah_lantai: png[3]?.hasil_pengukuran,
            klb_luas_seluruh_lantai: png[4]?.hasil_pengukuran,
            klb_ketinggian: png[5]?.hasil_pengukuran,
            // C.3 KDH
            kdh_vegetasi: png[6]?.hasil_pengukuran,
            kdh_perkerasan: png[7]?.hasil_pengukuran,
            // C.4 KTB
            ktb_luas_basemen: png[8]?.hasil_pengukuran,
            // C.5 GSB
            gsb_jarak: png[9]?.hasil_pengukuran,
            // C.6 JBB
            jbb_belakang: png[10]?.hasil_pengukuran,
            jbb_samping: png[11]?.hasil_pengukuran,
        };
    }, [penilaian, kasus]);
    
    // (SOLUSI) Bungkus handleChange dengan useCallback agar referensinya stabil
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        // Langsung update state apa adanya.
        // Sanitasi akan dilakukan di handleSubmit.
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []); // Dependency array kosong karena setFormData dijamin stabil

    // (SOLUSI) Bungkus handleBlur dengan useCallback agar referensinya stabil
    const handleBlur = useCallback((e) => {
        // Tidak melakukan apa-apa.
    }, []); // Dependency array kosong
    
    // Tim Penilai (Petugas Lapangan, Koordinator, Ketua Tim)
    const timPenilai = useMemo(() => {
        if (!kasus || !kasus.tim || !kasus.tim.users) return [];
        // Menampilkan semua anggota tim
        return kasus.tim.users;
    }, [kasus]);
    
    // Handler Submit Form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setError('');

        // (SOLUSI 3) Lakukan sanitasi data TEPAT SEBELUM submit
        const sanitizedFormData = { ...formData };
        const numericKeywords = ['rasio', 'manual', 'luas_tanah', 'ketentuan_rtr'];
        
        for (const key in sanitizedFormData) {
            // Pengecualian: 'jenis_ketentuan_rtr' adalah field teks, jangan disanitasi
            if (key === 'jenis_ketentuan_rtr') {
                continue;
            }

            // Cek apakah key mengandung salah satu keyword numerik
            const isNumericField = numericKeywords.some(keyword => key.includes(keyword));
            
            if (isNumericField) {
                sanitizedFormData[key] = sanitizeNumericValue(sanitizedFormData[key]);
            }
        }
        
        // Update state agar UI konsisten dengan data yang akan disimpan
        // Ini juga memastikan jika submit gagal, user melihat data yang bersih
        setFormData(sanitizedFormData);


        const signatureData = [];
        let allSigned = true;

        for (const member of timPenilai) {
            const sigCanvas = signatureRefs.current[member.id];
            const isCanvasEmpty = !sigCanvas || sigCanvas.isEmpty();
            // Cek signaturePath dari formData (sudah aman, ttd tdk akan tersanitasi)
            const existingSignature = formData.tanda_tangan_tim.find(sig => sig.user_id === member.id);

            if (isCanvasEmpty && !existingSignature) {
                // Jika canvas kosong DAN belum ada TTD tersimpan
                allSigned = false;
                break;
            } else if (!isCanvasEmpty) {
                // Jika canvas DIISI (TTD baru)
                signatureData.push({
                    user_id: member.id,
                    signature: sigCanvas.toDataURL(), // Kirim base64
                });
            } else if (existingSignature) {
                // Jika canvas kosong TAPI ada TTD tersimpan
                signatureData.push({
                    user_id: member.id,
                    signature: existingSignature.signature, // Kirim path lama
                });
            }
        }

        if (timPenilai.length > 0 && !allSigned) {
            setError('Semua anggota tim penilai (Ketua, Koordinator, Petugas) harus menandatangani formulir ini.');
            setSubmitLoading(false);
            return;
        }
        
        // (PERBAIKAN) Menyesuaikan payload dengan nama state baru
        // PENTING: Gunakan 'sanitizedFormData' untuk payload
        const payload = {
            ...sanitizedFormData,
            kdb_rasio_manual: sanitizedFormData.kdb_luas_lantai_dasar_rasio,
            kdb_persen_manual: sanitizedFormData.kdb_perbandingan_manual,
            klb_rasio_manual: sanitizedFormData.klb_luas_seluruh_lantai_rasio,
            kdh_rasio_manual: sanitizedFormData.kdh_rasio_manual,
            kdh_perbandingan_vegetasi: sanitizedFormData.kdh_perbandingan_manual,
            ktb_rasio_manual: sanitizedFormData.ktb_luas_basemen_rasio,
            ktb_persen_manual: sanitizedFormData.ktb_perbandingan_manual,
            tanda_tangan_tim: signatureData
        };

        try {
            await api.post(`/formulir-analisis/${penilaian.id}`, payload);
            // Gunakan alert standar browser
            alert('Formulir Analisis berhasil disimpan!');
            navigate(`/penilaian`); // Kembali ke dashboard
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan formulir.');
        } finally {
            setSubmitLoading(false);
        }
    };

    // --- Render ---
    if (loading) return <div className="text-center py-10">Memuat Formulir Analisis...</div>;
    if (error) return <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>;
    if (!kasus || !penilaian) return <div className="text-center py-10">Data tidak lengkap.</div>;

    const dropdownSesuai = (
        <>
            <option value="">Pilih...</option>
            <option value="Sesuai">Sesuai</option>
            <option value="Tidak Sesuai">Tidak Sesuai</option>
        </>
    );

    const dropdownKtb = (
        <>
            <option value="">Pilih...</option>
            <option value="Sesuai">Sesuai</option>
            <option value="Tidak Sesuai">Tidak Sesuai</option>
            <option value="Belum Dapat Dinilai">Belum Dapat Dinilai</option>
            <option value="Penilaian Tidak Dapat Dilanjutkan">Penilaian Tidak Dapat Dilanjutkan</option>
        </>
    );

    // (PERBAIKAN Poin 5) Kelas seragam untuk header blok
    const blockHeaderClass = "bg-gray-100 font-semibold p-2 border-t-2 border-b border-gray-300";

    return (
        <div className="bg-gray-100">
            {/* Tombol Aksi Atas */}
            <div className="mb-6 flex justify-between items-center print:hidden no-print px-4 py-3 bg-white shadow-sm sm:px-6 lg:px-8">
                <Link to="/penilaian" className="text-blue-600 hover:underline">&larr; Kembali ke Dashboard Penilaian</Link>
            </div>

            {/* Area Form */}
            <div className="printable-area max-w-6xl mx-auto bg-white rounded-lg shadow-lg mb-8">
                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                    {/* Header */}
                    <div className="text-center pt-2">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800">FORMULIR ANALISIS PENILAIAN</h2>
                        <p className="text-gray-600">Pernyataan Mandiri Pelaku Usaha Mikro dan Kecil (UMK)</p>
                    </div>

                    {/* A. Data Pelaku UMK */}
                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-lg font-semibold px-2">A. Data Pelaku UMK</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mt-2 text-sm p-2">
                            <p><strong className="font-medium text-gray-600 w-32 inline-block">Nama Pelaku Usaha</strong>: {dataPelakuUMK.nama}</p>
                            <p><strong className="font-medium text-gray-600 w-32 inline-block">Nomor Identitas</strong>: {dataPelakuUMK.nomor_identitas}</p>
                            <p><strong className="font-medium text-gray-600 w-32 inline-block">Nomor Telepon</strong>: {dataPelakuUMK.telepon}</p>
                            <p><strong className="font-medium text-gray-600 w-32 inline-block">Email</strong>: {dataPelakuUMK.email}</p>
                            <p className="md:col-span-2"><strong className="font-medium text-gray-600 w-32 inline-block">Alamat</strong>: {dataPelakuUMK.alamat}</p>
                        </div>
                    </fieldset>
                    
                    {/* B. Pemeriksaan */}
                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-lg font-semibold px-2">B. Pemeriksaan</legend>
                        <div className="overflow-x-auto mt-2">
                            {/* B.1. Lokasi Usaha */}
                            <h4 className="font-semibold mb-2 text-sm">1) Pemeriksaan Lokasi Usaha</h4>
                            {/* (PERBAIKAN) Menggunakan table-auto dan colgroup */}
                            <table className="min-w-full text-sm table-auto border-collapse">
                                <colgroup>
                                    <col className="w-[37%]" />
                                    <col className="w-[37%]" />
                                    <col className="w-[26%]" />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <TableHeader>Lokasi Usaha berdasarkan PMP UMK</TableHeader>
                                        <TableHeader>Lokasi Usaha berdasarkan Hasil Pemeriksaan (Eksisting)</TableHeader>
                                        <TableHeader>Hasil Kesesuaian PMP UMK vs Eksisting</TableHeader>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <TableCell><ReadOnlyInput value={dataPrefill.lokasi_pmp} className="whitespace-pre-wrap" /></TableCell>
                                        <TableCell><ReadOnlyInput value={dataPrefill.lokasi_eksisting} className="whitespace-pre-wrap" /></TableCell>
                                        <TableCell>
                                            <SelectInput name="lokasi_kesesuaian_pmp_eksisting" value={formData.lokasi_kesesuaian_pmp_eksisting} onChange={handleChange}>
                                                {dropdownSesuai}
                                            </SelectInput>
                                        </TableCell>
                                    </tr>
                                </tbody>
                            </table>

                            {/* B.2. Jenis Kegiatan */}
                            <h4 className="font-semibold mt-6 mb-2 text-sm">2) Pemeriksaan Jenis Kegiatan Pemanfaatan Ruang</h4>
                            {/* (PERBAIKAN) Menggunakan table-auto dan colgroup */}
                            <table className="min-w-full text-sm table-auto border-collapse">
                                <colgroup>
                                    <col className="w-[20%]" />
                                    <col className="w-[20%]" />
                                    <col className="w-[20%]" />
                                    <col className="w-[20%]" />
                                    <col className="w-[20%]" />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <TableHeader>Berdasarkan PMP UMK</TableHeader>
                                        <TableHeader>Berdasarkan Hasil Pemeriksaan (Eksisting)</TableHeader>
                                        <TableHeader>Kesesuaian PMP UMK vs Eksisting</TableHeader>
                                        <TableHeader>Ketentuan RTR</TableHeader>
                                        <TableHeader>Kesesuaian dengan RTR</TableHeader>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <TableCell><ReadOnlyInput value={dataPrefill.jenis_pmp} /></TableCell>
                                        <TableCell><ReadOnlyInput value={dataPrefill.jenis_eksisting} /></TableCell>
                                        <TableCell>
                                            <SelectInput name="jenis_kesesuaian_pmp_eksisting" value={formData.jenis_kesesuaian_pmp_eksisting} onChange={handleChange}>
                                                {dropdownSesuai}
                                            </SelectInput>
                                        </TableCell>
                                        <TableCell>
                                            {/* PERBAIKAN: Menambahkan onBlur */}
                                            <ManualInput name="jenis_ketentuan_rtr" value={formData.jenis_ketentuan_rtr} onChange={handleChange} onBlur={handleBlur} placeholder="Input ketentuan RTR..." />
                                        </TableCell>
                                        <TableCell>
                                            <SelectInput name="jenis_kesesuaian_rtr" value={formData.jenis_kesesuaian_rtr} onChange={handleChange}>
                                                {dropdownSesuai}
                                            </SelectInput>
                                        </TableCell>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </fieldset>

                    {/* C. Pengukuran */}
                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-lg font-semibold px-2">C. Pengukuran</legend>
                        <div className="overflow-x-auto mt-2">
                            {/* (PERBAIKAN Poin 1, 7) Menggunakan table-auto dan colgroup baru */}
                            <table className="min-w-full text-sm table-auto border-collapse">
                                {/* (PERBAIKAN Poin 1) Colgroup 5 kolom */}
                                <colgroup>
                                    <col className="w-[25%]" /> {/* Komponen */}
                                    <col className="w-[30%]" /> {/* Sub-Komponen */}
                                    <col className="w-[20%]" /> {/* Hasil Pemeriksaan & Pengukuran */}
                                    <col className="w-[15%]" /> {/* Ketentuan RTR */}
                                    <col className="w-[10%]" /> {/* Hasil Kesesuaian */}
                                </colgroup>
                                <thead>
                                    {/* (PERBAIKAN Poin 7) Header 5 kolom */}
                                    <tr>
                                        <TableHeader colSpan={2}>Komponen</TableHeader>
                                        <TableHeader>Hasil Pemeriksaan & Pengukuran</TableHeader>
                                        <TableHeader>Ketentuan RTR</TableHeader>
                                        <TableHeader>Hasil Kesesuaian dgn RTR</TableHeader>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* (PERBAIKAN Poin 2, 5) Header Komponen Luas Tanah */}
                                    <tr>
                                        <TableCell colSpan={5} className={blockHeaderClass}>
                                            Luas Tanah
                                        </TableCell>
                                    </tr>
                                    {/* (PERBAIKAN Poin 1) Baris 1 Luas Tanah (5 kolom) */}
                                    <tr>
                                        <TableCell className="font-semibold pl-4">Luas Tanah</TableCell>
                                        <TableCell className="pl-8">Luas Tanah yang digunakan</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m²">
                                                <ReadOnlyInput value={dataPrefill.luas_digunakan} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell>
                                            <InputWithUnit>
                                                {/* PERBAIKAN: Menambahkan onBlur */}
                                                <ManualInput name="luas_digunakan_ketentuan_rtr" value={formData.luas_digunakan_ketentuan_rtr} onChange={handleChange} onBlur={handleBlur} title="Ketentuan RTR Luas Tanah Digunakan" />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell><SelectInput name="luas_digunakan_kesesuaian_rtr" value={formData.luas_digunakan_kesesuaian_rtr} onChange={handleChange}>{dropdownSesuai}</SelectInput></TableCell>
                                    </tr>
                                    {/* (PERBAIKAN Poin 1) Baris 2 Luas Tanah (5 kolom) */}
                                    <tr>
                                        <TableCell></TableCell> {/* Sel Komponen kosong */}
                                        <TableCell className="pl-8">Luas Tanah yang dikuasai</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m²">
                                                <ReadOnlyInput value={dataPrefill.luas_dikuasai} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell>
                                            <InputWithUnit>
                                                {/* PERBAIKAN: Menambahkan onBlur */}
                                                <ManualInput name="luas_dikuasai_ketentuan_rtr" value={formData.luas_dikuasai_ketentuan_rtr} onChange={handleChange} onBlur={handleBlur} title="Ketentuan RTR Luas Tanah Dikuasai"/>
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell><SelectInput name="luas_dikuasai_kesesuaian_rtr" value={formData.luas_dikuasai_kesesuaian_rtr} onChange={handleChange}>{dropdownSesuai}</SelectInput></TableCell>
                                    </tr>

                                    {/* (PERBAIKAN Poin 2, 5) Header Komponen KDB */}
                                    <tr>
                                        <TableCell colSpan={5} className={blockHeaderClass}>
                                            KDB (Koefisien Dasar Bangunan)
                                        </TableCell>
                                    </tr>
                                    {/* (PERBAIKAN Poin 1) Baris 1 KDB (5 kolom) */}
                                    <tr>
                                        <TableCell className="font-semibold pl-4">KDB</TableCell>
                                        <TableCell className="pl-8">Luas Lantai Dasar Bangunan</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m²">
                                                <ReadOnlyInput value={dataPrefill.kdb_luas_lantai_dasar} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="%">
                                                {/* PERBAIKAN: Menambahkan onBlur */}
                                                <ManualInput name="kdb_ketentuan_rtr" value={formData.kdb_ketentuan_rtr} onChange={handleChange} onBlur={handleBlur} placeholder="cth: 60" type="text"/>
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell>
                                            <SelectInput name="kdb_kesesuaian_rtr" value={formData.kdb_kesesuaian_rtr} onChange={handleChange}>{dropdownSesuai}</SelectInput>
                                        </TableCell>
                                    </tr>
                                    {/* (PERBAIKAN Poin 1) Baris 2 KDB (5 kolom) */}
                                    <tr>
                                        <TableCell></TableCell> {/* Sel Komponen kosong */}
                                        <TableCell className="pl-8">Luas Tanah (dikuasai)</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m²">
                                                <ReadOnlyInput value={dataPrefill.luas_dikuasai} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell></TableCell> {/* Sel Ketentuan kosong */}
                                        <TableCell></TableCell> {/* Sel Hasil kosong */}
                                    </tr>
                                    {/* (PERBAIKAN Poin 3) Baris 3 KDB (5 kolom) */}
                                    <tr>
                                        <TableCell></TableCell> {/* Sel Komponen kosong */}
                                        <TableCell className="pl-8 italic">Luas Lantai Dasar : Luas Tanah</TableCell>
                                        <TableCell>
                                            <InputWithUnit>
                                                {/* PERBAIKAN: Menambahkan onBlur */}
                                                <ManualInput 
                                                    type="text"
                                                    name="kdb_luas_lantai_dasar_rasio"
                                                    value={formData.kdb_luas_lantai_dasar_rasio}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    placeholder="Rasio (cth: 0.6)"
                                                    title="Input Manual: Luas Lantai Dasar : Luas Tanah"
                                                />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell></TableCell> {/* Sel Ketentuan kosong */}
                                        <TableCell></TableCell> {/* Sel Hasil kosong */}
                                    </tr>
                                    {/* (PERBAIKAN Poin 2) Baris 4 KDB (Baru) */}
                                    <tr>
                                        <TableCell></TableCell>
                                        <TableCell className="pl-8">Perbandingan Luas Lantai Dasar dengan Luas Tanah (x100%)</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="%">
                                                {/* PERBAIKAN: Menambahkan onBlur */}
                                                <ManualInput
                                                    type="text"
                                                    name="kdb_perbandingan_manual"
                                                    value={formData.kdb_perbandingan_manual}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    placeholder="cth: 60"
                                                    title="Input Manual: Perbandingan (x100%)"
                                                />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                    </tr>


                                    {/* (PERBAIKAN Poin 2, 5) Header Komponen KLB */}
                                    <tr>
                                        <TableCell colSpan={5} className={blockHeaderClass}>
                                            KLB (Koefisien Lantai Bangunan)
                                        </TableCell>
                                    </tr>
                                    {/* (PERBAIKAN Poin 1) Baris 1 KLB */}
                                    <tr>
                                        <TableCell className="font-semibold pl-4">KLB</TableCell>
                                        <TableCell className="pl-8">Jumlah Lantai Bangunan</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="lantai">
                                                <ReadOnlyInput value={dataPrefill.klb_jumlah_lantai} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell>
                                            <InputWithUnit>
                                                {/* PERBAIKAN: Menambahkan onBlur */}
                                                <ManualInput name="klb_ketentuan_rtr" value={formData.klb_ketentuan_rtr} onChange={handleChange} onBlur={handleBlur} placeholder="cth: 1.2" type="text" />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell>
                                            <SelectInput name="klb_kesesuaian_rtr" value={formData.klb_kesesuaian_rtr} onChange={handleChange}>{dropdownSesuai}</SelectInput>
                                        </TableCell>
                                    </tr>
                                    {/* (PERBAIKAN Poin 1) Baris 2 KLB */}
                                    <tr>
                                        <TableCell></TableCell>
                                        <TableCell className="pl-8">Luas Seluruh Lantai Bangunan</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m²">
                                                <ReadOnlyInput value={dataPrefill.klb_luas_seluruh_lantai} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                    </tr>
                                    {/* (PERBAIKAN Poin 1) Baris 3 KLB */}
                                    <tr>
                                        <TableCell></TableCell>
                                        <TableCell className="pl-8">Luas Tanah</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m²">
                                                {/* PERBAIKAN: Menambahkan onBlur */}
                                                <ManualInput name="klb_luas_tanah" value={formData.klb_luas_tanah} onChange={handleChange} onBlur={handleBlur} placeholder="Input Luas Tanah" type="text" title="Input Luas Tanah untuk KLB" />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                    </tr>
                                    {/* (PERBAIKAN Poin 1 & 4) Baris 4 KLB */}
                                    <tr>
                                        <TableCell></TableCell>
                                        <TableCell className="pl-8 italic">Luas Seluruh Lantai : Luas Tanah</TableCell>
                                        <TableCell>
                                            <InputWithUnit>
                                                {/* PERBAIKAN: Menambahkan onBlur */}
                                                <ManualInput 
                                                    type="text"
                                                    name="klb_luas_seluruh_lantai_rasio"
                                                    value={formData.klb_luas_seluruh_lantai_rasio}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    placeholder="Rasio (cth: 1.2)"
                                                    title="Input Manual: Luas Seluruh Lantai : Luas Tanah"
                                                />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                    </tr>
                                    
                                    {/* (PERBAIKAN Poin 2, 5) Header Komponen Ketinggian Bangunan */}
                                    <tr>
                                        <TableCell colSpan={5} className={blockHeaderClass}>
                                            Ketinggian Bangunan
                                        </TableCell>
                                    </tr>
                                    {/* (PERBAIKAN Poin 1) Baris 1 Ketinggian */}
                                    <tr>
                                        <TableCell className="font-semibold pl-4">Ketinggian</TableCell>
                                        <TableCell className="pl-8">Ketinggian Bangunan</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m">
                                                <ReadOnlyInput value={dataPrefill.klb_ketinggian} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m">
                                                {/* PERBAIKAN: Menambahkan onBlur dan memperbaiki name prop */}
                                                <ManualInput name="ketinggian_ketentuan_rtr" value={formData.ketinggian_ketentuan_rtr} onChange={handleChange} onBlur={handleBlur} placeholder="cth: 8" type="text" />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell>
                                            <SelectInput name="ketinggian_kesesuaian_rtr" value={formData.ketinggian_kesesuaian_rtr} onChange={handleChange}>{dropdownSesuai}</SelectInput>
                                        </TableCell>
                                    </tr>

                                    {/* (PERBAIKAN Poin 2, 5) Header Komponen KDH */}
                                    <tr>
                                        <TableCell colSpan={5} className={blockHeaderClass}>
                                            KDH (Koefisien Daerah Hijau)
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="font-semibold pl-4">KDH</TableCell>
                                        <TableCell className="pl-8">Luas Vegetasi</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m²">
                                                <ReadOnlyInput value={dataPrefill.kdh_vegetasi} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="%">
                                                {/* PERBAIKAN: Menambahkan onBlur */}
                                                <ManualInput name="kdh_ketentuan_rtr" value={formData.kdh_ketentuan_rtr} onChange={handleChange} onBlur={handleBlur} placeholder="cth: 20" type="text" />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell>
                                            <SelectInput name="kdh_kesesuaian_rtr" value={formData.kdh_kesesuaian_rtr} onChange={handleChange}>{dropdownSesuai}</SelectInput>
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell></TableCell>
                                        <TableCell className="pl-8">Luas Perkerasan</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m²">
                                                <ReadOnlyInput value={dataPrefill.kdh_perkerasan} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell></TableCell>
                                        <TableCell className="pl-8">Luas Tanah</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m²">
                                                {/* PERBAIKAN: Menambahkan onBlur */}
                                                <ManualInput name="kdh_luas_tanah" value={formData.kdh_luas_tanah} onChange={handleChange} onBlur={handleBlur} placeholder="Input Luas Tanah" type="text" title="Input Luas Tanah untuk KDH" />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell></TableCell>
                                        <TableCell className="pl-8 italic">Luas Vegetasi : Luas Tanah</TableCell>
                                        <TableCell>
                                            <InputWithUnit>
                                                {/* PERBAIKAN: Menambahkan onBlur */}
                                                <ManualInput 
                                                    type="text"
                                                    name="kdh_rasio_manual"
                                                    value={formData.kdh_rasio_manual}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    placeholder="Rasio (cth: 0.2)"
                                                    title="Input Manual: Luas Vegetasi : Luas Tanah"
                                                />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell></TableCell>
                                        <TableCell className="pl-8">Perbandingan Luas Vegetasi dengan Luas Tanah (x100%)</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="%">
                                                {/* PERBAIKAN: Menambahkan onBlur */}
                                                <ManualInput
                                                    type="text"
                                                    name="kdh_perbandingan_manual"
                                                    value={formData.kdh_perbandingan_manual}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    placeholder="cth: 20"
                                                    title="Input Manual: Perbandingan (x100%)"
                                                />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                    </tr>

                                    {/* (PERBAIKAN Poin 2, 5) Header Komponen KTB */}
                                    <tr>
                                        <TableCell colSpan={5} className={blockHeaderClass}>
                                            KTB (Koefisien Tapak Basemen)
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="font-semibold pl-4">KTB</TableCell>
                                        <TableCell className="pl-8">Luas Tapak Basemen</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m²">
                                                <ReadOnlyInput value={dataPrefill.ktb_luas_basemen} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="%">
                                                {/* PERBAIKAN: Menambahkan onBlur */}
                                                <ManualInput name="ktb_ketentuan_rtr" value={formData.ktb_ketentuan_rtr} onChange={handleChange} onBlur={handleBlur} placeholder="cth: 50" type="text" />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell>
                                            <SelectInput name="ktb_kesesuaian_rtr" value={formData.ktb_kesesuaian_rtr} onChange={handleChange}>{dropdownKtb}</SelectInput>
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell></TableCell>
                                        <TableCell className="pl-8">Luas Tanah</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m²">
                                                {/* PERBAIKAN: Menambahkan onBlur */}
                                                <ManualInput name="ktb_luas_tanah" value={formData.ktb_luas_tanah} onChange={handleChange} onBlur={handleBlur} placeholder="Input Luas Tanah" type="text" title="Input Luas Tanah untuk KTB" />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell></TableCell>
                                        <TableCell className="pl-8 italic">Luas Tapak Basemen : Luas Tanah</TableCell>
                                        <TableCell>
                                            <InputWithUnit>
                                                {/* PERBAIKAN: Menambahkan onBlur */}
                                                <ManualInput 
                                                    type="text"
                                                    name="ktb_luas_basemen_rasio"
                                                    value={formData.ktb_luas_basemen_rasio}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    placeholder="Rasio (cth: 0.5)"
                                                    title="Input Manual: Luas Tapak Basemen : Luas Tanah"
                                                />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell></TableCell>
                                        <TableCell className="pl-8">Perbandingan Luas Tapak Basemen dengan Luas Tanah (x100%)</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="%">
                                                {/* PERBAIKAN: Menambahkan onBlur */}
                                                <ManualInput
                                                    type="text"
                                                    name="ktb_perbandingan_manual"
                                                    value={formData.ktb_perbandingan_manual}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    placeholder="cth: 50"
                                                    title="Input Manual: Perbandingan (x100%)"
                                                />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                    </tr>

                                    {/* (PERBAIKAN Poin 2, 5) Header Komponen GSB */}
                                    <tr>
                                        <TableCell colSpan={5} className={blockHeaderClass}>
                                            GSB (Garis Sempadan Bangunan)
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="font-semibold pl-4">GSB</TableCell>
                                        <TableCell className="pl-8">Jarak Bangunan terhadap Batas Petak (Depan)</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m">
                                                <ReadOnlyInput value={dataPrefill.gsb_jarak} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m">
                                                {/* PERBAIKAN: Menambahkan onBlur */}
                                                <ManualInput name="gsb_ketentuan_rtr" value={formData.gsb_ketentuan_rtr} onChange={handleChange} onBlur={handleBlur} placeholder="cth: 4" type="text" />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell>
                                            <SelectInput name="gsb_kesesuaian_rtr" value={formData.gsb_kesesuaian_rtr} onChange={handleChange}>{dropdownSesuai}</SelectInput>
                                        </TableCell>
                                    </tr>
                                    
                                    {/* (PERBAIKAN Poin 2, 5) Header Komponen JBB */}
                                    <tr>
                                        <TableCell colSpan={5} className={blockHeaderClass}>
                                            JBB (Jarak Bebas Bangunan)
                                        </TableCell>
                                    </tr>
                                    {/* (PERBAIKAN Poin 1) Baris 1 JBB */}
                                    <tr>
                                        <TableCell className="font-semibold pl-4">JBB</TableCell>
                                        <TableCell className="pl-8">Jarak Bangunan (Batas Petak Belakang)</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m">
                                                <ReadOnlyInput value={dataPrefill.jbb_belakang} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m">
                                                {/* PERBAIKAN: Menambahkan onBlur */}
                                                <ManualInput name="jbb_ketentuan_rtr" value={formData.jbb_ketentuan_rtr} onChange={handleChange} onBlur={handleBlur} placeholder="cth: 3" type="text" />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell>
                                            <SelectInput name="jbb_kesesuaian_rtr" value={formData.jbb_kesesuaian_rtr} onChange={handleChange}>{dropdownSesuai}</SelectInput>
                                        </TableCell>
                                    </tr>
                                    {/* (PERBAIKAN Poin 1) Baris 2 JBB */}
                                    <tr>
                                        <TableCell></TableCell>
                                        <TableCell className="pl-8">Jarak Bangunan (Batas Petak Samping)</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m">
                                                <ReadOnlyInput value={dataPrefill.jbb_samping} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell>
                                             {/* Sel ini sengaja dikosongkan agar sejajar dengan baris JBB pertama */}
                                        </TableCell>
                                        <TableCell>
                                             {/* Sel ini sengaja dikosongkan agar sejajar dengan baris JBB pertama */}
                                        </TableCell>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </fieldset>
                    
                    {/* Tanda Tangan */}
                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-lg font-semibold px-2">Tanda Tangan Tim Penilai</legend>
                        <div className="pt-4 space-y-4">
                            {timPenilai.length > 0 ? (
                                timPenilai.map(member => (
                                    <PetugasPenilaiSignature
                                        key={member.id}
                                        member={member}
                                        signaturePath={formData.tanda_tangan_tim.find(sig => sig.user_id === member.id)?.signature}
                                        // (SOLUSI) Ganti prop untuk menghindari inline callback
                                        signatureRefs={signatureRefs}
                                        memberId={member.id}
                                    />
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm">Tim penilai tidak ditemukan untuk kasus ini.</p>
                            )}
                        </div>
                    </fieldset>

                    {/* Tombol Submit */}
                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 print:hidden no-print" role="alert">
                            <p className="font-bold">Error</p>
                            <p>{error}</p>
                        </div>
                    )}
                    <div className="flex justify-end pt-4 print:hidden no-print">
                        <button 
                            type="submit" 
                            disabled={submitLoading} 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md disabled:bg-blue-400"
                        >
                            {submitLoading ? 'Menyimpan...' : 'Simpan Formulir Analisis'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}