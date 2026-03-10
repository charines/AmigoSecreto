<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/mailer.php';

$input = json_input();
$code = trim((string)($input['code'] ?? ''));
$name = trim((string)($input['name'] ?? ''));
$email = trim((string)($input['email'] ?? ''));

if ($code === '' || $name === '' || $email === '') {
    json_response(['ok' => false, 'error' => 'Dados incompletos'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['ok' => false, 'error' => 'E-mail invalido'], 400);
}

$pdo = db();
$stmt = $pdo->prepare('SELECT id, title, description, draw_date, status FROM `groups` WHERE dharma_code = ? LIMIT 1');
$stmt->execute([$code]);
$group = $stmt->fetch();

if (!$group) {
    json_response(['ok' => false, 'error' => 'Grupo nao encontrado'], 404);
}

if ($group['status'] !== 'open') {
    json_response(['ok' => false, 'error' => 'Inscricoes encerradas para este grupo'], 400);
}

$groupId = (int)$group['id'];

// Check if already registered
$stmt = $pdo->prepare('SELECT id FROM participants WHERE group_id = ? AND email = ? LIMIT 1');
$stmt->execute([$groupId, $email]);
if ($stmt->fetch()) {
    json_response(['ok' => false, 'error' => 'Este e-mail ja esta registrado neste grupo'], 400);
}

$inviteToken = random_token(32);
$pdo->beginTransaction();

try {
    $stmt = $pdo->prepare(
        'INSERT INTO participants (group_id, name, email, status, invite_token) VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([$groupId, $name, $email, 'invited', $inviteToken]);
    $participantId = (int)$pdo->lastInsertId();
    
    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_response(['ok' => false, 'error' => 'Erro ao salvar registro'], 500);
}

// Send Email
$config = require __DIR__ . '/config.php';
$baseUrl = $config['app']['base_url'] ?? '';
$mailConfig = $config['mail'] ?? [];
$imapConfig = $config['imap'] ?? [];

$inviteLink = $baseUrl . '/invite?token=' . $inviteToken;
$subject = 'DHARMA INITIATIVE: Protocolo de Ativacao [' . $group['title'] . ']';

$bodyLines = [
    'DHARMA INITIATIVE - STATION 3: THE SWAN',
    'SYSTEM_STATUS: REGISTRATION_RECEIVED',
    'IDENTITY_CONFIRMATION_REQUIRED: TRUE',
    '---------------------------------------',
    '',
    'RECIPIENT_NAME: ' . strtoupper($name),
    'ASSIGNED_GROUP: ' . strtoupper($group['title']),
    '',
    'VOCE FOI SELECIONADO PARA PARTICIPAR DO PROTOCOLO "' . strtoupper($group['title']) . '".',
    '',
    'CONFIRME SUA IDENTIDADE E PARTICIPACAO ACESSANDO O TERMINAL ABAIXO:',
    $inviteLink,
    '',
    '---------------------------------------',
    'AVISO: A FALTA DE CONFIRMAÇÃO PODE COMPROMETER O EXPERIMENTO.',
    '',
    '4 8 15 16 23 42',
    'NAMASTE.',
];

try {
    send_smtp_mail($mailConfig, $email, $subject, implode("\n", $bodyLines), $imapConfig);
    
    $stmt = $pdo->prepare('UPDATE participants SET invite_sent_at = NOW() WHERE id = ?');
    $stmt->execute([$participantId]);
    
    json_response(['ok' => true]);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'Registro salvo, mas erro ao enviar e-mail: ' . $e->getMessage()], 500);
}
