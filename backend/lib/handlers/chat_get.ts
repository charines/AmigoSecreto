import type { Pool, RowDataPacket } from 'mysql2/promise';
import { formatChannelMessages, type ChatMessageRow, type FormattedMessage } from '../chatFormat.js';

export type ChatGetResult = {
  status: number;
  body: {
    ok: boolean;
    error?: string;
    messages?: { amigo: FormattedMessage[]; admirador: FormattedMessage[] };
  };
};

async function loadChannelMessages(
  pool: Pool,
  participantId: number,
  drawColumn: 'giver_id' | 'receiver_id',
  selfRole: 'giver' | 'receiver',
  channel: 'amigo' | 'admirador',
): Promise<FormattedMessage[]> {
  const [draws] = await pool.query<RowDataPacket[]>(`SELECT id FROM draw_results WHERE ${drawColumn} = ? LIMIT 1`, [
    participantId,
  ]);
  const draw = draws[0] as { id: number } | undefined;
  if (!draw) {
    return formatChannelMessages([], selfRole, channel);
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, sender_role, texto, created_at FROM chat_messages WHERE draw_id = ? ORDER BY id ASC',
    [draw.id],
  );
  return formatChannelMessages(rows as ChatMessageRow[], selfRole, channel);
}

export async function getChatMessages(pool: Pool, rawToken: string): Promise<ChatGetResult> {
  const token = rawToken.trim();
  if (token === '') {
    return { status: 400, body: { ok: false, error: 'Token invalido' } };
  }

  const [participants] = await pool.query<RowDataPacket[]>(
    'SELECT id, group_id FROM participants WHERE reveal_token = ? LIMIT 1',
    [token],
  );
  const participant = participants[0] as { id: number } | undefined;
  if (!participant) {
    return { status: 404, body: { ok: false, error: 'Participante nao encontrado' } };
  }

  const amigo = await loadChannelMessages(pool, participant.id, 'giver_id', 'giver', 'amigo');
  const admirador = await loadChannelMessages(pool, participant.id, 'receiver_id', 'receiver', 'admirador');

  return { status: 200, body: { ok: true, messages: { amigo, admirador } } };
}
