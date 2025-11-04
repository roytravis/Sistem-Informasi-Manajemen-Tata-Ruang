import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios.js';
import SignatureCanvas from 'react-signature-canvas';
import { useAuth } from '../context/AuthContext.jsx';

// --- Komponen-komponen Reusable ---

const DeskStudyRow = ({ index, data, onChange, errors, isReadOnly }) => {
    const hasError = (field) => errors && errors[`desk_study.${index}.${field}`];
    const disabledClasses = isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300';
    // Mengambil nilai untuk ditampilkan di div alternatif
    const arahanValue = data.ketentuan_rtr_arahan || '';

    return (
        <tr className="border-b">
            <td className="p-2 align-top">
                {/* Textarea untuk layar */}
                <textarea
                    name={`desk_study.${index}.pernyataan_mandiri_lokasi`}
                    value={data.pernyataan_mandiri_lokasi || ''}
                    onChange={onChange}
                    className={`w-full border rounded-md p-1 text-sm ${hasError('pernyataan_mandiri_lokasi') ? 'border-red-500 ring-1 ring-red-500' : disabledClasses} print:hidden`} // Sembunyikan saat print
                    rows="3"
                    placeholder="Alamat & Koordinat"
                    disabled={isReadOnly}
                ></textarea>
                {/* Div alternatif untuk print */}
                <div className={`hidden print:block whitespace-pre-wrap break-words text-sm print-text-block`}> {/* Tambah class print-text-block */}
                    {data.pernyataan_mandiri_lokasi || ''}
                </div>
            </td>
            <td className="p-2 align-top">
                 {/* Textarea untuk layar */}
                <textarea
                    name={`desk_study.${index}.pernyataan_mandiri_jenis`}
                    value={data.pernyataan_mandiri_jenis || ''}
                    onChange={onChange}
                    className={`w-full border rounded-md p-1 text-sm ${hasError('pernyataan_mandiri_jenis') ? 'border-red-500 ring-1 ring-red-500' : disabledClasses} print:hidden`} // Sembunyikan saat print
                    rows="3"
                    placeholder="Jenis Kegiatan"
                    disabled={isReadOnly}
                ></textarea>
                 {/* Div alternatif untuk print */}
                <div className={`hidden print:block whitespace-pre-wrap break-words text-sm print-text-block`}> {/* Tambah class print-text-block */}
                    {data.pernyataan_mandiri_jenis || ''}
                </div>
            </td>
            <td className="p-2 align-top">
                 {/* Textarea untuk layar */}
                <textarea
                    name={`desk_study.${index}.ketentuan_rtr_jenis`}
                    value={data.ketentuan_rtr_jenis || ''}
                    onChange={onChange}
                    className={`w-full border rounded-md p-1 text-sm ${hasError('ketentuan_rtr_jenis') ? 'border-red-500 ring-1 ring-red-500' : disabledClasses} print:hidden`} // Sembunyikan saat print
                    rows="3"
                    placeholder="Zona Kawasan"
                    disabled={isReadOnly}
                ></textarea>
                 {/* Div alternatif untuk print */}
                <div className={`hidden print:block whitespace-pre-wrap break-words text-sm print-text-block`}> {/* Tambah class print-text-block */}
                    {data.ketentuan_rtr_jenis || ''}
                </div>
            </td>
            {/* INI FIELD YANG BERMASALAH */}
            <td className="p-2 align-top">
                {/* Textarea untuk layar */}
                <textarea
                    name={`desk_study.${index}.ketentuan_rtr_arahan`}
                    value={arahanValue}
                    onChange={onChange}
                    className={`w-full border rounded-md p-1 text-sm ${hasError('ketentuan_rtr_arahan') ? 'border-red-500 ring-1 ring-red-500' : disabledClasses} print:hidden`} // Sembunyikan saat print
                    rows="3"
                    placeholder="Arahan Pemanfaatan"
                    disabled={isReadOnly}
                ></textarea>
                {/* Div alternatif untuk print */}
                <div className={`hidden print:block whitespace-pre-wrap break-words text-sm print-text-block`}> {/* Tambah class print-text-block */}
                    {arahanValue}
                </div>
            </td>
            <td className="p-2 align-top">
                {/* Select untuk layar */}
                <select
                    name={`desk_study.${index}.hasil_kesesuaian`}
                    value={data.hasil_kesesuaian || 'Sesuai'}
                    onChange={onChange}
                    className={`w-full border rounded-md p-1 text-sm ${disabledClasses} ${isReadOnly ? 'appearance-none' : ''} print:hidden`} // Sembunyikan saat print
                    disabled={isReadOnly}
                >
                    <option value="Sesuai">Sesuai</option>
                    <option value="Tidak Sesuai">Tidak Sesuai</option>
                </select>
                {/* Teks alternatif untuk print */}
                 <div className={`hidden print:block text-sm print-text-block`}> {/* Tambah class print-text-block */}
                    {data.hasil_kesesuaian || 'Sesuai'}
                </div>
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
                {/* Input untuk layar */}
                <input
                    type="text"
                    name={`pemeriksaan.${index}.pernyataan_mandiri`}
                    value={data.pernyataan_mandiri || ''}
                    onChange={onChange}
                    className={`w-full border rounded-md p-1 text-sm ${hasError('pernyataan_mandiri') ? 'border-red-500 ring-1 ring-red-500' : disabledClasses} print:hidden`} // Sembunyikan saat print
                    disabled={isReadOnly}
                />
                 {/* Div alternatif untuk print */}
                 <div className={`hidden print:block whitespace-pre-wrap break-words text-sm print-text-block`}> {/* Tambah class print-text-block */}
                    {data.pernyataan_mandiri || ''}
                </div>
            </td>
            <td className="p-2 align-top">
                 {/* Select untuk layar */}
                <select
                    name={`pemeriksaan.${index}.hasil_pemeriksaan`}
                    value={data.hasil_pemeriksaan || 'Sesuai'}
                    onChange={onChange}
                    className={`w-full border rounded-md p-1 text-sm ${hasError('hasil_pemeriksaan') ? 'border-red-500 ring-1 ring-red-500' : disabledClasses} ${isReadOnly ? 'appearance-none' : ''} print:hidden`} // Sembunyikan saat print
                    disabled={isReadOnly}
                >
                    <option value="Sesuai">Sesuai</option>
                    <option value="Tidak Sesuai">Tidak Sesuai</option>
                </select>
                 {/* Teks alternatif untuk print */}
                 <div className={`hidden print:block text-sm print-text-block`}> {/* Tambah class print-text-block */}
                    {data.hasil_pemeriksaan || 'Sesuai'}
                </div>
            </td>
        </tr>
    );
};

