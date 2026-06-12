import pg from 'pg'
import { loadLocalEnv, requireEnv } from './env'

const { Pool } = pg

let poolInstance: pg.Pool | null = null

export interface DbQueryable {
  query<R extends pg.QueryResultRow = pg.QueryResultRow, I = unknown[]>(
    queryTextOrConfig: string | pg.QueryConfig<I>,
    values?: pg.QueryConfigValues<I>,
  ): Promise<pg.QueryResult<R>>
}

interface LazyPool extends DbQueryable {
  connect: () => Promise<pg.PoolClient>
  end: () => Promise<void>
}

function getPool(): pg.Pool {
  if (poolInstance) return poolInstance

  loadLocalEnv()
  const connectionString = requireEnv('DATABASE_URL')
  poolInstance = new Pool({
    connectionString,
    ssl: connectionString.includes('sslmode=require') ? true : undefined,
  })
  return poolInstance
}

export const pool: LazyPool = {
  query: <R extends pg.QueryResultRow = pg.QueryResultRow, I = unknown[]>(
    queryTextOrConfig: string | pg.QueryConfig<I>,
    values?: pg.QueryConfigValues<I>,
  ): Promise<pg.QueryResult<R>> => getPool().query<R, I>(queryTextOrConfig, values),
  connect: (): Promise<pg.PoolClient> => getPool().connect(),
  end: (): Promise<void> => poolInstance?.end() ?? Promise.resolve(),
}

export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('begin')
    const result = await fn(client)
    await client.query('commit')
    return result
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}
