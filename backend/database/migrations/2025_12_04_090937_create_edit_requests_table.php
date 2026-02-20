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
        Schema::create('edit_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('penilaian_id')->constrained('penilaians')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users'); // User yang meminta edit
            $table->enum('status', ['pending', 'approved', 'rejected', 'completed'])->default('pending');
            // 'pending': Menunggu persetujuan ketua tim
            // 'approved': Disetujui, user bisa edit
            // 'rejected': Ditolak
            // 'completed': User sudah selesai mengedit dan menyimpan kembali (opsional, agar butuh request lagi)
            
            $table->text('alasan_permohonan')->nullable(); // Alasan user minta edit
            $table->text('alasan_penolakan')->nullable(); // Alasan ketua tim menolak
            $table->timestamp('processed_at')->nullable(); // Waktu diproses
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('edit_requests');
    }
};