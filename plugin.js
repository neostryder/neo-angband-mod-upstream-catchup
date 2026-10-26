// upstream-catchup - generated from plugin.ts by neo-angband-mod-build
// (@rpgm-tools/neo-angband-mod-sdk). Edit the TypeScript source, not this file.

// item-text.ts
var AFFECTS_LINE = /^Affects your ([^\n]*[^.\n])\n$/;
function catchupObjectInfoText(text) {
  const m = AFFECTS_LINE.exec(text);
  return m ? `Affects your ${m[1]}.
` : text;
}
function catchupEffectIntro(intro) {
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

// shape-flags.ts
function learnShapeObviousFlagsDirectly() {
  return true;
}

// tile-rules.ts
var CATCHUP_TILE_RULES = [
  /* 7e8b58325: David Gervais' tiles */
  { monster: 322, cell: [47, 19], packs: ["gervais"] },
  // Beorn, the Mountain Bear
  /* 2e9703d42: Shockbolt Dark and Light, one pack directory */
  { object: 136, cell: [84, 0], packs: ["shockbolt"] },
  // Knight's Shield
  /* 9b04b692d: Nomad's tiles */
  { object: 18, cell: [16, 10], packs: ["nomad"] },
  // Sip of Miruvor
  { object: 20, cell: [17, 10], packs: ["nomad"] },
  // Draught of the Ents
  /* 655812a54: Adam Bolt's tiles */
  { object: 18, cell: [7, 14], packs: ["adam-bolt"] },
  // Sip of Miruvor
  { monster: 15, cell: [7, 51], packs: ["adam-bolt"] },
  // red-hatted elf
  { monster: 16, cell: [8, 51], packs: ["adam-bolt"] },
  // Father Christmas
  { monster: 156, cell: [12, 50], packs: ["adam-bolt"] },
  // witch
  { monster: 161, cell: [2, 57], packs: ["adam-bolt"] },
  // old forest tree
  { monster: 223, cell: [6, 56], packs: ["adam-bolt"] },
  // blackguard
  { monster: 236, cell: [3, 56], packs: ["adam-bolt"] },
  // Old Man Willow
  { monster: 403, cell: [2, 50], packs: ["adam-bolt"] }
  // dunadan of Angmar
];

// plugin.ts
var plugin_default = {
  api: ">=2.0.0 <3.0.0",
  /*
   * The BEHAVIOUR half of the mod. `hooks` is a factory over this mod's own
   * resolved flags, asked once when content composes, and it must be free of
   * side effects: the host asks again for the conflict report.
   */
  hooks({ flags }) {
    const out = {};
    if (flags["catchup.shapeFlags"] === true) {
      out.shapeLearnObviousFlagsDirectly = learnShapeObviousFlagsDirectly;
    }
    if (flags["catchup.text"] === true) {
      out.objectInfoText = catchupObjectInfoText;
      out.effectIntro = catchupEffectIntro;
    }
    return out;
  },
  /*
   * The DECLARATION half: tables the game applies itself, asked with the same
   * resolved flags. A table whose toggle is off is absent, so the game takes
   * its faithful path.
   */
  policies({ flags }) {
    return {
      ...flags["catchup.tiles"] === true ? { tileMap: CATCHUP_TILE_RULES } : {},
      ...flags["catchup.projections"] === true ? { projectionRadiusClamp: true } : {},
      ...flags["catchup.levelRevisitTracking"] === true ? { levelRevisitTracking: true } : {}
    };
  }
};
export {
  plugin_default as default
};
