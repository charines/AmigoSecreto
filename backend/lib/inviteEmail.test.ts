import { describe, expect, it } from 'vitest';
import { buildInviteEmail } from './inviteEmail.js';

describe('buildInviteEmail', () => {
  it('includes the group title, description, and invite link in the body and html', () => {
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

    expect(email.html).toContain('Natal da Equipe');
    expect(email.html).toContain('Confraternizacao anual');
    expect(email.html).toContain('href="https://app.example.com/invite?token=abc123"');
  });

  it('marks the subject as a resend when resend is true', () => {
    const email = buildInviteEmail({
      groupTitle: 'Natal',
      groupDescription: '',
      inviteLink: 'https://app.example.com/invite?token=abc123',
      resend: true,
    });

    expect(email.subject).toContain('(Reenvio)');
    expect(email.text.toLowerCase()).toContain('reenvio');
    expect(email.html.toLowerCase()).toContain('reenvio');
  });

  it('escapes HTML-sensitive characters from group title and description', () => {
    const email = buildInviteEmail({
      groupTitle: '<b>Natal</b> & Cia',
      groupDescription: 'Traz <script>alert(1)</script>',
      inviteLink: 'https://app.example.com/invite?token=abc123',
      resend: false,
    });

    expect(email.html).not.toContain('<script>');
    expect(email.html).not.toContain('<b>Natal</b>');
    expect(email.html).toContain('&lt;b&gt;Natal&lt;/b&gt; &amp; Cia');
    expect(email.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('does not reference the old theme anywhere in subject, text, or html', () => {
    const email = buildInviteEmail({
      groupTitle: 'Natal',
      groupDescription: '',
      inviteLink: 'https://app.example.com/invite?token=abc123',
      resend: false,
    });

    for (const forbidden of ['sobrevivente', 'Dharma', 'Protocolo', 'Namaste', 'estacao']) {
      expect(email.subject).not.toContain(forbidden);
      expect(email.text).not.toContain(forbidden);
      expect(email.html).not.toContain(forbidden);
    }
  });
});
