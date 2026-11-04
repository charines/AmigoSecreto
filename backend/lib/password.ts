import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // PHP's password_hash() default prefix is $2y$; bcryptjs expects $2a$/$2b$.
  // The algorithm is identical, only the prefix differs, so normalize it.
  const normalizedHash = hash.startsWith('$2y$') ? `$2b$${hash.slice(4)}` : hash;
  return bcrypt.compare(password, normalizedHash);
}
