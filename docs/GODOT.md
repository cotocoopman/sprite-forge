# Using Sprite Forge exports in Godot

> 🌐 **Español:** [GODOT.es.md](./GODOT.es.md)

Step-by-step to get an exported animation running in **Godot 4.x**. Also covers
using the frames as a base for Krita / AI art.

---

## 1. Export from Sprite Forge

Open **Export sprites** and check at least:
- **Sprite sheet per animation** (the PNGs)
- **Godot 4 resource (SpriteFrames .tres)**

You'll get a ZIP named after your character with this structure:

```
<CharacterName>/
  sheets/*.png        # one horizontal strip per animation
  frames/*.png        # (optional) one PNG per frame
  <CharacterName>.tres # Godot SpriteFrames resource
  manifest.json        # name/frames/fps/loop per animation
```

The `.tres` references the sheets as `res://<CharacterName>/sheets/<clip>.png`.

---

## 2. Put it in your Godot project

Unzip so that the `<CharacterName>/` folder sits at your **project root** (i.e.
`res://<CharacterName>/...`). That way the paths inside the `.tres` resolve.

> If Godot shows **missing textures**, the folder isn't where the `.tres` expects.
> Either move the folder to `res://<CharacterName>/`, or open the `.tres` in a text
> editor and Find & Replace the `res://.../sheets/` paths to wherever you put them.

Let Godot import the PNGs (it does this automatically on focus).

---

## 3. Use it on an AnimatedSprite2D

1. Add an **`AnimatedSprite2D`** node to your scene.
2. In the Inspector, click **Sprite Frames → (empty) → Load** and pick your
   **`<CharacterName>.tres`**.
3. In the **SpriteFrames** panel (bottom), select an animation (e.g. `walk`),
   toggle **Autoplay on Load** if you want, and press play in the panel to preview.
4. Run the scene, or drive it from code:

```gdscript
extends AnimatedSprite2D

func _ready() -> void:
    play("idle")

func _physics_process(_delta: float) -> void:
    if velocity.length() > 0.0:
        play("walk")
    else:
        play("idle")
```

The `fps` and `loop` you set in Sprite Forge come baked into the `.tres`.

---

## 4. Crisp pixels (optional)

If you exported at a small cell size and want pixel-perfect edges, set the texture
filter to **Nearest**: Project Settings → Rendering → Textures → **Default Texture
Filter = Nearest** (or per-texture in the import dock).

---

## 5. 8 directions (top-down)

If you exported **all 8 directions**, each clip becomes `walk_d0` … `walk_d7`
(d0 = front, going clockwise). Pick the animation by the character's facing:

```gdscript
# dir8 = 0..7 based on movement direction
play("walk_d%d" % dir8)
```

---

## 6. Consistent positioning

Sprite Forge keeps the **ground line constant across every frame**, so the sprite
never jitters between frames. Tip: set the `AnimatedSprite2D` **Offset** once so the
feet sit at the node origin, and every animation stays aligned.

---

## Using the frames with Krita / AI (finished art)

The silhouette export is a great **on-model base**:

- **Paint over it in Krita** — import the `frames/*.png` as an animation (Krita has a
  timeline + onion skin) and paint the keyframes. The silhouette locks pose and
  proportion so your art stays on-model.
- **AI (ControlNet)** — feed a silhouette frame to
  [krita-ai-diffusion](https://github.com/Acly/krita-ai-diffusion) as a
  Scribble/Pose/Depth control to generate art that follows the exact pose. Fix the
  seed + use IP-Adapter for consistency across frames.

Full pipelines in [WORKFLOW.md](./WORKFLOW.md).
