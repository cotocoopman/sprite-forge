import { describe, it, expect } from 'vitest';
import { buildSkeleton, DEFAULT_CHARACTER, NEUTRAL_POSE } from './rig';
import { accessoriesToPrimitives } from './svg';
import { DEFAULT_RENDER } from './poses';
import type { Accessory } from './poses';

const circle = (id: string, over: Partial<Accessory>): Accessory => ({
  id, name: id, anchor: 'torsoTop', shape: 'circle',
  offsetAlong: 0, offsetPerp: 0, angle: 0, length: 0, width: 8,
  color: '#000', opacity: 1, front: true, ...over,
});

const skel = buildSkeleton(DEFAULT_CHARACTER, NEUTRAL_POSE);

const render = (perp: number) => {
  const A = circle('A', { offsetPerp: perp });
  const B = circle('B', { anchorTo: { id: 'A', part: 'center' } });
  return accessoriesToPrimitives([A, B], skel.anchors, DEFAULT_RENDER);
};

describe('object→object anchoring', () => {
  it('B anclado al centro de A queda sobre A y lo sigue cuando A se mueve', () => {
    const p0 = render(0);
    const p1 = render(12);
    expect(p0[0].kind).toBe('circle');
    if (p0[0].kind === 'circle' && p0[1].kind === 'circle') {
      expect(Math.abs(p0[1].cx - p0[0].cx)).toBeLessThan(0.001);
      expect(Math.abs(p0[1].cy - p0[0].cy)).toBeLessThan(0.001);
    }
    if (p0[1].kind === 'circle' && p1[1].kind === 'circle') {
      expect(Math.abs(p1[1].cx - p0[1].cx)).toBeGreaterThan(1);
    }
  });

  it('no rompe ante un ciclo de anclaje (A→B→A)', () => {
    const A = circle('A', { anchorTo: { id: 'B', part: 'center' } });
    const B = circle('B', { anchorTo: { id: 'A', part: 'center' } });
    const prims = accessoriesToPrimitives([A, B], skel.anchors, DEFAULT_RENDER);
    expect(prims.every((p) => (p.kind === 'circle' ? Number.isFinite(p.cx) : true))).toBe(true);
  });
});
