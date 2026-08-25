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
  star: 'Estrella', bolt: 'Rayo', capsule: 'Barra', path: 'Trazo',
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
