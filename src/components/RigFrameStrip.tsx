import { useMemo } from 'react';
import type { ReactElement } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useProjectStore } from '@store/useProjectStore';
import { useActiveRigClip } from '@/hooks/useActiveRigClip';
import { sampleRigClip } from '@core/customRig';
import type { RenderConfig } from '@core/poses';
import { renderCustomInner } from '@core/svg';

const THUMB = 72;

export const RigFrameStrip = (): ReactElement => {
  const rig = useProjectStore((s) => s.project.customRig);
  const render = useProjectStore((s) => s.project.render);
  const currentFrame = useProjectStore((s) => s.currentFrame);
  const setCurrentFrame = useProjectStore((s) => s.setCurrentFrame);
  const clip = useActiveRigClip();

  const thumbRender: RenderConfig = useMemo(() => ({ ...render, cellSize: THUMB }), [render]);
  const poses = useMemo(() => (clip ? sampleRigClip(clip) : []), [clip]);

  return (
    <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', py: 1 }}>
      {poses.map((pose, i) => {
        const inner = renderCustomInner(rig, thumbRender, pose);
        const active = i === currentFrame;
        return (
          <Box
            key={i}
            onClick={() => setCurrentFrame(i)}
            sx={{
              flex: '0 0 auto',
              width: THUMB,
              height: THUMB,
              borderRadius: 1,
              cursor: 'pointer',
              border: '2px solid',
              borderColor: active ? 'primary.main' : 'divider',
              background: '#20242e',
            }}
          >
            <svg viewBox={`0 0 ${THUMB} ${THUMB}`} width={THUMB - 4} height={THUMB - 4} dangerouslySetInnerHTML={{ __html: inner }} />
          </Box>
        );
      })}
    </Stack>
  );
};
