<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\Pemegang;
use App\Models\User;

// Controllers Auth
use App\Http\Controllers\Auth\AuthController;

// Controllers API
use App\Http\Controllers\Api\KasusController;
use App\Http\Controllers\Api\SurveiController;
use App\Http\Controllers\Api\PemegangController;
use App\Http\Controllers\Api\TimController;
use App\Http\Controllers\Api\PenilaianController;
use App\Http\Controllers\Api\PermohonanPenilaianController;
use App\Http\Controllers\Api\BeritaAcaraController;
use App\Http\Controllers\Api\BaPemeriksaanController;
use App\Http\Controllers\Api\FormulirAnalisisPenilaianController;
use App\Http\Controllers\Api\BaHasilPenilaianController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\EditRequestController; // <-- IMPORT BARU UNTUK EDIT REQUEST

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// --- RUTE PUBLIK ---
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Rute untuk mengambil file tanda tangan (publik agar bisa diakses di PDF/Preview)
Route::get('/signatures/{filename}', [PenilaianController::class, 'getSignatureImage']);


// --- RUTE TERPROTEKSI (BUTUH LOGIN) ---
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth & User Info
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // --- RUTE NOTIFIKASI ---
    Route::get('/notifications', [NotificationController::class, 'index']); // List notifikasi
    Route::get('/notifications/count', [NotificationController::class, 'getCount']); // Jumlah
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']); // Tandai satu baca
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']); // Tandai semua

    // --- RUTE EDIT REQUEST (FITUR BARU) ---
    // User mengajukan permohonan edit
    Route::post('/edit-requests', [EditRequestController::class, 'requestEdit']); 
    // Ketua Tim melihat list pending
    Route::get('/edit-requests/pending', [EditRequestController::class, 'getPendingRequests']); 
    // Ketua Tim memproses (approve/reject)
    Route::post('/edit-requests/{id}/process', [EditRequestController::class, 'processRequest']); 
    // Frontend mengecek status request terakhir
    Route::get('/edit-requests/status/{penilaianId}', [EditRequestController::class, 'checkStatus']); 

    // --- UTILITIES ---
    Route::get('/users', function() {
        return User::whereIn('role', ['Koordinator Lapangan', 'Ketua Tim', 'Admin', 'Petugas Lapangan', 'Sekretariat'])
            ->orderBy('nama')
            ->get();
    });
    
    // --- MANAJEMEN PEMEGANG USAHA ---
    Route::apiResource('pemegangs', PemegangController::class)
        ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Sekretariat');
    
    // --- MANAJEMEN KASUS ---
    Route::apiResource('kasus', KasusController::class)
         ->parameters(['kasus' => 'kasus'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');
    
    Route::post('/kasus/{kasus}/verifikasi', [KasusController::class, 'verifikasi'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim');

    // --- MANAJEMEN TIM ---
    Route::get('/tims', [TimController::class, 'index'])
        ->middleware('role:Admin,Sekretariat,Koordinator Lapangan,Ketua Tim');
    Route::get('/tims/{tim}', [TimController::class, 'show'])
        ->middleware('role:Admin,Sekretariat,Koordinator Lapangan,Ketua Tim');
    
    Route::middleware(['role:Admin,Sekretariat'])->group(function() {
        Route::post('/tims', [TimController::class, 'store']);
        Route::put('/tims/{tim}', [TimController::class, 'update']);
        Route::delete('/tims/{tim}', [TimController::class, 'destroy']);
        Route::post('/tims/{tim}/members', [TimController::class, 'addMember']);
        Route::delete('/tims/{tim}/members', [TimController::class, 'removeMember']);
    });
    
    // --- SURVEI LAPANGAN ---
    Route::middleware(['role:Petugas Lapangan'])->group(function() {
        Route::post('/kasus/{kasus}/survei', [SurveiController::class, 'store']);
    });

    // --- PERMOHONAN PENILAIAN ---
    Route::get('/permohonan-penilaian', [PermohonanPenilaianController::class, 'index'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');
    Route::post('/permohonan-penilaian', [PermohonanPenilaianController::class, 'store'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim');
    Route::get('/permohonan-penilaian/{permohonanPenilaian}', [PermohonanPenilaianController::class, 'show'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim');
    
    Route::put('/permohonan-penilaian/{permohonanPenilaian}', [PermohonanPenilaianController::class, 'update'])
         ->middleware('role:Admin,Ketua Tim');
    Route::delete('/permohonan-penilaian/{permohonanPenilaian}', [PermohonanPenilaianController::class, 'destroy'])
         ->middleware('role:Admin,Ketua Tim');


    // --- PROSES PENILAIAN ---
    Route::post('/penilaian/initiate/{permohonanPenilaian}', [PenilaianController::class, 'initiatePenilaian'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');

    Route::get('/penilaian/pmp-umk/{kasus}', [PenilaianController::class, 'showPmpUmk'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');
    Route::post('/penilaian/pmp-umk/{kasus}', [PenilaianController::class, 'storePenilaian'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');

    Route::post('/penilaian/pmp-umk/{kasus}/draft', [PenilaianController::class, 'saveDraft'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');

     // --- BERITA ACARA (TIDAK TERLAKSANA) ---
    Route::post('/berita-acara', [BeritaAcaraController::class, 'store'])
         ->middleware('role:Admin,Koordinator Lapangan');
    Route::get('/berita-acara/{beritaAcara}', [BeritaAcaraController::class, 'show'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');

    // --- BERITA ACARA PEMERIKSAAN (MANUAL) ---
    Route::post('/ba-pemeriksaan', [BaPemeriksaanController::class, 'store'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');

    Route::get('/ba-pemeriksaan/{penilaian}', [BaPemeriksaanController::class, 'show'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');

    // --- FORMULIR ANALISIS PENILAIAN ---
    Route::get('/formulir-analisis/{penilaian}', [FormulirAnalisisPenilaianController::class, 'show'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');
    Route::post('/formulir-analisis/{penilaian}', [FormulirAnalisisPenilaianController::class, 'store'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');
         
    // --- BERITA ACARA HASIL PENILAIAN ---
    Route::get('/ba-hasil-penilaian/{penilaianId}', [BaHasilPenilaianController::class, 'show'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');
    Route::post('/ba-hasil-penilaian', [BaHasilPenilaianController::class, 'store'])
         ->middleware('role:Admin,Koordinator Lapangan,Ketua Tim,Petugas Lapangan');
});