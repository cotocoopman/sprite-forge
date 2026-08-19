# Roadmap y estado

Estado del proyecto, lo hecho y lo pendiente. Se actualiza a mano.

---

## ✅ Hecho

### Modo Humanoide
- Rig paramétrico (cabeza, torso, 2 brazos, 2 piernas) con cinemática directa propia.
- Proporciones agrupadas por parte, con slider + input (acepta coma o punto, flechas ↑↓).
- Cuello (separación cabeza↔cuerpo), separación de brazos.
- Curvatura granular por segmento (superior/antebrazo, muslo/pantorrilla) y por lado
  (ambos / cercano / lejano).
- **Partes**: visibilidad on/off (ocultas = grises en editor, excluidas del export) y
  color por parte con reset al color base.
- **Efectos**: sombra (modo piso / desplazada), brillo de contorno, contorno/borde.
- **Accesorios**: formas (barra/círculo/rect) ancladas a un hueso, que siguen la animación.
- **Giro 3D** (facing) con dial de 8 direcciones + slider.
- **Animación**: 9 clips por defecto, timeline arrastrable, editor de pose por
  articulación (espejar/copiar/pegar), easing por keyframe, playback, onion skin, guías,
  miniaturas.

### Modo Rig personalizado (no-humanoide)
- **Fase 1** — Editor de árbol de huesos (padre, punto de nacimiento, ángulo, largo,
  grosor, forma barra/círculo/rect, curvatura, color por hueso, z), cinemática a prueba
  de ciclos, presets (Cuadrúpedo/Ave/Slime/Vacío), inputs numéricos, export estático PNG/SVG.
- **Fase 2** — Animación por keyframes por hueso: clips del rig, timeline arrastrable,
  editor de ángulo por hueso, easing, playback, miniaturas, y export del rig animado
  (sheets/frames/SVG/manifest/Godot `.tres`).

### Exportación
- Tamaño de celda por presets (16…1024) o libre.
- Sprite sheets, frames sueltos, SVG, `manifest.json`, `project.json`, **Godot 4 `.tres`**.
- **8 direcciones** (giro 3D) — humanoide.

### Plataforma
- 100% local (sin backend), autoguardado en `localStorage`, undo/redo coalescido.
- Import/export de proyecto `.json` con validación/migración tolerante.
- Responsive (columnas se apilan en móvil).
- Núcleo puro testeado con Vitest. Documentación (README + docs/).
- Respaldo en GitHub, rama `main`.

---

## ⏳ Pendiente

- **Fase 3 del rig** — más presets / biblioteca de criaturas (bípedo, serpiente, pez,
  nave, etc.) y guardar rigs propios como presets.
- **Armas/props como mini-rigs** — los accesorios humanoides quedaron básicos (una forma
  suelta no arma una espada/pistola real). Resolverlo componiendo huesos: un arma = un
  pequeño rig anclable a una mano.
- **Export 8-direcciones para el rig custom** — hoy el giro 3D (facing) es solo del
  humanoide; el rig genérico exporta una sola dirección.
- **Efectos en el rig custom** — sombra / brillo / contorno hoy aplican solo al humanoide.
- **Persistir la imagen de referencia** — actualmente vive en memoria (se pierde al recargar).

## ⚠️ Limitaciones conocidas

- **Giro 3D humanoide**: en perfil puro (90°/270°) el balanceo de brazos se aplana y queda
  algo rígido — es intrínseco a fingir 3D desde una silueta plana. En diagonales se ve bien.
- **Testing**: por diseño (founder mode) se testea solo la lógica de `core/`, no
  componentes/UI.
- **Bundle**: pesa por MUI; no hay code-splitting (es una herramienta local, no crítico).

---

## Ideas / backlog

- Copiar animaciones entre personajes/rigs.
- IK (cinemática inversa) para plantar pies.
- Empaquetado en atlas (todas las animaciones en un sheet + JSON).
- Exportar GIF/APNG de preview.
- Variantes de color (skins) exportadas de una.
