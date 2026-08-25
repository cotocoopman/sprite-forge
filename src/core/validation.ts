// Validación manual (sin Zod) del shape de un proyecto importado.

import type { CharacterDefinition, Pose } from './rig';
import { POSE_KEYS } from './rig';
import { ANCHOR_NAMES, PART_NAMES } from './rig';
import type { AnchorName, PartName } from './rig';
import type { Bone, BoneShape, CustomRig, RigClip, RigKeyframe } from './customRig';
import { buildDefaultCustomRig } from './customRig';
import type {
  Accessory,
  AccessoryShape,
  AnimationClip,
  EffectsConfig,
  Keyframe,
  PartsConfig,
  PartStyle,
  Project,
  RenderConfig,
} from './poses';
import { DEFAULT_EFFECTS } from './poses';

export type ValidationResult =
  | { readonly ok: true; readonly project: Project }
  | { readonly ok: false; readonly error: string };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';

// Formas válidas (accesorios y huesos comparten el set; 'capsule' es el fallback).
const ACC_SHAPES = new Set(['capsule', 'circle', 'rect', 'triangle', 'path', 'star', 'trapezoid', 'bolt']);

// Puntos de un trazo (shape 'path'); devuelve undefined si no hay ninguno válido.
const parsePoints = (v: unknown): { x: number; y: number }[] | undefined => {
  if (!Array.isArray(v)) return undefined;
  const pts = v
    .filter((p): p is { x: number; y: number } => isRecord(p) && isNum(p.x) && isNum(p.y))
    .map((p) => ({ x: p.x, y: p.y }));
  return pts.length > 0 ? pts : undefined;
};

const CHARACTER_NUM_KEYS: readonly (keyof CharacterDefinition)[] = [
  'headDiameter',
  'torsoHeight',
  'legHeight',
  'shoulderDistance',
  'armWidth',
  'armUpperLength',
  'armLowerLength',
  'hipOffset',
  'legWidth',
  'legUpperRatio',
  'footLength',
  'footWidth',
];

const validateCharacter = (v: unknown): CharacterDefinition | string => {
  if (!isRecord(v)) return 'character no es un objeto';
  if (!isStr(v.id)) return 'character.id inválido';
  if (!isStr(v.name)) return 'character.name inválido';
  if (!isStr(v.color)) return 'character.color inválido';
  for (const key of CHARACTER_NUM_KEYS) {
    if (!isNum(v[key])) return `character.${key} debe ser número`;
  }
  // Campos opcionales agregados después: default si faltan o son inválidos.
  // armCurve/legCurve legacy (valor único) migran a upper+lower.
  const legacyArm = isNum(v.armCurve) ? v.armCurve : 0;
  const legacyLeg = isNum(v.legCurve) ? v.legCurve : 0;
  const target = (t: unknown): 'both' | 'near' | 'far' =>
    t === 'near' || t === 'far' ? t : 'both';
  // torsoWidth: si falta, migra del viejo torsoWidthRatio (ancho = ratio × cabeza)
  // para que el personaje guardado se vea igual; si no, default.
  const torsoWidth = isNum(v.torsoWidth)
    ? v.torsoWidth
    : isNum(v.torsoWidthRatio) && isNum(v.headDiameter)
      ? v.headDiameter * v.torsoWidthRatio
      : 19.25;
  return {
    ...(v as unknown as CharacterDefinition),
    torsoWidth,
    neckLength: isNum(v.neckLength) ? v.neckLength : 0,
    armSpacing: isNum(v.armSpacing) ? v.armSpacing : 0,
    armCurveUpper: isNum(v.armCurveUpper) ? v.armCurveUpper : legacyArm,
    armCurveLower: isNum(v.armCurveLower) ? v.armCurveLower : legacyArm,
    armCurveTarget: target(v.armCurveTarget),
    legCurveUpper: isNum(v.legCurveUpper) ? v.legCurveUpper : legacyLeg,
    legCurveLower: isNum(v.legCurveLower) ? v.legCurveLower : legacyLeg,
    legCurveTarget: target(v.legCurveTarget),
  };
};

const validatePose = (v: unknown, ctx: string): Pose | string => {
  if (!isRecord(v)) return `${ctx} no es un objeto`;
  for (const key of POSE_KEYS) {
    if (!isNum(v[key])) return `${ctx}.${key} debe ser número`;
  }
  return v as unknown as Pose;
};

