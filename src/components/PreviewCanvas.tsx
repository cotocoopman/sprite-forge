import { useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, ReactElement } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { useProjectStore } from '@store/useProjectStore';
import { useT } from '@/i18n';
import { useActiveClip } from '@/hooks/useActiveClip';
import { buildSkeleton } from '@core/rig';
import type { PartName, Pose } from '@core/rig';
import { sampleClip } from '@core/poses';
import { makeTransform, partsWithOffsets, partScales, renderCharacterInner, resolveAccessoryGeom, skeletonToPrimitives } from '@core/svg';
import type { SvgPrimitive } from '@core/svg';
import { CanvasToolbar } from '@components/CanvasToolbar';
import { CanvasContextMenu } from '@components/CanvasContextMenu';
import { accWorldAngleTo, angleDeg, BOX_SHAPES, clientToModel, clientToViewBox, dist, modelToPx, partGeom, pickPart, shapeLabel } from '@components/canvasInteract';
import type { Pt } from '@components/canvasInteract';
import { genId } from '@store/useProjectStore';
import type { Accessory } from '@core/poses';

// Geometría de un accesorio (base, punta, ejes) para hit-test y transform.
const accGeom = (
  acc: Accessory,
  anchorPos: Pt,
  anchorAngle: number,
): { base: Pt; center: Pt; tip: Pt; dir: Pt; along: Pt; perp: Pt; radius: number } => {
  const ar = (anchorAngle * Math.PI) / 180;
  const along = { x: Math.sin(ar), y: Math.cos(ar) };
  const perp = { x: Math.cos(ar), y: -Math.sin(ar) };
  const base = {
    x: anchorPos.x + acc.offsetAlong * along.x + acc.offsetPerp * perp.x,
    y: anchorPos.y + acc.offsetAlong * along.y + acc.offsetPerp * perp.y,
  };
  const sr = ((anchorAngle + acc.angle) * Math.PI) / 180;
  const dir = { x: Math.sin(sr), y: Math.cos(sr) };
  // Trazo libre: centro = centroide de sus puntos (en mundo), radio = bounding.
  if (acc.shape === 'path' && acc.points && acc.points.length > 0) {
    const w = acc.points.map((p) => ({
      x: anchorPos.x + p.x * along.x + p.y * perp.x,
      y: anchorPos.y + p.x * along.y + p.y * perp.y,
    }));
    const cx = w.reduce((s, p) => s + p.x, 0) / w.length;
    const cy = w.reduce((s, p) => s + p.y, 0) / w.length;
    const center = { x: cx, y: cy };
    const radius = Math.max(acc.width / 2, ...w.map((p) => Math.hypot(p.x - cx, p.y - cy))) + 6;
    return { base, center, tip: center, dir, along, perp, radius };
  }
  const len = acc.shape === 'circle' ? 0 : acc.length;
  const center = { x: base.x + dir.x * (len / 2), y: base.y + dir.y * (len / 2) };
  const tip = { x: base.x + dir.x * len, y: base.y + dir.y * len };
  const radius = Math.max(acc.width / 2, acc.length / 2) + 6;
  return { base, center, tip, dir, along, perp, radius };
};

const CHECKER =
  'repeating-conic-gradient(#3a3f4b 0% 25%, #2a2e38 0% 50%) 50% / 20px 20px';

const PrimitiveGroup = ({
  prims,
  color,
  opacity,
}: {
  prims: readonly SvgPrimitive[];
  color: string;
  opacity: number;
}): ReactElement => (
  <g fill={color} stroke={color} opacity={opacity}>
    {prims.map((p, i) => {
      if (p.kind === 'line') {
        return (
          <path
            key={i}
            d={
              p.cx !== undefined && p.cy !== undefined
                ? `M ${p.x1} ${p.y1} Q ${p.cx} ${p.cy} ${p.x2} ${p.y2}`
                : `M ${p.x1} ${p.y1} L ${p.x2} ${p.y2}`
            }
            strokeWidth={p.width}
            strokeLinecap="round"
            fill={p.cx !== undefined ? 'none' : undefined}
          />
        );
      }
      if (p.kind === 'poly') {
        return <polygon key={i} points={p.pts.map((q) => `${q.x},${q.y}`).join(' ')} />;
      }
      return <circle key={i} cx={p.cx} cy={p.cy} r={p.r} />;
    })}
  </g>
);

