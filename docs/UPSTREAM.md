# Angband upstream ledger

Core remains Angband 4.2.6. The existing carried set is in [README.md](../README.md). Content, balance, and feature changes belong to this mod. Bug fixes and ambiguous commits belong to Bug Fixes. Borg changes have their own routing list.

## Review checkpoint

The review covers all 96 commits in `5c45eb958..42cd156ac`: 75 through the adopted-review head `a5a9fc968`, then 21 through `42cd156ac`. The next review starts after `42cd156ac9f95ddf4311e88dd7ad462292d6d1d6` on upstream/master. The endpoint is verified from the already-fetched local upstream ref; no remote refresh is part of this review.

## Text carried under catchup.text

Upstream `73c851ab4` and `c6e499b5a` supply 63 field patches across 13 content files. Each patch targets a field whose installed Core value differs, and the tests assert both the baseline and the replacement. The section is off by default. The composition test covers the absent, off, and on states.

The message hooks carry `do_cmd_mon_command()`, `do_cmd_go_down()`, `do_cmd_use()`, `effect_handler_EARTHQUAKE()`, `effect_handler_TAP_DEVICE()`, `effect_do()`, `pick_and_place_distant_monster()`, `steal_monster_item()`, `inven_wield()`, `save_game_checked()`, and `close_game()` wording. The screen hook carries `display_equip_cmp_sel_help()`, `prompt_for_easy_filter()`, and `lib/help/symbols.txt` wording. It distinguishes the Page Down row from Page Up by the row key.

Six upstream spelling-only changes keep their existing en_US spelling: RAGE_BLESS_RESIST's "colors", the Ring of Protection's "armor", confusion gas's "colors", the history phrase "blue-gray", the crow's "gray", and the hydra's "vapor". Other text keeps upstream's wording and spacing. The `c6e499b5a` Borg parser adjustment belongs to the Borg ledger.

## Display and save checks

`6772cd485`: Core's `packages/core/src/obj/object-info.ts` already passes `ObjectInfoDeps.player` and an explicit state into `calculateMeleeCrits()` and `calculateMissileCrits()`. The two missile call sites in `objKnownDamage()` pass `deps.currentState`, which is also the state used for bow and throw skill. `oObjKnownDamage()` passes the simulated melee state or current missile state directly to the hit-chance helpers. These current call paths produce the state selection upstream's `calculate_melee_crits()`, `calculate_missile_crits()`, `o_calculate_melee_crits()`, and `o_calculate_missile_crits()` require. This commit needs no mod behavior; this conclusion comes from source inspection, not a new Core test.

`0107bbad9`: upstream `prt_terrain()` reads remembered features and traps, applies the feature mimic, and hides trap memory when terrain is unknown. Core's `packages/core/src/game/display.ts` `terrainRuns()` reads `state.chunk` and `state.traps`. API 2 has whole-status replacement through `ui.status.replace()` or HUD ownership, and its known view provides remembered map data. This information disclosure fix belongs to Bug Fixes, so this mod does not own the status line.

`e44ac90f1`: the save check matters even without C integer overflow. Upstream `rd_player()` rejects `max_exp` outside `0..PY_MAX_EXP` and `exp` outside `0..max_exp`. Core's `packages/core/src/session/save.ts` `deserializePlayer()` validates level but directly assigns `data.maxExp` and `data.exp`. Save integrity checks do not establish those ranges. The parser and arithmetic guards also belong to Bug Fixes; C signed-overflow details do not transfer directly to JavaScript. No save behavior changes here.

## Core gaps

These entries use the API2-GAPS columns. Paths below are relative to Core. SDK 1.23.0-beta.3's `src/api2/hooks.ts`, `src/api2/policies.ts`, the engine registry facade, and `docs/modding/API2.md` provide no narrow switch for these behaviors. Whole monster-turn replacement, whole generation replacement, and direct writes to live state are outside these entries. None of these entries grants this mod access to hidden state.

