import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import SignatureCanvas from 'react-signature-canvas';
import { useAuth } from '../context/AuthContext';

// --- Komponen-komponen Reusable ---

// Komponen untuk baris header tabel
const TableHeader = ({ children, colSpan = 1, rowSpan = 1, className = "" }) => (
    <th className={`p-2 border border-gray-300 bg-gray-100 font-semibold align-middle ${className}`} colSpan={colSpan} rowSpan={rowSpan}>
        {children}
    </th>
);

// Komponen untuk sel data (TD)
const TableCell = ({ children, className = "" }) => (
    <td className={`p-2 border border-gray-300 align-top ${className}`}>
        {children}
    </td>
);

// Komponen untuk input disabled (pre-filled data)
const ReadOnlyInput = ({ value, className = "" }) => (
    <div className={`w-full p-2 text-sm bg-gray-100 rounded-md min-h-[38px] ${className}`}>
        {value || '-'}
    </div>
);

// Komponen untuk input manual
const ManualInput = ({ name, value, onChange, placeholder = "", type = "text", title = "" }) => (
    <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        title={title} // Menambahkan tooltip
        className="w-full p-2 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
    />
);

// Komponen untuk dropdown
const SelectInput = ({ name, value, onChange, children }) => (
    <select
        name={name}
        value={value || ''}
        onChange={onChange}
        className="w-full p-2 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
    >
        {children}
    </select>
);

