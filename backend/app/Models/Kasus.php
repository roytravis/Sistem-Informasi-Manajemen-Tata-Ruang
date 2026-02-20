<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kasus extends Model
{
    use HasFactory;

    protected $table = 'kasuses';
    
    // PERBARUI: Sesuaikan fillable dengan skema baru
    protected $fillable = [
        'jenis', 'nomor_permohonan', 'status', 'prioritas_score', 'pemegang_id', 'tim_id', 'penanggung_jawab_id'
    ];

    /**
     * Mendefinisikan relasi ke User (Penanggung Jawab).
     * Kolom foreign key diubah menjadi 'penanggung_jawab_id'.
     */
    public function penanggung_jawab()
    {
        return $this->belongsTo(User::class, 'penanggung_jawab_id');
    }

    /**
     * Mendefinisikan relasi ke Pemegang.
     */
    public function pemegang()
    {
        return $this->belongsTo(Pemegang::class, 'pemegang_id');
    }

    /**
     * Mendefinisikan relasi ke Survei.
     */
    public function surveis()
    {
        return $this->hasMany(Survei::class);
    }
    
    /**
     * Mendefinisikan relasi ke Tim Penilai.
     */
    public function tim()
    {
        return $this->belongsTo(Tim::class, 'tim_id');
    }

    /**
     * PENAMBAHAN: Mendefinisikan relasi ke Penilaian.
     * Sebuah kasus hanya memiliki satu hasil penilaian akhir.
     */
    public function penilaian()
    {
        return $this->hasOne(Penilaian::class);
    }

    /**
     * PERBAIKAN: Mendefinisikan relasi ke PermohonanPenilaian.
     * Relasi ini diperlukan untuk KasusPolicy agar bisa mengecek tim dan penanggung_jawab.
     */
    public function permohonan()
    {
        return $this->belongsTo(PermohonanPenilaian::class, 'nomor_permohonan', 'nomor_permohonan');
    }
}
