import type { ReactElement } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FlipIcon from '@mui/icons-material/Flip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import { useProjectStore } from '@store/useProjectStore';
import { useActiveClip } from '@/hooks/useActiveClip';
import { NumberInput } from '@components/NumberInput';
import { useT } from '@/i18n';
import { usePersistedExpanded } from '@/hooks/usePersistedExpanded';
import type { PartName, PoseNumericKey } from '@core/rig';
import type { EasingKind } from '@core/poses';
import { frameToT, poseAt } from '@core/poses';

const EASINGS: readonly { value: EasingKind; label: string; desc: string }[] = [
  { value: 'linear', label: 'Lineal', desc: 'Velocidad constante de principio a fin' },
  { value: 'easeIn', label: 'Ease-in', desc: 'Arranca lento y acelera hacia el final' },
  { value: 'easeOut', label: 'Ease-out', desc: 'Arranca rápido y frena al final' },
  { value: 'easeInOut', label: 'Ease-in-out', desc: 'Suave al inicio y al final, rápido en el medio' },
];

const easingLabel = (v: EasingKind): string => EASINGS.find((e) => e.value === v)?.label ?? String(v);

type Joint = { readonly key: PoseNumericKey; readonly label: string; readonly min: number; readonly max: number };
type PartOffsetTarget = { readonly part: PartName; readonly label: string };
type Group = {
  readonly title: string;
  readonly joints: readonly Joint[];
  // Partes cuyo desplazamiento X/Y se puede animar por frame dentro de este grupo.
  readonly offsets?: readonly PartOffsetTarget[];
};

const GROUPS: readonly Group[] = [
  {
    title: 'Root',
    joints: [
      { key: 'rootOffsetY', label: 'Offset Y', min: -40, max: 40 },
      { key: 'rootRotation', label: 'Rotación global', min: -180, max: 180 },
    ],
  },
  {
    title: 'Torso',
    joints: [
      { key: 'torsoLean', label: 'Inclinación', min: -180, max: 180 },
      { key: 'headTilt', label: 'Cabeza', min: -180, max: 180 },
    ],
    offsets: [
      { part: 'torso', label: 'Torso' },
      { part: 'head', label: 'Cabeza' },
    ],
  },
  {
    title: 'Brazo derecho',
    joints: [
      { key: 'armNearUpper', label: 'Superior', min: -180, max: 180 },
      { key: 'armNearLower', label: 'Antebrazo', min: -180, max: 180 },
    ],
    offsets: [{ part: 'armNear', label: 'Brazo derecho' }],
  },
  {
    title: 'Brazo izquierdo',
    joints: [
      { key: 'armFarUpper', label: 'Superior', min: -180, max: 180 },
      { key: 'armFarLower', label: 'Antebrazo', min: -180, max: 180 },
    ],
    offsets: [{ part: 'armFar', label: 'Brazo izquierdo' }],
  },
  {
    title: 'Pierna derecha',
    joints: [
      { key: 'legNearUpper', label: 'Muslo', min: -180, max: 180 },
      { key: 'legNearLower', label: 'Pantorrilla', min: -180, max: 180 },
    ],
    offsets: [{ part: 'legNear', label: 'Pierna derecha' }],
  },
  {
    title: 'Pierna izquierda',
    joints: [
      { key: 'legFarUpper', label: 'Muslo', min: -180, max: 180 },
      { key: 'legFarLower', label: 'Pantorrilla', min: -180, max: 180 },
    ],
    offsets: [{ part: 'legFar', label: 'Pierna izquierda' }],
  },
];

// Desplazamiento X/Y de una parte EN EL FRAME actual (se interpola entre keyframes).
const OFF_MIN = -50;
const OFF_MAX = 50;

const PartOffsetControl = ({ target }: { target: PartOffsetTarget }): ReactElement => {
  // Valor muestreado en el playhead (frame actual), no del keyframe activo.
  const x = useProjectStore((s) => {
    const clip = s.project.animations.find((c) => c.id === s.activeAnimationId);
    if (!clip) return 0;
    const tt = frameToT(s.currentFrame, clip.frames, clip.loop);
    return poseAt(clip.keyframes, tt).offsets?.[target.part]?.x ?? 0;
  });
  const y = useProjectStore((s) => {
    const clip = s.project.animations.find((c) => c.id === s.activeAnimationId);
    if (!clip) return 0;
    const tt = frameToT(s.currentFrame, clip.frames, clip.loop);
    return poseAt(clip.keyframes, tt).offsets?.[target.part]?.y ?? 0;
  });
  const setPosePartOffset = useProjectStore((s) => s.setPosePartOffset);
  const t = useT();

  return (
    <Box sx={{ px: 1, py: 0.75, borderRadius: 1, bgcolor: 'action.hover' }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {t('Mover')} {t(target.label)} · X {Math.round(x)} · Y {Math.round(y)}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="caption" sx={{ width: 12 }}>X</Typography>
        <Slider size="small" value={x} min={OFF_MIN} max={OFF_MAX} step={1}
          onChange={(_, v) => setPosePartOffset(target.part, v as number, y)} sx={{ flex: 1 }} />
        <NumberInput value={x} step={1} onChange={(v) => setPosePartOffset(target.part, v, y)} inputStyle={{ width: 48, padding: '2px 6px' }} />
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="caption" sx={{ width: 12 }}>Y</Typography>
        <Slider size="small" value={y} min={OFF_MIN} max={OFF_MAX} step={1}
          onChange={(_, v) => setPosePartOffset(target.part, x, v as number)} sx={{ flex: 1 }} />
        <NumberInput value={y} step={1} onChange={(v) => setPosePartOffset(target.part, x, v)} inputStyle={{ width: 48, padding: '2px 6px' }} />
      </Stack>
    </Box>
  );
};

const JointSlider = ({ joint }: { joint: Joint }): ReactElement => {
  // Valor = pose muestreada EN EL PLAYHEAD (frame actual), no del keyframe activo.
  const value = useProjectStore((s) => {
    const clip = s.project.animations.find((c) => c.id === s.activeAnimationId);
    if (!clip) return 0;
    const tt = frameToT(s.currentFrame, clip.frames, clip.loop);
    return poseAt(clip.keyframes, tt)[joint.key];
  });
  const setPoseField = useProjectStore((s) => s.setPoseField);
  const t = useT();

  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {t(joint.label)}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <Slider
          size="small"
          value={value}
          min={joint.min}
          max={joint.max}
          step={1}
          onChange={(_, v) => setPoseField(joint.key, v as number)}
          sx={{ flex: 1 }}
        />
        <NumberInput value={value} step={1} onChange={(v) => setPoseField(joint.key, v)} inputStyle={{ width: 52, padding: '2px 6px' }} />
      </Stack>
    </Box>
  );
};

