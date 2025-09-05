<?php

use Laravel\Lumen\Testing\TestCase as LumenTestCase;

abstract class TestCase extends BaseTestCase
{
    public function createApplication()
    {
        $app = require __DIR__ . '/../bootstrap/app.php';
        // Ensure configs are loaded for tests
        $app->configure('app');
        $app->configure('auth');
        $app->configure('cache');
        $app->configure('database');

        return $app;
    }
}