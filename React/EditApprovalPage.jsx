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
            alasan = prompt("Masukkan alasan penolakan:");
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
            alert('Gagal memproses permohonan.');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="text-center p-8">Memuat permohonan...</div>;

    return (
        <div className="px-4 py-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Persetujuan Edit Formulir</h2>
            
            {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

            {requests.length === 0 ? (
                <div className="bg-white p-8 rounded shadow text-center text-gray-500">
                    Tidak ada permohonan edit yang menunggu persetujuan.
                </div>
            ) : (
                <div className="grid gap-6">
                    {requests.map(req => (
                        <div key={req.id} className="bg-white border rounded-lg shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div className="mb-4 md:mb-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                        Pending
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        {new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Pemohon: {req.user?.nama}
                                </h3>
                                <p className="text-gray-600">
                                    Kasus: <strong>{req.penilaian?.kasus?.pemegang?.nama_pelaku_usaha}</strong> (No: {req.penilaian?.kasus?.nomor_permohonan})
                                </p>
                                <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700 border-l-4 border-blue-400">
                                    <strong>Alasan Edit:</strong> "{req.alasan_permohonan}"
                                </div>
                                <div className="mt-3">
                                    <Link to={`/penilaian/${req.penilaian_id}/formulir-analisis`} target="_blank" className="text-blue-600 hover:underline text-sm">
                                        Lihat Formulir &rarr;
                                    </Link>
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleProcess(req.id, 'reject')}
                                    disabled={processingId === req.id}
                                    className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-4 rounded border border-red-300 transition disabled:opacity-50"
                                >
                                    Tolak Edit
                                </button>
                                <button
                                    onClick={() => handleProcess(req.id, 'approve')}
                                    disabled={processingId === req.id}
                                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow transition disabled:opacity-50"
                                >
                                    Setujui Edit
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}