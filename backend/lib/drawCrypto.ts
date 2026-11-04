import { createCipheriv, createHash, randomBytes } from 'node:crypto';

export type EncryptedName = {
  payloadB64: string;
  ivB64: string;
};

export function encryptName(name: string, token: string): EncryptedName {
  const key = createHash('sha256').update(token).digest();
  const iv = randomBytes(12);

  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(name, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([ciphertext, tag]);

  return {
    payloadB64: payload.toString('base64'),
    ivB64: iv.toString('base64'),
  };
}
