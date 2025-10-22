<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Menambahkan kolom 'jabatan' ke tabel 'users'.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Menambahkan kolom jabatan setelah kolom unit_kerja
            $table->string('jabatan', 100)->nullable()->after('unit_kerja');
        });
    }

    /**
     * Reverse the migrations.
     * Menghapus kolom 'jabatan' jika migrasi di-rollback.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('jabatan');
        });
    }
};