const isEasing = (v: unknown): v is 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' =>
  v === 'linear' || v === 'easeIn' || v === 'easeOut' || v === 'easeInOut';

const validateKeyframe = (v: unknown, ctx: string): Keyframe | string => {
  if (!isRecord(v)) return `${ctx} no es un objeto`;
  if (!isNum(v.t)) return `${ctx}.t debe ser número`;
  const p = validatePose(v.pose, `${ctx}.pose`);
  if (typeof p === 'string') return p;
  return { t: v.t, pose: p, easing: isEasing(v.easing) ? v.easing : 'linear' };
};

const validateClip = (v: unknown, ctx: string): AnimationClip | string => {
  if (!isRecord(v)) return `${ctx} no es un objeto`;
  if (!isStr(v.id)) return `${ctx}.id inválido`;
  if (!isStr(v.name)) return `${ctx}.name inválido`;
  if (!isNum(v.frames)) return `${ctx}.frames debe ser número`;
  if (!isNum(v.fps)) return `${ctx}.fps debe ser número`;
  if (!isBool(v.loop)) return `${ctx}.loop debe ser booleano`;
  if (!Array.isArray(v.keyframes)) return `${ctx}.keyframes debe ser un arreglo`;
  const keyframes: Keyframe[] = [];
  for (let i = 0; i < v.keyframes.length; i += 1) {
    const kf = validateKeyframe(v.keyframes[i], `${ctx}.keyframes[${i}]`);
    if (typeof kf === 'string') return kf;
    keyframes.push(kf);
  }
  return { id: v.id, name: v.name, frames: v.frames, fps: v.fps, loop: v.loop, keyframes };
};

const validateRender = (v: unknown): RenderConfig | string => {
  if (!isRecord(v)) return 'render no es un objeto';
  if (!isNum(v.cellSize)) return 'render.cellSize debe ser número';
  if (!isNum(v.characterHeightRatio)) return 'render.characterHeightRatio debe ser número';
  if (!isNum(v.groundRatio)) return 'render.groundRatio debe ser número';
  if (!isBool(v.flip)) return 'render.flip debe ser booleano';
  return {
    cellSize: v.cellSize,
    characterHeightRatio: v.characterHeightRatio,
    groundRatio: v.groundRatio,
    flip: v.flip,
    rotation: isNum(v.rotation) ? v.rotation : 0, // opcional (agregado después)
    facing: isNum(v.facing) ? v.facing : 0,       // giro 3D (agregado después)
  };
};

// Efectos: opcionales y tolerantes — cualquier campo faltante toma el default.
const validateEffects = (v: unknown): EffectsConfig => {
  if (!isRecord(v)) return DEFAULT_EFFECTS;
  const s = isRecord(v.shadow) ? v.shadow : {};
  const g = isRecord(v.glow) ? v.glow : {};
  const o = isRecord(v.outline) ? v.outline : {};
  const ds = DEFAULT_EFFECTS.shadow;
  const dg = DEFAULT_EFFECTS.glow;
  const dout = DEFAULT_EFFECTS.outline;
  return {
    shadow: {
      enabled: isBool(s.enabled) ? s.enabled : ds.enabled,
      mode: s.mode === 'drop' || s.mode === 'ground' ? s.mode : ds.mode,
      color: isStr(s.color) ? s.color : ds.color,
      opacity: isNum(s.opacity) ? s.opacity : ds.opacity,
      direction: isNum(s.direction) ? s.direction : ds.direction,
      length: isNum(s.length) ? s.length : ds.length,
      blur: isNum(s.blur) ? s.blur : ds.blur,
      flatten: isNum(s.flatten) ? s.flatten : ds.flatten,
    },
    glow: {
      enabled: isBool(g.enabled) ? g.enabled : dg.enabled,
      color: isStr(g.color) ? g.color : dg.color,
      opacity: isNum(g.opacity) ? g.opacity : dg.opacity,
      expansion: isNum(g.expansion) ? g.expansion : dg.expansion,
      intensity: isNum(g.intensity) ? g.intensity : dg.intensity,
    },
    outline: {
      enabled: isBool(o.enabled) ? o.enabled : dout.enabled,
      color: isStr(o.color) ? o.color : dout.color,
      width: isNum(o.width) ? o.width : dout.width,
    },
  };
};

