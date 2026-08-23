import { describe, it, expect } from 'vitest';
import { validateProject } from './validation';
import { buildDefaultProject } from './poses';

describe('validateProject', () => {
  it('acepta un proyecto válido', () => {
    const result = validateProject(buildDefaultProject());
    expect(result.ok).toBe(true);
  });

  it('rechaza un no-objeto', () => {
    const result = validateProject(42);
    expect(result.ok).toBe(false);
  });

  it('rechaza campos faltantes en character', () => {
    const project = buildDefaultProject();
    const broken = { ...project, character: { ...project.character } } as Record<string, unknown>;
    delete (broken.character as Record<string, unknown>).legHeight;
    const result = validateProject(broken);
    expect(result.ok).toBe(false);
  });

  it('rechaza tipos incorrectos', () => {
    const project = buildDefaultProject();
    const broken = {
      ...project,
      character: { ...project.character, headDiameter: 'grande' },
    };
    const result = validateProject(broken);
    expect(result.ok).toBe(false);
  });

  it('rechaza keyframe con pose incompleta', () => {
    const project = buildDefaultProject();
    const broken = {
      ...project,
      animations: [
        {
          ...project.animations[0],
          keyframes: [{ t: 0, pose: { torsoLean: 0 } }],
        },
      ],
    };
    const result = validateProject(broken);
    expect(result.ok).toBe(false);
  });

  it('rechaza animations vacío', () => {
    const project = buildDefaultProject();
    const result = validateProject({ ...project, animations: [] });
    expect(result.ok).toBe(false);
  });

  it('acepta proyecto legacy sin effects y completa defaults', () => {
    const project = buildDefaultProject();
    const legacy = { character: project.character, animations: project.animations, render: project.render };
    const result = validateProject(legacy);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.project.effects.shadow.enabled).toBe(false);
      expect(result.project.effects.glow.enabled).toBe(false);
    }
  });

  it('completa neckLength/curvatura/rotation faltantes con defaults', () => {
    const project = buildDefaultProject();
    const char = { ...project.character } as Record<string, unknown>;
    delete char.neckLength;
    delete char.armCurveUpper;
    delete char.armCurveTarget;
    const render = { ...project.render } as Record<string, unknown>;
    delete render.rotation;
    const result = validateProject({ ...project, character: char, render });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.project.character.neckLength).toBe(0);
      expect(result.project.character.armCurveUpper).toBe(0);
      expect(result.project.character.armCurveTarget).toBe('both');
      expect(result.project.render.rotation).toBe(0);
    }
  });

  it('migra torsoWidthRatio viejo a torsoWidth absoluto (ratio × cabeza)', () => {
    const project = buildDefaultProject();
    const char = { ...project.character, headDiameter: 40, torsoWidthRatio: 0.5 } as Record<string, unknown>;
    delete char.torsoWidth;
    const result = validateProject({ ...project, character: char });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.project.character.torsoWidth).toBeCloseTo(20, 6); // 40 * 0.5
  });

  it('migra el two-tone viejo (headColor) a parts.head', () => {
    const project = buildDefaultProject();
    const legacy = {
      ...project,
      character: { ...project.character, headColorEnabled: true, headColor: '#ff0000' },
      parts: undefined,
    };
    const result = validateProject(legacy);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.project.parts.head.color).toBe('#ff0000');
      expect(result.project.parts.torso.visible).toBe(true);
    }
  });

  it('migra armCurve/legCurve legacy a upper+lower', () => {
    const project = buildDefaultProject();
    const char = { ...project.character, armCurve: 0.25, legCurve: 0.1 } as Record<string, unknown>;
    delete char.armCurveUpper;
    delete char.armCurveLower;
    delete char.legCurveUpper;
    delete char.legCurveLower;
    const result = validateProject({ ...project, character: char });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.project.character.armCurveUpper).toBe(0.25);
      expect(result.project.character.armCurveLower).toBe(0.25);
      expect(result.project.character.legCurveUpper).toBe(0.1);
    }
  });

  it('conserva shape triangle, offset/hidden de huesos y propId/hidden de accesorios', () => {
    const project = buildDefaultProject();
    const raw = {
      ...project,
      accessories: [
        {
          id: 'a1', name: 'Bolt', anchor: 'handNear', shape: 'triangle',
          offsetAlong: 1, offsetPerp: 2, angle: 10, length: 12, width: 4,
          color: '#fff', opacity: 1, front: true, propId: 'projectile', hidden: true,
        },
      ],
      customRig: {
        ...project.customRig,
        bones: [
          { id: 'b1', name: 'Tri', parentId: null, attach: 0, angle: 0, length: 10, width: 5, shape: 'triangle', curve: 0, color: null, z: 0, offset: { x: 3, y: -4 }, hidden: true },
        ],
      },
    };
    const result = validateProject(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const acc = result.project.accessories[0];
      expect(acc.shape).toBe('triangle');
      expect(acc.propId).toBe('projectile');
      expect(acc.hidden).toBe(true);
      const bone = result.project.customRig.bones[0];
      expect(bone.shape).toBe('triangle');
      expect(bone.offset).toEqual({ x: 3, y: -4 });
      expect(bone.hidden).toBe(true);
    }
  });

  it('conserva trazos (shape path + points) en accesorios y huesos', () => {
    const project = buildDefaultProject();
    const raw = {
      ...project,
      accessories: [
        {
          id: 'a1', name: 'Trazo', anchor: 'torsoTop', shape: 'path',
          offsetAlong: 0, offsetPerp: 0, angle: 0, length: 0, width: 6,
          color: '#000', opacity: 1, front: true,
          points: [{ x: 0, y: 0 }, { x: 5, y: -3 }, { x: 9, y: 2 }],
        },
      ],
      customRig: {
        ...project.customRig,
        bones: [
          { id: 'b1', name: 'Trazo', parentId: null, attach: 0, angle: 0, length: 0, width: 5, shape: 'path', curve: 0, color: null, z: 0, points: [{ x: 1, y: 1 }, { x: 4, y: 6 }] },
        ],
      },
    };
    const result = validateProject(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.project.accessories[0].shape).toBe('path');
      expect(result.project.accessories[0].points).toHaveLength(3);
      expect(result.project.customRig.bones[0].shape).toBe('path');
      expect(result.project.customRig.bones[0].points).toEqual([{ x: 1, y: 1 }, { x: 4, y: 6 }]);
    }
  });
});
