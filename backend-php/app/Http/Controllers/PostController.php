<?php
namespace App\Http\Controllers;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class PostController extends Controller {
    public function index(Request $request)
        {
            // 60 seconds TTL (your tests assert a positive TTL)
            $posts = Cache::remember('posts:all', 60, function () {
                return Post::with(['user:id,name,email'])
                    ->orderByDesc('created_at')
                    ->get()
                    ->toArray();
            });

            return response()->json([
                'value' => $posts,
                'Count' => count($posts),
            ], 200);
    }

    public function store(Request $request)
    {
            $this->validate($request, [
                'title'   => 'required|string|max:255',
                'content' => 'required|string',
            ]);

            $post = Post::create([
                'title'   => $request->input('title'),
                'content' => $request->input('content'),
                'user_id' => $request->user()->id,
            ]);

            // Bust list cache
            $this->bustPostCaches("{$post->id}");

            return response()->json($post, 201);
    }

    public function update(Request $req, $id)
    {
        $post = Post::findOrFail($id);
        $post->update($this->validate($req, [
            'title' => 'required',
            'content' => 'required',
        ]));

       $this->bustPostCaches("{$post->id}");

        return $post->fresh()->load('user:id,name,email');
    }

    public function destroy($id)
    {
        $post = Post::findOrFail($id);
        $post->delete();

        $this->bustPostCaches("{$id}");

        return response()->noContent();
    }

    private function bustPostCaches(int $id): void
    {
        Cache::forget('posts:all');
        Cache::forget("posts:id:{$id}");
    }
}
