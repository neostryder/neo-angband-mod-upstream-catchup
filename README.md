# Upstream Catchup

Changes Angband accepted after the `4.2.6` tag, for
[Neo Angband](https://github.com/neostryder/neo-angband), as a mod.

**This is a mod.** It is off until you enable it, every class of change inside it
is a named switch that starts off, and with the mod disabled the game is exactly
Angband 4.2.6.

**It is meant to expire.** Every row in it is redundant the day Neo Angband's
core rebaselines onto a newer upstream tag, and on that day the mod deletes
itself. That is the point of it being separate rather than a feature.

## Why this is a mod and not a better port

Neo Angband's core is pinned to Angband's `4.2.6` tag and stays faithful to it,
including its bugs. Upstream keeps working. A port that quietly absorbed later
upstream work would stop being a port of 4.2.6, and worse, you could never tell
which of its behaviours were 4.2.6's and which arrived afterwards.

So core carries none of this, and it is here instead, switched off, cited to the
commit that made it.

## Why it is separate from the bug-fixes mod

One question decides which mod a change belongs to:

**Does an accepted upstream commit exist for this change?**

- **Yes.** It belongs here, cited by SHA. This set is finite, mechanical, and
  expires at the next rebaseline.
- **No.** It belongs to
  [bug-fixes](https://github.com/neostryder/neo-angband-mod-bug-fixes), cited by
  issue or by measurement. That set is open-ended and permanent, and it is what a
  player means by an unofficial patch.

A fix that upstream later accepts MOVES from `bug-fixes` to here at the next
release. That is why the split exists: if merged into one mod, the permanent
patch set would be buried under the finite
one's churn and neither could be reviewed on its own.

## What is in it

There is one player-facing toggle per class of change rather than per commit, so three unrelated commits that all touched monster AI would share one toggle.

See the [settings reference](SETTINGS.md) for every flag, its default, and when a change takes effect.

| Toggle | What it covers | What it does |
| --- | --- | --- |
| **Post-4.2.6 tile assignments** (`catchup.tiles`) | 4 upstream commits, March 2026 | Pictures upstream assigned after 4.2.6 for creatures and items its tile sets were leaving as coloured letters. In every case the art was already in the sheet and only the line pointing at it was missing. Each block applies to the tile set upstream wrote it for and to no other, and only where that set assigns nothing already, so no picture anybody drew is replaced. None of it is visible in ASCII. |
| **Post-4.2.6 text corrections** (`catchup.text`) | 5 upstream commits, December 2025 to July 2026 | Wording upstream corrected after the 4.2.6 tag. The Trident 'of Wrath' description spells the Maia's name "Ossë" instead of "Osse" (`f1b1626f6`). The Priest spell Light of Manwë is renamed Light of Varda, and the blessed property is blessed by the Valar instead of the gods (`780e326fd`). The Necromancer's Vampire Strike says exactly how many hitpoints it drains (`897ab3a3f`). In item descriptions, an "Affects your" line ends with a full stop (`ad5c8401a`), an effect you must aim opens with "It requires a target.", and wands, staffs, rods and activated items say "When used" (`4153ff6a6`). Only text changes: no damage, weight or slot. The item-description wording uses text hooks that Neo Angband 1.18.0 added, which is why this version of the mod needs 1.18.0 or newer. |
| **Post-4.2.6 projection corrections** (`catchup.projections`) | 1 upstream commit, July 2026 | Corrections to how a spell, breath or wand blast is built. Today: a blast radius larger than the game's maximum projection range is held at that maximum, so the blast cannot reach a distance its own damage table has no entry for (commit `f0f6bd223`, upstream issue [#6671](https://github.com/angband/angband/issues/6671)). A radius already within range is left exactly as it was, and 4.2.6's own spells, breaths and wands never ask for more - only another mod, or the debug command, reaches the case this covers. Needs the engine release that added the projection-radius seam; on an older engine the row is inert. |
| **Post-4.2.6 shapechange flag learning** (`catchup.shapeFlags`) | 1 upstream commit, July 2026 | A correction to how taking on a shape teaches you what it grants. Today: a shape's obvious flags are learned directly, instead of only through whatever you have worn (commit `c8036c515`, raised in the comments on FAangband issue [#465](https://github.com/NickMcConnell/FAangband/issues/465)). Without it, a fox shapechange grants Free Action and nothing worn needs to carry it - but the game never told you, because it only ever checked your equipment. This teaches exactly the same obvious flags the shape already reveals on assuming it, nothing broader. Needs the engine release that added the shape-flag-learning seam; on an older engine the row is inert. |
| **Post-4.2.6 restored-level tracking** (`catchup.levelRevisitTracking`) | 1 upstream commit, August 2026 | On return from a persistent-level trip or single combat, old noise is cleared and scent is aged by elapsed world ticks (commit `5c45eb958`, upstream issue [#4605](https://github.com/angband/angband/issues/4605)). Fresh tracking is made by the next world tick. This is separate from `bug-fixes`' in-play save/reload heatmap persistence, which keeps old tracking instead of discarding it. Needs the engine release that added the level-revisited seam; on an older engine the row is inert. |

Every toggle defaults to off, unlike in the `bug-fixes` mod. Core is 4.2.6, someone who installed the game did not ask for anything later than that, and a change arriving switched on would amount to the port adding something.

### One row per upstream commit

Every commit after 4.2.6 was checked one by one against this port. Of the 161 commits in `f3082213b..upstream/master` as of 2026-08-08, none adds gameplay. The table lists the commits that touched something this port could carry, and it grows as later upstream commits are checked and carried.

| Upstream commit | Date | What it did | Tile set | In this mod |
| --- | --- | --- | --- | --- |
| [`4153ff6a6`](https://github.com/angband/angband/commit/4153ff6a657f7287ca381506553a80c772f2a7fa) | 2025-12-30 | Rewrote the opening of an item's effect description, resolving upstream issue [#6437](https://github.com/angband/angband/issues/6437). An effect you must aim says "It requires a target.", wands, staffs, rods and activated items say "When used", and an unidentified rod or activated item says "It may require a target." | n/a (`src/obj-info.c`, not a tile) | Yes, under `catchup.text` |
| [`ad5c8401a`](https://github.com/angband/angband/commit/ad5c8401a0d493b3548c5527738a2432dda6f4f1) | 2025-12-31 | Ended the "Affects your ..." line of an item description with a full stop, resolving upstream issue [#6479](https://github.com/angband/angband/issues/6479) | n/a (`src/obj-info.c`, not a tile) | Yes, under `catchup.text` |
| [`7e8b58325`](https://github.com/angband/angband/commit/7e8b58325) | 2026-03-10 | Tile for Beorn's bear form, resolving upstream issue [#4848](https://github.com/angband/angband/issues/4848) | David Gervais' tiles (`gervais/graf-dvg.prf`) | Yes, under `catchup.tiles` |
| [`2e9703d42`](https://github.com/angband/angband/commit/2e9703d42) | 2026-03-17 | Tile for the Knight's Shield, related to upstream issue [#6542](https://github.com/angband/angband/issues/6542) | Shockbolt Dark and Light (`shockbolt/graf-shb-{dark,light}.prf`) | Yes, under `catchup.tiles` |
| [`9b04b692d`](https://github.com/angband/angband/commit/9b04b692d) | 2026-03-18 | Tiles for the Sip of Miruvor and the Draught of the Ents, both previously commented out | Nomad's tiles (`nomad/graf-nmd.prf`) | Yes, under `catchup.tiles` |
| [`655812a54`](https://github.com/angband/angband/commit/655812a54) | 2026-03-20 | Eight assignments for art the sheet already carried and nothing pointed at: the Sip of Miruvor, the old forest tree, the witch, the blackguard, Old Man Willow, the red-hatted elf, Father Christmas, and the dúnadan of Angmar | Adam Bolt's tiles (`adam-bolt/graf-new.prf`) | Yes, under `catchup.tiles` |
| [`ab2d65386`](https://github.com/angband/angband/commit/ab2d65386) | 2026-03-24 | Removed a stale comment about numeric SVALs from two Shockbolt pref files | Shockbolt Dark and Light | **No port needed.** The commit deletes two comment lines and changes no assignment. A stub for it would be a row claiming work that does not exist. |
| [`897ab3a3f`](https://github.com/angband/angband/commit/897ab3a3f) | 2026-04-17 | Stated exactly how many hitpoints the Necromancer's Vampire Strike drains | n/a (gamedata text, not a tile) | Yes, under `catchup.text` |
| [`780e326fd`](https://github.com/angband/angband/commit/780e326fd) | 2026-06-19 | Renamed the Priest spell Light of Manwë to Light of Varda and made the blessed property blessed by the Valar, resolving upstream issue [#6633](https://github.com/angband/angband/issues/6633) | n/a (gamedata text, not a tile) | Yes, under `catchup.text` |
| [`f1b1626f6`](https://github.com/angband/angband/commit/f1b1626f6) | 2026-07-26 | Corrected the spelling of Ossë in the Trident 'of Wrath' description | n/a (gamedata text, not a tile) | Yes, under `catchup.text` |
| [`f0f6bd223`](https://github.com/angband/angband/commit/f0f6bd223b6b9faf0072b0ae7ffb34a812b97349) | 2026-07-28 | Held a blast radius inside the maximum projection range, resolving upstream issue [#6671](https://github.com/angband/angband/issues/6671) | n/a (`src/project.c`, not a tile) | Yes, under `catchup.projections` |
| [`c8036c515`](https://github.com/angband/angband/commit/c8036c51537942a560e3d7f81749c431bbb4701f) | 2026-07-21 | Learn a shapechange's obvious flags directly, instead of only through worn equipment | n/a (`src/obj-knowledge.c`, not a tile) | Yes, under `catchup.shapeFlags` |
| [`5c45eb958`](https://github.com/angband/angband/commit/5c45eb9588b8227d4f1b1998e0a627ad7ee11a75) | 2026-08-18 | Remembers the source for reload noise reconstruction, and clears stale noise / ages scent when a frozen level returns | n/a (`game-world.c`, `generate.c`, `load.c`, `save.c`, `ui-game.c`) | Yes, level-revisit half under `catchup.levelRevisitTracking`; its reload design remains separate from `bug-fixes` |

The remaining commits have nothing for this mod to carry: build, CI and platform plumbing, comments and casts. The `bug-fixes` mod carries a text, data or behaviour correction only while upstream has not accepted a fix for it; once upstream does, the correction belongs here, cited by SHA. `f1b1626f6` above shipped briefly in `bug-fixes` 0.19.0 and moved here in 0.19.1/0.1.1 for that reason.

### A known interaction with the `bug-fixes` mod

`bug-fixes` independently rewrites the Trident 'of Wrath' description for an
unrelated reason (dropping an obsolete two-handed-weapon clause 4.2.6's text
still carries). Both mods patch the same field. This mod's patch is written
against 4.2.6's own baseline wording, not against `bug-fixes`' rewritten
version, since neither mod can assume the other is installed. With both mods
enabled, whichever patch composes last for that field wins entirely for it.
The two do not merge. If you run both, expect either the corrected spelling
or the corrected two-handed clause for this one description, not both, until
the composition order is something you have checked.

### The assignments themselves

The tile assignments are upstream's own `.prf` lines, unchanged, in `ui-prefs.c`'s grammar, and the engine's port of that grammar reads them. A name resolves exactly as it would in a tile pack's own `graf-*.prf`, and a line that no longer names anything real resolves to nothing rather than to the wrong thing. `tiles.ts` holds them, one block per commit.

`radius.ts` holds the blast-radius clamp and `tracking.ts` holds restored-level tracking. Each is a decision inside a function rather than a record or a table entry, so both use the engine's behaviour seam (`ModHooks.projectionRadius` / `ModHooks.levelRevisited`) instead of a registry. The mod supplies the clamp only while `catchup.projections` is on; with the rule off it supplies no hook at all, and the engine takes the same path as with no mod loaded. The tracking rule is supplied only while `catchup.levelRevisitTracking` is on, and otherwise core resumes frozen heatmaps unchanged, as 4.2.6 does.

`shape-flags.ts` uses the same kind of seam, `ModHooks.shapeLearnObviousFlagsDirectly`. It answers a plain "yes" rather than a clamp, because the engine already works out the exact set of obvious flags upstream's fix learns; the rule decides only whether that set is learned directly, never which flags are in it. Like every other row here, it is supplied only while its toggle, `catchup.shapeFlags`, is on.

## Why it is a tile filler rather than a pref file

A mod may declare a `.prf` file as a `prefs` resource, and the game runs it through the same grammar. That does not work here. A mod's pref resource is replayed into every tile map the game builds, whatever tile set is loaded, and the `prefs` resource kind forbids a slot, so there is no way to scope it. The pref grammar cannot scope it either: its `?:` expressions test only `$SYS`, `$RACE` and `$CLASS` (`ui-prefs.c` L553-560), and no variable names the active tile set.

Each of these four commits applies to one tile set, and each tile set already draws what another was missing. David Gervais' sheet already assigns the Knight's Shield, the Sip of Miruvor, the Draught of the Ents and all seven of the creatures Adam Bolt's sheet was missing; Shockbolt's already assigns Beorn's bear form, both drinks and the same seven creatures. One pref file carrying all four blocks would have repainted ten entries in each of those two sheets, using coordinates from somebody else's atlas.

`registry:tiles` can be scoped the way the content is. A filler is told which pack is being built, so each block reaches only the tile set upstream wrote it for, and the fill calls it writes through (`fillMonster` / `fillObject`) refuse any entry something else already assigned. The code enforces both, and `tiles.test.ts` checks them against the real tile-pack catalog and the real 4.2.6 gamedata.

## Installing

Two files: `manifest.json` and `plugin.js`. Either of:

- **In the game** - Mods -> **Install a mod...**, which fetches this repository
  at a release tag, never a branch, so what arrives cannot change under you
  afterwards. The install records a SHA-256 of every byte that arrived, which is
  what lets the manager answer later whether the copy on your machine has
  changed. This is the path that works in every browser, including the ones with
  no directory picker.
- **A folder** - clone this repository into your mods directory, or point the
  browser build at it with **Load mod folder**.

Enabling the mod is not the same as turning anything on. Every toggle starts off;
open the mod's settings and switch on what you want.

The tile rows are not visible in ASCII. Pick a tile set in the Graphics screen
first, or there is nothing to see from those.

`plugin.js` is generated from `plugin.ts`, `tiles.ts`, `radius.ts`, `tracking.ts`
and `shape-flags.ts` in this repository, bundled into one module. It is committed because that is what an
install fetches.
Edit the source, not this file, and if you are reading it to decide whether to
trust it, that is exactly why it ships unminified.

## Working on it

The source and the tests both live here. The tests bind the published 4.2.6 content pack against the published engine, because every name in a ported `.prf` line is a lookup into that content, and a test against a hand-built registry would pass for a monster Angband does not have.

```bash
pnpm install --frozen-lockfile
```

```bash
pnpm verify
```

That typechecks, runs the tests, and confirms the committed `plugin.js` is a current build of the source. The last step matters because an install fetches the committed `plugin.js` from a pinned tag and runs it as it is, with no rebuild on the way. A stale `plugin.js` passes every other check and is still the file players run, and `pnpm check` is the only step that catches it.

You do not need a checkout of the game. The engine, the content pack and the plugin builder are all published packages, so `pnpm install --frozen-lockfile` is the whole setup, and the suite tests this mod against the same packages a third-party author would install.

```bash
pnpm build     # rebuild plugin.js after editing the source
```

### Testing against an unreleased engine

By default the tests import the **published** engine from `node_modules`, which
is the version a player runs. When you need to run against an engine change that
has not shipped yet:

```bash
NEO_ANGBAND_LOCAL_CORE=1 pnpm test
```

That resolves `@rpgm-tools/neo-angband-core` to `packages/core/dist` in a sibling
checkout of the game (build it first). `NEO_ANGBAND_REPO` names that checkout
when it is not a sibling, and a wrong path fails rather than falling back to one
nobody named.

## Keeping it current

Upstream `master` has moved on since the 2026-08-08 cutoff of the check above. Re-checking that range means adding each new verdict to the table above and opening a ticket per commit. The mod is only useful while it keeps up with upstream, so the check has to be repeated.

## A note on scores

This mod does not flag a character's save, so a character played with it sits in
the score list beside one played without it.

Tile assignments and text corrections change no rule, die roll or level. The blast-radius clamp changes a blast only when the radius asked for is already larger than the maximum projection range, and nothing 4.2.6 ships asks for that: spells, breaths, wands and traps all stay within the range, and the arc path caps itself at the range before the clamp is ever consulted. With this mod alone, then, the clamp never fires, which is also why upstream classes the bug as reachable only from a modded game or the debug command.

Leaving the save unflagged rests on that reasoning, and it would change if a future row here altered a rule a player can reach: a mod that changes gameplay flags the save permanently, and a class of change that did so would say so in its own toggle.

## Releasing

A tag matching `vX.Y.Z` is the release: there is no separate publish step. The
matching [CHANGELOG.md](CHANGELOG.md) heading is what the release announcement is
built from.

## Questions, or something wrong

[**The RPGM Tools Discord**](https://discord.gg/YegtwbHTBQ) is the fastest way to
ask anything, whether a behaviour is intended, how to get this installed, or what
you should try next. No GitHub account needed.

[Open an issue here](../../issues/new/choose) for a bug in **this mod**. Two
things belong against the game instead, and the forms will point you there: the
mod **system** (an install that fails, a load order that will not stick, a
conflict report that looks wrong), and the game **not matching Angband 4.2.6**
once this mod is switched off, since changing the game is what a mod is for.

For anything that should not be public, including a security report:
**strider-angband (at) rpgm.tools**. See
[SECURITY.md](https://github.com/neostryder/neo-angband/blob/master/SECURITY.md).

Asking about AI use in this project? [AI_USAGE_POLICY.md](AI_USAGE_POLICY.md) is
the complete answer.

[TERMS.md](TERMS.md) covers use of this mod. The core repository's
[PRIVACY.md](https://github.com/neostryder/neo-angband/blob/master/PRIVACY.md)
covers what is stored and what network requests the game makes. Project
participation is subject to the shared [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Licence

Same dual licence as Neo Angband and Angband: GPL v2 or the Angband licence. See
[LICENSE.md](LICENSE.md).

## Credits

Built by neostryder / RPGM Tools as part of Neo Angband. Every change in this mod
is upstream Angband's work and is cited to the commit that made it; the tile art
belongs to its own artists (David Gervais, Nomad, Shockbolt and Adam Bolt, each
credited in Angband's own `lib/tiles`). Angband is the work of Ben Harrison,
James E. Wilson, Robert A. Koeneke and the Angband contributors.
