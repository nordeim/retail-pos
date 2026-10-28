// ---------------------------------------------------------------------------
// The V28 dependency-census pin (remediation-plan-v28 / SD-117): every
// package the manifest carries must earn its place — a live string
// reference somewhere in the repo's executable surface (src/, tests/,
// scripts/ minus the archive, prisma/, the root config files, and
// package.json's own scripts block — the CLI tools earn their place
// through the commands the gate runs), OR an explicit INFRA allowlist
// row documenting why it rides without one. The web-application skill
// §2 rule ("every dependency must have a live import within one commit
// of being added; run a dead-dependency census periodically — the
// family repeatedly found and retired zero-import scaffold packages"),
// made standing: the census had never run in this repo before V28 and
// found four dead riders (react-radio-group, react-scroll-area,
// react-toast — the repo's toaster is the custom zustand build — and
// bun-types, empirically dead: tsc --noEmit passes with the package
// physically removed).
//
// Substring semantics are DELIBERATE (the census instrument's own
// form): a "reference" is a live use in the broadest sense — an import,
// a config key, a CSS @import, a CLI invocation, a pinned contract in a
// spec. A package with ZERO substring occurrences across the entire
// surface is dead by any stricter definition too.
//
// The manifest is parsed, never regexed (package.json is structured
// data), and the dependency KEYS themselves are not part of the
// reference surface — a dep's own manifest row is not a use.
// ---------------------------------------------------------------------------

import { readdirSync, readFileSync, type Dirent } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = path.join(import.meta.dirname, "..");

function read(...segments: string[]): string {
  return readFileSync(path.join(ROOT, ...segments), "utf8");
}

const pkg = JSON.parse(read("package.json")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

/**
 * Packages exempt from the reference requirement — each row documents
 * its infrastructure role, and adding a row requires a reason this
 * strong (a runtime peer a framework demands, a type layer the compiler
 * auto-includes). An exempt package with no role is dead weight the
 * census cannot see — hence the allowlist's own stale-row test below.
 *
 *  - react-dom: the Next.js runtime peer — `next` requires it at
 *    runtime; app code never imports it directly.
 *  - @types/react / @types/react-dom: TSX compilation — auto-included
 *    by tsc from node_modules/@types.
 */
const INFRA_ALLOWLIST: ReadonlySet<string> = new Set([
  "react-dom",
  "@types/react",
  "@types/react-dom",
]);

/** The root config files — where build tooling is wired. */
const CONFIG_FILES = [
  "next.config.ts",
  "playwright.config.ts",
  "vitest.config.ts",
  "postcss.config.mjs",
  "eslint.config.mjs",
  "components.json",
] as const;

/** The executable reference surface — everywhere a live use can appear. */
function collectSurface(): string {
  // The census file itself is EXCLUDED from its own surface: its prose
  // cites the packages it retired (the F2 record below), and a census
  // must not count its instrument as evidence — the same rule that
  // keeps a dep's own manifest row out of the surface.
  const SELF_BASENAME = path.basename(import.meta.filename ?? "");

  const chunks: string[] = [
    // package.json's own scripts block (the gate's own commands — the
    // prisma/eslint/vitest/tsc CLIs are invoked through it every run).
    JSON.stringify(pkg.scripts ?? {}),
  ];
  for (const cfg of CONFIG_FILES) chunks.push(read(cfg));

  const walk = (dir: string): void => {
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // a missing tree contributes no references
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // The archive is historical reference only (AGENTS.md) —
        // excluded exactly as tsconfig excludes it. .next/ and
        // node_modules/ are build output, not source.
        if (
          entry.name === "archive-study-sweep" ||
          entry.name === "node_modules" ||
          entry.name === ".next"
        ) {
          continue;
        }
        walk(full);
      } else if (/\.(ts|tsx|mjs|js|json|sh|py|css)$/.test(entry.name)) {
        if (entry.name === SELF_BASENAME) continue;
        chunks.push(readFileSync(full, "utf8"));
      }
    }
  };
  walk(path.join(ROOT, "src"));
  walk(path.join(ROOT, "tests"));
  walk(path.join(ROOT, "scripts"));
  walk(path.join(ROOT, "prisma"));

  return chunks.join("\n");
}

const SURFACE = collectSurface();

const ALL_DEPS: ReadonlyArray<readonly [string, string]> = [
  ...Object.entries(pkg.dependencies ?? {}),
  ...Object.entries(pkg.devDependencies ?? {}),
];

describe("V28 — the dependency census (every package earns its place)", () => {
  it("the manifest is non-empty and the census reads both sections", () => {
    expect(Object.keys(pkg.dependencies ?? {}).length).toBeGreaterThan(20);
    expect(Object.keys(pkg.devDependencies ?? {}).length).toBeGreaterThan(5);
    // The surface must be big enough that the substring check is a real
    // sweep, not a degenerate empty-string match-everything.
    expect(SURFACE.length).toBeGreaterThan(50_000);
  });

  it("every non-infra package has a live reference", () => {
    const dead = ALL_DEPS.filter(
      ([name]) => !INFRA_ALLOWLIST.has(name) && !SURFACE.includes(name),
    ).map(([name]) => name);
    expect(
      dead,
      "dead dependencies (zero live references across the executable surface) — remove via `bun remove <pkg>` or add an INFRA_ALLOWLIST row with a documented reason",
    ).toEqual([]);
  });

  it("the INFRA allowlist carries no dead weight of its own", () => {
    const names = new Set(ALL_DEPS.map(([name]) => name));
    const stale = [...INFRA_ALLOWLIST].filter((name) => !names.has(name));
    expect(
      stale,
      "allowlist rows for packages that no longer ride the manifest — sweep them",
    ).toEqual([]);
  });
});
