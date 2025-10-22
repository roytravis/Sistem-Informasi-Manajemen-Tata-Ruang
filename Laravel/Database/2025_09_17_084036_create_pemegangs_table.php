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
            // PERBAIKAN: Menyamakan nama kolom
            $table->string('nama_pemegang'); 
            $table->string('nama_usaha');
            $table->text('alamat');
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
