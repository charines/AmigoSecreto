import { describe, expect, it } from 'vitest';
import { parseDrawDate } from './drawDate.js';

describe('parseDrawDate', () => {
  it('returns ok with null value for empty input', () => {
    expect(parseDrawDate('')).toEqual({ ok: true, value: null });
  });

  it('parses ISO datetime-local format', () => {
    expect(parseDrawDate('2026-12-24T18:30')).toEqual({ ok: true, value: '2026-12-24 18:30:00' });
  });

  it('parses Brazilian date format', () => {
    expect(parseDrawDate('24/12/2026')).toEqual({ ok: true, value: '2026-12-24 00:00:00' });
  });

  it('reports failure for unparseable input', () => {
    expect(parseDrawDate('not a date at all !!')).toEqual({ ok: false });
  });
});
