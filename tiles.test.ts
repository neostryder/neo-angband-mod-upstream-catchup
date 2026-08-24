/**
 * The four ported commits, against the REAL engine and the REAL 4.2.6 gamedata.
 *
 * Every name in a `.prf` line is a lookup into bound registries, so a test that
 * hand-built a registry would be asserting its own fixture: it would pass for a
 * monster Angband does not have and for a tval that no longer exists. These
 * tests bind the published content pack instead, which is the same content the
 * game runs on, and then drive the filler exactly as the host drives it.
 *
 * What each group is for:
 *
 *  - THE LINES PARSE AND RESOLVE. Every ported line names something 4.2.6
 *    actually ships, and lands on the index that name resolves to, at the
 *    coordinates upstream wrote. This is the check that would have caught a
 *    typo'd name, which resolves to nothing and reports nothing.
 *  - THE BLOCKS STAY IN THEIR OWN TILE SET. This is the reason the mod is a
 *    filler rather than a `prefs` resource, so it is the test that has to exist:
 *    a block reaching another pack would repaint entries that pack gets right.
 *  - NOTHING ALREADY DRAWN IS REPLACED. Mechanical through `fillMonster` /
 *    `fillObject`, and pinned here anyway, because it is the guarantee the
 *    README makes to a player.
 *  - THE PLUGIN OBEYS ITS OWN FLAG. A switched-off class installs no filler at
 *    all, rather than one that declines every pack.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  loadPackFile as loadJson,
  loadPackRecords as loadRecords,
} from "@rpgm-tools/neo-angband-content/pack";
import { GRAPHICS_MODE_CATALOG, bindCore } from "@rpgm-tools/neo-angband-core";
import type {
  CoreRegistries,
  GamePack,
  ModRegistryHost,
  TileAtlas,
  TileFill,
  TileFillPack,
  TileFiller,
} from "@rpgm-tools/neo-angband-core";
import * as neoCore from "@rpgm-tools/neo-angband-core";
import { validateManifest } from "@rpgm-tools/neo-angband-mod-sdk";
import plugin from "./plugin";
import { CATCHUP_TILE_SETS, applyCatchupTiles, catchupTileSetFor } from "./tiles";

/* ------------------------------------------------------------------ *
 * Content: the published 4.2.6 pack, bound the way a session binds it.
 * ------------------------------------------------------------------ */

const objPack = {
  objectBase: loadJson("object_base"),
  object: loadJson("object"),
  egoItem: loadJson("ego_item"),
  artifact: loadJson("artifact"),
  curse: loadJson("curse"),
  brand: loadJson("brand"),
  slay: loadJson("slay"),
  activation: loadJson("activation"),
  objectProperty: loadJson("object_property"),
  flavor: loadJson("flavor"),
};

const pack: GamePack = {
  constants: loadJson("constants"),
  terrain: loadRecords("terrain"),
  roomTemplates: loadRecords("room_template"),
  vaults: loadRecords("vault"),
  dungeonProfiles: loadRecords("dungeon_profile"),
  projection: loadRecords("projection"),
  trap: loadRecords("trap"),
  names: loadRecords("names"),
  quest: loadRecords("quest"),
  obj: objPack,
  mon: {
    pain: loadRecords("pain"),
    blowMethods: loadRecords("blow_methods"),
    blowEffects: loadRecords("blow_effects"),
    monsterSpells: loadRecords("monster_spell"),
    monsterBases: loadRecords("monster_base"),
    monsters: loadRecords("monster"),
    summons: loadRecords("summon"),
    pits: loadRecords("pit"),
  },
  player: {
    races: loadRecords("p_race"),
    classes: loadRecords("class"),
    properties: loadRecords("player_property"),
    timed: loadRecords("player_timed"),
    shapes: loadRecords("shape"),
    bodies: loadRecords("body"),
    history: loadRecords("history"),
    realms: loadRecords("realm"),
  },
} as unknown as GamePack;

const reg: CoreRegistries = bindCore(pack);

/** A race's index, by the exact name a `.prf` line uses. */
function ridxOf(name: string): number {
  const race = reg.monsters.raceByName(name);
  if (race === null) throw new Error(`no such monster race: ${name}`);
  return race.ridx;
}

