/**
 * The `upstream-catchup` mod's behaviour, as the mod's OWN code.
 *
 * Nothing in this file is compiled into core. Delete this folder and every
 * change below goes with it: there is no `catchup.*` string and no post-4.2.6
 * assignment anywhere in the engine. Core stays pinned to Angband's `4.2.6` tag,
 * which is the whole reason this mod exists.
 *
 * ------------------------------------------------------------------
 * WHAT BELONGS HERE, AND WHAT BELONGS TO `bug-fixes`
 * ------------------------------------------------------------------
 *
 * One question decides it: does an accepted upstream commit exist for this
 * change? Yes, and it is this mod's, cited by SHA. No, and it is the
 * `bug-fixes` mod's, cited by issue or by measurement. A fix that upstream
 * later accepts MOVES here at the next release, which is the point of the split
 * rather than an inconvenience: this set is finite and expires, and that one is
 * open-ended and permanent.
 *
 * This mod deletes itself the day core rebaselines onto a newer upstream tag,
 * because everything in it will already be in the game.
 *
 * ------------------------------------------------------------------
 * ENTRY POINT CONTRACT
 * ------------------------------------------------------------------
 *
 * The default export is a mod API 2 definition. The mod reads no engine
 * member: `hooks` is handed its resolved rule flags and returns plain
 * functions of plain data, so this file imports the SDK for TYPES ONLY. A
 * module fetched from a folder cannot resolve a bare specifier, and a bundled
 * copy of the SDK would only add a second copy of its module state.
 *
 * THE MOD READS ITS OWN FLAGS. Core never sees a flag name. A rule that is off
 * contributes no hook key, so a switched-off class is not merely inert, it is
 * absent: the game takes its faithful path and the Mods screen does not list
 * this mod as touching that behaviour.
 *
 * THREE RULES ARE DECLARATIONS THE GAME APPLIES. Tile assignments by sheet
 * cell, the blast radius clamp and the restored-level tracking are policy
 * tables (`tileMap`, `projectionRadiusClamp`, `levelRevisitTracking`), returned
 * from `policies` while their toggles are on. The game does the work: the mod
 * never touches a tile, a blast or a level. tiles.ts, radius.ts and tracking.ts
 * stay as the specification the tests hold the game's behaviour to.
 */

import type { Api2HookContext, Api2Hooks, Api2ModDefinition, Api2Policies } from "@rpgm-tools/neo-angband-mod-sdk";
import { catchupEffectIntro, catchupObjectInfoText } from "./item-text";
import { learnShapeObviousFlagsDirectly } from "./shape-flags";
import { CATCHUP_TILE_RULES } from "./tile-rules";

export default {
  api: ">=2.0.0 <3.0.0",

  /*
   * The BEHAVIOUR half of the mod. `hooks` is a factory over this mod's own
   * resolved flags, asked once when content composes, and it must be free of
   * side effects: the host asks again for the conflict report.
   */
  hooks({ flags }: Api2HookContext): Api2Hooks {
    const out: Api2Hooks = {};

    /*
     * catchup.shapeFlags: post-4.2.6 direct learning of a shapechange's
     * obvious flags (upstream c8036c51537942a560e3d7f81749c431bbb4701f). The
     * engine already restricts this to the same obvious-flag set
     * shapeLearnOnAssume always computed; this rule only says yes to learning
     * it directly rather than requiring a worn item to match.
     */
    if (flags["catchup.shapeFlags"] === true) {
      out.shapeLearnObviousFlagsDirectly = learnShapeObviousFlagsDirectly;
    }

    /*
     * catchup.text: item-description wording that core writes in obj-info.c
     * rather than reading from gamedata, so no content patch can reach it: the
     * full stop on "Affects your ..." (upstream ad5c8401a) and the effect
     * introductions (upstream 4153ff6a6).
     */
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
  policies({ flags }: Api2HookContext): Api2Policies {
    return {
      ...(flags["catchup.tiles"] === true ? { tileMap: CATCHUP_TILE_RULES } : {}),
      ...(flags["catchup.projections"] === true ? { projectionRadiusClamp: true } : {}),
      ...(flags["catchup.levelRevisitTracking"] === true ? { levelRevisitTracking: true } : {}),
    };
  },
} satisfies Api2ModDefinition;
