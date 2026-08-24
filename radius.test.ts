/**
 * The `catchup.projections` rule: upstream `f0f6bd223`, against the REAL engine
 * and the REAL 4.2.6 terrain.
 *
 * The bug is arithmetic on a hole, so a test that asserted the clamp returns
 * `min(rad, maxRange)` would be asserting its own fixture. These tests build a
 * chunk out of the published 4.2.6 terrain, run the engine's OWN
 * `computeProjection` over it, and read the damage table it produced:
 *
 *  - WITHOUT the clamp, the blast collects grids at distances the table has no
 *    entry for, so the damage for those grids is `undefined` and the first
 *    arithmetic done with it is `NaN`. That is the reproduction, and it has to
 *    come first: a fix with no failing case behind it is a fix for nothing.
 *  - WITH the radius this mod's rule supplies, every collected grid has a real
 *    damage, and the whole projection is identical to one that asked for the
 *    maximum range in the first place. Upstream's commit is a clamp and nothing
 *    else, so anything short of identical would be this mod inventing a rule.
 *
 * These run against the PUBLISHED engine, like the rest of this repository's
 * suite, and they do not touch the new seam's types to do it: the clamp is
 * applied here the same way the engine applies it, so the reproduction is valid
 * on the engine a player is running today as well as the one that will carry
 * the seam.
 */

import { describe, expect, it } from "vitest";
import {
  loadPackFile as loadJson,
  loadPackRecords as loadRecords,
} from "@rpgm-tools/neo-angband-content/pack";
import { Chunk, FEAT, PROJECT, bindCore, computeProjection } from "@rpgm-tools/neo-angband-core";
import type { CoreRegistries, GamePack } from "@rpgm-tools/neo-angband-core";

import manifest from "./manifest.json";
import plugin from "./plugin";
import { clampBlastRadius } from "./radius";

/* ------------------------------------------------------------------ *
 * Content: the published 4.2.6 pack, bound the way a session binds it.
 * ------------------------------------------------------------------ */

