// Núcleo puro del rig: tipos, constantes y cinemática directa.
// Sin React, sin MUI, sin DOM. Testeable y reutilizable.

export type Vec2 = { readonly x: number; readonly y: number };

// A qué lado(s) aplica la curvatura de un par de miembros.
export type CurveTarget = 'both' | 'near' | 'far';

// Partes del cuerpo (para visibilidad y color por parte).
export type PartName = 'head' | 'torso' | 'armNear' | 'armFar' | 'legNear' | 'legFar';

export const PART_NAMES: readonly PartName[] = [
  'head',
  'torso',
  'armNear',
  'armFar',
  'legNear',
  'legFar',
];

export const PART_LABELS: Record<PartName, string> = {
  head: 'Cabeza',
  torso: 'Torso',
  armNear: 'Brazo derecho',
  armFar: 'Brazo izquierdo',
  legNear: 'Pierna derecha',
  legFar: 'Pierna izquierda',
};

export type Capsule = {
  readonly from: Vec2;
  readonly to: Vec2;
  readonly width: number;
  readonly ctrl?: Vec2;  // punto de control opcional → hueso curvo (Bézier cuadrática)
  readonly depth?: number; // profundidad frente↔atrás (near +, far −) para el giro 3D
  readonly part?: PartName; // a qué parte del cuerpo pertenece (torso por defecto)
};

// Puntos de anclaje para accesorios (posición + dirección del hueso).
export type Anchor = { readonly pos: Vec2; readonly angle: number };

export type AnchorName =
  | 'head'
  | 'torsoTop'
  | 'hip'
  | 'shoulderNear'
  | 'shoulderFar'
  | 'handNear'
  | 'handFar'
  | 'footNear'
  | 'footFar';

export const ANCHOR_NAMES: readonly AnchorName[] = [
  'head',
  'torsoTop',
  'hip',
  'shoulderNear',
  'shoulderFar',
  'handNear',
  'handFar',
  'footNear',
  'footFar',
];

export const ANCHOR_LABELS: Record<AnchorName, string> = {
  head: 'Cabeza',
  torsoTop: 'Cuello / torso',
  hip: 'Cadera',
  shoulderNear: 'Hombro derecho',
  shoulderFar: 'Hombro izquierdo',
  handNear: 'Mano derecha',
  handFar: 'Mano izquierda',
  footNear: 'Pie derecho',
  footFar: 'Pie izquierdo',
};

export type Skeleton = {
  readonly headCenter: Vec2;
  readonly headRadius: number;
  readonly capsules: readonly Capsule[];
  readonly anchors: Record<AnchorName, Anchor>;
};

// Escala de largo por parte (multiplicador ≥0, 1 = sin cambio). Se hornea en la
// cinemática para que la cadena siga conectada (una parte más larga empuja a sus
// hijas y las anclas de accesorios la siguen). El grosor NO va acá: no mueve
// articulaciones, así que se aplica en render (ver skeletonToPrimitives).
export type PartScales = Partial<Record<PartName, { readonly lengthScale?: number }>>;

export type CharacterDefinition = {
  readonly id: string;
  readonly name: string;
  // Todas las medidas en unidades, con altura total del personaje = 100.
  readonly headDiameter: number;
  readonly torsoHeight: number;
  readonly legHeight: number;
  readonly torsoWidth: number;        // ancho del torso (absoluto, independiente de la cabeza)
  readonly neckLength: number;        // separación cabeza ↔ cuerpo (0 = pegada)
  readonly shoulderDistance: number;
  readonly armSpacing: number;        // separación lateral de los brazos (0 = pegados)
  readonly armWidth: number;
  readonly armUpperLength: number;
  readonly armLowerLength: number;
  readonly armCurveUpper: number;     // curvatura del brazo superior (0 = recto)
  readonly armCurveLower: number;     // curvatura del antebrazo
  readonly armCurveTarget: CurveTarget;
  readonly hipOffset: number;
  readonly legWidth: number;
  readonly legUpperRatio: number;
  readonly legCurveUpper: number;     // curvatura del muslo
  readonly legCurveLower: number;     // curvatura de la pantorrilla
  readonly legCurveTarget: CurveTarget;
  readonly footLength: number;
  readonly footWidth: number;
  readonly color: string;             // color base del personaje
};

export type Pose = {
  readonly rootOffsetY: number;
  readonly rootRotation: number;
  readonly torsoLean: number;
  readonly headTilt: number;
  readonly armFarUpper: number;
  readonly armFarLower: number;
  readonly armNearUpper: number;
  readonly armNearLower: number;
  readonly legFarUpper: number;
  readonly legFarLower: number;
  readonly legNearUpper: number;
  readonly legNearLower: number;
};

