import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pool, withTransaction } from './db'

async function runMigrations() {
  const migrationsDir = resolve(process.cwd(), 'migrations')
  const files = (await readdir(migrationsDir))
    .filter(file => file.endsWith('.sql'))
    .sort()

  await withTransaction(async (client) => {
    await client.query(`
      create table if not exists schema_migrations (
        id text primary key,
        applied_at timestamptz not null default now()
      )
    `)

    for (const file of files) {
      const applied = await client.query('select 1 from schema_migrations where id = $1', [file])
      if (applied.rowCount) continue
      const sql = await readFile(resolve(migrationsDir, file), 'utf8')
      await client.query(sql)
      await client.query('insert into schema_migrations (id) values ($1)', [file])
    }
  })
}

runMigrations()
  .finally(async () => {
    await pool.end()
  })
