# Sprite Forge

Parametric generator of **2D silhouette-style sprites** for games, with
**Godot-ready** export. 100% local web app — no backend, no accounts, no
telemetry. All state lives in `localStorage`.

Design a silhouette character (or a non-humanoid creature), animate it with
keyframes, and export sprite sheets / frames / SVG / Godot resources.

The UI ships in **English and Spanish** (auto-detected from the browser,
toggle in the top bar).

![local](https://img.shields.io/badge/mode-100%25%20local-informational) ![tests](https://img.shields.io/badge/tests-vitest-green) ![license](https://img.shields.io/badge/license-MIT-blue)

---

## Quick start

```bash
yarn install
yarn dev        # http://localhost:5173 (or next free port)
yarn test       # logic tests (Vitest)
yarn build      # tsc --noEmit + production build → dist/
yarn typecheck  # type-check only
```

Requirements: Node ≥ 22, Yarn 4 (Corepack). It's a static Vite SPA: `yarn build`
outputs `dist/`, deployable on Cloudflare Pages / Vercel / Netlify as-is (Vercel
auto-detects Vite; build `yarn build`, output `dist`).

---

## Concept

The character is a **flat, single-color silhouette**: a skeleton of bones drawn
as thick round-capped strokes (`stroke-linecap="round"`) that fuse into one
continuous shape, plus a circular head. The **ground line (`groundY`) is constant
across every frame**, so the animation doesn't jitter once imported into Godot.

There are **two modes** (toggle in the top bar):

- **Humanoid** — the classic parametric rig (head, torso, 2 arms, 2 legs), fully
  animatable.
- **Custom rig** — a generic bone-tree editor for non-humanoid creatures:
  quadrupeds, birds, slimes, or whatever you build.

---

## Features

### Character (humanoid mode)
- Parametric proportions grouped by body part (head/neck, torso, arms, legs/feet):
  each value has a **slider + numeric input** (accepts comma or dot decimals, and
  arrow-key stepping).
- Independent **torso width**, **neck length** (head↔body gap) and **arm spacing**.
- **Limb curvature** per segment (upper/forearm, thigh/shin) and per side
  (both / right / left).
- Sum indicator for head + torso + legs (warns if ≠ 100, without blocking).

### Parts
- **Per-part visibility**: turn a part off (head, torso, each arm/leg). It shows
  greyed in the editor and is **excluded from export** — great for exporting each
  limb separately to animate/compose in Godot.
- **Per-part color** with reset to the base color.

### Effects
- **Shadow**: ground mode (flattened and projected onto the floor, like a real
  shadow) or drop mode; color, opacity, direction, length, blur.
- **Glow** outline: color, opacity, expansion, intensity.
- **Outline / border**: color and width.

### Accessories
- Shapes (capsule / circle / rect) **anchored to a bone** (hand, head, shoulder,
  foot, hip…) that follow the animation. Color, opacity, offset, angle,
  front/behind the silhouette.

### 3D turn
- Simulates turning the character around its vertical axis (front / profile /
  back) by foreshortening the lateral axis. 8-direction dial (top-down) + slider.
- Export can generate **all 8 directions** (`_d0`…`_d7`).

### Animation
- Clips (`idle`, `walk`, `run`, `jump`, `fall`, `attack`, `defend`, `hurt`,
  `death` by default) with `frames` / `fps` / `loop`.
- **Draggable** keyframe timeline; add / duplicate / delete.
- Per-joint pose editor (accordions) with mirror / copy / paste pose.
- **Per-keyframe easing** (linear / ease-in / ease-out / ease-in-out).
- Playback via `requestAnimationFrame`, onion skin, guides, thumbnail strip.

### Reference image
- Load a semi-transparent background image to trace proportions (opacity + scale
  + show/hide). Session aid only — not persisted, not exported.

### Custom rig (non-humanoid)
- **Bone tree**: each bone has a parent, attach point on the parent (0=base,
  1=tip), relative angle, length, width, **shape** (capsule / circle / rect),
  curvature, own color, and draw order (z). All with slider + input.
- Add / delete bones (deleting cascades to children), selection and editing with
  live preview. Cycle-safe forward kinematics.
- **Presets**: Quadruped, Bird, Slime, Blank.
- Per-bone color + individual reset or **reset all to base color**.
- **Animation** (same as humanoid): rig clips with `frames`/`fps`/`loop`,
  draggable keyframe timeline, **per-bone angle editor** per keyframe, easing,
  live playback and thumbnails. The quadruped ships with a demo `walk`.
- Static PNG / SVG export, plus **animated rig** export: sheets / frames / SVG /
  manifest / **Godot 4 `.tres`**.

### Persistence & project
- Autosave to `localStorage` (500 ms debounce).
- **Undo / Redo** (`Ctrl+Z` / `Ctrl+Y`), with slider drags coalesced into a
  single history step.
- Export / import the full project as `.json` (tolerant validation: old projects
  migrate automatically as new fields are added).
- Character preset library.

### Export
- Cell size by presets (16…1024) or a custom value.
- Sprite sheets per animation, individual frames, SVG, `manifest.json`,
  `project.json`, and a **Godot 4 SpriteFrames `.tres`** — all zipped.
- Progress bar while rasterizing (SVG → canvas → PNG, alpha preserved).

---

## Architecture

`src/core/` is **pure** (no React / MUI / DOM except the rasterizer in
`export.ts`), so the logic is directly testable and reusable in a CLI.

```
src/
  core/
    rig.ts          # types + humanoid forward kinematics (buildSkeleton)
    customRig.ts    # generic rig: bone tree + FK + presets + rig animation
    poses.ts        # animation: interpolation, sampleClip, project types
    easing.ts       # easing curves (neutral module)
    svg.ts          # SVG primitives & markup (preview + export reuse it)
    export.ts       # PNG rasterizing, ZIP and Godot resource
    validation.ts   # tolerant validation/migration of imported projects
  store/
    useProjectStore.ts   # Zustand: state + actions + history + persistence
  i18n.ts           # EN/ES dictionary + useT hook
  components/       # UI (MUI v7)
  App.tsx  main.tsx theme.ts
```

**Stack:** React 19 + Vite + TypeScript strict · MUI v7 + Emotion · Zustand v5 ·
Vitest · jszip. No `any`, arrow functions only. `nodeLinker: node-modules`.

---

## Guides & status

- [docs/ROADMAP.md](./docs/ROADMAP.md) — status, done, pending and known limits.
- [docs/WORKFLOW.md](./docs/WORKFLOW.md) — combining Sprite Forge + Krita + AI to
  prototype 2D assets fast without being an artist. *(Spanish)*
- [docs/STACKS.md](./docs/STACKS.md) — precise per-style recipes (silhouette, 2D
  painterly, pixel art, AI, 3D→2D, 3D) and how each maps to Godot nodes. *(Spanish)*
- [docs/AI-COPILOT.md](./docs/AI-COPILOT.md) — verified open-source MCP servers to
  use Claude as an asset copilot. *(Spanish)*

See [CONTRIBUTING.md](./CONTRIBUTING.md) to contribute (fork + PR).

---

## License

MIT — see [LICENSE](./LICENSE).
