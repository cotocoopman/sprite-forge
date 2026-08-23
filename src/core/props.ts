// Props / armas como mini-rigs: cada prop es un conjunto de formas (accesorios)
// compuestas y ancladas a un mismo punto (por defecto la mano). Reusan el sistema
// de accesorios, así que siguen la animación automáticamente.
import type { Accessory } from './poses';
import type { AnchorName } from './rig';

// Una parte del prop: un accesorio sin id. `anchor` es opcional: si está, fuerza
// ese hueso (ej. una pistola en cada mano); si no, usa el elegido al insertarlo.
export type PropPart = Omit<Accessory, 'id' | 'anchor'> & { readonly anchor?: AnchorName };

export type PropTemplate = {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  readonly parts: readonly PropPart[];
};

const part = (
  name: string,
  p: Omit<PropPart, 'name' | 'opacity' | 'front'> & { opacity?: number; front?: boolean },
): PropPart => ({
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
  ...(p.anchor ? { anchor: p.anchor } : {}),
});

// Rota un prop entero alrededor del ancla (para que las armas de fuego apunten
// hacia afuera en vez de colgar).
const rotProp = (parts: readonly PropPart[], deg: number): PropPart[] => {
  if (deg === 0) return [...parts];
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return parts.map((p) => ({
    ...p,
    offsetAlong: p.offsetAlong * c - p.offsetPerp * s,
    offsetPerp: p.offsetAlong * s + p.offsetPerp * c,
    angle: p.angle + deg,
  }));
};

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
    parts: rotProp([
      part('Slide', { shape: 'rect', offsetAlong: -2, offsetPerp: -2, angle: 0, length: 16, width: 5, color: DARK }),
      part('Grip', { shape: 'capsule', offsetAlong: -3, offsetPerp: 2, angle: 90, length: 10, width: 4.5, color: '#4a4a4a' }),
      part('Muzzle', { shape: 'capsule', offsetAlong: 12, offsetPerp: -2, angle: 0, length: 4, width: 3, color: '#5a5f66' }),
    ], 120),
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
  {
    id: 'pistols',
    name: 'Dual pistols',
    emoji: '🔫',
    // Una pistola en cada mano (anchor por pieza, ignora el hueso elegido).
    parts: rotProp([
      part('Slide R', { anchor: 'handNear', shape: 'rect', offsetAlong: -2, offsetPerp: -2, angle: 0, length: 16, width: 5, color: DARK }),
      part('Grip R', { anchor: 'handNear', shape: 'capsule', offsetAlong: -3, offsetPerp: 2, angle: 90, length: 10, width: 4.5, color: '#4a4a4a' }),
      part('Slide L', { anchor: 'handFar', shape: 'rect', offsetAlong: -2, offsetPerp: -2, angle: 0, length: 16, width: 5, color: DARK }),
      part('Grip L', { anchor: 'handFar', shape: 'capsule', offsetAlong: -3, offsetPerp: 2, angle: 90, length: 10, width: 4.5, color: '#4a4a4a' }),
    ], 120),
  },
  {
    id: 'rifle',
    name: 'Rifle',
    emoji: '🔫',
    // Rifle de asalto estándar (sirve como base para cualquier arma larga).
    parts: rotProp([
      part('Receiver', { shape: 'capsule', offsetAlong: -2, offsetPerp: 0, angle: 0, length: 22, width: 5, color: DARK }),
      part('Barrel', { shape: 'capsule', offsetAlong: 18, offsetPerp: 0, angle: 0, length: 16, width: 2.5, color: '#3a3f46' }),
      part('Stock', { shape: 'capsule', offsetAlong: -16, offsetPerp: 0, angle: 0, length: 10, width: 5, color: '#3a2f28' }),
      part('Magazine', { shape: 'capsule', offsetAlong: 2, offsetPerp: 0, angle: 100, length: 9, width: 4, color: '#4a4a4a' }),
      part('Grip', { shape: 'capsule', offsetAlong: -3, offsetPerp: 0, angle: 80, length: 6, width: 3.5, color: '#4a4a4a' }),
      part('Sight', { shape: 'capsule', offsetAlong: 6, offsetPerp: -4, angle: 90, length: 4, width: 2, color: DARK }),
    ], 120),
  },
  {
    id: 'bomb',
    name: 'Bomb',
    emoji: '💣',
    // Bomba arrojable (esfera + mecha con chispa).
    parts: [
      part('Body', { shape: 'circle', offsetAlong: 0, offsetPerp: 0, angle: 0, length: 0, width: 18, color: '#212121' }),
      part('Fuse', { shape: 'capsule', offsetAlong: 8, offsetPerp: 0, angle: -25, length: 8, width: 2, color: '#8d6e63' }),
      part('Spark', { shape: 'circle', offsetAlong: 15, offsetPerp: 3, angle: 0, length: 0, width: 5, color: '#ffa726' }),
    ],
  },
  {
    id: 'bazooka',
    name: 'Bazooka',
    emoji: '🚀',
    // Lanzacohetes: tubo largo y recto, boca al frente y culata atrás.
    parts: rotProp([
      part('Tube', { shape: 'rect', offsetAlong: -18, offsetPerp: -6, angle: 0, length: 38, width: 12, color: '#33691e' }),
      part('Muzzle', { shape: 'circle', offsetAlong: 22, offsetPerp: 0, angle: 0, length: 0, width: 15, color: '#1b3d0e' }),
      part('Breech', { shape: 'circle', offsetAlong: -18, offsetPerp: 0, angle: 0, length: 0, width: 13, color: '#1b3d0e' }),
      part('Sight', { shape: 'capsule', offsetAlong: 4, offsetPerp: -9, angle: 90, length: 7, width: 2, color: DARK }),
      part('Grip', { shape: 'capsule', offsetAlong: -8, offsetPerp: 4, angle: 90, length: 8, width: 3.5, color: '#263238' }),
    ], 120),
  },
  {
    id: 'laser',
    name: 'Laser',
    emoji: '⚡',
    // Bala simple tipo láser: cápsula exterior + núcleo brillante, apunta al frente.
    parts: rotProp([
      part('Bolt', { shape: 'capsule', offsetAlong: 0, offsetPerp: 0, angle: 0, length: 18, width: 3, color: '#ff3b3b' }),
      part('Core', { shape: 'capsule', offsetAlong: 2, offsetPerp: 0, angle: 0, length: 13, width: 1.2, color: '#fff3b0' }),
    ], 120),
  },
  {
    id: 'projectile',
    name: 'Projectile',
    emoji: '🔺',
    // Proyectil genérico: triángulo alargado hacia la punta (dirección de vuelo).
    parts: rotProp([
      part('Body', { shape: 'triangle', offsetAlong: -7, offsetPerp: 0, angle: 0, length: 18, width: 9, color: '#ffca28' }),
      part('Tail', { shape: 'triangle', offsetAlong: -7, offsetPerp: 0, angle: 180, length: 5, width: 9, color: '#ff8f00' }),
    ], 120),
  },
  {
    id: 'flag',
    name: 'Flag',
    emoji: '🚩',
    // Asta + tela que ondea al costado.
    parts: rotProp([
      part('Pole', { shape: 'capsule', offsetAlong: 0, offsetPerp: 0, angle: 0, length: 34, width: 2.5, color: '#6d4c41' }),
      part('Cloth', { shape: 'rect', offsetAlong: 30, offsetPerp: 0, angle: 90, length: 20, width: 13, color: '#e53935' }),
      part('Wave', { shape: 'rect', offsetAlong: 24, offsetPerp: 0, angle: 90, length: 20, width: 4, color: '#c62828' }),
    ], 175),
  },
];
