# Recetas por estilo de asset (stacks precisos)

Qué herramienta usar, en qué rol, en qué orden, y cómo entra a Godot — según el
look que busques. En todas, **Sprite Forge aporta lo mismo**: la base de
**movimiento / pose / proporción / 8-dir**, con línea de suelo constante.

Leyenda de roles: **[MOV]** movimiento/pose · **[ART]** arte/color · **[GEN]**
generación IA · **[ENGINE]** motor.

---

## 1. 2D silueta / minimalista (prototipo jugable HOY)

**Solo Sprite Forge.** Sin dibujar nada.

1. **[MOV] Sprite Forge:** proporciones + clips + (opcional) 8-dir.
2. Export → **Godot 4 SpriteFrames `.tres`** (o sheets PNG + `manifest.json`).
3. **[ENGINE] Godot:** dropear la carpeta en `res://`, usar el `.tres` en un
   `AnimatedSprite2D`.

**Salida:** PNG/SVG + `.tres`. **Consistencia:** `groundY` constante = sin vibración.
**Cuándo:** para jugar/testear el juego ya, con arte final después.

---

## 2. 2D pintado / painterly (personajes con "mano")

**Sprite Forge → Krita** (+ opcional IA).

1. **[MOV] Sprite Forge:** animá el clip. Export **frames PNG transparentes** al
   tamaño final (128/256).
2. **[ART] Krita:** importá los frames como animación (Krita tiene timeline +
   onion skin). Silueta = capa base; **pintá encima** los keyframes, luego los
   intermedios.
3. *(Opcional [GEN])* **krita-ai-diffusion** con ControlNet **Line art/Pose** para
   generar el primer frame y calcarlo o refinarlo.
4. Export **spritesheet** desde Krita → Godot (sheet + AnimatedSprite2D).

**Consistencia:** pintá sobre la silueta (pose/proporción fijas). **Truco:**
"apagar partes" en Sprite Forge → exportás y pintás cabeza/brazos/piernas aparte.

---

## 3. 2D pixel art

**Sprite Forge (referencia) → Aseprite (pixel real).**

1. **[MOV] Sprite Forge:** animá; export frames PNG a **baja resolución** (32/48/64)
   — usá el preset de tamaño chico.
2. **[ART] Aseprite:** importá los frames como **capa de referencia / rotoscopio**
   y **pixelá encima** (Aseprite tiene animación + onion skin nativos). Definí
   una **paleta** de 8–16 colores.
3. *(Opcional)* **aseprite-mcp** (`diivi/aseprite-mcp`, 104 tools): que Claude
   ayude con capas, paleta, dithering, sombreado y export del sheet.
4. Export **spritesheet + JSON** de Aseprite → Godot.

**Nota:** el pixel final se hace a mano/Aseprite; Sprite Forge da el timing y la
silueta guía (evita desproporción). No esperes pixel art directo de la silueta.

---

## 4. 2D generado por IA (concept, tilesets, fondos, props sueltos)

**ComfyUI / krita-ai-diffusion** como fuente; Krita para retoque.

1. **[GEN]** Local, gratis:
   - En chat con Claude: **ComfyUI MCP** (oficial comfy.org o `Nikolaibibo/claude-comfyui-mcp`) → generás tilesets/props/fondos con prompt.
   - Dentro de Krita: **krita-ai-diffusion** (inpaint/outpaint, ControlNet, IP-Adapter).
2. *(Para personajes)* alimentá la **silueta de Sprite Forge** como ControlNet
   (Scribble/Pose/Depth) → arte que respeta la pose. **Seed fija + IP-Adapter**
   (frame 1 como referencia) = estilo consistente entre frames.
3. **[ART] Krita:** limpieza, recorte, paleta, export sheet → Godot.

**Cuándo:** lo que más mitiga "no sé dibujar". Vos dirigís (prompt + silueta).

---

## 5. 3D → sprites 2D (props / 8 direcciones perfectas)

**Blender → render → 2D → Godot.** Truco indie clásico.

1. **[ART/GEN] Blender** (a mano o con **`ahujasid/blender-mcp`**, ⭐~26k): modelá
   low-poly; Claude puede armar/ajustar por prompt.
