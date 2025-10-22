import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import SignatureCanvas from 'react-signature-canvas';

// Komponen reusable untuk Fieldset/grup form
const FormFieldset = ({ legend, children }) => (
    <fieldset className="border p-4 rounded-md shadow-sm">
        <legend className="text-lg font-semibold px-2 text-gray-700">{legend}</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-2">
            {children}
        </div>
    </fieldset>
);

// Komponen reusable untuk Input
const FormInput = ({ label, name, value, onChange, type = 'text', required = false, step = "any" }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            type={type}
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            required={required}
            step={step}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
    </div>
);


export default function SurveiPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // State disesuaikan dengan struktur data di Juknis
    const [formData, setFormData] = useState({
        // Data Pemeriksaan
        data_pemeriksaan: {
            luas_tanah_dikuasai: '',
            jenis_kegiatan: '',
            indikasi_program: '',
            persyaratan_pelaksanaan: '',
            jaringan_utilitas: '',
        },
        // Data Pengukuran Intensitas
        data_pengukuran: {
            kdb: '',
            klb: '',
            kdh: '',
            ktb: '',
        },
        // Data Ketentuan Tata Bangunan
        data_tata_bangunan: {
            tinggi_bangunan: '',
            jumlah_lantai: '',
            gsb: '',
            jbb: '',
        },
        // Data Lokasi dan Dokumentasi
        lokasi_lat: '',
        lokasi_lng: '',
        foto: null,
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [locationStatus, setLocationStatus] = useState('');
    
    const sigPetugasRef = useRef({});
    const sigPemegangRef = useRef({});

    // Handler umum untuk perubahan input form
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const [section, field] = name.split('.');
        
        setFormData(prev => ({
            ...prev,
            [section]: { ...prev[section], [field]: value }
        }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, foto: e.target.files[0] }));
    };

    // Fungsi untuk mengambil lokasi GPS pengguna
    const getLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus('Geolocation tidak didukung oleh browser Anda.');
        } else {
            setLocationStatus('Mencari lokasi...');
            navigator.geolocation.getCurrentPosition((position) => {
                setLocationStatus('Lokasi berhasil didapatkan!');
                setFormData(prev => ({
                    ...prev,
                    lokasi_lat: position.coords.latitude,
                    lokasi_lng: position.coords.longitude
                }));
            }, () => {
                setLocationStatus('Gagal mendapatkan lokasi.');
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (sigPetugasRef.current.isEmpty() || sigPemegangRef.current.isEmpty()) {
            setError('Tanda tangan petugas dan pemegang tidak boleh kosong.');
            setLoading(false);
            return;
        }

        const tanda_tangan_petugas = sigPetugasRef.current.toDataURL();
        const tanda_tangan_pemegang = sigPemegangRef.current.toDataURL();
        
        const submissionData = new FormData();

        // Menambahkan semua data dari state ke FormData
        Object.keys(formData).forEach(section => {
            if (typeof formData[section] === 'object' && formData[section] !== null && !(formData[section] instanceof File)) {
                Object.keys(formData[section]).forEach(field => {
                    submissionData.append(`${section}[${field}]`, formData[section][field]);
                });
            } else {
                 submissionData.append(section, formData[section]);
            }
        });
        
        submissionData.append('tanda_tangan_petugas', tanda_tangan_petugas);
        submissionData.append('tanda_tangan_pemegang', tanda_tangan_pemegang);

        try {
            await api.post(`/kasus/${id}/survei`, submissionData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            navigate(`/kasus/${id}`);
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat menyimpan survei.';
            setError(errorMsg);
            console.error(err.response?.data);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <Link to={`/kasus/${id}`} className="text-blue-600 hover:underline">&larr; Kembali ke Detail Kasus</Link>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Formulir Survei Penilaian</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
                
                {/* Bagian Data Pemeriksaan */}
                <FormFieldset legend="Data Pemeriksaan">
                    <FormInput label="Luas Tanah Dikuasai (m²)" name="data_pemeriksaan.luas_tanah_dikuasai" value={formData.data_pemeriksaan.luas_tanah_dikuasai} onChange={handleInputChange} type="number" required />
                    <FormInput label="Jenis Kegiatan Pemanfaatan Ruang" name="data_pemeriksaan.jenis_kegiatan" value={formData.data_pemeriksaan.jenis_kegiatan} onChange={handleInputChange} required />
                    <FormInput label="Indikasi Program Pemanfaatan Ruang" name="data_pemeriksaan.indikasi_program" value={formData.data_pemeriksaan.indikasi_program} onChange={handleInputChange} />
                    <FormInput label="Persyaratan Pelaksanaan Kegiatan" name="data_pemeriksaan.persyaratan_pelaksanaan" value={formData.data_pemeriksaan.persyaratan_pelaksanaan} onChange={handleInputChange} />
                    <FormInput label="Jaringan Utilitas Kota" name="data_pemeriksaan.jaringan_utilitas" value={formData.data_pemeriksaan.jaringan_utilitas} onChange={handleInputChange} />
                </FormFieldset>
                
                {/* Bagian Data Pengukuran Intensitas */}
                 <FormFieldset legend="Data Pengukuran Intensitas Pemanfaatan Ruang">
                    <FormInput label="KDB (%)" name="data_pengukuran.kdb" value={formData.data_pengukuran.kdb} onChange={handleInputChange} type="number" />
                    <FormInput label="KLB" name="data_pengukuran.klb" value={formData.data_pengukuran.klb} onChange={handleInputChange} type="number" />
                    <FormInput label="KDH (%)" name="data_pengukuran.kdh" value={formData.data_pengukuran.kdh} onChange={handleInputChange} type="number" />
                    <FormInput label="KTB (%)" name="data_pengukuran.ktb" value={formData.data_pengukuran.ktb} onChange={handleInputChange} type="number" />
                </FormFieldset>

                {/* Bagian Ketentuan Tata Bangunan */}
                <FormFieldset legend="Ketentuan Tata Bangunan">
                     <FormInput label="Tinggi Bangunan (meter)" name="data_tata_bangunan.tinggi_bangunan" value={formData.data_tata_bangunan.tinggi_bangunan} onChange={handleInputChange} type="number" />
                     <FormInput label="Jumlah Lantai" name="data_tata_bangunan.jumlah_lantai" value={formData.data_tata_bangunan.jumlah_lantai} onChange={handleInputChange} type="number" />
                     <FormInput label="GSB (meter)" name="data_tata_bangunan.gsb" value={formData.data_tata_bangunan.gsb} onChange={handleInputChange} type="number" />
                     <FormInput label="JBB (meter)" name="data_tata_bangunan.jbb" value={formData.data_tata_bangunan.jbb} onChange={handleInputChange} type="number" />
                </FormFieldset>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* GPS & Foto */}
                    <div className="space-y-4">
                        <fieldset className="border p-4 rounded-md h-full shadow-sm">
                             <legend className="text-lg font-semibold px-2 text-gray-700">Lokasi & Dokumentasi</legend>
                             <div className="mt-2 space-y-4">
                                <div>
                                    <button type="button" onClick={getLocation} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md transition-colors">Ambil Koordinat GPS</button>
                                    {locationStatus && <p className="text-sm text-gray-600 mt-2 text-center">{locationStatus}</p>}
                                    <div className="flex gap-4 mt-2">
                                        <input type="text" value={formData.lokasi_lat ? `Lat: ${formData.lokasi_lat}` : 'Latitude'} readOnly className="block w-1/2 rounded-md border-gray-300 bg-gray-100 shadow-sm text-center"/>
                                        <input type="text" value={formData.lokasi_lng ? `Lng: ${formData.lokasi_lng}` : 'Longitude'} readOnly className="block w-1/2 rounded-md border-gray-300 bg-gray-100 shadow-sm text-center"/>
                                    </div>
                                </div>
                                 <div>
                                    <label htmlFor="foto" className="block text-sm font-medium text-gray-700">Upload Foto Dokumentasi</label>
                                    <input type="file" name="foto" onChange={handleFileChange} required className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                                 </div>
                             </div>
                        </fieldset>
                    </div>

                     {/* Tanda Tangan */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tanda Tangan Petugas</label>
                            <div className="mt-1 border border-gray-300 rounded-md bg-gray-50">
                                <SignatureCanvas ref={sigPetugasRef} penColor='black' canvasProps={{className: 'w-full h-32'}} />
                            </div>
                            <button type="button" onClick={() => sigPetugasRef.current.clear()} className="text-sm text-blue-600 hover:underline mt-1">Ulangi</button>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Tanda Tangan Pemegang/Perwakilan</label>
                            <div className="mt-1 border border-gray-300 rounded-md bg-gray-50">
                                <SignatureCanvas ref={sigPemegangRef} penColor='black' canvasProps={{className: 'w-full h-32'}} />
                            </div>
                             <button type="button" onClick={() => sigPemegangRef.current.clear()} className="text-sm text-blue-600 hover:underline mt-1">Ulangi</button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? 'Menyimpan...' : 'Simpan Survei'}
                    </button>
                </div>
            </form>
        </div>
    );
}
