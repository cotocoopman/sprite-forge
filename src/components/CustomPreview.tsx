import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, ReactElement } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useProjectStore } from '@store/useProjectStore';
import { useT } from '@/i18n';
import { useActiveRigClip } from '@/hooks/useActiveRigClip';
import { buildCustomSkeleton, sampleRigClip } from '@core/customRig';
import type { Bone } from '@core/customRig';
import { makeTransform, renderCustomInner } from '@core/svg';
import { genId } from '@store/useProjectStore';
import { CanvasToolbar } from '@components/CanvasToolbar';
import { CanvasContextMenu } from '@components/CanvasContextMenu';
import {
  angleDeg,
  applyCurveDrag,
  applyHandleDrag,
  boneAngleTo,
  boneBaseTip,
  boneCenter,
  boneRadius,
  BOX_SHAPES,
  canvasViewBox,
  clientToModel,
  clientToViewBox,
  curveHandlePos,
  dist,
  modelToPx,
  pickBone,
  ROTATE_CURSOR,
  rotateFarLength,
  rotateHandlePos,
  shapeLabel,
  shapeResizeHandles,
  zoomViewBox,
} from '@components/canvasInteract';
import type { HandleAxis, Pt } from '@components/canvasInteract';

const CHECKER = 'repeating-conic-gradient(#3a3f4b 0% 25%, #2a2e38 0% 50%) 50% / 20px 20px';

