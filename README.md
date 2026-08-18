# Sprite Forge

Generador paramétrico de **sprites 2D tipo silueta** para juegos, con exportación
lista para **Godot**. App 100% local en el navegador — sin backend, sin cuentas,
sin telemetría. Todo el estado vive en `localStorage`.

Diseñás un personaje-silueta (o una criatura no-humanoide), lo animás con
keyframes y exportás sprite sheets / frames / SVG / recursos de Godot.

![modo](https://img.shields.io/badge/modo-100%25%20local-informational) ![tests](https://img.shields.io/badge/tests-vitest-green)

---

## Arranque rápido

```bash
yarn install
yarn dev        # http://localhost:5173 (o el siguiente puerto libre)
yarn test       # tests de lógica (Vitest)
yarn build      # tsc --noEmit + build de producción → dist/
yarn typecheck  # solo chequeo de tipos
```

Requisitos: Node ≥ 22, Yarn 4 (Corepack). Es una SPA estática: `yarn build` genera
`dist/` deployable en Cloudflare Pages / Vercel / Netlify sin cambios.

---

## Concepto

El personaje es una **silueta plana de un solo color**: un esqueleto de huesos
dibujados como trazos gruesos de puntas redondeadas (`stroke-linecap="round"`)
que se fusionan en una sola mancha continua, más una cabeza circular. La **línea
de suelo (`groundY`) es constante en todos los frames**, así la animación no
vibra al importarla en Godot.

Hay **dos modos** (toggle en la barra superior):

- **Humanoide** — el rig clásico (cabeza, torso, 2 brazos, 2 piernas) totalmente
  paramétrico y animable.
- **Rig personalizado** — un editor de esqueleto genérico (árbol de huesos) para
  criaturas no-humanoides: cuadrúpedos, aves, slimes, o lo que definas.

---

## Funcionalidades

### Personaje (modo humanoide)
- Proporciones paramétricas agrupadas por parte (cabeza/cuello, torso, brazos,
  piernas/pies): diámetro de cabeza, largo de torso/piernas, ancho de miembros,
  longitudes, etc. Cada valor con **slider + input** (acepta coma o punto, y
  flechas ↑/↓).
- **Cuello** (separación cabeza↔cuerpo) y **separación de brazos** ajustables.
- **Curvatura** de brazos y piernas, por segmento (superior/antebrazo,
  muslo/pantorrilla) y eligiendo a qué lado aplica (ambos / cercano / lejano).
- Indicador de la suma cabeza + torso + piernas (avisa si ≠ 100, sin bloquear).

### Partes
- **Visibilidad por parte**: apagás una parte (cabeza, torso, cada brazo/pierna).
  En el editor queda grisácea; en el **export se excluye**. Ideal para exportar
  cada miembro por separado y animar/componer en Godot.
- **Color por parte** con botón de reset al color base.

### Efectos
- **Sombra**: modo *piso* (proyectada y aplastada sobre el suelo, como una sombra
  real) o *desplazada*; color, opacidad, dirección, largo, desenfoque.
- **Brillo** de contorno: color, opacidad, expansión, intensidad.
- **Contorno / borde**: color y grosor.

### Accesorios
- Formas (barra / círculo / rect) **ancladas a un hueso** (mano, cabeza, hombro,
  pie, cadera…) que siguen la animación. Color, opacidad, offset, ángulo,
  delante/detrás de la silueta.

### Giro 3D
- Simula el giro del personaje alrededor de su eje vertical (frente / perfil /
  espaldas) escorzando el eje lateral. Dial de 8 direcciones (top-down) + slider.
- El export puede generar **las 8 direcciones** (`_d0`…`_d7`).

### Animación
- Clips (`idle`, `walk`, `run`, `jump`, `fall`, `attack`, `defend`, `hurt`,
  `death` por defecto) con `frames` / `fps` / `loop`.
- Timeline de keyframes **arrastrables**; agregar / duplicar / eliminar.
- Editor de pose por articulación (acordeones) con espejar / copiar / pegar pose.
- **Easing por keyframe** (lineal / ease-in / ease-out / ease-in-out).
- Reproducción con `requestAnimationFrame`, onion skin, guías, tira de miniaturas.

### Imagen de referencia
- Cargás una imagen de fondo semitransparente para calcar proporciones
  (opacidad + escala + mostrar/ocultar). Es una ayuda de sesión, no se persiste
  ni se exporta.

### Rig personalizado (no-humanoide)
- **Árbol de huesos**: cada hueso tiene padre, punto de nacimiento sobre el padre
  (0=base, 1=punta), ángulo relativo, largo, grosor, **forma** (barra / círculo /
  rect), curvatura, color propio y orden de dibujo (z). Todo con slider + input.
- Agregar / eliminar huesos (borrar arrastra a los hijos), selección y edición
  con preview en vivo. Cinemática directa a prueba de ciclos.
- **Presets**: Cuadrúpedo, Ave, Slime, Vacío.
- Color por hueso + reset individual o **resetear todos al color base**.
- Export estático PNG / SVG del rig.

### Persistencia y proyecto
- Autoguardado en `localStorage` (debounce 500 ms).
- **Undo / Redo** (`Ctrl+Z` / `Ctrl+Y`), con las ráfagas de un slider coalescidas
  en un solo paso.
- Exportar / importar el proyecto completo como `.json` (validación tolerante:
  los proyectos viejos migran solos al agregarse campos nuevos).
- Biblioteca de presets de personaje.

### Exportación
- Tamaño de celda por presets (16…1024) o valor libre.
- Sprite sheets por animación, frames sueltos, SVG, `manifest.json`,
  `project.json`, y **recurso Godot 4** (`SpriteFrames .tres`), todo en un ZIP.
- Barra de progreso durante el rasterizado (SVG → canvas → PNG, con alpha).

---

## Arquitectura

`src/core/` es **puro** (sin React / MUI / DOM salvo el rasterizado en
`export.ts`), así que la lógica se testea directo y se podría reutilizar en un CLI.

```
src/
  core/
    rig.ts          # tipos + cinemática directa del humanoide (buildSkeleton)
    customRig.ts    # rig genérico: árbol de huesos + FK + presets
    poses.ts        # animación: interpolación, sampleClip, clips y tipos del proyecto
    svg.ts          # primitivas y markup SVG (preview + export lo reutilizan)
    export.ts       # rasterizado a PNG, ZIP y recurso Godot
    validation.ts   # validación/migración tolerante del proyecto importado
  store/
    useProjectStore.ts   # Zustand: estado + acciones + historial + persistencia
  components/       # UI (MUI v7)
  App.tsx  main.tsx theme.ts
```

**Stack:** React 19 + Vite + TypeScript strict · MUI v7 + Emotion · Zustand v5 ·
Vitest · jszip. Sin `any`, solo arrow functions. `nodeLinker: node-modules`.

---

## Estado y roadmap

Funcional y verificado (tests + typecheck + build). El **rig genérico** se
construye por fases:

- ✅ **Fase 1** — editor de huesos, render estático, presets, export PNG/SVG.
- ⏳ **Fase 2** — animación por keyframes por hueso (hoy el rig custom es estático).
- ⏳ **Fase 3** — más presets y biblioteca.

Ver [CONTRIBUTING.md](./CONTRIBUTING.md) si querés colaborar.

---

## Licencia

MIT — ver [LICENSE](./LICENSE).
