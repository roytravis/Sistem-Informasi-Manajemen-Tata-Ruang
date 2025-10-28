<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BaPemeriksaan extends Model
{
    use HasFactory;

    /**
     * Nama tabel yang terkait dengan model ini.
     *
     * @var string
     */
    protected $table = 'ba_pemeriksaans'; // Eksplisit mendefinisikan nama tabel

    /**
     * Atribut yang dapat diisi secara massal (mass assignable).
     * Kolom-kolom yang boleh diisi secara massal (misal, via create() atau update()).
     * @var array<int, string>
     */
    protected $fillable = [
        'penilaian_id',
        'nomor_ba',
        'nomor_spt',
        'nama_pemegang',
        'tanda_tangan_pemegang',
        'nama_koordinator',         // <-- DITAMBAHKAN
        'tanda_tangan_koordinator', // <-- DITAMBAHKAN
    ];

    /**
     * Mendefinisikan relasi "belongsTo" (milik) ke model Penilaian.
     * Setiap BaPemeriksaan terkait dengan satu Penilaian.
     */
    public function penilaian()
    {
        // Parameter kedua (opsional) adalah foreign key di tabel ba_pemeriksaans (defaultnya penilaian_id)
        // Parameter ketiga (opsional) adalah primary key di tabel penilaians (defaultnya id)
        return $this->belongsTo(Penilaian::class);
    }
}
