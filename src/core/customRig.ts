// Rig genérico basado en un árbol de huesos (para criaturas no-humanoides).
// Núcleo puro: FK del árbol → huesos renderizables. Sin React ni DOM.

import type { Vec2 } from './rig';
import type { EasingKind } from './easing';
import { applyEasing } from './easing';

export type BoneShape = 'capsule' | 'circle' | 'rect';

// Pose de un rig: offset de ángulo por hueso (se suma al ángulo de reposo).
export type RigPose = Record<string, number>;

export type RigKeyframe = { readonly t: number; readonly pose: RigPose; readonly easing?: EasingKind };

export type RigClip = {
  readonly id: string;
  readonly name: string;
  readonly frames: number;
  readonly fps: number;
  readonly loop: boolean;
  readonly keyframes: readonly RigKeyframe[];
};

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
  readonly animations: readonly RigClip[];
};

export type RBone =
  | { readonly kind: 'capsule'; readonly from: Vec2; readonly to: Vec2; readonly ctrl?: Vec2; readonly width: number; readonly color: string; readonly z: number }
  | { readonly kind: 'circle'; readonly cx: number; readonly cy: number; readonly r: number; readonly color: string; readonly z: number }
  | { readonly kind: 'rect'; readonly pts: readonly Vec2[]; readonly color: string; readonly z: number };

const rad = (deg: number): number => (deg * Math.PI) / 180;
const dirOf = (angleDeg: number): Vec2 => ({ x: Math.sin(rad(angleDeg)), y: -Math.cos(rad(angleDeg)) });

// Cinemática directa: resuelve la posición/ángulo mundial de cada hueso y lo
// convierte a una forma renderizable. Tolerante a padres faltantes o ciclos.
// `pose` suma offsets de ángulo por hueso (para animar).
export const buildCustomSkeleton = (rig: CustomRig, pose?: RigPose): RBone[] => {
  const byId = new Map(rig.bones.map((b) => [b.id, b]));
  const waCache = new Map<string, number>();
  const baseCache = new Map<string, Vec2>();

  const localAngle = (b: Bone): number => b.angle + (pose?.[b.id] ?? 0);

  const worldAngle = (b: Bone, seen: ReadonlySet<string>): number => {
    const cached = waCache.get(b.id);
    if (cached !== undefined) return cached;
    const parent = b.parentId ? byId.get(b.parentId) : undefined;
    const wa = parent && !seen.has(parent.id)
      ? worldAngle(parent, new Set([...seen, b.id])) + localAngle(b)
      : localAngle(b);
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

// --- Animación del rig ---
export const lerpRigPose = (a: RigPose, b: RigPose, k: number): RigPose => {
  const out: RigPose = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const av = a[key] ?? 0;
    const bv = b[key] ?? 0;
    out[key] = av + (bv - av) * k;
  }
  return out;
};

export const rigPoseAt = (keyframes: readonly RigKeyframe[], t: number): RigPose => {
  if (keyframes.length === 0) return {};
  if (keyframes.length === 1) return keyframes[0].pose;
  const sorted = [...keyframes].sort((x, y) => x.t - y.t);
  if (t <= sorted[0].t) return sorted[0].pose;
  const last = sorted[sorted.length - 1];
  if (t >= last.t) return last.pose;
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const cur = sorted[i];
    const next = sorted[i + 1];
    if (t >= cur.t && t <= next.t) {
      const span = next.t - cur.t;
      const k = span === 0 ? 0 : (t - cur.t) / span;
      return lerpRigPose(cur.pose, next.pose, applyEasing(k, cur.easing));
    }
  }
  return last.pose;
};

export const sampleRigClip = (clip: RigClip): RigPose[] => {
  const out: RigPose[] = [];
  const n = Math.max(1, clip.frames);
  for (let i = 0; i < n; i += 1) {
    const denom = clip.loop ? n : Math.max(1, n - 1);
    const t = n === 1 ? 0 : i / denom;
    out.push(rigPoseAt(clip.keyframes, t));
  }
  return out;
};

const idleClip = (): RigClip => ({
  id: 'idle',
  name: 'idle',
  frames: 8,
  fps: 8,
  loop: true,
  keyframes: [
    { t: 0, pose: {} },
    { t: 1, pose: {} },
  ],
});

const bone = (b: Bone): Bone => b;

