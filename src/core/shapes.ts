// Generación de polígonos paramétricos (estrella, trapecio, rayo) en coordenadas
// de MUNDO, a partir de la base del objeto, su dirección/perpendicular (unitarios)
// y su largo/ancho. Módulo puro y hoja (solo depende de Vec2) para que lo usen
// tanto el render de accesorios (svg.ts) como el de huesos (customRig.ts).
import type { Vec2 } from './rig';

export type PolyShape = 'star' | 'trapezoid' | 'bolt';

export const isPolyShape = (s: string): s is PolyShape =>
  s === 'star' || s === 'trapezoid' || s === 'bolt';

const add = (base: Vec2, dir: Vec2, perp: Vec2, u: number, v: number): Vec2 => ({
  x: base.x + dir.x * u + perp.x * v,
  y: base.y + dir.y * u + perp.y * v,
});

// Rayo (lightning) normalizado: u a lo largo del eje (0..1), v cruzado (−0.5..0.5).
// El ancho escala con el largo (no con `width`) para que siempre luzca proporcionado.
const BOLT: readonly [number, number][] = [
  [0.0, 0.5], [0.62, 0.06], [0.34, 0.06], [1.0, -0.5],
  [0.38, -0.06], [0.66, -0.06],
];

export const shapePolygon = (
  kind: PolyShape,
  base: Vec2,
  dir: Vec2,
  perp: Vec2,
  length: number,
  width: number,
): Vec2[] => {
  const hw = width / 2;
  if (kind === 'trapezoid') {
    const topHw = hw * 0.45;
    return [
      add(base, dir, perp, 0, hw),
      add(base, dir, perp, 0, -hw),
      add(base, dir, perp, length, -topHw),
      add(base, dir, perp, length, topHw),
    ];
  }
  if (kind === 'star') {
    // Centro en la base, punta hacia `dir`; radio exterior = largo del arrastre.
    const R = Math.max(4, length);
    const r = R * 0.42;
    const pts: Vec2[] = [];
    for (let i = 0; i < 10; i += 1) {
      const rad = i % 2 === 0 ? R : r;
      const a = (i * Math.PI) / 5; // 36° por paso; i=0 apunta a `dir`
      pts.push(add(base, dir, perp, Math.cos(a) * rad, Math.sin(a) * rad));
    }
    return pts;
  }
  // bolt — ancho proporcional al largo del arrastre.
  const cross = Math.max(width, length * 0.5);
  return BOLT.map(([u, v]) => add(base, dir, perp, u * length, v * cross));
};
