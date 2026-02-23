const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function decryptName(encryptedB64, ivB64, token) {
  const tokenBytes = textEncoder.encode(token);
  const keyBytes = await crypto.subtle.digest('SHA-256', tokenBytes);
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
  const payload = base64ToBytes(encryptedB64);
  const iv = base64ToBytes(ivB64);

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, payload);
  return textDecoder.decode(decrypted);
}
