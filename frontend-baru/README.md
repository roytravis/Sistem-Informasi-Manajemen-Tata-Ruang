# SIMANTRA Frontend — Sistem Manajemen Penilaian

Frontend untuk **SIMANTRA** (Sistem Manajemen Penilaian), antarmuka pengguna untuk mengelola proses penilaian dan pemeriksaan lapangan. Dibangun dengan **React 19** dan **Vite 7**, menggunakan **TailwindCSS** untuk styling.

---

## 🚀 Tech Stack

| Teknologi | Versi |
|-----------|-------|
| React | ^19.1.1 |
| Vite | ^7.1.6 |
| TailwindCSS | ^3.4.17 |
| Axios | ^1.12.2 |
| React Router DOM | ^7.9.1 |
| React Select | ^5.10.2 |
| React Signature Canvas | ^1.0.7 |
| Node.js | 20.19+ / 22.12+ |

---

## 📋 Fitur Utama

- **Autentikasi** — Halaman login dengan token-based authentication
- **Dashboard Penilaian** — Daftar dan filter permohonan penilaian dengan tabs status
- **CRUD Penilaian** — Tambah, edit, dan detail penilaian lengkap
- **Manajemen Pemegang Usaha** — Kelola data pelaku usaha
- **Manajemen Tim Penilai** — Kelola tim dan anggota
- **Berita Acara** — Buat dan preview Berita Acara kegiatan
- **BA Pemeriksaan** — Formulir Berita Acara Pemeriksaan Lapangan
- **Formulir Analisis Penilaian** — Form analisis dengan tanda tangan digital multi-role
- **BA Hasil Penilaian** — Input dan preview Berita Acara Hasil Penilaian
- **Tanda Tangan Digital** — Capture tanda tangan langsung di browser
- **Sistem Persetujuan Edit** — Request dan approve/reject perubahan data
- **Protected Routes** — Halaman terproteksi berdasarkan status autentikasi

---

## 📁 Struktur Proyek

```
frontend-baru/
├── public/
├── src/
│   ├── api/
│   │   └── axios.js              # Konfigurasi Axios & interceptors
│   ├── assets/
│   ├── components/
│   │   ├── Layout.jsx            # Layout utama aplikasi
│   │   └── ProtectedRoute.jsx    # Route guard autentikasi
│   ├── context/                  # React Context providers
│   ├── pages/
│   │   ├── LoginPage.jsx                    # Halaman login
│   │   ├── PemegangPage.jsx                 # Manajemen pemegang usaha
│   │   ├── TimPenilaiPage.jsx               # Manajemen tim penilai
│   │   ├── PenilaianPage.jsx                # Daftar penilaian
│   │   ├── PenilaianDetailPage.jsx          # Detail penilaian
│   │   ├── AddPenilaianPage.jsx             # Tambah penilaian
│   │   ├── EditPenilaianPage.jsx            # Edit penilaian
│   │   ├── EditApprovalPage.jsx             # Persetujuan edit
│   │   ├── AddBeritaAcaraPage.jsx           # Tambah berita acara
│   │   ├── BeritaAcaraPreviewPage.jsx       # Preview berita acara
│   │   ├── BeritaAcaraPemeriksaanPage.jsx   # BA pemeriksaan lapangan
│   │   ├── FormulirAnalisisPage.jsx         # Formulir analisis penilaian
│   │   ├── BaHasilPenilaianInputPage.jsx    # Input BA hasil penilaian
│   │   └── BaHasilPenilaianPreviewPage.jsx  # Preview BA hasil penilaian
│   ├── App.jsx                   # Router & route definitions
│   ├── App.css
│   ├── main.jsx                  # Entry point
│   └── index.css
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## ⚙️ Instalasi & Setup

### Prasyarat

- Node.js >= 20.19 atau >= 22.12
- npm 9+
- Backend API sudah berjalan di `http://127.0.0.1:8000`

### Langkah Instalasi

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd frontend-baru
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Jalankan development server**
   ```bash
   npm run dev
   ```
   Akses aplikasi di `http://localhost:5173`

4. **Build untuk production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

---

## 🔧 Konfigurasi

### API Base URL

Konfigurasi koneksi ke backend API terdapat di `src/api/axios.js`:

```javascript
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});
```

Ubah `baseURL` sesuai alamat backend API di environment yang digunakan.

---

## 📱 Halaman Aplikasi

| Route | Halaman | Deskripsi |
|-------|---------|-----------|
| `/login` | Login | Autentikasi pengguna |
| `/penilaian` | Daftar Penilaian | Dashboard utama penilaian |
| `/penilaian/tambah` | Tambah Penilaian | Form permohonan baru |
| `/penilaian/:id` | Detail Penilaian | Detail lengkap penilaian |
| `/penilaian/:id/edit` | Edit Penilaian | Ubah data penilaian |
| `/penilaian/persetujuan-edit` | Persetujuan Edit | Approve/reject permintaan edit |
| `/pemegangs` | Pemegang Usaha | Kelola data pelaku usaha |
| `/tims` | Tim Penilai | Kelola tim dan anggota |
| `/penilaian/:id/berita-acara-pemeriksaan` | BA Pemeriksaan | Berita acara pemeriksaan lapangan |
| `/penilaian/:id/formulir-analisis` | Formulir Analisis | Form analisis penilaian |
| `/penilaian/:id/ba-hasil/input` | Input BA Hasil | Input berita acara hasil |
| `/penilaian/:id/ba-hasil/preview` | Preview BA Hasil | Preview berita acara hasil |

---

## 🛠️ Scripts

| Script | Perintah | Deskripsi |
|--------|----------|-----------|
| Dev | `npm run dev` | Menjalankan development server |
| Build | `npm run build` | Build production bundle |
| Preview | `npm run preview` | Preview production build |
| Lint | `npm run lint` | Jalankan ESLint |

---

## 🔗 Koneksi Backend

Frontend ini dirancang untuk berjalan bersama **SIMANTRA Backend** (Laravel). Pastikan:

1. Backend sudah berjalan di `http://127.0.0.1:8000`
2. Database `simantra_db` sudah di-migrate
3. CORS sudah dikonfigurasi di backend

---

## 📄 Lisensi

MIT License
