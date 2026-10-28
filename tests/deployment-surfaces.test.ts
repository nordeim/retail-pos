// ---------------------------------------------------------------------------
// The V21 deployment-surface truth pins (remediation-plan-v21 / SD-80..83):
// the shipped deployment surfaces must describe THIS app, not the scaffold
// it grew from. The stale identity lives IN comments (the Dockerfile's
// header, the compose service names, DEPLOYMENT.md's prose), so these pins
// scan RAW text — unlike tailwind-traps/recovery-a11y, there is no code to
// protect from doc rot; the doc IS the finding.
//
//   1-2   Dockerfile + docker-compose.yml carry the VeloxPOS identity (no
//         studyflow/omni-study/orbital token; the service/image/port-var
//         are veloxpos/veloxpos:latest/VELOXPOS_PORT).
//   3-6   docs/DEPLOYMENT.md documents the ACTUAL app: no dead-feature
//         tokens (/rum, export/import, smoke-test, docker-layout-sim),
//         every ./scripts/ reference resolves, every .env.example variable
//         is documented, and the route-handler count equals the live
//         filesystem count (the count-the-things rule, mechanically).
//   7     The four account-security routes carry no scaffold citation
//         (S2x/ADR-02x session numbers that collide with THIS repo's
//         ADRs) and no StudyFlow domain models in their cascade prose.
//   8     README's API table documents the four account-security routes.
//   9     Exactly one lockfile: bun.lock, never package-lock.json.
//   10    V28 (remediation-plan-v28 / SD-116): EVERY live operational doc
//         references only scripts that exist — the six-doc set (README,
//         AGENTS, CLAUDE, PAD, SKILL, DEPLOYMENT.md), not DEPLOYMENT.md
//         alone. F1's stale claim (generate-head-assets.py — never
//         committed) shipped through AGENTS/SKILL in v6 precisely
//         because the pin scoped one doc; historical session logs and
//         executed plans under docs/ are archives of what was true at
//         their time and stay OUT of scope by design.
// ---------------------------------------------------------------------------

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = path.join(import.meta.dirname, "..");

function read(...segments: string[]): string {
  return readFileSync(path.join(ROOT, ...segments), "utf8");
}

const DOCKERFILE = read("Dockerfile");
const COMPOSE = read("docker-compose.yml");
const DEPLOYMENT = read("docs", "DEPLOYMENT.md");
const README = read("README.md");

/** The scaffold-identity token family — the old app names, any case. */
const SCAFFOLD_TOKEN = /stud(?:yflow|-flow)|omni-study|orbital/i;

// ---------------------------------------------------------------------------
// 1-2 — the container surfaces
// ---------------------------------------------------------------------------

describe("V21 — the Dockerfile describes this app", () => {
  it("carries no scaffold identity token (raw scan — comments included)", () => {
    expect(DOCKERFILE).not.toMatch(SCAFFOLD_TOKEN);
  });
});

describe("V21 — docker-compose.yml describes this app", () => {
  it("carries no scaffold identity token", () => {
    expect(COMPOSE).not.toMatch(SCAFFOLD_TOKEN);
  });

  it("the app service is named veloxpos", () => {
    expect(COMPOSE).toMatch(/^services:\n  veloxpos:\s*$/m);
  });

  it("the image is veloxpos:latest", () => {
    expect(COMPOSE).toMatch(/image:\s*veloxpos:latest/);
  });

  it("the host port rides VELOXPOS_PORT", () => {
    expect(COMPOSE).toMatch(/\$\{VELOXPOS_PORT:-3000\}/);
  });
});

// ---------------------------------------------------------------------------
// 3-6 — docs/DEPLOYMENT.md tells the truth about the shipped app
// ---------------------------------------------------------------------------

