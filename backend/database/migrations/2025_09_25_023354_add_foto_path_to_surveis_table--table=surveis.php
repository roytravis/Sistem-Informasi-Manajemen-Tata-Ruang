<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Menambahkan kolom 'foto_path' ke tabel 'surveis' untuk menyimpan path file foto.
     */
    public function up(): void
    {
        Schema::table('surveis', function (Blueprint $table) {
            // Menambahkan kolom foto_path setelah kolom tanda_tangan_pemegang
            // Kolom ini krusial untuk menyimpan path dari foto yang diunggah saat survei.
            $table->string('foto_path')->nullable()->after('tanda_tangan_pemegang');
        });
    }

    /**
     * Reverse the migrations.
     * Menghapus kolom 'foto_path' jika migrasi di-rollback.
     */
    public function down(): void
    {
        Schema::table('surveis', function (Blueprint $table) {
            $table->dropColumn('foto_path');
        });
    }
};
