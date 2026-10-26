import { describe, expect, it } from "vitest";

import {
  buildDepAuditEnvelope,
  classifyAdvisory,
  parseBunAuditOutput,
  type AuditAdvisory,
  type DepAuditContext,
} from "@/lib/dep-audit";

// The S30 dependency-security seam: `bun audit` (no JSON reporter exists in
// bun 1.3.14) emits a text report; this seam parses it, classifies every
// advisory by RUNTIME REACHABILITY against the production standalone trace
// (`.next/standalone/node_modules` — the ground truth for "does this ship"),
// and assembles the self-describing envelope. Pure functions with explicit
// args (never reads fs/spawns itself — the runner script owns that), so the
// parser format, the classification matrix, and the envelope contract are
// all pinnable. The fixture below is today's byte-exact two-advisory output
// — if a future bun release changes the text format, these pins fail and
// force the parser update in the same change (the format-change guard).

// Today's exact `bun audit` output (captured 2026-10-10, bun 1.3.14).
const TODAY_BUN_AUDIT = [
  "braces  <=3.0.3",
  "  (direct dependency)",
  "  eslint-config-next › @next/eslint-plugin-next › fast-glob › micromatch › braces",
  "  high: braces vulnerable to stack-exhaustion denial of service through deeply nested patterns - https://github.com/advisories/GHSA-vfj7-8cjw-p6xm",
  "",
  "deepmerge-ts  <8.0.0",
  "  prisma › @prisma/config › deepmerge-ts",
  "  high: DeepmergeTS has stack exhaustion when merging recursive object graphs - https://github.com/advisories/GHSA-ggr8-5vv4-36mx",
  "",
  "2 vulnerabilities (2 high)",
  "",
  "To update all dependencies to the latest compatible versions:",
  "  bun update",
  "",
].join("\n");

const RUNTIME_MODULES = [
  "@img",
  "@next",
  "@prisma",
  "@swc",
  "client-only",
  "detect-libc",
  "next",
  "react",
  "react-dom",
  "semver",
  "sharp",
  "styled-jsx",
  "z-ai-web-dev-sdk",
];

const PROD_DEPS = [
  "@prisma/client",
  "next",
  "prisma",
  "react",
  "react-dom",
  "web-vitals",
  "z-ai-web-dev-sdk",
  "zod",
  "zustand",
];

const DEV_DEPS = [
  "@playwright/test",
  "eslint",
  "eslint-config-next",
  "tailwindcss",
  "typescript",
  "vitest",
];

const CTX: DepAuditContext = {
  runtimeModules: RUNTIME_MODULES,
  prodDependencies: PROD_DEPS,
  devDependencies: DEV_DEPS,
};

