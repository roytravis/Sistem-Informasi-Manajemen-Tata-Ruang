import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PemegangPage from './pages/PemegangPage';
import TimPenilaiPage from './pages/TimPenilaiPage';
import PenilaianPage from './pages/PenilaianPage';
import PenilaianDetailPage from './pages/PenilaianDetailPage';
import AddPenilaianPage from './pages/AddPenilaianPage';
import EditPenilaianPage from './pages/EditPenilaianPage';

import AddBeritaAcaraPage from './pages/AddBeritaAcaraPage';
import BeritaAcaraPreviewPage from './pages/BeritaAcaraPreviewPage';
import BeritaAcaraPemeriksaanPage from './pages/BeritaAcaraPemeriksaanPage';
import FormulirAnalisisPage from './pages/FormulirAnalisisPage';

import BaHasilPenilaianInputPage from './pages/BaHasilPenilaianInputPage';
import BaHasilPenilaianPreviewPage from './pages/BaHasilPenilaianPreviewPage';
import EditApprovalPage from './pages/EditApprovalPage'; // Pastikan import ini ada

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/penilaian" replace />} />
          <Route path="pemegangs" element={<PemegangPage />} />
          <Route path="tims" element={<TimPenilaiPage />} />

          <Route path="penilaian" element={<PenilaianPage />} />
          <Route path="penilaian/tambah" element={<AddPenilaianPage />} />
          <Route path="penilaian/:id/edit" element={<EditPenilaianPage />} />
          <Route path="penilaian/:id" element={<PenilaianDetailPage />} />

          {/* Rute untuk Persetujuan Edit (Hanya Ketua Tim/Admin yang idealnya akses, bisa tambah role check di dalam page) */}
          <Route path="penilaian/persetujuan-edit" element={<EditApprovalPage />} />

          <Route path="penilaian/berita-acara/tambah" element={<AddBeritaAcaraPage />} />
          <Route path="penilaian/berita-acara/:id/preview" element={<BeritaAcaraPreviewPage />} />
          <Route path="penilaian/:id/berita-acara-pemeriksaan" element={<BeritaAcaraPemeriksaanPage />} />

          {/* Halaman Formulir Utama dengan fitur Request Edit */}
          <Route path="penilaian/:id/formulir-analisis" element={<FormulirAnalisisPage />} />

          <Route path="penilaian/:id/ba-hasil/input" element={<BaHasilPenilaianInputPage />} />
          <Route path="penilaian/:id/ba-hasil/preview" element={<BaHasilPenilaianPreviewPage />} />

          <Route path="penilaian/:id/ba-hasil" element={<Navigate to="input" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;