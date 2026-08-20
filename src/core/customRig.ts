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

// Felino de perfil: cuerpo esbelto, cola larga, orejas.
export const buildCatRig = (): CustomRig => ({
  id: 'cat',
  name: 'Cat',
  color: '#000000',
  origin: { x: -20, y: 58 },
  bones: [
    bone({ id: 'spine', name: 'Spine', parentId: null, attach: 0, angle: 90, length: 40, width: 12, shape: 'capsule', curve: 0.1, color: null, z: 1 }),
    bone({ id: 'neck', name: 'Neck', parentId: 'spine', attach: 0.9, angle: -50, length: 12, width: 8, shape: 'capsule', curve: 0, color: null, z: 2 }),
    bone({ id: 'head', name: 'Head', parentId: 'neck', attach: 1, angle: 25, length: 14, width: 14, shape: 'circle', curve: 0, color: null, z: 3 }),
    bone({ id: 'earL', name: 'Ear (left)', parentId: 'head', attach: 0.85, angle: -35, length: 7, width: 5, shape: 'capsule', curve: 0, color: null, z: 3 }),
    bone({ id: 'earR', name: 'Ear (right)', parentId: 'head', attach: 0.85, angle: -5, length: 7, width: 5, shape: 'capsule', curve: 0, color: null, z: 3 }),
    bone({ id: 'tail', name: 'Tail', parentId: 'spine', attach: 0.05, angle: -120, length: 28, width: 5, shape: 'capsule', curve: 0.5, color: null, z: 1 }),
    bone({ id: 'legFF', name: 'Front leg (far)', parentId: 'spine', attach: 0.85, angle: 90, length: 30, width: 5, shape: 'capsule', curve: 0, color: null, z: 0 }),
    bone({ id: 'legBF', name: 'Back leg (far)', parentId: 'spine', attach: 0.18, angle: 90, length: 30, width: 5, shape: 'capsule', curve: 0, color: null, z: 0 }),
    bone({ id: 'legFN', name: 'Front leg (near)', parentId: 'spine', attach: 0.8, angle: 90, length: 30, width: 6, shape: 'capsule', curve: 0, color: null, z: 2 }),
    bone({ id: 'legBN', name: 'Back leg (near)', parentId: 'spine', attach: 0.13, angle: 90, length: 30, width: 6, shape: 'capsule', curve: 0, color: null, z: 2 }),
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
        { t: 0, pose: { legFF: 22, legBN: 22, legFN: -22, legBF: -22, tail: 8 } },
        { t: 0.5, pose: { legFF: -22, legBN: -22, legFN: 22, legBF: 22, tail: -8 } },
        { t: 1, pose: { legFF: 22, legBN: 22, legFN: -22, legBF: -22, tail: 8 } },
      ],
    },
  ],
});

// Serpiente/gusano: cadena de segmentos en S.
export const buildSnakeRig = (): CustomRig => ({
  id: 'snake',
  name: 'Snake',
  color: '#000000',
  origin: { x: -34, y: 78 },
  bones: [
    bone({ id: 'head', name: 'Head', parentId: null, attach: 0, angle: 0, length: 10, width: 16, shape: 'circle', curve: 0, color: null, z: 3 }),
    bone({ id: 's1', name: 'Segment 1', parentId: 'head', attach: 1, angle: 15, length: 16, width: 13, shape: 'capsule', curve: 0, color: null, z: 2 }),
    bone({ id: 's2', name: 'Segment 2', parentId: 's1', attach: 1, angle: -30, length: 16, width: 12, shape: 'capsule', curve: 0, color: null, z: 2 }),
    bone({ id: 's3', name: 'Segment 3', parentId: 's2', attach: 1, angle: 30, length: 15, width: 10, shape: 'capsule', curve: 0, color: null, z: 2 }),
    bone({ id: 's4', name: 'Segment 4', parentId: 's3', attach: 1, angle: -30, length: 14, width: 8, shape: 'capsule', curve: 0, color: null, z: 2 }),
    bone({ id: 's5', name: 'Tail', parentId: 's4', attach: 1, angle: 25, length: 14, width: 5, shape: 'capsule', curve: 0, color: null, z: 2 }),
  ],
  animations: [
    idleClip(),
    {
      id: 'slither',
      name: 'slither',
      frames: 8,
      fps: 10,
      loop: true,
      keyframes: [
        { t: 0, pose: { s1: 12, s2: -12, s3: 12, s4: -12, s5: 12 } },
        { t: 0.5, pose: { s1: -12, s2: 12, s3: -12, s4: 12, s5: -12 } },
        { t: 1, pose: { s1: 12, s2: -12, s3: 12, s4: -12, s5: 12 } },
      ],
    },
  ],
});

