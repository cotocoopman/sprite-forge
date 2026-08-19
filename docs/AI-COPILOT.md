# Claude as an asset copilot — useful MCPs (researched, not invented)

A real survey of open-source **MCP (Model Context Protocol)** servers to use Claude
as a design/asset assistant for Godot. Data verified on GitHub in **August 2026** —
stars and status change over time, re-verify before installing. Everything listed is
**free / open source**.

> Golden rule: try it on a throwaway project and **save your work** before giving the
> AI write access. Several of these run real code/actions on your files.

---

## Summary: what to install by goal

| Goal | Recommendation | Maturity |
|---|---|---|
| **Local 2D art/texture generation** | Krita + `krita-ai-diffusion` (not MCP, but *the most valuable*) or ComfyUI MCP | High |
| **Assisted pixel art** | Aseprite + `diivi/aseprite-mcp` | Medium-high |
| **3D props/characters → 2D sprites** | `ahujasid/blender-mcp` | **High (most mature)** |
| **Godot editor control (run/inspect/screenshot)** | one of the `godot-mcp`s (experimental) | Low / nascent |
| **Painting inside Krita via AI** | `nanayax3/krita-mcp` | Low (immature) |

---

## 1. Blender MCP — `ahujasid/blender-mcp`  ⭐ ~26,000
The most mature and popular art MCP. Claude controls Blender (create/modify objects,
materials, scenes) via natural language. For your 2D case: model a low-poly
prop/character and render it to sprites, or export depth/normal maps for ControlNet.
- **Value:** very high for 3D→2D and props; large, battle-tested community.
- **Reviews:** consensus = "rapid prototyping, not a replacement for a 3D artist";
  reliable for tool-calling. Official warning: `execute_blender_code` runs arbitrary
  Python — **save before using**. Ships anonymous telemetry (opt-out).
- **Requires:** Blender 3.0+, Python 3.10+, `uv`. Repo: https://github.com/ahujasid/blender-mcp

## 2. Aseprite MCP — `diivi/aseprite-mcp`  ⭐ ~420
The most complete **pixel art** MCP I found: 104 tools (canvas, drawing, layers,
animation, palettes, tilemaps, export). Claude creates/edits pixel sprites and
animations via natural language.
- **Value:** high if your game is pixel art; covers the whole pixel pipeline.
- **Requires:** Python 3.13, `uv`, Aseprite (paid binary ~US$20 **or compile the
  source for free** — same features). Repo: https://github.com/diivi/aseprite-mcp
- ⚠️ **LibreSprite (free fork) does NOT work with these MCPs.** It uses **JavaScript**
  scripting, not Aseprite's **Lua API** (v1.2.10+) that the MCPs rely on. For the
  Claude workflow you need **Aseprite** (bought or compiled free). LibreSprite = a
  fine free manual editor, but no Claude copilot.
- Active alternatives: `willibrandon/pixel-mcp`, `Vollkorn-Games/aseprite-mcp`,
  `Shexiaoyun/aseprite-mcp` (various languages).

## 3. ComfyUI MCP — official + community
Generate images with **local** Stable Diffusion from Claude's chat (textures, concept
art, tilesets, img2img over your silhouettes).
- **Official:** comfy.org's Comfy MCP (open-source local connection). https://comfy.org/mcp/
- **Community:** `Nikolaibibo/claude-comfyui-mcp` (15 tools, Flux/SD/SDXL templates),
  `artokun/comfyui-mcp` (178 tools, works even offline with Ollama).
- **Value:** high to generate assets/references without drawing. It's the same engine
  krita-ai-diffusion uses under the hood.

## 4. Godot MCP — **nascent, fragmented space** ⚠️
There are many, all **low-starred (3–11) and young**; none dominates yet. They give
editor control: inspect/edit the scene tree, run the game, screenshots, simulate clicks.
- `PiMPStudios/Claude-GoDot-MCP` ⭐ ~11 — 170 tools, Godot 4.2+ (most complete).
- `mkdevkit/godot-mcp` ⭐ ~10 — 173 tools, Godot 4.4+, supports Claude Code/Cursor/Codex.
- `slangwald/godot-mcp` ⭐ ~3 — Godot 4.6, practical focus: run the game, screenshot,
  inspect the runtime scene tree, simulate clicks (good debug loop).
- Others: `LeeSinLiang`, `bradypp`, `Dokujaa`, `DaRealDaHoodie`.
- **Reality check:** **Claude Code already reads/writes your GDScript and `.tscn`
  directly on disk without MCP.** A Godot MCP's extra value is **live control** (run,
  see, inspect the editor). If that helps you, start with `slangwald` (debug loop) or
  `PiMPStudios/mkdevkit` (broad control), treating them as beta.

## 5. Krita MCP — `nanayax3/krita-mcp`  ⭐ ~30  ⚠️
Lets Claude paint inside Krita (canvas, strokes, shapes, export).
- **Important limitation:** it paints via **pixel manipulation**, NOT Krita's brush
  engine → basic result. Timeouts exporting large canvases.
- **Verdict:** still immature. For "Krita + AI" today, the **`krita-ai-diffusion`
  plugin** is a much better fit than this MCP. Repo: https://github.com/nanayax3/krita-mcp

---

## Bonus (not an MCP but the most valuable): `Acly/krita-ai-diffusion`  ⭐ ~10,000
A Krita plugin to generate images with **local, open, free** AI. Supports ControlNet
(Scribble, Line art, **Pose**, **Depth**, Canny…), IP-Adapter (reference/style),
inpaint/outpaint. ComfyUI backend.
- **Why it matters:** it's the perfect Sprite Forge → art bridge. Feed your silhouette
  as ControlNet and it generates art following the exact pose.
- Repo: https://github.com/Acly/krita-ai-diffusion · Site: https://kritaaidiffusion.com/

### What is Stable Diffusion and how to install it (local, free)
**Stable Diffusion** = an open-source image AI that runs on **your GPU** (offline):
text/guide image → image. It's a separate AI, not Claude. krita-ai-diffusion ships an
installer that downloads ComfyUI + the models for you.
- **Requirements:** GPU with **6 GB+ VRAM** (ideally NVIDIA/CUDA; AMD ROCm / Intel XPU
  with friction), **~30 GB** disk (SSD). No GPU → Interstice cloud (paid tokens).
- **Steps (Windows):**
  1. Install **Krita** (krita.org).
  2. Download the plugin ZIP (repo releases).
  3. Krita: **Tools ▸ Scripts ▸ Import Python Plugin from File** → the ZIP → restart.
  4. **Settings ▸ Dockers ▸** check **AI Image Generation**.
  5. In the panel: **Configure ▸ Local (managed) ▸ Install** → backend (CUDA for
     NVIDIA) → downloads ComfyUI + models.
  6. Prompt, or ControlNet with your Sprite Forge silhouette as the mold.

---

## Recommended stack for you (Godot, 2D, "little design")

1. **Krita + krita-ai-diffusion** → generate/paint art from Sprite Forge silhouettes
   (highest value/effort).
2. **ComfyUI MCP** → if you want Claude to generate references/tilesets from chat.
3. **Blender MCP** → 3D props → sprites and control maps, when you need perfect 8-dir.
4. **Aseprite MCP** → only if your final style is pixel art.
5. **Godot MCP (optional, beta)** → if you want Claude to run/inspect the game live;
   for editing code, Claude Code is enough without MCP.

See [WORKFLOW.md](./WORKFLOW.md) for how to chain them.
