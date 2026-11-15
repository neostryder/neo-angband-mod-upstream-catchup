# Settings reference

Settings that work as hooks (`catchup.projections`, `catchup.shapeFlags`, `catchup.levelRevisitTracking`, `catchup.completeRest`) take effect immediately. `catchup.tiles` needs a reload, because its rule is installed through the tile registry when the mod registers. `catchup.text` is a content section and always needs a reload, because changing it recomposes the game content.

| Flag | Default | What it does | Reload required |
| --- | --- | --- | --- |
| `catchup.tiles` | off | Adds later upstream tile assignments where a tile set had none. | Yes |
| `catchup.projections` | off | Limits oversized blast radii to the supported projection range. | No |
| `catchup.shapeFlags` | off | Learns a shapechange's obvious flags directly. | No |
| `catchup.levelRevisitTracking` | off | Clears old noise and ages scent when revisiting a level. | No |
| `catchup.completeRest` | off | Adds amnesia and scrambled stats to the effects a complete rest waits out. | No |
| `catchup.text` | off | Corrects selected wording from later upstream releases. | Yes |
| `catchup.deathMoldHearing` | off | Sets death mold hearing to 2 instead of 200. | Yes |
