<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/mailer.php';

$admin = require_admin();
$input = json_input();

$participantId = (int)($input['participant_id'] ?? 0);

if ($participantId <= 0) {
    json_response(['ok' => false, 'error' => 'Participante invalido'], 400);
}

$pdo = db();

// Verify participant ownership via group and fetch draw info
$stmt = $pdo->prepare('
    SELECT p.*, g.title as group_title, g.admin_id, dr.token_raw
    FROM participants p
    JOIN `groups` g ON p.group_id = g.id
    JOIN draw_results dr ON p.id = dr.giver_id
    WHERE p.id = ? AND g.admin_id = ?
    LIMIT 1
');
$stmt->execute([$participantId, (int)$admin['id']]);
$row = $stmt->fetch();

if (!$row) {
    json_response(['ok' => false, 'error' => 'Participante nao encontrado, sem permissao ou sorteio ainda nao realizado.'], 404);
}

if (!$row['token_raw']) {
    json_response(['ok' => false, 'error' => 'Nao e possivel reenviar o sorteio para este participante (token nao armazenado).'], 400);
}

$config = require __DIR__ . '/config.php';
$baseUrl = $config['app']['base_url'] ?? '';
if ($baseUrl === '') {
    $host = $_SERVER['HTTP_HOST'] ?? '';
    if ($host !== '') {
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $baseUrl = $scheme . '://' . $host;
    }
}
if ($baseUrl === '') {
    json_response(['ok' => false, 'error' => 'APP_BASE_URL nao configurado'], 500);
}

$revealLink = $baseUrl . '/reveal?token=' . urlencode($row['reveal_token']) . '&code=' . urlencode($row['token_raw']);
$subject = 'DHARMA INITIATIVE: Re-transmissao de Chave de Decriptacao [' . $row['group_title'] . ']';
$bodyLines = [
    'DHARMA INITIATIVE - STATION 3: THE SWAN',
    'SYSTEM_STATUS: ALERT - DATA_RECOVERY',
    'ENCRYPTION_RECOVERY: IN_PROGRESS',
    '---------------------------------------',
    '',
    'RECIPIENT_ID: ' . strtoupper($row['name']),
    'ASSIGNMENT_STATUS: WAITING_FOR_REVELATION',
    '',
    '---------------------------------------',
    '',
    'ESTE E UM REENVIO DA CHAVE DE DECRIPTACAO PARA O SEU AMIGO SECRETO NO GRUPO "' . strtoupper($row['group_title']) . '".',
    '',
    'ABRA O TERMINAL DE REVELACAO:',
    $revealLink,
    '',
    'CODIGO_DE_DECRIPTACAO_RECUPERADO:',
    $row['token_raw'],
    '',
    '---------------------------------------',
    '4 8 15 16 23 42',
    'NAMASTE.',
];

try {
    $mailConfig = $config['mail'] ?? [];
    $imapConfig = $config['imap'] ?? [];
    send_smtp_mail($mailConfig, $row['email'], $subject, implode("\n", $bodyLines), $imapConfig);

    // Update token_sent_at to now
    $stmtUpdate = $pdo->prepare('UPDATE participants SET token_sent_at = NOW() WHERE id = ?');
    $stmtUpdate->execute([$row['id']]);

    json_response(['ok' => true]);
}
catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'Erro ao enviar e-mail: ' . $e->getMessage()], 500);
}