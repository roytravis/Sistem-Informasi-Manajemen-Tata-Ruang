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

    // Check for Desk Study Tidak Sesuai status
    const sudahDinilai = permohonan.kasus && permohonan.kasus.penilaian;
    if (sudahDinilai) {
        const deskStudy = permohonan.kasus.penilaian.desk_study || [];
        const isDeskStudyTidakSesuai = Array.isArray(deskStudy) && deskStudy.some(item => item.hasil_kesesuaian === 'Tidak Sesuai');

        if (isDeskStudyTidakSesuai) {
            return <span className="py-1 px-3 rounded-full text-xs font-medium bg-red-200 text-red-800">Penilaian Tidak Dapat Dilanjutkan</span>;
        }
    }

    // FIX: Only show "Selesai Dinilai (Verifikasi)" if actual status is "Selesai Dinilai (Verifikasi)"
    // This status is now only set when BA Hasil Penilaian is saved (final stage)
    if (permohonan.status === 'Selesai Dinilai (Verifikasi)') {
        return <span className="py-1 px-3 rounded-full text-xs font-medium bg-teal-200 text-teal-800">Selesai Dinilai (Verifikasi)</span>;
    }

    // For other statuses like 'Menunggu Penilaian', show the status as is
    return <span className="py-1 px-3 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">{permohonan.status || 'Menunggu'}</span>;
};

