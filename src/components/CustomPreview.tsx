import { useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactElement } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { useProjectStore } from '@store/useProjectStore';
import { useT } from '@/i18n';
import { useActiveRigClip } from '@/hooks/useActiveRigClip';
import { buildCustomSkeleton, sampleRigClip } from '@core/customRig';
import { makeTransform, renderCustomInner } from '@core/svg';
import { boneCenter, boneRadius, clientToModel, modelToPx, pickBone } from '@components/canvasInteract';
import type { Pt } from '@components/canvasInteract';

const CHECKER = 'repeating-conic-gradient(#3a3f4b 0% 25%, #2a2e38 0% 50%) 50% / 20px 20px';

export const CustomPreview = (): ReactElement => {
  const rig = useProjectStore((s) => s.project.customRig);
  const render = useProjectStore((s) => s.project.render);
  const effects = useProjectStore((s) => s.project.effects);
  const currentFrame = useProjectStore((s) => s.currentFrame);
  const activeBoneId = useProjectStore((s) => s.activeBoneId);
  const selectBone = useProjectStore((s) => s.selectBone);
  const updateBone = useProjectStore((s) => s.updateBone);
  const clip = useActiveRigClip();

  const [lightBg, setLightBg] = useState(false);
  const [guides, setGuides] = useState(true);
  const t = useT();

  const cs = render.cellSize;
  const tf = makeTransform(render);

  const poses = useMemo(() => (clip ? sampleRigClip(clip) : []), [clip]);
  const frame = poses.length > 0 ? Math.max(0, Math.min(poses.length - 1, currentFrame)) : 0;
  const inner = renderCustomInner(rig, render, poses[frame], effects);

  // Esqueleto renderizable actual (coords de modelo) para hit-test y selección.
  const skel = useMemo(() => buildCustomSkeleton(rig, poses[frame]), [rig, poses, frame]);
  const drag = useRef<{ id: string; start: Pt; offset: Pt } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>): void => {
    const svg = e.currentTarget;
    const m = clientToModel(svg, e.clientX, e.clientY, tf);
    const id = pickBone(skel, m);
    selectBone(id);
    if (id) {
      const b = rig.bones.find((x) => x.id === id);
      drag.current = { id, start: m, offset: b?.offset ?? { x: 0, y: 0 } };
      svg.setPointerCapture(e.pointerId);
    }
  };

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>): void => {
    if (!drag.current) return;
    const m = clientToModel(e.currentTarget, e.clientX, e.clientY, tf);
    const { id, start, offset } = drag.current;
    updateBone(id, { offset: { x: offset.x + (m.x - start.x), y: offset.y + (m.y - start.y) } });
  };

  const endDrag = (e: ReactPointerEvent<SVGSVGElement>): void => {
    if (drag.current) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
      drag.current = null;
    }
  };

  const selected = skel.find((b) => b.id === activeBoneId);
  const selPx = selected ? modelToPx(boneCenter(selected).x, boneCenter(selected).y, tf) : null;
  const selR = selected ? boneRadius(selected) * tf.scale + 5 : 0;

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
        <svg
          viewBox={`${-cs * 0.12} ${-cs * 0.12} ${cs * 1.24} ${cs * 1.24}`}
          style={{ width: '100%', maxWidth: 480, maxHeight: '100%', display: 'block', touchAction: 'none', cursor: 'pointer' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <rect x={0} y={0} width={cs} height={cs} fill="none" stroke="#7c9cff" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
          {guides && (
            <g stroke="#7c9cff" strokeWidth={1} opacity={0.5}>
              <line x1={0} y1={tf.groundY} x2={cs} y2={tf.groundY} strokeDasharray="6 4" />
              <line x1={tf.centerX} y1={0} x2={tf.centerX} y2={cs} strokeDasharray="6 4" />
            </g>
          )}
          <g dangerouslySetInnerHTML={{ __html: inner }} />
          {selPx && (
            <circle cx={selPx.x} cy={selPx.y} r={selR} fill="none" stroke="#22d3ee" strokeWidth={2} strokeDasharray="5 4" />
          )}
        </svg>
      </Box>
    </Stack>
  );
};
