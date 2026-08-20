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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FlipIcon from '@mui/icons-material/Flip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import { useProjectStore } from '@store/useProjectStore';
import { useActiveClip } from '@/hooks/useActiveClip';
import { NumberInput } from '@components/NumberInput';
import { useT } from '@/i18n';
import type { Pose } from '@core/rig';
import type { EasingKind } from '@core/poses';

const EASINGS: readonly { value: EasingKind; label: string }[] = [
  { value: 'linear', label: 'Lineal' },
  { value: 'easeIn', label: 'Ease-in (arranca lento)' },
  { value: 'easeOut', label: 'Ease-out (frena al final)' },
  { value: 'easeInOut', label: 'Ease-in-out' },
];

type Joint = { readonly key: keyof Pose; readonly label: string; readonly min: number; readonly max: number };
type Group = { readonly title: string; readonly joints: readonly Joint[] };

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
  },
  {
    title: 'Brazo derecho',
    joints: [
      { key: 'armNearUpper', label: 'Superior', min: -180, max: 180 },
      { key: 'armNearLower', label: 'Antebrazo', min: -180, max: 180 },
    ],
  },
  {
    title: 'Brazo izquierdo',
    joints: [
      { key: 'armFarUpper', label: 'Superior', min: -180, max: 180 },
      { key: 'armFarLower', label: 'Antebrazo', min: -180, max: 180 },
    ],
  },
  {
    title: 'Pierna derecha',
    joints: [
      { key: 'legNearUpper', label: 'Muslo', min: -180, max: 180 },
      { key: 'legNearLower', label: 'Pantorrilla', min: -180, max: 180 },
    ],
  },
  {
    title: 'Pierna izquierda',
    joints: [
      { key: 'legFarUpper', label: 'Muslo', min: -180, max: 180 },
      { key: 'legFarLower', label: 'Pantorrilla', min: -180, max: 180 },
    ],
  },
];

const JointSlider = ({ joint }: { joint: Joint }): ReactElement => {
  const value = useProjectStore((s) => {
    const clip = s.project.animations.find((c) => c.id === s.activeAnimationId);
    const kf = clip?.keyframes[s.activeKeyframeIndex];
    return kf ? kf.pose[joint.key] : 0;
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

export const PoseEditor = (): ReactElement => {
  const mirrorPose = useProjectStore((s) => s.mirrorPose);
  const copyPose = useProjectStore((s) => s.copyPose);
  const pastePose = useProjectStore((s) => s.pastePose);
  const setKeyframeEasing = useProjectStore((s) => s.setKeyframeEasing);
  const activeKeyframeIndex = useProjectStore((s) => s.activeKeyframeIndex);
  const clip = useActiveClip();

  const t = useT();
  const hasKeyframe = !!clip && activeKeyframeIndex >= 0 && activeKeyframeIndex < clip.keyframes.length;
  const easing: EasingKind = (hasKeyframe && clip.keyframes[activeKeyframeIndex].easing) || 'linear';

  return (
    <Stack spacing={1}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">
          {t('Pose')} {hasKeyframe ? `(kf ${activeKeyframeIndex})` : ''}
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

      {!hasKeyframe && (
        <Typography variant="body2" color="text.secondary">
          {t('Seleccioná un keyframe para editar su pose.')}
        </Typography>
      )}

      {hasKeyframe && (
        <TextField
          select
          size="small"
          label={t('Easing (salida de este keyframe)')}
          value={easing}
          onChange={(e) => setKeyframeEasing(activeKeyframeIndex, e.target.value as EasingKind)}
          fullWidth
        >
          {EASINGS.map((e) => (
            <MenuItem key={e.value} value={e.value}>
              {t(e.label)}
            </MenuItem>
          ))}
        </TextField>
      )}

      {hasKeyframe &&
        GROUPS.map((group) => (
          <Accordion key={group.title} disableGutters defaultExpanded={group.title === 'Torso'}>
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
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
    </Stack>
  );
};
