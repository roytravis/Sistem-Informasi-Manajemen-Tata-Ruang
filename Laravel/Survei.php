<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Survei extends Model
{
    use HasFactory;

    protected $fillable = [
        'kasus_id',
        'petugas_id',
        'tanggal_survey',
        'lokasi_lat',
        'lokasi_lng',
        'data_formulir',
        'tanda_tangan_petugas',
        'tanda_tangan_pemegang',
        'foto_path', // Menambahkan path untuk foto
    ];

    protected $casts = [
        'data_formulir' => 'array',
        'tanggal_survey' => 'datetime',
    ];

    public function kasus()
    {
        return $this->belongsTo(Kasus::class);
    }

    public function petugas()
    {
        return $this->belongsTo(User::class, 'petugas_id');
    }
}