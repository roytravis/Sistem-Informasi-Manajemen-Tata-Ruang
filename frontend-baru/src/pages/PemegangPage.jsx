import { useState, useEffect } from 'react';
import api from '../api/axios.js';

// Komponen Form Input Reusable
// PENAMBAHAN: Menambahkan prop `type` agar bisa diatur (misal: 'email', 'text')
const FormInput = ({ label, name, value, onChange, type = 'text', required = false }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
    </div>
);


const PemegangFormModal = ({ pemegangToEdit, onClose, onSave }) => {
    // PERBARUI: State disesuaikan dengan struktur data baru
    const [formData, setFormData] = useState({
        nama_pelaku_usaha: '',
        nomor_identitas: '',
        kegiatan: '',
        alamat: '',
        desa_kelurahan: '',
        kecamatan: '',
        email: '',
        nomor_handphone: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Definisikan struktur data awal yang bersih
        const initialState = {
            nama_pelaku_usaha: '',
            nomor_identitas: '',
            kegiatan: '',
            alamat: '',
            desa_kelurahan: '',
            kecamatan: '',
            email: '',
            nomor_handphone: '',
        };

        if (pemegangToEdit) {
            // Jika sedang mengedit, gabungkan data yang ada dengan struktur awal
            // untuk memastikan semua field ada
            setFormData({ ...initialState, ...pemegangToEdit });
        } else {
            // Jika menambah baru, gunakan struktur awal
            setFormData(initialState);
        }
    }, [pemegangToEdit]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (pemegangToEdit) {
                await api.put(`/pemegangs/${pemegangToEdit.id}`, formData);
            } else {
                await api.post('/pemegangs', formData);
            }
            onSave();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
                <h3 className="text-xl font-bold text-gray-800 mb-6">{pemegangToEdit ? 'Edit' : 'Tambah'} Pemegang Usaha</h3>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
                
                {/* PERBARUI: Struktur formulir diubah total */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormInput label="Nama Pelaku Usaha" name="nama_pelaku_usaha" value={formData.nama_pelaku_usaha} onChange={handleChange} required />
                    <FormInput label="Nomor Identitas Pelaku Usaha" name="nomor_identitas" value={formData.nomor_identitas} onChange={handleChange} required />
                    <FormInput label="Kegiatan Pemanfaatan Ruang" name="kegiatan" value={formData.kegiatan} onChange={handleChange} required />

                    {/* PENAMBAHAN: Field untuk Email dan Nomor Handphone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput label="Email (Opsional)" name="email" type="email" value={formData.email} onChange={handleChange} />
                        <FormInput label="Nomor Handphone (Opsional)" name="nomor_handphone" value={formData.nomor_handphone} onChange={handleChange} />
                    </div>

                    <fieldset className="border p-4 rounded-md mt-4">
                        <legend className="text-sm font-medium text-gray-700 px-1">Lokasi Kegiatan Pemanfaatan Ruang</legend>
                        <div className="space-y-4 pt-2">
                             <FormInput label="Alamat" name="alamat" value={formData.alamat} onChange={handleChange} required />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput label="Desa/Kelurahan" name="desa_kelurahan" value={formData.desa_kelurahan} onChange={handleChange} required />
                                <FormInput label="Kecamatan" name="kecamatan" value={formData.kecamatan} onChange={handleChange} required />
                            </div>
                        </div>
                    </fieldset>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition">Batal</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition">
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function PemegangPage() {
    const [pemegangs, setPemegangs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [pemegangToEdit, setPemegangToEdit] = useState(null);

    const fetchPemegangs = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/pemegangs');
            setPemegangs(response.data.data);
        } catch (err) {
            setError('Gagal memuat data pemegang usaha. Pastikan API backend berjalan.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPemegangs();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
            try {
                await api.delete(`/pemegangs/${id}`);
                fetchPemegangs();
            } catch (err) {
                setError('Gagal menghapus data. Periksa kembali koneksi atau izin Anda.');
            }
        }
    };

    const handleEdit = (pemegang) => {
        setPemegangToEdit(pemegang);
        setShowModal(true);
    };

    return (
        <div className="px-4 py-6 sm:px-0">
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="sm:flex sm:justify-between sm:items-center mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Manajemen Pemegang Usaha</h2>
                        <p className="mt-1 text-gray-600">Kelola daftar pemegang usaha di sini.</p>
                    </div>
                    <button 
                        onClick={() => {setPemegangToEdit(null); setShowModal(true);}}
                        className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300"
                    >
                        + Tambah Pemegang Usaha
                    </button>
                </div>
                
                {error && <p className="text-red-500 p-3 bg-red-100 rounded-md">{error}</p>}
                {loading && <p className="text-center py-4">Memuat data pemegang usaha...</p>}

                {!loading && !error && (
                    <div className="overflow-x-auto">
                        {/* PERBARUI: Struktur tabel disesuaikan */}
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Nama Pelaku Usaha</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Nomor Identitas</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Kegiatan</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 divide-y divide-gray-200">
                                {pemegangs.length > 0 ? pemegangs.map(pemegang => (
                                    <tr key={pemegang.id} className="hover:bg-gray-50 transition duration-150">
                                        <td className="py-3 px-4">{pemegang.nama_pelaku_usaha}</td>
                                        <td className="py-3 px-4">{pemegang.nomor_identitas}</td>
                                        <td className="py-3 px-4">{pemegang.kegiatan}</td>
                                        <td className="py-3 px-4">
                                            <button onClick={() => handleEdit(pemegang)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded-md text-sm mr-2">
                                                Edit
                                            </button>
                                            <button onClick={() => handleDelete(pemegang.id)} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md text-sm">
                                                Hapus
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-10 text-gray-500">Tidak ada data pemegang usaha.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {showModal && (
                <PemegangFormModal
                    pemegangToEdit={pemegangToEdit}
                    onClose={() => setShowModal(false)}
                    onSave={fetchPemegangs}
                />
            )}
        </div>
    );
}
