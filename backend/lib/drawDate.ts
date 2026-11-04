export type DrawDateResult = { ok: true; value: string | null } | { ok: false };

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toMysqlDatetime(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

const BR_DATE_RE = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/;

export function parseDrawDate(raw: string): DrawDateResult {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { ok: true, value: null };
  }

  const brMatch = BR_DATE_RE.exec(trimmed);
  if (brMatch) {
    const [, dd, mm, yyyy, hh = '00', min = '00', ss = '00'] = brMatch;
    const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min), Number(ss));
    return { ok: true, value: toMysqlDatetime(date) };
  }

  const isoLike = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const parsed = new Date(isoLike);
  if (!Number.isNaN(parsed.getTime())) {
    return { ok: true, value: toMysqlDatetime(parsed) };
  }

  return { ok: false };
}