/**
 * An object kind's index, by the exact name a `.prf` line uses.
 *
 * `object.txt` keeps a kind's name in its DESCRIPTION form - "& Knight's
 * Shield~" - where the `&` is the article slot and the `~` is where a plural
 * would go, and a pref line names the plain thing. Both markers come out here,
 * which is the same normalisation `lookup_sval` performs on its way to the
 * comparison a pref line's object field makes.
 */
function kidxOf(name: string): number {
  const plain = (n: string): string => n.replace(/^&\s+/u, "").replace(/~/gu, "");
  const kind = reg.objects.kinds.find((k) => plain(k.name) === name);
  if (kind === undefined) throw new Error(`no such object kind: ${name}`);
  return kind.kidx;
}

/* ------------------------------------------------------------------ *
 * A tile fill, standing in for the front end's.
 * ------------------------------------------------------------------ */

/**
 * The host's own door, reduced to its two rules: a read of what is assigned,
 * and a write that refuses an index somebody already has. `derive` and
 * `transform` answer null because that is what the TILESHEET engine answers -
 * its tiles are cells of a fixed atlas with no spare cell for a variant - and
 * these blocks are for tilesheet packs only.
 */
class FakeFill implements TileFill {
  readonly monsters = new Map<number, TileAtlas>();
  readonly objects = new Map<number, TileAtlas>();

  constructor(readonly pack: TileFillPack) {}

  monsterTile(ridx: number): TileAtlas | null {
    return this.monsters.get(ridx) ?? null;
  }
  objectTile(kidx: number): TileAtlas | null {
    return this.objects.get(kidx) ?? null;
  }
  fillMonster(ridx: number, tile: TileAtlas): boolean {
    if (this.monsters.has(ridx)) return false;
    this.monsters.set(ridx, tile);
    return true;
  }
  fillObject(kidx: number, tile: TileAtlas): boolean {
    if (this.objects.has(kidx)) return false;
    this.objects.set(kidx, tile);
    return true;
  }
  derive(): TileAtlas | null {
    return null;
  }
  transform(): TileAtlas | null {
    return null;
  }
}

/** A tilesheet pack by directory name, which is the id a filler is handed. */
function sheet(id: string): TileFillPack {
  const mode = GRAPHICS_MODE_CATALOG.find((m) => m.directory === id);
  return { engine: "tilesheet", id, menuname: mode?.menuname ?? id };
}

/** Run the mod's filler over one pack and hand back what it wrote. */
function fillFor(id: string): FakeFill {
  const fill = new FakeFill(sheet(id));
  applyCatchupTiles(fill, reg, neoCore);
  return fill;
}

/* ------------------------------------------------------------------ *
 * What each commit is expected to have assigned.
 *
 * Written out from the upstream diff rather than derived from the mod's own
 * text, so a change to either side has to be made to both deliberately.
 * ------------------------------------------------------------------ */

interface Expected {
  readonly pack: string;
  readonly sha: string;
  readonly monsters: readonly [name: string, attr: number, char: number][];
  readonly objects: readonly [name: string, attr: number, char: number][];
}

const EXPECTED: readonly Expected[] = [
  {
    pack: "gervais",
    sha: "7e8b58325",
    monsters: [["Beorn, the Mountain Bear", 0x93, 0xaf]],
    objects: [],
  },
  {
    pack: "shockbolt",
    sha: "2e9703d42",
    monsters: [],
    objects: [["Knight's Shield", 0x80, 0xd4]],
  },
  {
    pack: "nomad",
    sha: "9b04b692d",
    monsters: [],
    objects: [
      ["Sip of Miruvor", 0x8a, 0x90],
      ["Draught of the Ents", 0x8a, 0x91],
    ],
  },
  {
    pack: "adam-bolt",
    sha: "655812a54",
    monsters: [
      ["old forest tree", 0xb9, 0x82],
      ["witch", 0xb2, 0x8c],
      ["blackguard", 0xb8, 0x86],
      ["Old Man Willow", 0xb8, 0x83],
      ["red-hatted elf", 0xb3, 0x87],
      ["Father Christmas", 0xb3, 0x88],
      ["dúnadan of Angmar", 0xb2, 0x82],
    ],
    objects: [["Sip of Miruvor", 0x8e, 0x87]],
  },
];

