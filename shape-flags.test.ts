/**
 * The `catchup.shapeFlags` rule: upstream `c8036c515`, against the REAL
 * engine and the REAL 4.2.6 shape data.
 *
 * These tests run against the PUBLISHED engine, like the rest of this
 * repository's suite - and deliberately do not call the new
 * `shapeLearnObviousFlagsDirectly` seam or `shapeLearnOnAssume`'s (unreleased)
 * fourth parameter directly. Doing so would only typecheck once the engine
 * carrying the seam is actually installed, and this repository's `tsc --noEmit`
 * always resolves whatever `@rpgm-tools/neo-angband-core` is in `node_modules` -
 * the published version, unless the whole toolchain is pointed at a local
 * build. `radius.test.ts` hit the same constraint for `catchup.projections` and
 * solved it the same way: prove the reproduction and the fix's own building
 * block against surface that already exists and does not change shape, and
 * leave "does the engine actually call this when the rule is on" to the
 * engine's own test suite, which has a GameState to install a mod hook into
 * and this repository does not.
 *
 *  - WITHOUT the rule, `shapeLearnOnAssume` (its existing, unchanged, three-
 *    argument published signature) learns a shape's obvious flag only through
 *    `equipLearnFlag`, which requires a WORN item to also carry the flag. A
 *    fox shapechange grants Free Action with nothing worn that carries it, so
 *    the player is never told - the reproduction, on data and functions this
 *    package has shipped since before this rule existed.
 *  - The rule's fix is `player_learn_rune` upstream, ported as
 *    `playerLearnFlagRune` - already exported, already unchanged by this
 *    change, and exactly what the engine's `shapeLearnOnAssume` calls for each
 *    of a shape's obvious flags once `ModHooks.shapeLearnObviousFlagsDirectly`
 *    says yes. Calling it directly proves closing the gap needs nothing this
 *    mod does not already have.
 */

import { describe, expect, it } from "vitest";
import {
  loadPackFile as loadJson,
  loadPackRecords as loadRecords,
} from "@rpgm-tools/neo-angband-content/pack";
import {
  blankPlayer,
  bindPlayer,
  equipLearnFlag,
  makeRuneEnv,
  ObjRegistry,
  OF,
  playerLearnFlagRune,
  Rng,
} from "@rpgm-tools/neo-angband-core";
import type {
  GameObject,
  ObjPackJson,
  Player,
  PlayerPackRecords,
  RuneEnv,
  Shape,
} from "@rpgm-tools/neo-angband-core";

import manifest from "./manifest.json";
import plugin from "./plugin";
import { learnShapeObviousFlagsDirectly } from "./shape-flags";

/* ------------------------------------------------------------------ *
 * Content: the published 4.2.6 pack, bound the way the engine's own
 * knowledge-learn tests bind it - direct ObjRegistry/bindPlayer construction
 * rather than bindCore, which does not expose a bound player registry at all.
 * ------------------------------------------------------------------ */

const objRegistry = new ObjRegistry({
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
} as ObjPackJson);

const players = bindPlayer({
  races: loadRecords("p_race"),
  classes: loadRecords("class"),
  properties: loadRecords("player_property"),
  timed: loadRecords("player_timed"),
  shapes: loadRecords("shape"),
  bodies: loadRecords("body"),
  history: loadRecords("history"),
  realms: loadRecords("realm"),
} as PlayerPackRecords);

const rng = new Rng(118);

/** The real "fox" shape record - the same one issue #118 confirmed reproducing against. */
const FOX: Shape = (() => {
  const shape = players.shapes.find((s) => s.name === "fox");
  if (!shape) throw new Error("no fox shape in the published 4.2.6 pack");
  return shape;
})();

/** A fresh player plus an empty equipped-item environment: nothing worn. */
function fixture(): { p: Player; env: RuneEnv; messages: string[] } {
  const race = players.raceByName("Human")!;
  const cls = players.classByName("Warrior")!;
  const p = blankPlayer(race, cls, players.bodies[race.body]!);
  const eq: (GameObject | null)[] = new Array(p.body.count).fill(null);
  const messages: string[] = [];
  const env = makeRuneEnv(
    (slot) => eq[slot] ?? null,
    (v) => rng.randcalcVaries(v),
    {
      brands: objRegistry.brands,
      slays: objRegistry.slays,
      curses: objRegistry.curses,
      properties: objRegistry.properties,
      elementNames: ["acid", "lightning", "fire", "frost"],
      msg: (t) => messages.push(t),
    },
  );
  return { p, env, messages };
}

