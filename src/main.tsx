import { StrictMode, useMemo } from 'react';
import type { ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Analytics } from '@vercel/analytics/react';
import { makeTheme } from './theme';
import { App } from './App';

// El modo claro/oscuro sigue la preferencia del navegador y reacciona en vivo.
const Root = (): ReactElement => {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true });
  const theme = useMemo(() => makeTheme(prefersDark ? 'dark' : 'light'), [prefersDark]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
      <Analytics />
    </ThemeProvider>
  );
};

const container = document.getElementById('root');
if (!container) throw new Error('No se encontró el elemento #root');

createRoot(container).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
