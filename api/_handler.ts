import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleApiRequest } from '../server/app'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await handleApiRequest(req, res)
}
