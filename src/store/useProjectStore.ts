import { create } from 'zustand';
import type { AnchorName, CharacterDefinition, CurveTarget, PartName, Pose } from '@core/rig';
import { DEFAULT_CHARACTER, NEUTRAL_POSE, PART_NAMES } from '@core/rig';
import { PROP_TEMPLATES, rotatePropParts } from '@core/props';
import type {
  Accessory,
  AccessoryShape,
  AnimationClip,
  EasingKind,
  GlowConfig,
  OutlineConfig,
  PartsConfig,
  Project,
  RigMode,
  ShadowConfig,
} from '@core/poses';
import type { Bone, CustomRig, RigClip, RigPose } from '@core/customRig';
import { rigPoseAt } from '@core/customRig';
import type { Lang } from '@/i18n';
import { buildDefaultProject, poseAt } from '@core/poses';
import { validateProject } from '@core/validation';
import { CHARACTER_TEMPLATES, randomCharacter } from '@core/templates';

const PROJECT_KEY = 'sprite-forge_project';
const PRESETS_KEY = 'sprite-forge_presets';
const LANG_KEY = 'sprite-forge_lang';
const REF_KEY = 'sprite-forge_ref';

type RefState = { image: string | null; opacity: number; scale: number; visible: boolean };

const loadRef = (): RefState => {
  try {
    const raw = localStorage.getItem(REF_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<RefState>;
      return {
        image: typeof p.image === 'string' ? p.image : null,
        opacity: typeof p.opacity === 'number' ? p.opacity : 0.5,
        scale: typeof p.scale === 'number' ? p.scale : 1,
        visible: typeof p.visible === 'boolean' ? p.visible : true,
      };
    }
  } catch {
    /* ignora */
  }
  return { image: null, opacity: 0.5, scale: 1, visible: true };
};

const loadLang = (): Lang => {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === 'es' || stored === 'en') return stored;
    return (navigator.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
  } catch {
    return 'en';
  }
};

export type CharacterPreset = {
  readonly id: string;
  readonly name: string;
  readonly character: CharacterDefinition;
};

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export type Notification = {
  readonly open: boolean;
  readonly type: NotificationType;
  readonly message: string;
};

export const genId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

// Herramienta activa del canvas (barra superior estilo editor de dibujo).
export type DrawTool = 'select' | 'pencil' | 'shape' | 'eraser';

// Portapapeles de objeto (accesorio o hueso), a nivel de módulo (no reactivo).
type ClipboardItem = { kind: 'acc'; data: Accessory } | { kind: 'bone'; data: Bone } | null;
let clipboard: ClipboardItem = null;

const flipPoints = (
  pts: readonly { x: number; y: number }[] | undefined,
  axis: 'h' | 'v',
): { x: number; y: number }[] | undefined =>
  pts?.map((p) => (axis === 'h' ? { x: p.x, y: -p.y } : { x: -p.x, y: p.y }));

const loadProject = (): Project => {
  try {
    const raw = localStorage.getItem(PROJECT_KEY);
    if (raw) {
      const result = validateProject(JSON.parse(raw));
      if (result.ok) return result.project;
    }
  } catch {
    /* ignora — cae al default */
  }
  return buildDefaultProject();
};

const loadPresets = (): CharacterPreset[] => {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as CharacterPreset[];
    }
  } catch {
    /* ignora */
  }
  return [];
};

