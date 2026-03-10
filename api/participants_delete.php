<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$admin = require_admin();
$input = json_input();

$participantId = (int)($input['participant_id'] ?? 0);

if ($participantId <= 0) {
    json_response(['ok' => false, 'error' => 'Participante invalido'], 400);
}

$pdo = db();

// Verify participant ownership via group
$stmt = $pdo->prepare('
    SELECT p.*, g.status as group_status, g.admin_id
    FROM participants p
    JOIN `groups` g ON p.group_id = g.id
    WHERE p.id = ? AND g.admin_id = ?
    LIMIT 1
');
$stmt->execute([$participantId, (int)$admin['id']]);
$participant = $stmt->fetch();

if (!$participant) {
    json_response(['ok' => false, 'error' => 'Participante nao encontrado ou sem permissao'], 404);
}

$groupId = (int)$participant['group_id'];
$groupStatus = $participant['group_status'];

$pdo->beginTransaction();

try {
    if ($groupStatus === 'drawn') {
        // Resetting group and participants because a member removal breaks the cycle
        
        // 1. Delete draw results for the group
        $stmt = $pdo->prepare('DELETE FROM draw_results WHERE group_id = ?');
        $stmt->execute([$groupId]);
        
        // 2. Reset participants status and reveal tokens
        $stmt = $pdo->prepare("
            UPDATE participants 
            SET status = 'confirmed', 
                reveal_token = NULL,
                token_sent_at = NULL,
                revealed_at = NULL
            WHERE group_id = ? AND status IN ('token_sent', 'revealed')
        ");
        $stmt->execute([$groupId]);
        
        // 3. Set group status back to open
        $stmt = $pdo->prepare("UPDATE `groups` SET status = 'open' WHERE id = ?");
        $stmt->execute([$groupId]);
    }
    
    // Delete the participant
    $stmt = $pdo->prepare('DELETE FROM participants WHERE id = ?');
    $stmt->execute([$participantId]);
    
    $pdo->commit();
    json_response(['ok' => true]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_response(['ok' => false, 'error' => 'Erro ao processar remocao: ' . $e->getMessage()], 500);
}
