import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext';

const VerifikasiModal = ({ onClose, onVerify, loading }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800">Verifikasi Hasil Penilaian</h3>
            <p className="text-sm text-gray-600 mt-2">Pilih hasil penilaian untuk kasus ini. Status akan diperbarui secara permanen.</p>
            <div className="mt-6 flex justify-end space-x-3">
                <button onClick={() => onVerify('Tidak Patuh')} disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-400">
                    Tidak Sesuai (Tidak Patuh)
                </button>
                <button onClick={() => onVerify('Patuh')} disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-400">
                    Sesuai (Patuh)
                </button>
            </div>
             <div className="mt-4 text-center">
                <button onClick={onClose} disabled={loading} className="text-sm text-gray-600 hover:underline">Batal</button>
            </div>
        </div>
    </div>
);


const DetailItem = ({ label, value }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{value || '-'}</dd>
    </div>
);

export default function KasusDetailPage() {
    const { id } = useParams();
    const [kasus, setKasus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showVerifikasiModal, setShowVerifikasiModal] = useState(false);
    const [verifikasiLoading, setVerifikasiLoading] = useState(false);

    const { user } = useAuth();
    const navigate = useNavigate();

    const fetchKasusDetail = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get(`/kasus/${id}`);
            setKasus(response.data);
        } catch (err) {
            setError('Gagal memuat detail kasus. Mungkin data tidak ditemukan.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKasusDetail();
    }, [id]);

    const handleDelete = async () => {
        if (confirm('Apakah Anda yakin ingin menghapus kasus ini secara permanen?')) {
            try {
                await api.delete(`/kasus/${id}`);
                navigate('/dashboard');
            } catch (err) {
                setError('Gagal menghapus kasus. Anda mungkin tidak memiliki izin.');
            }
        }
    };
    
    const handleVerifikasi = async (hasil) => {
        setVerifikasiLoading(true);
        setError('');
        try {
            await api.post(`/kasus/${id}/verifikasi`, { hasil });
            setShowVerifikasiModal(false);
            fetchKasusDetail(); 
        } catch (err) {
            setError('Gagal melakukan verifikasi. Coba lagi nanti.');
        } finally {
            setVerifikasiLoading(false);
        }
    };


    if (loading) return <div className="text-center py-10">Memuat detail kasus...</div>;
    if (error) return <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>;
    if (!kasus) return <div className="text-center py-10">Data kasus tidak ditemukan.</div>;

    // PERUBAHAN: 'Penanggung Jawab' diubah menjadi 'Koordinator Lapangan'
    const canModify = user && ['Admin', 'Koordinator Lapangan', 'Ketua Tim'].includes(user.role);
    const canVerify = canModify && ['Survei Selesai', 'Menunggu Penilaian'].includes(kasus.status);
    const { penilaian, pemegang } = kasus;
    const fullAlamat = [pemegang?.alamat, pemegang?.desa_kelurahan, pemegang?.kecamatan].filter(Boolean).join(', ');


    return (
        <div>
            {showVerifikasiModal && <VerifikasiModal onClose={() => setShowVerifikasiModal(false)} onVerify={handleVerifikasi} loading={verifikasiLoading} />}
            
            <div className="mb-4">
                <Link to="/dashboard" className="text-blue-600 hover:underline">&larr; Kembali ke Dashboard</Link>
            </div>

            <div className="bg-white shadow-lg overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b flex justify-between items-center flex-wrap gap-2">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Detail Kasus #{kasus.nomor_permohonan}</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">Informasi lengkap mengenai kasus dan pemegang.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {user && user.role === 'Petugas Lapangan' && (
                             <button onClick={() => navigate(`/kasus/${id}/survei`)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-md text-sm">Mulai Survei</button>
                        )}
                        {canModify && (
                            <>
                                <button onClick={() => navigate(`/kasus/${id}/edit`)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 rounded-md text-sm">Edit</button>
                                <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-md text-sm">Hapus</button>
                            </>
                        )}
                    </div>
                </div>
                <div className="border-t border-gray-200">
                    <dl className="divide-y divide-gray-200">
                        <div className="px-4 py-3 bg-gray-50 font-semibold text-gray-700 text-sm">Informasi Kasus</div>
                        <div className="px-4">
                            <DetailItem label="Jenis Permohonan" value={kasus.jenis} />
                            <DetailItem label="Status" value={kasus.status} />
                            <DetailItem label="Skor Prioritas" value={kasus.prioritas_score} />
                            <DetailItem label="Tim Penilai" value={kasus.tim?.nama_tim} />
                            {/* PERUBAHAN: Label diubah */}
                            <DetailItem label="Koordinator Lapangan" value={kasus.penanggung_jawab?.nama} />
                        </div>
                        
                        <div className="px-4 py-3 bg-gray-50 font-semibold text-gray-700 text-sm">Informasi Pelaku Usaha</div>
                         <div className="px-4">
                            <DetailItem label="Nama Pelaku Usaha" value={pemegang?.nama_pelaku_usaha} />
                            <DetailItem label="Nomor Identitas" value={pemegang?.nomor_identitas} />
                            <DetailItem label="Kegiatan" value={pemegang?.kegiatan} />
                            <DetailItem label="Alamat Lengkap" value={fullAlamat} />
                        </div>

                        {penilaian && (
                            <>
                                <div className="px-4 py-3 bg-gray-50 font-semibold text-gray-700 text-sm">Hasil Penilaian</div>
                                <div className="px-4">
                                    <DetailItem label="Tanggal Penilaian" value={new Date(penilaian.updated_at).toLocaleDateString('id-ID')} />
                                    <DetailItem label="Penilai" value={penilaian.penilai?.nama} />
                                    <DetailItem label="Kesesuaian Lokasi" value={penilaian.hasil_pemeriksaan?.kesesuaian_lokasi} />
                                    <DetailItem label="Kesesuaian Jenis Kegiatan" value={penilaian.hasil_pemeriksaan?.kesesuaian_jenis_kegiatan} />
                                    <DetailItem label="Kesimpulan" value={penilaian.kesimpulan} />
                                    <DetailItem label="Catatan" value={penilaian.catatan} />
                                </div>
                            </>
                        )}

                        <div className="px-4 py-3 bg-gray-50 font-semibold text-gray-700 text-sm">Riwayat Survei</div>
                        <div className="px-4 py-4">
                             {kasus.surveis && kasus.surveis.length > 0 ? (
                                <ul className="list-disc pl-5 space-y-2">
                                    {kasus.surveis.map(survei => (
                                        <li key={survei.id} className="text-sm text-gray-700">
                                            Survei pada {new Date(survei.tanggal_survey).toLocaleDateString('id-ID')} oleh: <strong>{survei.petugas?.nama || 'N/A'}</strong>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500">Belum ada data survei untuk kasus ini.</p>
                            )}
                        </div>
                    </dl>
                </div>
                 <div className="px-4 py-4 bg-gray-50 border-t flex justify-between items-center">
                    <div>
                        {canVerify && (
                            <button onClick={() => setShowVerifikasiModal(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md">
                                Verifikasi Penilaian
                            </button>
                        )}
                    </div>
                    
                    <button onClick={() => navigate(`/kasus/${id}/laporan`)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md">
                        Generate Laporan
                    </button>
                </div>
            </div>
        </div>
    );
}

