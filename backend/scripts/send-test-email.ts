#!/usr/bin/env node
// Envia um e-mail de teste usando a config SMTP atual. Executar localmente com
// `tsx scripts/send-test-email.ts <destino> [assunto] [mensagem]`.
// Nunca deve virar endpoint HTTP publico.
import { loadConfig } from '../lib/config.js';
import { createSendMail } from '../lib/mailer.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function main() {
  const [to, subject = 'Teste de e-mail', message = 'Mensagem de teste do Amigo Secreto.'] = process.argv.slice(2);

  if (!to || !EMAIL_RE.test(to)) {
    console.error('Uso: tsx scripts/send-test-email.ts <destino> [assunto] [mensagem]');
    process.exit(1);
  }

  const config = loadConfig(process.env);
  const sendMail = createSendMail(config.mail);

  try {
    await sendMail({ to, subject, text: message });
    console.log(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }));
    process.exit(1);
  }
}

main();
