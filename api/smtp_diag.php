<?php
declare(strict_types=1);

require __DIR__ . '/cors.php';

$raw = file_get_contents('php://input');
$input = json_decode($raw ?: '', true);
if (!is_array($input)) {
    $input = [];
}

$token = (string)(getenv('SMTP_DIAG_TOKEN') ?: '');
$provided = (string)($input['token'] ?? ($_GET['token'] ?? ''));
if ($token !== '' && !hash_equals($token, $provided)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Token inválido']);
    exit;
}

$config = require __DIR__ . '/config.php';
$mail = $config['mail'] ?? [];

$host = trim((string)($mail['host'] ?? ''));
$port = (int)($mail['port'] ?? 587);
$user = trim((string)($mail['user'] ?? ''));
$pass = (string)($mail['pass'] ?? '');
$from = trim((string)($mail['from'] ?? ''));
$secure = strtolower(trim((string)($mail['secure'] ?? 'tls')));
$timeout = (int)($mail['timeout'] ?? 10);

$result = [
    'ok' => false,
    'config' => [
        'host' => $host,
        'port' => $port,
        'secure' => $secure,
        'user' => mask_value($user),
        'from' => mask_value($from),
        'timeout' => $timeout,
        'pass_length' => strlen($pass),
    ],
    'steps' => [],
];

try {
    if ($host === '' || $port <= 0) {
        throw new RuntimeException('SMTP não configurado');
    }

    $transport = ($secure === 'ssl') ? 'ssl' : 'tcp';
    $address = sprintf('%s://%s:%d', $transport, $host, $port);
    $errno = 0;
    $errstr = '';

    $step = 'connect';
    $socket = @stream_socket_client($address, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT);
    if (!$socket) {
        throw new RuntimeException('Falha ao conectar: ' . ($errstr ?: 'erro desconhecido'));
    }
    stream_set_timeout($socket, $timeout);
    $result['steps'][] = ['step' => $step, 'ok' => true];

    $step = 'greeting';
    $greeting = diag_read($socket);
    $result['steps'][] = ['step' => $step, 'ok' => true, 'code' => smtp_code($greeting)];

    $step = 'ehlo';
    $ehlo = diag_cmd($socket, 'EHLO localhost', ['250']);
    $result['steps'][] = [
        'step' => $step,
        'ok' => true,
        'code' => $ehlo['code'],
        'starttls' => stripos($ehlo['response'], 'STARTTLS') !== false,
    ];

    if ($secure === 'tls' || $secure === 'starttls') {
        if (stripos($ehlo['response'], 'STARTTLS') === false) {
            throw new RuntimeException('Servidor não oferece STARTTLS');
        }
        $step = 'starttls';
        $starttls = diag_cmd($socket, 'STARTTLS', ['220']);
        $result['steps'][] = ['step' => $step, 'ok' => true, 'code' => $starttls['code']];

        $crypto = @stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        if ($crypto !== true) {
            throw new RuntimeException('Falha ao iniciar TLS');
        }

        $step = 'ehlo_tls';
        $ehlo2 = diag_cmd($socket, 'EHLO localhost', ['250']);
        $result['steps'][] = ['step' => $step, 'ok' => true, 'code' => $ehlo2['code']];
    }

    if ($user === '' || $pass === '') {
        throw new RuntimeException('Usuário/senha vazios');
    }

    $step = 'auth_login';
    $auth1 = diag_cmd($socket, 'AUTH LOGIN', ['334'], 'AUTH LOGIN');
    $result['steps'][] = ['step' => $step, 'ok' => true, 'code' => $auth1['code']];

    $step = 'auth_user';
    $auth2 = diag_cmd($socket, base64_encode($user), ['334'], 'AUTH USER');
    $result['steps'][] = ['step' => $step, 'ok' => true, 'code' => $auth2['code']];

    $step = 'auth_pass';
    $auth3 = diag_cmd($socket, base64_encode($pass), ['235'], 'AUTH PASS');
    $result['steps'][] = ['step' => $step, 'ok' => true, 'code' => $auth3['code']];

    $step = 'quit';
    $quit = diag_cmd($socket, 'QUIT', ['221', '250']);
    $result['steps'][] = ['step' => $step, 'ok' => true, 'code' => $quit['code']];

    fclose($socket);
    $result['ok'] = true;
} catch (Throwable $e) {
    $result['error'] = $e->getMessage();
}

echo json_encode($result);

function diag_cmd($socket, string $command, array $expectCodes, string $context = ''): array
{
    fwrite($socket, $command . "\r\n");
    $resp = diag_read($socket);
    $code = smtp_code($resp);
    if (!in_array($code, $expectCodes, true)) {
        $label = $context !== '' ? $context : $command;
        throw new RuntimeException('Erro SMTP em ' . $label . ': ' . trim($resp));
    }
    return ['code' => $code, 'response' => $resp];
}

function diag_read($socket): string
{
    $data = '';
    while (!feof($socket)) {
        $line = fgets($socket, 515);
        if ($line === false) {
            break;
        }
        $data .= $line;
        if (preg_match('/^\d{3} /', $line)) {
            break;
        }
    }
    return $data;
}

function smtp_code(string $response): string
{
    return substr(trim($response), 0, 3);
}

function mask_value(string $value): string
{
    if ($value === '') {
        return '';
    }
    $len = strlen($value);
    if ($len <= 4) {
        return str_repeat('*', $len);
    }
    return substr($value, 0, 2) . str_repeat('*', $len - 4) . substr($value, -2);
}
