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
        Schema::create('pemegangs', function (Blueprint $table) {
            $table->id();
            $table->string('nama_usaha');
            $table->text('alamat');
            // PERBAIKAN: Mengganti tipe 'point' dengan dua kolom 'decimal'
            $table->decimal('koordinat_lat', 10, 8)->nullable();
            $table->decimal('koordinat_lng', 11, 8)->nullable();
            $table->string('pemilik_nama');
            $table->string('pemilik_kontak');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pemegangs');
    }
};