// Acordeón de un grupo de la pose (articulaciones + offsets), con estado persistido.
const PoseGroupAccordion = ({ group }: { group: Group }): ReactElement => {
  const t = useT();
  const [expanded, setExpanded] = usePersistedExpanded(`pose:${group.title}`, group.title === 'Torso');
  return (
    <Accordion disableGutters expanded={expanded} onChange={(_, v) => setExpanded(v)}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="body2" fontWeight={600}>
          {t(group.title)}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1}>
          {group.joints.map((j) => (
            <JointSlider key={j.key} joint={j} />
          ))}
          {group.offsets?.map((o) => (
            <PartOffsetControl key={o.part} target={o} />
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

export const PoseEditor = (): ReactElement => {
  const mirrorPose = useProjectStore((s) => s.mirrorPose);
  const copyPose = useProjectStore((s) => s.copyPose);
  const pastePose = useProjectStore((s) => s.pastePose);
  const setKeyframeEasing = useProjectStore((s) => s.setKeyframeEasing);
  const activeKeyframeIndex = useProjectStore((s) => s.activeKeyframeIndex);
  const currentFrame = useProjectStore((s) => s.currentFrame);
  const autoKey = useProjectStore((s) => s.autoKey);
  const setAutoKey = useProjectStore((s) => s.setAutoKey);
  const clip = useActiveClip();

  const t = useT();
  // El frame actual es un keyframe si activeKeyframeIndex (sincronizado) es válido.
  const onKeyframe = !!clip && activeKeyframeIndex >= 0 && activeKeyframeIndex < clip.keyframes.length;
  const easing: EasingKind = (onKeyframe && clip.keyframes[activeKeyframeIndex].easing) || 'linear';
  const frames = clip?.frames ?? 1;
  // Editar sin keyframe acá y sin auto-key no hace nada: lo avisamos.
  const editsIgnored = !onKeyframe && !autoKey;

  return (
    <Stack spacing={1}>
      <Stack spacing={0.5}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2">
            {t('Pose')} · {t('frame')} {currentFrame + 1}/{frames}
          </Typography>
          <FormControlLabel
            control={<Switch size="small" checked={autoKey} onChange={(e) => setAutoKey(e.target.checked)} />}
            label={<Typography variant="caption">{t('Auto-key')}</Typography>}
            sx={{ mr: 0 }}
          />
        </Stack>
        <Typography variant="caption" color={onKeyframe ? 'primary.main' : 'text.secondary'}>
          {onKeyframe
            ? t('Keyframe — editás su pose')
            : autoKey
              ? t('Interpolado — al editar se crea un keyframe acá')
              : t('Interpolado — activá Auto-key o creá un keyframe para editar')}
        </Typography>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          <Button size="small" startIcon={<FlipIcon />} onClick={mirrorPose}>
            {t('Espejar')}
          </Button>
          <Button size="small" startIcon={<ContentCopyIcon />} onClick={copyPose}>
            {t('Copiar')}
          </Button>
          <Button size="small" startIcon={<ContentPasteIcon />} onClick={pastePose}>
            {t('Pegar')}
          </Button>
        </Stack>
      </Stack>

      {onKeyframe && (
        <TextField
          select
          size="small"
          label={t('Easing (salida de este keyframe)')}
          value={easing}
          onChange={(e) => setKeyframeEasing(activeKeyframeIndex, e.target.value as EasingKind)}
          fullWidth
          slotProps={{ select: { renderValue: (v) => t(easingLabel(v as EasingKind)) } }}
        >
          {EASINGS.map((e) => (
            <MenuItem key={e.value} value={e.value}>
              <Stack sx={{ py: 0.25 }}>
                <Typography variant="body2">{t(e.label)}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'normal' }}>
                  {t(e.desc)}
                </Typography>
              </Stack>
            </MenuItem>
          ))}
        </TextField>
      )}

      <Box sx={{ opacity: editsIgnored ? 0.5 : 1 }}>
        {GROUPS.map((group) => (
          <PoseGroupAccordion key={group.title} group={group} />
        ))}
      </Box>
    </Stack>
  );
};
