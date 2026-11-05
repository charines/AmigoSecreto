import nodemailer from 'nodemailer';
import type { BackendConfig } from './config.js';

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
};

export function buildTransportOptions(mailConfig: BackendConfig['mail']) {
  return {
    host: mailConfig.host,
    port: mailConfig.port,
    secure: mailConfig.secure.toLowerCase() === 'ssl',
    auth: { user: mailConfig.user, pass: mailConfig.pass },
    connectionTimeout: mailConfig.timeout * 1000,
  };
}

export function createSendMail(mailConfig: BackendConfig['mail']) {
  const transport = nodemailer.createTransport(buildTransportOptions(mailConfig));

  return async function sendMail(message: MailMessage): Promise<void> {
    await transport.sendMail({
      from: mailConfig.fromName ? `"${mailConfig.fromName}" <${mailConfig.from}>` : mailConfig.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
  };
}
