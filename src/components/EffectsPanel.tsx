import type { ReactElement } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useProjectStore } from '@store/useProjectStore';

const LabeledSlider = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}): ReactElement => (
  <Box>
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="caption">{value}</Typography>
    </Stack>
    <Slider size="small" value={value} min={min} max={max} step={step} onChange={(_, v) => onChange(v as number)} />
  </Box>
);

const ColorRow = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}): ReactElement => (
  <Stack direction="row" alignItems="center" justifyContent="space-between">
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: 40, height: 28, border: 'none', background: 'none', cursor: 'pointer' }}
    />
  </Stack>
);

export const EffectsPanel = (): ReactElement => {
  const shadow = useProjectStore((s) => s.project.effects.shadow);
  const glow = useProjectStore((s) => s.project.effects.glow);
  const outline = useProjectStore((s) => s.project.effects.outline);
  const setShadow = useProjectStore((s) => s.setShadow);
  const setGlow = useProjectStore((s) => s.setGlow);
  const setOutline = useProjectStore((s) => s.setOutline);

  return (
    <Stack spacing={1}>
      <Typography variant="h6">Efectos</Typography>

      <Accordion disableGutters defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <FormControlLabel
            onClick={(e) => e.stopPropagation()}
            control={
              <Switch
                size="small"
                checked={shadow.enabled}
                onChange={(e) => setShadow({ enabled: e.target.checked })}
              />
            }
            label={<Typography variant="body2" fontWeight={600}>Sombra</Typography>}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1}>
            <ToggleButtonGroup
              size="small"
              exclusive
              fullWidth
              value={shadow.mode}
              onChange={(_, v) => v && setShadow({ mode: v as 'drop' | 'ground' })}
            >
              <ToggleButton value="ground">Piso</ToggleButton>
              <ToggleButton value="drop">Desplazada</ToggleButton>
            </ToggleButtonGroup>
            <ColorRow label="Color" value={shadow.color} onChange={(v) => setShadow({ color: v })} />
            <LabeledSlider label="Opacidad" value={shadow.opacity} min={0} max={1} step={0.05} onChange={(v) => setShadow({ opacity: v })} />
            <LabeledSlider
              label={shadow.mode === 'ground' ? 'Inclinación (°)' : 'Dirección (°)'}
              value={shadow.direction}
              min={shadow.mode === 'ground' ? -80 : 0}
              max={shadow.mode === 'ground' ? 80 : 360}
              step={shadow.mode === 'ground' ? 1 : 5}
              onChange={(v) => setShadow({ direction: v })}
            />
            <LabeledSlider label="Largo / offset" value={shadow.length} min={0} max={40} step={0.5} onChange={(v) => setShadow({ length: v })} />
            {shadow.mode === 'ground' && (
              <LabeledSlider label="Aplastado (piso)" value={shadow.flatten} min={0.02} max={1} step={0.02} onChange={(v) => setShadow({ flatten: v })} />
            )}
            <LabeledSlider label="Desenfoque" value={shadow.blur} min={0} max={20} step={0.5} onChange={(v) => setShadow({ blur: v })} />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <FormControlLabel
            onClick={(e) => e.stopPropagation()}
            control={
              <Switch
                size="small"
                checked={glow.enabled}
                onChange={(e) => setGlow({ enabled: e.target.checked })}
              />
            }
            label={<Typography variant="body2" fontWeight={600}>Brillo (contorno)</Typography>}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1}>
            <ColorRow label="Color" value={glow.color} onChange={(v) => setGlow({ color: v })} />
            <LabeledSlider label="Opacidad" value={glow.opacity} min={0} max={1} step={0.05} onChange={(v) => setGlow({ opacity: v })} />
            <LabeledSlider label="Expansión" value={glow.expansion} min={0} max={12} step={0.5} onChange={(v) => setGlow({ expansion: v })} />
            <LabeledSlider label="Intensidad (difuminado)" value={glow.intensity} min={0} max={16} step={0.5} onChange={(v) => setGlow({ intensity: v })} />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <FormControlLabel
            onClick={(e) => e.stopPropagation()}
            control={
              <Switch
                size="small"
                checked={outline.enabled}
                onChange={(e) => setOutline({ enabled: e.target.checked })}
              />
            }
            label={<Typography variant="body2" fontWeight={600}>Contorno (borde)</Typography>}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1}>
            <ColorRow label="Color" value={outline.color} onChange={(v) => setOutline({ color: v })} />
            <LabeledSlider label="Grosor" value={outline.width} min={0} max={12} step={0.5} onChange={(v) => setOutline({ width: v })} />
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
};
