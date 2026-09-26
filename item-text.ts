/**
 * The item-description half of the `catchup.text` section: upstream's wording
 * for an item's stat lines and effect introductions after 4.2.6.
 *
 * Two upstream commits, both in `src/obj-info.c`:
 *
 *  - `ad5c8401a0d493b3548c5527738a2432dda6f4f1` (upstream issue #6479) ends an
 *    "Affects your ..." line with a full stop (obj-info.c:181).
 *  - `4153ff6a657f7287ca381506553a80c772f2a7fa` (upstream issue #6437) rewrites
 *    the opening words of an effect description in describe_effect. An aimed
 *    effect is prefaced with "It requires a target.", wands, staffs, rods and
 *    activatable equipment take the verb "used", and an unknown rod or piece of
 *    equipment says "It may require a target." because its aim cannot be known.
 *
 * Core writes 4.2.6's wording and hands each piece to the objectInfoText and
 * effectIntro hooks. These functions return upstream's later wording, derived
 * only from the facts core passes in, and return anything else unchanged.
 */

/**
 * What core's effectIntro hook passes, restated structurally so this file
 * compiles against an engine that predates the seam. It matches core's
 * `EffectIntro` in `mod/hooks.ts`.
 */
export interface EffectIntroFacts {
  readonly effect: "known" | "unknown";
  readonly itemClass: "food" | "potion" | "scroll" | "wand" | "staff" | "rod" | "other";
  readonly aimed: boolean;
  readonly activation: boolean;
  readonly describedActivation: boolean;
  readonly text: string;
}

/** "Affects your stealth\n" with no full stop yet, capturing the stat list. */
const AFFECTS_LINE = /^Affects your ([^\n]*[^.\n])\n$/;

/**
 * Upstream ad5c8401a: "Affects your %s\n" becomes "Affects your %s.\n".
 *
 * Core passes one textblock fragment at a time, and this line is always one
 * whole fragment. A line that already ends in a full stop comes back unchanged,
 * so a second mod making the same fix does not add another.
 */
export function catchupObjectInfoText(text: string): string {
  const m = AFFECTS_LINE.exec(text);
  return m ? `Affects your ${m[1]}.\n` : text;
}

/**
 * Upstream 4153ff6a6's introductions, following the branch order of
 * describe_effect on upstream master.
 *
 * For an unknown effect, food, potions and scrolls keep 4.2.6's sentence, so
 * this returns whatever an earlier mod wrote for them. Upstream's three new
 * unknown-effect sentences end without a line break, and so do these.
 */
export function catchupEffectIntro(intro: EffectIntroFacts): string {
  if (intro.effect === "unknown") {
    switch (intro.itemClass) {
      case "food":
      case "potion":
      case "scroll":
        return intro.text;
      case "wand":
        return "It requires a target. It can be used.";
      case "staff":
        return "It can be used.";
      default:
        return "It may require a target. It can be used.";
    }
  }

  const target = intro.aimed ? "It requires a target. " : "";
  if (intro.describedActivation) return `${target}When used, it `;
  switch (intro.itemClass) {
    case "food":
      return `${target}When eaten, it `;
    case "potion":
      return `${target}When quaffed, it `;
    case "scroll":
      return `${target}When read, it `;
    default:
      return `${target}When used, it `;
  }
}
