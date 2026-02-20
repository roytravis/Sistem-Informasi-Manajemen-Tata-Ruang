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
                .no-print, nav, button, .action-bar { display: none !important; }
                
                /* Pastikan background putih dan font hitam */
                body, .printable-area { background-color: white !important; color: black !important; font-family: 'Times New Roman', Times, serif; }
                
                /* Hilangkan shadow dan margin container */
                .printable-area { box-shadow: none !important; margin: 0 !important; padding: 0 !important; max-width: 100% !important; }
                
                /* Ubah tampilan input/select menjadi teks biasa */
                input, select, textarea { border: none !important; background: transparent !important; padding: 0 !important; appearance: none !important; font-size: 11pt !important; color: black !important; }
                
                /* Sembunyikan placeholder */
                ::placeholder { color: transparent; }

                /* Styling Tabel Cetak */
                table { width: 100% !important; border-collapse: collapse !important; }
                th, td { border: 1px solid #000 !important; padding: 4px !important; font-size: 11pt !important; }
                
                /* Page Break Control */
                fieldset { opacity: 1 !important; border: 1px solid #000 !important; margin-bottom: 10px !important; break-inside: avoid; }
                legend { font-weight: bold; }
                
                /* Tanda Tangan */
                .signature-canvas-container { display: none !important; }
                .signature-image-container { display: block !important; }
                .signature-block { border: none !important; }
                
                /* === COMPREHENSIVE COLOR & BACKGROUND OVERRIDES === */
                /* Force pure white/transparent backgrounds on ALL elements */
                .printable-area *, .printable-area input, .printable-area select, .printable-area textarea,
                .printable-area fieldset, .printable-area div, .printable-area td { 
                    background-color: transparent !important; 
                    background: transparent !important; 
                }
                
                /* Force pure black text on ALL text elements */
                .printable-area td, .printable-area th, .printable-area div,
                .printable-area p, .printable-area span, .printable-area label, .printable-area strong { 
                    color: #000 !important; 
                    font-weight: normal !important;
                }
                
                /* Exception: Keep table headers slightly gray for structure, but ensure text is black */
                .printable-area thead, .printable-area th { 
                    background-color: #f8f8f8 !important; 
                    color: #000 !important;
                    font-weight: bold !important;
                }
            }
        `}
    </style>
);

// --- KOMPONEN MODAL EDIT REQUEST ---
const ModalRequestEdit = ({ isOpen, onClose, onSubmit, loading }) => {
    const [alasan, setAlasan] = useState('');
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 px-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md animate-fade-in-up">
                <h3 className="text-xl font-bold mb-3 text-gray-800">Permohonan Edit Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Formulir ini terkunci setelah disimpan. Untuk menjaga integritas data, perubahan memerlukan persetujuan Ketua Tim.
                </p>

                <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Perubahan:</label>
                <textarea
                    className="w-full border border-gray-300 p-2 rounded mb-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    rows="3"
                    placeholder="Contoh: Terdapat kesalahan input pada luas tanah..."
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                ></textarea>

                <div className="flex justify-end gap-3 pt-2 border-t">
                    <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 font-medium transition-colors">Batal</button>
                    <button
                        onClick={() => onSubmit(alasan)}
                        disabled={!alasan.trim() || loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 font-medium transition-colors disabled:bg-blue-300 flex items-center"
                    >
                        {loading ? 'Mengirim...' : 'Kirim Permohonan'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- KOMPONEN REUSABLE FORM ---
const TableHeader = memo(({ children, colSpan = 1, rowSpan = 1 }) => (
    <th className="py-2 px-3 border border-gray-300 bg-gray-100 font-semibold align-middle" colSpan={colSpan} rowSpan={rowSpan}>
        {children}
    </th>
));

const TableCell = memo(({ children, rowSpan = 1, className = "" }) => (
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
        type={type}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={disabled ? "" : placeholder}
        title={title}
        disabled={disabled}
        className={`w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-0 focus:outline-none min-h-[38px] disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-not-allowed print:bg-transparent print:border-none print:shadow-none print:p-0 ${className}`}
    />
));

const SelectInput = memo(({ name, value, onChange, children, className = "", disabled = false }) => (
    <select
        name={name}
        value={value ?? ''}
        onChange={onChange}
        disabled={disabled}
        className={`w-full p-2 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[38px] h-auto appearance-none pr-8 disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-not-allowed print:bg-transparent print:border-none print:shadow-none print:p-0 print:appearance-none ${className}`}
    >
        {children}
    </select>
));

const InputWithUnit = memo(({ children, unit, className = "" }) => (
    <div className={`flex items-center gap-2 w-full ${className}`}>
        <div className="flex-grow">{children}</div>
        {unit && <span className="text-gray-600 w-8 flex-shrink-0 print:text-black">{unit}</span>}
    </div>
));

const sanitizeNumericValue = (value) => {
    if (typeof value !== 'string' || !value) return value ?? '';
    return value.replace(/[^0-9.,]/g, '').replace(/,/g, '.');
};

const PetugasPenilaiSignature = memo(({ member, signaturePath, signatureRefs, memberId, isReadOnly, currentUser }) => {
    const baseUrl = api.defaults.baseURL;
    const imageUrl = signaturePath ? `${baseUrl}/signatures/${signaturePath}?t=${new Date().getTime()}` : null;

    const setCanvasRef = useCallback(el => {
        if (signatureRefs) signatureRefs.current[memberId] = el;
    }, [signatureRefs, memberId]);

    // Authorization: only the assigned user can sign their own section
    const canSign = currentUser && member.id === currentUser.id;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 p-3 border rounded-md signature-block bg-white">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nama Petugas</label>
                <p className="mt-0.5 p-2 border rounded-md bg-gray-50 text-sm">{member.nama}</p>
                <label className="block text-sm font-medium text-gray-700 mt-1">Jabatan</label>
                <p className="mt-0.5 p-2 border rounded-md bg-gray-50 text-sm">{member.pivot?.jabatan_di_tim || member.role}</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Tanda Tangan:</label>
                {(imageUrl || isReadOnly) && (
                    <div className="my-1 signature-image-container">
                        {imageUrl ? (
                            <img src={imageUrl} alt={`Tanda Tangan ${member.nama}`} className="mx-auto h-20 border rounded bg-white object-contain print:border-none" crossOrigin="anonymous" />
                        ) : (
                            <div className="h-20 border rounded bg-white flex items-center justify-center text-gray-400 text-sm print:border-none">(Belum TTD)</div>
                        )}
                    </div>
                )}
                {!isReadOnly && canSign && (
                    <div className='signature-canvas-container'>
                        <div className="border border-gray-300 rounded-md bg-white">
                            <SignatureCanvas ref={setCanvasRef} penColor='black' canvasProps={{ className: 'w-full h-20' }} />
                        </div>
                        <button type="button" onClick={() => signatureRefs.current[memberId]?.clear()} className="text-sm text-blue-600 hover:underline mt-1 no-print">Ulangi</button>
                    </div>
                )}
                {!isReadOnly && !canSign && (
                    <p className="text-xs text-gray-500 italic mt-1">Hanya {member.nama} yang dapat menandatangani</p>
                )}
            </div>
        </div>
    );
});

// --- HALAMAN UTAMA ---
export default function FormulirAnalisisPage() {
    const { id: kasusId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // State Data
    const [kasus, setKasus] = useState(null);
    const [penilaian, setPenilaian] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState('');

    // State Kontrol Edit
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [dataExists, setDataExists] = useState(false);
    const [initialData, setInitialData] = useState(null);
    const [editRequest, setEditRequest] = useState(null);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestLoading, setRequestLoading] = useState(false);

    const signatureRefs = useRef({});

    // State Form
    const [formData, setFormData] = useState({
        lokasi_kesesuaian_pmp_eksisting: 'Sesuai',
        jenis_kesesuaian_pmp_eksisting: 'Sesuai',
        jenis_ketentuan_rtr: '',
        jenis_kesesuaian_rtr: 'Sesuai',
        luas_digunakan_ketentuan_rtr: '',
        luas_digunakan_kesesuaian_rtr: 'Sesuai',
        luas_dikuasai_ketentuan_rtr: '',
        luas_dikuasai_kesesuaian_rtr: 'Sesuai',
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
        ktb_luas_tanah: '', // Input Manual Luas Tanah untuk KTB
        ktb_ketentuan_rtr: '',
        ktb_kesesuaian_rtr: 'Sesuai',
        ktb_luas_basemen_rasio: '', // Auto-calculate
        ktb_perbandingan_manual: '', // Auto-calculate %
        gsb_ketentuan_rtr: '',
        gsb_kesesuaian_rtr: 'Sesuai',
        jbb_ketentuan_rtr: '',
        jbb_kesesuaian_rtr: 'Sesuai',
        tanda_tangan_tim: [],
    });

    // 1. Fetch Data Utama
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Kasus & Penilaian
                const kasusRes = await api.get(`/penilaian/pmp-umk/${kasusId}`);
                if (!kasusRes.data || !kasusRes.data.penilaian) throw new Error('Data penilaian tidak ditemukan.');

                setKasus(kasusRes.data);
                const penilaianData = kasusRes.data.penilaian;
                setPenilaian(penilaianData);

                // Fetch Status Request Edit
                let currentRequestStatus = null;
                try {
                    const reqRes = await api.get(`/edit-requests/status/${penilaianData.id}`);
                    setEditRequest(reqRes.data);
                    currentRequestStatus = reqRes.data?.status;
                } catch (e) { console.log('No edit request yet'); }

                // Fetch Formulir Analisis
                try {
                    const analisisRes = await api.get(`/formulir-analisis/${penilaianData.id}`);
                    if (analisisRes.data) {
                        const apiData = {
                            ...analisisRes.data,
                            // Ensure numeric fields are strings for inputs
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
                            luas_tanah_kesesuaian_rtr: analisisRes.data.luas_tanah_kesesuaian_rtr ?? 'Sesuai',
                            tanda_tangan_tim: (analisisRes.data.tanda_tangan_tim || []).map(sig => ({
                                user_id: sig.user_id,
                                signature: sig.signature_path
                            })),
                        };
                        setFormData(prev => ({ ...prev, ...apiData }));
                        setInitialData(apiData);
                        setDataExists(true);

                        // Logic Read Only: Kunci jika data ada, kecuali Approved
                        if (penilaianData.ba_hasil_penilaian) {
                            // LOGIKA FINAL: Override semua status edit jika sudah Final
                            setIsReadOnly(true);
                        } else if (currentRequestStatus === 'approved') {
                            setIsReadOnly(false);
                        } else {
                            // Check if all team member signatures are complete
                            // Build complete team list: Koordinator + tim.users (Ketua Tim, Petugas Lapangan)
                            const teamMembers = [];
                            if (kasusRes.data.penanggung_jawab) {
                                teamMembers.push(kasusRes.data.penanggung_jawab);
                            }
                            if (kasusRes.data.tim?.users) {
                                teamMembers.push(...kasusRes.data.tim.users);
                            }

                            const signedUserIds = (analisisRes.data.tanda_tangan_tim || []).map(sig => sig.user_id);
                            const allSignaturesComplete = teamMembers.length > 0 && teamMembers.every(member => signedUserIds.includes(member.id));

                            // Only lock if all signatures are complete
                            setIsReadOnly(allSignaturesComplete);
                        }
                    } else {
                        setIsReadOnly(false); // Mode Input Baru
                        setDataExists(false);
                    }
                } catch (err) {
                    if (err.response?.status === 404) {
                        setIsReadOnly(false);
                        setDataExists(false);
                    }
                }
            } catch (err) {
                setError(err.message || 'Gagal memuat data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [kasusId]);

    // 2. Data Prefill
    const dataPelakuUMK = useMemo(() => kasus?.pemegang ? {
        nama: kasus.pemegang.nama_pelaku_usaha,
        nomor_identitas: kasus.pemegang.nomor_identitas,
        telepon: kasus.pemegang.nomor_handphone,
        email: kasus.pemegang.email,
        alamat: [kasus.pemegang.alamat, kasus.pemegang.desa_kelurahan, kasus.pemegang.kecamatan].filter(Boolean).join(', ')
    } : {}, [kasus]);

    const dataPrefill = useMemo(() => {
        if (!penilaian || !kasus) return {};
        const pem = penilaian.pemeriksaan || [];
        const png = penilaian.pengukuran || [];
        return {
            lokasi_pmp: [kasus.pemegang?.alamat, `Lat: ${pem[5]?.pernyataan_mandiri}`, `Bujur: ${pem[6]?.pernyataan_mandiri}`].join('\n'),
            lokasi_eksisting: [pem[0]?.pernyataan_mandiri, `Lat: ${pem[5]?.pernyataan_mandiri}`, `Bujur: ${pem[6]?.pernyataan_mandiri}`].join('\n'),
            jenis_pmp: kasus.pemegang?.kegiatan,
            jenis_eksisting: pem[7]?.pernyataan_mandiri,
            luas_digunakan: png[0]?.hasil_pengukuran,
            luas_dikuasai: png[1]?.hasil_pengukuran,
            kdb_luas_lantai_dasar: png[2]?.hasil_pengukuran,
            klb_jumlah_lantai: png[3]?.hasil_pengukuran,
            klb_luas_seluruh_lantai: png[4]?.hasil_pengukuran,
            klb_ketinggian: png[5]?.hasil_pengukuran,
            kdh_vegetasi: png[6]?.hasil_pengukuran,
            kdh_perkerasan: png[7]?.hasil_pengukuran,
            ktb_luas_basemen: png[8]?.hasil_pengukuran, // Mengambil Luas Basement dari data survei
            gsb_jarak: png[9]?.hasil_pengukuran,
            jbb_belakang: png[10]?.hasil_pengukuran,
            jbb_samping: png[11]?.hasil_pengukuran,
        };
    }, [penilaian, kasus]);

    // Include ALL team members: Koordinator (penanggung_jawab) + tim.users (Ketua Tim, Petugas Lapangan)
    const timPenilai = useMemo(() => {
        if (!kasus) return [];

        const teamMembers = [];
        const koordinatorId = kasus.penanggung_jawab?.id;

        // 1. Add Koordinator Lapangan (penanggung_jawab) if exists and NOT already in tim.users
        const isKoordinatorInTeam = kasus.tim?.users?.some(u => u.id === koordinatorId);
        if (kasus.penanggung_jawab && !isKoordinatorInTeam) {
            teamMembers.push({
                ...kasus.penanggung_jawab,
                pivot: { jabatan_di_tim: 'Koordinator Lapangan' }
            });
        }

        // 2. Add all tim.users (Ketua Tim, Petugas Lapangan, etc.)
        if (kasus.tim?.users) {
            teamMembers.push(...kasus.tim.users);
        }

        // 3. Sort to ensure consistent order: Ketua Tim first, then Koordinator, then Petugas
        teamMembers.sort((a, b) => {
            const roleOrder = { 'Ketua Tim': 1, 'Koordinator Lapangan': 2, 'Petugas Lapangan': 3 };
            const roleA = a.pivot?.jabatan_di_tim || a.role || '';
            const roleB = b.pivot?.jabatan_di_tim || b.role || '';
            return (roleOrder[roleA] || 99) - (roleOrder[roleB] || 99);
        });

        return teamMembers;
    }, [kasus]);

    // 3. FITUR: AUTO-CALCULATE KDB
    useEffect(() => {
        const luasLantaiStr = dataPrefill.kdb_luas_lantai_dasar;
        const luasTanahStr = dataPrefill.luas_dikuasai;

        if (luasLantaiStr && luasTanahStr) {
            // Konversi ke float (aman untuk string '1000' atau '1000.50')
            const luasLantai = parseFloat(String(luasLantaiStr).replace(',', '.'));
            const luasTanah = parseFloat(String(luasTanahStr).replace(',', '.'));

            if (!isNaN(luasLantai) && !isNaN(luasTanah) && luasTanah > 0) {
                // Hitung Rasio dan Persentase
                const rasioVal = luasLantai / luasTanah;
                const rasioFixed = rasioVal.toFixed(3); // 3 desimal untuk presisi rasio
                const persenFixed = (rasioVal * 100).toFixed(2); // 2 desimal untuk persen

                setFormData(prev => {
                    // Cek apakah nilai berubah agar tidak loop
                    if (prev.kdb_luas_lantai_dasar_rasio === rasioFixed && prev.kdb_perbandingan_manual === persenFixed) {
                        return prev;
                    }
                    return {
                        ...prev,
                        kdb_luas_lantai_dasar_rasio: rasioFixed,
                        kdb_perbandingan_manual: persenFixed
                    };
                });
            }
        }
    }, [dataPrefill.kdb_luas_lantai_dasar, dataPrefill.luas_dikuasai]);

    // 4. FITUR: AUTO-CALCULATE KLB (Baru)
    useEffect(() => {
        const luasSeluruhLantaiStr = dataPrefill.klb_luas_seluruh_lantai; // Data dari survey
        const luasTanahKLBStr = formData.klb_luas_tanah; // Input manual user

        if (luasSeluruhLantaiStr && luasTanahKLBStr) {
            // Bersihkan string dan konversi ke float
            const luasLantai = parseFloat(String(luasSeluruhLantaiStr).replace(',', '.'));
            const luasTanah = parseFloat(String(luasTanahKLBStr).replace(',', '.'));

            if (!isNaN(luasLantai) && !isNaN(luasTanah) && luasTanah > 0) {
                // Rasio KLB = Luas Seluruh Lantai Bangunan / Luas Tanah
                const rasioVal = luasLantai / luasTanah;
                const rasioFixed = rasioVal.toFixed(3); // 3 desimal untuk konsistensi

                setFormData(prev => {
                    if (prev.klb_luas_seluruh_lantai_rasio === rasioFixed) return prev;
                    return {
                        ...prev,
                        klb_luas_seluruh_lantai_rasio: rasioFixed
                    };
                });
            } else {
                // Reset jika input tidak valid
                setFormData(prev => {
                    if (prev.klb_luas_seluruh_lantai_rasio === '') return prev;
                    return { ...prev, klb_luas_seluruh_lantai_rasio: '' };
                });
            }
        }
    }, [dataPrefill.klb_luas_seluruh_lantai, formData.klb_luas_tanah]);

    // 5. FITUR: AUTO-CALCULATE KTB (Koefisien Tapak Basement)
    useEffect(() => {
        const luasBasemenStr = dataPrefill.ktb_luas_basemen; // Dari Survei
        const luasTanahKTBStr = formData.ktb_luas_tanah; // Input Manual atau Reuse

        if (luasBasemenStr && luasTanahKTBStr) {
            const luasBasemen = parseFloat(String(luasBasemenStr).replace(',', '.'));
            const luasTanah = parseFloat(String(luasTanahKTBStr).replace(',', '.'));

            if (!isNaN(luasBasemen) && !isNaN(luasTanah) && luasTanah > 0) {
                // KTB = Luas Basement / Luas Tanah
                const rasioVal = luasBasemen / luasTanah;
                const rasioFixed = rasioVal.toFixed(3);
                const persenFixed = (rasioVal * 100).toFixed(2);

                setFormData(prev => {
                    if (prev.ktb_luas_basemen_rasio === rasioFixed && prev.ktb_perbandingan_manual === persenFixed) {
                        return prev;
                    }
                    return {
                        ...prev,
                        ktb_luas_basemen_rasio: rasioFixed,
                        ktb_perbandingan_manual: persenFixed
                    };
                });
            } else {
                setFormData(prev => {
                    if (prev.ktb_luas_basemen_rasio === '' && prev.ktb_perbandingan_manual === '') return prev;
                    return { ...prev, ktb_luas_basemen_rasio: '', ktb_perbandingan_manual: '' };
                });
            }
        }
    }, [dataPrefill.ktb_luas_basemen, formData.ktb_luas_tanah]);

    // 6. FITUR: AUTO-CALCULATE KDH (Koefisien Daerah Hijau)
    useEffect(() => {
        const luasVegetasiStr = dataPrefill.kdh_vegetasi; // Dari Survei (Luas Tanah Bervegetasi)
        const luasPerkerasanStr = dataPrefill.kdh_perkerasan; // Dari Survei (Luas Tanah Perkerasan)
        const luasTanahKDHStr = formData.kdh_luas_tanah; // Input Manual

        if (luasVegetasiStr && luasTanahKDHStr) {
            const luasVegetasi = parseFloat(String(luasVegetasiStr).replace(',', '.'));
            const luasPerkerasan = parseFloat(String(luasPerkerasanStr || '0').replace(',', '.')); // Optional, default 0
            const luasTanah = parseFloat(String(luasTanahKDHStr).replace(',', '.'));

            if (!isNaN(luasVegetasi) && !isNaN(luasTanah) && luasTanah > 0) {
                // 1. Hitung Rasio KDH
                // Rumus: (Luas Tanah Vegetasi + Luas Tanah Perkerasan) / Luas Tanah
                const rasioVal = (luasVegetasi + (isNaN(luasPerkerasan) ? 0 : luasPerkerasan)) / luasTanah;
                const rasioFixed = rasioVal.toFixed(3);

                // 2. Hitung Persentase KDH
                // Rumus: (Luas Tanah Vegetasi / Luas Tanah) * 100%
                const persenVal = (luasVegetasi / luasTanah) * 100;
                const persenFixed = persenVal.toFixed(2);

                setFormData(prev => {
                    // Prevent infinite loop if values are same
                    if (prev.kdh_rasio_manual === rasioFixed && prev.kdh_perbandingan_manual === persenFixed) {
                        return prev;
                    }
                    return {
                        ...prev,
                        kdh_rasio_manual: rasioFixed,
                        kdh_perbandingan_manual: persenFixed
                    };
                });
            } else {
                // Reset jika input invalid
                setFormData(prev => {
                    if (prev.kdh_rasio_manual === '' && prev.kdh_perbandingan_manual === '') return prev;
                    return { ...prev, kdh_rasio_manual: '', kdh_perbandingan_manual: '' };
                });
            }
        }
    }, [dataPrefill.kdh_vegetasi, dataPrefill.kdh_perkerasan, formData.kdh_luas_tanah]);

    // 7. Handlers
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleRequestEdit = (alasan) => {
        setRequestLoading(true);
        api.post('/edit-requests', { penilaian_id: penilaian.id, alasan })
            .then(res => {
                setEditRequest(res.data);
                setShowRequestModal(false);
                alert('Permohonan edit berhasil dikirim ke Ketua Tim.');
            })
            .catch(err => alert(err.response?.data?.message || 'Gagal mengirim permohonan.'))
            .finally(() => setRequestLoading(false));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);

        const sanitizedFormData = { ...formData };
        ['luas_tanah', 'ketentuan_rtr', 'manual'].forEach(k => {
            Object.keys(sanitizedFormData).forEach(key => {
                if (key.includes(k) && key !== 'jenis_ketentuan_rtr') {
                    sanitizedFormData[key] = sanitizeNumericValue(sanitizedFormData[key]);
                }
            });
        });

        // Proses TTD
        const signatureData = [];
        timPenilai.forEach(member => {
            const sigCanvas = signatureRefs.current[member.id];
            const existingSig = formData.tanda_tangan_tim.find(s => s.user_id === member.id);
            if (sigCanvas && !sigCanvas.isEmpty()) {
                signatureData.push({ user_id: member.id, signature: sigCanvas.toDataURL() });
            } else if (existingSig) {
                signatureData.push({ user_id: member.id, signature: existingSig.signature });
            }
        });

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
            const response = await api.post(`/formulir-analisis/${penilaian.id}`, payload);
            alert('Formulir berhasil disimpan!');

            // Update state dengan data terbaru dari server (termasuk path tanda tangan yang baru digenerate)
            const updatedData = response.data;
            const newFormData = {
                ...formData,
                // Pastikan mapping field sesuai dengan format yang diharapkan komponen
                tanda_tangan_tim: (updatedData.tanda_tangan_tim || []).map(sig => ({
                    user_id: sig.user_id,
                    signature: sig.signature_path // Backend mengembalikan 'signature_path', frontend butuh 'signature'
                })),
                // Update numeric fields agar konsisten (prevent dirty state detection issues)
                kdb_ketentuan_rtr: String(updatedData.kdb_ketentuan_rtr ?? ''),
                klb_ketentuan_rtr: String(updatedData.klb_ketentuan_rtr ?? ''),
                kdh_ketentuan_rtr: String(updatedData.kdh_ketentuan_rtr ?? ''),
                ktb_ketentuan_rtr: String(updatedData.ktb_ketentuan_rtr ?? ''),
                gsb_ketentuan_rtr: String(updatedData.gsb_ketentuan_rtr ?? ''),
                jbb_ketentuan_rtr: String(updatedData.jbb_ketentuan_rtr ?? ''),
                ketinggian_ketentuan_rtr: String(updatedData.ketinggian_ketentuan_rtr ?? ''),
                luas_digunakan_ketentuan_rtr: String(updatedData.luas_digunakan_ketentuan_rtr ?? ''),
                luas_dikuasai_ketentuan_rtr: String(updatedData.luas_dikuasai_ketentuan_rtr ?? ''),
                klb_luas_tanah: String(updatedData.klb_luas_tanah ?? ''),
                kdh_luas_tanah: String(updatedData.kdh_luas_tanah ?? ''),
                ktb_luas_tanah: String(updatedData.ktb_luas_tanah ?? ''),
            };

            setFormData(newFormData);
            setInitialData(newFormData);

            setDataExists(true);
            setIsReadOnly(true);
            setEditRequest(prev => ({ ...prev, status: 'completed' }));

            // Clear canvas refs to prevent double submission issues visually
            Object.values(signatureRefs.current).forEach(ref => ref?.clear());

            window.scrollTo(0, 0);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan.');
        } finally {
            setSubmitLoading(false);
        }
    };

    // 8. Render Helper
    const renderEditButton = () => {
        if (!dataExists || !user || !['Admin', 'Koordinator Lapangan', 'Ketua Tim', 'Petugas Lapangan'].includes(user.role)) return null;
        // CHECK FINAL: Jangan render tombol edit jika sudah final
        if (penilaian?.ba_hasil_penilaian) return null;

        const status = editRequest?.status;

        if (status === 'pending') {
            return (
                <button disabled className="bg-orange-100 text-orange-700 font-bold py-2 px-4 rounded-lg text-sm shadow-sm border border-orange-300 flex items-center cursor-not-allowed">
                    Menunggu Persetujuan
                </button>
            );
        }
        if (status === 'approved') {
            return (
                <span className="bg-green-100 text-green-800 font-bold py-2 px-4 rounded-lg text-sm border border-green-300 flex items-center">
                    Mode Edit Aktif
                </span>
            );
        }
        if (status === 'rejected') {
            return (
                <div className="flex items-center gap-2">
                    <span className="text-red-600 font-semibold text-xs bg-red-50 px-2 py-1 rounded border border-red-200">Ditolak</span>
                    <button onClick={() => setShowRequestModal(true)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md transition-colors">Ajukan Lagi</button>
                </div>
            );
        }
        if (isReadOnly) {
            return (
                <button onClick={() => setShowRequestModal(true)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md flex items-center transition-colors">
                    Ajukan Edit
                </button>
            );
        }
        return null;
    };

    const dropdownSesuai = <><option value="">Pilih...</option><option value="Sesuai">Sesuai</option><option value="Tidak Sesuai">Tidak Sesuai</option></>;
    const blockHeaderClass = "bg-gray-100 font-semibold p-2 border-t-2 border-b border-gray-300 print:bg-gray-200 print:border-black";

    if (loading) return <div className="text-center py-10">Memuat Formulir Analisis...</div>;
    if (error) return <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>;

    return (
        <div className="bg-gray-100 min-h-screen pb-10">
            <PrintStyles />
            <ModalRequestEdit isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} onSubmit={handleRequestEdit} loading={requestLoading} />

            <div className="mb-6 flex justify-between items-center no-print px-4 py-3 bg-white shadow-sm sm:px-6 lg:px-8 sticky top-16 z-40">
                <Link to="/penilaian" className="text-blue-600 hover:underline flex items-center"><span className="mr-1">&larr;</span> Dashboard</Link>
                <div className="flex space-x-3 items-center">
                    {dataExists && <button onClick={() => window.print()} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md">Print PDF</button>}
                    {renderEditButton()}
                </div>
            </div>

            {editRequest?.status === 'rejected' && (
                <div className="max-w-6xl mx-auto mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow no-print">
                    <p className="font-bold">Permohonan Edit Ditolak</p>
                    <p className="text-sm">Alasan: "{editRequest.alasan_penolakan}"</p>
                </div>
            )}

            <div className="printable-area max-w-6xl mx-auto bg-white rounded-lg shadow-lg mb-8">
                {!isReadOnly && dataExists && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 no-print">
                        <p className="text-blue-700 text-sm font-medium">Anda sedang dalam mode edit. Silakan lakukan perubahan dan simpan.</p>
                    </div>
                )}

                {isReadOnly && dataExists && (
                    <div className={`border-l-4 p-4 mb-6 print:hidden no-print ${penilaian?.ba_hasil_penilaian ? 'bg-green-100 border-green-500 text-green-700' : 'bg-blue-100 border-blue-500 text-blue-700'}`} role="alert">
                        <p className="font-bold">{penilaian?.ba_hasil_penilaian ? 'Status Final' : 'Mode Tampilan (Read Only)'}</p>
                        <p>{penilaian?.ba_hasil_penilaian
                            ? 'Penilaian telah selesai (Final). Data tidak dapat diubah lagi.'
                            : "Formulir ini terkunci. Klik tombol 'Ajukan Edit' untuk mengubah data."}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                    <div className="text-center pt-2">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800">FORMULIR ANALISIS PENILAIAN</h2>
                        <p className="text-gray-600">Pernyataan Mandiri Pelaku Usaha Mikro dan Kecil (UMK)</p>
                    </div>

                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-lg font-semibold px-2">A. Data Pelaku UMK</legend>
                        <div className="mt-2 text-sm p-2 space-y-2">
                            <div className="flex">
                                <span className="w-8 text-right mr-4">1</span>
                                <div className="w-40 font-medium text-gray-700">Nama Pelaku Usaha</div>
                                <div className="mr-2">:</div>
                                <div className="flex-1">{dataPelakuUMK.nama || '-'}</div>
                            </div>
                            <div className="flex">
                                <span className="w-8 text-right mr-4">2</span>
                                <div className="w-40 font-medium text-gray-700">Nomor Induk Berusaha(NIB)</div>
                                <div className="mr-2">:</div>
                                <div className="flex-1">{dataPelakuUMK.nomor_identitas || '-'}</div>
                            </div>
                            <div className="flex">
                                <span className="w-8 text-right mr-4">3</span>
                                <div className="w-40 font-medium text-gray-700">Nomor Telepon</div>
                                <div className="mr-2">:</div>
                                <div className="flex-1">{dataPelakuUMK.telepon || '-'}</div>
                            </div>
                            <div className="flex">
                                <span className="w-8 text-right mr-4">4</span>
                                <div className="w-40 font-medium text-gray-700">Email</div>
                                <div className="mr-2">:</div>
                                <div className="flex-1">{dataPelakuUMK.email || '-'}</div>
                            </div>
                            <div className="flex">
                                <span className="w-8 text-right mr-4">5</span>
                                <div className="w-40 font-medium text-gray-700">Alamat</div>
                                <div className="mr-2">:</div>
                                <div className="flex-1">{dataPelakuUMK.alamat || '-'}</div>
                            </div>
                        </div>
                    </fieldset>

                    {/* B. Pemeriksaan */}
                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-lg font-semibold px-2">B. Pemeriksaan</legend>
                        <div className="overflow-x-auto mt-2">
                            <h4 className="font-semibold mb-2 text-sm">1) Pemeriksaan Lokasi Usaha</h4>
                            <table className="min-w-full text-sm table-auto border-collapse mb-6">
                                <thead>
                                    <tr><TableHeader>Berdasarkan PMP</TableHeader><TableHeader>Berdasarkan Eksisting</TableHeader><TableHeader>Hasil Kesesuaian</TableHeader></tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <TableCell><ReadOnlyInput value={dataPrefill.lokasi_pmp} className="whitespace-pre-wrap" /></TableCell>
                                        <TableCell><ReadOnlyInput value={dataPrefill.lokasi_eksisting} className="whitespace-pre-wrap" /></TableCell>
                                        <TableCell><SelectInput name="lokasi_kesesuaian_pmp_eksisting" value={formData.lokasi_kesesuaian_pmp_eksisting} onChange={handleChange} disabled={isReadOnly}>{dropdownSesuai}</SelectInput></TableCell>
                                    </tr>
                                </tbody>
                            </table>

                            <h4 className="font-semibold mb-2 text-sm">2) Pemeriksaan Jenis Kegiatan</h4>
                            <table className="min-w-full text-sm table-auto border-collapse">
                                <thead>
                                    <tr><TableHeader>Berdasarkan PMP</TableHeader><TableHeader>Berdasarkan Eksisting</TableHeader><TableHeader>Kesesuaian</TableHeader><TableHeader>Ketentuan RTR</TableHeader><TableHeader>Kesesuaian RTR</TableHeader></tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <TableCell><ReadOnlyInput value={dataPrefill.jenis_pmp} /></TableCell>
                                        <TableCell><ReadOnlyInput value={dataPrefill.jenis_eksisting} /></TableCell>
                                        <TableCell><SelectInput name="jenis_kesesuaian_pmp_eksisting" value={formData.jenis_kesesuaian_pmp_eksisting} onChange={handleChange} disabled={isReadOnly}>{dropdownSesuai}</SelectInput></TableCell>
                                        <TableCell><ManualInput name="jenis_ketentuan_rtr" value={formData.jenis_ketentuan_rtr} onChange={handleChange} disabled={isReadOnly} placeholder="Input Ketentuan RTR" /></TableCell>
                                        <TableCell><SelectInput name="jenis_kesesuaian_rtr" value={formData.jenis_kesesuaian_rtr} onChange={handleChange} disabled={isReadOnly}>{dropdownSesuai}</SelectInput></TableCell>
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
                                <colgroup><col className="w-[25%]" /><col className="w-[20%]" /><col className="w-[18%]" /><col className="w-[12%]" /><col className="w-[25%]" /></colgroup>
                                <thead>
                                    <tr><TableHeader colSpan={2}>Komponen</TableHeader><TableHeader>Hasil Pemeriksaan</TableHeader><TableHeader>Ketentuan RTR</TableHeader><TableHeader>Kesesuaian</TableHeader></tr>
                                </thead>
                                <tbody>
                                    {/* Luas Tanah */}
                                    <tr><TableCell colSpan={5} className={blockHeaderClass}>Luas Tanah</TableCell></tr>
                                    <tr>
                                        <TableCell className="font-semibold pl-4" rowSpan={2}>Luas Tanah</TableCell>
                                        <TableCell className="pl-8">Digunakan</TableCell>
                                        <TableCell><InputWithUnit unit="m²"><ReadOnlyInput value={dataPrefill.luas_digunakan} /></InputWithUnit></TableCell>
                                        <TableCell rowSpan={2} className="border-r"><ReadOnlyInput value="" /></TableCell>
                                        <TableCell rowSpan={2}><SelectInput name="luas_tanah_kesesuaian_rtr" value={formData.luas_tanah_kesesuaian_rtr} onChange={handleChange} disabled={isReadOnly}>{dropdownSesuai}</SelectInput></TableCell>
                                    </tr>
                                    <tr><TableCell className="pl-8">Dikuasai</TableCell><TableCell><InputWithUnit unit="m²"><ReadOnlyInput value={dataPrefill.luas_dikuasai} /></InputWithUnit></TableCell></tr>

                                    {/* KDB */}
                                    <tr><TableCell colSpan={5} className={blockHeaderClass}>KDB</TableCell></tr>
                                    <tr>
                                        <TableCell className="font-semibold pl-4" rowSpan={4}>KDB</TableCell>
                                        <TableCell className="pl-8">Luas Lantai Dasar</TableCell>
                                        <TableCell><InputWithUnit unit="m²"><ReadOnlyInput value={dataPrefill.kdb_luas_lantai_dasar} /></InputWithUnit></TableCell>
                                        <TableCell rowSpan={4}><InputWithUnit unit="%"><ManualInput name="kdb_ketentuan_rtr" value={formData.kdb_ketentuan_rtr} onChange={handleChange} disabled={isReadOnly} /></InputWithUnit></TableCell>
                                        <TableCell rowSpan={4}><SelectInput name="kdb_kesesuaian_rtr" value={formData.kdb_kesesuaian_rtr} onChange={handleChange} disabled={isReadOnly}>{dropdownSesuai}</SelectInput></TableCell>
                                    </tr>
                                    <tr><TableCell className="pl-8">Luas Tanah</TableCell><TableCell><InputWithUnit unit="m²"><ReadOnlyInput value={dataPrefill.luas_dikuasai} /></InputWithUnit></TableCell></tr>
                                    <tr><TableCell className="pl-8 italic">Rasio</TableCell><TableCell><ReadOnlyInput value={formData.kdb_luas_lantai_dasar_rasio} /></TableCell></tr>
                                    <tr><TableCell className="pl-8">Persentase</TableCell><TableCell><InputWithUnit unit="%"><ReadOnlyInput value={formData.kdb_perbandingan_manual} /></InputWithUnit></TableCell></tr>

                                    {/* KLB */}
                                    <tr><TableCell colSpan={5} className={blockHeaderClass}>KLB</TableCell></tr>
                                    <tr>
                                        <TableCell className="font-semibold pl-4" rowSpan={4}>KLB</TableCell>
                                        <TableCell className="pl-8">Jml Lantai</TableCell>
                                        <TableCell><InputWithUnit unit="Lt"><ReadOnlyInput value={dataPrefill.klb_jumlah_lantai} /></InputWithUnit></TableCell>
                                        <TableCell rowSpan={4}><InputWithUnit><ManualInput name="klb_ketentuan_rtr" value={formData.klb_ketentuan_rtr} onChange={handleChange} disabled={isReadOnly} /></InputWithUnit></TableCell>
                                        <TableCell rowSpan={4}><SelectInput name="klb_kesesuaian_rtr" value={formData.klb_kesesuaian_rtr} onChange={handleChange} disabled={isReadOnly}>{dropdownSesuai}</SelectInput></TableCell>
                                    </tr>
                                    <tr><TableCell className="pl-8">Luas Seluruh Lantai</TableCell><TableCell><InputWithUnit unit="m²"><ReadOnlyInput value={dataPrefill.klb_luas_seluruh_lantai} /></InputWithUnit></TableCell></tr>
                                    <tr><TableCell className="pl-8">Luas Tanah</TableCell><TableCell><InputWithUnit unit="m²"><ManualInput name="klb_luas_tanah" value={formData.klb_luas_tanah} onChange={handleChange} disabled={isReadOnly} placeholder="Input Luas Tanah" /></InputWithUnit></TableCell></tr>
                                    <tr><TableCell className="pl-8 italic">Rasio</TableCell><TableCell><ReadOnlyInput value={formData.klb_luas_seluruh_lantai_rasio} /></TableCell></tr>

                                    {/* Ketinggian */}
                                    <tr><TableCell colSpan={5} className={blockHeaderClass}>Ketinggian Bangunan</TableCell></tr>
                                    <tr>
                                        <TableCell className="font-semibold pl-4">Tinggi</TableCell>
                                        <TableCell className="pl-8">Ketinggian Bangunan</TableCell>
                                        {/* Menggunakan data Ketinggian Bangunan yang sudah tersedia dari survei */}
                                        <TableCell><InputWithUnit unit="m"><ReadOnlyInput value={dataPrefill.klb_ketinggian} /></InputWithUnit></TableCell>
                                        <TableCell><InputWithUnit unit="m"><ManualInput name="ketinggian_ketentuan_rtr" value={formData.ketinggian_ketentuan_rtr} onChange={handleChange} disabled={isReadOnly} /></InputWithUnit></TableCell>
                                        <TableCell><SelectInput name="ketinggian_kesesuaian_rtr" value={formData.ketinggian_kesesuaian_rtr} onChange={handleChange} disabled={isReadOnly}>{dropdownSesuai}</SelectInput></TableCell>
                                    </tr>

                                    {/* KDH */}
                                    <tr><TableCell colSpan={5} className={blockHeaderClass}>KDH</TableCell></tr>
                                    <tr>
                                        <TableCell className="font-semibold pl-4" rowSpan={5}>KDH</TableCell>
                                        <TableCell className="pl-8">Luas Tanah Vegetasi</TableCell>
                                        <TableCell><InputWithUnit unit="m²"><ReadOnlyInput value={dataPrefill.kdh_vegetasi} /></InputWithUnit></TableCell>
                                        <TableCell rowSpan={5}><InputWithUnit unit="%"><ManualInput name="kdh_ketentuan_rtr" value={formData.kdh_ketentuan_rtr} onChange={handleChange} disabled={isReadOnly} /></InputWithUnit></TableCell>
                                        <TableCell rowSpan={5}><SelectInput name="kdh_kesesuaian_rtr" value={formData.kdh_kesesuaian_rtr} onChange={handleChange} disabled={isReadOnly}>{dropdownSesuai}</SelectInput></TableCell>
                                    </tr>
                                    <tr><TableCell className="pl-8">Luas Perkerasan</TableCell><TableCell><InputWithUnit unit="m²"><ReadOnlyInput value={dataPrefill.kdh_perkerasan} /></InputWithUnit></TableCell></tr>
                                    <tr><TableCell className="pl-8">Luas Tanah</TableCell><TableCell><InputWithUnit unit="m²"><ManualInput name="kdh_luas_tanah" value={formData.kdh_luas_tanah} onChange={handleChange} disabled={isReadOnly} placeholder="Input Luas Tanah" /></InputWithUnit></TableCell></tr>
                                    <tr><TableCell className="pl-8 italic">Rasio</TableCell><TableCell><ReadOnlyInput value={formData.kdh_rasio_manual} /></TableCell></tr>
                                    <tr><TableCell className="pl-8">Persentase</TableCell><TableCell><InputWithUnit unit="%"><ReadOnlyInput value={formData.kdh_perbandingan_manual} /></InputWithUnit></TableCell></tr>

                                    {/* KTB (Koefisien Tapak Basement) - BARU */}
                                    <tr><TableCell colSpan={5} className={blockHeaderClass}>KTB (Koefisien Tapak Basemen)</TableCell></tr>
                                    <tr>
                                        <TableCell className="font-semibold pl-4" rowSpan={4}>KTB</TableCell>
                                        <TableCell className="pl-8">Luas Basemen</TableCell>
                                        {/* Data Luas Basement diambil dari survei */}
                                        <TableCell><InputWithUnit unit="m²"><ReadOnlyInput value={dataPrefill.ktb_luas_basemen} /></InputWithUnit></TableCell>
                                        <TableCell rowSpan={4}><InputWithUnit unit="%"><ManualInput name="ktb_ketentuan_rtr" value={formData.ktb_ketentuan_rtr} onChange={handleChange} disabled={isReadOnly} /></InputWithUnit></TableCell>
                                        <TableCell rowSpan={4}><SelectInput name="ktb_kesesuaian_rtr" value={formData.ktb_kesesuaian_rtr} onChange={handleChange} disabled={isReadOnly}>{dropdownSesuai}</SelectInput></TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="pl-8">Luas Tanah</TableCell>
                                        <TableCell><InputWithUnit unit="m²"><ManualInput name="ktb_luas_tanah" value={formData.ktb_luas_tanah} onChange={handleChange} disabled={isReadOnly} placeholder="Input Luas Tanah" /></InputWithUnit></TableCell>
                                    </tr>
                                    <tr><TableCell className="pl-8 italic">Rasio</TableCell><TableCell><ReadOnlyInput value={formData.ktb_luas_basemen_rasio} /></TableCell></tr>
                                    <tr><TableCell className="pl-8">Persentase</TableCell><TableCell><InputWithUnit unit="%"><ReadOnlyInput value={formData.ktb_perbandingan_manual} /></InputWithUnit></TableCell></tr>

                                    {/* GSB & JBB */}
                                    <tr><TableCell colSpan={5} className={blockHeaderClass}>GSB & JBB</TableCell></tr>
                                    <tr>
                                        <TableCell className="font-semibold pl-4">GSB</TableCell>
                                        <TableCell className="pl-8">Depan</TableCell>
                                        <TableCell><InputWithUnit unit="m"><ReadOnlyInput value={dataPrefill.gsb_jarak} /></InputWithUnit></TableCell>
                                        <TableCell><InputWithUnit unit="m"><ManualInput name="gsb_ketentuan_rtr" value={formData.gsb_ketentuan_rtr} onChange={handleChange} disabled={isReadOnly} /></InputWithUnit></TableCell>
                                        <TableCell><SelectInput name="gsb_kesesuaian_rtr" value={formData.gsb_kesesuaian_rtr} onChange={handleChange} disabled={isReadOnly}>{dropdownSesuai}</SelectInput></TableCell>
                                    </tr>
                                    <tr>
                                        <TableCell className="font-semibold pl-4" rowSpan={2}>JBB</TableCell>
                                        <TableCell className="pl-8">Belakang</TableCell>
                                        <TableCell><InputWithUnit unit="m"><ReadOnlyInput value={dataPrefill.jbb_belakang} /></InputWithUnit></TableCell>
                                        <TableCell rowSpan={2}><InputWithUnit unit="m"><ManualInput name="jbb_ketentuan_rtr" value={formData.jbb_ketentuan_rtr} onChange={handleChange} disabled={isReadOnly} /></InputWithUnit></TableCell>
                                        <TableCell rowSpan={2}><SelectInput name="jbb_kesesuaian_rtr" value={formData.jbb_kesesuaian_rtr} onChange={handleChange} disabled={isReadOnly}>{dropdownSesuai}</SelectInput></TableCell>
                                    </tr>
                                    <tr><TableCell className="pl-8">Samping</TableCell><TableCell><InputWithUnit unit="m"><ReadOnlyInput value={dataPrefill.jbb_samping} /></InputWithUnit></TableCell></tr>
                                </tbody>
                            </table>
                        </div>
                    </fieldset>

                    {/* D. Tanda Tangan */}
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
                                        currentUser={user}
                                    />
                                ))
                            ) : <p className="text-gray-500 text-sm">Tim penilai tidak ditemukan.</p>}
                        </div>
                    </fieldset>

                    {/* Tombol Simpan */}
                    {!isReadOnly && (
                        <div className="flex justify-end pt-4 border-t no-print">
                            <button
                                type="submit"
                                disabled={submitLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg shadow-lg disabled:bg-blue-300 transition-all transform hover:scale-105"
                            >
                                {submitLoading ? 'Menyimpan...' : (dataExists ? 'Simpan Perubahan' : 'Simpan Data')}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}