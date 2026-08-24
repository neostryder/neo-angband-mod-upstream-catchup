/**
 * Post-4.2.6 restored-level tracking, from upstream game-world.c's
 * `age_scent()` / `forget_noise()` added by 5c45eb9588b8227d4f1b1998e0a627ad7ee11a75.
 *
 * A persistent level or a level behind a paladin's single-combat arena is held
 * out of play.  On return, upstream drops the former noise source (the player
 * is not where they were) and advances old scent by the number of world ticks
 * that elapsed in between.  It does not make new tracking until the normal
 * process_world tick later in the game loop.
 */

export interface TrackingChunk {
  readonly width: number;
  readonly height: number;
  readonly noise: Uint16Array;
  readonly scent: Uint16Array;
}

/**
 * Apply upstream's level-revisit handling to a live restored chunk.
 *
 * `frozenAt` and `now` are game turns, not a pre-rounded duration.  The
 * difference of their world-tick quotients is intentionally not equivalent to
 * `Math.trunc((now - frozenAt) / 10)` around a tick boundary; this is the exact
 * `turn / 10 - cave->turn / 10` expression in upstream's `age_scent()`.
 */
export function refreshRevisitedTracking(
  chunk: TrackingChunk,
  frozenAt: number,
  now: number,
): void {
  const increment = Math.trunc(now / 10) - Math.trunc(frozenAt / 10);

  for (let y = 1; y < chunk.height - 1; y++) {
    for (let x = 1; x < chunk.width - 1; x++) {
      const i = y * chunk.width + x;
      const scent = chunk.scent[i] ?? 0;
      if (scent > 0) {
        /* uint16_t-safe addition exactly as game-world.c.  An elapsed duration
         * beyond the type's range makes all scent disappear rather than wrap
         * around into freshly laid scent. */
        if (increment <= 65535 && scent <= 65535 - increment) {
          chunk.scent[i] = scent + increment;
        } else {
          chunk.scent[i] = 0;
        }
      }
      /* forget_noise clears the interior only; the immutable boundary never
       * carries a flow value in ordinary gameplay. */
      chunk.noise[i] = 0;
    }
  }
}
