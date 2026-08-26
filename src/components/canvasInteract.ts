// Utilidades para manipular objetos directamente sobre el <svg> del preview:
// conversión puntero↔modelo y hit-testing. El viewBox del preview está en las
// mismas unidades que los píxeles del export (0..cellSize), así que la CTM del
// SVG mapea puntero→viewBox(px) y de ahí invertimos toPx para llegar al modelo.
import type { PxTransform } from '@core/svg';
import type { RBone } from '@core/customRig';
import type { PartName, Skeleton, Vec2 } from '@core/rig';
import { applyPartXform, PART_NAMES } from '@core/rig';
import type { PartsConfig } from '@core/poses';

export type Pt = { x: number; y: number };

// Formas que se crean como "caja" (bounding box centrado, sin rotar al arrastrar).
// Círculo/estrella/barra se crean radiales/direccionales.
export const BOX_SHAPES = new Set(['rect', 'triangle', 'trapezoid', 'bolt']);

// Nombre por defecto de una capa según su forma.
const SHAPE_LABELS: Record<string, string> = {
  rect: 'Rectángulo', circle: 'Círculo', triangle: 'Triángulo', trapezoid: 'Trapecio',
  star: 'Estrella', bolt: 'Rayo', capsule: 'Barra', path: 'Trazo', arc: 'Arco',
};
export const shapeLabel = (s: string): string => SHAPE_LABELS[s] ?? 'Forma';

export const clientToViewBox = (svg: SVGSVGElement, clientX: number, clientY: number): Pt => {
  const m = svg.getScreenCTM();
  if (!m) return { x: 0, y: 0 };
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const v = pt.matrixTransform(m.inverse());
  return { x: v.x, y: v.y };
};

export const pxToModel = (px: number, py: number, tf: PxTransform): Pt => ({
  x: (px - tf.centerX) / (tf.scale * (tf.flip ? -1 : 1)),
  y: (py - tf.groundY) / tf.scale + 100,
});

export const modelToPx = (x: number, y: number, tf: PxTransform): Pt => ({
  x: tf.centerX + x * tf.scale * (tf.flip ? -1 : 1),
  y: tf.groundY + (y - 100) * tf.scale,
});

// Puntero (cliente) → modelo, en un paso.
export const clientToModel = (svg: SVGSVGElement, clientX: number, clientY: number, tf: PxTransform): Pt => {
  const v = clientToViewBox(svg, clientX, clientY);
  return pxToModel(v.x, v.y, tf);
};

export const boneCenter = (b: RBone): Pt => {
  if (b.kind === 'circle') return { x: b.cx, y: b.cy };
  if (b.kind === 'rect' || b.kind === 'path') {
    const n = b.pts.length || 1;
    return { x: b.pts.reduce((s, p) => s + p.x, 0) / n, y: b.pts.reduce((s, p) => s + p.y, 0) / n };
  }
  return { x: (b.from.x + b.to.x) / 2, y: (b.from.y + b.to.y) / 2 };
};

export const boneRadius = (b: RBone): number => {
  if (b.kind === 'circle') return b.r;
  if (b.kind === 'rect' || b.kind === 'path') {
    const c = boneCenter(b);
    return Math.max(1, ...b.pts.map((p) => Math.hypot(p.x - c.x, p.y - c.y)));
  }
  return Math.max(b.width, Math.hypot(b.to.x - b.from.x, b.to.y - b.from.y) / 2);
};

// Base (nace) y punta de un hueso renderizado, para ubicar handles de rotar/escalar.
export const boneBaseTip = (b: RBone): { base: Pt; tip: Pt } => {
  if (b.kind === 'capsule') return { base: b.from, tip: b.to };
  if (b.kind === 'circle') return { base: { x: b.cx, y: b.cy }, tip: { x: b.cx, y: b.cy } };
  if (b.kind === 'path') {
    const c = boneCenter(b);
    return { base: c, tip: c };
  }
  const base = { x: (b.pts[0].x + b.pts[1].x) / 2, y: (b.pts[0].y + b.pts[1].y) / 2 };
  const tip =
    b.pts.length === 3
      ? b.pts[2]
      : { x: (b.pts[2].x + b.pts[3].x) / 2, y: (b.pts[2].y + b.pts[3].y) / 2 };
  return { base, tip };
};

