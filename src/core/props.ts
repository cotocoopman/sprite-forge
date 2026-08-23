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
  // Rotación extra (grados) que se aplica SOLO al empuñar el arma (al insertarla
  // como accesorio), para reorientarla a la mano sin afectar la versión suelta
  // (rig custom), que usa las piezas tal cual. Default 0.
  readonly handSpin?: number;
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
// hacia afuera en vez de colgar). Exportado como `rotatePropParts` para
// reorientar un arma al empuñarla (ver `handSpin`).
export const rotatePropParts = (parts: readonly PropPart[], deg: number): PropPart[] =>
  rotProp(parts, deg);

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
    handSpin: 90,
    // Vista lateral, cañón a la derecha (marco del render "suelto").
    parts: [
      part('Slide', { shape: 'rect', offsetAlong: 3, offsetPerp: 11, angle: -90, length: 30, width: 9, color: '#34393f' }),
      part('Muzzle', { shape: 'rect', offsetAlong: 3, offsetPerp: -19, angle: -90, length: 6, width: 6.5, color: '#5a5f66' }),
      part('Grip', { shape: 'rect', offsetAlong: 1, offsetPerp: 8, angle: 160, length: 18, width: 8.5, color: '#3f3f3f' }),
      part('Guard', { shape: 'rect', offsetAlong: -3, offsetPerp: -1, angle: 180, length: 7, width: 3.5, color: '#34393f' }),
    ],
  },
  {
    id: 'shield',
    name: 'Shield',
    emoji: '🛡️',
    // Escudo tipo "heater": cuerpo cuadrado + punta triangular abajo + umbo.
    parts: [
      part('Body', { shape: 'rect', offsetAlong: -4, offsetPerp: 12, angle: 0, length: 22, width: 24, color: '#8d6e3a' }),
      part('Point', { shape: 'triangle', offsetAlong: -4, offsetPerp: 0, angle: 180, length: 16, width: 24, color: '#8d6e3a' }),
      part('Trim', { shape: 'rect', offsetAlong: 16, offsetPerp: 12, angle: 0, length: 3, width: 24, color: '#b5893f' }),
      part('Boss', { shape: 'circle', offsetAlong: 2, offsetPerp: 0, angle: 0, length: 0, width: 9, color: GOLD }),
    ],
  },
  {
    id: 'bow',
    name: 'Bow',
    emoji: '🏹',
    // Arco curvo (arco aproximado con 4 tramos) + cuerda + flecha, apunta a la derecha.
    parts: [
      part('Limb T1', { shape: 'capsule', offsetAlong: 20, offsetPerp: 0, angle: 129, length: 14, width: 3.5, color: WOOD }),
      part('Limb T2', { shape: 'capsule', offsetAlong: 11, offsetPerp: 11, angle: 160, length: 12, width: 3.5, color: WOOD }),
      part('Limb B2', { shape: 'capsule', offsetAlong: 0, offsetPerp: 15, angle: -160, length: 12, width: 3.5, color: WOOD }),
      part('Limb B1', { shape: 'capsule', offsetAlong: -11, offsetPerp: 11, angle: -129, length: 14, width: 3.5, color: WOOD }),
      part('String', { shape: 'capsule', offsetAlong: 20, offsetPerp: 0, angle: 180, length: 40, width: 1, color: '#d9c9a3' }),
      part('Fletch', { shape: 'triangle', offsetAlong: 0, offsetPerp: 6, angle: 90, length: 5, width: 6, color: '#c0392b' }),
      part('Arrow', { shape: 'capsule', offsetAlong: 0, offsetPerp: 6, angle: -90, length: 32, width: 2.8, color: '#8d6e57' }),
      part('Head', { shape: 'triangle', offsetAlong: 0, offsetPerp: -24, angle: -90, length: 9, width: 7, color: STEEL }),
    ],
  },
  {
    id: 'pistols',
    name: 'Dual pistols',
    emoji: '🔫',
    handSpin: 90,
    // Una pistola en cada mano (anchor por pieza, ignora el hueso elegido).
    parts: [
      part('Slide R', { anchor: 'handNear', shape: 'rect', offsetAlong: 3, offsetPerp: 11, angle: -90, length: 30, width: 9, color: '#34393f' }),
      part('Muzzle R', { anchor: 'handNear', shape: 'rect', offsetAlong: 3, offsetPerp: -19, angle: -90, length: 6, width: 6.5, color: '#5a5f66' }),
      part('Grip R', { anchor: 'handNear', shape: 'rect', offsetAlong: 1, offsetPerp: 8, angle: 160, length: 18, width: 8.5, color: '#3f3f3f' }),
      part('Slide L', { anchor: 'handFar', shape: 'rect', offsetAlong: 3, offsetPerp: 11, angle: -90, length: 30, width: 9, color: '#34393f' }),
      part('Muzzle L', { anchor: 'handFar', shape: 'rect', offsetAlong: 3, offsetPerp: -19, angle: -90, length: 6, width: 6.5, color: '#5a5f66' }),
      part('Grip L', { anchor: 'handFar', shape: 'rect', offsetAlong: 1, offsetPerp: 8, angle: 160, length: 18, width: 8.5, color: '#3f3f3f' }),
    ],
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
    // Lanzacohetes horizontal: tubo largo, boca acampanada al frente, culata,
    // mira arriba, empuñadura abajo y ojiva roja asomando.
    parts: [
      part('Tube', { shape: 'rect', offsetAlong: 0, offsetPerp: 22, angle: -90, length: 44, width: 14, color: '#3d7a1e' }),
      part('Muzzle', { shape: 'triangle', offsetAlong: 0, offsetPerp: -22, angle: 90, length: 9, width: 20, color: '#1b3d0e' }),
      part('Warhead', { shape: 'triangle', offsetAlong: 0, offsetPerp: -22, angle: -90, length: 12, width: 9, color: '#c62828' }),
      part('Breech', { shape: 'triangle', offsetAlong: 0, offsetPerp: 22, angle: 90, length: 8, width: 16, color: '#1b3d0e' }),
      part('Scope', { shape: 'rect', offsetAlong: 9, offsetPerp: 2, angle: -90, length: 12, width: 3, color: DARK }),
      part('Sight', { shape: 'rect', offsetAlong: 12, offsetPerp: -2, angle: 0, length: 4, width: 3, color: DARK }),
      part('Grip', { shape: 'rect', offsetAlong: -7, offsetPerp: 6, angle: 180, length: 9, width: 4, color: '#263238' }),
    ],
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
