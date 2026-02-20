import { useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// --- KOMPONEN KANVAS TANDA TANGAN KUSTOM ---
const SimpleSignaturePad = forwardRef((props, ref) => {
    const canvasRef = useRef(null);
    const [isEmpty, setIsEmpty] = useState(true);

    useImperativeHandle(ref, () => ({
        clear: () => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setIsEmpty(true);
        },
        toDataURL: () => {
            return canvasRef.current.toDataURL();
        },
        isEmpty: () => isEmpty,
        fromDataURL: (url) => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.src = url;
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                setIsEmpty(false);
            };
        }
    }));

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set ukuran canvas agar sesuai container
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'black';

        let isDrawing = false;

        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const startDrawing = (e) => {
            e.preventDefault();
            isDrawing = true;
            setIsEmpty(false);
            const { x, y } = getPos(e);
            ctx.beginPath();
            ctx.moveTo(x, y);
        };

        const draw = (e) => {
            e.preventDefault();
            if (!isDrawing) return;
            const { x, y } = getPos(e);
            ctx.lineTo(x, y);
            ctx.stroke();
        };

        const stopDrawing = (e) => {
            e.preventDefault();
            if (isDrawing) {
                isDrawing = false;
                ctx.closePath();
            }
        };

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', stopDrawing);
        canvas.addEventListener('touchstart', startDrawing, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDrawing);

        return () => {
            if (canvas) {
                canvas.removeEventListener('mousedown', startDrawing);
                canvas.removeEventListener('mousemove', draw);
                canvas.removeEventListener('mouseup', stopDrawing);
                canvas.removeEventListener('mouseleave', stopDrawing);
                canvas.removeEventListener('touchstart', startDrawing);
                canvas.removeEventListener('touchmove', draw);
                canvas.removeEventListener('touchend', stopDrawing);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={`w-full h-full touch-none ${props.canvasProps?.className || ''}`}
            style={{ display: 'block' }}
        />
    );
});
SimpleSignaturePad.displayName = 'SimpleSignaturePad';

// --- STYLING CETAK (Sesuai PDF) ---
const PrintStyles = () => (
    <style>
        {`
            @page { size: A4; margin: 1.5cm 2cm; }
            @media print {
                body * { visibility: hidden !important; }
                .printable-area, .printable-area * { visibility: visible !important; }
                .printable-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; border: none !important; font-size: 11pt; color: #000; background-color: #fff !important; font-family: 'Times New Roman', Times, serif; }
                .no-print { display: none !important; }
                
                table { width: 100% !important; border-collapse: collapse !important; margin-bottom: 1em !important; }
                tr { page-break-inside: avoid !important; }
                td { vertical-align: top !important; padding: 2px 4px !important; }
                
                /* STYLE JUDUL & HEADER - FIXED CENTER ALIGNMENT */
                .judul-container {
                    text-align: center !important;
                    width: 100% !important;
                    margin-bottom: 20px !important;
                    display: block !important;
                }
                .judul-dokumen { 
                    font-weight: bold !important; 
                    text-transform: uppercase !important; 
                    font-size: 12pt !important;
                    line-height: 1.5 !important;
                    margin-bottom: 5px !important;
                    text-align: center !important;
                    width: 100% !important;
                    display: block !important;
                }
                .nomor-dokumen {
                    font-size: 12pt !important;
                    margin-top: 5px !important;
                    text-align: center !important;
                    width: 100% !important;
                    display: block !important;
                }
                
                .signature-image-container img { height: 75px !important; display: inline-block !important; object-fit: contain; }
                
                /* Borderless table for layout */
                .layout-table td { border: none !important; }
                
                /* Sub-tables for measurements */
                .sub-table td { padding-left: 10px !important; }

                
                /* Reset opacity for read-only elements */
                fieldset { opacity: 1 !important; }
                
                /* Grid Layout Fix for Print */
                .signature-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; column-gap: 2rem !important; row-gap: 2.5rem !important; }
                .signature-cell { display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: flex-start !important; page-break-inside: avoid !important; }
                
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
                }
                
                /* Ensure titles and bold elements remain bold */
                .printable-area .judul-dokumen, .printable-area strong, .printable-area th { 
                    font-weight: bold !important;
                }
            }
        `}
    </style>
);

