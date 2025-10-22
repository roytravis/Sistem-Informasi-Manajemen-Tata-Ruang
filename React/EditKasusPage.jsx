import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios.js';

export default function EditKasusPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState(null);
    const [pemegangs, setPemegangs] = useState([]);
    const [tims, setTims] = useState([]);
    // PERUBAHAN: Nama state diubah untuk kejelasan
    const [koordinatorLapangans, setKoordinatorLapangans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const statusOptions = [
        'Baru', 'Proses Survei', 'Survei Selesai', 'Menunggu Penilaian',
        'Penilaian Selesai - Patuh', 'Penilaian Selesai - Tidak Patuh',
        'Proses Keberatan', 'Selesai'
    ];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [kasusRes, pemegangRes, timRes, userRes] = await Promise.all([
                    api.get(`/kasus/${id}`),
                    api.get('/pemegangs?all=true'),
                    api.get('/tims'),
                    api.get('/users')
                ]);
                
                const kasusData = kasusRes.data;

                setFormData({
                    ...kasusData,
                    tim_id: kasusData.tim_id || '',
                    penanggung_jawab_id: kasusData.penanggung_jawab_id || ''
                });
                
                setPemegangs(pemegangRes.data); 
                setTims(timRes.data);
                // PERUBAHAN: Filter pengguna untuk mendapatkan 'Koordinator Lapangan'
                const koorUsers = userRes.data.filter(user => user.role === 'Koordinator Lapangan');
                setKoordinatorLapangans(koorUsers);

            } catch (err) {
                setError('Gagal memuat data. Pastikan data kasus ada dan API berjalan.');
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
        setLoading(true);
        setError('');
        try {
            await api.put(`/kasus/${id}`, formData);
            navigate(`/kasus/${id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat memperbarui kasus.');
        } finally {
            setLoading(false);
        }
    };

    if (loading || !formData) return <div className="text-center p-8">Memuat formulir edit...</div>;

    return (
        <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
                <Link to={`/kasus/${id}`} className="text-blue-600 hover:underline">
                    &larr; Batal dan Kembali ke Detail
                </Link>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Kasus</h2>
                
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="mb-4">
                        <label htmlFor="nomor_permohonan" className="block text-sm font-medium text-gray-700">Nomor Permohonan</label>
                        <input type="text" name="nomor_permohonan" id="nomor_permohonan" value={formData.nomor_permohonan || ''} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm" required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status Kasus</label>
                        <select name="status" id="status" value={formData.status || ''} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm">
                            {statusOptions.map(option => (<option key={option} value={option}>{option}</option>))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="tim_id" className="block text-sm font-medium text-gray-700">Tim Penilai</label>
                        <select name="tim_id" id="tim_id" value={formData.tim_id} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm">
                            <option value="">Pilih Tim</option>
                            {tims.map(tim => (<option key={tim.id} value={tim.id}>{tim.nama_tim}</option>))}
                        </select>
                    </div>

                    {/* PERUBAHAN: Label dan data untuk Koordinator Lapangan */}
                    <div>
                        <label htmlFor="penanggung_jawab_id" className="block text-sm font-medium text-gray-700">Koordinator Lapangan</label>
                        <select name="penanggung_jawab_id" id="penanggung_jawab_id" value={formData.penanggung_jawab_id} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm">
                            <option value="">Pilih Koordinator Lapangan</option>
                            {koordinatorLapangans.map(user => (<option key={user.id} value={user.id}>{user.nama}</option>))}
                        </select>
                    </div>
                    
                    <div className="mb-6">
                        <label htmlFor="prioritas_score" className="block text-sm font-medium text-gray-700">Skor Prioritas: {formData.prioritas_score || 0}</label>
                        <input type="range" name="prioritas_score" id="prioritas_score" min="0" max="100" value={formData.prioritas_score || 0} onChange={handleChange} className="w-full" />
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg" disabled={loading}>
                            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

