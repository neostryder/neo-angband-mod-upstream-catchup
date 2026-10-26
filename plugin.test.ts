import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { api2PolicyEffects, apiRangeVerdict, checkApi2Policies, type Api2Hooks, type Api2Policies } from "@rpgm-tools/neo-angband-mod-sdk";
import { catchupEffectIntro, catchupObjectInfoText } from "./item-text";
import { learnShapeObviousFlagsDirectly } from "./shape-flags";
import plugin from "./plugin";

const RULES = ["catchup.tiles", "catchup.projections", "catchup.shapeFlags", "catchup.levelRevisitTracking", "catchup.text"] as const;

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

  it("gives the text rule its two hooks, and nothing else", () => {
    const hooks = hooksFor({ "catchup.text": true });
    expect(Object.keys(hooks).sort()).toEqual(["effectIntro", "objectInfoText"]);
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

  it("asks only for the grants those tables need", () => {
    const manifest = JSON.parse(readFileSync(new URL("./manifest.json", import.meta.url), "utf8")) as { data: { capabilities: string[] } };
    expect(manifest.data.capabilities.sort()).toEqual(["registry:monster", "registry:projection", "registry:tiles"]);
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
