import { describe, it, expect } from 'vitest';
import { PROP_TEMPLATES } from './props';
import { propToRig, WEAPON_RIG_TEMPLATES, ALL_RIG_PRESETS } from './weaponRigs';
import { buildCustomSkeleton } from './customRig';

const finite = (n: number): boolean => Number.isFinite(n);

describe('weapon rigs (props → custom rig)', () => {
  it('exposes one weapon rig per prop template', () => {
    expect(WEAPON_RIG_TEMPLATES).toHaveLength(PROP_TEMPLATES.length);
    expect(ALL_RIG_PRESETS.length).toBeGreaterThanOrEqual(WEAPON_RIG_TEMPLATES.length);
  });

  it('every weapon rig builds finite renderable bones, one per part', () => {
    for (const preset of WEAPON_RIG_TEMPLATES) {
      const rig = preset.build();
      const tpl = PROP_TEMPLATES.find((p) => `w_${p.id}` === rig.id)!;
      expect(rig.bones).toHaveLength(tpl.parts.length);
      const bones = buildCustomSkeleton(rig);
      expect(bones).toHaveLength(tpl.parts.length);
      for (const b of bones) {
        if (b.kind === 'circle') expect(finite(b.cx) && finite(b.cy) && finite(b.r)).toBe(true);
        else if (b.kind === 'rect') expect(b.pts.every((q) => finite(q.x) && finite(q.y))).toBe(true);
        else expect(finite(b.from.x) && finite(b.from.y) && finite(b.to.x) && finite(b.to.y)).toBe(true);
      }
    }
  });

  it('triangle parts become 3-point polygons', () => {
    const proj = propToRig(PROP_TEMPLATES.find((p) => p.id === 'projectile')!);
    const bones = buildCustomSkeleton(proj);
    const tris = bones.filter((b) => b.kind === 'rect' && b.pts.length === 3);
    expect(tris.length).toBeGreaterThan(0);
  });
});
