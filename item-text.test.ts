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
import { catchupEffectIntro, catchupMessageText, catchupObjectInfoText, catchupScreenText, type EffectIntroFacts } from "./item-text";

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

const SITE = { section: "stats", tval: "ring", kind: "Speed", aware: true } as const;

describe("catchup.text gates the item-description hooks", () => {
  it("contributes both hooks only when the section is on", () => {
    /* "./plugin" resolves to the built plugin.js, so these check the shipped
     * bundle by what it returns rather than by function identity. */
    const on = plugin.hooks({ id: "upstream-catchup", flags: { "catchup.text": true } }) ?? {};
    expect(on.objectInfoText?.("Affects your stealth\n", SITE)).toBe("Affects your stealth.\n");
    expect(on.effectIntro?.(intro({ itemClass: "wand", aimed: true }))).toBe("It requires a target. When used, it ");
    expect(on.messageText?.("The monster can not move.")).toBe("The monster cannot move.");
    expect(on.screenText?.("character's well being.", { screen: "core:help-symbols", part: "line" })).toBe("character's well-being.");

    for (const flags of [{}, { "catchup.text": false }]) {
      const off = plugin.hooks({ id: "upstream-catchup", flags }) ?? {};
      expect("objectInfoText" in off).toBe(false);
      expect("effectIntro" in off).toBe(false);
      expect("messageText" in off).toBe(false);
      expect("screenText" in off).toBe(false);
    }
  });
});

describe("catchup.text: messages from upstream 73c851ab4 and c6e499b5a", () => {
  const cases = [
    ["The monster can not move.", "The monster cannot move."],
    ["The dungeon does not appear to extend deeper", "The dungeon does not appear to extend deeper."],
    ["The item cannot be used at the moment", "The item cannot be used at the moment."],
    ["The ground shakes! The ceiling caves in!", "The ground shakes!  The ceiling caves in!"],
    ["Bad effect passed to effect_do(). Please report this bug.", "Bad effect passed to effect_do().  Please report this bug."],
    ["Warning! Could not allocate a new monster.", "Warning!  Could not allocate a new monster."],
    ["Oops! It feels deathly cold!", "Oops!  It feels deathly cold!"],
    ["lore save failed!", "Lore save failed!"],
    ["death save failed!", "Death save failed!"],
    ["You steal 27 gold pieces worth of treasure.", "You steal treasure worth 27 gold pieces."],
    ["You steal 0 gold pieces worth of treasure.", "You steal treasure worth 0 gold pieces."],
    ["That wand had no useable energy", "That wand had no useable energy."],
    ["That staff had no useable energy", "That staff had no useable energy."],
  ] as const;

  for (const [before, after] of cases) {
    it(before, () => {
      expect(catchupMessageText(before)).toBe(after);
      expect(catchupMessageText(after)).toBe(after);
    });
  }

  it("preserves unrelated messages and earlier wording changes", () => {
    for (const text of ["", "The monster cannot move!", "You steal an item.", "That rod had no useable energy", "You steal -1 gold pieces worth of treasure.", "lore save failed! Again."]) {
      expect(catchupMessageText(text)).toBe(text);
    }
  });
});

describe("catchup.text: screens from upstream c6e499b5a and 73c851ab4", () => {
  const cases = [
    ["picked up such as treasure, weapons, magical devices, etc; and creatures", "picked up such as treasure, weapons, magical devices, etc.; and Creatures"],
    ["character's well being.", "character's well-being."],
    ["symbols are used to represent entities in more than one category. The \"@\"", "symbols are used to represent entities in more than one category.  The \"@\""],
    ["Entrance to Weapon Smith", "Entrance to Weapon Smiths"],
    ["Lights, Tools, Chests, etc", "Lights, Tools, Chests, etc."],
  ] as const;

  for (const [before, after] of cases) {
    it(before, () => {
      const site = { screen: "core:help-symbols", part: "line" } as const;
      expect(catchupScreenText(before, site)).toBe(after);
      expect(catchupScreenText(after, site)).toBe(after);
      expect(catchupScreenText(before, { ...site, screen: "other:help" })).toBe(before);
    });
  }

  it("changes the quick-filter prompt only at the prompt site", () => {
    const before = "Enter 2 or 3 (for stat) character code and return or return to clear ";
    expect(catchupScreenText(before, { screen: "core:prompt", part: "prompt" })).toBe(
      "Enter 2-character code (3 for a stat) and Return, or just Return to clear ",
    );
    expect(catchupScreenText(before, { screen: "core:prompt", part: "line" })).toBe(before);
  });

  it("changes Page Down while preserving Page Up and other columns", () => {
    const text = "move selection one page up";
    const site = { screen: "core:equip-cmp-select-help", part: "cell", column: "desc1", row: { key1: "n, PgDn" } } as const;
    expect(catchupScreenText(text, site)).toBe("move selection one page down");
    expect(catchupScreenText(text, { ...site, row: { key1: "p, PgUp" } })).toBe(text);
    expect(catchupScreenText(text, { ...site, column: "desc2" })).toBe(text);
    expect(catchupScreenText(text, { ...site, screen: "other:help" })).toBe(text);
    expect(catchupScreenText("other text", site)).toBe("other text");
  });
});
