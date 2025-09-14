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

export default function BalancesGrid() {
  const balances = useAppStore((s) => s.balances)
  const refresh = useAppStore((s) => s.refreshBalances)

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Balances (USD)</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Balance USD</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {balances.map((b) => (
              <TableRow key={b.code}>
                <TableCell>{b.code}</TableCell>
                <TableCell>{b.name}</TableCell>
                <TableCell>{b.type}</TableCell>
                <TableCell align="right">{Number(b.balance_usd || 0).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
