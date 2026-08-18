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
});
