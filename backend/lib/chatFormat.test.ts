import { describe, expect, it } from 'vitest';
import { formatChannelMessages } from './chatFormat.js';

describe('formatChannelMessages', () => {
  it('prefixes with a system message and labels the giver as Você', () => {
    const result = formatChannelMessages(
      [{ id: 5, sender_role: 'giver', texto: 'Oi!', created_at: '2026-12-24 10:00:00' }],
      'giver',
      'amigo',
    );

    expect(result[0]).toMatchObject({ id: 0, role: 'Sistema' });
    expect(result[1]).toMatchObject({ id: 5, role: 'Você', texto: 'Oi!' });
  });

  it('labels the other party as "Meu Amigo Secreto" on the amigo channel', () => {
    const result = formatChannelMessages(
      [{ id: 5, sender_role: 'receiver', texto: 'Oi!', created_at: '2026-12-24 10:00:00' }],
      'giver',
      'amigo',
    );

    expect(result[1].role).toBe('Meu Amigo Secreto');
  });

  it('labels the other party as "Meu Admirador Secreto" on the admirador channel', () => {
    const result = formatChannelMessages(
      [{ id: 5, sender_role: 'giver', texto: 'Oi!', created_at: '2026-12-24 10:00:00' }],
      'receiver',
      'admirador',
    );

    expect(result[1].role).toBe('Meu Admirador Secreto');
  });
});
