import { renderEmailLayout } from './emailLayout.js';
import { escapeHtml } from './htmlEscape.js';

export type DrawResultEmailInput = {
  participantName: string;
  groupTitle: string;
  groupDescription: string;
  drawDate: string | null;
  revealLink: string;
  accessCode: string;
  resend: boolean;
};

export type DrawResultEmail = {
  subject: string;
  text: string;
  html: string;
};

export function buildDrawResultEmail(input: DrawResultEmailInput): DrawResultEmail {
  const suffix = input.resend ? ' (Reenvio)' : '';
  const subject = `🔑 O sorteio saiu! Veja quem você tirou no "${input.groupTitle}"${suffix}`;
  const description = input.groupDescription || 'N/A';
  const drawDate = input.drawDate || 'N/A';

  const resendNoteHtml = input.resend
    ? '<p><em>Este é um reenvio da sua chave de acesso ao resultado do sorteio.</em></p>'
    : '';
  const resendNoteText = input.resend ? 'Este é um reenvio da sua chave de acesso ao resultado do sorteio.\n' : '';

  const text = [
    `Oi, ${input.participantName}! O sorteio já aconteceu! 🥳`,
    '',
    resendNoteText,
    `Grupo: ${input.groupTitle}`,
    `Detalhes: ${description}`,
    `Data do evento: ${drawDate}`,
    '',
    'Clique no link abaixo para descobrir seu amigo secreto. Guarde segredo até o grande dia!',
    '',
    input.revealLink,
    '',
    `Código de acesso (se pedirem): ${input.accessCode}`,
  ].join('\n');

  const html = renderEmailLayout({
    previewText: `O sorteio do grupo "${escapeHtml(input.groupTitle)}" já saiu!`,
    heading: '🥳 O sorteio saiu!',
    bodyHtml: `
      <p>Oi, ${escapeHtml(input.participantName)}! O sorteio já aconteceu! Clique no botão abaixo para descobrir seu amigo secreto. Guarde segredo até o grande dia! 🤫</p>
      ${resendNoteHtml}
      <p><strong>Grupo:</strong> ${escapeHtml(input.groupTitle)}</p>
      <p><strong>Detalhes:</strong> ${escapeHtml(description)}</p>
      <p><strong>Data do evento:</strong> ${escapeHtml(drawDate)}</p>
      <p>Código de acesso (se pedirem): <strong>${escapeHtml(input.accessCode)}</strong></p>
    `,
    ctaLabel: 'Revelar meu amigo secreto',
    ctaUrl: input.revealLink,
  });

  return { subject, text, html };
}
