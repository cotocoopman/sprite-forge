// Animación: tipos, interpolación de poses, muestreo de clips y clips por defecto.
// Núcleo puro — sin React ni DOM.

import type { AnchorName, CharacterDefinition, PartName, Pose } from './rig';
import { DEFAULT_CHARACTER, NEUTRAL_POSE, PART_NAMES, POSE_KEYS } from './rig';
import type { CustomRig } from './customRig';
import { buildDefaultCustomRig } from './customRig';
import type { EasingKind } from './easing';
import { applyEasing } from './easing';
export type { EasingKind } from './easing';
export { applyEasing } from './easing';

export type Keyframe = { readonly t: number; readonly pose: Pose; readonly easing?: EasingKind };

export type AnimationClip = {
  readonly id: string;
  readonly name: string;
  readonly frames: number;
  readonly fps: number;
  readonly loop: boolean;
  readonly keyframes: readonly Keyframe[];
};

export type RenderConfig = {
  readonly cellSize: number;
  readonly characterHeightRatio: number;
  readonly groundRatio: number;
  readonly flip: boolean;
  readonly rotation: number; // giro en el plano (grados, sentido horario). 0 = de frente
  readonly facing: number;   // giro 3D alrededor del eje vertical. 0 = frente, 90 = perfil
};

export type ShadowMode = 'drop' | 'ground';

export type ShadowConfig = {
  readonly enabled: boolean;
  readonly mode: ShadowMode;  // 'drop' = copia desplazada · 'ground' = proyectada al piso
  readonly color: string;
  readonly opacity: number;   // 0..1
  readonly direction: number; // grados (drop: offset · ground: inclinación/skew)
  readonly length: number;    // desplazamiento en unidades
  readonly blur: number;      // desenfoque en unidades
  readonly flatten: number;   // ground: aplastado vertical (0..1)
};

export type GlowConfig = {
  readonly enabled: boolean;
  readonly color: string;
  readonly opacity: number;    // 0..1
  readonly expansion: number;  // dilatación del contorno (unidades)
  readonly intensity: number;  // desenfoque del brillo (unidades)
};

export type OutlineConfig = {
  readonly enabled: boolean;
  readonly color: string;
  readonly width: number; // grosor del borde (unidades)
};

export type EffectsConfig = {
  readonly shadow: ShadowConfig;
  readonly glow: GlowConfig;
  readonly outline: OutlineConfig;
};

// Estilo por parte del cuerpo: visibilidad + color (null = usa el color base).
export type PartStyle = { readonly visible: boolean; readonly color: string | null };
export type PartsConfig = Record<PartName, PartStyle>;

export const DEFAULT_PARTS: PartsConfig = PART_NAMES.reduce((acc, name) => {
  acc[name] = { visible: true, color: null };
  return acc;
}, {} as Record<PartName, PartStyle>);

// Accesorio anclado a un hueso (arma, sombrero, capa, escudo, etc.).
export type AccessoryShape = 'capsule' | 'circle' | 'rect';

export type Accessory = {
  readonly id: string;
  readonly name: string;
  readonly anchor: AnchorName;
  readonly shape: AccessoryShape;
  readonly offsetAlong: number; // sobre el eje del hueso (unidades)
  readonly offsetPerp: number;  // perpendicular al hueso (unidades)
  readonly angle: number;       // rotación extra respecto del hueso (grados)
  readonly length: number;      // dimensión principal
  readonly width: number;       // grosor / diámetro
  readonly color: string;
  readonly opacity: number;     // 0..1
  readonly front: boolean;      // delante (true) o detrás (false) de la silueta
  readonly propId?: string;     // grupo de un prop/arma insertado (para toggle/duplicar)
  readonly hidden?: boolean;    // apagado: translúcido en el editor, excluido del export
};

export type RigMode = 'humanoid' | 'custom';

export type Project = {
  readonly character: CharacterDefinition;
  readonly animations: readonly AnimationClip[];
  readonly render: RenderConfig;
  readonly effects: EffectsConfig;
  readonly parts: PartsConfig;
  readonly accessories: readonly Accessory[];
  readonly mode: RigMode;          // humanoide (default) o rig personalizado
  readonly customRig: CustomRig;   // esqueleto genérico (fase 1: estático)
};

export const DEFAULT_RENDER: RenderConfig = {
  cellSize: 256,
  characterHeightRatio: 0.7,
  groundRatio: 0.85,
  flip: false,
  rotation: 0,
  facing: 0,
};

export const DEFAULT_EFFECTS: EffectsConfig = {
  shadow: {
    enabled: false,
    mode: 'ground',
    color: '#000000',
    opacity: 0.35,
    direction: 20,
    length: 4,
    blur: 2,
    flatten: 0.22,
  },
  glow: { enabled: false, color: '#7c9cff', opacity: 0.8, expansion: 2, intensity: 3 },
  outline: { enabled: false, color: '#ffffff', width: 2 },
};

// Construye una pose completa a partir de un parcial, rellenando con la neutra.
const pose = (partial: Partial<Pose>): Pose => ({ ...NEUTRAL_POSE, ...partial });

