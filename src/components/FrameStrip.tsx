import { useMemo } from 'react';
import type { ReactElement } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useProjectStore } from '@store/useProjectStore';
import { useActiveClip } from '@/hooks/useActiveClip';
import { buildSkeleton } from '@core/rig';
import { sampleClip } from '@core/poses';
import type { RenderConfig } from '@core/poses';
import { skeletonToPrimitives } from '@core/svg';

const THUMB = 72;

export const FrameStrip = (): ReactElement => {
  const character = useProjectStore((s) => s.project.character);
  const render = useProjectStore((s) => s.project.render);
  const currentFrame = useProjectStore((s) => s.currentFrame);
  const setCurrentFrame = useProjectStore((s) => s.setCurrentFrame);
  const clip = useActiveClip();

  const thumbRender: RenderConfig = useMemo(
    () => ({ ...render, cellSize: THUMB }),
    [render],
  );

  const poses = useMemo(() => (clip ? sampleClip(clip) : []), [clip]);

  return (
    <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', py: 1 }}>
      {poses.map((pose, i) => {
        const prims = skeletonToPrimitives(buildSkeleton(character, pose, thumbRender.facing), thumbRender);
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
              position: 'relative',
            }}
          >
            <svg viewBox={`0 0 ${THUMB} ${THUMB}`} width={THUMB - 4} height={THUMB - 4}>
              <g fill={character.color} stroke={character.color}>
                {prims.map((p, k) =>
                  p.kind === 'line' ? (
                    <path
                      key={k}
                      d={
                        p.cx !== undefined && p.cy !== undefined
                          ? `M ${p.x1} ${p.y1} Q ${p.cx} ${p.cy} ${p.x2} ${p.y2}`
                          : `M ${p.x1} ${p.y1} L ${p.x2} ${p.y2}`
                      }
                      strokeWidth={p.width}
                      strokeLinecap="round"
                      fill={p.cx !== undefined ? 'none' : undefined}
                    />
                  ) : (
                    <circle key={k} cx={p.cx} cy={p.cy} r={p.r} />
                  ),
                )}
              </g>
            </svg>
            <Box
              sx={{
                position: 'absolute',
                bottom: 1,
                right: 3,
                fontSize: 10,
                color: 'text.secondary',
              }}
            >
              {i}
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
};
