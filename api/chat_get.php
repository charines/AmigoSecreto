<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$token = trim((string)($_GET['token'] ?? ''));
if ($token === '') {
    json_response(['ok' => false, 'error' => 'Token invalido'], 400);
}

$pdo = db();
$stmt = $pdo->prepare('SELECT id, group_id FROM participants WHERE reveal_token = ? LIMIT 1');
$stmt->execute([$token]);
$participant = $stmt->fetch();
if (!$participant) {
    json_response(['ok' => false, 'error' => 'Participante nao encontrado'], 404);
}

$participantId = (int)$participant['id'];

// Get 'amigo' chat (where participant is giver)
$stmtAmigo = $pdo->prepare('SELECT id FROM draw_results WHERE giver_id = ? LIMIT 1');
$stmtAmigo->execute([$participantId]);
$drawAmigo = $stmtAmigo->fetch();

$amigoMsgs = [];
if ($drawAmigo) {
    $drawIdAmigo = (int)$drawAmigo['id'];
    $stmtMsgs = $pdo->prepare('SELECT id, sender_role, texto, created_at FROM chat_messages WHERE draw_id = ? ORDER BY id ASC');
    $stmtMsgs->execute([$drawIdAmigo]);
    $amigoMsgs = $stmtMsgs->fetchAll();
}

// Get 'admirador' chat (where participant is receiver)
$stmtAdmirador = $pdo->prepare('SELECT id FROM draw_results WHERE receiver_id = ? LIMIT 1');
$stmtAdmirador->execute([$participantId]);
$drawAdmirador = $stmtAdmirador->fetch();

$admiradorMsgs = [];
if ($drawAdmirador) {
    $drawIdAdmirador = (int)$drawAdmirador['id'];
    $stmtMsgs = $pdo->prepare('SELECT id, sender_role, texto, created_at FROM chat_messages WHERE draw_id = ? ORDER BY id ASC');
    $stmtMsgs->execute([$drawIdAdmirador]);
    $admiradorMsgs = $stmtMsgs->fetchAll();
}

// Formatar mensagens para o frontend
$formatted = [
    'amigo' => [],
    'admirador' => [],
];

$formatted['amigo'][] = [
    'id' => 0,
    'role' => 'Sistema',
    'texto' => 'Conexão criptografada estabelecida com o seu Amigo Secreto.',
    'timestamp' => date('c'),
];

foreach ($amigoMsgs as $msg) {
    $role = ($msg['sender_role'] === 'giver') ? 'Você' : 'Meu Amigo Secreto';
    $formatted['amigo'][] = [
        'id' => (int)$msg['id'],
        'role' => $role,
        'texto' => $msg['texto'],
        'timestamp' => date('c', strtotime($msg['created_at'])),
    ];
}

$formatted['admirador'][] = [
    'id' => 0,
    'role' => 'Sistema',
    'texto' => 'Conexão criptografada estabelecida com o seu Admirador Secreto.',
    'timestamp' => date('c'),
];

foreach ($admiradorMsgs as $msg) {
    $role = ($msg['sender_role'] === 'receiver') ? 'Você' : 'Meu Admirador Secreto';
    $formatted['admirador'][] = [
        'id' => (int)$msg['id'],
        'role' => $role,
        'texto' => $msg['texto'],
        'timestamp' => date('c', strtotime($msg['created_at'])),
    ];
}

json_response([
    'ok' => true,
    'messages' => $formatted,
]);
