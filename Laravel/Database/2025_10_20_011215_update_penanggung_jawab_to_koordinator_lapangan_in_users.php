<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Models\User;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Mengubah nama role 'Penanggung Jawab' menjadi 'Koordinator Lapangan'
     * pada semua data user yang ada.
     */
    public function up(): void
    {
        // Menggunakan query builder untuk keamanan dan kompatibilitas
        User::where('role', 'Penanggung Jawab')
            ->update(['role' => 'Koordinator Lapangan']);
    }

    /**
     * Reverse the migrations.
     * Mengembalikan nama role ke 'Penanggung Jawab' jika migrasi di-rollback.
     */
    public function down(): void
    {
        User::where('role', 'Koordinator Lapangan')
            ->update(['role' => 'Penanggung Jawab']);
    }
};
