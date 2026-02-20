<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Mengubah struktur tabel pemegangs sesuai permintaan baru.
     */
    public function up(): void
    {
        Schema::table('pemegangs', function (Blueprint $table) {
            // 1. Hapus kolom-kolom lama yang tidak digunakan lagi
            $table->dropColumn([
                'nama_usaha',
                'pemilik_nama',
                'pemilik_kontak',
                'koordinat_lat',
                'koordinat_lng'
            ]);

            // 2. Tambahkan kolom-kolom baru
            $table->string('nama_pelaku_usaha')->after('id');
            $table->string('nomor_identitas')->unique()->after('nama_pelaku_usaha');
            $table->string('kegiatan')->after('nomor_identitas');
            $table->string('desa_kelurahan')->after('alamat');
            $table->string('kecamatan')->after('desa_kelurahan');
        });
    }

    /**
     * Reverse the migrations.
     * Mengembalikan skema ke kondisi semula jika migrasi di-rollback.
     */
    public function down(): void
    {
        Schema::table('pemegangs', function (Blueprint $table) {
            // 1. Hapus kolom-kolom baru
            $table->dropColumn([
                'nama_pelaku_usaha',
                'nomor_identitas',
                'kegiatan',
                'desa_kelurahan',
                'kecamatan'
            ]);

            // 2. Tambahkan kembali kolom-kolom lama
            $table->string('nama_usaha');
            $table->string('pemilik_nama');
            $table->string('pemilik_kontak');
            $table->decimal('koordinat_lat', 10, 8)->nullable();
            $table->decimal('koordinat_lng', 11, 8)->nullable();
        });
    }
};
