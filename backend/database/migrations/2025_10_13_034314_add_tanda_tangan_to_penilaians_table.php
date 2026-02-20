<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Menambahkan kolom untuk menyimpan path tanda tangan petugas.
     */
    public function up(): void
    {
        Schema::table('penilaians', function (Blueprint $table) {
            $table->text('tanda_tangan_petugas')->nullable()->after('catatan');
        });
    }

    /**
     * Reverse the migrations.
     * Menghapus kolom tanda tangan petugas jika migrasi di-rollback.
     */
    public function down(): void
    {
        Schema::table('penilaians', function (Blueprint $table) {
            $table->dropColumn('tanda_tangan_petugas');
        });
    }
};

