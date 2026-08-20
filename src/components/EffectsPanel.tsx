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
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useProjectStore } from '@store/useProjectStore';
import { NumberInput } from '@components/NumberInput';
import { ColorField } from '@components/ColorField';
import { DEFAULT_EFFECTS } from '@core/poses';
import { useT } from '@/i18n';

const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

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
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <NumberInput
        value={value}
        step={step}
        onChange={(v) => onChange(clamp(v, min, max))}
        inputStyle={{ width: 60, padding: '2px 6px' }}
      />
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
    <ColorField value={value} onChange={onChange} />
  </Stack>
);

// Botón "Restablecer" que vuelve los valores del efecto al default (sin apagarlo).
const ResetEffect = ({ onClick }: { onClick: () => void }): ReactElement => {
  const t = useT();
  return (
    <Button size="small" startIcon={<RestartAltIcon fontSize="small" />} onClick={onClick} sx={{ alignSelf: 'flex-start' }}>
      {t('Restablecer')}
    </Button>
  );
};

export const EffectsPanel = (): ReactElement => {
  const shadow = useProjectStore((s) => s.project.effects.shadow);
  const glow = useProjectStore((s) => s.project.effects.glow);
  const outline = useProjectStore((s) => s.project.effects.outline);
  const setShadow = useProjectStore((s) => s.setShadow);
  const setGlow = useProjectStore((s) => s.setGlow);
  const setOutline = useProjectStore((s) => s.setOutline);
  const t = useT();

  return (
    <Stack spacing={1}>
      <Typography variant="h6">{t('Efectos')}</Typography>

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
            label={<Typography variant="body2" fontWeight={600}>{t('Sombra')}</Typography>}
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
              <ToggleButton value="ground">{t('Piso')}</ToggleButton>
              <ToggleButton value="drop">{t('Desplazada')}</ToggleButton>
            </ToggleButtonGroup>
            <ColorRow label={t('Color')} value={shadow.color} onChange={(v) => setShadow({ color: v })} />
            <LabeledSlider label={t('Opacidad')} value={shadow.opacity} min={0} max={1} step={0.05} onChange={(v) => setShadow({ opacity: v })} />
            <LabeledSlider
              label={shadow.mode === 'ground' ? t('Inclinación (°)') : t('Dirección (°)')}
              value={shadow.direction}
              min={shadow.mode === 'ground' ? -80 : 0}
              max={shadow.mode === 'ground' ? 80 : 360}
              step={shadow.mode === 'ground' ? 1 : 5}
              onChange={(v) => setShadow({ direction: v })}
            />
            <LabeledSlider label={t('Largo / offset')} value={shadow.length} min={0} max={40} step={0.5} onChange={(v) => setShadow({ length: v })} />
            {shadow.mode === 'ground' && (
              <LabeledSlider label={t('Aplastado (piso)')} value={shadow.flatten} min={0.02} max={1} step={0.02} onChange={(v) => setShadow({ flatten: v })} />
            )}
            <LabeledSlider label={t('Desenfoque')} value={shadow.blur} min={0} max={20} step={0.5} onChange={(v) => setShadow({ blur: v })} />
            <ResetEffect onClick={() => setShadow({ ...DEFAULT_EFFECTS.shadow, enabled: shadow.enabled })} />
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
            label={<Typography variant="body2" fontWeight={600}>{t('Brillo (contorno)')}</Typography>}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1}>
            <ColorRow label={t('Color')} value={glow.color} onChange={(v) => setGlow({ color: v })} />
            <LabeledSlider label={t('Opacidad')} value={glow.opacity} min={0} max={1} step={0.05} onChange={(v) => setGlow({ opacity: v })} />
            <LabeledSlider label={t('Expansión')} value={glow.expansion} min={0} max={12} step={0.5} onChange={(v) => setGlow({ expansion: v })} />
            <LabeledSlider label={t('Intensidad (difuminado)')} value={glow.intensity} min={0} max={16} step={0.5} onChange={(v) => setGlow({ intensity: v })} />
            <ResetEffect onClick={() => setGlow({ ...DEFAULT_EFFECTS.glow, enabled: glow.enabled })} />
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
            label={<Typography variant="body2" fontWeight={600}>{t('Contorno (borde)')}</Typography>}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1}>
            <ColorRow label={t('Color')} value={outline.color} onChange={(v) => setOutline({ color: v })} />
            <LabeledSlider label={t('Grosor')} value={outline.width} min={0} max={12} step={0.5} onChange={(v) => setOutline({ width: v })} />
            <ResetEffect onClick={() => setOutline({ ...DEFAULT_EFFECTS.outline, enabled: outline.enabled })} />
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
};
