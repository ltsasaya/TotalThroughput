import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { HttpError, json, type RouteDefinition } from './http'
import { resolveUserFromRequest } from './sessions'
import { authRoutes } from './routes/auth'
import { classRoutes } from './routes/classes'
import { globalDataRoutes } from './routes/globalData'
import { profileRoutes } from './routes/profile'
import { runRoutes } from './routes/runs'

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
    json(res, 500, { error: 'Server error.' })
  }
}

export function createAppServer() {
  return createServer(handleApiRequest)
}
