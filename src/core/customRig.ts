// Rig genérico basado en un árbol de huesos (para criaturas no-humanoides).
// Núcleo puro: FK del árbol → huesos renderizables. Sin React ni DOM.

import type { Vec2 } from './rig';
import type { EasingKind } from './easing';
import { applyEasing } from './easing';

export type BoneShape = 'capsule' | 'circle' | 'rect' | 'triangle';

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
  readonly offset?: Vec2;           // corrimiento extra de la base en espacio del rig
                                    // (para posicionar piezas libres, ej. armas)
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
    if (b.offset) base = { x: base.x + b.offset.x, y: base.y + b.offset.y };
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
    } else if (b.shape === 'rect' || b.shape === 'triangle') {
      const perp = { x: Math.cos(rad(wa)), y: Math.sin(rad(wa)) };
      const hw = b.width / 2;
      // Triángulo: base (dos esquinas) + vértice alargado en la punta.
      const pts =
        b.shape === 'triangle'
          ? [
              { x: base.x + perp.x * hw, y: base.y + perp.y * hw },
              { x: base.x - perp.x * hw, y: base.y - perp.y * hw },
              tip,
            ]
          : [
              { x: base.x + perp.x * hw, y: base.y + perp.y * hw },
              { x: base.x - perp.x * hw, y: base.y - perp.y * hw },
              { x: tip.x - perp.x * hw, y: tip.y - perp.y * hw },
              { x: tip.x + perp.x * hw, y: tip.y + perp.y * hw },
            ];
      out.push({ kind: 'rect', pts, color, z: b.z });
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
  color: '#795548',
  origin: { x: -22, y: 55 },
  bones: [
    bone({ id: 'spine', name: 'Spine', parentId: null, attach: 0, angle: 90, length: 44, width: 16, shape: 'capsule', curve: 0, color: null, z: 1 }),
    bone({ id: 'neck', name: 'Neck', parentId: 'spine', attach: 0.92, angle: -55, length: 16, width: 11, shape: 'capsule', curve: 0, color: null, z: 2 }),
    bone({ id: 'head', name: 'Head', parentId: 'neck', attach: 1, angle: 20, length: 18, width: 18, shape: 'circle', curve: 0, color: '#a1887f', z: 3 }),
    bone({ id: 'snout', name: 'Snout', parentId: 'head', attach: 1, angle: 20, length: 9, width: 10, shape: 'capsule', curve: 0, color: '#4e342e', z: 4 }),
    bone({ id: 'earF', name: 'Ear (far)', parentId: 'head', attach: 0.6, angle: -40, length: 9, width: 7, shape: 'triangle', curve: 0, color: '#4e342e', z: 2 }),
    bone({ id: 'earN', name: 'Ear (near)', parentId: 'head', attach: 0.6, angle: -30, length: 10, width: 8, shape: 'triangle', curve: 0, color: '#3b2723', z: 5 }),
    bone({ id: 'tail', name: 'Tail', parentId: 'spine', attach: 0.05, angle: -140, length: 20, width: 6, shape: 'capsule', curve: 0.4, color: '#4e342e', z: 1 }),
    // Patas articuladas (muslo + caña + pata) para que no sean palotes rectos.
    bone({ id: 'legFF', name: 'Front leg (far)', parentId: 'spine', attach: 0.86, angle: 90, length: 22, width: 7, shape: 'capsule', curve: 0, color: '#4e342e', z: 0 }),
    bone({ id: 'legFFs', name: 'Front shin (far)', parentId: 'legFF', attach: 1, angle: -14, length: 20, width: 6, shape: 'capsule', curve: 0, color: '#4e342e', z: 0 }),
    bone({ id: 'pawFF', name: 'Paw (front far)', parentId: 'legFFs', attach: 1, angle: -76, length: 8, width: 6, shape: 'capsule', curve: 0, color: '#3b2723', z: 0 }),
    bone({ id: 'legBF', name: 'Back leg (far)', parentId: 'spine', attach: 0.2, angle: 90, length: 22, width: 7, shape: 'capsule', curve: 0, color: '#4e342e', z: 0 }),
    bone({ id: 'legBFs', name: 'Back shin (far)', parentId: 'legBF', attach: 1, angle: 14, length: 20, width: 6, shape: 'capsule', curve: 0, color: '#4e342e', z: 0 }),
    bone({ id: 'pawBF', name: 'Paw (back far)', parentId: 'legBFs', attach: 1, angle: -104, length: 8, width: 6, shape: 'capsule', curve: 0, color: '#3b2723', z: 0 }),
    bone({ id: 'legFN', name: 'Front leg (near)', parentId: 'spine', attach: 0.8, angle: 90, length: 22, width: 8, shape: 'capsule', curve: 0, color: '#5d4037', z: 2 }),
    bone({ id: 'legFNs', name: 'Front shin (near)', parentId: 'legFN', attach: 1, angle: -14, length: 20, width: 7, shape: 'capsule', curve: 0, color: '#5d4037', z: 2 }),
    bone({ id: 'pawFN', name: 'Paw (front near)', parentId: 'legFNs', attach: 1, angle: -76, length: 9, width: 7, shape: 'capsule', curve: 0, color: '#4e342e', z: 2 }),
    bone({ id: 'legBN', name: 'Back leg (near)', parentId: 'spine', attach: 0.14, angle: 90, length: 22, width: 8, shape: 'capsule', curve: 0, color: '#5d4037', z: 2 }),
    bone({ id: 'legBNs', name: 'Back shin (near)', parentId: 'legBN', attach: 1, angle: 14, length: 20, width: 7, shape: 'capsule', curve: 0, color: '#5d4037', z: 2 }),
    bone({ id: 'pawBN', name: 'Paw (back near)', parentId: 'legBNs', attach: 1, angle: -104, length: 9, width: 7, shape: 'capsule', curve: 0, color: '#4e342e', z: 2 }),
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
  color: '#ef5350',
  origin: { x: 4, y: 52 },
  bones: [
    bone({ id: 'body', name: 'Body', parentId: null, attach: 0, angle: 90, length: 24, width: 20, shape: 'capsule', curve: 0.1, color: null, z: 1 }),
    bone({ id: 'head', name: 'Head', parentId: 'body', attach: 1, angle: 0, length: 12, width: 15, shape: 'circle', curve: 0, color: null, z: 3 }),
    bone({ id: 'beak', name: 'Beak', parentId: 'head', attach: 1, angle: 0, length: 9, width: 5, shape: 'capsule', curve: 0, color: '#ffb300', z: 3 }),
    bone({ id: 'tail', name: 'Tail', parentId: 'body', attach: 0, angle: 160, length: 16, width: 13, shape: 'capsule', curve: 0, color: null, z: 0 }),
    bone({ id: 'wing', name: 'Wing', parentId: 'body', attach: 0.5, angle: -90, length: 18, width: 13, shape: 'capsule', curve: 0.35, color: '#e53935', z: 2 }),
    bone({ id: 'legL', name: 'Left leg', parentId: 'body', attach: 0.35, angle: 90, length: 12, width: 3, shape: 'capsule', curve: 0, color: '#ffb300', z: 0 }),
    bone({ id: 'legR', name: 'Right leg', parentId: 'body', attach: 0.5, angle: 90, length: 12, width: 3, shape: 'capsule', curve: 0, color: '#ffb300', z: 2 }),
  ],
  animations: [
    {
      id: 'idle',
      name: 'idle',
      frames: 8,
      fps: 6,
      loop: true,
      keyframes: [
        { t: 0, pose: { wing: -6, head: 2 } },
        { t: 0.5, pose: { wing: 6, head: -2 } },
        { t: 1, pose: { wing: -6, head: 2 } },
      ],
    },
    {
      id: 'fly',
      name: 'fly',
      frames: 6,
      fps: 12,
      loop: true,
      keyframes: [
        { t: 0, pose: { wing: -35 } },
        { t: 0.5, pose: { wing: 35 } },
        { t: 1, pose: { wing: -35 } },
      ],
    },
  ],
});