export const dist = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.y - b.y);

// Cursor del handle de rotar: flecha circular (no hay keyword CSS estándar para
// "rotar", así que se dibuja a mano como cursor SVG en vez de usar 'grab').
export const ROTATE_CURSOR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 22 22'%3E%3Cpath d='M11 3a8 8 0 1 1-5.66 2.34' fill='none' stroke='white' stroke-width='4' stroke-linecap='round'/%3E%3Cpath d='M11 3a8 8 0 1 1-5.66 2.34' fill='none' stroke='black' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M3 2v5h5' fill='none' stroke='white' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M3 2v5h5' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\") 11 11, grab";

// --- Handles de resize por forma (estilo "esquinas reales", separados de rotar) ---
// Cada forma expone sus vértices/puntas reales como handles independientes; cada uno
// declara qué eje del objeto (largo/ancho/ambos/radial) controla al arrastrarlo, así
// nunca se superpone con el handle de rotación (que vive aparte, ver rotateHandlePos).
export type HandleAxis = 'length' | 'width' | 'both' | 'radial';
export type ShapeHandle = { readonly id: string; readonly pos: Pt; readonly axis: HandleAxis };

const at = (base: Pt, dir: Pt, perp: Pt, u: number, v: number): Pt => ({
  x: base.x + dir.x * u + perp.x * v,
  y: base.y + dir.y * u + perp.y * v,
});

// Réplica de la geometría de dibujo (svg.ts / shapes.ts / customRig.ts) para que cada
// handle caiga exactamente sobre el vértice/punta visible de la silueta.
export const shapeResizeHandles = (
  shape: string,
  base: Pt,
  dir: Pt,
  perp: Pt,
  length: number,
  width: number,
): ShapeHandle[] => {
  const hw = width / 2;
  if (shape === 'rect') {
    return [
      { id: 'nl', pos: at(base, dir, perp, 0, -hw), axis: 'width' },
      { id: 'nr', pos: at(base, dir, perp, 0, hw), axis: 'width' },
      { id: 'fl', pos: at(base, dir, perp, length, -hw), axis: 'both' },
      { id: 'fr', pos: at(base, dir, perp, length, hw), axis: 'both' },
    ];
  }
  if (shape === 'triangle') {
    return [
      { id: 'nl', pos: at(base, dir, perp, 0, -hw), axis: 'width' },
      { id: 'nr', pos: at(base, dir, perp, 0, hw), axis: 'width' },
      { id: 'apex', pos: at(base, dir, perp, length, 0), axis: 'length' },
    ];
  }
  if (shape === 'trapezoid') {
    const topHw = hw * 0.45;
    return [
      { id: 'nl', pos: at(base, dir, perp, 0, -hw), axis: 'width' },
      { id: 'nr', pos: at(base, dir, perp, 0, hw), axis: 'width' },
      { id: 'fl', pos: at(base, dir, perp, length, -topHw), axis: 'length' },
      { id: 'fr', pos: at(base, dir, perp, length, topHw), axis: 'length' },
    ];
  }
  if (shape === 'star') {
    // 5 puntas exteriores (i par del decágono de shapePolygon); cada una fija el radio
    // (= largo) según su distancia a la base, sin importar en qué punta se agarre.
    const R = Math.max(4, length);
    const out: ShapeHandle[] = [];
    for (let i = 0; i < 5; i += 1) {
      const a = (i * 2 * Math.PI) / 5;
      out.push({ id: `p${i}`, pos: at(base, dir, perp, Math.cos(a) * R, Math.sin(a) * R), axis: 'radial' });
    }
    return out;
  }
  if (shape === 'bolt') {
    // Puntas extremas reales del rayo: borde superior (ancho) y punta inferior (largo).
    const cross = Math.max(width, length * 0.5);
    return [
      { id: 'top', pos: at(base, dir, perp, 0, -0.5 * cross), axis: 'width' },
      { id: 'bot', pos: at(base, dir, perp, length, -0.2 * cross), axis: 'length' },
    ];
  }
  // capsule / arc / círculo tratado aparte: punta (largo) + costado (ancho).
  return [
    { id: 'tip', pos: at(base, dir, perp, length, 0), axis: 'length' },
    { id: 'w', pos: at(base, dir, perp, length, hw), axis: 'width' },
  ];
};

