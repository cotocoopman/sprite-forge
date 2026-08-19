// Plantillas built-in (humanoides). Puntos de partida listos, distintos de los
// presets guardados por el usuario. Cada una es una variación de DEFAULT_CHARACTER.
import { DEFAULT_CHARACTER } from './rig';
import type { CharacterDefinition } from './rig';

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
