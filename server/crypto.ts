import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash, type ScryptOptions } from 'node:crypto'

const PASSWORD_PREFIX = 'scrypt'
const SCRYPT_N = 16_384
const SCRYPT_R = 8
const SCRYPT_P = 1
const KEY_LENGTH = 64

function scrypt(password: string, salt: string, keyLength: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error)
      else resolve(derivedKey)
    })
  })
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('base64url')
  const key = await scrypt(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: 32 * 1024 * 1024,
  })
  return `${PASSWORD_PREFIX}$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${key.toString('base64url')}`
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const parts = encodedHash.split('$')
  if (parts.length !== 6 || parts[0] !== PASSWORD_PREFIX) return false

  const n = Number(parts[1])
  const r = Number(parts[2])
  const p = Number(parts[3])
  const salt = parts[4]
  const expected = Buffer.from(parts[5], 'base64url')
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p) || expected.length === 0) {
    return false
  }

  const actual = await scrypt(password, salt, expected.length, {
    N: n,
    r,
    p,
    maxmem: 32 * 1024 * 1024,
  })

  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function createSessionToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function createClassCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  const bytes = randomBytes(8)
  for (let i = 0; i < 8; i += 1) {
    code += alphabet[bytes[i] % alphabet.length]
  }
  return code
}
