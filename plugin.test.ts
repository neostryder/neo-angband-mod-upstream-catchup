import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { api2PolicyEffects, apiRangeVerdict, checkApi2Policies, type Api2Hooks, type Api2Policies, type ModApi2 } from "@rpgm-tools/neo-angband-mod-sdk";
import { PLAYER_TIMED_ENTRIES, REST_ALL_POINTS, REST_COMPLETE, REST_SOME_POINTS, TMD, playerRestingCompleteMet, type GameState, type MenuTransformer, type MenuTransformRow } from "@rpgm-tools/neo-angband-core";
import { catchupEffectIntro, catchupObjectInfoText } from "./item-text";
import { learnShapeObviousFlagsDirectly } from "./shape-flags";
import plugin from "./plugin";

const RULES = ["catchup.tiles", "catchup.projections", "catchup.shapeFlags", "catchup.levelRevisitTracking", "catchup.completeRest", "catchup.text", "catchup.deathMoldHearing"] as const;

function hooksFor(flags: Readonly<Record<string, boolean>>): Api2Hooks {
  return plugin.hooks({ id: "upstream-catchup", flags }) ?? {};
}

function policiesFor(flags: Readonly<Record<string, boolean>>): Api2Policies {
  return plugin.policies({ id: "upstream-catchup", flags });
}

describe("the API 2 definition", () => {
  it("declares a range this game runs", () => {
    expect(apiRangeVerdict(plugin.api)).toEqual({ ok: true });
  });

  it("gives no hook key when every rule is off or absent", () => {
    expect(hooksFor({})).toEqual({});
    expect(hooksFor(Object.fromEntries(RULES.map((r) => [r, false])))).toEqual({});
  });

  it("gives the shape rule its one hook, and nothing else", () => {
    const hooks = hooksFor({ "catchup.shapeFlags": true });
    expect(Object.keys(hooks)).toEqual(["shapeLearnObviousFlagsDirectly"]);
    expect(hooks.shapeLearnObviousFlagsDirectly?.()).toBe(learnShapeObviousFlagsDirectly());
    expect(hooks.shapeLearnObviousFlagsDirectly?.()).toBe(true);
  });

  it("gives the text rule its four hooks, and nothing else", () => {
    const hooks = hooksFor({ "catchup.text": true });
    expect(Object.keys(hooks).sort()).toEqual(["effectIntro", "messageText", "objectInfoText", "screenText"]);
    const site = { section: "stats", tval: "ring", kind: "Speed", aware: true } as const;
    expect(hooks.objectInfoText?.("Affects your speed\n", site)).toBe(catchupObjectInfoText("Affects your speed\n"));
    expect(hooks.objectInfoText?.("Affects your speed\n", site)).toBe("Affects your speed.\n");
    expect(hooks.objectInfoText?.("Other text\n", site)).toBe("Other text\n");
    const intro = { effect: "known", itemClass: "wand", aimed: true, activation: false, describedActivation: false, text: "x" } as const;
    expect(hooks.effectIntro?.(intro)).toBe(catchupEffectIntro(intro));
    expect(hooks.effectIntro?.(intro)).toBe("It requires a target. When used, it ");
  });

  it("contributes no hook for the three rules the game applies from a table", () => {
    expect(hooksFor({ "catchup.tiles": true, "catchup.projections": true, "catchup.levelRevisitTracking": true })).toEqual({});
  });

  it("declares no table when every rule is off or absent", () => {
    expect(policiesFor({})).toEqual({});
    expect(policiesFor(Object.fromEntries(RULES.map((r) => [r, false])))).toEqual({});
    expect(policiesFor({ "catchup.text": true, "catchup.shapeFlags": true })).toEqual({});
  });

  it("declares each waiting rule's table when its toggle is on, and only that one", () => {
    expect(Object.keys(policiesFor({ "catchup.tiles": true }))).toEqual(["tileMap"]);
    expect(policiesFor({ "catchup.projections": true })).toEqual({ projectionRadiusClamp: true });
    expect(policiesFor({ "catchup.levelRevisitTracking": true })).toEqual({ levelRevisitTracking: true });
    expect(Object.keys(policiesFor({ "catchup.tiles": true, "catchup.projections": true, "catchup.levelRevisitTracking": true })).sort()).toEqual(["levelRevisitTracking", "projectionRadiusClamp", "tileMap"]);
  });

  it("declares tables the game accepts, and installs the game's three seams from them", () => {
    const all = policiesFor({ "catchup.tiles": true, "catchup.projections": true, "catchup.levelRevisitTracking": true });
    expect(checkApi2Policies(all)).toBeNull();
    const { registrations } = api2PolicyEffects(all);
    expect(registrations.projectionRadiusClamp).toBe(true);
    expect(registrations.levelRevisitTracking).toBe(true);
    expect(typeof registrations.tileFiller).toBe("function");
  });

  it("asks for the table grants and the startup menu registry", () => {
    const manifest = JSON.parse(readFileSync(new URL("./manifest.json", import.meta.url), "utf8")) as { data: { capabilities: string[] } };
    expect(manifest.data.capabilities.sort()).toEqual(["engine:access", "registry:command", "registry:menu", "registry:monster", "registry:projection", "registry:tiles"]);
  });

  it("matches the manifest: every rule it names exists there with the same flag", () => {
    const manifest = JSON.parse(readFileSync(new URL("./manifest.json", import.meta.url), "utf8")) as {
      data: { api: string; rules?: { flag: string }[]; sections?: { flag?: string }[] };
    };
    const declared = new Set([...(manifest.data.rules ?? []), ...(manifest.data.sections ?? [])].map((t) => t.flag));
    for (const flag of RULES) expect(declared.has(flag)).toBe(true);
    expect(manifest.data.api).toBe(plugin.api);
  });
});

