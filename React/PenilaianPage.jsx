import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

// --- PERUBAHAN: Komponen Badge Status ---
const StatusPenilaianBadge = ({ permohonan }) => {
    // 1. Cek status BA (Tidak Terlaksana)
    if (permohonan.status === 'Penilaian Tidak Terlaksana' && permohonan.berita_acara_id) {
        return <span className="py-1 px-3 rounded-full text-xs font-medium bg-gray-200 text-gray-800">Penilaian Tidak Terlaksana</span>;
    }
    
    // 2. Cek status Draft
    if (permohonan.status === 'Draft') {
        return <span className="py-1 px-3 rounded-full text-xs font-medium bg-blue-200 text-blue-800">Draft</span>;
    }

    // 3. Cek status Selesai Dinilai (kasus ada penilaian DAN status BUKAN draft)
    const sudahDinilai = permohonan.kasus && permohonan.kasus.penilaian;
    if (sudahDinilai) {
        // Status bisa jadi 'Menunggu Penilaian' (artinya menunggu verifikasi) atau status kasus
        const statusKasus = permohonan.kasus.status;
        if (statusKasus && statusKasus.toLowerCase().includes('selesai')) {
             return <span className="py-1 px-3 rounded-full text-xs font-medium bg-green-200 text-green-800">{statusKasus}</span>;
        }
        return <span className="py-1 px-3 rounded-full text-xs font-medium bg-teal-200 text-teal-800">Selesai Dinilai</span>;
    }
    
    // 4. Status default (cth: 'Baru', 'Menunggu Penilaian')
    return <span className="py-1 px-3 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">{permohonan.status || 'Menunggu'}</span>;
};
// --- AKHIR PERUBAHAN ---

