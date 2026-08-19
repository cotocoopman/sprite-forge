import { describe, it, expect } from 'vitest';
import { CHARACTER_TEMPLATES } from './templates';
import { buildSkeleton, NEUTRAL_POSE } from './rig';
import { RIG_TEMPLATES, buildCustomSkeleton } from './customRig';

describe('character templates', () => {
  it('exposes 10 templates with unique ids', () => {
    expect(CHARACTER_TEMPLATES).toHaveLength(10);
    const ids = new Set(CHARACTER_TEMPLATES.map((t) => t.id));
    expect(ids.size).toBe(10);
  });

  it('every template builds a renderable skeleton', () => {
    for (const tpl of CHARACTER_TEMPLATES) {
      const char = tpl.build();
      expect(char.name).toBe(tpl.name);
      const skel = buildSkeleton(char, NEUTRAL_POSE);
      expect(skel.capsules.length).toBeGreaterThan(0);
      expect(Number.isFinite(skel.headRadius)).toBe(true);
      expect(skel.headRadius).toBeGreaterThan(0);
    }
  });
});

describe('rig templates', () => {
  it('exposes 10 templates with unique ids and emoji', () => {
    expect(RIG_TEMPLATES).toHaveLength(10);
    const ids = new Set(RIG_TEMPLATES.map((t) => t.id));
    expect(ids.size).toBe(10);
    for (const t of RIG_TEMPLATES) expect(t.emoji.length).toBeGreaterThan(0);
  });

  it('every rig template resolves with finite bone positions (cycle-safe)', () => {
    for (const tpl of RIG_TEMPLATES) {
      const rig = tpl.build();
      expect(rig.bones.length).toBeGreaterThan(0);
      const solved = buildCustomSkeleton(rig);
      expect(solved.length).toBe(rig.bones.length);
      const finite = (n: number): boolean => Number.isFinite(n);
      for (const b of solved) {
        if (b.kind === 'capsule') {
          expect(finite(b.from.x) && finite(b.from.y) && finite(b.to.x) && finite(b.to.y)).toBe(true);
        } else if (b.kind === 'circle') {
          expect(finite(b.cx) && finite(b.cy) && finite(b.r)).toBe(true);
        } else {
          expect(b.pts.every((p) => finite(p.x) && finite(p.y))).toBe(true);
        }
      }
    }
  });
});
