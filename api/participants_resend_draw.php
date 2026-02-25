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
$subject = 'REENVIO: Seu amigo secreto esta pronto (' . $row['group_title'] . ')';
$bodyLines = [
    'Ola ' . $row['name'] . ',',
    '',
    'Este e um reenvio do link para revelar seu amigo secreto sorteado no grupo "' . $row['group_title'] . '".',
    '',
    'Abra o link abaixo:',
    $revealLink,
    '',
    'Codigo secreto caso seja solicitado:',
    $row['token_raw'],
    '',
    'Se voce ja sabe quem e seu amigo secreto, apenas ignore este e e-mail.',
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