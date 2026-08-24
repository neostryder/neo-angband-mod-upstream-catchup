import { describe, expect, it } from "vitest";

import plugin from "./plugin";
import { refreshRevisitedTracking, type TrackingChunk } from "./tracking";

function chunk(): TrackingChunk {
  return {
    width: 6,
    height: 6,
    noise: new Uint16Array(36),
    scent: new Uint16Array(36),
  };
}

function at(c: TrackingChunk, x: number, y: number): number {
  return y * c.width + x;
}

describe("catchup.levelRevisitTracking (upstream 5c45eb958)", () => {
  it("clears interior noise and ages scent by elapsed world ticks, not raw turns", () => {
    const c = chunk();
    c.noise.fill(81);
    c.scent[at(c, 2, 2)] = 1;
    c.scent[at(c, 3, 2)] = 65534;
    c.scent[at(c, 4, 2)] = 0;

    /* 19 -> 50 crosses four process_world ticks: 5 - 1, not floor(31 / 10). */
    refreshRevisitedTracking(c, 19, 50);

    expect(c.noise[at(c, 2, 2)]).toBe(0);
    expect(c.noise[at(c, 1, 1)]).toBe(0);
    /* forget_noise only touches the interior. */
    expect(c.noise[at(c, 0, 0)]).toBe(81);
    expect(c.scent[at(c, 2, 2)]).toBe(5);
    /* uint16_t overflow means the trail has faded away, never wraps fresh. */
    expect(c.scent[at(c, 3, 2)]).toBe(0);
    expect(c.scent[at(c, 4, 2)]).toBe(0);
  });

  it("counts the tick boundary even when fewer than ten raw turns elapsed", () => {
    const c = chunk();
    c.scent[at(c, 2, 2)] = 7;
    refreshRevisitedTracking(c, 19, 20);
    expect(c.scent[at(c, 2, 2)]).toBe(8);
  });

  it("contributes exactly the revisit hook while its own rule is on", () => {
    const hooks = plugin.hooks({ flags: { "catchup.levelRevisitTracking": true } });
    expect(Object.keys(hooks)).toEqual(["levelRevisited"]);
    const c = chunk();
    c.noise[at(c, 2, 2)] = 9;
    c.scent[at(c, 2, 2)] = 7;
    hooks.levelRevisited?.(c, 19, 20);
    expect(c.noise[at(c, 2, 2)]).toBe(0);
    expect(c.scent[at(c, 2, 2)]).toBe(8);
  });

  it("contributes no revisit key while its rule is absent or off", () => {
    expect(plugin.hooks({ flags: {} })).toEqual({});
    expect(plugin.hooks({ flags: { "catchup.levelRevisitTracking": false } })).toEqual({});
  });
});