export default function PenilaianPage() {
    const [pmpList, setPmpList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isNavigating, setIsNavigating] = useState(null);
    const navigate = useNavigate();

    const [filter, setFilter] = useState('pending');
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchPmpUmk = async (page = 1, statusFilter = 'pending') => {
        setError('');
        setLoading(true);
        try {
            const response = await api.get(`/permohonan-penilaian?page=${page}&status=${statusFilter}`);
            setPmpList(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to,
            });
        } catch (err) {
            const serverError = err.response?.data?.message || 'Pastikan server backend berjalan.';
            setError(`Gagal memuat data. ${serverError}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPmpUmk(currentPage, filter);
    }, [currentPage, filter]);
    
    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setCurrentPage(1);
    };

    const handleNilai = async (permohonan) => {
        setIsNavigating(permohonan.id);
        setError('');
        try {
            // --- PERUBAHAN: Logika inisiasi kasus ---
            // Jika status 'Draft', kasus PASTI sudah ada.
            // Jika status 'Baru' atau 'Menunggu Penilaian' TAPI belum ada kasus, inisiasi.
            if (permohonan.kasus?.id) {
                navigate(`/penilaian/${permohonan.kasus.id}`);
            } else {
                // Inisiasi kasus jika belum ada (cth: status 'Baru' atau 'Menunggu Penilaian' awal)
                const response = await api.post(`/penilaian/initiate/${permohonan.id}`);
                const { kasus_id } = response.data;
                navigate(`/penilaian/${kasus_id}`);
            }
            // --- AKHIR PERUBAHAN ---
        } catch (err) {
            setError('Gagal memproses penilaian. Silakan coba lagi.');
        } finally {
            setIsNavigating(null);
        }
    };

    const handleEdit = (permohonanId) => {
        navigate(`/penilaian/${permohonanId}/edit`);
    };

    const handleDelete = async (permohonanId) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus data permohonan ini? Ini juga akan menghapus Berita Acara terkait (jika ada).')) {
            try {
                await api.delete(`/permohonan-penilaian/${permohonanId}`);
                fetchPmpUmk(currentPage, filter);
            } catch (err) {
                setError('Gagal menghapus data. Silakan coba lagi.');
            }
        }
    };

    return (
        <div className="px-4 py-6 sm:px-0">
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="sm:flex sm:justify-between sm:items-center mb-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Dashboard Penilaian PMP UMK</h2>
                        <p className="mt-1 text-gray-600">Daftar permohonan penilaian untuk Pelaku UMK.</p>
                    </div>
                    <button 
                        onClick={() => navigate('/penilaian/tambah')}
                        className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                    >
                        + Tambah Penilaian Baru
                    </button>
                </div>

                <div className="border-b border-gray-200 mb-4">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => handleFilterChange('pending')} className={`py-3 px-1 border-b-2 font-medium text-sm ${filter === 'pending' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            Menunggu Penilaian
                        </button>
                        <button onClick={() => handleFilterChange('all')} className={`py-3 px-1 border-b-2 font-medium text-sm ${filter === 'all' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            Semua Permohonan
                        </button>
                    </nav>
                </div>
                
                {loading && <p className="text-center py-4">Memuat data...</p>}
                {error && <p className="text-red-500 p-3 bg-red-100 rounded-md">{error}</p>}

                {!loading && !error && (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Nama Pelaku Usaha</th>
                                        <th className="text-left py-3 px-4 uppercase font-semibold text-sm">NIB</th>
                                        <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Status</th>
                                        <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-700 divide-y divide-gray-200">
                                    {pmpList.length > 0 ? pmpList.map(p => {
                                        // --- PERUBAHAN: Logika Aksi Disederhanakan ---
                                        const tidakTerlaksana = p.status === 'Penilaian Tidak Terlaksana' && p.berita_acara_id;
                                        const isDraft = p.status === 'Draft';
                                        // "Selesai Dinilai" berarti ada penilaian DAN statusnya BUKAN draft
                                        const sudahDinilai = p.kasus && p.kasus.penilaian && !isDraft;
                                        // --- AKHIR PERUBAHAN ---

                                        return (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="py-3 px-4">{p.pemegang?.nama_pelaku_usaha || '-'}</td>
                                            <td className="py-3 px-4 font-mono">{p.pemegang?.nomor_identitas || '-'}</td>
                                            <td className="py-3 px-4"><StatusPenilaianBadge permohonan={p} /></td>
                                            <td className="py-3 px-4 flex items-center space-x-2">
                                                
                                                {/* --- PERUBAHAN: Logika Tombol Aksi Utama --- */}
                                                {tidakTerlaksana ? (
                                                    <button 
                                                        onClick={() => navigate(`/penilaian/berita-acara/${p.berita_acara_id}/preview`)} 
                                                        className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-1 px-3 rounded-md text-sm"
                                                    >
                                                        Detail BA
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleNilai(p)} 
                                                        disabled={isNavigating === p.id} 
                                                        // Ganti warna tombol jika status 'Draft'
                                                        className={`font-semibold py-1 px-3 rounded-md text-sm text-white ${
                                                            isDraft 
                                                                ? 'bg-orange-500 hover:bg-orange-600' // Tombol 'Lanjutkan'
                                                                : 'bg-blue-600 hover:bg-blue-700' // Tombol 'Nilai' atau 'Detail'
                                                        } disabled:bg-gray-400`}
                                                    >
                                                        {isNavigating === p.id 
                                                            ? '...' 
                                                            : (isDraft ? 'Lanjutkan Penilaian' : (sudahDinilai ? 'Detail' : 'Nilai'))
                                                        }
                                                    </button>
                                                )}
                                                {/* --- AKHIR PERUBAHAN --- */}
                                                
                                                {/* Tombol Berita Acara Pemeriksaan (setelah selesai dinilai) */}
                                                {sudahDinilai && !tidakTerlaksana && (
                                                    <button
                                                        onClick={() => navigate(`/penilaian/${p.kasus.id}/berita-acara-pemeriksaan`)}
                                                        className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-1 px-3 rounded-md text-sm"
                                                    >
                                                        Berita Acara
                                                    </button>
                                                )}
                                                
                                                {/* Tombol Edit (Hanya jika tidak terlaksana atau draft) */}
                                                {!tidakTerlaksana && (
                                                    <button 
                                                        onClick={() => handleEdit(p.id)} 
                                                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded-md text-sm"
                                                    >
                                                        Edit
                                                    </button>
                                                )}

                                                {/* Tombol Hapus (Selalu ada) */}
                                                <button 
                                                    onClick={() => handleDelete(p.id)} 
                                                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md text-sm"
                                                >
                                                    Hapus
                                                </button>

                                            </td>
                                        </tr>
                                        )
                                    }) : (
                                        <tr>
                                            <td colSpan="4" className="text-center py-10 text-gray-500">Tidak ada data.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {pagination && pagination.last_page > 1 && (
                             <div className="mt-4 flex justify-between items-center">
                                <span className="text-sm text-gray-700">
                                    Menampilkan {pagination.from} sampai {pagination.to} dari {pagination.total} data
                                </span>
                                <div className="space-x-1">
                                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-3 py-1 text-sm bg-white border rounded-md disabled:opacity-50">&laquo; Sebelumnya</button>
                                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === pagination.last_page} className="px-3 py-1 text-sm bg-white border rounded-md disabled:opacity-50">Berikutnya &raquo;</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
