<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pemegang extends Model
{
    use HasFactory;

    protected $table = 'pemegangs';
    
    /**
     * PERBARUI: Sesuaikan properti fillable dengan kolom database yang baru.
     * PENAMBAHAN: Menambahkan 'email' dan 'nomor_handphone'.
     */
    protected $fillable = [
        'nama_pelaku_usaha',
        'nomor_identitas',
        'kegiatan',
        'alamat',
        'desa_kelurahan',
        'kecamatan',
        'email',
        'nomor_handphone',
    ];

    public function kasus()
    {
        return $this->hasMany(Kasus::class);
    }
}
