// Plantillas built-in (humanoides). Puntos de partida listos, distintos de los
// presets guardados por el usuario. Cada una es una variación de DEFAULT_CHARACTER.
import { DEFAULT_CHARACTER } from './rig';
import type { AnchorName, CharacterDefinition, CurveTarget, PartName } from './rig';
import type { Accessory } from './poses';
import { PROP_TEMPLATES } from './props';

// --- Personaje aleatorio -------------------------------------------------
// Rangos sanos por campo. La altura total se mantiene ~100 normalizando
// cabeza + torso + piernas.
type Range = readonly [number, number];

const RANGES: Partial<Record<keyof CharacterDefinition, Range>> = {
  headDiameter: [26, 50],
  torsoHeight: [18, 28],
  legHeight: [30, 46],
  torsoWidth: [13, 30],
  neckLength: [0, 6],
  shoulderDistance: [14, 26],
  armSpacing: [0, 5],
  armWidth: [3, 6.5],
  armUpperLength: [7, 12],
  armLowerLength: [6, 11],
  hipOffset: [3, 7],
  legWidth: [4, 7.5],
  legUpperRatio: [0.42, 0.56],
  footLength: [7, 11],
  footWidth: [2.6, 4.5],
};

const PALETTE: readonly string[] = [
  '#000000', '#2c3e6b', '#c0392b', '#5d4037', '#4527a0', '#212121',
  '#00838f', '#4b6b3a', '#546e7a', '#8e24aa', '#00695c', '#bf360c',
];

const lerp = (r: Range, k: number): number => r[0] + (r[1] - r[0]) * k;
const round2 = (n: number): number => Math.round(n * 100) / 100;

// Genera un personaje aleatorio. `rand` inyectable para tests deterministas.
export const randomCharacter = (rand: () => number = Math.random): CharacterDefinition => {
  const pick = <T,>(arr: readonly T[]): T => arr[Math.min(arr.length - 1, Math.floor(rand() * arr.length))];
  const num = (key: keyof CharacterDefinition): number => {
    const r = RANGES[key];
    return r ? round2(lerp(r, rand())) : (DEFAULT_CHARACTER[key] as number);
  };
  // Normaliza cabeza+torso+piernas a 100 para conservar proporción de altura.
  let head = num('headDiameter');
  let torso = num('torsoHeight');
  let legs = num('legHeight');
  const sum = head + torso + legs;
  const f = 100 / sum;
  head = round2(head * f);
  torso = round2(torso * f);
  legs = round2(legs * f);
  const curve = (): CurveTarget => pick(['both', 'near', 'far'] as const);
  return {
    ...DEFAULT_CHARACTER,
    id: DEFAULT_CHARACTER.id,
    name: 'Random',
    headDiameter: head,
    torsoHeight: torso,
    legHeight: legs,
    torsoWidth: num('torsoWidth'),
    neckLength: num('neckLength'),
    shoulderDistance: num('shoulderDistance'),
    armSpacing: num('armSpacing'),
    armWidth: num('armWidth'),
    armUpperLength: num('armUpperLength'),
    armLowerLength: num('armLowerLength'),
    armCurveUpper: round2(rand() * 0.3),
    armCurveLower: round2(rand() * 0.3),
    armCurveTarget: curve(),
    hipOffset: num('hipOffset'),
    legWidth: num('legWidth'),
    legUpperRatio: num('legUpperRatio'),
    legCurveUpper: round2(rand() * 0.2),
    legCurveLower: round2(rand() * 0.2),
    legCurveTarget: curve(),
    footLength: num('footLength'),
    footWidth: num('footWidth'),
    color: pick(PALETTE),
  };
};

// Accesorio de plantilla: un accesorio sin id (se genera al aplicar).
export type TemplateAccessory = Omit<Accessory, 'id'>;

export type CharacterTemplate = {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  readonly build: () => CharacterDefinition;
  // Props/armas/gorros que trae la plantilla (siguen la animación).
  readonly accessories?: readonly TemplateAccessory[];
  // Partes apagadas (ej. slime sin brazos ni piernas).
  readonly hiddenParts?: readonly PartName[];
};

const make = (name: string, overrides: Partial<CharacterDefinition>): CharacterDefinition => ({
  ...DEFAULT_CHARACTER,
  ...overrides,
  name,
});

