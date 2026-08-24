/**
 * Post-4.2.6 tile assignments, ported from upstream Angband, one block per
 * commit.
 *
 * ------------------------------------------------------------------
 * WHAT THESE ARE
 * ------------------------------------------------------------------
 *
 * Core is pinned to Angband's `4.2.6` tag. Upstream kept working on its tile
 * sets afterwards, and four of those commits do the same small thing: they give
 * a creature or an item a picture in a tile set that was leaving it as a
 * coloured letter. The art was already in the sheet in every case; only the line
 * pointing at it was missing.
 *
 * Each block below is the upstream `.prf` text VERBATIM, in `ui-prefs.c`'s own
 * grammar, and it is parsed by the engine's own port of that grammar
 * (`parseTilePrefs`) rather than by a reader written here. So the names resolve
 * exactly as they resolve for a pack's own `graf-*.prf`, and a line that no
 * longer names anything real resolves to nothing rather than to the wrong thing.
 *
 * ------------------------------------------------------------------
 * WHY THIS IS A TILE FILLER AND NOT A `prefs` RESOURCE
 * ------------------------------------------------------------------
 *
 * A mod may declare a `.prf` file as a `prefs` resource, and the host runs it
 * through the same grammar. That door is the wrong one HERE, for one measured
 * reason: a mod's pref resource is replayed into EVERY tile map the game builds,
 * whatever tile set is loaded, and the `prefs` kind forbids a `slot`, so there
 * is nothing to scope it with. The pref grammar cannot help either - its `?:`
 * expressions test `$SYS`, `$RACE` and `$CLASS`, and that is the whole set
 * (ui-prefs.c L553-560); there is no variable naming the active tile set.
 *
 * These four assignments are per-tile-set by nature. David Gervais' sheet
 * already draws the Knight's Shield at 0x93:0xb7 and Shockbolt's already draws
 * Beorn's bear form at 0x93:0xA0, so a pref resource carrying all four blocks
 * would repaint ten entries those two sheets get right, with coordinates
 * belonging to somebody else's atlas.
 *
 * `registry:tiles` is scoped the way the content is. A filler is told which pack
 * is being built (`fill.pack`), so a block applies only to the tile set upstream
 * wrote it for, and `fillMonster` / `fillObject` write only where nothing is
 * assigned - which is exactly what these commits do upstream, since every one of
 * them fills a blank. The result is mechanical rather than promised: no picture
 * an author drew can be replaced by anything in this file.
 *
 * Shockbolt Dark and Shockbolt Light are one entry because they are one pack
 * directory, and upstream added the identical line to both of that pack's files.
 */

import type {
  CoreRegistries,
  TileFill,
  TileMap,
  TilePrefsDeps,
} from "@rpgm-tools/neo-angband-core";

/**
 * The engine, narrowed to what this file asks of it.
 *
 * Declared structurally rather than imported as a value for the reason the
 * plugin ABI exists: the engine is HANDED IN as `ctx.core`, and a bundled copy
 * would give this mod its own module state while the game ran on another set.
 */
export interface CatchupTilesCore {
  parseTilePrefs(text: string, deps: TilePrefsDeps): TileMap;
}

/** The registries a pref parse resolves names and tvals against. */
export type CatchupRegistries = Pick<
  CoreRegistries,
  "features" | "objects" | "monsters" | "traps"
>;

/** One upstream commit's tile assignments, and where they belong. */
export interface CatchupTileSet {
  /** The tile pack's directory name, which is the id a filler is handed. */
  readonly pack: string;
  /** The upstream commit these lines come from. */
  readonly sha: string;
  /** The date upstream committed them. */
  readonly date: string;
  /** The files upstream put them in. */
  readonly site: string;
  /** Upstream's own `.prf` text, unchanged. */
  readonly prf: string;
}

/**
 * The four commits, in upstream's own order.
 *
 * The text is byte-for-byte what upstream added, including the non-ASCII
 * character in "dunadan of Angmar" - that is a monster's NAME in
 * `monster.txt`, so it is data, and a lookup against a rewritten spelling would
 * simply find nothing.
 */
export const CATCHUP_TILE_SETS: readonly CatchupTileSet[] = [
  {
    pack: "gervais",
    sha: "7e8b58325",
    date: "2026-03-10",
    site: "lib/tiles/gervais/graf-dvg.prf",
    prf: "monster:Beorn, the Mountain Bear:0x93:0xAF\n",
  },
  {
    pack: "shockbolt",
    sha: "2e9703d42",
    date: "2026-03-17",
    site: "lib/tiles/shockbolt/graf-shb-dark.prf, graf-shb-light.prf",
    prf: "object:shield:Knight's Shield:0x80:0xD4\n",
  },
  {
    pack: "nomad",
    sha: "9b04b692d",
    date: "2026-03-18",
    site: "lib/tiles/nomad/graf-nmd.prf",
    prf:
      "object:food:Sip of Miruvor:0x8A:0x90\n" +
      "object:food:Draught of the Ents:0x8A:0x91\n",
  },
  {
    pack: "adam-bolt",
    sha: "655812a54",
    date: "2026-03-20",
    site: "lib/tiles/adam-bolt/graf-new.prf",
    prf:
      "object:food:Sip of Miruvor:0x8E:0x87\n" +
      "monster:old forest tree:0xB9:0x82\n" +
      "monster:witch:0xB2:0x8C\n" +
      "monster:blackguard:0xB8:0x86\n" +
      "monster:Old Man Willow:0xB8:0x83\n" +
      "monster:red-hatted elf:0xB3:0x87\n" +
      "monster:Father Christmas:0xB3:0x88\n" +
      "monster:dúnadan of Angmar:0xB2:0x82\n",
  },
];

/** The block belonging to a pack directory, or null when there is none. */
export function catchupTileSetFor(pack: string): CatchupTileSet | null {
  return CATCHUP_TILE_SETS.find((s) => s.pack === pack) ?? null;
}

/**
 * Fill one built tile map with whatever this pack's upstream block assigns.
 *
 * Returns how many entries were actually written, which is what the tests read:
 * a block that resolved no names and a block whose every name was already drawn
 * both write nothing, and the count is the only thing that separates them from a
 * block that worked.
 *
 * DECLINES ANY PACK IT DOES NOT KNOW, which is the normal case rather than an
 * edge one. The blocks name cells of four specific atlases; a converted loose
 * pack, a pack somebody else shipped, and the three tile sets upstream did not
 * touch all get nothing, because a coordinate meant for another sheet is a
 * confident wrong answer where a letter was an honest one.
 */
export function applyCatchupTiles(
  fill: TileFill,
  registries: CatchupRegistries | undefined,
  core: CatchupTilesCore,
): number {
  /* `registries` is absent while content composes, which is before any tile map
   * exists - but a filler cannot rely on when it is called, and without the
   * registries there is nothing to resolve a name against. */
  if (registries === undefined) return 0;
  if (fill.pack.engine !== "tilesheet") return 0;
  const set = catchupTileSetFor(fill.pack.id);
  if (set === null) return 0;

  const map = core.parseTilePrefs(set.prf, {
    features: registries.features,
    objects: registries.objects,
    monsters: registries.monsters,
    traps: registries.traps,
  });

  let written = 0;
  /* `forEach` skips the holes: a TileMap is sparse, and only the entries these
   * lines actually named are populated. */
  map.monster.forEach((tile, ridx) => {
    if (tile !== undefined && fill.fillMonster(ridx, tile)) written += 1;
  });
  map.object.forEach((tile, kidx) => {
    if (tile !== undefined && fill.fillObject(kidx, tile)) written += 1;
  });
  return written;
}
