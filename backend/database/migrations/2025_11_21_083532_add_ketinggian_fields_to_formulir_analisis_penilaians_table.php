<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Menambahkan kolom ketinggian bangunan yang tertinggal.
     */
    public function up(): void
    {
        Schema::table('formulir_analisis_penilaians', function (Blueprint $table) {
            // Menambahkan kolom untuk Ketinggian Bangunan setelah KLB
            $table->string('ketinggian_ketentuan_rtr')->nullable()->after('klb_rasio_manual');
            $table->string('ketinggian_kesesuaian_rtr')->nullable()->after('ketinggian_ketentuan_rtr');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('formulir_analisis_penilaians', function (Blueprint $table) {
            $table->dropColumn(['ketinggian_ketentuan_rtr', 'ketinggian_kesesuaian_rtr']);
        });
    }
};