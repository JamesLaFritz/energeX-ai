<?php

class AuthTest extends TestCase
{
    public function test_register_then_login_returns_token()
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
        ])
        ->seeStatusCode(200)
        ->seeJsonStructure(['token']);
    }
}