import type { ReactElement } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import DeleteIcon from '@mui/icons-material/Delete';
import { useProjectStore } from '@store/useProjectStore';
import { useT } from '@/i18n';

type Props = { readonly position: { x: number; y: number } | null; readonly onClose: () => void };

// Menú contextual del canvas (click derecho) con las operaciones de objeto.
export const CanvasContextMenu = ({ position, onClose }: Props): ReactElement => {
  const copySelected = useProjectStore((s) => s.copySelected);
  const cutSelected = useProjectStore((s) => s.cutSelected);
  const pasteClipboard = useProjectStore((s) => s.pasteClipboard);
  const duplicateSelected = useProjectStore((s) => s.duplicateSelected);
  const flipSelected = useProjectStore((s) => s.flipSelected);
  const deleteSelected = useProjectStore((s) => s.deleteSelected);
  const t = useT();

  const act = (fn: () => void) => () => { fn(); onClose(); };
  const row = (icon: ReactElement, label: string, kbd: string, onClick: () => void): ReactElement => (
    <MenuItem onClick={onClick} dense>
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText>{t(label)}</ListItemText>
      <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>{kbd}</Typography>
    </MenuItem>
  );

  return (
    <Menu
      open={!!position}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={position ? { top: position.y, left: position.x } : undefined}
      slotProps={{ paper: { sx: { minWidth: 200 } } }}
    >
      {row(<ContentCopyIcon fontSize="small" />, 'Duplicar', 'Ctrl+D', act(duplicateSelected))}
      {row(<ContentCopyIcon fontSize="small" />, 'Copiar', 'Ctrl+C', act(copySelected))}
      {row(<ContentCutIcon fontSize="small" />, 'Cortar', 'Ctrl+X', act(cutSelected))}
      {row(<ContentPasteIcon fontSize="small" />, 'Pegar', 'Ctrl+V', act(pasteClipboard))}
      <Divider />
      {row(<SwapHorizIcon fontSize="small" />, 'Voltear horizontal', 'H', act(() => flipSelected('h')))}
      {row(<SwapVertIcon fontSize="small" />, 'Voltear vertical', 'V', act(() => flipSelected('v')))}
      <Divider />
      {row(<DeleteIcon fontSize="small" />, 'Borrar', 'Supr', act(deleteSelected))}
    </Menu>
  );
};
