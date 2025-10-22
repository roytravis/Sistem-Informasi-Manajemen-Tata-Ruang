import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import SignatureCanvas from 'react-signature-canvas';

export default function AddBeritaAcaraPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { pemegang_id, tim_id, koordinator_id } = location.state || {};
    
    // State untuk memisahkan koordinator dan petugas di UI
    const [koordinator, setKoordinator] = useState(null);
    const [petugasLapangan, setPetugasLapangan] = useState([]);
    // State ini menyimpan semua anggota tim untuk logika submit
    const [timPenilai, setTimPenilai] = useState([]);
    
    const signatureRefs = useRef({});

    const [formData, setFormData] = useState({
        nomor_ba: '',
        alasan: '',
        keterangan_lainnya: '',
        tanggal_ba: new Date().toISOString().slice(0, 10),
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    useEffect(() => {
        if (!pemegang_id || !tim_id) {
            setError('Data Pelaku Usaha atau Tim tidak valid. Silakan kembali dan coba lagi.');
            return;
        }

        const fetchTimData = async () => {
            try {
                const response = await api.get(`/tims/${tim_id}`);
                const allMembers = response.data.users;
                
                if (allMembers.length === 0) {
                     setError('Tim yang dipilih tidak memiliki anggota. Silakan periksa manajemen tim.');
                }
                
                // Simpan semua anggota untuk proses submit
                setTimPenilai(allMembers);

                // Pisahkan koordinator dan petugas untuk ditampilkan di UI
                if (koordinator_id) {
                    const coord = allMembers.find(m => m.id === parseInt(koordinator_id, 10));
                    setKoordinator(coord);
                    const petugas = allMembers.filter(m => m.id !== parseInt(koordinator_id, 10));
                    setPetugasLapangan(petugas);
                } else {
                    // Jika tidak ada koordinator yang ditugaskan, tampilkan semua sebagai petugas
                    setPetugasLapangan(allMembers);
                    setKoordinator(null);
                }

                // Inisialisasi refs untuk setiap anggota
                allMembers.forEach(member => {
                    signatureRefs.current[member.id] = null;
                });
            } catch (err) {
                setError('Gagal memuat data anggota tim.');
            }
        };
        fetchTimData();
    }, [tim_id, pemegang_id, koordinator_id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (timPenilai.length === 0) {
            setError("Tidak bisa menyimpan karena tim tidak memiliki anggota.");
            setLoading(false);
            return;
        }

        const tandaTanganTim = [];
        let allSigned = true;
        // Loop melalui semua anggota tim untuk mengumpulkan ttd
        for (const member of timPenilai) {
            const sigCanvas = signatureRefs.current[member.id];
            if (!sigCanvas || sigCanvas.isEmpty()) {
                allSigned = false;
                break;
            }
            tandaTanganTim.push({
                user_id: member.id,
                signature: sigCanvas.toDataURL(),
            });
        }
        
        if (!allSigned) {
            setError("Semua anggota tim, termasuk Koordinator, harus memberikan tanda tangan.");
            setLoading(false);
            return;
        }
        
        const payload = {
            ...formData,
            pemegang_id: pemegang_id,
            koordinator_id: koordinator_id,
            tanda_tangan_tim: tandaTanganTim,
        };

        try {
            const response = await api.post('/berita-acara', payload);
            navigate(`/penilaian/berita-acara/${response.data.id}/preview`);
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
                <Link to="/penilaian/tambah" className="text-blue-600 hover:underline">
                    &larr; Batal dan Kembali
                </Link>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Berita Acara Tidak Terlaksananya Penilaian</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="nomor_ba" className="block text-sm font-medium text-gray-700">Nomor Berita Acara</label>
                        <input type="text" name="nomor_ba" id="nomor_ba" value={formData.nomor_ba} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                    </div>
                    <div>
                        <label htmlFor="tanggal_ba" className="block text-sm font-medium text-gray-700">Tanggal Berita Acara</label>
                        <input type="date" name="tanggal_ba" id="tanggal_ba" value={formData.tanggal_ba} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                    </div>
                    <fieldset>
                        <legend className="text-sm font-medium text-gray-700">Alasan Tidak Terlaksana</legend>
                        <div className="mt-2 space-y-2">
                            {['Tidak dapat dihubungi', 'Lokasi tidak ditemukan', 'Lainnya'].map(alasan => (
                                <div key={alasan} className="flex items-center">
                                    <input id={alasan} name="alasan" type="radio" value={alasan} onChange={handleChange} required className="h-4 w-4 text-blue-600 border-gray-300" />
                                    <label htmlFor={alasan} className="ml-3 block text-sm text-gray-800">{alasan}</label>
                                </div>
                            ))}
                        </div>
                    </fieldset>
                    {formData.alasan === 'Lainnya' && (
                        <div>
                            <label htmlFor="keterangan_lainnya" className="block text-sm font-medium text-gray-700">Keterangan Lainnya</label>
                            <textarea name="keterangan_lainnya" id="keterangan_lainnya" value={formData.keterangan_lainnya} onChange={handleChange} rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required></textarea>
                        </div>
                    )}

                    {/* Bagian Tanda Tangan Digital */}
                    <div className="pt-4 border-t">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Tanda Tangan Tim Penilai</h3>
                        <div className="space-y-4">
                            {/* Tanda Tangan Koordinator */}
                            {koordinator && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Koordinator Lapangan: {koordinator.nama}</label>
                                    <div className="mt-1 border border-gray-300 rounded-md bg-gray-50">
                                        <SignatureCanvas
                                            ref={el => signatureRefs.current[koordinator.id] = el}
                                            penColor='black'
                                            canvasProps={{ className: 'w-full h-32' }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => signatureRefs.current[koordinator.id]?.clear()}
                                        className="text-sm text-blue-600 hover:underline mt-1">
                                        Ulangi Tanda Tangan
                                    </button>
                                </div>
                            )}

                            {/* Tanda Tangan Petugas Lapangan */}
                            {petugasLapangan.map((member, index) => (
                               <div key={member.id}>
                                   <label className="block text-sm font-medium text-gray-700">Petugas Lapangan {index + 1}: {member.nama}</label>
                                   <div className="mt-1 border border-gray-300 rounded-md bg-gray-50">
                                       <SignatureCanvas
                                           ref={el => signatureRefs.current[member.id] = el}
                                           penColor='black'
                                           canvasProps={{ className: 'w-full h-32' }}
                                       />
                                   </div>
                                   <button
                                       type="button"
                                       onClick={() => signatureRefs.current[member.id]?.clear()}
                                       className="text-sm text-blue-600 hover:underline mt-1">
                                       Ulangi Tanda Tangan
                                   </button>
                               </div>
                           ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md" disabled={loading || timPenilai.length === 0}>
                            {loading ? 'Menyimpan...' : 'Simpan & Lihat Preview'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
