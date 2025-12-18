import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext'; // Import AuthContext

// Komponen Badge Status
const StatusPenilaianBadge = ({ permohonan }) => {
    if (permohonan.status === 'Penilaian Tidak Terlaksana' && permohonan.berita_acara_id) {
        return <span className="py-1 px-3 rounded-full text-xs font-medium bg-gray-200 text-gray-800">Penilaian Tidak Terlaksana</span>;
    }
    if (permohonan.status === 'Draft') {
        return <span className="py-1 px-3 rounded-full text-xs font-medium bg-blue-200 text-blue-800">Draft</span>;
    }
    const sudahDinilai = permohonan.kasus && permohonan.kasus.penilaian;
    if (sudahDinilai) {
        const statusKasus = permohonan.kasus.status;
        if (statusKasus && statusKasus.toLowerCase().includes('selesai')) {
             return <span className="py-1 px-3 rounded-full text-xs font-medium bg-green-200 text-green-800">{statusKasus}</span>;
        }
        return <span className="py-1 px-3 rounded-full text-xs font-medium bg-teal-200 text-teal-800">Selesai Dinilai (Verifikasi)</span>;
    }
    return <span className="py-1 px-3 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">{permohonan.status || 'Menunggu'}</span>;
};

export default function PenilaianPage() {
    const { user } = useAuth(); // Ambil data user yang sedang login
    const [pmpList, setPmpList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isNavigating, setIsNavigating] = useState(null);
    const navigate = useNavigate();
    
    // Gunakan useSearchParams untuk membaca query string URL (e.g. ?id=123)
    const [searchParams, setSearchParams] = useSearchParams();
    const highlightedId = searchParams.get('id');

    const [filter, setFilter] = useState('pending');
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Cek Hak Akses Edit/Delete (Hanya Admin dan Ketua Tim)
    const canEditDelete = user && ['Admin', 'Ketua Tim'].includes(user.role);

    const fetchPmpUmk = async (page = 1, statusFilter = 'pending', filterId = null) => {
        setError('');
        setLoading(true);
        try {
            // Bangun URL Query
            let url = `/permohonan-penilaian?page=${page}`;
            
            // Jika ada filter ID (dari notifikasi), prioritas utama
            if (filterId) {
                url += `&id=${filterId}`;
            } else {
                // Jika tidak ada ID, gunakan filter status biasa
                url += `&status=${statusFilter}`;
            }

            const response = await api.get(url);
            
            // --- DEBUGGING LOG (UPDATED) ---
            console.group("DEBUGGING DATA PENILAIAN (FETCH)");
            response.data.data.forEach((item, index) => {
                const pen = item.kasus?.penilaian;
                if (pen) {
                    console.log(`Item #${index} (ID: ${item.id})`);
                    console.log(`- Penilaian ID:`, pen.id);
                    console.log(`- Kasus ID:`, item.kasus.id); // Tambahan Log Kasus ID
                    console.log(`- has_formulir_analisis (Raw):`, pen.has_formulir_analisis);
                } else {
                    console.log(`Item #${index} (ID: ${item.id}) - Belum ada Penilaian`);
                }
            });
            console.groupEnd();
            // -------------------------------

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
        // Fetch data saat parameter berubah
        fetchPmpUmk(currentPage, filter, highlightedId);
    }, [currentPage, filter, highlightedId]);
    
    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setCurrentPage(1);
        // Hapus parameter ID jika user mengganti tab manual
        setSearchParams({});
    };

    const handleClearHighlight = () => {
        setSearchParams({}); // Hapus query param ?id=...
        fetchPmpUmk(1, filter, null); // Refresh data normal
    };

    const handleNilai = async (permohonan) => {
        setIsNavigating(permohonan.id);
        setError('');
        try {
            if (permohonan.kasus?.id) {
                navigate(`/penilaian/${permohonan.kasus.id}`);
            } else {
                const response = await api.post(`/penilaian/initiate/${permohonan.id}`);
                const { kasus_id } = response.data;
                navigate(`/penilaian/${kasus_id}`);
            }
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
        if (window.confirm('Apakah Anda yakin ingin menghapus data permohonan ini?')) {
            try {
                await api.delete(`/permohonan-penilaian/${permohonanId}`);
                // Refresh data
                fetchPmpUmk(currentPage, filter, highlightedId);
            } catch (err) {
                setError(err.response?.data?.message || 'Gagal menghapus data. Silakan coba lagi.');
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
                    
                    {/* PERBAIKAN: Tombol hanya muncul jika user adalah Admin */}
                    {user && user.role === 'Admin' && (
                        <button 
                            onClick={() => navigate('/penilaian/tambah')}
                            className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                        >
                            + Tambah Penilaian Baru
                        </button>
                    )}
                </div>

                {/* Tab Filter / Info Highlight */}
                {highlightedId ? (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md flex justify-between items-center">
                        <div>
                            <span className="font-semibold text-blue-800">Mode Filter Notifikasi:</span>
                            <span className="text-blue-600 ml-2">Menampilkan data spesifik.</span>
                        </div>
                        <button 
                            onClick={handleClearHighlight}
                            className="text-sm bg-white border border-blue-300 text-blue-700 px-3 py-1 rounded hover:bg-blue-100"
                        >
                            &larr; Tampilkan Semua Data
                        </button>
                    </div>
                ) : (
                    <div className="border-b border-gray-200 mb-4">
                        <nav className="-mb-px flex space-x-6">
                            <button onClick={() => handleFilterChange('pending')} className={`py-3 px-1 border-b-2 font-medium text-sm ${filter === 'pending' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                Menunggu Penilaian
                            </button>
                            <button onClick={() => handleFilterChange('all')} className={`py-3 px-1 border-b-2 font-medium text-sm ${filter === 'all' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                Semua Permohonan
                            </button>
                        </nav>
                    </div>
                )}
                
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
                                        const tidakTerlaksana = p.status === 'Penilaian Tidak Terlaksana' && p.berita_acara_id;
                                        const isDraft = p.status === 'Draft';
                                        
                                        // Pengecekan Penilaian
                                        const penilaian = p.kasus?.penilaian;
                                        const sudahDinilai = penilaian && !isDraft;
                                        
                                        // Cek ketersediaan dokumen
                                        const baPemeriksaanDibuat = penilaian && (penilaian.ba_pemeriksaan || penilaian.baPemeriksaan);
                                        
                                        // Deteksi Formulir Analisis
                                        const hasFlag = !!penilaian?.has_formulir_analisis;
                                        const hasObjSnake = !!penilaian?.formulir_analisis;
                                        const hasObjCamel = !!penilaian?.formulirAnalisis;
                                        const formulirAnalisisDibuat = penilaian && (hasFlag || hasObjSnake || hasObjCamel);
                                        
                                        // LOGIKA TOMBOL:
                                        const showAnalisisButton = penilaian && baPemeriksaanDibuat;
                                        const showBaHasilButton = penilaian && formulirAnalisisDibuat; 

                                        const editRequest = penilaian?.latest_edit_request || penilaian?.latestEditRequest;
                                        const isEditMode = editRequest && editRequest.status === 'approved';

                                        return (
                                        <tr key={p.id} className={`hover:bg-gray-50 ${highlightedId == p.id ? 'bg-blue-50 ring-2 ring-inset ring-blue-200' : ''}`}>
                                            <td className="py-3 px-4">
                                                <div>{p.pemegang?.nama_pelaku_usaha || '-'}</div>
                                                {isEditMode && (
                                                    <div className="mt-1">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200 animate-pulse">
                                                            Izin Edit Aktif
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 font-mono">{p.pemegang?.nomor_identitas || '-'}</td>
                                            <td className="py-3 px-4"><StatusPenilaianBadge permohonan={p} /></td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {/* Tombol Utama */}
                                                    {!tidakTerlaksana && (
                                                        <button 
                                                            onClick={() => handleNilai(p)} 
                                                            disabled={isNavigating === p.id} 
                                                            className={`font-semibold py-1 px-3 rounded-md text-sm text-white ${isDraft ? 'bg-orange-500' : 'bg-blue-600'} hover:opacity-90`}
                                                        >
                                                            {isNavigating === p.id ? '...' : (isDraft ? 'Lanjut' : (sudahDinilai ? 'Detail' : 'Nilai'))}
                                                        </button>
                                                    )}
                                                    
                                                    {/* BA Pemeriksaan (Lapangan) */}
                                                    {sudahDinilai && !tidakTerlaksana && (
                                                        <button
                                                            onClick={() => navigate(`/penilaian/${p.kasus.id}/berita-acara-pemeriksaan`)}
                                                            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-1 px-3 rounded-md text-sm"
                                                            title="Berita Acara Pemeriksaan Lapangan"
                                                        >
                                                            BA Lapangan
                                                        </button>
                                                    )}

                                                    {/* Formulir Analisis */}
                                                    {showAnalisisButton && (
                                                        <button
                                                            // PERBAIKAN FATAL DI SINI:
                                                            // Sebelumnya: navigate(`/penilaian/${p.kasus.penilaian.id}/formulir-analisis`)
                                                            // Sekarang: Gunakan Kasus ID karena halaman Formulir mengharapkan Kasus ID
                                                            onClick={() => navigate(`/penilaian/${p.kasus.id}/formulir-analisis`)}
                                                            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1 px-3 rounded-md text-sm relative"
                                                        >
                                                            Analisis
                                                            {isEditMode && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>}
                                                        </button>
                                                    )}

                                                    {/* Berita Acara Hasil Penilaian */}
                                                    {showBaHasilButton && (
                                                        <button
                                                            // Note: Halaman BA Hasil sepertinya menggunakan Penilaian ID di controllernya,
                                                            // jadi ini kemungkinan benar, tapi cek jika perlu diganti kasus ID juga.
                                                            onClick={() => navigate(`/penilaian/${p.kasus.penilaian.id}/ba-hasil`)}
                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-3 rounded-md text-sm"
                                                            title="Berita Acara Hasil Penilaian Akhir"
                                                        >
                                                            BA Hasil
                                                        </button>
                                                    )}
                                                    
                                                    {!tidakTerlaksana && canEditDelete && (
                                                        <button onClick={() => handleEdit(p.id)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded-md text-sm">Edit</button>
                                                    )}
                                                    {canEditDelete && (
                                                        <button onClick={() => handleDelete(p.id)} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md text-sm">Hapus</button>
                                                    )}
                                                </div>

                                                {/* --- DEBUGGING VISUAL --- */}
                                                {penilaian && (
                                                    <div className="mt-2 text-[10px] text-gray-500 bg-gray-100 p-2 rounded border border-gray-200 font-mono overflow-hidden">
                                                        <div className="font-bold mb-1 text-red-600">DEBUG MODE</div>
                                                        <div className="grid grid-cols-2 gap-x-2">
                                                            <span>• Has Formulir Flag:</span>
                                                            <span className={hasFlag ? "text-green-600 font-bold" : "text-red-600"}>{hasFlag ? "TRUE" : "FALSE"}</span>
                                                            <span className="col-span-2 border-t mt-1 pt-1 font-semibold text-blue-600">
                                                                Result: {showBaHasilButton ? "SHOW BUTTON" : "HIDE BUTTON"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
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
                    </>
                )}
            </div>
        </div>
    );
}