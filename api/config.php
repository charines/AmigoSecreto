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
    'mail' => [
        'host' => getenv('SMTP_HOST') ?: '',
        'port' => (int)(getenv('SMTP_PORT') ?: 587),
        'user' => getenv('SMTP_USER') ?: '',
        'pass' => getenv('SMTP_PASS') ?: '',
        'from' => getenv('SMTP_FROM') ?: '',
        'from_name' => getenv('SMTP_FROM_NAME') ?: 'Amigo Secreto',
        'secure' => getenv('SMTP_SECURE') ?: 'tls',
        'timeout' => (int)(getenv('SMTP_TIMEOUT') ?: 10),
    ],
];
