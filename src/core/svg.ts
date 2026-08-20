// Render SVG. Núcleo puro: produce primitivas y strings de markup.
// El preview de React reutiliza skeletonToPrimitives; el export reutiliza el markup.

import type { Anchor, AnchorName, CharacterDefinition, PartName, Pose, Skeleton } from './rig';
import { buildSkeleton, PART_NAMES } from './rig';
import type { Accessory, EffectsConfig, PartsConfig, RenderConfig } from './poses';
import type { CustomRig, RBone, RigPose } from './customRig';
import { buildCustomSkeleton } from './customRig';

const rad = (deg: number): number => (deg * Math.PI) / 180;

export type SvgLine = {
  readonly kind: 'line';
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly width: number;
  readonly cx?: number; // punto de control (hueso curvo)
  readonly cy?: number;
  readonly part: PartName;
};

export type SvgCircle = {
  readonly kind: 'circle';
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly part: PartName;
};

export type SvgPrimitive = SvgLine | SvgCircle;

export type PxTransform = {
  readonly scale: number;
  readonly centerX: number;
  readonly groundY: number;
  readonly flip: boolean;
};

export const makeTransform = (render: RenderConfig): PxTransform => ({
  scale: (render.cellSize * render.characterHeightRatio) / 100,
  centerX: render.cellSize / 2,
  groundY: render.cellSize * render.groundRatio,
  flip: render.flip,
});

const toPx = (x: number, y: number, tf: PxTransform): { px: number; py: number } => ({
  px: tf.centerX + x * tf.scale * (tf.flip ? -1 : 1),
  py: tf.groundY + (y - 100) * tf.scale,
});

// Convierte un esqueleto (coordenadas de unidad) a primitivas en píxeles.
export const skeletonToPrimitives = (skel: Skeleton, render: RenderConfig): SvgPrimitive[] => {
  const tf = makeTransform(render);
  const prims: SvgPrimitive[] = [];

  for (const cap of skel.capsules) {
    const a = toPx(cap.from.x, cap.from.y, tf);
    const b = toPx(cap.to.x, cap.to.y, tf);
    const ctrl = cap.ctrl ? toPx(cap.ctrl.x, cap.ctrl.y, tf) : undefined;
    prims.push({
      kind: 'line',
      x1: a.px,
      y1: a.py,
      x2: b.px,
      y2: b.py,
      width: cap.width * tf.scale,
      part: cap.part ?? 'torso',
      ...(ctrl ? { cx: ctrl.px, cy: ctrl.py } : {}),
    });
  }

  const head = toPx(skel.headCenter.x, skel.headCenter.y, tf);
  prims.push({ kind: 'circle', cx: head.px, cy: head.py, r: skel.headRadius * tf.scale, part: 'head' });

  return prims;
};

// --- Accesorios ---
export type AccPrim =
  | { readonly kind: 'line'; readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number; readonly width: number; readonly color: string; readonly opacity: number; readonly front: boolean }
  | { readonly kind: 'circle'; readonly cx: number; readonly cy: number; readonly r: number; readonly color: string; readonly opacity: number; readonly front: boolean }
  | { readonly kind: 'poly'; readonly pts: readonly { x: number; y: number }[]; readonly color: string; readonly opacity: number; readonly front: boolean };

export const accessoriesToPrimitives = (
  accessories: readonly Accessory[],
  anchors: Record<AnchorName, Anchor>,
  render: RenderConfig,
): AccPrim[] => {
  const tf = makeTransform(render);
  const out: AccPrim[] = [];
  for (const acc of accessories) {
    const anchor = anchors[acc.anchor];
    if (!anchor) continue;
    const ar = rad(anchor.angle);
    const along = { x: Math.sin(ar), y: Math.cos(ar) };
    const perp = { x: Math.cos(ar), y: -Math.sin(ar) };
    const base = {
      x: anchor.pos.x + acc.offsetAlong * along.x + acc.offsetPerp * perp.x,
      y: anchor.pos.y + acc.offsetAlong * along.y + acc.offsetPerp * perp.y,
    };
    const sr = rad(anchor.angle + acc.angle);
    const dir = { x: Math.sin(sr), y: Math.cos(sr) };
    const perpS = { x: Math.cos(sr), y: -Math.sin(sr) };
    const common = { color: acc.color, opacity: acc.opacity, front: acc.front };

    if (acc.shape === 'circle') {
      const c = toPx(base.x, base.y, tf);
      out.push({ kind: 'circle', cx: c.px, cy: c.py, r: (acc.width / 2) * tf.scale, ...common });
    } else if (acc.shape === 'capsule') {
      const end = { x: base.x + dir.x * acc.length, y: base.y + dir.y * acc.length };
      const a = toPx(base.x, base.y, tf);
      const b = toPx(end.x, end.y, tf);
      out.push({ kind: 'line', x1: a.px, y1: a.py, x2: b.px, y2: b.py, width: acc.width * tf.scale, ...common });
    } else {
      const hw = acc.width / 2;
      const corners = [
        { x: base.x + perpS.x * hw, y: base.y + perpS.y * hw },
        { x: base.x - perpS.x * hw, y: base.y - perpS.y * hw },
        { x: base.x - perpS.x * hw + dir.x * acc.length, y: base.y - perpS.y * hw + dir.y * acc.length },
        { x: base.x + perpS.x * hw + dir.x * acc.length, y: base.y + perpS.y * hw + dir.y * acc.length },
      ];
      const pts = corners.map((p) => {
        const q = toPx(p.x, p.y, tf);
        return { x: q.px, y: q.py };
      });
      out.push({ kind: 'poly', pts, ...common });
    }
  }
  return out;
};