const PengukuranRow = ({ no, main, sub, unit, data, index, onChange, isReadOnly }) => {
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

    const selectClasses = `w-full border rounded-md p-1 text-sm ${disabledClasses} ${isReadOnly ? 'appearance-none' : ''} ${isLongText ? 'whitespace-normal' : ''} print:hidden`; // Sembunyikan saat print
    const inputClasses = `w-full border rounded-md p-1 text-sm ${disabledClasses} print:hidden`; // Sembunyikan saat print

    return (
        <tr className="border-b">
            {no && <td className="p-2 align-top text-center" rowSpan={main.rowSpan}>{no}</td>}
            {main.label && <td className="p-2 align-top font-medium text-gray-700" rowSpan={main.rowSpan}>{main.label}</td>}
            <td className="p-2 align-top pl-4 text-gray-600">{sub}</td>
            <td className="p-2 align-top"> {/* Mengubah flex menjadi align-top untuk print */}
                 {/* Input untuk layar */}
                <div className='flex items-center print:hidden'>
                    <input
                        type="number"
                        step="any"
                        name={`pengukuran.${index}.hasil_pengukuran`}
                        value={data.hasil_pengukuran || ''}
                        onChange={onChange}
                        className={inputClasses}
                        disabled={isReadOnly}
                    />
                    {unit && <span className="ml-2 text-sm text-gray-500" dangerouslySetInnerHTML={{ __html: unit }} />}
                </div>
                 {/* Div alternatif untuk print */}
                 <div className={`hidden print:block text-sm print-text-block`}> {/* Tambah class print-text-block */}
                     {(data.hasil_pengukuran || '') + (unit ? ` ${unit.replace(/&sup2;/g, '²')}` : '')} {/* Menampilkan unit */}
                 </div>
            </td>
            <td className="p-2 align-top"> {/* Mengubah ke align-top untuk print */}
                {/* Select untuk layar */}
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
                {/* Teks alternatif untuk print */}
                <div className={`hidden print:block text-sm whitespace-normal print-text-block`}> {/* Menambahkan whitespace-normal dan class print-text-block */}
                    {data.keterangan || ''}
                </div>
            </td>
        </tr>
    );
};


