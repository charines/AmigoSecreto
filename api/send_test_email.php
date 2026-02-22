<?php
declare(strict_types=1);

require __DIR__ . '/cors.php';
require __DIR__ . '/mailer.php';

$raw = file_get_contents('php://input');
$input = json_decode($raw ?: '', true);

if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Payload inválido']);
    exit;
}

$to = trim((string)($input['to'] ?? ''));
$subject = trim((string)($input['subject'] ?? 'Teste de e-mail'));
$message = trim((string)($input['message'] ?? 'Mensagem de teste do Amigo Secreto.'));

if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'E-mail de destino inválido']);
    exit;
}

if ($subject === '' || $message === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Assunto e mensagem são obrigatórios']);
    exit;
}

$config = require __DIR__ . '/config.php';
$mailConfig = $config['mail'] ?? [];

try {
    send_smtp_mail($mailConfig, $to, $subject, $message);
    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