// Interpreta el arrastre de un handle de resize según su eje declarado.
// `keepAspect` (Shift): en vez de mover largo/ancho por separado, escala ambos desde
// la proporción ACTUAL de la forma — estándar Figma (a diferencia de crear una forma
// nueva con Shift, que fuerza 1:1; ver BOX_SHAPES en onPointerMove de los canvas).
export const applyHandleDrag = (
  axis: HandleAxis,
  base: Pt,
  dir: Pt,
  perp: Pt,
  drag: Pt,
  prevLength: number,
  prevWidth: number,
  keepAspect = false,
): { length: number; width: number } => {
  if (axis === 'radial') return { length: Math.max(1, dist(base, drag)), width: prevWidth };
  const u = (drag.x - base.x) * dir.x + (drag.y - base.y) * dir.y;
  const v = (drag.x - base.x) * perp.x + (drag.y - base.y) * perp.y;
  const rawLength = axis === 'width' ? prevLength : Math.max(1, u);
  const rawWidth = axis === 'length' ? prevWidth : Math.max(1, Math.abs(v) * 2);
  if (!keepAspect || prevLength <= 0 || prevWidth <= 0) {
    return { length: rawLength, width: rawWidth };
  }
  // Escala uniforme: el eje que cambió más (en proporción) manda.
  const scaleLen = rawLength / prevLength;
  const scaleWidth = rawWidth / prevWidth;
  const scale = Math.abs(scaleLen - 1) >= Math.abs(scaleWidth - 1) ? scaleLen : scaleWidth;
  return { length: Math.max(1, prevLength * scale), width: Math.max(1, prevWidth * scale) };
};

// Largo "efectivo" a lo largo de `dir` para ubicar el handle de rotar más allá de la
// punta (la estrella usa su radio real, que no es exactamente `length` si es chico).
export const rotateFarLength = (shape: string, length: number): number =>
  shape === 'star' ? Math.max(4, length) : length;

// Handle de rotación: separado del de resize, más allá de la punta a lo largo de `dir`.
export const rotateHandlePos = (base: Pt, dir: Pt, farLength: number, gap: number): Pt => ({
  x: base.x + dir.x * (farLength + gap),
  y: base.y + dir.y * (farLength + gap),
});

// Handle de curvatura del arco: sobre el punto de control real de la curva cuadrática
// (mismo cálculo que accessoriesToPrimitives / customRig.ts para el `ctrl`).
export const curveHandlePos = (base: Pt, dir: Pt, perp: Pt, length: number, bend: number): Pt => ({
  x: base.x + dir.x * (length / 2) + perp.x * (bend * length),
  y: base.y + dir.y * (length / 2) + perp.y * (bend * length),
});

// Arrastre del handle de curvatura → nuevo `bend` (fracción del largo), clamped como el slider.
export const applyCurveDrag = (base: Pt, dir: Pt, perp: Pt, length: number, drag: Pt): number => {
  if (length <= 0) return 0;
  const chordMid = { x: base.x + dir.x * (length / 2), y: base.y + dir.y * (length / 2) };
  const v = (drag.x - chordMid.x) * perp.x + (drag.y - chordMid.y) * perp.y;
  return Math.max(-1.5, Math.min(1.5, v / length));
};

