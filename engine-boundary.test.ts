import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import ts from "typescript";

/**
 * The mod reads no engine member. Its sources import the game's packages for
 * types only, and the built plugin.js imports nothing from them at run time:
 * a module fetched from a folder cannot resolve a bare specifier, and a bundled
 * copy would be a second copy of the game's module state.
 */
const PACKAGE = /^@rpgm-tools\/neo-angband-(core|content|mod-sdk)(\/|$)/u;

function runtimeImports(code: string, file: string): string[] {
  const tree = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true);
  const hits: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier) && PACKAGE.test(node.moduleSpecifier.text)) {
      const clause = node.importClause;
      const bindings = clause?.namedBindings;
      const typesOnly = clause?.isTypeOnly === true || (
        clause?.name === undefined && bindings !== undefined && ts.isNamedImports(bindings) &&
        bindings.elements.length > 0 && bindings.elements.every((element) => element.isTypeOnly)
      );
      if (!typesOnly) hits.push(node.moduleSpecifier.text);
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier) && PACKAGE.test(node.moduleSpecifier.text) && !node.isTypeOnly) {
      hits.push(node.moduleSpecifier.text);
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteralLike(arg) && PACKAGE.test(arg.text)) hits.push(arg.text);
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "require") {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteralLike(arg) && PACKAGE.test(arg.text)) hits.push(arg.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return hits;
}

describe("the engine boundary", () => {
  const sources = (): string[] =>
    readdirSync(new URL("./", import.meta.url)).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts") && !f.endsWith(".d.ts"));
  const read = (f: string): string => readFileSync(new URL(`./${f}`, import.meta.url), "utf8");

  it("finds the entry and its modules", () => {
    expect(sources()).toContain("plugin.ts");
    expect(sources()).not.toContain("core-adapter.ts");
  });

  it("imports the game's packages for types only", () => {
    const hits: string[] = [];
    for (const f of sources()) for (const what of runtimeImports(read(f), f)) hits.push(`${f}: ${what}`);
    expect(hits).toEqual([]);
  });

  it("flags a runtime import when one is present", () => {
    expect(runtimeImports('import { x } from "@rpgm-tools/neo-angband-core";', "x.ts")).toEqual(["@rpgm-tools/neo-angband-core"]);
    expect(runtimeImports('import type { x } from "@rpgm-tools/neo-angband-core";', "x.ts")).toEqual([]);
    expect(runtimeImports('const m = require("@rpgm-tools/neo-angband-mod-sdk");', "x.js")).toEqual(["@rpgm-tools/neo-angband-mod-sdk"]);
  });

  it("the built plugin contains no runtime imports of the game's packages", () => {
    expect(runtimeImports(read("plugin.js"), "plugin.js")).toEqual([]);
  });
});
