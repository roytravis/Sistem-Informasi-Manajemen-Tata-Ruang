# SIMANTRA — Spatial Planning Management Information System

**SIMANTRA** (Sistem Informasi Manajemen Tata Ruang) is a full-stack web application for managing assessment and field inspection processes. It features a comprehensive workflow — from assessment requests and field surveys to inspection reports, analysis forms, and final results — all with role-based access control and digital signature support.

---

## 🚀 Tech Stack

### Backend
| Technology | Version |
|------------|---------|
| PHP | ^8.2 |
| Laravel | ^12.0 |
| Laravel Sanctum | ^4.0 |
| MySQL | 5.7+ / 8.0+ |

### Frontend
| Technology | Version |
|------------|---------|
| React | ^19.1.1 |
| Vite | ^7.1.6 |
| TailwindCSS | ^3.4.17 |
| Axios | ^1.12.2 |
| React Router DOM | ^7.9.1 |
| React Signature Canvas | ^1.0.7 |

---

## 📋 Key Features

- **Authentication & Authorization** — Token-based auth (Laravel Sanctum) with role-based access control
- **Business Entity Management** — Full CRUD for assessed business entities
- **Assessment Team Management** — Team creation, member assignment and removal
- **Assessment Workflow** — Initiate assessments, fill PMP-UMK forms, save drafts & submit
- **Assessment Requests** — Submit and manage assessment requests with status tracking
- **Official Reports (Berita Acara)** — Generate and preview official activity reports
- **Inspection Reports (BA Pemeriksaan)** — Field inspection report forms with digital signatures
- **Assessment Analysis Form** — Comprehensive analysis form with multi-role signatures
- **Assessment Results (BA Hasil)** — Input, review, and finalize assessment results
- **Notification System** — Real-time notifications for status changes across all modules
- **Edit Request Workflow** — Controlled data modification with Team Leader approval
- **Digital Signatures** — In-browser signature capture and storage for all forms
- **Protected Routes** — Authentication-based route guarding on the frontend

---

## 👥 User Roles

| Role | Description |
|------|-------------|
| `Admin` | Full access to the entire system |
| `Koordinator Lapangan` | Field Coordinator — oversees field activities |
| `Ketua Tim` | Team Leader — leads assessment teams, approves edit requests |
| `Petugas Lapangan` | Field Officer — conducts surveys and assessments on-site |
| `Sekretariat` | Secretariat — handles administration and team management |

---

## 📁 Project Structure

```
├── backend/                          # Laravel 12 API
│   ├── app/
│   │   ├── Http/Controllers/Api/     # 13 API Controllers
│   │   ├── Http/Controllers/Auth/    # Authentication Controller
│   │   ├── Http/Middleware/          # Role-based middleware
│   │   └── Models/                   # 16 Eloquent Models
│   ├── database/migrations/          # 38 Migration Files
│   ├── routes/api.php                # API Route Definitions
│   └── .env.example
│
├── frontend-baru/                    # React 19 + Vite 7 SPA
│   ├── src/
│   │   ├── api/axios.js              # Axios config & interceptors
│   │   ├── components/               # Layout & ProtectedRoute
│   │   ├── context/                  # React Context providers
│   │   └── pages/                    # 15 Page Components
│   ├── vite.config.js
│   └── tailwind.config.js
```

---

## ⚙️ Installation & Setup

### Prerequisites

- PHP >= 8.2 & Composer 2.x
- Node.js >= 20.19 or >= 22.12 & npm 9+
- MySQL 5.7+ or 8.0+

### 1. Backend Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Configure the database in `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=simantra_db
DB_USERNAME=root
DB_PASSWORD=
```

Create the database and run migrations:

```sql
CREATE DATABASE simantra_db;
```

```bash
php artisan migrate
php artisan serve
```

> Backend runs at `http://127.0.0.1:8000`

### 2. Frontend Setup

```bash
cd frontend-baru
npm install
npm run dev
```

> Frontend runs at `http://localhost:5173`

---

## 🔗 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register a new user |
| POST | `/api/login` | Login and receive a token |
| POST | `/api/logout` | Logout (auth required) |
| GET | `/api/user` | Get authenticated user info |

### Business Entities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pemegangs` | List all business entities |
| POST | `/api/pemegangs` | Create a business entity |
| GET | `/api/pemegangs/{id}` | Get details |
| PUT | `/api/pemegangs/{id}` | Update |
| DELETE | `/api/pemegangs/{id}` | Delete |

### Assessment Teams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tims` | List all teams |
| POST | `/api/tims` | Create a team |
| PUT | `/api/tims/{id}` | Update a team |
| DELETE | `/api/tims/{id}` | Delete a team |
| POST | `/api/tims/{id}/members` | Add member |
| DELETE | `/api/tims/{id}/members` | Remove member |

### Assessments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/penilaian/initiate/{id}` | Initiate an assessment |
| GET | `/api/penilaian/pmp-umk/{kasus}` | View PMP-UMK form |
| POST | `/api/penilaian/pmp-umk/{kasus}` | Submit assessment |
| POST | `/api/penilaian/pmp-umk/{kasus}/draft` | Save draft |

### Reports & Forms
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/berita-acara` | Create official report |
| GET | `/api/berita-acara/{id}` | View official report |
| POST | `/api/ba-pemeriksaan` | Save inspection report |
| GET | `/api/ba-pemeriksaan/{id}` | View inspection report |
| GET | `/api/formulir-analisis/{id}` | View analysis form |
| POST | `/api/formulir-analisis/{id}` | Save analysis form |
| GET | `/api/ba-hasil-penilaian/{id}` | View assessment results |
| POST | `/api/ba-hasil-penilaian` | Save assessment results |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications |
| GET | `/api/notifications/count` | Get count |
| POST | `/api/notifications/{id}/read` | Mark as read |
| POST | `/api/notifications/read-all` | Mark all as read |

### Edit Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/edit-requests` | Submit an edit request |
| GET | `/api/edit-requests/pending` | List pending requests |
| POST | `/api/edit-requests/{id}/process` | Approve or reject |
| GET | `/api/edit-requests/status/{id}` | Check status |

---

## 📱 Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | User authentication |
| `/penilaian` | Assessment List | Main dashboard |
| `/penilaian/tambah` | New Assessment | Create assessment request |
| `/penilaian/:id` | Assessment Details | Full details view |
| `/penilaian/:id/edit` | Edit Assessment | Modify assessment data |
| `/penilaian/persetujuan-edit` | Edit Approval | Approve/reject edit requests |
| `/pemegangs` | Business Entities | Manage entity records |
| `/tims` | Assessment Teams | Manage teams & members |
| `/penilaian/:id/berita-acara-pemeriksaan` | Inspection Report | Field inspection form |
| `/penilaian/:id/formulir-analisis` | Analysis Form | Assessment analysis |
| `/penilaian/:id/ba-hasil/input` | Results Input | Input final results |
| `/penilaian/:id/ba-hasil/preview` | Results Preview | Preview final results |

---

## 🧪 Testing

```bash
# Backend tests
cd backend
php artisan test

# Frontend lint
cd frontend-baru
npm run lint
```

---

## 📄 License

MIT License
