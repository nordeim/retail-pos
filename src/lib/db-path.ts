import { existsSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// SQLite URL resolution (v2.3, extracted from db.ts into a tested seam)
//
// Contract (pinned by tests/db-path.test.ts and documented in .env.example):
// a RELATIVE `file:` URL resolves against the first "anchor" directory that
// contains prisma/schema.prisma — exactly like the Prisma CLI, which anchors
// relative `file:` URLs against the schema file. `file:../db/custom.db`
// therefore points at <repo>/db/custom.db for `next dev`, `next build` and
// the standalone server alike, regardless of the process working directory.
//
// Anchor order (candidateRoots):
//   1. this module's own repo root (src/lib → ../../) — covers next dev
//      and next build, which execute modules from source. Guarded: bundlers
//      may rewrite or drop import.meta (the standalone build), in which
//      case this anchor is simply skipped.
//   2. the standalone build's repo root — Next's standalone server.js runs
//      `process.chdir(__dirname)` into <repo>/.next/standalone BEFORE any
//      module executes, and the file tracer copies prisma/schema.prisma
//      into that folder, so the plain CWD rule would resolve a relative
//      `file:` URL against the BUILD OUTPUT. When the CWD is that in-repo
//      standalone dir (detected by standaloneRepoRoot below), the real repo
//      two levels up takes precedence.
//   3. process.cwd() — the pre-v2.3 rule, kept as the fallback (a standalone
//      copy deployed elsewhere owns its own CWD; DEPLOYMENT.md §4 tells
//      production to use an absolute file: URL anyway).
//
// Absolute file: URLs (POSIX or Windows drive letters) and non-SQLite URLs
// (e.g. PostgreSQL in a hosted deploy) pass through untouched.
// ---------------------------------------------------------------------------

/** The documented fresh-checkout default: <repo>/db/custom.db. */
const DEFAULT_RELATIVE_DB = "../db/custom.db";

/**
 * Pure resolution rule. `anchors` are candidate repo roots, searched in
 * order for one that contains prisma/schema.prisma; the first hit wins, and
 * when none matches the LAST anchor is used (CWD-compatibility fallback).
 */
export function resolveDatabaseUrl(envUrl: string | undefined, anchors: string[]): string {
  const url = envUrl?.trim();
  const schemaRoot =
    anchors.find((root) => existsSync(path.join(root, "prisma", "schema.prisma"))) ??
    anchors[anchors.length - 1] ??
    process.cwd();

  if (!url) {
    return `file:${path.resolve(schemaRoot, "prisma", DEFAULT_RELATIVE_DB)}`;
  }
  if (/^file:/i.test(url)) {
    const raw = url.replace(/^file:/i, "");
    // Windows drive letters (file:C:\...) are absolute too.
    if (path.isAbsolute(raw) || /^[A-Za-z]:[\\/]/.test(raw)) {
      // Next.js dev (Turbopack) pre-resolves RELATIVE file: DATABASE_URLs
      // against the PROJECT directory and injects an absolute value one
      // level off from this module's schema-anchored contract (observed
      // live: .env "file:../db/custom.db" arrived as
      // "file:<project>/../db/custom.db"). Two guards:
      //   (a) the pre-resolved target does not exist but the documented
      //       default DOES — prefer the default (the original v2.3 rule);
      //   (b) HARDENING (v3): the pre-resolved target is the DEFAULT's name
      //       in a /db directory OUTSIDE this repo (the classic mangled
      //       form — <anything>/db/custom.db) while this repo owns the real
      //       <repo>/db/custom.db. Turbopack's mangling wins the existsSync
      //       check the moment the stray file is created (next dev creates
      //       it on boot), silently pointing the app at an EMPTY database.
      //       The repo that owns prisma/schema.prisma wins. A genuinely
      //       deployed absolute URL (production) names its own file outside
      //       a sibling /db directory and passes through untouched.
      const fallback = path.resolve(schemaRoot, "prisma", DEFAULT_RELATIVE_DB);
      const mangledForm =
        path.basename(raw) === path.basename(fallback) &&
        path.basename(path.dirname(raw)) === "db" &&
        path.dirname(raw) !== path.dirname(fallback);
      if (raw !== fallback && mangledForm && existsSync(fallback)) {
        return `file:${fallback}`;
      }
      if (!existsSync(raw) && existsSync(fallback)) {
        return `file:${fallback}`;
      }
      return `file:${raw}`;
    }
    return `file:${path.resolve(schemaRoot, "prisma", raw)}`;
  }
  return url;
}

/**
 * Detect "the CWD is a Next standalone build folder inside its repo" and
 * return the repo root (two levels up). Pure + fixture-testable: takes the
 * directory to inspect, uses real existence checks only.
 *
 * Signals: the dir is literally named "standalone", carries the standalone
 * server.js, AND the grandparent owns prisma/schema.prisma — a standalone
 * copy deployed elsewhere (no repo above it) does NOT match and keeps the
 * plain CWD rule.
 */
export function standaloneRepoRoot(dir: string): string | null {
  if (path.basename(dir) !== "standalone") return null;
  if (!existsSync(path.join(dir, "server.js"))) return null;
  if (!existsSync(path.join(dir, "..", "..", "prisma", "schema.prisma"))) return null;
  return path.resolve(dir, "..", "..");
}

/** Candidate repo roots for the running process (see module comment). */
export function candidateRoots(): string[] {
  const roots: string[] = [];
  // 1. The standalone repo root comes FIRST: the bundled module's
  //    import.meta.url is rewritten into <standalone>/src/lib/db-path.ts —
  //    a virtual path that exists only in the chunk map — so the module
  //    anchor cannot be trusted in that context and must not outrank the
  //    detector.
  const standaloneRoot = standaloneRepoRoot(process.cwd());
  if (standaloneRoot) roots.push(standaloneRoot);
  try {
    // 2. This module's own repo root (src/lib → ../../) — covers next dev
    //    and next build, which execute modules from source. Validated by
    //    the source file existing on disk: the standalone runtime's virtual
    //    mapping fails this check and is skipped.
    const self = new URL(import.meta.url).pathname;
    const here = path.dirname(self);
    if (here && existsSync(self)) roots.push(path.resolve(here, "..", ".."));
  } catch {
    // import.meta unavailable in this context — remaining anchors apply.
  }
  // 3. The process CWD — the pre-v2.3 rule, kept as the fallback.
  roots.push(process.cwd());
  return roots;
}

/** Resolve DATABASE_URL for the running process (the db.ts entry point). */
export function resolveProcessDatabaseUrl(): string {
  return resolveDatabaseUrl(process.env.DATABASE_URL, candidateRoots());
}
