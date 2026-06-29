<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$input    = json_input();
$rawToken = trim((string)($input['token'] ?? ''));
$password = (string)($input['password'] ?? '');

if ($rawToken === '') {
    json_response(['ok' => false, 'error' => 'Token invalido ou expirado'], 400);
}
if (strlen($password) < 6) {
    json_response(['ok' => false, 'error' => 'Senha deve ter no minimo 6 caracteres'], 400);
}

$tokenHash = hash('sha256', $rawToken);
$pdo       = db();

$stmt = $pdo->prepare(
    'SELECT id FROM admins
     WHERE reset_token_hash = ?
       AND reset_expires > NOW()
     LIMIT 1'
);
$stmt->execute([$tokenHash]);
$admin = $stmt->fetch();

if (!$admin) {
    json_response(['ok' => false, 'error' => 'Token invalido ou expirado'], 400);
}

$newHash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare(
    'UPDATE admins
     SET password_hash = ?, reset_token_hash = NULL, reset_expires = NULL
     WHERE id = ?'
);
$stmt->execute([$newHash, (int)$admin['id']]);

json_response(['ok' => true, 'message' => 'Senha redefinida com sucesso.']);
