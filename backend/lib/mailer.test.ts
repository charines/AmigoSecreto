import { describe, expect, it, vi } from 'vitest';

const sendMailMock = vi.fn().mockResolvedValue(undefined);
vi.mock('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail: sendMailMock }) },
}));

const { buildTransportOptions, createSendMail } = await import('./mailer.js');

const mailConfig = {
  host: 'smtp.titan.email',
  port: 587,
  user: 'user@example.com',
  pass: 'secret',
  from: 'from@example.com',
  fromName: 'Amigo Secreto',
  secure: 'tls',
  timeout: 10,
};

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

describe('createSendMail', () => {
  it('passes the html field through to the transport when provided', async () => {
    const sendMail = createSendMail(mailConfig);
    await sendMail({ to: 'to@example.com', subject: 'Oi', text: 'corpo texto', html: '<p>corpo html</p>' });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ html: '<p>corpo html</p>' }),
    );
  });

  it('omits html from the transport call when not provided', async () => {
    const sendMail = createSendMail(mailConfig);
    await sendMail({ to: 'to@example.com', subject: 'Oi', text: 'corpo texto' });

    const lastCall = sendMailMock.mock.calls.at(-1)?.[0];
    expect(lastCall.html).toBeUndefined();
  });
});
