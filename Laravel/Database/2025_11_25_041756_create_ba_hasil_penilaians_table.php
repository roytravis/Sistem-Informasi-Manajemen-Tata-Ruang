<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ba_hasil_penilaians', function (Blueprint $table) {
            $table->id();
            // Relasi ke Penilaian (One-to-One)
            $table->foreignId('penilaian_id')->constrained('penilaians')->onDelete('cascade');
            
            $table->string('nomor_ba')->nullable(); // Bisa digenerate otomatis atau input
            $table->date('tanggal_ba');
            
            // D. Kesimpulan Penilaian
            $table->string('validitas_kegiatan')->nullable(); // BENAR / TIDAK BENAR
            $table->string('rekomendasi_lanjutan')->nullable(); // Melanjutkan / Pembinaan
            
            // Menyimpan snapshot data petugas saat BA dibuat (opsional, agar historis aman)
            $table->json('snapshot_petugas')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ba_hasil_penilaians');
    }
};