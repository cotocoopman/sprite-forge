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
- **Accessories**: shapes (bar/circle/rect) anchored to a bone, following the animation.
- **3D turn** (facing) with an 8-direction dial + slider.
- **Animation**: 9 default clips, draggable timeline, per-joint pose editor
  (mirror/copy/paste), per-keyframe easing, playback, onion skin, guides, thumbnails.

### Custom rig mode (non-humanoid)
- **Phase 1** — bone-tree editor (parent, attach point, angle, length, width,
  bar/circle/rect shape, curvature, per-bone color, z), cycle-safe FK, presets
  (Quadruped/Bird/Slime/Blank), numeric inputs, static PNG/SVG export.
- **Phase 2** — per-bone keyframe animation: rig clips, draggable timeline,
  per-bone angle editor, easing, playback, thumbnails, and animated-rig export
  (sheets/frames/SVG/manifest/Godot `.tres`).

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

- **Rig phase 3** — more presets / creature library (biped, snake, fish, ship…)
  and saving your own rigs as presets.
- **Weapons/props as mini-rigs** — humanoid accessories stayed basic (a single
  shape doesn't make a real sword/pistol). Solve it by composing bones: a weapon
  = a small rig anchorable to a hand.
- **8-direction export for the custom rig** — the 3D turn (facing) is humanoid-only
  today; the generic rig exports a single direction.
- **Effects on the custom rig** — shadow / glow / outline apply only to the humanoid.
- **Persist the reference image** — currently in memory (lost on reload).

## ⚠️ Known limitations

- **Humanoid 3D turn**: at pure profile (90°/270°) arm swing flattens and looks a
  bit stiff — intrinsic to faking 3D from a flat silhouette. Diagonals look fine.
- **Testing**: by design (founder mode) only `core/` logic is tested, not UI.
- **Bundle**: heavy due to MUI; no code-splitting (it's a local tool, not critical).

---

## Ideas / backlog

- Copy animations between characters/rigs.
- IK (inverse kinematics) for foot planting.
- Atlas packing (all animations in one sheet + JSON).
- GIF/APNG preview export.
- Color variants (skins) exported at once.
- Randomize character (one click → random proportions/colors).

## Community / infra (deferred — revisit when there's traffic)

- **GitHub Actions CI** (typecheck + test on PR). Held off intentionally until the
  repo sees contributors — no point automating gates with zero traffic yet.
- **Example Godot project** — a tiny `.zip`/repo importing a Sprite Forge export so
  people can open-and-run it. See [GODOT.md](./GODOT.md).
- **Demo video / GIF walkthrough** — short screen recording for the README + socials.
