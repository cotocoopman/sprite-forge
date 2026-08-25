import { useRef, useState } from 'react';
import type { ReactElement, PointerEvent as ReactPointerEvent } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import { useProjectStore } from '@store/useProjectStore';
import { useT } from '@/i18n';
import { useActiveClip } from '@/hooks/useActiveClip';

export const KeyframeTimeline = (): ReactElement => {
  const currentFrame = useProjectStore((s) => s.currentFrame);
  const activeKeyframeIndex = useProjectStore((s) => s.activeKeyframeIndex);
  const selectKeyframe = useProjectStore((s) => s.selectKeyframe);
  const addKeyframeAt = useProjectStore((s) => s.addKeyframeAt);
  const duplicateKeyframe = useProjectStore((s) => s.duplicateKeyframe);
  const deleteKeyframe = useProjectStore((s) => s.deleteKeyframe);
  const moveKeyframe = useProjectStore((s) => s.moveKeyframe);
  const clip = useActiveClip();

  const trackRef = useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const t = useT();

  if (!clip) return <Typography variant="body2">{t('Sin clip activo')}</Typography>;

  const frames = Math.max(1, clip.frames);
  const scrubT = frames > 1 ? currentFrame / (frames - 1) : 0;

  const tFromEvent = (e: ReactPointerEvent): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  };

  const onPointerDownMarker = (index: number) => (e: ReactPointerEvent) => {
    e.stopPropagation();
    selectKeyframe(index);
    setDragIndex(index);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent): void => {
    if (dragIndex === null) return;
    moveKeyframe(dragIndex, tFromEvent(e));
  };

  const onPointerUp = (): void => setDragIndex(null);

  return (
    <Stack spacing={1}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">{t('Keyframes')}</Typography>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          <Tooltip title={t('Agregar en el scrubber')}>
            <Button size="small" startIcon={<AddIcon />} onClick={() => addKeyframeAt(scrubT)}>
              {t('Agregar')}
            </Button>
          </Tooltip>
          <Tooltip title={t('Duplicar seleccionado')}>
            <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => duplicateKeyframe(activeKeyframeIndex)}>
              {t('Duplicar')}
            </Button>
          </Tooltip>
          <Tooltip title={t('Eliminar seleccionado')}>
            <Button
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => deleteKeyframe(activeKeyframeIndex)}
            >
              {t('Eliminar')}
            </Button>
          </Tooltip>
        </Stack>
      </Stack>

      <Box
        ref={trackRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        sx={{
          position: 'relative',
          height: 44,
          borderRadius: 1,
          background: '#20242e',
          border: '1px solid',
          borderColor: 'divider',
          mx: 1.5,
          touchAction: 'none',
        }}
      >
        {/* Scrubber (posición del frame actual) */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${scrubT * 100}%`,
            width: 2,
            background: 'secondary.main',
            transform: 'translateX(-1px)',
          }}
        />
        {clip.keyframes.map((kf, i) => (
          <Tooltip key={i} title={`t = ${kf.t.toFixed(2)}`}>
            <Box
              onPointerDown={onPointerDownMarker(i)}
              onClick={() => selectKeyframe(i)}
              sx={{
                position: 'absolute',
                top: '50%',
                left: `${kf.t * 100}%`,
                width: 16,
                height: 16,
                borderRadius: '3px',
                transform: 'translate(-50%, -50%) rotate(45deg)',
                cursor: 'grab',
                background: i === activeKeyframeIndex ? '#ffb300' : 'grey.500',
                border: '2px solid',
                borderColor: i === activeKeyframeIndex ? '#ffe082' : 'grey.700',
                zIndex: 2,
              }}
            />
          </Tooltip>
        ))}
      </Box>
    </Stack>
  );
};
