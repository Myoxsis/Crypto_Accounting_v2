import { getAccountIdByCode, insertTransaction } from '../db/dao'
import { saveDb } from '../db/sqlite'

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
    amount_usd: Number(amountUSD.toFixed(2)),
    asset_symbol: input.currency,
    qty: input.amountInCurrency,
  }
  const credit = {
    account_id: equityId,
    drcr: -1 as const,
    amount_usd: Number(amountUSD.toFixed(2)),
    asset_symbol: input.currency,
    qty: input.amountInCurrency,
  }

  const txnId = await insertTransaction(
    { ts: input.ts, type: 'Fiat Deposit', notes: input.notes },
    [debit, credit]
  )
  await saveDb()
  return txnId
}
