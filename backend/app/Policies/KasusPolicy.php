<?php

namespace App\Policies;

use App\Models\Kasus;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class KasusPolicy
{
    /**
     * Helper method: Check if user is a member of the assigned team or is the penanggung jawab.
     */
    private function isTeamMember(User $user, Kasus $kasus): bool
    {
        $permohonan = $kasus->permohonan;
        
        if (!$permohonan) {
            return false;
        }
        
        // Check if user is the penanggung jawab (Koordinator Lapangan)
        if ($permohonan->penanggung_jawab_id === $user->id) {
            return true;
        }
        
        // Check if user is in the assigned Tim
        if ($permohonan->tim_id) {
            // Load the tim with its users to check membership
            $tim = $permohonan->tim()->with('users')->first();
            if ($tim && $tim->users->contains('id', $user->id)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Determine whether the user can view any models.
     * PERBAIKAN: Admin can view all, others must have appropriate role.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['Admin', 'Koordinator Lapangan', 'Ketua Tim', 'Petugas Lapangan']);
    }

    /**
     * Determine whether the user can view the model.
     * PERBAIKAN: 
     * - Admin can always view
     * - Users with appropriate roles can view if status is "Selesai Dinilai (Verifikasi)" (read-only public access)
     * - Otherwise, must be team member
     */
    public function view(User $user, Kasus $kasus): bool
    {
        // Admin can always view
        if ($user->role === 'Admin') {
            return true;
        }
        
        // Must have appropriate role to proceed
        if (!in_array($user->role, ['Koordinator Lapangan', 'Ketua Tim', 'Petugas Lapangan'])) {
            return false;
        }
        
        // Allow viewing if assessment is finalized (public read-only access)
        // Check BOTH Kasus status AND PermohonanPenilaian status for robustness
        if ($kasus->status === 'Selesai Dinilai (Verifikasi)') {
            return true;
        }
        
        $permohonan = $kasus->permohonan;
        if ($permohonan && $permohonan->status === 'Selesai Dinilai (Verifikasi)') {
            return true;
        }
        
        // For non-finalized assessments, must be team member
        return $this->isTeamMember($user, $kasus);
    }

    /**
     * Determine whether the user can create models.
     * PERBAIKAN: Keep existing logic - creation happens before team assignment.
     */
    public function create(User $user): bool
    {
        return in_array($user->role, ['Admin', 'Koordinator Lapangan', 'Ketua Tim']);
    }

    /**
     * Determine whether the user can update the model.
     * PERBAIKAN: Admin can always update, Petugas Lapangan team members can update assessments.
     */
    public function update(User $user, Kasus $kasus): bool
    {
        // Admin can always update
        if ($user->role === 'Admin') {
            return true;
        }
        
        // Must have appropriate role to update
        if (!in_array($user->role, ['Koordinator Lapangan', 'Ketua Tim', 'Petugas Lapangan'])) {
            return false;
        }
        
        // Must be team member or penanggung jawab
        return $this->isTeamMember($user, $kasus);
    }

    /**
     * Determine whether the user can delete the model.
     * PERBAIKAN: Admin can always delete, others must be team members with appropriate role.
     */
    public function delete(User $user, Kasus $kasus): bool
    {
        // Admin can always delete
        if ($user->role === 'Admin') {
            return true;
        }
        
        // Only Ketua Tim and Koordinator Lapangan can delete
        if (!in_array($user->role, ['Koordinator Lapangan', 'Ketua Tim'])) {
            return false;
        }
        
        // Must be team member or penanggung jawab
        return $this->isTeamMember($user, $kasus);
    }
    
    /**
     * Tentukan apakah pengguna dapat melakukan verifikasi pada kasus.
     * PERBAIKAN: Admin can always verify, others must be team members with appropriate role.
     */
    public function verifikasi(User $user, Kasus $kasus): bool
    {
        // Admin can always verify
        if ($user->role === 'Admin') {
            return true;
        }
        
        // Only Ketua Tim and Koordinator Lapangan can verify
        if (!in_array($user->role, ['Koordinator Lapangan', 'Ketua Tim'])) {
            return false;
        }
        
        // Must be team member or penanggung jawab
        return $this->isTeamMember($user, $kasus);
    }
}

