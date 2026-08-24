# Roadmap & status

Project status — what's done and what's pending. Updated by hand.

---

## ✅ Done

### Humanoid mode
- Parametric rig (head, torso, 2 arms, 2 legs) with its own forward kinematics.
- Proportions grouped by part, each with slider + input (comma or dot decimals,
  arrow-key stepping).
- Neck (head↔body gap), arm spacing, independent torso width.
- Granular curvature per segment (upper/forearm, thigh/shin) and per side
  (both / right / left).
- **Parts**: on/off visibility (hidden = greyed in the editor, excluded from
  export) and per-part color with reset to base.
- **Effects**: shadow (floor / drop mode), glow outline, outline/border.
- **Accessories & objects**: shapes (bar/circle/rect/triangle/trapezoid/star/bolt/
  freehand path) anchored to a bone **or to another object** (base/center/tip),
  following the animation.
- **3D turn** (facing) with an 8-direction dial + slider.
- **Animation**: 9 default clips, draggable timeline, per-joint pose editor
  (mirror/copy/paste), per-keyframe easing, playback, onion skin, guides, thumbnails.

### Custom rig mode (non-humanoid)
- **Phase 1** — bone-tree editor (parent, attach point, angle, length, width,
  shape (bar/circle/rect/triangle/trapezoid/star/bolt/path), curvature, per-bone
  color, z), cycle-safe FK, presets, numeric inputs, static PNG/SVG export.
- **Phase 2** — per-bone keyframe animation: rig clips, draggable timeline,
  per-bone angle editor, easing, playback, thumbnails, and animated-rig export
  (sheets/frames/SVG/manifest/Godot `.tres`).

### Canvas editor / "mini-Krita" (v1.1–1.11)
- **Drawing tools**: pencil (freehand → polyline primitive, Shift = straight line),
  shape tool (rect/circle/triangle/trapezoid/star/bolt/bar, Shift = 45° snap), eraser.
- **On-canvas transform**: select, move, rotate + resize (tip handle), width (corner
  handle), Shift = 15° snap.
- **Object ops**: copy/cut/paste/duplicate, flip H/V — keyboard, toolbar and a
  right-click context menu.
- **Layers panel** (tab): show/hide, color, rename (incl. body parts), duplicate,
  delete, reorder via buttons or drag-and-drop.
- **Object→object anchoring** + weapons/props as standalone rigs. Group move by prop.
- Everything drawn/loaded is an animatable object that follows the rig.

### Export
- Cell size by presets (16…1024) or custom.
- Sprite sheets, individual frames, SVG, `manifest.json`, `project.json`,
  **Godot 4 `.tres`**.
- **8 directions** (3D turn) — humanoid.

### Platform
- 100% local (no backend), autosave to `localStorage`, coalesced undo/redo.
- Import/export project `.json` with tolerant validation/migration.
- **Bilingual UI (EN/ES)** with browser auto-detect + toggle.
- Responsive (columns stack on mobile).
- Pure core tested with Vitest. Docs. Backed up on GitHub (`main`).

---

## ⏳ Pending

- **Rig phase 3** — bigger creature library and saving your own rigs as presets.

### ✅ Recently shipped
- **20 built-in templates** (10 humanoid + 10 rig) with a clear TEMPLATE badge.
- **Randomize character** (one click → random proportions/colors, height-normalized).
- **Persist the reference image** across reloads.
- **Copy animations** between characters/rigs via export/import JSON.
- **Atlas export** — single PNG with every frame + `atlas.json` regions.
- **Color variants (skins)** — export multiple palettes at once.
- **Weapons/props as mini-rigs** — composed props (sword, axe, staff, pistol,
  shield, bow) anchored to a hand, following the animation.
- **8-direction turn for the custom rig** — in-plane rotation + `_d0.._d7` export.
- **Effects on the custom rig** — shadow / glow / outline now apply to rigs too.

## ⚠️ Known limitations

- **Humanoid 3D turn**: at pure profile (90°/270°) arm swing flattens and looks a
  bit stiff — intrinsic to faking 3D from a flat silhouette. Diagonals look fine.
- **Testing**: by design (founder mode) only `core/` logic is tested, not UI.
- **Bundle**: heavy due to MUI; no code-splitting (it's a local tool, not critical).

---

## Ideas / backlog

- IK (inverse kinematics) for foot planting.
- GIF/APNG preview export.

## Community / infra (deferred — revisit when there's traffic)

- **GitHub Actions CI** (typecheck + test on PR). Held off intentionally until the
  repo sees contributors — no point automating gates with zero traffic yet.
- **Example Godot project** — a tiny `.zip`/repo importing a Sprite Forge export so
  people can open-and-run it. See [GODOT.md](./GODOT.md).
- **Demo video / GIF walkthrough** — short screen recording for the README + socials.