// Komponen PrintStyles diperbarui
const PrintStyles = () => (
    <style>
        {`
            /* Pengaturan Margin Halaman Cetak (Mirip F4) */
            @page {
                size: 21cm 33cm; /* Ukuran F4 */
                margin: 1.5cm 1cm 1.5cm 1cm; /* Top, Right, Bottom, Left */
            }

            @media print {
                /* Sembunyikan SEMUA elemen secara default */
                body * {
                    visibility: hidden !important;
                }
                /* Tampilkan HANYA area printable dan isinya */
                .printable-area, .printable-area * {
                    visibility: visible !important;
                }
                /* Posisikan area printable di awal halaman */
                .printable-area {
                    position: absolute !important; /* Ubah ke absolute */
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important; /* Sesuaikan lebar */
                    margin: 0 !important;
                    padding: 0 !important; /* Hapus padding wrapper saat print */
                    box-shadow: none !important;
                    border: none !important;
                    font-size: 11pt;
                    color: #000;
                    background-color: #fff !important; /* Pastikan background putih */
                }

                 /* Sembunyikan elemen yang ditandai .no-print secara eksplisit */
                .no-print {
                    display: none !important;
                }

                /* Styling dasar untuk teks dalam print */
                .printable-area div, .printable-area p, .printable-area span, .printable-area strong, .printable-area label {
                    color: #000 !important;
                    background-color: transparent !important;
                    font-family: 'Times New Roman', Times, serif; /* Font untuk cetak */
                }

                 /* Styling untuk tabel */
                .printable-area table {
                    width: 100% !important;
                    border-collapse: collapse !important;
                    table-layout: auto;
                    page-break-inside: auto !important; /* Izinkan tabel terpotong antar baris */
                }
                 .printable-area tr {
                    page-break-inside: avoid !important; /* Tapi jangan potong di tengah baris */
                 }
                .printable-area th, .printable-area td {
                    border: 1px solid #ccc !important;
                    padding: 3px 5px !important; /* Sedikit kurangi padding sel */
                    vertical-align: top !important;
                    word-wrap: break-word;
                }
                 .printable-area th {
                    background-color: #f8f8f8 !important;
                    font-weight: bold;
                 }

                /* Kontrol Page Break */
                 fieldset, p {
                     page-break-inside: avoid !important;
                 }
                 /* Terapkan HANYA pada blok petugas individual */
                .signature-block {
                    page-break-inside: avoid !important;
                    margin-bottom: 0.3rem !important; /* Kurangi lagi margin bawah */
                    padding: 0.5rem !important; /* Kurangi padding blok */
                }
                /* Pastikan container mengizinkan break antar blok */
                .signature-container {
                     page-break-inside: auto !important;
                     margin-top: 0 !important; /* Hapus margin atas container */
                 }


                 thead {
                    display: table-header-group !important;
                }
                 .page-break-before {
                    page-break-before: always !important;
                 }

                /* Tanda Tangan */
                .signature-canvas-container {
                    display: none !important;
                }
                .signature-image-container {
                    display: block !important;
                    text-align: center;
                    margin-top: 0.15rem !important; /* Kurangi lagi margin atas gambar ttd */
                    margin-bottom: 0.15rem !important; /* Kurangi lagi margin bawah gambar ttd */
                }
                .signature-image-container img {
                    max-height: 4.5rem !important; /* Perkecil lagi gambar ttd */
                    display: inline-block;
                }

                /* Sembunyikan form asli */
                .printable-area textarea,
                .printable-area input,
                .printable-area select {
                   display: none !important;
                }

                /* Styling div pengganti form */
                 .printable-area div.print-text-block {
                    padding: 0; /* Hapus padding */
                    min-height: 1.1em; /* Sedikit kurangi min-height */
                 }

                 /* Kurangi padding pada fieldset saat print */
                 .printable-area fieldset {
                    padding: 0.4rem !important; /* Kurangi padding fieldset */
                    margin-top: 0.4rem !important; /* Kurangi margin atas fieldset */
                 }
                 .printable-area legend {
                    padding-left: 0.2rem !important; /* Kurangi padding legend */
                    padding-right: 0.2rem !important;
                    font-size: 1.05em !important; /* Sedikit perkecil lagi legend */
                 }
                 /* Kurangi padding pada info petugas */
                 .signature-block div:first-child p {
                     margin-top: 0 !important; /* Hapus margin atas */
                     padding: 1px 3px !important; /* Kurangi padding */
                 }
                 .signature-block label {
                     margin-top: 0.15rem !important; /* Kurangi margin atas label */
                 }
            }

            /* Pengaturan layar (sebaliknya) */
            @media screen {
                .signature-image-container {
                    display: none;
                }
                .print-text-block {
                     display: none; /* Sembunyikan div alternatif di layar */
                 }
            }
        `}
    </style>
);


