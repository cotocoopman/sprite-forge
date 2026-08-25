import { describe, it, expect, vi, beforeAll } from 'vitest';

// El store lee/escribe localStorage al importarse; lo stubeamos para correr en node.
const mem = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
});

import { useProjectStore } from './useProjectStore';
import { frameToT, poseAt } from '@core/poses';

const activeClip = () => {
  const s = useProjectStore.getState();
  return s.project.animations.find((c) => c.id === s.activeAnimationId)!;
};

describe('timeline unificado — auto-key + sync playhead↔keyframe', () => {
  beforeAll(() => {
    // Partir de un clip conocido: idle (keyframes en t=0, 0.5, 1).
    useProjectStore.getState().selectAnimation('idle');
    useProjectStore.getState().setAutoKey(true);
  });

  it('mover el playhead a un frame sin keyframe deja activeKeyframeIndex = -1', () => {
    useProjectStore.getState().setCurrentFrame(3); // idle: frames con kf = 0,4,7
    expect(useProjectStore.getState().activeKeyframeIndex).toBe(-1);
  });

  it('editar una pose en un frame interpolado CREA un keyframe ahí (auto-key)', () => {
    useProjectStore.getState().setCurrentFrame(3);
    const before = activeClip().keyframes.length;
    useProjectStore.getState().setPoseField('torsoLean', 33);
    const after = activeClip();
    expect(after.keyframes.length).toBe(before + 1);
    // la pose muestreada en el frame 3 refleja la edición
    const tt = frameToT(3, after.frames, after.loop);
    expect(poseAt(after.keyframes, tt).torsoLean).toBeCloseTo(33, 5);
    // y ese keyframe queda activo
    expect(useProjectStore.getState().activeKeyframeIndex).toBeGreaterThanOrEqual(0);
  });

  it('sin auto-key, editar en un frame interpolado NO crea keyframe', () => {
    useProjectStore.getState().setAutoKey(false);
    useProjectStore.getState().setCurrentFrame(2); // aún interpolado
    expect(useProjectStore.getState().activeKeyframeIndex).toBe(-1);
    const before = activeClip().keyframes.length;
    useProjectStore.getState().setPoseField('torsoLean', 99);
    expect(activeClip().keyframes.length).toBe(before);
    useProjectStore.getState().setAutoKey(true);
  });

  it('seleccionar un keyframe mueve el playhead a su frame', () => {
    const clip = activeClip();
    // el keyframe en t=0.5 debe caer en el frame round(0.5*8)=4 (loop)
    const idx = clip.keyframes.findIndex((k) => Math.abs(k.t - 0.5) < 1e-6);
    expect(idx).toBeGreaterThanOrEqual(0);
    useProjectStore.getState().selectKeyframe(idx);
    expect(useProjectStore.getState().currentFrame).toBe(4);
  });
});