const fmt = (n: number): string => Number(n.toFixed(3)).toString();

// Markup de accesorios de una capa (front true/false), con offsetX para sheets.
const accMarkup = (prims: readonly AccPrim[] | undefined, offsetX: number, front: boolean): string =>
  (prims ?? [])
    .filter((p) => p.front === front)
    .map((p) => {
      if (p.kind === 'line') {
        return `<path d="M ${fmt(p.x1 + offsetX)} ${fmt(p.y1)} L ${fmt(p.x2 + offsetX)} ${fmt(p.y2)}" stroke="${p.color}" stroke-width="${fmt(p.width)}" stroke-linecap="round" fill="none" opacity="${fmt(p.opacity)}" />`;
      }
      if (p.kind === 'circle') {
        return `<circle cx="${fmt(p.cx + offsetX)}" cy="${fmt(p.cy)}" r="${fmt(p.r)}" fill="${p.color}" opacity="${fmt(p.opacity)}" />`;
      }
      const pts = p.pts.map((q) => `${fmt(q.x + offsetX)},${fmt(q.y)}`).join(' ');
      return `<polygon points="${pts}" fill="${p.color}" opacity="${fmt(p.opacity)}" />`;
    })
    .join('');

// Solo las formas (paths/circle), sin <g>. offsetX desplaza en X (para sheets).
const shapesMarkup = (prims: readonly SvgPrimitive[], offsetX: number): string =>
  prims
    .map((p) => {
      if (p.kind === 'line') {
        const x1 = fmt(p.x1 + offsetX);
        const x2 = fmt(p.x2 + offsetX);
        if (p.cx !== undefined && p.cy !== undefined) {
          return `<path d="M ${x1} ${fmt(p.y1)} Q ${fmt(p.cx + offsetX)} ${fmt(p.cy)} ${x2} ${fmt(p.y2)}" stroke-width="${fmt(p.width)}" stroke-linecap="round" fill="none" />`;
        }
        return `<path d="M ${x1} ${fmt(p.y1)} L ${x2} ${fmt(p.y2)}" stroke-width="${fmt(p.width)}" stroke-linecap="round" />`;
      }
      return `<circle cx="${fmt(p.cx + offsetX)}" cy="${fmt(p.cy)}" r="${fmt(p.r)}" />`;
    })
    .join('');

// Definiciones de filtros (sombra desenfocada + brillo + contorno).
const effectDefs = (effects: EffectsConfig | undefined, scale: number): string => {
  if (!effects) return '';
  const parts: string[] = [];
  const { shadow, glow, outline } = effects;
  if (shadow?.enabled && shadow.blur > 0) {
    parts.push(
      `<filter id="sf-shadow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="${fmt(shadow.blur * scale)}" /></filter>`,
    );
  }
  if (glow?.enabled) {
    const dil = fmt(Math.max(0, glow.expansion) * scale);
    const blur = fmt(Math.max(0.01, glow.intensity) * scale);
    parts.push(
      `<filter id="sf-glow" x="-80%" y="-80%" width="260%" height="260%">` +
        `<feMorphology operator="dilate" radius="${dil}" in="SourceAlpha" result="d" />` +
        `<feGaussianBlur in="d" stdDeviation="${blur}" result="b" />` +
        `<feFlood flood-color="${glow.color}" flood-opacity="${fmt(glow.opacity)}" result="c" />` +
        `<feComposite in="c" in2="b" operator="in" />` +
        `</filter>`,
    );
  }
  if (outline?.enabled && outline.width > 0) {
    const r = fmt(Math.max(0.01, outline.width) * scale);
    parts.push(
      `<filter id="sf-outline" x="-50%" y="-50%" width="200%" height="200%">` +
        `<feMorphology operator="dilate" radius="${r}" in="SourceAlpha" result="d" />` +
        `<feFlood flood-color="${outline.color}" flood-opacity="1" result="c" />` +
        `<feComposite in="c" in2="d" operator="in" />` +
        `</filter>`,
    );
  }
  return parts.length ? `<defs>${parts.join('')}</defs>` : '';
};

