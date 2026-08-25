import type { ReactElement } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Tooltip from '@mui/material/Tooltip';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import { NumberInput } from '@components/NumberInput';
import { useT } from '@/i18n';

// Dial de 8 direcciones + slider (0..360). Reutilizado por el giro 3D del humanoide
// (facing) y el giro en el plano del rig (rotation), para que ambos se vean igual.
type Dir = { readonly glyph: string; readonly deg: number; readonly row: number; readonly col: number };
// Convención de pantalla: 0° = derecha (→), aumentando en sentido horario.
//   →0 · ↘45 · ↓90 · ↙135 · ←180 · ↖225 · ↑270 · ↗315
const DIRS: readonly Dir[] = [
  { glyph: '↑', deg: 270, row: 0, col: 1 },
  { glyph: '↗', deg: 315, row: 0, col: 2 },
  { glyph: '→', deg: 0, row: 1, col: 2 },
  { glyph: '↘', deg: 45, row: 2, col: 2 },
  { glyph: '↓', deg: 90, row: 2, col: 1 },
  { glyph: '↙', deg: 135, row: 2, col: 0 },
  { glyph: '←', deg: 180, row: 1, col: 0 },
  { glyph: '↖', deg: 225, row: 0, col: 0 },
];

type Props = {
  readonly label: string;
  readonly value: number;
  readonly onChange: (deg: number) => void;
  readonly resetTitle: string;
};

export const Dial = ({ label, value, onChange, resetTitle }: Props): ReactElement => {
  const t = useT();
  const norm = ((value % 360) + 360) % 360;
  // Ingreso manual: envuelve a [0, 359] (360 = 0). Redondea a grados enteros.
  const setDeg = (v: number): void => onChange(((Math.round(v) % 360) + 360) % 360);

  return (
    <Stack spacing={1} alignItems="center">
      <Typography variant="caption" color="text.secondary">
        {t(label)}
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
            onClick={() => onChange(d.deg)}
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
        <Tooltip title={t(resetTitle)}>
          <IconButton size="small" onClick={() => onChange(0)} sx={{ gridRow: 2, gridColumn: 2, borderRadius: 1 }}>
            <CenterFocusStrongIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Slider size="small" value={norm} min={0} max={360} step={1} onChange={(_, v) => onChange(v as number)} sx={{ width: 120 }} />
      <Stack direction="row" spacing={0.5} alignItems="center">
        <NumberInput
          value={norm}
          min={0}
          step={1}
          onChange={setDeg}
          inputStyle={{ width: 44, padding: '2px 6px', textAlign: 'center' }}
        />
        <Typography variant="caption" color="text.secondary">°</Typography>
      </Stack>
    </Stack>
  );
};
