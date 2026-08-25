import { describe, it, expect } from 'vitest';
import { clipFrameDenom, frameToT, tToFrame, sampleClip } from './poses';
import type { AnimationClip } from './poses';
import { NEUTRAL_POSE } from './rig';

describe('frame ↔ t mapping', () => {
  it('round-trip frame → t → frame es identidad (no loop)', () => {
    for (const frames of [1, 2, 8, 30]) {
      for (let f = 0; f < frames; f += 1) {
        expect(tToFrame(frameToT(f, frames, false), frames, false)).toBe(f);
      }
    }
  });

  it('round-trip frame → t → frame es identidad (loop, sin el wrap final)', () => {
    for (const frames of [2, 8, 30]) {
      for (let f = 0; f < frames; f += 1) {
        expect(tToFrame(frameToT(f, frames, true), frames, true)).toBe(f);
      }
    }
  });

  it('denominador replica el de sampleClip', () => {
    expect(clipFrameDenom(8, false)).toBe(7);
    expect(clipFrameDenom(8, true)).toBe(8);
  });
});

describe('un keyframe en el frame k cae donde el preview lo muestra', () => {
  const makeClip = (frames: number, loop: boolean, kfFrame: number): AnimationClip => ({
    id: 'c',
    name: 'c',
    frames,
    fps: 8,
    loop,
    keyframes: [
      { t: 0, pose: NEUTRAL_POSE },
      { t: frameToT(kfFrame, frames, loop), pose: { ...NEUTRAL_POSE, torsoLean: 42 } },
    ],
  });

  it('non-loop: sampleClip[k] es exactamente la pose del keyframe en el frame k', () => {
    const clip = makeClip(8, false, 3);
    const poses = sampleClip(clip);
    expect(poses[3].torsoLean).toBeCloseTo(42, 6);
  });

  it('loop: sampleClip[k] es exactamente la pose del keyframe en el frame k', () => {
    const clip = makeClip(8, true, 5);
    const poses = sampleClip(clip);
    expect(poses[5].torsoLean).toBeCloseTo(42, 6);
  });
});
