// Exportación: rasterizado SVG → PNG en canvas y armado del ZIP.
// Única parte del core que toca el DOM (canvas/Image), permitido por diseño.

import JSZip from 'jszip';
import type { EffectsConfig, Project, RenderConfig } from './poses';
import { sampleClip } from './poses';
import type { CustomRig } from './customRig';
import { sampleRigClip } from './customRig';
import { renderCustomSheet, renderCustomSvg, renderSheet, renderSvg } from './svg';

export type ExportOptions = {
  readonly sheets: boolean;
  readonly frames: boolean;
  readonly svg: boolean;
  readonly manifest: boolean;
  readonly projectJson: boolean;
  readonly directions8: boolean; // generar las 8 direcciones (giro cada 45°)
  readonly godot: boolean;       // recurso SpriteFrames .tres para Godot 4
  readonly atlas: boolean;       // un único PNG con TODOS los frames + atlas.json
  readonly skins: readonly string[]; // variantes de color (una carpeta por color)
};

const DIRECTIONS_8 = [0, 45, 90, 135, 180, 225, 270, 315] as const;

export type ManifestAnimation = {
  readonly name: string;
  readonly frames: number;
  readonly fps: number;
  readonly loop: boolean;
  readonly sheet: string;
  readonly sheets?: readonly string[];
};

export type Manifest = {
  readonly cellSize: number;
  readonly directions: number;
  readonly animations: readonly ManifestAnimation[];
};

const safeName = (name: string): string =>
  name.trim().replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'unnamed';

const pad2 = (n: number): string => String(n).padStart(2, '0');

// Serializa un string SVG a un PNG Blob del tamaño dado, preservando alpha.
export const svgToPngBlob = (svg: string, width: number, height: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('No se pudo obtener el contexto 2D'));
        return;
      }
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('toBlob devolvió null'));
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo cargar el SVG como imagen'));
    };
    img.src = url;
  });

// Carga un string SVG como HTMLImageElement (para componer el atlas).
const svgToImage = (svg: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo cargar el SVG como imagen'));
    };
    img.src = url;
  });

const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob devolvió null'))), 'image/png');
  });

export type AtlasFrame = {
  readonly animation: string;
  readonly frame: number;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
};

// Compone un único PNG (grilla: una fila por animación) + su descripción JSON.
// `rows` = [{ name, svgs[] }] donde cada svg ya es un frame individual.
const buildAtlasFrom = async (
  rows: readonly { readonly name: string; readonly svgs: readonly string[] }[],
  cs: number,
): Promise<{ readonly blob: Blob; readonly json: object }> => {
  const cols = rows.reduce((m, r) => Math.max(m, r.svgs.length), 1);
  const canvas = document.createElement('canvas');
  canvas.width = cols * cs;
  canvas.height = rows.length * cs;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo obtener el contexto 2D');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const frames: AtlasFrame[] = [];
  for (let r = 0; r < rows.length; r += 1) {
    for (let c = 0; c < rows[r].svgs.length; c += 1) {
      const img = await svgToImage(rows[r].svgs[c]);
      ctx.drawImage(img, c * cs, r * cs, cs, cs);
      frames.push({ animation: rows[r].name, frame: c, x: c * cs, y: r * cs, w: cs, h: cs });
    }
  }
  const blob = await canvasToBlob(canvas);
  return { blob, json: { cellSize: cs, columns: cols, rows: rows.length, image: 'atlas.png', frames } };
};

export const buildManifest = (project: Project, dirCount: number): Manifest => ({
  cellSize: project.render.cellSize,
  directions: dirCount,
  animations: project.animations.map((clip) => {
    const b = safeName(clip.name);
    return {
      name: clip.name,
      frames: clip.frames,
      fps: clip.fps,
      loop: clip.loop,
      sheet: dirCount > 1 ? `sheets/${b}_d0.png` : `sheets/${b}.png`,
      ...(dirCount > 1
        ? { sheets: DIRECTIONS_8.map((_, k) => `sheets/${b}_d${k}.png`) }
        : {}),
    };
  }),
});

// Cuenta total de rasterizaciones para la barra de progreso.
const countRasterOps = (project: Project, options: ExportOptions, dirCount: number): number => {
  const wantSheets = options.sheets || options.godot;
  let total = 0;
  for (const clip of project.animations) {
    if (wantSheets) total += 1;
    if (options.frames) total += clip.frames;
  }
  return (total || 1) * dirCount;
};

