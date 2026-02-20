import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';

export default function EditApprovalPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processingId, setProcessingId] = useState(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await api.get('/edit-requests/pending');
            setRequests(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memuat daftar permohonan.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleProcess = async (id, action) => {
        let alasan = null;
        if (action === 'reject') {
            alasan = prompt("Masukkan alasan penolakan untuk user:");
            if (!alasan) return; // Batal jika kosong
        }

        if (!confirm(`Apakah Anda yakin ingin ${action === 'approve' ? 'MENYETUJUI' : 'MENOLAK'} permohonan ini?`)) return;

        setProcessingId(id);
        try {
            await api.post(`/edit-requests/${id}/process`, {
                action,
                alasan_penolakan: alasan
            });
            alert(`Permohonan berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}.`);
            // Refresh list
            setRequests(prev => prev.filter(req => req.id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal memproses permohonan.');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="text-center p-10 text-gray-500">Memuat permohonan...</div>;

    return (
        <div className="px-4 py-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Persetujuan Edit Formulir</h2>
                <button onClick={fetchRequests} className="text-blue-600 hover:underline text-sm">Refresh Data</button>
            </div>
            
            {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4 shadow-sm">{error}</div>}

            {requests.length === 0 ? (
                <div className="bg-white p-12 rounded-lg shadow-md text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p className="text-gray-500 text-lg">Tidak ada permohonan edit yang menunggu persetujuan.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {requests.map(req => (
                        <div key={req.id} className="bg-white border-l-4 border-blue-500 rounded-r-lg shadow-sm p-5 hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded uppercase">Pending</span>
                                        <span className="text-xs text-gray-500">
                                            Diajukan: {new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    
                                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                        <div>
                                            <p className="text-gray-600">Pemohon:</p>
                                            <p className="font-semibold text-gray-900 text-base">{req.user?.nama}</p>
                                            <p className="text-xs text-gray-500">{req.user?.role}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Data Kasus:</p>
                                            <p className="font-semibold text-gray-900">{req.penilaian?.kasus?.pemegang?.nama_pelaku_usaha || 'N/A'}</p>
                                            <p className="text-xs text-gray-500">No. Permohonan: {req.penilaian?.kasus?.nomor_permohonan || '-'}</p>
                                        </div>
                                    </div>

                                    <div className="mt-3 bg-gray-50 p-3 rounded text-sm border border-gray-100">
                                        <p className="font-semibold text-gray-700 mb-1">Alasan Permohonan:</p>
                                        <p className="text-gray-800 italic">"{req.alasan_permohonan}"</p>
                                    </div>

                                    <div className="mt-3">
                                        <Link 
                                            to={`/penilaian/${req.penilaian_id}/formulir-analisis`} 
                                            target="_blank" 
                                            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                                        >
                                            Lihat Formulir Saat Ini
                                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                        </Link>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-2 md:mt-0">
                                    <button
                                        onClick={() => handleProcess(req.id, 'reject')}
                                        disabled={processingId === req.id}
                                        className="px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-md font-medium text-sm transition-colors disabled:opacity-50"
                                    >
                                        Tolak
                                    </button>
                                    <button
                                        onClick={() => handleProcess(req.id, 'approve')}
                                        disabled={processingId === req.id}
                                        className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md font-medium text-sm shadow-sm transition-colors disabled:bg-green-400"
                                    >
                                        {processingId === req.id ? 'Memproses...' : 'Setujui Edit'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}