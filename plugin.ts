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
 * THREE RULES WAIT ON THE GAME. Tile assignments by sheet cell, the blast
 * radius clamp and the restored-level tracking each need something the game's
 * mod API 2 does not yet declare (docs/API2-MIGRATION.md and the gap register
 * UC-1 to UC-3 name what). Their working code stays in tiles.ts, radius.ts and
 * tracking.ts with its tests, as the specification the game's declarations
 * must match. Until the game provides them, `start` says in the log that the
 * rule is on and does nothing, so a toggle that is on never fails silently.
 */

import type { Api2HookContext, Api2Hooks, Api2ModDefinition, ModApi2 } from "@rpgm-tools/neo-angband-mod-sdk";
import { catchupEffectIntro, catchupObjectInfoText } from "./item-text";
import { learnShapeObviousFlagsDirectly } from "./shape-flags";

/** The rules this game's mod API 2 cannot carry yet, each with the register row that asks for it. */
const WAITING: Readonly<Record<string, string>> = {
  "catchup.tiles": "UC-1",
  "catchup.projections": "UC-2",
  "catchup.levelRevisitTracking": "UC-3",
};

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

  start(mod: ModApi2): void {
    for (const [flag, row] of Object.entries(WAITING)) {
      if (mod.meta.flags[flag] === true) {
        mod.meta.log(`${flag} is on, but this game cannot apply it yet (gap ${row}), so it changes nothing`);
      }
    }
  },
} satisfies Api2ModDefinition;