describe("the manifest declares the rule, and declares it once", () => {
  it("carries catchup.shapeFlags as a rule, and not also as a section", () => {
    const rule = manifest.rules.find((r) => r.flag === "catchup.shapeFlags");
    expect(rule).toBeDefined();
    expect(rule?.default).toBe(false);
    expect(manifest.sections.some((s) => s.flag === "catchup.shapeFlags")).toBe(false);
  });
});

describe("the plugin obeys its own flag", () => {
  it("contributes the shape-flag hook only when the rule is on", () => {
    const contributed = plugin.hooks({ flags: { "catchup.shapeFlags": true } });
    expect(Object.keys(contributed)).toEqual(["shapeLearnObviousFlagsDirectly"]);
    /* By BEHAVIOUR, not by identity - `./plugin` resolves to the committed
     * plugin.js, the bundle an install actually fetches and runs. */
    expect(contributed.shapeLearnObviousFlagsDirectly?.()).toBe(true);
    expect(contributed.shapeLearnObviousFlagsDirectly?.()).toBe(
      learnShapeObviousFlagsDirectly(),
    );
  });

  it("contributes NO KEY when the rule is off", () => {
    expect(plugin.hooks({ flags: { "catchup.shapeFlags": false } })).toEqual({});
    expect(plugin.hooks({ flags: {} })).toEqual({});
  });

  it("does not read another rule's flag to decide", () => {
    expect(
      plugin.hooks({ flags: { "catchup.tiles": true, "catchup.text": true } }),
    ).toEqual({});
  });
});

describe("the 4.2.6 behaviour this corrects", () => {
  it("the fox shape grants Free Action with nothing worn that carries it", () => {
    expect(FOX.flags.has(OF.FREE_ACT)).toBe(true);
    const { p, env } = fixture();
    /* Sanity: nothing is equipped, so the equipment path has nothing to find. */
    for (let slot = 0; slot < p.body.count; slot++) {
      expect(env.slotObject(slot)).toBeNull();
    }
  });

  it("shapeLearnOnAssume's own equipment path never learns it (the reported gap)", () => {
    const { p, env } = fixture();
    /* This IS what shapeLearnOnAssume's obvious-flag loop calls today, on the
     * published, unfixed engine - equipLearnFlag, once per obvious flag. */
    equipLearnFlag(p, env, OF.FREE_ACT);
    expect(p.objKnown.flags.has(OF.FREE_ACT)).toBe(false);
  });
});

describe("the fix, as the rule supplies it", () => {
  it("learning the flag directly (player_learn_rune) closes the gap", () => {
    const { p, env, messages } = fixture();
    equipLearnFlag(p, env, OF.FREE_ACT);
    expect(p.objKnown.flags.has(OF.FREE_ACT)).toBe(false);

    /* What shapeLearnOnAssume does, once wired to ModHooks.shapeLearnObvious-
     * FlagsDirectly, for each of the shape's already-computed obvious flags. */
    const learned = playerLearnFlagRune(p, env, OF.FREE_ACT);
    expect(learned).toBe(true);
    expect(p.objKnown.flags.has(OF.FREE_ACT)).toBe(true);
    expect(messages.length).toBeGreaterThan(0);
  });

  it("is a no-op once the equipment path already learned the same flag", () => {
    /* Two mods, or the equipment path and this rule both firing for one
     * flag, must not double-message or misreport whether anything was
     * learned - playerLearnFlagRune already guards on p.objKnown.flags. */
    const { p, env, messages } = fixture();
    playerLearnFlagRune(p, env, OF.FREE_ACT);
    messages.length = 0;
    expect(playerLearnFlagRune(p, env, OF.FREE_ACT)).toBe(false);
    expect(messages).toEqual([]);
  });
});
