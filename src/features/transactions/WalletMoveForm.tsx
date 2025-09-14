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
import { postWalletTransfer, postSupplyToDex, postBridge } from '../../services/posting'
import { useAppStore } from '../../store/app'

type Variant = 'transfer' | 'supply' | 'bridge'

const serviceMap = {
  transfer: postWalletTransfer,
  supply: postSupplyToDex,
  bridge: postBridge,
}

const titleMap = {
  transfer: 'Wallet Transfer',
  supply: 'Supply to DEX',
  bridge: 'Bridge',
}

export default function WalletMoveForm({ variant }: { variant: Variant }) {
  const refreshLedger = useAppStore((s) => s.refreshLedger)
  const refreshBalances = useAppStore((s) => s.refreshBalances)

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState<string>('')
  const [asset, setAsset] = useState<string>('ETH')
  const [qty, setQty] = useState<string>('')
  const [fromWallet, setFromWallet] = useState<string>('')
  const [toWallet, setToWallet] = useState<string>('')
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
    const fw = Number(fromWallet)
    const tw = Number(toWallet)
    if (!q || q <= 0) return setSnack({ open: true, msg: 'Qty must be > 0', severity: 'error' })
    if (!fw || !tw) return setSnack({ open: true, msg: 'Wallet IDs required', severity: 'error' })
    setLoading(true)
    try {
      const ts = combineDateTime(date, time)
      const svc = serviceMap[variant]
      await svc({ ts, asset, qty: q, fromWalletId: fw, toWalletId: tw, notes })
      await Promise.all([refreshLedger(), refreshBalances()])
      setSnack({ open: true, msg: `${titleMap[variant]} posted`, severity: 'success' })
      setQty('')
      setFromWallet('')
      setToWallet('')
    } catch (e: any) {
      setSnack({ open: true, msg: e?.message || 'Error', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={onSubmit} sx={{ maxWidth: 720 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {titleMap[variant]}
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
          <TextField label="From Wallet ID" type="number" value={fromWallet} onChange={(e) => setFromWallet(e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField label="To Wallet ID" type="number" value={toWallet} onChange={(e) => setToWallet(e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Button variant="contained" type="submit" disabled={loading}>
            {loading ? 'Posting...' : `Post ${titleMap[variant]}`}
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
