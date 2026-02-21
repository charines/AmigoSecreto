<?php
declare(strict_types=1);

require __DIR__ . '/cors.php';

$raw = file_get_contents('php://input');
$input = json_decode($raw ?: '', true);

if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Payload inválido']);
    exit;
}

$owner = trim((string)($input['owner_email'] ?? ''));
$participants = $input['participants'] ?? null;

if ($owner === '' || !filter_var($owner, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'E-mail inválido']);
    exit;
}

if (!is_array($participants) || count($participants) < 2) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Participantes insuficientes']);
    exit;
}

$pdo = require __DIR__ . '/db.php';

try {
    $pdo->beginTransaction();

    $stmtGroup = $pdo->prepare('INSERT INTO `groups` (`owner_email`, `status`) VALUES (?, ?)');
    $stmtGroup->execute([$owner, 'active']);
    $groupId = (int)$pdo->lastInsertId();

    $stmtPart = $pdo->prepare(
        'INSERT INTO `participants` (`group_id`, `name`, `secret_friend_name`, `viewed`) VALUES (?, ?, ?, 0)'
    );

    $result = [];
    foreach ($participants as $p) {
        $name = trim((string)($p['name'] ?? ''));
        $secret = trim((string)($p['secret_friend_name'] ?? ''));

        if ($name === '' || $secret === '') {
            throw new RuntimeException('Participante inválido');
        }

        $stmtPart->execute([$groupId, $name, $secret]);
        $id = (int)$pdo->lastInsertId();
        $result[] = ['id' => $id, 'name' => $name];
    }

    $pdo->commit();

    echo json_encode([
        'ok' => true,
        'group_id' => $groupId,
        'participants' => $result,
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Erro no servidor']);
}
