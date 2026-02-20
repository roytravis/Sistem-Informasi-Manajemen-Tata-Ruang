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
        Schema::table('berita_acaras', function (Blueprint $table) {
            // Tambahkan baris ini
            $table->json('tanda_tangan_tim')->nullable()->after('tanggal_ba');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('berita_acaras', function (Blueprint $table) {
            // Tambahkan baris ini untuk bisa rollback
            $table->dropColumn('tanda_tangan_tim');
        });
    }
};