<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BaHasilPenilaian extends Model
{
    use HasFactory;

    protected $table = 'ba_hasil_penilaians';

    protected $fillable = [
        'penilaian_id',
        'nomor_ba',
        'tanggal_ba',
        'validitas_kegiatan',
        'rekomendasi_lanjutan',
        'tanda_tangan_tim',
        'snapshot_petugas',
    ];

    protected $casts = [
        'tanggal_ba' => 'date',
        'tanda_tangan_tim' => 'array',
        'snapshot_petugas' => 'array',
    ];

    public function penilaian()
    {
        return $this->belongsTo(Penilaian::class);
    }
}