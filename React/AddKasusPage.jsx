import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios.js';

export default function AddKasusPage() {
    const [formData, setFormData] = useState({
        jenis: 'KKPR',
        nomor_permohonan: '',
        pemegang_id: '',
        tim_id: '',
        penanggung_jawab_id: '',
        prioritas_score: 0,
    });
    const [pemegangs, setPemegangs] = useState([]);
    const [tims, setTims] = useState([]);
    // PERUBAHAN: Nama state diubah untuk kejelasan
    const [koordinatorLapangans, setKoordinatorLapangans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pemegangRes, timRes, userRes] = await Promise.all([
                    api.get('/pemegangs?all=true'),
                    api.get('/tims'),
                    api.get('/users')
                ]);
                
                setPemegangs(pemegangRes.data);
                setTims(timRes.data);
                
                // PERUBAHAN: Filter pengguna untuk mendapatkan 'Koordinator Lapangan'
                const koorUsers = userRes.data.filter(user => user.role === 'Koordinator Lapangan');
                setKoordinatorLapangans(koorUsers);

            } catch (err) {
                setError('Gagal memuat data. Pastikan API backend berjalan.');
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/kasus', formData);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat menambahkan kasus.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
                <Link to="/dashboard" className="text-blue-600 hover:underline">
                    &larr; Kembali ke Dashboard
                </Link>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Tambah Kasus Baru</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="nomor_permohonan" className="block text-sm font-medium text-gray-700">Nomor Permohonan</label>
                        <input type="text" name="nomor_permohonan" id="nomor_permohonan" value={formData.nomor_permohonan} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                    </div>
                    <div>
                        <label htmlFor="jenis" className="block text-sm font-medium text-gray-700">Jenis Kasus</label>
                        <select name="jenis" id="jenis" value={formData.jenis} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                            <option value="KKPR">KKPR</option>
                            <option value="PMP_UMK">PMP UMK</option>
                        </select>
                    </div>
                    <div>
                         <label htmlFor="pemegang_id" className="block text-sm font-medium text-gray-700">Pemegang Usaha</label>
                        <select name="pemegang_id" id="pemegang_id" value={formData.pemegang_id} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
                            <option value="">Pilih Pemegang Usaha</option>
                            {pemegangs.map(p => (
                                <option key={p.id} value={p.id}>{p.nama_pelaku_usaha}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="tim_id" className="block text-sm font-medium text-gray-700">Tim Penilai (Opsional)</label>
                        <select name="tim_id" id="tim_id" value={formData.tim_id} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                            <option value="">Pilih Tim Penilai</option>
                            {tims.map(tim => (
                                <option key={tim.id} value={tim.id}>{tim.nama_tim}</option>
                            ))}
                        </select>
                    </div>
                    {/* PERUBAHAN: Label dan data untuk Koordinator Lapangan */}
                    <div>
                        <label htmlFor="penanggung_jawab_id" className="block text-sm font-medium text-gray-700">Koordinator Lapangan (Opsional)</label>
                        <select name="penanggung_jawab_id" id="penanggung_jawab_id" value={formData.penanggung_jawab_id} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                            <option value="">Pilih Koordinator Lapangan</option>
                            {koordinatorLapangans.map(user => (
                                <option key={user.id} value={user.id}>{user.nama}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="prioritas_score" className="block text-sm font-medium text-gray-700">Skor Prioritas: {formData.prioritas_score}</label>
                        <input type="range" name="prioritas_score" id="prioritas_score" min="0" max="100" value={formData.prioritas_score} onChange={handleChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md" disabled={loading}>
                            {loading ? 'Menyimpan...' : 'Simpan Kasus'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

