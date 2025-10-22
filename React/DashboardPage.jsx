import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

// Komponen untuk badge status dengan warna yang lebih detail
const StatusBadge = ({ status }) => {
    let colorClasses = 'bg-gray-200 text-gray-800'; // Default
    const lowerStatus = status.toLowerCase();

    if (lowerStatus.includes('selesai - patuh') || lowerStatus.includes('selesai')) {
        colorClasses = 'bg-green-200 text-green-800';
    } else if (lowerStatus.includes('selesai - tidak patuh')) {
        colorClasses = 'bg-red-200 text-red-800';
    } else if (lowerStatus.includes('proses survei') || lowerStatus.includes('menunggu penilaian')) {
        colorClasses = 'bg-yellow-200 text-yellow-800';
    } else if (lowerStatus.includes('survei selesai')) {
        colorClasses = 'bg-teal-200 text-teal-800';
    } else if (lowerStatus.includes('proses keberatan')) {
        colorClasses = 'bg-orange-200 text-orange-800';
    } else if (lowerStatus === 'baru') {
        colorClasses = 'bg-blue-200 text-blue-800';
    }
    
    return <span className={`py-1 px-3 rounded-full text-xs font-medium ${colorClasses}`}>{status}</span>;
};


// Komponen untuk badge prioritas
const PriorityBadge = ({ score }) => {
    let colorClasses = 'bg-gray-200 text-gray-800';
    if (score > 75) {
        colorClasses = 'bg-red-500 text-white';
    } else if (score > 50) {
        colorClasses = 'bg-yellow-500 text-white';
    } else if (score > 25) {
        colorClasses = 'bg-blue-500 text-white';
    }
    return <span className={`py-1 px-3 rounded-md text-sm font-bold ${colorClasses}`}>{score}</span>;
};


export default function DashboardPage() {
    const [kasusList, setKasusList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterJenis, setFilterJenis] = useState('Semua');
    const [sortBy, setSortBy] = useState('terbaru');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchKasus = async () => {
            setError('');
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (filterJenis !== 'Semua') {
                    params.append('jenis', filterJenis);
                }
                if (sortBy === 'prioritas') {
                    params.append('sortBy', 'prioritas');
                }

                const response = await api.get(`/kasus?${params.toString()}`);
                setKasusList(response.data.data);
            } catch (err) {
                const serverError = err.response?.data?.message || 'Pastikan server backend berjalan dan Anda memiliki izin akses.';
                setError(`Gagal memuat data kasus. ${serverError}`);
            } finally {
                setLoading(false);
            }
        };
        fetchKasus();
    }, [filterJenis, sortBy]);

    return (
        <div className="px-4 py-6 sm:px-0">
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="sm:flex sm:justify-between sm:items-center mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Dasbor Manajemen Kasus</h2>
                        <p className="mt-1 text-gray-600">Kelola dan prioritaskan kasus penilaian di sini.</p>
                    </div>
                    <button 
                        onClick={() => navigate('/kasus/tambah')}
                        className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300"
                    >
                        + Tambah Kasus Baru
                    </button>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b">
                    <div>
                        <label htmlFor="filter-jenis" className="block text-sm font-medium text-gray-700 mb-1">Filter Jenis:</label>
                        <select id="filter-jenis" value={filterJenis} onChange={e => setFilterJenis(e.target.value)} className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            <option value="Semua">Semua</option>
                            <option value="KKPR">KKPR</option>
                            <option value="PMP_UMK">PMP UMK</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">Urutkan Berdasarkan:</label>
                        <select id="sort-by" value={sortBy} onChange={e => setSortBy(e.target.value)} className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            <option value="terbaru">Terbaru</option>
                            <option value="prioritas">Prioritas Tertinggi</option>
                        </select>
                    </div>
                </div>

                {loading && <p className="text-center py-4">Memuat data kasus...</p>}
                {error && <p className="text-red-500 p-3 bg-red-100 rounded-md">{error}</p>}

                {!loading && !error && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">No. Permohonan</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Jenis</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Nama Pelaku Usaha</th>
                                    <th className="text-center py-3 px-4 uppercase font-semibold text-sm text-gray-600">Prioritas</th>
                                    <th className="text-center py-3 px-4 uppercase font-semibold text-sm text-gray-600">Status</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 divide-y divide-gray-200">
                                {kasusList.length > 0 ? kasusList.map(kasus => (
                                    <tr key={kasus.id} className="hover:bg-gray-50 transition duration-150">
                                        <td className="py-3 px-4 font-mono">{kasus.nomor_permohonan}</td>
                                        <td className="py-3 px-4">{kasus.jenis}</td>
                                        {/* PERBAIKAN: Menampilkan 'nama_pelaku_usaha' yang benar */}
                                        <td className="py-3 px-4">{kasus.pemegang?.nama_pelaku_usaha || '-'}</td>
                                        <td className="py-3 px-4 text-center"><PriorityBadge score={kasus.prioritas_score} /></td>
                                        <td className="py-3 px-4 text-center"><StatusBadge status={kasus.status} /></td>
                                        <td className="py-3 px-4">
                                            <button onClick={() => navigate(`/kasus/${kasus.id}`)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 rounded-md text-sm">
                                                Detail
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-10 text-gray-500">Tidak ada data kasus yang sesuai dengan filter.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
