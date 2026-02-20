<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Membuat tabel untuk menyimpan data Formulir Analisis Penilaian PMP UMK.
     * Tabel ini terhubung dengan tabel 'penilaians'.
     */
    public function up(): void
    {
        Schema::create('formulir_analisis_penilaians', function (Blueprint $table) {
            $table->id();
            // Relasi one-to-one dengan tabel penilaians
            $table->foreignId('penilaian_id')->constrained('penilaians')->onDelete('cascade');
            
            // B.1. Pemeriksaan Lokasi Usaha
            $table->string('lokasi_kesesuaian_pmp_eksisting')->nullable(); // Dropdown Sesuai/Tidak Sesuai

            // B.2. Pemeriksaan Jenis Kegiatan
            $table->string('jenis_kesesuaian_pmp_eksisting')->nullable(); // Dropdown Sesuai/Tidak Sesuai
            $table->text('jenis_ketentuan_rtr')->nullable(); // Manual input
            $table->string('jenis_kesesuaian_rtr')->nullable(); // Dropdown Sesuai/Tidak Sesuai

            // C.0. Pengukuran Umum (Luas Tanah)
            $table->string('luas_digunakan_ketentuan_rtr')->nullable(); // Manual input
            $table->string('luas_digunakan_kesesuaian_rtr')->nullable(); // Dropdown
            $table->string('luas_dikuasai_ketentuan_rtr')->nullable(); // Manual input
            $table->string('luas_dikuasai_kesesuaian_rtr')->nullable(); // Dropdown

            // C.1. KDB
            $table->string('kdb_ketentuan_rtr')->nullable(); // Manual input
            $table->string('kdb_kesesuaian_rtr')->nullable(); // Dropdown
            $table->string('kdb_rasio_manual')->nullable(); // BARU: Input manual
            $table->string('kdb_persen_manual')->nullable(); // BARU: Input manual

            // C.2. KLB
            $table->string('klb_luas_tanah')->nullable(); // Manual input (Luas Tanah)
            $table->string('klb_ketentuan_rtr')->nullable(); // Manual input (Ketentuan RTR)
            $table->string('klb_kesesuaian_rtr')->nullable(); // Dropdown
            $table->string('klb_rasio_manual')->nullable(); // BARU: Input manual
            
            // C.3. KDH
            $table->string('kdh_luas_tanah')->nullable(); // Manual input (Luas Tanah)
            $table->string('kdh_perbandingan_vegetasi')->nullable(); // Manual input (Perbandingan luas tanah vegetasi... x100%)
            $table->string('kdh_ketentuan_rtr')->nullable(); // Manual input
            $table->string('kdh_kesesuaian_rtr')->nullable(); // Dropdown
            $table->string('kdh_rasio_manual')->nullable(); // BARU: Input manual

            // C.4. KTB
            $table->string('ktb_luas_tanah')->nullable(); // Manual input (Luas Tanah)
            $table->string('ktb_ketentuan_rtr')->nullable(); // Manual input
            $table->string('ktb_kesesuaian_rtr')->nullable(); // Dropdown (Sesuai, Tidak Sesuai, Belum Dapat Dinilai, dst.)
            $table->string('ktb_rasio_manual')->nullable(); // BARU: Input manual
            $table->string('ktb_persen_manual')->nullable(); // BARU: Input manual

            // C.5. GSB
            $table->string('gsb_ketentuan_rtr')->nullable(); // Manual input
            $table->string('gsb_kesesuaian_rtr')->nullable(); // Dropdown

            // C.6. JBB
            $table->string('jbb_ketentuan_rtr')->nullable(); // Manual input
            $table->string('jbb_kesesuaian_rtr')->nullable(); // Dropdown

            // Data Tanda Tangan (menyimpan path atau base64)
            // Nama diambil dari data Tim Penilai (kasus->tim->users)
            $table->json('tanda_tangan_tim')->nullable(); // Menyimpan {user_id, signature_path}

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('formulir_analisis_penilaians');
    }
};