| ID | What fails | Smallest addition | Priority | Status |
| --- | --- | --- | --- | --- |
| UC-5 | `dd0e40858`: upstream `monster_loves_archery()` changes the archery frequency threshold from `< 4` to `> 25`. Core's `packages/core/src/mon/predicate.ts` `monsterLovesArchery()` retains `< 4`. The monster registry offers only `setTurnHook()`, which replaces a whole turn rather than this decision. | A `monsterArcheryFrequency` policy selecting the threshold, applied inside `monsterLovesArchery()` before the range decision. Core evaluates race data internally. | degrade | Open; Bug Fixes owns this regression. |
| UC-6 | `b4fb34b36`: upstream `project()` passes its blast center to `project_f()`, `project_o()`, `project_m()`, and `project_p()`; both FORCE handlers use that center, and `thrust_away()` randomizes a coincident center and target. Core's `packages/core/src/game/project-cast.ts` `castProjection()` carries the source grid into `ProjectPlayerSideContext` (`game/project-player.ts`); `game/player-side.ts` `force` uses that source, and `game/project-monster.ts` `projectMonster()` passes `origin.grid` to thrust. `game/thrust.ts` `thrustAway()` does not replace the coincident-angle sentinel. Projection handler registration exists, but its contexts omit the blast center and its monster driver owns thrust. | Carry a separate `centre` through projection contexts and driver thrust, and add a `forceFromBlastCenter` policy that selects it and the upstream coincident-target RNG rule. Core retains all hidden coordinates. | degrade | Open; Bug Fixes owns this correction. |
| UC-7 | `27a260501`: upstream `random_staircase_terrain()`, `place_random_stairs()`, `alloc_stairs()`, `handle_level_stairs()`, `labyrinth_gen()`, `build_room_template()`, `build_vault()`, `prepare_next_level()`, and `effect_handler_CREATE_STAIRS()` account for forced descent; quest/bottom levels can admit neither direction, and persistent connectors constrain placement. Core's `packages/core/src/gen/util.ts` `placeStairs()`, `placeRandomStairs()`, and `allocStairs()` choose or convert directions using depth and quest only. `gen/generate.ts` `generateLevel()` passes persistent connectors but no forced-descent policy. | A `forcedDescentStairs` policy that Core applies to every stair placement and stair-creation effect before placement, with the birth option, quest, bottom depth, and connector facts evaluated internally. It must allow no stair when neither direction is legal. | degrade | Open; Bug Fixes owns this option-contract correction. |
| UC-8a | `1d2ad35a2`: upstream `update_view()` forgets remembered impassable player terrain while blind or while light is zero without UNLIGHT. Core's `packages/core/src/world/view.ts` `updateView()` delegates memory updates to `packages/core/src/game/known.ts` `noteSpots()`, which forgets only while blind. No API 2 hook runs at this memory-update decision. | A `forgetUnlitImpassableTerrain` policy read inside `noteSpots()` before it notes seen grids. Core evaluates blindness, light, UNLIGHT, and remembered passability. | degrade | Open; Bug Fixes owns this stale-memory correction. |
| UC-8b | `fc29847fd`: upstream `update_view()` extends the same condition from `cur_light == 0` to `cur_light <= 0`. Core's `game/known.ts` `noteSpots()` has neither unlit branch. | The UC-8a policy must use `light <= 0`, with the UNLIGHT exemption. It needs no second live-state hook. | degrade | Open; Bug Fixes owns the negative-light case with UC-8a. |
| UC-9 | `29985cd05`: upstream `lore_update()` learns display flags with obvious flags and generation flags at death; `lore_is_fully_known()` checks that learned flags contain race flags and spell sets match; `update_mon()` calls `lore_update()` on first sight. Core's `packages/core/src/mon/lore.ts` `loreUpdate()` learns only RFT_OBV and the older death mask, and `loreIsFullyKnown()` tests nonzero flag bytes. `packages/core/src/game/known.ts` `updateMon()` increments sights without the first-sight update. `monsterBecameVisible` is a known-view notification and cannot update persistent lore or answer completeness. | A `monsterLoreCompleteness` policy selecting the upstream masks, set comparisons, and first-sight update inside Core. It must not return race truth to the mod. | degrade | Open; Bug Fixes owns this lore correction. |
| UC-10 | `9f5b723ad`: upstream `steal_monster_item()` counts successful theft only when `obj->origin_race == mon->race`, saturating at 65535. Core's `packages/core/src/mon/steal.ts` `stealMonsterItem()` increments `getLore(...).thefts` after every successful player theft, without provenance or saturation. API 2 exposes neither a theft-count decision nor a provenance-safe lore write. | A `monsterOwnDropThefts` policy that Core applies at this increment, comparing the existing internal origin race and capping at 65535. | degrade | Open; Bug Fixes owns this theft-accounting correction. |
| UC-11 | `e44ac90f1`: upstream `rd_player()` rejects invalid experience ranges. Core's `packages/core/src/session/save.ts` `deserializePlayer()` directly assigns both experience values. Mod save blocks cover mod-owned data, not validation of the player block before construction. | A pre-construction player-save validation policy for `0 <= exp <= maxExp <= PY_MAX_EXP`; the JSON port should also reject non-integer and non-finite numbers. | degrade | Open; Bug Fixes owns validation. The JSON-number checks are a port-specific recommendation. |
| UC-12 | `41319eef9`: upstream `parse_player_timed_effect_flags()` accepts COMPLETE_REST, `player_timed_continues_rest()` scans those flags, and `player_resting_complete_special()` uses the result. The data marks the prior ten effects plus AMNESIA and SCRAMBLE. Core's `packages/core/src/player/bind.ts` `timedNonStacking()` rejects every flag except NONSTACKING; `packages/core/src/game/world.ts` `playerRestingCompleteSpecial()` hard-codes the prior ten effects and has no policy hook. | A `completeRestEffects` policy listing registered timed-effect names, which Core uses in `playerRestingCompleteSpecial()` while preserving the other recovery, recall, and descent checks. The mod can then provide upstream's twelve names without live state access. | degrade | Open; this mod owns the configurable-rest feature after the seam exists. |