// Genera un recurso SpriteFrames (.tres) de Godot 4 usando AtlasTexture sobre
// los sheets. Una animación por (clip × dirección). Asume que la carpeta
// exportada se coloca en res://<carpeta>/.
export const buildGodotSpriteFrames = (
  project: Project,
  directions: readonly number[],
  eightDir: boolean,
): string => {
  const folder = safeName(project.character.name);
  const cs = project.render.cellSize;

  const extLines: string[] = [];
  const subLines: string[] = [];
  const animBlocks: string[] = [];
  let extId = 0;
  let subCount = 0;

  for (let d = 0; d < directions.length; d += 1) {
    const suffix = eightDir ? `_d${d}` : '';
    for (const clip of project.animations) {
      const base = safeName(clip.name);
      extId += 1;
      const eid = `${extId}_${base}${suffix}`;
      extLines.push(
        `[ext_resource type="Texture2D" path="res://${folder}/sheets/${base}${suffix}.png" id="${eid}"]`,
      );

      const frameRefs: string[] = [];
      for (let i = 0; i < clip.frames; i += 1) {
        subCount += 1;
        const sid = `AtlasTexture_${base}${suffix}_${i}`;
        subLines.push(
          `[sub_resource type="AtlasTexture" id="${sid}"]\n` +
            `atlas = ExtResource("${eid}")\n` +
            `region = Rect2(${i * cs}, 0, ${cs}, ${cs})`,
        );
        frameRefs.push(`{\n"duration": 1.0,\n"texture": SubResource("${sid}")\n}`);
      }

      animBlocks.push(
        `{\n"frames": [${frameRefs.join(', ')}],\n"loop": ${clip.loop},\n"name": &"${base}${suffix}",\n"speed": ${clip.fps}.0\n}`,
      );
    }
  }

  const loadSteps = extLines.length + subCount + 1;
  return (
    `[gd_resource type="SpriteFrames" load_steps=${loadSteps} format=3]\n\n` +
    `${extLines.join('\n')}\n\n` +
    `${subLines.join('\n\n')}\n\n` +
    `[resource]\nanimations = [${animBlocks.join(', ')}]\n`
  );
};

export type ProgressCallback = (done: number, total: number) => void;

