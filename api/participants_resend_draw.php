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
    SELECT p.*, g.title as group_title, g.description as group_description, g.draw_date as group_draw_date, g.admin_id, dr.token_raw
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
$subject = '🎁 [PROJETO AMIGO SECRETO] Reenvio da sua chave de acesso! ' . $row['group_title'];
$bodyLines = [
    'Olá, sobrevivente do dia a dia!',
    '',
    'Parece que a sua chave de acesso ao Amigo Secreto se perdeu no espaço-tempo, mas a nossa equipe de comunicações conseguiu recuperar o seu acesso ao terminal!',
    '',
    'Não se preocupe, nenhum avião caiu e ninguém vai precisar carregar pedras na ilha, isso é apenas o reenvio do seu par do Amigo Secreto para o grupo "' . $row['group_title'] . '". 😉',
    '',
    '📋 Detalhes do Protocolo:',
    '    Participante Selecionado: ' . $row['name'],
    '    Grupo Atual: ' . $row['group_title'],
    '    Descrição do Projeto: ' . ($row['group_description'] ?: 'N/A'),
    '    Linha do Tempo (Data do Evento): ' . ($row['group_draw_date'] ?: 'N/A'),
    '',
    '🔑 Instruções para Visualização:',
    'Para descobrir quem tu tiraste e garantir que o sistema não entre em colapso, clica no link seguro abaixo para aceder ao terminal:',
    '',
    '🔗 ACESSE O TERMINAL AQUI PARA REVELAR',
    $revealLink,
    '',
    'Caso o sistema peça para validar a tua identidade, o teu código de decodificação é:',
    '👉 ' . $row['token_raw'],
    '',
    '    ⚠️ AVISO DO SISTEMA (CÓDIGO DE ACESSO: 4 8 15 16 23 42)',
    '    Por favor, guarda bem este e-mail. Não queremos que o contador chegue a zero e o alarme comece a tocar, certo? Mantenha a ordem do protocolo.',
    '',
    'Agradecemos a tua colaboração científica para o sucesso deste projeto.',
    '',
    'Namaste.'
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