## Additional carried content

`5da31305a` changes death mold hearing from 200 to 2 in `monster.txt`. The `catchup.deathMoldHearing` content section carries that field alone and defaults off. The test compares the whole death mold record with Core, allowing only hearing to differ. Upstream `make_noise()` also bounds propagation by the largest hearing value; that performance work is not carried. The upstream commit states that the hearing adjustment changes MFLAG_ACTIVE but not the behavior of a mold that neither moves nor casts; this mod's tests verify the data and setting, not that gameplay claim.

`43ae88cd9` changes `cmd_action[]`'s disarm label to "Disarm a trap/chest; lock door". Core's `packages/web/src/main.ts` keypress table retains "Disarm a trap or chest". API 2.1 exposes `mod.engine.registry.menus` during `start()` with `engine:access` and `registry:menu`. The `catchup.text` setting registers a transformer for `core:keypress-command-table`, matches the original disarm key and literal label, and preserves earlier transformers. It reads no live state. If engine access or the menu grant is unavailable, that label keeps Core's wording. No additional Core seam is needed.

## Full classification

### After 5c45eb958 through a5a9fc968

| Commit | Classification | Finding |
| --- | --- | --- |
| `446e6b26c` | Not applicable (Borg) | Borg: a few problems sent to me |
| `905bdcf7e` | Not applicable (Borg) | Borg detection arrays and tile-size startup guard. |
| `5da31305a` | Carry here | Death mold hearing 200 to 2 under catchup.deathMoldHearing; omit make_noise() optimization. |
| `67e745278` | Not applicable | Core web main.ts already handles Ctrl-G as autopickup; no C null-command filter to remove. |
| `f7f86ab3b` | Not applicable | process_monsters() input-break polling optimization. |
| `fba64712e` | Not applicable | update_view() loop and flag-bookkeeping optimization. |
| `70ed7b467` | Not applicable | player_pickup_gold() constructs the same message with one format operation. |
| `7dadfebb0` | Not applicable | write_flags()/write_mods() C buffer construction and bounds handling. |
| `fdf67cfc6` | Not applicable | Cocoa, SDL, SDL2, and Win32 native key-repeat handling. |
| `00c9414cb` | Not applicable | C signal-handler atomic type. |
| `5cea6de0a` | Not applicable (Borg) | Borg: major reorg |
| `4588e09ff` | Not applicable (Borg) | Borg: clean up some long lines |
| `20aa4abee` | Not applicable (Borg) | Borg: build failure |
| `e9fff1ffb` | Not applicable (Borg) | Borg: time type needs casting |
| `16e318da8` | Not applicable (Borg) | Borg: build errors |
| `93f955ae5` | Not applicable (Borg) | Borg: another print of time |
| `def445a24` | Not applicable (Borg) | Borg: cleaning up more warnings |
| `8d7a7d4f7` | Not applicable (Borg) | Borg: inkey_hack is defined elsewhere.  I was combining entry points and messed up |
| `b2265f659` | Not applicable (Borg) | Borg: fix a wear best issue |
| `27a260501` | Bug Fixes | Forced-descent stair generation and creation; needs UC-7. |
| `b79990461` | Not applicable | Native terminal erase-to-end cleanup; Borg fragment routes separately. |
| `533e1522f` | Not applicable | Comments only. |
| `99a04bf69` | Not applicable (Borg) | Borg: make sure chunks don't leak when reincarnating |
| `75b325396` | Not applicable (Borg) | Borg: traits cleared |
| `cc4ea3a6b` | Not applicable | map_info() refactor and native map lighting bookkeeping. |
| `3007691cd` | Not applicable | Native terminal text batching in display_area(). |
| `96293e7fc` | Not applicable | Cache repeated monster and spell flag masks. |
| `d70698912` | Not applicable | Delay object_desc() work until object_learn_on_wield() needs it. |
| `167ba295d` | Not applicable | C fixed-buffer overflow guard in text_out_to_screen(). |
| `d5c093374` | Not applicable (Borg) | Borg: rewrite reincarnation to use the game UI and not internal bs |
| `061b3f382` | Not applicable (Borg) | Borg: clear old messages on reincarnate |
| `45188f2a6` | Not applicable (Borg) | Borg: flush keys when death even if not reincarnate |
| `719b8ce05` | Not applicable (Borg) | Borg: out of range for old panels |
| `5a1e25d78` | Not applicable (Borg) | Borg: make init call free |
| `7e28a3965` | Not applicable (Borg) | Borg: missues of fear_region array |
| `bf7b28775` | Not applicable | Arena leak introduced after 4.2.6; the adopted review excludes it from the port. |
| `dd02a510d` | Not applicable | C signed-overflow and optimizer guard in object_value_real(). |
| `0347703f7` | Bug Fixes | flag_inter() change detection is wrong; Core bitflag.ts flagInter() still tests a !== b. |
| `36b66c003` | Not applicable | C allocation leak in a digging test. |
| `e44ac90f1` | Bug Fixes | Experience parser/arithmetic guards and relevant player-save ranges; UC-11. |
| `dd0e40858` | Bug Fixes | Inverted monster_loves_archery() frequency threshold; needs UC-5. |
| `1d2ad35a2` | Bug Fixes | Forget impassable terrain without light; needs UC-8a. |
| `14956c07b` | Not applicable (Borg) | Borg: performance changes |
| `164762802` | Not applicable | Native Term_gotoxy() failure guard before drawing character history. |
| `6772cd485` | Not applicable | Current Core object-info call paths already select the player and state; see display check above. |
| `a90101991` | Not applicable | C multibyte-to-wide-character conversion failures and buffers. |
| `a747d71a0` | Not applicable | C z-bitflag tests and test build wiring. |
| `b4fb34b36` | Bug Fixes | FORCE blast center and coincident thrust direction; needs UC-6. |
| `826c393d9` | Not applicable | lore_description() formatting work and mask-iteration optimization. |
| `9091d71c2` | Not applicable (Borg) | Borg: add monster ids to struct |
| `4f1904e6c` | Not applicable (Borg) | Borg: some systems prefer more parens |
| `ce04fdeee` | Not applicable (Borg) | Borg: clear out messages in resurection end |
| `73c851ab4` | Carry here | Descriptions, dart-stat wording, and cannot under catchup.text; preserve en_US spelling. |
| `a7f492e38` | Not applicable | Single-combat unique regression introduced after 4.2.6; excluded by the adopted review. |
| `c7f6229ac` | Not applicable (Borg) | Borg: change light beam to be used to light corridors |
| `7117ede56` | Not applicable (Borg) | Borg: if the cave is smaller than one panel, adjust |
| `fc29847fd` | Bug Fixes | Negative-light extension of terrain forgetting; needs UC-8b. |
| `b7ab996bf` | Not applicable | monster_race comments only. |
| `c6e499b5a` | Carry here | Descriptions, messages, help, and prompt wording under catchup.text; Borg parser fragment routes separately. |
| `130193cd6` | Not applicable | Native terminal refresh scheduling and animation flushes. |
| `7c8c2785f` | Not applicable | Remove redundant debug summon redraw requests. |
| `e71cc96e8` | Bug Fixes | adjust_level() update/redraw scheduling includes mana recalculation; route for port assessment. |
| `12c8d533b` | Not applicable (Borg) | Borg: fix panel shifting code |
| `5a9041e05` | Not applicable (Borg) | Borg: change borg_take to contain a kind index rather than a kind pointer |
| `0107bbad9` | Bug Fixes | Status line leaks actual terrain/traps; whole-status ownership exists in API 2. |
| `d43d05589` | Not applicable | C status-test expected labels derived from data. |
| `fb886f6c7` | Not applicable (Borg) | Borg: off by one error reporting on best |
| `cc9734a3a` | Not applicable | SDL2 menu focus and visual feedback. |
| `1a3ba324f` | Not applicable | C monster learned-player struct size/layout refactor. |
| `81dd81cb3` | Not applicable | Remove redundant item-selector redraw requests. |
| `29985cd05` | Bug Fixes | Lore completeness, flag masks, and first-sighting learning; needs UC-9. |
| `9f5b723ad` | Bug Fixes | Thefts count only the monster's own drop and saturate at 65535; needs UC-10. |
| `367b72eea` | Not applicable | Native animation uses point redraw events. |
| `ab2aaf995` | Not applicable | Comments only. |
| `a5a9fc968` | Not applicable | C parser tests for invalid multibyte characters. |

