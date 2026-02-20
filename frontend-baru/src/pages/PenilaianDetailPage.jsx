import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios.js';
import SignatureCanvas from 'react-signature-canvas';
import { useAuth } from '../context/AuthContext.jsx';

// --- KOMPONEN MODAL REQUEST EDIT ---
const ModalRequestEdit = ({ isOpen, onClose, onSubmit, loading }) => {
    const [alasan, setAlasan] = useState('');
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 px-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md animate-fade-in-up">
                <h3 className="text-xl font-bold mb-3 text-gray-800">Permohonan Edit Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Formulir ini terkunci. Untuk melakukan perubahan data yang sudah tersimpan,
                    Anda perlu mengajukan permohonan kepada Ketua Tim.
                </p>

                <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Perubahan:</label>
                <textarea
                    className="w-full border border-gray-300 p-2 rounded mb-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    rows="3"
                    placeholder="Contoh: Koreksi salah ketik pada luas tanah..."
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

// --- Komponen-komponen Reusable ---

const DeskStudyRow = ({ index, data, onChange, errors, isReadOnly }) => {
    const hasError = (field) => errors && errors[`desk_study.${index}.${field}`];
    const disabledClasses = isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300';
    const arahanValue = data.ketentuan_rtr_arahan || '';

    return (
        <tr className="border-b">
            <td className="p-2 align-top">
                <textarea
                    name={`desk_study.${index}.pernyataan_mandiri_lokasi`}
                    value={data.pernyataan_mandiri_lokasi || ''}
                    onChange={onChange}
                    className={`w-full border rounded-md p-1 text-sm ${hasError('pernyataan_mandiri_lokasi') ? 'border-red-500 ring-1 ring-red-500' : disabledClasses} print:hidden`}
                    rows="3"
                    placeholder="Alamat & Koordinat"
                    disabled={isReadOnly}
                ></textarea>
                <div className={`hidden print:block whitespace-pre-wrap break-words text-sm print-text-block`}>
                    {data.pernyataan_mandiri_lokasi || ''}
                </div>
            </td>
            <td className="p-2 align-top">
                <textarea
                    name={`desk_study.${index}.pernyataan_mandiri_jenis`}
                    value={data.pernyataan_mandiri_jenis || ''}
                    onChange={onChange}
                    className={`w-full border rounded-md p-1 text-sm ${hasError('pernyataan_mandiri_jenis') ? 'border-red-500 ring-1 ring-red-500' : disabledClasses} print:hidden`}
                    rows="3"
                    placeholder="Jenis Kegiatan"
                    disabled={isReadOnly}
                ></textarea>
                <div className={`hidden print:block whitespace-pre-wrap break-words text-sm print-text-block`}>
                    {data.pernyataan_mandiri_jenis || ''}
                </div>
            </td>
            <td className="p-2 align-top">
                <textarea
                    name={`desk_study.${index}.ketentuan_rtr_jenis`}
                    value={data.ketentuan_rtr_jenis || ''}
                    onChange={onChange}
                    className={`w-full border rounded-md p-1 text-sm ${hasError('ketentuan_rtr_jenis') ? 'border-red-500 ring-1 ring-red-500' : disabledClasses} print:hidden`}
                    rows="3"
                    placeholder="Zona Kawasan"
                    disabled={isReadOnly}
                ></textarea>
                <div className={`hidden print:block whitespace-pre-wrap break-words text-sm print-text-block`}>
                    {data.ketentuan_rtr_jenis || ''}
                </div>
            </td>
            <td className="p-2 align-top">
                <textarea
                    name={`desk_study.${index}.ketentuan_rtr_arahan`}
                    value={arahanValue}
                    onChange={onChange}
                    className={`w-full border rounded-md p-1 text-sm ${hasError('ketentuan_rtr_arahan') ? 'border-red-500 ring-1 ring-red-500' : disabledClasses} print:hidden`}
                    rows="3"
                    placeholder="Arahan Pemanfaatan"
                    disabled={isReadOnly}
                ></textarea>
                <div className={`hidden print:block whitespace-pre-wrap break-words text-sm print-text-block`}>
                    {arahanValue}
                </div>
            </td>
            <td className="p-2 align-top">
                <select
                    name={`desk_study.${index}.hasil_kesesuaian`}
                    value={data.hasil_kesesuaian || 'Sesuai'}
                    onChange={onChange}
                    className={`w-full border rounded-md p-1 text-sm ${disabledClasses} ${isReadOnly ? 'appearance-none' : ''} print:hidden`}
                    disabled={isReadOnly}
                >
                    <option value="Sesuai">Sesuai</option>
                    <option value="Tidak Sesuai">Tidak Sesuai</option>
                </select>
                <div className={`hidden print:block text-sm print-text-block`}>
                    {data.hasil_kesesuaian || 'Sesuai'}
                </div>
            </td>
        </tr>
    );
};

const PemeriksaanRow = ({ no, komponen, subKomponen, data, index, onChange, errors, isReadOnly }) => {
    const hasError = (field) => errors && errors[`pemeriksaan.${index}.${field}`];
    const disabledClasses = isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300';

    return (
        <tr className="border-b">
            {no && <td className="p-2 align-top text-center" rowSpan={komponen.rowSpan}>{no}</td>}
            {komponen.label && <td className="p-2 align-top font-medium text-gray-700" rowSpan={komponen.rowSpan}>{komponen.label}</td>}
            <td className="p-2 align-top pl-4 text-gray-600">{subKomponen}</td>
            <td className="p-2 align-top">
                <input
                    type="text"
                    name={`pemeriksaan.${index}.pernyataan_mandiri`}
                    value={data.pernyataan_mandiri || ''}
                    onChange={onChange}
                    className={`w-full border rounded-md p-1 text-sm ${hasError('pernyataan_mandiri') ? 'border-red-500 ring-1 ring-red-500' : disabledClasses} print:hidden`}
                    disabled={isReadOnly}
                />
                <div className={`hidden print:block whitespace-pre-wrap break-words text-sm print-text-block`}>
                    {data.pernyataan_mandiri || ''}
                </div>
            </td>
            <td className="p-2 align-top">
                <select
                    name={`pemeriksaan.${index}.hasil_pemeriksaan`}
                    value={data.hasil_pemeriksaan || 'Sesuai'}
                    onChange={onChange}
                    className={`w-full border rounded-md p-1 text-sm ${hasError('hasil_pemeriksaan') ? 'border-red-500 ring-1 ring-red-500' : disabledClasses} ${isReadOnly ? 'appearance-none' : ''} print:hidden`}
                    disabled={isReadOnly}
                >
                    <option value="Sesuai">Sesuai</option>
                    <option value="Tidak Sesuai">Tidak Sesuai</option>
                </select>
                <div className={`hidden print:block text-sm print-text-block`}>
                    {data.hasil_pemeriksaan || 'Sesuai'}
                </div>
            </td>
        </tr>
    );
};

const PengukuranRow = ({ no, main, sub, unit, data, index, onChange, isReadOnly }) => {
    const keteranganOptions = [
        "Sesuai", "Tidak sesuai", "Tidak Ada Ketentuan", "Belum Dapat Dinilai", "penilaian tidak dapat dilanjutkan"
    ];
    const disabledClasses = isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300';
    const isLongText = ["penilaian tidak dapat dilanjutkan", "Belum Dapat Dinilai", "Tidak Ada Ketentuan"].includes(data.keterangan);
    const selectClasses = `w-full border rounded-md p-1 text-sm ${disabledClasses} ${isReadOnly ? 'appearance-none' : ''} ${isLongText ? 'whitespace-normal' : ''} print:hidden`;
    const inputClasses = `w-full border rounded-md p-1 text-sm ${disabledClasses} print:hidden`;

    return (
        <tr className="border-b">
            {no && <td className="p-2 align-top text-center" rowSpan={main.rowSpan}>{no}</td>}
            {main.label && <td className="p-2 align-top font-medium text-gray-700" rowSpan={main.rowSpan}>{main.label}</td>}
            <td className="p-2 align-top pl-4 text-gray-600">{sub}</td>
            <td className="p-2 align-top">
                <div className='flex items-center print:hidden'>
                    <input
                        type="number"
                        step="any"
                        name={`pengukuran.${index}.hasil_pengukuran`}
                        value={data.hasil_pengukuran || ''}
                        onChange={onChange}
                        className={inputClasses}
                        disabled={isReadOnly}
                    />
                    {unit && <span className="ml-2 text-sm text-gray-500" dangerouslySetInnerHTML={{ __html: unit }} />}
                </div>
                <div className={`hidden print:block text-sm print-text-block`}>
                    {(data.hasil_pengukuran || '') + (unit ? ` ${unit.replace(/&sup2;/g, '²')}` : '')}
                </div>
            </td>
            <td className="p-2 align-top">
                <select
                    name={`pengukuran.${index}.keterangan`}
                    value={data.keterangan || ''}
                    onChange={onChange}
                    className={selectClasses}
                    disabled={isReadOnly}
                >
                    <option value="">Pilih Keterangan</option>
                    {keteranganOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className={`hidden print:block text-sm whitespace-normal print-text-block`}>
                    {data.keterangan || ''}
                </div>
            </td>
        </tr>
    );
};

const PrintStyles = () => (
    <style>
        {`
            @page { size: 21cm 33cm; margin: 1.5cm 1cm 1.5cm 1cm; }
            @media print {
                body * { visibility: hidden !important; }
                .printable-area, .printable-area * { visibility: visible !important; }
                .printable-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: none !important; font-size: 11pt; color: #000; background-color: #fff !important; }
                .no-print { display: none !important; }
                .printable-area div, .printable-area p, .printable-area span, .printable-area strong, .printable-area label { color: #000 !important; background-color: transparent !important; font-family: 'Times New Roman', Times, serif; }
                .printable-area table { width: 100% !important; border-collapse: collapse !important; table-layout: auto; page-break-inside: auto !important; }
                .printable-area tr { page-break-inside: avoid !important; }
                .printable-area th, .printable-area td { border: 1px solid #ccc !important; padding: 3px 5px !important; vertical-align: top !important; word-wrap: break-word; }
                .printable-area th { background-color: #f8f8f8 !important; font-weight: bold; }
                fieldset, p { page-break-inside: avoid !important; }
                .signature-block { page-break-inside: avoid !important; margin-bottom: 0.3rem !important; padding: 0.5rem !important; }
                .signature-container { page-break-inside: auto !important; margin-top: 0 !important; }
                thead { display: table-header-group !important; }
                .page-break-before { page-break-before: always !important; }
                .signature-canvas-container { display: none !important; }
                .signature-image-container { display: block !important; text-align: center; margin-top: 0.15rem !important; margin-bottom: 0.15rem !important; }
                .signature-image-container img { max-height: 4.5rem !important; display: inline-block; }
                .printable-area textarea, .printable-area input, .printable-area select { display: none !important; }
                .printable-area div.print-text-block { padding: 0; min-height: 1.1em; }
                .printable-area fieldset { opacity: 1 !important; padding: 0.4rem !important; margin-top: 0.4rem !important; }
                .printable-area legend { padding-left: 0.2rem !important; padding-right: 0.2rem !important; font-size: 1.05em !important; }
                .signature-block div:first-child p { margin-top: 0 !important; padding: 1px 3px !important; }
                .signature-block label { margin-top: 0.15rem !important; }
                
                /* === COMPREHENSIVE COLOR & BACKGROUND OVERRIDES === */
                /* Force pure white/transparent backgrounds on ALL elements */
                .printable-area *, .printable-area input, .printable-area select, .printable-area textarea,
                .printable-area fieldset, .printable-area div, .printable-area td { 
                    background-color: transparent !important; 
                    background: transparent !important; 
                }
                
                /* Force pure black text on ALL text elements */
                .printable-area td, .printable-area th, .printable-area div.print-text-block,
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
            @media screen { .print-text-block { display: none; } }
        `}
    </style>
);

const PetugasPenilai = ({ member, signaturePath, isReadOnly, signatureRef, currentUser }) => {
    const baseUrl = api.defaults.baseURL;
    const imageUrl = `${baseUrl}/signatures/${signaturePath}?t=${new Date().getTime()}`;

    // Local ref for the signature canvas
    const localSignatureRef = useRef(null);

    // Authorization: only the assigned user can sign their own section
    const canSign = currentUser && member.id === currentUser.id;

    // Handle clearing the signature
    const handleClear = () => {
        if (localSignatureRef.current) {
            localSignatureRef.current.clear();
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 p-2 border rounded-md signature-block">
            <div>
                <label className="block text-xs font-medium text-gray-700 font-semibold">Nama Petugas</label>
                <p className="mt-0.5 p-1 border rounded-md bg-gray-50 text-sm">{member.nama}</p>
                <label className="block text-xs font-medium text-gray-700 font-semibold mt-0.5">NIP/NIK</label>
                <p className="mt-0.5 p-1 border rounded-md bg-gray-50 text-sm">{member.nip || 'Tidak tersedia'}</p>
                <label className="block text-xs font-medium text-gray-700 font-semibold mt-0.5">Jabatan</label>
                <p className="mt-0.5 p-1 border rounded-md bg-gray-50 text-sm">{member.pivot?.jabatan_di_tim || member.role}</p>
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 font-semibold">Tanda Tangan:</label>
                <div className="my-0.5 signature-image-container">
                    {signaturePath ? (
                        <img src={imageUrl} alt={`Tanda Tangan ${member.nama}`} className="mx-auto h-24 border rounded bg-white" />
                    ) : (
                        <div className="h-24 border rounded bg-white flex items-center justify-center text-gray-400 text-xs">(Belum TTD)</div>
                    )}
                </div>
                {!isReadOnly && canSign && (
                    <div className='signature-canvas-container'>
                        <div className="border border-gray-300 rounded-md bg-white">
                            <SignatureCanvas
                                ref={(el) => {
                                    localSignatureRef.current = el;
                                    if (signatureRef) signatureRef(el);
                                }}
                                penColor='black'
                                canvasProps={{ className: 'w-full h-40' }}
                            />
                        </div>
                        <button type="button" onClick={handleClear} className="text-xs text-blue-600 hover:underline mt-0.5 no-print">Ulangi</button>
                    </div>
                )}
                {!isReadOnly && !canSign && (
                    <p className="text-xs text-gray-500 italic mt-1">Hanya {member.nama} yang dapat menandatangani</p>
                )}
            </div>
        </div>
    );
};


export default function PenilaianDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // State Data
    const [kasus, setKasus] = useState(null);
    const [penilaian, setPenilaian] = useState(null); // Menyimpan objek penilaian

    // State UI & Loading
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [draftLoading, setDraftLoading] = useState(false);
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    // State Mekanisme Edit
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [initialPenilaianExists, setInitialPenilaianExists] = useState(false);
    const [editRequest, setEditRequest] = useState(null);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestLoading, setRequestLoading] = useState(false);

    // State Tanda Tangan & Form
    const [signatures, setSignatures] = useState({});
    const signatureRefs = useRef({});
    const [formData, setFormData] = useState({
        desk_study: [{ hasil_kesesuaian: 'Sesuai' }],
        pemeriksaan: Array.from({ length: 8 }, () => ({ hasil_pemeriksaan: 'Sesuai' })),
        pengukuran: Array.from({ length: 12 }, () => ({})),
        catatan: '',
    });

    const isDeskStudyTidakSesuai = useMemo(() => {
        return formData.desk_study.some(item => item.hasil_kesesuaian === 'Tidak Sesuai');
    }, [formData.desk_study]);

    const petugasLapangan = useMemo(() => {
        if (!kasus || !kasus.tim || !kasus.tim.users) return [];
        return kasus.tim.users.filter(member => member.pivot?.jabatan_di_tim === 'Petugas Lapangan');
    }, [kasus]);

    const isPemeriksaanDisabled = isReadOnly || isDeskStudyTidakSesuai;
    const isPengukuranDisabled = isReadOnly || isDeskStudyTidakSesuai;

    const pemeriksaanStruktur = [
        { no: '1', komponen: { label: 'Lokasi Usaha', rowSpan: 7 }, subKomponen: 'Alamat' },
        { subKomponen: 'Desa/Kelurahan' }, { subKomponen: 'Kecamatan' }, { subKomponen: 'Kabupaten/Kota' },
        { subKomponen: 'Provinsi' }, { subKomponen: 'Lintang' }, { subKomponen: 'Bujur' },
        { no: '2', komponen: { label: 'Kegiatan Pemanfaatan Ruang', rowSpan: 1 }, subKomponen: 'Jenis' },
    ];
    const pengukuranStruktur = [
        { no: '1', main: { label: 'Luas Tanah', rowSpan: 2 }, sub: 'Luas Tanah yang digunakan kegiatan Pemanfaatan Ruang', unit: 'm&sup2;' },
        { sub: 'Luas Tanah yang dikuasai', unit: 'm&sup2;' },
        { no: '2', main: { label: 'KDB', rowSpan: 1 }, sub: 'Luas Lantai Dasar Bangunan', unit: 'm&sup2;' },
        { no: '3', main: { label: 'KLB', rowSpan: 2 }, sub: 'Jumlah Lantai Bangunan', unit: 'lantai' },
        { sub: 'Luas Seluruh Lantai Bangunan', unit: 'm&sup2;' },
        { no: '4', main: { label: 'Ketinggian Bangunan', rowSpan: 1 }, sub: 'Ketinggian Bangunan', unit: 'm' },
        { no: '5', main: { label: 'KDH', rowSpan: 2 }, sub: 'Luas Tanah yang Terdapat Vegetasi', unit: 'm&sup2;' },
        { sub: 'Luas Tanah yang Tertutup Perkerasan yang masih dapat meresapkan air', unit: 'm&sup2;' },
        { no: '6', main: { label: 'Koefisien Tapak Basemen', rowSpan: 1 }, sub: 'Luas Basemen', unit: 'm&sup2;' },
        { no: '7', main: { label: 'Garis Sempadan Bangunan', rowSpan: 1 }, sub: 'Jarak Bangunan Terdepan dengan Pagar', unit: 'm' },
        { no: '8', main: { label: 'Jarak Bebas Bangunan', rowSpan: 2 }, sub: 'Jarak Bangunan Terbelakang dengan Garis Batas Petak Belakang', unit: 'm' },
        { sub: 'Jarak Bangunan Samping dengan Garis Batas Petak Samping', unit: 'm' },
    ];

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/penilaian/pmp-umk/${id}`);
                const kasusData = response.data;
                setKasus(kasusData);
                const penilaianData = kasusData.penilaian;
                setPenilaian(penilaianData);

                // --- 1. SETUP STATE EDIT REQUEST ---
                let currentRequestStatus = null;
                if (penilaianData) {
                    try {
                        const reqRes = await api.get(`/edit-requests/status/${penilaianData.id}`);
                        setEditRequest(reqRes.data);
                        currentRequestStatus = reqRes.data?.status;
                    } catch (e) { console.log('Belum ada edit request'); }
                }

                const { pemegang } = kasusData;
                const fullAlamat = [pemegang?.alamat, pemegang?.desa_kelurahan, pemegang?.kecamatan].filter(Boolean).join(', ');
                const kegiatan = pemegang?.kegiatan || '';

                if (penilaianData) {
                    // --- 2. LOGIKA READ ONLY (Strict Mode) ---
                    // Jika data sudah ada, defaultnya terkunci.
                    // Kecuali statusnya masih 'Baru'/'Draft' ATAU request edit di-approve.

                    if (penilaianData.ba_hasil_penilaian) {
                        // LOGIKA FINAL: Jika sudah ada BA Hasil Penilaian (Final Stage),
                        // maka semua tahap sebelumnya terkunci permanen (View Only).
                        // Tidak bisa diajukan edit lagi.
                        setIsReadOnly(true);
                    } else if (['Baru', 'Menunggu Penilaian', 'Draft'].includes(kasusData.status)) {
                        // Data awal belum final, bisa diedit langsung
                        setIsReadOnly(false);
                    } else if (currentRequestStatus === 'approved') {
                        // Ada approval edit dari ketua tim
                        setIsReadOnly(false);
                    } else {
                        // Check if all team member signatures are complete
                        const teamMembers = kasusData.tim?.users?.filter(u => u.pivot?.jabatan_di_tim === 'Petugas Lapangan') || [];
                        const signedUserIds = (penilaianData.tanda_tangan_tim || []).map(sig => sig.user_id);
                        const allSignaturesComplete = teamMembers.length > 0 && teamMembers.every(member => signedUserIds.includes(member.id));

                        // Only lock if all signatures are complete
                        // Allow editing if signatures are incomplete so team members can add theirs
                        setIsReadOnly(allSignaturesComplete);
                    }

                    setInitialPenilaianExists(true);

                    // Hydrate Form Data
                    let deskStudyData;
                    if (penilaianData.desk_study && penilaianData.desk_study.length > 0) {
                        deskStudyData = penilaianData.desk_study.map(item => ({ hasil_kesesuaian: 'Sesuai', ...item }));
                    } else {
                        deskStudyData = [{
                            pernyataan_mandiri_lokasi: fullAlamat,
                            pernyataan_mandiri_jenis: kegiatan,
                            hasil_kesesuaian: 'Sesuai'
                        }];
                    }

                    const mergedDeskStudy = deskStudyData.map((item, index) => ({
                        ...item,
                        ...(penilaianData.desk_study?.[index] || {})
                    }));

                    const mergedPemeriksaan = Array.from({ length: 8 }, (_, i) => ({
                        hasil_pemeriksaan: 'Sesuai',
                        ...(penilaianData.pemeriksaan?.[i] || {})
                    }));

                    const mergedPengukuran = Array.from({ length: 12 }, (_, i) => ({
                        ...(penilaianData.pengukuran?.[i] || {})
                    }));

                    setFormData({
                        desk_study: mergedDeskStudy,
                        pemeriksaan: mergedPemeriksaan,
                        pengukuran: mergedPengukuran,
                        catatan: penilaianData.catatan || '',
                    });

                    if (penilaianData.tanda_tangan_tim) {
                        const sigs = penilaianData.tanda_tangan_tim.reduce((acc, curr) => {
                            acc[curr.user_id] = curr.signature_path;
                            return acc;
                        }, {});
                        setSignatures(sigs);
                    }
                } else {
                    setIsReadOnly(false); // Form baru, bisa diedit
                    setInitialPenilaianExists(false);
                    setFormData({
                        desk_study: [{
                            pernyataan_mandiri_lokasi: fullAlamat,
                            pernyataan_mandiri_jenis: kegiatan,
                            hasil_kesesuaian: 'Sesuai'
                        }],
                        pemeriksaan: Array.from({ length: 8 }, () => ({ hasil_pemeriksaan: 'Sesuai' })),
                        pengukuran: Array.from({ length: 12 }, () => ({})),
                        catatan: '',
                    });
                }
            } catch (err) {
                // Check if it's an authorization error (403 Forbidden)
                if (err.response && err.response.status === 403) {
                    setError(err.response.data.message || 'Anda tidak memiliki akses ke data ini.');
                } else {
                    setError('Gagal memuat detail data PMP UMK.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id, user]);

    // --- HANDLERS ---

    const handleChange = (e) => {
        const { name, value } = e.target;
        const [section, index, field] = name.split('.');
        setFormData(prev => {
            const newSectionData = [...prev[section]];
            newSectionData[index] = { ...newSectionData[index], [field]: value };
            return { ...prev, [section]: newSectionData };
        });
    };

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

    const validateForm = () => {
        const errors = {};
        formData.desk_study.forEach((item, index) => {
            if (!item.pernyataan_mandiri_lokasi?.trim()) errors[`desk_study.${index}.pernyataan_mandiri_lokasi`] = true;
            if (!item.pernyataan_mandiri_jenis?.trim()) errors[`desk_study.${index}.pernyataan_mandiri_jenis`] = true;
            if (!item.ketentuan_rtr_jenis?.trim()) errors[`desk_study.${index}.ketentuan_rtr_jenis`] = true;
            if (!item.ketentuan_rtr_arahan?.trim()) errors[`desk_study.${index}.ketentuan_rtr_arahan`] = true;
        });
        if (!isDeskStudyTidakSesuai) {
            formData.pemeriksaan.forEach((item, index) => {
                if (!item.pernyataan_mandiri?.trim()) errors[`pemeriksaan.${index}.pernyataan_mandiri`] = true;
            });
        }
        return errors;
    };

    const getFullFormData = () => {
        const data = { ...formData };
        const signatureData = [];
        petugasLapangan.forEach(member => {
            const sigCanvas = signatureRefs.current[member.id];
            const isCanvasEmpty = !sigCanvas || sigCanvas.isEmpty();
            if (!isCanvasEmpty) {
                signatureData.push({
                    user_id: member.id,
                    signature: sigCanvas.toDataURL(),
                });
            }
        });
        data.tanda_tangan_tim = signatureData;
        return data;
    };

    const handleSaveDraft = async () => {
        setDraftLoading(true);
        setError('');
        setValidationErrors({});
        const draftData = getFullFormData();
        try {
            await api.post(`/penilaian/pmp-umk/${id}/draft`, draftData);
            alert('Draft berhasil disimpan!');
            navigate('/penilaian');
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan draft.');
        } finally {
            setDraftLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isReadOnly) return;

        setError('');
        setValidationErrors({});
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setValidationErrors(newErrors);
            setError('Harap lengkapi semua field yang ditandai merah.');
            return;
        }

        const submissionData = getFullFormData();
        let allMembersSigned = true;
        const signatureMap = submissionData.tanda_tangan_tim.reduce((acc, sig) => {
            acc[sig.user_id] = true; return acc;
        }, {});

        petugasLapangan.forEach(member => {
            if (!signatures[member.id] && !signatureMap[member.id]) allMembersSigned = false;
        });


        // Check if current user is a team member and needs to sign
        const currentUserIsMember = petugasLapangan.some(member => member.id === user?.id);
        const currentUserHasSigned = user && (signatures[user.id] || signatureMap[user.id]);

        if (currentUserIsMember && !currentUserHasSigned) {
            setError('Anda harus memberikan tanda tangan sebelum menyimpan.');
            return;
        }


        if (isDeskStudyTidakSesuai) {
            submissionData.pemeriksaan = Array.from({ length: 8 }, () => ({ hasil_pemeriksaan: 'Sesuai' }));
            submissionData.pengukuran = Array.from({ length: 12 }, () => ({}));
        }

        setSubmitLoading(true);
        try {
            await api.post(`/penilaian/pmp-umk/${id}`, submissionData);
            alert(initialPenilaianExists ? 'Perubahan berhasil disimpan! Formulir akan terkunci kembali.' : 'Penilaian berhasil disimpan!');
            setIsReadOnly(true);
            setEditRequest(prev => prev ? ({ ...prev, status: 'completed' }) : null); // Update status lokal
            navigate('/penilaian');
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan penilaian.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handlePrint = () => window.print();

    const renderEditButton = () => {
        // Hanya tampilkan jika data sudah ada dan user memiliki hak akses (Koordinator/Admin/Ketua Tim/Petugas Lapangan)
        if (!initialPenilaianExists || !user || !['Admin', 'Koordinator Lapangan', 'Ketua Tim', 'Petugas Lapangan'].includes(user.role)) return null;

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
                    <button onClick={() => setShowRequestModal(true)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md">Ajukan Lagi</button>
                </div>
            );
        }
        // Jika Read Only dan belum request (atau request lama sudah completed)
        if (isReadOnly) {
            return (
                <button onClick={() => setShowRequestModal(true)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md flex items-center">
                    Ajukan Edit
                </button>
            );
        }
        return null;
    };

    if (loading) return <p className="text-center py-10">Memuat formulir...</p>;
    if (error && !Object.keys(validationErrors).length) {
        return (
            <div className="px-4 py-6 sm:px-0 max-w-2xl mx-auto">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-yellow-800">{error}</p>
                            <p className="mt-2 text-sm text-yellow-700">
                                Silakan hubungi Ketua Tim jika Anda merasa seharusnya memiliki akses.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-4">
                    <button
                        onClick={() => navigate('/penilaian')}
                        className="text-blue-600 hover:underline"
                    >
                        ← Kembali ke Dashboard Penilaian
                    </button>
                </div>
            </div>
        );
    }
    if (!kasus) return null;

    return (
        <div className="bg-gray-100">
            <PrintStyles />
            <ModalRequestEdit isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} onSubmit={handleRequestEdit} loading={requestLoading} />

            <div className="mb-6 flex justify-between items-center print:hidden no-print px-4 py-3 bg-white shadow-sm sm:px-6 lg:px-8">
                <Link to="/penilaian" className="text-blue-600 hover:underline">&larr; Kembali ke Dashboard Penilaian</Link>
                <div className="flex items-center space-x-2">
                    <button onClick={handlePrint} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg text-sm">
                        Print
                    </button>
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
                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-3">
                    {!isReadOnly && editRequest?.status === 'approved' && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 no-print">
                            <p className="text-blue-700 text-sm font-medium">Anda sedang dalam mode edit. Silakan lakukan perubahan dan simpan untuk mengunci kembali formulir.</p>
                        </div>
                    )}

                    <div className="text-center pt-2">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800">FORMULIR PEMERIKSAAN DAN PENGUKURAN</h2>
                        <p className="text-gray-600">Penilaian Pernyataan Mandiri Pelaku Usaha Mikro dan Kecil</p>
                    </div>

                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 print:hidden no-print" role="alert">
                            <p className="font-bold">Gagal Menyimpan</p>
                            <p>{error}</p>
                        </div>
                    )}

                    {isReadOnly && initialPenilaianExists && (
                        <div className={`border-l-4 p-4 print:hidden no-print ${penilaian?.ba_hasil_penilaian ? 'bg-green-100 border-green-500 text-green-700' : 'bg-blue-100 border-blue-500 text-blue-700'}`} role="alert">
                            <p className="font-bold">{penilaian?.ba_hasil_penilaian ? 'Status Final' : 'Mode Tampilan (Read Only)'}</p>
                            <p>{penilaian?.ba_hasil_penilaian
                                ? 'Penilaian telah selesai (Final). Data tidak dapat diubah lagi.'
                                : "Formulir ini terkunci. Klik tombol 'Ajukan Edit' untuk mengubah data."}</p>
                        </div>
                    )}

                    <fieldset className="border p-3 rounded-md">
                        <legend className="text-lg font-semibold px-2">1. Data Pelaku UMK</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mt-1 text-sm p-1">
                            <p><strong className="font-medium text-gray-600 w-32 inline-block">Nama Pelaku Usaha</strong>: {kasus.pemegang?.nama_pelaku_usaha || '-'}</p>
                            <p><strong className="font-medium text-gray-600 w-32 inline-block">Nomor Induk Berusaha</strong>: {kasus.pemegang?.nomor_identitas || '-'}</p>
                            <p className="md:col-span-2"><strong className="font-medium text-gray-600 w-32 inline-block">Alamat</strong>: {kasus.pemegang?.alamat || '-'}</p>
                            <p><strong className="font-medium text-gray-600 w-32 inline-block">Email</strong>: {kasus.pemegang?.email || '-'}</p>
                            <p><strong className="font-medium text-gray-600 w-32 inline-block">Nomor Telepon</strong>: {kasus.pemegang?.nomor_handphone || '-'}</p>
                        </div>
                    </fieldset>

                    <fieldset className="border p-3 rounded-md">
                        <legend className="text-lg font-semibold px-2">2. Kesesuaian dengan Rencana Tata Ruang (Desk Study)</legend>
                        <div className="overflow-x-auto mt-1">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-100 text-left">
                                    <tr>
                                        <th colSpan="2" className="p-1 border font-semibold">Ketentuan berdasarkan Pernyataan Mandiri Pelaku UMK</th>
                                        <th colSpan="2" className="p-1 border font-semibold">Ketentuan dalam RTR</th>
                                        <th rowSpan="2" className="p-1 border font-semibold align-middle">Hasil Kesesuaian</th>
                                    </tr>
                                    <tr>
                                        <th className="p-1 border font-medium">Lokasi Usaha</th>
                                        <th className="p-1 border font-medium">Jenis Kegiatan Usaha</th>
                                        <th className="p-1 border font-medium">Jenis Peruntukan</th>
                                        <th className="p-1 border font-medium">Arahan/Ketentuan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.desk_study.map((item, index) => (
                                        <DeskStudyRow key={index} index={index} data={item} onChange={handleChange} errors={validationErrors} isReadOnly={isReadOnly} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </fieldset>

                    <fieldset className={`border p-3 rounded-md transition-opacity ${isPemeriksaanDisabled ? 'bg-gray-50 opacity-60 cursor-not-allowed' : ''}`}>
                        <legend className="text-lg font-semibold px-2">3. Pemeriksaan</legend>
                        {isDeskStudyTidakSesuai && !isReadOnly && (
                            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-2 my-1 text-xs no-print" role="alert">
                                Formulir Pemeriksaan dinonaktifkan karena hasil Desk Study adalah "Tidak Sesuai".
                            </div>
                        )}
                        <div className="overflow-x-auto mt-1">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-100 text-left">
                                    <tr>
                                        <th className="p-1 border font-semibold w-10">No.</th>
                                        <th colSpan="2" className="p-1 border font-semibold">Komponen</th>
                                        <th className="p-1 border font-semibold">Ketentuan berdasarkan Pernyataan Mandiri</th>
                                        <th className="p-1 border font-semibold">Hasil Pemeriksaan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pemeriksaanStruktur.map((item, index) => (
                                        <PemeriksaanRow
                                            key={index}
                                            index={index}
                                            no={item.no}
                                            komponen={item.komponen || {}}
                                            subKomponen={item.subKomponen}
                                            data={formData.pemeriksaan[index]}
                                            onChange={handleChange}
                                            errors={validationErrors}
                                            isReadOnly={isPemeriksaanDisabled}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </fieldset>

                    <fieldset className={`border p-3 rounded-md transition-opacity ${isPengukuranDisabled ? 'bg-gray-50 opacity-60 cursor-not-allowed' : ''}`}>
                        <legend className="text-lg font-semibold px-2">4. Pengukuran</legend>
                        {isDeskStudyTidakSesuai && !isReadOnly && (
                            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-2 my-1 text-xs no-print" role="alert">
                                Formulir Pengukuran dinonaktifkan karena hasil Desk Study adalah "Tidak Sesuai".
                            </div>
                        )}
                        <div className="overflow-x-auto mt-1">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-100 text-left">
                                    <tr>
                                        <th className="p-1 border font-semibold w-10">No.</th>
                                        <th colSpan="2" className="p-1 border font-semibold">Komponen yang Dinilai</th>
                                        <th className="p-1 border font-semibold">Hasil Pengukuran</th>
                                        <th className="p-1 border font-semibold">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pengukuranStruktur.map((item, index) => (
                                        <PengukuranRow
                                            key={index}
                                            index={index}
                                            no={item.no}
                                            main={item.main || {}}
                                            sub={item.sub}
                                            unit={item.unit}
                                            data={formData.pengukuran[index]}
                                            onChange={handleChange}
                                            isReadOnly={isPengukuranDisabled}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </fieldset>

                    <div className='page-break-inside-avoid'>
                        <label htmlFor="catatan" className="block text-sm font-medium text-gray-700 font-semibold">Catatan Tambahan:</label>
                        <textarea id="catatan" name="catatan" value={formData.catatan} onChange={(e) => setFormData(p => ({ ...p, catatan: e.target.value }))} rows="3" className={`mt-1 block w-full rounded-md shadow-sm ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'} print:hidden`} disabled={isReadOnly}></textarea>
                        <div className={`hidden print:block whitespace-pre-wrap break-words text-sm mt-1 p-1 border border-transparent print-text-block`}>
                            {formData.catatan || ''}
                        </div>
                    </div>

                    <div className="pt-4 border-t mt-4 page-break-before signature-container">
                        <h3 className="text-lg font-semibold px-2 mb-2">5. Petugas Penilai (Petugas Lapangan)</h3>
                        <div className="space-y-2">
                            {petugasLapangan.length > 0 ? (
                                petugasLapangan.map(member => (
                                    <PetugasPenilai
                                        key={member.id}
                                        member={member}
                                        signaturePath={signatures[member.id]}
                                        isReadOnly={isReadOnly}
                                        signatureRef={el => signatureRefs.current[member.id] = el}
                                        currentUser={user}
                                    />
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm">Tidak ada 'Petugas Lapangan' yang ditugaskan ke tim ini.</p>
                            )}
                        </div>
                    </div>

                    {!isReadOnly && (
                        <div className="flex justify-end pt-3 print:hidden no-print space-x-3">
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                disabled={draftLoading || submitLoading}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md disabled:bg-gray-400"
                            >
                                {draftLoading ? 'Menyimpan...' : 'Save Draft'}
                            </button>

                            <button
                                type="submit"
                                disabled={submitLoading || draftLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md disabled:bg-blue-400"
                            >
                                {submitLoading ? 'Menyimpan...' : (initialPenilaianExists ? 'Simpan' : 'Simpan Hasil Penilaian')}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}