// Araña: cuerpo redondo con ocho patas.
export const buildSpiderRig = (): CustomRig => ({
  id: 'spider',
  name: 'Spider',
  color: '#000000',
  origin: { x: 0, y: 66 },
  bones: [
    bone({ id: 'body', name: 'Body', parentId: null, attach: 0, angle: 0, length: 4, width: 30, shape: 'circle', curve: 0, color: null, z: 2 }),
    bone({ id: 'head', name: 'Head', parentId: 'body', attach: 0, angle: 90, length: 16, width: 16, shape: 'circle', curve: 0, color: null, z: 3 }),
    bone({ id: 'legR1', name: 'Leg R1', parentId: 'body', attach: 0, angle: -55, length: 24, width: 3, shape: 'capsule', curve: 0, color: null, z: 1 }),
    bone({ id: 'legR2', name: 'Leg R2', parentId: 'body', attach: 0, angle: -20, length: 26, width: 3, shape: 'capsule', curve: 0, color: null, z: 1 }),
    bone({ id: 'legR3', name: 'Leg R3', parentId: 'body', attach: 0, angle: 20, length: 26, width: 3, shape: 'capsule', curve: 0, color: null, z: 1 }),
    bone({ id: 'legR4', name: 'Leg R4', parentId: 'body', attach: 0, angle: 55, length: 24, width: 3, shape: 'capsule', curve: 0, color: null, z: 1 }),
    bone({ id: 'legL1', name: 'Leg L1', parentId: 'body', attach: 0, angle: 125, length: 24, width: 3, shape: 'capsule', curve: 0, color: null, z: 1 }),
    bone({ id: 'legL2', name: 'Leg L2', parentId: 'body', attach: 0, angle: 160, length: 26, width: 3, shape: 'capsule', curve: 0, color: null, z: 1 }),
    bone({ id: 'legL3', name: 'Leg L3', parentId: 'body', attach: 0, angle: 200, length: 26, width: 3, shape: 'capsule', curve: 0, color: null, z: 1 }),
    bone({ id: 'legL4', name: 'Leg L4', parentId: 'body', attach: 0, angle: 235, length: 24, width: 3, shape: 'capsule', curve: 0, color: null, z: 1 }),
  ],
  animations: [idleClip()],
});

