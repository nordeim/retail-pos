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

// ---------------------------------------------------------------------------
// The V30 advisories-census block (remediation-plan-v30 / ADR-039, the
// neo-crm session-198 doctrine adopted): the manifest-truth family's
// OTHER half — vulnerable versions, not dead packages. The repo-included
// security-and-hardening skill's Always-Do tier ("Run `npm audit` (or
// equivalent) before every release") had never run in this repo; the
// first live run found 2 highs: zod 4.6.5 (< 4.6.6, GHSA-mrhx-c7xc-m3w5)
// on the DIRECT runtime validation chain (the root entry AND the
// eslint-config-next › eslint-plugin-react-hooks chain resolve the one
// hoisted copy), and deepmerge-ts 7.1.5 (< 8.0.0, GHSA-ggr8-5vv4-36mx)
// on the prisma CLI's dev-toolchain — the documented decline (zero
// runtime request-path, the s164/s198 toolchain posture, re-triage when
// @prisma/config bumps or a runtime chain appears).
//
// The pins, born RED on the standing tree (the V28 form — they caught
// a live defect):
//   1. the EXHAUSTIVE lockfile zod floor — every zod@x.y.z resolution
//      in bun.lock asserted at/above 4.6.6 (a first-match or root-only
//      pin would pass a NESTED vulnerable copy — the D-198a1 hardening;
//      the mutation proof plants exactly that nested copy);
//   2. the manifest range floor — the zod range's minimum at/above
//      4.6.6 (the range is what a future resolution moves within);
//   3. the PAD §6 ledger row's content pin — whitespace-normalized (the
//      D-198a2 lesson: the pin holds the CONTENT, never the wrap): the
//      post-cure census + the declined composition + the re-triage
//      clause.
// ---------------------------------------------------------------------------

/** The advisory floor for GHSA-mrhx-c7xc-m3w5 (zod memory exhaustion). */
const ZOD_FLOOR: readonly [number, number, number] = [4, 6, 6];

function parseTriple(raw: string): [number, number, number] | null {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(raw);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function atLeastZodFloor(v: readonly [number, number, number]): boolean {
  for (let i = 0; i < 3; i += 1) {
    if (v[i] !== ZOD_FLOOR[i]) return v[i] > ZOD_FLOOR[i];
  }
  return true; // exact equality passes
}

describe("V30 — the advisories census (the manifest's vulnerable half)", () => {
  it("every zod resolution in the lockfile is at or above the advisory floor 4.6.6 (exhaustively)", () => {
    const lock = read("bun.lock");
    const matches = [...lock.matchAll(/"zod@(\d+\.\d+\.\d+)"/g)].map((m) => m[1]);
    // The exhaustive form's own guard: a silent zero (a package rename,
    // a lockfile format change) would void the pin — fail loudly.
    expect(matches.length).toBeGreaterThan(0);
    const vulnerable = matches.filter((v) => {
      const triple = parseTriple(v);
      return triple === null || !atLeastZodFloor(triple);
    });
    expect(
      vulnerable,
      "zod resolutions below the GHSA-mrhx-c7xc-m3w5 floor 4.6.6 (memory exhaustion validating oversized constrained collections) — bump via `bun add zod@^4.6.6` (the package manager, never a hand-edited lockfile)",
    ).toEqual([]);
  });

  it("the manifest's zod range floors (direct dep AND override) exclude the advisory range (< 4.6.6)", () => {
    // Two seats, two roles: dependencies.zod is the DIRECT runtime dep
    // (the validation layer); overrides.zod is the tree-wide security
    // floor — the D-198a1 cure. The override is load-bearing: without
    // it, `bun add`/`bun update` hoist the root entry while a NESTED
    // vulnerable zod survives on disk (observed live this cycle: the
    // eslint-plugin-react-hooks chain nested zod@4.6.5 after the root
    // bump; the override + reinstall deduped the tree back to the one
    // hoisted 4.6.7).
    const direct = pkg.dependencies?.zod ?? "";
    const override = (pkg as { overrides?: Record<string, string> }).overrides?.zod ?? "";
    for (const [seat, range] of [
      ["dependencies.zod", direct],
      ["overrides.zod", override],
    ] as const) {
      const m = /^\^(\d+)\.(\d+)\.(\d+)$/.exec(range);
      expect(
        m,
        `the ${seat} row should be a caret range — found "${range}"`,
      ).not.toBeNull();
      if (!m) continue;
      const min: [number, number, number] = [Number(m[1]), Number(m[2]), Number(m[3])];
      expect(
        atLeastZodFloor(min),
        `the ${seat} range "${range}" admits versions below the GHSA-mrhx-c7xc-m3w5 floor 4.6.6 — raise it via \`bun add zod@^4.6.6\` + the overrides block, then \`bun install\``,
      ).toBe(true);
    }
  });

  it("the PAD §6 security ledger carries the live advisories census (the D-198a2 teeth)", () => {
    const pad = read("Project_Architecture_Document.md").replace(/\s+/g, " ");
    const claims = [
      "The `bun audit` advisories re-triage is a standing cycle duty (ADR-039)",
      "zod ≥ 4.6.6 — GHSA-mrhx-c7xc-m3w5",
      "deepmerge-ts 7.1.5 < 8.0.0 via @prisma/config",
      "re-triage when @prisma/config bumps or a runtime chain appears",
      "Post-cure census: 1 high, the documented toolchain member",
    ];
    for (const claim of claims) {
      expect(
        pad,
        `the PAD §6 advisories ledger row drifted — the claim "${claim}" is gone or stale; update the row AND this pin in the same commit (a census claim without teeth is the D-198a2 drift shape)`,
      ).toContain(claim);
    }
  });
});

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
