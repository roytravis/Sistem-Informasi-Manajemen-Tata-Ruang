# SIMANTRA Backend — Sistem Manajemen Penilaian

Backend API untuk **SIMANTRA** (Sistem Manajemen Penilaian), sebuah sistem manajemen proses penilaian dan pemeriksaan lapangan. Dibangun menggunakan **Laravel 12** dengan RESTful API dan autentikasi berbasis token menggunakan **Laravel Sanctum**.

---

## 🚀 Tech Stack

| Teknologi | Versi |
|-----------|-------|
| PHP | ^8.2 |
| Laravel | ^12.0 |
| Laravel Sanctum | ^4.0 |
| MySQL | 5.7+ / 8.0+ |
| Composer | 2.x |

---

## 📋 Fitur Utama

- **Autentikasi & Otorisasi** — Login/Register dengan token-based auth (Sanctum), role-based access control
- **Manajemen Pemegang Usaha** — CRUD data pelaku usaha yang dinilai
- **Manajemen Tim Penilai** — Pembentukan tim, penambahan/penghapusan anggota
- **Proses Penilaian (Assessment)** — Inisiasi penilaian, pengisian form PMP-UMK, draft & submit
- **Permohonan Penilaian** — Pengajuan dan pengelolaan permohonan penilaian
- **Berita Acara** — Pembuatan Berita Acara (tidak terlaksana)
- **BA Pemeriksaan** — Formulir Berita Acara Pemeriksaan Lapangan dengan tanda tangan digital
- **Formulir Analisis Penilaian** — Form analisis lengkap dengan tanda tangan multi-role
- **BA Hasil Penilaian** — Berita Acara Hasil Penilaian dengan tanda tangan tim
- **Sistem Notifikasi** — Notifikasi real-time untuk setiap perubahan status
- **Edit Request** — Mekanisme permintaan edit dengan persetujuan Ketua Tim
- **Tanda Tangan Digital** — Capture dan penyimpanan tanda tangan untuk semua formulir

---

## 👥 Role Pengguna

| Role | Deskripsi |
|------|-----------|
| `Admin` | Akses penuh ke seluruh sistem |
| `Koordinator Lapangan` | Koordinasi kegiatan lapangan |
| `Ketua Tim` | Memimpin tim penilai, menyetujui edit request |
| `Petugas Lapangan` | Pelaksana survei dan penilaian di lapangan |
| `Sekretariat` | Administrasi dan manajemen tim |

---

## 📁 Struktur Proyek

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/              # 13 API Controllers
│   │   │   └── Auth/             # Authentication Controller
│   │   └── Middleware/
│   └── Models/                   # 16 Eloquent Models
├── database/
│   ├── migrations/               # 38 Migration Files
│   ├── factories/
│   └── seeders/
├── routes/
│   └── api.php                   # API Route Definitions
├── storage/
├── config/
└── .env.example
```

---

## ⚙️ Instalasi & Setup

### Prasyarat

- PHP >= 8.2
- Composer 2.x
- MySQL 5.7+ atau 8.0+
- Node.js (untuk frontend)

### Langkah Instalasi

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   composer install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Konfigurasi database**

   Edit file `.env` dan sesuaikan konfigurasi database:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=simantra_db
   DB_USERNAME=root
   DB_PASSWORD=
   ```

5. **Buat database**
   ```sql
   CREATE DATABASE simantra_db;
   ```

6. **Jalankan migrasi**
   ```bash
   php artisan migrate
   ```

7. **Jalankan server**
   ```bash
   php artisan serve
   ```
   Server akan berjalan di `http://127.0.0.1:8000`

---

## 🔗 API Endpoints

### Autentikasi
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/register` | Registrasi user baru |
| POST | `/api/login` | Login dan mendapatkan token |
| POST | `/api/logout` | Logout (auth required) |
| GET | `/api/user` | Info user yang login |

### Pemegang Usaha
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/pemegangs` | List semua pemegang usaha |
| POST | `/api/pemegangs` | Tambah pemegang usaha |
| GET | `/api/pemegangs/{id}` | Detail pemegang usaha |
| PUT | `/api/pemegangs/{id}` | Update pemegang usaha |
| DELETE | `/api/pemegangs/{id}` | Hapus pemegang usaha |

### Tim Penilai
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/tims` | List semua tim |
| POST | `/api/tims` | Buat tim baru |
| PUT | `/api/tims/{id}` | Update tim |
| DELETE | `/api/tims/{id}` | Hapus tim |
| POST | `/api/tims/{id}/members` | Tambah anggota |
| DELETE | `/api/tims/{id}/members` | Hapus anggota |

### Penilaian
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/penilaian/initiate/{id}` | Inisiasi penilaian |
| GET | `/api/penilaian/pmp-umk/{kasus}` | Lihat form PMP-UMK |
| POST | `/api/penilaian/pmp-umk/{kasus}` | Submit penilaian |
| POST | `/api/penilaian/pmp-umk/{kasus}/draft` | Simpan draft |

### Berita Acara & Formulir
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/berita-acara` | Buat berita acara |
| GET | `/api/berita-acara/{id}` | Detail berita acara |
| POST | `/api/ba-pemeriksaan` | Simpan BA pemeriksaan |
| GET | `/api/ba-pemeriksaan/{id}` | Detail BA pemeriksaan |
| GET | `/api/formulir-analisis/{id}` | Lihat formulir analisis |
| POST | `/api/formulir-analisis/{id}` | Simpan formulir analisis |
| GET | `/api/ba-hasil-penilaian/{id}` | Lihat BA hasil |
| POST | `/api/ba-hasil-penilaian` | Simpan BA hasil |

### Notifikasi
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/notifications` | List notifikasi |
| GET | `/api/notifications/count` | Jumlah notifikasi |
| POST | `/api/notifications/{id}/read` | Tandai sudah dibaca |
| POST | `/api/notifications/read-all` | Tandai semua sudah dibaca |

### Edit Request
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/edit-requests` | Ajukan permintaan edit |
| GET | `/api/edit-requests/pending` | List request pending |
| POST | `/api/edit-requests/{id}/process` | Proses (approve/reject) |
| GET | `/api/edit-requests/status/{id}` | Cek status request |

---

## 🧪 Testing

```bash
php artisan test
```

---

## 📄 Lisensi

MIT License