describe("catchup.completeRest (upstream 41319eef9)", () => {
  const baseline = ["BLIND", "CONFUSED", "POISONED", "AFRAID", "TERROR", "STUN", "CUT", "SLOW", "PARALYZED", "IMAGE"];
  const upstream = [...baseline, "AMNESIA", "SCRAMBLE"];

  function stateFor(flags: Readonly<Record<string, boolean>>): GameState {
    return {
      actor: { player: { chp: 100, mhp: 100, csp: 10, msp: 10, timed: new Array<number>(PLAYER_TIMED_ENTRIES.length).fill(0), wordRecall: 0, deepDescent: 0 } },
      modHooks: api2PolicyEffects(policiesFor(flags)).hooks,
    } as unknown as GameState;
  }

  it("declares exactly upstream's twelve names through the command policy", () => {
    const policies = policiesFor({ "catchup.completeRest": true });
    expect(Object.keys(policies)).toEqual(["completeRestEffects"]);
    expect(checkApi2Policies(policies)).toBeNull();
    expect([...(policies.completeRestEffects ?? [])].sort()).toEqual([...upstream].sort());
    expect(hooksFor({ "catchup.completeRest": true })).toEqual({});
    const manifest = JSON.parse(readFileSync(new URL("./manifest.json", import.meta.url), "utf8")) as { data: { rules: { flag: string; default: boolean }[]; capabilities: string[] } };
    expect(manifest.data.rules.find((rule) => rule.flag === "catchup.completeRest")).toMatchObject({ default: false });
    expect(manifest.data.capabilities).toContain("registry:command");
  });

  for (const [label, flags, expected] of [
    ["on", { "catchup.completeRest": true }, upstream],
    ["off", { "catchup.completeRest": false }, baseline],
    ["absent", {}, baseline],
  ] as const) {
    it.each(PLAYER_TIMED_ENTRIES.map((entry, index) => ({ name: entry.name, index })))(`the ${label} rule waits for exactly its effects: $name`, ({ name, index }) => {
      const state = stateFor(flags);
      expect(playerRestingCompleteMet(state, REST_COMPLETE)).toBe(true);
      state.actor.player.timed[index] = 20;
      expect(playerRestingCompleteMet(state, REST_COMPLETE)).toBe(!expected.includes(name));
      state.actor.player.timed[index] = 0;
      expect(playerRestingCompleteMet(state, REST_COMPLETE)).toBe(true);
    });
  }

  it.each(["chp", "csp", "wordRecall", "deepDescent"] as const)("preserves the complete-rest %s check", (field) => {
    const state = stateFor({ "catchup.completeRest": true });
    state.actor.player[field] = field === "chp" || field === "csp" ? 0 : 1;
    expect(playerRestingCompleteMet(state, REST_COMPLETE)).toBe(false);
  });

  it("waits until both new effects expire and leaves the other rest modes alone", () => {
    const state = stateFor({ "catchup.completeRest": true });
    state.actor.player.timed[TMD.AMNESIA] = 20;
    state.actor.player.timed[TMD.SCRAMBLE] = 30;
    expect(playerRestingCompleteMet(state, REST_COMPLETE)).toBe(false);
    expect(playerRestingCompleteMet(state, REST_ALL_POINTS)).toBe(true);
    expect(playerRestingCompleteMet(state, REST_SOME_POINTS)).toBe(true);
    state.actor.player.timed[TMD.AMNESIA] = 0;
    expect(playerRestingCompleteMet(state, REST_COMPLETE)).toBe(false);
    state.actor.player.timed[TMD.SCRAMBLE] = 0;
    expect(playerRestingCompleteMet(state, REST_COMPLETE)).toBe(true);
  });
});

