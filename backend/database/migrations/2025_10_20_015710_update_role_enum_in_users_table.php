<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Ubah data lama terlebih dahulu (jika ada)
        DB::table('users')
            ->where('role', 'Penanggung Jawab')
            ->update(['role' => 'Koordinator Lapangan']);

        // Ubah definisi kolom enum
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', [
                'Admin',
                'Koordinator Lapangan',
                'Ketua Tim',
                'Petugas Lapangan',
                'Sekretariat'
            ])->change();
        });
    }

    public function down(): void
    {
        // Kembalikan perubahan
        DB::table('users')
            ->where('role', 'Koordinator Lapangan')
            ->update(['role' => 'Penanggung Jawab']);

        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', [
                'Admin',
                'Penanggung Jawab',
                'Ketua Tim',
                'Petugas Lapangan',
                'Sekretariat'
            ])->change();
        });
    }
};
