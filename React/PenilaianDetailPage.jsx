import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios.js';
import SignatureCanvas from 'react-signature-canvas';
import { useAuth } from '../context/AuthContext.jsx';

// --- Komponen-komponen Reusable ---

const DeskStudyRow = ({ index, data, onChange, errors, isReadOnly }) => {
    const hasError = (field) => errors && errors[`desk_study.${index}.${field}`];
    const disabledClasses = isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300';

    return (
        <tr className="border-b">
            <td className="p-2 align-top"><textarea name={`desk_study.${index}.pernyataan_mandiri_lokasi`} value={data.pernyataan_mandiri_lokasi || ''} onChange={onChange} className={`w-full border rounded-md p-1 text-sm ${hasError('pernyataan_mandiri_lokasi') ? 'border-red-500 ring-1 ring-red-500' : disabledClasses}`} rows="3" placeholder="Alamat & Koordinat" disabled={isReadOnly}></textarea></td>
            <td className="p-2 align-top"><textarea name={`desk_study.${index}.pernyataan_mandiri_jenis`} value={data.pernyataan_mandiri_jenis || ''} onChange={onChange} className={`w-full border rounded-md p-1 text-sm ${hasError('pernyataan_mandiri_jenis') ? 'border-red-500 ring-1 ring-red-500' : disabledClasses}`} rows="3" placeholder="Jenis Kegiatan" disabled={isReadOnly}></textarea></td>
            <td className="p-2 align-top"><textarea name={`desk_study.${index}.ketentuan_rtr_jenis`} value={data.ketentuan_rtr_jenis || ''} onChange={onChange} className={`w-full border rounded-md p-1 text-sm ${hasError('ketentuan_rtr_jenis') ? 'border-red-500 ring-1 ring-red-500' : disabledClasses}`} rows="3" placeholder="Zona Kawasan" disabled={isReadOnly}></textarea></td>
            <td className="p-2 align-top"><textarea name={`desk_study.${index}.ketentuan_rtr_arahan`} value={data.ketentuan_rtr_arahan || ''} onChange={onChange} className={`w-full border rounded-md p-1 text-sm ${hasError('ketentuan_rtr_arahan') ? 'border-red-500 ring-1 ring-red-500' : disabledClasses}`} rows="3" placeholder="Arahan Pemanfaatan" disabled={isReadOnly}></textarea></td>
            <td className="p-2 align-top">
                <select name={`desk_study.${index}.hasil_kesesuaian`} value={data.hasil_kesesuaian || 'Sesuai'} onChange={onChange} className={`w-full border rounded-md p-1 text-sm ${disabledClasses} ${isReadOnly ? 'appearance-none print:appearance-none' : ''}`} disabled={isReadOnly}>
                    <option value="Sesuai">Sesuai</option>
                    <option value="Tidak Sesuai">Tidak Sesuai</option>
                </select>
            </td>
        </tr>
    );
};

const PemeriksaanRow = ({ no, komponen, subKomponen, data, index, onChange, errors, isReadOnly }) => {
    const hasError = (field) => errors && errors[`pemeriksaan.${index}.${field}`];
    const disabledClasses = isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300';
    
    return (
        <tr className="border-b">
            {no && <td className="p-2 align-top text-center" rowSpan={komponen.rowSpan}>{no}</td>}
            {komponen.label && <td className="p-2 align-top font-medium text-gray-700" rowSpan={komponen.rowSpan}>{komponen.label}</td>}
            <td className="p-2 align-top pl-4 text-gray-600">{subKomponen}</td>
            <td className="p-2 align-top">
                <input 
                    type="text" 
                    name={`pemeriksaan.${index}.pernyataan_mandiri`} 
                    value={data.pernyataan_mandiri || ''} 
                    onChange={onChange} 
                    className={`w-full border rounded-md p-1 text-sm ${hasError('pernyataan_mandiri') ? 'border-red-500 ring-1 ring-red-500' : disabledClasses}`} 
                    disabled={isReadOnly}
                />
            </td>
            <td className="p-2 align-top">
                <select 
                    name={`pemeriksaan.${index}.hasil_pemeriksaan`} 
                    value={data.hasil_pemeriksaan || 'Sesuai'} 
                    onChange={onChange} 
                    className={`w-full border rounded-md p-1 text-sm ${hasError('hasil_pemeriksaan') ? 'border-red-500 ring-1 ring-red-500' : disabledClasses} ${isReadOnly ? 'appearance-none print:appearance-none' : ''}`}
                    disabled={isReadOnly}
                >
                    <option value="Sesuai">Sesuai</option>
                    <option value="Tidak Sesuai">Tidak Sesuai</option>
                </select>
            </td>
        </tr>
    );
};

