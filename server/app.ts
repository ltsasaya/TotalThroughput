import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { HttpError, json, type RouteDefinition } from './http.js'
import { resolveUserFromRequest } from './sessions.js'
import { authRoutes } from './routes/auth.js'
import { classRoutes } from './routes/classes.js'
import { globalDataRoutes } from './routes/globalData.js'
import { profileRoutes } from './routes/profile.js'
import { runRoutes } from './routes/runs.js'

const routes: RouteDefinition[] = [
  ...authRoutes,
  ...profileRoutes,
  ...classRoutes,
  ...globalDataRoutes,
  ...runRoutes,
]

function assertSameOriginForMutation(req: IncomingMessage) {
  const method = req.method ?? 'GET'
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return
  const origin = req.headers.origin
  const host = req.headers.host
  if (!origin || !host) return
  const originUrl = new URL(origin)
  if (originUrl.host === host) return

  const hostName = host.split(':')[0]
  const localHosts = new Set(['localhost', '127.0.0.1', '::1'])
  if (
    process.env.NODE_ENV !== 'production' &&
    localHosts.has(originUrl.hostname) &&
    localHosts.has(hostName)
  ) {
    return
  }

  throw new HttpError(403, 'Cross-origin request rejected.')
}

function deploymentErrorDetail(error: unknown): string | null {
  if (!(error instanceof Error)) return null
  const message = error.message
  if (message.startsWith('Missing required environment variable:')) return message
  if (message.includes('does not exist')) return message
  if (message.includes('permission denied')) return message
  if (message.includes('password authentication failed')) return 'Database authentication failed.'
  if (
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('ETIMEDOUT')
  ) {
    return 'Database connection failed.'
  }
  return null
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse) {
  try {
    assertSameOriginForMutation(req)
    const url = new URL(req.url ?? '/', 'http://localhost')
    const method = req.method ?? 'GET'
    const matchedRoute = routes.find(candidate => (
      candidate.method === method && candidate.pattern.test(url.pathname)
    ))

    if (!matchedRoute) {
      json(res, 404, { error: 'Not found.' })
      return
    }

    const match = matchedRoute.pattern.exec(url.pathname)
    const params: Record<string, string> = {}
    matchedRoute.keys.forEach((key, index) => {
      params[key] = decodeURIComponent(match?.[index + 1] ?? '')
    })

    await matchedRoute.handler({
      req,
      res,
      user: await resolveUserFromRequest(req),
      params,
      query: url.searchParams,
    })
  } catch (error) {
    if (error instanceof HttpError) {
      json(res, error.status, { error: error.message })
      return
    }
    const detail = deploymentErrorDetail(error)
    json(res, 500, detail ? { error: 'Server error.', detail } : { error: 'Server error.' })
  }
}

export function createAppServer() {
  return createServer(handleApiRequest)
}
