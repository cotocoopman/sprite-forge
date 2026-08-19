import type { ReactElement } from 'react';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import { useProjectStore } from '@store/useProjectStore';
import { useActiveClip } from '@/hooks/useActiveClip';
import { useActiveRigClip } from '@/hooks/useActiveRigClip';

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

  const frames = (mode === 'custom' ? rigClip?.frames : humanoidClip?.frames) ?? 1;

  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <IconButton onClick={prevFrame} size="small">
        <SkipPreviousIcon />
      </IconButton>
      <IconButton onClick={togglePlay} color="primary">
        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
      </IconButton>
      <IconButton onClick={nextFrame} size="small">
        <SkipNextIcon />
      </IconButton>
      <Slider
        size="small"
        value={currentFrame}
        min={0}
        max={Math.max(0, frames - 1)}
        step={1}
        marks
        onChange={(_, v) => setCurrentFrame(v as number)}
        sx={{ mx: 1 }}
      />
      <Typography variant="caption" sx={{ minWidth: 48, textAlign: 'right' }}>
        {currentFrame + 1}/{frames}
      </Typography>
    </Stack>
  );
};
