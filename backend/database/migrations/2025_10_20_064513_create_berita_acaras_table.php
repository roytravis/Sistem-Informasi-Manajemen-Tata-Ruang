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
        // Tabel utama untuk menyimpan data Berita Acara
        Schema::create('berita_acaras', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_ba')->unique();
            $table->foreignId('pemegang_id')->constrained('pemegangs')->onDelete('cascade');
            $table->foreignId('koordinator_id')->constrained('users')->onDelete('cascade');
            $table->string('alasan');
            $table->text('keterangan_lainnya')->nullable();
            $table->date('tanggal_ba');
            $table->timestamps();
        });

        // Tabel pivot untuk relasi many-to-many antara Berita Acara dan Tim Penilai (Users)
        Schema::create('berita_acara_user', function (Blueprint $table) {
            $table->foreignId('berita_acara_id')->constrained('berita_acaras')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->primary(['berita_acara_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('berita_acara_user');
        Schema::dropIfExists('berita_acaras');
    }
};
