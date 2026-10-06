# Upstream Catchup API 2 migration

Upstream Catchup still loads as an API 1 plugin. Its schema 2 manifest declares `runtime: "in-process"` and `api: ">=1.0.0 <2.0.0"`. The entry imports `core-adapter.ts`. The new twin, `core-adapter-api2.ts`, exports `createAdapter(mod: ModApi2)` and returns the same flags under `meta`. It has no engine group. Tile filling and restored-level tracking still need live engine objects, so this adapter covers only the flag read.

## Gap audit

The audit counts 13 rows. One has moved, six have an API 2 home but are not wired, and six need a Core addition. The registry row groups the four tables passed to one tile parse.

| Old member | API 2 home or Core request | Status and notes |
| --- | --- | --- |
| Manifest `modApi`, `engine`, `dependencies` | Schema 2 `data.api`, `data.engine`, `data.dependencies.required` | Moved. The API range still admits API 1. The engine floor, dependency and toggles remain. |
| `ctx.flags` in `createAdapter()` and `hooks()` | `meta.flags` and `Api2HookContext.flags` | Has a home, not wired. The twin returns the flags. |
| `ctx.core.parseTilePrefs` via `engine.tiles` | Core request R2 | The host can resolve a tile declaration against its bound content. |
| `ctx.registries.features`, `.objects`, `.monsters`, `.traps` via `engine.prefTables()` | Core request R2 | The lookup home is `content.records` for `terrain`, `object`, `monster` and `trap`. Those JSON records lack the methods and bound indexes needed by the current parser. |
| Plugin `register(host, ctx)` | Core request R2 | `start(mod)` receives no registry host. |
| `host.tiles.register(filler)` via `engine.registerTileFiller()` | Core request R2 | The filler runs for each tile-map build and receives the active pack. |
| Plugin `api: 1` | `Api2ModDefinition.api` | Has a home, not wired. The folder loader needs R1 before the entry can change. |
| Plugin `hooks(ctx)` | `Api2ModDefinition.hooks(context)` | Has a home, not wired. The projection and revisit hooks still need R3 and R4. |
| `hooks.objectInfoText` | `Api2Hooks.objectInfoText` | Has a home, not wired. The function uses only the text argument. |
| `hooks.effectIntro` | `Api2Hooks.effectIntro` | Has a home, not wired. The existing facts type matches the SDK hook's argument. |
| `hooks.shapeLearnObviousFlagsDirectly` | `Api2Hooks.shapeLearnObviousFlagsDirectly` | Has a home, not wired. The function returns a boolean without reading game state. |
| `hooks.projectionRadius(radius, maxRange)` | Core request R3 | The clamp also applies to projections outside the player's view. |
| `hooks.levelRevisited(chunk, frozenAt, now)` | Core request R4 | The function rewrites the restored chunk's noise and scent arrays. |

The mod has no `ctx.state` or raw snapshot read. It uses no event subscription, storage call, controller, HUD, menu, screen, birth, frontend or regions member. There is no work for `view`, `act`, `events`, `store` or `ui` in this adapter. The tile lookup belongs to `content`, while the remaining changes need declarations or policies. No player-view field or truth read replaces those writes.

## Core requests

R1 - The folder loader needs to run an `Api2ModDefinition`, and the builder needs to accept its semver `api` range. Core already has an in-process API 2 host and hook shim. Connecting them to folder loading and adding the range check to the builder supplies the missing path. These changes apply to every supported tier. Upstream Catchup also needs R2, R3 and R4 before it can change its entry without losing behavior.

R2 - The host needs a tile declaration for each named pack in `CATCHUP_TILE_SETS`. A proposed call is `content.declareTiles({ pack, engine: "tilesheet", fillOnly: true, assignments: [{ file, key, row, col }] })`, with `file` naming `monster` or `object`. The host resolves each key to a bound index when it builds the pack's map and fills only empty slots. The content lookup also covers `terrain` and `trap`, the other tables used by the current parser. This data declaration can work outside P-tier. Until Core supplies it, P-tier needs the retained functions behind a versioned `engine` domain with `parseTilePrefs`, a registry getter read at fill time and `tiles.register(filler)`. None of those members exists in API 2 today.

