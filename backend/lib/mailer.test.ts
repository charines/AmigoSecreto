import { describe, expect, it } from 'vitest';
import { buildTransportOptions } from './mailer.js';

describe('buildTransportOptions', () => {
  it('builds secure:true for ssl', () => {
    const options = buildTransportOptions({
      host: 'smtp.titan.email',
      port: 465,
      user: 'user@example.com',
      pass: 'secret',
      from: 'from@example.com',
      fromName: 'Amigo Secreto',
      secure: 'ssl',
      timeout: 10,
    });

    expect(options).toMatchObject({
      host: 'smtp.titan.email',
      port: 465,
      secure: true,
      auth: { user: 'user@example.com', pass: 'secret' },
    });
  });

  it('builds secure:false (STARTTLS) for tls', () => {
    const options = buildTransportOptions({
      host: 'smtp.titan.email',
      port: 587,
      user: 'user@example.com',
      pass: 'secret',
      from: 'from@example.com',
      fromName: 'Amigo Secreto',
      secure: 'tls',
      timeout: 10,
    });

    expect(options.secure).toBe(false);
  });
});
