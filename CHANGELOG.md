# Changelog

All notable changes are documented here and in the
[GitHub Releases](https://github.com/cotocoopman/sprite-forge/releases).
This project follows [Semantic Versioning](https://semver.org/).

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

[1.0.0]: https://github.com/cotocoopman/sprite-forge/releases/tag/v1.0.0
