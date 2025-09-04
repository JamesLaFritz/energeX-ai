<?php
declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

class PostCacheTest extends TestCase
{
    protected function authHeader(): string
    {
        $email = 't'.uniqid().'@example.com';

        $this->post('/api/register', [
            'name'     => 'T',
            'email'    => $email,
            'password' => 'password123',
        ])->seeStatusCode(201);

        $this->post('/api/login', [
            'email'    => $email,
            'password' => 'password123',
        ])->seeStatusCode(200);

        $token = json_decode($this->response->getContent(), true)['token'];
        return "Bearer $token";
    }

    public function test_index_warms_cache_and_store_busts_it(): void
    {
        $auth  = $this->authHeader();
        $redis = $this->app->make('redis')->connection('cache');

        $redis->del('lumen_cache:posts:all');

        $this->get('/api/posts', ['Authorization' => $auth])
             ->seeStatusCode(200)
             ->seeJsonStructure(['value', 'Count']);

        $this->assertSame(1, (int) $redis->exists('lumen_cache:posts:all'));

        $this->post('/api/posts', ['title' => 'T', 'content' => 'C'], ['Authorization' => $auth])
             ->seeStatusCode(201);

        $this->assertSame(0, (int) $redis->exists('lumen_cache:posts:all'));
    }

    public function test_posts_endpoint_sets_cache_key_with_ttl(): void
    {
        $auth  = $this->authHeader();
        $redis = $this->app->make('redis')->connection('cache');

        $this->get('/api/posts', ['Authorization' => $auth]);
        $this->seeStatusCode(200);

        $key = 'lumen_cache:posts:all';
        $this->assertSame(1, (int) $redis->exists($key), 'cache key does not exist');

        $ttl = (int) $redis->ttl($key);
        $this->assertGreaterThan(0, $ttl, 'cache key should have a positive TTL');
    }
}
