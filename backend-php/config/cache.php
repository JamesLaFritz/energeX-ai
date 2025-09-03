<?php

use Illuminate\Support\Str;

return [
    'default' => env('CACHE_DRIVER', 'file'),

    'stores' => [
        'redis' => [
            'driver' => 'redis',
            'connection' => env('CACHE_REDIS_CONNECTION', 'cache'),
        ],
    ],

    // Keep a clear, minimal cache prefix (or blank)
        'prefix' => env('CACHE_PREFIX', 'lumen_cache'),
];
