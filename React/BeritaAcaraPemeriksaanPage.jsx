import { useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../axios'; 

// --- KOMPONEN KANVAS TANDA TANGAN KUSTOM (Tanpa Library) ---
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
        isEmpty: () => isEmpty
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
            // Handle touch vs mouse
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

        // Event Listeners
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', stopDrawing);
        canvas.addEventListener('touchstart', startDrawing, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDrawing);

        return () => {
            // Cleanup
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

// --- STYLING CETAK ---
const PrintStyles = () => (
    <style>
        {`
            @page { size: A4; margin: 2cm 1.5cm; }
            @media print {
                body * { visibility: hidden !important; }
                .printable-area, .printable-area * { visibility: visible !important; }
                .printable-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: none !important; font-size: 12pt; color: #000; background-color: #fff !important; }
                .no-print { display: none !important; }
                .printable-area table { width: 100% !important; border-collapse: collapse !important; }
                .printable-area tr { page-break-inside: avoid !important; }
                .printable-area th, .printable-area td { border: 1px solid #000 !important; padding: 4px 6px !important; vertical-align: top !important; }
                .signature-block { page-break-inside: avoid !important; }
                .signature-image-container img { max-height: 5rem !important; display: inline-block !important; }
            }
        `}
    </style>
);

const DataRow = ({ label, value, unit = '' }) => (
    <tr>
        <td className="w-2/5 p-2 border border-gray-300">{label}</td>
        <td className="w-3/5 p-2 border border-gray-300">{value || '-'} {unit.replace(/&sup2;/g, '²')}</td>
    </tr>
);

export default function BeritaAcaraPemeriksaanPage() {
    const { id } = useParams(); // ID Kasus
    const [kasus, setKasus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State Data Manual
    const [manualData, setManualData] = useState({
        nomorBa: '',
        nomorSpt: '',
        tandaTanganPemegang: null,
        namaPemegangTTD: '',
        tandaTanganKoordinator: null,
        namaKoordinatorTTD: '',
    });
    
    // State Tanda Tangan Tim (Dinamis)
    // Format: { [userId]: base64String }
    const [teamSignatures, setTeamSignatures] = useState({});
    
    const [isDataSubmitted, setIsDataSubmitted] = useState(false);
    const [manualError, setManualError] = useState('');
    const [submitManualLoading, setSubmitManualLoading] = useState(false);

    // Refs
    const pemegangSigRef = useRef(null);
    const koordinatorSigRef = useRef(null);
    const teamSigRefs = useRef({}); // Refs dinamis untuk tim

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

                // Cek data BA Existing
                try {
                    const baRes = await api.get(`/ba-pemeriksaan/${response.data.penilaian.id}`);
                    if (baRes.data) {
                        // Hydrate Data Utama
                        setManualData({
                            nomorBa: baRes.data.nomor_ba || '',
                            nomorSpt: baRes.data.nomor_spt || '',
                            tandaTanganPemegang: baRes.data.tanda_tangan_pemegang || null,
                            namaPemegangTTD: baRes.data.nama_pemegang || response.data.pemegang?.nama_pelaku_usaha || '',
                            tandaTanganKoordinator: baRes.data.tanda_tangan_koordinator || null,
                            namaKoordinatorTTD: baRes.data.nama_koordinator || response.data.penanggung_jawab?.nama || '',
                        });

                        // Hydrate Data Tim
                        if (baRes.data.tanda_tangan_tim && Array.isArray(baRes.data.tanda_tangan_tim)) {
                            const teamSigs = {};
                            baRes.data.tanda_tangan_tim.forEach(sig => {
                                // Simpan path (bukan base64) ke state
                                if (sig.signature_path) {
                                    teamSigs[sig.user_id] = sig.signature_path; 
                                }
                            });
                            setTeamSignatures(teamSigs);
                        }

                        setIsDataSubmitted(true);
                    } else {
                        // Data Baru
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

    // 2. DATA PROCESSING (MEMOIZED)
    // PERBAIKAN: useMemo ini mengembalikan { processedData, petugasLapanganList }
    // processedData adalah objek data utama (bukan nested lagi).
    const { processedData, petugasLapanganList } = useMemo(() => {
        if (!kasus) return { processedData: null, petugasLapanganList: [] };

        const { pemegang, penilaian, tim, penanggung_jawab } = kasus;
        const petugas = tim?.users?.filter(u => u.pivot?.jabatan_di_tim === 'Petugas Lapangan') || [];

        // Data untuk Preview
        const tgl = new Date(); // Atau tanggal dari DB
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
                // Data Pemeriksaan/Pengukuran bisa diambil dari penilaian->pemeriksaan
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

    // Fungsi Submit Form
    const handleDataSubmit = async (e) => {
        e.preventDefault();
        setManualError('');

        // Validasi Dasar
        if (!manualData.nomorBa || !manualData.nomorSpt || !manualData.namaPemegangTTD) {
            setManualError('Harap lengkapi Nomor BA, SPT, dan Nama Pemegang.');
            return;
        }

        // Ambil Signature Data (Priority: Canvas > Existing State)
        const pemegangSig = pemegangSigRef.current?.isEmpty() === false 
            ? pemegangSigRef.current.toDataURL() 
            : manualData.tandaTanganPemegang;

        const koordinatorSig = koordinatorSigRef.current?.isEmpty() === false 
            ? koordinatorSigRef.current.toDataURL() 
            : manualData.tandaTanganKoordinator;

        if (!pemegangSig) {
            setManualError('Tanda tangan Pemegang wajib diisi.');
            return;
        }
        if (kasus.penanggung_jawab && !koordinatorSig) {
            setManualError('Tanda tangan Koordinator wajib diisi.');
            return;
        }

        // Proses Signature Tim
        const teamPayload = [];
        let missingTeamSig = false;

        petugasLapanganList.forEach(member => {
            const ref = teamSigRefs.current[member.id];
            const existing = teamSignatures[member.id];
            
            // Cek apakah ada signature baru di canvas
            const hasNew = ref && !ref.isEmpty();
            // Cek apakah ada signature lama (path/url)
            const hasOld = !!existing;

            if (hasNew) {
                teamPayload.push({
                    user_id: member.id,
                    nama: member.nama,
                    nip: member.nip,
                    signature: ref.toDataURL() // Base64 baru
                });
            } else if (hasOld) {
                teamPayload.push({
                    user_id: member.id,
                    nama: member.nama,
                    nip: member.nip,
                    signature: existing // Path lama (dikirim balik)
                });
            } else {
                missingTeamSig = true;
            }
        });

        if (missingTeamSig) {
            setManualError('Semua anggota Tim Penilai wajib membubuhkan tanda tangan.');
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
                tanda_tangan_tim: teamPayload, // Array baru
            };

            const response = await api.post('/ba-pemeriksaan', payload);
            
            // Update State dengan data dari server
            setManualData(prev => ({
                ...prev,
                tandaTanganPemegang: response.data.tanda_tangan_pemegang,
                tandaTanganKoordinator: response.data.tanda_tangan_koordinator
            }));

            // Update Team Signatures dengan Path dari server
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

    // Helper URL Gambar
    const getSigUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('data:image')) return path; // Base64
        return `${api.defaults.baseURL}/signatures/${path.split('/').pop()}`; // URL file
    };

    // --- RENDER ---
    if (loading) return <div className="text-center py-10">Memuat Formulir...</div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 m-4 rounded">{error}</div>;

    // --- 1. MODE INPUT FORM ---
    if (!isDataSubmitted) {
        return (
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-8">
                <div className="mb-4">
                    <Link to="/penilaian" className="text-blue-600 hover:underline">&larr; Batal & Kembali</Link>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center border-b pb-4">
                    Formulir Berita Acara Pemeriksaan
                </h2>

                {manualError && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{manualError}</div>}

                <form onSubmit={handleDataSubmit} className="space-y-6">
                    {/* A. Info Dokumen */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nomor Berita Acara *</label>
                            <input type="text" name="nomorBa" value={manualData.nomorBa} onChange={handleManualChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nomor Surat Perintah Tugas (SPT) *</label>
                            <input type="text" name="nomorSpt" value={manualData.nomorSpt} onChange={handleManualChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                        </div>
                    </div>

                    {/* B. Tanda Tangan Pemegang */}
                    <div className="border p-4 rounded bg-gray-50">
                        <h3 className="font-semibold text-gray-800 mb-3">B. Tanda Tangan Pemegang</h3>
                        <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700">Nama Penandatangan *</label>
                            <input type="text" name="namaPemegangTTD" value={manualData.namaPemegangTTD} onChange={handleManualChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" required />
                        </div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanda Tangan *</label>
                        {manualData.tandaTanganPemegang && (
                            <div className="mb-2">
                                <img src={manualData.tandaTanganPemegang} className="h-16 border bg-white" alt="TTD Tersimpan" />
                                <p className="text-xs text-green-600 mt-1">✓ Tanda tangan tersimpan. Gunakan canvas di bawah untuk mengubah.</p>
                            </div>
                        )}
                        <div className="border border-gray-400 bg-white rounded w-full h-32 relative">
                            <SimpleSignaturePad ref={pemegangSigRef} canvasProps={{ className: 'w-full h-full' }} />
                        </div>
                        <button type="button" onClick={() => pemegangSigRef.current?.clear()} className="text-xs text-blue-600 mt-1 hover:underline">Hapus Tanda Tangan</button>
                    </div>

                    {/* C. Tanda Tangan Tim Penilai */}
                    <div className="border p-4 rounded bg-blue-50">
                        <h3 className="font-semibold text-blue-800 mb-3">C. Tanda Tangan Tim Penilai</h3>
                        <p className="text-sm text-blue-600 mb-4">Seluruh anggota tim yang terdaftar wajib membubuhkan tanda tangan.</p>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Loop Anggota Tim */}
                            {petugasLapanganList.map((member, idx) => (
                                <div key={member.id} className="bg-white p-3 rounded border shadow-sm">
                                    <p className="font-bold text-sm text-gray-800">Petugas {idx + 1}: {member.nama}</p>
                                    <p className="text-xs text-gray-500 mb-2">NIP: {member.nip || '-'}</p>
                                    
                                    {teamSignatures[member.id] && (
                                        <div className="mb-2">
                                            <img src={getSigUrl(teamSignatures[member.id])} className="h-12 border bg-gray-50" alt="TTD Tersimpan" crossOrigin="anonymous" />
                                            <p className="text-xs text-green-600">✓ Tersimpan</p>
                                        </div>
                                    )}
                                    
                                    <div className="border border-gray-300 bg-gray-50 rounded h-24 relative">
                                        <SimpleSignaturePad 
                                            ref={el => teamSigRefs.current[member.id] = el}
                                            canvasProps={{ className: 'w-full h-full' }} 
                                        />
                                    </div>
                                    <button type="button" onClick={() => teamSigRefs.current[member.id]?.clear()} className="text-xs text-blue-600 mt-1 hover:underline">Hapus</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* D. Tanda Tangan Koordinator */}
                    {kasus.penanggung_jawab && (
                        <div className="border p-4 rounded bg-gray-50">
                            <h3 className="font-semibold text-gray-800 mb-3">D. Tanda Tangan Koordinator Lapangan</h3>
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700">Nama Koordinator *</label>
                                <input type="text" name="namaKoordinatorTTD" value={manualData.namaKoordinatorTTD} onChange={handleManualChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" required />
                            </div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tanda Tangan *</label>
                            {manualData.tandaTanganKoordinator && (
                                <div className="mb-2">
                                    <img src={manualData.tandaTanganKoordinator} className="h-16 border bg-white" alt="TTD Tersimpan" />
                                </div>
                            )}
                            <div className="border border-gray-400 bg-white rounded w-full h-32 relative">
                                <SimpleSignaturePad ref={koordinatorSigRef} canvasProps={{ className: 'w-full h-full' }} />
                            </div>
                            <button type="button" onClick={() => koordinatorSigRef.current?.clear()} className="text-xs text-blue-600 mt-1 hover:underline">Hapus Tanda Tangan</button>
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={submitManualLoading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded shadow-lg disabled:bg-green-300">
                            {submitManualLoading ? 'Menyimpan...' : 'Simpan & Lanjutkan ke BA'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // --- 2. MODE PREVIEW DOKUMEN ---
    // PERBAIKAN: Variabel processedData SUDAH berisi objek data. Tidak perlu destructuring { processedData: data } lagi.
    const data = processedData; // Ganti alias agar sesuai dengan penggunaan di bawah
    const { pemegang } = data; // Ambil pemegang dari data

    return (
        <div>
            <PrintStyles />
            {/* Header Toolbar */}
            <div className="mb-6 flex justify-between items-center no-print px-4 py-3 bg-white shadow-sm sm:px-6 lg:px-8">
                <div>
                    <button onClick={() => setIsDataSubmitted(false)} className="text-blue-600 hover:underline text-sm mr-4 font-semibold">
                        &larr; Ubah Data / Tanda Tangan
                    </button>
                    <Link to="/penilaian" className="text-gray-500 hover:underline text-sm">Kembali ke Dashboard</Link>
                </div>
                <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow">
                    Cetak PDF
                </button>
            </div>

            {/* Dokumen Preview */}
            <div className="printable-area max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 md:p-12 font-serif text-black leading-relaxed">
                {/* Judul */}
                <div className="text-center uppercase font-bold mb-8">
                    <h2 className="text-lg underline">BERITA ACARA PEMERIKSAAN DAN PENGUKURAN</h2>
                    <h3 className="text-lg">PERNYATAAN MANDIRI PELAKU USAHA MIKRO DAN KECIL</h3>
                    <p className="text-base normal-case mt-2">Nomor: {manualData.nomorBa}</p>
                </div>

                {/* Isi Pembuka */}
                <div className="text-justify mb-4">
                    <p className="indent-8 mb-2">
                        Pada hari ini, {data.tanggalBA.hari} tanggal {data.tanggalBA.tanggal} bulan {data.tanggalBA.bulan} tahun {data.tanggalBA.tahun}, 
                        kami yang bertanda tangan di bawah ini:
                    </p>
                    {/* List Petugas */}
                    <ol className="list-decimal pl-6 mb-4 space-y-1">
                        {[data.koordinator, ...data.petugasLapangan].filter(Boolean).map((p, i) => (
                            <li key={i}>
                                <span className="inline-block w-40 font-semibold">{p.nama}</span>
                                <span className="inline-block">({p.role === 'Koordinator Lapangan' ? 'Koordinator' : 'Petugas Lapangan'})</span>
                            </li>
                        ))}
                    </ol>
                    <p className="indent-8 mb-4">
                        Berdasarkan Surat Perintah Tugas Nomor <strong>{manualData.nomorSpt}</strong>, telah melakukan pemeriksaan dan pengukuran terhadap lokasi kegiatan:
                    </p>
                </div>

                {/* Data Pemegang */}
                <h4 className="font-bold mb-2">1. Pelaku Usaha</h4>
                <table className="w-full border mb-4 text-sm">
                    <tbody>
                        <DataRow label="Nama Pelaku Usaha" value={pemegang?.nama_pelaku_usaha} />
                        <DataRow label="Nomor Identitas" value={pemegang?.nomor_identitas} />
                        <DataRow label="Alamat" value={pemegang?.alamat} />
                    </tbody>
                </table>

                {/* Detail Pemeriksaan (Sample Data) */}
                <h4 className="font-bold mb-2">2. Hasil Pemeriksaan Lapangan</h4>
                <div className="mb-4 text-sm border p-2">
                    <p><i>Detail hasil pemeriksaan dan pengukuran sesuai Formulir Analisis yang terlampir.</i></p>
                </div>

                <p className="mt-6">Demikian Berita Acara ini dibuat untuk dipergunakan sebagaimana mestinya.</p>

                {/* Area Tanda Tangan */}
                <div className="mt-8 pt-4">
                    {/* Row 1: Pemegang & Koordinator */}
                    <div className="grid grid-cols-2 gap-8 text-center mb-8">
                        <div className="signature-block">
                            <p className="mb-2">Pemegang Pernyataan Mandiri</p>
                            <div className="signature-image-container h-24 flex items-center justify-center">
                                {manualData.tandaTanganPemegang && <img src={manualData.tandaTanganPemegang} alt="TTD Pemegang" className="h-full object-contain" />}
                            </div>
                            <p className="font-bold underline mt-2">{manualData.namaPemegangTTD}</p>
                        </div>
                        {data.koordinator && (
                            <div className="signature-block">
                                <p className="mb-2">Koordinator Lapangan</p>
                                <div className="signature-image-container h-24 flex items-center justify-center">
                                    {manualData.tandaTanganKoordinator && <img src={manualData.tandaTanganKoordinator} alt="TTD Koordinator" className="h-full object-contain" />}
                                </div>
                                <p className="font-bold underline mt-2">{manualData.namaKoordinatorTTD}</p>
                                <p className="text-xs">NIP: {data.koordinator.nip}</p>
                            </div>
                        )}
                    </div>

                    {/* Row 2: Petugas Lapangan (Grid Dynamic) */}
                    <div className="text-center font-bold mb-4 underline">Tim Penilai (Petugas Lapangan)</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
                        {data.petugasLapangan.map((petugas, i) => (
                            <div key={petugas.id} className="signature-block">
                                <p className="text-sm mb-2">Petugas {i + 1}</p>
                                <div className="signature-image-container h-20 flex items-center justify-center border-b border-gray-100 pb-1">
                                    {teamSignatures[petugas.id] ? (
                                        <img src={getSigUrl(teamSignatures[petugas.id])} alt={`TTD ${petugas.nama}`} className="h-full object-contain" crossOrigin="anonymous" />
                                    ) : <span className="text-xs text-gray-400">Belum TTD</span>}
                                </div>
                                <p className="font-bold text-sm mt-1">{petugas.nama}</p>
                                <p className="text-xs text-gray-500">NIP: {petugas.nip || '-'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}