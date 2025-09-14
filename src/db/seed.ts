import type { Database } from 'sql.js'
import { saveDb } from './sqlite'

export async function seedIfEmpty(db: Database) {
  const res = db.exec(`SELECT COUNT(1) FROM accounts`)
  const count = res[0]?.values?.[0]?.[0] ?? 0
  if (Number(count) > 0) return

  db.exec(`BEGIN;`)

  const rows = [
    ["1010", "Bank – USD", "ASSET", null, "USD"],
    ["1011", "Bank – EUR", "ASSET", null, "EUR"],
    ["1100", "Crypto Assets (Control)", "ASSET", null, null],
    ["3000", "Owner Contributions", "EQUITY", null, null],
    ["3100", "Owner Draws", "EQUITY", null, null],
    ["3200", "Retained Earnings", "EQUITY", null, null],
    ["4000", "Realized Gain/Loss", "INCOME", null, null],
    ["4100", "Rewards Income", "INCOME", null, null],
    ["5000", "Fees – Trading", "EXPENSE", null, null],
    ["5010", "Fees – Network/Gas", "EXPENSE", null, null],
  ] as const

  for (const [code, name, type, parent, currency] of rows) {
    const cur = currency ? `'${currency}'` : 'NULL'
    const par = parent === null ? 'NULL' : String(parent)
    db.exec(
      `INSERT OR IGNORE INTO accounts (code,name,type,parent_id,currency)
       VALUES ('${code}','${name}','${type}',${par},${cur})`
    )
  }

  db.exec(`COMMIT;`)
  await saveDb(db)
}
