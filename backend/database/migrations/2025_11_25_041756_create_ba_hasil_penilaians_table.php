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
            
            $table->string('nomor_ba')->nullable(); 
            $table->date('tanggal_ba');
            
            // Kesimpulan
            $table->string('validitas_kegiatan'); // BENAR / TIDAK BENAR
            $table->string('rekomendasi_lanjutan'); // Melanjutkan / Pembinaan
            
            // Tanda Tangan Tim (Petugas, Koordinator, Ketua Tim)
            // Format JSON: [{ "role": "Petugas Lapangan", "nama": "...", "nip": "...", "signature_path": "..." }, ...]
            $table->json('tanda_tangan_tim')->nullable();

            // Snapshot data petugas saat BA dibuat (agar historis aman jika user berubah jabatan)
            $table->json('snapshot_petugas')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ba_hasil_penilaians');
    }
};