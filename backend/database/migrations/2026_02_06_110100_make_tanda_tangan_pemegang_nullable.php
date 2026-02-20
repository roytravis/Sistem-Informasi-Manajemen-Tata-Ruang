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
            // Make tanda_tangan_pemegang nullable so Petugas Lapangan can save 
            // without pemegang signature - it can be added later by Koordinator/Ketua Tim
            $table->longText('tanda_tangan_pemegang')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ba_pemeriksaans', function (Blueprint $table) {
            $table->longText('tanda_tangan_pemegang')->nullable(false)->change();
        });
    }
};
