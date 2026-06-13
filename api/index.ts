import type { IncomingMessage, ServerResponse } from 'node:http'

interface RewrittenApiRequest extends IncomingMessage {
  query?: Record<string, string | string[] | undefined>
}

function pathValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value.join('/')
  return value ?? null
}

function restoreApiPath(req: RewrittenApiRequest) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const rewrittenPath = pathValue(req.query?.path) ?? url.searchParams.get('path')
  if (!rewrittenPath) return

  url.searchParams.delete('path')
  req.url = `/api/${rewrittenPath.replace(/^\/+/, '')}${url.search}`
}

export default async function handler(req: RewrittenApiRequest, res: ServerResponse) {
  try {
    restoreApiPath(req)
    const { handleApiRequest } = await import('../server/app')
    await handleApiRequest(req, res)
  } catch (error) {
    if (res.headersSent) return
    const message = error instanceof Error ? error.message : 'Unknown server error.'
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'API adapter failed.', message }))
  }
}