// Handle de rotar: separado del de resize, más allá de la punta (unidades de modelo).
const ROTATE_GAP = 8;

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
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pt>({ x: 0, y: 0 });
  const panDrag = useRef<{ startClientX: number; startClientY: number; startPan: Pt; vw: number; vh: number; rectW: number; rectH: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const viewRef = useRef({ zoom, pan });
  useEffect(() => { viewRef.current = { zoom, pan }; });
  const t = useT();

  const cs = render.cellSize;
  const tf = makeTransform(render);
  const vb0 = canvasViewBox(cs, zoom, pan);
  // Listener nativo (no pasivo): el onWheel de React es pasivo por defecto y no
  // permite preventDefault (el navegador haría scroll de la página en vez de zoom).
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handler = (e: WheelEvent): void => {
      e.preventDefault();
      const anchor = clientToViewBox(el, e.clientX, e.clientY);
      const { zoom: z, pan: p } = viewRef.current;
      const r = zoomViewBox(cs, z, p, e.deltaY < 0 ? 1.15 : 1 / 1.15, anchor);
      setZoom(r.zoom);
      setPan(r.pan);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [cs]);

  const poses = useMemo(() => (clip ? sampleRigClip(clip) : []), [clip]);
  const frame = poses.length > 0 ? Math.max(0, Math.min(poses.length - 1, currentFrame)) : 0;
  const inner = renderCustomInner(rig, render, poses[frame], effects);

  // Esqueleto renderizable actual (coords de modelo) para hit-test y selección.
  const skel = useMemo(() => buildCustomSkeleton(rig, poses[frame]), [rig, poses, frame]);

  // Geometría de la selección y sus handles (esquinas reales = resize; rotar aparte).
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
  // Handles de resize: uno por vértice/punta real de la forma (ver canvasInteract.ts).
  const selHandles = bt && selBone && !isCircle && !isPath
    ? shapeResizeHandles(selBone.shape, bt.base, dir, perp, selBone.length, selBone.width)
    : [];
  const selHandlesPx = selHandles.map((h) => ({ ...h, px: modelToPx(h.pos.x, h.pos.y, tf) }));
  // Handle de rotar: dedicado, más allá de la punta — nunca se pisa con los de resize.
  const rotatePos = bt && selBone && !isCircle && !isPath
    ? rotateHandlePos(bt.base, dir, rotateFarLength(selBone.shape, selBone.length), ROTATE_GAP)
    : null;
  const rotatePx = rotatePos ? modelToPx(rotatePos.x, rotatePos.y, tf) : null;
  const stemTipPx = bt && !isCircle && !isPath ? modelToPx(bt.tip.x, bt.tip.y, tf) : null;
  // Handle de curvatura (huesos 'capsule', el rig no tiene 'arc' propio): sobre el
  // punto de control real de la curva (mismo cálculo que buildCustomSkeleton).
  const curvePos = bt && selBone?.shape === 'capsule'
    ? curveHandlePos(bt.base, dir, perp, selBone.length, selBone.curve ?? 0)
    : null;
  const curvePx = curvePos ? modelToPx(curvePos.x, curvePos.y, tf) : null;
  // Círculo: único handle radial (no tiene orientación ni vértices que separar).
  const wOff = selBone ? selBone.width / 2 + 3 : 0;
  const circleWidthPx = isCircle && selCenter ? modelToPx(selCenter.x + perp.x * wOff, selCenter.y + perp.y * wOff, tf) : null;

  const drag = useRef<
    | { mode: 'move'; id: string; start: Pt; offset: Pt }
    | { mode: 'resize'; id: string; axis: HandleAxis; base: Pt; dir: Pt; perp: Pt; prevLength: number; prevWidth: number }
    | { mode: 'rotate'; id: string; base: Pt; startAngle: number; grabA: number }
    | { mode: 'curve'; id: string; base: Pt; dir: Pt; perp: Pt; length: number }
    | { mode: 'circleWidth'; id: string; base: Pt }
    | null
  >(null);

  const create = useRef<{ id: string; base: Pt } | null>(null);
  const pencil = useRef<{ id: string; pts: Pt[] } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>): void => {
    const svg = e.currentTarget;
    const vb = clientToViewBox(svg, e.clientX, e.clientY);
    const m = clientToModel(svg, e.clientX, e.clientY, tf);

    if (e.button === 1) {
      // Botón central: paneo (no interfiere con seleccionar/dibujar/menú contextual).
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      panDrag.current = { startClientX: e.clientX, startClientY: e.clientY, startPan: pan, vw: vb0.w, vh: vb0.h, rectW: rect.width, rectH: rect.height };
      svg.setPointerCapture(e.pointerId);
      return;
    }

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
      // El rig no tiene 'arc'; se dibuja como cápsula curva.
      const boneShape = shapeKind === 'arc' ? 'capsule' : shapeKind;
      const bone: Bone = {
        id, name: shapeLabel(shapeKind), parentId: null, attach: 0, angle: 90, length: 2,
        width: shapeKind === 'circle' ? 2 : brushWidth, shape: boneShape, curve: shapeKind === 'arc' ? 0.5 : 0,
        color: null, z: maxZ + 1, offset: { x: m.x - rig.origin.x, y: m.y - rig.origin.y },
      };
      insertBone(bone);
      create.current = { id, base: m };
      svg.setPointerCapture(e.pointerId);
      return;
    }

    if (selBone && bt) {
      if (rotatePx && dist(vb, rotatePx) < 13) {
        drag.current = { mode: 'rotate', id: selBone.id, base: bt.base, startAngle: selBone.angle, grabA: angleDeg(bt.base, bt.tip) };
        svg.setPointerCapture(e.pointerId);
        return;
      }
      if (curvePx && dist(vb, curvePx) < 13) {
        drag.current = { mode: 'curve', id: selBone.id, base: bt.base, dir, perp, length: selBone.length };
        svg.setPointerCapture(e.pointerId);
        return;
      }
      const hit = selHandlesPx.find((h) => dist(vb, h.px) < 13);
      if (hit) {
        drag.current = { mode: 'resize', id: selBone.id, axis: hit.axis, base: bt.base, dir, perp, prevLength: selBone.length, prevWidth: selBone.width };
        svg.setPointerCapture(e.pointerId);
        return;
      }
      if (circleWidthPx && dist(vb, circleWidthPx) < 13) {
        drag.current = { mode: 'circleWidth', id: selBone.id, base: selCenter! };
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
    if (panDrag.current) {
      const pd = panDrag.current;
      const dx = e.clientX - pd.startClientX;
      const dy = e.clientY - pd.startClientY;
      setPan({ x: pd.startPan.x - dx * (pd.vw / pd.rectW), y: pd.startPan.y - dy * (pd.vh / pd.rectH) });
      return;
    }
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
    } else if (d.mode === 'resize') {
      const r = applyHandleDrag(d.axis, d.base, d.dir, d.perp, m, d.prevLength, d.prevWidth);
      updateBone(d.id, { length: Math.round(r.length * 10) / 10, width: Math.round(r.width * 10) / 10 });
    } else if (d.mode === 'rotate') {
      const a = d.startAngle + (angleDeg(d.base, m) - d.grabA);
      updateBone(d.id, { angle: Math.round(shift ? Math.round(a / 15) * 15 : a) });
    } else if (d.mode === 'curve') {
      updateBone(d.id, { curve: Math.round(applyCurveDrag(d.base, d.dir, d.perp, d.length, m) * 100) / 100 });
    } else {
      updateBone(d.id, { width: Math.max(1, Math.round(dist(d.base, m) * 2 * 10) / 10) });
    }
  };

  const endDrag = (e: ReactPointerEvent<SVGSVGElement>): void => {
    if (create.current || drag.current || pencil.current || panDrag.current) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
      create.current = null;
      drag.current = null;
      pencil.current = null;
      panDrag.current = null;
    }
  };

  const onContextMenu = (e: ReactMouseEvent<SVGSVGElement>): void => {
    e.preventDefault();
    const id = pickBone(skel, clientToModel(e.currentTarget, e.clientX, e.clientY, tf));
    if (id) selectBone(id);
    setMenu({ x: e.clientX, y: e.clientY });
  };

  const zoomBy = (factor: number): void => {
    const z = zoomViewBox(cs, zoom, pan, factor, { x: cs / 2 + pan.x, y: cs / 2 + pan.y });
    setZoom(z.zoom);
    setPan(z.pan);
  };
  const resetView = (): void => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
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
        <Stack direction="row" spacing={0} alignItems="center">
          <Tooltip title={t('Alejar')}>
            <IconButton size="small" onClick={() => zoomBy(1 / 1.3)}><ZoomOutIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40, textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </Typography>
          <Tooltip title={t('Acercar')}>
            <IconButton size="small" onClick={() => zoomBy(1.3)}><ZoomInIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title={t('Restablecer zoom')}>
            <IconButton size="small" onClick={resetView}><RestartAltIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Stack>
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
          ref={svgRef}
          viewBox={`${vb0.x} ${vb0.y} ${vb0.w} ${vb0.h}`}
          style={{ width: '100%', maxWidth: 480, maxHeight: '100%', display: 'block', touchAction: 'none', cursor: tool === 'select' ? 'pointer' : 'crosshair' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onContextMenu={onContextMenu}
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
              {tool === 'select' && isCircle && circleWidthPx && (
                <rect x={circleWidthPx.x - 5} y={circleWidthPx.y - 5} width={10} height={10} rx={2} fill="#a5f3fc" stroke="#0b1220" strokeWidth={1.5} style={{ cursor: 'nwse-resize' }} />
              )}
              {tool === 'select' && rotatePx && stemTipPx && (
                <>
                  <line x1={stemTipPx.x} y1={stemTipPx.y} x2={rotatePx.x} y2={rotatePx.y} stroke="#f5b942" strokeWidth={1} strokeDasharray="2 2" opacity={0.7} />
                  <circle cx={rotatePx.x} cy={rotatePx.y} r={5} fill="#f5b942" stroke="#0b1220" strokeWidth={1.5} style={{ cursor: ROTATE_CURSOR }} />
                </>
              )}
              {tool === 'select' && curvePx && (
                <circle cx={curvePx.x} cy={curvePx.y} r={5} fill="#c4b5fd" stroke="#0b1220" strokeWidth={1.5} style={{ cursor: 'ns-resize' }} />
              )}
              {tool === 'select' && selHandlesPx.map((h) => (
                <rect key={h.id} x={h.px.x - 4.5} y={h.px.y - 4.5} width={9} height={9} rx={2} fill="#22d3ee" stroke="#0b1220" strokeWidth={1.5} style={{ cursor: 'nwse-resize' }} />
              ))}
            </>
          )}
        </svg>
      </Box>
      <CanvasContextMenu position={menu} onClose={() => setMenu(null)} />
    </Stack>
  );
};
