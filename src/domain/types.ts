export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'

export interface LedgerRow {
  line_id: number
  txn_id: number
  ts: string
  type: string
  account_code: string
  account_name: string
  side: 'DEBIT' | 'CREDIT'
  amount_usd: number
  asset: string
  qty: number
  notes: string
}

export interface BalanceRow {
  code: string
  name: string
  type: AccountType
  balance_usd: number
}
