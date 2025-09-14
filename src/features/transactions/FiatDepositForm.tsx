import { useState } from 'react'
import {
  Box,
  Button,
  Grid2 as Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material'
import { combineDateTime } from '../../lib/datetime'
import { postFiatDeposit } from '../../services/posting'
import { useAppStore } from '../../store/app'

export default function FiatDepositForm() {
  const refreshLedger = useAppStore((s) => s.refreshLedger)
  const refreshBalances = useAppStore((s) => s.refreshBalances)

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState<string>('')
  const [currency, setCurrency] = useState<'USD' | 'EUR'>('USD')
  const [amount, setAmount] = useState<string>('')
  const [rate, setRate] = useState<string>('1.08')
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success'|'error'}>({ open: false, msg: '', severity: 'success' })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = Number(amount)
    const r = Number(rate)
    if (!amt || amt <= 0) return setSnack({ open: true, msg: 'Amount must be > 0', severity: 'error' })
    if (currency === 'EUR' && (!r || r <= 0)) return setSnack({ open: true, msg: 'Provide a valid EUR→USD rate', severity: 'error' })

    setLoading(true)
    try {
      const ts = combineDateTime(date, time)
      await postFiatDeposit({
        ts,
        currency,
        amountInCurrency: amt,
        usdRate: currency === 'EUR' ? r : undefined,
        notes,
      })
      await Promise.all([refreshLedger(), refreshBalances()])
      setSnack({ open: true, msg: 'Deposit posted', severity: 'success' })
      setAmount('')
      setNotes('')
    } catch (e: any) {
      setSnack({ open: true, msg: e?.message || 'Error', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={onSubmit} sx={{ maxWidth: 720 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Fiat Deposit</Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value as any)} fullWidth>
            <MenuItem value="USD">USD</MenuItem>
            <MenuItem value="EUR">EUR</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField label={`Amount (${currency})`} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} fullWidth />
        </Grid>
        {currency === 'EUR' && (
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="EUR→USD rate" type="number" value={rate} onChange={(e) => setRate(e.target.value)} fullWidth />
          </Grid>
        )}
        <Grid size={{ xs: 12 }}>
          <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Button variant="contained" type="submit" disabled={loading}>
            {loading ? 'Posting...' : 'Post Deposit'}
          </Button>
        </Grid>
      </Grid>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}
