// Props / armas como mini-rigs: cada prop es un conjunto de formas (accesorios)
// compuestas y ancladas a un mismo punto (por defecto la mano). Reusan el sistema
// de accesorios, así que siguen la animación automáticamente.
import type { Accessory } from './poses';

// Una parte del prop: un accesorio sin id ni anchor (se asignan al insertarlo).
export type PropPart = Omit<Accessory, 'id' | 'anchor'>;

export type PropTemplate = {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  readonly parts: readonly PropPart[];
};

const part = (name: string, p: Omit<PropPart, 'name' | 'opacity' | 'front'> & { opacity?: number; front?: boolean }): PropPart => ({
  name,
  opacity: p.opacity ?? 1,
  front: p.front ?? true,
  shape: p.shape,
  offsetAlong: p.offsetAlong,
  offsetPerp: p.offsetPerp,
  angle: p.angle,
  length: p.length,
  width: p.width,
  color: p.color,
});

const STEEL = '#c7ccd6';
const WOOD = '#6d4c41';
const DARK = '#2b2f36';
const GOLD = '#c9a227';

export const PROP_TEMPLATES: readonly PropTemplate[] = [
  {
    id: 'sword',
    name: 'Sword',
    emoji: '🗡️',
    parts: [
      part('Grip', { shape: 'capsule', offsetAlong: -5, offsetPerp: 0, angle: 0, length: 6, width: 3, color: WOOD }),
      part('Guard', { shape: 'capsule', offsetAlong: 2, offsetPerp: -4, angle: 90, length: 8, width: 2, color: GOLD }),
      part('Blade', { shape: 'capsule', offsetAlong: 4, offsetPerp: 0, angle: 0, length: 30, width: 3.5, color: STEEL }),
    ],
  },
  {
    id: 'axe',
    name: 'Axe',
    emoji: '🪓',
    parts: [
      part('Handle', { shape: 'capsule', offsetAlong: -8, offsetPerp: 0, angle: 0, length: 26, width: 3, color: WOOD }),
      part('Head', { shape: 'rect', offsetAlong: 6, offsetPerp: -7, angle: 0, length: 11, width: 13, color: STEEL }),
    ],
  },
  {
    id: 'staff',
    name: 'Staff',
    emoji: '🪄',
    parts: [
      part('Shaft', { shape: 'capsule', offsetAlong: -12, offsetPerp: 0, angle: 0, length: 44, width: 3, color: WOOD }),
      part('Orb', { shape: 'circle', offsetAlong: 34, offsetPerp: 0, angle: 0, length: 0, width: 11, color: '#7c9cff' }),
    ],
  },
  {
    id: 'pistol',
    name: 'Pistol',
    emoji: '🔫',
    parts: [
      part('Barrel', { shape: 'capsule', offsetAlong: 0, offsetPerp: 0, angle: 0, length: 13, width: 3.5, color: DARK }),
      part('Grip', { shape: 'capsule', offsetAlong: 0, offsetPerp: 0, angle: 70, length: 8, width: 3.5, color: '#4a4a4a' }),
    ],
  },
  {
    id: 'shield',
    name: 'Shield',
    emoji: '🛡️',
    parts: [
      part('Plate', { shape: 'rect', offsetAlong: -10, offsetPerp: -9, angle: 0, length: 22, width: 18, color: '#7c5a2a' }),
      part('Boss', { shape: 'circle', offsetAlong: 1, offsetPerp: 0, angle: 0, length: 0, width: 6, color: GOLD }),
    ],
  },
  {
    id: 'bow',
    name: 'Bow',
    emoji: '🏹',
    parts: [
      part('Limb', { shape: 'capsule', offsetAlong: 0, offsetPerp: -15, angle: 90, length: 30, width: 3, color: WOOD }),
      part('Arrow', { shape: 'capsule', offsetAlong: -2, offsetPerp: 0, angle: 0, length: 22, width: 1.5, color: DARK }),
    ],
  },
];
