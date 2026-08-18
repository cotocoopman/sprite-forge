import { describe, it, expect } from 'vitest';
import { NEUTRAL_POSE } from './rig';
import type { Pose } from './rig';
import { applyEasing, lerpPose, poseAt, sampleClip } from './poses';
import type { AnimationClip, Keyframe } from './poses';

describe('applyEasing', () => {
  it('linear no cambia k', () => {
    expect(applyEasing(0.3, 'linear')).toBeCloseTo(0.3, 6);
    expect(applyEasing(0.3, undefined)).toBeCloseTo(0.3, 6);
  });
  it('easeIn arranca más lento (k=0.5 < 0.5)', () => {
    expect(applyEasing(0.5, 'easeIn')).toBeLessThan(0.5);
  });
  it('easeOut frena al final (k=0.5 > 0.5)', () => {
    expect(applyEasing(0.5, 'easeOut')).toBeGreaterThan(0.5);
  });
  it('conserva los extremos', () => {
    expect(applyEasing(0, 'easeInOut')).toBeCloseTo(0, 6);
    expect(applyEasing(1, 'easeInOut')).toBeCloseTo(1, 6);
  });
});

const poseA: Pose = { ...NEUTRAL_POSE, torsoLean: 10, armNearUpper: 20 };
const poseB: Pose = { ...NEUTRAL_POSE, torsoLean: 30, armNearUpper: 60 };

describe('lerpPose', () => {
  it('k = 0 devuelve a', () => {
    expect(lerpPose(poseA, poseB, 0)).toEqual(poseA);
  });
  it('k = 1 devuelve b', () => {
    expect(lerpPose(poseA, poseB, 1)).toEqual(poseB);
  });
  it('k = 0.5 devuelve el promedio', () => {
    const mid = lerpPose(poseA, poseB, 0.5);
    expect(mid.torsoLean).toBeCloseTo(20, 6);
    expect(mid.armNearUpper).toBeCloseTo(40, 6);
  });
});

describe('poseAt', () => {
  const keyframes: readonly Keyframe[] = [
    { t: 0, pose: poseA },
    { t: 1, pose: poseB },
  ];

  it('en el t exacto de un keyframe devuelve esa pose', () => {
    expect(poseAt(keyframes, 0).torsoLean).toBeCloseTo(10, 6);
    expect(poseAt(keyframes, 1).torsoLean).toBeCloseTo(30, 6);
  });

  it('a mitad de camino devuelve el promedio', () => {
    const mid = poseAt(keyframes, 0.5);
    expect(mid.torsoLean).toBeCloseTo(20, 6);
    expect(mid.armNearUpper).toBeCloseTo(40, 6);
  });
});

describe('sampleClip', () => {
  const base: Omit<AnimationClip, 'frames' | 'loop'> = {
    id: 'c',
    name: 'c',
    fps: 10,
    keyframes: [
      { t: 0, pose: poseA },
      { t: 1, pose: poseB },
    ],
  };

  it('devuelve exactamente `frames` poses (loop)', () => {
    const poses = sampleClip({ ...base, frames: 8, loop: true });
    expect(poses).toHaveLength(8);
  });

  it('devuelve exactamente `frames` poses (sin loop)', () => {
    const poses = sampleClip({ ...base, frames: 5, loop: false });
    expect(poses).toHaveLength(5);
  });

  it('sin loop el último frame llega al último keyframe', () => {
    const poses = sampleClip({ ...base, frames: 5, loop: false });
    expect(poses[poses.length - 1].torsoLean).toBeCloseTo(30, 6);
  });
});
