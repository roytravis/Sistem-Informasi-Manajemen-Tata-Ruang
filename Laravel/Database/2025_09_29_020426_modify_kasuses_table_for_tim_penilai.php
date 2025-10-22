<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Memodifikasi tabel kasuses untuk mengimplementasikan penugasan berbasis tim.
     */
    public function up(): void
    {
        Schema::table('kasuses', function (Blueprint $table) {
            // Hapus foreign key constraint terlebih dahulu
            $table->dropForeign(['user_id']);
            // Hapus kolom user_id yang lama
            $table->dropColumn('user_id');

            // Tambahkan kolom baru untuk penugasan tim dan penanggung jawab
            $table->foreignId('tim_id')->nullable()->constrained('tims')->after('prioritas_score');
            $table->foreignId('penanggung_jawab_id')->nullable()->constrained('users')->after('tim_id');
        });
    }

    /**
     * Reverse the migrations.
     * Mengembalikan skema tabel kasuses ke kondisi semula.
     */
    public function down(): void
    {
        Schema::table('kasuses', function (Blueprint $table) {
            $table->dropForeign(['tim_id']);
            $table->dropForeign(['penanggung_jawab_id']);
            $table->dropColumn(['tim_id', 'penanggung_jawab_id']);

            // Tambahkan kembali kolom user_id yang lama
            $table->foreignId('user_id')->nullable()->constrained('users')->after('prioritas_score');
        });
    }
};
