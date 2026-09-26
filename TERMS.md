# Terms of Use for the Neo Angband Upstream Catchup Mod

Effective date: 2026-08-24.

Upstream Catchup is an optional mod folder that runs inside Neo Angband, with no separate hosted service. It carries changes that upstream Angband accepted after the 4.2.6 tag the game's core is pinned to, each cited to the commit that made it. The mod is disabled until installed and enabled, each class of change inside it is a named toggle, and every toggle is off by default. Disabling the mod or a toggle restores the base game's corresponding behavior.

Its toggles cover tile assignments (which picture a tile set draws for a creature or item it had no assignment for), text corrections, and a small number of behavior changes upstream accepted after 4.2.6, including a projection-radius clamp and shapechange knowledge learning. Gameplay-affecting toggle use can place a character outside the unmodified score comparison. The player is responsible for deciding whether to use the mod with a particular character and for keeping an export or backup of local saves.

Its shipped manifest does not declare network access, and its shipped plugin code makes no network requests. Installing or updating it from the in-game mod manager can still fetch its public files from GitHub; those requests come from the Neo Angband host's mod manager. The core Neo Angband Terms and Privacy Policy cover that shared host behavior, including local storage, update checks, and the risks of optional third-party mods.

The GPL v2 or Angband licence in `LICENSE.md` governs copying, modification, and distribution of covered material. This document does not add a condition to those rights. The mod is provided as available and without a promise of compatibility, availability, security, accuracy, or fitness for a particular purpose, to the extent permitted by applicable law.

Use must comply with applicable law, the applicable licences, and the Neo Angband Terms. Project participation is subject to the shared Code of Conduct.
