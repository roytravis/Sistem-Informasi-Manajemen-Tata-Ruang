<?php

namespace App\Enums;

/**
 * Mendefinisikan peran (roles) yang valid untuk pengguna dalam sistem.
 * Menggunakan backed Enum (string) agar nilainya mudah dibaca di database.
 */
enum UserRole: string
{
    case ADMIN = 'Admin';
    // PERUBAHAN: Mengganti PENANGGUNG_JAWAB dengan KOORDINATOR_LAPANGAN
    case KOORDINATOR_LAPANGAN = 'Koordinator Lapangan';
    case KETUA_TIM = 'Ketua Tim';
    case PETUGAS_LAPANGAN = 'Petugas Lapangan';
    case SEKRETARIAT = 'Sekretariat';
}