const pack = {
  constants: loadJson("constants"),
  terrain: loadRecords("terrain"),
  roomTemplates: loadRecords("room_template"),
  vaults: loadRecords("vault"),
  dungeonProfiles: loadRecords("dungeon_profile"),
  projection: loadRecords("projection"),
  trap: loadRecords("trap"),
  names: loadRecords("names"),
  quest: loadRecords("quest"),
  obj: {
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
  },
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

/** z_info->max_range, read from the bound pack rather than written down. */
const MAX_RANGE = reg.constants.maxRange;
/** Base damage, chosen only so the falloff is legible in an assertion. */
const DAM = 20;
/** The over-radius under test: past the maximum by enough to be unambiguous. */
const OVER = MAX_RANGE + 5;

/**
 * An open field wide enough for a blast to reach `OVER` in every direction.
 *
 * A generated dungeon almost never has that much clear ground, and a blast that
 * runs into a wall never reaches the distances this is about. The terrain is
 * still 4.2.6's own - `FEAT.FLOOR` resolved through the bound registry - so what
 * `computeProjection` decides about passability, projectability and line of
 * sight is what it decides in a real game.
 */
function openField(): { chunk: Chunk; centre: { x: number; y: number } } {
  const side = OVER * 2 + 1;
  const chunk = new Chunk(reg.features, side, side);
  chunk.fill(FEAT["FLOOR"]);
  return { chunk, centre: { x: OVER, y: OVER } };
}

/** The engine's own projection over that field, at one radius. */
function blastAt(rad: number): ReturnType<typeof computeProjection> {
  const { chunk, centre } = openField();
  return computeProjection(chunk, {
    origin: centre,
    finish: centre,
    rad,
    typ: 0,
    flg: PROJECT["GRID"],
    dam: DAM,
    maxRange: MAX_RANGE,
  });
}

/** What each collected grid would be handed as its damage. */
function damagesHandedOut(proj: ReturnType<typeof computeProjection>): unknown[] {
  return proj.distanceToGrid.map((d) => proj.damAtDist[d]);
}

describe("the manifest declares the rule, and declares it once", () => {
  it("carries catchup.projections as a rule, and not also as a section", () => {
    const rule = manifest.rules.find((r) => r.flag === "catchup.projections");
    expect(rule).toBeDefined();
    expect(rule?.default).toBe(false);

    /* A section's flag is its own rule declaration - a flag in both places
     * fails manifest validation, and would give one name two meanings inside
     * this mod's own code. */
    expect(manifest.sections.some((s) => s.flag === "catchup.projections")).toBe(false);
  });
});

describe("the plugin obeys its own flag", () => {
  it("contributes the radius hook only when the rule is on", () => {
    const contributed = plugin.hooks({ flags: { "catchup.projections": true } });
    expect(Object.keys(contributed)).toEqual(["projectionRadius"]);
    /* By BEHAVIOUR, not by identity. `./plugin` resolves to the committed
     * `plugin.js` - the bundle an install actually fetches and runs - and the
     * clamp inside it is a different function object from the one this file
     * imports from the source. Comparing the two by identity would pass only
     * for as long as it was testing the source instead of the artefact. */
    expect(contributed.projectionRadius?.(OVER, MAX_RANGE)).toBe(MAX_RANGE);
    expect(contributed.projectionRadius?.(3, MAX_RANGE)).toBe(3);
    expect(contributed.projectionRadius?.(OVER, MAX_RANGE)).toBe(
      clampBlastRadius(OVER, MAX_RANGE),
    );
  });

  it("contributes NO KEY when the rule is off", () => {
    /* Not a function that declines: an absent member is what leaves core on the
     * path it takes with no mod loaded at all. */
    expect(plugin.hooks({ flags: { "catchup.projections": false } })).toEqual({});
    expect(plugin.hooks({ flags: {} })).toEqual({});
  });

  it("does not read another rule's flag to decide", () => {
    expect(plugin.hooks({ flags: { "catchup.tiles": true, "catchup.text": true } })).toEqual(
      {},
    );
  });
});

describe("the 4.2.6 behaviour this corrects", () => {
  it("collects grids the damage table has no entry for", () => {
    const proj = blastAt(OVER);
    expect(proj.damAtDist).toHaveLength(MAX_RANGE + 1);
    expect(Math.max(...proj.distanceToGrid)).toBeGreaterThan(MAX_RANGE);
  });

  it("hands those grids a damage that is not a number, and turns it into NaN", () => {
    const damages = damagesHandedOut(blastAt(OVER));
    const holes = damages.filter((d) => typeof d !== "number");
    expect(holes.length).toBeGreaterThan(0);
    expect(holes[0]).toBeUndefined();
    /* Every projection handler in the game does arithmetic on the damage it is
     * handed. This is the first line of it, and the point at which the hole
     * stops being visible as one. */
    expect(Number.isNaN(Math.floor((holes[0] as number) / 2))).toBe(true);
  });
});

describe("the clamp, as the rule supplies it", () => {
  it("gives every collected grid a real damage", () => {
    const damages = damagesHandedOut(blastAt(clampBlastRadius(OVER, MAX_RANGE)));
    expect(damages.length).toBeGreaterThan(0);
    expect(damages.every((d) => typeof d === "number" && Number.isFinite(d))).toBe(true);
    /* The centre still takes the full damage, so the blast was narrowed rather
     * than emptied. */
    expect(damages).toContain(DAM);
  });

  it("produces exactly the blast the maximum range would have produced", () => {
    expect(blastAt(clampBlastRadius(OVER, MAX_RANGE))).toEqual(blastAt(MAX_RANGE));
  });

  it("leaves a radius already within range alone, at every value up to it", () => {
    for (let rad = 0; rad <= MAX_RANGE; rad++) {
      expect(clampBlastRadius(rad, MAX_RANGE)).toBe(rad);
    }
    /* And the blast it produces is untouched, which is the claim that matters
     * for a player: switching this rule on changes nothing a 4.2.6 spell,
     * breath or wand can ask for. */
    expect(blastAt(clampBlastRadius(3, MAX_RANGE))).toEqual(blastAt(3));
  });
});
