import { describe, expect, it } from 'vitest';
import { buildDrawResultEmail } from './drawResultEmail.js';

describe('buildDrawResultEmail', () => {
  it('includes group title, reveal link, and access code in text and html', () => {
    const email = buildDrawResultEmail({
      participantName: 'Ana',
      groupTitle: 'Natal da Equipe',
      groupDescription: 'Confraternizacao anual',
      drawDate: '2026-12-20',
      revealLink: 'https://app.example.com/reveal?token=abc&code=xyz',
      accessCode: 'xyz',
      resend: false,
    });

    expect(email.subject).not.toContain('(Reenvio)');
    expect(email.text).toContain('Natal da Equipe');
    expect(email.text).toContain('https://app.example.com/reveal?token=abc&code=xyz');
    expect(email.text).toContain('xyz');

    expect(email.html).toContain('Natal da Equipe');
    expect(email.html).toContain('href="https://app.example.com/reveal?token=abc&code=xyz"');
    expect(email.html).toContain('xyz');
  });

  it('marks the subject as a resend and notes it in the body when resend is true', () => {
    const email = buildDrawResultEmail({
      participantName: 'Ana',
      groupTitle: 'Natal',
      groupDescription: '',
      drawDate: null,
      revealLink: 'https://app.example.com/reveal?token=abc&code=xyz',
      accessCode: 'xyz',
      resend: true,
    });

    expect(email.subject).toContain('(Reenvio)');
    expect(email.text.toLowerCase()).toContain('reenvio');
    expect(email.html.toLowerCase()).toContain('reenvio');
  });

  it('falls back to N/A when description and draw date are missing', () => {
    const email = buildDrawResultEmail({
      participantName: 'Ana',
      groupTitle: 'Natal',
      groupDescription: '',
      drawDate: null,
      revealLink: 'https://app.example.com/reveal?token=abc&code=xyz',
      accessCode: 'xyz',
      resend: false,
    });

    expect(email.text).toContain('N/A');
    expect(email.html).toContain('N/A');
  });

  it('escapes HTML-sensitive characters from group title, description, participant name, and access code', () => {
    const email = buildDrawResultEmail({
      participantName: '<i>Ana</i>',
      groupTitle: '<b>Natal</b> & Cia',
      groupDescription: 'Traz <script>alert(1)</script>',
      drawDate: null,
      revealLink: 'https://app.example.com/reveal?token=abc&code=xyz',
      accessCode: '<u>xyz</u>',
      resend: false,
    });

    expect(email.html).not.toContain('<script>');
    expect(email.html).not.toContain('<b>Natal</b>');
    expect(email.html).not.toContain('<i>Ana</i>');
    expect(email.html).not.toContain('<u>xyz</u>');
    expect(email.html).toContain('&lt;b&gt;Natal&lt;/b&gt; &amp; Cia');
    expect(email.html).toContain('&lt;i&gt;Ana&lt;/i&gt;');
    expect(email.html).toContain('&lt;u&gt;xyz&lt;/u&gt;');
  });

  it('does not reference the old theme anywhere', () => {
    const email = buildDrawResultEmail({
      participantName: 'Ana',
      groupTitle: 'Natal',
      groupDescription: '',
      drawDate: null,
      revealLink: 'https://app.example.com/reveal?token=abc&code=xyz',
      accessCode: 'xyz',
      resend: false,
    });

    for (const forbidden of ['sobrevivente', 'Dharma', 'Protocolo', 'Namaste', 'estacao']) {
      expect(email.subject).not.toContain(forbidden);
      expect(email.text).not.toContain(forbidden);
      expect(email.html).not.toContain(forbidden);
    }
  });
});
