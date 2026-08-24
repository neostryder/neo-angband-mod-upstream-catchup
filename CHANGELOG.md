# Changelog

All notable changes to this mod are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow the
mod's own `manifest.json`, which is what the game reads, and each released
version has a matching git tag that an install pins itself to.

An entry has to matter to somebody running the mod. Documentation wording,
internal refactoring and test-only additions are not recorded here.

Every entry cites the upstream Angband commit it carries, because that citation
is what decides membership: a change with an accepted upstream commit belongs
here, and one without belongs to the `bug-fixes` mod.

## 0.1.3 - 2026-08-24

### Added

- **Post-4.2.6 shapechange flag learning (`catchup.shapeFlags`, off by
  default).** A shape's obvious flags are now learned directly, instead of
  only through whatever you have worn, matching upstream commit
  [`c8036c515`](https://github.com/angband/angband/commit/c8036c51537942a560e3d7f81749c431bbb4701f)
  (2026-07-21), raised in the comments on FAangband issue
  [#465](https://github.com/NickMcConnell/FAangband/issues/465). Without it, a
  fox shapechange grants Free Action and nothing worn needs to carry it - but
  the game never told you, because `shape_learn_on_assume` only ever checked
  your equipment. This teaches exactly the same obvious flags the shape
  already reveals on assuming it; it does not reveal a resistance or anything
  else about the shape you would still have to experience in play to learn.
  Needs the engine release that added the `shapeLearnObviousFlagsDirectly`
  seam; on an older engine the rule is inert and the rest of the mod is
  unaffected.

## 0.1.2 - 2026-08-24

### Added

- **Post-4.2.6 projection corrections (`catchup.projections`, off by default).**
  A blast radius larger than the game's maximum projection range is now held at
  that maximum, matching upstream commit
  [`f0f6bd223`](https://github.com/angband/angband/commit/f0f6bd223b6b9faf0072b0ae7ffb34a812b97349)
  (2026-07-28), which closed upstream issue
  [#6671](https://github.com/angband/angband/issues/6671). Without it a blast
  reaches distances its own damage table has no entry for, and every grid out
  there is dealt a damage that is not a number at all. A radius already within
  range is left exactly as it was, so switching the rule on changes nothing any
  4.2.6 spell, breath, wand or trap can ask for - only another mod, or the debug
  command, reaches the case this covers. This is the mod's first rule that
  changes engine behaviour rather than content, and it needs the engine release
  that added the projection-radius seam; on an older engine the rule is inert
  and the rest of the mod is unaffected.

## 0.1.1 - 2026-08-24

### Added

- **Post-4.2.6 text corrections (`catchup.text`, off by default).** The
  Trident 'of Wrath' description now spells the Maia's name "Ossë" instead
  of 4.2.6's "Osse", matching upstream commit
  [`f1b1626f6`](https://github.com/angband/angband/commit/f1b1626f6)
  (2026-07-26). This shipped briefly in `neo-angband-mod-bug-fixes` 0.19.0
  and was retracted there in 0.19.1: an accepted upstream commit belongs
  here, not in `bug-fixes`.

## 0.1.0 - 2026-08-24

First release.

### Added

- **Post-4.2.6 tile assignments (`catchup.tiles`, off by default).** Four
  upstream commits that give a creature or an item a picture in a tile set that
  was leaving it as a coloured letter. The art was already in the sheet in every
  case; only the line pointing at it was missing.
  - [`7e8b58325`](https://github.com/angband/angband/commit/7e8b58325) - Beorn's
    bear form in David Gervais' tiles, resolving upstream issue
    [#4848](https://github.com/angband/angband/issues/4848).
  - [`2e9703d42`](https://github.com/angband/angband/commit/2e9703d42) - the
    Knight's Shield in Shockbolt Dark and Light, related to upstream issue
    [#6542](https://github.com/angband/angband/issues/6542).
  - [`9b04b692d`](https://github.com/angband/angband/commit/9b04b692d) - the Sip
    of Miruvor and the Draught of the Ents in Nomad's tiles.
  - [`655812a54`](https://github.com/angband/angband/commit/655812a54) - eight
    assignments in Adam Bolt's tiles, for art the sheet already carried and
    nothing pointed at.

  Each block applies to the tile set upstream wrote it for and to no other, and
  only where that set assigns nothing already, so no picture anybody drew is
  replaced. Nothing here changes a rule, a die roll or a level, and none of it is
  visible in ASCII.

- **A fifth commit in the same range needs no port and is recorded as such.**
  [`ab2d65386`](https://github.com/angband/angband/commit/ab2d65386) deletes two
  stale comment lines from the Shockbolt pref files and changes no assignment.
  It is named in the README's table rather than stubbed, because a stub would be
  a row claiming work that does not exist.