// Personaje por defecto — cabeza + torso + piernas = 35 + 22 + 43 = 100.
export const DEFAULT_CHARACTER: CharacterDefinition = {
  id: 'default',
  name: 'Silhouette',
  headDiameter: 35,
  torsoHeight: 22,
  legHeight: 43,
  torsoWidth: 19.25,
  neckLength: 0,
  shoulderDistance: 19,
  armSpacing: 0,
  armWidth: 4.2,
  armUpperLength: 10,
  armLowerLength: 9,
  armCurveUpper: 0,
  armCurveLower: 0,
  armCurveTarget: 'both',
  hipOffset: 4.6,
  legWidth: 5.2,
  legUpperRatio: 0.49,
  legCurveUpper: 0,
  legCurveLower: 0,
  legCurveTarget: 'both',
  footLength: 9,
  footWidth: 3.5,
  color: '#000000',
};

export const NEUTRAL_POSE: Pose = {
  rootOffsetY: 0,
  rootRotation: 0,
  torsoLean: 0,
  headTilt: 0,
  armFarUpper: 0,
  armFarLower: 0,
  armNearUpper: 0,
  armNearLower: 0,
  legFarUpper: 0,
  legFarLower: 0,
  legNearUpper: 0,
  legNearLower: 0,
};

export const POSE_KEYS: readonly (keyof Pose)[] = [
  'rootOffsetY',
  'rootRotation',
  'torsoLean',
  'headTilt',
  'armFarUpper',
  'armFarLower',
  'armNearUpper',
  'armNearLower',
  'legFarUpper',
  'legFarLower',
  'legNearUpper',
  'legNearLower',
];

const rad = (deg: number): number => (deg * Math.PI) / 180;

// advance: angle 0 apunta recto hacia abajo (+y). Positivo → +x.
const advance = (origin: Vec2, angleDeg: number, length: number): Vec2 => {
  const r = rad(angleDeg);
  return {
    x: origin.x + Math.sin(r) * length,
    y: origin.y + Math.cos(r) * length,
  };
};

// Rotación estándar en espacio Y-abajo (positivo = horario en pantalla).
const rotateAround = (point: Vec2, pivot: Vec2, angleDeg: number): Vec2 => {
  const r = rad(angleDeg);
  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;
  return {
    x: pivot.x + dx * Math.cos(r) - dy * Math.sin(r),
    y: pivot.y + dx * Math.sin(r) + dy * Math.cos(r),
  };
};

// Transforma un punto de una parte del cuerpo: lo rota `rotateDeg` alrededor de un
// pivote (la base de la parte) y luego lo desplaza (dx, dy). Se aplica en render e
// interacción, encima de la cinemática, para poder mover/rotar cada parte libremente
// sin tocar el esqueleto (poses/animaciones siguen intactas).
export const applyPartXform = (
  p: Vec2,
  pivot: Vec2,
  rotateDeg: number,
  dx: number,
  dy: number,
): Vec2 => {
  if (!rotateDeg && !dx && !dy) return { x: p.x + dx, y: p.y + dy };
  const r = rad(rotateDeg);
  const ax = p.x - pivot.x;
  const ay = p.y - pivot.y;
  return {
    x: pivot.x + ax * Math.cos(r) - ay * Math.sin(r) + dx,
    y: pivot.y + ax * Math.sin(r) + ay * Math.cos(r) + dy,
  };
};

