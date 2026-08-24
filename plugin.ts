/**
 * The `upstream-catchup` mod's behaviour, as the mod's OWN code.
 *
 * Nothing in this file is compiled into core. Delete this folder and every
 * assignment below goes with it - there is no `catchup.*` string and no
 * post-4.2.6 tile line anywhere in the engine. Core stays pinned to Angband's
 * `4.2.6` tag, which is the whole reason this mod exists.
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
 * ENTRY POINT CONTRACT - one shape, for every mod and every front end
 * ------------------------------------------------------------------
 *
 * A mod that runs code default-exports a ModPlugin:
 *
 *   export default { api: 1, register(host, ctx) { ... } }
 *
 * `ctx.flags` is the host's RESOLVED per-rule choice map: every declared rule
 * flag in manifest.json, mapped to the value the player's toggles settled on
 * (the manifest `default` unless they changed it).
 *
 * `ctx.core` is the ENGINE, handed in, and this file imports
 * @rpgm-tools/neo-angband-core for TYPES ONLY. The same source is built to the
 * `plugin.js` that ships in this repository, and a module fetched from a folder
 * cannot resolve a bare specifier - nor should it, because a bundled copy of
 * core would give the plugin its own registries while the game ran on another
 * set. `tiles.ts` is handed the slice it needs for the same reason.
 *
 * `register` rather than `hooks`, because a tile filler is a system override
 * through the capability-gated registry facade rather than a fold into core's
 * ModHooks. It runs once, after the game is booted, which is also the earliest
 * moment `ctx.registries` is there to resolve a name against.
 *
 * THE MOD READS ITS OWN FLAGS. Core never sees a flag name, and the facade is
 * never touched at all when the rule is off - so a switched-off class is not
 * merely inert, its filler is ABSENT and no capability is exercised.
 */

import type { ModRegistryHost } from "@rpgm-tools/neo-angband-core";
import {
  applyCatchupTiles,
  type CatchupRegistries,
  type CatchupTilesCore,
} from "./tiles";

/**
 * What this plugin needs from the host's context, structurally. Declared here
 * rather than imported from the host, because this file has to compile in a
 * standalone mod repository that holds no copy of it.
 */
interface RegisterCtx {
  readonly flags: Readonly<Record<string, boolean>>;
  readonly core: CatchupTilesCore;
  readonly registries?: CatchupRegistries | undefined;
}

export default {
  api: 1,

  register(host: ModRegistryHost, ctx: RegisterCtx): void {
    /*
     * catchup.tiles - which picture a tile set draws for a creature or an item
     * it had no assignment for. Four upstream commits, one class, one toggle:
     * the rule is one flag per CLASS of change, never one per atomic commit,
     * because "is the game catching up on tile assignments" is the only question
     * a player needs to answer here.
     *
     * OFF BY DEFAULT, like everything in this mod. Core is 4.2.6 and a player
     * who installed the game did not ask for anything later than that; a class
     * of change arriving switched on would be the port adding something.
     */
    if (ctx.flags["catchup.tiles"] === true) {
      host.tiles.register((fill) => {
        applyCatchupTiles(fill, ctx.registries, ctx.core);
      });
    }
  },
};
