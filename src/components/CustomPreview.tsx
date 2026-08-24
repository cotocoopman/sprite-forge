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
import type { Bone } from '@core/customRig';
import { makeTransform, renderCustomInner } from '@core/svg';
import { genId } from '@store/useProjectStore';
import { CanvasToolbar } from '@components/CanvasToolbar';
import {
  angleDeg,
  boneAngleTo,
  boneBaseTip,
  boneCenter,
  boneRadius,
  BOX_SHAPES,
  clientToModel,
  clientToViewBox,
  dist,
  modelToPx,
  pickBone,
} from '@components/canvasInteract';
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
  const tool = useProjectStore((s) => s.tool);
  const shapeKind = useProjectStore((s) => s.shapeKind);
  const brushWidth = useProjectStore((s) => s.brushWidth);
  const insertBone = useProjectStore((s) => s.insertBone);
  const removeBone = useProjectStore((s) => s.removeBone);
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

  // Geometría de la selección y sus handles (punta = rotar+largo; lado = ancho).
  const selected = skel.find((b) => b.id === activeBoneId);
  const selBone = selected ? rig.bones.find((b) => b.id === activeBoneId) : undefined;
  const selCenter = selected ? boneCenter(selected) : null;
  const selPx = selCenter ? modelToPx(selCenter.x, selCenter.y, tf) : null;
  const selR = selected ? boneRadius(selected) * tf.scale + 5 : 0;
  const isCircle = selBone?.shape === 'circle';
  const isPath = selBone?.shape === 'path';
  const bt = selected ? boneBaseTip(selected) : null;
  const dvec = bt ? { x: bt.tip.x - bt.base.x, y: bt.tip.y - bt.base.y } : null;
  const dlen = dvec ? Math.hypot(dvec.x, dvec.y) : 0;
  const dir = dvec && dlen > 0.5 ? { x: dvec.x / dlen, y: dvec.y / dlen } : { x: 1, y: 0 };
  const perp = { x: -dir.y, y: dir.x };
  const mid = bt ? { x: (bt.base.x + bt.tip.x) / 2, y: (bt.base.y + bt.tip.y) / 2 } : null;
  const wOff = selBone ? selBone.width / 2 + 3 : 0;
  const tipPx = bt && !isCircle && !isPath ? modelToPx(bt.tip.x, bt.tip.y, tf) : null;
  // Handle de ancho en la ESQUINA (punta + perpendicular), estilo caja estándar.
  const widthPx = isCircle
    ? (selCenter ? modelToPx(selCenter.x + perp.x * wOff, selCenter.y + perp.y * wOff, tf) : null)
    : bt
      ? modelToPx(bt.tip.x + perp.x * (selBone!.width / 2), bt.tip.y + perp.y * (selBone!.width / 2), tf)
      : null;

  const drag = useRef<
    | { mode: 'move'; id: string; start: Pt; offset: Pt }
    | { mode: 'tip'; id: string; base: Pt; startAngle: number; grabA: number }
    | { mode: 'width'; id: string; base: Pt; perp: Pt; circle: boolean }
    | null
  >(null);

  const create = useRef<{ id: string; base: Pt } | null>(null);
  const pencil = useRef<{ id: string; pts: Pt[] } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>): void => {
    const svg = e.currentTarget;
    const vb = clientToViewBox(svg, e.clientX, e.clientY);
    const m = clientToModel(svg, e.clientX, e.clientY, tf);

    if (tool === 'eraser') {
      const id = pickBone(skel, m);
      if (id) removeBone(id);
      return;
    }
    if (tool === 'pencil') {
      const id = genId();
      const maxZ = rig.bones.reduce((mx, b) => Math.max(mx, b.z), 0);
      const p0 = { x: m.x - rig.origin.x, y: m.y - rig.origin.y };
      const bone: Bone = {
        id, name: 'Trazo', parentId: null, attach: 0, angle: 0, length: 0,
        width: brushWidth, shape: 'path', curve: 0, color: null, z: maxZ + 1,
        offset: { x: 0, y: 0 }, points: [p0],
      };
      insertBone(bone);
      pencil.current = { id, pts: [p0] };
      svg.setPointerCapture(e.pointerId);
      return;
    }
    if (tool === 'shape') {
      const id = genId();
      const maxZ = rig.bones.reduce((mx, b) => Math.max(mx, b.z), 0);
      const bone: Bone = {
        id, name: 'Forma', parentId: null, attach: 0, angle: 90, length: 2,
        width: shapeKind === 'circle' ? 2 : brushWidth, shape: shapeKind, curve: 0,
        color: null, z: maxZ + 1, offset: { x: m.x - rig.origin.x, y: m.y - rig.origin.y },
      };
      insertBone(bone);
      create.current = { id, base: m };
      svg.setPointerCapture(e.pointerId);
      return;
    }

    if (selBone && bt) {
      if (tipPx && dist(vb, tipPx) < 13) {
        drag.current = { mode: 'tip', id: selBone.id, base: bt.base, startAngle: selBone.angle, grabA: angleDeg(bt.base, bt.tip) };
        svg.setPointerCapture(e.pointerId);
        return;
      }
      if (widthPx && dist(vb, widthPx) < 13) {
        drag.current = { mode: 'width', id: selBone.id, base: isCircle ? { x: selCenter!.x, y: selCenter!.y } : mid!, perp, circle: !!isCircle };
        svg.setPointerCapture(e.pointerId);
        return;
      }
    }
    const id = pickBone(skel, m);
    selectBone(id);
    if (id) {
      const b = rig.bones.find((x) => x.id === id);
      drag.current = { mode: 'move', id, start: m, offset: b?.offset ?? { x: 0, y: 0 } };
      svg.setPointerCapture(e.pointerId);
    }
  };

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>): void => {
    const shift = e.shiftKey;
    if (pencil.current) {
      const m = clientToModel(e.currentTarget, e.clientX, e.clientY, tf);
      const p = { x: m.x - rig.origin.x, y: m.y - rig.origin.y };
      const pc = pencil.current;
      if (shift) {
        // Línea recta desde el inicio del trazo.
        updateBone(pc.id, { points: [pc.pts[0], p] });
      } else if (dist(p, pc.pts[pc.pts.length - 1]) >= 1.5) {
        pc.pts.push(p);
        updateBone(pc.id, { points: [...pc.pts] });
      }
      return;
    }
    if (create.current) {
      const m = clientToModel(e.currentTarget, e.clientX, e.clientY, tf);
      const c = create.current.base;
      if (shapeKind === 'circle') {
        updateBone(create.current.id, { width: Math.max(2, Math.round(dist(c, m) * 2 * 10) / 10) });
      } else if (BOX_SHAPES.has(shapeKind)) {
        // Caja centrada en el clic, ejes de pantalla (no rota al mover).
        const dx = Math.abs(m.x - c.x);
        const dy = Math.abs(m.y - c.y);
        const length = Math.max(2, Math.round((shift ? Math.max(dx, dy) : dy) * 2 * 10) / 10);
        const width = Math.max(2, Math.round((shift ? Math.max(dx, dy) : dx) * 2 * 10) / 10);
        updateBone(create.current.id, { angle: 0, length, width, offset: { x: c.x - rig.origin.x, y: c.y + length / 2 - rig.origin.y } });
      } else {
        // Barra / estrella: direccional, apunta al cursor.
        const a = boneAngleTo(c, m);
        updateBone(create.current.id, {
          angle: Math.round(shift ? Math.round(a / 45) * 45 : a),
          length: Math.max(2, Math.round(dist(c, m) * 10) / 10),
        });
      }
      return;
    }
    const d = drag.current;
    if (!d) return;
    const m = clientToModel(e.currentTarget, e.clientX, e.clientY, tf);
    if (d.mode === 'move') {
      updateBone(d.id, { offset: { x: d.offset.x + (m.x - d.start.x), y: d.offset.y + (m.y - d.start.y) } });
    } else if (d.mode === 'tip') {
      // Apunta el hueso hacia el cursor (rotar) y ajusta su largo (estirar).
      const a = d.startAngle + (angleDeg(d.base, m) - d.grabA);
      updateBone(d.id, {
        angle: Math.round(shift ? Math.round(a / 15) * 15 : a),
        length: Math.round(Math.max(2, dist(d.base, m)) * 10) / 10,
      });
    } else {
      const off = Math.abs((m.x - d.base.x) * d.perp.x + (m.y - d.base.y) * d.perp.y);
      updateBone(d.id, { width: Math.max(1, Math.round((d.circle ? dist(d.base, m) * 2 : off * 2) * 10) / 10) });
    }
  };

  const endDrag = (e: ReactPointerEvent<SVGSVGElement>): void => {
    if (create.current || drag.current || pencil.current) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
      create.current = null;
      drag.current = null;
      pencil.current = null;
    }
  };

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
      <CanvasToolbar />
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
          style={{ width: '100%', maxWidth: 480, maxHeight: '100%', display: 'block', touchAction: 'none', cursor: tool === 'select' ? 'pointer' : 'crosshair' }}
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
            <>
              <circle cx={selPx.x} cy={selPx.y} r={selR} fill="none" stroke="#22d3ee" strokeWidth={1} strokeDasharray="3 3" opacity={0.55} />
              {tool === 'select' && tipPx && (
                <circle cx={tipPx.x} cy={tipPx.y} r={5} fill="#22d3ee" stroke="#0b1220" strokeWidth={1.5} style={{ cursor: 'grab' }} />
              )}
              {tool === 'select' && widthPx && (
                <rect x={widthPx.x - 5} y={widthPx.y - 5} width={10} height={10} rx={2} fill="#a5f3fc" stroke="#0b1220" strokeWidth={1.5} style={{ cursor: 'nwse-resize' }} />
              )}
            </>
          )}
        </svg>
      </Box>
    </Stack>
  );
};
