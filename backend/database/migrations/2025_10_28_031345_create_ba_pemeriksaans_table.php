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
        Schema::create('ba_pemeriksaans', function (Blueprint $table) {
            $table->id();
            // Foreign key ke tabel penilaians
            // onDelete('cascade') berarti jika data penilaian dihapus, data BA Pemeriksaan terkait juga akan dihapus.
            $table->foreignId('penilaian_id')->constrained('penilaians')->onDelete('cascade');
            $table->string('nomor_ba')->unique(); // Nomor Berita Acara (harus unik)
            $table->string('nomor_spt');         // Nomor Surat Perintah Tugas
            $table->string('nama_pemegang');    // Nama pemegang yang tertera di TTD
            $table->longText('tanda_tangan_pemegang'); // Menyimpan base64 data URL tanda tangan
            $table->timestamps(); // Kolom created_at dan updated_at

            // Opsional: Indeks untuk pencarian yang lebih cepat berdasarkan penilaian_id
            $table->index('penilaian_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ba_pemeriksaans');
    }
};

