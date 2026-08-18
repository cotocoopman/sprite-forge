import { describe, it, expect } from 'vitest';
import { buildSkeleton, DEFAULT_CHARACTER, NEUTRAL_POSE } from './rig';
import type { Skeleton } from './rig';

const allPoints = (skel: Skeleton): { x: number; y: number }[] => {
  const pts = skel.capsules.flatMap((c) => [c.from, c.to]);
  // Punto más bajo de la cabeza (borde inferior del círculo).
  pts.push({ x: skel.headCenter.x, y: skel.headCenter.y + skel.headRadius });
  return pts;
};

describe('buildSkeleton — pose neutra', () => {
  const skel = buildSkeleton(DEFAULT_CHARACTER, NEUTRAL_POSE);

  it('deja la coronilla en y ≈ 0', () => {
    const crown = skel.headCenter.y - skel.headRadius;
    expect(crown).toBeCloseTo(0, 5);
  });

  it('deja los pies en y ≈ 100', () => {
    const maxY = Math.max(...allPoints(skel).map((p) => p.y));
    expect(maxY).toBeCloseTo(100, 5);
  });

  it('centro de la cabeza a headRadius del tope', () => {
    expect(skel.headCenter.y).toBeCloseTo(skel.headRadius, 5);
  });
});

describe('buildSkeleton — inclinaciones', () => {
  it('con torsoLean > 0 el torsoTop se mueve hacia +x', () => {
    const skel = buildSkeleton(DEFAULT_CHARACTER, { ...NEUTRAL_POSE, torsoLean: 25 });
    const torsoTop = skel.capsules[0].to; // capsula 0 = torso (hip → torsoTop)
    expect(torsoTop.x).toBeGreaterThan(0.5);
  });

  it('con armNearUpper > 0 la mano se mueve hacia +x', () => {
    const neutral = buildSkeleton(DEFAULT_CHARACTER, NEUTRAL_POSE);
    const raised = buildSkeleton(DEFAULT_CHARACTER, { ...NEUTRAL_POSE, armNearUpper: 45 });
    const neutralHand = neutral.capsules[4].to; // capsula 4 = antebrazo cercano
    const raisedHand = raised.capsules[4].to;
    expect(raisedHand.x).toBeGreaterThan(neutralHand.x);
  });
});

describe('buildSkeleton — curvatura', () => {
  it('sin curvatura los huesos son rectos (sin punto de control)', () => {
    const skel = buildSkeleton(DEFAULT_CHARACTER, NEUTRAL_POSE);
    expect(skel.capsules.every((c) => c.ctrl === undefined)).toBe(true);
  });

  it('con legCurveUpper ≠ 0 las piernas obtienen punto de control (hueso curvo)', () => {
    const skel = buildSkeleton({ ...DEFAULT_CHARACTER, legCurveUpper: 0.3 }, NEUTRAL_POSE);
    expect(skel.capsules.some((c) => c.ctrl !== undefined)).toBe(true);
  });

  it('target "near" solo curva un lado', () => {
    const both = buildSkeleton(
      { ...DEFAULT_CHARACTER, legCurveUpper: 0.3, legCurveTarget: 'both' },
      NEUTRAL_POSE,
    );
    const near = buildSkeleton(
      { ...DEFAULT_CHARACTER, legCurveUpper: 0.3, legCurveTarget: 'near' },
      NEUTRAL_POSE,
    );
    const count = (s: typeof both): number => s.capsules.filter((c) => c.ctrl !== undefined).length;
    expect(count(near)).toBeLessThan(count(both));
    expect(count(near)).toBeGreaterThan(0);
  });
});

describe('buildSkeleton — giro 3D (facing)', () => {
  it('facing 90 escorza (achica) el eje lateral', () => {
    const leaned = { ...NEUTRAL_POSE, torsoLean: 30 };
    const front = buildSkeleton(DEFAULT_CHARACTER, leaned, 0);
    const side = buildSkeleton(DEFAULT_CHARACTER, leaned, 90);
    expect(Math.abs(side.capsules[0].to.x)).toBeLessThan(Math.abs(front.capsules[0].to.x));
  });

  it('facing 90 separa brazo cercano y lejano en profundidad', () => {
    const s = buildSkeleton(DEFAULT_CHARACTER, NEUTRAL_POSE, 90);
    const farShoulder = s.capsules[1].from.x; // capsula 1 = brazo lejano superior
    const nearShoulder = s.capsules[3].from.x; // capsula 3 = brazo cercano superior
    expect(nearShoulder).toBeGreaterThan(farShoulder);
  });

  it('facing 0 no cambia nada (silueta de frente)', () => {
    const a = buildSkeleton(DEFAULT_CHARACTER, NEUTRAL_POSE, 0);
    const b = buildSkeleton(DEFAULT_CHARACTER, NEUTRAL_POSE);
    expect(a.capsules[3].from.x).toBeCloseTo(b.capsules[3].from.x, 6);
  });
});

describe('buildSkeleton — rotación global', () => {
  it('con rootRotation = -90 ningún punto queda por debajo de y = 100', () => {
    const skel = buildSkeleton(DEFAULT_CHARACTER, { ...NEUTRAL_POSE, rootRotation: -90 });
    const maxY = Math.max(...allPoints(skel).map((p) => p.y));
    expect(maxY).toBeLessThanOrEqual(100 + 1e-6);
  });
});
