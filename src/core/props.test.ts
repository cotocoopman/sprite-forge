import { describe, it, expect } from 'vitest';
import { PROP_TEMPLATES } from './props';
import { accessoriesToPrimitives } from './svg';
import { buildSkeleton, DEFAULT_CHARACTER, NEUTRAL_POSE } from './rig';
import { DEFAULT_RENDER } from './poses';
import type { Accessory } from './poses';

const finite = (n: number): boolean => Number.isFinite(n);

describe('prop templates (weapons as mini-rigs)', () => {
  const skel = buildSkeleton(DEFAULT_CHARACTER, NEUTRAL_POSE);

  it('exposes 6 props with unique ids and non-empty parts', () => {
    expect(PROP_TEMPLATES).toHaveLength(6);
    expect(new Set(PROP_TEMPLATES.map((p) => p.id)).size).toBe(6);
    for (const p of PROP_TEMPLATES) expect(p.parts.length).toBeGreaterThan(0);
  });

  it('each prop renders to finite accessory primitives anchored to a hand', () => {
    for (const tpl of PROP_TEMPLATES) {
      const accs: Accessory[] = tpl.parts.map((part, i) => ({ ...part, id: `${tpl.id}-${i}`, anchor: 'handNear' }));
      const prims = accessoriesToPrimitives(accs, skel.anchors, DEFAULT_RENDER);
      expect(prims).toHaveLength(tpl.parts.length);
      for (const p of prims) {
        if (p.kind === 'circle') expect(finite(p.cx) && finite(p.cy) && finite(p.r)).toBe(true);
        else if (p.kind === 'line') expect(finite(p.x1) && finite(p.y1) && finite(p.x2) && finite(p.y2)).toBe(true);
        else expect(p.pts.every((q) => finite(q.x) && finite(q.y))).toBe(true);
      }
    }
  });
});
