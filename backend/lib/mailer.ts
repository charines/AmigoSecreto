// Stub minimo ate o ticket #5 (participantes e convites) trazer o nodemailer
// completo. Mantem a mesma assinatura para os handlers que ja dependem de envio
// de e-mail (forgot-password) nao precisarem mudar quando o mailer real entrar.
export type MailMessage = {
  to: string;
  subject: string;
  text: string;
};

export async function sendMail(message: MailMessage): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`[mailer stub] to=${message.to} subject=${message.subject}`);
}