R3 - The projection policy needs to clamp the radius to `maxRange` when `catchup.projections` is true. The smallest policy entry is `{ kind: "projectionRadius", operation: "clampToMaxRange" }`. Core evaluates it at the current hook call site in load order, including unseen projections. The policy can run for any tier because the host performs the operation. A temporary replacement that exposes the live hook through `engine` is P-tier only.

R4 - Restored levels need the same tracking update as `refreshRevisitedTracking` when `catchup.levelRevisitTracking` is true. The proposed declaration is `{ kind: "levelRevisitTracking", clearNoise: "interior", ageScent: "elapsedWorldTicks", overflow: "clear" }`. Core clears interior noise on return from a persistent level or single combat. It adds `Math.trunc(now / 10) - Math.trunc(frozenAt / 10)` to nonzero interior scent, clears values whose increment or sum exceeds 65535, and leaves boundary cells alone. A host declaration can serve every tier without exposing hidden state. Passing the writable chunk to a hook through `engine` remains P-tier only.

## SDK builder defect

`node tools/build.mjs --check` reports `overhaul-api2` instead of the manifest ID `upstream-catchup`. In `packages/mod-sdk/bin/neo-angband-mod-build.mjs`, `readManifestId()` calls `manifestFields` without importing it. The expression throws `ReferenceError: manifestFields is not defined`; the catch block returns null, so the builder uses the checkout directory name. The SDK fix is `import { manifestFields } from "../dist/manifest.js";`, with a regression test that builds from a directory whose name differs from the manifest ID. The committed plugin retains its existing `overhaul-api2` banner until the release rebuild.

## Removal list

The converter removes `modApi` and writes its API 1 range as `data.api`. Every runtime read still has a consumer. The sole grant, `registry:tiles`, is in the SDK vocabulary and remains necessary for the filler. The core and content development dependencies supply the integration tests, and the SDK supplies validation and the builder. This pass removes no runtime read, grant or dependency.

R2 replaces `engine.tiles`, `engine.prefTables()` and `engine.registerTileFiller()` together. R3 replaces the radius hook, and R4 replaces the restored-chunk write. The API 1 entry can go after those additions and R1. The twin leaves out the three engine members because returning composed JSON records would change the parser's inputs.

## Verification

`core-adapter-api2.test.ts` gives each adapter a separate flag map with the same entries and checks both results against the expected map. The fixtures cover absent flags and uniform maps with either false or true values. A fourth fixture mixes enabled and disabled flags. The fake `ModApi2` throws if the adapter calls another domain. Hook tests call the text and shape functions directly because the twin exports no hooks. These functions typecheck as `Api2Hooks`, and their results match the API 1 plugin's results. Absent flags still produce no hook keys.

The tile tests bind Core content and check the assignment coordinates, pack selection and occupied slots. An off or absent flag installs no filler. Projection tests compare the corrected blast with a maximum-range blast and preserve radii within range. Shape tests exercise direct learning and a flag learned earlier. Tracking tests check noise clearing, scent aging and tick boundaries. Text tests cover changed and unchanged fragments. The suites also check that disabled rules contribute no hook keys. These tests cover toggle parity, but no interactive Electron session runs in this pass.

The boundary test parses TypeScript expressions, including casts and non-null access. Its scan rejects raw context reads, context aliases and destructured engine members outside the API 1 adapter. Member-held contexts also fall under those rules. Runtime core imports and exports, dynamic imports, CommonJS `require()` and `import = require()` are rejected. Registry reads and engine namespace names ending in `engine` remain rejected, while engine bindings traced to `createAdapter()` and local object literals remain allowed. The twin cannot contain a `ctx` identifier. Fixtures cover each rule. Temporary source mutations check that restored violations fail the repository scan, and a wrong flags result fails the parity suite. The original bytes are restored after each check. The built plugin is scanned for runtime core imports under its own filename.
