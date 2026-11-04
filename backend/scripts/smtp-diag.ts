#!/usr/bin/env node
// Script de diagnostico manual de SMTP. Executar localmente com `tsx scripts/smtp-diag.ts`.
// Nunca deve virar endpoint HTTP publico (risco de expor timing/erros de auth SMTP).
import nodemailer from 'nodemailer';
import { loadConfig } from '../lib/config.js';
import { buildTransportOptions } from '../lib/mailer.js';
import { maskValue } from '../lib/maskValue.js';

async function main() {
  const config = loadConfig(process.env);
  const transport = nodemailer.createTransport(buildTransportOptions(config.mail));

  const report = {
    config: {
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.secure,
      user: maskValue(config.mail.user),
      from: maskValue(config.mail.from),
      timeout: config.mail.timeout,
    },
    ok: false,
    error: undefined as string | undefined,
  };

  try {
    await transport.verify();
    report.ok = true;
  } catch (err) {
    report.error = err instanceof Error ? err.message : String(err);
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

main();
