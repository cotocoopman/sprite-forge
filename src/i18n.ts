// i18n mínimo: el texto en español es la clave. En modo 'en' se traduce con el
// diccionario EN (cae a español si falta). En 'es' devuelve la clave tal cual.
import { useProjectStore } from '@store/useProjectStore';

export type Lang = 'es' | 'en';

export const LANG_KEY = 'sprite-forge_lang';

export const detectLang = (): Lang => {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === 'es' || stored === 'en') return stored;
    return (navigator.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
  } catch {
    return 'en';
  }
};

const EN: Record<string, string> = {
  // App / topbar
  Humanoide: 'Humanoid',
  'Rig personalizado': 'Custom rig',
  'Deshacer (Ctrl+Z)': 'Undo (Ctrl+Z)',
  'Rehacer (Ctrl+Y)': 'Redo (Ctrl+Y)',
  'Atajos de teclado': 'Keyboard shortcuts',
  'Reproducir / pausar': 'Play / pause',
  'Frame anterior / siguiente': 'Previous / next frame',
  Deshacer: 'Undo',
  Rehacer: 'Redo',
  'Los atajos no aplican mientras escribís en un campo de texto.':
    "Shortcuts don't apply while typing in a text field.",
  Cerrar: 'Close',
  'Frame anterior (←)': 'Previous frame (←)',
  'Reproducir / pausar (Espacio)': 'Play / pause (Space)',
  'Frame siguiente (→)': 'Next frame (→)',
  '¿Cómo lo uso en Godot?': 'How do I use it in Godot?',
  'Ver guía paso a paso': 'See step-by-step guide',
  Plantillas: 'Templates',
  'listas para usar': 'ready to use',
  PLANTILLA: 'TEMPLATE',
  'Plantilla aplicada': 'Template applied',
  'Elegí una plantilla como punto de partida. Después ajustá todo a gusto.':
    'Pick a template as a starting point. Then tweak everything to taste.',
  Aleatorio: 'Random',
  'Copiar animaciones': 'Copy animations',
  'Exportá tus animaciones a un archivo y importalas en otro personaje o rig.':
    'Export your animations to a file and import them into another character or rig.',
  'Descargar las animaciones actuales como archivo': 'Download the current animations as a file',
  Exportar: 'Export',
  'Animaciones importadas': 'Animations imported',
  'Archivo de animaciones inválido': 'Invalid animations file',
  'Ese archivo es de un personaje humanoide, no de un rig':
    'That file is for a humanoid character, not a rig',
  'Ese archivo es de un rig, no de un personaje humanoide':
    'That file is for a rig, not a humanoid character',
  'Atlas: un solo PNG con todos los frames + atlas.json':
    'Atlas: a single PNG with every frame + atlas.json',
  'Variantes de color (skins)': 'Color variants (skins)',
  'Cada color genera una carpeta skins/ con sus sheets y frames.':
    'Each color generates a skins/ folder with its own sheets and frames.',
  'Agregar color': 'Add color',
  Importar: 'Import',
  'Exportar proyecto': 'Export project',
  'Exportar sprites': 'Export sprites',
  'Proyecto importado': 'Project imported',
  'No se pudo leer el archivo': 'Could not read the file',
  'Idioma / Language': 'Idioma / Language',

  // Character panel
  Personaje: 'Character',
  Nombre: 'Name',
  'Suma cabeza + torso + piernas': 'Head + torso + legs sum',
  '(no cierra)': "(doesn't add up)",
  Color: 'Color',
  'Restaurar defaults': 'Restore defaults',
  'Cabeza y cuello': 'Head and neck',
  Torso: 'Torso',
  Brazos: 'Arms',
  'Piernas y pies': 'Legs and feet',
  'Diámetro cabeza': 'Head diameter',
  'Cuello (separación cabeza)': 'Neck (head gap)',
  'Alto torso': 'Torso height',
  'Ancho torso': 'Torso width',
  'Distancia hombro': 'Shoulder distance',
  'Separación brazos': 'Arm spacing',
  'Ancho brazo': 'Arm width',
  'Largo brazo superior': 'Upper arm length',
  'Largo antebrazo': 'Forearm length',
  'Curvatura brazo superior': 'Upper arm curve',
  'Curvatura antebrazo': 'Forearm curve',
  'Alto piernas': 'Leg height',
  'Separación caderas': 'Hip spacing',
  'Ancho pierna': 'Leg width',
  'Ratio muslo': 'Thigh ratio',
  'Curvatura muslo': 'Thigh curve',
  'Curvatura pantorrilla': 'Shin curve',
  'Largo pie': 'Foot length',
  'Ancho pie': 'Foot width',
  'Curvatura aplica a': 'Curve applies to',
  Ambos: 'Both',
  Derecha: 'Right',
  Izquierda: 'Left',

  // Parts
  Partes: 'Parts',
  'Ocultá partes (grisáceas acá, excluidas del export) o pintalas por separado.':
    'Hide parts (greyed here, excluded from export) or color them separately.',
  'Ocultar (no se exporta)': "Hide (won't be exported)",
  Ocultar: 'Hide',
  Mostrar: 'Show',
  'Volver al color base': 'Reset to base color',
  Cabeza: 'Head',
  'Brazo derecho': 'Right arm',
  'Brazo izquierdo': 'Left arm',
  'Pierna derecha': 'Right leg',
  'Pierna izquierda': 'Left leg',

  // Accessories
  Accesorios: 'Accessories',
  'Agregar accesorio': 'Add accessory',
  'Sin accesorios. Agregá uno (arma, sombrero, capa, escudo…) anclado a un hueso.':
    'No accessories. Add one (weapon, hat, cape, shield…) anchored to a bone.',
  'Anclado a': 'Anchored to',
  Barra: 'Bar',
  Círculo: 'Circle',
  Rect: 'Rect',
  'Desplazar sobre el hueso': 'Offset along bone',
  'Desplazar perpendicular': 'Offset perpendicular',
  Ángulo: 'Angle',
  Largo: 'Length',
  Grosor: 'Thickness',
  Diámetro: 'Diameter',
  Opacidad: 'Opacity',
  Delante: 'In front',
  Duplicar: 'Duplicate',
  Eliminar: 'Delete',
  'Editar un accesorio': 'Edit an accessory',
  'Hombro derecho': 'Right shoulder',
  'Hombro izquierdo': 'Left shoulder',
  'Cuello / torso': 'Neck / torso',
  Cadera: 'Hip',
  'Mano derecha': 'Right hand',
  'Mano izquierda': 'Left hand',
  'Pie derecho': 'Right foot',
  'Pie izquierdo': 'Left foot',

  // Effects
  Efectos: 'Effects',
  Sombra: 'Shadow',
  Piso: 'Floor',
  Desplazada: 'Drop',
  'Dirección (°)': 'Direction (°)',
  'Inclinación (°)': 'Skew (°)',
  'Largo / offset': 'Length / offset',
  'Aplastado (piso)': 'Flatten (floor)',
  Desenfoque: 'Blur',
  'Brillo (contorno)': 'Glow (outline)',
  Expansión: 'Expansion',
  'Intensidad (difuminado)': 'Intensity (blur)',
  'Contorno (borde)': 'Outline (border)',

  // Preset library
  'Biblioteca de personajes': 'Character library',
  'Nombre del preset': 'Preset name',
  Guardar: 'Save',
  'Sin presets guardados.': 'No saved presets.',
  Aplicar: 'Apply',
  'Preset guardado': 'Preset saved',
  'Preset aplicado': 'Preset applied',

  // Preview / controls
  'Fondo claro': 'Light background',
  'Onion skin': 'Onion skin',
  Guías: 'Guides',
  'Sin clip activo': 'No active clip',
  'Giro 3D (dirección)': '3D turn (direction)',
  'De frente (0°)': 'Front (0°)',
  Referencia: 'Reference',
  Escala: 'Scale',
  'Quitar referencia': 'Remove reference',
  'No se pudo leer la imagen': 'Could not read the image',

  // Animation list / timeline / pose
  Animaciones: 'Animations',
  'Agregar clip': 'Add clip',
  Renombrar: 'Rename',
  'Ajustes': 'Settings',
  Loop: 'Loop',
  Keyframes: 'Keyframes',
  'Agregar en el scrubber': 'Add at the scrubber',
  Agregar: 'Add',
  'Duplicar seleccionado': 'Duplicate selected',
  'Eliminar seleccionado': 'Delete selected',
  'Debe quedar al menos una animación': 'At least one animation must remain',
  'El clip debe tener al menos un keyframe': 'The clip must have at least one keyframe',
  Pose: 'Pose',
  Espejar: 'Mirror',
  Copiar: 'Copy',
  Pegar: 'Paste',
  'Pose copiada': 'Pose copied',
  'Pose pegada': 'Pose pasted',
  'No hay pose copiada': 'No pose copied',
  'Seleccioná un keyframe para editar su pose.': 'Select a keyframe to edit its pose.',
  'Easing (salida de este keyframe)': 'Easing (out of this keyframe)',
  'Easing (salida del keyframe)': 'Easing (out of keyframe)',
  Lineal: 'Linear',
  'Ease-in (arranca lento)': 'Ease-in (slow start)',
  'Ease-out (frena al final)': 'Ease-out (slow end)',
  'Ease-in-out': 'Ease-in-out',
  'Ease-in': 'Ease-in',
  'Ease-out': 'Ease-out',
  Root: 'Root',
  'Offset Y': 'Y offset',
  'Rotación global': 'Global rotation',
  Inclinación: 'Lean',
  Superior: 'Upper',
  Antebrazo: 'Forearm',
  Muslo: 'Thigh',
  Pantorrilla: 'Shin',

  // Export dialog
  'Tamaño de celda (px)': 'Cell size (px)',
  'Configuración de render': 'Render settings',
  'Cell size (px)': 'Cell size (px)',
  'Alto personaje / celda': 'Character height / cell',
  'Y del suelo / celda': 'Ground Y / cell',
  'Espejo horizontal': 'Horizontal flip',
  'Qué incluir': 'What to include',
  'Sprite sheet por animación (tira horizontal)': 'Sprite sheet per animation (horizontal strip)',
  'Frames sueltos (un PNG por frame)': 'Individual frames (one PNG per frame)',
  'SVG por animación': 'SVG per animation',
  'Las 8 direcciones (giro cada 45°) — sufijo _d0.._d7': 'All 8 directions (45° steps) — suffix _d0.._d7',
  'Recurso Godot 4 (SpriteFrames .tres, usa los sheets)': 'Godot 4 resource (SpriteFrames .tres, uses the sheets)',
  animaciones: 'animations',
  Cancelar: 'Cancel',
  'Exportar ZIP': 'Export ZIP',
  'Export completado': 'Export complete',
  'Error al exportar': 'Export error',

  // Rig editor
  'Cargar preset': 'Load preset',
  'Resetear todos los huesos al color base': 'Reset all bones to base color',
  'Origen X': 'Origin X',
  'Origen Y': 'Origin Y',
  Huesos: 'Bones',
  'Agregar hueso (hijo del seleccionado)': 'Add bone (child of selected)',
  raíz: 'root',
  'Eliminar (y sus hijos)': 'Delete (and its children)',
  'Animá el rig en el panel derecho. Exportá con "Exportar sprites".':
    'Animate the rig in the right panel. Export with "Export sprites".',
  Padre: 'Parent',
  '(raíz — sin padre)': '(root — no parent)',
  'Nace sobre el padre (0=base, 1=punta)': 'Attaches on parent (0=base, 1=tip)',
  'Ángulo (relativo al padre)': 'Angle (relative to parent)',
  'Largo (para hijos)': 'Length (for children)',
  'Orden (z)': 'Draw order (z)',
  Curvatura: 'Curvature',

  // Rig animation
  'Animación del rig': 'Rig animation',
  Dup: 'Dup',
  Del: 'Del',
  'Ángulos por hueso': 'Bone angles',
};

export const translate = (lang: Lang, key: string): string => (lang === 'en' ? EN[key] ?? key : key);

// Hook: devuelve la función de traducción según el idioma activo.
export const useT = (): ((key: string) => string) => {
  const lang = useProjectStore((s) => s.lang);
  return (key: string) => translate(lang, key);
};
