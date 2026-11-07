import type { Pool, ResultSetHeader } from 'mysql2/promise';
import { parseDrawDate } from '../drawDate.js';
import { randomToken } from '../session.js';

export type CreateGroupInput = {
  title: string;
  description: string;
  draw_date: string;
  budget_limit: string;
};

type Group = {
  id: number;
  title: string;
  description: string;
  draw_date: string | null;
  budget_limit: number | null;
  status: 'open';
  dharma_code: string;
};

export type CreateGroupResult = {
  status: number;
  body: { ok: boolean; error?: string; group?: Group };
};

export async function createGroup(pool: Pool, adminId: number, input: CreateGroupInput): Promise<CreateGroupResult> {
  const title = input.title.trim();
  const description = input.description.trim();

  if (title === '') {
    return { status: 400, body: { ok: false, error: 'Titulo obrigatorio' } };
  }

  const dateResult = parseDrawDate(input.draw_date);
  if (!dateResult.ok) {
    return { status: 400, body: { ok: false, error: 'Data invalida' } };
  }

  let budget: number | null = null;
  const budgetRaw = input.budget_limit.trim();
  if (budgetRaw !== '') {
    if (Number.isNaN(Number(budgetRaw))) {
      return { status: 400, body: { ok: false, error: 'Budget invalido' } };
    }
    budget = Number(budgetRaw);
  }

  const dharmaCode = randomToken(6).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

  const [insertResult] = await pool.query<ResultSetHeader>(
    'INSERT INTO `groups` (admin_id, title, description, draw_date, budget_limit, status, dharma_code) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [adminId, title, description !== '' ? description : null, dateResult.value, budget, 'open', dharmaCode],
  );

  return {
    status: 200,
    body: {
      ok: true,
      group: {
        id: insertResult.insertId,
        title,
        description,
        draw_date: dateResult.value,
        budget_limit: budget,
        status: 'open',
        dharma_code: dharmaCode,
      },
    },
  };
}
