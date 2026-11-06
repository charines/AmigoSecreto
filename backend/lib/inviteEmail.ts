import { renderEmailLayout } from './emailLayout.js';
import { escapeHtml } from './htmlEscape.js';

export type InviteEmailInput = {
  groupTitle: string;
  groupDescription: string;
  inviteLink: string;
  resend: boolean;
};

export type InviteEmail = {
  subject: string;
  text: string;
  html: string;
};

export function buildInviteEmail(input: InviteEmailInput): InviteEmail {
  const suffix = input.resend ? ' (Reenvio)' : '';
  const subject = `🎁 Você foi convidado para o Amigo Secreto "${input.groupTitle}"!${suffix}`;
  const description = input.groupDescription || 'Sem descrição por enquanto, mas vai ser divertido!';

  const resendNoteHtml = input.resend
    ? '<p><em>Este é um reenvio do seu convite — você ainda não confirmou sua participação.</em></p>'
    : '';
  const resendNoteText = input.resend
    ? 'Este é um reenvio do seu convite — você ainda não confirmou sua participação.\n'
    : '';

  const text = [
    'Oi! Prepare o papel de embrulho, porque você foi convidado para um Amigo Secreto! 🎉',
    '',
    resendNoteText,
    `Grupo: ${input.groupTitle}`,
    `Detalhes: ${description}`,
    '',
    'Clique no link abaixo para confirmar sua participação e entrar na brincadeira:',
    '',
    input.inviteLink,
    '',
    'Bora trocar presentes (e carinho)? Te esperamos lá!',
  ].join('\n');

  const html = renderEmailLayout({
    previewText: `Você foi convidado para o Amigo Secreto "${escapeHtml(input.groupTitle)}"!`,
    heading: '🎁 Você foi convidado!',
    bodyHtml: `
      <p>Oi! Prepare o papel de embrulho, porque você foi convidado para um Amigo Secreto! 🎉</p>
      ${resendNoteHtml}
      <p><strong>Grupo:</strong> ${escapeHtml(input.groupTitle)}</p>
      <p><strong>Detalhes:</strong> ${escapeHtml(description)}</p>
      <p>Bora trocar presentes (e carinho)? Te esperamos lá!</p>
    `,
    ctaLabel: 'Confirmar participação',
    ctaUrl: input.inviteLink,
  });

  return { subject, text, html };
}
