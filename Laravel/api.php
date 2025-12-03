<?php
use App\Http\Controllers\Api\KasusController;
use App\Http\Controllers\Api\SurveiController;
use App\Http\Controllers\Api\PemegangController;
use App\Http\Controllers\Api\TimController;
use App\Http\Controllers\Api\PenilaianController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Api\PermohonanPenilaianController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\Pemegang;
use App\Models\User;
use App\Http\Controllers\Api\BeritaAcaraController;
use App\Http\Controllers\Api\BaPemeriksaanController;
use App\Http\Controllers\Api\FormulirAnalisisPenilaianController;
use App\Http\Controllers\Api\BaHasilPenilaianController;
use App\Http\Controllers\Api\NotificationController;

// Rute publik untuk login dan register
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Rute untuk mengambil file tanda tangan
Route::get('/signatures/{filename}', [PenilaianController::class, 'getSignatureImage']);

// Rute yang dilindungi (membutuhkan otentikasi)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // --- RUTE NOTIFIKASI ---
    Route::get('/notifications', [NotificationController::class, 'index']); // List notifikasi
    Route::get('/notifications/count', [NotificationController::class, 'getCount']); // Jumlah
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']); // Tandai satu baca
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']); // Tandai semua
    // ---------------------------

    Route::get('/users', function() {
        return User::whereIn('role', ['Koordinator Lapangan', 'Ketua Tim', 'Admin', 'Petugas Lapangan', 'Sekretariat'])->orderBy('nama')->get();
    });
    
    Route::apiResource('pemegangs', PemegangController::class)->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Sekretariat');
    
    Route::apiResource('kasus', KasusController::class)
         ->parameters(['kasus' => 'kasus'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');
    
    Route::post('/kasus/{kasus}/verifikasi', [KasusController::class, 'verifikasi'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim');

    // --- BLOK RUTE TIM ---
    Route::get('/tims', [TimController::class, 'index'])->middleware('role:Admin,Sekretariat,Koordinator Lapangan,Ketua Tim');
    Route::get('/tims/{tim}', [TimController::class, 'show'])->middleware('role:Admin,Sekretariat,Koordinator Lapangan,Ketua Tim');
    
    Route::middleware(['role:Admin,Sekretariat'])->group(function() {
        Route::post('/tims', [TimController::class, 'store']);
        Route::put('/tims/{tim}', [TimController::class, 'update']);
        Route::delete('/tims/{tim}', [TimController::class, 'destroy']);
        Route::post('/tims/{tim}/members', [TimController::class, 'addMember']);
        Route::delete('/tims/{tim}/members', [TimController::class, 'removeMember']);
    });
    
    Route::middleware(['role:Petugas Lapangan'])->group(function() {
        Route::post('/kasus/{kasus}/survei', [SurveiController::class, 'store']);
    });

    // --- BLOK RUTE PERMOHONAN PENILAIAN ---
    Route::get('/permohonan-penilaian', [PermohonanPenilaianController::class, 'index'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');
    Route::post('/permohonan-penilaian', [PermohonanPenilaianController::class, 'store'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim');
    Route::get('/permohonan-penilaian/{permohonanPenilaian}', [PermohonanPenilaianController::class, 'show'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim');
    Route::put('/permohonan-penilaian/{permohonanPenilaian}', [PermohonanPenilaianController::class, 'update'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim');
    Route::delete('/permohonan-penilaian/{permohonanPenilaian}', [PermohonanPenilaianController::class, 'destroy'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim');


    // --- BLOK RUTE PROSES PENILAIAN ---
    Route::post('/penilaian/initiate/{permohonanPenilaian}', [PenilaianController::class, 'initiatePenilaian'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');

    Route::get('/penilaian/pmp-umk/{kasus}', [PenilaianController::class, 'showPmpUmk'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');
    Route::post('/penilaian/pmp-umk/{kasus}', [PenilaianController::class, 'storePenilaian'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');

    Route::post('/penilaian/pmp-umk/{kasus}/draft', [PenilaianController::class, 'saveDraft'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');

     // --- BLOK RUTE BERITA ACARA (TIDAK TERLAKSANA) ---
    Route::post('/berita-acara', [BeritaAcaraController::class, 'store'])
         ->middleware('role:Admin,Koordinator Lapangan');
    Route::get('/berita-acara/{beritaAcara}', [BeritaAcaraController::class, 'show'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');

    // --- RUTE BERITA ACARA PEMERIKSAAN (MANUAL) ---
    Route::post('/ba-pemeriksaan', [BaPemeriksaanController::class, 'store'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');

    Route::get('/ba-pemeriksaan/{penilaian}', [BaPemeriksaanController::class, 'show'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');

    // --- RUTE FORMULIR ANALISIS PENILAIAN ---
    Route::get('/formulir-analisis/{penilaian}', [FormulirAnalisisPenilaianController::class, 'show'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');
    Route::post('/formulir-analisis/{penilaian}', [FormulirAnalisisPenilaianController::class, 'store'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');
         
    // --- RUTE BERITA ACARA HASIL PENILAIAN ---
    Route::get('/ba-hasil-penilaian/{penilaianId}', [BaHasilPenilaianController::class, 'show'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');
    Route::post('/ba-hasil-penilaian', [BaHasilPenilaianController::class, 'store'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');
});