# Workflow: Sprite Forge + Krita + IA como copiloto de assets

Guía práctica para prototipar assets 2D para tu juego (Godot) **rápido y sin ser
diseñador**, combinando Sprite Forge con Krita y (opcional) IA local.

La idea de fondo: **separá el problema en dos**.

- **Movimiento / proporción / timing / 8 direcciones** → **Sprite Forge**
  (no hay que dibujar; ajustás sliders y keyframes).
- **Arte / color / textura / estilo** → **Krita** (a mano) y/o **IA local**
  (Stable Diffusion vía el plugin de Krita).

Sprite Forge te da una base **on-model y consistente entre frames** (la línea de
suelo `groundY` es constante), que es exactamente lo que necesita cualquier paso
de pintura o de IA para no "bailar".

---

## Pipeline A — Pintar encima (control total, look a mano)

1. **Sprite Forge:** diseñá proporciones y animá el clip (walk, run, attack…).
   Exportá **frames sueltos PNG** (transparentes) al tamaño final (ej. 128 o 256).
2. **Krita:** Krita tiene animación frame-by-frame + onion skin. Importá los
   frames como capa base (silueta) y **pintá encima** frame por frame o solo los
   keyframes. La silueta garantiza que proporción, pose y suelo queden fijos, así
   tu dibujo no se sale de modelo.
3. Exportá el spritesheet desde Krita → a Godot.

> Truco: en Sprite Forge podés **apagar partes** y exportar cabeza/brazos/piernas
> por separado. Pintás cada pieza aparte y las recombinás, o las usás como rig
> 2D (huesos) en Godot.

---

## Pipeline B — IA guiada por la silueta (mitiga "no sé dibujar")

Requiere el plugin **[krita-ai-diffusion](https://github.com/Acly/krita-ai-diffusion)**
(free, local, open source; backend ComfyUI; ~6 GB VRAM NVIDIA recomendado).

La clave es **ControlNet**: le das a la IA tu silueta como "molde" y genera arte
que **respeta la pose exacta**, con tu prompt de estilo.

1. En Sprite Forge, exportá el/los frame(s) de la silueta.
2. En Krita, con krita-ai-diffusion, usá la silueta como control **Scribble /
   Line art / Pose / Depth** y escribí el prompt de estilo (ej. *"knight in dark
   armor, top-down, clean shading"*).
3. Para **consistencia entre frames**: fijá la semilla (seed), usá **img2img con
   denoise bajo**, y **IP-Adapter** con el frame 1 como imagen de referencia de
   estilo/personaje. Como la silueta ya bloquea pose y proporción, cada frame
   sale coherente.
4. Retoque final en Krita, exportás el sheet, a Godot.

Ideal para: personajes, retratos, props, tilesets, fondos. Vos dirigís (prompt +
silueta), la IA hace el "dibujo".

---

## Pipeline C — 3D simple → sprites 2D (8 direcciones consistentes)

Para props/personajes donde querés 8 direcciones perfectamente consistentes, el
truco indie clásico es modelar en 3D **bajo-poly** y renderizar a 2D.

- **[Blender MCP](https://github.com/ahujasid/blender-mcp)** (o Blender a mano):
  Claude arma un prop low-poly, lo renderiza desde 8 ángulos → sprites, o exporta
  **depth/normal maps** para usarlos como ControlNet en el Pipeline B.
- Combina muy bien con el giro 3D de Sprite Forge para bloquear las direcciones.

---

## Dónde encaja cada herramienta

| Necesidad | Herramienta |
|---|---|
| Esqueleto, pose, timing, 8-dir, prototipo de movimiento | **Sprite Forge** |
| Pintura a mano, color, retoque, animación frame-by-frame | **Krita** |
| Generar arte desde la silueta / textura / concept (local) | **krita-ai-diffusion** (SD + ControlNet) |
| Props 3D → sprites / mapas de control | **Blender (+ MCP)** |
| Pixel art dedicado | **Aseprite (+ MCP)** |
| Motor, escenas, animar sprites | **Godot** |

---

## Consejos para mitigar la falta de diseño

- **No dibujes movimiento de cero:** definilo en Sprite Forge (es lo más difícil
  a mano). Reservá tu energía para color/estilo, donde la IA y Krita ayudan más.
- **Trabajá on-model:** la silueta constante = base perfecta para ControlNet y
  para pintar sin desproporcionar.
- **Fijá seed + IP-Adapter** para que los frames de una animación no cambien de
  estilo entre sí.
- **Paleta primero:** definí 4–8 colores en Krita y reutilizalos; da cohesión
  aunque no seas artista.
- **Prototipá en gris:** Sprite Forge en negro/silueta ya sirve para *probar el
  juego* en Godot hoy; el arte final lo agregás después sin tocar la animación.

Ver también [AI-COPILOT.md](./AI-COPILOT.md) para el detalle de qué MCPs sirven
para usar Claude como copiloto de assets.
