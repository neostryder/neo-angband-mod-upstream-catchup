import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { apiRangeVerdict, checkApi2Policies, type Api2Hooks, type ModApi2 } from "@rpgm-tools/neo-angband-mod-sdk";
import { catchupEffectIntro, catchupObjectInfoText } from "./item-text";
import { learnShapeObviousFlagsDirectly } from "./shape-flags";
import plugin from "./plugin";

const RULES = ["catchup.tiles", "catchup.projections", "catchup.shapeFlags", "catchup.levelRevisitTracking", "catchup.text"] as const;

function hooksFor(flags: Readonly<Record<string, boolean>>): Api2Hooks {
  return plugin.hooks({ id: "upstream-catchup", flags }) ?? {};
}

function startWith(flags: Readonly<Record<string, boolean>>): string[] {
  const lines: string[] = [];
  const mod = { meta: { flags, log: (line: string) => lines.push(line) } } as unknown as ModApi2;
  plugin.start(mod);
  return lines;
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

  it("contributes nothing for the three rules the game cannot carry yet", () => {
    expect(hooksFor({ "catchup.tiles": true, "catchup.projections": true, "catchup.levelRevisitTracking": true })).toEqual({});
  });

  it("declares no policy table", () => {
    expect(plugin).not.toHaveProperty("policies");
    expect(checkApi2Policies({})).toBeNull();
  });

  it("says in the log which waiting rules are on, and only those", () => {
    expect(startWith({})).toEqual([]);
    expect(startWith({ "catchup.text": true, "catchup.shapeFlags": true })).toEqual([]);
    const lines = startWith({ "catchup.tiles": true, "catchup.projections": false, "catchup.levelRevisitTracking": true });
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("catchup.tiles");
    expect(lines[0]).toContain("UC-1");
    expect(lines[1]).toContain("catchup.levelRevisitTracking");
    expect(lines[1]).toContain("UC-3");
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
