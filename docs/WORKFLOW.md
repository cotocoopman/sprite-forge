# Workflow: Sprite Forge + Krita + AI as an asset copilot

Practical guide to prototype 2D assets for your game (Godot) **fast and without
being a designer**, combining Sprite Forge with Krita and (optionally) local AI.

The core idea: **split the problem in two.**

- **Motion / proportion / timing / 8 directions** → **Sprite Forge**
  (no drawing; you adjust sliders and keyframes).
- **Art / color / texture / style** → **Krita** (by hand) and/or **local AI**
  (Stable Diffusion via the Krita plugin).

Sprite Forge gives you an **on-model, frame-consistent** base (the `groundY`
ground line is constant), which is exactly what any painting or AI step needs to
avoid "swimming".

---

## Pipeline A — Paint over it (full control, hand-made look)

1. **Sprite Forge:** design proportions and animate the clip (walk, run, attack…).
   Export **individual PNG frames** (transparent) at the final size.
2. **Krita:** Krita has frame-by-frame animation + onion skin. Import the frames
   as a base layer (silhouette) and **paint over** the keyframes, then the
   in-betweens. The silhouette keeps proportion, pose and ground fixed, so your
   painting stays on-model.
3. Export the spritesheet from Krita → into Godot.

> Trick: in Sprite Forge you can **turn parts off** and export head/arms/legs
> separately. Paint each piece apart and recombine them, or use them as a 2D
> (bone) rig in Godot.

---

## Pipeline B — AI guided by the silhouette (mitigates "I can't draw")

Requires the **[krita-ai-diffusion](https://github.com/Acly/krita-ai-diffusion)**
plugin (free, local, open source; ComfyUI backend; ~6 GB NVIDIA VRAM recommended).

The key is **ControlNet**: you feed the AI your silhouette as a "mold" and it
generates art that **respects the exact pose**, with your style prompt.

1. In Sprite Forge, export the silhouette frame(s).
2. In Krita, with krita-ai-diffusion, use the silhouette as a **Scribble / Line
   art / Pose / Depth** control and write the style prompt (e.g. *"knight in dark
   armor, top-down, clean shading"*).
3. For **frame consistency**: fix the seed, use **img2img with low denoise**, and
   **IP-Adapter** with frame 1 as the style/character reference. Since the
   silhouette already locks pose and proportion, each frame comes out coherent.
4. Final touch-up in Krita, export the sheet, into Godot.

Great for: characters, portraits, props, tilesets, backgrounds. You direct
(prompt + silhouette), the AI does the "drawing".

---

## Pipeline C — simple 3D → 2D sprites (consistent 8 directions)

For props/characters where you want perfectly consistent 8 directions, the classic
indie trick is to model low-poly in 3D and render to 2D.

- **[Blender MCP](https://github.com/ahujasid/blender-mcp)** (or Blender by hand):
  Claude builds a low-poly prop, renders it from 8 angles → sprites, or exports
  **depth/normal maps** to use as ControlNet in Pipeline B.
- Pairs well with Sprite Forge's 3D turn to lock the directions.

---

## Where each tool fits

| Need | Tool |
|---|---|
| Skeleton, pose, timing, 8-dir, motion prototype | **Sprite Forge** |
| Hand painting, color, touch-up, frame animation | **Krita** |
| Generate art from the silhouette / texture (local) | **krita-ai-diffusion** (SD + ControlNet) |
| 3D props → sprites / control maps | **Blender (+ MCP)** |
| Dedicated pixel art | **Aseprite (+ MCP)** |
| Engine, scenes, animate sprites | **Godot** |

---

## Tips to mitigate a lack of design skill

- **Don't draw motion from scratch:** define it in Sprite Forge (the hardest part
  by hand). Save your energy for color/style, where AI and Krita help most.
- **Work on-model:** the constant silhouette = perfect base for ControlNet and for
  painting without breaking proportions.
- **Fix seed + IP-Adapter** so an animation's frames don't change style between them.
- **Palette first:** define 4–8 colors in Krita and reuse them; it gives cohesion
  even if you're not an artist.
- **Prototype in grey:** Sprite Forge in black/silhouette is already enough to
  *test the game* in Godot today; add final art later without touching the animation.

See also [AI-COPILOT.md](./AI-COPILOT.md) for which MCPs are worth using to make
Claude an asset copilot.
