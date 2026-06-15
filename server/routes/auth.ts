import { withTransaction } from '../db.js'
import { hashPassword, verifyPassword } from '../crypto.js'
import { HttpError, json, noContent, readJsonBody, requireUser, route, type RouteDefinition } from '../http.js'
import { createSession, expiredSessionCookie, revokeSessionFromRequest, sessionCookie } from '../sessions.js'
import { authUserFromRow, type UserCalibrationRow } from '../userCalibration.js'
import { asObject, normalizedUsername, stringField, validatePassword, validateUsername } from '../validation.js'

export const authRoutes: RouteDefinition[] = [
  route('GET', '/api/auth/me', async ({ res, user }) => {
    json(res, 200, { user })
  }),

  route('POST', '/api/auth/register', async ({ req, res }) => {
    const body = asObject(await readJsonBody(req))
    const username = stringField(body, 'username', { min: 3, max: 32 })
    const password = stringField(body, 'password', { min: 8, max: 128 })
    validateUsername(username)
    validatePassword(password)

    const normalized = normalizedUsername(username)
    const passwordHash = await hashPassword(password)

    const { user, token } = await withTransaction(async (client) => {
      const existing = await client.query('select 1 from users where normalized_username = $1', [normalized])
      if (existing.rowCount) throw new HttpError(409, 'Username is already taken.')

      const inserted = await client.query<UserCalibrationRow>(
        `
          insert into users (username, normalized_username, password_hash, last_login_at)
          values ($1, $2, $3, now())
          returning
            id,
            username,
            calibration_wpm,
            calibration_range_label,
            calibration_bin_index,
            calibration_service_demand_ms,
            calibration_updated_at
        `,
        [username, normalized, passwordHash],
      )
      const createdUser = inserted.rows[0]
      const sessionToken = await createSession(createdUser.id, client)
      await client.query('insert into user_activity (user_id) values ($1) on conflict do nothing', [createdUser.id])
      return { user: authUserFromRow(createdUser), token: sessionToken }
    })

    json(res, 201, { user }, { 'Set-Cookie': sessionCookie(token) })
  }),

  route('POST', '/api/auth/login', async ({ req, res }) => {
    const body = asObject(await readJsonBody(req))
    const username = stringField(body, 'username', { min: 3, max: 32 })
    const password = stringField(body, 'password', { min: 1, max: 128 })
    const normalized = normalizedUsername(username)

    const result = await withTransaction(async (client) => {
      const userResult = await client.query<UserCalibrationRow & { password_hash: string }>(
        `
          select
            id,
            username,
            password_hash,
            calibration_wpm,
            calibration_range_label,
            calibration_bin_index,
            calibration_service_demand_ms,
            calibration_updated_at
          from users
          where normalized_username = $1
        `,
        [normalized],
      )
      const foundUser = userResult.rows[0]
      if (!foundUser || !(await verifyPassword(password, foundUser.password_hash))) {
        throw new HttpError(401, 'Username or password is incorrect.')
      }

      await client.query('update users set last_login_at = now() where id = $1', [foundUser.id])
      await client.query('insert into user_activity (user_id) values ($1) on conflict do nothing', [foundUser.id])
      const token = await createSession(foundUser.id, client)
      return { user: authUserFromRow(foundUser), token }
    })

    json(res, 200, { user: result.user }, { 'Set-Cookie': sessionCookie(result.token) })
  }),

  route('POST', '/api/auth/logout', async ({ req, res, user }) => {
    requireUser(user)
    await revokeSessionFromRequest(req)
    noContent(res, { 'Set-Cookie': expiredSessionCookie() })
  }),
]
