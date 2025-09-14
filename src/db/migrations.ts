import type { Database } from 'sql.js'

export async function runMigrations(db: Database) {
  db.exec(`CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);`)
  const version = getVersion(db)
  if (version < 1) {
    migrate0001(db)
    setVersion(db, 1)
  }
}

function getVersion(db: Database): number {
  const res = db.exec(`SELECT value FROM meta WHERE key='schema_version'`)
  if (!res[0] || !res[0].values[0]) return 0
  return Number(res[0].values[0][0])
}

function setVersion(db: Database, v: number) {
  db.exec(`INSERT OR REPLACE INTO meta(key,value) VALUES ('schema_version', '${v}')`)
}

function migrate0001(db: Database) {
  db.exec(`
  BEGIN;
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY,
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ASSET','LIABILITY','EQUITY','INCOME','EXPENSE')),
    parent_id INTEGER,
    currency TEXT
  );
  CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    chain TEXT,
    decimals INTEGER DEFAULT 8
  );
  CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    chain TEXT,
    address TEXT
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY,
    ts TEXT NOT NULL,
    type TEXT NOT NULL,
    notes TEXT
  );
  CREATE TABLE IF NOT EXISTS transaction_lines (
    id INTEGER PRIMARY KEY,
    txn_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    drcr INTEGER NOT NULL CHECK (drcr IN (-1,1)),
    amount_usd REAL NOT NULL DEFAULT 0,
    asset_symbol TEXT,
    qty REAL,
    wallet_id INTEGER
  );
  COMMIT;
  `)
}
