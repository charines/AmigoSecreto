<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/mailer.php';

$admin = require_admin();
$input = json_input();

$groupId = (int)($input['group_id'] ?? 0);
$participants = $input['participants'] ?? null;

if ($groupId <= 0 || !is_array($participants) || $participants === []) {
    json_response(['ok' => false, 'error' => 'Dados invalidos'], 400);
}

$pdo = db();
$stmt = $pdo->prepare(
    'SELECT id, title, description, draw_date, budget_limit, status FROM `groups` WHERE id = ? AND admin_id = ? LIMIT 1'
);
$stmt->execute([$groupId, (int)$admin['id']]);
$group = $stmt->fetch();
if (!$group) {
    json_response(['ok' => false, 'error' => 'Grupo nao encontrado'], 404);
}
if (($group['status'] ?? '') !== 'open') {
    json_response(['ok' => false, 'error' => 'Grupo nao esta aberto'], 400);
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

$now = date('Y-m-d H:i:s');
$created = [];

$pdo->beginTransaction();
try {
    $stmtInsert = $pdo->prepare(
        'INSERT INTO participants (group_id, name, email, status, invite_token, invite_sent_at) VALUES (?, ?, ?, ?, ?, ?)'
    );

    foreach ($participants as $p) {
        $name = trim((string)($p['name'] ?? ''));
        $email = trim((string)($p['email'] ?? ''));
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Participante invalido');
        }
        $inviteToken = random_token(24);
        $stmtInsert->execute([$groupId, $name, $email, 'invited', $inviteToken, null]);
        $created[] = [
            'id' => (int)$pdo->lastInsertId(),
            'name' => $name,
            'email' => $email,
            'invite_token' => $inviteToken,
        ];
    }

    $pdo->commit();
}
catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_response(['ok' => false, 'error' => 'Erro ao salvar participantes'], 500);
}

$mailConfig = $config['mail'] ?? [];
$imapConfig = $config['imap'] ?? [];

$sent = [];
$failed = [];

foreach ($created as $p) {
    $inviteLink = $baseUrl . '/invite?token=' . urlencode($p['invite_token']);
    $subject = 'DHARMA INITIATIVE: Convite para Amigo Secreto [' . $group['title'] . ']';
    $bodyLines = [
        'DHARMA INITIATIVE - STATION 3: THE SWAN',
        'SYSTEM_STATUS: ACTIVE',
        'ENCRYPTION_LEVEL: 256-BIT',
        '---------------------------------------',
        '',
        'INVITATION_PROTOCOL: ' . strtoupper($p['name']),
        'ASSIGNED_GROUP: ' . strtoupper($group['title']),
        'SYSTEM_ACCESS_CODE: 4 8 15 16 23 42',
        '',
        '---------------------------------------',
        '',
        'VOCE FOI SELECIONADO PARA PARTICIPAR DO PROJETO AMIGO SECRETO.',
        'A CONFIRMACAO E OBRIGATORIA PARA A MANUTENCAO DO PROTOCOLO.',
        '',
        'ACESSE O TERMINAL ABAIXO PARA CONFIRMAR:',
        $inviteLink,
        '',
        '---------------------------------------',
        'AVISO: NAO PERMITA QUE O CONTADOR CHEGUE A ZERO.',
        'OS NUMEROS DEVEM SER RESPEITADOS: 4 8 15 16 23 42',
        '',
        'NAMASTE.',
    ];

    try {
        send_smtp_mail($mailConfig, $p['email'], $subject, implode("\n", $bodyLines), $imapConfig);
        $sent[] = $p['email'];

        $stmt = $pdo->prepare('UPDATE participants SET invite_sent_at = ? WHERE id = ?');
        $stmt->execute([$now, $p['id']]);
    }
    catch (Throwable $e) {
        $failed[] = ['email' => $p['email'], 'error' => $e->getMessage()];
    }
}

json_response([
    'ok' => true,
    'sent' => $sent,
    'failed' => $failed,
]);