2. Renderizá desde **8 ángulos** (o los que uses) → sprites PNG; o exportá
   **depth/normal maps** para usarlos como ControlNet en la receta 4.
3. *(Opcional)* usá el **giro 3D de Sprite Forge** para bloquear las direcciones
   antes de modelar.
4. **[ENGINE] Godot:** sheets → AnimatedSprite2D (8-dir).

**Cuándo:** props que necesitan rotación consistente, o para bakear iluminación 2D.
⚠️ `execute_blender_code` corre Python arbitrario — guardá antes.

---

## 6. 3D real (juego 3D o 2.5D)

**Blender → glTF → Godot.**

1. **[ART] Blender (+ blender-mcp):** modelado/materiales por prompt + ajuste manual.
2. Export **glTF/GLB** (formato nativo recomendado por Godot).
3. **[ENGINE] Godot:** importás el `.glb`; materiales/animaciones ya vienen.

---

## Tabla rápida

| Estilo | [MOV] | [ART] | [GEN] | → Godot |
|---|---|---|---|---|
| Silueta / prototipo | Sprite Forge | — | — | `.tres` / sheets |
| 2D painterly | Sprite Forge | Krita | krita-ai-diffusion* | sheet |
| 2D pixel art | Sprite Forge | Aseprite (+mcp) | — | sheet + JSON |
| 2D IA (fondos/props) | Sprite Forge* | Krita | ComfyUI / krita-ai-diffusion | sheet |
| 3D → 2D sprites | Sprite Forge* | Blender (+mcp) | — | sheets 8-dir |
| 3D real | — | Blender (+mcp) | — | glTF/GLB |

`*` = opcional / según el caso.

---

## Referencia: costo / Claude / output / Godot

| Herramienta | Costo | Open source | ¿MCP? ¿usa tu Claude? | Local/Cloud | Output | Nodo Godot |
|---|---|---|---|---|---|---|
| **Sprite Forge** | Gratis | Sí (MIT) | No (app sola) | Local (browser) | PNG sheets/frames, SVG, `manifest.json`, **`.tres`** | **`AnimatedSprite2D`** (asignás el `.tres`) · o `Sprite2D`+`AtlasTexture` |
| **Krita** | Gratis | Sí (GPL) | No | Local | PNG / sheet | `AnimatedSprite2D` / `Sprite2D` |
| **krita-ai-diffusion** | Gratis local · opc. nube ~US$11/5k tokens | Sí (GPL-3) | **No** — usa Stable Diffusion, no Claude | Local (GPU ~6 GB) o nube Interstice | PNG (capas Krita) | `AnimatedSprite2D` / `Sprite2D` |
| **Aseprite** | Binario **US$20** (1 pago) · o compilás gratis · o **LibreSprite** gratis | Aseprite: no (licencia propietaria) · LibreSprite: sí (GPL) | MCP comunidad → **sí, tu Claude** lo maneja | Local (escritorio) | **PNG sheet + JSON** | `AnimatedSprite2D` (addon *Aseprite Wizard*) / `Sprite2D` |
| **ComfyUI** | Gratis | Sí (GPL-3) | MCP oficial+comunidad → **sí, tu Claude** | Local (GPU) o tu server | PNG | (vía Krita) → `AnimatedSprite2D` / `Sprite2D` |
| **Blender** | Gratis | Sí (GPL) | **blender-mcp** → **sí, tu Claude** | Local | 3D→2D: PNG sprites · 3D: **glTF/GLB** | 2D: `AnimatedSprite2D` · 3D: escena (`MeshInstance3D` + `AnimationPlayer`) |
| **Godot MCP** | Gratis | Sí | **Sí, tu Claude** (beta) | Local | — (controla el editor) | — |

**Nota "usa tu Claude":** las IA de imagen (Stable Diffusion / ComfyUI /
krita-ai-diffusion) **no** usan Claude, son otra IA. Tu cuenta de Claude entra
solo como cerebro que **maneja apps vía MCP** (Aseprite, ComfyUI, Blender, Godot),
usando un cliente con MCP (Claude Desktop / Claude Code).

Detalle de cada herramienta y su madurez: [AI-COPILOT.md](./AI-COPILOT.md).
Pipelines paso a paso: [WORKFLOW.md](./WORKFLOW.md).