export type MarkupOpts = {
  readonly offsetX?: number;
  readonly cellSize: number;
  readonly groundY: number;
  readonly rotation?: number;
  readonly effects?: EffectsConfig;
  readonly scale: number;
  readonly parts?: PartsConfig;
  readonly ghostHidden?: boolean; // preview: dibuja las partes ocultas grisáceas
  readonly accPrims?: readonly AccPrim[];
};

const GHOST_COLOR = '#888888';
const GHOST_OPACITY = 0.15;

// Grupo completo del personaje: sombra + contorno + brillo + silueta por partes,
// con visibilidad/color por parte y giro opcional.
export const renderCharacterGroup = (
  prims: readonly SvgPrimitive[],
  color: string,
  opts: MarkupOpts,
): string => {
  const offsetX = opts.offsetX ?? 0;
  const pcx = offsetX + opts.cellSize / 2;
  const parts = opts.parts;

  const isVisible = (name: PartName): boolean => !parts || parts[name].visible;
  const colorOf = (name: PartName): string => (parts && parts[name].color) || color;

  // Formas de las partes visibles (para efectos: una parte oculta no proyecta sombra/brillo).
  const visiblePrims = prims.filter((p) => isVisible(p.part));
  const visibleShapes = shapesMarkup(visiblePrims, offsetX);

  const layers: string[] = [];

  // Sombra — detrás de todo.
  const shadow = opts.effects?.shadow;
  if (shadow?.enabled && visiblePrims.length > 0) {
    const blur = shadow.blur > 0 ? ' filter="url(#sf-shadow)"' : '';
    let transform: string;
    if (shadow.mode === 'ground') {
      const flat = Math.max(0.02, Math.min(1, shadow.flatten));
      const offX = fmt(shadow.length * opts.scale);
      const skew = fmt(Math.max(-80, Math.min(80, shadow.direction)));
      transform =
        `translate(${offX} 0) translate(${fmt(pcx)} ${fmt(opts.groundY)}) ` +
        `scale(1 ${fmt(flat)}) skewX(${skew}) translate(${fmt(-pcx)} ${fmt(-opts.groundY)})`;
    } else {
      const dx = fmt(Math.sin((shadow.direction * Math.PI) / 180) * shadow.length * opts.scale);
      const dy = fmt(Math.cos((shadow.direction * Math.PI) / 180) * shadow.length * opts.scale);
      transform = `translate(${dx} ${dy})`;
    }
    layers.push(
      `<g transform="${transform}" fill="${shadow.color}" stroke="${shadow.color}" opacity="${fmt(shadow.opacity)}"${blur}>${visibleShapes}</g>`,
    );
  }

  // Brillo — copia difusa detrás (fill/stroke sólidos para que TODO el cuerpo cuente).
  if (opts.effects?.glow?.enabled && visiblePrims.length > 0) {
    layers.push(`<g fill="#000" stroke="#000" filter="url(#sf-glow)">${visibleShapes}</g>`);
  }

  // Contorno — borde duro justo detrás de la silueta.
  if (opts.effects?.outline?.enabled && opts.effects.outline.width > 0 && visiblePrims.length > 0) {
    layers.push(`<g fill="#000" stroke="#000" filter="url(#sf-outline)">${visibleShapes}</g>`);
  }

  // Accesorios detrás de la silueta.
  const accBehind = accMarkup(opts.accPrims, offsetX, false);
  if (accBehind) layers.push(accBehind);

  // Silueta por partes: cada parte con su color; las ocultas se omiten (export)
  // o se dibujan grisáceas (preview con ghostHidden).
  for (const name of PART_NAMES) {
    const pr = prims.filter((p) => p.part === name);
    if (pr.length === 0) continue;
    const shapes = shapesMarkup(pr, offsetX);
    if (isVisible(name)) {
      const c = colorOf(name);
      layers.push(`<g fill="${c}" stroke="${c}">${shapes}</g>`);
    } else if (opts.ghostHidden) {
      layers.push(`<g fill="${GHOST_COLOR}" stroke="${GHOST_COLOR}" opacity="${GHOST_OPACITY}">${shapes}</g>`);
    }
  }

  // Accesorios delante de la silueta.
  const accFront = accMarkup(opts.accPrims, offsetX, true);
  if (accFront) layers.push(accFront);

  const inner = layers.join('');
  const rot = opts.rotation
    ? ` transform="rotate(${fmt(opts.rotation)} ${fmt(pcx)} ${fmt(opts.cellSize / 2)})"`
    : '';
  return `<g${rot}>${inner}</g>`;
};

