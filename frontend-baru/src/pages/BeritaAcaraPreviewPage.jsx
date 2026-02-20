import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

export default function BeritaAcaraPreviewPage() {
    const { id } = useParams();
    const [ba, setBa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBA = async () => {
            setLoading(true);
            try {
                // Controller sekarang mengirim 'tim_penilai' sebagai array user yang sudah diproses
                const response = await api.get(`/berita-acara/${id}`);
                setBa(response.data);
            } catch (err) {
                setError('Gagal memuat data Berita Acara.');
            } finally {
                setLoading(false);
            }
        };
        fetchBA();
    }, [id]);

    const handlePrint = () => window.print();

    const { dateParts, alasanText, signatureMap } = useMemo(() => {
        if (!ba) return {};

        // 1. Format Tanggal
        const date = new Date(ba.tanggal_ba);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' };
        const formatter = new Intl.DateTimeFormat('id-ID', options);
        const parts = formatter.formatToParts(date).reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});

        // 2. Format Teks Alasan
        let textForAlasan = '';
        if (ba.alasan === 'Lainnya') {
            textForAlasan = ba.keterangan_lainnya;
        } else if (ba.alasan === 'Tidak dapat dihubungi') {
            textForAlasan = 'dapat dihubungi';
        } else if (ba.alasan === 'Lokasi tidak ditemukan') {
            textForAlasan = 'ditemukan';
        }

        // 3. Buat Peta Tanda Tangan
        const sigMap = (ba.tanda_tangan_tim || []).reduce((acc, sig) => {
            acc[sig.user_id] = sig.signature_path;
            return acc;
        }, {});

        // 4. (REMOVED) Pisahkan Petugas Lapangan dari Koordinator
        // Backend sekarang mengembalikan 'tim_penilai' yang sudah diurutkan dan memiliki jabatan yang benar.

        return {
            dateParts: parts,
            alasanText: textForAlasan,
            signatureMap: sigMap,
        };
    }, [ba]);


    if (loading) return <div className="text-center py-10">Memuat preview...</div>;
    if (error) return <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>;
    if (!ba || !dateParts) return <div className="text-center py-10">Data Berita Acara tidak ditemukan.</div>;

    return (
        <div>
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .printable-area, .printable-area * { visibility: visible; }
                    .printable-area { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%;
                        font-family: 'Times New Roman', Times, serif;
                        font-size: 12pt;
                    }
                    .no-print { display: none; }
                }
                .ba-content { line-height: 2; }
                .signature-block { page-break-inside: avoid; }
            `}</style>

            <div className="mb-6 flex justify-between items-center no-print">
                {/* PERBAIKAN: Link kembali ke dashboard penilaian */}
                <Link to="/penilaian" className="text-blue-600 hover:underline">&larr; Kembali ke Dashboard Penilaian</Link>
                <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                    Cetak
                </button>
            </div>

            <div className="bg-white p-8 md:p-12 rounded-lg shadow-lg max-w-4xl mx-auto printable-area font-serif text-black">
                <div className="text-center uppercase font-bold">
                    <h2 className="text-lg tracking-wider">BERITA ACARA</h2>
                    <h3 className="text-lg tracking-wider">TIDAK TERLAKSANANYA PENILAIAN PERNYATAAN MANDIRI</h3>
                    <h3 className="text-lg tracking-wider">PELAKU USAHA MIKRO DAN KECIL (UMK)</h3>
                    <div className="border-b-2 border-black mt-2 mb-2 w-full"></div>
                    <p className="text-base normal-case">Nomor: {ba.nomor_ba}</p>
                </div>

                <div className="mt-8 text-justify ba-content">
                    <p className="indent-8">
                        Pada hari ini, {dateParts.weekday} tanggal {dateParts.day} bulan {dateParts.month} tahun {dateParts.year},
                        kami yang bertanda tangan di bawah ini selaku Tim Penilai PMP UMK:
                    </p>

                    <div className="mt-4 ml-8 space-y-2">
                        {/* PERBAIKAN: Menggunakan properti 'tim_penilai' yang sudah diproses */}
                        {ba?.tim_penilai?.map((penilai) => (
                            <div key={penilai.id} className="grid grid-cols-[80px_10px_auto]">
                                <span>Nama</span><span>:</span><span>{penilai.nama}</span>
                                <span>NIP/NIK</span><span>:</span><span>{penilai.nip || '..............................'}</span>
                                {/* PERBAIKAN: Gunakan 'jabatan' dari tabel user atau fallback ke 'role' */}
                                <span>Jabatan</span><span>:</span><span>{penilai.jabatan || penilai.role}</span>
                            </div>
                        ))}
                    </div>

                    <p className="mt-4 indent-8">
                        Dengan ini menyatakan bahwa penilaian pernyataan mandiri pelaku Usaha Mikro dan Kecil (UMK)
                        atas nama <strong>{ba.pemegang?.nama_pelaku_usaha}</strong> tidak dapat dilaksanakan, dikarenakan:
                    </p>
                    <p className="mt-4 indent-8">
                        Pemegang pernyataan mandiri pelaku UMK tidak <strong>{alasanText}</strong>.
                        Hal tersebut mengakibatkan penilaian pernyataan mandiri pelaku UMK tidak terlaksana sebagaimana seharusnya.
                    </p>
                    <p className="mt-4 indent-8">
                        Demikian Berita Acara ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
                    </p>
                </div>

                <div className="mt-12">
                    <h4 className="font-semibold text-center">Tanda Tangan Tim Penilai</h4>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-10 mt-6 text-center">

                        {ba.tim_penilai?.map((member, index) => (
                            <div key={member.id} className="signature-block mt-4">
                                <p>{member.jabatan}</p>
                                <div className="h-24 w-full my-2 flex items-center justify-center">
                                    {signatureMap[member.id] && (
                                        <img src={`http://127.0.0.1:8000/storage/${signatureMap[member.id]}`} alt={`Tanda Tangan ${member.nama}`} className="h-full object-contain" />
                                    )}
                                </div>
                                <p className="font-bold underline">({member.nama})</p>
                                <p>NIP/NIK: {member.nip || '..............................'}</p>
                            </div>
                        ))}

                    </div>
                </div>
            </div>
        </div>
    );
}
