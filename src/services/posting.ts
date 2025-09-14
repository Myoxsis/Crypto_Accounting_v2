import { getAccountIdByCode, insertTransaction } from '../db/dao'
import { saveDb } from '../db/sqlite'

function round2(n: number) {
  return Number(n.toFixed(2))
}

function validateBalanced(lines: Array<{ drcr: 1 | -1; amount_usd: number }>) {
  const sum = lines.reduce((s, l) => s + l.drcr * l.amount_usd, 0)
  if (Math.abs(sum) > 0.01) throw new Error('Unbalanced transaction')
}

export async function postFiatDeposit(input: {
  ts: string
  currency: 'USD' | 'EUR'
  amountInCurrency: number
  usdRate?: number
  notes?: string
}): Promise<number> {
  if (input.amountInCurrency <= 0) throw new Error('Amount must be > 0')
  const amountUSD = input.currency === 'USD' ? input.amountInCurrency : (input.usdRate || 0) * input.amountInCurrency
  if (!isFinite(amountUSD) || amountUSD <= 0) throw new Error('Invalid EUR→USD rate or amount')

  const bankCode = input.currency === 'USD' ? '1010' : '1011'
  const bankId = await getAccountIdByCode(bankCode)
  const equityId = await getAccountIdByCode('3000')

  const debit = {
    account_id: bankId,
    drcr: 1 as const,
    amount_usd: round2(amountUSD),
    asset_symbol: input.currency,
    qty: input.amountInCurrency,
  }
  const credit = {
    account_id: equityId,
    drcr: -1 as const,
    amount_usd: round2(amountUSD),
    asset_symbol: input.currency,
    qty: input.amountInCurrency,
  }

  validateBalanced([debit, credit])

  const txnId = await insertTransaction(
    { ts: input.ts, type: 'Fiat Deposit', notes: input.notes },
    [debit, credit]
  )
  await saveDb()
  return txnId
}

export async function postFiatWithdrawal(input: {
  ts: string
  currency: 'USD' | 'EUR'
  amountInCurrency: number
  usdRate?: number
  notes?: string
}): Promise<number> {
  if (input.amountInCurrency <= 0) throw new Error('Amount must be > 0')
  const amountUSD =
    input.currency === 'USD' ? input.amountInCurrency : (input.usdRate || 0) * input.amountInCurrency
  if (!isFinite(amountUSD) || amountUSD <= 0) throw new Error('Invalid EUR→USD rate or amount')

  const bankCode = input.currency === 'USD' ? '1010' : '1011'
  const bankId = await getAccountIdByCode(bankCode)
  const drawsId = await getAccountIdByCode('3100')

  const debit = {
    account_id: drawsId,
    drcr: 1 as const,
    amount_usd: round2(amountUSD),
    asset_symbol: input.currency,
    qty: input.amountInCurrency,
  }
  const credit = {
    account_id: bankId,
    drcr: -1 as const,
    amount_usd: round2(amountUSD),
    asset_symbol: input.currency,
    qty: input.amountInCurrency,
  }

  validateBalanced([debit, credit])

  const txnId = await insertTransaction(
    { ts: input.ts, type: 'Withdrawal', notes: input.notes },
    [debit, credit]
  )
  await saveDb()
  return txnId
}

async function postWalletMove(input: {
  ts: string
  type: string
  asset: string
  qty: number
  fromWalletId: number
  toWalletId: number
  notes?: string
}) {
  if (input.qty <= 0) throw new Error('Quantity must be > 0')
  const assetAccount = await getAccountIdByCode('1100')
  const amountUSD = 0

  const debit = {
    account_id: assetAccount,
    drcr: 1 as const,
    amount_usd: amountUSD,
    asset_symbol: input.asset,
    qty: input.qty,
    wallet_id: input.toWalletId,
  }
  const credit = {
    account_id: assetAccount,
    drcr: -1 as const,
    amount_usd: amountUSD,
    asset_symbol: input.asset,
    qty: input.qty,
    wallet_id: input.fromWalletId,
  }

  validateBalanced([debit, credit])

  const txnId = await insertTransaction(
    { ts: input.ts, type: input.type, notes: input.notes },
    [debit, credit]
  )
  await saveDb()
  return txnId
}

export async function postWalletTransfer(input: {
  ts: string
  asset: string
  qty: number
  fromWalletId: number
  toWalletId: number
  notes?: string
}) {
  return postWalletMove({ ...input, type: 'Wallet Transfer' })
}

export async function postSupplyToDex(input: {
  ts: string
  asset: string
  qty: number
  fromWalletId: number
  dexWalletId: number
  notes?: string
}) {
  return postWalletMove({
    ts: input.ts,
    type: 'Supply to DEX',
    asset: input.asset,
    qty: input.qty,
    fromWalletId: input.fromWalletId,
    toWalletId: input.dexWalletId,
    notes: input.notes,
  })
}

export async function postBridge(input: {
  ts: string
  asset: string
  qty: number
  fromWalletId: number
  toWalletId: number
  notes?: string
}) {
  return postWalletMove({ ...input, type: 'Bridge' })
}

export async function postBorrowFromDex(input: {
  ts: string
  asset: string
  qty: number
  walletId: number
  amountUsd: number
  notes?: string
}) {
  if (input.qty <= 0 || input.amountUsd <= 0) throw new Error('Amounts must be > 0')
  const assetAccount = await getAccountIdByCode('1100')
  const loanAccount = await getAccountIdByCode('2000')

  const debit = {
    account_id: assetAccount,
    drcr: 1 as const,
    amount_usd: round2(input.amountUsd),
    asset_symbol: input.asset,
    qty: input.qty,
    wallet_id: input.walletId,
  }
  const credit = {
    account_id: loanAccount,
    drcr: -1 as const,
    amount_usd: round2(input.amountUsd),
  }

  validateBalanced([debit, credit])

  const txnId = await insertTransaction(
    { ts: input.ts, type: 'Borrow from DEX', notes: input.notes },
    [debit, credit]
  )
  await saveDb()
  return txnId
}

export async function postSwap(input: {
  ts: string
  fromAsset: string
  fromQty: number
  fromUsd: number
  toAsset: string
  toQty: number
  toUsd: number
  walletId: number
  notes?: string
}) {
  if (input.fromQty <= 0 || input.toQty <= 0 || input.fromUsd <= 0 || input.toUsd <= 0)
    throw new Error('Amounts must be > 0')
  const assetAccount = await getAccountIdByCode('1100')
  const gainLossId = await getAccountIdByCode('4000')

  const debit = {
    account_id: assetAccount,
    drcr: 1 as const,
    amount_usd: round2(input.toUsd),
    asset_symbol: input.toAsset,
    qty: input.toQty,
    wallet_id: input.walletId,
  }
  const credit = {
    account_id: assetAccount,
    drcr: -1 as const,
    amount_usd: round2(input.fromUsd),
    asset_symbol: input.fromAsset,
    qty: input.fromQty,
    wallet_id: input.walletId,
  }

  const diff = round2(input.toUsd - input.fromUsd)
  const lines = [debit, credit]
  if (Math.abs(diff) > 0.01) {
    const gl = {
      account_id: gainLossId,
      drcr: diff > 0 ? -1 : 1,
      amount_usd: Math.abs(diff),
    }
    lines.push(gl)
  }

  validateBalanced(lines)

  const txnId = await insertTransaction(
    { ts: input.ts, type: 'Swap', notes: input.notes },
    lines
  )
  await saveDb()
  return txnId
}

export { validateBalanced }