// Markup interno de un personaje (defs de efectos + grupo con giro), sin <svg>.
// Lo reutiliza el preview (inyectado con dangerouslySetInnerHTML).
export const renderCharacterInner = (
  character: CharacterDefinition,
  poseValue: Pose,
  render: RenderConfig,
  effects?: EffectsConfig,
  parts?: PartsConfig,
  ghostHidden = false,
  accessories: readonly Accessory[] = [],
): string => {
  const skel = buildSkeleton(character, poseValue, render.facing);
  const prims = skeletonToPrimitives(skel, render);
  const accPrims = accessoriesToPrimitives(accessories, skel.anchors, render);
  const tf = makeTransform(render);
  const defs = effectDefs(effects, tf.scale);
  const group = renderCharacterGroup(prims, character.color, {
    cellSize: render.cellSize,
    groundY: tf.groundY,
    rotation: render.rotation,
    effects,
    scale: tf.scale,
    parts,
    ghostHidden,
    accPrims,
  });
  return `${defs}${group}`;
};

// SVG completo de una sola celda para una pose (export: parts ocultas se omiten).
export const renderSvg = (
  character: CharacterDefinition,
  poseValue: Pose,
  render: RenderConfig,
  effects?: EffectsConfig,
  parts?: PartsConfig,
  accessories: readonly Accessory[] = [],
): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${render.cellSize}" height="${render.cellSize}" viewBox="0 0 ${render.cellSize} ${render.cellSize}">${renderCharacterInner(character, poseValue, render, effects, parts, false, accessories)}</svg>`;

