# Contributing to Sprite Forge

Thanks for your interest! This is a local (no backend) tool to generate 2D
silhouette sprites.

## Getting started

```bash
yarn install
yarn dev
yarn test        # before opening a PR: make it pass
yarn typecheck   # no errors and no `any`
```

## Workflow (fork + PR)

The `main` branch is protected: you can't push to it directly. To propose changes:

1. **Fork** the repo to your account.
2. Clone your fork and create a branch: `git checkout -b fix/my-change`.
3. Make your changes; run `yarn test` and `yarn typecheck`.
4. Push to your fork and open a **Pull Request** against this repo's `main`.
5. It gets reviewed and merged.

No write access needed: everything comes in via PRs from forks.

## Versioning

Every change bumps `version` in `package.json` (`x.y.z`) and adds a matching entry at
the top of `CHANGELOG.md` (dated, Keep-a-Changelog style):

- **x** (major): a whole pool of new functionality (e.g. a complete new module).
- **y** (minor): new features and functionality.
- **z** (patch): bug fixes and small tweaks to existing behavior.

## Code conventions

- **TypeScript strict**, no `any`.
- Arrow functions only (`const f = () => {}`), never `function`.
- MUI v7 (no Tailwind). Zustand with the selector pattern: `useStore((s) => s.field)`.
- Naming: `PascalCase` components, `camelCase` variables/functions,
  `UPPER_SNAKE_CASE` constants.
- `src/core/` must stay **pure** (no React/MUI/DOM except the rasterizer in
  `export.ts`). New core logic ships with its `*.test.ts` next to it.
- Changes to the project shape must be **backward compatible**: add the field with a
  tolerant default in `core/validation.ts` so saved projects don't break.
- UI strings are wrapped with `useT` from `src/i18n.ts` — add the English text to the
  dictionary (the Spanish string is the key).
- **Weapons/accessories live on both rigs.** Add them once to `PROP_TEMPLATES`
  (`core/props.ts`); the custom-rig side is generated from that list by
  `core/weaponRigs.ts` (`propToRig`), so a new prop shows up on both sides for free.
  Don't fork the weapon list.
- **Import direction:** `poses.ts` → `customRig.ts` and `props.ts` → `poses.ts`, so
  `customRig.ts` must not import `props.ts` (it would cycle). Code that composes both
  goes in a separate leaf module (e.g. `weaponRigs.ts`).

## Where things live

- Humanoid rig and math → `core/rig.ts`
- Generic (bone) rig → `core/customRig.ts`
- Animation / project types → `core/poses.ts`
- SVG rendering → `core/svg.ts` · Export/PNG/ZIP/Godot → `core/export.ts`
- State and actions → `store/useProjectStore.ts`
- UI → `components/`

## Open ideas

See [docs/ROADMAP.md](./docs/ROADMAP.md) for pending work and the backlog.