/* ------------------------------------------------------------------ *
 * The lines parse and resolve.
 * ------------------------------------------------------------------ */

describe("the ported .prf lines", () => {
  it("cover every commit the mod claims, and only those", () => {
    expect(CATCHUP_TILE_SETS.map((s) => s.sha).sort()).toEqual(
      EXPECTED.map((e) => e.sha).sort(),
    );
  });

  it("name a real tile pack directory in the game's own catalog", () => {
    const directories = new Set(GRAPHICS_MODE_CATALOG.map((m) => m.directory));
    for (const set of CATCHUP_TILE_SETS) {
      expect(directories.has(set.pack), `${set.sha} -> ${set.pack}`).toBe(true);
    }
  });

  it("are LF-terminated directive lines with no trailing whitespace", () => {
    for (const set of CATCHUP_TILE_SETS) {
      expect(set.prf, set.sha).not.toContain("\r");
      expect(set.prf.endsWith("\n"), set.sha).toBe(true);
      for (const line of set.prf.split("\n").filter((l) => l !== "")) {
        expect(line, set.sha).toMatch(
          /^(?:monster|object):[^:]+(?::[^:]+)?:0x[0-9A-Fa-f]{2}:0x[0-9A-Fa-f]{2}$/u,
        );
      }
    }
  });

  for (const expected of EXPECTED) {
    it(`${expected.sha} resolves every name it uses against 4.2.6 gamedata`, () => {
      const fill = fillFor(expected.pack);

      for (const [name, attr, char] of expected.monsters) {
        expect(fill.monsterTile(ridxOf(name)), name).toEqual({ attr, char });
      }
      for (const [name, attr, char] of expected.objects) {
        expect(fill.objectTile(kidxOf(name)), name).toEqual({ attr, char });
      }
    });

    it(`${expected.sha} assigns exactly what upstream added, and nothing else`, () => {
      const fill = fillFor(expected.pack);
      expect(fill.monsters.size).toBe(expected.monsters.length);
      expect(fill.objects.size).toBe(expected.objects.length);
    });
  }

  it("assign eight entries in Adam Bolt's tiles, as the commit's own summary says", () => {
    const fill = fillFor("adam-bolt");
    expect(fill.monsters.size + fill.objects.size).toBe(8);
  });
});

/* ------------------------------------------------------------------ *
 * The blocks stay in their own tile set.
 * ------------------------------------------------------------------ */

describe("a block reaches only the tile set upstream wrote it for", () => {
  it("writes nothing into a pack no commit named", () => {
    for (const id of ["old", "shockbolt-light", "somebody-elses-pack"]) {
      const fill = new FakeFill(sheet(id));
      expect(applyCatchupTiles(fill, reg, neoCore), id).toBe(0);
      expect(fill.monsters.size + fill.objects.size, id).toBe(0);
    }
  });

  it("declines a loose pack, whose coordinates mean something else", () => {
    const fill = new FakeFill({
      engine: "linoleum",
      id: "gervais",
      menuname: "David Gervais' tiles (neo-linoleum)",
    });
    expect(applyCatchupTiles(fill, reg, neoCore)).toBe(0);
  });

  it("does not carry another pack's assignments across", () => {
    /* The specific harm the `prefs` resource door would have done: David
     * Gervais' sheet already draws the Knight's Shield, the Sip of Miruvor and
     * the Draught of the Ents, and Shockbolt's already draws Beorn's bear form.
     * A pref file applying to every map would have repainted all of them. */
    const gervais = fillFor("gervais");
    expect(gervais.objectTile(kidxOf("Knight's Shield"))).toBeNull();
    expect(gervais.objectTile(kidxOf("Sip of Miruvor"))).toBeNull();
    expect(gervais.objectTile(kidxOf("Draught of the Ents"))).toBeNull();

    const shockbolt = fillFor("shockbolt");
    expect(shockbolt.monsterTile(ridxOf("Beorn, the Mountain Bear"))).toBeNull();
    expect(shockbolt.monsterTile(ridxOf("Father Christmas"))).toBeNull();
  });

  it("has one entry per pack directory, so nothing shadows anything", () => {
    const packs = CATCHUP_TILE_SETS.map((s) => s.pack);
    expect(new Set(packs).size).toBe(packs.length);
    for (const p of packs) expect(catchupTileSetFor(p)?.pack).toBe(p);
    expect(catchupTileSetFor("no-such-pack")).toBeNull();
  });
});

