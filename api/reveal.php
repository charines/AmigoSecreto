<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$token = trim((string)($_GET['token'] ?? ''));
if ($token === '') {
    json_response(['ok' => false, 'error' => 'Token invalido'], 400);
}

$pdo = db();
$stmt = $pdo->prepare(
    'SELECT p.id, p.name, p.status, g.title, g.status AS group_status, ' .
    'dr.encrypted_payload, dr.iv_b64 ' .
    'FROM participants p ' .
    'INNER JOIN `groups` g ON g.id = p.group_id ' .
    'INNER JOIN draw_results dr ON dr.giver_id = p.id ' .
    'WHERE p.reveal_token = ? LIMIT 1'
);
$stmt->execute([$token]);
$row = $stmt->fetch();
if (!$row) {
    json_response(['ok' => false, 'error' => 'Link invalido'], 404);
}
if (($row['group_status'] ?? '') !== 'drawn') {
    json_response(['ok' => false, 'error' => 'Sorteio ainda nao foi concluido'], 400);
}

json_response([
    'ok' => true,
    'giver' => [
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'status' => $row['status'],
    ],
    'group' => [
        'title' => $row['title'],
        'status' => $row['group_status'],
    ],
    'payload' => [
        'encrypted' => $row['encrypted_payload'],
        'iv_b64' => $row['iv_b64'],
    ],
]);