// Partes: opcionales y tolerantes. Migra el two-tone viejo (headColor) a parts.head.
const validateParts = (v: unknown, character: unknown): PartsConfig => {
  const rec = isRecord(v) ? v : {};
  const out = {} as Record<PartName, PartStyle>;
  // Escala válida y acotada; ignora valores no numéricos o fuera de rango.
  const scale = (x: unknown): number | undefined =>
    isNum(x) && x > 0 ? Math.min(4, Math.max(0.1, x)) : undefined;
  // Offset/rotación acotados; undefined si no es número (u 0 → se omite).
  const clamped = (x: unknown, lim: number): number | undefined =>
    isNum(x) && x !== 0 ? Math.min(lim, Math.max(-lim, x)) : undefined;
  for (const name of PART_NAMES) {
    const p = isRecord(rec[name]) ? rec[name] : {};
    const ws = scale(p.widthScale);
    const ol = scale(p.lengthScale);
    const rot = clamped(p.rotate, 360);
    const dx = clamped(p.dx, 200);
    const dy = clamped(p.dy, 200);
    out[name] = {
      visible: isBool(p.visible) ? p.visible : true,
      color: isStr(p.color) ? p.color : null,
      ...(isStr(p.name) ? { name: p.name } : {}),
      ...(ACC_SHAPES.has(p.shape as string) ? { shape: p.shape as PartStyle['shape'] } : {}),
      ...(ws !== undefined ? { widthScale: ws } : {}),
      ...(ol !== undefined ? { lengthScale: ol } : {}),
      ...(rot !== undefined ? { rotate: rot } : {}),
      ...(dx !== undefined ? { dx } : {}),
      ...(dy !== undefined ? { dy } : {}),
    };
  }
  // Migración: si venía headColorEnabled + headColor, pasarlo a la cabeza.
  if (isRecord(character) && character.headColorEnabled === true && isStr(character.headColor) && !out.head.color) {
    out.head = { ...out.head, color: character.headColor };
  }
  return out;
};

// Accesorios: opcionales y tolerantes. Los ítems inválidos se descartan.
const validateAccessories = (v: unknown): Accessory[] => {
  if (!Array.isArray(v)) return [];
  const num = (x: unknown, d: number): number => (isNum(x) ? x : d);
  const out: Accessory[] = [];
  for (const item of v) {
    if (!isRecord(item)) continue;
    if (!isStr(item.id) || !isStr(item.name)) continue;
    const anchor = (ANCHOR_NAMES as readonly string[]).includes(item.anchor as string)
      ? (item.anchor as AnchorName)
      : 'handNear';
    const shape: AccessoryShape = ACC_SHAPES.has(item.shape as string)
      ? (item.shape as AccessoryShape)
      : 'capsule';
    const points = parsePoints(item.points);
    out.push({
      id: item.id,
      name: item.name,
      anchor,
      shape,
      offsetAlong: num(item.offsetAlong, 0),
      offsetPerp: num(item.offsetPerp, 0),
      angle: num(item.angle, 0),
      length: num(item.length, 10),
      width: num(item.width, 4),
      color: isStr(item.color) ? item.color : '#000000',
      opacity: num(item.opacity, 1),
      front: isBool(item.front) ? item.front : true,
      ...(isStr(item.propId) ? { propId: item.propId } : {}),
      ...(isBool(item.hidden) ? { hidden: item.hidden } : {}),
      ...(points ? { points } : {}),
      ...(isRecord(item.anchorTo) && isStr(item.anchorTo.id) &&
        (item.anchorTo.part === 'base' || item.anchorTo.part === 'tip' || item.anchorTo.part === 'center')
        ? { anchorTo: { id: item.anchorTo.id, part: item.anchorTo.part } }
        : {}),
    });
  }
  return out;
};

const validateRigPose = (v: unknown): Record<string, number> => {
  if (!isRecord(v)) return {};
  const out: Record<string, number> = {};
  for (const [k, val] of Object.entries(v)) if (isNum(val)) out[k] = val;
  return out;
};

