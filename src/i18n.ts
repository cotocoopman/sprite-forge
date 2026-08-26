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
  'Giro (rotación)': 'Turn (rotation)',
  'Girar 45°': 'Turn 45°',
  'Exportá "las 8 direcciones" para generar _d0.._d7 automáticamente.':
    'Export "all 8 directions" to generate _d0.._d7 automatically.',
  'Ver en GitHub (open source)': 'View on GitHub (open source)',
  'Armas / props': 'Weapons / props',
  'Prop agregado': 'Prop added',
  'Prop duplicado': 'Prop duplicated',
  'Accesorios / Armas': 'Accessories / Weapons',
  'Agregar accesorio suelto': 'Add a loose accessory',
  'Un click agrega el arma; otro la apaga (translúcida); otro la vuelve a mostrar. Para tener 2, usá “Duplicar”.':
    'One click adds the weapon; another hides it (translucent); another shows it again. To have 2, use “Duplicate”.',
  'Duplicar esta pieza': 'Duplicate this piece',
  'Duplicar arma/accesorio seleccionado': 'Duplicate selected weapon/accessory',
  'Cada prop es un mini-rig: se compone de varias piezas y sigue la animación de la mano.':
    'Each prop is a mini-rig: made of several pieces, it follows the hand animation.',

  // --- UI batch (secciones colapsables, guía, tooltips) ---
  'Personaje aleatorio': 'Random character',
  Restablecer: 'Reset',
  'Armas, sombreros, capas… anclados a un hueso y siguen la animación.':
    'Weapons, hats, capes… anchored to a bone and following the animation.',
  'Cargar un proyecto .json guardado antes (para seguir editándolo)':
    'Load a .json project you saved earlier (to keep editing it)',
  'Guardar TODO el proyecto editable como .json (backup / seguir después)':
    'Save the WHOLE editable project as .json (backup / continue later)',
  'Generar los PNG / sprite sheets / archivos de Godot finales':
    'Generate the final PNGs / sprite sheets / Godot files',
  'Guía rápida (qué es cada sección)': 'Quick guide (what each section does)',
  'Cargar animaciones desde un archivo y agregarlas a este personaje/rig':
    'Load animations from a file and add them to this character/rig',
  'Guía rápida — qué es cada sección': 'Quick guide — what each section does',
  Ejemplo: 'Example',
  'Importar / Exportar': 'Import / Export',
  'Color base del rig': 'Rig base color',
  'Sin giro (0°)': 'No turn (0°)',
  'Superponé una imagen (arte, un sprite) detrás de la silueta para calcarla o emparejar proporciones':
    'Overlay an image (art, a sprite) behind the silhouette to trace it or match proportions',
  'Tamaño del canvas de exportación (px). No afecta la silueta, solo la resolución.':
    'Export canvas size (px). It doesn\'t affect the silhouette, only the resolution.',
  // Guía: descripciones + ejemplos
  'Puntos de partida listos (héroe, mago, slime, cuadrúpedo…). Traen proporciones, colores y a veces armas.':
    'Ready starting points (hero, mage, slime, quadruped…). They set proportions, colors and sometimes weapons.',
  'Elegí "Warrior" y ya tenés espada + escudo; después ajustás lo que quieras.':
    'Pick "Warrior" and you already get sword + shield; then tweak whatever you want.',
  'Proporciones del humanoide (cabeza, torso, brazos, piernas) y color base.':
    'Humanoid proportions (head, torso, arms, legs) and base color.',
  'Subí "Diámetro cabeza" para un look más cabezón/chibi.':
    'Raise "Head diameter" for a bigger-headed / chibi look.',
  'Prendé/apagá partes del cuerpo o pintalas por separado. Las apagadas no se exportan.':
    'Turn body parts on/off or color them separately. Hidden parts are not exported.',
  'Apagá brazos y piernas para un blob tipo slime.': 'Turn off arms and legs for a slime-like blob.',
  'Armas, sombreros, capas… anclados a un hueso (mano, cabeza) que siguen la animación.':
    'Weapons, hats, capes… anchored to a bone (hand, head) that follow the animation.',
  'Sumá una "Espada" a la mano derecha: en el clip "attack" se blande sola.':
    'Add a "Sword" to the right hand: it swings on its own in the "attack" clip.',
  'Sombra, brillo y contorno de la silueta.': 'Shadow, glow and outline of the silhouette.',
  'Activá "Sombra → Piso" para que el personaje proyecte sombra al suelo.':
    'Enable "Shadow → Floor" so the character casts a shadow on the ground.',
  'Superpone una imagen (arte, un sprite existente) semitransparente detrás para calcarla.':
    'Overlays a semi-transparent image (art, an existing sprite) behind so you can trace it.',
  'Cargá el arte de tu personaje y ajustá la silueta hasta que calce.':
    'Load your character art and adjust the silhouette until it matches.',
  'Gira el personaje como una figura 3D para juegos top-down (8 direcciones).':
    'Turns the character like a 3D figure for top-down games (8 directions).',
  'Poné 90° para verlo de perfil; exportá "las 8 direcciones" para todas.':
    'Set 90° to see it in profile; export "all 8 directions" for every facing.',
  'Los clips (idle, walk, attack…). Definí cuadros, FPS y loop.':
    'The clips (idle, walk, attack…). Set frames, FPS and loop.',
  'Seleccioná "walk" y dale play para ver el ciclo de caminata.':
    'Select "walk" and press play to see the walk cycle.',
  'Los cuadros clave de la animación en una línea de tiempo arrastrable.':
    'The animation key frames on a draggable timeline.',
  'Agregá un keyframe a la mitad y cambiá la pose para crear el movimiento.':
    'Add a keyframe in the middle and change the pose to create the motion.',
  'Ángulos de cada articulación en el keyframe seleccionado.':
    'The angle of each joint in the selected keyframe.',
  'Copiá una pose, espejala y pegala en otro keyframe para un paso simétrico.':
    'Copy a pose, mirror it and paste it into another keyframe for a symmetric step.',
  'Exportá/importá tus clips como archivo para reusarlos en otro personaje o rig.':
    'Export/import your clips as a file to reuse them in another character or rig.',
  'Exportá el "walk" de un personaje e importalo en otro humanoide.':
    'Export a character\'s "walk" and import it into another humanoid.',
  'Guarda el personaje actual con un nombre (en tu navegador) para reaplicarlo luego.':
    'Saves the current character under a name (in your browser) to re-apply it later.',
  'Ajustás un héroe, lo guardás como "MiHéroe" y lo recuperás cuando quieras.':
    'Tune a hero, save it as "MyHero" and restore it whenever you want.',
  '"Exportar proyecto" guarda todo editable (.json). "Importar" lo vuelve a cargar. "Exportar sprites" genera los PNG/Godot finales.':
    '"Export project" saves everything editable (.json). "Import" loads it back. "Export sprites" generates the final PNG/Godot files.',
  'Antes de cerrar, "Exportar proyecto" para no perder tu trabajo.':
    'Before closing, "Export project" so you don\'t lose your work.',
  'Modo para criaturas/objetos: armás un esqueleto de huesos propio y lo animás.':
    'Mode for creatures/objects: build your own bone skeleton and animate it.',
  'Cargá "Spider" y animá sus patas cuadro a cuadro.':
    'Load "Spider" and animate its legs frame by frame.',
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
  Mover: 'Move',
  'Pose copiada': 'Pose copied',
  'Pose pegada': 'Pose pasted',
  'No hay pose copiada': 'No pose copied',
  'Keyframe copiado': 'Keyframe copied',
  'Keyframe pegado': 'Keyframe pasted',
  'No hay keyframe copiado': 'No keyframe copied',
  'Copiar objeto o keyframe': 'Copy object or keyframe',
  'Cortar objeto o keyframe': 'Cut object or keyframe',
  'Pegar objeto o keyframe': 'Paste object or keyframe',
  'Duplicar objeto o keyframe': 'Duplicate object or keyframe',
  'Borrar objeto o keyframe': 'Delete object or keyframe',
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