export const buildZip = async (
  project: Project,
  options: ExportOptions,
  onProgress?: ProgressCallback,
): Promise<Blob> => {
  const zip = new JSZip();
  const root = zip.folder(safeName(project.character.name)) ?? zip;
  const { cellSize } = project.render;
  const { effects } = project;
  // Accesorios apagados (hidden) no se exportan.
  const parts = project.parts;
  const accessories = project.accessories.filter((a) => !a.hidden);

  // Direcciones a rasterizar: las 8 (giro 3D cada 45°) o solo el facing actual.
  const directions = options.directions8 ? DIRECTIONS_8 : [project.render.facing];

  const skinOpsPerColor = (() => {
    let s = 0;
    for (const clip of project.animations) {
      if (options.sheets) s += 1;
      if (options.frames) s += clip.frames;
    }
    return s;
  })();
  const total =
    countRasterOps(project, options, directions.length) +
    options.skins.length * skinOpsPerColor +
    (options.atlas ? 1 : 0);
  let done = 0;
  const tick = (): void => {
    done += 1;
    onProgress?.(done, total);
  };

  for (let d = 0; d < directions.length; d += 1) {
    const render = { ...project.render, facing: directions[d] };
    const suffix = options.directions8 ? `_d${d}` : '';

    for (const clip of project.animations) {
      const poses = sampleClip(clip);
      const base = safeName(clip.name);

      if (options.sheets || options.godot) {
        const sheetSvg = renderSheet(project.character, poses, render, effects, parts, accessories);
        const blob = await svgToPngBlob(sheetSvg, cellSize * poses.length, cellSize);
        root.file(`sheets/${base}${suffix}.png`, blob);
        tick();
      }

      if (options.frames) {
        for (let i = 0; i < poses.length; i += 1) {
          const frameSvg = renderSvg(project.character, poses[i], render, effects, parts, accessories);
          const blob = await svgToPngBlob(frameSvg, cellSize, cellSize);
          root.file(`frames/${base}${suffix}_${pad2(i)}.png`, blob);
          tick();
        }
      }

      if (options.svg) {
        const oneSvg = renderSheet(project.character, poses, render, effects, parts, accessories);
        root.file(`svg/${base}${suffix}.svg`, oneSvg);
      }
    }
  }

  // Atlas: un único PNG con todos los frames (una fila por animación) + JSON.
  if (options.atlas) {
    const render = { ...project.render };
    const rows = project.animations.map((clip) => ({
      name: clip.name,
      svgs: sampleClip(clip).map((p) =>
        renderSvg(project.character, p, render, effects, parts, accessories),
      ),
    }));
    const { blob, json } = await buildAtlasFrom(rows, cellSize);
    root.file('atlas.png', blob);
    root.file('atlas.json', JSON.stringify(json, null, 2));
    tick();
  }

  // Variantes de color (skins): sheets/frames por color, en su propia carpeta.
  for (const color of options.skins) {
    const skinChar = { ...project.character, color };
    const skinRoot = root.folder(`skins/${safeName(color.replace('#', ''))}`) ?? root;
    const render = { ...project.render };
    for (const clip of project.animations) {
      const poses = sampleClip(clip);
      const base = safeName(clip.name);
      if (options.sheets) {
        const svg = renderSheet(skinChar, poses, render, effects, parts, accessories);
        skinRoot.file(`sheets/${base}.png`, await svgToPngBlob(svg, cellSize * poses.length, cellSize));
        tick();
      }
      if (options.frames) {
        for (let i = 0; i < poses.length; i += 1) {
          const svg = renderSvg(skinChar, poses[i], render, effects, parts, accessories);
          skinRoot.file(`frames/${base}_${pad2(i)}.png`, await svgToPngBlob(svg, cellSize, cellSize));
          tick();
        }
      }
    }
  }

  if (options.godot) {
    const tres = buildGodotSpriteFrames(project, directions, options.directions8);
    root.file(`${safeName(project.character.name)}.tres`, tres);
  }
  if (options.manifest) {
    root.file('manifest.json', JSON.stringify(buildManifest(project, directions.length), null, 2));
  }
  if (options.projectJson) {
    root.file('project.json', JSON.stringify(project, null, 2));
  }

  onProgress?.(total, total);
  return zip.generateAsync({ type: 'blob' });
};

// Recurso Godot 4 (SpriteFrames) para un rig personalizado. Soporta 8 direcciones
// (una animación por clip × dirección, con sufijo _d0.._d7).
const buildGodotRig = (
  rig: CustomRig,
  folder: string,
  cs: number,
  directions: readonly number[],
  eightDir: boolean,
): string => {
  const extLines: string[] = [];
  const subLines: string[] = [];
  const animBlocks: string[] = [];
  let subCount = 0;
  let extId = 0;
  for (let d = 0; d < directions.length; d += 1) {
    const suffix = eightDir ? `_d${d}` : '';
    rig.animations.forEach((clip) => {
      const base = safeName(clip.name);
      extId += 1;
      const eid = `${extId}_${base}${suffix}`;
      extLines.push(`[ext_resource type="Texture2D" path="res://${folder}/sheets/${base}${suffix}.png" id="${eid}"]`);
      const frameRefs: string[] = [];
      for (let i = 0; i < clip.frames; i += 1) {
        subCount += 1;
        const sid = `AtlasTexture_${base}${suffix}_${i}`;
        subLines.push(
          `[sub_resource type="AtlasTexture" id="${sid}"]\natlas = ExtResource("${eid}")\nregion = Rect2(${i * cs}, 0, ${cs}, ${cs})`,
        );
        frameRefs.push(`{\n"duration": 1.0,\n"texture": SubResource("${sid}")\n}`);
      }
      animBlocks.push(
        `{\n"frames": [${frameRefs.join(', ')}],\n"loop": ${clip.loop},\n"name": &"${base}${suffix}",\n"speed": ${clip.fps}.0\n}`,
      );
    });
  }
  const loadSteps = extLines.length + subCount + 1;
  return (
    `[gd_resource type="SpriteFrames" load_steps=${loadSteps} format=3]\n\n` +
    `${extLines.join('\n')}\n\n${subLines.join('\n\n')}\n\n` +
    `[resource]\nanimations = [${animBlocks.join(', ')}]\n`
  );
};

