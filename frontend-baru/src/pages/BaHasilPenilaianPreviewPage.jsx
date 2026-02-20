import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

export default function BaHasilPenilaianPreviewPage() {
    const { id: penilaianId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFinal, setIsFinal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get(`/ba-hasil-penilaian/${penilaianId}`);
                setData(response.data);

                // Check if BA Hasil Penilaian exists - if yes, mark as final
                if (response.data.ba_hasil_penilaian) {
                    setIsFinal(true);
                } else {
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

    // Parsing Signatures dari JSON
    const signatures = ba_hasil_penilaian.tanda_tangan_tim || [];

    // Helper untuk mencari TTD berdasarkan role/jabatan
    const getSignatureByRole = (role) => signatures.find(s => s.role === role || s.jabatan === role);
    // Helper untuk mencari TTD Petugas Lapangan (bisa banyak)
    const getPetugasLapanganSignatures = () => signatures.filter(s => s.role === 'Petugas Lapangan' || s.jabatan === 'Petugas Lapangan');

    const ketuaTimSig = signatures.find(s => s.role === 'Ketua Tim') || {};
    const koordinatorSig = signatures.find(s => s.role === 'Koordinator Lapangan') || {};
    const petugasSignatures = getPetugasLapanganSignatures();

    // Format Tanggal Indo
    const dateObj = new Date(ba_hasil_penilaian.tanggal_ba);
    const dateStr = {
        hari: dateObj.toLocaleDateString('id-ID', { weekday: 'long' }),
        tgl: dateObj.getDate(),
        bln: dateObj.toLocaleDateString('id-ID', { month: 'long' }),
        thn: dateObj.getFullYear()
    };

    // Helper URL Gambar
    const getCleanSignatureUrl = (path) => {
        if (!path) return null;
        const filename = path.split('/').pop();
        return `${api.defaults.baseURL}/signatures/${filename}`;
    };

    const handleImageError = (e) => {
        e.target.style.display = 'none';
        // e.target.parentElement.innerText = ''; // Kosongkan jika error agar rapi saat print
    };

    // Component Baris Tabel
    const TableRow = ({ no, muatan, hasil, keterangan }) => (
        <tr>
            <td className="border border-black p-1 text-center align-top">{no}</td>
            <td className="border border-black p-1 align-top">{muatan}</td>
            <td className="border border-black p-1 text-center align-top">{hasil || '-'}</td>
            <td className="border border-black p-1 align-top">{keterangan || ''}</td>
        </tr>
    );

    // Styles CSS khusus untuk halaman ini
    const styles = `
        @page {
            size: A4;
            margin: 1.5cm 2cm; 
        }
        @media print {
            /* Hide common UI elements */
            .no-print { display: none !important; }
            header, nav, .navbar, .header, .sidebar, [class*="Header"], [class*="Navbar"] { 
                display: none !important; 
            }
            
            /* Hide everything by default, then show only printable area */
            body * { 
                visibility: hidden !important; 
            }
            
            /* Reset body for clean print */
            body { 
                background-color: white !important; 
                -webkit-print-color-adjust: exact;
                margin: 0 !important;
                padding: 0 !important;
            }
            
            /* Make printable area and all its children visible */
            .printable-area,
            .printable-area * { 
                visibility: visible !important;
            }
            
            /* Position printable area */
            .printable-area { 
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                box-shadow: none !important; 
                margin: 0 !important; 
                width: 100% !important; 
                max-width: 100% !important;
                padding: 0 !important;
                background: white !important;
            }
            
            /* Pastikan tabel dan border tercetak hitam */
            table, th, td { border-color: black !important; }
        }
        .font-times { font-family: 'Times New Roman', Times, serif; }
    `;

    return (
        <div className="bg-gray-100 min-h-screen pb-10 font-times text-black leading-tight">
            <style>{styles}</style>

            {/* Tombol Aksi (Tidak dicetak) */}
            <div className="no-print px-4 py-4 max-w-[21cm] mx-auto flex justify-between items-center bg-white shadow mb-4 rounded">
                <Link to="/penilaian" className="text-blue-600 font-medium hover:underline">
                    &larr; Kembali ke Dashboard
                </Link>
                <div className="space-x-3 flex items-center">
                    {!isFinal && (
                        <button
                            onClick={handleEdit}
                            className="bg-yellow-500 text-white px-4 py-2 rounded shadow font-medium hover:bg-yellow-600 transition"
                        >
                            Edit Data
                        </button>
                    )}
                    {isFinal && (
                        <span className="px-3 py-2 bg-green-100 text-green-800 text-sm font-bold rounded border border-green-200">
                            FINAL (READ ONLY)
                        </span>
                    )}
                    <button
                        onClick={handlePrint}
                        className="bg-gray-600 text-white px-4 py-2 rounded shadow font-medium hover:bg-gray-700 transition"
                    >
                        Cetak PDF
                    </button>
                </div>
            </div>

            {/* Area Dokumen */}
            <div className="printable-area max-w-[21cm] mx-auto bg-white shadow-lg p-8 md:p-12 text-[11pt]">

                {/* Header Dokumen yang dihapus sesuai permintaan */}
                {/* Bagian Kop Surat dan Judul Lampiran telah dihapus */}

                <div className="text-center mb-6 border-t-2 border-b-2 border-black py-2 double-border mt-8">
                    <h1 className="font-bold uppercase text-[12pt] underline">BERITA ACARA</h1>
                    <h2 className="font-bold uppercase text-[12pt]">HASIL PENILAIAN PERNYATAAN MANDIRI<br />PELAKU USAHA MIKRO DAN KECIL</h2>
                    <p className="mt-1">Nomor: {ba_hasil_penilaian.nomor_ba}</p>
                </div>

                {/* Pembuka */}
                <p className="text-justify mb-2">
                    Pada hari ini, {dateStr.hari} tanggal {dateStr.tgl} bulan {dateStr.bln} tahun {dateStr.thn} telah dilaksanakan penilaian pernyataan mandiri pelaku Usaha Mikro dan Kecil (UMK) terhadap:
                </p>

                {/* Identitas Pelaku Usaha */}
                <table className="w-full mb-4">
                    <tbody>
                        <tr>
                            <td className="w-[25%] align-top pl-4">Nama Pelaku Usaha</td>
                            <td className="w-[2%] align-top">:</td>
                            <td className="align-top">{pemegang.nama_pelaku_usaha}</td>
                        </tr>
                        <tr>
                            <td className="align-top pl-4">Nomor Identitas</td>
                            <td className="align-top">:</td>
                            <td className="align-top">{pemegang.nomor_identitas}</td>
                        </tr>
                        <tr>
                            <td className="align-top pl-4">Alamat</td>
                            <td className="align-top">:</td>
                            <td className="align-top">{pemegang.alamat}, {pemegang.desa_kelurahan}, {pemegang.kecamatan}</td>
                        </tr>
                        <tr>
                            <td className="align-top pl-4">Nomor Telepon</td>
                            <td className="align-top">:</td>
                            <td className="align-top">{pemegang.nomor_handphone || '-'}</td>
                        </tr>
                        <tr>
                            <td className="align-top pl-4">Email</td>
                            <td className="align-top">:</td>
                            <td className="align-top">{pemegang.email || '-'}</td>
                        </tr>
                    </tbody>
                </table>

                <p className="mb-2">Penilaian pernyataan mandiri pelaku UMK dilakukan oleh:</p>

                {/* Tim Penilai (Format List 1, 2, 3...) */}
                <div className="mb-6 pl-2">
                    {signatures.map((sig, index) => (
                        <div key={index} className="mb-2 break-inside-avoid">
                            <div className="flex">
                                <div className="w-6">{index + 1}.</div>
                                <div className="w-full">
                                    <table className="w-full">
                                        <tbody>
                                            <tr>
                                                <td className="w-[25%]">Nama</td>
                                                <td className="w-[2%]">:</td>
                                                <td>{sig.nama}</td>
                                            </tr>
                                            <tr>
                                                <td>NIP</td>
                                                <td>:</td>
                                                <td>{sig.nip || '-'}</td>
                                            </tr>
                                            {/* Baris Pangkat/Golongan DIHAPUS sesuai permintaan */}
                                            <tr>
                                                <td>Jabatan</td>
                                                <td>:</td>
                                                <td>{sig.jabatan || sig.role}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="text-justify mb-4">
                    Berdasarkan hasil survei lapangan dan analisis, diperoleh hasil penilaian pernyataan mandiri pelaku UMK sebagai berikut:
                </p>

                {/* Tabel Hasil Penilaian */}
                <table className="w-full border-collapse border border-black text-[10pt] mb-4">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black p-1 text-center w-[5%]">No.</th>
                            <th className="border border-black p-1 text-center w-[45%]">Muatan yang Dinilai</th>
                            <th className="border border-black p-1 text-center w-[25%]">Hasil Penilaian<br />(Sesuai/Tidak Sesuai)</th>
                            <th className="border border-black p-1 text-center w-[25%]">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* A. Kesesuaian RTR */}
                        <TableRow no="A." muatan="Kesesuaian dengan Rencana Tata Ruang" hasil={formulir_analisis.jenis_kesesuaian_rtr || '-'} />

                        {/* B. Pemeriksaan */}
                        <tr>
                            <td className="border border-black p-1 text-center font-bold">B.</td>
                            <td className="border border-black p-1 font-bold" colSpan="3">Pemeriksaan</td>
                        </tr>
                        <TableRow no="1" muatan="Lokasi Kegiatan Pemanfaatan Ruang" hasil={formulir_analisis.lokasi_kesesuaian_pmp_eksisting} />
                        <TableRow no="2" muatan="Jenis Kegiatan Pemanfaatan Ruang" hasil={formulir_analisis.jenis_kesesuaian_pmp_eksisting} />

                        {/* C. Pengukuran */}
                        <tr>
                            <td className="border border-black p-1 text-center font-bold">C.</td>
                            <td className="border border-black p-1 font-bold" colSpan="3">Pengukuran (Opsional)</td>
                        </tr>
                        <TableRow no="1" muatan="Luas Tanah" hasil={formulir_analisis.luas_tanah_kesesuaian_rtr || formulir_analisis.luas_digunakan_kesesuaian_rtr} />
                        <TableRow no="2" muatan="KDB" hasil={formulir_analisis.kdb_kesesuaian_rtr} />
                        <TableRow no="3" muatan="KLB" hasil={formulir_analisis.klb_kesesuaian_rtr} />
                        <TableRow no="4" muatan="Garis Sempadan Bangunan" hasil={formulir_analisis.gsb_kesesuaian_rtr} />
                        <TableRow no="5" muatan="Jarak Bebas Bangunan" hasil={formulir_analisis.jbb_kesesuaian_rtr} />
                        <TableRow no="6" muatan="KDH" hasil={formulir_analisis.kdh_kesesuaian_rtr} />
                        <TableRow no="7" muatan="Koefisien Tapak Basemen" hasil={formulir_analisis.ktb_kesesuaian_rtr} />
                        <TableRow no="8" muatan="Ketinggian Bangunan" hasil={formulir_analisis.ketinggian_kesesuaian_rtr} />
                    </tbody>
                </table>

                <p className="text-justify mb-2">
                    Hasil penilaian pernyataan mandiri pelaku UMK juga dituangkan dalam bentuk peta sebagaimana terlampir yang merupakan bagian tidak terpisahkan dari Berita Acara ini.
                </p>
                <p className="text-justify mb-4">
                    Berdasarkan hasil penilaian tersebut, diperoleh kesimpulan sebagai berikut:
                </p>

                <ol className="list-decimal pl-6 mb-6 space-y-2 text-justify">
                    <li>
                        Kegiatan Pemanfaatan Ruang berdasarkan pernyataan mandiri yang dibuat oleh pelaku UMK dinyatakan <strong>({ba_hasil_penilaian.validitas_kegiatan})</strong>.
                    </li>
                    <li>
                        Pelaku usaha dapat <strong>{ba_hasil_penilaian.rekomendasi_lanjutan}</strong> sesuai dengan ketentuan peraturan perundang-undangan.
                        {ba_hasil_penilaian.validitas_kegiatan === 'BENAR'
                            ? " (apabila hasil penilaian pernyataan mandiri pelaku UMK dinyatakan Benar, maka pelaku usaha dapat melanjutkan kegiatan Pemanfaatan Ruang)."
                            : " (apabila hasil penilaian pernyataan mandiri pelaku UMK dinyatakan Tidak Benar, maka pelaku usaha dilakukan pembinaan sesuai dengan ketentuan peraturan perundang-undangan)."
                        }
                    </li>
                </ol>

                <p className="mb-8">Demikian Berita Acara ini dibuat untuk digunakan sebagaimana mestinya.</p>

                {/* Tanda Tangan */}
                <div className="break-inside-avoid">
                    {/* Petugas Lapangan (Grid) */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-8 mb-12">
                        {petugasSignatures.map((petugas, idx) => (
                            <div key={idx} className="text-center">
                                <p className="mb-2">Petugas Lapangan {idx + 1}</p>
                                <div className="h-20 flex items-center justify-center">
                                    {petugas.signature_path && (
                                        <img
                                            src={getCleanSignatureUrl(petugas.signature_path)}
                                            alt="TTD"
                                            className="h-full max-w-[150px] object-contain"
                                            onError={handleImageError}
                                            crossOrigin="anonymous"
                                        />
                                    )}
                                </div>
                                <p className="font-bold underline mt-1">{petugas.nama}</p>
                                <p>NIP: {petugas.nip || '-'}</p>
                            </div>
                        ))}
                        {/* Placeholder jika ganjil agar layout rapi */}
                        {petugasSignatures.length % 2 !== 0 && <div></div>}
                    </div>

                    {/* Menyetujui (Ketua Tim & Koordinator) */}
                    <div className="text-center mb-8"><p>Menyetujui,</p></div>
                    <div className="grid grid-cols-2 gap-10">
                        <div className="text-center">
                            <p className="mb-2">Ketua Tim,</p>
                            <div className="h-20 flex items-center justify-center">
                                {ketuaTimSig.signature_path && (
                                    <img
                                        src={getCleanSignatureUrl(ketuaTimSig.signature_path)}
                                        alt="TTD"
                                        className="h-full max-w-[150px] object-contain"
                                        onError={handleImageError}
                                        crossOrigin="anonymous"
                                    />
                                )}
                            </div>
                            <p className="font-bold underline mt-1">{ketuaTimSig.nama || '....................'}</p>
                            <p>NIP: {ketuaTimSig.nip || '-'}</p>
                        </div>

                        <div className="text-center">
                            <p className="mb-2">Koordinator Lapangan,</p>
                            <div className="h-20 flex items-center justify-center">
                                {koordinatorSig.signature_path && (
                                    <img
                                        src={getCleanSignatureUrl(koordinatorSig.signature_path)}
                                        alt="TTD"
                                        className="h-full max-w-[150px] object-contain"
                                        onError={handleImageError}
                                        crossOrigin="anonymous"
                                    />
                                )}
                            </div>
                            <p className="font-bold underline mt-1">{koordinatorSig.nama || '....................'}</p>
                            <p>NIP: {koordinatorSig.nip || '-'}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}