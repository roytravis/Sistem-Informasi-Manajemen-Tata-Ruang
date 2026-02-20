<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ba_pemeriksaans', function (Blueprint $table) {
            // Menambahkan kolom JSON untuk menyimpan array tanda tangan tim (Petugas Lapangan)
            // Struktur: [{ "user_id": 1, "nama": "...", "nip": "...", "signature_path": "..." }]
            $table->json('tanda_tangan_tim')->nullable()->after('tanda_tangan_koordinator');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ba_pemeriksaans', function (Blueprint $table) {
            $table->dropColumn('tanda_tangan_tim');
        });
    }
};