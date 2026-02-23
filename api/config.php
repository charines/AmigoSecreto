<?php
declare(strict_types=1);

if (!function_exists('load_env')) {
    function load_env(string $path): void
    {
        if (!is_readable($path)) {
            return;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES);
        if ($lines === false) {
            return;
        }

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') {
                continue;
            }
            if (strpos($line, '=') === false) {
                continue;
            }

            [$key, $value] = explode('=', $line, 2);
            $key = trim($key);
            if ($key === '') {
                continue;
            }
            $value = trim($value);
            if ($value !== '') {
                $first = $value[0];
                $last = $value[strlen($value) - 1];
                if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                    $value = substr($value, 1, -1);
                }
            }

            if (getenv($key) === false) {
                putenv($key . '=' . $value);
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
            }
        }
    }
}

load_env(__DIR__ . '/../.env');
load_env(__DIR__ . '/.env');

return [
    'db' => [
        'host' => getenv('DB_HOST') ?: 'localhost',
        'name' => getenv('DB_NAME') ?: '',
        'user' => getenv('DB_USER') ?: '',
        'pass' => getenv('DB_PASS') ?: '',
        'charset' => 'utf8mb4',
    ],
    'cors' => [
        'origin' => getenv('APP_ORIGIN') ?: '*',
    ],
    'mail' => [
        'host' => getenv('SMTP_HOST') ?: 'smtp.titan.email',
        'port' => (int)(getenv('SMTP_PORT') ?: 587),
        'user' => getenv('SMTP_USER') ?: '',
        'pass' => getenv('SMTP_PASS') ?: '',
        'from' => getenv('SMTP_FROM') ?: '',
        'from_name' => getenv('SMTP_FROM_NAME') ?: 'Amigo Secreto',
        'secure' => getenv('SMTP_SECURE') ?: 'tls',
        'timeout' => (int)(getenv('SMTP_TIMEOUT') ?: 10),
    ],
    'imap' => [
        'host' => getenv('IMAP_HOST') ?: 'imap.titan.email',
        'port' => (int)(getenv('IMAP_PORT') ?: 993),
        'user' => getenv('IMAP_USER') ?: '',
        'pass' => getenv('IMAP_PASS') ?: '',
        'folder' => getenv('IMAP_SENT_FOLDER') ?: 'Sent',
        'ssl' => filter_var(getenv('IMAP_SSL') ?: '1', FILTER_VALIDATE_BOOLEAN),
        'timeout' => (int)(getenv('IMAP_TIMEOUT') ?: (getenv('SMTP_TIMEOUT') ?: 10)),
    ],
];
