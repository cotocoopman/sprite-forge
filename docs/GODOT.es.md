# Usar los exports de Sprite Forge en Godot

> 🌐 **English:** [GODOT.md](./GODOT.md)

Paso a paso para dejar corriendo una animación exportada en **Godot 4.x**. También
cubre usar los frames como base para arte en Krita / IA.

---

## 1. Exportar desde Sprite Forge

Abrí **Exportar sprites** y marcá al menos:
- **Sprite sheet por animación** (los PNG)
- **Recurso Godot 4 (SpriteFrames .tres)**

Vas a obtener un ZIP con el nombre de tu personaje y esta estructura:

```
<Personaje>/
  sheets/*.png        # una tira horizontal por animación
  frames/*.png        # (opcional) un PNG por frame
  <Personaje>.tres    # recurso SpriteFrames de Godot
  manifest.json       # nombre/frames/fps/loop por animación
```

El `.tres` referencia los sheets como `res://<Personaje>/sheets/<clip>.png`.

---

## 2. Ponerlo en tu proyecto Godot

Descomprimí de modo que la carpeta `<Personaje>/` quede en la **raíz del proyecto**
(o sea `res://<Personaje>/...`). Así resuelven las rutas dentro del `.tres`.

> Si Godot muestra **texturas faltantes**, la carpeta no está donde el `.tres`
> espera. Movela a `res://<Personaje>/`, o abrí el `.tres` en un editor de texto y
> reemplazá (Find & Replace) las rutas `res://.../sheets/` por donde las pusiste.

Dejá que Godot importe los PNG (lo hace solo al volver a la ventana).

---

## 3. Usarlo en un AnimatedSprite2D

1. Agregá un nodo **`AnimatedSprite2D`** a tu escena.
2. En el Inspector, hacé clic en **Sprite Frames → (vacío) → Load** y elegí tu
   **`<Personaje>.tres`**.
3. En el panel **SpriteFrames** (abajo), seleccioná una animación (ej. `walk`),
   activá **Autoplay on Load** si querés, y dale play en el panel para previsualizar.
4. Corré la escena, o controlalo por código:

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

El `fps` y el `loop` que definiste en Sprite Forge quedan grabados en el `.tres`.

---

## 4. Píxeles nítidos (opcional)

Si exportaste con celda chica y querés bordes pixel-perfect, poné el filtro de
textura en **Nearest**: Project Settings → Rendering → Textures → **Default Texture
Filter = Nearest** (o por textura en el dock de importación).

---

## 5. 8 direcciones (top-down)

Si exportaste **las 8 direcciones**, cada clip se vuelve `walk_d0` … `walk_d7`
(d0 = frente, girando en sentido horario). Elegí la animación según hacia dónde
mira el personaje:

```gdscript
# dir8 = 0..7 según la dirección de movimiento
play("walk_d%d" % dir8)
```

---

## 6. Posicionamiento consistente

Sprite Forge mantiene la **línea de suelo constante en todos los frames**, así el
sprite nunca tiembla entre frames. Tip: ajustá el **Offset** del `AnimatedSprite2D`
una vez para que los pies queden en el origen del nodo, y todas las animaciones
quedan alineadas.

---

## Usar los frames con Krita / IA (arte terminado)

El export de silueta es una gran **base on-model**:

- **Pintar encima en Krita** — importá los `frames/*.png` como animación (Krita tiene
  timeline + papel cebolla) y pintá los keyframes. La silueta fija pose y proporción,
  así tu arte queda on-model.
- **IA (ControlNet)** — pasá un frame de silueta a
  [krita-ai-diffusion](https://github.com/Acly/krita-ai-diffusion) como control
  Scribble/Pose/Depth para generar arte que siga la pose exacta. Fijá la seed + usá
  IP-Adapter para consistencia entre frames.

Pipelines completos en [WORKFLOW.md](./WORKFLOW.md).
