<?php

/** @var \Laravel\Lumen\Routing\Router $router */

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It is a breeze. Simply tell Lumen the URIs it should respond to
| and give it the Closure to call when that URI is requested.
|
*/

$router->get('/', function () use ($router) {
    return $router->app->version();
});

// Public auth endpoints
$router->group(['prefix' => 'api'], function () use ($router) {
    // --- DEBUG ONLY: enable in local env, then remove ---
    if (app()->environment('local')) {
        $router->get('/debug/redis', function () {
            try {
                \Illuminate\Support\Facades\Redis::setex('chk', 5, 'ok');
                $val = \Illuminate\Support\Facades\Redis::get('chk');
                return response()->json(['status' => 'OK', 'value' => $val]);
            } catch (\Throwable $e) {
                return response()->json(['status' => 'ERROR', 'message' => $e->getMessage()], 500);
            }
        });
        $router->get('/debug/cache', function () {
            return response()->json([
                'env'   => env('CACHE_DRIVER'),
                'conf'  => config('cache.default', '(no config file)'),
            ]);
        });
        $router->get('/debug/headers', function () {
            return response()->json(request()->headers->all());
        });
    }
    // --- end debug route ---
    $router->get('/me', ['middleware' => 'jwt.auth', function () {
        return response()->json(auth()->user());
    }]);
    $router->post('/register', 'AuthController@register');
    $router->post('/login', 'AuthController@login');
    $router->group(['middleware' => 'jwt.auth'], function () use ($router) {
        $router->get('/debug/me', function () {
            return response()->json(auth()->user());
        });
        $router->get('/posts', 'PostController@index');
        $router->post('/posts', 'PostController@store');
        $router->get('/posts/{id}', 'PostController@show');
    });
});
