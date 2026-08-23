// Utilidades para manipular objetos directamente sobre el <svg> del preview:
// conversión puntero↔modelo y hit-testing. El viewBox del preview está en las
// mismas unidades que los píxeles del export (0..cellSize), así que la CTM del
// SVG mapea puntero→viewBox(px) y de ahí invertimos toPx para llegar al modelo.
import type { PxTransform } from '@core/svg';
import type { RBone } from '@core/customRig';

export type Pt = { x: number; y: number };

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
  if (b.kind === 'rect') {
    const n = b.pts.length;
    return { x: b.pts.reduce((s, p) => s + p.x, 0) / n, y: b.pts.reduce((s, p) => s + p.y, 0) / n };
  }
  return { x: (b.from.x + b.to.x) / 2, y: (b.from.y + b.to.y) / 2 };
};

export const boneRadius = (b: RBone): number => {
  if (b.kind === 'circle') return b.r;
  if (b.kind === 'rect') {
    const c = boneCenter(b);
    return Math.max(...b.pts.map((p) => Math.hypot(p.x - c.x, p.y - c.y)));
  }
  return Math.max(b.width, Math.hypot(b.to.x - b.from.x, b.to.y - b.from.y) / 2);
};

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