export default function BeritaAcaraPemeriksaanPage() {
    const { id } = useParams(); // ID Kasus
    const location = useLocation();
    const { user } = useAuth(); // Get current user
    const [kasus, setKasus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFinal, setIsFinal] = useState(false); // State baru untuk status final

    // State Data Manual
    const [manualData, setManualData] = useState({
        nomorBa: '',
        nomorSpt: '',
        tandaTanganPemegang: null,
        namaPemegangTTD: '',
        tandaTanganKoordinator: null,
        namaKoordinatorTTD: '',
    });

    const [teamSignatures, setTeamSignatures] = useState({});
    const [isDataSubmitted, setIsDataSubmitted] = useState(false);
    const [manualError, setManualError] = useState('');
    const [submitManualLoading, setSubmitManualLoading] = useState(false);

    // Refs
    const pemegangSigRef = useRef(null);
    const koordinatorSigRef = useRef(null);
    const teamSigRefs = useRef({});

    // 1. FETCH DATA
    useEffect(() => {
        const fetchBaData = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/penilaian/pmp-umk/${id}`);
                setKasus(response.data);

                if (!response.data.penilaian) {
                    setError('Data penilaian belum tersedia.');
                    setLoading(false);
                    return;
                }

                // CHECK FINAL STATUS
                if (response.data.penilaian.ba_hasil_penilaian) {
                    setIsFinal(true);
                    // Jika sudah final, paksa tampilkan preview
                    setIsDataSubmitted(true);
                }

                // Cek data BA Existing
                try {
                    const baRes = await api.get(`/ba-pemeriksaan/${response.data.penilaian.id}`);

                    // VALIDATION LOGIC: Check if meaningful data exists (e.g., number BA)
                    // Also consider the state passed from Dashboard if available
                    const hasSavedData = (baRes.data && baRes.data.nomor_ba) || (location.state?.isExisting === true && baRes.data);

                    if (hasSavedData) {
                        setManualData({
                            nomorBa: baRes.data.nomor_ba || '',
                            nomorSpt: baRes.data.nomor_spt || '',
                            tandaTanganPemegang: baRes.data.tanda_tangan_pemegang || null,
                            namaPemegangTTD: baRes.data.nama_pemegang || response.data.pemegang?.nama_pelaku_usaha || '',
                            tandaTanganKoordinator: baRes.data.tanda_tangan_koordinator || null,
                            namaKoordinatorTTD: baRes.data.nama_koordinator || response.data.penanggung_jawab?.nama || '',
                        });

                        if (baRes.data.tanda_tangan_tim && Array.isArray(baRes.data.tanda_tangan_tim)) {
                            const teamSigs = {};
                            baRes.data.tanda_tangan_tim.forEach(sig => {
                                if (sig.signature_path) {
                                    teamSigs[sig.user_id] = sig.signature_path;
                                }
                            });
                            setTeamSignatures(teamSigs);
                        }

                        // Check if all required signatures are complete
                        const teamMembers = response.data.tim?.users?.filter(u => u.pivot?.jabatan_di_tim === 'Petugas Lapangan') || [];
                        const teamSignedCount = baRes.data.tanda_tangan_tim ? baRes.data.tanda_tangan_tim.length : 0;
                        const hasPemegangSignature = !!baRes.data.tanda_tangan_pemegang;
                        const hasKoordinatorSignature = !!baRes.data.tanda_tangan_koordinator;
                        const allSignaturesComplete = hasPemegangSignature && hasKoordinatorSignature && (teamSignedCount === teamMembers.length);

                        // Only show preview mode if all signatures are complete
                        setIsDataSubmitted(allSignaturesComplete);
                    } else {
                        setManualData(prev => ({
                            ...prev,
                            namaPemegangTTD: response.data.pemegang?.nama_pelaku_usaha || '',
                            namaKoordinatorTTD: response.data.penanggung_jawab?.nama || ''
                        }));
                    }
                } catch (e) { console.warn("BA belum ada, mode input baru."); }

            } catch (err) {
                setError(`Gagal memuat data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchBaData();
    }, [id]);

    // 2. DATA PROCESSING
    const { processedData, petugasLapanganList } = useMemo(() => {
        if (!kasus) return { processedData: null, petugasLapanganList: [] };

        const { pemegang, penilaian, tim, penanggung_jawab } = kasus;
        const petugas = tim?.users?.filter(u => u.pivot?.jabatan_di_tim === 'Petugas Lapangan') || [];

        const tgl = new Date();
        const tanggalBA = {
            hari: tgl.toLocaleDateString('id-ID', { weekday: 'long' }),
            tanggal: tgl.getDate(),
            bulan: tgl.toLocaleDateString('id-ID', { month: 'long' }),
            tahun: tgl.getFullYear()
        };

        return {
            petugasLapanganList: petugas,
            processedData: {
                pemegang,
                penilaian,
                koordinator: penanggung_jawab,
                petugasLapangan: petugas,
                tanggalBA,
                pemeriksaan: penilaian?.pemeriksaan || [],
                pengukuran: penilaian?.pengukuran || []
            }
        };
    }, [kasus]);

    // 3. HANDLERS
    const handleManualChange = (e) => {
        const { name, value } = e.target;
        setManualData(prev => ({ ...prev, [name]: value }));
    };

    const handleDataSubmit = async (e) => {
        e.preventDefault();
        setManualError('');

        if (!manualData.nomorBa || !manualData.nomorSpt || !manualData.namaPemegangTTD) {
            setManualError('Harap lengkapi Nomor BA, SPT, dan Nama Pemegang.');
            return;
        }

        const pemegangSig = pemegangSigRef.current?.isEmpty() === false
            ? pemegangSigRef.current.toDataURL()
            : manualData.tandaTanganPemegang;

        const koordinatorSig = koordinatorSigRef.current?.isEmpty() === false
            ? koordinatorSigRef.current.toDataURL()
            : manualData.tandaTanganKoordinator;

        // Validation: Check current user's role and required signatures
        const isKoordinator = user && kasus?.penanggung_jawab?.id === user.id;
        const isKetuaTim = user && user.role === 'Ketua Tim';
        const isPetugasLapangan = petugasLapanganList.some(member => member.id === user?.id);

        // Koordinator must provide their own signature
        if (isKoordinator && !koordinatorSig) {
            setManualError('Anda harus memberikan tanda tangan Koordinator sebelum menyimpan.');
            return;
        }
        // Pemegang signature is optional - can be completed later by Koordinator/Ketua Tim

        const teamPayload = [];

        petugasLapanganList.forEach(member => {
            const ref = teamSigRefs.current[member.id];
            const existing = teamSignatures[member.id];
            const hasNew = ref && !ref.isEmpty();
            const hasOld = !!existing;

            if (hasNew) {
                teamPayload.push({
                    user_id: member.id,
                    nama: member.nama,
                    nip: member.nip,
                    signature: ref.toDataURL()
                });
            } else if (hasOld) {
                teamPayload.push({
                    user_id: member.id,
                    nama: member.nama,
                    nip: member.nip,
                    signature: existing
                });
            }
        });

        // Check if current user is a team member who needs to sign
        const currentUserIsMember = petugasLapanganList.some(member => member.id === user?.id);
        const currentUserHasSigned = user && teamPayload.some(sig => sig.user_id === user.id);

        if (currentUserIsMember && !currentUserHasSigned) {
            setManualError('Anda harus memberikan tanda tangan sebelum menyimpan.');
            return;
        }

        setSubmitManualLoading(true);
        try {
            const payload = {
                penilaian_id: kasus.penilaian.id,
                nomor_ba: manualData.nomorBa,
                nomor_spt: manualData.nomorSpt,
                nama_pemegang: manualData.namaPemegangTTD,
                tanda_tangan_pemegang: pemegangSig,
                nama_koordinator: manualData.namaKoordinatorTTD,
                tanda_tangan_koordinator: koordinatorSig,
                tanda_tangan_tim: teamPayload,
            };

            const response = await api.post('/ba-pemeriksaan', payload);

            setManualData(prev => ({
                ...prev,
                tandaTanganPemegang: response.data.tanda_tangan_pemegang,
                tandaTanganKoordinator: response.data.tanda_tangan_koordinator
            }));

            const newTeamSigs = {};
            if (response.data.tanda_tangan_tim) {
                response.data.tanda_tangan_tim.forEach(s => {
                    newTeamSigs[s.user_id] = s.signature_path;
                });
            }
            setTeamSignatures(newTeamSigs);
            setIsDataSubmitted(true);
        } catch (err) {
            setManualError(err.response?.data?.message || 'Gagal menyimpan data.');
        } finally {
            setSubmitManualLoading(false);
        }
    };

    const getSigUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('data:image')) return path;
        return `${api.defaults.baseURL}/signatures/${path.split('/').pop()}`;
    };

    if (loading) return <div className="text-center py-10">Memuat Formulir...</div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 m-4 rounded">{error}</div>;

    // --- 1. MODE INPUT FORM (Tampilan Web) ---
    if (!isDataSubmitted) {
        return (
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-8">
                <div className="mb-4">
                    <Link to="/penilaian" className="text-blue-600 hover:underline">&larr; Batal & Kembali</Link>
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center border-b pb-4">
                    Formulir Input Berita Acara Pemeriksaan
                </h2>

                {manualError && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{manualError}</div>}

                <form onSubmit={handleDataSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nomor Berita Acara *</label>
                            <input type="text" name="nomorBa" value={manualData.nomorBa} onChange={handleManualChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required placeholder="Contoh: 123/BA/TR/2025" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nomor Surat Perintah Tugas (SPT) *</label>
                            <input type="text" name="nomorSpt" value={manualData.nomorSpt} onChange={handleManualChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required placeholder="Contoh: 456/SPT/TR/2025" />
                        </div>
                    </div>

                    {/* Form Tanda Tangan */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* 1. Pemegang */}
                        <div className="border p-4 rounded bg-gray-50">
                            <h3 className="font-semibold text-gray-800 mb-2">1. Pemegang / Pelaku Usaha</h3>
                            <input type="text" name="namaPemegangTTD" value={manualData.namaPemegangTTD} onChange={handleManualChange} className="mb-2 w-full border-gray-300 rounded-md shadow-sm p-1 text-sm" placeholder="Nama Lengkap" required />

                            {/* Show existing signature if available */}
                            {manualData.tandaTanganPemegang && (
                                <div className="mb-2">
                                    <p className="text-xs text-green-600 mb-1">✓ Tanda Tangan Tersimpan</p>
                                    <img src={manualData.tandaTanganPemegang} alt="TTD Pemegang" className="border border-gray-300 rounded bg-white w-full h-48 object-contain" />
                                </div>
                            )}

                            {!isFinal && (user && (kasus?.penanggung_jawab?.id === user.id || user.role === 'Ketua Tim')) && !manualData.tandaTanganPemegang && (
                                <>
                                    <div className="border border-gray-400 bg-white rounded w-full h-48">
                                        <SimpleSignaturePad ref={pemegangSigRef} canvasProps={{ className: 'w-full h-full' }} />
                                    </div>
                                    <button type="button" onClick={() => pemegangSigRef.current?.clear()} className="text-xs text-blue-600 mt-1 hover:underline">Hapus / Ulangi</button>
                                    <p className="text-xs text-gray-500 italic mt-1">Tanda tangan dikumpulkan dari pelaku usaha saat pemeriksaan lapangan</p>
                                </>
                            )}
                            {!isFinal && user && !(kasus?.penanggung_jawab?.id === user.id || user.role === 'Ketua Tim') && !manualData.tandaTanganPemegang && (
                                <p className="text-xs text-gray-500 italic p-2 bg-yellow-50 border border-yellow-200 rounded">Hanya Koordinator Lapangan atau Ketua Tim yang dapat mengisi tanda tangan Pemegang</p>
                            )}
                        </div>

                        {/* 2. Koordinator */}
                        {kasus.penanggung_jawab && (
                            <div className="border p-4 rounded bg-gray-50">
                                <h3 className="font-semibold text-gray-800 mb-2">2. Koordinator Lapangan</h3>
                                <input type="text" name="namaKoordinatorTTD" value={manualData.namaKoordinatorTTD} onChange={handleManualChange} className="mb-2 w-full border-gray-300 rounded-md shadow-sm p-1 text-sm" placeholder="Nama Lengkap" required />

                                {/* Show existing signature if available */}
                                {manualData.tandaTanganKoordinator && (
                                    <div className="mb-2">
                                        <p className="text-xs text-green-600 mb-1">✓ Tanda Tangan Tersimpan</p>
                                        <img src={manualData.tandaTanganKoordinator} alt="TTD Koordinator" className="border border-gray-300 rounded bg-white w-full h-48 object-contain" />
                                    </div>
                                )}

                                {user && kasus?.penanggung_jawab?.id === user.id && !manualData.tandaTanganKoordinator ? (
                                    <>
                                        <div className="border border-gray-400 bg-white rounded w-full h-48">
                                            <SimpleSignaturePad ref={koordinatorSigRef} canvasProps={{ className: 'w-full h-full' }} />
                                        </div>
                                        <button type="button" onClick={() => koordinatorSigRef.current?.clear()} className="text-xs text-blue-600 mt-1 hover:underline">Hapus / Ulangi</button>
                                    </>
                                ) : !manualData.tandaTanganKoordinator ? (
                                    <p className="text-xs text-gray-500 italic p-2 bg-yellow-50 border border-yellow-200 rounded">Hanya {manualData.namaKoordinatorTTD} yang dapat menandatangani bagian ini</p>
                                ) : null}
                            </div>
                        )}
                    </div>

                    {/* 3. Tim Penilai */}
                    <div className="border p-4 rounded bg-blue-50">
                        <h3 className="font-semibold text-blue-800 mb-3">3. Tim Penilai (Petugas Lapangan)</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            {petugasLapanganList.map((member, idx) => {
                                const canSign = user && member.id === user.id;
                                return (
                                    <div key={member.id} className="bg-white p-3 rounded border shadow-sm">
                                        <p className="font-bold text-sm text-gray-800 mb-1">{member.nama} (Petugas {idx + 1})</p>
                                        <p className="text-xs text-gray-500 mb-2">NIP: {member.nip || '-'}</p>

                                        {/* Show existing signature if saved */}
                                        {teamSignatures[member.id] && (
                                            <div className="mb-2">
                                                <p className="text-xs text-green-600 mb-1">✓ Tanda Tangan Tersimpan</p>
                                                <img
                                                    src={getSigUrl(teamSignatures[member.id])}
                                                    alt={`TTD ${member.nama}`}
                                                    className="border border-gray-300 rounded bg-white w-full h-48 object-contain"
                                                />
                                            </div>
                                        )}

                                        {/* Show signature canvas only if user can sign AND no existing signature */}
                                        {canSign && !teamSignatures[member.id] ? (
                                            <>
                                                <div className="border border-gray-300 bg-gray-50 rounded h-48 relative">
                                                    <SimpleSignaturePad ref={el => teamSigRefs.current[member.id] = el} canvasProps={{ className: 'w-full h-full' }} />
                                                </div>
                                                <button type="button" onClick={() => teamSigRefs.current[member.id]?.clear()} className="text-xs text-blue-600 mt-1 hover:underline">Hapus / Ulangi</button>
                                            </>
                                        ) : !teamSignatures[member.id] ? (
                                            <p className="text-xs text-gray-500 italic p-2 bg-yellow-50 border border-yellow-200 rounded">Hanya {member.nama} yang dapat menandatangani bagian ini</p>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={submitManualLoading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded shadow-lg disabled:bg-green-300">
                            {submitManualLoading ? 'Menyimpan...' : 'Simpan & Tampilkan BA'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // --- 2. MODE PREVIEW DOKUMEN (Sesuai PDF) ---
    const data = processedData;
    if (!data || !data.tanggalBA) return <div className="text-center py-10">Memuat data dokumen...</div>;

    const { pemegang, pemeriksaan, pengukuran } = data;

    // Helper Values
    const getPemeriksaan = (idx) => pemeriksaan && pemeriksaan[idx] ? pemeriksaan[idx].pernyataan_mandiri : '-';
    const getPengukuran = (idx) => pengukuran && pengukuran[idx] ? pengukuran[idx].hasil_pengukuran : '-';

    // Pisahkan Petugas Lapangan 1 dan sisanya untuk layout
    const petugas1 = data.petugasLapangan[0];
    const sisaPetugas = data.petugasLapangan.slice(1);

    return (
        <div className="bg-gray-100 min-h-screen pb-10">
            <PrintStyles />
            {/* Toolbar */}
            <div className="mb-6 flex justify-between items-center no-print px-4 py-3 bg-white shadow-sm sm:px-6 lg:px-8">
                <div>
                    {!isFinal && (
                        <button onClick={() => setIsDataSubmitted(false)} className="text-blue-600 hover:underline text-sm mr-4 font-semibold">
                            &larr; Ubah Data
                        </button>
                    )}
                    <Link to="/penilaian" className="text-gray-500 hover:underline text-sm">Kembali ke Dashboard</Link>
                </div>
                <div className="flex items-center gap-3">
                    {isFinal && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded border border-green-200">
                            DATA FINAL (READ ONLY)
                        </span>
                    )}
                    <button onClick={() => window.print()} className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded shadow">
                        Cetak PDF
                    </button>
                </div>
            </div>

            {/* HALAMAN 1 (Kurang Lebih) */}
            <div className="printable-area max-w-[21cm] mx-auto bg-white p-8 md:p-12 shadow-lg">

                {/* 2. JUDUL (CENTERED) */}
                <div className="judul-container text-center w-full mb-6 flex flex-col items-center justify-center">
                    <div className="judul-dokumen font-bold uppercase text-lg leading-snug text-center w-full">
                        BERITA ACARA PEMERIKSAAN DAN PENGUKURAN<br />
                        PERNYATAAN MANDIRI PELAKU USAHA MIKRO DAN KECIL
                    </div>
                    <div className="nomor-dokumen mt-2 text-base text-center w-full">
                        Nomor: {manualData.nomorBa}
                    </div>
                </div>

                {/* 3. PEMBUKAAN */}
                <p className="text-justify mb-2">
                    Pada hari ini, tanggal {data.tanggalBA.tanggal} bulan {data.tanggalBA.bulan} tahun {data.tanggalBA.tahun}, yang bertanda tangan di bawah ini:
                </p>

                {/* 4. LIST PETUGAS */}
                <table className="layout-table mb-4">
                    <tbody>
                        {/* Koordinator */}
                        {data.koordinator && (
                            <tr>
                                <td width="30">1.</td>
                                <td width="150">Nama</td>
                                <td width="10">:</td>
                                <td>{data.koordinator.nama}</td>
                            </tr>
                        )}
                        {data.koordinator && (
                            <tr>
                                <td></td>
                                <td>NIP/NIK</td>
                                <td>:</td>
                                <td>{data.koordinator.nip || '-'}</td>
                            </tr>
                        )}
                        {data.koordinator && (
                            <tr>
                                <td></td>
                                <td>Jabatan</td>
                                <td>:</td>
                                <td>Koordinator Lapangan</td>
                            </tr>
                        )}

                        {/* Petugas Lapangan Loop */}
                        {data.petugasLapangan.map((petugas, i) => (
                            <>
                                <tr key={`name-${i}`}>
                                    <td width="30">{i + (data.koordinator ? 2 : 1)}.</td>
                                    <td width="150">Nama</td>
                                    <td width="10">:</td>
                                    <td>{petugas.nama}</td>
                                </tr>
                                <tr key={`nip-${i}`}>
                                    <td></td>
                                    <td>NIP/NIK</td>
                                    <td>:</td>
                                    <td>{petugas.nip || '-'}</td>
                                </tr>
                                <tr key={`jab-${i}`}>
                                    <td></td>
                                    <td>Jabatan</td>
                                    <td>:</td>
                                    <td>Petugas Lapangan</td>
                                </tr>
                            </>
                        ))}
                    </tbody>
                </table>

                {/* 5. DASAR SPT */}
                <p className="text-justify mb-4">
                    Berdasarkan Surat Perintah Tugas Nomor <strong>{manualData.nomorSpt}</strong>, telah melakukan pemeriksaan dan pengukuran terhadap lokasi kegiatan Pemanfaatan Ruang dengan hasil sebagai berikut:
                </p>

                <div className="text-center font-bold mb-4">
                    Hasil Pemeriksaan dan Pengukuran<br />
                    Pernyataan Mandiri Pelaku Usaha Mikro dan Kecil
                </div>

                {/* 6. IDENTITAS PELAKU USAHA */}
                <table className="layout-table mb-4">
                    <tbody>
                        <tr>
                            <td width="200">Nama Pelaku Usaha</td>
                            <td width="10">:</td>
                            <td>{pemegang.nama_pelaku_usaha}</td>
                        </tr>
                        <tr>
                            <td>Nomor Identitas</td>
                            <td>:</td>
                            <td>{pemegang.nomor_identitas}</td>
                        </tr>
                        <tr>
                            <td>Alamat</td>
                            <td>:</td>
                            <td>{pemegang.alamat}</td>
                        </tr>
                        <tr>
                            <td>Nomor Telepon</td>
                            <td>:</td>
                            <td>{pemegang.nomor_handphone || '-'}</td>
                        </tr>
                        <tr>
                            <td>Email</td>
                            <td>:</td>
                            <td>{pemegang.email || '-'}</td>
                        </tr>
                    </tbody>
                </table>

                {/* 7. A. PEMERIKSAAN */}
                <div className="font-bold mb-2">A. Pemeriksaan</div>
                <table className="layout-table mb-2 sub-table">
                    <tbody>
                        <tr>
                            <td width="200" className="font-semibold">Lokasi Usaha</td>
                            <td colSpan="2"></td>
                        </tr>
                        <tr>
                            <td>Alamat</td>
                            <td width="10">:</td>
                            <td>{getPemeriksaan(0)}</td>
                        </tr>
                        <tr>
                            <td>Desa/Kelurahan</td>
                            <td>:</td>
                            <td>{getPemeriksaan(1)}</td>
                        </tr>
                        <tr>
                            <td>Kecamatan</td>
                            <td>:</td>
                            <td>{getPemeriksaan(2)}</td>
                        </tr>
                        <tr>
                            <td>Kabupaten/Kota</td>
                            <td>:</td>
                            <td>{getPemeriksaan(3)}</td>
                        </tr>
                        <tr>
                            <td>Provinsi</td>
                            <td>:</td>
                            <td>{getPemeriksaan(4)}</td>
                        </tr>
                        <tr>
                            <td>Koordinat Lokasi</td>
                            <td>:</td>
                            <td>Lintang: {getPemeriksaan(5)} <br /> Bujur: {getPemeriksaan(6)}</td>
                        </tr>
                        <tr>
                            <td className="font-semibold pt-2">Jenis Kegiatan Pemanfaatan Ruang</td>
                            <td className="pt-2">:</td>
                            <td className="pt-2">{getPemeriksaan(7)}</td>
                        </tr>
                    </tbody>
                </table>

                {/* 8. B. PENGUKURAN */}
                <div className="font-bold mb-2 mt-4">B. Pengukuran (Opsional)</div>
                <table className="layout-table mb-6 sub-table">
                    <tbody>
                        <tr>
                            <td width="250" className="font-semibold">Luas Tanah</td>
                            <td width="10">:</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td className="pl-4">Luas Tanah yang digunakan</td>
                            <td>:</td>
                            <td>{getPengukuran(0)} m²</td>
                        </tr>
                        <tr>
                            <td className="pl-4">Luas Tanah yang dikuasai</td>
                            <td>:</td>
                            <td>{getPengukuran(1)} m²</td>
                        </tr>

                        <tr>
                            <td className="font-semibold pt-2">KDB</td>
                            <td className="pt-2">:</td>
                            <td className="pt-2"></td>
                        </tr>
                        <tr>
                            <td className="pl-4">Luas Lantai Dasar Bangunan</td>
                            <td>:</td>
                            <td>{getPengukuran(2)} m²</td>
                        </tr>

                        <tr>
                            <td className="font-semibold pt-2">KLB</td>
                            <td className="pt-2">:</td>
                            <td className="pt-2"></td>
                        </tr>
                        <tr>
                            <td className="pl-4">Jumlah Lantai Bangunan</td>
                            <td>:</td>
                            <td>{getPengukuran(3)} lantai</td>
                        </tr>
                        <tr>
                            <td className="pl-4">Luas Seluruh Lantai Bangunan</td>
                            <td>:</td>
                            <td>{getPengukuran(4)} m²</td>
                        </tr>

                        <tr>
                            <td className="font-semibold pt-2">Ketinggian Bangunan</td>
                            <td className="pt-2">:</td>
                            <td className="pt-2">{getPengukuran(5)} m</td>
                        </tr>

                        <tr>
                            <td className="font-semibold pt-2">KDH</td>
                            <td className="pt-2">:</td>
                            <td className="pt-2"></td>
                        </tr>
                        <tr>
                            <td className="pl-4">Luas Tanah Bervegetasi</td>
                            <td>:</td>
                            <td>{getPengukuran(6)} m²</td>
                        </tr>
                        <tr>
                            <td className="pl-4">Luas Tanah Perkerasan (resap air)</td>
                            <td>:</td>
                            <td>{getPengukuran(7)} m²</td>
                        </tr>

                        <tr>
                            <td className="font-semibold pt-2">Koefisien Tapak Basemen</td>
                            <td className="pt-2">:</td>
                            <td className="pt-2"></td>
                        </tr>
                        <tr>
                            <td className="pl-4">Luas Basemen</td>
                            <td>:</td>
                            <td>{getPengukuran(8)} m²</td>
                        </tr>

                        <tr>
                            <td className="font-semibold pt-2">Garis Sempadan Bangunan</td>
                            <td className="pt-2">:</td>
                            <td className="pt-2"></td>
                        </tr>
                        <tr>
                            <td className="pl-4">Jarak Dinding Terdepan - Pagar</td>
                            <td>:</td>
                            <td>{getPengukuran(9)} m</td>
                        </tr>

                        <tr>
                            <td className="font-semibold pt-2">Jarak Bebas Bangunan</td>
                            <td className="pt-2">:</td>
                            <td className="pt-2"></td>
                        </tr>
                        <tr>
                            <td className="pl-4">Jarak Belakang</td>
                            <td>:</td>
                            <td>{getPengukuran(10)} m</td>
                        </tr>
                        <tr>
                            <td className="pl-4">Jarak Samping</td>
                            <td>:</td>
                            <td>{getPengukuran(11)} m</td>
                        </tr>
                    </tbody>
                </table>

                <p className="mb-8">
                    Demikian Berita Acara ini dibuat dalam rangkap secukupnya untuk dipergunakan sebagaimana mestinya.
                </p>

                {/* 9. TANDA TANGAN GRID - REVISI SESUAI JUKNIS */}
                <div className="signature-grid grid grid-cols-2 gap-x-16 gap-y-12 mt-12 page-break-inside-avoid">

                    {/* BARIS 1 KIRI: PEMEGANG */}
                    <div className="signature-cell flex flex-col items-center justify-start text-center">
                        <p className="mb-4 font-medium leading-tight">
                            Pemegang Pernyataan Mandiri Pelaku<br />UMK/ Wakilnya
                        </p>
                        <div className="signature-image-container h-24 w-full flex items-center justify-center mb-1">
                            {manualData.tandaTanganPemegang && <img src={manualData.tandaTanganPemegang} alt="TTD" />}
                        </div>
                        <p className="font-bold underline uppercase">{manualData.namaPemegangTTD}</p>
                    </div>

                    {/* BARIS 1 KANAN: PETUGAS 1 */}
                    <div className="signature-cell flex flex-col items-center justify-start text-center">
                        {petugas1 ? (
                            <>
                                <p className="mb-4 font-medium">Petugas Lapangan 1</p>
                                <div className="signature-image-container h-24 w-full flex items-center justify-center mb-1">
                                    {teamSignatures[petugas1.id] ? (
                                        <img src={getSigUrl(teamSignatures[petugas1.id])} alt="TTD" crossOrigin="anonymous" />
                                    ) : <span>(Belum TTD)</span>}
                                </div>
                                <p className="font-bold underline uppercase">{petugas1.nama}</p>
                                <p>NIP: {petugas1.nip || '-'}</p>
                            </>
                        ) : (
                            <p className="mt-8 italic text-gray-400">Petugas 1 belum ditetapkan</p>
                        )}
                    </div>

                    {/* BARIS 2 KIRI: SISA PETUGAS (2 dst) */}
                    <div className="signature-cell flex flex-col items-center justify-start text-center gap-12">
                        {sisaPetugas.length > 0 ? sisaPetugas.map((petugas, i) => (
                            <div key={petugas.id} className="w-full">
                                <p className="mb-4 font-medium">Petugas Lapangan {i + 2}{sisaPetugas.length > 1 ? '' : ', dst.'}</p>
                                <div className="signature-image-container h-24 w-full flex items-center justify-center mb-1">
                                    {teamSignatures[petugas.id] ? (
                                        <img src={getSigUrl(teamSignatures[petugas.id])} alt="TTD" crossOrigin="anonymous" />
                                    ) : <span>(Belum TTD)</span>}
                                </div>
                                <p className="font-bold underline uppercase">{petugas.nama}</p>
                                <p>NIP: {petugas.nip || '-'}</p>
                            </div>
                        )) : null}
                    </div>

                    {/* BARIS 2 KANAN: KOORDINATOR (SELALU DI KANAN BAWAH) */}
                    {/* Menggunakan flex-col-reverse atau margin-top auto jika perlu didorong ke paling bawah, 
                        tapi grid standard biasanya sudah cukup sejajar dengan row Petugas 2 */}
                    <div className="signature-cell flex flex-col items-center justify-start text-center">
                        {data.koordinator && (
                            <>
                                <p className="mb-4 font-medium">Koordinator Lapangan,</p>
                                <div className="signature-image-container h-24 w-full flex items-center justify-center mb-1">
                                    {manualData.tandaTanganKoordinator && <img src={manualData.tandaTanganKoordinator} alt="TTD" />}
                                </div>
                                <p className="font-bold underline uppercase">{manualData.namaKoordinatorTTD}</p>
                                <p>NIP: {data.koordinator.nip || '-'}</p>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}