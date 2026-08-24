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
