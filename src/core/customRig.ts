// Rig genérico basado en un árbol de huesos (para criaturas no-humanoides).
// Núcleo puro: FK del árbol → huesos renderizables. Sin React ni DOM.

import type { Vec2 } from './rig';

export type BoneShape = 'capsule' | 'circle' | 'rect';

export type Bone = {
  readonly id: string;
  readonly name: string;
  readonly parentId: string | null; // null = hueso raíz
  readonly attach: number;          // 0..1: dónde nace sobre el hueso padre
  readonly angle: number;           // grados, relativo al padre (raíz: absoluto). 0 = hacia arriba
  readonly length: number;
  readonly width: number;
  readonly shape: BoneShape;
  readonly curve: number;           // curvatura suave (0 = recto)
  readonly color: string | null;    // null = color base del rig
  readonly z: number;               // orden de dibujo (menor = atrás)
};

export type CustomRig = {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly origin: Vec2; // posición del hueso raíz (espacio de 100 de alto, y abajo)
  readonly bones: readonly Bone[];
};

export type RBone =
  | { readonly kind: 'capsule'; readonly from: Vec2; readonly to: Vec2; readonly ctrl?: Vec2; readonly width: number; readonly color: string; readonly z: number }
  | { readonly kind: 'circle'; readonly cx: number; readonly cy: number; readonly r: number; readonly color: string; readonly z: number }
  | { readonly kind: 'rect'; readonly pts: readonly Vec2[]; readonly color: string; readonly z: number };

const rad = (deg: number): number => (deg * Math.PI) / 180;
const dirOf = (angleDeg: number): Vec2 => ({ x: Math.sin(rad(angleDeg)), y: -Math.cos(rad(angleDeg)) });

// Cinemática directa: resuelve la posición/ángulo mundial de cada hueso y lo
// convierte a una forma renderizable. Tolerante a padres faltantes o ciclos.
export const buildCustomSkeleton = (rig: CustomRig): RBone[] => {
  const byId = new Map(rig.bones.map((b) => [b.id, b]));
  const waCache = new Map<string, number>();
  const baseCache = new Map<string, Vec2>();

  const worldAngle = (b: Bone, seen: ReadonlySet<string>): number => {
    const cached = waCache.get(b.id);
    if (cached !== undefined) return cached;
    const parent = b.parentId ? byId.get(b.parentId) : undefined;
    const wa = parent && !seen.has(parent.id) ? worldAngle(parent, new Set([...seen, b.id])) + b.angle : b.angle;
    waCache.set(b.id, wa);
    return wa;
  };

  const baseOf = (b: Bone, seen: ReadonlySet<string>): Vec2 => {
    const cached = baseCache.get(b.id);
    if (cached) return cached;
    const parent = b.parentId ? byId.get(b.parentId) : undefined;
    let base: Vec2;
    if (!parent || seen.has(parent.id)) {
      base = rig.origin;
    } else {
      const pBase = baseOf(parent, new Set([...seen, b.id]));
      const pDir = dirOf(worldAngle(parent, new Set([...seen, b.id])));
      const d = parent.length * Math.max(0, Math.min(1, b.attach));
      base = { x: pBase.x + pDir.x * d, y: pBase.y + pDir.y * d };
    }
    baseCache.set(b.id, base);
    return base;
  };

  const out: RBone[] = [];
  for (const b of rig.bones) {
    const wa = worldAngle(b, new Set([b.id]));
    const base = baseOf(b, new Set([b.id]));
    const dir = dirOf(wa);
    const tip = { x: base.x + dir.x * b.length, y: base.y + dir.y * b.length };
    const color = b.color ?? rig.color;

    if (b.shape === 'circle') {
      const cx = base.x + dir.x * (b.length / 2);
      const cy = base.y + dir.y * (b.length / 2);
      out.push({ kind: 'circle', cx, cy, r: b.width / 2, color, z: b.z });
    } else if (b.shape === 'rect') {
      const perp = { x: Math.cos(rad(wa)), y: Math.sin(rad(wa)) };
      const hw = b.width / 2;
      out.push({
        kind: 'rect',
        pts: [
          { x: base.x + perp.x * hw, y: base.y + perp.y * hw },
          { x: base.x - perp.x * hw, y: base.y - perp.y * hw },
          { x: tip.x - perp.x * hw, y: tip.y - perp.y * hw },
          { x: tip.x + perp.x * hw, y: tip.y + perp.y * hw },
        ],
        color,
        z: b.z,
      });
    } else {
      let ctrl: Vec2 | undefined;
      if (b.curve) {
        const dx = tip.x - base.x;
        const dy = tip.y - base.y;
        const len = Math.hypot(dx, dy);
        if (len > 0) {
          const px = dy / len;
          const py = -dx / len;
          const off = b.curve * len;
          ctrl = { x: (base.x + tip.x) / 2 + px * off, y: (base.y + tip.y) / 2 + py * off };
        }
      }
      out.push({ kind: 'capsule', from: base, to: tip, width: b.width, color, z: b.z, ...(ctrl ? { ctrl } : {}) });
    }
  }

  return out.sort((a, b) => a.z - b.z);
};

const bone = (b: Bone): Bone => b;

