<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     * PENAMBAHAN: Kolom 'jabatan' ditambahkan ke fillable.
     */
    protected $fillable = [
        'nama',
        'nip',
        'email',
        'password',
        'role',
        'unit_kerja',
        'jabatan', // Ditambahkan
        'last_login',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * Mendefinisikan relasi bahwa seorang User bisa menjadi anggota dari banyak Tim.
     */
    public function tims()
    {
        return $this->belongsToMany(Tim::class, 'tim_user')->withPivot('jabatan_di_tim')->withTimestamps();
    }
}

