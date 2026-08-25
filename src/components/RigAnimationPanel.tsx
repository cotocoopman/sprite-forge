import { useRef, useState } from 'react';
import type { ReactElement, PointerEvent as ReactPointerEvent } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useProjectStore } from '@store/useProjectStore';
import { useActiveRigClip } from '@/hooks/useActiveRigClip';
import { NumberInput } from '@components/NumberInput';
import { useT } from '@/i18n';
import type { EasingKind } from '@core/poses';
import { frameToT } from '@core/poses';
import { rigPoseAt } from '@core/customRig';

const EASINGS: readonly { value: EasingKind; label: string; desc: string }[] = [
  { value: 'linear', label: 'Lineal', desc: 'Velocidad constante de principio a fin' },
  { value: 'easeIn', label: 'Ease-in', desc: 'Arranca lento y acelera hacia el final' },
  { value: 'easeOut', label: 'Ease-out', desc: 'Arranca rápido y frena al final' },
  { value: 'easeInOut', label: 'Ease-in-out', desc: 'Suave al inicio y al final, rápido en el medio' },
];

const easingLabel = (v: EasingKind): string => EASINGS.find((e) => e.value === v)?.label ?? String(v);

const BoneAngleSlider = ({ boneId, name }: { boneId: string; name: string }): ReactElement => {
  // Valor = pose muestreada en el playhead (frame actual), no del keyframe activo.
  const value = useProjectStore((s) => {
    const clip = s.project.customRig.animations.find((c) => c.id === s.activeRigClipId);
    if (!clip) return 0;
    const tt = frameToT(s.currentFrame, clip.frames, clip.loop);
    return rigPoseAt(clip.keyframes, tt)[boneId] ?? 0;
  });
  const setBoneAngleOffset = useProjectStore((s) => s.setBoneAngleOffset);
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{name}</Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <Slider size="small" value={value} min={-180} max={180} step={1} onChange={(_, v) => setBoneAngleOffset(boneId, v as number)} sx={{ flex: 1 }} />
        <NumberInput value={value} step={1} onChange={(v) => setBoneAngleOffset(boneId, v)} inputStyle={{ width: 52, padding: '2px 6px' }} />
      </Stack>
    </Box>
  );
};