// Pez: cuerpo ovalado, aleta dorsal y cola.
export const buildFishRig = (): CustomRig => ({
  id: 'fish',
  name: 'Fish',
  color: '#000000',
  origin: { x: 6, y: 50 },
  bones: [
    bone({ id: 'body', name: 'Body', parentId: null, attach: 0, angle: 0, length: 34, width: 24, shape: 'capsule', curve: 0, color: null, z: 1 }),
    bone({ id: 'tail', name: 'Tail fin', parentId: 'body', attach: 0, angle: 180, length: 16, width: 22, shape: 'capsule', curve: 0, color: null, z: 0 }),
    bone({ id: 'dorsal', name: 'Dorsal fin', parentId: 'body', attach: 0.55, angle: -90, length: 12, width: 16, shape: 'capsule', curve: 0.3, color: null, z: 0 }),
    bone({ id: 'belly', name: 'Belly fin', parentId: 'body', attach: 0.45, angle: 90, length: 8, width: 10, shape: 'capsule', curve: 0.3, color: null, z: 0 }),
    bone({ id: 'eye', name: 'Eye', parentId: 'body', attach: 0.85, angle: -40, length: 6, width: 5, shape: 'circle', color: '#ffffff', curve: 0, z: 2 }),
  ],
  animations: [
    idleClip(),
    {
      id: 'swim',
      name: 'swim',
      frames: 6,
      fps: 8,
      loop: true,
      keyframes: [
        { t: 0, pose: { tail: 16 } },
        { t: 0.5, pose: { tail: -16 } },
        { t: 1, pose: { tail: 16 } },
      ],
    },
  ],
});

// Murciélago de frente: cuerpo, cabeza con orejas y dos alas.
export const buildBatRig = (): CustomRig => ({
  id: 'bat',
  name: 'Bat',
  color: '#000000',
  origin: { x: 0, y: 52 },
  bones: [
    bone({ id: 'body', name: 'Body', parentId: null, attach: 0, angle: 90, length: 20, width: 14, shape: 'capsule', curve: 0, color: null, z: 1 }),
    bone({ id: 'head', name: 'Head', parentId: 'body', attach: 1, angle: 0, length: 12, width: 13, shape: 'circle', curve: 0, color: null, z: 2 }),
    bone({ id: 'earL', name: 'Ear (left)', parentId: 'head', attach: 0.85, angle: -22, length: 8, width: 4, shape: 'capsule', curve: 0, color: null, z: 2 }),
    bone({ id: 'earR', name: 'Ear (right)', parentId: 'head', attach: 0.85, angle: 22, length: 8, width: 4, shape: 'capsule', curve: 0, color: null, z: 2 }),
    bone({ id: 'wingL', name: 'Wing (left)', parentId: 'body', attach: 0.6, angle: -110, length: 34, width: 18, shape: 'capsule', curve: 0.5, color: null, z: 1 }),
    bone({ id: 'wingR', name: 'Wing (right)', parentId: 'body', attach: 0.6, angle: 110, length: 34, width: 18, shape: 'capsule', curve: -0.5, color: null, z: 1 }),
  ],
  animations: [
    idleClip(),
    {
      id: 'fly',
      name: 'fly',
      frames: 6,
      fps: 10,
      loop: true,
      keyframes: [
        { t: 0, pose: { wingL: -25, wingR: 25 } },
        { t: 0.5, pose: { wingL: 25, wingR: -25 } },
        { t: 1, pose: { wingL: -25, wingR: 25 } },
      ],
    },
  ],
});

// Cohete: cuerpo, cono, ventana, aletas y llama.
export const buildRocketRig = (): CustomRig => ({
  id: 'rocket',
  name: 'Rocket',
  color: '#000000',
  origin: { x: 0, y: 54 },
  bones: [
    bone({ id: 'body', name: 'Body', parentId: null, attach: 0, angle: 90, length: 32, width: 18, shape: 'capsule', curve: 0, color: '#cfd8dc', z: 1 }),
    bone({ id: 'nose', name: 'Nose cone', parentId: 'body', attach: 1, angle: 0, length: 14, width: 13, shape: 'capsule', curve: 0, color: '#ef5350', z: 2 }),
    bone({ id: 'window', name: 'Window', parentId: 'body', attach: 0.62, angle: 0, length: 0, width: 9, shape: 'circle', curve: 0, color: '#4fc3f7', z: 3 }),
    bone({ id: 'finL', name: 'Fin (left)', parentId: 'body', attach: 0.06, angle: -55, length: 15, width: 6, shape: 'rect', curve: 0, color: '#ef5350', z: 0 }),
    bone({ id: 'finR', name: 'Fin (right)', parentId: 'body', attach: 0.06, angle: 55, length: 15, width: 6, shape: 'rect', curve: 0, color: '#ef5350', z: 0 }),
    bone({ id: 'flame', name: 'Flame', parentId: 'body', attach: 0, angle: 180, length: 13, width: 12, shape: 'capsule', curve: 0, color: '#ffa726', z: 0 }),
  ],
  animations: [
    idleClip(),
    {
      id: 'hover',
      name: 'hover',
      frames: 6,
      fps: 10,
      loop: true,
      keyframes: [
        { t: 0, pose: { flame: -12 } },
        { t: 0.5, pose: { flame: 12 } },
        { t: 1, pose: { flame: -12 } },
      ],
    },
  ],
});