describe("V21 — DEPLOYMENT.md documents this app only", () => {
  it("carries no scaffold identity token", () => {
    expect(DEPLOYMENT).not.toMatch(SCAFFOLD_TOKEN);
  });

  it("documents no unshipped feature (no /rum, export/import, smoke-test, layout-sim)", () => {
    expect(DEPLOYMENT).not.toMatch(/\/rum\b|api\/export|api\/import|smoke-test|docker-layout-sim/);
  });

  it("references only scripts that exist", () => {
    const refs = [...DEPLOYMENT.matchAll(/\.{0,2}\/?scripts\/([\w./-]+)/g)].map(
      (m) => m[1].replace(/\.$/, ""),
    );
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      expect(
        existsSync(path.join(ROOT, "scripts", ref)),
        `DEPLOYMENT.md references scripts/${ref} but it does not exist`,
      ).toBe(true);
    }
  });

  it("documents every .env.example variable", () => {
    const vars = [
      ...read(".env.example").matchAll(/^([A-Z_][A-Z0-9_]*)=/gm),
    ].map((m) => m[1]);
    expect(vars.length).toBeGreaterThanOrEqual(5);
    for (const v of vars) {
      expect(
        DEPLOYMENT.includes(v),
        `DEPLOYMENT.md never mentions ${v}`,
      ).toBe(true);
    }
  });

  it("route-handler count matches the filesystem (count-the-things)", () => {
    const count = readdirSync(path.join(ROOT, "src", "app", "api"), {
      recursive: true,
    })
      .filter((f) => String(f).endsWith(path.join("route.ts")))
      .length;
    expect(count).toBeGreaterThan(20);
    const claimed = DEPLOYMENT.match(/(\d+) route handlers/)?.[1];
    expect(
      claimed,
      "DEPLOYMENT.md must state the route count as '<n> route handlers'",
    ).toBeDefined();
    expect(Number(claimed)).toBe(count);
  });
});

// ---------------------------------------------------------------------------
// 7 — the account-security routes carry no scaffold citations
// ---------------------------------------------------------------------------

const ACCOUNT_SECURITY_ROUTES = [
  "change-password",
  "change-email",
  "delete-account",
  "resend-verification",
] as const;

describe("V21 — the account-security route comments describe this repo", () => {
  for (const route of ACCOUNT_SECURITY_ROUTES) {
    it(`${route}: no scaffold session/ADR citation and no StudyFlow domain models`, () => {
      const source = read(
        "src",
        "app",
        "api",
        "auth",
        route,
        "route.ts",
      );
      // The scaffold cited its own sessions/ADRs (S24/ADR-022 …) — numbers
      // that COLLIDE with this repo's ADR-022..024 (auth family / chart
      // hover / dialog motion). This repo's decisions cite the PAD, and
      // the account-security superset cites ADR-030.
      expect(source).not.toMatch(/S\d+\/ADR-0/);
      expect(source).not.toMatch(/ADR-02[234]/);
      expect(source).not.toMatch(
        /subjects|flashcards|decks|grades|chat history|RUM events/,
      );
    });
  }
});

// ---------------------------------------------------------------------------
// 8 — README documents the account-security API
// ---------------------------------------------------------------------------

describe("V21 — README's API table covers the account-security routes", () => {
  it("all four routes appear in README.md", () => {
    for (const route of ACCOUNT_SECURITY_ROUTES) {
      expect(README.includes(route), `README.md never mentions ${route}`).toBe(
        true,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// 9 — one lockfile
// ---------------------------------------------------------------------------

describe("V21 — single lockfile (bun.lock)", () => {
  it("bun.lock exists and package-lock.json does not", () => {
    expect(existsSync(path.join(ROOT, "bun.lock"))).toBe(true);
    expect(existsSync(path.join(ROOT, "package-lock.json"))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 10 — V28: every LIVE operational doc references only scripts that exist
// ---------------------------------------------------------------------------

/**
 * The six live operational docs — the shipped surfaces a reader acts on.
 * Historical session logs and executed plans under docs/ are archives of
 * what was true at their own time and stay out of scope by design (a
 * v6 session log citing a workspace-local script is a historical fact,
 * not a live claim).
 */
const LIVE_DOCS: ReadonlyArray<readonly [string, string]> = [
  ["README.md", README],
  ["AGENTS.md", read("AGENTS.md")],
  ["CLAUDE.md", read("CLAUDE.md")],
  ["Project_Architecture_Document.md", read("Project_Architecture_Document.md")],
  ["retail-pos_SKILL.md", read("retail-pos_SKILL.md")],
  ["docs/DEPLOYMENT.md", DEPLOYMENT],
];

describe("V28 — every live doc references only scripts that exist", () => {
  for (const [name, body] of LIVE_DOCS) {
    it(`${name}: every scripts/ reference resolves`, () => {
      // The DEPLOYMENT.md pin's own regex, generalized: tolerate the
      // "bun scripts/x.ts" invocation form, backslashed paths, and a
      // trailing sentence period or directory slash on the capture.
      const refs = [...body.matchAll(/\.{0,2}\/?scripts\/([\w./-]+)/g)].map(
        (m) => m[1].replace(/[/.]+$/, ""),
      );
      expect(
        refs.length,
        `${name} cites no scripts — the pin's regex may have rotted`,
      ).toBeGreaterThan(0);
      for (const ref of refs) {
        expect(
          existsSync(path.join(ROOT, "scripts", ref)),
          `${name} references scripts/${ref} but it does not exist`,
        ).toBe(true);
      }
    });
  }
});
