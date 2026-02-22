<?php
declare(strict_types=1);

function send_smtp_mail(array $config, string $to, string $subject, string $body): void
{
    $host = trim((string)($config['host'] ?? ''));
    $port = (int)($config['port'] ?? 587);
    $user = trim((string)($config['user'] ?? ''));
    $pass = (string)($config['pass'] ?? '');
    $from = trim((string)($config['from'] ?? ''));
    $fromName = trim((string)($config['from_name'] ?? ''));
    $secure = strtolower(trim((string)($config['secure'] ?? 'tls')));
    $timeout = (int)($config['timeout'] ?? 10);

    if ($host === '' || $from === '' || $user === '' || $pass === '') {
        throw new RuntimeException('SMTP não configurado');
    }
    if (!filter_var($from, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException('E-mail de origem inválido');
    }
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException('E-mail de destino inválido');
    }

    $transport = ($secure === 'ssl') ? 'ssl' : 'tcp';
    $address = sprintf('%s://%s:%d', $transport, $host, $port);
    $errno = 0;
    $errstr = '';

    $socket = @stream_socket_client($address, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT);
    if (!$socket) {
        throw new RuntimeException('Falha ao conectar no SMTP: ' . ($errstr ?: 'erro desconhecido'));
    }
    stream_set_timeout($socket, $timeout);

    $greeting = smtp_read($socket);
    smtp_expect($greeting, ['220'], 'Conexão SMTP');

    $ehloHost = 'localhost';
    $ehloResp = smtp_cmd($socket, 'EHLO ' . $ehloHost, ['250']);

    if ($secure === 'tls' || $secure === 'starttls') {
        if (stripos($ehloResp, 'STARTTLS') === false) {
            throw new RuntimeException('Servidor SMTP não suporta STARTTLS');
        }
        smtp_cmd($socket, 'STARTTLS', ['220']);
        $crypto = @stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        if ($crypto !== true) {
            throw new RuntimeException('Falha ao iniciar TLS');
        }
        $ehloResp = smtp_cmd($socket, 'EHLO ' . $ehloHost, ['250']);
    }

    smtp_cmd($socket, 'AUTH LOGIN', ['334'], 'AUTH LOGIN');
    smtp_cmd($socket, base64_encode($user), ['334'], 'AUTH USER');
    smtp_cmd($socket, base64_encode($pass), ['235'], 'AUTH PASS');

    smtp_cmd($socket, 'MAIL FROM:<' . $from . '>', ['250']);
    smtp_cmd($socket, 'RCPT TO:<' . $to . '>', ['250', '251']);
    smtp_cmd($socket, 'DATA', ['354']);

    $headers = [
        'Date: ' . gmdate('D, d M Y H:i:s O'),
        'From: ' . format_address($from, $fromName),
        'To: ' . format_address($to, ''),
        'Subject: ' . encode_header($subject),
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
    ];

    $data = implode("\r\n", $headers) . "\r\n\r\n" . normalize_body($body) . "\r\n";
    $data = dot_stuff($data);

    fwrite($socket, $data . "\r\n.\r\n");
    $dataResp = smtp_read($socket);
    smtp_expect($dataResp, ['250'], 'Envio SMTP');

    smtp_cmd($socket, 'QUIT', ['221', '250']);
    fclose($socket);
}

function smtp_cmd($socket, string $command, array $expectCodes, string $context = ''): string
{
    fwrite($socket, $command . "\r\n");
    $resp = smtp_read($socket);
    smtp_expect($resp, $expectCodes, $context !== '' ? $context : $command);
    return $resp;
}

function smtp_read($socket): string
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

function smtp_expect(string $response, array $expectCodes, string $context): void
{
    $code = substr($response, 0, 3);
    if (!in_array($code, $expectCodes, true)) {
        throw new RuntimeException('Erro SMTP em ' . $context . ': ' . trim($response));
    }
}

function encode_header(string $value): string
{
    if ($value === '') {
        return '';
    }
    if (function_exists('mb_encode_mimeheader')) {
        return mb_encode_mimeheader($value, 'UTF-8', 'B', "\r\n");
    }
    return '=?UTF-8?B?' . base64_encode($value) . '?=';
}

function format_address(string $email, string $name): string
{
    if ($name === '') {
        return '<' . $email . '>';
    }
    return encode_header($name) . ' <' . $email . '>';
}

function normalize_body(string $body): string
{
    $body = str_replace(["\r\n", "\r"], "\n", $body);
    return str_replace("\n", "\r\n", $body);
}

function dot_stuff(string $data): string
{
    return preg_replace('/^\./m', '..', $data);
}
