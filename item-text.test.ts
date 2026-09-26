/**
 * The item-description wording under `catchup.text`: upstream ad5c8401a and
 * 4153ff6a6.
 *
 * The published engine this suite runs against predates the objectInfoText and
 * effectIntro seams, so these tests call the mod's functions directly with the
 * facts core passes. The expected strings are upstream master's own literals
 * from src/obj-info.c, one case per branch of describe_effect.
 */

import { describe, expect, it } from "vitest";

import plugin from "./plugin";
import { catchupEffectIntro, catchupObjectInfoText, type EffectIntroFacts } from "./item-text";

function intro(over: Partial<EffectIntroFacts>): EffectIntroFacts {
  return {
    effect: "known",
    itemClass: "other",
    aimed: false,
    activation: false,
    describedActivation: false,
    text: "",
    ...over,
  };
}

describe("catchup.text: 'Affects your ...' ends with a full stop (upstream ad5c8401a)", () => {
  it("adds the full stop to 4.2.6's line", () => {
    expect(catchupObjectInfoText("Affects your stealth\n")).toBe("Affects your stealth.\n");
    expect(catchupObjectInfoText("Affects your strength and dexterity\n")).toBe(
      "Affects your strength and dexterity.\n",
    );
  });

  it("leaves a line that already has one, and every other fragment, unchanged", () => {
    for (const text of [
      "Affects your stealth.\n",
      "Affects your stealth",
      "\n",
      "+2 stealth.\n",
      "It affects your stealth\n",
      "",
    ]) {
      expect(catchupObjectInfoText(text)).toBe(text);
    }
  });
});

describe("catchup.text: effect introductions (upstream 4153ff6a6)", () => {
  it("keeps 4.2.6's sentence for unknown food, potions and scrolls", () => {
    expect(catchupEffectIntro(intro({ effect: "unknown", itemClass: "food", text: "It can be eaten.\n" }))).toBe(
      "It can be eaten.\n",
    );
    expect(catchupEffectIntro(intro({ effect: "unknown", itemClass: "potion", text: "It can be drunk.\n" }))).toBe(
      "It can be drunk.\n",
    );
    expect(catchupEffectIntro(intro({ effect: "unknown", itemClass: "scroll", text: "It can be read.\n" }))).toBe(
      "It can be read.\n",
    );
  });

  it("writes upstream's sentences for unknown wands, staffs, rods and equipment", () => {
    expect(
      catchupEffectIntro(intro({ effect: "unknown", itemClass: "wand", aimed: true, text: "It can be aimed.\n" })),
    ).toBe("It requires a target. It can be used.");
    expect(catchupEffectIntro(intro({ effect: "unknown", itemClass: "staff", text: "It can be activated.\n" }))).toBe(
      "It can be used.",
    );
    expect(
      catchupEffectIntro(intro({ effect: "unknown", itemClass: "rod", aimed: true, text: "It can be aimed.\n" })),
    ).toBe("It may require a target. It can be used.");
    expect(
      catchupEffectIntro(
        intro({ effect: "unknown", itemClass: "other", activation: true, text: "It can be activated.\n" }),
      ),
    ).toBe("It may require a target. It can be used.");
  });

  it("uses 'used' for an activation with its own description, prefaced when aimed", () => {
    const described = { activation: true, describedActivation: true, text: "When activated, it " };
    expect(catchupEffectIntro(intro(described))).toBe("When used, it ");
    expect(catchupEffectIntro(intro({ ...described, aimed: true }))).toBe("It requires a target. When used, it ");
  });

  it("chooses the verb by item class for a known effect, prefaced when aimed", () => {
    const cases: [EffectIntroFacts["itemClass"], string][] = [
      ["food", "When eaten, it "],
      ["potion", "When quaffed, it "],
      ["scroll", "When read, it "],
      ["wand", "When used, it "],
      ["staff", "When used, it "],
      ["rod", "When used, it "],
      ["other", "When used, it "],
    ];
    for (const [itemClass, verb] of cases) {
      expect(catchupEffectIntro(intro({ itemClass }))).toBe(verb);
      expect(catchupEffectIntro(intro({ itemClass, aimed: true }))).toBe(`It requires a target. ${verb}`);
    }
    /* 4.2.6 said "When activated" for any activation; upstream picks by class. */
    expect(catchupEffectIntro(intro({ itemClass: "other", activation: true, text: "When activated, it " }))).toBe(
      "When used, it ",
    );
  });
});

describe("catchup.text gates the item-description hooks", () => {
  it("contributes both hooks only when the section is on", () => {
    /* "./plugin" resolves to the built plugin.js, so these check the shipped
     * bundle by what it returns rather than by function identity. */
    const on = plugin.hooks({ flags: { "catchup.text": true } });
    expect(on.objectInfoText?.("Affects your stealth\n")).toBe("Affects your stealth.\n");
    expect(on.effectIntro?.(intro({ itemClass: "wand", aimed: true }))).toBe("It requires a target. When used, it ");

    for (const flags of [{}, { "catchup.text": false }]) {
      const off = plugin.hooks({ flags });
      expect("objectInfoText" in off).toBe(false);
      expect("effectIntro" in off).toBe(false);
    }
  });
});
