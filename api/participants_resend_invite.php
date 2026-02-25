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
    SELECT p.*, g.title as group_title, g.admin_id
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
$subject = 'REENVIO: Convite para Amigo Secreto: ' . $row['group_title'];
$bodyLines = [
    'Ola ' . $row['name'] . ',',
    '',
    'Este e um reenvio do seu convite para o grupo "' . $row['group_title'] . '".',
    'Para confirmar sua participacao, acesse:',
    $inviteLink,
    '',
    'Se voce ja confirmou, apenas ignore este e-mail.',
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