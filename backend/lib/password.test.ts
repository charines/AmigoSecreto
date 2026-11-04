import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('verifies a password against its own hash', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');

    await expect(verifyPassword('correct-horse-battery-staple', hash)).resolves.toBe(true);
  });

  it('rejects the wrong password', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');

    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('verifies PHP-style $2y$ bcrypt hashes (password_hash default prefix)', async () => {
    const hash = await hashPassword('password');
    const phpStyleHash = `$2y$${hash.slice(4)}`;

    await expect(verifyPassword('password', phpStyleHash)).resolves.toBe(true);
  });
});
