/**
 * The `catchup.text` rule (catchup-text section), the mod's first non-tile
 * content: post-4.2.6 text corrections, cited to the upstream commit that
 * made each one, applied only against 4.2.6's OWN baseline wording.
 *
 * This is deliberately NOT the mechanism `bug-fixes` uses for its own,
 * unrelated rewrite of this same description (dropping an obsolete
 * two-handed-weapon clause): the two mods patch the same field for two
 * different, independent reasons, and each patch is written against 4.2.6's
 * baseline text rather than against the other mod's output, since neither
 * mod can assume the other is installed. See README.md for the known
 * interaction if both are enabled together.
 *
 * The two-direction assertion: core still spells it "Osse" (this mod's
 * correction has something to do), and the patch spells it "Ossë" and
 * changes nothing else about the sentence.
 */

import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { composePacks, expandSections, recordKey, resolveSectionState, type JsonRecord, type PackContent } from "@rpgm-tools/neo-angband-mod-sdk";

import artifactContrib from "./artifact.json";
import classContrib from "./class.json";
import objectPropertyContrib from "./object_property.json";
import manifestDocument from "./manifest.json";

const manifest = manifestDocument.data;

const require = createRequire(import.meta.url);

interface PackFile {
  records: JsonRecord[];
}

function corePack(file: string): PackFile {
  return require(`@rpgm-tools/neo-angband-content/pack/${file}.json`) as PackFile;
}

describe("catchup-text: Trident 'of Wrath' spells Ossë (upstream f1b1626f6)", () => {
  it("declares the catchup-text section, and nowhere else", () => {
    const section = manifest.sections.find((s) => s.id === "catchup-text");
    expect(section).toBeDefined();
    expect(section?.flag).toBe("catchup.text");

    /* A section's flag is its own rule declaration - it must NOT also appear
     * in the plain rules array, or the manifest fails validation. */
    expect(manifest.rules.some((r) => r.flag === "catchup.text")).toBe(false);
  });

  it("patches core's real 'of Wrath' record, and only the spelling", () => {
    const rec = corePack("artifact").records.find((r) => r["name"] === "of Wrath")!;
    const ref = `core:${recordKey("artifact", rec)}`;
    const patch = (
      artifactContrib as {
        sections: Record<string, { patches: Record<string, { desc: string[] }> }>;
      }
    ).sections["catchup-text"]!.patches[ref]!;

    const before = (rec["desc"] as string[]).join("");
    const after = patch.desc.join("");

    /* Core still carries the tag's spelling. This expires if the engine ever
     * publishes a pack built from post-tag gamedata, and says so. */
    expect(
      before,
      "core content no longer spells the name \"Osse\", so this correction has " +
        "nothing left to fix and should be retired.",
    ).toContain("Osse ");
    expect(before).not.toContain("Ossë");

    expect(after).toContain("Ossë who with it");
    expect(after).not.toContain("Osse ");

    /* Nothing else about the sentence moved - this patch is the diaeresis and
     * nothing else, unlike bug-fixes' unrelated rewrite of the same field. */
    expect(after.replace("Ossë", "Osse")).toBe(before);
  });
});

describe("catchup.deathMoldHearing: upstream 5da31305a", () => {
  it("changes only death mold hearing through its own default-off section", () => {
    const records = corePack("monster").records;
    const baseline = records.find((record) => record["name"] === "death mold")!;
    expect(baseline["hearing"]).toBe(200);
    const contribution = require("./monster.json") as PackContent["files"][string];
    const id = "catchup-death-mold-hearing";
    const section = manifest.sections.find((entry) => entry.id === id);
    expect(section).toMatchObject({ flag: "catchup.deathMoldHearing", default: false });
    expect(contribution.sections?.[id]).toEqual({
      fieldPatches: { "core:death-mold": [{ op: "set", path: "hearing", value: 2 }] },
    });
    const core: PackContent = { manifest: { id: "core", name: "Core", version: "4.2.6", shape: "content" }, files: { monster: { records } } };
    const mod: PackContent = {
      manifest: { id: manifest.id, name: manifest.name, version: manifest.version, shape: "content", dependencies: { core: "*" }, sections: manifest.sections },
      files: { monster: contribution },
    };
    for (const enabled of [false, true]) {
      const units = expandSections([core, mod], (_pack, sectionId) => sectionId === id && enabled);
      const actual = composePacks(units.map((unit) => unit.content)).get("monster")!.get("core:death-mold")!.value;
      expect(actual).toEqual({ ...baseline, hearing: enabled ? 2 : 200 });
    }
  });
});

