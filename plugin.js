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

// plugin.ts
var WAITING = {
  "catchup.tiles": "UC-1",
  "catchup.projections": "UC-2",
  "catchup.levelRevisitTracking": "UC-3"
};
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
  start(mod) {
    for (const [flag, row] of Object.entries(WAITING)) {
      if (mod.meta.flags[flag] === true) {
        mod.meta.log(`${flag} is on, but this game cannot apply it yet (gap ${row}), so it changes nothing`);
      }
    }
  }
};
export {
  plugin_default as default
};
