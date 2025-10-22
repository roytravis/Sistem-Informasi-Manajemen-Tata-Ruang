import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

const ReportItem = ({ label, value }) => (
    <tr className="border-b">
        <td className="py-3 px-4 text-sm font-medium text-gray-600 w-1/3">{label}</td>
        <td className="py-3 px-4 text-sm text-gray-800">: {value || '-'}</td>
    </tr>
);

export default function LaporanPage() {
    const { id } = useParams();
    const [kasus, setKasus] = useState(null);
    const [survei, setSurvei] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLaporanData = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/kasus/${id}`);
                setKasus(response.data);
                if (response.data.surveis && response.data.surveis.length > 0) {
                    setSurvei(response.data.surveis[response.data.surveis.length - 1]);
                }
            } catch (err) {
                setError('Gagal memuat data untuk laporan.');
            } finally {
                setLoading(false);
            }
        };
        fetchLaporanData();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="text-center py-10">Memuat Laporan...</div>;
    if (error) return <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>;
    if (!kasus) return <div className="text-center py-10">Data kasus tidak ditemukan.</div>;

    const { data_formulir } = survei || {};
    const { pemeriksaan, pengukuran, tata_bangunan } = data_formulir || {};
    const { pemegang } = kasus;
    const fullAlamat = [pemegang?.alamat, pemegang?.desa_kelurahan, pemegang?.kecamatan].filter(Boolean).join(', ');

    return (
        <div>
            <div className="mb-6 flex justify-between items-center print:hidden">
                <Link to={`/kasus/${id}`} className="text-blue-600 hover:underline">&larr; Kembali ke Detail Kasus</Link>
                <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300">
                    Cetak Laporan
                </button>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto printable-area">
                <div className="text-center border-b pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">LAPORAN HASIL PENILAIAN</h2>
                    <p className="text-sm text-gray-500">Kesesuaian Kegiatan Pemanfaatan Ruang (KKPR)</p>
                </div>

                <section className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">A. Data Umum</h3>
                    <table className="w-full">
                        <tbody>
                            <ReportItem label="Nomor Permohonan" value={kasus.nomor_permohonan} />
                            <ReportItem label="Jenis" value={kasus.jenis} />
                            <ReportItem label="Nama Pelaku Usaha" value={pemegang?.nama_pelaku_usaha} />
                            <ReportItem label="Nomor Identitas" value={pemegang?.nomor_identitas} />
                            <ReportItem label="Kegiatan" value={pemegang?.kegiatan} />
                            <ReportItem label="Alamat" value={fullAlamat} />
                            {/* PERUBAHAN: Label diubah */}
                            <ReportItem label="Koordinator Lapangan" value={kasus.penanggung_jawab?.nama} />
                        </tbody>
                    </table>
                </section>
                
                {!survei ? (
                     <p className="text-center text-gray-500">Belum ada data survei untuk ditampilkan dalam laporan ini.</p>
                ) : (
                    <>
                        <section className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">B. Hasil Survei Lapangan</h3>
                             <table className="w-full">
                                <tbody>
                                    <ReportItem label="Tanggal Survei" value={new Date(survei.tanggal_survey).toLocaleDateString('id-ID')} />
                                    <ReportItem label="Petugas" value={kasus.surveis.find(s => s.id === survei.id)?.petugas?.nama} />
                                    <ReportItem label="Lokasi (Lat, Lng)" value={`${survei.lokasi_lat}, ${survei.lokasi_lng}`} />
                                </tbody>
                            </table>
                        </section>
                        
                        <section>
                             <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">C. Detail Pemeriksaan dan Pengukuran</h3>
                             <table className="w-full">
                                <tbody>
                                    <tr className="bg-gray-50"><td colSpan="2" className="py-2 px-4 font-semibold">Data Pemeriksaan</td></tr>
                                    <ReportItem label="Luas Tanah Dikuasai (m²)" value={pemeriksaan?.luas_tanah_dikuasai} />
                                    <ReportItem label="Jenis Kegiatan" value={pemeriksaan?.jenis_kegiatan} />
                                    <ReportItem label="Indikasi Program" value={pemeriksaan?.indikasi_program} />

                                    <tr className="bg-gray-50"><td colSpan="2" className="py-2 px-4 font-semibold">Intensitas Ruang</td></tr>
                                    <ReportItem label="KDB (%)" value={pengukuran?.kdb} />
                                    <ReportItem label="KLB" value={pengukuran?.klb} />
                                    <ReportItem label="KDH (%)" value={pengukuran?.kdh} />
                                    <ReportItem label="KTB (%)" value={pengukuran?.ktb} />

                                     <tr className="bg-gray-50"><td colSpan="2" className="py-2 px-4 font-semibold">Ketentuan Tata Bangunan</td></tr>
                                     <ReportItem label="Tinggi Bangunan (m)" value={tata_bangunan?.tinggi_bangunan} />
                                     <ReportItem label="Jumlah Lantai" value={tata_bangunan?.jumlah_lantai} />
                                     <ReportItem label="GSB (m)" value={tata_bangunan?.gsb} />
                                     <ReportItem label="JBB (m)" value={tata_bangunan?.jbb} />
                                </tbody>
                            </table>
                        </section>

                        <section className="mt-12 grid grid-cols-2 gap-8 text-center">
                            <div>
                                <h4 className="font-semibold mb-2">Petugas Survei</h4>
                                <img src={`http://127.0.0.1:8000/storage/${survei.tanda_tangan_petugas}`} alt="TTD Petugas" className="mx-auto h-24 border-b"/>
                                <p className="mt-2">{kasus.surveis.find(s => s.id === survei.id)?.petugas?.nama}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold mb-2">Pemegang/Perwakilan</h4>
                                <img src={`http://127.0.0.1:8000/storage/${survei.tanda_tangan_pemegang}`} alt="TTD Pemegang" className="mx-auto h-24 border-b"/>
                                <p className="mt-2">{pemegang?.nama_pelaku_usaha}</p>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}