### After a5a9fc968 through 42cd156ac

| Commit | Classification | Finding |
| --- | --- | --- |
| `54880cec7` | Not applicable (Borg) | Borg: check further for changed limits in config |
| `19f6df0d7` | Not applicable (Borg) | Borg: bound direction selection when money scumming |
| `92d63c22e` | Not applicable | C Makefile dependencies. |
| `caff97e09` | Bug Fixes | Move curse-knowledge/noise rehydration from startup to save load and guard dungeon state; route for port assessment. |
| `43ae88cd9` | Carry here | Disarm command label mentions locking doors under catchup.text through the existing menu registry. |
| `a154829b9` | Not applicable | Remove a set-but-unused C variable for sanitizer builds. |
| `165a111e3` | Not applicable | MSYS2 UCRT64 build documentation and CI. |
| `0ba9e0b7d` | Not applicable | C pointer assertion helper in status tests. |
| `e473720ed` | Not applicable | Native Term_clear()/Term_erase() subwindow semantics. |
| `9d062a64d` | Not applicable (Borg) | Borg: resume handling combat messages after knockout |
| `bc67c099e` | Not applicable (Borg) | Borg: choose the safer item when checking emergency swaps |
| `d0f43cec1` | Not applicable | Win32 open-file dialog and native build wiring. |
| `5fc6cf976` | Not applicable | Native terminal physical clear versus total redraw. |
| `619ff658b` | Not applicable | C Makefile object order. |
| `f987eef82` | Bug Fixes | Clear interrupted-rest state before starting another rest. |
| `727138d71` | Bug Fixes | Background rest continuations preserve the original repeat command. |
| `d26e723bf` | Bug Fixes | Flush queued commands before deep descent changes level. |
| `41319eef9` | Needs seam | Data-driven complete-rest effects, including AMNESIA and SCRAMBLE; UC-12. |
| `8c75bdccb` | Not applicable (Borg) | Borg: clear the reaction gate after a message batch |
| `d90bdfcc7` | Not applicable (Borg) | Remove the internal tracking comment |
| `42cd156ac` | Not applicable (Borg) | Borg: use the borg's dont_react field for the knockout gate |

