<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FormulirAnalisisPenilaian extends Model
{
    use HasFactory;

    protected $table = 'formulir_analisis_penilaians';

    protected $fillable = [
        'penilaian_id',
        'lokasi_kesesuaian_pmp_eksisting',
        'jenis_kesesuaian_pmp_eksisting',
        'jenis_ketentuan_rtr',
        'jenis_kesesuaian_rtr',
        'luas_digunakan_ketentuan_rtr',
        'luas_digunakan_kesesuaian_rtr',
        'luas_dikuasai_ketentuan_rtr',
        'luas_dikuasai_kesesuaian_rtr',
        'kdb_ketentuan_rtr',
        'kdb_kesesuaian_rtr',
        'kdb_rasio_manual',
        'kdb_persen_manual',
        'klb_luas_tanah',
        'klb_ketentuan_rtr',
        'klb_kesesuaian_rtr',
        'klb_rasio_manual',
        // PERBAIKAN: Menambahkan field ketinggian bangunan
        'ketinggian_ketentuan_rtr',
        'ketinggian_kesesuaian_rtr',
        'kdh_luas_tanah',
        'kdh_perbandingan_vegetasi',
        'kdh_ketentuan_rtr',
        'kdh_kesesuaian_rtr',
        'kdh_rasio_manual',
        'ktb_luas_tanah',
        'ktb_ketentuan_rtr',
        'ktb_kesesuaian_rtr',
        'ktb_rasio_manual',
        'ktb_persen_manual',
        'gsb_ketentuan_rtr',
        'gsb_kesesuaian_rtr',
        'jbb_ketentuan_rtr',
        'jbb_kesesuaian_rtr',
        'tanda_tangan_tim',
    ];

    protected $casts = [
        'tanda_tangan_tim' => 'array',
    ];

    /**
     * Relasi ke Penilaian.
     */
    public function penilaian()
    {
        return $this->belongsTo(Penilaian::class);
    }
}