<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$input = json_input();
$token = trim((string)($input['token'] ?? ''));
$channel = trim((string)($input['channel'] ?? ''));
$texto = trim((string)($input['texto'] ?? ''));

if ($token === '' || $channel === '' || $texto === '') {
    json_response(['ok' => false, 'error' => 'Dados invalidos'], 400);
}

if (!in_array($channel, ['amigo', 'admirador'])) {
    json_response(['ok' => false, 'error' => 'Canal invalido'], 400);
}

$pdo = db();
$stmt = $pdo->prepare('SELECT id, group_id FROM participants WHERE reveal_token = ? LIMIT 1');
$stmt->execute([$token]);
$participant = $stmt->fetch();
if (!$participant) {
    json_response(['ok' => false, 'error' => 'Participante nao encontrado'], 404);
}

$participantId = (int)$participant['id'];
$groupId = (int)$participant['group_id'];

$drawId = 0;
$senderRole = '';

if ($channel === 'amigo') {
    // Participant is the giver
    $stmtDraw = $pdo->prepare('SELECT id FROM draw_results WHERE giver_id = ? LIMIT 1');
    $stmtDraw->execute([$participantId]);
    $draw = $stmtDraw->fetch();
    if (!$draw) {
        json_response(['ok' => false, 'error' => 'Sorteio nao encontrado'], 404);
    }
    $drawId = (int)$draw['id'];
    $senderRole = 'giver';
} else {
    // Participant is the receiver
    $stmtDraw = $pdo->prepare('SELECT id FROM draw_results WHERE receiver_id = ? LIMIT 1');
    $stmtDraw->execute([$participantId]);
    $draw = $stmtDraw->fetch();
    if (!$draw) {
        // Se ainda não houve um envio do giver, pode não ter recebido o link ou algo assim. 
        // Mas o receiver_id agora estará preenchido no sorteio (para novos sorteios).
        json_response(['ok' => false, 'error' => 'Sorteio associado nao encontrado. Se foi um sorteio antigo, o chat do admirador nao esta disponivel.'], 404);
    }
    $drawId = (int)$draw['id'];
    $senderRole = 'receiver';
}

try {
    $stmtInsert = $pdo->prepare(
        'INSERT INTO chat_messages (group_id, draw_id, sender_role, texto) VALUES (?, ?, ?, ?)'
    );
    $stmtInsert->execute([$groupId, $drawId, $senderRole, $texto]);
    
    $insertedId = $pdo->lastInsertId();
    
    // Obter data criada para formatar igual
    $stmtSel = $pdo->prepare('SELECT created_at FROM chat_messages WHERE id = ?');
    $stmtSel->execute([$insertedId]);
    $created_at = $stmtSel->fetchColumn();

    $roleStr = ($channel === 'amigo') ? 'Você' : 'Você'; // Quem envia sempre vê como "Você"

    json_response([
        'ok' => true,
        'message' => [
            'id' => (int)$insertedId,
            'role' => $roleStr,
            'texto' => $texto,
            'timestamp' => date('c', strtotime($created_at)),
        ]
    ]);

} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'Erro ao enviar mensagem'], 500);
}