## Bug Fixes routing

| Commit | Classification | Finding |
| --- | --- | --- |
| `27a260501` | Bug Fixes | Forced-descent stair generation and creation; needs UC-7. |
| `0347703f7` | Bug Fixes | flag_inter() change detection is wrong; Core bitflag.ts flagInter() still tests a !== b. |
| `e44ac90f1` | Bug Fixes | Experience parser/arithmetic guards and relevant player-save ranges; UC-11. |
| `dd0e40858` | Bug Fixes | Inverted monster_loves_archery() frequency threshold; needs UC-5. |
| `1d2ad35a2` | Bug Fixes | Forget impassable terrain without light; needs UC-8a. |
| `b4fb34b36` | Bug Fixes | FORCE blast center and coincident thrust direction; needs UC-6. |
| `fc29847fd` | Bug Fixes | Negative-light extension of terrain forgetting; needs UC-8b. |
| `e71cc96e8` | Bug Fixes | adjust_level() update/redraw scheduling includes mana recalculation; route for port assessment. |
| `0107bbad9` | Bug Fixes | Status line leaks actual terrain/traps; whole-status ownership exists in API 2. |
| `29985cd05` | Bug Fixes | Lore completeness, flag masks, and first-sighting learning; needs UC-9. |
| `9f5b723ad` | Bug Fixes | Thefts count only the monster's own drop and saturate at 65535; needs UC-10. |
| `caff97e09` | Bug Fixes | Move curse-knowledge/noise rehydration from startup to save load and guard dungeon state; route for port assessment. |
| `f987eef82` | Bug Fixes | Clear interrupted-rest state before starting another rest. |
| `727138d71` | Bug Fixes | Background rest continuations preserve the original repeat command. |
| `d26e723bf` | Bug Fixes | Flush queued commands before deep descent changes level. |

