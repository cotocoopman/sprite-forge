import type { ReactElement } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Tooltip from '@mui/material/Tooltip';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import { useProjectStore } from '@store/useProjectStore';

// Giro 3D en 8 direcciones (top-down, sentido horario):
// abajo = de frente (0), derecha = perfil (90), arriba = de espaldas (180),
// izquierda = perfil (270). El personaje "gira" como si mirara esa dirección.
type Dir = { readonly glyph: string; readonly deg: number; readonly row: number; readonly col: number };
const DIRS: readonly Dir[] = [
  { glyph: '↑', deg: 180, row: 0, col: 1 }, // espaldas
  { glyph: '↗', deg: 135, row: 0, col: 2 },
  { glyph: '→', deg: 90, row: 1, col: 2 }, // perfil derecho
  { glyph: '↘', deg: 45, row: 2, col: 2 },
  { glyph: '↓', deg: 0, row: 2, col: 1 }, // de frente
  { glyph: '↙', deg: 315, row: 2, col: 0 },
  { glyph: '←', deg: 270, row: 1, col: 0 }, // perfil izquierdo
  { glyph: '↖', deg: 225, row: 0, col: 0 },
];

export const DirectionDial = (): ReactElement => {
  const facing = useProjectStore((s) => s.project.render.facing);
  const setFacing = useProjectStore((s) => s.setFacing);

  const norm = ((facing % 360) + 360) % 360;

  return (
    <Stack spacing={1} alignItems="center">
      <Typography variant="caption" color="text.secondary">
        Giro 3D (dirección)
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 32px)',
          gridTemplateRows: 'repeat(3, 32px)',
          gap: 0.5,
        }}
      >
        {DIRS.map((d) => (
          <IconButton
            key={d.deg}
            size="small"
            onClick={() => setFacing(d.deg)}
            sx={{
              gridRow: d.row + 1,
              gridColumn: d.col + 1,
              border: '1px solid',
              borderColor: norm === d.deg ? 'primary.main' : 'divider',
              color: norm === d.deg ? 'primary.main' : 'text.secondary',
              borderRadius: 1,
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            {d.glyph}
          </IconButton>
        ))}
        <Tooltip title="De frente (0°)">
          <IconButton
            size="small"
            onClick={() => setFacing(0)}
            sx={{ gridRow: 2, gridColumn: 2, borderRadius: 1 }}
          >
            <CenterFocusStrongIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Slider
        size="small"
        value={norm}
        min={0}
        max={360}
        step={1}
        onChange={(_, v) => setFacing(v as number)}
        sx={{ width: 120 }}
      />
      <Typography variant="caption">{norm}°</Typography>
    </Stack>
  );
};
