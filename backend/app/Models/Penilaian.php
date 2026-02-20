<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\EditRequest; // Import model

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

    // --- DEBUGGING & FIX: Append status keberadaan formulir ---
    // Menambahkan atribut 'has_formulir_analisis' ke dalam JSON output otomatis
    protected $appends = ['has_formulir_analisis'];

    // Accessor untuk mengecek langsung ke DB apakah relasi ada
    // PERBAIKAN: Menggunakan relationLoaded untuk efisiensi dan akurasi
    public function getHasFormulirAnalisisAttribute()
    {
        // Jika relasi sudah di-load oleh controller (eager loading), gunakan datanya langsung
        // Ini mencegah query N+1 dan memastikan data konsisten dengan apa yang diambil controller
        if ($this->relationLoaded('formulirAnalisis')) {
            return $this->formulirAnalisis !== null;
        }
        
        // Jika belum di-load (fallback), baru lakukan query ke database
        return $this->formulirAnalisis()->exists();
    }
    // ----------------------------------------------------------

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

    public function baHasilPenilaian()
    {
        return $this->hasOne(BaHasilPenilaian::class);
    }

    public function editRequests()
    {
        return $this->hasMany(EditRequest::class);
    }

    public function latestEditRequest()
    {
        return $this->hasOne(EditRequest::class)->latestOfMany();
    }
}