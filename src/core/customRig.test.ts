import { describe, it, expect } from 'vitest';
import { buildCustomSkeleton, buildDefaultCustomRig, rigPoseAt, sampleRigClip } from './customRig';
import type { CustomRig, RigClip } from './customRig';

const twoBone: CustomRig = {
  id: 't',
  name: 't',
  color: '#000000',
  origin: { x: 0, y: 50 },
  bones: [
    { id: 'root', name: 'root', parentId: null, attach: 0, angle: 0, length: 20, width: 4, shape: 'capsule', curve: 0, color: null, z: 0 },
    { id: 'child', name: 'child', parentId: 'root', attach: 1, angle: 0, length: 10, width: 3, shape: 'capsule', curve: 0, color: null, z: 1 },
  ],
  animations: [{ id: 'idle', name: 'idle', frames: 8, fps: 8, loop: true, keyframes: [{ t: 0, pose: {} }, { t: 1, pose: {} }] }],
};

describe('buildCustomSkeleton', () => {
  it('genera un elemento renderizable por hueso', () => {
    const rig = buildDefaultCustomRig();
    expect(buildCustomSkeleton(rig)).toHaveLength(rig.bones.length);
  });

  it('ordena por z ascendente (para el dibujo)', () => {
    const r = buildCustomSkeleton(buildDefaultCustomRig());
    for (let i = 1; i < r.length; i += 1) {
      expect(r[i].z).toBeGreaterThanOrEqual(r[i - 1].z);
    }
  });

  it('el hueso raíz nace en el origen y apunta hacia arriba (angle 0)', () => {
    const skel = buildCustomSkeleton(twoBone);
    const root = skel.find((b) => b.z === 0);
    expect(root?.kind).toBe('capsule');
    if (root?.kind === 'capsule') {
      expect(root.from).toEqual({ x: 0, y: 50 });
      expect(root.to.x).toBeCloseTo(0, 6);
      expect(root.to.y).toBeCloseTo(30, 6); // 50 - 20 (hacia arriba)
    }
  });

  it('el hijo nace en la punta del padre (attach 1)', () => {
    const skel = buildCustomSkeleton(twoBone);
    const child = skel.find((b) => b.z === 1);
    if (child?.kind === 'capsule') {
      expect(child.from.y).toBeCloseTo(30, 6);
      expect(child.to.y).toBeCloseTo(20, 6);
    }
  });

  it('no cuelga ante un ciclo de padres', () => {
    const cyclic: CustomRig = {
      ...twoBone,
      bones: [
        { ...twoBone.bones[0], parentId: 'child' },
        { ...twoBone.bones[1], parentId: 'root' },
      ],
    };
    expect(buildCustomSkeleton(cyclic)).toHaveLength(2);
  });

  it('la pose (offset de ángulo) rota el hueso', () => {
    const skel = buildCustomSkeleton(twoBone, { root: 90 });
    const root = skel.find((b) => b.z === 0);
    if (root?.kind === 'capsule') {
      expect(root.to.x).toBeCloseTo(20, 4); // angle 90 → apunta a +x
      expect(root.to.y).toBeCloseTo(50, 4);
    }
  });
});

describe('animación del rig', () => {
  const clip: RigClip = {
    id: 'c',
    name: 'c',
    frames: 6,
    fps: 10,
    loop: false,
    keyframes: [
      { t: 0, pose: { root: 0 } },
      { t: 1, pose: { root: 90 } },
    ],
  };

  it('sampleRigClip devuelve exactamente `frames` poses', () => {
    expect(sampleRigClip(clip)).toHaveLength(6);
  });

  it('rigPoseAt interpola a mitad de camino', () => {
    expect(rigPoseAt(clip.keyframes, 0.5).root).toBeCloseTo(45, 4);
  });

  it('rigPoseAt en el keyframe exacto devuelve su pose', () => {
    expect(rigPoseAt(clip.keyframes, 1).root).toBeCloseTo(90, 4);
  });
});
