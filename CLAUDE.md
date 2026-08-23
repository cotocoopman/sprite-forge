# sprite-forge — project instructions

Free, 100% local web app to design, animate and export 2D silhouette sprites for
games (Godot-ready). React 19 + Vite + TypeScript + MUI + Zustand. No backend.

## Versioning — REQUIRED on every change

Every change that gets committed MUST bump `version` in `package.json` (`x.y.z`):

- **x** (major): huge change / a whole pool of new functionality (e.g. a complete
  new custom-rig module).
- **y** (minor): new features and functionality.
- **z** (patch): minor fixes, bug resolution, small tweaks to existing behavior.

Also add a matching entry at the top of `CHANGELOG.md` (dated, Keep-a-Changelog style).

## Weapons / accessories — always both sides

Any accessory or weapon that is added MUST exist on **both** rigs:
- Humanoid: `PROP_TEMPLATES` in `src/core/props.ts` (accessories gallery).
- Custom rig: derived automatically from `PROP_TEMPLATES` via `src/core/weaponRigs.ts`
  (`propToRig` → `WEAPON_RIG_TEMPLATES`). Because the custom side is generated from the
  humanoid source, adding a new `PROP_TEMPLATE` surfaces it on both sides for free —
  keep it that way; don't fork the weapon list.

## Architecture notes

- Import direction: `poses.ts` → `customRig.ts`; `props.ts` → `poses.ts`. So
  `customRig.ts` must NOT import `props.ts` (would cycle). Code that composes both
  (e.g. weapon→rig conversion) lives in a separate leaf module (`weaponRigs.ts`).
- Core render (`src/core/*.ts`) is pure (no React/DOM) and unit-tested with Vitest.
  Shapes: accessories/bones support `capsule | circle | rect | triangle`; `triangle`
  and `rect` both render as polygons (`triangle` = 3 pts).
- The export cell is centered on model `x = 0`; keep silhouettes within `[0, cellSize]`.
