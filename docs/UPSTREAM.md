# Angband upstream ledger

Core remains Angband 4.2.6. The existing carried set is in [README.md](../README.md). Content, balance, and feature changes belong to this mod. Bug fixes and ambiguous commits belong to Bug Fixes. Borg changes have their own routing list.

## Text carried under catchup.text

Upstream `73c851ab4` and `c6e499b5a` supply 63 field patches across 13 content files. Each patch targets a field whose installed Core value differs, and the tests assert both the baseline and the replacement. The section is off by default. The composition test covers the absent, off, and on states.

The message hooks carry `do_cmd_mon_command()`, `do_cmd_go_down()`, `do_cmd_use()`, `effect_handler_EARTHQUAKE()`, `effect_handler_TAP_DEVICE()`, `effect_do()`, `pick_and_place_distant_monster()`, `steal_monster_item()`, `inven_wield()`, `save_game_checked()`, and `close_game()` wording. The screen hook carries `display_equip_cmp_sel_help()`, `prompt_for_easy_filter()`, and `lib/help/symbols.txt` wording. It distinguishes the Page Down row from Page Up by the row key.

Six upstream spelling-only changes keep their existing en_US spelling: RAGE_BLESS_RESIST's "colors", the Ring of Protection's "armor", confusion gas's "colors", the history phrase "blue-gray", the crow's "gray", and the hydra's "vapor". Other text keeps upstream's wording and spacing. The `c6e499b5a` Borg parser adjustment belongs to the Borg ledger.

## Display and save checks

`6772cd485`: Core's `packages/core/src/obj/object-info.ts` already passes `ObjectInfoDeps.player` and an explicit state into `calculateMeleeCrits()` and `calculateMissileCrits()`. The two missile call sites in `objKnownDamage()` pass `deps.currentState`, which is also the state used for bow and throw skill. `oObjKnownDamage()` passes the simulated melee state or current missile state directly to the hit-chance helpers. These current call paths produce the state selection upstream's `calculate_melee_crits()`, `calculate_missile_crits()`, `o_calculate_melee_crits()`, and `o_calculate_missile_crits()` require. This commit needs no mod behavior; this conclusion comes from source inspection, not a new Core test.

`0107bbad9`: upstream `prt_terrain()` reads remembered features and traps, applies the feature mimic, and hides trap memory when terrain is unknown. Core's `packages/core/src/game/display.ts` `terrainRuns()` reads `state.chunk` and `state.traps`. API 2 has whole-status replacement through `ui.status.replace()` or HUD ownership, and its known view provides remembered map data. This information disclosure fix belongs to Bug Fixes, so this mod does not own the status line.

`e44ac90f1`: the save check matters even without C integer overflow. Upstream `rd_player()` rejects `max_exp` outside `0..PY_MAX_EXP` and `exp` outside `0..max_exp`. Core's `packages/core/src/session/save.ts` `deserializePlayer()` validates level but directly assigns `data.maxExp` and `data.exp`. Save integrity checks do not establish those ranges. The parser and arithmetic guards also belong to Bug Fixes; C signed-overflow details do not transfer directly to JavaScript. No save behavior changes here.