const boundingBox = (prims: readonly SvgPrimitive[]) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of prims) {
    if (p.kind === 'line') {
      const h = p.width / 2;
      minX = Math.min(minX, p.x1 - h, p.x2 - h);
      maxX = Math.max(maxX, p.x1 + h, p.x2 + h);
      minY = Math.min(minY, p.y1 - h, p.y2 - h);
      maxY = Math.max(maxY, p.y1 + h, p.y2 + h);
    } else if (p.kind === 'poly') {
      for (const q of p.pts) {
        minX = Math.min(minX, q.x);
        maxX = Math.max(maxX, q.x);
        minY = Math.min(minY, q.y);
        maxY = Math.max(maxY, q.y);
      }
    } else {
      minX = Math.min(minX, p.cx - p.r);
      maxX = Math.max(maxX, p.cx + p.r);
      minY = Math.min(minY, p.cy - p.r);
      maxY = Math.max(maxY, p.cy + p.r);
    }
  }
  return { minX, minY, maxX, maxY };
};

export const PreviewCanvas = (): ReactElement => {
  const character = useProjectStore((s) => s.project.character);
  const render = useProjectStore((s) => s.project.render);
  const effects = useProjectStore((s) => s.project.effects);
  const parts = useProjectStore((s) => s.project.parts);
  const accessories = useProjectStore((s) => s.project.accessories);
  const activeAccessoryId = useProjectStore((s) => s.activeAccessoryId);
  const selectAccessory = useProjectStore((s) => s.selectAccessory);
  const updateAccessory = useProjectStore((s) => s.updateAccessory);
  const removeAccessory = useProjectStore((s) => s.removeAccessory);
  const insertAccessory = useProjectStore((s) => s.insertAccessory);
  const activePartName = useProjectStore((s) => s.activePartName);
  const selectPart = useProjectStore((s) => s.selectPart);
  const setPartWidthScale = useProjectStore((s) => s.setPartWidthScale);
  const setPartLengthScale = useProjectStore((s) => s.setPartLengthScale);
  const setPartRotate = useProjectStore((s) => s.setPartRotate);
  const setPartOffset = useProjectStore((s) => s.setPartOffset);
  const tool = useProjectStore((s) => s.tool);
  const shapeKind = useProjectStore((s) => s.shapeKind);
  const brushWidth = useProjectStore((s) => s.brushWidth);
  const currentFrame = useProjectStore((s) => s.currentFrame);
  const refImage = useProjectStore((s) => s.refImage);
  const refOpacity = useProjectStore((s) => s.refOpacity);
  const refScale = useProjectStore((s) => s.refScale);
  const refVisible = useProjectStore((s) => s.refVisible);
  const clip = useActiveClip();
  const t = useT();

  const [lightBg, setLightBg] = useState(false);
  const [onion, setOnion] = useState(false);
  const [guides, setGuides] = useState(true);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const { poses, frame } = useMemo(() => {
    if (!clip) return { poses: [] as Pose[], frame: 0 };
    const sampled = sampleClip(clip);
    const f = Math.max(0, Math.min(sampled.length - 1, currentFrame));
    return { poses: sampled, frame: f };
  }, [clip, currentFrame]);

  // Incluye los offsets X/Y por parte de la pose (animación por frame) en el dibujo.
  const primsFor = (pose: Pose): SvgPrimitive[] => {
    const mParts = partsWithOffsets(parts, pose);
    return skeletonToPrimitives(buildSkeleton(character, pose, render.facing, partScales(mParts)), render, mParts);
  };

  const current = poses[frame] ? primsFor(poses[frame]) : [];
  const n = poses.length;
  const prevPrims = onion && n > 1 ? primsFor(poses[(frame - 1 + n) % n]) : null;
  const nextPrims = onion && n > 1 ? primsFor(poses[(frame + 1) % n]) : null;

  const tf = makeTransform(render);
  const bbox = current.length > 0 ? boundingBox(current) : null;
  const cs = render.cellSize;
  const rot = render.rotation
    ? `rotate(${render.rotation} ${cs / 2} ${cs / 2})`
    : undefined;
  // Accesorios apagados: translúcidos en el editor (se excluyen del export).
  const editorAccessories = accessories.map((a) =>
    a.hidden ? { ...a, opacity: a.opacity * 0.25 } : a,
  );
  const characterInner = poses[frame]
    ? renderCharacterInner(character, poses[frame], render, effects, parts, true, editorAccessories)
    : '';

  // --- Manipulación en canvas: seleccionar, mover, rotar y escalar accesorios ---
  const skel = poses[frame] ? buildSkeleton(character, poses[frame], render.facing, partScales(parts)) : null;
  // Marcos de ancla resueltos (incluye anclaje objeto→objeto) para hit-test/drag.
  const frames = skel ? resolveAccessoryGeom(accessories, skel.anchors) : null;

  const selAcc = skel && activeAccessoryId ? accessories.find((a) => a.id === activeAccessoryId) : null;
  const selFrame = selAcc && frames ? frames.get(selAcc.id) : null;
  const selG = selAcc && selFrame ? accGeom(selAcc, selFrame.pos, selFrame.angle) : null;
  const isCircle = selAcc?.shape === 'circle';
  const isPath = selAcc?.shape === 'path';
  const selPx = selG ? modelToPx(selG.center.x, selG.center.y, tf) : null;
  const selR = selG ? selG.radius * tf.scale : 0;
  const tipPx = selG && !isCircle && !isPath ? modelToPx(selG.tip.x, selG.tip.y, tf) : null;
  const wOff = selAcc ? selAcc.width / 2 + 3 : 0;
  // Handle de ancho en la ESQUINA (punta + perpendicular) para formas; círculo al lado.
  const widthPx = selG
    ? isCircle
      ? modelToPx(selG.center.x + selG.perp.x * wOff, selG.center.y + selG.perp.y * wOff, tf)
      : modelToPx(selG.tip.x + selG.perp.x * (selAcc!.width / 2), selG.tip.y + selG.perp.y * (selAcc!.width / 2), tf)
    : null;

  const drag = useRef<
    | { mode: 'move'; start: Pt; members: { id: string; a0: number; p0: number; along: Pt; perp: Pt }[] }
    | { mode: 'tip'; id: string; base: Pt; startAngle: number; grabA: number }
    | { mode: 'width'; id: string; base: Pt; perp: Pt; circle: boolean }
    | { mode: 'partTip'; part: PartName; pivot: Pt; startTipAngle: number; startRotate: number; startDist: number; startScale: number }
    | { mode: 'partWidth'; part: PartName; ref: Pt; perp: Pt; baseWidth: number; circle: boolean }
    | { mode: 'partMove'; part: PartName; start: Pt; startDx: number; startDy: number }
    | null
  >(null);

  // Parte del cuerpo seleccionada (solo si no hay accesorio activo) + sus handles.
  const selPart: PartName | null = skel && activePartName && !activeAccessoryId ? activePartName : null;
  const pG = selPart && skel ? partGeom(skel, parts, selPart) : null;
  const pCenterPx = pG ? modelToPx(pG.center.x, pG.center.y, tf) : null;
  const pRadiusPx = pG ? pG.radius * tf.scale : 0;
  // Handle de largo en la punta (cabeza no tiene largo de cadena).
  const pTipPx = pG && !pG.circle ? modelToPx(pG.tip.x, pG.tip.y, tf) : null;
  // Handle de grosor al costado del centro (perpendicular al eje).
  const pWidthOff = pG ? (pG.circle ? pG.scaledWidth + 2 : pG.scaledWidth / 2 + 2) : 0;
  const pWidthPx = pG
    ? modelToPx(pG.center.x + pG.perp.x * pWidthOff, pG.center.y + pG.perp.y * pWidthOff, tf)
    : null;

  const pickAccessory = (m: Pt): string | null => {
    if (!frames) return null;
    let hit: string | null = null; // último dentro del radio (orden de dibujo) = al frente
    for (const acc of accessories) {
      const f = frames.get(acc.id);
      if (!f) continue;
      const g = accGeom(acc, f.pos, f.angle);
      if (Math.hypot(m.x - g.center.x, m.y - g.center.y) <= g.radius) hit = acc.id;
    }
    return hit;
  };

  const create = useRef<{ id: string; base: Pt; anchorPos: Pt; anchorAngle: number; along: Pt; perp: Pt } | null>(null);
  const pencil = useRef<{ id: string; pts: Pt[]; anchorPos: Pt; along: Pt; perp: Pt } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>): void => {
    const svg = e.currentTarget;
    const vb = clientToViewBox(svg, e.clientX, e.clientY);
    const m = clientToModel(svg, e.clientX, e.clientY, tf);

    if (tool === 'eraser') {
      const id = pickAccessory(m);
      if (id) removeAccessory(id);
      return;
    }
    if (tool === 'pencil' && skel) {
      const anchorName = skel.anchors.torsoTop ? 'torsoTop' : 'hip';
      const anchor = skel.anchors[anchorName];
      const ar = (anchor.angle * Math.PI) / 180;
      const along = { x: Math.sin(ar), y: Math.cos(ar) };
      const perp = { x: Math.cos(ar), y: -Math.sin(ar) };
      const local = (pt: Pt): Pt => ({
        x: (pt.x - anchor.pos.x) * along.x + (pt.y - anchor.pos.y) * along.y,
        y: (pt.x - anchor.pos.x) * perp.x + (pt.y - anchor.pos.y) * perp.y,
      });
      const id = genId();
      const p0 = local(m);
      const acc: Accessory = {
        id, name: 'Trazo', anchor: anchorName, shape: 'path',
        offsetAlong: 0, offsetPerp: 0, angle: 0, length: 0, width: brushWidth,
        color: character.color, opacity: 1, front: true, points: [p0],
      };
      insertAccessory(acc);
      pencil.current = { id, pts: [p0], anchorPos: anchor.pos, along, perp };
      svg.setPointerCapture(e.pointerId);
      return;
    }
    if (tool === 'shape' && skel) {
      const anchorName = skel.anchors.torsoTop ? 'torsoTop' : 'hip';
      const anchor = skel.anchors[anchorName];
      const ar = (anchor.angle * Math.PI) / 180;
      const along = { x: Math.sin(ar), y: Math.cos(ar) };
      const perp = { x: Math.cos(ar), y: -Math.sin(ar) };
      const dx = m.x - anchor.pos.x;
      const dy = m.y - anchor.pos.y;
      const id = genId();
      const acc: Accessory = {
        id, name: shapeLabel(shapeKind), anchor: anchorName, shape: shapeKind,
        offsetAlong: dx * along.x + dy * along.y,
        offsetPerp: dx * perp.x + dy * perp.y,
        angle: 0, length: 2, width: shapeKind === 'circle' ? 2 : brushWidth,
        color: character.color, opacity: 1, front: true,
        ...(shapeKind === 'arc' ? { bend: 0.5 } : {}),
      };
      insertAccessory(acc);
      create.current = { id, base: m, anchorPos: anchor.pos, anchorAngle: anchor.angle, along, perp };
      svg.setPointerCapture(e.pointerId);
      return;
    }

    if (selAcc && selG) {
      if (tipPx && dist(vb, tipPx) < 13) {
        drag.current = { mode: 'tip', id: selAcc.id, base: selG.base, startAngle: selAcc.angle, grabA: angleDeg(selG.base, selG.tip) };
        svg.setPointerCapture(e.pointerId);
        return;
      }
      if (widthPx && dist(vb, widthPx) < 13) {
        drag.current = { mode: 'width', id: selAcc.id, base: isCircle ? selG.center : selG.center, perp: selG.perp, circle: !!isCircle };
        svg.setPointerCapture(e.pointerId);
        return;
      }
    }

    // Handles de la parte del cuerpo seleccionada (rotar+largo en la punta / grosor).
    if (selPart && pG) {
      if (pTipPx && dist(vb, pTipPx) < 13) {
        drag.current = {
          mode: 'partTip',
          part: selPart,
          pivot: pG.base,
          startTipAngle: angleDeg(pG.base, pG.tip),
          startRotate: parts[selPart].rotate ?? 0,
          startDist: Math.max(0.001, dist(pG.base, pG.tip)),
          startScale: parts[selPart].lengthScale ?? 1,
        };
        svg.setPointerCapture(e.pointerId);
        return;
      }
      if (pWidthPx && dist(vb, pWidthPx) < 13) {
        drag.current = {
          mode: 'partWidth',
          part: selPart,
          ref: pG.circle ? pG.center : pG.base,
          perp: pG.perp,
          baseWidth: pG.baseWidth,
          circle: pG.circle,
        };
        svg.setPointerCapture(e.pointerId);
        return;
      }
    }

    const id = pickAccessory(m);
    if (id && frames) {
      selectAccessory(id);
      const acc = accessories.find((a) => a.id === id)!;
      // Si la pieza pertenece a un arma/prop, mover todo el grupo junto.
      const group = acc.propId ? accessories.filter((a) => a.propId === acc.propId) : [acc];
      const members = group
        .map((a) => {
          const f = frames.get(a.id);
          if (!f) return null;
          const ar = (f.angle * Math.PI) / 180;
          return {
            id: a.id,
            a0: a.offsetAlong,
            p0: a.offsetPerp,
            along: { x: Math.sin(ar), y: Math.cos(ar) },
            perp: { x: Math.cos(ar), y: -Math.sin(ar) },
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);
      drag.current = { mode: 'move', start: m, members };
      svg.setPointerCapture(e.pointerId);
      return;
    }

    // Sin accesorio bajo el cursor: seleccionar una parte del cuerpo y moverla.
    const partHit = skel ? pickPart(skel, parts, m) : null;
    if (partHit) {
      selectPart(partHit);
      const st = parts[partHit];
      drag.current = { mode: 'partMove', part: partHit, start: m, startDx: st.dx ?? 0, startDy: st.dy ?? 0 };
      svg.setPointerCapture(e.pointerId);
      return;
    }
    selectAccessory(null);
    selectPart(null);
  };

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>): void => {
    const shift = e.shiftKey;
    if (pencil.current) {
      const m = clientToModel(e.currentTarget, e.clientX, e.clientY, tf);
      const pc = pencil.current;
      const p = {
        x: (m.x - pc.anchorPos.x) * pc.along.x + (m.y - pc.anchorPos.y) * pc.along.y,
        y: (m.x - pc.anchorPos.x) * pc.perp.x + (m.y - pc.anchorPos.y) * pc.perp.y,
      };
      if (shift) {
        updateAccessory(pc.id, { points: [pc.pts[0], p] });
      } else if (dist(p, pc.pts[pc.pts.length - 1]) >= 1.5) {
        pc.pts.push(p);
        updateAccessory(pc.id, { points: [...pc.pts] });
      }
      return;
    }
    if (create.current) {
      const m = clientToModel(e.currentTarget, e.clientX, e.clientY, tf);
      const cc = create.current;
      if (shapeKind === 'circle') {
        updateAccessory(cc.id, { width: Math.max(2, Math.round(dist(cc.base, m) * 2 * 10) / 10) });
      } else if (BOX_SHAPES.has(shapeKind)) {
        // Caja centrada en el clic; ejes de pantalla (dir hacia arriba). No rota.
        const dx = Math.abs(m.x - cc.base.x);
        const dy = Math.abs(m.y - cc.base.y);
        const length = Math.max(2, Math.round((shift ? Math.max(dx, dy) : dy) * 2 * 10) / 10);
        const width = Math.max(2, Math.round((shift ? Math.max(dx, dy) : dx) * 2 * 10) / 10);
        // dir de pantalla "arriba" (0,-1): base = centro + (0, length/2). angle = 180 - A.
        const bx = cc.base.x;
        const by = cc.base.y + length / 2;
        updateAccessory(cc.id, {
          angle: Math.round(180 - cc.anchorAngle),
          length,
          width,
          offsetAlong: (bx - cc.anchorPos.x) * cc.along.x + (by - cc.anchorPos.y) * cc.along.y,
          offsetPerp: (bx - cc.anchorPos.x) * cc.perp.x + (by - cc.anchorPos.y) * cc.perp.y,
        });
      } else {
        const a = accWorldAngleTo(cc.base, m) - cc.anchorAngle;
        updateAccessory(cc.id, {
          angle: Math.round(shift ? Math.round(a / 45) * 45 : a),
          length: Math.max(2, Math.round(dist(cc.base, m) * 10) / 10),
        });
      }
      return;
    }
    const d = drag.current;
    if (!d) return;
    const m = clientToModel(e.currentTarget, e.clientX, e.clientY, tf);
    if (d.mode === 'move') {
      const dx = m.x - d.start.x;
      const dy = m.y - d.start.y;
      for (const mem of d.members) {
        updateAccessory(mem.id, {
          offsetAlong: mem.a0 + dx * mem.along.x + dy * mem.along.y,
          offsetPerp: mem.p0 + dx * mem.perp.x + dy * mem.perp.y,
        });
      }
    } else if (d.mode === 'tip') {
      // Convención de accesorios: el ángulo de pantalla decrece al crecer acc.angle → resta.
      const a = d.startAngle - (angleDeg(d.base, m) - d.grabA);
      updateAccessory(d.id, {
        angle: Math.round(shift ? Math.round(a / 15) * 15 : a),
        length: Math.round(Math.max(1, dist(d.base, m)) * 10) / 10,
      });
    } else if (d.mode === 'width') {
      const off = Math.abs((m.x - d.base.x) * d.perp.x + (m.y - d.base.y) * d.perp.y);
      updateAccessory(d.id, { width: Math.max(1, Math.round((d.circle ? dist(d.base, m) * 2 : off * 2) * 10) / 10) });
    } else if (d.mode === 'partTip') {
      // Punta: rota la parte alrededor de su base y escala el largo (como accesorio).
      const scale = d.startScale * (dist(d.pivot, m) / d.startDist);
      setPartLengthScale(d.part, Math.min(4, Math.max(0.1, Math.round(scale * 100) / 100)));
      let rot = d.startRotate + (angleDeg(d.pivot, m) - d.startTipAngle);
      if (shift) rot = Math.round(rot / 15) * 15;
      setPartRotate(d.part, Math.round(rot * 10) / 10);
    } else if (d.mode === 'partMove') {
      setPartOffset(
        d.part,
        Math.round((d.startDx + (m.x - d.start.x)) * 10) / 10,
        Math.round((d.startDy + (m.y - d.start.y)) * 10) / 10,
      );
    } else {
      // partWidth: distancia perpendicular al eje (o radial en la cabeza) → widthScale.
      const off = d.circle
        ? dist(m, d.ref)
        : Math.abs((m.x - d.ref.x) * d.perp.x + (m.y - d.ref.y) * d.perp.y);
      const scale = d.circle ? off / d.baseWidth : (off * 2) / d.baseWidth;
      setPartWidthScale(d.part, Math.min(4, Math.max(0.1, Math.round(scale * 100) / 100)));
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

  const onContextMenu = (e: ReactMouseEvent<SVGSVGElement>): void => {
    e.preventDefault();
    const id = pickAccessory(clientToModel(e.currentTarget, e.clientX, e.clientY, tf));
    if (id) selectAccessory(id);
    setMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <Stack spacing={1} sx={{ height: '100%' }}>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <FormControlLabel
          control={<Switch size="small" checked={lightBg} onChange={(e) => setLightBg(e.target.checked)} />}
          label={t('Fondo claro')}
        />
        <FormControlLabel
          control={<Switch size="small" checked={onion} onChange={(e) => setOnion(e.target.checked)} />}
          label={t('Onion skin')}
        />
        <FormControlLabel
          control={<Switch size="small" checked={guides} onChange={(e) => setGuides(e.target.checked)} />}
          label={t('Guías')}
        />
      </Stack>

      <CanvasToolbar />

      <Box
        sx={{
          position: 'relative',
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          overflow: 'hidden',
          background: lightBg ? '#e9edf5' : CHECKER,
        }}
      >
        {refVisible && refImage && (
          <img
            src={refImage}
            alt="referencia"
            style={{
              position: 'absolute',
              maxWidth: '100%',
              maxHeight: '100%',
              opacity: refOpacity,
              transform: `scale(${refScale})`,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        )}
        <svg
          viewBox={`${-cs * 0.12} ${-cs * 0.12} ${cs * 1.24} ${cs * 1.24}`}
          style={{ width: '100%', maxWidth: 480, maxHeight: '100%', display: 'block', touchAction: 'none', cursor: tool === 'select' ? 'default' : 'crosshair' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onContextMenu={onContextMenu}
        >
          {/* Borde del canvas (lo que realmente se exporta). Lo de afuera se recorta. */}
          <rect x={0} y={0} width={cs} height={cs} fill="none" stroke="#7c9cff" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
          {guides && (
            <g stroke="#7c9cff" strokeWidth={1} opacity={0.5}>
              <line x1={0} y1={tf.groundY} x2={cs} y2={tf.groundY} strokeDasharray="6 4" />
              <line x1={tf.centerX} y1={0} x2={tf.centerX} y2={cs} strokeDasharray="6 4" />
            </g>
          )}
          {guides && bbox && (
            <rect
              x={bbox.minX}
              y={bbox.minY}
              width={bbox.maxX - bbox.minX}
              height={bbox.maxY - bbox.minY}
              fill="none"
              stroke="#ff9e64"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.7}
            />
          )}
          <g transform={rot}>
            {prevPrims && <PrimitiveGroup prims={prevPrims} color="#39d0d8" opacity={0.2} />}
            {nextPrims && <PrimitiveGroup prims={nextPrims} color="#ff6b9d" opacity={0.2} />}
          </g>
          {/* Personaje principal: markup con efectos (sombra/brillo) + giro. */}
          <g dangerouslySetInnerHTML={{ __html: characterInner }} />
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
          {/* Parte del cuerpo seleccionada: contorno + handles de largo/grosor (ámbar). */}
          {pCenterPx && (
            <>
              <circle cx={pCenterPx.x} cy={pCenterPx.y} r={pRadiusPx} fill="none" stroke="#f5b942" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
              {tool === 'select' && pTipPx && (
                <circle cx={pTipPx.x} cy={pTipPx.y} r={5} fill="#f5b942" stroke="#0b1220" strokeWidth={1.5} style={{ cursor: 'grab' }} />
              )}
              {tool === 'select' && pWidthPx && (
                <rect x={pWidthPx.x - 5} y={pWidthPx.y - 5} width={10} height={10} rx={2} fill="#fde68a" stroke="#0b1220" strokeWidth={1.5} style={{ cursor: 'nwse-resize' }} />
              )}
            </>
          )}
        </svg>
      </Box>

      <Typography variant="caption" color="text.secondary" align="center">
        {clip ? `${clip.name} · ${frame + 1}/${n}` : t('Sin clip activo')}
      </Typography>
      <CanvasContextMenu position={menu} onClose={() => setMenu(null)} />
    </Stack>
  );
};
