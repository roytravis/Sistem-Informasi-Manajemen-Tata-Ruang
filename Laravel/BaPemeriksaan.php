<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BaPemeriksaan extends Model
{
    use HasFactory;

    protected $table = 'ba_pemeriksaans';

    protected $fillable = [
        'penilaian_id',
        'nomor_ba',
        'nomor_spt',
        'nama_pemegang',
        'tanda_tangan_pemegang',
        'nama_koordinator',
        'tanda_tangan_koordinator',
        'tanda_tangan_tim', // <-- Field Baru
    ];

    // Casting JSON ke Array agar mudah diakses di frontend
    protected $casts = [
        'tanda_tangan_tim' => 'array',
    ];

    public function penilaian()
    {
        return $this->belongsTo(Penilaian::class);
    }
}