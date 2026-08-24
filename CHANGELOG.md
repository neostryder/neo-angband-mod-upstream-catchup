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
