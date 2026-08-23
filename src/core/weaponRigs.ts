// Puente props (armas del humanoide) → rig personalizado. Convierte cada
// PropTemplate en un CustomRig "suelto" para poder crear/animar/exportar armas
// por separado. Vive aparte de customRig.ts/props.ts para no crear ciclos de
// import (poses ← customRig, props ← poses).
import { PROP_TEMPLATES } from './props';
import type { PropTemplate } from './props';
import type { Bone, CustomRig, RigClip, RigPreset } from './customRig';
import { RIG_TEMPLATES, RIG_PRESETS } from './customRig';

const idleClip = (): RigClip => ({
  id: 'idle',
  name: 'idle',
  frames: 8,
  fps: 8,
  loop: true,
  keyframes: [
    { t: 0, pose: {} },
    { t: 1, pose: {} },
  ],
});

// Un prop está definido alrededor de un ancla (ángulo 0), con eje "along" hacia
// +y (abajo) y "perp" hacia +x. El rig usa dirOf(θ)=(sinθ,-cosθ) (θ=0 = arriba).
// Rotando el prop 180° la punta (que en el prop mira hacia abajo) queda mirando
// hacia arriba, orientación natural para un sprite de arma suelta.
//   base_rig = (-offsetPerp, -offsetAlong)   ·   angle_rig = -angle
export const propToRig = (tpl: PropTemplate): CustomRig => {
  const bones: Bone[] = tpl.parts.map((p, i) => ({
    id: `p${i}`,
    name: p.name,
    parentId: null,
    attach: 0,
    angle: -p.angle,
    length: p.length,
    width: p.width,
    shape: p.shape,
    curve: 0,
    color: p.color,
    z: i,
    offset: { x: -p.offsetPerp, y: -p.offsetAlong },
  }));
  return {
    id: `w_${tpl.id}`,
    name: tpl.name,
    color: '#888888',
    origin: { x: 0, y: 52 },
    bones,
    animations: [idleClip()],
  };
};

// Presets de armas como rigs (mismas armas que la galería del humanoide).
export const WEAPON_RIG_TEMPLATES: readonly RigPreset[] = PROP_TEMPLATES.map((tpl) => ({
  id: `w_${tpl.id}`,
  name: tpl.name,
  emoji: tpl.emoji,
  build: () => propToRig(tpl),
}));

// Listas combinadas (criaturas + armas) para la UI del rig personalizado.
export const ALL_RIG_TEMPLATES: readonly RigPreset[] = [...RIG_TEMPLATES, ...WEAPON_RIG_TEMPLATES];
export const ALL_RIG_PRESETS: readonly RigPreset[] = [...RIG_PRESETS, ...WEAPON_RIG_TEMPLATES];
