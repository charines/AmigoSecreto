<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$input = json_input();
$token = trim((string)($input['token'] ?? ''));
if ($token === '') {
    json_response(['ok' => false, 'error' => 'Token invalido'], 400);
}

$pdo = db();
$stmt = $pdo->prepare('SELECT id, status FROM participants WHERE reveal_token = ? LIMIT 1');
$stmt->execute([$token]);
$row = $stmt->fetch();
if (!$row) {
    json_response(['ok' => false, 'error' => 'Registro nao encontrado'], 404);
}

if (($row['status'] ?? '') !== 'revealed') {
    $stmt = $pdo->prepare("UPDATE participants SET status = 'revealed', revealed_at = ? WHERE id = ?");
    $stmt->execute([date('Y-m-d H:i:s'), (int)$row['id']]);
}

json_response(['ok' => true]);