// Slime: cuerpo grande y bajo con dos ojos.
export const buildSlimeRig = (): CustomRig => ({
  id: 'slime',
  name: 'Slime',
  color: '#43a047',
  origin: { x: 0, y: 82 },
  bones: [
    bone({ id: 'body', name: 'Body', parentId: null, attach: 0, angle: 0, length: 4, width: 60, shape: 'circle', curve: 0, color: null, z: 0 }),
    bone({ id: 'eyeL', name: 'Left eye', parentId: 'body', attach: 0, angle: -30, length: 22, width: 8, shape: 'circle', curve: 0, color: '#ffffff', z: 1 }),
    bone({ id: 'eyeR', name: 'Right eye', parentId: 'body', attach: 0, angle: 30, length: 22, width: 8, shape: 'circle', curve: 0, color: '#ffffff', z: 1 }),
  ],
  animations: [
    {
      id: 'idle',
      name: 'idle',
      frames: 8,
      fps: 6,
      loop: true,
      keyframes: [
        { t: 0, pose: { eyeL: -4, eyeR: 4 } },
        { t: 0.5, pose: { eyeL: 4, eyeR: -4 } },
        { t: 1, pose: { eyeL: -4, eyeR: 4 } },
      ],
    },
    {
      id: 'jiggle',
      name: 'jiggle',
      frames: 6,
      fps: 10,
      loop: true,
      keyframes: [
        { t: 0, pose: { body: -5 } },
        { t: 0.5, pose: { body: 5 } },
        { t: 1, pose: { body: -5 } },
      ],
    },
  ],
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
  color: '#f59e42',
  origin: { x: -20, y: 58 },
  bones: [
    bone({ id: 'spine', name: 'Spine', parentId: null, attach: 0, angle: 90, length: 40, width: 12, shape: 'capsule', curve: 0.1, color: null, z: 1 }),
    bone({ id: 'neck', name: 'Neck', parentId: 'spine', attach: 0.9, angle: -50, length: 12, width: 8, shape: 'capsule', curve: 0, color: null, z: 2 }),
    bone({ id: 'head', name: 'Head', parentId: 'neck', attach: 1, angle: 25, length: 14, width: 14, shape: 'circle', curve: 0, color: null, z: 3 }),
    bone({ id: 'earL', name: 'Ear (left)', parentId: 'head', attach: 0.85, angle: -35, length: 7, width: 5, shape: 'capsule', curve: 0, color: '#c26a1d', z: 3 }),
    bone({ id: 'earR', name: 'Ear (right)', parentId: 'head', attach: 0.85, angle: -5, length: 7, width: 5, shape: 'capsule', curve: 0, color: '#c26a1d', z: 3 }),
    bone({ id: 'tail', name: 'Tail', parentId: 'spine', attach: 0.05, angle: -120, length: 28, width: 5, shape: 'capsule', curve: 0.5, color: '#c26a1d', z: 1 }),
    bone({ id: 'legFF', name: 'Front leg (far)', parentId: 'spine', attach: 0.85, angle: 90, length: 30, width: 5, shape: 'capsule', curve: 0, color: null, z: 0 }),
    bone({ id: 'legBF', name: 'Back leg (far)', parentId: 'spine', attach: 0.18, angle: 90, length: 30, width: 5, shape: 'capsule', curve: 0, color: null, z: 0 }),
    bone({ id: 'legFN', name: 'Front leg (near)', parentId: 'spine', attach: 0.8, angle: 90, length: 30, width: 6, shape: 'capsule', curve: 0, color: null, z: 2 }),
    bone({ id: 'legBN', name: 'Back leg (near)', parentId: 'spine', attach: 0.13, angle: 90, length: 30, width: 6, shape: 'capsule', curve: 0, color: null, z: 2 }),
    // Manchitas del lomo.
    bone({ id: 'spot1', name: 'Spot 1', parentId: 'spine', attach: 0.35, angle: 0, length: 0, width: 8, shape: 'circle', curve: 0, color: '#c26a1d', z: 2 }),
    bone({ id: 'spot2', name: 'Spot 2', parentId: 'spine', attach: 0.55, angle: 0, length: 0, width: 7, shape: 'circle', curve: 0, color: '#c26a1d', z: 2 }),
    bone({ id: 'spot3', name: 'Spot 3', parentId: 'spine', attach: 0.7, angle: 0, length: 0, width: 6, shape: 'circle', curve: 0, color: '#c26a1d', z: 2 }),
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
  color: '#66bb6a',
  origin: { x: -34, y: 78 },
  bones: [
    bone({ id: 'head', name: 'Head', parentId: null, attach: 0, angle: 20, length: 10, width: 16, shape: 'circle', curve: 0, color: null, z: 3 }),
    bone({ id: 'tongueA', name: 'Tongue L', parentId: 'head', attach: 0, angle: 172, length: 9, width: 2, shape: 'capsule', curve: 0, color: '#e53935', z: 4 }),
    bone({ id: 'tongueB', name: 'Tongue R', parentId: 'head', attach: 0, angle: 188, length: 9, width: 2, shape: 'capsule', curve: 0, color: '#e53935', z: 4 }),
    bone({ id: 's1', name: 'Segment 1', parentId: 'head', attach: 1, angle: 16, length: 16, width: 13, shape: 'capsule', curve: 0.4, color: null, z: 2 }),
    bone({ id: 's2', name: 'Segment 2', parentId: 's1', attach: 1, angle: -22, length: 16, width: 12, shape: 'capsule', curve: -0.4, color: null, z: 2 }),
    bone({ id: 's3', name: 'Segment 3', parentId: 's2', attach: 1, angle: 22, length: 15, width: 10, shape: 'capsule', curve: 0.4, color: null, z: 2 }),
    bone({ id: 's4', name: 'Segment 4', parentId: 's3', attach: 1, angle: -20, length: 14, width: 7, shape: 'capsule', curve: -0.4, color: null, z: 2 }),
    bone({ id: 's5', name: 'Tail', parentId: 's4', attach: 1, angle: 18, length: 13, width: 4, shape: 'capsule', curve: 0.3, color: null, z: 2 }),
  ],
  animations: [
    {
      id: 'idle',
      name: 'idle',
      frames: 8,
      fps: 6,
      loop: true,
      keyframes: [
        { t: 0, pose: { tongueA: 6, tongueB: -6, s1: 3 } },
        { t: 0.5, pose: { tongueA: -6, tongueB: 6, s1: -3 } },
        { t: 1, pose: { tongueA: 6, tongueB: -6, s1: 3 } },
      ],
    },
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
  color: '#37474f',
  origin: { x: 0, y: 60 },
  bones: [
    // Dos cuerpos: abdomen grande (atrás) + cefalotórax chico (adelante).
    bone({ id: 'body', name: 'Abdomen', parentId: null, attach: 0, angle: 0, length: 4, width: 30, shape: 'circle', curve: 0, color: null, z: 1 }),
    bone({ id: 'cephalo', name: 'Cephalothorax', parentId: 'body', attach: 0, angle: 0, length: 17, width: 18, shape: 'circle', curve: 0, color: '#455a64', z: 3 }),
    // Patas curvadas (rodilla), 4 por lado, saliendo del cefalotórax.
    bone({ id: 'legR1', name: 'Leg R1', parentId: 'cephalo', attach: 0, angle: -50, length: 24, width: 3, shape: 'capsule', curve: 0.35, color: null, z: 2 }),
    bone({ id: 'legR2', name: 'Leg R2', parentId: 'cephalo', attach: 0, angle: -80, length: 26, width: 3, shape: 'capsule', curve: 0.35, color: null, z: 2 }),
    bone({ id: 'legR3', name: 'Leg R3', parentId: 'body', attach: 0, angle: 115, length: 26, width: 3, shape: 'capsule', curve: -0.35, color: null, z: 0 }),
    bone({ id: 'legR4', name: 'Leg R4', parentId: 'body', attach: 0, angle: 145, length: 24, width: 3, shape: 'capsule', curve: -0.35, color: null, z: 0 }),
    bone({ id: 'legL1', name: 'Leg L1', parentId: 'cephalo', attach: 0, angle: 50, length: 24, width: 3, shape: 'capsule', curve: -0.35, color: null, z: 2 }),
    bone({ id: 'legL2', name: 'Leg L2', parentId: 'cephalo', attach: 0, angle: 80, length: 26, width: 3, shape: 'capsule', curve: -0.35, color: null, z: 2 }),
    bone({ id: 'legL3', name: 'Leg L3', parentId: 'body', attach: 0, angle: -115, length: 26, width: 3, shape: 'capsule', curve: 0.35, color: null, z: 0 }),
    bone({ id: 'legL4', name: 'Leg L4', parentId: 'body', attach: 0, angle: -145, length: 24, width: 3, shape: 'capsule', curve: 0.35, color: null, z: 0 }),
  ],
  animations: [
    {
      id: 'idle',
      name: 'idle',
      frames: 8,
      fps: 6,
      loop: true,
      keyframes: [
        { t: 0, pose: { legR1: 3, legL1: -3, legR3: -3, legL3: 3 } },
        { t: 0.5, pose: { legR1: -3, legL1: 3, legR3: 3, legL3: -3 } },
        { t: 1, pose: { legR1: 3, legL1: -3, legR3: -3, legL3: 3 } },
      ],
    },
    {
      id: 'scuttle',
      name: 'scuttle',
      frames: 6,
      fps: 12,
      loop: true,
      keyframes: [
        { t: 0, pose: { legR1: 12, legR3: 12, legL2: 12, legL4: 12, legR2: -12, legR4: -12, legL1: -12, legL3: -12 } },
        { t: 0.5, pose: { legR1: -12, legR3: -12, legL2: -12, legL4: -12, legR2: 12, legR4: 12, legL1: 12, legL3: 12 } },
        { t: 1, pose: { legR1: 12, legR3: 12, legL2: 12, legL4: 12, legR2: -12, legR4: -12, legL1: -12, legL3: -12 } },
      ],
    },
  ],
});

// Tiburón: cuerpo alargado, morro, aleta dorsal grande, pectoral y cola.
export const buildFishRig = (): CustomRig => ({
  id: 'fish',
  name: 'Shark',
  color: '#607d8b',
  origin: { x: -6, y: 52 },
  bones: [
    bone({ id: 'body', name: 'Body', parentId: null, attach: 0, angle: 90, length: 40, width: 22, shape: 'capsule', curve: 0.06, color: null, z: 1 }),
    bone({ id: 'snout', name: 'Snout', parentId: 'body', attach: 1, angle: 0, length: 16, width: 20, shape: 'triangle', curve: 0, color: null, z: 1 }),
    bone({ id: 'dorsal', name: 'Dorsal fin', parentId: 'body', attach: 0.52, angle: -68, length: 24, width: 16, shape: 'triangle', curve: 0, color: null, z: 2 }),
    bone({ id: 'pectoral', name: 'Pectoral fin', parentId: 'body', attach: 0.44, angle: 125, length: 16, width: 12, shape: 'triangle', curve: 0, color: null, z: 0 }),
    bone({ id: 'tailU', name: 'Tail (upper)', parentId: 'body', attach: 0, angle: -150, length: 26, width: 13, shape: 'triangle', curve: 0, color: null, z: 0 }),
    bone({ id: 'tail', name: 'Tail (lower)', parentId: 'body', attach: 0, angle: 156, length: 18, width: 12, shape: 'triangle', curve: 0, color: null, z: 0 }),
    bone({ id: 'gill', name: 'Gill', parentId: 'body', attach: 0.68, angle: 90, length: 12, width: 2.5, shape: 'capsule', curve: 0, color: '#4a5b66', z: 2 }),
    bone({ id: 'eye', name: 'Eye', parentId: 'body', attach: 0.82, angle: -34, length: 6, width: 4.5, shape: 'circle', color: '#12212b', curve: 0, z: 3 }),
  ],
  animations: [
    {
      id: 'idle',
      name: 'idle',
      frames: 8,
      fps: 6,
      loop: true,
      keyframes: [
        { t: 0, pose: { tail: 5, dorsal: -3 } },
        { t: 0.5, pose: { tail: -5, dorsal: 3 } },
        { t: 1, pose: { tail: 5, dorsal: -3 } },
      ],
    },
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
  color: '#5e35b1',
  origin: { x: 0, y: 52 },
  bones: [
    bone({ id: 'body', name: 'Body', parentId: null, attach: 0, angle: 0, length: 18, width: 15, shape: 'capsule', curve: 0, color: null, z: 2 }),
    bone({ id: 'head', name: 'Head', parentId: 'body', attach: 1, angle: 0, length: 11, width: 15, shape: 'circle', curve: 0, color: null, z: 3 }),
    bone({ id: 'earL', name: 'Ear (left)', parentId: 'head', attach: 1, angle: -24, length: 10, width: 7, shape: 'triangle', curve: 0, color: null, z: 3 }),
    bone({ id: 'earR', name: 'Ear (right)', parentId: 'head', attach: 1, angle: 24, length: 10, width: 7, shape: 'triangle', curve: 0, color: null, z: 3 }),
    // Alas membranosas angulares (triángulos) — grande + festón exterior por lado.
    bone({ id: 'wingL', name: 'Wing (left)', parentId: 'body', attach: 0.7, angle: -78, length: 36, width: 30, shape: 'triangle', curve: 0, color: '#4527a0', z: 1 }),
    bone({ id: 'wingL2', name: 'Wing tip (left)', parentId: 'body', attach: 0.5, angle: -108, length: 26, width: 18, shape: 'triangle', curve: 0, color: '#3b2191', z: 1 }),
    bone({ id: 'wingR', name: 'Wing (right)', parentId: 'body', attach: 0.7, angle: 78, length: 36, width: 30, shape: 'triangle', curve: 0, color: '#4527a0', z: 1 }),
    bone({ id: 'wingR2', name: 'Wing tip (right)', parentId: 'body', attach: 0.5, angle: 108, length: 26, width: 18, shape: 'triangle', curve: 0, color: '#3b2191', z: 1 }),
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

// Cohete: cuerpo ovalado, cono puntiagudo, ventana, aletas (hacia el fuego) y llama.
export const buildRocketRig = (): CustomRig => ({
  id: 'rocket',
  name: 'Rocket',
  color: '#000000',
  origin: { x: -4, y: 50 },
  bones: [
    bone({ id: 'body', name: 'Body', parentId: null, attach: 0, angle: 90, length: 34, width: 16, shape: 'capsule', curve: 0, color: '#e0e0e0', z: 1 }),
    bone({ id: 'nose', name: 'Nose cone', parentId: 'body', attach: 1, angle: 0, length: 18, width: 10, shape: 'capsule', curve: 0, color: '#ef5350', z: 2 }),
    bone({ id: 'window', name: 'Window', parentId: 'body', attach: 0.58, angle: 0, length: 0, width: 8, shape: 'circle', curve: 0, color: '#4fc3f7', z: 3 }),
    // Aletas cerca del fuego (atrás), apuntando hacia atrás/afuera.
    bone({ id: 'finL', name: 'Fin (left)', parentId: 'body', attach: 0.05, angle: -140, length: 13, width: 6, shape: 'rect', curve: 0, color: '#c62828', z: 0 }),
    bone({ id: 'finR', name: 'Fin (right)', parentId: 'body', attach: 0.05, angle: 140, length: 13, width: 6, shape: 'rect', curve: 0, color: '#c62828', z: 0 }),
    bone({ id: 'flame', name: 'Flame', parentId: 'body', attach: 0, angle: 180, length: 15, width: 12, shape: 'capsule', curve: 0, color: '#ffa726', z: 0 }),
  ],
  animations: [
    {
      id: 'idle',
      name: 'idle',
      frames: 6,
      fps: 8,
      loop: true,
      keyframes: [
        { t: 0, pose: { body: -2, flame: -8 } },
        { t: 0.5, pose: { body: 2, flame: 8 } },
        { t: 1, pose: { body: -2, flame: -8 } },
      ],
    },
    {
      id: 'boost',
      name: 'boost',
      frames: 6,
      fps: 12,
      loop: true,
      keyframes: [
        { t: 0, pose: { flame: -16 } },
        { t: 0.5, pose: { flame: 16 } },
        { t: 1, pose: { flame: -16 } },
      ],
    },
  ],
});

// Estrella de 5 puntas (puntas finas y largas).
export const buildStarRig = (): CustomRig => ({
  id: 'star',
  name: 'Star',
  color: '#000000',
  origin: { x: 0, y: 48 },
  bones: [
    bone({ id: 'core', name: 'Core', parentId: null, attach: 0, angle: 0, length: 4, width: 11, shape: 'circle', curve: 0, color: '#ffd54f', z: 2 }),
    bone({ id: 'p0', name: 'Point 1', parentId: 'core', attach: 0, angle: -90, length: 24, width: 7, shape: 'capsule', curve: 0, color: '#ffca28', z: 1 }),
    bone({ id: 'p1', name: 'Point 2', parentId: 'core', attach: 0, angle: -18, length: 24, width: 7, shape: 'capsule', curve: 0, color: '#ffca28', z: 1 }),
    bone({ id: 'p2', name: 'Point 3', parentId: 'core', attach: 0, angle: 54, length: 24, width: 7, shape: 'capsule', curve: 0, color: '#ffca28', z: 1 }),
    bone({ id: 'p3', name: 'Point 4', parentId: 'core', attach: 0, angle: 126, length: 24, width: 7, shape: 'capsule', curve: 0, color: '#ffca28', z: 1 }),
    bone({ id: 'p4', name: 'Point 5', parentId: 'core', attach: 0, angle: 198, length: 24, width: 7, shape: 'capsule', curve: 0, color: '#ffca28', z: 1 }),
  ],
  animations: [
    {
      id: 'idle',
      name: 'idle',
      frames: 8,
      fps: 8,
      loop: true,
      keyframes: [
        { t: 0, pose: {} },
        { t: 0.5, pose: { p0: 6, p1: 6, p2: 6, p3: 6, p4: 6 } },
        { t: 1, pose: {} },
      ],
    },
  ],
});

// Nube: círculos superpuestos, más ancha en X que en Y.
export const buildCloudRig = (): CustomRig => ({
  id: 'cloud',
  name: 'Cloud',
  color: '#000000',
  origin: { x: 0, y: 54 },
  bones: [
    bone({ id: 'base', name: 'Base', parentId: null, attach: 0, angle: 0, length: 4, width: 28, shape: 'circle', curve: 0, color: '#eceff1', z: 1 }),
    bone({ id: 'l', name: 'Puff L', parentId: 'base', attach: 0, angle: -90, length: 20, width: 24, shape: 'circle', curve: 0, color: '#eceff1', z: 1 }),
    bone({ id: 'r', name: 'Puff R', parentId: 'base', attach: 0, angle: 90, length: 20, width: 24, shape: 'circle', curve: 0, color: '#eceff1', z: 1 }),
    bone({ id: 'll', name: 'Puff far-L', parentId: 'base', attach: 0, angle: -90, length: 40, width: 16, shape: 'circle', curve: 0, color: '#eceff1', z: 1 }),
    bone({ id: 'rr', name: 'Puff far-R', parentId: 'base', attach: 0, angle: 90, length: 40, width: 16, shape: 'circle', curve: 0, color: '#eceff1', z: 1 }),
    bone({ id: 'topL', name: 'Puff top-L', parentId: 'base', attach: 0, angle: -35, length: 15, width: 22, shape: 'circle', curve: 0, color: '#ffffff', z: 2 }),
    bone({ id: 'topR', name: 'Puff top-R', parentId: 'base', attach: 0, angle: 35, length: 15, width: 22, shape: 'circle', curve: 0, color: '#ffffff', z: 2 }),
  ],
  animations: [
    {
      id: 'idle',
      name: 'idle',
      frames: 8,
      fps: 6,
      loop: true,
      keyframes: [
        { t: 0, pose: { topL: -4, topR: 4 } },
        { t: 0.5, pose: { topL: 4, topR: -4 } },
        { t: 1, pose: { topL: -4, topR: 4 } },
      ],
    },
  ],
});

// Explosión: núcleo con puntas irregulares y afiladas (no un sol regular).
export const buildExplosionRig = (): CustomRig => {
  const spec: readonly [number, number, string][] = [
    [-88, 30, '#ffca28'],
    [-52, 15, '#ff5722'],
    [-14, 26, '#ffee58'],
    [24, 14, '#ff7043'],
    [62, 32, '#ffca28'],
    [104, 16, '#ff5722'],
    [150, 24, '#ffee58'],
    [186, 13, '#ff7043'],
    [214, 30, '#ffca28'],
    [256, 15, '#ff5722'],
    [300, 22, '#ffee58'],
    [330, 12, '#ff7043'],
  ];
  const spikes = spec.map(([a, len, color], i) =>
    bone({ id: `s${i}`, name: `Spike ${i + 1}`, parentId: 'core', attach: 0, angle: a, length: len, width: 5, shape: 'rect', curve: 0, color, z: 1 }),
  );
  return {
    id: 'explosion',
    name: 'Explosion',
    color: '#000000',
    origin: { x: 0, y: 48 },
    bones: [
      bone({ id: 'core', name: 'Core', parentId: null, attach: 0, angle: 0, length: 4, width: 18, shape: 'circle', curve: 0, color: '#ff7043', z: 2 }),
      ...spikes,
    ],
    animations: [
      {
        id: 'idle',
        name: 'idle',
        frames: 6,
        fps: 12,
        loop: true,
        keyframes: [
          { t: 0, pose: Object.fromEntries(spec.map((_, i) => [`s${i}`, i % 2 ? -8 : 8])) },
          { t: 0.5, pose: Object.fromEntries(spec.map((_, i) => [`s${i}`, i % 2 ? 8 : -8])) },
          { t: 1, pose: Object.fromEntries(spec.map((_, i) => [`s${i}`, i % 2 ? -8 : 8])) },
        ],
      },
    ],
  };
};

// Ola rompiente: cuerpo azul que se curva en una cresta con espuma.
export const buildWaveRig = (): CustomRig => ({
  id: 'wave',
  name: 'Wave',
  color: '#000000',
  origin: { x: -30, y: 64 },
  bones: [
    bone({ id: 'w0', name: 'Base', parentId: null, attach: 0, angle: 62, length: 24, width: 28, shape: 'capsule', curve: 0.12, color: '#01579b', z: 1 }),
    bone({ id: 'w1', name: 'Swell', parentId: 'w0', attach: 1, angle: -26, length: 22, width: 26, shape: 'capsule', curve: 0.25, color: '#0277bd', z: 2 }),
    bone({ id: 'w2', name: 'Crest', parentId: 'w1', attach: 1, angle: -42, length: 19, width: 22, shape: 'capsule', curve: 0.4, color: '#1e88e5', z: 3 }),
    bone({ id: 'w3', name: 'Lip', parentId: 'w2', attach: 1, angle: -52, length: 16, width: 17, shape: 'capsule', curve: 0.5, color: '#29b6f6', z: 4 }),
    bone({ id: 'w4', name: 'Curl', parentId: 'w3', attach: 1, angle: -62, length: 13, width: 13, shape: 'capsule', curve: 0.5, color: '#4fc3f7', z: 5 }),
    bone({ id: 'foam', name: 'Foam', parentId: 'w4', attach: 1, angle: 0, length: 0, width: 15, shape: 'circle', curve: 0, color: '#ffffff', z: 6 }),
    bone({ id: 'foam2', name: 'Foam 2', parentId: 'w3', attach: 1, angle: 0, length: 0, width: 11, shape: 'circle', curve: 0, color: '#e1f5fe', z: 6 }),
    bone({ id: 'foam3', name: 'Foam 3', parentId: 'w2', attach: 1, angle: 0, length: 0, width: 9, shape: 'circle', curve: 0, color: '#ffffff', z: 6 }),
  ],
  animations: [
    {
      id: 'idle',
      name: 'idle',
      frames: 8,
      fps: 8,
      loop: true,
      keyframes: [
        { t: 0, pose: { w1: -5, w2: 6, w3: 8, w4: 10 } },
        { t: 0.5, pose: { w1: 5, w2: -6, w3: -8, w4: -10 } },
        { t: 1, pose: { w1: -5, w2: 6, w3: 8, w4: 10 } },
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
  { id: 'fish', name: 'Shark', emoji: '🦈', build: buildFishRig },
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
