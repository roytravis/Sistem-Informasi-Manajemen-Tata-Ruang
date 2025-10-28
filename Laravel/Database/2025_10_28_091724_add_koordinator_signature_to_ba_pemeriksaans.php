<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Menambahkan tanda tangan koordinator ke tabel ba_pemeriksaans.
     */
    public function up(): void
    {
        Schema::table('ba_pemeriksaans', function (Blueprint $table) {
            // Nama koordinator yang akan dicetak di bawah TTD
            $table->string('nama_koordinator')->nullable()->after('tanda_tangan_pemegang');
            // Data base64 tanda tangan koordinator
            $table->longText('tanda_tangan_koordinator')->nullable()->after('nama_koordinator');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ba_pemeriksaans', function (Blueprint $table) {
            $table->dropColumn(['nama_koordinator', 'tanda_tangan_koordinator']);
        });
    }
};
