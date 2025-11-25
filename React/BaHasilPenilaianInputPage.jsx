import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import api from '../api/axios.js';

export default function BaHasilPenilaianInputPage() {
    const { id: penilaianId } = useParams();
    const navigate = useNavigate();
    const sigRefs = useRef({});

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // State Form
    const [formData, setFormData] = useState({
        tanggal_ba: new Date().toISOString().split('T')[0], // Default hari ini
        validitas_kegiatan: '',
        rekomendasi_lanjutan: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/ba-hasil-penilaian/${penilaianId}`);
                setData(response.data);
                
                // Jika sudah ada data BA sebelumnya, redirect ke preview
                if (response.data.ba_hasil_penilaian) {
                    navigate(`/penilaian/${penilaianId}/ba-hasil/preview`, { replace: true });
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Gagal memuat data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [penilaianId, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        // Validasi Tanda Tangan
        const signaturesPayload = [];
        const timMembers = getTimMembers();
        let missingSig = false;

        timMembers.forEach(member => {
            const ref = sigRefs.current[member.id];
            if (ref && !ref.isEmpty()) {
                signaturesPayload.push({
                    role: member.role_display,
                    nama: member.nama,
                    nip: member.nip,
                    jabatan: member.jabatan,
                    signature_data: ref.toDataURL()
                });
            } else {
                missingSig = true;
            }
        });

        if (missingSig) {
            setError('Harap lengkapi semua tanda tangan tim penilai.');
            setSubmitting(false);
            return;
        }

        try {
            await api.post('/ba-hasil-penilaian', {
                penilaian_id: penilaianId,
                ...formData,
                signatures: signaturesPayload
            });
            // Redirect ke Preview setelah sukses
            navigate(`/penilaian/${penilaianId}/ba-hasil/preview`);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan data.');
            setSubmitting(false);
        }
    };

    // Helper untuk menyusun daftar penandatangan
    const getTimMembers = () => {
        if (!data) return [];
        const members = [];
        const { kasus } = data;
        
        // 1. Petugas Lapangan (bisa lebih dari 1)
        const petugas = kasus.tim?.users?.filter(u => u.pivot?.jabatan_di_tim === 'Petugas Lapangan') || [];
        petugas.forEach(p => members.push({ ...p, role_display: 'Petugas Lapangan', jabatan: 'Petugas Lapangan' }));

        // 2. Koordinator Lapangan
        if (kasus.penanggung_jawab) {
            members.push({ ...kasus.penanggung_jawab, role_display: 'Koordinator Lapangan', jabatan: 'Koordinator Lapangan' });
        }

        // 3. Ketua Tim
        const ketua = kasus.tim?.users?.find(u => u.pivot?.jabatan_di_tim === 'Ketua Tim');
        if (ketua) {
            members.push({ ...ketua, role_display: 'Ketua Tim', jabatan: 'Ketua Tim' });
        }

        return members;
    };

    if (loading) return <div className="text-center py-10">Memuat Formulir...</div>;
    if (!data) return <div className="text-center py-10 text-red-500">Data tidak ditemukan</div>;

    const { kasus, formulir_analisis } = data;
    const { pemegang } = kasus;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-6 mb-10">
            <div className="mb-6">
                <Link to="/penilaian" className="text-blue-600 hover:underline">&larr; Batal</Link>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center border-b pb-4">
                Formulir Berita Acara Hasil Penilaian
            </h1>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* A. Data Umum (Prefilled) */}
                <section className="bg-gray-50 p-4 rounded border">
                    <h3 className="font-semibold text-gray-700 mb-3">A. Data Pelaku Usaha (Otomatis)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div><span className="text-gray-500">Nama Pelaku Usaha:</span> <p className="font-medium">{pemegang.nama_pelaku_usaha}</p></div>
                        <div><span className="text-gray-500">Nomor Identitas:</span> <p className="font-medium">{pemegang.nomor_identitas}</p></div>
                        <div><span className="text-gray-500">Alamat:</span> <p className="font-medium">{pemegang.alamat}</p></div>
                        <div><span className="text-gray-500">Email:</span> <p className="font-medium">{pemegang.email || '-'}</p></div>
                    </div>
                </section>

                {/* B. Hasil Analisis (Ringkasan) */}
                <section className="bg-gray-50 p-4 rounded border">
                    <h3 className="font-semibold text-gray-700 mb-3">B. Ringkasan Hasil Analisis (Otomatis)</h3>
                    <div className="text-sm space-y-2">
                        <p>Kesesuaian Lokasi: <strong>{formulir_analisis?.lokasi_kesesuaian_pmp_eksisting || '-'}</strong></p>
                        <p>Kesesuaian Jenis Kegiatan: <strong>{formulir_analisis?.jenis_kesesuaian_pmp_eksisting || '-'}</strong></p>
                        <p>Kesesuaian Intensitas Ruang (KDB/KLB/KDH): <strong>{formulir_analisis?.kdb_kesesuaian_rtr || '-'}</strong></p>
                    </div>
                </section>

                {/* C. Input Keputusan */}
                <section className="p-4 border rounded border-blue-200 bg-blue-50">
                    <h3 className="font-semibold text-blue-800 mb-4">C. Kesimpulan & Rekomendasi (Wajib Diisi)</h3>
                    
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Berita Acara</label>
                            <input 
                                type="date" 
                                name="tanggal_ba" 
                                value={formData.tanggal_ba} 
                                onChange={handleChange}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                required 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">1. Validitas Kegiatan Pemanfaatan Ruang</label>
                            <select 
                                name="validitas_kegiatan" 
                                value={formData.validitas_kegiatan} 
                                onChange={handleChange}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">-- Pilih Validitas --</option>
                                <option value="BENAR">BENAR</option>
                                <option value="TIDAK BENAR">TIDAK BENAR</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">2. Rekomendasi</label>
                            <select 
                                name="rekomendasi_lanjutan" 
                                value={formData.rekomendasi_lanjutan} 
                                onChange={handleChange}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">-- Pilih Rekomendasi --</option>
                                <option value="Melanjutkan kegiatan Pemanfaatan Ruang">Melanjutkan kegiatan Pemanfaatan Ruang</option>
                                <option value="Dilakukan pembinaan sesuai ketentuan peraturan perundang-undangan">Dilakukan pembinaan sesuai ketentuan peraturan perundang-undangan</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* D. Tanda Tangan Digital */}
                <section className="border p-4 rounded">
                    <h3 className="font-semibold text-gray-700 mb-4">D. Tanda Tangan Tim Penilai</h3>
                    <p className="text-sm text-gray-500 mb-4">Silakan bubuhkan tanda tangan digital pada kolom di bawah ini.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {getTimMembers().map(member => (
                            <div key={member.id} className="border p-3 rounded bg-gray-50">
                                <p className="font-bold text-sm">{member.role_display}</p>
                                <p className="text-xs text-gray-600 mb-2">{member.nama} (NIP: {member.nip || '-'})</p>
                                
                                <div className="border bg-white rounded">
                                    <SignatureCanvas 
                                        ref={(ref) => sigRefs.current[member.id] = ref}
                                        penColor='black'
                                        canvasProps={{ className: 'w-full h-32' }}
                                    />
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => sigRefs.current[member.id]?.clear()}
                                    className="text-xs text-red-500 mt-1 hover:underline"
                                >
                                    Hapus & Ulangi
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="flex justify-end pt-4">
                    <button 
                        type="submit" 
                        disabled={submitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg disabled:bg-blue-400 transition-all"
                    >
                        {submitting ? 'Menyimpan...' : 'Simpan & Lihat Preview'}
                    </button>
                </div>
            </form>
        </div>
    );
}