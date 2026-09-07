# Settings reference

Rules implemented as hooks apply immediately. The tile assignment rule is installed through the tile registry during registration and requires a reload. Sections always require a reload because the content is recomposed.

| Flag | Default | What it does | Reload required |
| --- | --- | --- | --- |
| `catchup.tiles` | off | Adds later upstream tile assignments where a tile set had none. | Yes, register side. |
| `catchup.projections` | off | Limits oversized blast radii to the supported projection range. | No, hooks side. |
| `catchup.shapeFlags` | off | Learns a shapechange's obvious flags directly. | No, hooks side. |
| `catchup.levelRevisitTracking` | off | Clears old noise and ages scent when revisiting a level. | No, hooks side. |
| `catchup.text` | off | Corrects selected wording from later upstream releases. | Yes, section. |
