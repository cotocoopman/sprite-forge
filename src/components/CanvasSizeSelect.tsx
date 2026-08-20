import type { ReactElement } from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { useProjectStore } from '@store/useProjectStore';
import { useT } from '@/i18n';

// Tamaños de celda típicos para sprites 2D.
const SIZES = [16, 32, 48, 64, 128, 256] as const;

// Selector rápido del tamaño del canvas (celda de export). Cambia render.cellSize
// sin alterar el personaje: la silueta se posiciona por ratios, solo cambia la
// resolución del canvas.
export const CanvasSizeSelect = (): ReactElement => {
  const cellSize = useProjectStore((s) => s.project.render.cellSize);
  const setRenderField = useProjectStore((s) => s.setRenderField);
  const t = useT();

  return (
    <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center" flexWrap="wrap" useFlexGap>
      <Tooltip title={t('Tamaño del canvas de exportación (px). No afecta la silueta, solo la resolución.')}>
        <Typography variant="caption" color="text.secondary">
          {t('Canvas')}
        </Typography>
      </Tooltip>
      {SIZES.map((s) => (
        <Button
          key={s}
          size="small"
          variant={cellSize === s ? 'contained' : 'outlined'}
          onClick={() => setRenderField('cellSize', s)}
          sx={{ minWidth: 44, px: 1 }}
        >
          {s}
        </Button>
      ))}
    </Stack>
  );
};
