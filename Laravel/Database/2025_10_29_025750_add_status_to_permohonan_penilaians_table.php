<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Menambahkan 'Draft' sebagai status valid pada tabel permohonan_penilaians.
     */
    public function up(): void
    {
        // Menggunakan DB statement untuk mengubah ENUM (MySQL compatible)
        // Pastikan semua status yang ada sudah terdaftar
        DB::statement("ALTER TABLE permohonan_penilaians MODIFY COLUMN status VARCHAR(255) NOT NULL DEFAULT 'Baru'");
        
        // Ubah data yang ada jika perlu (opsional, tapi aman)
        DB::table('permohonan_penilaians')
            ->where('status', 'Baru')
            ->update(['status' => 'Menunggu Penilaian']);

        // Set status baru dengan enum yang diperbarui
        // Tambahkan semua status yang mungkin ada: 'Menunggu Penilaian', 'Draft', 'Penilaian Tidak Terlaksana', 'Baru'
        Schema::table('permohonan_penilaians', function (Blueprint $table) {
             $table->string('status')->default('Menunggu Penilaian')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
         Schema::table('permohonan_penilaians', function (Blueprint $table) {
            // Kembalikan ke state sebelumnya, mungkin tanpa 'Draft'
            // Ini mungkin berisiko jika data 'Draft' sudah ada
            $table->string('status')->default('Menunggu Penilaian')->change();
        });
    }
};
