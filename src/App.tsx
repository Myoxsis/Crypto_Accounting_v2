import { useEffect, useState } from 'react'
import {
  AppBar,
  Box,
  Container,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material'
import { ensureDbReady } from './db/sqlite'
import { runMigrations } from './db/migrations'
import { seedIfEmpty } from './db/seed'
import FiatDepositForm from './features/transactions/FiatDepositForm'
import LedgerTable from './features/ledger/LedgerTable'
import BalancesGrid from './features/balances/BalancesGrid'

export default function App() {
  const [tab, setTab] = useState(0)
  const [bootMsg, setBootMsg] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const db = await ensureDbReady()
        await runMigrations(db)
        await seedIfEmpty(db)
        setBootMsg('Database ready')
      } catch (e: any) {
        setBootMsg('Error initializing DB: ' + e?.message)
      }
    })()
  }, [])

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Crypto Accounting (Local, Browser)
          </Typography>
          <Typography variant="body2">Functional currency: USD</Typography>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 3, flex: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Add Transaction" />
          <Tab label="Ledger" />
          <Tab label="Balances" />
        </Tabs>

        {tab === 0 && <FiatDepositForm />}
        {tab === 1 && <LedgerTable />}
        {tab === 2 && <BalancesGrid />}
      </Container>

      <Box component="footer" sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        v0.1 • Local only • No auth
      </Box>

      <Snackbar
        open={!!bootMsg}
        autoHideDuration={3000}
        onClose={() => setBootMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" sx={{ width: '100%' }} onClose={() => setBootMsg(null)}>
          {bootMsg}
        </Alert>
      </Snackbar>
    </Box>
  )
}