The archery, FORCE, stairs, terrain-memory, lore, theft, status-line, save-validation, and command-queue entries are fixes rather than content features. The update/redraw and load-relocation entries are ambiguous and therefore also route to Bug Fixes. The table records ownership and source findings; it does not claim that the separate mod implements them.

## Borg routing

| Commit | Classification | Finding |
| --- | --- | --- |
| `446e6b26c` | Not applicable (Borg) | Borg: a few problems sent to me |
| `905bdcf7e` | Not applicable (Borg) | Borg detection arrays and tile-size startup guard. |
| `5cea6de0a` | Not applicable (Borg) | Borg: major reorg |
| `4588e09ff` | Not applicable (Borg) | Borg: clean up some long lines |
| `20aa4abee` | Not applicable (Borg) | Borg: build failure |
| `e9fff1ffb` | Not applicable (Borg) | Borg: time type needs casting |
| `16e318da8` | Not applicable (Borg) | Borg: build errors |
| `93f955ae5` | Not applicable (Borg) | Borg: another print of time |
| `def445a24` | Not applicable (Borg) | Borg: cleaning up more warnings |
| `8d7a7d4f7` | Not applicable (Borg) | Borg: inkey_hack is defined elsewhere.  I was combining entry points and messed up |
| `b2265f659` | Not applicable (Borg) | Borg: fix a wear best issue |
| `99a04bf69` | Not applicable (Borg) | Borg: make sure chunks don't leak when reincarnating |
| `75b325396` | Not applicable (Borg) | Borg: traits cleared |
| `d5c093374` | Not applicable (Borg) | Borg: rewrite reincarnation to use the game UI and not internal bs |
| `061b3f382` | Not applicable (Borg) | Borg: clear old messages on reincarnate |
| `45188f2a6` | Not applicable (Borg) | Borg: flush keys when death even if not reincarnate |
| `719b8ce05` | Not applicable (Borg) | Borg: out of range for old panels |
| `5a1e25d78` | Not applicable (Borg) | Borg: make init call free |
| `7e28a3965` | Not applicable (Borg) | Borg: missues of fear_region array |
| `14956c07b` | Not applicable (Borg) | Borg: performance changes |
| `9091d71c2` | Not applicable (Borg) | Borg: add monster ids to struct |
| `4f1904e6c` | Not applicable (Borg) | Borg: some systems prefer more parens |
| `ce04fdeee` | Not applicable (Borg) | Borg: clear out messages in resurection end |
| `c7f6229ac` | Not applicable (Borg) | Borg: change light beam to be used to light corridors |
| `7117ede56` | Not applicable (Borg) | Borg: if the cave is smaller than one panel, adjust |
| `12c8d533b` | Not applicable (Borg) | Borg: fix panel shifting code |
| `5a9041e05` | Not applicable (Borg) | Borg: change borg_take to contain a kind index rather than a kind pointer |
| `fb886f6c7` | Not applicable (Borg) | Borg: off by one error reporting on best |
| `54880cec7` | Not applicable (Borg) | Borg: check further for changed limits in config |
| `19f6df0d7` | Not applicable (Borg) | Borg: bound direction selection when money scumming |
| `9d062a64d` | Not applicable (Borg) | Borg: resume handling combat messages after knockout |
| `bc67c099e` | Not applicable (Borg) | Borg: choose the safer item when checking emergency swaps |
| `8c75bdccb` | Not applicable (Borg) | Borg: clear the reaction gate after a message batch |
| `d90bdfcc7` | Not applicable (Borg) | Remove the internal tracking comment |
| `42cd156ac` | Not applicable (Borg) | Borg: use the borg's dont_react field for the knockout gate |

