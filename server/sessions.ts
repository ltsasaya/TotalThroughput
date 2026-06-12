import type pg from 'pg'
import { pool } from './db'
import { createSessionToken, hashSessionToken } from './crypto'
import { parseCookies, type AuthedUser } from './http'
import type { IncomingMessage } from 'node:http'
export { expiredSessionCookie, sessionCookie } from './sessionCookie'

const SESSION_COOKIE = 'tt_session'

export async function createSession(userId: string, client: pg.PoolClient | typeof pool = pool): Promise<string> {
  const token = createSessionToken()
  await client.query(
    `
      insert into sessions (user_id, token_hash, expires_at)
      values ($1, $2, now() + interval '30 days')
    `,
    [userId, hashSessionToken(token)],
  )
  return token
}

export async function revokeSessionFromRequest(req: IncomingMessage) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE]
  if (!token) return
  await pool.query(
    `update sessions set revoked_at = now() where token_hash = $1 and revoked_at is null`,
    [hashSessionToken(token)],
  )
}

export async function resolveUserFromRequest(req: IncomingMessage): Promise<AuthedUser | null> {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE]
  if (!token) return null

  const result = await pool.query<AuthedUser>(
    `
      update sessions s
      set last_seen_at = now()
      from users u
      where s.user_id = u.id
        and s.token_hash = $1
        and s.revoked_at is null
        and s.expires_at > now()
      returning u.id, u.username
    `,
    [hashSessionToken(token)],
  )

  return result.rows[0] ?? null
}
