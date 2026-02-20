import { useState, useEffect } from 'react';
import api from '../api/axios';

// Komponen Modal untuk Tambah/Edit Tim
const TimFormModal = ({ timToEdit, onClose, onSave }) => {
    const [nama_tim, setNamaTim] = useState('');
    const [deskripsi, setDeskripsi] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (timToEdit) {
            setNamaTim(timToEdit.nama_tim);
            setDeskripsi(timToEdit.deskripsi || '');
        } else {
            setNamaTim('');
            setDeskripsi('');
        }
    }, [timToEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const payload = { nama_tim, deskripsi };
            if (timToEdit) {
                await api.put(`/tims/${timToEdit.id}`, payload);
            } else {
                await api.post('/tims', payload);
            }
            onSave();
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan tim.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h3 className="text-xl font-bold mb-4">{timToEdit ? 'Edit Tim' : 'Tambah Tim Baru'}</h3>
                {error && <p className="text-red-500 bg-red-100 p-2 rounded-md mb-4">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="nama_tim" className="block text-sm font-medium text-gray-700">Nama Tim</label>
                        <input type="text" id="nama_tim" value={nama_tim} onChange={(e) => setNamaTim(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="deskripsi" className="block text-sm font-medium text-gray-700">Deskripsi</label>
                        <textarea id="deskripsi" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" rows="3"></textarea>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Batal</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400">
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Komponen Modal untuk Kelola Anggota Tim
const ManageMembersModal = ({ tim, onClose, onSave }) => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [jabatan, setJabatan] = useState('Petugas Lapangan');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/users').then(res => {
            // PERUBAHAN: Menambahkan 'Koordinator Lapangan' ke filter pengguna yang bisa ditambahkan
            const filteredUsers = res.data.filter(u => ['Ketua Tim', 'Petugas Lapangan', 'Koordinator Lapangan'].includes(u.role));
            setUsers(filteredUsers);
        });
    }, []);

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!selectedUser) {
            setError('Pilih anggota terlebih dahulu.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.post(`/tims/${tim.id}/members`, { user_id: selectedUser, jabatan_di_tim: jabatan });
            onSave();
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menambahkan anggota.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (userId) => {
        setLoading(true);
        setError('');
        try {
            await api.delete(`/tims/${tim.id}/members`, { data: { user_id: userId } });
            onSave();
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menghapus anggota.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <h3 className="text-xl font-bold mb-4">Kelola Anggota: {tim.nama_tim}</h3>
                {error && <p className="text-red-500 bg-red-100 p-2 rounded-md mb-4">{error}</p>}
                
                {/* Form Tambah Anggota */}
                <form onSubmit={handleAddMember} className="flex items-end gap-2 mb-6 p-4 border rounded-md">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium text-gray-700">Anggota Baru</label>
                        <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                            <option value="">Pilih Pengguna</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.nama} ({user.role})</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Jabatan</label>
                        <select value={jabatan} onChange={(e) => setJabatan(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                            <option value="Ketua Tim">Ketua Tim</option>
                            <option value="Petugas Lapangan">Petugas Lapangan</option>
                            {/* PENAMBAHAN: Opsi untuk Koordinator Lapangan */}
                            <option value="Koordinator Lapangan">Koordinator Lapangan</option>
                        </select>
                    </div>
                    <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 h-10">Tambah</button>
                </form>

                {/* Daftar Anggota */}
                <h4 className="font-semibold mb-2">Anggota Saat Ini:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {tim.users && tim.users.length > 0 ? tim.users.map(user => (
                        <div key={user.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                            <div>
                                <p className="font-semibold">{user.nama}</p>
                                <p className="text-sm text-gray-600">{user.pivot.jabatan_di_tim}</p>
                            </div>
                            <button onClick={() => handleRemoveMember(user.id)} className="text-red-500 hover:text-red-700">Hapus</button>
                        </div>
                    )) : <p className="text-gray-500">Belum ada anggota.</p>}
                </div>

                <div className="flex justify-end mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Tutup</button>
                </div>
            </div>
        </div>
    );
};


export default function TimPenilaiPage() {
    const [tims, setTims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // State untuk modal
    const [showTimModal, setShowTimModal] = useState(false);
    const [timToEdit, setTimToEdit] = useState(null);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [timToManage, setTimToManage] = useState(null);


    const fetchTims = async () => {
        setLoading(true);
        try {
            const response = await api.get('/tims');
            setTims(response.data);
        } catch (err) {
            setError('Gagal memuat data tim.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTims();
    }, []);

    const handleDelete = async (timId) => {
        if (confirm('Yakin ingin menghapus tim ini?')) {
            try {
                await api.delete(`/tims/${timId}`);
                fetchTims();
            } catch (err) {
                setError('Gagal menghapus tim.');
            }
        }
    };
    
    // Handler untuk membuka modal
    const handleOpenTimModal = (tim = null) => {
        setTimToEdit(tim);
        setShowTimModal(true);
    };

    const handleOpenMemberModal = (tim) => {
        setTimToManage(tim);
        setShowMemberModal(true);
    };
    
    // Handler untuk menyimpan dan menutup modal
    const handleSaveAndClose = () => {
        setShowTimModal(false);
        setShowMemberModal(false);
        fetchTims();
    };

    if (loading) return <p>Memuat...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div>
            {showTimModal && <TimFormModal timToEdit={timToEdit} onClose={() => setShowTimModal(false)} onSave={handleSaveAndClose} />}
            {showMemberModal && <ManageMembersModal tim={timToManage} onClose={() => setShowMemberModal(false)} onSave={handleSaveAndClose} />}
            
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Manajemen Tim Penilai</h1>
                <button onClick={() => handleOpenTimModal()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                    + Tambah Tim Baru
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tims.map(tim => (
                    <div key={tim.id} className="bg-white p-6 rounded-lg shadow-md flex flex-col">
                        <h3 className="text-xl font-bold mb-2">{tim.nama_tim}</h3>
                        <p className="text-gray-600 mb-4 flex-grow">{tim.deskripsi || 'Tidak ada deskripsi.'}</p>
                        
                        <div className="mb-4">
                            <h4 className="font-semibold text-sm mb-2">Anggota:</h4>
                            <ul className="list-disc pl-5 text-sm">
                                {tim.users.map(user => (
                                    <li key={user.id}>
                                        {user.nama} <span className="text-gray-500">({user.pivot.jabatan_di_tim})</span>
                                    </li>
                                ))}
                                {tim.users.length === 0 && <li className="text-gray-400">Belum ada anggota</li>}
                            </ul>
                        </div>

                        <div className="mt-auto pt-4 border-t flex flex-wrap gap-2">
                            <button onClick={() => handleOpenMemberModal(tim)} className="bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-1 px-3 rounded">Kelola Anggota</button>
                            <button onClick={() => handleOpenTimModal(tim)} className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold py-1 px-3 rounded">Edit</button>
                            <button onClick={() => handleDelete(tim.id)} className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-1 px-3 rounded">Hapus</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

