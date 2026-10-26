import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resolveDatabaseUrl, standaloneRepoRoot } from "@/lib/db-path";

// The db-path contract (docs/parity-remediation-v2.3.md WS-1):
// a RELATIVE `file:` URL resolves against the first "anchor" directory that
// contains prisma/schema.prisma — exactly like the Prisma CLI resolves
// against the schema file — so `file:../db/custom.db` points at
// <anchor>/db/custom.db regardless of the process working directory.
// Absolute file: URLs (POSIX + Windows drive letters) and non-SQLite URLs
// pass through untouched; a missing/blank env value falls back to the
// documented default <anchor>/db/custom.db.

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

describe("resolveDatabaseUrl", () => {
  let repo: string;
  let other: string;

  beforeAll(() => {
    // A fake repo layout: <repo>/prisma/schema.prisma + <repo>/db/
    repo = mkdtempSync(path.join(tmpdir(), "dbpath-repo-"));
    mkdirSync(path.join(repo, "prisma"));
    writeFileSync(path.join(repo, "prisma", "schema.prisma"), "datasource db { provider = \"sqlite\" }");
    mkdirSync(path.join(repo, "db"));
    // A directory with no schema (e.g. a random CWD).
    other = mkdtempSync(path.join(tmpdir(), "dbpath-other-"));
  });

  afterAll(() => {
    rmSync(repo, { recursive: true, force: true });
    rmSync(other, { recursive: true, force: true });
  });

  it("resolves a relative file: URL against the schema anchor's prisma/ dir", () => {
    const out = resolveDatabaseUrl("file:../db/custom.db", [repo]);
    expect(toPosix(out)).toBe(`file:${toPosix(path.join(repo, "db", "custom.db"))}`);
  });

  it("picks the FIRST anchor that contains prisma/schema.prisma", () => {
    const out = resolveDatabaseUrl("file:../db/custom.db", [other, repo]);
    expect(toPosix(out)).toBe(`file:${toPosix(path.join(repo, "db", "custom.db"))}`);
  });

  it("falls back to the last anchor when no anchor carries a schema", () => {
    const out = resolveDatabaseUrl("file:../db/custom.db", [other]);
    // Behaves like today's CWD rule: resolve against <anchor>/prisma.
    expect(toPosix(out)).toBe(`file:${toPosix(path.join(other, "prisma", "..", "db", "custom.db"))}`);
  });

  it("defaults to <anchor>/db/custom.db when the env value is missing", () => {
    const out = resolveDatabaseUrl(undefined, [repo]);
    expect(toPosix(out)).toBe(`file:${toPosix(path.join(repo, "db", "custom.db"))}`);
  });

  it("defaults to <anchor>/db/custom.db when the env value is blank/whitespace", () => {
    expect(toPosix(resolveDatabaseUrl("   ", [repo]))).toBe(
      `file:${toPosix(path.join(repo, "db", "custom.db"))}`,
    );
  });

  it("passes absolute POSIX file: URLs through untouched", () => {
    expect(resolveDatabaseUrl("file:/var/data/prod.db", [repo])).toBe("file:/var/data/prod.db");
  });

  it("corrects a Next-dev pre-resolved absolute URL that misses the real file", () => {
    // Regression (observed live): Next.js dev pre-resolves the relative
    // DATABASE_URL against the PROJECT dir — one level off the schema
    // anchor — and injects that absolute value before any app code runs.
    // When the injected target does not exist but the schema-anchored
    // default DOES, the default wins.
    writeFileSync(path.join(repo, "db", "custom.db"), "");
    try {
      const wrong = path.resolve(repo, "..", "db", "custom.db");
      const out = resolveDatabaseUrl(`file:${wrong}`, [repo]);
      expect(toPosix(out)).toBe(`file:${toPosix(path.join(repo, "db", "custom.db"))}`);
    } finally {
      rmSync(path.join(repo, "db", "custom.db"), { force: true });
    }
  });

  it("passes absolute Windows drive-letter file: URLs through untouched", () => {
    expect(resolveDatabaseUrl("file:C:\\data\\prod.db", [repo])).toBe("file:C:\\data\\prod.db");
  });

  it("passes non-SQLite URLs through untouched", () => {
    const pg = "postgresql://user:pass@localhost:5432/app";
    expect(resolveDatabaseUrl(pg, [repo])).toBe(pg);
  });

  it("trims surrounding whitespace from the env value", () => {
    const out = resolveDatabaseUrl("  file:../db/custom.db  ", [repo]);
    expect(toPosix(out)).toBe(`file:${toPosix(path.join(repo, "db", "custom.db"))}`);
  });

  it("treats file:./dev.db as relative to the schema anchor's prisma/ dir", () => {
    const out = resolveDatabaseUrl("file:./dev.db", [repo]);
    expect(toPosix(out)).toBe(`file:${toPosix(path.join(repo, "prisma", "dev.db"))}`);
  });
});

