import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import SignatureCanvas from 'react-signature-canvas';
import { useAuth } from '../context/AuthContext';

// --- CSS KHUSUS UNTUK PRINT ---
const PrintStyles = () => (
    <style>
        {`
            @media print {
                /* Sembunyikan elemen navigasi dan tombol aksi saat print */
                .no-print, nav, button, .action-bar {
                    display: none !important;
                }
                
                /* Pastikan background putih dan font hitam */
                body, .printable-area {
                    background-color: white !important;
                    color: black !important;
                    font-family: 'Times New Roman', Times, serif;
                }

                /* Hilangkan shadow dan margin container */
                .printable-area {
                    box-shadow: none !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    max-width: 100% !important;
                }

                /* Ubah tampilan input/select menjadi teks biasa */
                input, select, textarea {
                    border: none !important;
                    background: transparent !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    appearance: none !important; /* Hilangkan panah dropdown */
                    -webkit-appearance: none !important;
                    -moz-appearance: none !important;
                    font-size: 11pt !important;
                    width: auto !important;
                    color: black !important;
                }
                
                /* Sembunyikan placeholder */
                ::placeholder {
                    color: transparent;
                }

                /* Styling Tabel Cetak */
                table {
                    width: 100% !important;
                    border-collapse: collapse !important;
                }
                th, td {
                    border: 1px solid #000 !important; /* Border hitam tegas */
                    padding: 4px !important;
                    font-size: 11pt !important;
                }
                th {
                    background-color: #f0f0f0 !important; /* Abu-abu muda untuk header */
                    -webkit-print-color-adjust: exact; /* Paksa cetak background color */
                }

                /* Page Break Control */
                fieldset {
                    border: 1px solid #000 !important;
                    margin-bottom: 10px !important;
                    break-inside: avoid;
                }
                legend {
                    font-weight: bold;
                }
                
                /* Tanda Tangan */
                .signature-canvas-container {
                    display: none !important;
                }
                .signature-image-container {
                    display: block !important;
                }
                .signature-block {
                    border: none !important; /* Hilangkan kotak pembungkus perorangan saat print */
                }
            }
        `}
    </style>
);

// --- Komponen-komponen Reusable ---

const TableHeader = memo(({ children, colSpan = 1, rowSpan = 1, className = "" }) => (
    <th className={`py-2 px-3 border border-gray-300 bg-gray-100 font-semibold align-middle ${className}`} colSpan={colSpan} rowSpan={rowSpan}>
        {children}
    </th>
));

const TableCell = memo(({ children, className = "", rowSpan = 1 }) => (
    <td className={`py-2 px-3 border border-gray-300 align-top ${className}`} rowSpan={rowSpan}>
        {children}
    </td>
));

const ReadOnlyInput = memo(({ value, className = "" }) => (
    <div className={`w-full p-2 text-sm bg-gray-100 rounded-md min-h-[38px] flex items-center print:bg-transparent print:p-0 print:border-none ${className}`}>
        {value || '-'}
    </div>
));

const ManualInput = memo(({ name, value, onChange, onBlur, placeholder = "", type = "text", title = "", className = "", disabled = false }) => (
    <input
        dir="ltr"
        type={type}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={disabled ? "" : placeholder} // Sembunyikan placeholder saat disabled/preview
        title={title}
        disabled={disabled}
        style={{ textAlign: 'left' }}
        className={`
            w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm 
            focus:border-blue-500 focus:ring-0 focus:outline-none min-h-[38px] 
            disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-not-allowed
            print:bg-transparent print:border-none print:shadow-none print:p-0
            ${className}
        `}
    />
));

const SelectInput = memo(({ name, value, onChange, children, className = "", disabled = false }) => {
    const customArrow = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%236b7280'%3E%3Cpath d='M8 11.25a.75.75 0 0 1-.53-.22l-4-4a.75.75 0 0 1 1.06-1.06L8 9.44l3.47-3.47a.75.75 0 0 1 1.06 1.06l-4 4a.75.75 0 0 1-.53.22Z'/%3E%3C/svg%3E")`;

    return (
        <select
            name={name}
            value={value ?? ''}
            onChange={onChange}
            title={value} 
            disabled={disabled}
            style={!disabled ? {
                backgroundImage: customArrow,
                backgroundPosition: `right 0.25rem center`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.25em 1.25em',
            } : {}} // Hilangkan panah custom saat disabled agar terlihat seperti teks biasa (terutama saat print)
            
            className={`
                w-full p-2 text-sm border-gray-300 rounded-md shadow-sm 
                focus:border-blue-500 focus:ring-blue-500 
                min-h-[38px] h-auto whitespace-normal break-words 
                appearance-none pr-8 
                disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-not-allowed disabled:border-gray-200
                print:bg-transparent print:border-none print:shadow-none print:p-0 print:appearance-none
                ${className}
            `}
        >
            {children}
        </select>
    );
});

