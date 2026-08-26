import type { ReactElement } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useT } from '@/i18n';

type Props = { readonly open: boolean; readonly onClose: () => void };

const ROWS: readonly { keys: string[]; label: string }[] = [
  { keys: ['Space'], label: 'Reproducir / pausar' },
  { keys: ['←', '→'], label: 'Frame anterior / siguiente' },
  { keys: ['Ctrl', 'Z'], label: 'Deshacer' },
  { keys: ['Ctrl', 'Y'], label: 'Rehacer' },
  { keys: ['Ctrl', 'C'], label: 'Copiar objeto o keyframe' },
  { keys: ['Ctrl', 'X'], label: 'Cortar objeto o keyframe' },
  { keys: ['Ctrl', 'V'], label: 'Pegar objeto o keyframe' },
  { keys: ['Ctrl', 'D'], label: 'Duplicar objeto o keyframe' },
  { keys: ['Supr'], label: 'Borrar objeto o keyframe' },
  { keys: ['H'], label: 'Voltear horizontal' },
  { keys: ['V'], label: 'Voltear vertical' },
];

const Key = ({ children }: { children: string }): ReactElement => (
  <Box
    component="kbd"
    sx={{
      fontFamily: 'monospace',
      fontSize: 13,
      px: 1,
      py: 0.25,
      minWidth: 24,
      textAlign: 'center',
      borderRadius: 1,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: 'action.hover',
      boxShadow: '0 1px 0 rgba(0,0,0,0.25)',
    }}
  >
    {children}
  </Box>
);

export const KeyboardShortcuts = ({ open, onClose }: Props): ReactElement => {
  const t = useT();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('Atajos de teclado')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          {ROWS.map((r) => (
            <Stack key={r.label} direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body2">{t(r.label)}</Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                {r.keys.map((k, i) => (
                  <Key key={i}>{k}</Key>
                ))}
              </Stack>
            </Stack>
          ))}
          <Typography variant="caption" color="text.secondary">
            {t('Los atajos no aplican mientras escribís en un campo de texto.')}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Cerrar')}</Button>
      </DialogActions>
    </Dialog>
  );
};