export type ProjectState = {
  readonly project: Project;
  readonly activeAnimationId: string;
  readonly activeKeyframeIndex: number;
  readonly currentFrame: number;
  readonly isPlaying: boolean;
  readonly copiedPose: Pose | null;
  readonly presets: readonly CharacterPreset[];
  readonly notification: Notification;

  // Personaje
  readonly setCharacterField: (key: keyof CharacterDefinition, value: number) => void;
  readonly setColor: (color: string) => void;
  readonly setName: (name: string) => void;
  readonly resetCharacter: () => void;
  readonly randomizeCharacter: () => void;
  readonly applyHumanoidTemplate: (id: string) => void;
  readonly applyCharacter: (character: CharacterDefinition) => void;
  readonly setArmCurveTarget: (target: CurveTarget) => void;
  readonly setLegCurveTarget: (target: CurveTarget) => void;

  // Partes (visibilidad + color + forma/tamaño por parte)
  readonly activePartName: PartName | null;
  readonly selectPart: (part: PartName | null) => void;
  readonly togglePartVisible: (part: PartName) => void;
  readonly setPartColor: (part: PartName, color: string) => void;
  readonly resetPartColor: (part: PartName) => void;
  readonly setPartName: (part: PartName, name: string) => void;
  readonly setPartShape: (part: PartName, shape: AccessoryShape) => void;
  readonly setPartWidthScale: (part: PartName, scale: number) => void;
  readonly setPartLengthScale: (part: PartName, scale: number) => void;
  readonly resetPartSize: (part: PartName) => void;

  // Accesorios
  readonly activeAccessoryId: string | null;
  readonly addAccessory: () => void;
  readonly addProp: (templateId: string, anchor: AnchorName) => void;
  readonly toggleProp: (templateId: string, anchor: AnchorName) => void;
  readonly duplicateActiveProp: () => void;
  readonly updateAccessory: (id: string, patch: Partial<Accessory>) => void;
  readonly duplicateAccessory: (id: string) => void;
  readonly removeAccessory: (id: string) => void;
  readonly reorderAccessory: (id: string, delta: number) => void;
  readonly moveAccessoryToIndex: (id: string, toFrontIndex: number) => void;
  readonly insertAccessory: (acc: Accessory) => void;
  readonly selectAccessory: (id: string | null) => void;

  // Herramientas de dibujo en el canvas
  readonly tool: DrawTool;
  readonly shapeKind: AccessoryShape;
  readonly brushWidth: number;
  readonly setTool: (tool: DrawTool) => void;
  readonly setShapeKind: (shape: AccessoryShape) => void;
  readonly setBrushWidth: (w: number) => void;

  // Edición de objeto (accesorio en humanoide / hueso en custom, según modo)
  readonly copySelected: () => void;
  readonly cutSelected: () => void;
  readonly pasteClipboard: () => void;
  readonly duplicateSelected: () => void;
  readonly deleteSelected: () => void;
  readonly flipSelected: (axis: 'h' | 'v') => void;

  // Modo / rig personalizado
  readonly setMode: (mode: RigMode) => void;
  readonly activeBoneId: string | null;
  readonly selectBone: (id: string | null) => void;
  readonly addBone: () => void;
  readonly updateBone: (id: string, patch: Partial<Bone>) => void;
  readonly removeBone: (id: string) => void;
  readonly toggleBoneVisible: (id: string) => void;
  readonly reorderBone: (id: string, delta: number) => void;
  readonly moveBoneToIndex: (id: string, toFrontIndex: number) => void;
  readonly duplicateBone: (id: string) => void;
  readonly insertBone: (bone: Bone) => void;
  readonly setRigField: (patch: { name?: string; color?: string; originX?: number; originY?: number }) => void;
  readonly resetAllBoneColors: () => void;
  readonly loadRigPreset: (rig: CustomRig) => void;

  // Animación del rig personalizado (fase 2)
  readonly activeRigClipId: string | null;
  readonly activeRigKeyframeIndex: number;
  readonly selectRigClip: (id: string) => void;
  readonly addRigClip: () => void;
  readonly duplicateRigClip: (id: string) => void;
  readonly renameRigClip: (id: string, name: string) => void;
  readonly deleteRigClip: (id: string) => void;
  readonly setRigClipFrames: (frames: number) => void;
  readonly setRigClipFps: (fps: number) => void;
  readonly setRigClipLoop: (loop: boolean) => void;
  readonly selectRigKeyframe: (index: number) => void;
  readonly addRigKeyframeAt: (t: number) => void;
  readonly duplicateRigKeyframe: (index: number) => void;
  readonly deleteRigKeyframe: (index: number) => void;
  readonly moveRigKeyframe: (index: number, t: number) => void;
  readonly setRigKeyframeEasing: (index: number, easing: EasingKind) => void;
  readonly setBoneAngleOffset: (boneId: string, value: number) => void;

  // Render
  readonly setRenderField: (
    key: 'cellSize' | 'characterHeightRatio' | 'groundRatio' | 'rotation',
    value: number,
  ) => void;
  readonly toggleFlip: () => void;
  readonly setRotation: (deg: number) => void;
  readonly setFacing: (deg: number) => void;

  // Efectos
  readonly setShadow: (patch: Partial<ShadowConfig>) => void;
  readonly setGlow: (patch: Partial<GlowConfig>) => void;
  readonly setOutline: (patch: Partial<OutlineConfig>) => void;

  // Imagen de referencia (no forma parte del proyecto exportado)
  readonly refImage: string | null;
  readonly refOpacity: number;
  readonly refScale: number;
  readonly refVisible: boolean;
  readonly setRefImage: (dataUrl: string | null) => void;
  readonly setRefOpacity: (v: number) => void;
  readonly setRefScale: (v: number) => void;
  readonly toggleRefVisible: () => void;

  // Animaciones
  readonly selectAnimation: (id: string) => void;
  readonly addAnimation: () => void;
  readonly importAnimations: (clips: readonly AnimationClip[]) => void;
  readonly importRigClips: (clips: readonly RigClip[]) => void;
  readonly duplicateAnimation: (id: string) => void;
  readonly renameAnimation: (id: string, name: string) => void;
  readonly deleteAnimation: (id: string) => void;
  readonly setClipFrames: (frames: number) => void;
  readonly setClipFps: (fps: number) => void;
  readonly setClipLoop: (loop: boolean) => void;

  // Reproducción
  readonly setCurrentFrame: (frame: number) => void;
  readonly setPlaying: (playing: boolean) => void;
  readonly togglePlay: () => void;
  readonly nextFrame: () => void;
  readonly prevFrame: () => void;

  // Keyframes
  readonly selectKeyframe: (index: number) => void;
  readonly addKeyframeAt: (t: number) => void;
  readonly duplicateKeyframe: (index: number) => void;
  readonly deleteKeyframe: (index: number) => void;
  readonly moveKeyframe: (index: number, t: number) => void;
  readonly setKeyframeEasing: (index: number, easing: EasingKind) => void;

  // Pose
  readonly setPoseField: (key: keyof Pose, value: number) => void;
  readonly mirrorPose: () => void;
  readonly copyPose: () => void;
  readonly pastePose: () => void;

  // Presets
  readonly savePreset: (name: string) => void;
  readonly applyPreset: (id: string) => void;
  readonly deletePreset: (id: string) => void;

  // Proyecto
  readonly importProject: (project: Project) => void;
  readonly resetProject: () => void;

  // Historial (undo / redo)
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly undo: () => void;
  readonly redo: () => void;

  // Notificaciones
  readonly notify: (message: string, type?: NotificationType) => void;
  readonly hideNotification: () => void;

  // Idioma
  readonly lang: Lang;
  readonly setLang: (lang: Lang) => void;
};

const initialProject = loadProject();

// --- Historial. Los cambios rápidos (arrastrar un slider) se coalescen en un
// solo paso: se captura el snapshot previo al inicio de la ráfaga y se confirma
// tras HISTORY_DEBOUNCE ms de inactividad. ---
const HISTORY_DEBOUNCE = 450;
const HISTORY_LIMIT = 100;
let historyPast: Project[] = [];
let historyFuture: Project[] = [];
let historyPending: Project | null = null;
let historyTimer: ReturnType<typeof setTimeout> | null = null;
let timeTraveling = false;

const clampFrame = (frame: number, frames: number): number =>
  Math.max(0, Math.min(frames - 1, frame));

// Intercambia los valores cercano ↔ lejano de una pose.
const mirror = (p: Pose): Pose => ({
  ...p,
  armFarUpper: p.armNearUpper,
  armFarLower: p.armNearLower,
  armNearUpper: p.armFarUpper,
  armNearLower: p.armFarLower,
  legFarUpper: p.legNearUpper,
  legFarLower: p.legNearLower,
  legNearUpper: p.legFarUpper,
  legNearLower: p.legFarLower,
});

