<?php
declare(strict_types=1);

require __DIR__ . '/cors.php';

$id = $_GET['id'] ?? '';
if (!is_string($id) || $id === '' || !ctype_digit($id)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'ID inválido']);
    exit;
}

$pdo = require __DIR__ . '/db.php';

$stmt = $pdo->prepare(
    'SELECT p.name, p.secret_friend_name, g.status '
    . 'FROM participants p '
    . 'INNER JOIN `groups` g ON g.id = p.group_id '
    . 'WHERE p.id = ? LIMIT 1'
);
$stmt->execute([(int)$id]);
$row = $stmt->fetch();

if (!$row) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Não encontrado']);
    exit;
}

if (($row['status'] ?? '') !== 'active') {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Sorteio inativo']);
    exit;
}

$upd = $pdo->prepare('UPDATE participants SET viewed = 1 WHERE id = ?');
$upd->execute([(int)$id]);

echo json_encode([
    'ok' => true,
    'from' => $row['name'],
    'to' => $row['secret_friend_name'],
]);
