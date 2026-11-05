import { webcrypto } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { encryptName } from './drawCrypto.js';

async function decryptLikeFrontend(payloadB64: string, ivB64: string, token: string): Promise<string> {
  const keyBytes = await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const key = await webcrypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
  const payload = Buffer.from(payloadB64, 'base64');
  const iv = Buffer.from(ivB64, 'base64');

  const decrypted = await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, payload);
  return new TextDecoder().decode(decrypted);
}

describe('encryptName', () => {
  it('produces a payload decryptable by the frontend Web Crypto flow (crypto.js)', async () => {
    const { payloadB64, ivB64 } = encryptName('Maria Silva', 'some-raw-token');

    const decrypted = await decryptLikeFrontend(payloadB64, ivB64, 'some-raw-token');

    expect(decrypted).toBe('Maria Silva');
  });

  it('fails to decrypt with the wrong token', async () => {
    const { payloadB64, ivB64 } = encryptName('Maria Silva', 'right-token');

    await expect(decryptLikeFrontend(payloadB64, ivB64, 'wrong-token')).rejects.toThrow();
  });
});
