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
        Schema::create('kasuses', function (Blueprint $table) {
            $table->id();
            $table->enum('jenis', ['KKPR', 'PMP_UMK']);
            $table->string('nomor_permohonan')->unique();
            $table->string('status')->default('Baru');
            $table->integer('prioritas_score')->default(0);
            $table->foreignId('user_id')->nullable()->constrained('users'); // Penanggung Jawab/Ketua Tim
            $table->foreignId('pemegang_id')->constrained('pemegangs'); // Relasi ke pemegang
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kasuses');
    }
};
