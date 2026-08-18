import { describe, it, expect } from 'vitest';
import { buildSkeleton, NEUTRAL_POSE } from './rig';
import { buildDefaultProject, DEFAULT_PARTS } from './poses';
import type { Accessory } from './poses';
import { accessoriesToPrimitives, renderSvg } from './svg';

const project = buildDefaultProject();

const sampleAccessory: Accessory = {
  id: 'a1',
  name: 'espada',
  anchor: 'handNear',
  shape: 'capsule',
  offsetAlong: 0,
  offsetPerp: 0,
  angle: 0,
  length: 12,
  width: 3,
  color: '#123456',
  opacity: 1,
  front: true,
};

describe('renderSvg — partes', () => {
  it('incluye el círculo de la cabeza cuando es visible', () => {
    const svg = renderSvg(project.character, NEUTRAL_POSE, project.render, project.effects, project.parts);
    expect(svg).toContain('<circle');
  });

  it('omite la cabeza en el export cuando está oculta', () => {
    const parts = { ...DEFAULT_PARTS, head: { visible: false, color: null } };
    const svg = renderSvg(project.character, NEUTRAL_POSE, project.render, project.effects, parts);
    expect(svg).not.toContain('<circle');
  });

  it('aplica un color por parte', () => {
    const parts = { ...DEFAULT_PARTS, torso: { visible: true, color: '#ff0000' } };
    const svg = renderSvg(project.character, NEUTRAL_POSE, project.render, project.effects, parts);
    expect(svg).toContain('#ff0000');
  });
});

describe('accesorios', () => {
  it('genera una primitiva anclada', () => {
    const skel = buildSkeleton(project.character, NEUTRAL_POSE, 0);
    const prims = accessoriesToPrimitives([sampleAccessory], skel.anchors, project.render);
    expect(prims).toHaveLength(1);
    expect(prims[0].color).toBe('#123456');
  });

  it('renderSvg incluye el accesorio', () => {
    const svg = renderSvg(
      project.character,
      NEUTRAL_POSE,
      project.render,
      project.effects,
      project.parts,
      [sampleAccessory],
    );
    expect(svg).toContain('#123456');
  });

  it('un accesorio con ancla inválida no se coloca (se ignora)', () => {
    const skel = buildSkeleton(project.character, NEUTRAL_POSE, 0);
    const prims = accessoriesToPrimitives(
      [{ ...sampleAccessory, anchor: 'nope' as Accessory['anchor'] }],
      skel.anchors,
      project.render,
    );
    expect(prims).toHaveLength(0);
  });
});
