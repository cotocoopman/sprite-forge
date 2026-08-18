# Claude como copiloto de assets — MCPs útiles (investigado, no inventado)

Relevamiento real de servidores **MCP (Model Context Protocol)** open source para
usar Claude como asistente de diseño/assets orientado a Godot. Datos verificados
en GitHub en **agosto 2026** — las estrellas y el estado cambian con el tiempo,
reverificá antes de instalar. Todo lo listado es **free / open source**.

> Regla de oro: probá en un proyecto de descarte y **guardá tu trabajo** antes de
> darle control de escritura a la IA. Varios de estos ejecutan código/acciones
> reales sobre tus archivos.

---

## Resumen: qué instalar según el objetivo

| Objetivo | Recomendación | Madurez |
|---|---|---|
| **Arte/textura 2D generada localmente** | Krita + `krita-ai-diffusion` (no es MCP, pero es *lo más valioso*) o ComfyUI MCP | Alta |
| **Pixel art asistido** | Aseprite + `diivi/aseprite-mcp` | Media-alta |
| **Props/personajes 3D → sprites 2D** | `ahujasid/blender-mcp` | **Alta (el más maduro)** |
| **Control del editor Godot (correr/inspeccionar/screenshot)** | alguno de los `godot-mcp` (experimental) | Baja / naciente |
| **Pintar dentro de Krita vía IA** | `nanayax3/krita-mcp` | Baja (inmaduro) |

---

## 1. Blender MCP — `ahujasid/blender-mcp`  ⭐ ~26.000
El MCP de arte más maduro y popular. Claude controla Blender (crear/modificar
objetos, materiales, escenas) por lenguaje natural. Para tu caso 2D: modelás un
prop/personaje low-poly y lo renderizás a sprites, o sacás depth/normal maps para
ControlNet.
- **Valor:** altísimo para 3D→2D y props; comunidad grande, muy probado.
- **Reviews:** consenso = "prototipado rápido, no reemplaza a un artista 3D";
  fiable para tool-calling. Advertencia oficial: `execute_blender_code` corre
  Python arbitrario — **guardá antes de usar**. Trae telemetría anónima (opt-out).
- **Requiere:** Blender 3.0+, Python 3.10+, `uv`. Repo: https://github.com/ahujasid/blender-mcp

## 2. Aseprite MCP — `diivi/aseprite-mcp`  ⭐ ~420
El MCP de **pixel art** más completo que encontré: 104 herramientas (canvas,
dibujo, capas, animación, paletas, tilemaps, export). Claude crea/edita sprites y
animaciones pixel por lenguaje natural.
- **Valor:** alto si tu juego es pixel art; cubre el pipeline pixel entero.
- **Requiere:** Python 3.13, `uv`, Aseprite (de pago, ~US$20, pero open source si
  lo compilás). Repo: https://github.com/diivi/aseprite-mcp
- Alternativas activas: `willibrandon/pixel-mcp`, `Vollkorn-Games/aseprite-mcp`,
  `Shexiaoyun/aseprite-mcp` (varios lenguajes).

## 3. ComfyUI MCP — oficial + comunidad
Genera imágenes con Stable Diffusion **local** desde el chat de Claude (texturas,
concept art, tilesets, img2img sobre tus siluetas).
- **Oficial:** Comfy MCP de comfy.org (conexión local open source). https://comfy.org/mcp/
- **Comunidad:** `Nikolaibibo/claude-comfyui-mcp` (15 tools, plantillas Flux/SD/SDXL),
  `artokun/comfyui-mcp` (178 tools, funciona incluso offline con Ollama).
- **Valor:** alto para generar assets/referencias sin saber dibujar. Es el mismo
  motor que usa krita-ai-diffusion por debajo.

## 4. Godot MCP — **espacio naciente y fragmentado** ⚠️
Hay muchos, todos **con pocas estrellas (3–11) y jóvenes**; ninguno domina aún.
Dan control del editor: inspeccionar/editar el árbol de escena, correr el juego,
screenshots, simular clics.
- `PiMPStudios/Claude-GoDot-MCP` ⭐ ~11 — 170 tools, Godot 4.2+ (el más completo).
- `mkdevkit/godot-mcp` ⭐ ~10 — 173 tools, Godot 4.4+, soporta Claude Code/Cursor/Codex.
- `slangwald/godot-mcp` ⭐ ~3 — Godot 4.6, foco práctico: correr el juego,
  screenshot, inspeccionar árbol en runtime, simular clics (buen loop de debug).
- Otros: `LeeSinLiang`, `bradypp`, `Dokujaa`, `DaRealDaHoodie`.
- **Reality check:** **Claude Code ya lee/escribe tu GDScript y `.tscn` directo en
  disco sin MCP.** El plus de un Godot MCP es el **control en vivo** (correr,
  ver, inspeccionar el editor). Si eso te sirve, empezá por `slangwald` (debug
  loop) o `PiMPStudios/mkdevkit` (control amplio), tratándolos como beta.

## 5. Krita MCP — `nanayax3/krita-mcp`  ⭐ ~30  ⚠️
Deja a Claude pintar dentro de Krita (canvas, trazos, formas, export).
- **Limitación importante:** pinta por **manipulación de píxeles**, NO usa el motor
  de pinceles de Krita → resultado básico. Timeouts en export de canvas grandes.
- **Veredicto:** todavía inmaduro. Para "Krita + IA" hoy conviene **más el plugin
  `krita-ai-diffusion`** (ver abajo) que este MCP. Repo: https://github.com/nanayax3/krita-mcp

---

## Bonus (no es MCP pero es el más valioso): `Acly/krita-ai-diffusion`  ⭐ ~10.000
Plugin de Krita para generar imágenes con IA **local, open, free**. Soporta
ControlNet (Scribble, Line art, **Pose**, **Depth**, Canny…), IP-Adapter
(referencia/estilo), inpaint/outpaint. Backend ComfyUI.
- **Por qué importa:** es el puente perfecto Sprite Forge → arte. Le das tu
  silueta como ControlNet y genera el arte siguiendo la pose exacta.
- Repo: https://github.com/Acly/krita-ai-diffusion · Sitio: https://kritaaidiffusion.com/

---

## Stack recomendado para vos (Godot, 2D, "poco diseño")

1. **Krita + krita-ai-diffusion** → generar/pintar arte desde las siluetas de
   Sprite Forge (lo más alto valor/esfuerzo).
2. **ComfyUI MCP** → si querés que Claude genere referencias/tilesets desde el chat.
3. **Blender MCP** → props 3D → sprites y mapas de control, cuando necesites 8-dir
   perfectas.
4. **Aseprite MCP** → solo si tu estilo final es pixel art.
5. **Godot MCP (opcional, beta)** → si querés que Claude corra/inspeccione el juego
   en vivo; para editar código ya alcanza Claude Code sin MCP.

Ver [WORKFLOW.md](./WORKFLOW.md) para cómo encadenarlas.
