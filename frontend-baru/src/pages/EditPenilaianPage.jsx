import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios.js';

export default function EditPenilaianPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        pemegang_id: '',
        tim_id: '', // Memastikan konsistensi dengan form tambah
        penanggung_jawab_id: '',
    });

    const [pemegangs, setPemegangs] = useState([]);
    const [tims, setTims] = useState([]); // State untuk menampung daftar tim
    const [koordinatorLapangans, setKoordinatorLapangans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentNib, setCurrentNib] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Mengambil semua data yang diperlukan
                const [permohonanRes, pemegangRes, timRes, userRes] = await Promise.all([
                    api.get(`/permohonan-penilaian/${id}`),
                    api.get('/pemegangs?all=true'),
                    api.get('/tims'), // Mengambil data tim
                    api.get('/users')
                ]);

                const permohonanData = permohonanRes.data;
                setFormData({
                    pemegang_id: permohonanData.pemegang_id || '',
                    tim_id: permohonanData.tim_id || '',
                    penanggung_jawab_id: permohonanData.penanggung_jawab_id || '',
                });

                if (permohonanData.pemegang) {
                    setCurrentNib(permohonanData.pemegang.nomor_identitas);
                }

                setPemegangs(pemegangRes.data);
                setTims(timRes.data); // Menyimpan daftar tim ke state
                
                const koorUsers = userRes.data.filter(user => user.role === 'Koordinator Lapangan');
                setKoordinatorLapangans(koorUsers);

            } catch (err) {
                setError('Gagal memuat data. Pastikan data ada dan API berjalan.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setError('');
        try {
            await api.put(`/permohonan-penilaian/${id}`, formData);
            navigate('/penilaian');
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat memperbarui data.');
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) return <div className="text-center p-8">Memuat formulir...</div>;

    return (
        <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
                <Link to="/penilaian" className="text-blue-600 hover:underline">
                    &larr; Batal dan Kembali ke Dashboard Penilaian
                </Link>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Permohonan Penilaian</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="p-3 bg-gray-100 rounded-md">
                        <label className="block text-sm font-medium text-gray-500">Nomor Induk Berusaha (NIB)</label>
                        <p className="text-lg font-mono text-gray-800">{currentNib || 'Tidak tersedia'}</p>
                    </div>

                    <div>
                        <label htmlFor="pemegang_id" className="block text-sm font-medium text-gray-700">Pelaku Usaha</label>
                        <select name="pemegang_id" id="pemegang_id" value={formData.pemegang_id} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
                            <option value="">Pilih Pelaku Usaha</option>
                            {pemegangs.map(p => (
                                <option key={p.id} value={p.id}>{p.nama_pelaku_usaha} - (NIB: {p.nomor_identitas})</option>
                            ))}
                        </select>
                    </div>
                    {/* PERUBAHAN: Input diganti menjadi dropdown untuk memilih Tim */}
                    <div>
                        <label htmlFor="tim_id" className="block text-sm font-medium text-gray-700">Tim Penilai (Opsional)</label>
                        <select name="tim_id" id="tim_id" value={formData.tim_id} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                            <option value="">Pilih Tim Penilai</option>
                            {tims.map(tim => (
                                <option key={tim.id} value={tim.id}>{tim.nama_tim}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="penanggung_jawab_id" className="block text-sm font-medium text-gray-700">Koordinator Lapangan (Opsional)</label>
                        <select name="penanggung_jawab_id" id="penanggung_jawab_id" value={formData.penanggung_jawab_id} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                            <option value="">Pilih Koordinator Lapangan</option>
                            {koordinatorLapangans.map(user => (
                                <option key={user.id} value={user.id}>{user.nama}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md" disabled={submitLoading}>
                            {submitLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

