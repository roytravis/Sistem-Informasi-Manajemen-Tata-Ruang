import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios.js';

// --- CSS KHUSUS UNTUK PRINT (Mirip dengan FormulirAnalisisPage) ---
const PrintStyles = () => (
    <style>
        {`
            @media print {
                .no-print, button, nav, .action-bar { display: none !important; }
                body, .printable-area { background-color: white !important; color: black !important; font-family: 'Times New Roman', Times, serif; font-size: 12pt; }
                .printable-area { box-shadow: none !important; margin: 0 !important; padding: 0 !important; max-width: 100% !important; width: 100% !important; position: absolute; top: 0; left: 0; }
                table { width: 100% !important; border-collapse: collapse !important; }
                th, td { border: 1px solid #000 !important; padding: 4px !important; font-size: 11pt !important; vertical-align: top; }
                /* Hilangkan appearance dropdown saat print agar terlihat seperti teks */
                select { appearance: none; border: none; background: transparent; padding: 0; font-size: 12pt; color: black; font-weight: bold; }
                /* Reset opacity for read-only elements */
                fieldset, div, section { opacity: 1 !important; }
                .signature-box { height: 80px; }
                
                /* === COMPREHENSIVE COLOR & BACKGROUND OVERRIDES === */
                /* Force pure white/transparent backgrounds on ALL elements */
                .printable-area *, .printable-area input, .printable-area select, .printable-area textarea,
                .printable-area fieldset, .printable-area div, .printable-area td { 
                    background-color: transparent !important; 
                    background: transparent !important; 
                }
                
                /* Force pure black text on ALL text elements */
                .printable-area td, .printable-area th, .printable-area div,
                .printable-area p, .printable-area span, .printable-area label, .printable-area strong { 
                    color: #000 !important; 
                    font-weight: normal !important;
                }
                
                /* Exception: Keep table headers and bold elements bold */
                .printable-area th, .printable-area strong { 
                    font-weight: bold !important;
                }
            }
        `}
    </style>
);