export const RigAnimationPanel = (): ReactElement => {
  const animations = useProjectStore((s) => s.project.customRig.animations);
  const bones = useProjectStore((s) => s.project.customRig.bones);
  const activeClipId = useProjectStore((s) => s.activeRigClipId);
  const activeKf = useProjectStore((s) => s.activeRigKeyframeIndex);
  const currentFrame = useProjectStore((s) => s.currentFrame);
  const selectRigClip = useProjectStore((s) => s.selectRigClip);
  const addRigClip = useProjectStore((s) => s.addRigClip);
  const duplicateRigClip = useProjectStore((s) => s.duplicateRigClip);
  const renameRigClip = useProjectStore((s) => s.renameRigClip);
  const deleteRigClip = useProjectStore((s) => s.deleteRigClip);
  const setRigClipFrames = useProjectStore((s) => s.setRigClipFrames);
  const setRigClipFps = useProjectStore((s) => s.setRigClipFps);
  const setRigClipLoop = useProjectStore((s) => s.setRigClipLoop);
  const selectRigKeyframe = useProjectStore((s) => s.selectRigKeyframe);
  const addRigKeyframeAt = useProjectStore((s) => s.addRigKeyframeAt);
  const duplicateRigKeyframe = useProjectStore((s) => s.duplicateRigKeyframe);
  const deleteRigKeyframe = useProjectStore((s) => s.deleteRigKeyframe);
  const moveRigKeyframe = useProjectStore((s) => s.moveRigKeyframe);
  const setRigKeyframeEasing = useProjectStore((s) => s.setRigKeyframeEasing);
  const autoKey = useProjectStore((s) => s.autoKey);
  const setAutoKey = useProjectStore((s) => s.setAutoKey);
  const clip = useActiveRigClip();
  const tr = useT();

  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const frames = Math.max(1, clip?.frames ?? 1);
  const scrubT = frames > 1 ? currentFrame / (frames - 1) : 0;
  const onKeyframe = !!clip && activeKf >= 0 && activeKf < clip.keyframes.length;
  const easing: EasingKind = (onKeyframe && clip.keyframes[activeKf].easing) || 'linear';

  const tFromEvent = (e: ReactPointerEvent): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle1" fontWeight={700}>{tr('Animación del rig')}</Typography>
        <Tooltip title={tr('Agregar clip')}>
          <IconButton size="small" color="primary" onClick={addRigClip}><AddIcon /></IconButton>
        </Tooltip>
      </Stack>

      <List dense disablePadding sx={{ maxHeight: 150, overflowY: 'auto' }}>
        {animations.map((c) => (
          <ListItemButton key={c.id} selected={c.id === activeClipId} onClick={() => selectRigClip(c.id)} sx={{ borderRadius: 1 }}>
            {renaming === c.id ? (
              <TextField size="small" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
                onBlur={() => { if (draft.trim()) renameRigClip(c.id, draft.trim()); setRenaming(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { if (draft.trim()) renameRigClip(c.id, draft.trim()); setRenaming(null); } }}
                onClick={(e) => e.stopPropagation()} fullWidth />
            ) : (
              <ListItemText primary={c.name} secondary={`${c.frames}f · ${c.fps}fps${c.loop ? ' · loop' : ''}`} />
            )}
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setRenaming(c.id); setDraft(c.name); }}><EditIcon fontSize="inherit" /></IconButton>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); duplicateRigClip(c.id); }}><ContentCopyIcon fontSize="inherit" /></IconButton>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); deleteRigClip(c.id); }}><DeleteIcon fontSize="inherit" /></IconButton>
          </ListItemButton>
        ))}
      </List>

      {clip && (
        <>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 90 }}><NumberInput label={tr('Frames')} value={clip.frames} step={1} min={1} onChange={setRigClipFrames} fullWidth /></Box>
            <Box sx={{ width: 90 }}><NumberInput label={tr('FPS')} value={clip.fps} step={1} min={1} onChange={setRigClipFps} fullWidth /></Box>
            <FormControlLabel control={<Switch checked={clip.loop} onChange={(e) => setRigClipLoop(e.target.checked)} />} label={tr('Loop')} />
          </Stack>

          <Divider />

          <Stack spacing={0.5}>
            <Typography variant="subtitle2">{tr('Keyframes')}</Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              <Button size="small" startIcon={<AddIcon />} onClick={() => addRigKeyframeAt(scrubT)}>{tr('Agregar')}</Button>
              <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => duplicateRigKeyframe(activeKf)}>{tr('Dup')}</Button>
              <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => deleteRigKeyframe(activeKf)}>{tr('Del')}</Button>
            </Stack>
          </Stack>

          <Box ref={trackRef}
            onPointerMove={(e) => { if (dragIndex !== null) moveRigKeyframe(dragIndex, tFromEvent(e)); }}
            onPointerUp={() => setDragIndex(null)}
            sx={{ position: 'relative', height: 40, borderRadius: 1, background: '#20242e', border: '1px solid', borderColor: 'divider', mx: 1.5, touchAction: 'none' }}>
            <Box sx={{ position: 'absolute', top: 0, bottom: 0, left: `${scrubT * 100}%`, width: 2, background: 'secondary.main', transform: 'translateX(-1px)' }} />
            {clip.keyframes.map((kf, i) => (
              <Tooltip key={i} title={`t = ${kf.t.toFixed(2)}`}>
                <Box
                  onPointerDown={(e) => { e.stopPropagation(); selectRigKeyframe(i); setDragIndex(i); (e.target as Element).setPointerCapture?.(e.pointerId); }}
                  onClick={() => selectRigKeyframe(i)}
                  sx={{ position: 'absolute', top: '50%', left: `${kf.t * 100}%`, width: 14, height: 14, borderRadius: '3px', transform: 'translate(-50%, -50%) rotate(45deg)', cursor: 'grab', background: i === activeKf ? '#ffb300' : 'grey.500', border: '2px solid', borderColor: i === activeKf ? '#ffe082' : 'grey.700', zIndex: 2 }}
                />
              </Tooltip>
            ))}
          </Box>

          {onKeyframe && (
            <TextField select size="small" label={tr('Easing (salida del keyframe)')} value={easing}
              onChange={(e) => setRigKeyframeEasing(activeKf, e.target.value as EasingKind)} fullWidth
              slotProps={{ select: { renderValue: (v) => tr(easingLabel(v as EasingKind)) } }}>
              {EASINGS.map((e) => (
                <MenuItem key={e.value} value={e.value}>
                  <Stack sx={{ py: 0.25 }}>
                    <Typography variant="body2">{tr(e.label)}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'normal' }}>
                      {tr(e.desc)}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
          )}

          <Divider />

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle2">
              {tr('Ángulos por hueso')} · {tr('frame')} {currentFrame + 1}/{frames}
            </Typography>
            <FormControlLabel
              control={<Switch size="small" checked={autoKey} onChange={(e) => setAutoKey(e.target.checked)} />}
              label={<Typography variant="caption">{tr('Auto-key')}</Typography>}
              sx={{ mr: 0 }}
            />
          </Stack>
          <Typography variant="caption" color={onKeyframe ? 'primary.main' : 'text.secondary'}>
            {onKeyframe
              ? tr('Keyframe — editás su pose')
              : autoKey
                ? tr('Interpolado — al editar se crea un keyframe acá')
                : tr('Interpolado — activá Auto-key o creá un keyframe para editar')}
          </Typography>
          <Stack spacing={1} sx={{ opacity: !onKeyframe && !autoKey ? 0.5 : 1 }}>
            {bones.map((b) => <BoneAngleSlider key={b.id} boneId={b.id} name={b.name} />)}
          </Stack>
        </>
      )}
    </Stack>
  );
};
