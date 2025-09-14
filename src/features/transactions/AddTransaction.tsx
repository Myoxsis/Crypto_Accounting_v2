import { useState, ComponentType } from 'react'
import { Box, MenuItem, TextField } from '@mui/material'
import FiatDepositForm from './FiatDepositForm'
import WithdrawalForm from './WithdrawalForm'
import WalletMoveForm from './WalletMoveForm'
import BorrowForm from './BorrowForm'
import SwapForm from './SwapForm'

const forms: Record<string, ComponentType<any>> = {
  'Fiat Deposit': FiatDepositForm,
  Withdrawal: WithdrawalForm,
  'Wallet Transfer': () => <WalletMoveForm variant="transfer" />,
  'Supply to DEX': () => <WalletMoveForm variant="supply" />,
  'Borrow from DEX': BorrowForm,
  Swap: SwapForm,
  Bridge: () => <WalletMoveForm variant="bridge" />,
}

export default function AddTransaction() {
  const [type, setType] = useState<keyof typeof forms>('Fiat Deposit')
  const FormComponent = forms[type]
  return (
    <Box sx={{ maxWidth: 800 }}>
      <TextField
        select
        label="Transaction Type"
        value={type}
        onChange={(e) => setType(e.target.value as keyof typeof forms)}
        sx={{ mb: 2 }}
      >
        {Object.keys(forms).map((t) => (
          <MenuItem key={t} value={t}>
            {t}
          </MenuItem>
        ))}
      </TextField>
      <FormComponent />
    </Box>
  )
}