const InputWithUnit = memo(({ children, unit, className = "" }) => (
    <div className={`flex items-center gap-2 w-full ${className}`}>
        <div className="flex-grow">
            {children}
        </div>
        {unit && <span className="text-gray-600 w-8 flex-shrink-0 print:text-black">{unit}</span>}
    </div>
));

const PetugasPenilaiSignature = memo(({ member, signaturePath, signatureRefs, memberId, isReadOnly }) => {
    const baseUrl = api.defaults.baseURL;
    const imageUrl = signaturePath ? `${baseUrl}/signatures/${signaturePath}?t=${new Date().getTime()}` : null;

    const setCanvasRef = useCallback(el => {
        if (signatureRefs) {
            signatureRefs.current[memberId] = el;
        }
    }, [signatureRefs, memberId]);

    const handleClear = useCallback(() => {
        if (signatureRefs?.current[memberId]) {
            signatureRefs.current[memberId].clear();
        }
    }, [signatureRefs, memberId]);
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 p-3 border rounded-md signature-block bg-white">
            {/* Info Petugas */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Nama Petugas</label>
                <p className="mt-0.5 p-2 border rounded-md bg-gray-50 text-sm min-h-[38px] print:bg-transparent print:border-none print:p-0 print:border-b print:border-black print:rounded-none">{member.nama}</p>
                <label className="block text-sm font-medium text-gray-700 mt-1">Jabatan</label>
                <p className="mt-0.5 p-2 border rounded-md bg-gray-50 text-sm min-h-[38px] print:bg-transparent print:border-none print:p-0">{member.pivot?.jabatan_di_tim || member.role}</p>
            </div>
            {/* Tanda Tangan */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Tanda Tangan:</label>
                
                {/* 1. Tampilan Gambar (Selalu muncul jika ada path, atau saat ReadOnly) */}
                {(imageUrl || isReadOnly) && (
                    <div className="my-1 signature-image-container">
                        {imageUrl ? (
                            <img 
                                src={imageUrl} 
                                alt={`Tanda Tangan ${member.nama}`} 
                                className="mx-auto h-20 border rounded bg-white object-contain print:border-none"
                            />
                        ) : (
                            <div className="h-20 border rounded bg-white flex items-center justify-center text-gray-400 text-sm print:border-none">(Belum TTD)</div>
                        )}
                    </div>
                )}

                {/* 2. Canvas Tanda Tangan (Hanya saat mode Edit/Input) */}
                {!isReadOnly && (
                    <div className='signature-canvas-container'>
                        <div className="border border-gray-300 rounded-md bg-white">
                            <SignatureCanvas ref={setCanvasRef} penColor='black' canvasProps={{className: 'w-full h-20'}} />
                        </div>
                        <button type="button" onClick={handleClear} className="text-sm text-blue-600 hover:underline mt-1 no-print">Ulangi</button>
                    </div>
                )}
            </div>
        </div>
    );
});

const sanitizeNumericValue = (value) => {
    if (typeof value !== 'string' || !value) {
        return value ?? ''; 
    }
    const filtered = value.replace(/[^0-9.,]/g, '');
    const dotsOnly = filtered.replace(/,/g, '.');
    const parts = dotsOnly.split('.');
    let finalValue = parts.shift(); 
    if (parts.length > 0) {
        finalValue += '.' + parts.join(''); 
    }
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

    // State untuk Mode Read-Only (Preview) vs Edit
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [dataExists, setDataExists] = useState(false);
    const [initialData, setInitialData] = useState(null); // Untuk fitur Batal

    const signatureRefs = useRef({});

    const [formData, setFormData] = useState({
        lokasi_kesesuaian_pmp_eksisting: 'Sesuai',
        jenis_kesesuaian_pmp_eksisting: 'Sesuai',
        jenis_ketentuan_rtr: '',
        jenis_kesesuaian_rtr: 'Sesuai',
        luas_digunakan_ketentuan_rtr: '',
        luas_dikuasai_ketentuan_rtr: '',
        luas_tanah_kesesuaian_rtr: 'Sesuai', 
        kdb_ketentuan_rtr: '',
        kdb_kesesuaian_rtr: 'Sesuai',
        kdb_luas_lantai_dasar_rasio: '',
        kdb_perbandingan_manual: '',
        klb_luas_tanah: '',
        klb_ketentuan_rtr: '',
        klb_kesesuaian_rtr: 'Sesuai',
        klb_luas_seluruh_lantai_rasio: '',
        ketinggian_ketentuan_rtr: '',
        ketinggian_kesesuaian_rtr: 'Sesuai',
        kdh_luas_tanah: '',
        kdh_rasio_manual: '',
        kdh_perbandingan_manual: '',
        kdh_ketentuan_rtr: '',
        kdh_kesesuaian_rtr: 'Sesuai',
        ktb_luas_tanah: '',
        ktb_ketentuan_rtr: '',
        ktb_kesesuaian_rtr: 'Sesuai',
        ktb_luas_basemen_rasio: '',
        ktb_perbandingan_manual: '',
        gsb_ketentuan_rtr: '',
        gsb_kesesuaian_rtr: 'Sesuai',
        jbb_ketentuan_rtr: '',
        jbb_kesesuaian_rtr: 'Sesuai',
        tanda_tangan_tim: [],
    });

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

                try {
                    const analisisRes = await api.get(`/formulir-analisis/${kasusRes.data.penilaian.id}`);
                    if (analisisRes.data) {
                        const apiData = {
                            ...analisisRes.data,
                            // Konversi null ke string kosong untuk controlled inputs
                            kdb_ketentuan_rtr: String(analisisRes.data.kdb_ketentuan_rtr ?? ''),
                            klb_ketentuan_rtr: String(analisisRes.data.klb_ketentuan_rtr ?? ''),
                            kdh_ketentuan_rtr: String(analisisRes.data.kdh_ketentuan_rtr ?? ''),
                            ktb_ketentuan_rtr: String(analisisRes.data.ktb_ketentuan_rtr ?? ''),
                            gsb_ketentuan_rtr: String(analisisRes.data.gsb_ketentuan_rtr ?? ''),
                            jbb_ketentuan_rtr: String(analisisRes.data.jbb_ketentuan_rtr ?? ''),
                            ketinggian_ketentuan_rtr: String(analisisRes.data.ketinggian_ketentuan_rtr ?? ''),
                            luas_digunakan_ketentuan_rtr: String(analisisRes.data.luas_digunakan_ketentuan_rtr ?? ''),
                            luas_dikuasai_ketentuan_rtr: String(analisisRes.data.luas_dikuasai_ketentuan_rtr ?? ''),
                            klb_luas_tanah: String(analisisRes.data.klb_luas_tanah ?? ''),
                            kdh_luas_tanah: String(analisisRes.data.kdh_luas_tanah ?? ''),
                            ktb_luas_tanah: String(analisisRes.data.ktb_luas_tanah ?? ''),
                            kdb_luas_lantai_dasar_rasio: String(analisisRes.data.kdb_rasio_manual ?? ''),
                            kdb_perbandingan_manual: String(analisisRes.data.kdb_persen_manual ?? ''),
                            klb_luas_seluruh_lantai_rasio: String(analisisRes.data.klb_rasio_manual ?? ''),
                            kdh_rasio_manual: String(analisisRes.data.kdh_rasio_manual ?? ''),
                            kdh_perbandingan_manual: String(analisisRes.data.kdh_perbandingan_vegetasi ?? ''),
                            ktb_luas_basemen_rasio: String(analisisRes.data.ktb_rasio_manual ?? ''),
                            ktb_perbandingan_manual: String(analisisRes.data.ktb_persen_manual ?? ''),
                            luas_tanah_kesesuaian_rtr: analisisRes.data.luas_tanah_kesesuaian_rtr ?? analisisRes.data.luas_digunakan_kesesuaian_rtr ?? 'Sesuai',
                            tanda_tangan_tim: (analisisRes.data.tanda_tangan_tim || []).map(sig => ({
                                user_id: sig.user_id,
                                signature: sig.signature_path
                            })),
                        };

                        setFormData(prev => ({ ...prev, ...apiData }));
                        // Simpan data awal untuk fitur Batal
                        setInitialData({ ...formData, ...apiData });
                        // Set status data exists dan read-only
                        setDataExists(true);
                        setIsReadOnly(true); 
                    }
                } catch (analisisErr) {
                    if (analisisErr.response?.status !== 404) {
                        throw analisisErr;
                    }
                    // Jika 404, biarkan isReadOnly false (mode input baru)
                }

            } catch (err) {
                setError(err.message || 'Gagal memuat data yang diperlukan.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [kasusId]);
    
    // Data pre-fill dari Pemegang
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

    // Data pre-fill dari Penilaian
    const dataPrefill = useMemo(() => {
        if (!penilaian || !kasus) return {};
        const pem = penilaian.pemeriksaan || [];
        const png = penilaian.pengukuran || [];
        const pemegang = kasus.pemegang || {};

        return {
            lokasi_pmp: [pemegang.alamat, pemegang.desa_kelurahan, pemegang.kecamatan, pemegang.kabupaten, pemegang.provinsi, `Lat: ${pem[5]?.pernyataan_mandiri}`, `Bujur: ${pem[6]?.pernyataan_mandiri}`].filter(Boolean).join('\n'),
            lokasi_eksisting: [pem[0]?.pernyataan_mandiri, pem[1]?.pernyataan_mandiri, pem[2]?.pernyataan_mandiri, pem[3]?.pernyataan_mandiri, pem[4]?.pernyataan_mandiri, `Lat: ${pem[5]?.pernyataan_mandiri}`, `Bujur: ${pem[6]?.pernyataan_mandiri}`].filter(Boolean).join('\n'),
            jenis_pmp: pemegang.kegiatan,
            jenis_eksisting: pem[7]?.pernyataan_mandiri,
            luas_digunakan: png[0]?.hasil_pengukuran,
            luas_dikuasai: png[1]?.hasil_pengukuran,
            kdb_luas_lantai_dasar: png[2]?.hasil_pengukuran,
            klb_jumlah_lantai: png[3]?.hasil_pengukuran,
            klb_luas_seluruh_lantai: png[4]?.hasil_pengukuran,
            klb_ketinggian: png[5]?.hasil_pengukuran,
            kdh_vegetasi: png[6]?.hasil_pengukuran,
            kdh_perkerasan: png[7]?.hasil_pengukuran,
            ktb_luas_basemen: png[8]?.hasil_pengukuran,
            gsb_jarak: png[9]?.hasil_pengukuran,
            jbb_belakang: png[10]?.hasil_pengukuran,
            jbb_samping: png[11]?.hasil_pengukuran,
        };
    }, [penilaian, kasus]);
    
    // Kalkulasi Otomatis (Hanya berjalan jika TIDAK ReadOnly)
    useEffect(() => {
        if (isReadOnly) return;

        // KDB
        const luasLantaiDasar = parseFloat(dataPrefill.kdb_luas_lantai_dasar);
        const luasTanahKdb = parseFloat(dataPrefill.luas_dikuasai);
        if (!isNaN(luasLantaiDasar) && !isNaN(luasTanahKdb) && luasTanahKdb > 0) {
            const rasio = luasLantaiDasar / luasTanahKdb;
            setFormData(prev => ({
                ...prev,
                kdb_luas_lantai_dasar_rasio: rasio.toFixed(3),
                kdb_perbandingan_manual: (rasio * 100).toFixed(2)
            }));
        }

        // KLB
        const luasSeluruhLantai = parseFloat(dataPrefill.klb_luas_seluruh_lantai);
        const luasTanahKlb = parseFloat(String(formData.klb_luas_tanah ?? '').replace(/,/g, '.').replace(/[^0-9.]/g, ''));
        if (!isNaN(luasSeluruhLantai) && !isNaN(luasTanahKlb) && luasTanahKlb > 0) {
            setFormData(prev => ({ ...prev, klb_luas_seluruh_lantai_rasio: (luasSeluruhLantai / luasTanahKlb).toFixed(3) }));
        }

        // KDH
        const luasVegetasi = parseFloat(dataPrefill.kdh_vegetasi);
        const luasTanahKdh = parseFloat(String(formData.kdh_luas_tanah ?? '').replace(/,/g, '.').replace(/[^0-9.]/g, ''));
        if (!isNaN(luasVegetasi) && !isNaN(luasTanahKdh) && luasTanahKdh > 0) {
            const rasio = luasVegetasi / luasTanahKdh;
            setFormData(prev => ({
                ...prev,
                kdh_rasio_manual: rasio.toFixed(3),
                kdh_perbandingan_manual: (rasio * 100).toFixed(2)
            }));
        }
    }, [dataPrefill, formData.klb_luas_tanah, formData.kdh_luas_tanah, isReadOnly]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []); 

    const handleBlur = useCallback((e) => { }, []);
    
    const timPenilai = useMemo(() => {
        if (!kasus || !kasus.tim || !kasus.tim.users) return [];
        return kasus.tim.users;
    }, [kasus]);
    
    // --- Handler Aksi ---

    const handleEditClick = () => {
        setIsReadOnly(false);
    };

    const handleCancelClick = () => {
        // Kembalikan data ke posisi awal (saved state)
        if (initialData) {
            setFormData(initialData);
        }
        setIsReadOnly(true);
    };

    const handlePrintClick = () => {
        window.print();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setError('');

        const sanitizedFormData = { ...formData };
        const numericKeywords = ['rasio', 'manual', 'luas_tanah', 'ketentuan_rtr'];
        
        for (const key in sanitizedFormData) {
            if (key === 'jenis_ketentuan_rtr') continue;
            if (numericKeywords.some(keyword => key.includes(keyword))) {
                sanitizedFormData[key] = sanitizeNumericValue(sanitizedFormData[key]);
            }
        }
        
        setFormData(sanitizedFormData);

        const signatureData = [];
        // Logic Tanda Tangan: Gabungkan TTD canvas baru dengan TTD lama
        for (const member of timPenilai) {
            const sigCanvas = signatureRefs.current[member.id];
            const isCanvasEmpty = !sigCanvas || sigCanvas.isEmpty();
            const existingSignature = formData.tanda_tangan_tim.find(sig => sig.user_id === member.id);

            if (!isCanvasEmpty) {
                // Priority 1: Canvas baru
                signatureData.push({ user_id: member.id, signature: sigCanvas.toDataURL() });
            } else if (existingSignature) {
                // Priority 2: TTD lama
                signatureData.push({ user_id: member.id, signature: existingSignature.signature });
            }
        }
        
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
            alert('Formulir Analisis berhasil disimpan!');
            
            // Update initial data dengan data baru dan set ke read-only
            setInitialData(formData); 
            setDataExists(true);
            setIsReadOnly(true);
            
            // Scroll ke atas
            window.scrollTo(0, 0);
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

    const blockHeaderClass = "bg-gray-100 font-semibold p-2 border-t-2 border-b border-gray-300 print:bg-gray-200 print:border-black";

    return (
        <div className="bg-gray-100">
            <PrintStyles />

            {/* Tombol Aksi Atas */}
            <div className="mb-6 flex justify-between items-center no-print px-4 py-3 bg-white shadow-sm sm:px-6 lg:px-8 action-bar">
                <Link to="/penilaian" className="text-blue-600 hover:underline">&larr; Kembali ke Dashboard Penilaian</Link>
                <div className="flex space-x-3">
                    {/* Jika Data Ada (Mode Baca/Preview) */}
                    {isReadOnly && dataExists && (
                        <>
                            <button 
                                onClick={handlePrintClick} 
                                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md"
                            >
                                Print PDF
                            </button>
                            <button 
                                onClick={handleEditClick} 
                                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md"
                            >
                                Edit Data
                            </button>
                        </>
                    )}
                    
                    {/* Jika Mode Edit Aktif (dan data sudah ada sebelumnya) */}
                    {!isReadOnly && dataExists && (
                        <button 
                            onClick={handleCancelClick} 
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md"
                        >
                            Batal Edit
                        </button>
                    )}
                </div>
            </div>

            {/* Area Form */}
            <div className="printable-area max-w-6xl mx-auto bg-white rounded-lg shadow-lg mb-8">
                
                {/* Banner Mode Edit */}
                {!isReadOnly && dataExists && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 no-print">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                {/* Icon warning */}
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    Anda sedang dalam <strong>Mode Edit</strong>. Silakan ubah data dan klik "Simpan Perubahan" di bawah.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

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
                                            <SelectInput name="lokasi_kesesuaian_pmp_eksisting" value={formData.lokasi_kesesuaian_pmp_eksisting} onChange={handleChange} disabled={isReadOnly}>
                                                {dropdownSesuai}
                                            </SelectInput>
                                        </TableCell>
                                    </tr>
                                </tbody>
                            </table>

                            {/* B.2. Jenis Kegiatan */}
                            <h4 className="font-semibold mt-6 mb-2 text-sm">2) Pemeriksaan Jenis Kegiatan Pemanfaatan Ruang</h4>
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
                                            <SelectInput name="jenis_kesesuaian_pmp_eksisting" value={formData.jenis_kesesuaian_pmp_eksisting} onChange={handleChange} disabled={isReadOnly}>
                                                {dropdownSesuai}
                                            </SelectInput>
                                        </TableCell>
                                        <TableCell>
                                            <ManualInput name="jenis_ketentuan_rtr" value={formData.jenis_ketentuan_rtr} onChange={handleChange} onBlur={handleBlur} placeholder="Input ketentuan RTR..." disabled={isReadOnly} />
                                        </TableCell>
                                        <TableCell>
                                            <SelectInput name="jenis_kesesuaian_rtr" value={formData.jenis_kesesuaian_rtr} onChange={handleChange} disabled={isReadOnly}>
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
                            <table className="min-w-full text-sm table-auto border-collapse">
                                <colgroup>
                                    <col className="w-[25%]" /> {/* Komponen */}
                                    <col className="w-[20%]" /> {/* Sub-Komponen */}
                                    <col className="w-[18%]" /> {/* Hasil Pemeriksaan */}
                                    <col className="w-[12%]" /> {/* Ketentuan RTR */}
                                    <col className="w-[25%]" /> {/* Hasil Kesesuaian */}
                                </colgroup>
                                <thead>
                                    <tr>
                                        <TableHeader colSpan={2}>Komponen</TableHeader>
                                        <TableHeader>Hasil Pemeriksaan & Pengukuran</TableHeader>
                                        <TableHeader>Ketentuan RTR</TableHeader>
                                        <TableHeader>Hasil Kesesuaian dgn RTR</TableHeader>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Luas Tanah */}
                                    <tr>
                                        <TableCell colSpan={5} className={blockHeaderClass}>
                                            Luas Tanah
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="font-semibold pl-4" rowSpan={2}>Luas Tanah</TableCell>
                                        <TableCell className="pl-8">Luas Tanah yang digunakan</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m²">
                                                <ReadOnlyInput value={dataPrefill.luas_digunakan} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell rowSpan={2} className="border-r">
                                            <InputWithUnit>
                                                <ManualInput name="luas_digunakan_ketentuan_rtr" value={formData.luas_digunakan_ketentuan_rtr} onChange={handleChange} onBlur={handleBlur} title="Ketentuan RTR Luas Tanah" disabled={isReadOnly} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell rowSpan={2}>
                                            <SelectInput name="luas_tanah_kesesuaian_rtr" value={formData.luas_tanah_kesesuaian_rtr} onChange={handleChange} disabled={isReadOnly}>{dropdownSesuai}</SelectInput>
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="pl-8">Luas Tanah yang dikuasai</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m²">
                                                <ReadOnlyInput value={dataPrefill.luas_dikuasai} />
                                            </InputWithUnit>
                                        </TableCell>
                                    </tr>

                                    {/* KDB */}
                                    <tr>
                                        <TableCell colSpan={5} className={blockHeaderClass}>
                                            KDB (Koefisien Dasar Bangunan)
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="font-semibold pl-4" rowSpan={4}>KDB</TableCell>
                                        <TableCell className="pl-8">Luas Lantai Dasar Bangunan</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m²">
                                                <ReadOnlyInput value={dataPrefill.kdb_luas_lantai_dasar} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell rowSpan={4}>
                                            <InputWithUnit unit="%">
                                                <ManualInput name="kdb_ketentuan_rtr" value={formData.kdb_ketentuan_rtr} onChange={handleChange} onBlur={handleBlur} placeholder="cth: 60" type="text" disabled={isReadOnly}/>
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell rowSpan={4}>
                                            <SelectInput name="kdb_kesesuaian_rtr" value={formData.kdb_kesesuaian_rtr} onChange={handleChange} disabled={isReadOnly}>{dropdownSesuai}</SelectInput>
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="pl-8">Luas Tanah (dikuasai)</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m²">
                                                <ReadOnlyInput value={dataPrefill.luas_dikuasai} />
                                            </InputWithUnit>
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="pl-8 italic">Luas Lantai Dasar : Luas Tanah</TableCell>
                                        <TableCell>
                                            <InputWithUnit>
                                                <ReadOnlyInput 
                                                    value={formData.kdb_luas_lantai_dasar_rasio}
                                                />
                                            </InputWithUnit>
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="pl-8">Perbandingan Luas Lantai Dasar dengan Luas Tanah (x100%)</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="%">
                                                <ReadOnlyInput
                                                    value={formData.kdb_perbandingan_manual}
                                                />
                                            </InputWithUnit>
                                        </TableCell>
                                    </tr>

                                    {/* KLB */}
                                    <tr>
                                        <TableCell colSpan={5} className={blockHeaderClass}>
                                            KLB (Koefisien Lantai Bangunan)
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="font-semibold pl-4" rowSpan={4}>KLB</TableCell>
                                        <TableCell className="pl-8">Jumlah Lantai Bangunan</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="lantai">
                                                <ReadOnlyInput value={dataPrefill.klb_jumlah_lantai} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell rowSpan={4}>
                                            <InputWithUnit>
                                                <ManualInput name="klb_ketentuan_rtr" value={formData.klb_ketentuan_rtr} onChange={handleChange} onBlur={handleBlur} placeholder="cth: 1.2" type="text" disabled={isReadOnly} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell rowSpan={4}>
                                            <SelectInput name="klb_kesesuaian_rtr" value={formData.klb_kesesuaian_rtr} onChange={handleChange} disabled={isReadOnly}>{dropdownSesuai}</SelectInput>
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="pl-8">Luas Seluruh Lantai Bangunan</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m²">
                                                <ReadOnlyInput value={dataPrefill.klb_luas_seluruh_lantai} />
                                            </InputWithUnit>
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="pl-8">Luas Tanah</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m²">
                                                <ManualInput name="klb_luas_tanah" value={formData.klb_luas_tanah} onChange={handleChange} onBlur={handleBlur} placeholder="Input Luas Tanah" type="text" title="Input Luas Tanah untuk KLB" disabled={isReadOnly} />
                                            </InputWithUnit>
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="pl-8 italic">Luas Seluruh Lantai : Luas Tanah</TableCell>
                                        <TableCell>
                                            <InputWithUnit>
                                                <ReadOnlyInput 
                                                    value={formData.klb_luas_seluruh_lantai_rasio}
                                                />
                                            </InputWithUnit>
                                        </TableCell>
                                    </tr>
                                    
                                    {/* Ketinggian Bangunan */}
                                    <tr>
                                        <TableCell colSpan={5} className={blockHeaderClass}>
                                            Ketinggian Bangunan
                                        </TableCell>
                                    </tr>
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
                                                <ManualInput name="ketinggian_ketentuan_rtr" value={formData.ketinggian_ketentuan_rtr} onChange={handleChange} onBlur={handleBlur} placeholder="cth: 8" type="text" disabled={isReadOnly} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell>
                                            <SelectInput name="ketinggian_kesesuaian_rtr" value={formData.ketinggian_kesesuaian_rtr} onChange={handleChange} disabled={isReadOnly}>{dropdownSesuai}</SelectInput>
                                        </TableCell>
                                    </tr>

                                    {/* KDH */}
                                    <tr>
                                        <TableCell colSpan={5} className={blockHeaderClass}>
                                            KDH (Koefisien Daerah Hijau)
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="font-semibold pl-4" rowSpan={5}>KDH</TableCell>
                                        <TableCell className="pl-8">Luas Vegetasi</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m²">
                                                <ReadOnlyInput value={dataPrefill.kdh_vegetasi} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell rowSpan={5}>
                                            <InputWithUnit unit="%">
                                                <ManualInput name="kdh_ketentuan_rtr" value={formData.kdh_ketentuan_rtr} onChange={handleChange} onBlur={handleBlur} placeholder="cth: 20" type="text" disabled={isReadOnly} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell rowSpan={5}>
                                            <SelectInput name="kdh_kesesuaian_rtr" value={formData.kdh_kesesuaian_rtr} onChange={handleChange} disabled={isReadOnly}>{dropdownSesuai}</SelectInput>
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="pl-8">Luas Perkerasan</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m²">
                                                <ReadOnlyInput value={dataPrefill.kdh_perkerasan} />
                                            </InputWithUnit>
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="pl-8">Luas Tanah</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m²">
                                                <ManualInput name="kdh_luas_tanah" value={formData.kdh_luas_tanah} onChange={handleChange} onBlur={handleBlur} placeholder="Input Luas Tanah" type="text" title="Input Luas Tanah untuk KDH" disabled={isReadOnly} />
                                            </InputWithUnit>
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="pl-8 italic">Luas Vegetasi : Luas Tanah</TableCell>
                                        <TableCell>
                                            <InputWithUnit>
                                                <ReadOnlyInput 
                                                    value={formData.kdh_rasio_manual}
                                                />
                                            </InputWithUnit>
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="pl-8">Perbandingan Luas Vegetasi dengan Luas Tanah (x100%)</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="%">
                                                <ReadOnlyInput
                                                    value={formData.kdh_perbandingan_manual}
                                                />
                                            </InputWithUnit>
                                        </TableCell>
                                    </tr>

                                    {/* KTB */}
                                    <tr>
                                        <TableCell colSpan={5} className={blockHeaderClass}>
                                            KTB (Koefisien Tapak Basemen)
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="font-semibold pl-4" rowSpan={4}>KTB</TableCell>
                                        <TableCell className="pl-8">Luas Tapak Basemen</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m²">
                                                <ReadOnlyInput value={dataPrefill.ktb_luas_basemen} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell rowSpan={4}>
                                            <InputWithUnit unit="%">
                                                <ManualInput name="ktb_ketentuan_rtr" value={formData.ktb_ketentuan_rtr} onChange={handleChange} onBlur={handleBlur} placeholder="cth: 50" type="text" disabled={isReadOnly} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell rowSpan={4}>
                                            <SelectInput name="ktb_kesesuaian_rtr" value={formData.ktb_kesesuaian_rtr} onChange={handleChange} disabled={isReadOnly}>{dropdownKtb}</SelectInput>
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="pl-8">Luas Tanah</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m²">
                                                <ManualInput name="ktb_luas_tanah" value={formData.ktb_luas_tanah} onChange={handleChange} onBlur={handleBlur} placeholder="Input Luas Tanah" type="text" title="Input Luas Tanah untuk KTB" disabled={isReadOnly} />
                                            </InputWithUnit>
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="pl-8 italic">Luas Tapak Basemen : Luas Tanah</TableCell>
                                        <TableCell>
                                            <InputWithUnit>
                                                <ManualInput 
                                                    type="text"
                                                    name="ktb_luas_basemen_rasio"
                                                    value={formData.ktb_luas_basemen_rasio}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    placeholder="Rasio (cth: 0.5)"
                                                    title="Input Manual: Luas Tapak Basemen : Luas Tanah"
                                                    disabled={isReadOnly}
                                                />
                                            </InputWithUnit>
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="pl-8">Perbandingan Luas Tapak Basemen dengan Luas Tanah (x100%)</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="%">
                                                <ManualInput
                                                    type="text"
                                                    name="ktb_perbandingan_manual"
                                                    value={formData.ktb_perbandingan_manual}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    placeholder="cth: 50"
                                                    title="Input Manual: Perbandingan (x100%)"
                                                    disabled={isReadOnly}
                                                />
                                            </InputWithUnit>
                                        </TableCell>
                                    </tr>

                                    {/* GSB */}
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
                                                <ManualInput name="gsb_ketentuan_rtr" value={formData.gsb_ketentuan_rtr} onChange={handleChange} onBlur={handleBlur} placeholder="cth: 4" type="text" disabled={isReadOnly} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell>
                                            <SelectInput name="gsb_kesesuaian_rtr" value={formData.gsb_kesesuaian_rtr} onChange={handleChange} disabled={isReadOnly}>{dropdownSesuai}</SelectInput>
                                        </TableCell>
                                    </tr>
                                    
                                    {/* JBB */}
                                    <tr>
                                        <TableCell colSpan={5} className={blockHeaderClass}>
                                            JBB (Jarak Bebas Bangunan)
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="font-semibold pl-4" rowSpan={2}>JBB</TableCell>
                                        <TableCell className="pl-8">Jarak Bangunan (Batas Petak Belakang)</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m">
                                                <ReadOnlyInput value={dataPrefill.jbb_belakang} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell rowSpan={2} className="border-r">
                                            <InputWithUnit unit="m">
                                                <ManualInput name="jbb_ketentuan_rtr" value={formData.jbb_ketentuan_rtr} onChange={handleChange} onBlur={handleBlur} placeholder="cth: 3" type="text" disabled={isReadOnly} />
                                            </InputWithUnit>
                                        </TableCell>
                                        <TableCell rowSpan={2}>
                                            <SelectInput name="jbb_kesesuaian_rtr" value={formData.jbb_kesesuaian_rtr} onChange={handleChange} disabled={isReadOnly}>{dropdownSesuai}</SelectInput>
                                        </TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="pl-8">Jarak Bangunan (Batas Petak Samping)</TableCell>
                                        <TableCell>
                                            <InputWithUnit unit="m">
                                                <ReadOnlyInput value={dataPrefill.jbb_samping} />
                                            </InputWithUnit>
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
                                        signatureRefs={signatureRefs}
                                        memberId={member.id}
                                        isReadOnly={isReadOnly}
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
                    
                    {/* Tombol Aksi Bawah - Hanya muncul saat mode EDIT/INPUT */}
                    {!isReadOnly && (
                        <div className="flex justify-end pt-4 print:hidden no-print space-x-3">
                            {dataExists && (
                                <button 
                                    type="button"
                                    onClick={handleCancelClick}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg shadow-md"
                                >
                                    Batal
                                </button>
                            )}
                            <button 
                                type="submit" 
                                disabled={submitLoading} 
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md disabled:bg-blue-400"
                            >
                                {submitLoading ? 'Menyimpan...' : (dataExists ? 'Simpan Perubahan' : 'Simpan Formulir')}
                            </button>
                        </div>
                    )}

                </form>
            </div>
        </div>
    );
}