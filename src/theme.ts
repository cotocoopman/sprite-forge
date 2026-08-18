import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7c9cff' },
    secondary: { main: '#ff9e64' },
    background: { default: '#0f1116', paper: '#181b22' },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiAccordion: {
      styleOverrides: { root: { backgroundImage: 'none', '&:before': { display: 'none' } } },
    },
  },
});
