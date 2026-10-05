import { describe, expect, it } from "vitest";
import { api2Unavailable, type Api2Hooks, type ModApi2 } from "@rpgm-tools/neo-angband-mod-sdk";
import { createAdapter } from "./core-adapter";
import { createAdapter as createApi2Adapter } from "./core-adapter-api2";
import { catchupEffectIntro, catchupObjectInfoText } from "./item-text";
import { learnShapeObviousFlagsDirectly } from "./shape-flags";
import plugin from "./plugin";

function fakeApi(flags: Readonly<Record<string, boolean>>): ModApi2 {
  const unused = () => {
    throw new Error("The flags adapter must not call another domain");
  };
  const slot = { get: unused, set: unused };
  return {
    meta: {
      id: "upstream-catchup",
      api: "2.0.0",
      engine: "1.18.0",
      tier: "first-party",
      flags,
      newCharacter: false,
      granted: () => false,
      log: unused,
      settings: async () => api2Unavailable("No settings in this fixture"),
      setSetting: unused,
      mods: unused,
    },
    view: { world: unused, player: unused, monsters: unused, level: unused, input: unused, isCurrent: unused },
    act: {
      submit: unused,
      answer: unused,
      controller: { owns: unused, setStatus: unused, markNondeterministic: unused, release: unused },
    },
    content: { own: unused, asset: unused, records: unused, lookup: unused },
    events: { on: unused, off: unused },
    hooks: { available: [], active: [] },
    store: { prefs: slot, character: slot },
    ui: { mount: unused, patch: unused, keys: { bind: unused, list: unused, remove: unused } },
  };
}

describe("the API 2 adapter", () => {
  it.each([
    {},
    { "catchup.tiles": false, "catchup.text": false, "catchup.shapeFlags": false },
    { "catchup.tiles": true, "catchup.text": true, "catchup.shapeFlags": true },
    { "catchup.tiles": false, "catchup.text": true, "catchup.projections": true, "catchup.levelRevisitTracking": true },
  ])("reads the same flags as API 1: %j", (flags) => {
    const facts: Readonly<Record<string, boolean>> = flags;
    const api1 = createAdapter({ flags: facts, core: { parseTilePrefs: () => { throw new Error("Unused engine"); } } });
    const api2 = createApi2Adapter(fakeApi(Object.freeze({ ...facts })));
    expect(api2.meta).toEqual(api1.meta);
    expect(Object.keys(api2)).toEqual(["meta"]);
  });

  it("preserves the API 2 flag reference", () => {
    const mod = fakeApi(Object.freeze({ "catchup.tiles": true }));
    expect(createApi2Adapter(mod).meta.flags).toBe(mod.meta.flags);
  });

  it("keeps the text and shape functions compatible with API 2 hooks", () => {
    const api2: Api2Hooks = {
      objectInfoText: catchupObjectInfoText,
      effectIntro: catchupEffectIntro,
      shapeLearnObviousFlagsDirectly: learnShapeObviousFlagsDirectly,
    };
    const api1 = plugin.hooks({ flags: { "catchup.text": true, "catchup.shapeFlags": true } });
    const site = { section: "stats", tval: "ring", kind: "Speed", aware: true } as const;
    for (const text of ["Affects your speed\n", "Affects your speed.\n", "Other text\n"]) {
      expect(api2.objectInfoText?.(text, site)).toBe(api1.objectInfoText?.(text));
    }
    for (const itemClass of ["food", "potion", "scroll", "wand", "staff", "rod", "other"] as const) {
      for (const effect of ["known", "unknown"] as const) {
        for (const aimed of [false, true]) {
          for (const describedActivation of [false, true]) {
            const intro = { itemClass, effect, aimed, activation: describedActivation, describedActivation, text: "Original text" };
            expect(api2.effectIntro?.(intro)).toBe(api1.effectIntro?.(intro));
          }
        }
      }
    }
    expect(api2.shapeLearnObviousFlagsDirectly?.()).toBe(api1.shapeLearnObviousFlagsDirectly?.());
    expect(plugin.hooks({ flags: createApi2Adapter(fakeApi({})).meta.flags })).toEqual({});
  });
});
