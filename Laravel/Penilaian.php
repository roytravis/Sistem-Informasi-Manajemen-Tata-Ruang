<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Penilaian extends Model
{
    use HasFactory;

    protected $fillable = [
        'kasus_id',
        'desk_study',
        'pemeriksaan',
        'pengukuran',
        'catatan',
        'tanda_tangan_tim',
    ];

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

    public function baPemeriksaan()
    {
        return $this->hasOne(BaPemeriksaan::class);
    }

    public function formulirAnalisis()
    {
        return $this->hasOne(FormulirAnalisisPenilaian::class);
    }

    // --- PENAMBAHAN BARU ---
    public function baHasilPenilaian()
    {
        return $this->hasOne(BaHasilPenilaian::class);
    }
}