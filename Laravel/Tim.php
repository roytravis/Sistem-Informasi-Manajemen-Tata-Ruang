<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tim extends Model
{
    use HasFactory;

    protected $table = 'tims';

    protected $fillable = [
        'nama_tim',
        'deskripsi',
    ];

    /**
     * Mendefinisikan relasi many-to-many ke User.
     * Sebuah tim bisa memiliki banyak anggota (User).
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'tim_user')->withPivot('jabatan_di_tim')->withTimestamps();
    }
    
    /**
     * Mendefinisikan relasi one-to-many ke Kasus.
     * Sebuah tim bisa ditugaskan ke banyak kasus.
     */
    public function kasuses()
    {
        return $this->hasMany(Kasus::class, 'tim_id');
    }
}
