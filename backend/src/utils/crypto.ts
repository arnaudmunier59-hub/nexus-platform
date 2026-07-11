import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { env } from '../config/env.js'

/**
 * Encryption key buffer
 */
const encryptionKeyBuffer = Buffer.from(env.ENCRYPTION_KEY, 'hex')

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string, saltRounds: number = 10): Promise<string> {
  return bcrypt.hash(password, saltRounds)
}

/**
 * Compare password with hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate a random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encrypt(data: string | object): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKeyBuffer, iv)

  let encrypted = cipher.update(
    typeof data === 'string' ? data : JSON.stringify(data),
    'utf8',
    'hex'
  )
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format')
  }

  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]

  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKeyBuffer, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Parse decrypted data as JSON if possible
 */
export function decryptJSON<T = any>(encryptedData: string): T {
  const decrypted = decrypt(encryptedData)
  try {
    return JSON.parse(decrypted) as T
  } catch {
    return decrypted as T
  }
}

/**
 * Create hash of data (SHA-256)
 */
export function hash(data: string | object): string {
  const stringData = typeof data === 'string' ? data : JSON.stringify(data)
  return crypto.createHash('sha256').update(stringData).digest('hex')
}

/**
 * Generate UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID()
}

/**
 * Create HMAC signature
 */
export function createHMAC(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex')
}

/**
 * Verify HMAC signature
 */
export function verifyHMAC(data: string, signature: string, secret: string): boolean {
  const expectedSignature = createHMAC(data, secret)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