// --- Zoom/pan del canvas (solo vista de edición; el export no lo usa) ---
export type ViewBox = { readonly x: number; readonly y: number; readonly w: number; readonly h: number };

// El viewBox "fit" original es [-cs*0.12 .. cs*1.12] en ambos ejes (cs*1.24 de lado),
// centrado en (cs/2, cs/2). El zoom encoge/agranda esa ventana; `pan` la recentra.
export const canvasViewBox = (cs: number, zoom: number, pan: Pt): ViewBox => {
  const w = (cs * 1.24) / zoom;
  const h = (cs * 1.24) / zoom;
  return { x: cs / 2 + pan.x - w / 2, y: cs / 2 + pan.y - h / 2, w, h };
};

// Nuevo (zoom, pan) tras aplicar `factor` manteniendo fijo `anchor` (coords de viewBox
// ANTES del cambio) bajo el cursor — zoom "hacia el puntero" como en Figma/Photoshop.
export const zoomViewBox = (
  cs: number,
  zoom: number,
  pan: Pt,
  factor: number,
  anchor: Pt,
  min = 0.5,
  max = 8,
): { zoom: number; pan: Pt } => {
  const vb = canvasViewBox(cs, zoom, pan);
  const fx = (anchor.x - vb.x) / vb.w;
  const fy = (anchor.y - vb.y) / vb.h;
  const newZoom = Math.max(min, Math.min(max, zoom * factor));
  const w2 = (cs * 1.24) / newZoom;
  const h2 = (cs * 1.24) / newZoom;
  return {
    zoom: newZoom,
    pan: { x: anchor.x - fx * w2 + w2 / 2 - cs / 2, y: anchor.y - fy * h2 + h2 / 2 - cs / 2 },
  };
};

// Distancia de un punto al segmento a→b (para hit-test de partes/huesos alargados).
export const pointSegDist = (p: Pt, a: Pt, b: Pt): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
};

// --- Partes del cuerpo como objetos manipulables ---
// El grosor NO se hornea en el esqueleto (ver rig.ts), así que skel.capsules trae
// el ancho SIN escalar; acá lo escalamos con parts[part].widthScale para dibujar y
// hit-testear. El largo SÍ está horneado (chain refleja lengthScale actual).
export type PartHandles = {
  readonly base: Pt;        // nace la cadena (para el handle de largo)
  readonly tip: Pt;         // extremo de la cadena
  readonly center: Pt;      // centro (selección + handle de grosor)
  readonly dir: Pt;         // eje base→tip (unidad)
  readonly perp: Pt;        // perpendicular al eje
  readonly baseWidth: number;   // ancho sin escalar (mapea handle → widthScale)
  readonly scaledWidth: number; // ancho con la escala actual
  readonly radius: number;      // radio de selección (unidad)
  readonly circle: boolean;     // cabeza: sin largo, grosor radial
};

const widthScaleOf = (parts: PartsConfig, part: PartName): number => {
  const v = parts[part]?.widthScale;
  return typeof v === 'number' && v > 0 ? v : 1;
};

// Base (pivote de rotación) de una parte y su transform libre (rotate + dx/dy).
const partBaseOf = (skel: Skeleton, part: PartName): Vec2 => {
  if (part === 'head') return skel.headCenter;
  const first = skel.capsules.find((c) => (c.part ?? 'torso') === part);
  return first ? first.from : { x: 0, y: 0 };
};
const xformOf = (skel: Skeleton, parts: PartsConfig, part: PartName): (p: Vec2) => Vec2 => {
  const st = parts[part];
  const rot = st?.rotate ?? 0;
  const dx = st?.dx ?? 0;
  const dy = st?.dy ?? 0;
  if (!rot && !dx && !dy) return (p) => p;
  const pivot = partBaseOf(skel, part);
  return (p) => applyPartXform(p, pivot, rot, dx, dy);
};