// Estrella: núcleo con cinco puntas.
export const buildStarRig = (): CustomRig => ({
  id: 'star',
  name: 'Star',
  color: '#000000',
  origin: { x: 0, y: 48 },
  bones: [
    bone({ id: 'core', name: 'Core', parentId: null, attach: 0, angle: 0, length: 4, width: 16, shape: 'circle', curve: 0, color: '#ffd54f', z: 2 }),
    bone({ id: 'p0', name: 'Point 1', parentId: 'core', attach: 0, angle: -90, length: 20, width: 10, shape: 'capsule', curve: 0, color: '#ffca28', z: 1 }),
    bone({ id: 'p1', name: 'Point 2', parentId: 'core', attach: 0, angle: -18, length: 20, width: 10, shape: 'capsule', curve: 0, color: '#ffca28', z: 1 }),
    bone({ id: 'p2', name: 'Point 3', parentId: 'core', attach: 0, angle: 54, length: 20, width: 10, shape: 'capsule', curve: 0, color: '#ffca28', z: 1 }),
    bone({ id: 'p3', name: 'Point 4', parentId: 'core', attach: 0, angle: 126, length: 20, width: 10, shape: 'capsule', curve: 0, color: '#ffca28', z: 1 }),
    bone({ id: 'p4', name: 'Point 5', parentId: 'core', attach: 0, angle: 198, length: 20, width: 10, shape: 'capsule', curve: 0, color: '#ffca28', z: 1 }),
  ],
  animations: [idleClip()],
});

// Nube: varios círculos superpuestos.
export const buildCloudRig = (): CustomRig => ({
  id: 'cloud',
  name: 'Cloud',
  color: '#000000',
  origin: { x: 0, y: 56 },
  bones: [
    bone({ id: 'base', name: 'Base', parentId: null, attach: 0, angle: 0, length: 4, width: 30, shape: 'circle', curve: 0, color: '#eceff1', z: 1 }),
    bone({ id: 'l', name: 'Puff L', parentId: 'base', attach: 0, angle: 180, length: 17, width: 24, shape: 'circle', curve: 0, color: '#eceff1', z: 1 }),
    bone({ id: 'r', name: 'Puff R', parentId: 'base', attach: 0, angle: 0, length: 17, width: 24, shape: 'circle', curve: 0, color: '#eceff1', z: 1 }),
    bone({ id: 'topL', name: 'Puff top-left', parentId: 'base', attach: 0, angle: -125, length: 15, width: 22, shape: 'circle', curve: 0, color: '#ffffff', z: 2 }),
    bone({ id: 'topR', name: 'Puff top-right', parentId: 'base', attach: 0, angle: -55, length: 15, width: 22, shape: 'circle', curve: 0, color: '#ffffff', z: 2 }),
  ],
  animations: [idleClip()],
});

