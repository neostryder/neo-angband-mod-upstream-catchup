import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import ts from "typescript";

const ADAPTER = "core-adapter.ts";
const API2_ADAPTER = "core-adapter-api2.ts";
const RAW_MEMBERS = new Set([
  "core", "state", "registries", "snapshot", "intent", "events", "characterStore",
  "prefs", "inspect", "keymaps", "ui", "knownLevel", "character", "prompt",
]);

function unwrap(expression: ts.Expression): ts.Expression {
  while (
    ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression) ||
    ts.isTypeAssertionExpression(expression) || ts.isNonNullExpression(expression) ||
    ts.isSatisfiesExpression(expression)
  ) expression = expression.expression;
  return expression;
}

function violations(code: string, file: string): string[] {
  const tree = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true);
  const hits = new Set<string>();
  const contextBindings = new Set(["ctx"]);
  const adapterObjects = new Set<string>();
  const adapterBindings = new Set<string>();
  const localObjects = new Set<string>();
  const importsOnly = file === "plugin.js";
  const coreModule = (node: ts.Node | undefined): boolean =>
    node !== undefined && ts.isStringLiteralLike(node) &&
    (node.text === "@rpgm-tools/neo-angband-core" || node.text.startsWith("@rpgm-tools/neo-angband-core/"));
  const memberName = (expression: ts.Expression): string | undefined => {
    if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
    if (ts.isElementAccessExpression(expression) && ts.isStringLiteralLike(expression.argumentExpression)) {
      return expression.argumentExpression.text;
    }
    return undefined;
  };
  const isContext = (expression: ts.Expression): boolean => {
    const base = unwrap(expression);
    return (ts.isIdentifier(base) && contextBindings.has(base.text)) || memberName(base) === "ctx";
  };
  const isAdapter = (expression: ts.Expression): boolean => {
    const base = unwrap(expression);
    return (ts.isIdentifier(base) && adapterObjects.has(base.text)) || (
      ts.isCallExpression(base) && ts.isIdentifier(base.expression) && base.expression.text === "createAdapter"
    );
  };

  const findBindings = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && node.initializer) {
      const initializer = unwrap(node.initializer);
      if (ts.isIdentifier(node.name)) {
        if (isContext(initializer)) contextBindings.add(node.name.text);
        if (isAdapter(initializer)) adapterObjects.add(node.name.text);
        if (
          (ts.isIdentifier(initializer) && adapterBindings.has(initializer.text)) ||
          ((ts.isPropertyAccessExpression(initializer) || ts.isElementAccessExpression(initializer)) &&
            memberName(initializer) === "engine" && isAdapter(initializer.expression))
        ) adapterBindings.add(node.name.text);
        if (ts.isObjectLiteralExpression(initializer)) localObjects.add(node.name.text);
      }
      if (ts.isObjectBindingPattern(node.name) && isAdapter(initializer)) {
        for (const element of node.name.elements) {
          if (ts.isIdentifier(element.name) && (element.propertyName ?? element.name).getText(tree) === "engine") {
            adapterBindings.add(element.name.text);
          }
        }
      }
    }
    ts.forEachChild(node, findBindings);
  };
  let bindingCount = -1;
  while (bindingCount !== contextBindings.size + adapterObjects.size + adapterBindings.size) {
    bindingCount = contextBindings.size + adapterObjects.size + adapterBindings.size;
    findBindings(tree);
  }

  const visit = (node: ts.Node): void => {
    if (file === API2_ADAPTER && ts.isIdentifier(node) && node.text === "ctx") hits.add("an API 1 context in the API 2 adapter");
    if (ts.isImportDeclaration(node) && coreModule(node.moduleSpecifier)) {
      const clause = node.importClause;
      const bindings = clause?.namedBindings;
      const typesOnly = clause?.isTypeOnly === true || (
        clause?.name === undefined && bindings !== undefined && ts.isNamedImports(bindings) &&
        bindings.elements.length > 0 && bindings.elements.every((element) => element.isTypeOnly)
      );
      if (!typesOnly) hits.add("a runtime engine import");
    }
    if (ts.isExportDeclaration(node) && coreModule(node.moduleSpecifier)) {
      const clause = node.exportClause;
      const typesOnly = node.isTypeOnly || (
        clause !== undefined && ts.isNamedExports(clause) && clause.elements.length > 0 &&
        clause.elements.every((element) => element.isTypeOnly)
      );
      if (!typesOnly) hits.add("a runtime engine export");
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && coreModule(node.arguments[0])) {
      hits.add("a dynamic engine import");
    }
    if (ts.isImportEqualsDeclaration(node) && !node.isTypeOnly && ts.isExternalModuleReference(node.moduleReference) && coreModule(node.moduleReference.expression)) {
      hits.add("a runtime engine import");
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(unwrap(node.expression)) && unwrap(node.expression).getText(tree) === "require" && coreModule(node.arguments[0])) {
      hits.add("a runtime engine import");
    }
    if (file !== ADAPTER && !importsOnly) {
      if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && coreModule(node.argument.literal)) {
        hits.add("an engine name list");
      }
      if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
        const base = unwrap(node.expression);
        const member = ts.isPropertyAccessExpression(node) ? node.name.text : undefined;
        if (isContext(base) && (member === undefined || RAW_MEMBERS.has(member))) hits.add("a raw context member");
        if (member === "registries" || (ts.isElementAccessExpression(node) && ts.isStringLiteralLike(node.argumentExpression) && node.argumentExpression.text === "registries")) {
          hits.add("a registries read");
        }
        if (ts.isIdentifier(base) && /engine$/iu.test(base.text) && !adapterBindings.has(base.text) && !localObjects.has(base.text)) {
          hits.add("an engine namespace read");
        }
      }
      if (ts.isVariableDeclaration(node) && node.initializer && isContext(node.initializer) && ts.isIdentifier(node.name)) {
        hits.add("a raw context alias");
      }
      if (ts.isVariableDeclaration(node) && node.initializer && isContext(node.initializer) && ts.isObjectBindingPattern(node.name)) {
        if (node.name.elements.some((element) => RAW_MEMBERS.has((element.propertyName ?? element.name).getText(tree).replace(/^["']|["']$/gu, "")))) {
          hits.add("an engine member destructured from the context");
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return [...hits];
}

describe("the engine adapter boundary", () => {
  const sources = (): string[] =>
    readdirSync(new URL("./", import.meta.url)).filter(
      (f) => f.endsWith(".ts") && !f.endsWith(".test.ts") && !f.endsWith(".d.ts"),
    );

  const read = (f: string): string => readFileSync(new URL(`./${f}`, import.meta.url), "utf8");

  it("finds the adapter and the files it serves", () => {
    expect(sources()).toContain(ADAPTER);
    expect(sources()).toContain(API2_ADAPTER);
    expect(sources()).toContain("plugin.ts");
  });

  it("is crossed by no other source file", () => {
    const hits: string[] = [];
    for (const f of sources()) {
      for (const what of violations(read(f), f)) hits.push(`${f}: ${what}`);
    }
    expect(hits).toEqual([]);
  });

  it("the built plugin contains no runtime engine imports", () => {
    expect(violations(read("plugin.js"), "plugin.js")).toEqual([]);
  });

  it.each([
    'require("@rpgm-tools/neo-angband-core");',
    'require("@rpgm-tools/neo-angband-core/engine");',
    'import core = require("@rpgm-tools/neo-angband-core");',
    'import core = require("@rpgm-tools/neo-angband-core/engine");',
  ])("the bundle scan rejects a runtime engine import: %s", (code) => {
    expect(violations(code, "plugin.js")).toContain("a runtime engine import");
  });

  it.each([
    "ctx!.core;", "(ctx as any).state;", "ctx . registries;", "ctx?.core;",
    "(ctx as any)!['core'];", "const { core: raw } = (ctx as any);",
    "other.registries;", "other['registries'];", "neoEngine.parseTilePrefs();",
    "myengine['parseTilePrefs']();", "ctx.snapshot();",
    'import { bindCore } from "@rpgm-tools/neo-angband-core";',
    'import "@rpgm-tools/neo-angband-core";',
    'export { bindCore } from "@rpgm-tools/neo-angband-core";',
    'export * from "@rpgm-tools/neo-angband-core";',
    'import("@rpgm-tools/neo-angband-core");',
    'import("@rpgm-tools/neo-angband-core/subpath");',
    'type Engine = typeof import("@rpgm-tools/neo-angband-core");',
  ])("rejects a restored boundary violation: %s", (code) => {
    expect(violations(code, "plugin.ts").length).toBeGreaterThan(0);
  });

  it.each([
    ["const x = ctx; x.core;", "a raw context member"],
    ["let y = ctx;", "a raw context alias"],
    ["const x = ctx; const y = x; y.state;", "a raw context member"],
    ["const { core } = ctx;", "an engine member destructured from the context"],
    ["this.ctx.core;", "a raw context member"],
    ["obj.ctx.state;", "a raw context member"],
    ["holder.ctx.snapshot();", "a raw context member"],
    ['holder["ctx"]["prefs"];', "a raw context member"],
    ['require("@rpgm-tools/neo-angband-core");', "a runtime engine import"],
    ['require("@rpgm-tools/neo-angband-core/engine");', "a runtime engine import"],
    ['import core = require("@rpgm-tools/neo-angband-core");', "a runtime engine import"],
    ['import core = require("@rpgm-tools/neo-angband-core/engine");', "a runtime engine import"],
  ])("the scan rejects a restored context or import violation: %s", (code, rule) => {
    expect(violations(code, "plugin.ts")).toContain(rule);
  });

  it.each(["ctx.flags;", "const ctx = mod;", "use(ctx);", "ctx!.core;"])(
    "rejects API 1 context access in the API 2 adapter: %s", (code) => {
      expect(violations(code, API2_ADAPTER)).toContain("an API 1 context in the API 2 adapter");
    },
  );

  it.each([
    'import type { TileFill } from "@rpgm-tools/neo-angband-core";',
    'import { type TileFill } from "@rpgm-tools/neo-angband-core";',
    'export type { TileFill } from "@rpgm-tools/neo-angband-core";',
    'const { engine } = createAdapter(ctx); engine.prefTables();',
    'const { engine: tileEngine } = createAdapter(ctx); tileEngine.prefTables();',
    'const adapter = createAdapter(ctx); const engine = adapter.engine; engine.prefTables();',
    'const adapter = createAdapter(ctx); const { engine: tileEngine } = adapter; tileEngine.prefTables();',
    'const engine = createAdapter(ctx).engine; engine.prefTables();',
    'const adapter = createAdapter(ctx); const alias = adapter; const engine = alias["engine"]; engine.prefTables();',
    'const { engine } = createAdapter(ctx); const tileEngine = engine; tileEngine.prefTables();',
    'const gameEngine = { score: 1 }; gameEngine.score;',
    'const searchEngine = { query: "tiles" }; searchEngine.query;',
    'import type Core = require("@rpgm-tools/neo-angband-core");',
    'fill.pack.engine; ctx.flags; // ctx!.core',
    'const text = "ctx.core";',
  ])("allows adapter calls, types and text: %s", (code) => {
    expect(violations(code, "plugin.ts")).toEqual([]);
  });
});
