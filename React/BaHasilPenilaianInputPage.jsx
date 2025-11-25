import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import api from '../api/axios.js';

export default function BaHasilPenilaianInputPage() {
    const { id: penilaianId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const sigRefs = useRef({});

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Cek apakah sedang dalam mode edit dari URL query parameter (?edit=true)
    const isEditMode = new URLSearchParams(location.search).get('edit') === 'true';

    // State Form
    const [formData, setFormData] = useState({
        nomor_ba: '', // Menyimpan nomor BA jika ada
        tanggal_ba: new Date().toISOString().split('T')[0], // Default hari ini
        validitas_kegiatan: '',
        rekomendasi_lanjutan: '',
        existingSignatures: {}, // Menyimpan path TTD lama: { userId: path }
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/ba-hasil-penilaian/${penilaianId}`);
                const result = response.data;
                setData(result);
                
                // Logika Redirect:
                // Jika data sudah ada DAN BUKAN mode edit, redirect ke preview.
                // Jika mode edit, biarkan di halaman ini dan pre-fill data.
                if (result.ba_hasil_penilaian && !isEditMode) {
                    navigate(`/penilaian/${penilaianId}/ba-hasil/preview`, { replace: true });
                    return;
                }

                // Pre-fill form jika data ada (Mode Edit atau data parsial)
                if (result.ba_hasil_penilaian) {
                    const ba = result.ba_hasil_penilaian;
                    
                    // Mapping TTD lama
                    const signaturesMap = {};
                    if (ba.tanda_tangan_tim && Array.isArray(ba.tanda_tangan_tim)) {
                        // Kita perlu mencocokkan user dari tim dengan signature yang tersimpan
                        // Karena di DB tersimpan nama/role, kita perlu mapping balik ke ID jika memungkinkan,
                        // atau backend mengirim struktur yang memiliki user_id (tergantung implementasi controller save).
                        // Di controller 'store', kita menyimpan array objek dengan role, nama, nip, jabatan, signature_path.
                        // Kita perlu mencocokkan berdasarkan NIP atau Nama untuk mengetahui milik siapa TTD tersebut.
                        
                        // Ambil data tim dari response
                        const timMembers = getTimMembersFromData(result);
                        
                        timMembers.forEach(member => {
                            // Cari TTD yang cocok dengan member ini (misal berdasarkan NIP atau Nama)
                            const foundSig = ba.tanda_tangan_tim.find(s => s.nip === member.nip && s.nama === member.nama);
                            if (foundSig && foundSig.signature_path) {
                                signaturesMap[member.id] = foundSig.signature_path;
                            }
                        });
                    }

                    setFormData({
                        nomor_ba: ba.nomor_ba || '',
                        tanggal_ba: ba.tanggal_ba,
                        validitas_kegiatan: ba.validitas_kegiatan,
                        rekomendasi_lanjutan: ba.rekomendasi_lanjutan,
                        existingSignatures: signaturesMap
                    });
                }

            } catch (err) {
                setError(err.response?.data?.message || 'Gagal memuat data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [penilaianId, navigate, isEditMode]);

    // Helper internal untuk mengambil member dari data mentah (karena state 'data' mungkin belum di-set saat useEffect jalan)
    const getTimMembersFromData = (apiData) => {
        if (!apiData) return [];
        const members = [];
        const { kasus } = apiData;
        
        // 1. Petugas Lapangan
        const petugas = kasus.tim?.users?.filter(u => u.pivot?.jabatan_di_tim === 'Petugas Lapangan') || [];
        petugas.forEach(p => members.push({ ...p, role_display: 'Petugas Lapangan', jabatan: 'Petugas Lapangan' }));

        // 2. Koordinator Lapangan
        if (kasus.penanggung_jawab) {
            members.push({ ...kasus.penanggung_jawab, role_display: 'Koordinator Lapangan', jabatan: 'Koordinator Lapangan' });
        }

        // 3. Ketua Tim
        const ketua = kasus.tim?.users?.find(u => u.pivot?.jabatan_di_tim === 'Ketua Tim');
        if (ketua) {
            members.push({ ...ketua, role_display: 'Ketua Tim', jabatan: 'Ketua Tim' });
        }

        return members;
    };

    // Helper untuk render (menggunakan state 'data')
    const getTimMembers = () => getTimMembersFromData(data);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        // Validasi Tanda Tangan
        const signaturesPayload = [];
        const timMembers = getTimMembers();
        let missingSig = false;

        timMembers.forEach(member => {
            const ref = sigRefs.current[member.id];
            const existingPath = formData.existingSignatures[member.id];
            
            // Cek apakah ada tanda tangan baru di canvas
            const hasNewSig = ref && !ref.isEmpty();
            // Cek apakah ada tanda tangan lama
            const hasExistingSig = !!existingPath;

            if (hasNewSig) {
                // Prioritas: Gunakan TTD baru jika ada
                signaturesPayload.push({
                    role: member.role_display,
                    nama: member.nama,
                    nip: member.nip,
                    jabatan: member.jabatan,
                    signature_data: ref.toDataURL() // Kirim base64 baru
                });
            } else if (hasExistingSig) {
                // Fallback: Gunakan path TTD lama
                signaturesPayload.push({
                    role: member.role_display,
                    nama: member.nama,
                    nip: member.nip,
                    jabatan: member.jabatan,
                    existing_path: existingPath // Kirim path lama agar controller tidak perlu upload ulang
                });
            } else {
                missingSig = true;
            }
        });

        if (missingSig) {
            setError('Harap lengkapi semua tanda tangan tim penilai.');
            setSubmitting(false);
            return;
        }

        try {
            await api.post('/ba-hasil-penilaian', {
                penilaian_id: penilaianId,
                nomor_ba: formData.nomor_ba, // Kirim nomor BA jika ingin mempertahankan yang lama
                tanggal_ba: formData.tanggal_ba,
                validitas_kegiatan: formData.validitas_kegiatan,
                rekomendasi_lanjutan: formData.rekomendasi_lanjutan,
                signatures: signaturesPayload
            });
            // Redirect ke Preview setelah sukses
            navigate(`/penilaian/${penilaianId}/ba-hasil/preview`);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan data.');
            setSubmitting(false);
        }
    };

    // Fungsi untuk menghapus TTD lama (agar user dipaksa TTD ulang di canvas)
    const handleClearSignature = (memberId) => {
        // Hapus dari canvas
        if (sigRefs.current[memberId]) {
            sigRefs.current[memberId].clear();
        }
        // Hapus dari state existingSignatures
        setFormData(prev => {
            const newSigs = { ...prev.existingSignatures };
            delete newSigs[memberId];
            return { ...prev, existingSignatures: newSigs };
        });
    };

    if (loading) return <div className="text-center py-10">Memuat Formulir...</div>;
    if (!data) return <div className="text-center py-10 text-red-500">Data tidak ditemukan</div>;

    const { kasus, formulir_analisis } = data;
    const { pemegang } = kasus;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-6 mb-10">
            <div className="mb-6">
                <Link to="/penilaian" className="text-blue-600 hover:underline">&larr; Batal</Link>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center border-b pb-4">
                {isEditMode ? 'Edit' : 'Input'} Formulir Berita Acara Hasil Penilaian
            </h1>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* A. Data Umum (Prefilled) */}
                <section className="bg-gray-50 p-4 rounded border">
                    <h3 className="font-semibold text-gray-700 mb-3">A. Data Pelaku Usaha (Otomatis)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div><span className="text-gray-500">Nama Pelaku Usaha:</span> <p className="font-medium">{pemegang.nama_pelaku_usaha}</p></div>
                        <div><span className="text-gray-500">Nomor Identitas:</span> <p className="font-medium">{pemegang.nomor_identitas}</p></div>
                        <div><span className="text-gray-500">Alamat:</span> <p className="font-medium">{pemegang.alamat}</p></div>
                        <div><span className="text-gray-500">Email:</span> <p className="font-medium">{pemegang.email || '-'}</p></div>
                    </div>
                </section>

                {/* B. Hasil Analisis (Ringkasan) */}
                <section className="bg-gray-50 p-4 rounded border">
                    <h3 className="font-semibold text-gray-700 mb-3">B. Ringkasan Hasil Analisis (Otomatis)</h3>
                    <div className="text-sm space-y-2">
                        <p>Kesesuaian Lokasi: <strong>{formulir_analisis?.lokasi_kesesuaian_pmp_eksisting || '-'}</strong></p>
                        <p>Kesesuaian Jenis Kegiatan: <strong>{formulir_analisis?.jenis_kesesuaian_pmp_eksisting || '-'}</strong></p>
                        <p>Kesesuaian Intensitas Ruang (KDB/KLB/KDH): <strong>{formulir_analisis?.kdb_kesesuaian_rtr || '-'}</strong></p>
                    </div>
                </section>

                {/* C. Input Keputusan */}
                <section className="p-4 border rounded border-blue-200 bg-blue-50">
                    <h3 className="font-semibold text-blue-800 mb-4">C. Kesimpulan & Rekomendasi (Wajib Diisi)</h3>
                    
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Berita Acara</label>
                            <input 
                                type="date" 
                                name="tanggal_ba" 
                                value={formData.tanggal_ba} 
                                onChange={handleChange}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                required 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">1. Validitas Kegiatan Pemanfaatan Ruang</label>
                            <select 
                                name="validitas_kegiatan" 
                                value={formData.validitas_kegiatan} 
                                onChange={handleChange}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">-- Pilih Validitas --</option>
                                <option value="BENAR">BENAR</option>
                                <option value="TIDAK BENAR">TIDAK BENAR</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">2. Rekomendasi</label>
                            <select 
                                name="rekomendasi_lanjutan" 
                                value={formData.rekomendasi_lanjutan} 
                                onChange={handleChange}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">-- Pilih Rekomendasi --</option>
                                <option value="Melanjutkan kegiatan Pemanfaatan Ruang">Melanjutkan kegiatan Pemanfaatan Ruang</option>
                                <option value="Dilakukan pembinaan sesuai ketentuan peraturan perundang-undangan">Dilakukan pembinaan sesuai ketentuan peraturan perundang-undangan</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* D. Tanda Tangan Digital */}
                <section className="border p-4 rounded">
                    <h3 className="font-semibold text-gray-700 mb-4">D. Tanda Tangan Tim Penilai</h3>
                    <p className="text-sm text-gray-500 mb-4">Silakan bubuhkan tanda tangan digital pada kolom di bawah ini.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {getTimMembers().map(member => {
                            const existingSigUrl = formData.existingSignatures[member.id];
                            return (
                                <div key={member.id} className="border p-3 rounded bg-gray-50">
                                    <p className="font-bold text-sm">{member.role_display}</p>
                                    <p className="text-xs text-gray-600 mb-2">{member.nama} (NIP: {member.nip || '-'})</p>
                                    
                                    <div className="border bg-white rounded relative">
                                        {/* Jika ada TTD lama, tampilkan gambar */}
                                        {existingSigUrl ? (
                                            <div className="w-full h-32 flex items-center justify-center bg-gray-100">
                                                <img 
                                                    src={`${api.defaults.baseURL}/signatures/${existingSigUrl}`} 
                                                    alt="Tanda Tangan Tersimpan" 
                                                    className="max-h-full max-w-full"
                                                />
                                                <div className="absolute top-0 right-0 p-1">
                                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Tersimpan</span>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Jika tidak ada, tampilkan canvas */
                                            <SignatureCanvas 
                                                ref={(ref) => sigRefs.current[member.id] = ref}
                                                penColor='black'
                                                canvasProps={{ className: 'w-full h-32' }}
                                            />
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-between mt-1">
                                        {existingSigUrl ? (
                                            <button 
                                                type="button" 
                                                onClick={() => handleClearSignature(member.id)}
                                                className="text-xs text-blue-600 hover:underline"
                                            >
                                                Ubah Tanda Tangan
                                            </button>
                                        ) : (
                                            <button 
                                                type="button" 
                                                onClick={() => sigRefs.current[member.id]?.clear()}
                                                className="text-xs text-red-500 hover:underline"
                                            >
                                                Hapus & Ulangi
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <div className="flex justify-end pt-4">
                    <button 
                        type="submit" 
                        disabled={submitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg disabled:bg-blue-400 transition-all"
                    >
                        {submitting ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Simpan & Lihat Preview')}
                    </button>
                </div>
            </form>
        </div>
    );
}