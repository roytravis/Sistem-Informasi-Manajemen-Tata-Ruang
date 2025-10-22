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
        Schema::table('pemegangs', function (Blueprint $table) {
            // Memperbaiki migrasi: Menambahkan kolom setelah kolom 'alamat'
            // karena 'nama_usaha' tidak ditemukan di tabel.
            $table->string('email')->nullable()->after('alamat');
            $table->string('nomor_handphone')->nullable()->after('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pemegangs', function (Blueprint $table) {
            $table->dropColumn(['email', 'nomor_handphone']);
        });
    }
};