describe("parseBunAuditOutput", () => {
  it("parses today's exact two-advisory report (modules, ranges, severities, paths, titles, urls)", () => {
    const out = parseBunAuditOutput(TODAY_BUN_AUDIT);
    expect(out).toHaveLength(2);

    expect(out[0]).toMatchObject({
      module: "braces",
      vulnerableRange: "<=3.0.3",
      severity: "high",
      paths: [
        "eslint-config-next › @next/eslint-plugin-next › fast-glob › micromatch › braces",
      ],
      url: "https://github.com/advisories/GHSA-vfj7-8cjw-p6xm",
    });
    expect(out[0].title).toContain("stack-exhaustion");

    expect(out[1]).toMatchObject({
      module: "deepmerge-ts",
      vulnerableRange: "<8.0.0",
      severity: "high",
      paths: ["prisma › @prisma/config › deepmerge-ts"],
    });
    expect(out[1].url).toBe(
      "https://github.com/advisories/GHSA-ggr8-5vv4-36mx",
    );
  });

  it("tolerates the '(direct dependency)' marker line without treating it as a path", () => {
    const out = parseBunAuditOutput(TODAY_BUN_AUDIT);
    // braces carries the marker; its ONLY path is the chain line.
    expect(out[0].paths).toHaveLength(1);
    expect(out[0].paths[0]).not.toContain("direct dependency");
  });

  it("returns an empty list for a clean report (no advisory blocks)", () => {
    const clean = ["0 vulnerabilities", "", "To update all dependencies:", "  bun update", ""].join("\n");
    expect(parseBunAuditOutput(clean)).toEqual([]);
  });

  it("parses every severity grade and multi-path advisories", () => {
    const multi = [
      "some-pkg  <2.0.0",
      "  prod-root › mid › some-pkg",
      "  dev-root › other › some-pkg",
      "  critical: the title - https://example.com/a",
      "",
      "other-pkg  >=1.0.0 <1.5.0",
      "  chain › other-pkg",
      "  moderate: another title - https://example.com/b",
      "",
      "third-pkg  <9",
      "  chain › third-pkg",
      "  low: third title - https://example.com/c",
      "",
      "3 vulnerabilities (1 critical, 1 moderate, 1 low)",
    ].join("\n");
    const out = parseBunAuditOutput(multi);
    expect(out).toHaveLength(3);
    expect(out[0].severity).toBe("critical");
    expect(out[0].paths).toHaveLength(2);
    expect(out[1].severity).toBe("moderate");
    expect(out[1].vulnerableRange).toBe(">=1.0.0 <1.5.0");
    expect(out[2].severity).toBe("low");
  });

  it("never manufactures advisories from the summary or trailer lines", () => {
    const out = parseBunAuditOutput(TODAY_BUN_AUDIT);
    const modules = out.map((a) => a.module);
    expect(modules).not.toContain("2 vulnerabilities");
    expect(modules).not.toContain("bun update");
  });
});

describe("classifyAdvisory", () => {
  it("FAILS loudly when the advisory's module ships in the standalone runtime trace", () => {
    const advisory: AuditAdvisory = {
      module: "next",
      vulnerableRange: "<16.4.1",
      severity: "high",
      title: "hypothetical next runtime bug",
      paths: ["next"],
      url: "https://example.com/x",
    };
    const c = classifyAdvisory(advisory, CTX);
    expect(c.surface).toBe("runtime");
    expect(c.runtimeReachable).toBe(true);
    expect(c.verdict).toBe("FAIL");
  });

  it("matches scoped runtime modules (@prisma/client-style)", () => {
    const advisory: AuditAdvisory = {
      module: "@prisma/client",
      vulnerableRange: "<6.20.0",
      severity: "moderate",
      title: "hypothetical client bug",
      paths: ["@prisma/client"],
      url: "https://example.com/y",
    };
    const c = classifyAdvisory(advisory, {
      ...CTX,
      runtimeModules: [...RUNTIME_MODULES, "@prisma/client"],
    });
    expect(c.surface).toBe("runtime");
    expect(c.verdict).toBe("FAIL");
  });

  it("classifies the braces advisory as dev-surface NON-PRODUCTION (dev-only chain, not in the trace)", () => {
    const [braces] = parseBunAuditOutput(TODAY_BUN_AUDIT);
    const c = classifyAdvisory(braces, CTX);
    expect(c.surface).toBe("dev");
    expect(c.runtimeReachable).toBe(false);
    expect(c.verdict).toBe("NON-PRODUCTION");
    expect(c.rationale).toContain("eslint-config-next");
  });

  it("classifies the deepmerge-ts advisory as cli-surface NON-PRODUCTION (prod-declared tooling the runtime never imports)", () => {
    const [, dmt] = parseBunAuditOutput(TODAY_BUN_AUDIT);
    const c = classifyAdvisory(dmt, CTX);
    expect(c.surface).toBe("cli");
    expect(c.runtimeReachable).toBe(false);
    expect(c.verdict).toBe("NON-PRODUCTION");
    expect(c.rationale).toContain("prisma");
  });

  it("keeps a runtime-reachable module FAIL even when a path roots in devDependencies (the trace is the truth)", () => {
    const advisory: AuditAdvisory = {
      module: "next",
      vulnerableRange: "<16.4.1",
      severity: "high",
      title: "hypothetical",
      paths: ["eslint-config-next › next"],
      url: "https://example.com/z",
    };
    const c = classifyAdvisory(advisory, CTX);
    expect(c.runtimeReachable).toBe(true);
    expect(c.verdict).toBe("FAIL");
  });

  it("labels mixed-root paths (dev + prod) as the stricter cli surface, still NON-PRODUCTION", () => {
    const advisory: AuditAdvisory = {
      module: "not-traced-pkg",
      vulnerableRange: "<1.0.0",
      severity: "low",
      title: "hypothetical",
      paths: ["eslint-config-next › not-traced-pkg", "prisma › not-traced-pkg"],
      url: "https://example.com/m",
    };
    const c = classifyAdvisory(advisory, CTX);
    expect(c.surface).toBe("cli");
    expect(c.verdict).toBe("NON-PRODUCTION");
  });

  it("labels paths rooted outside both dependency lists as unclassified (honest, still NON-PRODUCTION)", () => {
    const advisory: AuditAdvisory = {
      module: "mystery-pkg",
      vulnerableRange: "<1.0.0",
      severity: "low",
      title: "hypothetical",
      paths: ["unknown-root › mystery-pkg"],
      url: "https://example.com/u",
    };
    const c = classifyAdvisory(advisory, CTX);
    expect(c.surface).toBe("unclassified");
    expect(c.runtimeReachable).toBe(false);
    expect(c.verdict).toBe("NON-PRODUCTION");
  });
});

