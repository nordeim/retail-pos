// S30 dependency-security audit — the standing advisory probe.
//
// `bun audit` reports security advisories for the installed tree; bun
// 1.3.14 has no JSON reporter, so this runner captures the text output and
// hands it to the PURE seam (../src/lib/dep-audit.ts — parser/classifier/
// envelope, unit-pinned by tests/dep-audit.test.ts). The classification
// ground truth is the PRODUCTION STANDALONE TRACE: a package that does not
// ship in .next/standalone/node_modules cannot be reached by a deployed
// request, so its advisory is documented as NON-PRODUCTION (dev or CLI
// surface, with the evidence); anything IN the trace FAILS loudly (non-zero
// exit). A probe must never normalize a genuine finding away.
//
// Run with BUN (the prisma/seed.ts precedent — plain node cannot import
// the TypeScript seam):
//   bun scripts/dep-audit.mjs
//
// S27 self-verifying precondition: the standalone trace must EXIST and be
// NEWER than bun.lock — a missing or stale trace would misclassify (a
// newly-added runtime dependency would read as non-production). Missing or
// stale → stderr message + exit 1 + NO findings (a probe that cannot
// verify its own ground truth must never emit findings that look like
// findings).
import { spawnSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildDepAuditEnvelope,
  parseBunAuditOutput,
} from "../src/lib/dep-audit.ts";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const TRACE_DIR = join(REPO, ".next", "standalone", "node_modules");
const LOCKFILE = join(REPO, "bun.lock");

function fail(message) {
  console.error(`DEP-AUDIT PRECONDITION FAILED: ${message}`);
  process.exit(1);
}

// --- Precondition 1: the standalone trace exists (bun run build first) ---
if (!existsSync(TRACE_DIR)) {
  fail(
    "the production standalone trace (.next/standalone/node_modules) does " +
      "not exist — run `bun run build` first. The trace is the " +
      "reachability ground truth; without it the audit refuses to classify.",
  );
}

// --- Precondition 2: the trace is newer than bun.lock (not stale) -------
const traceMtime = statSync(TRACE_DIR).mtimeMs;
const lockMtime = existsSync(LOCKFILE) ? statSync(LOCKFILE).mtimeMs : 0;
if (lockMtime > traceMtime) {
  fail(
    "the standalone trace is older than bun.lock — the dependency tree " +
      "changed after the last build, so reachability classification would " +
      "be stale. Run `bun run build` and re-run the audit.",
  );
}

// --- Gather the classification context ----------------------------------
// Runtime module roots: top-level entries in the trace, with scoped pairs
// expanded ("@prisma" dir → "@prisma/client", "@prisma/config", …).
const runtimeModules = [];
for (const entry of readdirSync(TRACE_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    runtimeModules.push(entry.name);
    continue;
  }
  if (entry.name.startsWith("@")) {
    for (const sub of readdirSync(join(TRACE_DIR, entry.name), {
      withFileTypes: true,
    })) {
      runtimeModules.push(`${entry.name}/${sub.name}`);
    }
  } else {
    runtimeModules.push(entry.name);
  }
}

const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8"));

const ctx = {
  runtimeModules,
  prodDependencies: Object.keys(pkg.dependencies ?? {}),
  devDependencies: Object.keys(pkg.devDependencies ?? {}),
};

// --- Run bun audit (informational exit code; parse the text) -------------
const audit = spawnSync("bun", ["audit"], {
  cwd: REPO,
  encoding: "utf8",
  maxBuffer: 16 * 1024 * 1024,
});
const auditText = `${audit.stdout ?? ""}\n${audit.stderr ?? ""}`;
const advisories = parseBunAuditOutput(auditText);

// --- Classify + emit the self-describing envelope ------------------------
const envelope = buildDepAuditEnvelope(
  advisories,
  ctx,
  new Date().toISOString(),
);
console.log(JSON.stringify(envelope, null, 1));

if (envelope.runtimeFindings.length > 0) {
  console.error(
    `DEP-AUDIT FAIL: ${envelope.runtimeFindings.length} runtime-reachable ` +
      `advisory(ies) — fix or override the dependency before deploying.`,
  );
  process.exit(1);
}
