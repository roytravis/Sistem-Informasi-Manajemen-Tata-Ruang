<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Menambahkan 'Koordinator Lapangan' ke ENUM 'jabatan_di_tim' di tabel 'tim_user'.
     */
    public function up(): void
    {
        // Sintaks ini untuk MySQL. Sesuaikan jika menggunakan database lain (misal PostgreSQL).
        // Ini akan memperbarui kolom ENUM untuk menyertakan opsi baru.
        DB::statement("ALTER TABLE tim_user MODIFY COLUMN jabatan_di_tim ENUM('Ketua Tim', 'Petugas Lapangan', 'Koordinator Lapangan')");
    }

    /**
     * Reverse the migrations.
     * Mengembalikan ENUM ke kondisi semula.
     */
    public function down(): void
    {
        // Peringatan: Ini mungkin gagal jika sudah ada data 'Koordinator Lapangan' di tabel.
        DB::statement("ALTER TABLE tim_user MODIFY COLUMN jabatan_di_tim ENUM('Ketua Tim', 'Petugas Lapangan')");
    }
};