// Explosión: núcleo con ocho puntas alternadas.
export const buildExplosionRig = (): CustomRig => {
  const spikes = [0, 45, 90, 135, 180, 225, 270, 315].map((a, i) =>
    bone({
      id: `s${i}`,
      name: `Spike ${i + 1}`,
      parentId: 'core',
      attach: 0,
      angle: a,
      length: a % 90 === 0 ? 26 : 17,
      width: 7,
      shape: 'capsule',
      curve: 0,
      color: a % 90 === 0 ? '#ffca28' : '#ff5722',
      z: 1,
    }),
  );
  return {
    id: 'explosion',
    name: 'Explosion',
    color: '#000000',
    origin: { x: 0, y: 48 },
    bones: [
      bone({ id: 'core', name: 'Core', parentId: null, attach: 0, angle: 0, length: 4, width: 22, shape: 'circle', curve: 0, color: '#ff7043', z: 2 }),
      ...spikes,
    ],
    animations: [idleClip()],
  };
};

// Ola: cadena curvada con cresta y espuma.
export const buildWaveRig = (): CustomRig => ({
  id: 'wave',
  name: 'Wave',
  color: '#000000',
  origin: { x: -24, y: 44 },
  bones: [
    bone({ id: 'w0', name: 'Base', parentId: null, attach: 0, angle: 90, length: 20, width: 22, shape: 'capsule', curve: 0, color: '#0288d1', z: 1 }),
    bone({ id: 'w1', name: 'Body', parentId: 'w0', attach: 1, angle: -20, length: 18, width: 18, shape: 'capsule', curve: 0, color: '#29b6f6', z: 1 }),
    bone({ id: 'w2', name: 'Crest', parentId: 'w1', attach: 1, angle: -60, length: 15, width: 13, shape: 'capsule', curve: 0.35, color: '#4fc3f7', z: 2 }),
    bone({ id: 'foam', name: 'Foam', parentId: 'w2', attach: 1, angle: 0, length: 0, width: 11, shape: 'circle', curve: 0, color: '#ffffff', z: 3 }),
  ],
  animations: [
    idleClip(),
    {
      id: 'roll',
      name: 'roll',
      frames: 8,
      fps: 8,
      loop: true,
      keyframes: [
        { t: 0, pose: { w1: -8, w2: 10 } },
        { t: 0.5, pose: { w1: 8, w2: -10 } },
        { t: 1, pose: { w1: -8, w2: 10 } },
      ],
    },
  ],
});

export type RigPreset = {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  readonly build: () => CustomRig;
};

// Plantillas de rig (built-in). 'blank' queda aparte como punto de partida vacío.
export const RIG_TEMPLATES: readonly RigPreset[] = [
  { id: 'quadruped', name: 'Dog / Wolf', emoji: '🐺', build: buildQuadrupedRig },
  { id: 'cat', name: 'Cat', emoji: '🐈', build: buildCatRig },
  { id: 'bird', name: 'Bird', emoji: '🐦', build: buildBirdRig },
  { id: 'slime', name: 'Slime', emoji: '🟢', build: buildSlimeRig },
  { id: 'snake', name: 'Snake', emoji: '🐍', build: buildSnakeRig },
  { id: 'spider', name: 'Spider', emoji: '🕷️', build: buildSpiderRig },
  { id: 'fish', name: 'Fish', emoji: '🐟', build: buildFishRig },
  { id: 'bat', name: 'Bat', emoji: '🦇', build: buildBatRig },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', build: buildRocketRig },
  { id: 'star', name: 'Star', emoji: '⭐', build: buildStarRig },
  { id: 'cloud', name: 'Cloud', emoji: '☁️', build: buildCloudRig },
  { id: 'explosion', name: 'Explosion', emoji: '💥', build: buildExplosionRig },
  { id: 'wave', name: 'Wave', emoji: '🌊', build: buildWaveRig },
];

export const RIG_PRESETS: readonly RigPreset[] = [
  ...RIG_TEMPLATES,
  { id: 'blank', name: 'Blank', emoji: '➕', build: buildBlankRig },
];

// Rig por defecto del proyecto.
export const buildDefaultCustomRig = (): CustomRig => buildQuadrupedRig();
