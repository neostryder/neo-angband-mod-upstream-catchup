import type { ModApi2 } from "@rpgm-tools/neo-angband-mod-sdk";
import type { AdapterMeta } from "./core-adapter";

export interface Adapter {
  readonly meta: AdapterMeta;
}

export function createAdapter(mod: ModApi2): Adapter {
  return {
    meta: {
      flags: mod.meta.flags,
    },
  };
}
