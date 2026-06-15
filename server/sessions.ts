import { pool, type DbQueryable } from './db.js'
import { createSessionToken, hashSessionToken } from './crypto.js'
import { parseCookies, type AuthedUser } from './http.js'
import { authUserFromRow, type UserCalibrationRow } from './userCalibration.js'
import type { IncomingMessage } from 'node:http'
export { expiredSessionCookie, sessionCookie } from './sessionCookie.js'

const SESSION_COOKIE = 'tt_session'

export async function createSession(userId: string, client: DbQueryable = pool): Promise<string> {
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

  const result = await pool.query<UserCalibrationRow>(
    `
      update sessions s
      set last_seen_at = now()
      from users u
      where s.user_id = u.id
        and s.token_hash = $1
        and s.revoked_at is null
        and s.expires_at > now()
      returning
        u.id,
        u.username,
        u.calibration_wpm,
        u.calibration_range_label,
        u.calibration_bin_index,
        u.calibration_service_demand_ms,
        u.calibration_updated_at
    `,
    [hashSessionToken(token)],
  )

  const user = result.rows[0]
  return user ? authUserFromRow(user) : null
}
