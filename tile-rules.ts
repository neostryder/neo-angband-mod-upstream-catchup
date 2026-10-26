/**
 * The `catchup.tiles` rule, in the form the game applies itself.
 *
 * Each entry is one line of an upstream `.prf` block (tiles.ts keeps the text
 * verbatim) turned into a `tileMap` rule: the monster race or object kind the
 * line names, the sheet cell its attr and char pick out, and the tile set it was
 * written for. The game fills a rule only where the tile set has no assignment,
 * and only for a fixed tile sheet, so a picture an author drew is never replaced
 * and a pack whose cells mean something else gets nothing.
 *
 * A cell is `[column, row]`: the char byte less 0x80, then the attr byte less
 * 0x80. tiles.test.ts derives the same table from tiles.ts through the engine's
 * own `.prf` parser and compares, so a name that stops resolving to its index
 * fails there instead of drawing the wrong picture.
 */

import type { Api2TileRule } from "@rpgm-tools/neo-angband-mod-sdk";

export const CATCHUP_TILE_RULES: readonly Api2TileRule[] = [
  /* 7e8b58325: David Gervais' tiles */
  { monster: 322, cell: [47, 19], packs: ["gervais"] }, // Beorn, the Mountain Bear

  /* 2e9703d42: Shockbolt Dark and Light, one pack directory */
  { object: 136, cell: [84, 0], packs: ["shockbolt"] }, // Knight's Shield

  /* 9b04b692d: Nomad's tiles */
  { object: 18, cell: [16, 10], packs: ["nomad"] }, // Sip of Miruvor
  { object: 20, cell: [17, 10], packs: ["nomad"] }, // Draught of the Ents

  /* 655812a54: Adam Bolt's tiles */
  { object: 18, cell: [7, 14], packs: ["adam-bolt"] }, // Sip of Miruvor
  { monster: 15, cell: [7, 51], packs: ["adam-bolt"] }, // red-hatted elf
  { monster: 16, cell: [8, 51], packs: ["adam-bolt"] }, // Father Christmas
  { monster: 156, cell: [12, 50], packs: ["adam-bolt"] }, // witch
  { monster: 161, cell: [2, 57], packs: ["adam-bolt"] }, // old forest tree
  { monster: 223, cell: [6, 56], packs: ["adam-bolt"] }, // blackguard
  { monster: 236, cell: [3, 56], packs: ["adam-bolt"] }, // Old Man Willow
  { monster: 403, cell: [2, 50], packs: ["adam-bolt"] }, // dunadan of Angmar
];
