<?php
namespace App\Http\Controllers;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class PostController extends Controller {
    public function index(){
    $posts = Cache::remember('posts:all', 60, function () {
            return \App\Models\Post::with(['user:id,name,email'])->latest()->get();
        });

        return response()->json($posts, 200);
    }

    public function store(Request $req){
        $data = $this->validate($req, [
            'title' => 'required',
            'content' => 'required',
        ]);

        $post = Post::create($data + ['user_id' => $req->user()->id]);

        Cache::forget('posts:all');
        Cache::forget("posts:id:{$post->id}");

        return response()->json($post->load('user:id,name,email'), 201);
    }

    public function update(Request $req, $id)
    {
        $post = Post::findOrFail($id);
        $post->update($this->validate($req, [
            'title' => 'required',
            'content' => 'required',
        ]));

        Cache::forget('posts:all');
        Cache::forget("posts:id:{$post->id}");

        return $post->fresh()->load('user:id,name,email');
    }

    public function destroy($id)
    {
        $post = Post::findOrFail($id);
        $post->delete();

        Cache::forget('posts:all');
        Cache::forget("posts:id:{$id}");

        return response()->noContent();
    }
}