Two mixed commits also touch Borg: `b79990461` changes `borg_note_internal()` to erase through the terminal width, and `c6e499b5a` changes `borg_parse_aux()` to recognize the double-spaced cursed-item message. The latter must accompany this mod's "Oops!  It feels deathly cold!" wording when the Borg message parser is updated.

## Prose inventory

The table names each new or changed player-facing text field by file and first value line. Array values continue on the following lines. Test fixtures repeat these strings but are not player-facing. The manifest descriptions and documentation locations follow the text-field list.

| File | Line | Text field |
| --- | --- | --- |
| `activation.json` | 10 | core:staff-magi desc |
| `activation.json` | 19 | core:shroom-emergency desc |
| `activation.json` | 29 | core:cure-full desc |
| `activation.json` | 38 | core:deep-descent desc |
| `activation.json` | 47 | core:destruction2 desc |
| `activation.json` | 56 | core:shroom-terror desc |
| `artifact.json` | 10 | core:thunderfist desc |
| `artifact.json` | 21 | core:nimloth desc |
| `artifact.json` | 33 | core:of-morgoth desc |
| `chest_trap.json` | 10 | core:explode msg |
| `class.json` | 10 | core:blackguard book.0.spell.5.desc |
| `class.json` | 18 | core:blackguard book.1.spell.3.desc |
| `class.json` | 25 | core:blackguard book.0.spell.4.desc |
| `class.json` | 36 | core:druid book.0.spell.4.desc |
| `class.json` | 43 | core:druid book.3.spell.3.desc |
| `class.json` | 53 | core:necromancer book.1.spell.1.desc |
| `class.json` | 62 | core:necromancer book.1.spell.2.desc |
| `class.json` | 70 | core:necromancer book.4.spell.2.desc |
| `curse.json` | 10 | core:vulnerability desc |
| `curse.json` | 19 | core:steelskin desc |
| `history.json` | 10 | core:3--100 phrase |
| `history.json` | 19 | core:18--100 phrase |
| `history.json` | 28 | core:4--15 phrase |
| `history.json` | 37 | core:4--30 phrase |
| `history.json` | 46 | core:4--50 phrase |
| `history.json` | 55 | core:20--20 phrase |
| `history.json` | 64 | core:20--100 phrase |
| `history.json` | 73 | core:24--15 phrase |
| `history.json` | 82 | core:24--40 phrase |
| `history.json` | 91 | core:24--70 phrase |
| `history.json` | 100 | core:24--85 phrase |
| `history.json` | 109 | core:24--95 phrase |
| `history.json` | 118 | core:24--100 phrase |
| `history.json` | 127 | core:26--20 phrase |
| `history.json` | 136 | core:26--95 phrase |
| `history.json` | 145 | core:26--100 phrase |
| `monster.json` | 17 | core:aimless-looking-merchant desc |
| `monster.json` | 27 | core:ochre-jelly desc |
| `monster.json` | 37 | core:wererat desc |
| `monster.json` | 47 | core:half-orc desc |
| `monster.json` | 58 | core:old-man-willow desc |
| `monster.json` | 71 | core:blood-falcon desc |
| `monster.json` | 82 | core:nexus-hound desc |
| `monster.json` | 92 | core:doombat desc |
| `monster.json` | 102 | core:southron-archer desc |
| `monster.json` | 112 | core:glabrezu desc |
| `monster.json` | 121 | core:drolem desc |
| `monster.json` | 132 | core:fundin-bluecloak desc |
| `monster.json` | 144 | core:maia-of-varda desc |
| `monster.json` | 154 | core:oss-herald-of-ulmo desc |
| `monster.json` | 167 | core:uvatha-the-horseman desc |
| `monster.json` | 177 | core:draugluin-sire-of-all-werewolves desc |
| `monster_base.json` | 10 | core:ainu desc |
| `object.json` | 10 | core:food--ration-of-food desc |
| `object.json` | 21 | core:polearm--broad-axe desc |
| `object.json` | 30 | core:crown--jewel-encrusted-crown desc |
| `player_property.json` | 10 | core:slow-digestion desc |
| `player_timed.json` | 10 | core:heal on-end |
| `player_timed.json` | 19 | core:command on-end |
| `terrain.json` | 10 | core:home desc |
| `trap.json` | 10 | core:dart-trap--strength-loss-dart desc |
| `trap.json` | 19 | core:dart-trap--dexterity-loss-dart desc |
| `trap.json` | 28 | core:dart-trap--constitution-loss-dart desc |
| `text-rules.json` | 3 | Message or symbol-help replacement |
| `text-rules.json` | 4 | Message or symbol-help replacement |
| `text-rules.json` | 5 | Message or symbol-help replacement |
| `text-rules.json` | 6 | Message or symbol-help replacement |
| `text-rules.json` | 7 | Message or symbol-help replacement |
| `text-rules.json` | 8 | Message or symbol-help replacement |
| `text-rules.json` | 9 | Message or symbol-help replacement |
| `text-rules.json` | 10 | Message or symbol-help replacement |
| `text-rules.json` | 11 | Message or symbol-help replacement |
| `text-rules.json` | 14 | Message or symbol-help replacement |
| `text-rules.json` | 15 | Message or symbol-help replacement |
| `text-rules.json` | 16 | Message or symbol-help replacement |
| `text-rules.json` | 17 | Message or symbol-help replacement |
| `text-rules.json` | 18 | Message or symbol-help replacement |
| `text-rules.json` | 20 | Disarm command label |
| `text-rules.json` | 23 | Equipment quick-filter prompt |
| `item-text.ts` | 101 | Parameterized message or equipment-help replacement |
| `item-text.ts` | 104 | Parameterized message or equipment-help replacement |
| `item-text.ts` | 118 | Parameterized message or equipment-help replacement |

The manifest text is at `manifest.json` lines 68, 69, 76. The new hearing setting is also listed in `SETTINGS.md` and `docs/README.md`.

The changed documentation lines are `README.md`: 30, 32, 33, 38, 40, 51, 55, 57, 59, 65, 83, 200, 201, 214; `SETTINGS.md`: 12; `docs/README.md`: 24, 31, 33, 42. Every paragraph and table in this ledger is new; the headings identify its checkpoint, carried text, display/save findings, gaps, classification, and routing sections.
