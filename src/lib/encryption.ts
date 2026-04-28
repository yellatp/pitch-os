// src/lib/encryption.ts

// Derive a CryptoKey from AUTH_SECRET + userId
// This means even if KV is compromised, keys can't be decrypted without both
async function deriveKey(authSecret: string, userId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(authSecret),
    { name: 'HKDF' },
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: encoder.encode(userId),
      info: encoder.encode('pitch-os-key-encryption-v1'),
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptKey(
  plaintext: string,
  authSecret: string,
  userId: string
): Promise<string> {
  const cryptoKey = await deriveKey(authSecret, userId)
  const iv = crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV for AES-GCM
  const encoded = new TextEncoder().encode(plaintext)

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoded
  )

  // Combine iv + ciphertext, encode as base64
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.length)

  return btoa(String.fromCharCode(...combined))
}

export async function decryptKey(
  encrypted: string,
  authSecret: string,
  userId: string
): Promise<string> {
  const cryptoKey = await deriveKey(authSecret, userId)
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))

  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    ciphertext
  )

  return new TextDecoder().decode(plaintext)
}