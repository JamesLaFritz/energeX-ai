<?php

use Predis\Client as Predis;

class PostCacheTest extends TestCase
{
    protected function authHeader(): string
    {
        $email = 't'.uniqid().'@example.com';
        $this->post('/api/register', [
            'name' => 'T',
            'email' => $email,
            'password' => 'password123',
        ])->seeStatusCode(201);

        $this->post('/api/login', [
            'email' => $email,
            'password' => 'password123',
        ])->seeStatusCode(200);

        $token = json_decode($this->response->getContent(), true)['token'];
        return "Bearer $token";
    }

    public function test_index_warms_cache_and_store_busts_it()
    {
        $auth = $this->authHeader();

        // clear key first (DB 0, prefix lumen_cache)
        /** @var \Illuminate\Redis\Connections\Connection $redis */
        $redis = $this->app->make('redis')->connection('cache');
        $redis->del('lumen_cache:posts:all');

        // GET warms cache
        $this->get('/api/posts', ['Authorization' => $auth])
             ->seeStatusCode(200)
             // if your /api/posts returns { value, Count }, keep this:
             ->seeJsonStructure(['value', 'Count']); // your controller returns { value: [...], Count: n }

        $this->assertEquals(1, (int)$redis->exists('lumen_cache:posts:all'));

        // POST (create) should call Cache::forget('posts:all')
        $this->post('/api/posts', ['title' => 'T', 'content' => 'C'], ['Authorization' => $auth])
             ->seeStatusCode(201);

        $this->assertEquals(0, (int)$redis->exists('lumen_cache:posts:all'));
    }

public function test_posts_endpoint_sets_cache_key_with_ttl()
    {
        $auth = $this->authHeader();
        
        $this->get('/api/posts', ['Authorization' => $auth]);
        $this->seeStatusCode(200);

        // check redis for the key & ttl
        $redis = new Predis([
            'scheme'   => 'tcp',
            'host'     => getenv('REDIS_HOST') ?: 'redis',
            'port'     => getenv('REDIS_PORT') ?: 6379,
            'database' => getenv('REDIS_DB') ?: (getenv('REDIS_DB') ?: 0),
        ]);

        $key = 'lumen_cache:posts:all';
        
        $this->assertTrue((bool)$redis->exists($key), 'cache key does not exist');

        $ttl = $redis->ttl($key);
        $this->assertGreaterThan(0, $ttl, 'cache key should have a positive TTL');
    }
}
