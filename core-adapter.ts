/**
 * Every read this mod makes of the game's internals happens in this file. No
 * other file in the mod reads `ctx.core` or `ctx.registries`. `register()`
 * builds the adapter once with `createAdapter(ctx)` and passes the pieces down.
 * The exports are grouped by the mod API 2 domain each one maps to, and
 * `engine` holds what API 2 does not give a mod at all.
 *
 * The hooks this mod installs, and their API 2 status.
 * - `objectInfoText`, `effectIntro` and `shapeLearnObviousFlagsDirectly` exist
 *   in API 2 with the same job, so the text rewrites need no declaration.
 * - `projectionRadius` has no API 2 form, because it runs for projections the
 *   player never sees. The radius clamp needs a host policy.
 * - `levelRevisited` passes the live restored level, and tracking.ts rewrites
 *   its noise and scent arrays. It has no API 2 form and needs a
 *   host-interpreted declaration.
 */

import type { ModRegistryHost, TileFiller } from "@rpgm-tools/neo-angband-core";
import type { CatchupRegistries, CatchupTilesCore } from "./tiles";

/**
 * The context members `register()` reads, declared structurally because this
 * repository holds no copy of the host.
 */
export interface RegisterCtx {
  readonly flags: Readonly<Record<string, boolean>>;
  readonly core: CatchupTilesCore;
  readonly registries?: CatchupRegistries | undefined;
}

/** API 2 `meta`. */
export interface AdapterMeta {
  /** The resolved rule flags. API 2: `meta.flags`, and `flags` in the hook context. */
  readonly flags: Readonly<Record<string, boolean>>;
}

/** No API 2 counterpart: engine values and calls a mod is not handed there. */
export interface AdapterEngine {
  /** `parseTilePrefs`, which reads upstream's `.prf` lines into a tile map. API 2: a content declaration of per-pack tile assignments that the host parses and fills. */
  readonly tiles: CatchupTilesCore;
  /** The live registries a pref line's names resolve against, read at call time; undefined while content composes. API 2: `content.records` (monster, object, terrain, trap). */
  prefTables(): CatchupRegistries | undefined;
  /** Installs a registry:tiles filler on the host's registry facade. API 2: the same per-pack tile declaration, which the host applies itself. */
  registerTileFiller(host: ModRegistryHost, filler: TileFiller): void;
}

export interface Adapter {
  readonly meta: AdapterMeta;
  readonly engine: AdapterEngine;
}

/** Build the adapter from `register()`'s context. Engine members are read when used. */
export function createAdapter(ctx: RegisterCtx): Adapter {
  return {
    meta: {
      flags: ctx.flags,
    },
    engine: {
      get tiles() {
        return ctx.core;
      },
      prefTables: () => ctx.registries,
      registerTileFiller: (host, filler) => host.tiles.register(filler),
    },
  };
}
