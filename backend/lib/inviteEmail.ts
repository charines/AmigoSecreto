export type InviteEmailInput = {
  groupTitle: string;
  groupDescription: string;
  inviteLink: string;
  resend: boolean;
};

export type InviteEmail = {
  subject: string;
  text: string;
};

export function buildInviteEmail(input: InviteEmailInput): InviteEmail {
  const suffix = input.resend ? ' (Reenvio)' : '';
  const subject = `[PROJETO AMIGO SECRETO] Voce foi selecionado para uma nova iniciativa!${suffix}`;

  const text = [
    'Ola, sobrevivente do dia a dia!',
    '',
    'Chegou aquela epoca do ano. Fomos convocados para fazer parte de um experimento social altamente confidencial: o Amigo Secreto.',
    '',
    'Sua missao, caso decida aceita-la, e participar dessa dinamica para fortalecer os lacos da nossa propria "estacao".',
    '',
    'Detalhes do Protocolo:',
    `    O Projeto: ${input.groupTitle}`,
    '    Status do Sistema: Ativo e aguardando sua confirmacao.',
    `    Fase Atual: ${input.groupDescription || 'Testando data e hora do sistema.'}`,
    '',
    'Instrucoes para Confirmacao:',
    'Clique no link seguro abaixo para confirmar sua participacao:',
    '',
    input.inviteLink,
    '',
    'Agradecemos a sua colaboracao para o sucesso deste projeto.',
    '',
    'Namaste.',
  ].join('\n');

  return { subject, text };
}
