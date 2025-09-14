import { Sequelize, QueryTypes } from 'sequelize'
import { saveDb } from './sqlite'

export async function seedIfEmpty(sequelize: Sequelize) {
  const res = await sequelize.query('SELECT COUNT(1) as count FROM accounts', { type: QueryTypes.SELECT })
  const count = (res[0] as any)?.count || 0
  if (Number(count) > 0) return

  await sequelize.transaction(async (t) => {
    const rows = [
      ['1010', 'Bank – USD', 'ASSET', null, 'USD'],
      ['1011', 'Bank – EUR', 'ASSET', null, 'EUR'],
      ['1100', 'Crypto Assets (Control)', 'ASSET', null, null],
      ['2000', 'Loans from DEX', 'LIABILITY', null, null],
      ['3000', 'Owner Contributions', 'EQUITY', null, null],
      ['3100', 'Owner Draws', 'EQUITY', null, null],
      ['3200', 'Retained Earnings', 'EQUITY', null, null],
      ['4000', 'Realized Gain/Loss', 'INCOME', null, null],
      ['4100', 'Rewards Income', 'INCOME', null, null],
      ['5000', 'Fees – Trading', 'EXPENSE', null, null],
      ['5010', 'Fees – Network/Gas', 'EXPENSE', null, null],
    ] as const

    for (const [code, name, type, parent, currency] of rows) {
      await sequelize.query(
        `INSERT OR IGNORE INTO accounts (code,name,type,parent_id,currency) VALUES (?,?,?,?,?)`,
        { replacements: [code, name, type, parent, currency], transaction: t }
      )
    }
  })

  await saveDb()
}

