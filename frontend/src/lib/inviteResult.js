// Traduz a resposta de POST /api/groups?action=invite ({ sent, failed })
// em mensagens para o AdminDashboard. Falhas de SMTP não derrubam a
// requisição (backend/lib/handlers/groups_invite.ts): o participante é
// criado, mas o e-mail não chega — o admin precisa ver isso para reenviar.

const SUCCESS_NOTICE = 'Participantes notificados! Verifique o spam de: amigo.secreto@mercadocompleto.com.br';

export function summarizeInviteResult(data) {
  const sent = Array.isArray(data?.sent) ? data.sent : [];
  const failed = Array.isArray(data?.failed) ? data.failed : [];

  if (failed.length === 0) {
    return { allFailed: false, notice: SUCCESS_NOTICE, error: '' };
  }

  const emails = failed.map((f) => f.email).join(', ');
  const error = `Convite não enviado para: ${emails}. Use "Reenviar convite" na lista de participantes.`;
  const allFailed = sent.length === 0;

  return { allFailed, notice: allFailed ? '' : SUCCESS_NOTICE, error };
}