// Arma el ZIP de un rig personalizado animado (sheets/frames/svg/manifest/godot).
// El "giro 3D" del rig es una rotación en el plano (útil para top-down).
export const buildRigZip = async (
  rig: CustomRig,
  render: RenderConfig,
  options: ExportOptions,
  onProgress?: ProgressCallback,
  effects?: EffectsConfig,
): Promise<Blob> => {
  const zip = new JSZip();
  const folder = safeName(rig.name);
  const root = zip.folder(folder) ?? zip;
  const cs = render.cellSize;

  const directions = options.directions8 ? DIRECTIONS_8 : [render.facing];
  const eightDir = options.directions8;

  let perDir = 0;
  for (const clip of rig.animations) {
    if (options.sheets || options.godot) perDir += 1;
    if (options.frames) perDir += clip.frames;
  }
  const skinOpsPerColor = rig.animations.reduce(
    (s, clip) => s + (options.sheets ? 1 : 0) + (options.frames ? clip.frames : 0),
    0,
  );
  const total =
    (perDir * directions.length + options.skins.length * skinOpsPerColor + (options.atlas ? 1 : 0)) || 1;
  let done = 0;
  const tick = (): void => {
    done += 1;
    onProgress?.(done, total);
  };

  for (let d = 0; d < directions.length; d += 1) {
    const rr = { ...render, facing: directions[d] };
    const suffix = eightDir ? `_d${d}` : '';
    for (const clip of rig.animations) {
      const poses = sampleRigClip(clip);
      const base = safeName(clip.name);
      if (options.sheets || options.godot) {
        const blob = await svgToPngBlob(renderCustomSheet(rig, poses, rr, effects), cs * poses.length, cs);
        root.file(`sheets/${base}${suffix}.png`, blob);
        tick();
      }
      if (options.frames) {
        for (let i = 0; i < poses.length; i += 1) {
          const blob = await svgToPngBlob(renderCustomSvg(rig, rr, poses[i], effects), cs, cs);
          root.file(`frames/${base}${suffix}_${pad2(i)}.png`, blob);
          tick();
        }
      }
      if (options.svg) {
        root.file(`svg/${base}${suffix}.svg`, renderCustomSheet(rig, poses, rr, effects));
      }
    }
  }

  if (options.atlas) {
    const rows = rig.animations.map((clip) => ({
      name: clip.name,
      svgs: sampleRigClip(clip).map((p) => renderCustomSvg(rig, render, p, effects)),
    }));
    const { blob, json } = await buildAtlasFrom(rows, cs);
    root.file('atlas.png', blob);
    root.file('atlas.json', JSON.stringify(json, null, 2));
    tick();
  }

  for (const color of options.skins) {
    const skinRig = { ...rig, color };
    const skinRoot = root.folder(`skins/${safeName(color.replace('#', ''))}`) ?? root;
    for (const clip of rig.animations) {
      const poses = sampleRigClip(clip);
      const base = safeName(clip.name);
      if (options.sheets) {
        skinRoot.file(`sheets/${base}.png`, await svgToPngBlob(renderCustomSheet(skinRig, poses, render, effects), cs * poses.length, cs));
        tick();
      }
      if (options.frames) {
        for (let i = 0; i < poses.length; i += 1) {
          skinRoot.file(`frames/${base}_${pad2(i)}.png`, await svgToPngBlob(renderCustomSvg(skinRig, render, poses[i], effects), cs, cs));
          tick();
        }
      }
    }
  }

  if (options.godot) {
    root.file(`${folder}.tres`, buildGodotRig(rig, folder, cs, directions, eightDir));
  }
  if (options.manifest) {
    const manifest = {
      cellSize: cs,
      directions: directions.length,
      animations: rig.animations.map((c) => {
        const b = safeName(c.name);
        return {
          name: c.name,
          frames: c.frames,
          fps: c.fps,
          loop: c.loop,
          sheet: eightDir ? `sheets/${b}_d0.png` : `sheets/${b}.png`,
          ...(eightDir ? { sheets: DIRECTIONS_8.map((_, k) => `sheets/${b}_d${k}.png`) } : {}),
        };
      }),
    };
    root.file('manifest.json', JSON.stringify(manifest, null, 2));
  }
  if (options.projectJson) {
    root.file('rig.json', JSON.stringify(rig, null, 2));
  }

  onProgress?.(total, total);
  return zip.generateAsync({ type: 'blob' });
};

// Dispara la descarga de un Blob en el browser.
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const exportProjectJson = (project: Project): void => {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${safeName(project.character.name)}.json`);
};