export const partGeom = (skel: Skeleton, parts: PartsConfig, part: PartName): PartHandles => {
  const ws = widthScaleOf(parts, part);
  const xf = xformOf(skel, parts, part);
  if (part === 'head') {
    const c = xf(skel.headCenter);
    return {
      base: c, tip: c, center: c,
      dir: { x: 0, y: -1 }, perp: { x: 1, y: 0 },
      baseWidth: skel.headRadius, scaledWidth: skel.headRadius * ws,
      radius: skel.headRadius * ws, circle: true,
    };
  }
  const caps = skel.capsules.filter((c) => (c.part ?? 'torso') === part);
  if (caps.length === 0) {
    const z = { x: 0, y: 0 };
    return { base: z, tip: z, center: z, dir: { x: 0, y: 1 }, perp: { x: 1, y: 0 }, baseWidth: 1, scaledWidth: ws, radius: ws, circle: false };
  }
  const base = xf(caps[0].from);
  const tip = xf(caps[caps.length - 1].to);
  const center = { x: (base.x + tip.x) / 2, y: (base.y + tip.y) / 2 };
  const dx = tip.x - base.x;
  const dy = tip.y - base.y;
  const len = Math.hypot(dx, dy) || 1;
  const dir = { x: dx / len, y: dy / len };
  const perp = { x: dir.y, y: -dir.x };
  const baseWidth = caps[0].width;
  const scaledWidth = baseWidth * ws;
  // Radio de selección: alcanza el punto (transformado) más lejano + medio ancho.
  let far = 0;
  for (const c of caps) {
    far = Math.max(far, dist(center, xf(c.from)), dist(center, xf(c.to)));
  }
  return { base, tip, center, dir, perp, baseWidth, scaledWidth, radius: far + scaledWidth / 2, circle: false };
};

// Parte del cuerpo bajo el punto (modelo). Recorre en orden de dibujo (PART_NAMES);
// la última que califica gana (queda al frente). Ignora partes ocultas.
export const pickPart = (skel: Skeleton, parts: PartsConfig, p: Pt): PartName | null => {
  let hit: PartName | null = null;
  const margin = 2;
  for (const name of PART_NAMES) {
    if (!parts[name]?.visible) continue;
    const xf = xformOf(skel, parts, name);
    if (name === 'head') {
      const c = xf(skel.headCenter);
      const r = skel.headRadius * widthScaleOf(parts, 'head');
      if (dist(p, c) <= r + margin) hit = 'head';
      continue;
    }
    const ws = widthScaleOf(parts, name);
    for (const c of skel.capsules) {
      if ((c.part ?? 'torso') !== name) continue;
      if (pointSegDist(p, xf(c.from), xf(c.to)) <= (c.width * ws) / 2 + margin) {
        hit = name;
        break;
      }
    }
  }
  return hit;
};

// Ángulo de hueso (raíz) para que apunte de `base` a `target`: dirOf(θ)=(sinθ,-cosθ).
export const boneAngleTo = (base: Pt, target: Pt): number =>
  (Math.atan2(target.x - base.x, -(target.y - base.y)) * 180) / Math.PI;

// Ángulo mundo de accesorio para apuntar de `base` a `target`: dir=(sinφ,cosφ).
export const accWorldAngleTo = (base: Pt, target: Pt): number =>
  (Math.atan2(target.x - base.x, target.y - base.y) * 180) / Math.PI;

// Ángulo (grados) del vector a→b, en la convención de pantalla (y hacia abajo).
export const angleDeg = (a: Pt, b: Pt): number => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;

// Hueso bajo el punto: el más al frente (mayor z) cuyo radio contiene al punto.
// `bones` viene ordenado ascendente por z, así que el último que califica gana.
export const pickBone = (bones: readonly RBone[], p: Pt): string | null => {
  let hit: string | null = null;
  for (const b of bones) {
    const c = boneCenter(b);
    if (Math.hypot(p.x - c.x, p.y - c.y) <= boneRadius(b) + 6) hit = b.id;
  }
  return hit;
};
