/**
 * AES-GCM client-side encryption for order chat messages.
 *
 * Key is derived from the orderId via PBKDF2 (100k iterations, SHA-256).
 * Firestore stores only ciphertext — Firebase never sees plaintext.
 *
 * Security model:
 *   - Only parties who know the orderId (buyer + seller) can derive the key.
 *   - Firestore rules independently restrict access to the order's participants.
 *   - Two layers of protection: access control + encryption at rest.
 */

const SALT = new TextEncoder().encode("bumap-chat-v1");

async function deriveKey(orderId: string): Promise<CryptoKey> {
  const raw = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(orderId),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: SALT, iterations: 100_000, hash: "SHA-256" },
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function toBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  // Ensure the underlying buffer is a plain ArrayBuffer (not SharedArrayBuffer)
  // so SubtleCrypto accepts it as BufferSource.
  return new Uint8Array(bytes.buffer.slice(0) as ArrayBuffer);
}

export async function encryptMessage(
  orderId: string,
  plaintext: string
): Promise<{ encrypted: string; iv: string }> {
  const key = await deriveKey(orderId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  return { encrypted: toBase64(ciphertext), iv: toBase64(iv) };
}

export async function decryptMessage(
  orderId: string,
  encrypted: string,
  iv: string
): Promise<string> {
  try {
    const key = await deriveKey(orderId);
    const buf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(iv) },
      key,
      fromBase64(encrypted)
    );
    return new TextDecoder().decode(buf);
  } catch {
    return "[encrypted message]";
  }
}
