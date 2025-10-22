import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function AddPenilaianPage() {
    const [formData, setFormData] = useState({
        pemegang_id: '',
        tim_id: '',
        penanggung_jawab_id: '',
    });
    const [pemegangs, setPemegangs] = useState([]);
    const [tims, setTims] = useState([]);
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
            await api.post('/permohonan-penilaian', formData);
            navigate('/penilaian'); 
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat menambahkan data.');
        } finally {
            setLoading(false);
        }
    };
    
    // PERBAIKAN: Tombol Berita Acara hanya aktif jika Pelaku Usaha dan Tim sudah dipilih
    const isBaButtonDisabled = !formData.pemegang_id || !formData.tim_id;

    return (
        <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
                <Link to="/penilaian" className="text-blue-600 hover:underline">
                    &larr; Kembali ke Dashboard Penilaian
                </Link>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Tambah Penilaian PMP UMK Baru</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                         <label htmlFor="pemegang_id" className="block text-sm font-medium text-gray-700">Pelaku Usaha</label>
                        <select name="pemegang_id" id="pemegang_id" value={formData.pemegang_id} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
                            <option value="">Pilih Pelaku Usaha</option>
                            {pemegangs.map(p => (
                                <option key={p.id} value={p.id}>{p.nama_pelaku_usaha} - (NIB: {p.nomor_identitas})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="tim_id" className="block text-sm font-medium text-gray-700">Tim Penilai</label>
                        <select name="tim_id" id="tim_id" value={formData.tim_id} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
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
                    <div className="flex justify-end pt-2 space-x-3">
                         <button 
                            type="button" 
                            onClick={() => navigate('/penilaian/berita-acara/tambah', { state: { pemegang_id: formData.pemegang_id, tim_id: formData.tim_id, koordinator_id: formData.penanggung_jawab_id } })}
                            disabled={isBaButtonDisabled}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow-md disabled:bg-yellow-300 disabled:cursor-not-allowed"
                            title={isBaButtonDisabled ? "Pilih Pelaku Usaha dan Tim Penilai terlebih dahulu" : ""}
                        >
                            Berita Acara
                        </button>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md" disabled={loading}>
                            {loading ? 'Menyimpan...' : 'Simpan Penilaian'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

