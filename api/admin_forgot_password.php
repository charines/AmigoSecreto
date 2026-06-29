<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/mailer.php';

$input = json_input();
$email = trim(strtolower((string)($input['email'] ?? '')));

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['ok' => false, 'error' => 'Email invalido'], 400);
}

$pdo = db();

// Verificar se admin existe — resposta idêntica mesmo se não existir (anti-enumeração)
$stmt = $pdo->prepare('SELECT id, name FROM admins WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$admin = $stmt->fetch();

if ($admin) {
    $rawToken   = random_token(32);
    $tokenHash  = hash('sha256', $rawToken);
    $expiresAt  = date('Y-m-d H:i:s', time() + 3600); // 1 hora

    $stmt = $pdo->prepare(
        'UPDATE admins SET reset_token_hash = ?, reset_expires = ? WHERE id = ?'
    );
    $stmt->execute([$tokenHash, $expiresAt, (int)$admin['id']]);

    $config    = require __DIR__ . '/config.php';
    $baseUrl   = rtrim((string)($config['app']['base_url'] ?? ''), '/');
    $resetLink = $baseUrl . '/reset-password?token=' . urlencode($rawToken);

    $subject = 'Recuperação de senha — AmigoSecreto';
    $body    = <<<TXT
Olá, {$admin['name']}!

Recebemos uma solicitação para redefinir a senha da sua conta no AmigoSecreto.

Clique no link abaixo para criar uma nova senha (válido por 1 hora):

{$resetLink}

Se você não solicitou a recuperação, ignore este e-mail. Sua senha não será alterada.

—
Equipe AmigoSecreto
TXT;

    try {
        send_smtp_mail($config['mail'], $email, $subject, $body, $config['imap'] ?? []);
    } catch (Throwable $e) {
        // Não expõe falha de SMTP ao cliente — silencia e loga no servidor
        error_log('[forgot_password] Falha ao enviar email para ' . $email . ': ' . $e->getMessage());
    }
}

// Resposta idêntica independente de o email existir ou não
json_response(['ok' => true, 'message' => 'Se esse e-mail estiver cadastrado, um link foi enviado.']);
