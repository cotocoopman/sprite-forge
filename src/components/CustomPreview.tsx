import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { useProjectStore } from '@store/useProjectStore';
import { useT } from '@/i18n';
import { useActiveRigClip } from '@/hooks/useActiveRigClip';
import { sampleRigClip } from '@core/customRig';
import { makeTransform, renderCustomInner } from '@core/svg';

const CHECKER = 'repeating-conic-gradient(#3a3f4b 0% 25%, #2a2e38 0% 50%) 50% / 20px 20px';

export const CustomPreview = (): ReactElement => {
  const rig = useProjectStore((s) => s.project.customRig);
  const render = useProjectStore((s) => s.project.render);
  const currentFrame = useProjectStore((s) => s.currentFrame);
  const clip = useActiveRigClip();

  const [lightBg, setLightBg] = useState(false);
  const [guides, setGuides] = useState(true);
  const t = useT();

  const cs = render.cellSize;
  const tf = makeTransform(render);

  const poses = useMemo(() => (clip ? sampleRigClip(clip) : []), [clip]);
  const frame = poses.length > 0 ? Math.max(0, Math.min(poses.length - 1, currentFrame)) : 0;
  const inner = renderCustomInner(rig, render, poses[frame]);

  return (
    <Stack spacing={1} sx={{ height: '100%' }}>
      <Stack direction="row" spacing={2}>
        <FormControlLabel
          control={<Switch size="small" checked={lightBg} onChange={(e) => setLightBg(e.target.checked)} />}
          label={t('Fondo claro')}
        />
        <FormControlLabel
          control={<Switch size="small" checked={guides} onChange={(e) => setGuides(e.target.checked)} />}
          label={t('Guías')}
        />
      </Stack>
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          overflow: 'hidden',
          background: lightBg ? '#e9edf5' : CHECKER,
        }}
      >
        <svg viewBox={`0 0 ${cs} ${cs}`} style={{ width: '100%', maxWidth: 480, maxHeight: '100%', display: 'block' }}>
          {guides && (
            <g stroke="#7c9cff" strokeWidth={1} opacity={0.5}>
              <line x1={0} y1={tf.groundY} x2={cs} y2={tf.groundY} strokeDasharray="6 4" />
              <line x1={tf.centerX} y1={0} x2={tf.centerX} y2={cs} strokeDasharray="6 4" />
            </g>
          )}
          <g dangerouslySetInnerHTML={{ __html: inner }} />
        </svg>
      </Box>
    </Stack>
  );
};