// Cuadrúpedo simple (perro/caballo) de perfil.
export const buildQuadrupedRig = (): CustomRig => ({
  id: 'quadruped',
  name: 'Cuadrúpedo',
  color: '#000000',
  origin: { x: -22, y: 55 },
  bones: [
    bone({ id: 'spine', name: 'Lomo', parentId: null, attach: 0, angle: 90, length: 44, width: 16, shape: 'capsule', curve: 0, color: null, z: 1 }),
    bone({ id: 'neck', name: 'Cuello', parentId: 'spine', attach: 0.92, angle: -55, length: 16, width: 11, shape: 'capsule', curve: 0, color: null, z: 2 }),
    bone({ id: 'head', name: 'Cabeza', parentId: 'neck', attach: 1, angle: 20, length: 18, width: 18, shape: 'circle', curve: 0, color: null, z: 3 }),
    bone({ id: 'tail', name: 'Cola', parentId: 'spine', attach: 0.05, angle: -135, length: 18, width: 6, shape: 'capsule', curve: 0.25, color: null, z: 1 }),
    bone({ id: 'legFF', name: 'Pata del. lejana', parentId: 'spine', attach: 0.86, angle: 90, length: 40, width: 6, shape: 'capsule', curve: 0, color: null, z: 0 }),
    bone({ id: 'legBF', name: 'Pata tras. lejana', parentId: 'spine', attach: 0.2, angle: 90, length: 40, width: 6, shape: 'capsule', curve: 0, color: null, z: 0 }),
    bone({ id: 'legFN', name: 'Pata del. cercana', parentId: 'spine', attach: 0.8, angle: 90, length: 40, width: 7, shape: 'capsule', curve: 0, color: null, z: 2 }),
    bone({ id: 'legBN', name: 'Pata tras. cercana', parentId: 'spine', attach: 0.14, angle: 90, length: 40, width: 7, shape: 'capsule', curve: 0, color: null, z: 2 }),
  ],
});

// Ave de perfil: cuerpo ovalado, cabeza, pico, cola, alas y patas.
export const buildBirdRig = (): CustomRig => ({
  id: 'bird',
  name: 'Ave',
  color: '#000000',
  origin: { x: 4, y: 52 },
  bones: [
    bone({ id: 'body', name: 'Cuerpo', parentId: null, attach: 0, angle: 70, length: 30, width: 26, shape: 'capsule', curve: 0.15, color: null, z: 1 }),
    bone({ id: 'tail', name: 'Cola', parentId: 'body', attach: 0.02, angle: -150, length: 20, width: 12, shape: 'capsule', curve: 0, color: null, z: 0 }),
    bone({ id: 'neck', name: 'Cuello', parentId: 'body', attach: 0.95, angle: -35, length: 8, width: 9, shape: 'capsule', curve: 0, color: null, z: 2 }),
    bone({ id: 'head', name: 'Cabeza', parentId: 'neck', attach: 1, angle: 10, length: 14, width: 14, shape: 'circle', curve: 0, color: null, z: 3 }),
    bone({ id: 'beak', name: 'Pico', parentId: 'head', attach: 1, angle: 25, length: 8, width: 4, shape: 'capsule', curve: 0, color: null, z: 3 }),
    bone({ id: 'wing', name: 'Ala', parentId: 'body', attach: 0.5, angle: -120, length: 20, width: 10, shape: 'capsule', curve: 0.3, color: null, z: 2 }),
    bone({ id: 'legL', name: 'Pata izq.', parentId: 'body', attach: 0.4, angle: 100, length: 16, width: 3, shape: 'capsule', curve: 0, color: null, z: 0 }),
    bone({ id: 'legR', name: 'Pata der.', parentId: 'body', attach: 0.5, angle: 100, length: 16, width: 3, shape: 'capsule', curve: 0, color: null, z: 2 }),
  ],
});

// Slime: cuerpo grande y bajo con dos ojos.
export const buildSlimeRig = (): CustomRig => ({
  id: 'slime',
  name: 'Slime',
  color: '#000000',
  origin: { x: 0, y: 82 },
  bones: [
    bone({ id: 'body', name: 'Cuerpo', parentId: null, attach: 0, angle: 0, length: 4, width: 60, shape: 'circle', curve: 0, color: null, z: 0 }),
    bone({ id: 'eyeL', name: 'Ojo izq.', parentId: 'body', attach: 0, angle: -30, length: 22, width: 8, shape: 'circle', curve: 0, color: '#ffffff', z: 1 }),
    bone({ id: 'eyeR', name: 'Ojo der.', parentId: 'body', attach: 0, angle: 30, length: 22, width: 8, shape: 'circle', curve: 0, color: '#ffffff', z: 1 }),
  ],
});

// Vacío: un solo hueso para empezar de cero.
export const buildBlankRig = (): CustomRig => ({
  id: 'blank',
  name: 'Nuevo rig',
  color: '#000000',
  origin: { x: 0, y: 90 },
  bones: [
    bone({ id: 'root', name: 'raíz', parentId: null, attach: 0, angle: 0, length: 40, width: 8, shape: 'capsule', curve: 0, color: null, z: 0 }),
  ],
});

export const RIG_PRESETS: readonly { readonly id: string; readonly name: string; readonly build: () => CustomRig }[] = [
  { id: 'quadruped', name: 'Cuadrúpedo', build: buildQuadrupedRig },
  { id: 'bird', name: 'Ave', build: buildBirdRig },
  { id: 'slime', name: 'Slime', build: buildSlimeRig },
  { id: 'blank', name: 'Vacío', build: buildBlankRig },
];

// Rig por defecto del proyecto.
export const buildDefaultCustomRig = (): CustomRig => buildQuadrupedRig();
