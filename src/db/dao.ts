import type { Database } from 'sql.js'
import { ensureDbReady, saveDb } from './sqlite'

export async function listAccounts() {
  const db = await ensureDbReady()
  const res = db.exec(`SELECT id, code, name, type, COALESCE(currency,'') as currency FROM accounts ORDER BY code`)
  return mapRows(res)
}

export async function getAccountIdByCode(code: string) {
  const db = await ensureDbReady()
  const res = db.exec(`SELECT id FROM accounts WHERE code='${code}' LIMIT 1`)
  const rows = mapRows(res)
  if (!rows[0]) throw new Error('Account not found: ' + code)
  return Number(rows[0].id)
}

export async function insertTransaction(
  tx: { ts: string; type: string; notes?: string },
  lines: Array<{ account_id: number; drcr: 1 | -1; amount_usd: number; asset_symbol?: string; qty?: number; wallet_id?: number }>
): Promise<number> {
  const db = await ensureDbReady()
  db.exec('BEGIN;')
  try {
    db.exec(`INSERT INTO transactions (ts,type,notes) VALUES ('${tx.ts}','${tx.type}',${tx.notes ? `'${escapeQuote(tx.notes)}'` : 'NULL'})`)
    const txnId = Number(db.exec('SELECT last_insert_rowid() as id')[0].values[0][0])
    for (const l of lines) {
      db.exec(`INSERT INTO transaction_lines (txn_id,account_id,drcr,amount_usd,asset_symbol,qty,wallet_id)
               VALUES (${txnId},${l.account_id},${l.drcr},${l.amount_usd},${l.asset_symbol ? `'${escapeQuote(l.asset_symbol)}'` : 'NULL'},${l.qty ?? 'NULL'},${l.wallet_id ?? 'NULL'})`)
    }
    db.exec('COMMIT;')
    await saveDb(db)
    return txnId
  } catch (e) {
    db.exec('ROLLBACK;')
    throw e
  }
}

export async function listLedger() {
  const db = await ensureDbReady()
  const res = db.exec(`
    SELECT tl.id as line_id, t.id as txn_id, t.ts, t.type, a.code as account_code, a.name as account_name,
           CASE WHEN tl.drcr=1 THEN 'DEBIT' ELSE 'CREDIT' END as side,
           ROUND(tl.amount_usd, 2) as amount_usd, COALESCE(tl.asset_symbol,'') as asset, COALESCE(tl.qty,0) as qty, COALESCE(t.notes,'') as notes
    FROM transaction_lines tl
    JOIN transactions t ON t.id = tl.txn_id
    JOIN accounts a ON a.id = tl.account_id
    ORDER BY t.ts DESC, tl.id ASC
  `)
  return mapRows(res)
}

export async function balancesByAccount() {
  const db = await ensureDbReady()
  const res = db.exec(`
    SELECT a.code, a.name, a.type,
           ROUND(SUM(CASE WHEN tl.drcr=1 THEN tl.amount_usd ELSE -tl.amount_usd END), 2) as balance_usd
    FROM accounts a
    LEFT JOIN transaction_lines tl ON tl.account_id = a.id
    GROUP BY a.id
    ORDER BY a.code
  `)
  return mapRows(res)
}

function mapRows(res: any[]) {
  if (!res[0]) return []
  const cols = res[0].columns
  return res[0].values.map((row: any[]) => Object.fromEntries(row.map((v, i) => [cols[i], v])))
}

function escapeQuote(s: string) {
  return s.replace(/'/g, "''")
}
