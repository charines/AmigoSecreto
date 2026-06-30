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
    $subject = '🎁 [PROJETO AMIGO SECRETO] Você foi selecionado para uma nova iniciativa!';
    $bodyLines = [
        'Olá, sobrevivente do dia a dia!',
        '',
        'Chegou aquela época do ano. Fomos convocados para fazer parte de um experimento social altamente confidencial: o Amigo Secreto.',
        '',
        'Sua missão, caso decida aceitá-la, é participar dessa dinâmica para fortalecer os laços da nossa própria "estação". Não se preocupe, nenhum avião caiu e ninguém vai precisar carregar pedras na ilha, é apenas uma brincadeira saudável! 😉',
        '',
        '📋 Detalhes do Protocolo:',
        '    O Projeto: ' . $group['title'],
        '    Status do Sistema: Ativo e aguardando sua confirmação.',
        '    Fase Atual: ' . ($group['description'] ?: 'Testando data e hora do sistema.'),
        '',
        '🔑 Instruções para Confirmação:',
        'Para garantir que o seu nome entre na urna eletrônica e o sistema não entre em colapso, clique no link seguro abaixo para confirmar sua participação:',
        '',
        '🔗 ACESSE O TERMINAL AQUI PARA CONFIRMAR',
        $inviteLink,
        '',
        '    ⚠️ AVISO DO SISTEMA (CÓDIGO DE ACESSO: 4 8 15 16 23 42)',
        '    Por favor, confirme o quanto antes. Não queremos que o contador chegue a zero e o alarme comece a tocar, certo? Mantenha a ordem do protocolo.',
        '',
        'Agradecemos a sua colaboração cientifica para o sucesso deste projeto.',
        '',
        'Namaste.'
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