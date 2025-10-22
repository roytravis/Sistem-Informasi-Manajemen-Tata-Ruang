import { useState, useEffect } from 'react';
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

    if (loading) return <div className="text-center py-10">Memuat preview...</div>;
    if (error) return <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>;
    if (!ba) return <div className="text-center py-10">Data Berita Acara tidak ditemukan.</div>;
    
    // Format Tanggal
    const date = new Date(ba.tanggal_ba);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' };
    const formatter = new Intl.DateTimeFormat('id-ID', options);
    const parts = formatter.formatToParts(date).reduce((acc, part) => ({...acc, [part.type]: part.value}), {});
    
    const alasanText = ba.alasan === 'Lainnya' ? ba.keterangan_lainnya : ba.alasan.toLowerCase();

    return (
        <div>
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .printable-area, .printable-area * { visibility: visible; }
                    .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none; }
                }
            `}</style>

            <div className="mb-6 flex justify-between items-center no-print">
                <Link to="/penilaian" className="text-blue-600 hover:underline">&larr; Kembali ke Dashboard Penilaian</Link>
                <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                    Cetak
                </button>
            </div>

            <div className="bg-white p-8 md:p-12 rounded-lg shadow-lg max-w-4xl mx-auto printable-area font-serif">
                <div className="text-center border-b-2 border-black pb-4">
                    <h2 className="text-xl font-bold tracking-wider">BERITA ACARA</h2>
                    <h3 className="text-lg font-bold tracking-wider">TIDAK TERLAKSANANYA PENILAIAN PERNYATAAN MANDIRI</h3>
                    <h3 className="text-lg font-bold tracking-wider">PELAKU USAHA MIKRO DAN KECIL</h3>
                    <p className="mt-2 text-sm">Nomor: {ba.nomor_ba}</p>
                </div>

                <div className="mt-8 text-justify leading-relaxed">
                    <p>
                        Pada hari ini, {parts.weekday} tanggal {parts.day} bulan {parts.month} tahun {parts.year}, 
                        yang bertanda tangan di bawah ini:
                    </p>
                    
                    <div className="mt-4 pl-4 space-y-4">
                        {ba?.timPenilai?.map((penilai, index) => (
                            <div key={penilai.id}>
                                <p>{index + 1}. <span className="inline-block w-24">Nama</span>: {penilai.nama}</p>
                                <p><span className="inline-block w-28 pl-5">NIP/NIK</span>: {penilai.nip || '-'}</p>
                                <p><span className="inline-block w-28 pl-5">Jabatan</span>: {penilai.role}</p>
                            </div>
                        ))}
                    </div>

                    <p className="mt-6">
                        Menyatakan bahwa penilaian pernyataan mandiri Pelaku Usaha Mikro dan Kecil (UMK) 
                        atas nama <strong>{ba.pemegang?.nama_pelaku_usaha}</strong> tidak dapat dilaksanakan karena{' '}
                        <strong>{alasanText}</strong>.
                    </p>

                    <p className="mt-6">
                        Demikian Berita Acara ini dibuat untuk dipergunakan sebagaimana mestinya.
                    </p>
                </div>
                
                <div className="mt-12">
                    <h4 className="font-semibold text-center mb-2">Tim Penilai,</h4>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-16 mt-20 text-center">
                        {ba?.timPenilai?.map(penilai => (
                            <div key={penilai.id}>
                                <p className="border-t border-black pt-2 font-semibold">{penilai.nama}</p>
                                <p className="text-sm">NIP. {penilai.nip || '-'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

