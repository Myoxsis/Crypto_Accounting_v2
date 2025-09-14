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
import { postSwap } from '../../services/posting'
import { useAppStore } from '../../store/app'

export default function SwapForm() {
  const refreshLedger = useAppStore((s) => s.refreshLedger)
  const refreshBalances = useAppStore((s) => s.refreshBalances)

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState<string>('')
  const [wallet, setWallet] = useState<string>('')
  const [fromAsset, setFromAsset] = useState<string>('')
  const [fromQty, setFromQty] = useState<string>('')
  const [fromUsd, setFromUsd] = useState<string>('')
  const [toAsset, setToAsset] = useState<string>('')
  const [toQty, setToQty] = useState<string>('')
  const [toUsd, setToUsd] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({
    open: false,
    msg: '',
    severity: 'success',
  })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const w = Number(wallet)
    const fq = Number(fromQty)
    const fUsd = Number(fromUsd)
    const tq = Number(toQty)
    const tUsd = Number(toUsd)
    if (!w) return setSnack({ open: true, msg: 'Wallet ID required', severity: 'error' })
    if (!fq || !tq || !fUsd || !tUsd)
      return setSnack({ open: true, msg: 'Provide all amounts', severity: 'error' })
    setLoading(true)
    try {
      const ts = combineDateTime(date, time)
      await postSwap({
        ts,
        fromAsset,
        fromQty: fq,
        fromUsd: fUsd,
        toAsset,
        toQty: tq,
        toUsd: tUsd,
        walletId: w,
        notes,
      })
      await Promise.all([refreshLedger(), refreshBalances()])
      setSnack({ open: true, msg: 'Swap posted', severity: 'success' })
      setFromAsset('')
      setFromQty('')
      setFromUsd('')
      setToAsset('')
      setToQty('')
      setToUsd('')
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
        Swap
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField label="Wallet ID" type="number" value={wallet} onChange={(e) => setWallet(e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}></Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField label="From Asset" value={fromAsset} onChange={(e) => setFromAsset(e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField label="From Qty" type="number" value={fromQty} onChange={(e) => setFromQty(e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField label="From USD" type="number" value={fromUsd} onChange={(e) => setFromUsd(e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}></Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField label="To Asset" value={toAsset} onChange={(e) => setToAsset(e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField label="To Qty" type="number" value={toQty} onChange={(e) => setToQty(e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField label="To USD" type="number" value={toUsd} onChange={(e) => setToUsd(e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Button variant="contained" type="submit" disabled={loading}>
            {loading ? 'Posting...' : 'Post Swap'}
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
