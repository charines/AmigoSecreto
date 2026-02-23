<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$token = trim((string)($_GET['token'] ?? ''));
if ($token === '') {
    json_response(['ok' => false, 'error' => 'Token invalido'], 400);
}

$pdo = db();
$stmt = $pdo->prepare(
    'SELECT p.id, p.name, p.email, p.status, g.title, g.description, g.status AS group_status ' .
    'FROM participants p INNER JOIN `groups` g ON g.id = p.group_id WHERE p.invite_token = ? LIMIT 1'
);
$stmt->execute([$token]);
$row = $stmt->fetch();
if (!$row) {
    json_response(['ok' => false, 'error' => 'Convite nao encontrado'], 404);
}
if (($row['group_status'] ?? '') === 'cancelled') {
    json_response(['ok' => false, 'error' => 'Grupo cancelado'], 400);
}

if (($row['status'] ?? '') === 'invited') {
    $stmt = $pdo->prepare("UPDATE participants SET status = 'link_clicked', invite_clicked_at = ? WHERE id = ?");
    $stmt->execute([date('Y-m-d H:i:s'), (int)$row['id']]);
    $row['status'] = 'link_clicked';
}

json_response([
    'ok' => true,
    'participant' => [
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'email' => $row['email'],
        'status' => $row['status'],
    ],
    'group' => [
        'title' => $row['title'],
        'description' => $row['description'],
        'status' => $row['group_status'],
    ],
]);
