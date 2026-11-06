import { createHash } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { loadConfig } from '../lib/config.js';
import { buildCorsResponse } from '../lib/cors.js';
import { getPool } from '../lib/db.js';
import { requireAdmin } from '../lib/requireAdmin.js';
import { readSessionToken } from '../lib/requestSession.js';
import { randomToken } from '../lib/session.js';
import { pairParticipants } from '../lib/drawAlgorithm.js';
import { encryptName } from '../lib/drawCrypto.js';
import { createSendMail, type MailMessage } from '../lib/mailer.js';
import { buildDrawResultEmail } from '../lib/drawResultEmail.js';

export type RunDrawResult = {
  status: number;
  body: { ok: boolean; error?: string; sent?: string[]; failed?: Array<{ email: string; error: string }> };
};

type Group = RowDataPacket & { id: number; title: string; description: string; draw_date: string | null; status: string };
type Participant = RowDataPacket & { id: number; name: string; email: string };

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function runDraw(
  pool: Pool,
  sendMail: (message: MailMessage) => Promise<void>,
  adminId: number,
  groupId: number,
  baseUrl: string,
): Promise<RunDrawResult> {
  if (groupId <= 0) {
    return { status: 400, body: { ok: false, error: 'Grupo invalido' } };
  }

  const [groups] = await pool.query<Group[]>(
    'SELECT id, title, description, draw_date, status FROM `groups` WHERE id = ? AND admin_id = ? LIMIT 1',
    [groupId, adminId],
  );
  const group = groups[0];
  if (!group) {
    return { status: 404, body: { ok: false, error: 'Grupo nao encontrado' } };
  }
  if (group.status !== 'open') {
    return { status: 400, body: { ok: false, error: 'Grupo nao esta aberto' } };
  }

  const [participants] = await pool.query<Participant[]>(
    "SELECT id, name, email FROM participants WHERE group_id = ? AND status = 'confirmed' ORDER BY id ASC",
    [groupId],
  );
  if (participants.length < 2) {
    return { status: 400, body: { ok: false, error: 'Minimo de 2 participantes confirmados' } };
  }

  const assignments = pairParticipants(participants, shuffle);

  const results: Array<{ participantId: number; name: string; email: string; revealToken: string; token: string }> = [];
  for (const { giver, receiver } of assignments) {
    const token = randomToken(24);
    const revealToken = randomToken(24);
    const enc = encryptName(receiver.name, token);

    await pool.query(
      'INSERT INTO draw_results (group_id, giver_id, encrypted_payload, iv_b64, token_hash, token_raw, receiver_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [groupId, giver.id, enc.payloadB64, enc.ivB64, createHash('sha256').update(token).digest('hex'), token, receiver.id],
    );
    await pool.query('UPDATE participants SET reveal_token = ? WHERE id = ?', [revealToken, giver.id]);

    results.push({ participantId: giver.id, name: giver.name, email: giver.email, revealToken, token });
  }

  await pool.query("UPDATE `groups` SET status = 'drawn' WHERE id = ?", [groupId]);

  const sent: string[] = [];
  const failed: Array<{ email: string; error: string }> = [];

  for (const r of results) {
    const revealLink =
      `${baseUrl.replace(/\/+$/, '')}/reveal?token=${encodeURIComponent(r.revealToken)}` +
      `&code=${encodeURIComponent(r.token)}`;
    const email = buildDrawResultEmail({
      participantName: r.name,
      groupTitle: group.title,
      groupDescription: group.description,
      drawDate: group.draw_date,
      revealLink,
      accessCode: r.token,
      resend: false,
    });

    try {
      await sendMail({ to: r.email, subject: email.subject, text: email.text, html: email.html });
      sent.push(r.email);
      await pool.query("UPDATE participants SET status = 'token_sent', token_sent_at = NOW() WHERE id = ?", [
        r.participantId,
      ]);
    } catch (err) {
      failed.push({ email: r.email, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return { status: 200, body: { ok: true, sent, failed } };
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

  const result = await runDraw(
    pool,
    createSendMail(config.mail),
    admin.id,
    Number(req.body?.group_id ?? 0),
    config.app.baseUrl,
  );

  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
