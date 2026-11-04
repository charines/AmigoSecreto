import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { loadConfig } from '../lib/config.js';
import { buildCorsResponse } from '../lib/cors.js';
import { getPool } from '../lib/db.js';
import { requireAdmin } from '../lib/requireAdmin.js';
import { readSessionToken } from '../lib/requestSession.js';
import { createSendMail, type MailMessage } from '../lib/mailer.js';

export type ResendDrawResult = {
  status: number;
  body: { ok: boolean; error?: string };
};

type Row = RowDataPacket & {
  id: number;
  reveal_token: string | null;
  token_raw: string | null;
  name: string;
  email: string;
  group_title: string;
  group_description: string;
  group_draw_date: string | null;
};

export async function resendDraw(
  pool: Pool,
  sendMail: (message: MailMessage) => Promise<void>,
  adminId: number,
  participantId: number,
  baseUrl: string,
): Promise<ResendDrawResult> {
  if (participantId <= 0) {
    return { status: 400, body: { ok: false, error: 'Participante invalido' } };
  }

  const [rows] = await pool.query<Row[]>(
    'SELECT p.id, p.reveal_token, p.name, p.email, g.title AS group_title, g.description AS group_description, ' +
      'g.draw_date AS group_draw_date, dr.token_raw ' +
      'FROM participants p ' +
      'JOIN `groups` g ON p.group_id = g.id ' +
      'JOIN draw_results dr ON p.id = dr.giver_id ' +
      'WHERE p.id = ? AND g.admin_id = ? LIMIT 1',
    [participantId, adminId],
  );
  const row = rows[0];
  if (!row) {
    return {
      status: 404,
      body: { ok: false, error: 'Participante nao encontrado, sem permissao ou sorteio ainda nao realizado.' },
    };
  }
  if (!row.token_raw) {
    return {
      status: 400,
      body: { ok: false, error: 'Nao e possivel reenviar o sorteio para este participante (token nao armazenado).' },
    };
  }

  const revealLink =
    `${baseUrl.replace(/\/+$/, '')}/reveal?token=${encodeURIComponent(row.reveal_token ?? '')}` +
    `&code=${encodeURIComponent(row.token_raw)}`;
  const subject = `[PROJETO AMIGO SECRETO] Reenvio da sua chave de acesso — ${row.group_title}`;
  const text = [
    'Ola, sobrevivente do dia a dia!',
    '',
    `Reenvio do seu par do Amigo Secreto para o grupo "${row.group_title}".`,
    '',
    'Detalhes do Protocolo:',
    `    Participante Selecionado: ${row.name}`,
    `    Grupo Atual: ${row.group_title}`,
    `    Descricao do Projeto: ${row.group_description || 'N/A'}`,
    `    Data do Evento: ${row.group_draw_date || 'N/A'}`,
    '',
    'Clique no link abaixo para revelar:',
    '',
    revealLink,
    '',
    `Codigo de acesso: ${row.token_raw}`,
    '',
    'Namaste.',
  ].join('\n');

  await sendMail({ to: row.email, subject, text });
  await pool.query('UPDATE participants SET token_sent_at = NOW() WHERE id = ?', [row.id]);

  return { status: 200, body: { ok: true } };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = loadConfig(process.env);
  const cors = buildCorsResponse(config.cors, req.method ?? 'GET');
  res.writeHead(cors.status ?? 200, cors.headers);
  if (cors.status === 204) {
    res.end();
    return;
  }

  const pool = getPool(config);
  const admin = await requireAdmin(pool, readSessionToken(req));
  if (!admin) {
    res.statusCode = 401;
    res.end(JSON.stringify({ ok: false, error: 'Nao autorizado' }));
    return;
  }

  const result = await resendDraw(
    pool,
    createSendMail(config.mail),
    admin.id,
    Number(req.body?.participant_id ?? 0),
    config.app.baseUrl,
  );

  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
