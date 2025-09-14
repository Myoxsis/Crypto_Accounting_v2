import initSqlJs, { Database, SqlJsStatic } from 'sql.js'
import { get, set } from 'idb-keyval'

let SQL: SqlJsStatic | null = null
let dbPromise: Promise<Database> | null = null
const DB_KEY = 'crypto-accounting.db'

async function loadSqlJs(): Promise<SqlJsStatic> {
  if (SQL) return SQL
  SQL = await initSqlJs({
    locateFile: (file: string) => `/` + file, // expects sql-wasm.wasm in /public
  })
  return SQL
}

export async function ensureDbReady(): Promise<Database> {
  if (dbPromise) return dbPromise
  dbPromise = (async () => {
    const SQL = await loadSqlJs()
    const buf = await get<Uint8Array>(DB_KEY).catch(() => undefined)
    const db = buf ? new SQL.Database(buf) : new SQL.Database()
    return db
  })()
  return dbPromise
}

let saveScheduled = false
export async function saveDb(db?: Database) {
  const database = db || (await ensureDbReady())
  if (saveScheduled) return
  saveScheduled = true
  const run = async () => {
    try {
      const data = database.export()
      await set(DB_KEY, data)
    } finally {
      saveScheduled = false
    }
  }
  if ('requestIdleCallback' in window) {
    ;(window as any).requestIdleCallback(run, { timeout: 1000 })
  } else {
    setTimeout(run, 300)
  }
}
