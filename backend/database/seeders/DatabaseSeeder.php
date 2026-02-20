<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Hapus atau komentari User::factory(10)->create(); jika ada

        // PERBAIKAN: Ganti 'name' menjadi 'nama' agar sesuai dengan skema database
        User::factory()->create([
             'nama' => 'Admin User',
             'email' => 'admin@example.com',
             'password' => Hash::make('password'),
             'role' => 'Admin',
        ]);

        User::factory()->create([
             'nama' => 'Petugas Lapangan',
             'email' => 'petugas@example.com',
             'password' => Hash::make('password'),
             'role' => 'Petugas Lapangan',
        ]);
    }
}
