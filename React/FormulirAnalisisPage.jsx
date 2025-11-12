import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import SignatureCanvas from 'react-signature-canvas';
import { useAuth } from '../context/AuthContext';

// --- Komponen-komponen Reusable ---

/**
 * Komponen untuk baris header tabel
 */
const TableHeader = ({ children, colSpan = 1, rowSpan = 1, className = "" }) => (
    <th className={`p-2 border border-gray-400 bg-gray-100 font-semibold align-middle text-sm ${className}`} colSpan={colSpan} rowSpan={rowSpan}>
        {children}
    </th>
);

/**
 * Komponen untuk sel data (TD)
 */
const TableCell = ({ children, className = "", colSpan = 1, rowSpan = 1 }) => (
    <td className={`p-2 border border-gray-400 align-top ${className}`} colSpan={colSpan} rowSpan={rowSpan}>
        {children}
    </td>
);

/**
 * Komponen untuk input manual
 */
const ManualInput = ({ name, value, onChange, placeholder = "", type = "text", title = "", disabled = false }) => (
    <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        title={title}
        disabled={disabled}
        className={`w-full p-2 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
    />
);

/**
 * Komponen untuk dropdown
 */
const SelectInput = ({ name, value, onChange, children, disabled = false }) => (
    <select
        name={name}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        className={`w-full p-2 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
    >
        {children}
    </select>
);

/**
 * Komponen Tanda Tangan (Mirip PenilaianDetailPage)
 */
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

// --- Komponen Baru Sesuai Juknis ---

/**
 * Baris Header Seksi (misal: "KDB", "KLB")
 */
const JuknisHeaderRow = ({ label }) => (
    <tr className="bg-gray-50">
        <TableCell className="font-semibold" colSpan={3}>
            {label}
        </TableCell>
    </tr>
);

/**
 * Baris untuk data hasil pemeriksaan/pengukuran (read-only)
 */
const JuknisDataRow = ({ label, value, unit }) => (
    <tr>
        <TableCell className="pl-6">
            {label}
        </TableCell>
        <TableCell className="text-right pr-4">
            {value ? (
                <>
                    {value}
                    <span className="ml-2" dangerouslySetInnerHTML={{ __html: unit || '' }} />
                </>
            ) : ':'}
        </TableCell>
    </tr>
);

/**
 * Baris untuk input manual (misal: Luas Tanah di KLB, KDH, KTB)
 */
const JuknisInputRow = ({ label, name, value, onChange, unit, type = "text" }) => (
    <tr>
        <TableCell className="pl-6">{label}</TableCell>
        <TableCell>
            <div className="flex items-center">
                <span className="mr-2">:</span>
                <ManualInput 
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder="..."
                    title={`Input Manual: ${label}`}
                />
                <span className="ml-2" dangerouslySetInnerHTML={{ __html: unit || '' }} />
            </div>
        </TableCell>
    </tr>
);

/**
 * Baris untuk input perhitungan manual (Rasio / Persen)
 */
const JuknisCalcRow = ({ label, name, value, onChange, unit, type = "text" }) => (
    <tr>
        <TableCell className="pl-10 italic">{label}</TableCell>
        <TableCell>
            <div className="flex items-center">
                <span className="mr-2">:</span>
                <ManualInput 
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder="..."
                    title={`Input Manual: ${label}`}
                />
                <span className="ml-2" dangerouslySetInnerHTML={{ __html: unit || '' }} />
            </div>
        </TableCell>
    </tr>
);

/**
 * Sel untuk Kolom Ketentuan RTR dan Hasil Kesesuaian
 */
const JuknisRTRCell = ({ 
    rtrHeader, rtrName, rtrValue, onRtrChange, rtrPlaceholder, 
    kesesuaianName, kesesuaianValue, onKesesuaianChange, 
    rowSpan, children 
}) => (
    <>
        <TableCell rowSpan={rowSpan} className="w-1/4">
            <div className="flex flex-col h-full">
                {rtrHeader && <label className="font-semibold block mb-2">{rtrHeader}</label>}
                <ManualInput 
                    name={rtrName}
                    value={rtrValue}
                    onChange={onRtrChange}
                    placeholder={rtrPlaceholder}
                    title={`Ketentuan RTR: ${rtrHeader}`}
                />
            </div>
        </TableCell>
        <TableCell rowSpan={rowSpan} className="w-1/4">
            <SelectInput 
                name={kesesuaianName}
                value={kesesuaianValue}
                onChange={onKesesuaianChange}
            >
                {children}
            </SelectInput>
        </TableCell>
    </>
);


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
        luas_digunakan_ketentuan_rtr: '', // Tidak ada di Juknis, tapi ada di model
        luas_digunakan_kesesuaian_rtr: 'Sesuai', // Tidak ada di Juknis
        luas_dikuasai_ketentuan_rtr: '', // Tidak ada di Juknis
        luas_dikuasai_kesesuaian_rtr: 'Sesuai', // Tidak ada di Juknis
        // C.1 KDB
        kdb_ketentuan_rtr: '',
        kdb_kesesuaian_rtr: 'Sesuai',
        kdb_rasio_manual: '', 
        kdb_persen_manual: '',
        // C.2 KLB
        klb_luas_tanah: '',
        klb_ketentuan_rtr: '',
        klb_kesesuaian_rtr: 'Sesuai',
        klb_rasio_manual: '',
        // Ketinggian (Tidak ada di model)
        // C.3 KDH
        kdh_luas_tanah: '',
        kdh_perbandingan_vegetasi: '',
        kdh_ketentuan_rtr: '',
        kdh_kesesuaian_rtr: 'Sesuai',
        kdh_rasio_manual: '',
        // C.4 KTB
        ktb_luas_tanah: '',
        ktb_ketentuan_rtr: '',
        ktb_kesesuaian_rtr: 'Sesuai',
        ktb_rasio_manual: '',
        ktb_persen_manual: '',
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
    
    // Handler untuk perubahan input form manual
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handler untuk input numerik
    const handleNumericChange = (e) => {
        const { name, value } = e.target;
        // Izinkan string kosong, angka, dan satu titik desimal
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
    if (error && !submitLoading) return <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>;
    if (!kasus || !penilaian) return <div className="text-center py-10">Data tidak lengkap.</div>;

    // Opsi dropdown
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
                            <table className="min-w-full text-sm border-collapse border border-gray-400">
                                <thead>
                                    <tr>
                                        <TableHeader>Lokasi Usaha berdasarkan PMP UMK</TableHeader>
                                        <TableHeader>Lokasi Usaha berdasarkan Hasil Pemeriksaan (Eksisting)</TableHeader>
                                        <TableHeader>Hasil Kesesuaian PMP UMK vs Eksisting</TableHeader>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <TableCell><div className="w-full p-2 text-sm bg-gray-100 rounded-md min-h-[38px] whitespace-pre-wrap">{dataPrefill.lokasi_pmp || '-'}</div></TableCell>
                                        <TableCell><div className="w-full p-2 text-sm bg-gray-100 rounded-md min-h-[38px] whitespace-pre-wrap">{dataPrefill.lokasi_eksisting || '-'}</div></TableCell>
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
                            <table className="min-w-full text-sm border-collapse border border-gray-400">
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
                                        <TableCell><div className="w-full p-2 text-sm bg-gray-100 rounded-md min-h-[38px]">{dataPrefill.jenis_pmp || '-'}</div></TableCell>
                                        <TableCell><div className="w-full p-2 text-sm bg-gray-100 rounded-md min-h-[38px]">{dataPrefill.jenis_eksisting || '-'}</div></TableCell>
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

                    {/* C. Pengukuran - Sesuai Juknis */}
                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-lg font-semibold px-2">C. Pengukuran</legend>
                        <div className="overflow-x-auto mt-2">
                            <table className="min-w-full text-sm border-collapse border border-gray-400">
                                <thead className="text-center">
                                    <tr>
                                        <TableHeader colSpan={2}>Hasil Pemeriksaan dan Pengukuran</TableHeader>
                                        <TableHeader>Ketentuan RTR</TableHeader>
                                        <TableHeader>Hasil Kesesuaian dengan RTR (Sesuai/Tidak Sesuai)</TableHeader>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Luas Tanah */}
                                    <JuknisHeaderRow label="Luas Tanah" />
                                    <tr>
                                        <JuknisDataRow label="Luas Tanah yang digunakan kegiatan Pemanfaatan Ruang" value={dataPrefill.luas_digunakan} unit="m&sup2;" />
                                        {/* Kolom RTR & Kesesuaian untuk Luas Tanah (sesuai model, tapi tersembunyi di Juknis) */}
                                        {/* Sesuai Juknis, kolom ini kosong. Kita biarkan kosong. */}
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                    </tr>
                                    <tr>
                                        <JuknisDataRow label="Luas Tanah yang dikuasai" value={dataPrefill.luas_dikuasai} unit="m&sup2;" />
                                        {/* Sesuai Juknis, kolom ini kosong. Kita biarkan kosong. */}
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                    </tr>

                                    {/* KDB */}
                                    <JuknisHeaderRow label="KDB" />
                                    <tr>
                                        <JuknisDataRow label="Luas Lantai Dasar Bangunan" value={dataPrefill.kdb_luas_lantai_dasar} unit="m&sup2;" />
                                        <JuknisRTRCell 
                                            rtrHeader="KDB"
                                            rtrName="kdb_ketentuan_rtr"
                                            rtrValue={formData.kdb_ketentuan_rtr}
                                            onRtrChange={handleChange}
                                            rtrPlaceholder=".... %"
                                            kesesuaianName="kdb_kesesuaian_rtr"
                                            kesesuaianValue={formData.kdb_kesesuaian_rtr}
                                            onKesesuaianChange={handleChange}
                                            rowSpan={4}
                                        >
                                            {dropdownSesuai}
                                        </JuknisRTRCell>
                                    </tr>
                                    <tr>
                                        <JuknisDataRow label="Luas Tanah" value={dataPrefill.luas_dikuasai} unit="m&sup2;" />
                                    </tr>
                                    <tr>
                                        <JuknisCalcRow label="Luas Lantai Dasar Bangunan : Luas Tanah" name="kdb_rasio_manual" value={formData.kdb_rasio_manual} onChange={handleNumericChange} type="text" />
                                    </tr>
                                    <tr>
                                        <JuknisCalcRow label="Perbandingan Luas Lantai Dasar dengan Luas Tanah (x100%)" name="kdb_persen_manual" value={formData.kdb_persen_manual} onChange={handleNumericChange} type="text" unit="%" />
                                    </tr>

                                    {/* KLB */}
                                    <JuknisHeaderRow label="KLB" />
                                    <tr>
                                        <JuknisDataRow label="Jumlah Lantai Bangunan" value={dataPrefill.klb_jumlah_lantai} unit="lantai" />
                                        <JuknisRTRCell 
                                            rtrHeader="KLB"
                                            rtrName="klb_ketentuan_rtr"
                                            rtrValue={formData.klb_ketentuan_rtr}
                                            onRtrChange={handleChange}
                                            rtrPlaceholder="...."
                                            kesesuaianName="klb_kesesuaian_rtr"
                                            kesesuaianValue={formData.klb_kesesuaian_rtr}
                                            onKesesuaianChange={handleChange}
                                            rowSpan={4}
                                        >
                                            {dropdownSesuai}
                                        </JuknisRTRCell>
                                    </tr>
                                    <tr>
                                        <JuknisDataRow label="Luas Seluruh Lantai Bangunan" value={dataPrefill.klb_luas_seluruh_lantai} unit="m&sup2;" />
                                    </tr>
                                    <tr>
                                        <JuknisInputRow label="Luas Tanah" name="klb_luas_tanah" value={formData.klb_luas_tanah} onChange={handleNumericChange} type="text" unit="m&sup2;" />
                                    </tr>
                                    <tr>
                                        <JuknisCalcRow label="Luas Seluruh Lantai Bangunan : Luas Tanah" name="klb_rasio_manual" value={formData.klb_rasio_manual} onChange={handleNumericChange} type="text" />
                                    </tr>

                                    {/* Ketinggian Bangunan */}
                                    <JuknisHeaderRow label="Ketinggian Bangunan" />
                                    <tr>
                                        <JuknisDataRow label="Ketinggian Bangunan" value={dataPrefill.klb_ketinggian} unit="m" />
                                        {/* Sesuai Juknis, ada input. Tapi tidak ada di Model. Jadi kita disable. */}
                                        <TableCell>
                                            <ManualInput placeholder=".... m" disabled title="Tidak ada field di database" />
                                        </TableCell>
                                        <TableCell>
                                            <SelectInput value="Sesuai" disabled title="Tidak ada field di database">
                                                {dropdownSesuai}
                                            </SelectInput>
                                        </TableCell>
                                    </tr>

                                    {/* KDH */}
                                    <JuknisHeaderRow label="KDH" />
                                    <tr>
                                        <JuknisDataRow label="Luas Tanah yang Terdapat Vegetasi" value={dataPrefill.kdh_vegetasi} unit="m&sup2;" />
                                        <JuknisRTRCell 
                                            rtrHeader="KDH"
                                            rtrName="kdh_ketentuan_rtr"
                                            rtrValue={formData.kdh_ketentuan_rtr}
                                            onRtrChange={handleChange}
                                            rtrPlaceholder=".... %"
                                            kesesuaianName="kdh_kesesuaian_rtr"
                                            kesesuaianValue={formData.kdh_kesesuaian_rtr}
                                            onKesesuaianChange={handleChange}
                                            rowSpan={5}
                                        >
                                            {dropdownSesuai}
                                        </JuknisRTRCell>
                                    </tr>
                                    <tr>
                                        <JuknisDataRow label="Luas Tanah yang Tertutup Perkerasan yang masih dapat meresapkan air" value={dataPrefill.kdh_perkerasan} unit="m&sup2;" />
                                    </tr>
                                    <tr>
                                        <JuknisInputRow label="Luas Tanah" name="kdh_luas_tanah" value={formData.kdh_luas_tanah} onChange={handleNumericChange} type="text" unit="m&sup2;" />
                                    </tr>
                                    <tr>
                                        <JuknisCalcRow label="Luas Tanah yang Terdapat Vegetasi + Luas Tanah yang Tertutup Perkerasan... : Luas Tanah" name="kdh_rasio_manual" value={formData.kdh_rasio_manual} onChange={handleNumericChange} type="text" />
                                    </tr>
                                    <tr>
                                        <JuknisCalcRow label="Perbandingan luas tanah terdapat vegetasi dengan Luas Tanah (x100%)" name="kdh_perbandingan_vegetasi" value={formData.kdh_perbandingan_vegetasi} onChange={handleNumericChange} type="text" unit="%" />
                                    </tr>

                                    {/* KTB */}
                                    <JuknisHeaderRow label="Koefisien Tapak Basemen (KTB)" />
                                    <tr>
                                        <JuknisDataRow label="Luas Basemen" value={dataPrefill.ktb_luas_basemen} unit="m&sup2;" />
                                        <JuknisRTRCell 
                                            rtrHeader="KTB"
                                            rtrName="ktb_ketentuan_rtr"
                                            rtrValue={formData.ktb_ketentuan_rtr}
                                            onRtrChange={handleChange}
                                            rtrPlaceholder=".... %"
                                            kesesuaianName="ktb_kesesuaian_rtr"
                                            kesesuaianValue={formData.ktb_kesesuaian_rtr}
                                            onKesesuaianChange={handleChange}
                                            rowSpan={4}
                                        >
                                            {dropdownKtb}
                                        </JuknisRTRCell>
                                    </tr>
                                    <tr>
                                        <JuknisInputRow label="Luas Tanah" name="ktb_luas_tanah" value={formData.ktb_luas_tanah} onChange={handleNumericChange} type="text" unit="m&sup2;" />
                                    </tr>
                                    <tr>
                                        <JuknisCalcRow label="Luas Basemen dibagi luas tanah" name="ktb_rasio_manual" value={formData.ktb_rasio_manual} onChange={handleNumericChange} type="text" />
                                    </tr>
                                    <tr>
                                        <JuknisCalcRow label="Perbandingan Luas Basemen dengan luas tanah (x100%)" name="ktb_persen_manual" value={formData.ktb_persen_manual} onChange={handleNumericChange} type="text" unit="%" />
                                    </tr>

                                    {/* GSB */}
                                    <JuknisHeaderRow label="Garis Sempadan Bangunan (GSB)" />
                                    <tr>
                                        <JuknisDataRow label="Jarak Bangunan Terdepan dengan Pagar" value={dataPrefill.gsb_jarak} unit="m" />
                                        <JuknisRTRCell 
                                            rtrHeader="GSB"
                                            rtrName="gsb_ketentuan_rtr"
                                            rtrValue={formData.gsb_ketentuan_rtr}
                                            onRtrChange={handleChange}
                                            rtrPlaceholder=".... m"
                                            kesesuaianName="gsb_kesesuaian_rtr"
                                            kesesuaianValue={formData.gsb_kesesuaian_rtr}
                                            onKesesuaianChange={handleChange}
                                            rowSpan={1}
                                        >
                                            {dropdownSesuai}
                                        </JuknisRTRCell>
                                    </tr>

                                    {/* JBB */}
                                    <JuknisHeaderRow label="Jarak Bebas Bangunan (JBB)" />
                                    <tr>
                                        <JuknisDataRow label="Jarak Bangunan (Batas Petak Belakang)" value={dataPrefill.jbb_belakang} unit="m" />
                                        <JuknisRTRCell 
                                            rtrHeader="JBB"
                                            rtrName="jbb_ketentuan_rtr"
                                            rtrValue={formData.jbb_ketentuan_rtr}
                                            onRtrChange={handleChange}
                                            rtrPlaceholder=".... m"
                                            kesesuaianName="jbb_kesesuaian_rtr"
                                            kesesuaianValue={formData.jbb_kesesuaian_rtr}
                                            onKesesuaianChange={handleChange}
                                            rowSpan={2}
                                        >
                                            {dropdownSesuai}
                                        </JuknisRTRCell>
                                    </tr>
                                    <tr>
                                        <JuknisDataRow label="Jarak Bangunan (Batas Petak Samping)" value={dataPrefill.jbb_samping} unit="m" />
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