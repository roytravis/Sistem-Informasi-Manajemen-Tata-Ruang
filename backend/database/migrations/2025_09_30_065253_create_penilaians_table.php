<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * PEROMBAKAN: Struktur tabel disesuaikan dengan Juknis.
     */
    public function up(): void
    {
        Schema::create('penilaians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kasus_id')->constrained('kasuses')->onDelete('cascade');
            $table->foreignId('penilai_id')->constrained('users');
            
            // Kolom JSON baru untuk menyimpan data terstruktur sesuai Juknis
            $table->json('desk_study')->nullable();     // Untuk Tabel "Kesesuaian dengan RTR"
            $table->json('pemeriksaan')->nullable();  // Untuk Tabel "Pemeriksaan"
            $table->json('pengukuran')->nullable();   // Untuk Tabel "Pengukuran"
            
            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('penilaians');
    }
};
