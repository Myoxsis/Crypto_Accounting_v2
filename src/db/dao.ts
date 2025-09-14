import { Sequelize, DataTypes, QueryTypes } from 'sequelize'
import { ensureDbReady } from './sqlite'

interface Models {
  sequelize: Sequelize
  Account: any
  Transaction: any
  TransactionLine: any
}

let modelsPromise: Promise<Models> | null = null

async function initModels(): Promise<Models> {
  if (modelsPromise) return modelsPromise
  modelsPromise = (async () => {
    const sequelize = await ensureDbReady()

    const Account = sequelize.define(
      'accounts',
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        code: DataTypes.STRING,
        name: DataTypes.STRING,
        type: DataTypes.STRING,
        parent_id: DataTypes.INTEGER,
        currency: DataTypes.STRING,
      },
      { tableName: 'accounts', timestamps: false }
    )

    const Transaction = sequelize.define(
      'transactions',
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        ts: DataTypes.STRING,
        type: DataTypes.STRING,
        notes: DataTypes.STRING,
      },
      { tableName: 'transactions', timestamps: false }
    )

    const TransactionLine = sequelize.define(
      'transaction_lines',
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        txn_id: DataTypes.INTEGER,
        account_id: DataTypes.INTEGER,
        drcr: DataTypes.INTEGER,
        amount_usd: DataTypes.FLOAT,
        asset_symbol: DataTypes.STRING,
        qty: DataTypes.FLOAT,
        wallet_id: DataTypes.INTEGER,
      },
      { tableName: 'transaction_lines', timestamps: false }
    )

    TransactionLine.belongsTo(Transaction, { foreignKey: 'txn_id' })
    TransactionLine.belongsTo(Account, { foreignKey: 'account_id' })

    return { sequelize, Account, Transaction, TransactionLine }
  })()

  return modelsPromise
}

export async function listAccounts() {
  const { Account } = await initModels()
  const rows = await (Account as any).findAll({
    attributes: ['id', 'code', 'name', 'type', 'currency'],
    order: [['code', 'ASC']],
    raw: true,
  })
  return rows.map((r: any) => ({ ...r, currency: r.currency || '' }))
}

export async function getAccountIdByCode(code: string) {
  const { Account } = await initModels()
  const account = await (Account as any).findOne({
    where: { code },
    attributes: ['id'],
    raw: true,
  })
  if (!account) throw new Error('Account not found: ' + code)
  return Number(account.id)
}

export async function insertTransaction(
  tx: { ts: string; type: string; notes?: string },
  lines: Array<{ account_id: number; drcr: 1 | -1; amount_usd: number; asset_symbol?: string; qty?: number; wallet_id?: number }>
): Promise<number> {
  const { sequelize, Transaction, TransactionLine } = await initModels()
  return sequelize.transaction(async (t) => {
    const txn = await (Transaction as any).create(
      { ts: tx.ts, type: tx.type, notes: tx.notes },
      { transaction: t }
    )
    const txnId = Number((txn as any).id)
    for (const l of lines) {
      await (TransactionLine as any).create(
        {
          txn_id: txnId,
          account_id: l.account_id,
          drcr: l.drcr,
          amount_usd: l.amount_usd,
          asset_symbol: l.asset_symbol,
          qty: l.qty,
          wallet_id: l.wallet_id,
        },
        { transaction: t }
      )
    }
    return txnId
  })
}

export async function listLedger() {
  const { sequelize } = await initModels()
  return sequelize.query(
    `SELECT tl.id as line_id, t.id as txn_id, t.ts, t.type, a.code as account_code, a.name as account_name,
            CASE WHEN tl.drcr=1 THEN 'DEBIT' ELSE 'CREDIT' END as side,
            ROUND(tl.amount_usd, 2) as amount_usd, COALESCE(tl.asset_symbol,'') as asset, COALESCE(tl.qty,0) as qty, COALESCE(t.notes,'') as notes
     FROM transaction_lines tl
     JOIN transactions t ON t.id = tl.txn_id
     JOIN accounts a ON a.id = tl.account_id
     ORDER BY t.ts DESC, tl.id ASC`,
    { type: QueryTypes.SELECT }
  )
}

export async function balancesByAccount() {
  const { sequelize } = await initModels()
  return sequelize.query(
    `SELECT a.code, a.name, a.type,
            ROUND(SUM(CASE WHEN tl.drcr=1 THEN tl.amount_usd ELSE -tl.amount_usd END), 2) as balance_usd
     FROM accounts a
     LEFT JOIN transaction_lines tl ON tl.account_id = a.id
     GROUP BY a.id
     ORDER BY a.code`,
    { type: QueryTypes.SELECT }
  )
}

