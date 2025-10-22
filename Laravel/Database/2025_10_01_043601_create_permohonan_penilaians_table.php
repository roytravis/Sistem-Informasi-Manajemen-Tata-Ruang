<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabel ini akan menyimpan data permohonan penilaian PMP_UMK,
     * memisahkannya dari tabel 'kasuses' utama.
     */
    public function up(): void
    {
        Schema::create('permohonan_penilaians', function (Blueprint $table) {
            $table->id();
            // Strukturnya sama dengan tabel 'kasuses' tetapi tanpa kolom 'jenis'.
            $table->string('nomor_permohonan')->unique();
            $table->string('status')->default('Baru');
            $table->integer('prioritas_score')->default(0);
            $table->foreignId('pemegang_id')->constrained('pemegangs');
            $table->foreignId('tim_id')->nullable()->constrained('tims');
            $table->foreignId('penanggung_jawab_id')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permohonan_penilaians');
    }
};
