// upstream-catchup - generated from plugin.ts by neo-angband-mod-build
// (@rpgm-tools/neo-angband-mod-sdk). Edit the TypeScript source, not this file.

// text-rules.json
var text_rules_default = {
  messages: [
    ["The monster can not move.", "The monster cannot move."],
    ["The dungeon does not appear to extend deeper", "The dungeon does not appear to extend deeper."],
    ["The item cannot be used at the moment", "The item cannot be used at the moment."],
    ["The ground shakes! The ceiling caves in!", "The ground shakes!  The ceiling caves in!"],
    ["Bad effect passed to effect_do(). Please report this bug.", "Bad effect passed to effect_do().  Please report this bug."],
    ["Warning! Could not allocate a new monster.", "Warning!  Could not allocate a new monster."],
    ["Oops! It feels deathly cold!", "Oops!  It feels deathly cold!"],
    ["lore save failed!", "Lore save failed!"],
    ["death save failed!", "Death save failed!"]
  ],
  symbols: [
    ["picked up such as treasure, weapons, magical devices, etc; and creatures", "picked up such as treasure, weapons, magical devices, etc.; and Creatures"],
    ["character's well being.", "character's well-being."],
    ['symbols are used to represent entities in more than one category. The "@"', 'symbols are used to represent entities in more than one category.  The "@"'],
    ["Entrance to Weapon Smith", "Entrance to Weapon Smiths"],
    ["Lights, Tools, Chests, etc", "Lights, Tools, Chests, etc."]
  ],
  commandMenu: ["Disarm a trap or chest", "Disarm a trap/chest; lock door"],
  filterPrompt: [
    "Enter 2 or 3 (for stat) character code and return or return to clear ",
    "Enter 2-character code (3 for a stat) and Return, or just Return to clear "
  ]
};

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
function catchupMessageText(text) {
  const exact = text_rules_default.messages.find(([before]) => text === before);
  if (exact) return exact[1];
  const theft = /^You steal (\d+) gold pieces worth of treasure\.$/.exec(text);
  if (theft) return `You steal treasure worth ${theft[1]} gold pieces.`;
  if (/^That (staff|wand) had no useable energy$/.test(text)) return `${text}.`;
  return text;
}
function catchupScreenText(text, site) {
  if (site.screen === "core:help-symbols") {
    return text_rules_default.symbols.find(([before]) => text === before)?.[1] ?? text;
  }
  if (site.screen === "core:prompt" && site.part === "prompt" && text === text_rules_default.filterPrompt[0]) {
    return text_rules_default.filterPrompt[1];
  }
  if (site.screen === "core:equip-cmp-select-help" && site.part === "cell" && site.column === "desc1" && site.row?.["key1"] === "n, PgDn" && text === "move selection one page up") {
    return "move selection one page down";
  }
  return text;
}
var catchupCommandMenuText = (id, rows) => {
  if (id !== "core:keypress-command-table") return rows;
  return rows.map((row) => row.semantic.kind === "keypress-command" && row.semantic.data?.["originalKey"] === "D" && row.label === text_rules_default.commandMenu[0] ? { ...row, label: text_rules_default.commandMenu[1] } : row);
};

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
  api: ">=2.2.0 <3.0.0",
  start(mod) {
    if (mod.meta.flags["catchup.text"] !== true || !mod.meta.granted("registry:menu")) return;
    const menus = mod.engine?.registry?.menus;
    if (!menus) return;
    const id = "core:keypress-command-table";
    const previous = menus.handlerFor(id);
    menus.register(id, (menu, rows) => catchupCommandMenuText(menu, previous?.(menu, rows) ?? rows));
  },
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
      out.messageText = catchupMessageText;
      out.screenText = catchupScreenText;
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
      ...flags["catchup.levelRevisitTracking"] === true ? { levelRevisitTracking: true } : {},
      /* player_timed_continues_rest() uses these COMPLETE_REST effects in upstream 41319eef9. */
      ...flags["catchup.completeRest"] === true ? {
        completeRestEffects: ["SLOW", "BLIND", "PARALYZED", "CONFUSED", "AFRAID", "IMAGE", "POISONED", "CUT", "STUN", "AMNESIA", "TERROR", "SCRAMBLE"]
      } : {}
    };
  }
};
export {
  plugin_default as default
};
