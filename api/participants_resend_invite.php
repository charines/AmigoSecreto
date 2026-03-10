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

// Verify participant ownership via group
$stmt = $pdo->prepare('
    SELECT p.*, g.title as group_title, g.description as group_description, g.draw_date as group_draw_date, g.admin_id
    FROM participants p
    JOIN `groups` g ON p.group_id = g.id
    WHERE p.id = ? AND g.admin_id = ?
    LIMIT 1
');
$stmt->execute([$participantId, (int)$admin['id']]);
$row = $stmt->fetch();

if (!$row) {
    json_response(['ok' => false, 'error' => 'Participante nao encontrado ou sem permissao'], 404);
}

if ($row['status'] === 'token_sent' || $row['status'] === 'revealed') {
    json_response(['ok' => false, 'error' => 'Nao e possivel reenviar convite para um participante que ja recebeu o token do sorteio ou ja o revelou.'], 400);
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

$inviteLink = $baseUrl . '/invite?token=' . urlencode($row['invite_token']);
$subject = 'DHARMA INITIATIVE: Re-transmissao de Protocolo Amigo Secreto [' . $row['group_title'] . ']';
$bodyLines = [
    'DHARMA INITIATIVE - STATION 3: THE SWAN',
    'SYSTEM_STATUS: WARNING - PENDING_INVITATION',
    'RE-TRANSMISSION_STATUS: ACTIVE',
    '---------------------------------------',
    '',
    'INVITATION_PROTOCOL: ' . strtoupper($row['name']),
    'ASSIGNED_GROUP: ' . strtoupper($row['group_title']),
    'PROJECT_OVERVIEW: ' . ($row['group_description'] ? strtoupper($row['group_description']) : 'N/A'),
    'EVENT_TIMELINE: ' . ($row['group_draw_date'] ? $row['group_draw_date'] : 'PENDING'),
    '',
    '---------------------------------------',
    '',
    'ESTE E UM REENVIO DO PROTOCOLO DE CONVITE PARA O PROJETO AMIGO SECRETO.',
    'SUA CONFIRMACAO E CRITICA PARA O SUCESSO DA OPERACAO.',
    '',
    'ACESSE O TERMINAL IMEDIATAMENTE:',
    $inviteLink,
    '',
    '---------------------------------------',
    'AVISO: OS NUMEROS DEVEM SER RESPEITADOS.',
    '4 8 15 16 23 42',
    '',
    'NAMASTE.',
];

try {
    $mailConfig = $config['mail'] ?? [];
    $imapConfig = $config['imap'] ?? [];
    send_smtp_mail($mailConfig, $row['email'], $subject, implode("\n", $bodyLines), $imapConfig);

    // Update invite_sent_at to now
    $stmtUpdate = $pdo->prepare('UPDATE participants SET invite_sent_at = NOW() WHERE id = ?');
    $stmtUpdate->execute([$row['id']]);

    json_response(['ok' => true]);
}
catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'Erro ao enviar e-mail: ' . $e->getMessage()], 500);
}