// Rota una pieza (offset + ángulo) alrededor del ancla, para levantar/inclinar
// el arma completa sin deformarla.
const rotatePart = (p: TemplateAccessory, deg: number): TemplateAccessory => {
  if (deg === 0) return p;
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return {
    ...p,
    offsetAlong: p.offsetAlong * c - p.offsetPerp * s,
    offsetPerp: p.offsetAlong * s + p.offsetPerp * c,
    angle: p.angle + deg,
  };
};

// Toma las piezas de un prop (props.ts), las ancla a una mano y opcionalmente
// rota el arma entera `rot` grados (para levantarla / ponerla en diagonal).
const weapon = (propId: string, anchor: AnchorName, rot = 0): TemplateAccessory[] => {
  const tpl = PROP_TEMPLATES.find((p) => p.id === propId);
  if (!tpl) return [];
  return tpl.parts.map((part) => rotatePart({ ...part, anchor }, rot));
};

const acc = (a: Partial<TemplateAccessory> & Pick<TemplateAccessory, 'name' | 'anchor' | 'shape'>): TemplateAccessory => ({
  offsetAlong: 0,
  offsetPerp: 0,
  angle: 0,
  length: 10,
  width: 4,
  color: '#000000',
  opacity: 1,
  front: true,
  ...a,
});

// Gorro de mago: ala ancha y plana + cono alto y angosto (triángulo), anclado a
// la cabeza (el anchor apunta hacia arriba).
const wizardHat = (color: string): TemplateAccessory[] => [
  acc({ name: 'Hat brim', anchor: 'head', shape: 'rect', offsetAlong: 8, offsetPerp: -13, angle: 90, length: 26, width: 4, color }),
  acc({ name: 'Hat cone', anchor: 'head', shape: 'capsule', offsetAlong: 10, offsetPerp: 0, angle: 0, length: 24, width: 8, color }),
];

