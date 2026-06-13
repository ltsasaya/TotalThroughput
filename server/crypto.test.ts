import { describe, expect, it } from 'vitest'
import { createSessionToken, hashPassword, hashSessionToken, verifyPassword } from './crypto.js'
import { expiredSessionCookie, sessionCookie } from './sessionCookie.js'

describe('server crypto helpers', () => {
  it('verifies scrypt password hashes without accepting the wrong password', async () => {
    const hash = await hashPassword('correct-password')

    await expect(verifyPassword('correct-password', hash)).resolves.toBe(true)
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false)
  })

  it('hashes opaque session tokens deterministically without storing the token', () => {
    const token = createSessionToken()
    const tokenHash = hashSessionToken(token)

    expect(token).not.toContain(tokenHash)
    expect(hashSessionToken(token)).toBe(tokenHash)
    expect(hashSessionToken(`${token}x`)).not.toBe(tokenHash)
  })

  it('sets HttpOnly SameSite session cookie flags', () => {
    const cookie = sessionCookie('abc123')

    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Path=/')
    expect(cookie).not.toContain('SESSION_SECRET')
    expect(expiredSessionCookie()).toContain('Max-Age=0')
  })
})
