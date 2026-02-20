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
        Schema::create('surveis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kasus_id')->constrained('kasuses')->onDelete('cascade');
            $table->foreignId('petugas_id')->constrained('users');
            $table->dateTime('tanggal_survey');
            $table->decimal('lokasi_lat', 10, 8);
            $table->decimal('lokasi_lng', 11, 8);
            
            // PERBAIKAN: Menambahkan kolom JSON yang hilang untuk menyimpan data formulir
            $table->json('data_formulir')->nullable(); 
            
            $table->text('tanda_tangan_petugas')->nullable();
            $table->text('tanda_tangan_pemegang')->nullable();
            
            // Kolom foto_path yang sebelumnya hilang juga sudah ada di migrasi terpisah
            // Jika Anda belum menambahkannya, pastikan file migrasi add_foto_path_to_surveis_table.php juga ada

            $table->uuid('offline_uuid')->nullable(); // Untuk sinkronisasi mobile
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('surveis');
    }
};