describe("upstream 43ae88cd9 command-menu wording", () => {
  const rows: readonly MenuTransformRow[] = [
    { id: "core:keypress-command:7", label: "Disarm a trap or chest", semantic: { kind: "keypress-command", data: { originalKey: "D", category: "Action commands" } } },
    { id: "other", label: "Disarm a trap or chest", semantic: { kind: "keypress-command", data: { originalKey: "x" } } },
    { id: "rest", label: "Rest for a while", semantic: { kind: "keypress-command", data: { originalKey: "R" } } },
  ];

  function start(flags: Record<string, boolean>, granted = true, previous: MenuTransformer | null = null): ReturnType<typeof vi.fn> {
    const register = vi.fn();
    plugin.start({
      meta: { flags, granted: () => granted },
      engine: { registry: { menus: { register, handlerFor: () => previous } } },
    } as unknown as ModApi2);
    return register;
  }

  it("changes only the disarm label and preserves command identity and semantics", () => {
    const register = start({ "catchup.text": true });
    expect(register).toHaveBeenCalledOnce();
    const [id, transform] = register.mock.calls[0] as [string, MenuTransformer];
    expect(id).toBe("core:keypress-command-table");
    expect(transform(id, rows)).toEqual([
      { ...rows[0], label: "Disarm a trap/chest; lock door" }, rows[1], rows[2],
    ]);
    expect(transform("other:menu", rows)).toBe(rows);
    expect(rows[0]!.label).toBe("Disarm a trap or chest");
  });

  it("preserves an earlier transformer's labels", () => {
    const previous: MenuTransformer = (_id, input) => input.map((row) => ({ ...row, label: "Earlier wording" }));
    const register = start({ "catchup.text": true }, true, previous);
    const transform = register.mock.calls[0]![1] as MenuTransformer;
    expect(transform("core:keypress-command-table", rows).map((row) => row.label)).toEqual(rows.map(() => "Earlier wording"));
  });

  it("registers nothing when the setting is absent, off, or the grant is refused", () => {
    expect(start({})).not.toHaveBeenCalled();
    expect(start({ "catchup.text": false })).not.toHaveBeenCalled();
    expect(start({ "catchup.text": true }, false)).not.toHaveBeenCalled();
  });

  it("reads no live state and tolerates an unavailable engine domain", () => {
    expect(() => plugin.start({ meta: { flags: { "catchup.text": true }, granted: () => true } } as unknown as ModApi2)).not.toThrow();
    const forbidden = (): never => { throw new Error("Unexpected engine read"); };
    plugin.start({
      meta: { flags: { "catchup.text": true }, granted: () => true },
      engine: { get state() { return forbidden(); }, get core() { return forbidden(); }, get registries() { return forbidden(); }, registry: { menus: { handlerFor: () => null, register: vi.fn() } } },
    } as unknown as ModApi2);
  });
});
