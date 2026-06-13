import { pool } from './db.js'
import { createAppServer } from './app.js'

const port = Number(process.env.PORT ?? 8787)
const server = createAppServer()

server.listen(port)

async function shutdown() {
  server.close()
  await pool.end()
}

process.on('SIGINT', () => {
  void shutdown().then(() => process.exit(0))
})

process.on('SIGTERM', () => {
  void shutdown().then(() => process.exit(0))
})
