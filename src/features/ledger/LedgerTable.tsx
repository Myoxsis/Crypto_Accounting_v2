import { useEffect } from 'react'
import { useAppStore } from '../../store/app'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

export default function LedgerTable() {
  const ledger = useAppStore((s) => s.ledger)
  const refresh = useAppStore((s) => s.refreshLedger)

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Ledger</Typography>
      {ledger.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>No transactions yet.</Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Txn ID</TableCell>
                <TableCell>Date/Time</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Account Code</TableCell>
                <TableCell>Account Name</TableCell>
                <TableCell>Side</TableCell>
                <TableCell align="right">Amount USD</TableCell>
                <TableCell>Asset</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ledger.map((r) => (
                <TableRow key={r.line_id}>
                  <TableCell>{r.txn_id}</TableCell>
                  <TableCell>{r.ts}</TableCell>
                  <TableCell>{r.type}</TableCell>
                  <TableCell>{r.account_code}</TableCell>
                  <TableCell>{r.account_name}</TableCell>
                  <TableCell>{r.side}</TableCell>
                  <TableCell align="right">{Number(r.amount_usd).toFixed(2)}</TableCell>
                  <TableCell>{r.asset}</TableCell>
                  <TableCell align="right">{r.qty}</TableCell>
                  <TableCell>{r.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
