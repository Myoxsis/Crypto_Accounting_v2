import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0b72b9' },
    secondary: { main: '#455a64' },
  },
  shape: { borderRadius: 10 },
})

export default theme
