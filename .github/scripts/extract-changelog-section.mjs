#!/usr/bin/env node
/**
 * Write one released version's exact CHANGELOG.md section to a file.
 *
 * Usage: node .github/scripts/extract-changelog-section.mjs v1.2.3 output.md
 */

import { readFileSync, writeFileSync } from "node:fs";

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

const [tag, outputPath] = process.argv.slice(2);
if (!tag || !outputPath) {
  fail("usage: extract-changelog-section.mjs <tag> <output-path>");
}

if (!tag.startsWith("v")) {
  fail(`tag must start with v: ${tag}`);
}

const version = tag.slice(1);
if (!version) {
  fail("tag must include a version after v");
}

const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
const versionHeading = new RegExp(
  `^##\\s+(?:\\[${escapedVersion}\\]|${escapedVersion})(?:\\s+-[^\\r\\n]*)?\\r?$`,
  "gmu",
);
const changelog = readFileSync("CHANGELOG.md", "utf8");
const heading = versionHeading.exec(changelog);

if (!heading) {
  fail(`no CHANGELOG.md section found for ${version}`);
}

const nextHeading = /^##\s/gmu;
nextHeading.lastIndex = heading.index + heading[0].length;
const next = nextHeading.exec(changelog);
const section = changelog.slice(heading.index, next ? next.index : changelog.length);

writeFileSync(outputPath, section, "utf8");
