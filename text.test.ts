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
import { recordKey } from "@rpgm-tools/neo-angband-mod-sdk";

import artifactContrib from "./artifact.json";
import classContrib from "./class.json";
import objectPropertyContrib from "./object_property.json";
import manifest from "./manifest.json";

const require = createRequire(import.meta.url);

interface PackFile {
  records: Record<string, unknown>[];
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
    expect(shipped).toHaveLength(LATER.length);
  });
});