describe("standaloneRepoRoot (the Next standalone chdir trap)", () => {
  // The standalone server.js runs process.chdir(__dirname) into
  // <repo>/.next/standalone before any module executes, and the tracer
  // copies prisma/schema.prisma into that folder — the plain CWD rule would
  // resolve against the BUILD OUTPUT. The detector must recognize that
  // folder and return the real repo two levels up.
  let repo: string;
  let standalone: string;
  let deployed: string;

  beforeAll(() => {
    repo = mkdtempSync(path.join(tmpdir(), "dbpath-std-repo-"));
    mkdirSync(path.join(repo, "prisma"));
    writeFileSync(path.join(repo, "prisma", "schema.prisma"), "// x");
    standalone = path.join(repo, ".next", "standalone");
    mkdirSync(standalone, { recursive: true });
    writeFileSync(path.join(standalone, "server.js"), "// next standalone");
    mkdirSync(path.join(standalone, "prisma"));
    writeFileSync(path.join(standalone, "prisma", "schema.prisma"), "// traced copy");
    // A standalone copy deployed elsewhere: no repo above it.
    deployed = mkdtempSync(path.join(tmpdir(), "dbpath-deployed-"));
    mkdirSync(path.join(deployed, ".next", "standalone"), { recursive: true });
  });

  afterAll(() => {
    rmSync(repo, { recursive: true, force: true });
    rmSync(deployed, { recursive: true, force: true });
  });

  it("recognizes the in-repo standalone dir and returns the repo root", () => {
    expect(standaloneRepoRoot(standalone)).toBe(repo);
  });

  it("ignores a standalone dir with no repo above it (deployed copy)", () => {
    expect(standaloneRepoRoot(path.join(deployed, ".next", "standalone"))).toBeNull();
  });

  it("ignores plain directories that merely contain prisma/schema.prisma", () => {
    expect(standaloneRepoRoot(repo)).toBeNull();
    expect(standaloneRepoRoot("/tmp")).toBeNull();
  });

  it("resolution prefers the repo anchor over the standalone cwd copy", () => {
    // In the standalone context candidateRoots() yields the chunk-derived
    // anchor (no schema — skipped), then the detector's REPO root, then the
    // chdir'd standalone CWD. A relative URL resolved with the standalone
    // CWD would land in <standalone>/db (no such dir → SQLite error 14);
    // with this order it must land in <repo>/db.
    const out = resolveDatabaseUrl("file:../db/custom.db", [repo, standalone]);
    expect(toPosix(out)).toBe(`file:${toPosix(path.join(repo, "db", "custom.db"))}`);
  });
});

describe("the v3 hardening: the mangled sibling-db form", () => {
  it("prefers the schema-owning repo's db when Turbopack's mangled <elsewhere>/db/custom.db EXISTS", () => {
    // next dev pre-resolves .env's relative file: URL to
    // <project>/../db/custom.db and creates that stray file on boot; the
    // moment it exists, the old exists-fallback loses. The repo that owns
    // prisma/schema.prisma must win.
    const repo = mkRepo();
    const elsewhere = mkdtempSync(path.join(tmpdir(), "dbpath-stray-"));
    try {
      mkdirSync(path.join(elsewhere, "db"));
      writeFileSync(path.join(elsewhere, "db", "custom.db"), "stray");
      const out = resolveDatabaseUrl(
        `file:${path.join(elsewhere, "db", "custom.db")}`,
        [repo],
      );
      expect(toPosix(out)).toBe(`file:${toPosix(path.join(repo, "db", "custom.db"))}`);
    } finally {
      rmSync(elsewhere, { recursive: true, force: true });
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it("still passes through a genuinely deployed absolute URL", () => {
    const repo = mkRepo();
    try {
      const deployed = mkdtempSync(path.join(tmpdir(), "dbpath-prod-"));
      const target = path.join(deployed, "production.sqlite");
      writeFileSync(target, "prod");
      const out = resolveDatabaseUrl(`file:${target}`, [repo]);
      expect(toPosix(out)).toBe(`file:${toPosix(target)}`);
      rmSync(deployed, { recursive: true, force: true });
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it("keeps the original v2.3 rule: a missing absolute target falls back to the repo db", () => {
    const repo = mkRepo();
    try {
      const out = resolveDatabaseUrl("file:/nonexistent/nowhere/custom.db", [repo]);
      expect(toPosix(out)).toBe(`file:${toPosix(path.join(repo, "db", "custom.db"))}`);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });
});

/** A minimal repo fixture: <root>/prisma/schema.prisma + <root>/db. */
function mkRepo(): string {
  const repo = mkdtempSync(path.join(tmpdir(), "dbpath-repo-"));
  mkdirSync(path.join(repo, "prisma"));
  writeFileSync(path.join(repo, "prisma", "schema.prisma"), "// x");
  mkdirSync(path.join(repo, "db"));
  writeFileSync(path.join(repo, "db", "custom.db"), "repo");
  return repo;
}

describe("anchor validation", () => {
  it("the repo anchor layout used by the tests actually exists", () => {
    // Sanity for the fixture itself — guards against a broken test setup
    // silently testing the fallback path instead.
    const repo = mkdtempSync(path.join(tmpdir(), "dbpath-check-"));
    try {
      mkdirSync(path.join(repo, "prisma"));
      writeFileSync(path.join(repo, "prisma", "schema.prisma"), "// x");
      expect(existsSync(path.join(repo, "prisma", "schema.prisma"))).toBe(true);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });
});
