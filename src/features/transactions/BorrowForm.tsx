import { useState } from 'react'
import {
  Box,
  Button,
  Grid2 as Grid,
  TextField,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material'
import { combineDateTime } from '../../lib/datetime'
import { postBorrowFromDex } from '../../services/posting'
import { useAppStore } from '../../store/app'

export default function BorrowForm() {
  const refreshLedger = useAppStore((s) => s.refreshLedger)
  const refreshBalances = useAppStore((s) => s.refreshBalances)

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState<string>('')
  const [asset, setAsset] = useState<string>('USDC')
  const [qty, setQty] = useState<string>('')
  const [wallet, setWallet] = useState<string>('')
  const [usd, setUsd] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({
    open: false,
    msg: '',
    severity: 'success',
  })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = Number(qty)
    const w = Number(wallet)
    const u = Number(usd)
    if (!q || q <= 0 || !u || u <= 0)
      return setSnack({ open: true, msg: 'Provide amounts > 0', severity: 'error' })
    if (!w) return setSnack({ open: true, msg: 'Wallet ID required', severity: 'error' })
    setLoading(true)
    try {
      const ts = combineDateTime(date, time)
      await postBorrowFromDex({ ts, asset, qty: q, walletId: w, amountUsd: u, notes })
      await Promise.all([refreshLedger(), refreshBalances()])
      setSnack({ open: true, msg: 'Borrow posted', severity: 'success' })
      setQty('')
      setUsd('')
      setWallet('')
    } catch (e: any) {
      setSnack({ open: true, msg: e?.message || 'Error', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={onSubmit} sx={{ maxWidth: 720 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Borrow from DEX
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField label="Asset Symbol" value={asset} onChange={(e) => setAsset(e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField label="Quantity" type="number" value={qty} onChange={(e) => setQty(e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField label="Wallet ID" type="number" value={wallet} onChange={(e) => setWallet(e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField label="USD Amount" type="number" value={usd} onChange={(e) => setUsd(e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Button variant="contained" type="submit" disabled={loading}>
            {loading ? 'Posting...' : 'Post Borrow'}
          </Button>
        </Grid>
      </Grid>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  )
}
