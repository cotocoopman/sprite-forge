import { createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';

// Tema según el modo (claro/oscuro). El modo lo decide el navegador
// (prefers-color-scheme) en main.tsx.
export const makeTheme = (mode: PaletteMode): Theme =>
  createTheme({
    palette: {
      mode,
      primary: { main: '#7c9cff' },
      secondary: { main: '#ff9e64' },
      ...(mode === 'dark'
        ? { background: { default: '#0f1116', paper: '#181b22' } }
        : { background: { default: '#f4f6fb', paper: '#ffffff' } }),
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