export const CHARACTER_TEMPLATES: readonly CharacterTemplate[] = [
  {
    id: 'default',
    name: 'Simple',
    emoji: '🧍',
    // Vuelve al personaje base (sin accesorios, todas las partes visibles).
    build: () => make('Silhouette', {}),
  },
  {
    id: 'hero',
    name: 'Hero',
    emoji: '🦸',
    build: () => make('Hero', { color: '#2c3e6b' }),
    accessories: [...weapon('sword', 'handNear', 150)],
  },
  {
    id: 'chibi',
    name: 'Chibi',
    emoji: '🧸',
    build: () =>
      make('Chibi', {
        headDiameter: 52,
        torsoHeight: 18,
        legHeight: 30,
        torsoWidth: 20,
        armUpperLength: 7,
        armLowerLength: 6,
        legUpperRatio: 0.5,
        footLength: 8,
        color: '#c0392b',
      }),
  },
  {
    id: 'warrior',
    name: 'Warrior',
    emoji: '⚔️',
    build: () =>
      make('Warrior', {
        headDiameter: 32,
        torsoHeight: 26,
        torsoWidth: 30,
        shoulderDistance: 26,
        armWidth: 6.5,
        armUpperLength: 11,
        armLowerLength: 10,
        legWidth: 7,
        color: '#5d4037',
      }),
    // Espada en la derecha (levantada), escudo en la izquierda.
    accessories: [...weapon('sword', 'handNear', 150), ...weapon('shield', 'handFar')],
  },
  {
    id: 'mage',
    name: 'Mage',
    emoji: '🧙',
    build: () =>
      make('Mage', {
        headDiameter: 33,
        torsoHeight: 30,
        torsoWidth: 26,
        legHeight: 38,
        armWidth: 5,
        color: '#4527a0',
      }),
    // Bastón levantado + gorro puntiagudo.
    accessories: [...weapon('staff', 'handNear', 150), ...wizardHat('#311b6b')],
  },
  {
    id: 'ninja',
    name: 'Ninja',
    emoji: '🥷',
    build: () =>
      make('Ninja', {
        headDiameter: 30,
        torsoWidth: 15,
        armWidth: 3.4,
        legWidth: 4.2,
        armUpperLength: 11,
        armLowerLength: 10,
        color: '#212121',
      }),
    // Katana cruzada en la espalda (detrás) + una daga en cada mano hacia atrás.
    accessories: [
      acc({ name: 'Back sword', anchor: 'torsoTop', shape: 'capsule', offsetAlong: -6, offsetPerp: -3, angle: 42, length: 40, width: 3, color: '#9aa4b0', front: false }),
      acc({ name: 'Back hilt', anchor: 'torsoTop', shape: 'capsule', offsetAlong: 26, offsetPerp: 12, angle: 42, length: 8, width: 4, color: '#1a1a1a', front: false }),
      acc({ name: 'Dagger R', anchor: 'handNear', shape: 'capsule', offsetAlong: 3, offsetPerp: 0, angle: 35, length: 13, width: 2.6, color: '#c8ced6' }),
      acc({ name: 'Dagger R grip', anchor: 'handNear', shape: 'capsule', offsetAlong: -3, offsetPerp: 0, angle: 35, length: 5, width: 3, color: '#111111' }),
      acc({ name: 'Dagger L', anchor: 'handFar', shape: 'capsule', offsetAlong: 3, offsetPerp: 0, angle: -35, length: 13, width: 2.6, color: '#c8ced6' }),
      acc({ name: 'Dagger L grip', anchor: 'handFar', shape: 'capsule', offsetAlong: -3, offsetPerp: 0, angle: -35, length: 5, width: 3, color: '#111111' }),
    ],
  },
  {
    id: 'dwarf',
    name: 'Dwarf',
    emoji: '🪓',
    build: () =>
      make('Dwarf', {
        headDiameter: 40,
        torsoHeight: 24,
        legHeight: 28,
        torsoWidth: 28,
        armWidth: 6,
        legWidth: 7,
        color: '#6d7b8d', // gris pizarra: el mango de madera del hacha contrasta
      }),
    accessories: [...weapon('axe', 'handNear', 150)],
  },
  {
    id: 'child',
    name: 'Child',
    emoji: '🧒',
    build: () =>
      make('Child', {
        headDiameter: 44,
        torsoHeight: 18,
        legHeight: 34,
        torsoWidth: 16,
        armWidth: 3.6,
        legWidth: 4.4,
        color: '#00838f',
      }),
  },
  {
    id: 'slime',
    name: 'Slime',
    emoji: '🫠',
    build: () =>
      make('Slime', {
        headDiameter: 26,
        torsoHeight: 46,
        legHeight: 28,
        torsoWidth: 46,
        neckLength: -12,
        color: '#3fa34d',
      }),
    // Sin brazos ni piernas: un blob. Dos ojos sobre el cuerpo.
    hiddenParts: ['armNear', 'armFar', 'legNear', 'legFar'],
    accessories: [
      acc({ name: 'Eye L', anchor: 'torsoTop', shape: 'circle', offsetAlong: -14, offsetPerp: -7, width: 7, color: '#ffffff' }),
      acc({ name: 'Eye R', anchor: 'torsoTop', shape: 'circle', offsetAlong: -14, offsetPerp: 7, width: 7, color: '#ffffff' }),
    ],
  },
  {
    id: 'zombie',
    name: 'Zombie',
    emoji: '🧟',
    build: () =>
      make('Zombie', {
        headDiameter: 34,
        torsoWidth: 18,
        armUpperLength: 13,
        armLowerLength: 12,
        armCurveUpper: 0.2,
        armCurveLower: 0.25,
        legCurveUpper: 0.12,
        color: '#4b6b3a',
      }),
    // Un brazo caído (apagado) → silueta desbalanceada, más "monstruo".
    hiddenParts: ['armFar'],
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    emoji: '💀',
    build: () =>
      make('Skeleton', {
        headDiameter: 36,
        torsoWidth: 13,
        armWidth: 2.6,
        legWidth: 3,
        footWidth: 2.6,
        color: '#eceff1',
      }),
  },
  {
    id: 'robot',
    name: 'Robot',
    emoji: '🤖',
    build: () =>
      make('Robot', {
        headDiameter: 34,
        torsoHeight: 26,
        torsoWidth: 26,
        armWidth: 6,
        legWidth: 7,
        armUpperLength: 10,
        armLowerLength: 10,
        legUpperRatio: 0.5,
        footLength: 10,
        color: '#546e7a',
      }),
    // Antena con luz.
    accessories: [
      acc({ name: 'Antenna', anchor: 'head', shape: 'capsule', offsetAlong: 12, angle: 0, length: 9, width: 1.6, color: '#37474f' }),
      acc({ name: 'Antenna tip', anchor: 'head', shape: 'circle', offsetAlong: 22, width: 5, color: '#ff5252' }),
    ],
  },
];
