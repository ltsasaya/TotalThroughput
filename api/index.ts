import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleApiRequest } from '../server/app'

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
  restoreApiPath(req)
  await handleApiRequest(req, res)
}
