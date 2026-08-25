import type { ReactElement } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import { useProjectStore } from '@store/useProjectStore';
import { useT } from '@/i18n';
import { useActiveClip } from '@/hooks/useActiveClip';
import { useActiveRigClip } from '@/hooks/useActiveRigClip';
import { tToFrame } from '@core/poses';

export const PlaybackControls = (): ReactElement => {
  const isPlaying = useProjectStore((s) => s.isPlaying);
  const currentFrame = useProjectStore((s) => s.currentFrame);
  const togglePlay = useProjectStore((s) => s.togglePlay);
  const nextFrame = useProjectStore((s) => s.nextFrame);
  const prevFrame = useProjectStore((s) => s.prevFrame);
  const setCurrentFrame = useProjectStore((s) => s.setCurrentFrame);
  const mode = useProjectStore((s) => s.project.mode);
  const humanoidClip = useActiveClip();
  const rigClip = useActiveRigClip();

  const t = useT();
  const clip = mode === 'custom' ? rigClip : humanoidClip;
  const frames = clip?.frames ?? 1;
  // Posición (frame) de cada keyframe sobre la barra, sin duplicar frames.
  const kfFrames = clip
    ? Array.from(new Set(clip.keyframes.map((kf) => tToFrame(kf.t, frames, clip.loop)))).sort((a, b) => a - b)
    : [];
  const leftPct = (f: number): number => (frames > 1 ? (f / (frames - 1)) * 100 : 0);

  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Tooltip title={t('Frame anterior (←)')}>
        <IconButton onClick={prevFrame} size="small">
          <SkipPreviousIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('Reproducir / pausar (Espacio)')}>
        <IconButton onClick={togglePlay} color="primary">
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
      </Tooltip>
      <Tooltip title={t('Frame siguiente (→)')}>
        <IconButton onClick={nextFrame} size="small">
          <SkipNextIcon />
        </IconButton>
      </Tooltip>
      <Box sx={{ position: 'relative', flex: 1, mx: 1, display: 'flex' }}>
        <Slider
          size="small"
          value={currentFrame}
          min={0}
          max={Math.max(0, frames - 1)}
          step={1}
          marks
          onChange={(_, v) => setCurrentFrame(v as number)}
          sx={{ flex: 1 }}
        />
        {/* Diamantes de keyframe apenas por encima de la barra (no bloquean el arrastre).
            El del frame actual (keyframe seleccionado) va en ámbar para destacarlo. */}
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {kfFrames.map((f) => {
            const selected = f === currentFrame;
            return (
              <Box
                key={f}
                title={t('Keyframe · frame') + ` ${f + 1}/${frames}`}
                sx={{
                  position: 'absolute',
                  left: `${leftPct(f)}%`,
                  top: '50%',
                  width: selected ? 11 : 9,
                  height: selected ? 11 : 9,
                  transform: 'translate(-50%, -175%) rotate(45deg)',
                  bgcolor: selected ? '#ffb300' : 'primary.main',
                  border: '1.5px solid',
                  borderColor: selected ? '#ffe082' : 'background.paper',
                  borderRadius: '2px',
                  boxShadow: 1,
                }}
              />
            );
          })}
        </Box>
      </Box>
      <Typography variant="caption" sx={{ minWidth: 48, textAlign: 'right' }}>
        {currentFrame + 1}/{frames}
      </Typography>
    </Stack>
  );
};