// Sprite sheet horizontal: cellSize * frames de ancho, un grupo por frame.
export const renderSheet = (
  character: CharacterDefinition,
  poses: readonly Pose[],
  render: RenderConfig,
  effects?: EffectsConfig,
  parts?: PartsConfig,
  accessories: readonly Accessory[] = [],
): string => {
  const width = render.cellSize * poses.length;
  const tf = makeTransform(render);
  const defs = effectDefs(effects, tf.scale);
  const groups = poses
    .map((p, i) => {
      const skel = buildSkeleton(character, p, render.facing);
      const prims = skeletonToPrimitives(skel, render);
      const accPrims = accessoriesToPrimitives(accessories, skel.anchors, render);
      return renderCharacterGroup(prims, character.color, {
        offsetX: i * render.cellSize,
        cellSize: render.cellSize,
        groundY: tf.groundY,
        rotation: render.rotation,
        effects,
        scale: tf.scale,
        parts,
        accPrims,
      });
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${render.cellSize}" viewBox="0 0 ${width} ${render.cellSize}">${defs}${groups}</svg>`;
};

// --- Rig personalizado (huesos genéricos) ---
const customShapesMarkup = (
  bones: readonly RBone[],
  tf: PxTransform,
  offsetX: number,
  forceColor?: string,
): string =>
  bones
    .map((b) => {
      const col = forceColor ?? b.color;
      if (b.kind === 'circle') {
        const c = toPx(b.cx, b.cy, tf);
        return `<circle cx="${fmt(c.px + offsetX)}" cy="${fmt(c.py)}" r="${fmt(b.r * tf.scale)}" fill="${col}" stroke="${col}" />`;
      }
      if (b.kind === 'rect') {
        const pts = b.pts.map((p) => { const q = toPx(p.x, p.y, tf); return `${fmt(q.px + offsetX)},${fmt(q.py)}`; }).join(' ');
        return `<polygon points="${pts}" fill="${col}" stroke="${col}" />`;
      }
      const a = toPx(b.from.x, b.from.y, tf);
      const t = toPx(b.to.x, b.to.y, tf);
      const w = fmt(b.width * tf.scale);
      if (b.ctrl) {
        const c = toPx(b.ctrl.x, b.ctrl.y, tf);
        return `<path d="M ${fmt(a.px + offsetX)} ${fmt(a.py)} Q ${fmt(c.px + offsetX)} ${fmt(c.py)} ${fmt(t.px + offsetX)} ${fmt(t.py)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" fill="none" />`;
      }
      return `<path d="M ${fmt(a.px + offsetX)} ${fmt(a.py)} L ${fmt(t.px + offsetX)} ${fmt(t.py)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" fill="none" />`;
    })
    .join('');

// Capas de efecto (sombra/brillo/contorno) para el rig, usando una versión
// monocroma de los huesos como fuente del filtro.
const customEffectLayers = (
  monoShapes: string,
  effects: EffectsConfig | undefined,
  pcx: number,
  groundY: number,
  scale: number,
): string[] => {
  if (!effects || !monoShapes) return [];
  const layers: string[] = [];
  const { shadow, glow, outline } = effects;
  if (shadow?.enabled) {
    const blur = shadow.blur > 0 ? ' filter="url(#sf-shadow)"' : '';
    let transform: string;
    if (shadow.mode === 'ground') {
      const flat = Math.max(0.02, Math.min(1, shadow.flatten));
      const offX = fmt(shadow.length * scale);
      const skew = fmt(Math.max(-80, Math.min(80, shadow.direction)));
      transform =
        `translate(${offX} 0) translate(${fmt(pcx)} ${fmt(groundY)}) ` +
        `scale(1 ${fmt(flat)}) skewX(${skew}) translate(${fmt(-pcx)} ${fmt(-groundY)})`;
    } else {
      const dx = fmt(Math.sin((shadow.direction * Math.PI) / 180) * shadow.length * scale);
      const dy = fmt(Math.cos((shadow.direction * Math.PI) / 180) * shadow.length * scale);
      transform = `translate(${dx} ${dy})`;
    }
    layers.push(
      `<g transform="${transform}" fill="${shadow.color}" stroke="${shadow.color}" opacity="${fmt(shadow.opacity)}"${blur}>${monoShapes}</g>`,
    );
  }
  if (glow?.enabled) {
    layers.push(`<g fill="#000" stroke="#000" filter="url(#sf-glow)">${monoShapes}</g>`);
  }
  if (outline?.enabled && outline.width > 0) {
    layers.push(`<g fill="#000" stroke="#000" filter="url(#sf-outline)">${monoShapes}</g>`);
  }
  return layers;
};

// Una celda del rig (efectos + huesos), con giro opcional en el plano.
const customCellGroup = (
  bones: readonly RBone[],
  tf: PxTransform,
  offsetX: number,
  cellSize: number,
  effects: EffectsConfig | undefined,
  facing: number,
): string => {
  const pcx = offsetX + cellSize / 2;
  const mono = customShapesMarkup(bones, tf, offsetX, '#000');
  const layers = customEffectLayers(mono, effects, pcx, tf.groundY, tf.scale);
  layers.push(`<g>${customShapesMarkup(bones, tf, offsetX)}</g>`);
  // Giro 3D en el eje vertical (como el humanoide): escorza el ancho por cos(facing).
  // A 90°/270° queda de canto; pasado 90° el signo negativo espeja (vista de espaldas).
  const f = ((facing % 360) + 360) % 360;
  const sx = Math.cos(rad(facing));
  const tform =
    f !== 0 ? ` transform="translate(${fmt(pcx)} 0) scale(${fmt(sx)} 1) translate(${fmt(-pcx)} 0)"` : '';
  return `<g${tform}>${layers.join('')}</g>`;
};

export const renderCustomInner = (
  rig: CustomRig,
  render: RenderConfig,
  pose?: RigPose,
  effects?: EffectsConfig,
): string => {
  const tf = makeTransform(render);
  const bones = buildCustomSkeleton(rig, pose);
  const defs = effectDefs(effects, tf.scale);
  return `${defs}${customCellGroup(bones, tf, 0, render.cellSize, effects, render.facing)}`;
};

export const renderCustomSvg = (
  rig: CustomRig,
  render: RenderConfig,
  pose?: RigPose,
  effects?: EffectsConfig,
): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${render.cellSize}" height="${render.cellSize}" viewBox="0 0 ${render.cellSize} ${render.cellSize}">${renderCustomInner(rig, render, pose, effects)}</svg>`;

// Sprite sheet horizontal del rig animado: una celda por pose.
export const renderCustomSheet = (
  rig: CustomRig,
  poses: readonly RigPose[],
  render: RenderConfig,
  effects?: EffectsConfig,
): string => {
  const tf = makeTransform(render);
  const cs = render.cellSize;
  const width = cs * Math.max(1, poses.length);
  const defs = effectDefs(effects, tf.scale);
  const groups = poses
    .map((pose, i) => customCellGroup(buildCustomSkeleton(rig, pose), tf, i * cs, cs, effects, render.facing))
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${cs}" viewBox="0 0 ${width} ${cs}">${defs}${groups}</svg>`;
};
