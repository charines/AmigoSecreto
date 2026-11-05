import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { loadConfig } from '../config.js';
import { buildCorsResponse } from '../cors.js';
import { getPool } from '../db.js';

export type SendChatInput = {
  token: string;
  channel: string;
  texto: string;
};

export type SendChatResult = {
  status: number;
  body: { ok: boolean; error?: string; message?: { id: number; role: string; texto: string; timestamp: string } };
};

export async function sendChatMessage(pool: Pool, input: SendChatInput): Promise<SendChatResult> {
  const token = input.token.trim();
  const channel = input.channel.trim();
  const texto = input.texto.trim();

  if (token === '' || channel === '' || texto === '') {
    return { status: 400, body: { ok: false, error: 'Dados invalidos' } };
  }
  if (channel !== 'amigo' && channel !== 'admirador') {
    return { status: 400, body: { ok: false, error: 'Canal invalido' } };
  }

  const [participants] = await pool.query<RowDataPacket[]>(
    'SELECT id, group_id FROM participants WHERE reveal_token = ? LIMIT 1',
    [token],
  );
  const participant = participants[0] as { id: number; group_id: number } | undefined;
  if (!participant) {
    return { status: 404, body: { ok: false, error: 'Participante nao encontrado' } };
  }

  const drawColumn = channel === 'amigo' ? 'giver_id' : 'receiver_id';
  const senderRole = channel === 'amigo' ? 'giver' : 'receiver';

  const [draws] = await pool.query<RowDataPacket[]>(`SELECT id FROM draw_results WHERE ${drawColumn} = ? LIMIT 1`, [
    participant.id,
  ]);
  const draw = draws[0] as { id: number } | undefined;
  if (!draw) {
    const error =
      channel === 'amigo'
        ? 'Sorteio nao encontrado'
        : 'Sorteio associado nao encontrado. Se foi um sorteio antigo, o chat do admirador nao esta disponivel.';
    return { status: 404, body: { ok: false, error } };
  }

  const [insertResult] = await pool.query<ResultSetHeader>(
    'INSERT INTO chat_messages (group_id, draw_id, sender_role, texto) VALUES (?, ?, ?, ?)',
    [participant.group_id, draw.id, senderRole, texto],
  );

  const [rows] = await pool.query<RowDataPacket[]>('SELECT created_at FROM chat_messages WHERE id = ?', [
    insertResult.insertId,
  ]);
  const createdAt = (rows[0] as { created_at: string }).created_at;

  return {
    status: 200,
    body: {
      ok: true,
      message: {
        id: insertResult.insertId,
        role: 'Você',
        texto,
        timestamp: new Date(createdAt.replace(' ', 'T') + 'Z').toISOString(),
      },
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = loadConfig(process.env);
  const cors = buildCorsResponse(config.cors, req.method ?? 'GET');
  res.writeHead(cors.status ?? 200, cors.headers);
  if (cors.status === 204) {
    res.end();
    return;
  }

  const result = await sendChatMessage(getPool(config), {
    token: String(req.body?.token ?? ''),
    channel: String(req.body?.channel ?? ''),
    texto: String(req.body?.texto ?? ''),
  });

  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
