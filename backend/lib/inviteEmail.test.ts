import { describe, expect, it } from 'vitest';
import { buildInviteEmail } from './inviteEmail.js';

describe('buildInviteEmail', () => {
  it('includes the group title and invite link in the body', () => {
    const email = buildInviteEmail({
      groupTitle: 'Natal da Equipe',
      groupDescription: 'Confraternizacao anual',
      inviteLink: 'https://app.example.com/invite?token=abc123',
      resend: false,
    });

    expect(email.subject).not.toContain('(Reenvio)');
    expect(email.text).toContain('Natal da Equipe');
    expect(email.text).toContain('Confraternizacao anual');
    expect(email.text).toContain('https://app.example.com/invite?token=abc123');
  });

  it('marks the subject as a resend when resend is true', () => {
    const email = buildInviteEmail({
      groupTitle: 'Natal',
      groupDescription: '',
      inviteLink: 'https://app.example.com/invite?token=abc123',
      resend: true,
    });

    expect(email.subject).toContain('(Reenvio)');
    expect(email.text).toContain('Testando data e hora do sistema.');
  });
});
