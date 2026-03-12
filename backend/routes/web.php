<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;
use App\Livewire\PemegangManager;
use App\Livewire\TimManager;
use App\Livewire\PenilaianDashboard;
use App\Livewire\PenilaianForm;
use App\Livewire\PenilaianDetail;
use App\Livewire\EditApproval;
use App\Livewire\BeritaAcaraForm;
use App\Livewire\BeritaAcaraPreview;
use App\Livewire\BaPemeriksaan;
use App\Livewire\FormulirAnalisis;
use App\Livewire\BaHasilInput;
use App\Livewire\BaHasilPreview;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
| Session-based authentication for the Livewire web frontend.
| API routes (api.php) remain unchanged and use Sanctum tokens.
|--------------------------------------------------------------------------
*/

// --- Guest Routes ---
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [LoginController::class, 'login']);
});

// --- Logout ---
Route::post('/logout', [LoginController::class, 'logout'])->name('logout')->middleware('auth');

// --- Authenticated Routes ---
Route::middleware('auth')->group(function () {

    // Redirect root to dashboard
    Route::get('/', function () {
        return redirect()->route('penilaian');
    });

    // ========================================================================
    // Phase 2 — Livewire Full-Page Components
    // ========================================================================

    // Dashboard Penilaian
    Route::get('/penilaian', PenilaianDashboard::class)->name('penilaian');

    // Pemegang Usaha Management
    Route::get('/pemegangs', PemegangManager::class)->name('pemegangs');

    // Tim Management
    Route::get('/tims', TimManager::class)->name('tims');

    // ========================================================================
    // Phase 3 — Livewire Components
    // ========================================================================

    // Persetujuan Edit (Ketua Tim / Admin)
    Route::get('/penilaian/persetujuan-edit', EditApproval::class)->name('persetujuan-edit');

    // Tambah Permohonan Baru
    Route::get('/penilaian/tambah', PenilaianForm::class)->name('penilaian.tambah');

    // Edit Permohonan
    Route::get('/penilaian/{permohonanId}/edit', PenilaianForm::class)->name('penilaian.edit');

    // Detail/Nilai Penilaian
    Route::get('/penilaian/{id}', PenilaianDetail::class)->name('penilaian.detail')->where('id', '[0-9]+');

    // BA Pemeriksaan Lapangan
    Route::get('/penilaian/{kasusId}/berita-acara-pemeriksaan', BaPemeriksaan::class)->name('penilaian.ba-pemeriksaan');

    // Formulir Analisis
    Route::get('/penilaian/{kasusId}/formulir-analisis', FormulirAnalisis::class)->name('penilaian.formulir-analisis');

    // BA Hasil Penilaian
    Route::get('/penilaian/{penilaianId}/ba-hasil/input', BaHasilInput::class)->name('penilaian.ba-hasil.input');
    Route::get('/penilaian/{penilaianId}/ba-hasil/preview', BaHasilPreview::class)->name('penilaian.ba-hasil');

    // BA Form (Tidak Terlaksana)
    Route::get('/penilaian/berita-acara/tambah', BeritaAcaraForm::class)->name('penilaian.ba-form');

    // BA Preview (Tidak Terlaksana)
    Route::get('/penilaian/berita-acara/{baId}/preview', BeritaAcaraPreview::class)->name('penilaian.ba-preview');
});
