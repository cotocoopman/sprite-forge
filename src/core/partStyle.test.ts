import { describe, it, expect } from 'vitest';
import { buildSkeleton, DEFAULT_CHARACTER, NEUTRAL_POSE } from './rig';
import type { PartsConfig } from './poses';
import { DEFAULT_PARTS, DEFAULT_RENDER } from './poses';
import { partScales, skeletonToPrimitives } from './svg';

const withPart = (over: Partial<PartsConfig['torso']>, part: keyof PartsConfig = 'torso'): PartsConfig => ({
  ...DEFAULT_PARTS,
  [part]: { ...DEFAULT_PARTS[part], ...over },
});

describe('skeletonToPrimitives — grosor por parte', () => {
  const skel = buildSkeleton(DEFAULT_CHARACTER, NEUTRAL_POSE);

  it('widthScale duplica el grosor de la línea del torso', () => {
    const base = skeletonToPrimitives(skel, DEFAULT_RENDER);
    const scaled = skeletonToPrimitives(skel, DEFAULT_RENDER, withPart({ widthScale: 2 }));
    const baseLine = base.find((p) => p.kind === 'line' && p.part === 'torso');
    const scaledLine = scaled.find((p) => p.kind === 'line' && p.part === 'torso');
    expect(baseLine && baseLine.kind === 'line').toBe(true);
    expect(scaledLine && scaledLine.kind === 'line').toBe(true);
    if (baseLine?.kind === 'line' && scaledLine?.kind === 'line') {
      expect(scaledLine.width).toBeCloseTo(baseLine.width * 2, 4);
    }
  });
});

describe('skeletonToPrimitives — forma por parte', () => {
  const skel = buildSkeleton(DEFAULT_CHARACTER, NEUTRAL_POSE);

  it('shape rect convierte el torso en polígono', () => {
    const prims = skeletonToPrimitives(skel, DEFAULT_RENDER, withPart({ shape: 'rect' }));
    const torso = prims.filter((p) => p.part === 'torso');
    expect(torso.length).toBeGreaterThan(0);
    expect(torso.every((p) => p.kind === 'poly')).toBe(true);
  });

  it('shape circle en la cabeza sigue siendo círculo; triangle la vuelve polígono', () => {
    const circle = skeletonToPrimitives(skel, DEFAULT_RENDER, withPart({ shape: 'circle' }, 'head'));
    expect(circle.find((p) => p.part === 'head')?.kind).toBe('circle');
    const tri = skeletonToPrimitives(skel, DEFAULT_RENDER, withPart({ shape: 'triangle' }, 'head'));
    expect(tri.find((p) => p.part === 'head')?.kind).toBe('poly');
  });

  it('sin parts, todo es cápsula/círculo (comportamiento histórico)', () => {
    const prims = skeletonToPrimitives(skel, DEFAULT_RENDER);
    expect(prims.every((p) => p.kind === 'line' || p.kind === 'circle')).toBe(true);
  });
});

describe('partScales', () => {
  it('devuelve undefined cuando ninguna parte cambia de largo', () => {
    expect(partScales(DEFAULT_PARTS)).toBeUndefined();
    expect(partScales(undefined)).toBeUndefined();
  });

  it('extrae solo las partes con lengthScale distinto de 1', () => {
    const parts = withPart({ lengthScale: 1.5 }, 'legNear');
    const scales = partScales(parts);
    expect(scales?.legNear?.lengthScale).toBe(1.5);
    expect(scales?.torso).toBeUndefined();
  });
});
