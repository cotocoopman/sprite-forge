import type { ReactElement } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import Divider from '@mui/material/Divider';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useProjectStore } from '@store/useProjectStore';
import { NumberInput } from '@components/NumberInput';
import { ColorField } from '@components/ColorField';
import { useT } from '@/i18n';
import { DEFAULT_CHARACTER } from '@core/rig';
import type { CharacterDefinition, CurveTarget } from '@core/rig';

type FieldConfig = {
  readonly key: keyof CharacterDefinition;
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
};

type CurveKind = 'arm' | 'leg';
type FieldGroup = {
  readonly title: string;
  readonly fields: readonly FieldConfig[];
  readonly curve?: CurveKind;
};

const GROUPS: readonly FieldGroup[] = [
  {
    title: 'Cabeza y cuello',
    fields: [
      { key: 'headDiameter', label: 'Diámetro cabeza', min: 5, max: 60, step: 0.1 },
      { key: 'neckLength', label: 'Cuello (separación cabeza)', min: -15, max: 40, step: 0.5 },
    ],
  },
  {
    title: 'Torso',
    fields: [
      { key: 'torsoHeight', label: 'Alto torso', min: 5, max: 50, step: 0.1 },
      { key: 'torsoWidth', label: 'Ancho torso', min: 5, max: 50, step: 0.1 },
    ],
  },
  {
    title: 'Brazos',
    curve: 'arm',
    fields: [
      { key: 'shoulderDistance', label: 'Distancia hombro', min: 0, max: 40, step: 0.1 },
      { key: 'armSpacing', label: 'Separación brazos', min: -8, max: 30, step: 0.5 },
      { key: 'armWidth', label: 'Ancho brazo', min: 1, max: 12, step: 0.1 },
      { key: 'armUpperLength', label: 'Largo brazo superior', min: 2, max: 25, step: 0.1 },
      { key: 'armLowerLength', label: 'Largo antebrazo', min: 2, max: 25, step: 0.1 },
      { key: 'armCurveUpper', label: 'Curvatura brazo superior', min: -0.6, max: 0.6, step: 0.02 },
      { key: 'armCurveLower', label: 'Curvatura antebrazo', min: -0.6, max: 0.6, step: 0.02 },
    ],
  },
  {
    title: 'Piernas y pies',
    curve: 'leg',
    fields: [
      { key: 'legHeight', label: 'Alto piernas', min: 5, max: 70, step: 0.1 },
      { key: 'hipOffset', label: 'Separación caderas', min: 0, max: 15, step: 0.1 },
      { key: 'legWidth', label: 'Ancho pierna', min: 1, max: 15, step: 0.1 },
      { key: 'legUpperRatio', label: 'Ratio muslo', min: 0.2, max: 0.8, step: 0.01 },
      { key: 'legCurveUpper', label: 'Curvatura muslo', min: -0.6, max: 0.6, step: 0.02 },
      { key: 'legCurveLower', label: 'Curvatura pantorrilla', min: -0.6, max: 0.6, step: 0.02 },
      { key: 'footLength', label: 'Largo pie', min: 0, max: 20, step: 0.1 },
      { key: 'footWidth', label: 'Ancho pie', min: 1, max: 10, step: 0.1 },
    ],
  },
];

const NumberField = ({ config }: { config: FieldConfig }): ReactElement => {
  const value = useProjectStore((s) => s.project.character[config.key] as number);
  const setCharacterField = useProjectStore((s) => s.setCharacterField);
  const t = useT();

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">
          {t(config.label)}
        </Typography>
        <NumberInput
          value={value}
          step={config.step}
          onChange={(v) => setCharacterField(config.key, v)}
          inputStyle={{ width: 64, padding: '2px 6px' }}
        />
      </Stack>
      <Slider
        size="small"
        value={value}
        min={config.min}
        max={config.max}
        step={config.step}
        onChange={(_, v) => setCharacterField(config.key, v as number)}
      />
    </Box>
  );
};

const CurveTargetToggle = ({ kind }: { kind: CurveKind }): ReactElement => {
  const target = useProjectStore((s) =>
    kind === 'arm' ? s.project.character.armCurveTarget : s.project.character.legCurveTarget,
  );
  const setArm = useProjectStore((s) => s.setArmCurveTarget);
  const setLeg = useProjectStore((s) => s.setLegCurveTarget);
  const apply = (tgt: CurveTarget): void => (kind === 'arm' ? setArm(tgt) : setLeg(tgt));
  const t = useT();

  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {t('Curvatura aplica a')}
      </Typography>
      <ToggleButtonGroup
        size="small"
        exclusive
        fullWidth
        value={target ?? 'both'}
        onChange={(_, v) => v && apply(v as CurveTarget)}
      >
        <ToggleButton value="both">{t('Ambos')}</ToggleButton>
        <ToggleButton value="near">{t('Derecha')}</ToggleButton>
        <ToggleButton value="far">{t('Izquierda')}</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export const CharacterPanel = (): ReactElement => {
  const color = useProjectStore((s) => s.project.character.color);
  const headDiameter = useProjectStore((s) => s.project.character.headDiameter);
  const torsoHeight = useProjectStore((s) => s.project.character.torsoHeight);
  const legHeight = useProjectStore((s) => s.project.character.legHeight);
  const setColor = useProjectStore((s) => s.setColor);

  const t = useT();
  const sum = headDiameter + torsoHeight + legHeight;
  const sumOk = Math.abs(sum - 100) < 0.05;

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" fontWeight={700}>{t('Personaje')}</Typography>

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="caption" color="text.secondary">
            {t('Suma cabeza + torso + piernas')}
          </Typography>
          <Typography variant="body2" color={sumOk ? 'success.main' : 'error.main'} fontWeight={700}>
            {sum.toFixed(1)} / 100 {sumOk ? '✓' : t('(no cierra)')}
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2">{t('Color')}</Typography>
          <ColorField
            value={color}
            onChange={setColor}
            onReset={() => setColor(DEFAULT_CHARACTER.color)}
            canReset={color.toLowerCase() !== DEFAULT_CHARACTER.color.toLowerCase()}
          />
        </Stack>
      </Stack>

      <Divider />

      {GROUPS.map((group, gi) => (
        <Accordion key={group.title} disableGutters defaultExpanded={gi === 0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2" fontWeight={600}>
              {t(group.title)}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.5}>
              {group.fields.map((f) => (
                <NumberField key={f.key} config={f} />
              ))}
              {group.curve && <CurveTargetToggle kind={group.curve} />}
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}

    </Stack>
  );
};
