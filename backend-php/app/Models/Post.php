<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class Post extends Model {
    protected $fillable = ['title','content','user_id'];

    // Eloquent expects created_at / updated_at by default; this is optional:
    public $timestamps = true;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected static function booted()
    {
        $flush = function ($post) {
            Cache::forget('posts:all');
            Cache::forget("posts:id:{$post->id}");
        };

        static::created($flush);
        static::updated($flush);
        static::deleted($flush);
    }
}
