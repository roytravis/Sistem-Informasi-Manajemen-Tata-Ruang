<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Membuat tabel pivot untuk relasi many-to-many antara tims dan users.
     */
    public function up(): void
    {
        Schema::create('tim_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tim_id')->constrained('tims')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('jabatan_di_tim', ['Ketua Tim', 'Petugas Lapangan']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tim_user');
    }
};
