const ITERATIONS = 210_000;
const bytesToHex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
const hexToBytes = (hex: string) => Uint8Array.from(hex.match(/.{1,2}/g) ?? [], (part) => Number.parseInt(part, 16));

async function derive(password: string, salt: Uint8Array): Promise<string> {
  if (!crypto.subtle) throw new Error('Secure local password verification requires a modern browser on HTTPS or localhost.');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const saltCopy = new Uint8Array(salt);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltCopy.buffer, iterations: ITERATIONS, hash: 'SHA-256' }, key, 256);
  return bytesToHex(new Uint8Array(bits));
}

export async function hashPassword(password: string): Promise<{ salt: string; hash: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: bytesToHex(salt), hash: await derive(password, salt) };
}

export async function verifyPassword(password: string, salt: string, expectedHash: string): Promise<boolean> {
  const actual = await derive(password, hexToBytes(salt));
  if (actual.length !== expectedHash.length) return false;
  let diff = 0;
  for (let index = 0; index < actual.length; index += 1) diff |= actual.charCodeAt(index) ^ expectedHash.charCodeAt(index);
  return diff === 0;
}

export async function migrateLegacyPassword(encoded: string): Promise<{ salt: string; hash: string } | null> {
  try { return await hashPassword(atob(encoded)); } catch { return null; }
}
