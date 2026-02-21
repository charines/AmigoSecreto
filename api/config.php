<?php
declare(strict_types=1);

return [
    'db' => [
        'host' => getenv('DB_HOST') ?: 'localhost',
        'name' => getenv('DB_NAME') ?: 'DB_NAME_HERE',
        'user' => getenv('DB_USER') ?: 'DB_USER_HERE',
        'pass' => getenv('DB_PASS') ?: 'DB_PASS_HERE',
        'charset' => 'utf8mb4',
    ],
    'cors' => [
        'origin' => getenv('APP_ORIGIN') ?: '*',
    ],
];