describe("buildDepAuditEnvelope", () => {
  it("answers GREEN with zero findings for a clean report", () => {
    const env = buildDepAuditEnvelope([], CTX, "2026-10-10T00:00:00.000Z");
    expect(env.totalAdvisories).toBe(0);
    expect(env.runtimeFindings).toEqual([]);
    expect(env.nonProductionFindings).toEqual([]);
    expect(env.verdict).toContain("GREEN");
    // The ground truth rides the envelope (self-describing output).
    expect(env.runtimeModules).toEqual(RUNTIME_MODULES);
    expect(env.ranAt).toBe("2026-10-10T00:00:00.000Z");
    expect(env.source).toBe("bun audit");
  });

  it("answers GREEN with both advisories documented as NON-PRODUCTION for today's report", () => {
    const advisories = parseBunAuditOutput(TODAY_BUN_AUDIT);
    const env = buildDepAuditEnvelope(advisories, CTX, "2026-10-10T00:00:00.000Z");
    expect(env.totalAdvisories).toBe(2);
    expect(env.runtimeFindings).toEqual([]);
    expect(env.nonProductionFindings).toHaveLength(2);
    expect(env.nonProductionFindings.map((f) => f.module).sort()).toEqual([
      "braces",
      "deepmerge-ts",
    ]);
    expect(env.verdict).toContain("GREEN");
  });

  it("answers FAIL and separates both families when a runtime-reachable advisory exists", () => {
    const advisories: AuditAdvisory[] = [
      ...parseBunAuditOutput(TODAY_BUN_AUDIT),
      {
        module: "next",
        vulnerableRange: "<16.4.1",
        severity: "critical",
        title: "hypothetical runtime bug",
        paths: ["next"],
        url: "https://example.com/n",
      },
    ];
    const env = buildDepAuditEnvelope(advisories, CTX, "2026-10-10T00:00:00.000Z");
    expect(env.totalAdvisories).toBe(3);
    expect(env.runtimeFindings).toHaveLength(1);
    expect(env.runtimeFindings[0].module).toBe("next");
    expect(env.runtimeFindings[0].verdict).toBe("FAIL");
    expect(env.nonProductionFindings).toHaveLength(2);
    expect(env.verdict).toContain("FAIL");
  });
});