export const useProjectStore = create<ProjectState>((set, get) => {
  // Reemplaza el clip activo aplicando un updater inmutable.
  const updateActiveClip = (updater: (clip: AnimationClip) => AnimationClip): void => {
    set((s) => {
      const animations = s.project.animations.map((c) =>
        c.id === s.activeAnimationId ? updater(c) : c,
      );
      return { project: { ...s.project, animations } };
    });
  };

  const updateActivePose = (updater: (pose: Pose) => Pose): void => {
    const { activeKeyframeIndex } = get();
    updateActiveClip((clip) => {
      if (activeKeyframeIndex < 0 || activeKeyframeIndex >= clip.keyframes.length) return clip;
      const keyframes = clip.keyframes.map((kf, i) =>
        i === activeKeyframeIndex ? { ...kf, pose: updater(kf.pose) } : kf,
      );
      return { ...clip, keyframes };
    });
  };

  // --- Rig personalizado (animación) ---
  const updateActiveRigClip = (updater: (clip: RigClip) => RigClip): void => {
    set((s) => {
      const animations = s.project.customRig.animations.map((c) =>
        c.id === s.activeRigClipId ? updater(c) : c,
      );
      return { project: { ...s.project, customRig: { ...s.project.customRig, animations } } };
    });
  };

  const updateActiveRigPose = (updater: (pose: RigPose) => RigPose): void => {
    const idx = get().activeRigKeyframeIndex;
    updateActiveRigClip((clip) => {
      if (idx < 0 || idx >= clip.keyframes.length) return clip;
      const keyframes = clip.keyframes.map((kf, i) => (i === idx ? { ...kf, pose: updater(kf.pose) } : kf));
      return { ...clip, keyframes };
    });
  };

  const activeRigClip = (): RigClip | undefined =>
    get().project.customRig.animations.find((c) => c.id === get().activeRigClipId);

  // Frames del clip activo según el modo (humanoide o rig).
  const framesFor = (s: ProjectState): number => {
    if (s.project.mode === 'custom') {
      const clip = s.project.customRig.animations.find((c) => c.id === s.activeRigClipId);
      return clip?.frames ?? 1;
    }
    const clip = s.project.animations.find((c) => c.id === s.activeAnimationId);
    return clip?.frames ?? 1;
  };

  // Restaura un proyecto del historial, re-anclando índices/selección de forma segura.
  const restoreState = (p: Project): Partial<ProjectState> => {
    const st = get();
    const animExists = p.animations.some((a) => a.id === st.activeAnimationId);
    const activeAnimationId = animExists ? st.activeAnimationId : p.animations[0]?.id ?? '';
    const clip = p.animations.find((a) => a.id === activeAnimationId);
    const kfLen = clip?.keyframes.length ?? 0;
    const frames = clip?.frames ?? 1;
    return {
      project: p,
      activeAnimationId,
      activeKeyframeIndex: Math.max(0, Math.min(st.activeKeyframeIndex, kfLen - 1)),
      currentFrame: Math.max(0, Math.min(st.currentFrame, frames - 1)),
      isPlaying: false,
    };
  };

  return {
    project: initialProject,
    canUndo: false,
    canRedo: false,
    activeAnimationId: initialProject.animations[0]?.id ?? '',
    activeKeyframeIndex: 0,
    currentFrame: 0,
    isPlaying: false,
    copiedPose: null,
    presets: loadPresets(),
    notification: { open: false, type: 'info', message: '' },
    activeRigClipId: initialProject.customRig.animations[0]?.id ?? null,
    activeRigKeyframeIndex: 0,

    setCharacterField: (key, value) =>
      set((s) => ({ project: { ...s.project, character: { ...s.project.character, [key]: value } } })),

    setColor: (color) =>
      set((s) => ({ project: { ...s.project, character: { ...s.project.character, color } } })),

    setName: (name) =>
      set((s) => ({ project: { ...s.project, character: { ...s.project.character, name } } })),

    resetCharacter: () =>
      set((s) => ({
        project: {
          ...s.project,
          character: { ...DEFAULT_CHARACTER, id: s.project.character.id, name: s.project.character.name },
        },
      })),

    randomizeCharacter: () =>
      set((s) => ({
        project: {
          ...s.project,
          character: { ...randomCharacter(), id: s.project.character.id },
        },
      })),

    applyHumanoidTemplate: (id) => {
      const tpl = CHARACTER_TEMPLATES.find((t) => t.id === id);
      if (!tpl) return;
      const character = { ...tpl.build(), id: get().project.character.id };
      const accessories: Accessory[] = (tpl.accessories ?? []).map((a) => ({ ...a, id: genId() }));
      const hidden = new Set(tpl.hiddenParts ?? []);
      const parts = PART_NAMES.reduce((accP, name) => {
        accP[name] = { visible: !hidden.has(name), color: null };
        return accP;
      }, {} as PartsConfig);
      set((s) => ({
        project: { ...s.project, character, accessories, parts },
        activeAccessoryId: accessories[accessories.length - 1]?.id ?? null,
      }));
      get().notify('Plantilla aplicada', 'success');
    },

    applyCharacter: (character) =>
      set((s) => ({ project: { ...s.project, character } })),

    setArmCurveTarget: (target) =>
      set((s) => ({ project: { ...s.project, character: { ...s.project.character, armCurveTarget: target } } })),

    setLegCurveTarget: (target) =>
      set((s) => ({ project: { ...s.project, character: { ...s.project.character, legCurveTarget: target } } })),

    activePartName: null,

    // Seleccionar una parte deselecciona el accesorio activo (y viceversa) para
    // que el canvas y los editores muestren un solo objeto activo a la vez.
    selectPart: (part) => set({ activePartName: part, ...(part ? { activeAccessoryId: null } : {}) }),

    togglePartVisible: (part) =>
      set((s) => ({
        project: {
          ...s.project,
          parts: {
            ...s.project.parts,
            [part]: { ...s.project.parts[part], visible: !s.project.parts[part].visible },
          },
        },
      })),

    setPartShape: (part, shape) =>
      set((s) => ({
        project: {
          ...s.project,
          parts: { ...s.project.parts, [part]: { ...s.project.parts[part], shape } },
        },
      })),

    setPartWidthScale: (part, scale) =>
      set((s) => ({
        project: {
          ...s.project,
          parts: {
            ...s.project.parts,
            [part]: { ...s.project.parts[part], widthScale: Math.min(4, Math.max(0.1, scale)) },
          },
        },
      })),

    setPartLengthScale: (part, scale) =>
      set((s) => ({
        project: {
          ...s.project,
          parts: {
            ...s.project.parts,
            [part]: { ...s.project.parts[part], lengthScale: Math.min(4, Math.max(0.1, scale)) },
          },
        },
      })),

    resetPartSize: (part) =>
      set((s) => {
        const { widthScale: _w, lengthScale: _l, shape: _s, ...rest } = s.project.parts[part];
        return {
          project: { ...s.project, parts: { ...s.project.parts, [part]: rest } },
        };
      }),

    setPartColor: (part, color) =>
      set((s) => ({
        project: {
          ...s.project,
          parts: { ...s.project.parts, [part]: { ...s.project.parts[part], color } },
        },
      })),

    resetPartColor: (part) =>
      set((s) => ({
        project: {
          ...s.project,
          parts: { ...s.project.parts, [part]: { ...s.project.parts[part], color: null } },
        },
      })),

    setPartName: (part, name) =>
      set((s) => ({
        project: {
          ...s.project,
          parts: { ...s.project.parts, [part]: { ...s.project.parts[part], name } },
        },
      })),

    activeAccessoryId: null,

    addAccessory: () => {
      const id = genId();
      const acc: Accessory = {
        id,
        name: 'accessory',
        anchor: 'handNear',
        shape: 'capsule',
        offsetAlong: 0,
        offsetPerp: 0,
        angle: 0,
        length: 14,
        width: 3,
        color: get().project.character.color,
        opacity: 1,
        front: true,
      };
      set((s) => ({
        project: { ...s.project, accessories: [...s.project.accessories, acc] },
        activeAccessoryId: id,
      }));
    },

    addProp: (templateId, anchor) => {
      const tpl = PROP_TEMPLATES.find((p) => p.id === templateId);
      if (!tpl) return;
      // Al empuñar, reorientar el arma con handSpin (no afecta la versión suelta).
      const parts = tpl.handSpin ? rotatePropParts(tpl.parts, tpl.handSpin) : tpl.parts;
      const accs: Accessory[] = parts.map((p) => ({
        ...p,
        id: genId(),
        anchor: p.anchor ?? anchor,
        name: `${tpl.name}-${p.name}`,
        propId: templateId,
        hidden: false,
      }));
      set((s) => ({
        project: { ...s.project, accessories: [...s.project.accessories, ...accs] },
        activeAccessoryId: accs[accs.length - 1]?.id ?? s.activeAccessoryId,
      }));
      get().notify('Prop agregado', 'success');
    },

    // Click en la galería: si el prop no está, lo agrega; si está, alterna su
    // visibilidad (apagado = translúcido en editor, excluido del export).
    toggleProp: (templateId, anchor) => {
      const group = get().project.accessories.filter((a) => a.propId === templateId);
      if (group.length === 0) {
        get().addProp(templateId, anchor);
        return;
      }
      const nextHidden = !group[0].hidden;
      set((s) => ({
        project: {
          ...s.project,
          accessories: s.project.accessories.map((a) =>
            a.propId === templateId ? { ...a, hidden: nextHidden } : a,
          ),
        },
      }));
    },

    // Duplica el arma/prop del accesorio activo (todas sus piezas), como copia
    // independiente que se puede reposicionar.
    duplicateActiveProp: () => {
      const s = get().project;
      const active = s.accessories.find((a) => a.id === get().activeAccessoryId);
      if (!active) return;
      const group = active.propId
        ? s.accessories.filter((a) => a.propId === active.propId)
        : [active];
      const newGroup = active.propId ? genId() : undefined;
      const copies: Accessory[] = group.map((a) => ({
        ...a,
        id: genId(),
        propId: newGroup,
        offsetPerp: a.offsetPerp + 4,
      }));
      set((st) => ({
        project: { ...st.project, accessories: [...st.project.accessories, ...copies] },
        activeAccessoryId: copies[copies.length - 1]?.id ?? st.activeAccessoryId,
      }));
      get().notify('Prop duplicado', 'success');
    },

    updateAccessory: (id, patch) =>
      set((s) => ({
        project: {
          ...s.project,
          accessories: s.project.accessories.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        },
      })),

    duplicateAccessory: (id) => {
      const src = get().project.accessories.find((a) => a.id === id);
      if (!src) return;
      const newId = genId();
      set((s) => ({
        project: {
          ...s.project,
          accessories: [...s.project.accessories, { ...src, id: newId, name: `${src.name}_copy` }],
        },
        activeAccessoryId: newId,
      }));
    },

    removeAccessory: (id) =>
      set((s) => ({
        project: { ...s.project, accessories: s.project.accessories.filter((a) => a.id !== id) },
        activeAccessoryId: s.activeAccessoryId === id ? null : s.activeAccessoryId,
      })),

    // Reordena un accesorio en el array (= orden de dibujo dentro de su capa).
    reorderAccessory: (id, delta) =>
      set((s) => {
        const arr = [...s.project.accessories];
        const pos = arr.findIndex((a) => a.id === id);
        const swap = pos + delta;
        if (pos < 0 || swap < 0 || swap >= arr.length) return {};
        [arr[pos], arr[swap]] = [arr[swap], arr[pos]];
        return { project: { ...s.project, accessories: arr } };
      }),

    // Reordena por drag: mueve el accesorio a una posición del listado "de frente
    // hacia atrás" (índice 0 = más al frente). El array se guarda en orden inverso.
    moveAccessoryToIndex: (id, toFrontIndex) =>
      set((s) => {
        const front = [...s.project.accessories].reverse();
        const from = front.findIndex((a) => a.id === id);
        if (from < 0) return {};
        const [moved] = front.splice(from, 1);
        front.splice(Math.max(0, Math.min(front.length, toFrontIndex)), 0, moved);
        return { project: { ...s.project, accessories: front.reverse() } };
      }),

    insertAccessory: (acc) =>
      set((s) => ({
        project: { ...s.project, accessories: [...s.project.accessories, acc] },
        activeAccessoryId: acc.id,
      })),

    selectAccessory: (id) => set({ activeAccessoryId: id, ...(id ? { activePartName: null } : {}) }),

    tool: 'select',
    shapeKind: 'rect',
    brushWidth: 6,
    setTool: (tool) => set({ tool }),
    setShapeKind: (shapeKind) => set({ shapeKind }),
    setBrushWidth: (brushWidth) => set({ brushWidth }),

    copySelected: () => {
      const s = get();
      if (s.project.mode === 'custom') {
        const b = s.project.customRig.bones.find((x) => x.id === s.activeBoneId);
        if (b) clipboard = { kind: 'bone', data: b };
      } else {
        const a = s.project.accessories.find((x) => x.id === s.activeAccessoryId);
        if (a) clipboard = { kind: 'acc', data: a };
      }
    },

    cutSelected: () => {
      get().copySelected();
      get().deleteSelected();
    },

    pasteClipboard: () => {
      const mode = get().project.mode;
      if (!clipboard) return;
      if (mode === 'custom' && clipboard.kind === 'bone') {
        const src = clipboard.data;
        const off = src.offset ?? { x: 0, y: 0 };
        get().insertBone({ ...src, id: genId(), name: `${src.name} copia`, parentId: null, offset: { x: off.x + 6, y: off.y + 6 } });
      } else if (mode !== 'custom' && clipboard.kind === 'acc') {
        const src = clipboard.data;
        get().insertAccessory({ ...src, id: genId(), name: `${src.name} copia`, offsetAlong: src.offsetAlong + 4, offsetPerp: src.offsetPerp + 4, propId: undefined });
      }
    },

    duplicateSelected: () => {
      get().copySelected();
      get().pasteClipboard();
    },

    deleteSelected: () => {
      const s = get();
      if (s.project.mode === 'custom') {
        if (s.activeBoneId) s.removeBone(s.activeBoneId);
      } else if (s.activeAccessoryId) {
        s.removeAccessory(s.activeAccessoryId);
      }
    },

    flipSelected: (axis) => {
      const s = get();
      if (s.project.mode === 'custom') {
        const b = s.project.customRig.bones.find((x) => x.id === s.activeBoneId);
        if (!b) return;
        s.updateBone(b.id, {
          angle: axis === 'h' ? -b.angle : 180 - b.angle,
          ...(b.points ? { points: flipPoints(b.points, axis) } : {}),
        });
      } else {
        const a = s.project.accessories.find((x) => x.id === s.activeAccessoryId);
        if (!a) return;
        // Espeja en el lugar (no negamos el offset, para no mover el objeto).
        s.updateAccessory(a.id, {
          angle: axis === 'h' ? -a.angle : 180 - a.angle,
          ...(a.points ? { points: flipPoints(a.points, axis) } : {}),
        });
      }
    },

    setMode: (mode) =>
      set((s) => ({
        project: { ...s.project, mode },
        currentFrame: 0,
        isPlaying: false,
        activeRigClipId: s.activeRigClipId ?? s.project.customRig.animations[0]?.id ?? null,
      })),

    activeBoneId: null,
    selectBone: (id) => set({ activeBoneId: id }),

    addBone: () => {
      const id = genId();
      const { customRig } = get().project;
      const parentId = get().activeBoneId ?? customRig.bones[0]?.id ?? null;
      const newBone: Bone = {
        id,
        name: 'bone',
        parentId,
        attach: 1,
        angle: 0,
        length: 20,
        width: 5,
        shape: 'capsule',
        curve: 0,
        color: null,
        z: 1,
      };
      set((s) => ({
        project: { ...s.project, customRig: { ...s.project.customRig, bones: [...s.project.customRig.bones, newBone] } },
        activeBoneId: id,
      }));
    },

    updateBone: (id, patch) =>
      set((s) => ({
        project: {
          ...s.project,
          customRig: {
            ...s.project.customRig,
            bones: s.project.customRig.bones.map((b) => (b.id === id ? { ...b, ...patch } : b)),
          },
        },
      })),

    removeBone: (id) => {
      const bones = get().project.customRig.bones;
      // Elimina el hueso y toda su descendencia para no dejar huérfanos.
      const toRemove = new Set<string>([id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const b of bones) {
          if (b.parentId && toRemove.has(b.parentId) && !toRemove.has(b.id)) {
            toRemove.add(b.id);
            changed = true;
          }
        }
      }
      const remaining = bones.filter((b) => !toRemove.has(b.id));
      set((s) => ({
        project: { ...s.project, customRig: { ...s.project.customRig, bones: remaining } },
        activeBoneId: toRemove.has(get().activeBoneId ?? '') ? (remaining[0]?.id ?? null) : get().activeBoneId,
      }));
    },

    toggleBoneVisible: (id) =>
      set((s) => ({
        project: {
          ...s.project,
          customRig: {
            ...s.project.customRig,
            bones: s.project.customRig.bones.map((b) => (b.id === id ? { ...b, hidden: !b.hidden } : b)),
          },
        },
      })),

    // Reordena el hueso en el orden de dibujo, normalizando z a 0..n-1.
    reorderBone: (id, delta) =>
      set((s) => {
        const bones = s.project.customRig.bones;
        const order = bones
          .map((b, i) => ({ b, i }))
          .sort((a, c) => a.b.z - c.b.z || a.i - c.i)
          .map((o) => o.b);
        const pos = order.findIndex((b) => b.id === id);
        const swap = pos + delta;
        if (pos < 0 || swap < 0 || swap >= order.length) return {};
        [order[pos], order[swap]] = [order[swap], order[pos]];
        const rank = new Map(order.map((b, idx) => [b.id, idx]));
        const newBones = bones.map((b) => ({ ...b, z: rank.get(b.id) ?? b.z }));
        return { project: { ...s.project, customRig: { ...s.project.customRig, bones: newBones } } };
      }),

    // Reordena por drag: mueve el hueso a una posición "de frente hacia atrás"
    // (índice 0 = mayor z) y reasigna z para reflejar el nuevo orden de dibujo.
    moveBoneToIndex: (id, toFrontIndex) =>
      set((s) => {
        const bones = s.project.customRig.bones;
        const front = bones
          .map((b, i) => ({ b, i }))
          .sort((a, c) => c.b.z - a.b.z || a.i - c.i)
          .map((o) => o.b);
        const from = front.findIndex((b) => b.id === id);
        if (from < 0) return {};
        const [moved] = front.splice(from, 1);
        front.splice(Math.max(0, Math.min(front.length, toFrontIndex)), 0, moved);
        const n = front.length;
        const rank = new Map(front.map((b, idx) => [b.id, n - 1 - idx]));
        const newBones = bones.map((b) => ({ ...b, z: rank.get(b.id) ?? b.z }));
        return { project: { ...s.project, customRig: { ...s.project.customRig, bones: newBones } } };
      }),

    duplicateBone: (id) => {
      const src = get().project.customRig.bones.find((b) => b.id === id);
      if (!src) return;
      const off = src.offset ?? { x: 0, y: 0 };
      get().insertBone({ ...src, id: genId(), name: `${src.name} copia`, offset: { x: off.x + 6, y: off.y + 6 } });
    },

    insertBone: (bone) =>
      set((s) => ({
        project: { ...s.project, customRig: { ...s.project.customRig, bones: [...s.project.customRig.bones, bone] } },
        activeBoneId: bone.id,
      })),

    setRigField: (patch) =>
      set((s) => {
        const rig = s.project.customRig;
        const origin =
          patch.originX !== undefined || patch.originY !== undefined
            ? { x: patch.originX ?? rig.origin.x, y: patch.originY ?? rig.origin.y }
            : rig.origin;
        return {
          project: {
            ...s.project,
            customRig: { ...rig, name: patch.name ?? rig.name, color: patch.color ?? rig.color, origin },
          },
        };
      }),

    resetAllBoneColors: () =>
      set((s) => ({
        project: {
          ...s.project,
          customRig: {
            ...s.project.customRig,
            bones: s.project.customRig.bones.map((b) => ({ ...b, color: null })),
          },
        },
      })),

    loadRigPreset: (rig) =>
      set({
        project: { ...get().project, customRig: rig },
        activeBoneId: rig.bones[0]?.id ?? null,
        activeRigClipId: rig.animations[0]?.id ?? null,
        activeRigKeyframeIndex: 0,
        currentFrame: 0,
        isPlaying: false,
      }),

    selectRigClip: (id) => set({ activeRigClipId: id, activeRigKeyframeIndex: 0, currentFrame: 0, isPlaying: false }),

    addRigClip: () => {
      const id = genId();
      const clip: RigClip = { id, name: 'new', frames: 8, fps: 10, loop: true, keyframes: [{ t: 0, pose: {} }, { t: 1, pose: {} }] };
      set((s) => ({
        project: { ...s.project, customRig: { ...s.project.customRig, animations: [...s.project.customRig.animations, clip] } },
        activeRigClipId: id,
        activeRigKeyframeIndex: 0,
        currentFrame: 0,
        isPlaying: false,
      }));
    },

    duplicateRigClip: (id) => {
      const src = get().project.customRig.animations.find((c) => c.id === id);
      if (!src) return;
      const newId = genId();
      set((s) => ({
        project: { ...s.project, customRig: { ...s.project.customRig, animations: [...s.project.customRig.animations, { ...src, id: newId, name: `${src.name}_copy` }] } },
        activeRigClipId: newId,
      }));
    },

    renameRigClip: (id, name) =>
      set((s) => ({
        project: { ...s.project, customRig: { ...s.project.customRig, animations: s.project.customRig.animations.map((c) => (c.id === id ? { ...c, name } : c)) } },
      })),

    deleteRigClip: (id) => {
      const anims = get().project.customRig.animations;
      if (anims.length <= 1) {
        get().notify('Debe quedar al menos una animación', 'warning');
        return;
      }
      const remaining = anims.filter((c) => c.id !== id);
      set((s) => ({
        project: { ...s.project, customRig: { ...s.project.customRig, animations: remaining } },
        activeRigClipId: remaining[0].id,
        activeRigKeyframeIndex: 0,
        currentFrame: 0,
        isPlaying: false,
      }));
    },

    setRigClipFrames: (frames) => {
      const clamped = Math.max(1, Math.round(frames));
      updateActiveRigClip((c) => ({ ...c, frames: clamped }));
      set((s) => ({ currentFrame: clampFrame(s.currentFrame, clamped) }));
    },

    setRigClipFps: (fps) => updateActiveRigClip((c) => ({ ...c, fps: Math.max(1, Math.round(fps)) })),
    setRigClipLoop: (loop) => updateActiveRigClip((c) => ({ ...c, loop })),

    selectRigKeyframe: (index) => set({ activeRigKeyframeIndex: index }),

    addRigKeyframeAt: (t) => {
      const clip = activeRigClip();
      if (!clip) return;
      const clampedT = Math.max(0, Math.min(1, t));
      const pose = rigPoseAt(clip.keyframes, clampedT);
      const keyframes = [...clip.keyframes, { t: clampedT, pose }].sort((a, b) => a.t - b.t);
      const index = keyframes.findIndex((kf) => kf.t === clampedT);
      updateActiveRigClip((c) => ({ ...c, keyframes }));
      set({ activeRigKeyframeIndex: index < 0 ? keyframes.length - 1 : index });
    },

    duplicateRigKeyframe: (index) => {
      const clip = activeRigClip();
      if (!clip || index < 0 || index >= clip.keyframes.length) return;
      const src = clip.keyframes[index];
      const nextT = Math.min(1, src.t + 0.05);
      const dup = { t: nextT, pose: src.pose, easing: src.easing };
      const keyframes = [...clip.keyframes, dup].sort((a, b) => a.t - b.t);
      updateActiveRigClip((c) => ({ ...c, keyframes }));
      set({ activeRigKeyframeIndex: Math.max(0, keyframes.indexOf(dup)) });
    },

    deleteRigKeyframe: (index) => {
      const clip = activeRigClip();
      if (!clip) return;
      if (clip.keyframes.length <= 1) {
        get().notify('El clip debe tener al menos un keyframe', 'warning');
        return;
      }
      const keyframes = clip.keyframes.filter((_, i) => i !== index);
      updateActiveRigClip((c) => ({ ...c, keyframes }));
      set((s) => ({ activeRigKeyframeIndex: Math.min(s.activeRigKeyframeIndex, keyframes.length - 1) }));
    },

    moveRigKeyframe: (index, t) => {
      const clampedT = Math.max(0, Math.min(1, t));
      updateActiveRigClip((c) => {
        if (index < 0 || index >= c.keyframes.length) return c;
        return { ...c, keyframes: c.keyframes.map((kf, i) => (i === index ? { ...kf, t: clampedT } : kf)) };
      });
    },

    setRigKeyframeEasing: (index, easing) =>
      updateActiveRigClip((c) => {
        if (index < 0 || index >= c.keyframes.length) return c;
        return { ...c, keyframes: c.keyframes.map((kf, i) => (i === index ? { ...kf, easing } : kf)) };
      }),

    setBoneAngleOffset: (boneId, value) => updateActiveRigPose((pose) => ({ ...pose, [boneId]: value })),

    setRenderField: (key, value) =>
      set((s) => ({ project: { ...s.project, render: { ...s.project.render, [key]: value } } })),

    toggleFlip: () =>
      set((s) => ({ project: { ...s.project, render: { ...s.project.render, flip: !s.project.render.flip } } })),

    setRotation: (deg) =>
      set((s) => ({ project: { ...s.project, render: { ...s.project.render, rotation: deg } } })),

    setFacing: (deg) =>
      set((s) => ({ project: { ...s.project, render: { ...s.project.render, facing: deg } } })),

    setShadow: (patch) =>
      set((s) => ({
        project: {
          ...s.project,
          effects: { ...s.project.effects, shadow: { ...s.project.effects.shadow, ...patch } },
        },
      })),

    setGlow: (patch) =>
      set((s) => ({
        project: {
          ...s.project,
          effects: { ...s.project.effects, glow: { ...s.project.effects.glow, ...patch } },
        },
      })),

    setOutline: (patch) =>
      set((s) => ({
        project: {
          ...s.project,
          effects: { ...s.project.effects, outline: { ...s.project.effects.outline, ...patch } },
        },
      })),

    ...(() => {
      const r = loadRef();
      return { refImage: r.image, refOpacity: r.opacity, refScale: r.scale, refVisible: r.visible };
    })(),
    setRefImage: (dataUrl) => set({ refImage: dataUrl, refVisible: true }),
    setRefOpacity: (v) => set({ refOpacity: v }),
    setRefScale: (v) => set({ refScale: v }),
    toggleRefVisible: () => set((s) => ({ refVisible: !s.refVisible })),

    selectAnimation: (id) => set({ activeAnimationId: id, activeKeyframeIndex: 0, currentFrame: 0, isPlaying: false }),

    addAnimation: () => {
      const id = genId();
      const clip: AnimationClip = {
        id,
        name: 'new',
        frames: 8,
        fps: 10,
        loop: true,
        keyframes: [
          { t: 0, pose: NEUTRAL_POSE },
          { t: 1, pose: NEUTRAL_POSE },
        ],
      };
      set((s) => ({
        project: { ...s.project, animations: [...s.project.animations, clip] },
        activeAnimationId: id,
        activeKeyframeIndex: 0,
        currentFrame: 0,
        isPlaying: false,
      }));
    },

    importAnimations: (clips) => {
      if (clips.length === 0) return;
      const fresh = clips.map((c) => ({ ...c, id: genId() }));
      set((s) => ({
        project: { ...s.project, animations: [...s.project.animations, ...fresh] },
        activeAnimationId: fresh[0].id,
        activeKeyframeIndex: 0,
        currentFrame: 0,
        isPlaying: false,
      }));
      get().notify('Animaciones importadas', 'success');
    },

    importRigClips: (clips) => {
      if (clips.length === 0) return;
      const fresh = clips.map((c) => ({ ...c, id: genId() }));
      set((s) => ({
        project: {
          ...s.project,
          customRig: { ...s.project.customRig, animations: [...s.project.customRig.animations, ...fresh] },
        },
        activeRigClipId: fresh[0].id,
        activeRigKeyframeIndex: 0,
        currentFrame: 0,
        isPlaying: false,
      }));
      get().notify('Animaciones importadas', 'success');
    },

    duplicateAnimation: (id) => {
      const src = get().project.animations.find((c) => c.id === id);
      if (!src) return;
      const newId = genId();
      const copy: AnimationClip = { ...src, id: newId, name: `${src.name}_copy` };
      set((s) => ({
        project: { ...s.project, animations: [...s.project.animations, copy] },
        activeAnimationId: newId,
        activeKeyframeIndex: 0,
        currentFrame: 0,
      }));
    },

    renameAnimation: (id, name) =>
      set((s) => ({
        project: {
          ...s.project,
          animations: s.project.animations.map((c) => (c.id === id ? { ...c, name } : c)),
        },
      })),

    deleteAnimation: (id) => {
      const { animations } = get().project;
      if (animations.length <= 1) {
        get().notify('Debe quedar al menos una animación', 'warning');
        return;
      }
      const remaining = animations.filter((c) => c.id !== id);
      set((s) => ({
        project: { ...s.project, animations: remaining },
        activeAnimationId: remaining[0].id,
        activeKeyframeIndex: 0,
        currentFrame: 0,
        isPlaying: false,
      }));
    },

    setClipFrames: (frames) => {
      const clamped = Math.max(1, Math.round(frames));
      updateActiveClip((c) => ({ ...c, frames: clamped }));
      set((s) => ({ currentFrame: clampFrame(s.currentFrame, clamped) }));
    },

    setClipFps: (fps) => updateActiveClip((c) => ({ ...c, fps: Math.max(1, Math.round(fps)) })),

    setClipLoop: (loop) => updateActiveClip((c) => ({ ...c, loop })),

    setCurrentFrame: (frame) => set((s) => ({ currentFrame: clampFrame(frame, framesFor(s)) })),

    setPlaying: (playing) => set({ isPlaying: playing }),
    togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

    nextFrame: () =>
      set((s) => {
        const frames = framesFor(s);
        return { currentFrame: (s.currentFrame + 1) % frames, isPlaying: false };
      }),

    prevFrame: () =>
      set((s) => {
        const frames = framesFor(s);
        return { currentFrame: (s.currentFrame - 1 + frames) % frames, isPlaying: false };
      }),

    selectKeyframe: (index) => set({ activeKeyframeIndex: index }),

    addKeyframeAt: (t) => {
      const clip = get().project.animations.find((c) => c.id === get().activeAnimationId);
      if (!clip) return;
      const clampedT = Math.max(0, Math.min(1, t));
      const newPose = poseAt(clip.keyframes, clampedT);
      const keyframes = [...clip.keyframes, { t: clampedT, pose: newPose }].sort((a, b) => a.t - b.t);
      const index = keyframes.findIndex((kf) => kf.t === clampedT);
      updateActiveClip((c) => ({ ...c, keyframes }));
      set({ activeKeyframeIndex: index < 0 ? keyframes.length - 1 : index });
    },

    duplicateKeyframe: (index) => {
      const clip = get().project.animations.find((c) => c.id === get().activeAnimationId);
      if (!clip || index < 0 || index >= clip.keyframes.length) return;
      const src = clip.keyframes[index];
      const nextT = Math.min(1, src.t + 0.05);
      const dup = { t: nextT, pose: src.pose };
      const keyframes = [...clip.keyframes, dup].sort((a, b) => a.t - b.t);
      updateActiveClip((c) => ({ ...c, keyframes }));
      const newIndex = keyframes.indexOf(dup);
      set({ activeKeyframeIndex: newIndex < 0 ? 0 : newIndex });
    },

    deleteKeyframe: (index) => {
      const clip = get().project.animations.find((c) => c.id === get().activeAnimationId);
      if (!clip) return;
      if (clip.keyframes.length <= 1) {
        get().notify('El clip debe tener al menos un keyframe', 'warning');
        return;
      }
      const keyframes = clip.keyframes.filter((_, i) => i !== index);
      updateActiveClip((c) => ({ ...c, keyframes }));
      set((s) => ({ activeKeyframeIndex: Math.min(s.activeKeyframeIndex, keyframes.length - 1) }));
    },

    moveKeyframe: (index, t) => {
      const clampedT = Math.max(0, Math.min(1, t));
      updateActiveClip((c) => {
        if (index < 0 || index >= c.keyframes.length) return c;
        const keyframes = c.keyframes.map((kf, i) => (i === index ? { ...kf, t: clampedT } : kf));
        return { ...c, keyframes };
      });
    },

    setKeyframeEasing: (index, easing) =>
      updateActiveClip((c) => {
        if (index < 0 || index >= c.keyframes.length) return c;
        const keyframes = c.keyframes.map((kf, i) => (i === index ? { ...kf, easing } : kf));
        return { ...c, keyframes };
      }),

    setPoseField: (key, value) => updateActivePose((p) => ({ ...p, [key]: value })),
    mirrorPose: () => updateActivePose((p) => mirror(p)),

    copyPose: () => {
      const clip = get().project.animations.find((c) => c.id === get().activeAnimationId);
      const kf = clip?.keyframes[get().activeKeyframeIndex];
      if (kf) {
        set({ copiedPose: kf.pose });
        get().notify('Pose copiada', 'success');
      }
    },

    pastePose: () => {
      const { copiedPose } = get();
      if (!copiedPose) {
        get().notify('No hay pose copiada', 'warning');
        return;
      }
      updateActivePose(() => copiedPose);
      get().notify('Pose pegada', 'success');
    },

    savePreset: (name) => {
      const preset: CharacterPreset = { id: genId(), name, character: get().project.character };
      set((s) => ({ presets: [...s.presets, preset] }));
      get().notify('Preset guardado', 'success');
    },

    applyPreset: (id) => {
      const preset = get().presets.find((p) => p.id === id);
      if (preset) {
        set((s) => ({ project: { ...s.project, character: { ...preset.character } } }));
        get().notify('Preset aplicado', 'success');
      }
    },

    deletePreset: (id) => set((s) => ({ presets: s.presets.filter((p) => p.id !== id) })),

    importProject: (project) =>
      set({
        project,
        activeAnimationId: project.animations[0]?.id ?? '',
        activeKeyframeIndex: 0,
        currentFrame: 0,
        isPlaying: false,
      }),

    // Reset maestro: vuelve el trabajo actual al proyecto por defecto y limpia toda
    // selección. La persistencia (debounce) guarda el default; se puede deshacer con
    // Ctrl+Z (queda en el historial). Presets, idioma e imagen de referencia se mantienen.
    resetProject: () => {
      const p = buildDefaultProject();
      set({
        project: p,
        activeAnimationId: p.animations[0]?.id ?? '',
        activeKeyframeIndex: 0,
        currentFrame: 0,
        isPlaying: false,
        activeAccessoryId: null,
        activePartName: null,
        activeBoneId: null,
        activeRigClipId: p.customRig.animations[0]?.id ?? null,
        activeRigKeyframeIndex: 0,
      });
    },

    undo: () => {
      flushHistory();
      const prev = historyPast.pop();
      if (!prev) return;
      historyFuture.push(get().project);
      timeTraveling = true;
      set(restoreState(prev));
      timeTraveling = false;
      syncHistoryFlags();
    },

    redo: () => {
      flushHistory();
      const next = historyFuture.pop();
      if (!next) return;
      historyPast.push(get().project);
      timeTraveling = true;
      set(restoreState(next));
      timeTraveling = false;
      syncHistoryFlags();
    },

    notify: (message, type = 'info') => set({ notification: { open: true, type, message } }),
    hideNotification: () => set((s) => ({ notification: { ...s.notification, open: false } })),

    lang: loadLang(),
    setLang: (lang) => {
      set({ lang });
      try {
        localStorage.setItem(LANG_KEY, lang);
      } catch {
        /* ignora */
      }
    },
  };
});

