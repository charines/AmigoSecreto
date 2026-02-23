<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$input = json_input();
$token = trim((string)($input['token'] ?? ''));
if ($token === '') {
    json_response(['ok' => false, 'error' => 'Token invalido'], 400);
}

$pdo = db();
$stmt = $pdo->prepare(
    'SELECT p.id, p.status, g.status AS group_status ' .
    'FROM participants p INNER JOIN `groups` g ON g.id = p.group_id WHERE p.invite_token = ? LIMIT 1'
);
$stmt->execute([$token]);
$row = $stmt->fetch();
if (!$row) {
    json_response(['ok' => false, 'error' => 'Convite nao encontrado'], 404);
}
if (($row['group_status'] ?? '') !== 'open') {
    json_response(['ok' => false, 'error' => 'Grupo nao esta aberto'], 400);
}

if (($row['status'] ?? '') !== 'confirmed') {
    $stmt = $pdo->prepare("UPDATE participants SET status = 'confirmed', confirmed_at = ? WHERE id = ?");
    $stmt->execute([date('Y-m-d H:i:s'), (int)$row['id']]);
}

json_response(['ok' => true]);
