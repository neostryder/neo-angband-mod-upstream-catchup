# Upstream Catchup: quick reference

Opt-in changes from real upstream Angband development after the 4.2.6 tag this
port is pinned to. Each class of change is a named toggle, cited to the upstream
commit that made it. With everything off, core stays exactly 4.2.6.

This page is the short version: every setting, what the mod asks the game for,
and where the longer material is. The account of why each of these exists is in
[the repository README](../README.md).

## Settings

Each one is a named toggle on the game's own Mods screen, which shows the full
description. The identifier is the name a save and another mod see; where a
switch has no flag of its own, the game knows it by its section id instead.

| Setting | Identifier | Default | What it does |
| --- | --- | --- | --- |
| Post-4.2.6 tile assignments | `catchup.tiles` | off | Pictures upstream assigned after 4.2.6 for creatures and items its tile sets were leaving as letters. |
| Post-4.2.6 projection corrections | `catchup.projections` | off | Corrections upstream made after 4.2.6 to how a spell, breath or wand blast is built. |
| Post-4.2.6 shapechange flag learning | `catchup.shapeFlags` | off | A correction upstream made after 4.2.6 to how taking on a shape teaches you what it grants: a shape's obvious flags are now learned directly, instead of only through whatever you have worn (upstream commit c8036c515, raised in the comments on FAangband issue #465). |
| Post-4.2.6 restored-level tracking | `catchup.levelRevisitTracking` | off | When returning to a persistent level or leaving single combat, discard the old noise field and age the old scent trail by the world ticks spent away. |
| Post-4.2.6 text corrections | `catchup.text` | off | Wording upstream corrected after 4.2.6, cited to the upstream commit that made it. |

## What it needs

- **Engine:** `>=1.0.0`
- **Shape:** `content`
- **Facets:** `content`, `plugin`
- **Capabilities:** `registry:tiles`

What a capability string permits, and what a mod that asks for one cannot do
without it, is in [the mod lifecycle
document](https://github.com/neostryder/neo-angband/blob/master/docs/modding/MOD_LIFECYCLE.md).

## Elsewhere

- [README](../README.md), the full account
- [Changelog](../CHANGELOG.md), what changed in each version
- [What belongs in this mod, and
  why](https://github.com/neostryder/neo-angband/blob/master/docs/modding/UPSTREAM_CATCHUP_MOD_SCOPE.md),
  in the game's own repository
- [Installing a
  mod](https://github.com/neostryder/neo-angband/blob/master/docs/MODS.md), the
  route every mod installs by
