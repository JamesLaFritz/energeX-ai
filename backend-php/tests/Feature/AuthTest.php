<?php
declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

class AuthTest extends TestCase
{
    public function test_register_then_login_returns_token(): void
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
        ])
        ->seeStatusCode(200)
        ->seeJsonStructure(['token']);
    }
}