/* ------------------------------------------------------------------ *
 * Nothing already drawn is replaced.
 * ------------------------------------------------------------------ */

describe("an assignment already in the map wins", () => {
  it("leaves a tile the pack (or an earlier mod) assigned exactly as it was", () => {
    const fill = new FakeFill(sheet("gervais"));
    const already: TileAtlas = { attr: 0x11, char: 0x22 };
    fill.fillMonster(ridxOf("Beorn, the Mountain Bear"), already);

    expect(applyCatchupTiles(fill, reg, neoCore)).toBe(0);
    expect(fill.monsterTile(ridxOf("Beorn, the Mountain Bear"))).toEqual(already);
  });

  it("writes nothing at all without registries to resolve a name against", () => {
    const fill = new FakeFill(sheet("adam-bolt"));
    expect(applyCatchupTiles(fill, undefined, neoCore)).toBe(0);
    expect(fill.monsters.size + fill.objects.size).toBe(0);
  });
});

/* ------------------------------------------------------------------ *
 * The plugin obeys its own flag.
 * ------------------------------------------------------------------ */

/** The host's registry facade, reduced to the one door this mod opens. */
function fakeHost(): { host: ModRegistryHost; fillers: TileFiller[] } {
  const fillers: TileFiller[] = [];
  const host = {
    tiles: {
      register(filler: TileFiller): void {
        fillers.push(filler);
      },
      player(): void {},
    },
  } as unknown as ModRegistryHost;
  return { host, fillers };
}

describe("the mod's entry point", () => {
  it("installs no filler at all while catchup.tiles is off", () => {
    const { host, fillers } = fakeHost();
    plugin.register(host, { flags: { "catchup.tiles": false }, core: neoCore, registries: reg });
    expect(fillers).toHaveLength(0);
  });

  it("installs exactly one filler when catchup.tiles is on", () => {
    const { host, fillers } = fakeHost();
    plugin.register(host, { flags: { "catchup.tiles": true }, core: neoCore, registries: reg });
    expect(fillers).toHaveLength(1);

    const fill = new FakeFill(sheet("nomad"));
    fillers[0]?.(fill);
    expect(fill.objects.size).toBe(2);
  });

  it("treats an absent flag as off, the same as a false one", () => {
    const { host, fillers } = fakeHost();
    plugin.register(host, { flags: {}, core: neoCore, registries: reg });
    expect(fillers).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ *
 * The manifest and the code agree.
 * ------------------------------------------------------------------ */

describe("manifest.json", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("./manifest.json", import.meta.url), "utf8"),
  ) as {
    id: string;
    version: string;
    engine: string;
    capabilities?: string[];
    rules: { flag: string; default: boolean }[];
  };

  it("is a manifest the game would accept", () => {
    expect(() => validateManifest(manifest)).not.toThrow();
  });

  it("declares the flags the plugin reads, and defaults every one of them off", () => {
    expect(manifest.rules.map((r) => r.flag)).toEqual([
      "catchup.tiles",
      "catchup.projections",
    ]);
    for (const rule of manifest.rules) expect(rule.default, rule.flag).toBe(false);
  });

  it("declares the capability the filler needs", () => {
    expect(manifest.capabilities).toContain("registry:tiles");
  });

  it("floors the engine at the release that shipped registry:tiles", () => {
    expect(manifest.engine).toBe(">=0.23.0");
  });

  it("carries the version package.json carries", () => {
    const pkg = JSON.parse(
      readFileSync(new URL("./package.json", import.meta.url), "utf8"),
    ) as { version: string };
    expect(manifest.version).toBe(pkg.version);
  });
});
