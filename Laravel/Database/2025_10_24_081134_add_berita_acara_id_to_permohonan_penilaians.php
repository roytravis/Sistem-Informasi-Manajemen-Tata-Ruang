<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Menambahkan kolom foreign key untuk relasi ke berita acara.
     */
    public function up(): void
    {
        Schema::table('permohonan_penilaians', function (Blueprint $table) {
            // Tambahkan kolom berita_acara_id setelah penanggung_jawab_id
            // Ini akan menghubungkan permohonan dengan Berita Acaranya jika ada
            $table->foreignId('berita_acara_id')
                  ->nullable()
                  ->after('penanggung_jawab_id')
                  ->constrained('berita_acaras')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     * Hapus foreign key dan kolom jika rollback.
     */
    public function down(): void
    {
        Schema::table('permohonan_penilaians', function (Blueprint $table) {
            // Hapus constraint foreign key terlebih dahulu
            $table->dropForeign(['berita_acara_id']);
            // Hapus kolomnya
            $table->dropColumn('berita_acara_id');
        });
    }
};
