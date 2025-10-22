<?php

namespace App\Policies;

use App\Models\Kasus;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class KasusPolicy
{
    /**
     * Determine whether the user can view any models.
     * PERUBAHAN: 'Penanggung Jawab' diubah menjadi 'Koordinator Lapangan'.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['Admin', 'Koordinator Lapangan', 'Ketua Tim', 'Petugas Lapangan']);
    }

    /**
     * Determine whether the user can view the model.
     * PERUBAHAN: 'Penanggung Jawab' diubah menjadi 'Koordinator Lapangan'.
     */
    public function view(User $user, Kasus $kasus): bool
    {
        return in_array($user->role, ['Admin', 'Koordinator Lapangan', 'Ketua Tim', 'Petugas Lapangan']);
    }

    /**
     * Determine whether the user can create models.
     * PERUBAHAN: 'Penanggung Jawab' diubah menjadi 'Koordinator Lapangan'.
     */
    public function create(User $user): bool
    {
        return in_array($user->role, ['Admin', 'Koordinator Lapangan', 'Ketua Tim']);
    }

    /**
     * Determine whether the user can update the model.
     * PERUBAHAN: 'Penanggung Jawab' diubah menjadi 'Koordinator Lapangan'.
     */
    public function update(User $user, Kasus $kasus): bool
    {
        return in_array($user->role, ['Admin', 'Koordinator Lapangan', 'Ketua Tim']);
    }

    /**
     * Determine whether the user can delete the model.
     * PERUBAHAN: 'Penanggung Jawab' diubah menjadi 'Koordinator Lapangan'.
     */
    public function delete(User $user, Kasus $kasus): bool
    {
        return in_array($user->role, ['Admin', 'Koordinator Lapangan', 'Ketua Tim']);
    }
    
    /**
     * Tentukan apakah pengguna dapat melakukan verifikasi pada kasus.
     * PERUBAHAN: 'Penanggung Jawab' diubah menjadi 'Koordinator Lapangan'.
     */
    public function verifikasi(User $user, Kasus $kasus): bool
    {
        return in_array($user->role, ['Admin', 'Koordinator Lapangan', 'Ketua Tim']);
    }
}

