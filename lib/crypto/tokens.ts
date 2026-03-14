/**
 * Encryption utilities for storing sensitive integration tokens.
 * Uses AES-256-GCM via the Web Crypto API (edge-compatible).
 */

function getKey(): string {
  const key = process.env.INTEGRATION_ENCRYPTION_KEY
  if (!key || key.length < 32) {
    throw new Error('INTEGRATION_ENCRYPTION_KEY must be at least 32 characters')
  }
  return key
}

async function importKey(rawKey: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(rawKey.slice(0, 32))
  return crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ])
}

/**
 * Encrypt a plaintext string.
 * Returns base64-encoded IV + ciphertext.
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await importKey(getKey())
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoder = new TextEncoder()

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  )

  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)

  return Buffer.from(combined).toString('base64')
}

/**
 * Decrypt a base64-encoded IV + ciphertext string.
 */
export async function decrypt(encryptedBase64: string): Promise<string> {
  const key = await importKey(getKey())
  const combined = Buffer.from(encryptedBase64, 'base64')
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )

  return new TextDecoder().decode(plaintext)
}
