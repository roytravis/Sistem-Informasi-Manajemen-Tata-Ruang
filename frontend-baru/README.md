# SIMANTRA Frontend — Spatial Planning Management Information System

Frontend for **SIMANTRA** (Sistem Informasi Manajemen Tata Ruang), a user interface for managing assessment and field inspection processes. Built with **React 19** and **Vite 7**, styled with **TailwindCSS**.

---

## 🚀 Tech Stack

| Technology | Version |
|------------|---------|
| React | ^19.1.1 |
| Vite | ^7.1.6 |
| TailwindCSS | ^3.4.17 |
| Axios | ^1.12.2 |
| React Router DOM | ^7.9.1 |
| React Select | ^5.10.2 |
| React Signature Canvas | ^1.0.7 |
| Node.js | 20.19+ / 22.12+ |

---

## 📋 Key Features

- **Authentication** — Login page with token-based authentication
- **Assessment Dashboard** — List and filter assessment requests with status tabs
- **Assessment CRUD** — Create, edit, and view assessment details
- **Business Entity Management** — Manage assessed business entities
- **Assessment Team Management** — Manage teams and members
- **Official Reports (Berita Acara)** — Create and preview official activity reports
- **Inspection Reports (BA Pemeriksaan)** — Field inspection report forms
- **Assessment Analysis Form** — Comprehensive analysis form with multi-role digital signatures
- **Assessment Results Report (BA Hasil)** — Input and preview final assessment results
- **Digital Signatures** — Capture signatures directly in the browser
- **Edit Approval System** — Request and approve/reject data changes
- **Protected Routes** — Authentication-based route guarding

---

## 📁 Project Structure

```
frontend-baru/
├── public/
├── src/
│   ├── api/
│   │   └── axios.js              # Axios configuration & interceptors
│   ├── assets/
│   ├── components/
│   │   ├── Layout.jsx            # Main application layout
│   │   └── ProtectedRoute.jsx    # Authentication route guard
│   ├── context/                  # React Context providers
│   ├── pages/
│   │   ├── LoginPage.jsx                    # Login page
│   │   ├── PemegangPage.jsx                 # Business entity management
│   │   ├── TimPenilaiPage.jsx               # Assessment team management
│   │   ├── PenilaianPage.jsx                # Assessment list
│   │   ├── PenilaianDetailPage.jsx          # Assessment details
│   │   ├── AddPenilaianPage.jsx             # Create new assessment
│   │   ├── EditPenilaianPage.jsx            # Edit assessment
│   │   ├── EditApprovalPage.jsx             # Edit approval workflow
│   │   ├── AddBeritaAcaraPage.jsx           # Create official report
│   │   ├── BeritaAcaraPreviewPage.jsx       # Preview official report
│   │   ├── BeritaAcaraPemeriksaanPage.jsx   # Field inspection report
│   │   ├── FormulirAnalisisPage.jsx         # Assessment analysis form
│   │   ├── BaHasilPenilaianInputPage.jsx    # Assessment results input
│   │   └── BaHasilPenilaianPreviewPage.jsx  # Assessment results preview
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

## ⚙️ Installation & Setup

### Prerequisites

- Node.js >= 20.19 or >= 22.12
- npm 9+
- Backend API running at `http://127.0.0.1:8000`

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend-baru
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   Access the application at `http://localhost:5173`

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Preview the production build**
   ```bash
   npm run preview
   ```

---

## 🔧 Configuration

### API Base URL

The backend API connection is configured in `src/api/axios.js`:

```javascript
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});
```

Update `baseURL` to match your backend API address for the target environment.

---

## 📱 Application Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | User authentication |
| `/penilaian` | Assessment List | Main assessment dashboard |
| `/penilaian/tambah` | New Assessment | Create a new assessment request |
| `/penilaian/:id` | Assessment Details | Full assessment details view |
| `/penilaian/:id/edit` | Edit Assessment | Modify assessment data |
| `/penilaian/persetujuan-edit` | Edit Approval | Approve or reject edit requests |
| `/pemegangs` | Business Entities | Manage business entity records |
| `/tims` | Assessment Teams | Manage teams and members |
| `/penilaian/:id/berita-acara-pemeriksaan` | Inspection Report | Field inspection report form |
| `/penilaian/:id/formulir-analisis` | Analysis Form | Assessment analysis form |
| `/penilaian/:id/ba-hasil/input` | Results Input | Input assessment results |
| `/penilaian/:id/ba-hasil/preview` | Results Preview | Preview assessment results |

---

## 🛠️ Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev | `npm run dev` | Start the development server |
| Build | `npm run build` | Build the production bundle |
| Preview | `npm run preview` | Preview the production build |
| Lint | `npm run lint` | Run ESLint code analysis |

---

## 🔗 Backend Connection

This frontend is designed to work with the **SIMANTRA Backend** (Laravel). Before running, make sure:

1. The backend server is running at `http://127.0.0.1:8000`
2. The `simantra_db` database has been migrated
3. CORS is properly configured on the backend

---

## 📄 License

MIT License
