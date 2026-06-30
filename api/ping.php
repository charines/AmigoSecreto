<?php
/**
 * Health check endpoint — verifica conectividade do servidor e do banco.
 * Não expõe credenciais nem dados internos.
 * Chamado pelo frontend para indicar status de "acordando" na tela de login.
 */
declare(strict_types=1);

require __DIR__ . '/cors.php';

$result = [
    'ok'     => true,
    'server' => true,
    'db'     => false,
];

try {
    $pdo = require __DIR__ . '/db.php';
    $pdo->query('SELECT 1');
    $result['db'] = true;
} catch (\Throwable $e) {
    $result['ok'] = false;
    $result['db_error'] = 'Banco indisponivel';
}

echo json_encode($result);
