<?php

return [
    'default' => env('CACHE_DRIVER', 'array'),

    'stores' => [
        'array' => [
            'driver' => 'array',
            'serialize' => false,
        ],
        'redis' => [
            'driver' => 'redis',
            'connection' => 'default',
        ],
    ],

    'prefix' => env('CACHE_PREFIX', 'lumen_cache'),
];