const validateRigClips = (v: unknown): RigClip[] => {
  const arr = Array.isArray(v) ? v : [];
  const num = (x: unknown, d: number): number => (isNum(x) ? x : d);
  const out: RigClip[] = [];
  for (const item of arr) {
    if (!isRecord(item) || !isStr(item.id) || !isStr(item.name)) continue;
    const kfs = Array.isArray(item.keyframes) ? item.keyframes : [];
    const keyframes: RigKeyframe[] = [];
    for (const kf of kfs) {
      if (!isRecord(kf) || !isNum(kf.t)) continue;
      keyframes.push({ t: kf.t, pose: validateRigPose(kf.pose), easing: isEasing(kf.easing) ? kf.easing : 'linear' });
    }
    if (keyframes.length === 0) keyframes.push({ t: 0, pose: {} }, { t: 1, pose: {} });
    out.push({
      id: item.id,
      name: item.name,
      frames: Math.max(1, Math.round(num(item.frames, 8))),
      fps: Math.max(1, Math.round(num(item.fps, 8))),
      loop: isBool(item.loop) ? item.loop : true,
      keyframes,
    });
  }
  if (out.length === 0) {
    out.push({ id: 'idle', name: 'idle', frames: 8, fps: 8, loop: true, keyframes: [{ t: 0, pose: {} }, { t: 1, pose: {} }] });
  }
  return out;
};

// Rig personalizado: tolerante. Si no hay huesos válidos, usa el default.
const validateCustomRig = (v: unknown): CustomRig => {
  if (!isRecord(v)) return buildDefaultCustomRig();
  const num = (x: unknown, d: number): number => (isNum(x) ? x : d);
  const shapeOf = (x: unknown): BoneShape => (ACC_SHAPES.has(x as string) ? (x as BoneShape) : 'capsule');
  const bonesRaw = Array.isArray(v.bones) ? v.bones : [];
  const bones: Bone[] = [];
  for (const item of bonesRaw) {
    if (!isRecord(item) || !isStr(item.id) || !isStr(item.name)) continue;
    const offset =
      isRecord(item.offset) && isNum(item.offset.x) && isNum(item.offset.y)
        ? { x: item.offset.x, y: item.offset.y }
        : undefined;
    bones.push({
      id: item.id,
      name: item.name,
      parentId: isStr(item.parentId) ? item.parentId : null,
      attach: num(item.attach, 0),
      angle: num(item.angle, 0),
      length: num(item.length, 10),
      width: num(item.width, 4),
      shape: shapeOf(item.shape),
      curve: num(item.curve, 0),
      color: isStr(item.color) ? item.color : null,
      z: num(item.z, 0),
      ...(offset ? { offset } : {}),
      ...(isBool(item.hidden) ? { hidden: item.hidden } : {}),
      ...(parsePoints(item.points) ? { points: parsePoints(item.points)! } : {}),
    });
  }
  if (bones.length === 0) return buildDefaultCustomRig();
  const origin = isRecord(v.origin) && isNum(v.origin.x) && isNum(v.origin.y)
    ? { x: v.origin.x, y: v.origin.y }
    : { x: 0, y: 55 };
  return {
    id: isStr(v.id) ? v.id : 'rig',
    name: isStr(v.name) ? v.name : 'Rig',
    color: isStr(v.color) ? v.color : '#000000',
    origin,
    bones,
    animations: validateRigClips(v.animations),
  };
};

export const validateProject = (raw: unknown): ValidationResult => {
  if (!isRecord(raw)) return { ok: false, error: 'El JSON no es un objeto' };

  const character = validateCharacter(raw.character);
  if (typeof character === 'string') return { ok: false, error: character };

  if (!Array.isArray(raw.animations)) {
    return { ok: false, error: 'animations debe ser un arreglo' };
  }
  if (raw.animations.length === 0) {
    return { ok: false, error: 'animations no puede estar vacío' };
  }
  const animations: AnimationClip[] = [];
  for (let i = 0; i < raw.animations.length; i += 1) {
    const c = validateClip(raw.animations[i], `animations[${i}]`);
    if (typeof c === 'string') return { ok: false, error: c };
    animations.push(c);
  }

  const render = validateRender(raw.render);
  if (typeof render === 'string') return { ok: false, error: render };

  const effects = validateEffects(raw.effects);
  const parts = validateParts(raw.parts, raw.character);
  const accessories = validateAccessories(raw.accessories);
  const mode = raw.mode === 'custom' ? 'custom' : 'humanoid';
  const customRig = validateCustomRig(raw.customRig);

  return { ok: true, project: { character, animations, render, effects, parts, accessories, mode, customRig } };
};

// Parseo seguro desde texto JSON.
export const parseProjectJson = (text: string): ValidationResult => {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'JSON malformado' };
  }
  return validateProject(raw);
};
