<?php
namespace App\Http\Controllers;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class PostController extends Controller {
    public function index(){
        return Cache::remember('posts:all', 60, fn () => Post::with('user:id,name')->latest()->get());
    }

    public function store(Request $r){
        $this->validate($r, [
            'title'   => 'required',
            'content' => 'required',
        ]);

        $post = Post::create([
            'title'=>$r->input('title'),
            'content'=>$r->input('content'),
            'user_id'=>$r->user()->id,
        ]);

        // bust caches
        Cache::forget('posts:all');

        return response()->json($post,201);
    }
}