// `facing` (grados) simula un giro 3D del personaje alrededor de su eje vertical:
// 0 = de frente, 90 = perfil derecho, 180 = de espaldas, 270 = perfil izquierdo.
export const buildSkeleton = (
  char: CharacterDefinition,
  pose: Pose,
  facing = 0,
  scales?: PartScales,
): Skeleton => {
  // Multiplicador de largo por parte (≥0; default 1). Solo afecta la cinemática.
  const ls = (p: PartName): number => {
    const v = scales?.[p]?.lengthScale;
    return typeof v === 'number' && v > 0 ? v : 1;
  };

  const hipY = 100 - char.legHeight;
  const headRadius = char.headDiameter / 2;
  // neckLength separa la cabeza del cuerpo (?? 0 protege proyectos legacy).
  const headDistance = hipY - headRadius + (char.neckLength ?? 0);
  const torsoWidth = char.torsoWidth;
  const torsoDrawLength = char.torsoHeight * ls('torso') + 5;
  const shoulderOffset = torsoWidth / 2 - 0.8;
  const bodyDepth = torsoWidth * 0.5; // separación frente↔atrás de miembros cercano/lejano
  const legUpperLength = char.legHeight * char.legUpperRatio;
  const legLowerLength = char.legHeight - legUpperLength;

  const hip: Vec2 = { x: 0, y: hipY + pose.rootOffsetY };
  const lean = rad(pose.torsoLean);

  // Punto sobre el eje del torso (apuntando hacia arriba desde la cadera),
  // a distancia d, con desplazamiento lateral l.
  const alongTorso = (d: number, l: number): Vec2 => ({
    x: hip.x + Math.sin(lean) * d + Math.cos(lean) * l,
    y: hip.y - Math.cos(lean) * d + Math.sin(lean) * l,
  });

  const torsoTop = alongTorso(torsoDrawLength, 0);
  const headCenter = rotateAround(alongTorso(headDistance, 0), torsoTop, pose.headTilt);

  const capsules: Capsule[] = [];

  // Cápsula con curvatura opcional: bendFrac desplaza el punto de control
  // perpendicular al hueso, proporcional a su largo (0 = recto).
  const bent = (from: Vec2, to: Vec2, width: number, bendFrac: number): Capsule => {
    if (!bendFrac) return { from, to, width };
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return { from, to, width };
    const px = dy / len; // perpendicular (rot -90 en Y-abajo)
    const py = -dx / len;
    const off = bendFrac * len;
    return {
      from,
      to,
      width,
      ctrl: { x: (from.x + to.x) / 2 + px * off, y: (from.y + to.y) / 2 + py * off },
    };
  };

  // ¿La curvatura aplica a este lado según el target? (near = side +1, far = -1)
  const curveApplies = (target: CurveTarget, side: number): boolean =>
    target === 'both' || (target === 'near' && side > 0) || (target === 'far' && side < 0);

  // Torso — cápsula desde la cadera hasta torsoTop.
  capsules.push({ from: hip, to: torsoTop, width: torsoWidth, part: 'torso' });

  // Brazos — hijos del torso. Se resta la inclinación del torso.
  const buildArm = (upper: number, lower: number, side: number, part: PartName): void => {
    const sc = ls(part);
    const shoulder = alongTorso(char.shoulderDistance, side * (shoulderOffset + (char.armSpacing ?? 0)));
    const upperAngle = upper - pose.torsoLean;
    const elbow = advance(shoulder, upperAngle, char.armUpperLength * sc);
    const hand = advance(elbow, upperAngle + lower, char.armLowerLength * sc);
    const on = curveApplies(char.armCurveTarget ?? 'both', side);
    const bU = on ? (char.armCurveUpper ?? 0) * side : 0;
    const bL = on ? (char.armCurveLower ?? 0) * side : 0;
    const d = side * bodyDepth;
    capsules.push({ ...bent(shoulder, elbow, char.armWidth, bU), depth: d, part });
    capsules.push({ ...bent(elbow, hand, char.armWidth, bL), depth: d, part });
  };
  buildArm(pose.armFarUpper, pose.armFarLower, -1, 'armFar');
  buildArm(pose.armNearUpper, pose.armNearLower, 1, 'armNear');

  // Piernas — parten de la cadera y NO heredan la inclinación del torso.
  const buildLeg = (upper: number, lower: number, side: number, part: PartName): void => {
    const sc = ls(part);
    const hipPoint: Vec2 = { x: side * char.hipOffset, y: hip.y };
    const knee = advance(hipPoint, upper, legUpperLength * sc);
    const ankleAngle = upper + lower;
    const ankle = advance(knee, ankleAngle, legLowerLength * sc);
    const on = curveApplies(char.legCurveTarget ?? 'both', side);
    const bU = on ? (char.legCurveUpper ?? 0) * side : 0;
    const bL = on ? (char.legCurveLower ?? 0) * side : 0;
    const d = side * bodyDepth;
    capsules.push({ ...bent(hipPoint, knee, char.legWidth, bU), depth: d, part });
    capsules.push({ ...bent(knee, ankle, char.legWidth, bL), depth: d, part });
    // Pie — cápsula desde el tobillo, ángulo tobillo + 90.
    const toe = advance(ankle, ankleAngle + 90, char.footLength * sc);
    capsules.push({ from: ankle, to: toe, width: char.footWidth, depth: d, part });
  };
  buildLeg(pose.legFarUpper, pose.legFarLower, -1, 'legFar');
  buildLeg(pose.legNearUpper, pose.legNearLower, 1, 'legNear');

  // Giro 3D (facing): escorza el eje lateral por cos(θ) y separa los miembros
  // cercano/lejano por su profundidad · sin(θ). En perfil el cuerpo se angosta
  // y los brazos/piernas se abren adelante/atrás.
  let outHead = headCenter;
  let outCaps: Capsule[] = capsules;
  const facingMod = ((facing % 360) + 360) % 360;
  if (facingMod !== 0) {
    const fr = rad(facing);
    const fc = Math.cos(fr);
    const fs = Math.sin(fr);
    const faceX = (p: Vec2, d: number): Vec2 => ({ x: p.x * fc + d * fs, y: p.y });
    outHead = faceX(headCenter, 0);
    outCaps = capsules.map((c) => {
      const d = c.depth ?? 0;
      return {
        from: faceX(c.from, d),
        to: faceX(c.to, d),
        width: c.width,
        depth: d,
        part: c.part,
        ...(c.ctrl ? { ctrl: faceX(c.ctrl, d) } : {}),
      };
    });
  }

  // Rotación global (para la muerte): rotar todo alrededor de {0,100} y elevar
  // el cuerpo para que se apoye sobre el suelo en vez de atravesarlo.
  let finalHead = outHead;
  let finalCaps = outCaps;
  if (pose.rootRotation !== 0) {
    const pivot: Vec2 = { x: 0, y: 100 };
    const lift = -headRadius * Math.abs(Math.sin(rad(pose.rootRotation)));
    const apply = (p: Vec2): Vec2 => {
      const rp = rotateAround(p, pivot, pose.rootRotation);
      return { x: rp.x, y: rp.y + lift };
    };
    finalHead = apply(outHead);
    finalCaps = outCaps.map((c) => ({
      from: apply(c.from),
      to: apply(c.to),
      width: c.width,
      part: c.part,
      ...(c.ctrl ? { ctrl: apply(c.ctrl) } : {}),
    }));

    // Al girar sobre los pies, el cuerpo tumbado se desplaza hacia un lado y la
    // cabeza se saldría de la celda (que está centrada en x=0). Recentramos el
    // bounding box horizontal en x=0 para que la figura acostada quepa completa.
    let minX = finalHead.x - headRadius;
    let maxX = finalHead.x + headRadius;
    for (const c of finalCaps) {
      const hw = c.width / 2;
      minX = Math.min(minX, c.from.x - hw, c.to.x - hw);
      maxX = Math.max(maxX, c.from.x + hw, c.to.x + hw);
    }
    const shiftX = -(minX + maxX) / 2;
    if (shiftX !== 0) {
      finalHead = { x: finalHead.x + shiftX, y: finalHead.y };
      finalCaps = finalCaps.map((c) => ({
        from: { x: c.from.x + shiftX, y: c.from.y },
        to: { x: c.to.x + shiftX, y: c.to.y },
        width: c.width,
        part: c.part,
        ...(c.ctrl ? { ctrl: { x: c.ctrl.x + shiftX, y: c.ctrl.y } } : {}),
      }));
    }
  }

  // Ángulo de un hueso en la convención de `advance` (0 = hacia abajo).
  const angleOf = (a: Vec2, b: Vec2): number =>
    (Math.atan2(b.x - a.x, b.y - a.y) * 180) / Math.PI;

  // Anclas para accesorios (índices fijos: 0 torso, 1-2 brazo lejano,
  // 3-4 brazo cercano, 5-7 pierna lejana, 8-10 pierna cercana).
  const c = finalCaps;
  const anchors: Record<AnchorName, Anchor> = {
    head: { pos: finalHead, angle: angleOf(c[0].to, finalHead) },
    torsoTop: { pos: c[0].to, angle: angleOf(c[0].from, c[0].to) },
    hip: { pos: c[0].from, angle: 0 },
    shoulderNear: { pos: c[3].from, angle: angleOf(c[3].from, c[3].to) },
    shoulderFar: { pos: c[1].from, angle: angleOf(c[1].from, c[1].to) },
    handNear: { pos: c[4].to, angle: angleOf(c[4].from, c[4].to) },
    handFar: { pos: c[2].to, angle: angleOf(c[2].from, c[2].to) },
    footNear: { pos: c[10].to, angle: angleOf(c[10].from, c[10].to) },
    footFar: { pos: c[7].to, angle: angleOf(c[7].from, c[7].to) },
  };

  return { headCenter: finalHead, headRadius, capsules: finalCaps, anchors };
};
