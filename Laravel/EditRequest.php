<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EditRequest extends Model
{
    use HasFactory;

    protected $table = 'edit_requests';

    protected $fillable = [
        'penilaian_id',
        'user_id',
        'status',
        'alasan_permohonan',
        'alasan_penolakan',
        'processed_at'
    ];

    public function penilaian()
    {
        return $this->belongsTo(Penilaian::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}