// KOMPONEN BARU: Modal Tugaskan Tim untuk Ketua Tim
const AssignTeamModal = ({ permohonan, onClose, onSave }) => {
    const [timId, setTimId] = useState(permohonan?.tim_id || '');
    const [koordinatorId, setKoordinatorId] = useState(permohonan?.penanggung_jawab_id || '');
    const [tims, setTims] = useState([]);
    const [koordinators, setKoordinators] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [timRes, userRes] = await Promise.all([
                    api.get('/tims'),
                    api.get('/users')
                ]);
                setTims(timRes.data);
                const koorUsers = userRes.data.filter(u => u.role === 'Koordinator Lapangan');
                setKoordinators(koorUsers);
            } catch (err) {
                setError('Gagal memuat data tim dan koordinator.');
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!timId) {
            setError('Tim Penilai harus dipilih.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.put(`/permohonan-penilaian/${permohonan.id}`, {
                pemegang_id: permohonan.pemegang_id,
                tim_id: timId,
                penanggung_jawab_id: koordinatorId || null
            });
            onSave();
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menugaskan tim.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h3 className="text-xl font-bold mb-4">Tugaskan Tim Penilai</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Permohonan: <strong>{permohonan.pemegang?.nama_pelaku_usaha}</strong>
                    <br />
                    Nomor: {permohonan.nomor_permohonan}
                </p>
                {error && <p className="text-red-500 bg-red-100 p-2 rounded-md mb-4">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tim Penilai *</label>
                        <select value={timId} onChange={(e) => setTimId(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm" required>
                            <option value="">Pilih Tim Penilai</option>
                            {tims.map(tim => (
                                <option key={tim.id} value={tim.id}>{tim.nama_tim}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Koordinator Lapangan (Opsional)</label>
                        <select value={koordinatorId} onChange={(e) => setKoordinatorId(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm">
                            <option value="">Pilih Koordinator Lapangan</option>
                            {koordinators.map(user => (
                                <option key={user.id} value={user.id}>{user.nama}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Batal</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400">
                            {loading ? 'Menyimpan...' : 'Tugaskan Tim'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
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

    // TAMBAHAN: State untuk modal penugasan tim
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [permohonanToAssign, setPermohonanToAssign] = useState(null);

    // Cek Hak Akses Edit/Delete (Hanya Admin dan Ketua Tim)
    const canEditDelete = user && ['Admin', 'Ketua Tim'].includes(user.role);
    // TAMBAHAN: Cek apakah user adalah Ketua Tim untuk penugasan
    const isKetuaTim = user && user.role === 'Ketua Tim';

    // Helper function to check if user is authorized for this assessment
    const isUserAuthorized = (permohonan) => {
        if (!user) return false;

        // Admin can access everything
        if (user.role === 'Admin') return true;

        // PERBAIKAN: Allow public read-only access if assessment is finalized
        // Check both permohonan.status and kasus.status for robustness
        const isFinalized = permohonan.status === 'Selesai Dinilai (Verifikasi)' ||
            permohonan.kasus?.status === 'Selesai Dinilai (Verifikasi)';

        if (isFinalized && ['Koordinator Lapangan', 'Ketua Tim', 'Petugas Lapangan'].includes(user.role)) {
            return true;
        }

        // Check if user is the coordinator (penanggung jawab)
        if (permohonan.penanggung_jawab_id === user.id) return true;

        // Check if user is in the assigned team
        if (permohonan.tim && permohonan.tim.users) {
            return permohonan.tim.users.some(member => member.id === user.id);
        }

        return false;
    };

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

    // TAMBAHAN: Handler untuk membuka modal penugasan tim
    const handleOpenAssignModal = (permohonan) => {
        setPermohonanToAssign(permohonan);
        setShowAssignModal(true);
    };

    // TAMBAHAN: Handler setelah penugasan berhasil
    const handleAssignSuccess = () => {
        setShowAssignModal(false);
        fetchPmpUmk(currentPage, filter, highlightedId);
    };

    return (
        <div className="px-4 py-6 sm:px-0">
            {/* TAMBAHAN: Render modal penugasan */}
            {showAssignModal && <AssignTeamModal permohonan={permohonanToAssign} onClose={() => setShowAssignModal(false)} onSave={handleAssignSuccess} />}

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
                            + Tambah Permohonan Baru
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

                                        // Deteksi Formulir Analisis (Safe Check)
                                        const hasFlag = !!penilaian?.has_formulir_analisis;
                                        const hasObjSnake = !!penilaian?.formulir_analisis;
                                        const hasObjCamel = !!penilaian?.formulirAnalisis;
                                        const formulirAnalisisDibuat = penilaian && (hasFlag || hasObjSnake || hasObjCamel);

                                        // Helper to check if all team signatures are complete for a stage
                                        const areAllSignaturesComplete = (signaturesArray, teamUsers) => {
                                            if (!signaturesArray || !Array.isArray(signaturesArray) || !teamUsers || teamUsers.length === 0) return false;
                                            // Check if all team member IDs have signatures
                                            const signedUserIds = signaturesArray.map(sig => sig.user_id);
                                            return teamUsers.every(member => signedUserIds.includes(member.id));
                                        };

                                        const deskStudy = penilaian?.desk_study || [];
                                        // Desk Study dianggap tidak sesuai jika ada setidaknya satu item yang 'Tidak Sesuai'
                                        // Pastikan deskStudy adalah array sebelum melakukan .some()
                                        const isDeskStudyTidakSesuai = Array.isArray(deskStudy) && deskStudy.some(item => item.hasil_kesesuaian === 'Tidak Sesuai');

                                        // Check signature completion for each stage
                                        // For FORMULIR PEMERIKSAAN, only Petugas Lapangan need to sign
                                        const petugasLapanganOnly = p.tim?.users?.filter(u => u.pivot?.jabatan_di_tim === 'Petugas Lapangan') || [];
                                        const formulirSignaturesComplete = areAllSignaturesComplete(penilaian?.tanda_tangan_tim, petugasLapanganOnly);

                                        // For BA Lapangan, check team signatures AND pemegang + koordinator signatures
                                        const allTeamMembers = p.tim?.users || [];
                                        const baLapanganTeamSignaturesComplete = penilaian?.ba_pemeriksaan?.tanda_tangan_tim ?
                                            areAllSignaturesComplete(penilaian.ba_pemeriksaan.tanda_tangan_tim, petugasLapanganOnly) : false;
                                        const baLapanganPemegangSigned = !!penilaian?.ba_pemeriksaan?.tanda_tangan_pemegang;
                                        const baLapanganKoordinatorSigned = !!penilaian?.ba_pemeriksaan?.tanda_tangan_koordinator;
                                        // BA Lapangan is complete only when all signatures are present
                                        const baLapanganSignaturesComplete = baLapanganTeamSignaturesComplete && baLapanganPemegangSigned && baLapanganKoordinatorSigned;

                                        // For FORMULIR ANALISIS, ALL team members (Koordinator, Ketua Tim, Petugas) need to sign
                                        const analisisSignaturesComplete = penilaian?.formulir_analisis?.tanda_tangan_tim ?
                                            areAllSignaturesComplete(penilaian.formulir_analisis.tanda_tangan_tim, allTeamMembers) : false;

                                        // Check if assessment is finalized
                                        const isFinalized = p.status === 'Selesai Dinilai (Verifikasi)' || p.kasus?.status === 'Selesai Dinilai (Verifikasi)';

                                        // LOGIKA TOMBOL: Buttons show when signatures complete OR when finalized (for viewing)
                                        const showBaLapanganButton = (formulirSignaturesComplete && !isDeskStudyTidakSesuai) || (isFinalized && baPemeriksaanDibuat);
                                        const showAnalisisButton = (formulirSignaturesComplete && baLapanganSignaturesComplete && baPemeriksaanDibuat) || (isFinalized && formulirAnalisisDibuat);
                                        const showBaHasilButton = (formulirSignaturesComplete && baLapanganSignaturesComplete && analisisSignaturesComplete && formulirAnalisisDibuat) || (isFinalized && penilaian?.ba_hasil_penilaian);

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
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-col gap-1">
                                                        <StatusPenilaianBadge permohonan={p} />
                                                        {/* TAMBAHAN: Indikator jika belum ditugaskan */}
                                                        {!p.tim_id && (
                                                            <span className="py-1 px-2 rounded text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                                                ⏳ Belum Ditugaskan
                                                            </span>
                                                        )}
                                                        {p.tim_id && (
                                                            <span className="text-xs text-gray-600">
                                                                Tim: {p.tim?.nama_tim || 'N/A'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {/* TAMBAHAN: Tombol Tugaskan Tim untuk Ketua Tim jika belum ditugaskan */}
                                                        {!p.tim_id && isKetuaTim && (
                                                            <button
                                                                onClick={() => handleOpenAssignModal(p)}
                                                                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-md text-sm flex items-center gap-1"
                                                                title="Tugaskan Tim Penilai dan Koordinator"
                                                            >
                                                                <span>🔔</span> Tugaskan Tim
                                                            </button>
                                                        )}

                                                        {/* Tombol Utama - hanya tampil jika sudah ditugaskan dan user memiliki akses */}
                                                        {!tidakTerlaksana && p.tim_id && isUserAuthorized(p) && (
                                                            <button
                                                                onClick={() => handleNilai(p)}
                                                                disabled={isNavigating === p.id}
                                                                className={`font-semibold py-1 px-3 rounded-md text-sm text-white ${isDraft ? 'bg-orange-500' : 'bg-blue-600'} hover:opacity-90`}
                                                            >
                                                                {isNavigating === p.id ? '...' : (isDraft ? 'Lanjut' : (sudahDinilai ? 'Detail' : 'Nilai'))}
                                                            </button>
                                                        )}

                                                        {/* Show locked indicator for unauthorized users */}
                                                        {!tidakTerlaksana && p.tim_id && !isUserAuthorized(p) && (
                                                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                </svg>
                                                                <span>Tidak ada akses</span>
                                                            </div>
                                                        )}

                                                        {/* BA Pemeriksaan (Lapangan) */}
                                                        {/* FIX: Hanya tampilkan jika semua tanda tangan di Formulir selesai dan user punya akses */}
                                                        {showBaLapanganButton && !tidakTerlaksana && isUserAuthorized(p) && (
                                                            <button
                                                                onClick={() => navigate(`/penilaian/${p.kasus.id}/berita-acara-pemeriksaan`, {
                                                                    state: { isExisting: !!baPemeriksaanDibuat }
                                                                })}
                                                                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-1 px-3 rounded-md text-sm"
                                                                title="Berita Acara Pemeriksaan Lapangan"
                                                            >
                                                                BA Lapangan
                                                            </button>
                                                        )}

                                                        {/* TOMBOL BARU: Detail Berita Acara (Untuk Penilaian Tidak Terlaksana) */}
                                                        {tidakTerlaksana && (
                                                            <button
                                                                onClick={() => navigate(`/penilaian/berita-acara/${p.berita_acara_id}/preview`)}
                                                                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-1 px-3 rounded-md text-sm"
                                                                title="Lihat Berita Acara Tidak Terlaksana"
                                                            >
                                                                Detail BA
                                                            </button>
                                                        )}

                                                        {/* Formulir Analisis */}
                                                        {showAnalisisButton && isUserAuthorized(p) && (
                                                            <button
                                                                onClick={() => navigate(`/penilaian/${p.kasus.id}/formulir-analisis`)}
                                                                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1 px-3 rounded-md text-sm relative"
                                                            >
                                                                Analisis
                                                                {isEditMode && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>}
                                                            </button>
                                                        )}

                                                        {/* Berita Acara Hasil Penilaian */}
                                                        {showBaHasilButton && isUserAuthorized(p) && (
                                                            <button
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