// --- Helpers de historial (nivel de módulo) ---
const syncHistoryFlags = (): void => {
  useProjectStore.setState({
    canUndo: historyPast.length > 0 || historyPending !== null,
    canRedo: historyFuture.length > 0,
  });
};

// Confirma la ráfaga pendiente como un único paso de historial.
const commitPending = (): void => {
  if (historyPending !== null) {
    historyPast.push(historyPending);
    if (historyPast.length > HISTORY_LIMIT) historyPast.shift();
    historyPending = null;
    historyFuture = [];
  }
};

const commitHistory = (): void => {
  historyTimer = null;
  commitPending();
  syncHistoryFlags();
};

// Fuerza la confirmación inmediata (usado antes de undo/redo).
const flushHistory = (): void => {
  if (historyTimer) {
    clearTimeout(historyTimer);
    historyTimer = null;
  }
  commitPending();
};

// Captura la ráfaga de cambios de proyecto en un paso de historial.
useProjectStore.subscribe((state, prev) => {
  if (state.project === prev.project) return;
  if (timeTraveling) return;
  if (historyPending === null) historyPending = prev.project;
  if (historyTimer) clearTimeout(historyTimer);
  historyTimer = setTimeout(commitHistory, HISTORY_DEBOUNCE);
  syncHistoryFlags();
});

// --- Persistencia con debounce de 500 ms ---
let saveTimer: ReturnType<typeof setTimeout> | null = null;
useProjectStore.subscribe((state, prev) => {
  if (state.project !== prev.project) {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(PROJECT_KEY, JSON.stringify(state.project));
      } catch {
        /* cuota excedida — ignorar */
      }
    }, 500);
  }
  if (state.presets !== prev.presets) {
    try {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(state.presets));
    } catch {
      /* ignorar */
    }
  }
});

// --- Persistencia de la imagen de referencia (fuera del proyecto) ---
useProjectStore.subscribe((state, prev) => {
  if (
    state.refImage === prev.refImage &&
    state.refOpacity === prev.refOpacity &&
    state.refScale === prev.refScale &&
    state.refVisible === prev.refVisible
  ) {
    return;
  }
  try {
    localStorage.setItem(
      REF_KEY,
      JSON.stringify({
        image: state.refImage,
        opacity: state.refOpacity,
        scale: state.refScale,
        visible: state.refVisible,
      }),
    );
  } catch {
    /* cuota excedida (imagen grande) — ignorar */
  }
});