const PengukuranRow = ({ no, main, sub, unit, data, index, onChange, isReadOnly }) => {
    // PERUBAHAN: Menambahkan opsi "Tidak sesuai"
    const keteranganOptions = [
        "Sesuai",
        "Tidak sesuai",
        "Tidak Ada Ketentuan",
        "Belum Dapat Dinilai",
        "penilaian tidak dapat dilanjutkan"
    ];
    const disabledClasses = isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300';
    const isLongText = [
        "penilaian tidak dapat dilanjutkan",
        "Belum Dapat Dinilai",
        "Tidak Ada Ketentuan"
    ].includes(data.keterangan);
    
    const selectClasses = `w-full border rounded-md p-1 text-sm ${disabledClasses} ${isReadOnly ? 'appearance-none print:appearance-none' : ''} ${isLongText ? 'whitespace-normal' : ''}`;

    return (
        <tr className="border-b">
            {no && <td className="p-2 align-top text-center" rowSpan={main.rowSpan}>{no}</td>}
            {main.label && <td className="p-2 align-top font-medium text-gray-700" rowSpan={main.rowSpan}>{main.label}</td>}
            <td className="p-2 align-top pl-4 text-gray-600">{sub}</td>
            <td className="p-2 flex items-center">
                <input 
                    type="number" 
                    step="any" 
                    name={`pengukuran.${index}.hasil_pengukuran`} 
                    value={data.hasil_pengukuran || ''} 
                    onChange={onChange} 
                    className={`w-full border rounded-md p-1 text-sm ${disabledClasses}`}
                    disabled={isReadOnly}
                />
                {unit && <span className="ml-2 text-sm text-gray-500" dangerouslySetInnerHTML={{ __html: unit }} />}
            </td>
            <td className="p-2">
                <select 
                    name={`pengukuran.${index}.keterangan`} 
                    value={data.keterangan || ''} 
                    onChange={onChange} 
                    className={selectClasses}
                    disabled={isReadOnly}
                >
                    <option value="">Pilih Keterangan</option>
                    {keteranganOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </td>
        </tr>
    );
};


export default function PenilaianDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [kasus, setKasus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState({});
    
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [initialPenilaianExists, setInitialPenilaianExists] = useState(false);

    // PERBAIKAN: State untuk mengelola tanda tangan per user_id
    const [signatures, setSignatures] = useState({});
    const signatureRefs = useRef({});

    const [formData, setFormData] = useState({
        desk_study: [{ hasil_kesesuaian: 'Sesuai' }],
        pemeriksaan: Array.from({ length: 8 }, () => ({ hasil_pemeriksaan: 'Sesuai' })),
        pengukuran: Array.from({ length: 12 }, () => ({})),
        catatan: '',
    });
    
    // **LOGIKA BARU: Tentukan apakah desk study tidak sesuai**
    // `useMemo` digunakan untuk efisiensi, agar kalkulasi tidak berjalan di setiap render
    const isDeskStudyTidakSesuai = useMemo(() => {
        return formData.desk_study.some(item => item.hasil_kesesuaian === 'Tidak Sesuai');
    }, [formData.desk_study]);
    
    // **LOGIKA BARU: Gabungkan kondisi read-only**
    const isPemeriksaanDisabled = isReadOnly || isDeskStudyTidakSesuai;
    const isPengukuranDisabled = isReadOnly || isDeskStudyTidakSesuai;

    const pemeriksaanStruktur = [ 
        { no: '1', komponen: { label: 'Lokasi Usaha', rowSpan: 7 }, subKomponen: 'Alamat' },
        { subKomponen: 'Desa/Kelurahan' },
        { subKomponen: 'Kecamatan' },
        { subKomponen: 'Kabupaten/Kota' },
        { subKomponen: 'Provinsi' },
        { subKomponen: 'Lintang' },
        { subKomponen: 'Bujur' },
        { no: '2', komponen: { label: 'Kegiatan Pemanfaatan Ruang', rowSpan: 1 }, subKomponen: 'Jenis' },
     ];
    const pengukuranStruktur = [ 
        { no: '1', main: { label: 'Luas Tanah', rowSpan: 2 }, sub: 'Luas Tanah yang digunakan kegiatan Pemanfaatan Ruang', unit: 'm&sup2;' },
        { sub: 'Luas Tanah yang dikuasai', unit: 'm&sup2;' },
        { no: '2', main: { label: 'KDB', rowSpan: 1 }, sub: 'Luas Lantai Dasar Bangunan', unit: 'm&sup2;' },
        { no: '3', main: { label: 'KLB', rowSpan: 2 }, sub: 'Jumlah Lantai Bangunan', unit: 'lantai' },
        { sub: 'Luas Seluruh Lantai Bangunan', unit: 'm&sup2;' },
        { no: '4', main: { label: 'Ketinggian Bangunan', rowSpan: 1 }, sub: 'Ketinggian Bangunan', unit: 'm' },
        { no: '5', main: { label: 'KDH', rowSpan: 2 }, sub: 'Luas Tanah yang Terdapat Vegetasi', unit: 'm&sup2;' },
        { sub: 'Luas Tanah yang Tertutup Perkerasan yang masih dapat meresapkan air', unit: 'm&sup2;' },
        { no: '6', main: { label: 'Koefisien Tapak Basemen', rowSpan: 1 }, sub: 'Luas Basemen', unit: 'm&sup2;' },
        { no: '7', main: { label: 'Garis Sempadan Bangunan', rowSpan: 1 }, sub: 'Jarak Bangunan Terdepan dengan Pagar', unit: 'm' },
        { no: '8', main: { label: 'Jarak Bebas Bangunan', rowSpan: 2 }, sub: 'Jarak Bangunan Terbelakang dengan Garis Batas Petak Belakang', unit: 'm' },
        { sub: 'Jarak Bangunan Samping dengan Garis Batas Petak Samping', unit: 'm' },
     ];

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/penilaian/pmp-umk/${id}`);
            const kasusData = response.data;
            setKasus(kasusData);

            if (kasusData.penilaian) {
                setIsReadOnly(true);
                setInitialPenilaianExists(true); 

                const mergedDeskStudy = (kasusData.penilaian.desk_study && kasusData.penilaian.desk_study.length > 0)
                    ? kasusData.penilaian.desk_study.map(item => ({ hasil_kesesuaian: 'Sesuai', ...item }))
                    : [{ hasil_kesesuaian: 'Sesuai' }];
                
                const mergedPemeriksaan = Array.from({ length: 8 }, (_, i) => ({
                    hasil_pemeriksaan: 'Sesuai',
                    ...(kasusData.penilaian.pemeriksaan?.[i] || {})
                }));

                const mergedPengukuran = Array.from({ length: 12 }, (_, i) => ({
                    ...(kasusData.penilaian.pengukuran?.[i] || {})
                }));

                setFormData({
                    desk_study: mergedDeskStudy,
                    pemeriksaan: mergedPemeriksaan,
                    pengukuran: mergedPengukuran,
                    catatan: kasusData.penilaian.catatan || '',
                });
                
                // PERBAIKAN: Memuat tanda tangan yang sudah ada ke dalam state
                if (kasusData.penilaian.tanda_tangan_tim) {
                    const sigs = kasusData.penilaian.tanda_tangan_tim.reduce((acc, curr) => {
                        acc[curr.user_id] = curr.signature_path;
                        return acc;
                    }, {});
                    setSignatures(sigs);
                }
            }
        } catch (err) {
            setError('Gagal memuat detail data PMP UMK.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id, user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const [section, index, field] = name.split('.');

        setFormData(prev => {
            const newSectionData = [...prev[section]];
            newSectionData[index] = { ...newSectionData[index], [field]: value };
            return { ...prev, [section]: newSectionData };
        });
    };
    
    const validateForm = () => {
        const errors = {};
        formData.desk_study.forEach((item, index) => {
            if (!item.pernyataan_mandiri_lokasi?.trim()) errors[`desk_study.${index}.pernyataan_mandiri_lokasi`] = true;
            if (!item.pernyataan_mandiri_jenis?.trim()) errors[`desk_study.${index}.pernyataan_mandiri_jenis`] = true;
            if (!item.ketentuan_rtr_jenis?.trim()) errors[`desk_study.${index}.ketentuan_rtr_jenis`] = true;
            if (!item.ketentuan_rtr_arahan?.trim()) errors[`desk_study.${index}.ketentuan_rtr_arahan`] = true;
        });

        // **LOGIKA BARU: Validasi Pemeriksaan hanya jika desk study sesuai**
        if (!isDeskStudyTidakSesuai) {
            formData.pemeriksaan.forEach((item, index) => {
                if (!item.pernyataan_mandiri?.trim()) errors[`pemeriksaan.${index}.pernyataan_mandiri`] = true;
            });
        }
        
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isReadOnly) return;

        setError('');
        setValidationErrors({});
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setValidationErrors(newErrors);
            setError('Harap lengkapi semua field yang ditandai merah.');
            return;
        }

        // PEROMBAKAN: Logika untuk mengumpulkan tanda tangan dari semua anggota tim
        const signatureData = [];
        let allMembersSigned = true;

        kasus.tim?.users?.forEach(member => {
            const sigCanvas = signatureRefs.current[member.id];
            const hasExistingSignature = !!signatures[member.id];
            const isCanvasEmpty = !sigCanvas || sigCanvas.isEmpty();

            if (!isCanvasEmpty) {
                // Jika ada tanda tangan baru di canvas, tambahkan
                signatureData.push({
                    user_id: member.id,
                    signature: sigCanvas.toDataURL(),
                });
            } else if (!hasExistingSignature) {
                // Jika tidak ada tanda tangan lama dan canvas kosong
                allMembersSigned = false;
            }
        });

        if (!allMembersSigned && !initialPenilaianExists) {
            setError('Semua anggota tim harus memberikan tanda tangan pada penilaian pertama.');
            return;
        }

        const submissionData = { ...formData };
        submissionData.tanda_tangan_tim = signatureData;
        
        // **LOGIKA BARU: Kosongkan data pemeriksaan & pengukuran jika desk study tidak sesuai**
        if (isDeskStudyTidakSesuai) {
            submissionData.pemeriksaan = Array.from({ length: 8 }, () => ({ hasil_pemeriksaan: 'Sesuai' }));
            submissionData.pengukuran = Array.from({ length: 12 }, () => ({}));
        }
        
        setSubmitLoading(true);
        try {
            await api.post(`/penilaian/pmp-umk/${id}`, submissionData);
            alert(initialPenilaianExists ? 'Perubahan berhasil disimpan!' : 'Penilaian berhasil disimpan!');
            setIsReadOnly(true);
            fetchDetail(); 
        } catch (err) {
             const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat menyimpan penilaian.';
             setError(errorMsg);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <p className="text-center py-10">Memuat formulir...</p>;
    if (error && !Object.keys(validationErrors).length) return <p className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</p>;
    if (!kasus) return null;

    return (
        <div>
            <div className="mb-6 flex justify-between items-center print:hidden">
                <Link to="/penilaian" className="text-blue-600 hover:underline">&larr; Kembali ke Dashboard Penilaian</Link>
                <div className="flex items-center space-x-2">
                    <button onClick={handlePrint} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg text-sm">
                        Print
                    </button>
                    {initialPenilaianExists && isReadOnly && user && ['Admin', 'Ketua Tim', 'Koordinator Lapangan'].includes(user.role) && (
                         <button type="button" onClick={() => setIsReadOnly(false)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg text-sm">
                            Edit
                        </button>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-lg shadow-lg max-w-6xl mx-auto space-y-8">
                <div className="text-center">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">FORMULIR PEMERIKSAAN DAN PENGUKURAN</h2>
                    <p className="text-gray-600">Penilaian Pernyataan Mandiri Pelaku Usaha Mikro dan Kecil</p>
                </div>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 print:hidden" role="alert">
                        <p className="font-bold">Gagal Menyimpan</p>
                        <p>{error}</p>
                    </div>
                )}
                
                {isReadOnly && initialPenilaianExists && (
                    <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 print:hidden" role="alert">
                        <p className="font-bold">Mode Tampilan</p>
                        <p>Formulir ini hanya untuk dilihat. Klik tombol 'Edit' untuk mengubah data jika memiliki izin.</p>
                    </div>
                )}
                
                <fieldset className="border p-4 rounded-md">
                    <legend className="text-lg font-semibold px-2">1. Data Pelaku UMK</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mt-2 text-sm p-2">
                        <p><strong className="font-medium text-gray-600 w-40 inline-block">Nama Pelaku Usaha</strong>: {kasus.pemegang?.nama_pelaku_usaha || '-'}</p>
                        <p><strong className="font-medium text-gray-600 w-40 inline-block">Nomor Identitas</strong>: {kasus.pemegang?.nomor_identitas || '-'}</p>
                        <p className="md:col-span-2"><strong className="font-medium text-gray-600 w-40 inline-block">Alamat</strong>: {kasus.pemegang?.alamat || '-'}</p>
                        <p><strong className="font-medium text-gray-600 w-40 inline-block">Email</strong>: {kasus.pemegang?.email || '-'}</p>
                        <p><strong className="font-medium text-gray-600 w-40 inline-block">Nomor Telepon</strong>: {kasus.pemegang?.nomor_handphone || '-'}</p>
                    </div>
                </fieldset>

                <fieldset className="border p-4 rounded-md">
                     <legend className="text-lg font-semibold px-2">2. Kesesuaian dengan Rencana Tata Ruang (Desk Study)</legend>
                     <div className="overflow-x-auto mt-2">
                         <table className="min-w-full text-sm">
                             <thead className="bg-gray-100 text-left">
                                 <tr>
                                     <th colSpan="2" className="p-2 border font-semibold">Ketentuan berdasarkan Pernyataan Mandiri Pelaku UMK</th>
                                     <th colSpan="2" className="p-2 border font-semibold">Ketentuan dalam RTR</th>
                                     <th rowSpan="2" className="p-2 border font-semibold align-middle">Hasil Kesesuaian</th>
                                 </tr>
                                 <tr>
                                     <th className="p-2 border font-medium">Lokasi Usaha</th>
                                     <th className="p-2 border font-medium">Jenis Kegiatan Usaha</th>
                                     <th className="p-2 border font-medium">Jenis Peruntukan</th>
                                     <th className="p-2 border font-medium">Arahan/Ketentuan</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {formData.desk_study.map((item, index) => (
                                     <DeskStudyRow key={index} index={index} data={item} onChange={handleChange} errors={validationErrors} isReadOnly={isReadOnly} />
                                 ))}
                             </tbody>
                         </table>
                     </div>
                </fieldset>

                {/* **LOGIKA BARU: Fieldset Pemeriksaan dengan kondisi disable** */}
                <fieldset className={`border p-4 rounded-md transition-opacity ${isPemeriksaanDisabled ? 'bg-gray-50 opacity-60 cursor-not-allowed' : ''}`}>
                     <legend className="text-lg font-semibold px-2">3. Pemeriksaan</legend>
                     {/* **LOGIKA BARU: Pesan peringatan jika form dinonaktifkan** */}
                     {isDeskStudyTidakSesuai && !isReadOnly && (
                        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-3 my-2 text-sm" role="alert">
                           Formulir Pemeriksaan dinonaktifkan karena hasil Desk Study adalah "Tidak Sesuai".
                        </div>
                     )}
                      <div className="overflow-x-auto mt-2">
                         <table className="min-w-full text-sm">
                             <thead className="bg-gray-100 text-left">
                                 <tr>
                                     <th className="p-2 border font-semibold w-12">No.</th>
                                     <th colSpan="2" className="p-2 border font-semibold">Komponen</th>
                                     <th className="p-2 border font-semibold">Ketentuan berdasarkan Pernyataan Mandiri</th>
                                     <th className="p-2 border font-semibold">Hasil Pemeriksaan</th>
                                 </tr>
                             </thead>
                             <tbody>
                                {pemeriksaanStruktur.map((item, index) => (
                                    <PemeriksaanRow 
                                        key={index} 
                                        index={index}
                                        no={item.no}
                                        komponen={item.komponen || {}}
                                        subKomponen={item.subKomponen}
                                        data={formData.pemeriksaan[index]} 
                                        onChange={handleChange} 
                                        errors={validationErrors} 
                                        isReadOnly={isPemeriksaanDisabled} // **GUNAKAN KONDISI BARU**
                                    />
                                ))}
                             </tbody>
                         </table>
                     </div>
                </fieldset>
                
                {/* **LOGIKA BARU: Fieldset Pengukuran dengan kondisi disable** */}
                <fieldset className={`border p-4 rounded-md transition-opacity ${isPengukuranDisabled ? 'bg-gray-50 opacity-60 cursor-not-allowed' : ''}`}>
                    <legend className="text-lg font-semibold px-2">4. Pengukuran</legend>
                    {/* **LOGIKA BARU: Pesan peringatan jika form dinonaktifkan** */}
                    {isDeskStudyTidakSesuai && !isReadOnly && (
                        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-3 my-2 text-sm" role="alert">
                           Formulir Pengukuran dinonaktifkan karena hasil Desk Study adalah "Tidak Sesuai".
                        </div>
                    )}
                    <div className="overflow-x-auto mt-2">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100 text-left">
                                <tr>
                                    <th className="p-2 border font-semibold w-12">No.</th>
                                    <th colSpan="2" className="p-2 border font-semibold">Komponen yang Dinilai</th>
                                    <th className="p-2 border font-semibold">Hasil Pengukuran</th>
                                    <th className="p-2 border font-semibold">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pengukuranStruktur.map((item, index) => (
                                    <PengukuranRow 
                                        key={index} 
                                        index={index}
                                        no={item.no}
                                        main={item.main || {}}
                                        sub={item.sub}
                                        unit={item.unit}
                                        data={formData.pengukuran[index]} 
                                        onChange={handleChange}
                                        isReadOnly={isPengukuranDisabled} // **GUNAKAN KONDISI BARU**
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </fieldset>

                <div>
                     <label htmlFor="catatan" className="block text-sm font-medium text-gray-700 font-semibold">Catatan Tambahan:</label>
                     <textarea id="catatan" name="catatan" value={formData.catatan} onChange={(e) => setFormData(p => ({...p, catatan: e.target.value}))} rows="4" className={`mt-1 block w-full rounded-md shadow-sm ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'}`} disabled={isReadOnly}></textarea>
                </div>
                
                {/* PEROMBAKAN: Bagian Petugas Penilai dan Tanda Tangan */}
                <div className="pt-6 border-t mt-6">
                    <h3 className="text-lg font-semibold px-2 mb-4">5. Petugas Penilai</h3>
                    <div className="space-y-6">
                        {kasus.tim?.users?.map(member => (
                            <div key={member.id} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-4 border rounded-md">
                                {/* Kolom Info Petugas */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 font-semibold">Nama Petugas</label>
                                    <p className="mt-1 p-2 border rounded-md bg-gray-50">{member.nama}</p>
                                    
                                    {/* PERUBAHAN: Menambahkan field NIP/NIK */}
                                    <label className="block text-sm font-medium text-gray-700 font-semibold mt-2">NIP/NIK</label>
                                    <p className="mt-1 p-2 border rounded-md bg-gray-50">{member.nip || 'Tidak tersedia'}</p>

                                    <label className="block text-sm font-medium text-gray-700 font-semibold mt-2">Jabatan</label>
                                    <p className="mt-1 p-2 border rounded-md bg-gray-50">{member.pivot?.jabatan_di_tim || member.role}</p>
                                </div>
                                
                                {/* Kolom Tanda Tangan */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 font-semibold">
                                        {signatures[member.id] ? 'Tanda Tangan Tersimpan:' : 'Tanda Tangan Digital:'}
                                    </label>
                                    
                                    {signatures[member.id] ? (
                                        <div className="my-1">
                                            <img src={`http://127.0.0.1:8000/storage/${signatures[member.id]}`} alt={`Tanda Tangan ${member.nama}`} className="mx-auto h-24 border rounded bg-white"/>
                                        </div>
                                    ) : (
                                        !isReadOnly && <p className="text-xs text-gray-500 my-1">Belum ada tanda tangan.</p>
                                    )}
                                    
                                    {!isReadOnly && (
                                        <>
                                            <div className="border border-gray-300 rounded-md bg-white">
                                                <SignatureCanvas 
                                                    ref={el => signatureRefs.current[member.id] = el}
                                                    penColor='black' 
                                                    canvasProps={{className: 'w-full h-32'}} 
                                                />
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => signatureRefs.current[member.id]?.clear()} 
                                                className="text-sm text-blue-600 hover:underline mt-1">
                                                Ulangi Tanda Tangan
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {!isReadOnly && (
                    <div className="flex justify-end pt-4 print:hidden">
                        <button type="submit" disabled={submitLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md disabled:bg-blue-400">
                            {submitLoading ? 'Menyimpan...' : (initialPenilaianExists ? 'Simpan Perubahan' : 'Simpan Hasil Penilaian')}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}

