import { Sequelize, QueryTypes } from 'sequelize'

export async function runMigrations(sequelize: Sequelize) {
  await sequelize.query('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);')
  const version = await getVersion(sequelize)
  if (version < 1) {
    await migrate0001(sequelize)
    await setVersion(sequelize, 1)
  }
}

async function getVersion(sequelize: Sequelize): Promise<number> {
  const res = await sequelize.query("SELECT value FROM meta WHERE key='schema_version'", { type: QueryTypes.SELECT })
  if (!res[0]) return 0
  const row: any = res[0]
  return Number(row.value || 0)
}

async function setVersion(sequelize: Sequelize, v: number) {
  await sequelize.query("INSERT OR REPLACE INTO meta(key,value) VALUES ('schema_version', ?)", {
    replacements: [String(v)],
  })
}

async function migrate0001(sequelize: Sequelize) {
  await sequelize.transaction(async (t) => {
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY,
        code TEXT UNIQUE,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('ASSET','LIABILITY','EQUITY','INCOME','EXPENSE')),
        parent_id INTEGER,
        currency TEXT
      );`,
      { transaction: t }
    )

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY,
        symbol TEXT NOT NULL,
        name TEXT NOT NULL,
        chain TEXT,
        decimals INTEGER DEFAULT 8
      );`,
      { transaction: t }
    )

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS wallets (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        chain TEXT,
        address TEXT
      );`,
      { transaction: t }
    )

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY,
        ts TEXT NOT NULL,
        type TEXT NOT NULL,
        notes TEXT
      );`,
      { transaction: t }
    )

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS transaction_lines (
        id INTEGER PRIMARY KEY,
        txn_id INTEGER NOT NULL,
        account_id INTEGER NOT NULL,
        drcr INTEGER NOT NULL CHECK (drcr IN (-1,1)),
        amount_usd REAL NOT NULL DEFAULT 0,
        asset_symbol TEXT,
        qty REAL,
        wallet_id INTEGER
      );`,
      { transaction: t }
    )
  })
}

