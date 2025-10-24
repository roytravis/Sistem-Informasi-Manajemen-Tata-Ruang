<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BeritaAcara extends Model
{
    use HasFactory;

    protected $table = 'berita_acaras';

    // --- PERUBAHAN: Menambahkan 'tanda_tangan_tim' ---
    protected $fillable = [
        'nomor_ba',
        'pemegang_id',
        'koordinator_id',
        'alasan',
        'keterangan_lainnya',
        'tanggal_ba',
        'tanda_tangan_tim', // Ditambahkan
    ];

    // --- PERUBAHAN: Menambahkan casting untuk field baru ---
    protected $casts = [
        'tanggal_ba' => 'date',
        'tanda_tangan_tim' => 'array', // Ditambahkan
    ];

    /**
     * Relasi ke Pemegang (Pelaku Usaha).
     */
    public function pemegang()
    {
        return $this->belongsTo(Pemegang::class, 'pemegang_id');
    }

    /**
     * Relasi ke Koordinator Lapangan (User).
     */
    public function koordinator()
    {
        return $this->belongsTo(User::class, 'koordinator_id');
    }

    /**
     * Relasi many-to-many ke Tim Penilai (Users).
     */
    public function timPenilai()
    {
        return $this->belongsToMany(User::class, 'berita_acara_user', 'berita_acara_id', 'user_id');
    }

    /**
     * PENAMBAHAN: Relasi ke Permohonan Penilaian
     */
    public function permohonanPenilaian()
    {
        return $this->hasOne(PermohonanPenilaian::class, 'berita_acara_id');
    }
}