export default function PenilaianDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [kasus, setKasus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [draftLoading, setDraftLoading] = useState(false); // --- PENAMBAHAN: State loading untuk draft
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    const [isReadOnly, setIsReadOnly] = useState(false);
    const [initialPenilaianExists, setInitialPenilaianExists] = useState(false);

    const [signatures, setSignatures] = useState({});
    const signatureRefs = useRef({});

    const [formData, setFormData] = useState({
        desk_study: [{ hasil_kesesuaian: 'Sesuai' }],
        pemeriksaan: Array.from({ length: 8 }, () => ({ hasil_pemeriksaan: 'Sesuai' })),
        pengukuran: Array.from({ length: 12 }, () => ({})),
        catatan: '',
    });

    const isDeskStudyTidakSesuai = useMemo(() => {
        return formData.desk_study.some(item => item.hasil_kesesuaian === 'Tidak Sesuai');
    }, [formData.desk_study]);

    const petugasLapangan = useMemo(() => {
        if (!kasus || !kasus.tim || !kasus.tim.users) {
            return [];
        }
        return kasus.tim.users.filter(
            member => member.pivot?.jabatan_di_tim === 'Petugas Lapangan'
        );
    }, [kasus]);

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

            const { pemegang } = kasusData;
            const fullAlamat = [pemegang?.alamat, pemegang?.desa_kelurahan, pemegang?.kecamatan].filter(Boolean).join(', ');
            const kegiatan = pemegang?.kegiatan || '';

            if (kasusData.penilaian) {
                // --- PERUBAHAN: Cek status permohonan ---
                // Jika status 'Draft', JANGAN set isReadOnly
                const permohonanRes = await api.get('/permohonan-penilaian'); // Ini kurang ideal, lebih baik jika API kasus mengembalikan status permohonan
                const permohonanTerkait = permohonanRes.data.data.find(p => p.nomor_permohonan === kasusData.nomor_permohonan);

                if (permohonanTerkait && permohonanTerkait.status === 'Draft') {
                    setIsReadOnly(false);
                } else {
                    setIsReadOnly(true);
                }
                // --- AKHIR PERUBAHAN ---

                setInitialPenilaianExists(true);

                let deskStudyData;
                if (kasusData.penilaian.desk_study && kasusData.penilaian.desk_study.length > 0) {
                    deskStudyData = kasusData.penilaian.desk_study.map(item => ({ hasil_kesesuaian: 'Sesuai', ...item }));
                } else {
                    deskStudyData = [{
                        pernyataan_mandiri_lokasi: fullAlamat,
                        pernyataan_mandiri_jenis: kegiatan,
                        hasil_kesesuaian: 'Sesuai'
                    }];
                }

                // Ambil data draft desk_study, fallback ke data awal
                const mergedDeskStudy = deskStudyData.map((item, index) => ({
                    ...item,
                    ...(kasusData.penilaian.desk_study?.[index] || {})
                }));


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

                if (kasusData.penilaian.tanda_tangan_tim) {
                    const sigs = kasusData.penilaian.tanda_tangan_tim.reduce((acc, curr) => {
                        acc[curr.user_id] = curr.signature_path;
                        return acc;
                    }, {});
                    setSignatures(sigs);
                }
            } else {
                 setIsReadOnly(false); // Form baru, bisa diedit
                setFormData({
                    desk_study: [{
                        pernyataan_mandiri_lokasi: fullAlamat,
                        pernyataan_mandiri_jenis: kegiatan,
                        hasil_kesesuaian: 'Sesuai'
                    }],
                    pemeriksaan: Array.from({ length: 8 }, () => ({ hasil_pemeriksaan: 'Sesuai' })),
                    pengukuran: Array.from({ length: 12 }, () => ({})),
                    catatan: '',
                });
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

        if (!isDeskStudyTidakSesuai) {
            formData.pemeriksaan.forEach((item, index) => {
                if (!item.pernyataan_mandiri?.trim()) errors[`pemeriksaan.${index}.pernyataan_mandiri`] = true;
            });
        }

        return errors;
    };

    // --- FUNGSI UNTUK MENGAMBIL SEMUA DATA FORM (TERMASUK TTD) ---
    const getFullFormData = () => {
        // 1. Ambil semua data dari state
        const data = { ...formData };

        // 2. Ambil data tanda tangan
        const signatureData = [];
        petugasLapangan.forEach(member => {
            const sigCanvas = signatureRefs.current[member.id];
            const isCanvasEmpty = !sigCanvas || sigCanvas.isEmpty();

            if (!isCanvasEmpty) {
                // Jika canvas *tidak* kosong, ambil base64 baru
                signatureData.push({
                    user_id: member.id,
                    signature: sigCanvas.toDataURL(),
                });
            }
            // Jika canvas kosong, kita tidak mengirim apa-apa.
            // Backend akan menggabungkannya dengan TTD yang sudah ada.
            // Jika TTD yang sudah ada tidak ada, itu akan tetap kosong.
        });

        data.tanda_tangan_tim = signatureData;
        return data;
    };
    // --- AKHIR FUNGSI BARU ---


    // --- PERBAIKAN: Fungsi handleSaveDraft ---
    const handleSaveDraft = async () => {
        setDraftLoading(true);
        setError('');
        setValidationErrors({}); // Hapus error validasi, karena ini draft

        // Ambil *semua* data form, termasuk tanda tangan
        const draftData = getFullFormData();

        try {
            // Panggil API draft baru
            await api.post(`/penilaian/pmp-umk/${id}/draft`, draftData);
            alert('Draft berhasil disimpan!');
            navigate('/penilaian'); // Redirect ke dashboard sesuai spesifikasi
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat menyimpan draft.';
            setError(errorMsg);
        } finally {
            setDraftLoading(false);
        }
    };
    // --- AKHIR PERBAIKAN ---

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

        // --- PERBAIKAN: Gunakan fungsi getFullFormData ---
        const submissionData = getFullFormData();
        // --- AKHIR PERBAIKAN ---

        let allMembersSigned = true;
        const signatureMap = submissionData.tanda_tangan_tim.reduce((acc, sig) => {
            acc[sig.user_id] = true;
            return acc;
        }, {});

        petugasLapangan.forEach(member => {
            const hasExistingSignature = !!signatures[member.id];
            const hasNewSignature = !!signatureMap[member.id];

            if (!hasExistingSignature && !hasNewSignature) {
                allMembersSigned = false;
            }
        });

        if (petugasLapangan.length > 0 && !allMembersSigned) {
            setError('Semua Petugas Lapangan harus memberikan tanda tangan untuk submit final.');
            setSubmitLoading(false);
            return;
        }

        if (isDeskStudyTidakSesuai) {
            submissionData.pemeriksaan = Array.from({ length: 8 }, () => ({ hasil_pemeriksaan: 'Sesuai' }));
            submissionData.pengukuran = Array.from({ length: 12 }, () => ({}));
        }

        setSubmitLoading(true);
        try {
            await api.post(`/penilaian/pmp-umk/${id}`, submissionData);
            alert(initialPenilaianExists ? 'Perubahan berhasil disimpan!' : 'Penilaian berhasil disimpan!');
            setIsReadOnly(true);
            fetchDetail(); // Re-fetch data
            navigate('/penilaian'); // Arahkan kembali ke dashboard setelah submit final
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
        <div className="bg-gray-100">
            <PrintStyles />

            <div className="mb-6 flex justify-between items-center print:hidden no-print px-4 py-3 bg-white shadow-sm sm:px-6 lg:px-8">
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

            <div className="printable-area max-w-6xl mx-auto bg-white rounded-lg shadow-lg mb-8">
                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-3"> {/* Kurangi space-y menjadi 3 */}
                    <div className="text-center pt-2"> {/* Kurangi pt */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800">FORMULIR PEMERIKSAAN DAN PENGUKURAN</h2>
                        <p className="text-gray-600">Penilaian Pernyataan Mandiri Pelaku Usaha Mikro dan Kecil</p>
                    </div>

                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 print:hidden no-print" role="alert">
                            <p className="font-bold">Gagal Menyimpan</p>
                            <p>{error}</p>
                        </div>
                    )}

                    {isReadOnly && initialPenilaianExists && (
                        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 print:hidden no-print" role="alert">
                            <p className="font-bold">Mode Tampilan</p>
                            <p>Formulir ini hanya untuk dilihat. Klik tombol 'Edit' untuk mengubah data jika memiliki izin.</p>
                        </div>
                    )}

                    <fieldset className="border p-3 rounded-md"> {/* Kurangi p */}
                        <legend className="text-lg font-semibold px-2">1. Data Pelaku UMK</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mt-1 text-sm p-1"> {/* Kurangi gap-y, mt, p */}
                            <p><strong className="font-medium text-gray-600 w-32 inline-block">Nama Pelaku Usaha</strong>: {kasus.pemegang?.nama_pelaku_usaha || '-'}</p> {/* Kurangi w */}
                            <p><strong className="font-medium text-gray-600 w-32 inline-block">Nomor Identitas</strong>: {kasus.pemegang?.nomor_identitas || '-'}</p> {/* Kurangi w */}
                            <p className="md:col-span-2"><strong className="font-medium text-gray-600 w-32 inline-block">Alamat</strong>: {kasus.pemegang?.alamat || '-'}</p> {/* Kurangi w */}
                            <p><strong className="font-medium text-gray-600 w-32 inline-block">Email</strong>: {kasus.pemegang?.email || '-'}</p> {/* Kurangi w */}
                            <p><strong className="font-medium text-gray-600 w-32 inline-block">Nomor Telepon</strong>: {kasus.pemegang?.nomor_handphone || '-'}</p> {/* Kurangi w */}
                        </div>
                    </fieldset>

                    <fieldset className="border p-3 rounded-md"> {/* Kurangi p */}
                        <legend className="text-lg font-semibold px-2">2. Kesesuaian dengan Rencana Tata Ruang (Desk Study)</legend>
                        <div className="overflow-x-auto mt-1"> {/* Kurangi mt */}
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-100 text-left">
                                    <tr>
                                        <th colSpan="2" className="p-1 border font-semibold">Ketentuan berdasarkan Pernyataan Mandiri Pelaku UMK</th> {/* Kurangi p */}
                                        <th colSpan="2" className="p-1 border font-semibold">Ketentuan dalam RTR</th> {/* Kurangi p */}
                                        <th rowSpan="2" className="p-1 border font-semibold align-middle">Hasil Kesesuaian</th> {/* Kurangi p */}
                                    </tr>
                                    <tr>
                                        <th className="p-1 border font-medium">Lokasi Usaha</th> {/* Kurangi p */}
                                        <th className="p-1 border font-medium">Jenis Kegiatan Usaha</th> {/* Kurangi p */}
                                        <th className="p-1 border font-medium">Jenis Peruntukan</th> {/* Kurangi p */}
                                        <th className="p-1 border font-medium">Arahan/Ketentuan</th> {/* Kurangi p */}
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

                    <fieldset className={`border p-3 rounded-md transition-opacity ${isPemeriksaanDisabled ? 'bg-gray-50 opacity-60 cursor-not-allowed' : ''}`}> {/* Kurangi p */}
                        <legend className="text-lg font-semibold px-2">3. Pemeriksaan</legend>
                        {isDeskStudyTidakSesuai && !isReadOnly && (
                            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-2 my-1 text-xs no-print" role="alert"> {/* Kurangi p, my, text */}
                            Formulir Pemeriksaan dinonaktifkan karena hasil Desk Study adalah "Tidak Sesuai".
                            </div>
                        )}
                        <div className="overflow-x-auto mt-1"> {/* Kurangi mt */}
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-100 text-left">
                                    <tr>
                                        <th className="p-1 border font-semibold w-10">No.</th> {/* Kurangi p, w */}
                                        <th colSpan="2" className="p-1 border font-semibold">Komponen</th> {/* Kurangi p */}
                                        <th className="p-1 border font-semibold">Ketentuan berdasarkan Pernyataan Mandiri</th> {/* Kurangi p */}
                                        <th className="p-1 border font-semibold">Hasil Pemeriksaan</th> {/* Kurangi p */}
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
                                            isReadOnly={isPemeriksaanDisabled}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </fieldset>

                    <fieldset className={`border p-3 rounded-md transition-opacity ${isPengukuranDisabled ? 'bg-gray-50 opacity-60 cursor-not-allowed' : ''}`}> {/* Kurangi p */}
                        <legend className="text-lg font-semibold px-2">4. Pengukuran</legend>
                        {isDeskStudyTidakSesuai && !isReadOnly && (
                            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-2 my-1 text-xs no-print" role="alert"> {/* Kurangi p, my, text */}
                            Formulir Pengukuran dinonaktifkan karena hasil Desk Study adalah "Tidak Sesuai".
                            </div>
                        )}
                        <div className="overflow-x-auto mt-1"> {/* Kurangi mt */}
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-100 text-left">
                                    <tr>
                                        <th className="p-1 border font-semibold w-10">No.</th> {/* Kurangi p, w */}
                                        <th colSpan="2" className="p-1 border font-semibold">Komponen yang Dinilai</th> {/* Kurangi p */}
                                        <th className="p-1 border font-semibold">Hasil Pengukuran</th> {/* Kurangi p */}
                                        <th className="p-1 border font-semibold">Keterangan</th> {/* Kurangi p */}
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
                                            isReadOnly={isPengukuranDisabled}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </fieldset>

                    <div className='page-break-inside-avoid'> {/* Tambahkan page-break-inside-avoid di sini */}
                        <label htmlFor="catatan" className="block text-sm font-medium text-gray-700 font-semibold">Catatan Tambahan:</label>
                        <textarea id="catatan" name="catatan" value={formData.catatan} onChange={(e) => setFormData(p => ({...p, catatan: e.target.value}))} rows="3" className={`mt-1 block w-full rounded-md shadow-sm ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'} print:hidden`} disabled={isReadOnly}></textarea> {/* Kurangi rows */}
                        <div className={`hidden print:block whitespace-pre-wrap break-words text-sm mt-1 p-1 border border-transparent print-text-block`}>
                            {formData.catatan || ''}
                        </div>
                    </div>

                    <div className="pt-4 border-t mt-4 page-break-before signature-container"> {/* Kurangi pt, mt */}
                        <h3 className="text-lg font-semibold px-2 mb-2">5. Petugas Penilai (Petugas Lapangan)</h3> {/* Kurangi mb */}
                        <div className="space-y-2"> {/* Kurangi space-y */}
                            {petugasLapangan.length > 0 ? (
                                petugasLapangan.map(member => (
                                    <div key={member.id} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 p-2 border rounded-md signature-block"> {/* Kurangi gap-x, gap-y, p */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 font-semibold">Nama Petugas</label>
                                            <p className="mt-0.5 p-1 border rounded-md bg-gray-50 text-sm">{member.nama}</p> {/* mt-0.5 */}
                                            <label className="block text-xs font-medium text-gray-700 font-semibold mt-0.5">NIP/NIK</label> {/* mt-0.5 */}
                                            <p className="mt-0.5 p-1 border rounded-md bg-gray-50 text-sm">{member.nip || 'Tidak tersedia'}</p> {/* mt-0.5 */}
                                            <label className="block text-xs font-medium text-gray-700 font-semibold mt-0.5">Jabatan</label> {/* mt-0.5 */}
                                            <p className="mt-0.5 p-1 border rounded-md bg-gray-50 text-sm">{member.pivot?.jabatan_di_tim || member.role}</p> {/* mt-0.5 */}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 font-semibold">Tanda Tangan:</label>
                                            <div className="my-0.5 signature-image-container"> {/* my-0.5 */}
                                                {signatures[member.id] ? (
                                                    <img src={`http://127.0.0.1:8000/storage/${signatures[member.id]}`} alt={`Tanda Tangan ${member.nama}`} className="mx-auto h-16 border rounded bg-white"/> /* h-16 */
                                                ) : (
                                                    <div className="h-16 border rounded bg-white flex items-center justify-center text-gray-400 text-xs">(Belum TTD)</div> /* h-16 */
                                                )}
                                            </div>
                                            {!isReadOnly && (
                                                <div className='signature-canvas-container'>
                                                    <div className="border border-gray-300 rounded-md bg-white">
                                                        <SignatureCanvas ref={el => signatureRefs.current[member.id] = el} penColor='black' canvasProps={{className: 'w-full h-20'}} /> {/* h-20 */}
                                                    </div>
                                                    <button type="button" onClick={() => signatureRefs.current[member.id]?.clear()} className="text-xs text-blue-600 hover:underline mt-0.5 no-print">Ulangi</button> {/* mt-0.5 */}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm">Tidak ada 'Petugas Lapangan' yang ditugaskan ke tim ini.</p>
                            )}
                        </div>
                    </div>

                    {!isReadOnly && (
                        <div className="flex justify-end pt-3 print:hidden no-print space-x-3"> {/* PENAMBAHAN: wrapper flex + space-x */}
                            {/* --- PENAMBAHAN: Tombol Save Draft --- */}
                            <button 
                                type="button" 
                                onClick={handleSaveDraft} 
                                disabled={draftLoading || submitLoading} 
                                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md disabled:bg-gray-400"
                            >
                                {draftLoading ? 'Menyimpan...' : 'Save Draft'}
                            </button>
                            {/* --- AKHIR PENAMBAHAN --- */}

                            <button 
                                type="submit" 
                                disabled={submitLoading || draftLoading} 
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md disabled:bg-blue-400"
                            >
                                {submitLoading ? 'Menyimpan...' : (initialPenilaianExists ? 'Simpan Perubahan Final' : 'Simpan Hasil Penilaian')}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
