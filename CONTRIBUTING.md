# Contribuir a Sprite Forge

¡Gracias por el interés! Esta es una herramienta local (sin backend) para generar
sprites 2D silueta.

## Cómo empezar

```bash
yarn install
yarn dev
yarn test        # antes de abrir un PR: que pasen
yarn typecheck   # sin errores y sin `any`
```

## Flujo de trabajo (fork + PR)

La rama `main` está protegida: no se puede pushear directo. Para proponer cambios:

1. Hacé **fork** del repo a tu cuenta.
2. Cloná tu fork y creá una rama: `git checkout -b fix/mi-cambio`.
3. Hacé tus cambios; corré `yarn test` y `yarn typecheck`.
4. Push a tu fork y abrí un **Pull Request** contra `main` de este repo.
5. Se revisa y se mergea.

No hace falta pedir acceso de escritura: todo entra por PR desde forks.

## Convenciones de código

- **TypeScript strict**, prohibido `any`.
- Solo arrow functions (`const f = () => {}`), nunca `function`.
- MUI v7 (sin Tailwind). Zustand con selector pattern: `useStore((s) => s.campo)`.
- Naming: `PascalCase` componentes, `camelCase` variables/funciones,
  `UPPER_SNAKE_CASE` constantes.
- `src/core/` debe seguir siendo **puro** (sin React/MUI/DOM salvo el rasterizado
  en `export.ts`). La lógica nueva de core va con su test `*.test.ts` al lado.
- Los cambios al shape del proyecto deben ser **retrocompatibles**: agregá el
  campo con default tolerante en `core/validation.ts` para no romper proyectos
  guardados.

## Dónde vive cada cosa

- Rig humanoide y matemática → `core/rig.ts`
- Rig genérico (huesos) → `core/customRig.ts`
- Animación / tipos del proyecto → `core/poses.ts`
- Render SVG → `core/svg.ts` · Export/PNG/ZIP/Godot → `core/export.ts`
- Estado y acciones → `store/useProjectStore.ts`
- UI → `components/`

## Ideas abiertas

- Fase 2 del rig genérico: animación por keyframes por hueso.
- Armas/props como mini-rigs de huesos.
- Más presets de criaturas.
