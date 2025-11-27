import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

export default function BaHasilPenilaianPreviewPage() {
    const { id: penilaianId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get(`/ba-hasil-penilaian/${penilaianId}`);
                setData(response.data);
                if (!response.data.ba_hasil_penilaian) {
                    setError('Data Berita Acara belum dibuat.');
                }
            } catch (err) {
                setError('Gagal memuat dokumen.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [penilaianId]);

    const handlePrint = () => window.print();

    const handleEdit = () => {
        navigate(`/penilaian/${penilaianId}/ba-hasil/input?edit=true`);
    };

    if (loading) return <div className="text-center py-10">Memuat Preview...</div>;
    if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

    const { kasus, ba_hasil_penilaian, formulir_analisis } = data;
    const { pemegang } = kasus;
    const signatures = ba_hasil_penilaian.tanda_tangan_tim || [];

    // Format Tanggal Indo
    const dateObj = new Date(ba_hasil_penilaian.tanggal_ba);
    const dateStr = {
        hari: dateObj.toLocaleDateString('id-ID', { weekday: 'long' }),
        tgl: dateObj.getDate(),
        bln: dateObj.toLocaleDateString('id-ID', { month: 'long' }),
        thn: dateObj.getFullYear()
    };

    // Helper untuk menangani error gambar
    const handleImageError = (e) => {
        e.target.style.display = 'none';
        e.target.parentElement.innerText = '(Gagal Memuat)';
        e.target.parentElement.classList.add('text-xs', 'text-red-500');
    };

    // Helper untuk membersihkan path gambar
    // Mengubah "signatures/filename.png" menjadi "filename.png"
    // agar tidak terjadi duplikasi path saat digabung dengan api.defaults.baseURL
    const getCleanSignatureUrl = (path) => {
        if (!path) return null;
        const filename = path.split('/').pop(); // Ambil nama file saja
        return `${api.defaults.baseURL}/signatures/${filename}`;
    };

    return (
        <div className="bg-gray-100 min-h-screen pb-10">
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body, .printable-area { background-color: white !important; color: black; }
                    .printable-area { box-shadow: none; margin: 0; width: 100%; max-width: 100%; }
                    @page { size: A4; margin: 2cm; }
                }
            `}</style>

            {/* Tombol Aksi Atas (No Print) */}
            <div className="no-print px-4 py-4 max-w-[21cm] mx-auto flex justify-between items-center">
                 <Link to="/penilaian" className="text-blue-600 font-medium hover:underline">
                    &larr; Kembali ke Dashboard
                </Link>
                <div className="space-x-3">
                    <button 
                        onClick={handleEdit}
                        className="bg-yellow-500 text-white px-4 py-2 rounded shadow font-medium hover:bg-yellow-600 transition"
                    >
                        Edit Data
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="bg-gray-600 text-white px-4 py-2 rounded shadow font-medium hover:bg-gray-700 transition"
                    >
                        Cetak
                    </button>
                </div>
            </div>

            <div className="max-w-[21cm] mx-auto bg-white shadow-lg p-8 md:p-12 printable-area font-serif text-black">
                {/* Header Dokumen */}
                <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-4">
                    <div className="text-center w-full">
                        <h1 className="text-xl font-bold uppercase">BERITA ACARA HASIL PENILAIAN</h1>
                        <h2 className="font-bold uppercase">PERNYATAAN MANDIRI PELAKU UMK</h2>
                        <p className="text-sm mt-2">Nomor: {ba_hasil_penilaian.nomor_ba}</p>
                    </div>
                </div>

                {/* Konten */}
                <div className="text-justify leading-relaxed space-y-4">
                    <p>
                        Pada hari ini <strong>{dateStr.hari}</strong> tanggal <strong>{dateStr.tgl}</strong> bulan <strong>{dateStr.bln}</strong> tahun <strong>{dateStr.thn}</strong>, 
                        telah dilakukan penilaian terhadap Pernyataan Mandiri Pelaku Usaha Mikro dan Kecil (UMK) dengan rincian sebagai berikut:
                    </p>

                    {/* A. Data Pelaku */}
                    <div className="pl-4">
                        <h3 className="font-bold mb-2">A. Data Pelaku Usaha</h3>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr><td className="w-40 align-top">Nama Pelaku Usaha</td><td className="align-top">: {pemegang.nama_pelaku_usaha}</td></tr>
                                <tr><td className="align-top">Nomor Identitas</td><td className="align-top">: {pemegang.nomor_identitas}</td></tr>
                                <tr><td className="align-top">Alamat</td><td className="align-top">: {pemegang.alamat}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    {/* B. Hasil Penilaian */}
                    <div className="pl-4">
                        <h3 className="font-bold mb-2">B. Hasil Penilaian</h3>
                        <table className="w-full border border-black text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-black p-1 text-left">Parameter</th>
                                    <th className="border border-black p-1 text-center w-32">Hasil</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td className="border border-black p-1">Kesesuaian Lokasi</td><td className="border border-black p-1 text-center">{formulir_analisis.lokasi_kesesuaian_pmp_eksisting}</td></tr>
                                <tr><td className="border border-black p-1">Kesesuaian Jenis Kegiatan</td><td className="border border-black p-1 text-center">{formulir_analisis.jenis_kesesuaian_pmp_eksisting}</td></tr>
                                <tr><td className="border border-black p-1">Kesesuaian KDB</td><td className="border border-black p-1 text-center">{formulir_analisis.kdb_kesesuaian_rtr}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    {/* C. Kesimpulan */}
                    <div className="pl-4">
                        <h3 className="font-bold mb-2">C. Kesimpulan dan Rekomendasi</h3>
                        <p>Berdasarkan hasil penilaian di atas, disimpulkan bahwa:</p>
                        <div className="mt-2 border p-4 bg-gray-50">
                            <p>Validitas Kegiatan: <strong>{ba_hasil_penilaian.validitas_kegiatan}</strong></p>
                            <p className="mt-2">Rekomendasi: <strong>{ba_hasil_penilaian.rekomendasi_lanjutan}</strong></p>
                        </div>
                    </div>
                </div>

                {/* Tanda Tangan */}
                <div className="mt-12">
                    <p className="text-center mb-6 font-bold">Tim Penilai</p>
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        {signatures.map((sig, idx) => (
                            <div key={idx} className="mb-4 page-break-inside-avoid">
                                <p className="mb-4">{sig.jabatan}</p>
                                <div className="h-20 flex items-center justify-center">
                                    {sig.signature_path && (
                                        <img 
                                            src={getCleanSignatureUrl(sig.signature_path)}
                                            alt="TTD" 
                                            className="h-full object-contain"
                                            crossOrigin="anonymous"
                                            onError={handleImageError}
                                        />
                                    )}
                                </div>
                                <p className="font-bold underline mt-1">{sig.nama}</p>
                                <p>NIP: {sig.nip || '-'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tombol Aksi Bawah (No Print) */}
            <div className="fixed bottom-0 w-full bg-white border-t p-4 flex justify-between items-center no-print shadow-lg max-w-[21cm] mx-auto left-0 right-0">
                <Link to="/penilaian" className="text-blue-600 font-medium hover:underline">
                    &larr; Kembali ke Dashboard
                </Link>
                <button 
                    onClick={handlePrint}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                >
                    Cetak Dokumen
                </button>
            </div>
        </div>
    );
}