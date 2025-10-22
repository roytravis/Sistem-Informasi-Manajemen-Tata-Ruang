<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Penilaian extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     * PERBAIKAN: Sesuaikan dengan skema baru untuk tanda tangan tim.
     */
    protected $fillable = [
        'kasus_id',
        'desk_study',
        'pemeriksaan',
        'pengukuran',
        'catatan',
        'tanda_tangan_tim', // Menggantikan 'penilai_id' dan 'tanda_tangan_petugas'
    ];

    /**
     * PERBAIKAN: Cast 'tanda_tangan_tim' sebagai array.
     */
    protected $casts = [
        'desk_study' => 'array',
        'pemeriksaan' => 'array',
        'pengukuran' => 'array',
        'tanda_tangan_tim' => 'array',
    ];

    public function kasus()
    {
        return $this->belongsTo(Kasus::class);
    }

    // Relasi 'penilai()' tunggal tidak lagi relevan karena penilai adalah tim.
}
