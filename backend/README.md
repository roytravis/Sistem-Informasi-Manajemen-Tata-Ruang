# SIMANTRA Backend — Spatial Planning Management Information System

Backend API for **SIMANTRA** (Sistem Informasi Manajemen Tata Ruang), an assessment and field inspection management system. Built with **Laravel 12**, providing RESTful APIs with token-based authentication using **Laravel Sanctum**.

---

## 🚀 Tech Stack

| Technology | Version |
|------------|---------|
| PHP | ^8.2 |
| Laravel | ^12.0 |
| Laravel Sanctum | ^4.0 |
| MySQL | 5.7+ / 8.0+ |
| Composer | 2.x |

---

## 📋 Key Features

- **Authentication & Authorization** — Token-based auth (Sanctum) with role-based access control
- **Business Entity Management** — Full CRUD for assessed business entities (Pemegang Usaha)
- **Assessment Team Management** — Team creation, member assignment and removal
- **Assessment Process** — Initiate assessments, fill PMP-UMK forms, draft & submit
- **Assessment Requests** — Submit and manage assessment requests
- **Official Reports (Berita Acara)** — Generate official activity reports
- **Inspection Reports (BA Pemeriksaan)** — Field inspection report forms with digital signatures
- **Assessment Analysis Form** — Comprehensive analysis form with multi-role signatures
- **Assessment Results Report (BA Hasil)** — Final assessment results with team signatures
- **Notification System** — Real-time notifications for status changes
- **Edit Request Workflow** — Request and approval mechanism managed by Team Leader
- **Digital Signatures** — Capture and store signatures across all forms

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

## ⚙️ Installation & Setup

### Prerequisites

- PHP >= 8.2
- Composer 2.x
- MySQL 5.7+ or 8.0+
- Node.js (for frontend)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   composer install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Configure database**

   Edit `.env` and update the database configuration:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=simantra_db
   DB_USERNAME=root
   DB_PASSWORD=
   ```

5. **Create the database**
   ```sql
   CREATE DATABASE simantra_db;
   ```

6. **Run migrations**
   ```bash
   php artisan migrate
   ```

7. **Start the server**
   ```bash
   php artisan serve
   ```
   The server will run at `http://127.0.0.1:8000`

---

## 🔗 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register a new user |
| POST | `/api/login` | Login and receive a token |
| POST | `/api/logout` | Logout (auth required) |
| GET | `/api/user` | Get authenticated user info |

### Business Entities (Pemegang Usaha)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pemegangs` | List all business entities |
| POST | `/api/pemegangs` | Create a new business entity |
| GET | `/api/pemegangs/{id}` | Get business entity details |
| PUT | `/api/pemegangs/{id}` | Update a business entity |
| DELETE | `/api/pemegangs/{id}` | Delete a business entity |

### Assessment Teams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tims` | List all teams |
| POST | `/api/tims` | Create a new team |
| PUT | `/api/tims/{id}` | Update a team |
| DELETE | `/api/tims/{id}` | Delete a team |
| POST | `/api/tims/{id}/members` | Add a team member |
| DELETE | `/api/tims/{id}/members` | Remove a team member |

### Assessments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/penilaian/initiate/{id}` | Initiate an assessment |
| GET | `/api/penilaian/pmp-umk/{kasus}` | View PMP-UMK form |
| POST | `/api/penilaian/pmp-umk/{kasus}` | Submit assessment |
| POST | `/api/penilaian/pmp-umk/{kasus}/draft` | Save draft |

### Official Reports & Forms
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/berita-acara` | Create an official report |
| GET | `/api/berita-acara/{id}` | View official report details |
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
| GET | `/api/notifications/count` | Get notification count |
| POST | `/api/notifications/{id}/read` | Mark as read |
| POST | `/api/notifications/read-all` | Mark all as read |

### Edit Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/edit-requests` | Submit an edit request |
| GET | `/api/edit-requests/pending` | List pending requests |
| POST | `/api/edit-requests/{id}/process` | Process (approve/reject) |
| GET | `/api/edit-requests/status/{id}` | Check request status |

---

## 🧪 Testing

```bash
php artisan test
```

---

## 📄 License

MIT License