// Interpolación lineal entre dos poses, campo por campo.
export const lerpPose = (a: Pose, b: Pose, k: number): Pose => {
  const out: Record<string, number> = {};
  for (const key of POSE_KEYS) {
    out[key] = a[key] + (b[key] - a[key]) * k;
  }
  return out as unknown as Pose;
};

// Devuelve la pose en el tiempo t (0..1) interpolando entre keyframes.
// Asume keyframes ordenados por t; si no lo están, los ordena.
export const poseAt = (keyframes: readonly Keyframe[], t: number): Pose => {
  if (keyframes.length === 0) return NEUTRAL_POSE;
  if (keyframes.length === 1) return keyframes[0].pose;

  const sorted = [...keyframes].sort((a, b) => a.t - b.t);

  if (t <= sorted[0].t) return sorted[0].pose;
  const last = sorted[sorted.length - 1];
  if (t >= last.t) return last.pose;

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const cur = sorted[i];
    const next = sorted[i + 1];
    if (t >= cur.t && t <= next.t) {
      const span = next.t - cur.t;
      const k = span === 0 ? 0 : (t - cur.t) / span;
      // El easing del keyframe saliente moldea el tramo hasta el siguiente.
      return lerpPose(cur.pose, next.pose, applyEasing(k, cur.easing));
    }
  }
  return last.pose;
};

// Muestrea un clip en exactamente `frames` poses.
// loop → frame i en t = i / frames; sin loop → t = i / (frames - 1).
export const sampleClip = (clip: AnimationClip): Pose[] => {
  const out: Pose[] = [];
  const n = Math.max(1, clip.frames);
  for (let i = 0; i < n; i += 1) {
    const denom = clip.loop ? n : Math.max(1, n - 1);
    const t = n === 1 ? 0 : i / denom;
    out.push(poseAt(clip.keyframes, t));
  }
  return out;
};

const clip = (
  id: string,
  name: string,
  frames: number,
  fps: number,
  loop: boolean,
  keyframes: readonly Keyframe[],
): AnimationClip => ({ id, name, frames, fps, loop, keyframes });

