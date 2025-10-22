import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import KasusDetailPage from './pages/KasusDetailPage';
import AddKasusPage from './pages/AddKasusPage';
import EditKasusPage from './pages/EditKasusPage';
import SurveiPage from './pages/SurveiPage';
import PemegangPage from './pages/PemegangPage';
import LaporanPage from './pages/LaporanPage'; 
import TimPenilaiPage from './pages/TimPenilaiPage';
import PenilaianPage from './pages/PenilaianPage';
import PenilaianDetailPage from './pages/PenilaianDetailPage';
import AddPenilaianPage from './pages/AddPenilaianPage';
import EditPenilaianPage from './pages/EditPenilaianPage';

// --- PENAMBAHAN ---
import AddBeritaAcaraPage from './pages/AddBeritaAcaraPage';
import BeritaAcaraPreviewPage from './pages/BeritaAcaraPreviewPage';


function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="kasus/tambah" element={<AddKasusPage />} />
          <Route path="kasus/:id" element={<KasusDetailPage />} />
          <Route path="kasus/:id/edit" element={<EditKasusPage />} />
          <Route path="kasus/:id/survei" element={<SurveiPage />} />
          <Route path="kasus/:id/laporan" element={<LaporanPage />} />
          <Route path="pemegangs" element={<PemegangPage />} />
          <Route path="tims" element={<TimPenilaiPage />} />
          
          {/* Rute untuk Fitur Penilaian */}
          <Route path="penilaian" element={<PenilaianPage />} />
          <Route path="penilaian/tambah" element={<AddPenilaianPage />} />
          <Route path="penilaian/:id/edit" element={<EditPenilaianPage />} />
          <Route path="penilaian/:id" element={<PenilaianDetailPage />} />
          
          {/* --- PENAMBAHAN RUTE BERITA ACARA --- */}
          <Route path="penilaian/berita-acara/tambah" element={<AddBeritaAcaraPage />} />
          <Route path="penilaian/berita-acara/:id/preview" element={<BeritaAcaraPreviewPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
