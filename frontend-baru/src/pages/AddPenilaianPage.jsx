import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function AddPenilaianPage() {
    const [formData, setFormData] = useState({
        pemegang_id: '',
    });
    const [pemegangs, setPemegangs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const pemegangRes = await api.get('/pemegangs?all=true');
                setPemegangs(pemegangRes.data);
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
            await api.post('/permohonan-penilaian', formData);
            navigate('/penilaian');
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat menambahkan data.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
                <Link to="/penilaian" className="text-blue-600 hover:underline">
                    &larr; Kembali ke Dashboard Penilaian
                </Link>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Tambah Permohonan Penilaian Baru</h2>
                <p className="text-sm text-gray-600 mb-6">
                    Buat permohonan penilaian baru untuk pelaku usaha.
                    Penugasan tim akan dilakukan oleh Ketua Tim setelah permohonan dibuat.
                </p>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="pemegang_id" className="block text-sm font-medium text-gray-700">Pelaku Usaha *</label>
                        <select name="pemegang_id" id="pemegang_id" value={formData.pemegang_id} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required>
                            <option value="">Pilih Pelaku Usaha</option>
                            {pemegangs.map(p => (
                                <option key={p.id} value={p.id}>{p.nama_pelaku_usaha} - (NIB: {p.nomor_identitas})</option>
                            ))}
                        </select>
                        <p className="mt-1 text-sm text-gray-500">
                            Pilih pelaku usaha yang akan dinilai
                        </p>
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-blue-700">
                                    <strong>Catatan:</strong> Setelah permohonan dibuat, Ketua Tim akan menerima notifikasi
                                    dan dapat menugaskan tim penilai serta koordinator lapangan untuk memulai penilaian.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors" disabled={loading}>
                            {loading ? 'Menyimpan...' : 'Simpan Permohonan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