export const buildDefaultClips = (): AnimationClip[] => [
  clip('idle', 'idle', 8, 8, true, [
    { t: 0, pose: pose({ rootOffsetY: 0, headTilt: 0 }) },
    { t: 0.5, pose: pose({ rootOffsetY: -1.2, headTilt: 1.5, armFarUpper: 3, armNearUpper: -3 }) },
    { t: 1, pose: pose({ rootOffsetY: 0, headTilt: 0 }) },
  ]),

  clip('walk', 'walk', 8, 10, true, [
    {
      t: 0,
      pose: pose({
        torsoLean: 4,
        legFarUpper: 25, legFarLower: -12,
        legNearUpper: -20, legNearLower: -22,
        armFarUpper: 22, armNearUpper: -22,
      }),
    },
    {
      t: 0.25,
      pose: pose({
        torsoLean: 4,
        legFarUpper: 6, legFarLower: -6,
        legNearUpper: -6, legNearLower: -32,
        armFarUpper: 8, armNearUpper: -8,
      }),
    },
    {
      t: 0.5,
      pose: pose({
        torsoLean: 4,
        legFarUpper: -20, legFarLower: -22,
        legNearUpper: 25, legNearLower: -12,
        armFarUpper: -22, armNearUpper: 22,
      }),
    },
    {
      t: 0.75,
      pose: pose({
        torsoLean: 4,
        legFarUpper: -6, legFarLower: -32,
        legNearUpper: 6, legNearLower: -6,
        armFarUpper: -8, armNearUpper: 8,
      }),
    },
    {
      t: 1,
      pose: pose({
        torsoLean: 4,
        legFarUpper: 25, legFarLower: -12,
        legNearUpper: -20, legNearLower: -22,
        armFarUpper: 22, armNearUpper: -22,
      }),
    },
  ]),

  clip('run', 'run', 8, 13, true, [
    {
      t: 0,
      pose: pose({
        torsoLean: 16, rootOffsetY: -1,
        legFarUpper: 42, legFarLower: -20,
        legNearUpper: -38, legNearLower: -55,
        armFarUpper: 40, armFarLower: -45,
        armNearUpper: -42, armNearLower: -45,
      }),
    },
    {
      t: 0.25,
      pose: pose({
        torsoLean: 16, rootOffsetY: -5,
        legFarUpper: 10, legFarLower: -60,
        legNearUpper: -10, legNearLower: -30,
        armFarUpper: 10, armNearUpper: -10,
      }),
    },
    {
      t: 0.5,
      pose: pose({
        torsoLean: 16, rootOffsetY: -1,
        legFarUpper: -38, legFarLower: -55,
        legNearUpper: 42, legNearLower: -20,
        armFarUpper: -42, armFarLower: -45,
        armNearUpper: 40, armNearLower: -45,
      }),
    },
    {
      t: 0.75,
      pose: pose({
        torsoLean: 16, rootOffsetY: -5,
        legFarUpper: -10, legFarLower: -30,
        legNearUpper: 10, legNearLower: -60,
        armFarUpper: -10, armNearUpper: 10,
      }),
    },
    {
      t: 1,
      pose: pose({
        torsoLean: 16, rootOffsetY: -1,
        legFarUpper: 42, legFarLower: -20,
        legNearUpper: -38, legNearLower: -55,
        armFarUpper: 40, armFarLower: -45,
        armNearUpper: -42, armNearLower: -45,
      }),
    },
  ]),

  clip('jump', 'jump', 6, 10, false, [
    {
      t: 0,
      pose: pose({
        rootOffsetY: 6,
        legFarUpper: 8, legFarLower: -45,
        legNearUpper: -8, legNearLower: -45,
        armFarUpper: -30, armNearUpper: -30,
        torsoLean: 8,
      }),
    },
    {
      t: 0.5,
      pose: pose({
        rootOffsetY: -8,
        legFarUpper: 2, legFarLower: -4,
        legNearUpper: -2, legNearLower: -4,
        armFarUpper: 150, armNearUpper: 150,
      }),
    },
    {
      t: 1,
      pose: pose({
        rootOffsetY: -14,
        legFarUpper: 18, legFarLower: -35,
        legNearUpper: -14, legNearLower: -35,
        armFarUpper: 160, armNearUpper: 160,
      }),
    },
  ]),

  clip('fall', 'fall', 4, 8, true, [
    {
      t: 0,
      pose: pose({
        rootOffsetY: -6,
        legFarUpper: 20, legFarLower: -20,
        legNearUpper: -20, legNearLower: -20,
        armFarUpper: 155, armNearUpper: 155,
      }),
    },
    {
      t: 0.5,
      pose: pose({
        rootOffsetY: -6,
        legFarUpper: 12, legFarLower: -12,
        legNearUpper: -12, legNearLower: -28,
        armFarUpper: 165, armNearUpper: 150,
      }),
    },
    {
      t: 1,
      pose: pose({
        rootOffsetY: -6,
        legFarUpper: 20, legFarLower: -20,
        legNearUpper: -20, legNearLower: -20,
        armFarUpper: 155, armNearUpper: 155,
      }),
    },
  ]),

  clip('attack', 'attack', 6, 14, false, [
    {
      t: 0,
      pose: pose({
        torsoLean: -12, headTilt: -6,
        armNearUpper: -120, armNearLower: -20,
        armFarUpper: -20,
      }),
    },
    {
      t: 0.45,
      pose: pose({
        torsoLean: 22, headTilt: 8,
        armNearUpper: 75, armNearLower: -25,
        armFarUpper: 30,
        legFarUpper: 15, legNearUpper: -12,
      }),
    },
    {
      t: 1,
      pose: pose({
        torsoLean: 14, headTilt: 4,
        armNearUpper: 90, armNearLower: -10,
        armFarUpper: 10,
      }),
    },
  ]),

  clip('defend', 'defend', 4, 10, false, [
    {
      t: 0,
      pose: pose({ torsoLean: 6, armNearUpper: 40, armFarUpper: 40 }),
    },
    {
      t: 1,
      pose: pose({
        torsoLean: 10, headTilt: -4,
        armNearUpper: 100, armNearLower: -85,
        armFarUpper: 95, armFarLower: -85,
        legFarUpper: 8, legFarLower: -14,
        legNearUpper: -8, legNearLower: -14,
      }),
    },
  ]),

  clip('hurt', 'hurt', 4, 12, false, [
    { t: 0, pose: pose({}) },
    {
      t: 0.4,
      pose: pose({
        torsoLean: -26, headTilt: -16, rootOffsetY: -2,
        armFarUpper: 40, armNearUpper: 40,
        legFarUpper: -10, legNearUpper: 12,
      }),
    },
    {
      t: 1,
      pose: pose({ torsoLean: -10, headTilt: -6, armFarUpper: 15, armNearUpper: 15 }),
    },
  ]),

  clip('death', 'death', 8, 10, false, [
    { t: 0, pose: pose({}) },
    {
      t: 0.3,
      pose: pose({
        rootRotation: -12, torsoLean: -18, headTilt: -12,
        armFarUpper: 60, armNearUpper: 60,
      }),
    },
    {
      t: 0.65,
      pose: pose({
        rootRotation: -55, torsoLean: -10,
        armFarUpper: 90, armNearUpper: 70,
        legFarUpper: 20, legNearUpper: -15,
      }),
    },
    {
      t: 1,
      pose: pose({
        rootRotation: -90, torsoLean: 0,
        armFarUpper: 100, armNearUpper: 60,
        legFarUpper: 15, legFarLower: -10,
        legNearUpper: -12, legNearLower: -10,
      }),
    },
  ]),
];

export const buildDefaultProject = (): Project => ({
  character: DEFAULT_CHARACTER,
  animations: buildDefaultClips(),
  render: DEFAULT_RENDER,
  effects: DEFAULT_EFFECTS,
  parts: DEFAULT_PARTS,
  accessories: [],
  mode: 'humanoid',
  customRig: buildDefaultCustomRig(),
});
