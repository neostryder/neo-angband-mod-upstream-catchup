/**
 * The `catchup.shapeFlags` rule: upstream's direct-learn of a shape's obvious
 * flags.
 *
 * Upstream commit `c8036c51537942a560e3d7f81749c431bbb4701f` (2026-07-21,
 * `src/obj-knowledge.c`, "On shape change, learn shape's obvious flags"),
 * raised in the comments on FAangband issue #465.
 *
 * `shape_learn_on_assume` learns a shape's obvious (OFID_WIELD) flags only
 * through `equip_learn_flag`, which marks a flag known when a WORN item
 * carries it. A flag the shape itself grants, with no matching equipment, was
 * therefore never learned: a fox shapechange grants Free Action, nothing worn
 * needs to carry it for the player to have it, and the player was never told.
 * Upstream's fix learns the shape's obvious flags directly as runes instead
 * of routing them through the equipment-only path.
 *
 * WHAT THIS DOES NOT PORT. The same upstream commit also teaches
 * `equip_learn_flag`, `equip_learn_element` and `equip_learn_after_time` to
 * consult the shape's own properties for REACTIVE learning - an event firing
 * while shapechanged, separate from the moment of assumption. That is a
 * distinct gap from the one confirmed reproducing for neo-angband#118 and is
 * not built here.
 *
 * WHY A PLAIN TOGGLE, NOT A FLAG LIST. The engine's `shapeLearnOnAssume`
 * already computes the exact obvious-flag set upstream's commit learns -
 * `shape.flags` intersected with the OFID_WIELD mask - through
 * `ModHooks.shapeLearnObviousFlagsDirectly`. This rule decides only WHETHER
 * that already-computed set is learned directly; it is never handed the set
 * itself and cannot widen it into "learn everything the shape has". That
 * boundary matters here specifically: this project already reverted a rune-
 * knowledge shortcut once, in full, because a shortcut that granted unearned
 * knowledge was not a fix a player would want as an option (neo-angband core
 * commit `7970af462`, "the everything known rune convention").
 */

/** ModHooks.shapeLearnObviousFlagsDirectly: yes, whenever the rule is on. */
export function learnShapeObviousFlagsDirectly(): boolean {
  return true;
}
