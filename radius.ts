/**
 * The `catchup.projections` rule: upstream's clamp on a blast radius.
 *
 * Upstream commit `f0f6bd223b6b9faf0072b0ae7ffb34a812b97349` (2026-07-28,
 * `src/project.c`), closing upstream issue #6671. One line:
 *
 *     if (rad > z_info->max_range) rad = z_info->max_range;
 *
 * WHAT IT IS FOR. `project()` sizes its damage-at-distance table by
 * `z_info->max_range` and fills it for `0..max_range`, then collects blast grids
 * out to `rad`. Nothing in 4.2.6 checks one against the other, so a radius above
 * the maximum range produces distances the table has no entry for, and every
 * read of one is a read past the end of it. In C that returns whatever is next
 * in memory. In this port it returns nothing at all: the damage handed to each
 * per-grid handler is `undefined`, and the first arithmetic done with it is
 * `NaN`. Neither is a crash, and both are wrong.
 *
 * WHY IT MATTERS MORE HERE THAN UPSTREAM. Upstream reaches this only from a
 * modded game or the `E` debug command, which is why the fix is a clamp rather
 * than an error. This port is a modding platform with a projection seam of its
 * own, so "only a modded game" describes the intended audience rather than an
 * edge case.
 *
 * WHAT IT CHANGES WHEN NOTHING ASKS FOR TOO MUCH: nothing. A radius already
 * within range comes back unchanged, which is the whole of the function, and
 * 4.2.6's own spells, breaths and wands never ask for more - the arc path caps
 * itself at the maximum range before this is ever consulted.
 */

/**
 * The radius a blast should be built from, given the radius asked for and the
 * engine's maximum projection range.
 *
 * Total, integer in and integer out, and free of the random number generator by
 * construction. That last part is a requirement rather than an observation: the
 * radius decides how many grids the blast collects and therefore how many times
 * every per-grid handler runs, so a draw here would move the stream by an amount
 * that depends on the terrain.
 */
export function clampBlastRadius(rad: number, maxRange: number): number {
  return rad > maxRange ? maxRange : rad;
}