export default function BaHasilPenilaianPage() {
    const { id: penilaianId } = useParams(); // ID Penilaian (bukan Kasus ID)
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFinal, setIsFinal] = useState(false); // State baru

    // State untuk Dropdown Kesimpulan
    const [kesimpulan, setKesimpulan] = useState({
        validitas_kegiatan: '',
        rekomendasi_lanjutan: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/ba-hasil-penilaian/${penilaianId}`);
                setData(response.data);

                // DETEKSI STATUS FINAL
                // Jika data BA Hasil Penilaian sudah ada, berarti penilaian sudah final
                const baData = response.data.ba_hasil_penilaian || response.data.ba_hasil_penilaians;

                if (baData) {
                    // Tandai sebagai Final dan populate data
                    setIsFinal(true);
                    setKesimpulan({
                        validitas_kegiatan: baData.validitas_kegiatan,
                        rekomendasi_lanjutan: baData.rekomendasi_lanjutan
                    });
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Gagal memuat data Berita Acara.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [penilaianId]);

    const handleSave = async () => {
        if (!kesimpulan.validitas_kegiatan || !kesimpulan.rekomendasi_lanjutan) {
            alert('Harap pilih Validitas dan Rekomendasi terlebih dahulu.');
            return;
        }
        setSaving(true);
        try {
            await api.post('/ba-hasil-penilaian', {
                penilaian_id: penilaianId,
                ...kesimpulan
            });
            alert('Berita Acara berhasil disimpan.');
            // Refresh data to get nomor_ba if generated
            const response = await api.get(`/ba-hasil-penilaian/${penilaianId}`);
            setData(response.data);
        } catch (err) {
            alert('Gagal menyimpan: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    // --- Data Helpers ---
    const today = new Date();
    const formattedDate = {
        hari: today.toLocaleDateString('id-ID', { weekday: 'long' }),
        tanggal: today.getDate(),
        bulan: today.toLocaleDateString('id-ID', { month: 'long' }),
        tahun: today.getFullYear()
    };

    const analisis = data?.formulir_analisis || {};
    const pemegang = data?.kasus?.pemegang || {};
    // Ambil data Petugas yang melakukan analisis (User Penilai di tabel analisis/penilaian tidak disimpan eksplisit di formulir, 
    // tapi kita bisa ambil dari Tim. Asumsi: User yang login/membuka adalah penilai, atau ambil dari data Tim)
    // Disini kita ambil dari data Tim Penilai yang tersimpan di Kasus.
    const timMembers = data?.kasus?.tim?.users || [];
    const koordinator = data?.kasus?.penanggung_jawab;

    // Helper row tabel
    const RenderRow = ({ label, hasil }) => (
        <tr>
            <td className="font-medium">{label}</td>
            <td className="text-center">{hasil || '-'}</td>
        </tr>
    );

    // Helper handle image error
    const handleImageError = (e) => {
        e.target.style.display = 'none';
        // Opsional: Tampilkan pesan error teks jika gambar gagal
        if (e.target.parentElement) {
            e.target.parentElement.innerText = '(Gagal Memuat)';
            e.target.parentElement.className = "text-xs text-red-500 h-20 flex items-center justify-center border rounded";
        }
    };

    // --- PERBAIKAN: Helper untuk mendapatkan URL gambar yang bersih ---
    const getSignatureUrl = (path) => {
        if (!path) return null;
        // Ambil hanya nama file (misal: "signatures/ttd.png" -> "ttd.png")
        // Ini mencegah URL menjadi ".../api/signatures/signatures/ttd.png" (double signatures)
        const filename = path.split('/').pop();
        return `${api.defaults.baseURL}/signatures/${filename}`;
    };

    if (loading) return <div className="text-center py-10">Memuat Dokumen...</div>;
    if (error) return <div className="bg-red-100 text-red-700 p-4 m-4 rounded">{error}</div>;

    return (
        <div className="bg-gray-100 min-h-screen pb-10">
            <PrintStyles />

            {/* Action Bar */}
            <div className="bg-white shadow px-6 py-4 mb-6 flex justify-between items-center no-print">
                <Link to="/penilaian" className="text-blue-600 hover:underline">&larr; Kembali ke Dashboard</Link>
                <div className="space-x-2">
                    {!isFinal && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow font-medium disabled:bg-green-400"
                        >
                            {saving ? 'Menyimpan...' : 'Simpan Data'}
                        </button>
                    )}
                    <button
                        onClick={() => window.print()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow font-medium"
                    >
                        Cetak / PDF
                    </button>
                    {isFinal && <span className="text-green-600 font-bold ml-2 text-sm border border-green-200 bg-green-50 px-2 py-1 rounded">FINAL (READ ONLY)</span>}
                </div>
            </div>

            {/* Area Kertas */}
            <div className="printable-area max-w-[21cm] mx-auto bg-white p-8 md:p-12 shadow-lg">

                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-xl font-bold uppercase underline">BERITA ACARA HASIL PENILAIAN</h1>
                    <p className="font-bold uppercase">PERNYATAAN MANDIRI PELAKU UMK</p>
                    <p className="text-sm mt-1">Nomor: {(data.ba_hasil_penilaian?.nomor_ba || data.ba_hasil_penilaians?.nomor_ba) || '................/BA-HP/......./.......'}</p>
                </div>

                {/* Pembuka */}
                <p className="text-justify mb-4 leading-relaxed">
                    Pada hari ini <strong>{formattedDate.hari}</strong> tanggal <strong>{formattedDate.tanggal}</strong> bulan <strong>{formattedDate.bulan}</strong> tahun <strong>{formattedDate.tahun}</strong>,
                    telah dilakukan penilaian terhadap Pernyataan Mandiri Pelaku Usaha Mikro dan Kecil (UMK) dengan rincian sebagai berikut:
                </p>

                {/* A. Data Pelaku Usaha */}
                <div className="mb-4">
                    <h3 className="font-bold mb-2">A. Data Pelaku Usaha</h3>
                    <table className="w-full text-sm border-collapse">
                        <tbody>
                            <tr><td className="w-1/3 p-1">Nama Pelaku Usaha</td><td className="p-1">: {pemegang.nama_pelaku_usaha}</td></tr>
                            <tr><td className="p-1">Nomor Identitas</td><td className="p-1">: {pemegang.nomor_identitas}</td></tr>
                            <tr><td className="p-1">Alamat</td><td className="p-1">: {pemegang.alamat}</td></tr>
                            <tr><td className="p-1">Nomor Telepon</td><td className="p-1">: {pemegang.nomor_handphone || '-'}</td></tr>
                            <tr><td className="p-1">Email</td><td className="p-1">: {pemegang.email || '-'}</td></tr>
                        </tbody>
                    </table>
                </div>

                {/* B. Petugas Penilai */}
                <div className="mb-4">
                    <h3 className="font-bold mb-2">B. Petugas Penilai</h3>
                    <p className="mb-2">Penilaian pernyataan mandiri pelaku UMK dilakukan oleh Tim Penilai:</p>
                    {/* Listing Anggota Tim */}
                    <table className="w-full text-sm border-collapse border border-black">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="text-center p-1 w-10">No</th>
                                <th className="text-left p-1">Nama</th>
                                <th className="text-left p-1">NIP</th>
                                <th className="text-left p-1">Jabatan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {timMembers.map((user, idx) => (
                                <tr key={user.id}>
                                    <td className="text-center p-1">{idx + 1}</td>
                                    <td className="p-1">{user.nama}</td>
                                    <td className="p-1">{user.nip || '-'}</td>
                                    <td className="p-1">{user.pivot?.jabatan_di_tim || user.role}</td>
                                </tr>
                            ))}
                            {/* Tambahkan Koordinator jika belum ada di list (biasanya terpisah) */}
                            {koordinator && !timMembers.find(u => u.id === koordinator.id) && (
                                <tr>
                                    <td className="text-center p-1">{timMembers.length + 1}</td>
                                    <td className="p-1">{koordinator.nama}</td>
                                    <td className="p-1">{koordinator.nip || '-'}</td>
                                    <td className="p-1">Koordinator Lapangan</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* C. Hasil Penilaian */}
                <div className="mb-4">
                    <h3 className="font-bold mb-2">C. Hasil Penilaian Pernyataan Mandiri</h3>
                    <table className="w-full text-sm border-collapse border border-black">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 text-left">Parameter Penilaian</th>
                                <th className="p-2 w-1/4 text-center">Hasil (Sesuai/Tidak Sesuai)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* 1. Kesesuaian RTR */}
                            <tr><td colSpan="2" className="bg-gray-50 font-semibold p-1">1. Kesesuaian Kegiatan Pemanfaatan Ruang</td></tr>
                            <RenderRow label="Kesesuaian Lokasi" hasil={analisis.lokasi_kesesuaian_pmp_eksisting} />
                            <RenderRow label="Kesesuaian Jenis Kegiatan" hasil={analisis.jenis_kesesuaian_pmp_eksisting} />

                            {/* 2. Pengukuran */}
                            <tr><td colSpan="2" className="bg-gray-50 font-semibold p-1">2. Intensitas Pemanfaatan Ruang</td></tr>
                            <RenderRow label="Koefisien Dasar Bangunan (KDB)" hasil={analisis.kdb_kesesuaian_rtr} />
                            <RenderRow label="Koefisien Lantai Bangunan (KLB)" hasil={analisis.klb_kesesuaian_rtr} />
                            <RenderRow label="Koefisien Daerah Hijau (KDH)" hasil={analisis.kdh_kesesuaian_rtr} />
                            <RenderRow label="Koefisien Tapak Basemen (KTB)" hasil={analisis.ktb_kesesuaian_rtr} />

                            {/* 3. Tata Bangunan */}
                            <tr><td colSpan="2" className="bg-gray-50 font-semibold p-1">3. Tata Bangunan</td></tr>
                            <RenderRow label="Garis Sempadan Bangunan (GSB)" hasil={analisis.gsb_kesesuaian_rtr} />
                            <RenderRow label="Jarak Bebas Bangunan (JBB)" hasil={analisis.jbb_kesesuaian_rtr} />
                            <RenderRow label="Ketinggian Bangunan" hasil={analisis.ketinggian_kesesuaian_rtr} />
                        </tbody>
                    </table>
                </div>

                {/* D. Kesimpulan */}
                <div className="mb-6 border p-4 border-black rounded-sm bg-gray-50 print:bg-transparent">
                    <h3 className="font-bold mb-3">D. Kesimpulan dan Rekomendasi</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-semibold text-sm mb-1">1. Validitas Kegiatan Pemanfaatan Ruang:</label>
                            <select
                                className="w-full border border-gray-400 p-2 rounded bg-white print:border-none print:p-0 print:font-bold"
                                value={kesimpulan.validitas_kegiatan}
                                onChange={(e) => setKesimpulan({ ...kesimpulan, validitas_kegiatan: e.target.value })}
                                disabled={isFinal}
                            >
                                <option value="">-- Pilih Validitas --</option>
                                <option value="BENAR">BENAR</option>
                                <option value="TIDAK BENAR">TIDAK BENAR</option>
                            </select>
                        </div>
                        <div>
                            <label className="block font-semibold text-sm mb-1">2. Rekomendasi Lanjutan:</label>
                            <select
                                className="w-full border border-gray-400 p-2 rounded bg-white print:border-none print:p-0 print:font-bold"
                                value={kesimpulan.rekomendasi_lanjutan}
                                onChange={(e) => setKesimpulan({ ...kesimpulan, rekomendasi_lanjutan: e.target.value })}
                                disabled={isFinal}
                            >
                                <option value="">-- Pilih Rekomendasi --</option>
                                <option value="Melanjutkan kegiatan Pemanfaatan Ruang">Melanjutkan kegiatan Pemanfaatan Ruang</option>
                                <option value="Dilakukan pembinaan sesuai ketentuan peraturan perundang-undangan">Dilakukan pembinaan sesuai ketentuan</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* E. Tanda Tangan Digital */}
                <div className="mt-8 page-break-inside-avoid">
                    <h3 className="font-bold text-center mb-6">Tanda Tangan Tim Penilai</h3>
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        {/* Petugas Lapangan (ambil 1 contoh jika banyak) */}
                        <div className="flex flex-col items-center">
                            <p className="mb-8">Petugas Lapangan</p>
                            {/* Cek TTD di Formulir Analisis */}
                            {analisis.tanda_tangan_tim && analisis.tanda_tangan_tim.find(s => timMembers.some(tm => tm.id === s.user_id && tm.pivot?.jabatan_di_tim === 'Petugas Lapangan')) ? (
                                <img
                                    src={getSignatureUrl(analisis.tanda_tangan_tim.find(s => timMembers.some(tm => tm.id === s.user_id && tm.pivot?.jabatan_di_tim === 'Petugas Lapangan'))?.signature_path)}
                                    alt="TTD"
                                    className="h-20 object-contain"
                                    crossOrigin="anonymous" // PERBAIKAN: Tambah crossOrigin
                                    onError={handleImageError}
                                />
                            ) : (
                                <div className="h-20 w-full"></div>
                            )}
                            <p className="font-bold underline mt-1">
                                {timMembers.find(u => u.pivot?.jabatan_di_tim === 'Petugas Lapangan')?.nama || '....................'}
                            </p>
                            <p>NIP: {timMembers.find(u => u.pivot?.jabatan_di_tim === 'Petugas Lapangan')?.nip || '-'}</p>
                        </div>

                        {/* Koordinator Lapangan */}
                        <div className="flex flex-col items-center">
                            <p className="mb-8">Koordinator Lapangan</p>
                            {/* Asumsi koordinator juga ttd di analisis form, jika tidak kosongkan */}
                            <div className="h-20 w-full"></div>
                            <p className="font-bold underline mt-1">{koordinator?.nama || '....................'}</p>
                            <p>NIP: {koordinator?.nip || '-'}</p>
                        </div>

                        {/* Ketua Tim */}
                        <div className="flex flex-col items-center">
                            <p className="mb-8">Ketua Tim</p>
                            {/* Cek TTD Ketua Tim */}
                            {analisis.tanda_tangan_tim && analisis.tanda_tangan_tim.find(s => timMembers.some(tm => tm.id === s.user_id && tm.pivot?.jabatan_di_tim === 'Ketua Tim')) ? (
                                <img
                                    src={getSignatureUrl(analisis.tanda_tangan_tim.find(s => timMembers.some(tm => tm.id === s.user_id && tm.pivot?.jabatan_di_tim === 'Ketua Tim'))?.signature_path)}
                                    alt="TTD"
                                    className="h-20 object-contain"
                                    crossOrigin="anonymous" // PERBAIKAN: Tambah crossOrigin
                                    onError={handleImageError}
                                />
                            ) : (
                                <div className="h-20 w-full"></div>
                            )}
                            <p className="font-bold underline mt-1">
                                {timMembers.find(u => u.pivot?.jabatan_di_tim === 'Ketua Tim')?.nama || '....................'}
                            </p>
                            <p>NIP: {timMembers.find(u => u.pivot?.jabatan_di_tim === 'Ketua Tim')?.nip || '-'}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}