/**
 * The three later corrections, each written as (file, record, path, 4.2.6's
 * text, upstream's corrected text, commit). The ref is derived from the pack
 * record with recordKey, never copied from the JSON, so a ref naming the wrong
 * record fails here.
 */
const LATER = [
  {
    commit: "897ab3a3f",
    file: "class",
    contrib: classContrib,
    find: { name: "Necromancer" },
    path: "book.2.spell.1.desc",
    before: [
      "Teleports you to the nearest living monster and drains a level-dependent",
      " number of hitpoints, healing and nourishing the player.",
    ],
    after: [
      "Teleports you to the nearest living monster and drains its hitpoints to heal and nourish you.  The number of hitpoints drained is twice your level or one more than the monster's current hitpoints, whichever is smaller.",
    ],
  },
  {
    commit: "780e326fd",
    file: "class",
    contrib: classContrib,
    find: { name: "Priest" },
    path: "book.4.spell.4.name",
    before: "Light of Manwë",
    after: "Light of Varda",
  },
  {
    commit: "780e326fd",
    file: "object_property",
    contrib: objectPropertyContrib,
    find: { code: "BLESSED", name: "blessed melee" },
    path: "desc",
    before: "Blessed by the gods (combat bonuses for holy casters)",
    after: "Blessed by the Valar (combat bonuses for holy casters)",
  },
] as const;

function valueAtPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => {
    if (Array.isArray(current)) return current[Number(part)];
    if (typeof current === "object" && current !== null) return (current as Record<string, unknown>)[part];
    return undefined;
  }, value);
}

type FieldPatches = Record<string, { op: string; path: string; value: unknown }[]>;

describe("catchup-text: later upstream wording corrections", () => {
  for (const row of LATER) {
    it(`${row.file} ${row.path} (upstream ${row.commit})`, () => {
      const hits = corePack(row.file).records.filter((r) =>
        Object.entries(row.find).every(([k, v]) => r[k] === v),
      );
      expect(hits).toHaveLength(1);
      const ref = `core:${recordKey(row.file, hits[0]!)}`;
      expect(valueAtPath(hits[0], row.path)).toEqual(row.before);
      const patches = (row.contrib.sections["catchup-text"] as { fieldPatches: FieldPatches }).fieldPatches;
      expect(patches[ref]).toContainEqual({ op: "set", path: row.path, value: row.after });
    });
  }

  it("ships no field patch the table above does not name", () => {
    const shipped = [classContrib, objectPropertyContrib].flatMap((c) =>
      Object.values((c.sections["catchup-text"] as { fieldPatches: FieldPatches }).fieldPatches).flat(),
    );
    expect(shipped).toHaveLength(LATER.length + CORRECTIONS.filter((row) => row.file === "class").length);
  });
});

interface Correction {
  commit: string;
  file: string;
  ref: string;
  path: string;
  before: unknown;
  after: unknown;
}