// Komponen Tanda Tangan (Mirip PenilaianDetailPage)
const PetugasPenilaiSignature = ({ member, signaturePath, signatureRef }) => {
    const baseUrl = api.defaults.baseURL;
    const imageUrl = signaturePath ? `${baseUrl}/signatures/${signaturePath}?t=${new Date().getTime()}` : null;
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 p-3 border rounded-md signature-block">
            {/* Info Petugas */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Nama Petugas</label>
                <p className="mt-0.5 p-2 border rounded-md bg-gray-100 text-sm">{member.nama}</p>
                <label className="block text-sm font-medium text-gray-700 mt-1">Jabatan</label>
                <p className="mt-0.5 p-2 border rounded-md bg-gray-100 text-sm">{member.pivot?.jabatan_di_tim || member.role}</p>
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
                        <SignatureCanvas ref={signatureRef} penColor='black' canvasProps={{className: 'w-full h-20'}} />
                    </div>
                    <button type="button" onClick={() => signatureRef?.clear()} className="text-sm text-blue-600 hover:underline mt-1 no-print">Ulangi</button>
                </div>
            </div>
        </div>
    );
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
        kdb_rasio_manual: '', // BARU
        kdb_persen_manual: '', // BARU
        // C.2 KLB
        klb_luas_tanah: '',
        klb_ketentuan_rtr: '',
        klb_kesesuaian_rtr: 'Sesuai',
        klb_rasio_manual: '', // BARU
        // C.3 KDH
        kdh_luas_tanah: '',
        kdh_perbandingan_vegetasi: '',
        kdh_ketentuan_rtr: '',
        kdh_kesesuaian_rtr: 'Sesuai',
        kdh_rasio_manual: '', // BARU
        // C.4 KTB
        ktb_luas_tanah: '',
        ktb_ketentuan_rtr: '',
        ktb_kesesuaian_rtr: 'Sesuai',
        ktb_rasio_manual: '', // BARU
        ktb_persen_manual: '', // BARU
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
                            ...analisisRes.data,
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
    
    // --- DIHAPUS ---
    // const dataKalkulasi = useMemo(() => { ... });
    // --- AKHIR DIHAPUS ---
    
    // Handler untuk perubahan input form manual
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- BARU: Handler untuk input numerik ---
    const handleNumericChange = (e) => {
        const { name, value } = e.target;
        // Regex: izinkan string kosong, angka, dan satu titik desimal
        if (value === '' || /^\d*(\.\d*)?$/.test(value)) {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
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

        const signatureData = [];
        let allSigned = true;

        for (const member of timPenilai) {
            const sigCanvas = signatureRefs.current[member.id];
            const isCanvasEmpty = !sigCanvas || sigCanvas.isEmpty();
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
        
        const payload = { ...formData, tanda_tangan_tim: signatureData };

        try {
            await api.post(`/formulir-analisis/${penilaian.id}`, payload);
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
            <option value="Sesuai">Sesuai</option>
            <option value="Tidak Sesuai">Tidak Sesuai</option>
        </>
    );

    const dropdownKtb = (
        <>
            <option value="Sesuai">Sesuai</option>
            <option value="Tidak Sesuai">Tidak Sesuai</option>
            <option value="Belum Dapat Dinilai">Belum Dapat Dinilai</option>
            <option value="Penilaian Tidak Dapat Dilanjutkan">Penilaian Tidak Dapat Dilanjutkan</option>
        </>
    );

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
                            <table className="min-w-full text-sm">
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
                            <table className="min-w-full text-sm">
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
                                            <ManualInput name="jenis_ketentuan_rtr" value={formData.jenis_ketentuan_rtr} onChange={handleChange} placeholder="Input ketentuan RTR..." />
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
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr>
                                        <TableHeader colSpan={2}>Komponen</TableHeader>
                                        <TableHeader>Hasil Pemeriksaan & Pengukuran</TableHeader>
                                        <TableHeader>Perhitungan (Input Manual)</TableHeader>
                                        <TableHeader>Ketentuan RTR</TableHeader>
                                        <TableHeader>Hasil Kesesuaian dengan RTR</TableHeader>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* C.0. Umum */}
                                    <tr>
                                        <TableCell rowSpan={2} className="font-semibold">Luas Tanah</TableCell>
                                        <TableCell>Luas Tanah yang digunakan</TableCell>
                                        <TableCell><ReadOnlyInput value={dataPrefill.luas_digunakan} /></TableCell>
                                        <TableCell><ReadOnlyInput value="-" /></TableCell>
                                        <TableCell><ManualInput name="luas_digunakan_ketentuan_rtr" value={formData.luas_digunakan_ketentuan_rtr} onChange={handleChange} title="Ketentuan RTR Luas Tanah Digunakan" /></TableCell>
                                        <TableCell><SelectInput name="luas_digunakan_kesesuaian_rtr" value={formData.luas_digunakan_kesesuaian_rtr} onChange={handleChange}>{dropdownSesuai}</SelectInput></TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell>Luas Tanah yang dikuasai</TableCell>
                                        <TableCell><ReadOnlyInput value={dataPrefill.luas_dikuasai} /></TableCell>
                                        <TableCell><ReadOnlyInput value="-" /></TableCell>
                                        <TableCell><ManualInput name="luas_dikuasai_ketentuan_rtr" value={formData.luas_dikuasai_ketentuan_rtr} onChange={handleChange} title="Ketentuan RTR Luas Tanah Dikuasai"/></TableCell>
                                        <TableCell><SelectInput name="luas_dikuasai_kesesuaian_rtr" value={formData.luas_dikuasai_kesesuaian_rtr} onChange={handleChange}>{dropdownSesuai}</SelectInput></TableCell>
                                    </tr>

                                    {/* C.1. KDB */}
                                    <tr>
                                        <TableCell rowSpan={3} className="font-semibold">KDB</TableCell>
                                        <TableCell>Luas Lantai Dasar Bangunan</TableCell>
                                        <TableCell><ReadOnlyInput value={dataPrefill.kdb_luas_lantai_dasar} /></TableCell>
                                        <TableCell rowSpan={3}>
                                            {/* --- MODIFIKASI: Input Manual KDB --- */}
                                            <div className="space-y-2">
                                                <ManualInput 
                                                    type="text"
                                                    name="kdb_rasio_manual"
                                                    value={formData.kdb_rasio_manual}
                                                    onChange={handleNumericChange}
                                                    placeholder="Rasio (Contoh: 0.6)"
                                                    title="Input Manual: Luas Lantai Dasar : Luas Tanah"
                                                />
                                                <ManualInput 
                                                    type="text"
                                                    name="kdb_persen_manual"
                                                    value={formData.kdb_persen_manual}
                                                    onChange={handleNumericChange}
                                                    placeholder="Persen (Contoh: 60)"
                                                    title="Input Manual: Perbandingan (x100%)"
                                                />
                                            </div>
                                            {/* --- AKHIR MODIFIKASI --- */}
                                        </TableCell>
                                        <TableCell rowSpan={3}><ManualInput name="kdb_ketentuan_rtr" value={formData.kdb_ketentuan_rtr} onChange={handleChange} placeholder="Misal: 60%" /></TableCell>
                                        <TableCell rowSpan={3}><SelectInput name="kdb_kesesuaian_rtr" value={formData.kdb_kesesuaian_rtr} onChange={handleChange}>{dropdownSesuai}</SelectInput></TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell>Luas Tanah (dikuasai)</TableCell>
                                        <TableCell><ReadOnlyInput value={dataPrefill.luas_dikuasai} /></TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell>Perhitungan KDB</TableCell>
                                        <TableCell><ReadOnlyInput value="Lantai Dasar / Luas Tanah" /></TableCell>
                                    </tr>

                                    {/* C.2. KLB */}
                                    <tr>
                                        <TableCell rowSpan={4} className="font-semibold">KLB</TableCell>
                                        <TableCell>Jumlah Lantai Bangunan</TableCell>
                                        <TableCell><ReadOnlyInput value={dataPrefill.klb_jumlah_lantai} /></TableCell>
                                        <TableCell rowSpan={4}>
                                            {/* --- MODIFIKASI: Input Manual KLB --- */}
                                            <ManualInput 
                                                type="text"
                                                name="klb_rasio_manual"
                                                value={formData.klb_rasio_manual}
                                                onChange={handleNumericChange}
                                                placeholder="Rasio (Contoh: 1.2)"
                                                title="Input Manual: Luas Seluruh Lantai : Luas Tanah"
                                            />
                                            {/* --- AKHIR MODIFIKASI --- */}
                                        </TableCell>
                                        <TableCell rowSpan={4}><ManualInput name="klb_ketentuan_rtr" value={formData.klb_ketentuan_rtr} onChange={handleChange} placeholder="Misal: 1.2" /></TableCell>
                                        <TableCell rowSpan={4}><SelectInput name="klb_kesesuaian_rtr" value={formData.klb_kesesuaian_rtr} onChange={handleChange}>{dropdownSesuai}</SelectInput></TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell>Luas Seluruh Lantai Bangunan</TableCell>
                                        <TableCell><ReadOnlyInput value={dataPrefill.klb_luas_seluruh_lantai} /></TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell>Luas Tanah</TableCell>
                                        {/* MODIFIKASI: Ubah ke handleNumericChange */}
                                        <TableCell><ManualInput name="klb_luas_tanah" value={formData.klb_luas_tanah} onChange={handleNumericChange} placeholder="Input Luas Tanah" type="text" title="Input Luas Tanah untuk KLB" /></TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell>Perhitungan KLB</TableCell>
                                        <TableCell><ReadOnlyInput value="Luas Seluruh Lantai / Luas Tanah" /></TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="font-semibold">Ketinggian</TableCell>
                                        <TableCell>Ketinggian Bangunan</TableCell>
                                        <TableCell><ReadOnlyInput value={dataPrefill.klb_ketinggian} /></TableCell>
                                        <TableCell><ReadOnlyInput value="-" /></TableCell>
                                        <TableCell><ManualInput value="-" onChange={()=>{}} disabled className="bg-gray-100" /></TableCell> {/* Sesuai PDF, Ketentuan RTR ada di row KLB */}
                                        <TableCell><SelectInput value="Sesuai" onChange={()=>{}} disabled className="bg-gray-100">{dropdownSesuai}</SelectInput></TableCell>
                                    </tr>

                                    {/* C.3. KDH */}
                                    <tr>
                                        <TableCell rowSpan={4} className="font-semibold">KDH</TableCell>
                                        <TableCell>Luas Tanah Terdapat Vegetasi</TableCell>
                                        <TableCell><ReadOnlyInput value={dataPrefill.kdh_vegetasi} /></TableCell>
                                        <TableCell rowSpan={4}>
                                            {/* --- MODIFIKASI: Input Manual KDH --- */}
                                            <ManualInput 
                                                type="text"
                                                name="kdh_rasio_manual"
                                                value={formData.kdh_rasio_manual}
                                                onChange={handleNumericChange}
                                                placeholder="Rasio (Contoh: 0.2)"
                                                title="Input Manual: (Vegetasi + Perkerasan) : Luas Tanah"
                                            />
                                            {/* --- AKHIR MODIFIKASI --- */}
                                        </TableCell>
                                        <TableCell rowSpan={4}><ManualInput name="kdh_ketentuan_rtr" value={formData.kdh_ketentuan_rtr} onChange={handleChange} placeholder="Misal: 20%" /></TableCell>
                                        <TableCell rowSpan={4}><SelectInput name="kdh_kesesuaian_rtr" value={formData.kdh_kesesuaian_rtr} onChange={handleChange}>{dropdownSesuai}</SelectInput></TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell>Luas Tanah Perkerasan (meresap air)</TableCell>
                                        <TableCell><ReadOnlyInput value={dataPrefill.kdh_perkerasan} /></TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell>Luas Tanah</TableCell>
                                        {/* MODIFIKASI: Ubah ke handleNumericChange */}
                                        <TableCell><ManualInput name="kdh_luas_tanah" value={formData.kdh_luas_tanah} onChange={handleNumericChange} placeholder="Input Luas Tanah" type="text" title="Input Luas Tanah untuk KDH" /></TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell>Perbandingan Vegetasi (x100%)</TableCell>
                                        {/* MODIFIKASI: Ubah ke handleNumericChange */}
                                        <TableCell><ManualInput name="kdh_perbandingan_vegetasi" value={formData.kdh_perbandingan_vegetasi} onChange={handleNumericChange} placeholder="Persen (Contoh: 20)" type="text" title="Input Manual: Perbandingan Vegetasi (x100%)" /></TableCell>
                                    </tr>

                                    {/* C.4. KTB */}
                                    <tr>
                                        <TableCell rowSpan={3} className="font-semibold">KTB</TableCell>
                                        <TableCell>Luas Basemen</TableCell>
                                        <TableCell><ReadOnlyInput value={dataPrefill.ktb_luas_basemen} /></TableCell>
                                        <TableCell rowSpan={3}>
                                            {/* --- MODIFIKASI: Input Manual KTB --- */}
                                            <div className="space-y-2">
                                                <ManualInput 
                                                    type="text"
                                                    name="ktb_rasio_manual"
                                                    value={formData.ktb_rasio_manual}
                                                    onChange={handleNumericChange}
                                                    placeholder="Rasio (Contoh: 0.3)"
                                                    title="Input Manual: Luas Basemen : Luas Tanah"
                                                />
                                                <ManualInput 
                                                    type="text"
                                                    name="ktb_persen_manual"
                                                    value={formData.ktb_persen_manual}
                                                    onChange={handleNumericChange}
                                                    placeholder="Persen (Contoh: 30)"
                                                    title="Input Manual: Perbandingan (x100%)"
                                                />
                                            </div>
                                            {/* --- AKHIR MODIFIKASI --- */}
                                        </TableCell>
                                        <TableCell rowSpan={3}><ManualInput name="ktb_ketentuan_rtr" value={formData.ktb_ketentuan_rtr} onChange={handleChange} placeholder="Misal: 30%" /></TableCell>
                                        <TableCell rowSpan={3}><SelectInput name="ktb_kesesuaian_rtr" value={formData.ktb_kesesuaian_rtr} onChange={handleChange}>{dropdownKtb}</SelectInput></TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell>Luas Tanah</TableCell>
                                        {/* MODIFIKASI: Ubah ke handleNumericChange */}
                                        <TableCell><ManualInput name="ktb_luas_tanah" value={formData.ktb_luas_tanah} onChange={handleNumericChange} placeholder="Input Luas Tanah" type="text" title="Input Luas Tanah untuk KTB" /></TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell>Perhitungan KTB</TableCell>
                                        <TableCell><ReadOnlyInput value="Luas Basemen / Luas Tanah" /></TableCell>
                                    </tr>

                                    {/* C.5. GSB */}
                                    <tr>
                                        <TableCell className="font-semibold">GSB</TableCell>
                                        <TableCell>Jarak Bangunan Terdepan dgn Pagar</TableCell>
                                        <TableCell><ReadOnlyInput value={dataPrefill.gsb_jarak} /></TableCell>
                                        <TableCell><ReadOnlyInput value="-" /></TableCell>
                                        <TableCell><ManualInput name="gsb_ketentuan_rtr" value={formData.gsb_ketentuan_rtr} onChange={handleChange} placeholder="Misal: 5m" /></TableCell>
                                        <TableCell><SelectInput name="gsb_kesesuaian_rtr" value={formData.gsb_kesesuaian_rtr} onChange={handleChange}>{dropdownSesuai}</SelectInput></TableCell>
                                    </tr>

                                    {/* C.6. JBB */}
                                    <tr>
                                        <TableCell rowSpan={2} className="font-semibold">JBB</TableCell>
                                        <TableCell>Jarak Bangunan (Batas Petak Belakang)</TableCell>
                                        <TableCell><ReadOnlyInput value={dataPrefill.jbb_belakang} /></TableCell>
                                        <TableCell rowSpan={2}><ReadOnlyInput value="-" /></TableCell>
                                        <TableCell rowSpan={2}><ManualInput name="jbb_ketentuan_rtr" value={formData.jbb_ketentuan_rtr} onChange={handleChange} placeholder="Misal: 3m" /></TableCell>
                                        <TableCell rowSpan={2}><SelectInput name="jbb_kesesuaian_rtr" value={formData.jbb_kesesuaian_rtr} onChange={handleChange}>{dropdownSesuai}</SelectInput></TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell>Jarak Bangunan (Batas Petak Samping)</TableCell>
                                        <TableCell><ReadOnlyInput value={dataPrefill.jbb_samping} /></TableCell>
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
                                        signatureRef={el => signatureRefs.current[member.id] = el}
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