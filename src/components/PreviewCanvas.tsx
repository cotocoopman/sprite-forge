import { useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactElement } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { useProjectStore } from '@store/useProjectStore';
import { useT } from '@/i18n';
import { useActiveClip } from '@/hooks/useActiveClip';
import { buildSkeleton } from '@core/rig';
import type { Pose } from '@core/rig';
import { sampleClip } from '@core/poses';
import { makeTransform, renderCharacterInner, skeletonToPrimitives } from '@core/svg';
import type { SvgPrimitive } from '@core/svg';
import { clientToModel, modelToPx } from '@components/canvasInteract';
import type { Pt } from '@components/canvasInteract';
import type { Accessory } from '@core/poses';

// Centro (modelo) y base ortonormal del ancla de un accesorio, para hit-test y drag.
const accGeom = (
  acc: Accessory,
  anchorPos: Pt,
  anchorAngle: number,
): { center: Pt; along: Pt; perp: Pt; radius: number } => {
  const ar = (anchorAngle * Math.PI) / 180;
  const along = { x: Math.sin(ar), y: Math.cos(ar) };
  const perp = { x: Math.cos(ar), y: -Math.sin(ar) };
  const base = {
    x: anchorPos.x + acc.offsetAlong * along.x + acc.offsetPerp * perp.x,
    y: anchorPos.y + acc.offsetAlong * along.y + acc.offsetPerp * perp.y,
  };
  const sr = ((anchorAngle + acc.angle) * Math.PI) / 180;
  const dir = { x: Math.sin(sr), y: Math.cos(sr) };
  const half = acc.shape === 'circle' ? 0 : acc.length / 2;
  const center = { x: base.x + dir.x * half, y: base.y + dir.y * half };
  const radius = Math.max(acc.width / 2, acc.length / 2) + 6;
  return { center, along, perp, radius };
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
    {prims.map((p, i) =>
      p.kind === 'line' ? (
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
      ) : (
        <circle key={i} cx={p.cx} cy={p.cy} r={p.r} />
      ),
    )}
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

  const { poses, frame } = useMemo(() => {
    if (!clip) return { poses: [] as Pose[], frame: 0 };
    const sampled = sampleClip(clip);
    const f = Math.max(0, Math.min(sampled.length - 1, currentFrame));
    return { poses: sampled, frame: f };
  }, [clip, currentFrame]);

  const primsFor = (pose: Pose): SvgPrimitive[] =>
    skeletonToPrimitives(buildSkeleton(character, pose, render.facing), render);

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

  // --- Manipulación en canvas: seleccionar y mover accesorios ---
  const skel = poses[frame] ? buildSkeleton(character, poses[frame], render.facing) : null;
  const drag = useRef<{ id: string; start: Pt; along: Pt; perp: Pt; a0: number; p0: number } | null>(null);

  const pickAccessory = (m: Pt): string | null => {
    if (!skel) return null;
    let hit: string | null = null; // último dentro del radio (orden de dibujo) = al frente
    for (const acc of accessories) {
      const anchor = skel.anchors[acc.anchor];
      if (!anchor) continue;
      const g = accGeom(acc, anchor.pos, anchor.angle);
      if (Math.hypot(m.x - g.center.x, m.y - g.center.y) <= g.radius) hit = acc.id;
    }
    return hit;
  };

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>): void => {
    const svg = e.currentTarget;
    const m = clientToModel(svg, e.clientX, e.clientY, tf);
    const id = pickAccessory(m);
    selectAccessory(id);
    if (id && skel) {
      const acc = accessories.find((a) => a.id === id)!;
      const anchor = skel.anchors[acc.anchor];
      const g = accGeom(acc, anchor.pos, anchor.angle);
      drag.current = { id, start: m, along: g.along, perp: g.perp, a0: acc.offsetAlong, p0: acc.offsetPerp };
      svg.setPointerCapture(e.pointerId);
    }
  };

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>): void => {
    if (!drag.current) return;
    const m = clientToModel(e.currentTarget, e.clientX, e.clientY, tf);
    const { id, start, along, perp, a0, p0 } = drag.current;
    const dx = m.x - start.x;
    const dy = m.y - start.y;
    // Descompone el desplazamiento en los ejes del hueso (base ortonormal).
    updateAccessory(id, {
      offsetAlong: a0 + dx * along.x + dy * along.y,
      offsetPerp: p0 + dx * perp.x + dy * perp.y,
    });
  };

  const endDrag = (e: ReactPointerEvent<SVGSVGElement>): void => {
    if (drag.current) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
      drag.current = null;
    }
  };

  const selAcc = skel && activeAccessoryId ? accessories.find((a) => a.id === activeAccessoryId) : null;
  const selAnchor = selAcc && skel ? skel.anchors[selAcc.anchor] : null;
  const selCenter = selAcc && selAnchor ? accGeom(selAcc, selAnchor.pos, selAnchor.angle) : null;
  const selPx = selCenter ? modelToPx(selCenter.center.x, selCenter.center.y, tf) : null;
  const selR = selCenter ? selCenter.radius * tf.scale : 0;

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
          style={{ width: '100%', maxWidth: 480, maxHeight: '100%', display: 'block', touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
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
            <circle cx={selPx.x} cy={selPx.y} r={selR} fill="none" stroke="#22d3ee" strokeWidth={2} strokeDasharray="5 4" />
          )}
        </svg>
      </Box>

      <Typography variant="caption" color="text.secondary" align="center">
        {clip ? `${clip.name} · ${frame + 1}/${n}` : t('Sin clip activo')}
      </Typography>
    </Stack>
  );
};
