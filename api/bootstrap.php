<?php
declare(strict_types=1);

require __DIR__ . '/cors.php';

$config = require __DIR__ . '/config.php';
$session = $config['session'] ?? [];

$cookieParams = [
    'lifetime' => 0,
    'path' => '/',
    'secure' => (bool)($session['secure'] ?? false),
    'httponly' => true,
    'samesite' => (string)($session['samesite'] ?? 'Lax'),
];

if (PHP_VERSION_ID >= 70300) {
    session_set_cookie_params($cookieParams);
} else {
    session_set_cookie_params(
        $cookieParams['lifetime'],
        $cookieParams['path'] . '; samesite=' . $cookieParams['samesite'],
        '',
        $cookieParams['secure'],
        $cookieParams['httponly']
    );
}

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $pdo = require __DIR__ . '/db.php';
    return $pdo;
}

function json_response(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function json_input(): array
{
    $raw = file_get_contents('php://input');
    $input = json_decode($raw ?: '', true);
    if (!is_array($input)) {
        json_response(['ok' => false, 'error' => 'Payload invalido'], 400);
    }
    return $input;
}

function require_admin(): array
{
    $adminId = $_SESSION['admin_id'] ?? null;
    if (!$adminId) {
        json_response(['ok' => false, 'error' => 'Nao autorizado'], 401);
    }
    $pdo = db();
    $stmt = $pdo->prepare('SELECT id, name, email FROM admins WHERE id = ? LIMIT 1');
    $stmt->execute([(int)$adminId]);
    $admin = $stmt->fetch();
    if (!$admin) {
        session_destroy();
        json_response(['ok' => false, 'error' => 'Sessao invalida'], 401);
    }
    return $admin;
}

function random_token(int $bytes = 24): string
{
    return rtrim(strtr(base64_encode(random_bytes($bytes)), '+/', '-_'), '=');
}