// Cuadrúpedo simple (perro/caballo) de perfil.
export const buildQuadrupedRig = (): CustomRig => ({
  id: 'quadruped',
  name: 'Quadruped',
  color: '#000000',
  origin: { x: -22, y: 55 },
  bones: [
    bone({ id: 'spine', name: 'Spine', parentId: null, attach: 0, angle: 90, length: 44, width: 16, shape: 'capsule', curve: 0, color: null, z: 1 }),
    bone({ id: 'neck', name: 'Neck', parentId: 'spine', attach: 0.92, angle: -55, length: 16, width: 11, shape: 'capsule', curve: 0, color: null, z: 2 }),
    bone({ id: 'head', name: 'Head', parentId: 'neck', attach: 1, angle: 20, length: 18, width: 18, shape: 'circle', curve: 0, color: null, z: 3 }),
    bone({ id: 'tail', name: 'Tail', parentId: 'spine', attach: 0.05, angle: -135, length: 18, width: 6, shape: 'capsule', curve: 0.25, color: null, z: 1 }),
    bone({ id: 'legFF', name: 'Front leg (far)', parentId: 'spine', attach: 0.86, angle: 90, length: 40, width: 6, shape: 'capsule', curve: 0, color: null, z: 0 }),
    bone({ id: 'legBF', name: 'Back leg (far)', parentId: 'spine', attach: 0.2, angle: 90, length: 40, width: 6, shape: 'capsule', curve: 0, color: null, z: 0 }),
    bone({ id: 'legFN', name: 'Front leg (near)', parentId: 'spine', attach: 0.8, angle: 90, length: 40, width: 7, shape: 'capsule', curve: 0, color: null, z: 2 }),
    bone({ id: 'legBN', name: 'Back leg (near)', parentId: 'spine', attach: 0.14, angle: 90, length: 40, width: 7, shape: 'capsule', curve: 0, color: null, z: 2 }),
  ],
  animations: [
    idleClip(),
    {
      id: 'walk',
      name: 'walk',
      frames: 8,
      fps: 10,
      loop: true,
      keyframes: [
        { t: 0, pose: { legFF: 24, legBN: 24, legFN: -24, legBF: -24, neck: 4 } },
        { t: 0.5, pose: { legFF: -24, legBN: -24, legFN: 24, legBF: 24, neck: -4 } },
        { t: 1, pose: { legFF: 24, legBN: 24, legFN: -24, legBF: -24, neck: 4 } },
      ],
    },
  ],
});

// Ave de perfil: cuerpo ovalado, cabeza, pico, cola, alas y patas.
export const buildBirdRig = (): CustomRig => ({
  id: 'bird',
  name: 'Bird',
  color: '#000000',
  origin: { x: 4, y: 52 },
  bones: [
    bone({ id: 'body', name: 'Body', parentId: null, attach: 0, angle: 70, length: 30, width: 26, shape: 'capsule', curve: 0.15, color: null, z: 1 }),
    bone({ id: 'tail', name: 'Tail', parentId: 'body', attach: 0.02, angle: -150, length: 20, width: 12, shape: 'capsule', curve: 0, color: null, z: 0 }),
    bone({ id: 'neck', name: 'Neck', parentId: 'body', attach: 0.95, angle: -35, length: 8, width: 9, shape: 'capsule', curve: 0, color: null, z: 2 }),
    bone({ id: 'head', name: 'Head', parentId: 'neck', attach: 1, angle: 10, length: 14, width: 14, shape: 'circle', curve: 0, color: null, z: 3 }),
    bone({ id: 'beak', name: 'Beak', parentId: 'head', attach: 1, angle: 25, length: 8, width: 4, shape: 'capsule', curve: 0, color: null, z: 3 }),
    bone({ id: 'wing', name: 'Wing', parentId: 'body', attach: 0.5, angle: -120, length: 20, width: 10, shape: 'capsule', curve: 0.3, color: null, z: 2 }),
    bone({ id: 'legL', name: 'Left leg', parentId: 'body', attach: 0.4, angle: 100, length: 16, width: 3, shape: 'capsule', curve: 0, color: null, z: 0 }),
    bone({ id: 'legR', name: 'Right leg', parentId: 'body', attach: 0.5, angle: 100, length: 16, width: 3, shape: 'capsule', curve: 0, color: null, z: 2 }),
  ],
  animations: [idleClip()],
});

// Slime: cuerpo grande y bajo con dos ojos.
export const buildSlimeRig = (): CustomRig => ({
  id: 'slime',
  name: 'Slime',
  color: '#000000',
  origin: { x: 0, y: 82 },
  bones: [
    bone({ id: 'body', name: 'Body', parentId: null, attach: 0, angle: 0, length: 4, width: 60, shape: 'circle', curve: 0, color: null, z: 0 }),
    bone({ id: 'eyeL', name: 'Left eye', parentId: 'body', attach: 0, angle: -30, length: 22, width: 8, shape: 'circle', curve: 0, color: '#ffffff', z: 1 }),
    bone({ id: 'eyeR', name: 'Right eye', parentId: 'body', attach: 0, angle: 30, length: 22, width: 8, shape: 'circle', curve: 0, color: '#ffffff', z: 1 }),
  ],
  animations: [idleClip()],
});

// Vacío: un solo hueso para empezar de cero.
export const buildBlankRig = (): CustomRig => ({
  id: 'blank',
  name: 'New rig',
  color: '#000000',
  origin: { x: 0, y: 90 },
  bones: [
    bone({ id: 'root', name: 'root', parentId: null, attach: 0, angle: 0, length: 40, width: 8, shape: 'capsule', curve: 0, color: null, z: 0 }),
  ],
  animations: [idleClip()],
});

export const RIG_PRESETS: readonly { readonly id: string; readonly name: string; readonly build: () => CustomRig }[] = [
  { id: 'quadruped', name: 'Quadruped', build: buildQuadrupedRig },
  { id: 'bird', name: 'Bird', build: buildBirdRig },
  { id: 'slime', name: 'Slime', build: buildSlimeRig },
  { id: 'blank', name: 'Blank', build: buildBlankRig },
];

// Rig por defecto del proyecto.
export const buildDefaultCustomRig = (): CustomRig => buildQuadrupedRig();
