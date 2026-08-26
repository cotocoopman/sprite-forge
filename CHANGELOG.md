# Changelog

All notable changes are documented here and in the
[GitHub Releases](https://github.com/cotocoopman/sprite-forge/releases).
This project follows [Semantic Versioning](https://semver.org/).

## [2.6.0] — 2026-08-26

- **Arc tool.** The shape toolbar has a new "Arc" option that draws a curved (oval)
  line. Its inclination is adjustable — drag to set the chord, then tune the "Arc
  inclination" slider in the accessory editor (negative/positive curves either way).
- **Accessories & weapons turn in 3D.** Drawn objects, accessories and weapons now
  foreshorten with the character's 3D turn (facing) — around their anchor, just like
  the body — so rotating a character (or exporting the 8 directions) also turns the
  sword/shield/etc. Custom-rig weapons already turned; this brings the humanoid side
  in line. At facing 0 nothing changes (no regression).

## [2.5.0] — 2026-08-25

- **Panels remember their state.** Every collapsible section and accordion (Character
  groups, Pose groups, Layers, Accessories, Effects, …) and the Animations/Layers tab
  now persist their last open/closed choice across reloads instead of always resetting.
- **Per-frame part offsets (animation).** Each body part can now be nudged on X and Y
  *per keyframe* from the Pose editor (interpolated between keyframes), on top of the
  global part transform — much more flexibility when animating. Imported projects are
  respected exactly as they were: poses without offsets render identically.
- **Space always plays/pauses.** The shortcut no longer needs the canvas focused — it
  toggles playback regardless of which button/control has focus (only text fields are
  exempt).
- **Keyframe keyboard actions.** With a keyframe selected, Delete/Supr removes it, and
  Ctrl+C / Ctrl+X / Ctrl+V / Ctrl+D copy, cut, paste and duplicate it. When an object
  (accessory/bone/part) is the active selection, those keys still act on the object.
- **Reorder animations by drag & drop.** The animation clips list (humanoid and rig)
  now has drag handles to move clips up/down, like other lists.
- **Fixed skin export recolor.** Color variants (skins) now recolor the *whole*
  silhouette — a part or bone with its own color override (e.g. a torso left on black)
  no longer stays that color; it follows the skin color as expected.

## [2.4.4] — 2026-08-25

- **Easing descriptions.** The easing dropdown (humanoid and rig) now shows a short
  description under each option — Lineal (constant), Ease-in (slow start, speeds up),
  Ease-out (fast start, brakes at the end), Ease-in-out (soft at both ends) — so it's
  clear what each does. The closed field still shows just the name.

## [2.4.3] — 2026-08-25

- **Consistent keyframe highlight.** The active keyframe diamond in the right-panel
  timeline (humanoid and rig) is now the same amber as the selected marker on the
  playback bar, reinforcing that they refer to the same keyframe.

## [2.4.2] — 2026-08-25

- **Clearer keyframe markers on the playback bar.** The diamonds now sit just above
  the slider line (instead of on it, where they were easy to miss), and the selected
  keyframe's diamond is highlighted in amber (and slightly larger) so it's obvious
  which keyframe the playhead is on.

## [2.4.1] — 2026-08-25

- **Keyframe markers on the playback bar.** The play/frame slider now shows a small
  diamond at each keyframe's frame position (same mapping as the timeline), so it's
  obvious which frames are keyframes (e.g. 12/30, 24/30) while scrubbing. Works for
  humanoid and rig.

## [2.4.0] — 2026-08-25

- **Unified animation timeline (single playhead + auto-key).** Keyframes and the
  frame/playback cursor are no longer separate: there is one time cursor.
  - Selecting a keyframe moves the playhead to it, and moving the playhead onto a
    keyframe selects it. Keyframes snap to real frame positions (no abstract `t`).
  - The pose editor now shows the pose **at the playhead** (sampled), and every joint
    is always editable.
  - **Auto-key**: editing a pose on an interpolated frame creates a keyframe there
    (toggle "Auto-key", on by default; off = classic select-keyframe-then-edit, with a
    clear hint). The editor labels the frame as *keyframe* vs *interpolated*.
  - Applies to both the humanoid and the custom-rig animation panels. The tweened,
    sparse-keyframe model is unchanged — only the editing UX is fixed.

## [2.3.0] — 2026-08-25

- **Move & rotate body parts.** Body parts can now be **repositioned** and **rotated**
  freely, not just lengthened/thickened. On the canvas: drag a part's body to move it,
  drag the tip handle to rotate + set length (like accessories, `Shift` snaps to 15°),
  and the side handle for thickness. The Layers editor also gains a **rotation** slider.
  Transforms are applied on top of the kinematics, so poses/animations keep working and
  the skeleton stays intact. New per-part fields `rotate` / `dx` / `dy` (validated,
  clamped, and cleared by "Restablecer forma/tamaño"); older projects default to 0.

## [2.2.0] — 2026-08-25

- **Mobile layout.** Below the `md` breakpoint the app now uses a phone-first shell
  (desktop is unchanged): the canvas fills almost the whole screen, with everything
  else reachable without scrolling past it.
  - **Compact top bar**: title · Humano/Rig mode toggle · export-sprites button · a
    `⋮` overflow menu with undo/redo, import, export project/sprites, language,
    quick guide, shortcuts, GitHub and master reset.
  - **Bottom navigation** (Diseño · Capas · Animar · Girar) — each opens a swipeable
    **bottom sheet** with that panel group (character/accessories/effects/presets,
    layers, animation timeline + pose, or the 3D-turn dial), so object editors stay
    usable one-handed without covering the canvas.
  - Playback controls stay pinned under the canvas; the thumbnail strip moves into
    the Animar sheet to give the canvas more room.
  - All panels are reused as-is — no duplicate logic.

## [2.1.1] — 2026-08-25

- **Master reset** — a reset button at the end of the top toolbar wipes the current
  work (character, parts, accessories, animations, rig) back to the default, behind a
  confirmation dialog. Saved presets, language and the reference image are kept, and
  it can be undone with `Ctrl+Z`.
- Note: work was already auto-saved to `localStorage` (debounced) and restored on
  reload — F5 does not lose your design; only transient UI state (selection, current
  frame) resets, which is expected.
- **Removed the redundant "Partes" panel** from the left column — body-part
  visibility, color, rename and now shape/size all live in the **Capas (Layers)**
  panel, so the duplicate section is gone.

## [2.1.0] — 2026-08-25

- **Body parts are editable layers now.** Each body part (head, torso, arms, legs)
  can change **shape** (capsule, rectangle, triangle, circle, trapezoid, star, bolt),
  **thickness** (`widthScale`) and **length** (`lengthScale`) — independently per
  part, so you can make one arm longer/chunkier than the other. Length is baked into
  the kinematics, so the chain stays connected and poses/animations keep working
  (accessory anchors follow the resized limb).
  - **Layers panel** — body-part rows are now selectable and open an inline editor
    (shape + grosor× + largo× + reset), mirroring accessories.
  - **On-canvas** — select a body part directly on the canvas and drag its amber
    handles to scale length (tip) and thickness (side).
  - Thumbnails and exports (single cell + sheet) reflect the new per-part shape/size.
  - Older projects load unchanged: missing shape/scale fields default to
    capsule / ×1 (validated and clamped on import).
- **3D-turn degree input** — the Giro 3D dial (humanoid *and* custom rig) now has a
  typeable degrees field next to the slider; values wrap into 0–359 (360 → 0).

## [2.0.2] — 2026-08-24

- **Docs** — README now documents the Privacy/Analytics behavior: the hosted demo
  uses cookieless Vercel Web Analytics, scoped to that deployment only (forks and
  local runs never send data).

## [2.0.1] — 2026-08-24

- **Vercel Web Analytics** — added cookieless, anonymous pageview analytics for the
  hosted deployment only (self-hosted/forked copies never send data here).

## [2.0.0] — 2026-08-24

**Canvas editor & Layers milestone.** This release cuts a version for the whole pool of
on-canvas editing added on top of the parametric generator (shipped incrementally in
1.2 → 1.11):

- **Canvas editor** — a toolbar over the preview (Select · Pencil · Shape · Eraser),
  freehand drawing, parametric shapes (rectangle / circle / triangle / trapezoid / star /
  bolt / bar), on-canvas transform (drag to move, tip handle to rotate + resize length,
  corner handle for width), object copy / cut / paste / duplicate / flip, a Figma-style
  right-click context menu, and Shift snapping. Works in both humanoid and custom-rig
  modes; everything drawn is a real, animatable object that follows the rig.
- **Layers panel** — a Capas tab listing every body part, accessory or bone with
  show/hide, color, inline rename, duplicate, delete, and drag-to-reorder.
- **Object→object anchoring** — accessories can hang off another object's base / center /
  tip (cycle-safe) instead of only body bones.

### Docs
- Refreshed the README screenshots to the current UI (canvas toolbar, Layers panel and
  custom rig) and added a Layers panel image.

## [1.11.2] — 2026-08-24

### Docs
- Documented the canvas editor (drawing tools, shapes, layers, on-canvas transform,
  object ops + context menu, object→object anchoring) in the README, the in-app quick
  guide, and the roadmap.

## [1.11.1] — 2026-08-24

### Changed
- Drawn shapes get a default layer name by kind (Rectángulo, Círculo, Triángulo,
  Trapecio, Estrella, Rayo, Barra) instead of "Forma".
- Any layer can be renamed by double-click, including body parts.

### Fixed
- Flip horizontal/vertical now mirrors the object in place instead of moving it to the
  opposite side of its anchor.

## [1.11.0] — 2026-08-23

### Added
- **Right-click context menu** on the canvas (both modes): right-clicking selects the
  object under the cursor and opens a Figma-style menu with Duplicate, Copy, Cut, Paste,
  Flip H/V and Delete (with their keyboard shortcuts).

## [1.10.0] — 2026-08-23

### Added
- **Layers moved to the right panel** as a tab (Animaciones / Capas), out of the left
  column, with a **Duplicate** button per layer row.

### Changed
- Pencil and Eraser toolbar icons now look like a pencil and an eraser.
- Selection outline is more subtle; the resize handle sits at the shape's corner.
- The Accessories panel no longer duplicates the object list (that lives in Capas now);
  select a layer to edit it.

### Fixed
- **Rotation direction**: dragging the rotate handle now turns objects toward the cursor
  (accessory angle convention was inverted).
- **Shape creation**: rectangle / triangle / trapezoid / bolt are now drawn as a centered
  bounding box instead of a thin bar stretched along the mouse (circle/star/bar unchanged).

## [1.9.0] — 2026-08-23

### Added
- **Drag-to-reorder layers:** each layer row has a drag handle; drop it on another row
  to change its draw order (works for accessories and bones, alongside the up/down
  buttons).

## [1.8.1] — 2026-08-23

### Fixed
- On-canvas selection, hit-testing and dragging now use the resolved anchor frame, so
  an accessory anchored to another object is selected and moved at its real position
  (not its fallback body anchor). The anchor resolver is shared between render and
  interaction.

## [1.8.0] — 2026-08-23

### Added
- **Parametric shapes:** the shape tool can now draw a **star**, **trapezoid** and
  **bolt (lightning)**, sized and oriented by the drag, as filled polygons.
- **Object→object anchoring (humanoid):** an accessory can be anchored to another
  accessory's base / center / tip (picked in the accessory editor) instead of a body
  bone, so drawn objects can hang off other drawn objects and still follow the
  animation. Anchoring resolves through short chains and is cycle-safe. (In the custom
  rig, bones already re-parent to any bone with an attach point.)

### Fixed
- Save/load preserves the new shapes and the `anchorTo` reference.

## [1.7.0] — 2026-08-23

### Added
- **Object editing:** copy / cut / paste / duplicate and flip horizontal / vertical for
  the selected object (accessory or bone), with keyboard shortcuts (Ctrl+C/X/V/D,
  Delete, H, V) and toolbar buttons.
- **Shift modifiers:** hold Shift to draw a straight line with the pencil, snap a
  shape's angle to 45°, and snap rotation to 15° when dragging the rotate handle.
- **Group move:** dragging one piece of an inserted weapon/prop moves the whole group.
- **Rename layers inline:** double-click a layer's name in the Layers panel.

## [1.6.0] — 2026-08-23

### Added
- **Pencil tool (freehand drawing):** a new `path` shape backed by a point list, drawn
  as a smooth round-capped stroke. Draw with click-and-drag; the stroke becomes an
  accessory (humanoid, anchored to the torso) or a bone (custom rig), so it follows the
  animation and can be recolored, moved and layered like anything else.
- Stroke thickness control shared with the shape tool.

### Fixed
- Save/load preserves the new `path` shape and its points on both accessories and bones.

## [1.5.0] — 2026-08-23

### Added
- **Drawing toolbar** above the canvas: Select, Shape and Eraser tools.
- **Shape tool:** pick rectangle / circle / triangle / bar and a thickness, then click
  and drag on the canvas to draw it. Each shape becomes a real object — an accessory
  (humanoid, anchored to the torso) or a bone (custom rig) — so it follows the animation
  and can be recolored, moved, transformed and layered like anything else.
- **Eraser:** click an object to delete it.

## [1.4.0] — 2026-08-23

### Added
- **Transform handles on the canvas:** a selected object now shows a tip handle
  (drag to rotate + change length, pivoting at its base) and a side handle (drag to
  change width/thickness). Circles resize their diameter. Works for accessories
  (humanoid) and bones (custom rig), on top of the existing drag-to-move.

## [1.3.0] — 2026-08-23

### Added
- **On-canvas manipulation:** click an object in the preview to select it and drag
  to move it. Works in both modes — accessories (humanoid) move along their anchor
  axes; bones (custom rig) move by their world offset, carrying their children. A
  dashed outline marks the selection.

## [1.2.0] — 2026-08-23

### Added
- **Layers panel** (Photoshop/Krita style): a single list of every object with
  show/hide (eye), color swatch, select, reorder (z / draw order) and delete.
  Humanoid mode groups Body parts + Accessories; custom-rig mode lists bones.
- Custom-rig bones can be hidden (eye toggle); hidden bones still position their
  children but aren't drawn.

### Fixed
- Save/load now preserves `triangle` shapes (previously downgraded to `capsule`),
  bone `offset`, and accessory `propId`/`hidden` — round-tripping a project no
  longer loses the projectile shape, standalone-weapon geometry or prop grouping.

## [1.1.1] — 2026-08-23

### Changed
- Reworked several presets so they read like their thumbnails: Pistol/Dual pistols
  (proper side-view handgun), Shield (heater shape + boss), Bow (curved limbs +
  string + arrow), Bazooka (tube + flared muzzle + warhead), Dog (jointed legs with
  paws + ears), Shark (pointed snout, dorsal/tail fins), Bat (angular wings), Wave
  (curling crest with foam).
- Weapons can carry a `handSpin` so the held orientation is decoupled from the
  standalone weapon-rig orientation; both now look right.

## [1.1.0] — 2026-08-22

### Added
- Ammo/projectile props on both rigs: **Laser** (glowing bolt) and **Projectile**
  (elongated triangle), so bullets can be drawn as their own sprites.
- New **triangle** shape for accessories and custom-rig bones.
- Custom-rig weapon presets: every humanoid weapon/prop is now available as a
  standalone rig (creatures + weapons sections in the template gallery, and in the
  rig preset dropdown), so weapons can be created/animated/exported on their own.
  Weapons are derived from a single source (`PROP_TEMPLATES`), so any new one shows
  up on both the humanoid and custom-rig sides automatically.

### Changed
- Accessory/weapon sliders now have numeric inputs (like the rig editor) for exact values.

### Fixed
- Death animation: the fallen body is re-centered horizontally so the head no longer
  clips past the export cell edge.

## [1.0.0] — 2026-08-18

First public release. A free, 100% local web app to design, animate and export 2D
silhouette sprites for games, with Godot-ready output.

### Humanoid mode
- Parametric rig (head, torso, 2 arms, 2 legs) with its own forward kinematics.
- Proportions grouped by part; slider + numeric input (comma/dot decimals, arrow steps).
- Neck (head↔body gap), arm spacing, independent torso width.
- Per-segment, per-side limb curvature.
- Parts: on/off visibility (excluded from export) and per-part color with reset.
- Effects: shadow (floor/drop), glow outline, outline/border.
- Accessories anchored to bones that follow the animation.
- 3D turn (facing) with an 8-direction dial.
- Animation: 9 default clips, draggable keyframe timeline, per-joint pose editor
  (mirror/copy/paste), per-keyframe easing, playback, onion skin, thumbnails.

### Custom rig mode (non-humanoid)
- Bone-tree editor with cycle-safe FK; presets (Quadruped/Bird/Slime/Blank).
- Per-bone shape (bar/circle/rect), curvature, color and draw order.
- Keyframe animation per bone (timeline, per-bone angle editor, easing, playback).

### Export
- Cell size presets (16…1024) or custom.
- Sprite sheets, frames, SVG, `manifest.json`, `project.json`, Godot 4 `.tres`.
- 8-direction export (humanoid).

### Platform
- Bilingual UI (EN/ES) with browser auto-detect + toggle.
- Undo/redo (Ctrl+Z / Ctrl+Y) with coalesced slider drags.
- Autosave and project import/export with tolerant migration.
- Responsive layout. Pure core covered by 50 Vitest tests.

[2.0.0]: https://github.com/cotocoopman/sprite-forge/releases/tag/v2.0.0
[1.0.0]: https://github.com/cotocoopman/sprite-forge/releases/tag/v1.0.0
