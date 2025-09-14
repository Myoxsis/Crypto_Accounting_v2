import { create } from 'zustand'
import type { LedgerRow, BalanceRow } from '../domain/types'
import { balancesByAccount, listLedger } from '../db/dao'

interface AppState {
  ledger: LedgerRow[]
  balances: BalanceRow[]
  refreshLedger: () => Promise<void>
  refreshBalances: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  ledger: [],
  balances: [],
  refreshLedger: async () => {
    const rows = await listLedger()
    set({ ledger: rows })
  },
  refreshBalances: async () => {
    const rows = await balancesByAccount()
    set({ balances: rows })
  },
}))
