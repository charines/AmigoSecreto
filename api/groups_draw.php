<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/mailer.php';

if (!function_exists('openssl_encrypt')) {
    json_response(['ok' => false, 'error' => 'Extensao OpenSSL indisponivel'], 500);
}

function encrypt_name(string $name, string $token): array
{
    $key = hash('sha256', $token, true);
    $iv = random_bytes(12);
    $tag = '';
    $ciphertext = openssl_encrypt($name, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
    if ($ciphertext === false) {
        throw new RuntimeException('Falha ao criptografar');
    }
    $payload = $ciphertext . $tag;
    return [
        'payload_b64' => base64_encode($payload),
        'iv_b64' => base64_encode($iv),
    ];
}

$admin = require_admin();
$input = json_input();

$groupId = (int)($input['group_id'] ?? 0);
if ($groupId <= 0) {
    json_response(['ok' => false, 'error' => 'Grupo invalido'], 400);
}

$pdo = db();
$stmt = $pdo->prepare(
    'SELECT id, title, status FROM `groups` WHERE id = ? AND admin_id = ? LIMIT 1'
);
$stmt->execute([$groupId, (int)$admin['id']]);
$group = $stmt->fetch();
if (!$group) {
    json_response(['ok' => false, 'error' => 'Grupo nao encontrado'], 404);
}
if (($group['status'] ?? '') !== 'open') {
    json_response(['ok' => false, 'error' => 'Grupo nao esta aberto'], 400);
}

$stmt = $pdo->prepare(
    "SELECT id, name, email FROM participants WHERE group_id = ? AND status = 'confirmed' ORDER BY id ASC"
);
$stmt->execute([$groupId]);
$participants = $stmt->fetchAll();
if (count($participants) < 2) {
    json_response(['ok' => false, 'error' => 'Minimo de 2 participantes confirmados'], 400);
}

$shuffled = $participants;
shuffle($shuffled);

$assignments = [];
$total = count($shuffled);
for ($i = 0; $i < $total; $i++) {
    $giver = $shuffled[$i];
    $receiver = $shuffled[($i + 1) % $total];
    $assignments[] = ['giver' => $giver, 'receiver' => $receiver];
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

$results = [];
$pdo->beginTransaction();
try {
    $stmtInsert = $pdo->prepare(
        'INSERT INTO draw_results (group_id, giver_id, encrypted_payload, iv_b64, token_hash, token_raw) VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmtUpdate = $pdo->prepare(
        'UPDATE participants SET reveal_token = ? WHERE id = ?'
    );

    foreach ($assignments as $pair) {
        $giver = $pair['giver'];
        $receiver = $pair['receiver'];
        $token = random_token(24);
        $revealToken = random_token(24);
        $enc = encrypt_name((string)$receiver['name'], $token);
        $stmtInsert->execute([
            $groupId,
            (int)$giver['id'],
            $enc['payload_b64'],
            $enc['iv_b64'],
            hash('sha256', $token),
            $token,
        ]);
        $stmtUpdate->execute([$revealToken, (int)$giver['id']]);
        $results[] = [
            'participant_id' => (int)$giver['id'],
            'name' => $giver['name'],
            'email' => $giver['email'],
            'reveal_token' => $revealToken,
            'token' => $token,
        ];
    }

    $stmtGroup = $pdo->prepare('UPDATE `groups` SET status = ? WHERE id = ?');
    $stmtGroup->execute(['drawn', $groupId]);

    $pdo->commit();
}
catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_response(['ok' => false, 'error' => 'Erro ao executar sorteio'], 500);
}

$mailConfig = $config['mail'] ?? [];
$imapConfig = $config['imap'] ?? [];
$sent = [];
$failed = [];
$now = date('Y-m-d H:i:s');

foreach ($results as $row) {
    $revealLink = $baseUrl . '/reveal?token=' . urlencode($row['reveal_token']) . '&code=' . urlencode($row['token']);
    $subject = 'DHARMA INITIATIVE: Amigo Secreto Calculado [' . $group['title'] . ']';
    $bodyLines = [
        'DHARMA INITIATIVE - STATION 3: THE SWAN',
        'SYSTEM_STATUS: EXECUTION_COMPLETE',
        'DATA_DECRYPTION_REQUIRED: TRUE',
        '---------------------------------------',
        '',
        'RECIPIENT_ID: ' . strtoupper($row['name']),
        'ASSIGNMENT_STATUS: ENCRYPTED',
        'SECURITY_CODE: 4 8 15 16 23 42',
        '',
        '---------------------------------------',
        '',
        'O SORTEIO DO GRUPO "' . strtoupper($group['title']) . '" FOI FINALIZADO.',
        'SOUBEMOS QUE VOCE FOI ESCOLHIDO PARA UMA MISSAO IMPORTANTE.',
        '',
        'ACESSE O LINK DE REVELACAO E INSIRA O CODIGO ABAIXO:',
        $revealLink,
        '',
        'CODIGO_DE_ACESSO_UNICO:',
        $row['token'],
        '',
        '---------------------------------------',
        'AVISO: ESTA MENSAGEM SE AUTO-DESTRUIRA (NAO REALMENTE).',
        'APRECIE O MOMENTO. EXECUTE O PROTOCOLO.',
        '',
        '4 8 15 16 23 42',
        'NAMASTE.',
    ];

    try {
        send_smtp_mail($mailConfig, $row['email'], $subject, implode("\n", $bodyLines), $imapConfig);
        $sent[] = $row['email'];
        $stmt = $pdo->prepare(
            "UPDATE participants SET status = 'token_sent', token_sent_at = ? WHERE id = ?"
        );
        $stmt->execute([$now, (int)$row['participant_id']]);
    }
    catch (Throwable $e) {
        $failed[] = ['email' => $row['email'], 'error' => $e->getMessage()];
    }
}

json_response([
    'ok' => true,
    'sent' => $sent,
    'failed' => $failed,
]);