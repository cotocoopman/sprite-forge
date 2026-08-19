// Plantillas built-in (humanoides). Puntos de partida listos, distintos de los
// presets guardados por el usuario. Cada una es una variación de DEFAULT_CHARACTER.
import { DEFAULT_CHARACTER } from './rig';
import type { CharacterDefinition, CurveTarget } from './rig';

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

export type CharacterTemplate = {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  readonly build: () => CharacterDefinition;
};

const make = (name: string, overrides: Partial<CharacterDefinition>): CharacterDefinition => ({
  ...DEFAULT_CHARACTER,
  ...overrides,
  name,
});

export const CHARACTER_TEMPLATES: readonly CharacterTemplate[] = [
  {
    id: 'hero',
    name: 'Hero',
    emoji: '🦸',
    build: () => make('Hero', { color: '#2c3e6b' }),
  },
  {
    id: 'chibi',
    name: 'Chibi',
    emoji: '🍼',
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
    emoji: '🛡️',
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
  },
  {
    id: 'dwarf',
    name: 'Dwarf',
    emoji: '⛏️',
    build: () =>
      make('Dwarf', {
        headDiameter: 40,
        torsoHeight: 24,
        legHeight: 28,
        torsoWidth: 28,
        armWidth: 6,
        legWidth: 7,
        color: '#6d4c41',
      }),
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
    id: 'zombie',
    name: 'Zombie',
    emoji: '🧟',
    build: () =>
      make('Zombie', {
        headDiameter: 34,
        torsoWidth: 18,
        armUpperLength: 12,
        armLowerLength: 11,
        armCurveUpper: 0.15,
        color: '#4b6b3a',
      }),
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
  },
];
