<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PermohonanPenilaian extends Model
{
    use HasFactory;

    protected $table = 'permohonan_penilaians';

    // PERBAIKAN: Tambahkan 'berita_acara_id' ke fillable
    protected $fillable = [
        'status',
        'prioritas_score',
        'pemegang_id',
        'tim_id',
        'penanggung_jawab_id',
        'nomor_permohonan',
        'berita_acara_id', // Ditambahkan
    ];

    // Definisikan relasi yang sama seperti pada model Kasus
    public function pemegang()
    {
        return $this->belongsTo(Pemegang::class, 'pemegang_id');
    }

    public function tim()
    {
        return $this->belongsTo(Tim::class, 'tim_id');
    }

    public function penanggung_jawab()
    {
        return $this->belongsTo(User::class, 'penanggung_jawab_id');
    }

    /**
     * PENAMBAHAN: Mendefinisikan relasi bahwa sebuah permohonan
     * dapat memiliki satu kasus yang berkorespondensi.
     */
    public function kasus()
    {
        return $this->hasOne(Kasus::class, 'nomor_permohonan', 'nomor_permohonan');
    }

    /**
     * PENAMBAHAN: Relasi ke Berita Acara
     */
    public function beritaAcara()
    {
        return $this->belongsTo(BeritaAcara::class, 'berita_acara_id');
    }
}
