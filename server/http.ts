import type { IncomingMessage, ServerResponse } from 'node:http'

export interface AuthedUser {
  id: string
  username: string
  calibration: UserCalibration | null
}

export interface UserCalibration {
  wpm: number
  rangeLabel: string
  binIndex: number
  serviceDemandMs: number
  updatedAt: string | null
}

export interface RequestContext {
  req: IncomingMessage
  res: ServerResponse
  user: AuthedUser | null
  params: Record<string, string>
  query: URLSearchParams
}

export type HttpMethod = 'GET' | 'POST' | 'DELETE'
export type RouteHandler = (context: RequestContext) => Promise<void>

export interface RouteDefinition {
  method: HttpMethod
  pattern: RegExp
  keys: string[]
  handler: RouteHandler
}

export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function route(method: HttpMethod, pathPattern: string, handler: RouteHandler): RouteDefinition {
  const keys: string[] = []
  const pattern = pathPattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:([A-Za-z0-9_]+)/g, (_match, key: string) => {
      keys.push(key)
      return '([^/]+)'
    })
  return {
    method,
    pattern: new RegExp(`^${pattern}$`),
    keys,
    handler,
  }
}

export function json(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  })
  res.end(JSON.stringify(body))
}

export function noContent(res: ServerResponse, headers: Record<string, string> = {}) {
  res.writeHead(204, {
    'Cache-Control': 'no-store',
    ...headers,
  })
  res.end()
}

export async function readJsonBody(req: IncomingMessage, maxBytes = 16_384): Promise<unknown> {
  const chunks: Buffer[] = []
  let size = 0

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > maxBytes) throw new HttpError(413, 'Request body is too large.')
    chunks.push(buffer)
  }

  if (chunks.length === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON.')
  }
}

export function requireUser(user: AuthedUser | null): AuthedUser {
  if (!user) throw new HttpError(401, 'Sign in required.')
  return user
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {}
  if (!header) return cookies
  for (const part of header.split(';')) {
    const separator = part.indexOf('=')
    if (separator <= 0) continue
    const key = part.slice(0, separator).trim()
    const value = part.slice(separator + 1).trim()
    cookies[key] = decodeURIComponent(value)
  }
  return cookies
}