// Upstream parse_class_desc() and the other gamedata parsers consume these fields.
const CORRECTIONS: readonly Correction[] = [
  {
    commit: "73c851ab4",
    file: "activation",
    ref: "core:staff-magi",
    path: "desc",
    before: [
      "restores both intelligence and manapoints to maximum"
    ],
    after: [
      "restores both intelligence and mana points to maximum"
    ]
  },
  {
    commit: "73c851ab4",
    file: "activation",
    ref: "core:shroom-emergency",
    path: "desc",
    before: [
      "grants temporary resistance to fire and cold, cures 200HP, but also makes you hallucinate wildly"
    ],
    after: [
      "grants temporary resistance to fire and cold, heals 200HP, but also",
      " makes you hallucinate wildly"
    ]
  },
  {
    commit: "73c851ab4",
    file: "class",
    ref: "core:druid",
    path: "book.0.spell.4.desc",
    before: [
      "Confuse a single monster; more effective against animals."
    ],
    after: [
      "Confuses a single monster; more effective against animals."
    ]
  },
  {
    commit: "73c851ab4",
    file: "class",
    ref: "core:druid",
    path: "book.3.spell.3.desc",
    before: [
      "Speed up digestion to increase regeneration of hitpoints for",
      " the next 5+1d3 turns (or until hungry)."
    ],
    after: [
      "Speeds up digestion to increase regeneration of hitpoints for the next",
      " 5+1d3 turns (or until hungry)."
    ]
  },
  {
    commit: "73c851ab4",
    file: "class",
    ref: "core:necromancer",
    path: "book.1.spell.1.desc",
    before: [
      "Instantly kill any monster in line-of-sight with less than four times the",
      " player's level in hitpoints, also hurting the player.  Other monsters are",
      " unharmed."
    ],
    after: [
      "Instantly kills any monster in line of sight with less than four times",
      " the player's level in hitpoints, also hurting the player.  Other",
      " monsters are unharmed."
    ]
  },
  {
    commit: "73c851ab4",
    file: "class",
    ref: "core:blackguard",
    path: "book.0.spell.5.desc",
    before: [
      "Your mind becomes too focused to be slowed, paralyzed or confused",
      " for 12+d12 turns."
    ],
    after: [
      "Your mind becomes too focused to be slowed, paralyzed or confused for",
      " 12+1d12 turns."
    ]
  },
  {
    commit: "73c851ab4",
    file: "class",
    ref: "core:blackguard",
    path: "book.1.spell.3.desc",
    before: [
      "Coats all your melee weapons with poison for 18+d18 turns."
    ],
    after: [
      "Coats all your melee weapons with poison for 18+1d18 turns."
    ]
  },
  {
    commit: "73c851ab4",
    file: "curse",
    ref: "core:vulnerability",
    path: "desc",
    before: [
      "attracts opponents and weakens the defences"
    ],
    after: [
      "attracts opponents and weakens your defences"
    ]
  },
  {
    commit: "73c851ab4",
    file: "history",
    ref: "core:3--100",
    path: "phrase",
    before: [
      "You are a well liked child.  "
    ],
    after: [
      "You are a well-liked child.  "
    ]
  },
  {
    commit: "73c851ab4",
    file: "history",
    ref: "core:18--100",
    path: "phrase",
    before: [
      "You are a well liked child.  "
    ],
    after: [
      "You are a well-liked child.  "
    ]
  },
  {
    commit: "73c851ab4",
    file: "monster",
    ref: "core:aimless-looking-merchant",
    path: "desc",
    before: [
      "The typical ponce around town, with purse jingling, and looking for more",
      " amulets of adornment to buy."
    ],
    after: [
      "The typical dandy around town, with purse jingling, and looking for",
      " more amulets of adornment to buy."
    ]
  },
  {
    commit: "73c851ab4",
    file: "trap",
    ref: "core:dart-trap--strength-loss-dart",
    path: "desc",
    before: [
      "A trap which shoots damaging darts."
    ],
    after: [
      "A trap which shoots strength-draining darts."
    ]
  },
  {
    commit: "73c851ab4",
    file: "trap",
    ref: "core:dart-trap--dexterity-loss-dart",
    path: "desc",
    before: [
      "A trap which shoots damaging darts."
    ],
    after: [
      "A trap which shoots dexterity-draining darts."
    ]
  },
  {
    commit: "73c851ab4",
    file: "trap",
    ref: "core:dart-trap--constitution-loss-dart",
    path: "desc",
    before: [
      "A trap which shoots damaging darts."
    ],
    after: [
      "A trap which shoots constitution-draining darts."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "activation",
    ref: "core:cure-full",
    path: "desc",
    before: [
      "heals 35% of max HP (minimum 300HP), cut damage, and cures stunning, poisoning, blindness, and confusion"
    ],
    after: [
      "heals 35% of lost HP (minimum 300HP), cut damage, and cures stunning, poisoning, blindness, and confusion"
    ]
  },
  {
    commit: "c6e499b5a",
    file: "activation",
    ref: "core:deep-descent",
    path: "desc",
    before: [
      "teleports you five levels down"
    ],
    after: [
      "teleports you up to five levels below your maximum depth"
    ]
  },
  {
    commit: "c6e499b5a",
    file: "activation",
    ref: "core:destruction2",
    path: "desc",
    before: [
      "destroys an area around you in the shape of a circle radius 15, and blinds you for 1d10+10 turns"
    ],
    after: [
      "destroys an area around you in the shape of a circle of radius 15, and blinds you for 1d10+10 turns"
    ]
  },
  {
    commit: "c6e499b5a",
    file: "activation",
    ref: "core:shroom-terror",
    path: "desc",
    before: [
      "speeds up you temporarily but also makes you mortally afraid"
    ],
    after: [
      "speeds you up temporarily but also makes you mortally afraid"
    ]
  },
  {
    commit: "c6e499b5a",
    file: "artifact",
    ref: "core:thunderfist",
    path: "desc",
    before: [
      "The long-lost weapon of Kzurin, Dwarven champion of ancient Belegost",
      " Runes of strength adorn its handle, and flames and sparks roar and",
      " crackle around its massive head."
    ],
    after: [
      "The long-lost weapon of Kzurin, Dwarven champion of ancient Belegost.",
      "  Runes of strength adorn its handle, and flames and sparks roar and",
      " crackle around its massive head."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "artifact",
    ref: "core:nimloth",
    path: "desc",
    before: [
      "A thin spike of thrice-forged steel caps a straight silvan shaft cut from",
      " a legendary tree, and spells to break the wills of the undead and strike",
      " cold into the breasts of your enemies lay upon this perfectly balanced",
      " spear."
    ],
    after: [
      "A thin spike of thrice-forged steel caps a straight silvan shaft cut from",
      " a legendary tree, and spells to break the wills of the undead and strike",
      " cold into the breasts of your enemies lie upon this perfectly balanced",
      " spear."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "artifact",
    ref: "core:of-morgoth",
    path: "desc",
    before: [
      "Containing much of the power of he who once was mightiest among the Ainur,",
      " this plain iron crown has mounted upon it the two remaining Silmarils,",
      " greatest treasures of Middle-Earth."
    ],
    after: [
      "Containing much of the power of him who once was mightiest among the Ainur,",
      " this plain iron crown has mounted upon it the two remaining Silmarils,",
      " greatest treasures of Middle-Earth."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "chest_trap",
    ref: "core:explode",
    path: "msg",
    before: [
      "There is a sudden explosion! Everything inside the chest is destroyed!"
    ],
    after: [
      "There is a sudden explosion!  Everything inside the chest is destroyed!"
    ]
  },
  {
    commit: "c6e499b5a",
    file: "class",
    ref: "core:necromancer",
    path: "book.1.spell.2.desc",
    before: [
      "Attempts to put to sleep each evil monster within line of sight.",
      "  Monsters that resist confusion are not affected."
    ],
    after: [
      "Attempts to put to sleep each evil monster within line of sight.",
      "  Monsters that resist sleep are not affected."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "class",
    ref: "core:necromancer",
    path: "book.4.spell.2.desc",
    before: [
      "Allows you to assume the form of a vampire at the cost of half your",
      " current hitpoints, than teleports you to the nearest living monster",
      " and drains a level-dependent number of hitpoints, healing and nourishing",
      " you.  When first transformed you will temporarily be able",
      " to take hitpoints from living monsters with your bite attack."
    ],
    after: [
      "Allows you to assume the form of a vampire at the cost of half your",
      " current hitpoints, then teleports you to the nearest living monster",
      " and drains a level-dependent number of hitpoints, healing and nourishing",
      " you.  When first transformed you will temporarily be able",
      " to take hitpoints from living monsters with your bite attack."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "class",
    ref: "core:blackguard",
    path: "book.0.spell.4.desc",
    before: [
      "You run up to 4 spaces towards targeted enemy, then perform a",
      " melee blow.  You gain an additional blow at levels 25 and 40.  If you",
      " moved, the number of blows is reduced by 25% for each space, then rounded."
    ],
    after: [
      "You run up to 4 spaces towards the targeted enemy, then perform a",
      " melee blow.  You gain an additional blow at levels 25 and 40.  If you",
      " moved, the number of blows is reduced by 25% for each space, then rounded."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "curse",
    ref: "core:steelskin",
    path: "desc",
    before: [
      "makes your skin harder to damage, but conduct electricity"
    ],
    after: [
      "makes your skin harder to damage, but it conducts electricity"
    ]
  },
  {
    commit: "c6e499b5a",
    file: "history",
    ref: "core:4--15",
    path: "phrase",
    before: [
      "Your mother was of the Avari. "
    ],
    after: [
      "Your mother was of the Avari.  "
    ]
  },
  {
    commit: "c6e499b5a",
    file: "history",
    ref: "core:4--30",
    path: "phrase",
    before: [
      "Your father was of the Avari. "
    ],
    after: [
      "Your father was of the Avari.  "
    ]
  },
  {
    commit: "c6e499b5a",
    file: "history",
    ref: "core:4--50",
    path: "phrase",
    before: [
      "Your mother was of the Nandor. "
    ],
    after: [
      "Your mother was of the Nandor.  "
    ]
  },
  {
    commit: "c6e499b5a",
    file: "history",
    ref: "core:20--20",
    path: "phrase",
    before: [
      "and it is acknowledged. You are the adopted child "
    ],
    after: [
      "and it is acknowledged.  You are the adopted child "
    ]
  },
  {
    commit: "c6e499b5a",
    file: "history",
    ref: "core:20--100",
    path: "phrase",
    before: [
      "but it is unacknowledged. You are the adopted child "
    ],
    after: [
      "but it is unacknowledged.  You are the adopted child "
    ]
  },
  {
    commit: "c6e499b5a",
    file: "history",
    ref: "core:24--15",
    path: "phrase",
    before: [
      "a litter of 3 pups. "
    ],
    after: [
      "a litter of 3 pups.  "
    ]
  },
  {
    commit: "c6e499b5a",
    file: "history",
    ref: "core:24--40",
    path: "phrase",
    before: [
      "a litter of 4 pups. "
    ],
    after: [
      "a litter of 4 pups.  "
    ]
  },
  {
    commit: "c6e499b5a",
    file: "history",
    ref: "core:24--70",
    path: "phrase",
    before: [
      "a litter of 5 pups. "
    ],
    after: [
      "a litter of 5 pups.  "
    ]
  },
  {
    commit: "c6e499b5a",
    file: "history",
    ref: "core:24--85",
    path: "phrase",
    before: [
      "a litter of 6 pups. "
    ],
    after: [
      "a litter of 6 pups.  "
    ]
  },
  {
    commit: "c6e499b5a",
    file: "history",
    ref: "core:24--95",
    path: "phrase",
    before: [
      "a litter of 7 pups. "
    ],
    after: [
      "a litter of 7 pups.  "
    ]
  },
  {
    commit: "c6e499b5a",
    file: "history",
    ref: "core:24--100",
    path: "phrase",
    before: [
      "a litter of 8 pups. "
    ],
    after: [
      "a litter of 8 pups.  "
    ]
  },
  {
    commit: "c6e499b5a",
    file: "history",
    ref: "core:26--20",
    path: "phrase",
    before: [
      "and your mother was a prisoner of war. "
    ],
    after: [
      "and your mother was a prisoner of war.  "
    ]
  },
  {
    commit: "c6e499b5a",
    file: "history",
    ref: "core:26--95",
    path: "phrase",
    before: [
      "and your mother was a cook. "
    ],
    after: [
      "and your mother was a cook.  "
    ]
  },
  {
    commit: "c6e499b5a",
    file: "history",
    ref: "core:26--100",
    path: "phrase",
    before: [
      "and your mother was one of the Chief's harem. "
    ],
    after: [
      "and your mother was one of the Chief's harem.  "
    ]
  },
  {
    commit: "c6e499b5a",
    file: "monster",
    ref: "core:ochre-jelly",
    path: "desc",
    before: [
      "A fast moving highly acidic jelly thing, that is eating away the floor it",
      " rests on."
    ],
    after: [
      "A fast-moving highly acidic jelly thing, that is eating away the floor it",
      " rests on."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "monster",
    ref: "core:wererat",
    path: "desc",
    before: [
      "A large rat with glowing red eyes.  The wererat is a disgusting creature,",
      " relishing in filth and disease."
    ],
    after: [
      "A large rat with glowing red eyes.  The wererat is a disgusting creature,",
      " relishing filth and disease."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "monster",
    ref: "core:half-orc",
    path: "desc",
    before: [
      "He is a hideous deformed cross-breed with man and orc, combining man's",
      " strength and cunning with orcish evil.  The traitorous wizard Saruman is",
      " generally believed to be responsible for this abomination."
    ],
    after: [
      "He is a hideous deformed cross-breed of man and orc, combining man's",
      " strength and cunning with orcish evil.  The traitorous wizard Saruman is",
      " generally believed to be responsible for this abomination."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "monster",
    ref: "core:old-man-willow",
    path: "desc",
    before: [
      "The ancient grey willow tree, ruler of the Old Forest.  He despises",
      " trespassers in his territory.  \"...a huge willow-tree, old and hoary.",
      "  Enormous it looked, its sprawling branches going up like racing arms",
      " with many long-fingered hands, its knotted and twisted trunk gaping in",
      " wide fissures that creaked faintly as the boughs moved.\""
    ],
    after: [
      "The ancient grey willow tree, ruler of the Old Forest.  He despises",
      " trespassers in his territory.  \"...a huge willow-tree, old and hoary.",
      "  Enormous it looked, its sprawling branches going up like reaching arms",
      " with many long-fingered hands, its knotted and twisted trunk gaping in",
      " wide fissures that creaked faintly as the boughs moved.\""
    ]
  },
  {
    commit: "c6e499b5a",
    file: "monster",
    ref: "core:blood-falcon",
    path: "desc",
    before: [
      "A blinding whirlwind of fear and feathers.  Its razor sharp beak and",
      " talons fill its foes with terror as it seeks to rend flesh from bone",
      " with unbridled ferocity."
    ],
    after: [
      "A blinding whirlwind of fear and feathers.  Its razor-sharp beak and",
      " talons fill its foes with terror as it seeks to rend flesh from bone",
      " with unbridled ferocity."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "monster",
    ref: "core:nexus-hound",
    path: "desc",
    before: [
      "A locus of conflicting points coalesce to form the vague shape of a huge",
      " hound.  Or is it just your imagination?"
    ],
    after: [
      "A locus of conflicting points coalesces to form the vague shape of a huge",
      " hound.  Or is it just your imagination?"
    ]
  },
  {
    commit: "c6e499b5a",
    file: "monster",
    ref: "core:doombat",
    path: "desc",
    before: [
      "It is a fast moving creature of chaos, a gigantic black bat surrounded by",
      " flickering bright red flames."
    ],
    after: [
      "It is a fast-moving creature of chaos, a gigantic black bat surrounded by",
      " flickering bright red flames."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "monster",
    ref: "core:southron-archer",
    path: "desc",
    before: [
      "A man of Harad clad in black and red and carrying a longbow.  His quiver is",
      " full of red feathered arrows, and carries an insignia of a black serpent."
    ],
    after: [
      "A man of Harad clad in black and red and carrying a longbow.  His quiver is",
      " full of red-feathered arrows, and carries an insignia of a black serpent."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "monster",
    ref: "core:glabrezu",
    path: "desc",
    before: [
      "It is demon with arms and pincers, its form a true mockery of life."
    ],
    after: [
      "It is a demon with arms and pincers, its form a true mockery of life."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "monster",
    ref: "core:drolem",
    path: "desc",
    before: [
      "A constructed dragon, the drolem has massive strength.  Powerful spells",
      " weaved during its creation make it a fearsome adversary.  Its eyes show",
      " little intelligence, but it has been instructed to destroy all it meets."
    ],
    after: [
      "A constructed dragon, the drolem has massive strength.  Powerful spells",
      " woven during its creation make it a fearsome adversary.  Its eyes show",
      " little intelligence, but it has been instructed to destroy all it meets."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "monster",
    ref: "core:fundin-bluecloak",
    path: "desc",
    before: [
      "He is one of the greatest dwarven priests to walk the earth.  Fundin has",
      " earned a high position in the church, and his skill with both weapon and",
      " spell only justify his position further.  His combination of both dwarven",
      " strength and priestly wisdom are a true match for any adventurer."
    ],
    after: [
      "He is one of the greatest dwarven priests to walk the earth.  Fundin has",
      " earned a high position in the church, and his skill with both weapon and",
      " spell only justifies his position further.  His combination of both",
      " dwarven strength and priestly wisdom are a true match for any adventurer."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "monster",
    ref: "core:maia-of-varda",
    path: "desc",
    before: [
      "A servant of Varda, Lady of the Stars, who the elves call Elbereth and",
      " love above all the Valar."
    ],
    after: [
      "A servant of Varda, Lady of the Stars, whom the elves call Elbereth and",
      " love above all the Valar."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "monster",
    ref: "core:oss-herald-of-ulmo",
    path: "desc",
    before: [
      "Encrusted with barnacles, slimy and dripping, the Maia of the untamed",
      " sea has dragged himself down into Angband to send you to a watery grave.",
      " Ossë is the most powerful and heartless of Ulmo's servants and embodies",
      " the untamed power of the ocean.  Terror grows in your heart with each",
      " squelching step of his approach."
    ],
    after: [
      "Encrusted with barnacles, slimy and dripping, the Maia of the untamed",
      " sea has dragged himself down into Angband to send you to a watery grave.",
      "  Ossë is the most powerful and heartless of Ulmo's servants and embodies",
      " the untamed power of the ocean.  Terror grows in your heart with each",
      " squelching step of his approach."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "monster",
    ref: "core:uvatha-the-horseman",
    path: "desc",
    before: [
      "A tall black cloaked Ringwraith, he is a master of horsemanship.  He longs",
      " to taste your blood."
    ],
    after: [
      "A tall black-cloaked Ringwraith, he is a master of horsemanship.  He longs",
      " to taste your blood."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "monster",
    ref: "core:draugluin-sire-of-all-werewolves",
    path: "desc",
    before: [
      "Draugluin provides Sauron with a fearsome personal guard.  He is an",
      " enormous wolf inhabited with a human spirit.  He is chief of all his kind."
    ],
    after: [
      "Draugluin provides Sauron with a fearsome personal guard.  He is an",
      " enormous wolf inhabited by a human spirit.  He is chief of all his kind."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "monster_base",
    ref: "core:ainu",
    path: "desc",
    before: [
      "Ainu/maia"
    ],
    after: [
      "Ainu/Maia"
    ]
  },
  {
    commit: "c6e499b5a",
    file: "object",
    ref: "core:food--ration-of-food",
    path: "desc",
    before: [
      "This nutritious but fairly bland food, called cram by the Lake-men who",
      " make it is familiar to anyone contemplating long journeys.  It is",
      " sustaining, but very uninteresting except as a chewing exercise."
    ],
    after: [
      "This nutritious but fairly bland food, called cram by the Lake-men who",
      " make it, is familiar to anyone contemplating long journeys.  It is",
      " sustaining, but very uninteresting except as a chewing exercise."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "object",
    ref: "core:polearm--broad-axe",
    path: "desc",
    before: [
      "A simple, single-bladed war axe capable of chopping though limbs or armour."
    ],
    after: [
      "A simple, single-bladed war axe capable of chopping through limbs or armour."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "object",
    ref: "core:crown--jewel-encrusted-crown",
    path: "desc",
    before: [
      "An elaboratedly decorated crown of massive gold, studded with a rainbow",
      " of gems and jewels; worthy of a High King."
    ],
    after: [
      "An elaborately decorated crown of massive gold, studded with a rainbow",
      " of gems and jewels; worthy of a High King."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "player_property",
    ref: "core:slow-digestion",
    path: "desc",
    before: [
      "You have slow metabolism."
    ],
    after: [
      "You have a slow metabolism."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "player_timed",
    ref: "core:heal",
    path: "on-end",
    before: [
      "Your metabolism return to normal."
    ],
    after: [
      "Your metabolism returns to normal."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "player_timed",
    ref: "core:command",
    path: "on-end",
    before: [
      "Your resume control of your own body."
    ],
    after: [
      "You resume control of your own body."
    ]
  },
  {
    commit: "c6e499b5a",
    file: "terrain",
    ref: "core:home",
    path: "desc",
    before: [
      "Your safe piece of Middle Earth, and the only place you can store goods",
      " apart from on your person."
    ],
    after: [
      "Your safe piece of Middle-earth, and the only place you can store goods",
      " apart from on your person."
    ]
  }
];

describe("catchup-text: upstream 73c851ab4 and c6e499b5a", () => {
  for (const row of CORRECTIONS) {
    it(`${row.commit} ${row.file} ${row.ref} ${row.path}`, () => {
      const hits = corePack(row.file).records.filter((record) => `core:${recordKey(row.file, record)}` === row.ref);
      expect(hits).toHaveLength(1);
      expect(valueAtPath(hits[0], row.path)).toEqual(row.before);
      expect(row.after).not.toEqual(row.before);
      const contribution = require(`./${row.file}.json`) as { sections: Record<string, { fieldPatches: FieldPatches }> };
      expect(contribution.sections["catchup-text"]!.fieldPatches[row.ref]).toContainEqual({
        op: "set", path: row.path, value: row.after,
      });
    });
  }

  it("ships exactly the reviewed field patches", () => {
    const files = [...new Set([...CORRECTIONS.map((row) => row.file), "object_property"])];
    const count = files.reduce((sum, file) => {
      const contribution = require(`./${file}.json`) as { sections: Record<string, { fieldPatches: FieldPatches }> };
      return sum + Object.values(contribution.sections["catchup-text"]!.fieldPatches).flat().length;
    }, 0);
    expect(count).toBe(CORRECTIONS.length + LATER.length);
  });

  it("composes the corrections only when the text section is enabled", () => {
    const files = [...new Set(CORRECTIONS.map((row) => row.file))];
    const core: PackContent = {
      manifest: { id: "core", name: "Core", version: "4.2.6", shape: "content" },
      files: Object.fromEntries(files.map((file) => [file, corePack(file)])) as PackContent["files"],
    };
    const mod: PackContent = {
      manifest: {
        id: manifest.id, name: manifest.name, version: manifest.version, shape: "content", sections: manifest.sections,
        dependencies: Object.fromEntries(Object.entries(manifest.dependencies.required).map(([id, dependency]) => [id, dependency.range])),
      },
      files: Object.fromEntries(files.map((file) => [file, require(`./${file}.json`)])),
    };
    for (const enabled of [undefined, false, true]) {
      const choices = enabled === undefined ? {} : { "upstream-catchup": { "catchup-text": enabled } };
      const state = resolveSectionState([core.manifest, mod.manifest], choices, new Set(["core", "upstream-catchup"]));
      const units = expandSections([core, mod], (id, section) => state.get(id)?.get(section) === true);
      const composed = composePacks(units.map((unit) => unit.content));
      for (const row of CORRECTIONS) {
        expect(valueAtPath(composed.get(row.file)?.get(row.ref as `core:${string}`)?.value, row.path)).toEqual(
          enabled === true ? row.after : row.before,
        );
      }
    }
  });
});
