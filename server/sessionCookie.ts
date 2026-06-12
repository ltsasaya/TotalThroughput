const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

function cookieBase() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`
}

export function sessionCookie(token: string): string {
  return `tt_session=${encodeURIComponent(token)}; ${cookieBase()}`
}

export function expiredSessionCookie(): string {
  return 'tt_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
}
