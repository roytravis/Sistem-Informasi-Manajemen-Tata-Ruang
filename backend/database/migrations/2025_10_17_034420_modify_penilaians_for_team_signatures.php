<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Mengubah tabel penilaians untuk mendukung tanda tangan dari banyak anggota tim.
     */
    public function up(): void
    {
        Schema::table('penilaians', function (Blueprint $table) {
            // Hapus kolom penilai_id dan tanda_tangan_petugas yang lama karena tidak lagi relevan.
            // Relasi ke penilai sekarang didasarkan pada anggota tim kasus terkait.
            if (Schema::hasColumn('penilaians', 'penilai_id')) {
                // PERBAIKAN: Gunakan metode dropForeign bawaan Laravel yang lebih sederhana
                // untuk menghapus constraint berdasarkan nama kolom.
                $table->dropForeign(['penilai_id']);
                $table->dropColumn('penilai_id');
            }

            if (Schema::hasColumn('penilaians', 'tanda_tangan_petugas')) {
                $table->dropColumn('tanda_tangan_petugas');
            }

            // Tambahkan kolom JSON baru untuk menyimpan array tanda tangan.
            // Format: [{"user_id": 1, "signature_path": "path/to/sig.png"}, ...]
            $table->json('tanda_tangan_tim')->nullable()->after('catatan');
        });
    }

    /**
     * Reverse the migrations.
     * Mengembalikan skema ke kondisi semula jika migrasi di-rollback.
     */
    public function down(): void
    {
        Schema::table('penilaians', function (Blueprint $table) {
            if (Schema::hasColumn('penilaians', 'tanda_tangan_tim')) {
                $table->dropColumn('tanda_tangan_tim');
            }

            // Tambahkan kembali kolom-kolom lama.
            if (!Schema::hasColumn('penilaians', 'penilai_id')) {
                $table->foreignId('penilai_id')->nullable()->constrained('users')->after('kasus_id');
            }
             if (!Schema::hasColumn('penilaians', 'tanda_tangan_petugas')) {
                $table->text('tanda_tangan_petugas')->nullable()->after('catatan');
            }
        });
    }
};

