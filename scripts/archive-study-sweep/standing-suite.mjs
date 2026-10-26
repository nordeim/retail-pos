// S32 standing-suite orchestrator — ONE command for the whole standing audit
// suite. Run with BUN (imports the TS seam, the dep-audit.mjs /
// dev-server-preflight.mjs precedent):
//
//   bun scripts/standing-suite.mjs
//
// Stages (the documented S31 order), each spawned EXACTLY ONCE with its
// stdout classified through the unit-pinned seam src/lib/suite-verdict.ts:
//
//   0. dev-server-preflight  (the S31 convention, ENFORCED: abort the suite
//      loudly on any non-green verdict, remedy included — the boot-stability
//      precondition is executable, not advisory)
//   1-23. security, settings-roundtrip, connectivity, upload-edge,
//      data-volume, forced-colors, print, focus-order, mobile-sweep,
//      midband-sweep, landscape-sweep, dark-mobile-sweep, accent-light-sweep,
//      accent-midband-sweep, accent-landscape-sweep, accent-desktop-sweep,
//      dark-sweep, accent-dark-sweep, cwv, ai-error, ai-a11y, pre15-preflight,
//      dep-audit
//      (the light-mode mobile family, then the light-mode mid-band family,
//      then the light-mode phone-landscape family, then the DARK-mode mobile
//      family, then the LIGHT-mode accent family at 390, then the LIGHT-mode
//      accent family at the mid-band 768 — the vehicle — the S39 stage, then
//      the LIGHT-mode accent family at the landscape 844×390 — the vehicle at
//      the short viewport — the S40 stage, then the LIGHT-mode accent family
//      at the desktop 1280×800 — the SIDEBAR vehicle — the S41 stage, then
//      the volume family: the DARK-mode data-volume × accent stress — the
//      S42 stage — then its LIGHT sibling — the S43 stage, then the DARK
//      half at the MOBILE viewport — the S44 stage (the drawer vehicle under
//      the 300/200/250 profile at 390×844), then its LIGHT sibling at the
//      SAME MOBILE viewport — the S45 stage (the volume family at the four
//      mobile/desktop halves), then the DARK half at the MID-BAND viewport
//      — the S46 stage (the drawer vehicle under the 300/200/250 profile at
//      768×1024 — the S45 summary's first named next candidate, the dark
//      half first), then its LIGHT sibling at the SAME MID-BAND viewport
//      — the S47 stage (the S47 mirror: the drawer vehicle under the
//      300/200/250 profile at 768×1024 in light, the THREE light
//      exemptions), then the DARK half at the LANDSCAPE viewport
//      — the S48 stage (the drawer vehicle under the 300/200/250 profile
//      at 844×390 in dark — the S47 summary's named next candidate, the
//      LAST viewport band, the dark half first; the light mirror is the
//      documented S49 candidate), then the LIGHT sibling at the SAME
//      LANDSCAPE viewport — the S49 stage (the S49 mirror: the drawer
//      vehicle under the 300/200/250 profile at 844×390 in light, the THREE
//      light exemptions — completing the volume × theme × viewport
//      cross-axis's last band), then the DARK × landscape × SEED sweep for
//      the 13 volume-invariant views — the S50 stage (the S46 plan's
//      carried note + the S49 plan's own non-gap entry: the 13 views that
//      render no task/note/event rows had never been rendered in dark at
//      844×390 under any accent — the drawer vehicle at seed volume with
//      the dark checker), then the dark-mode desktop families —
//      the S37/S39/S40/S41 order, then the CWV × volume stress — the S51
//      stage (the RUM-beacon cross-axis: the beacon's five field metrics
//      under the 300/200/250 profile on the 7 volume-affected views at
//      390×844 under the Lighthouse throttle against the :3200 standalone,
//      right after its seed-volume cwv sibling — the S16 audit runs
//      login+dashboard at seed; the S13 volume audit never read LCP/CLS/
//      FCP; the S42–S49 volume sweeps observe longtask entries ONLY)
//   33. the demo-theme closing guard (light/violet via Prisma — a mid-suite
//      crash must not leave the demo user dark/teal, the documented
//      poisoning class)
//
// CWV's :3200 precondition is executable: the runner probes
// :3200/api/health; if dead and the standalone build exists it starts one
// itself (ephemeral AUTH_SECRET — the S22 boot-guard satisfied; the
// documented db convention), and stops what it started at suite end.
//
// Output: one table (STAGE | VERDICT | FINDINGS | NOTE) + one JSON envelope
// to stdout; per-stage raw envelopes under /tmp/standing-suite/; exit 0 iff
// the suite is green. The single-run-per-audit design makes the S29/S31/S65
// double-run phantom impossible by construction.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { classifyAudit, parseAuditStdout, suiteVerdict } from "../src/lib/suite-verdict.ts";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAW_DIR = "/tmp/standing-suite";
const CWV_PORT = 3200;

// The documented S31 sequence. dep-audit + the preflight run under BUN (they
// import TS seams); the rest run under node (their documented invocation).
const STAGES = [
  { name: "security", file: "scripts/security-audit.mjs", runtime: "node" },
  { name: "settings-roundtrip", file: "scripts/settings-roundtrip-audit.mjs", runtime: "node" },
  { name: "connectivity", file: "scripts/connectivity-audit.mjs", runtime: "node" },
  { name: "upload-edge", file: "scripts/upload-edge-audit.mjs", runtime: "node" },
  { name: "data-volume", file: "scripts/data-volume-audit.mjs", runtime: "node" },
  { name: "forced-colors", file: "scripts/forced-colors-sweep.mjs", runtime: "node" },
  { name: "print", file: "scripts/print-audit.mjs", runtime: "node" },
  { name: "focus-order", file: "scripts/focus-order-audit.mjs", runtime: "node" },
  { name: "mobile-sweep", file: "scripts/mobile-sweep.mjs", runtime: "node" },
  { name: "midband-sweep", file: "scripts/midband-sweep.mjs", runtime: "node" },
  { name: "landscape-sweep", file: "scripts/landscape-sweep.mjs", runtime: "node" },
  { name: "dark-mobile-sweep", file: "scripts/dark-mobile-sweep.mjs", runtime: "node" },
  { name: "accent-light-sweep", file: "scripts/accent-light-sweep.mjs", runtime: "node" },
  { name: "accent-midband-sweep", file: "scripts/accent-midband-sweep.mjs", runtime: "node", timeoutMs: 20 * 60_000 }, // S39: 7 accents × 20 drawer-navigated views + the drawer record ≈ 9-12 min measured; the default 10-min budget would SIGKILL it (exit 124 — the S38-C lesson)
  { name: "accent-landscape-sweep", file: "scripts/accent-landscape-sweep.mjs", runtime: "node", timeoutMs: 20 * 60_000 }, // S40: 7 accents × 20 drawer-navigated views at 844×390 + the short-viewport contract + the drawer record ≈ 9-12 min measured; the default 10-min budget would SIGKILL it (exit 124 — the S38-C/S39 lesson)
  { name: "accent-desktop-sweep", file: "scripts/accent-desktop-sweep.mjs", runtime: "node", timeoutMs: 20 * 60_000 }, // S41: 7 accents × 20 sidebar-navigated views at 1280×800 + the sidebar-own scroll contract + the sidebar record ≈ 8-11 min measured; the default 10-min budget would SIGKILL it (exit 124 — the S38-C/S39/S40 lesson)
  { name: "dark-sweep", file: "scripts/dark-sweep.mjs", runtime: "node" },
  { name: "accent-dark-sweep", file: "scripts/accent-dark-sweep.mjs", runtime: "node", timeoutMs: 25 * 60_000 }, // S38: the mobile 20-view matrix — 7 accents × (20 desktop + 20 mobile + the drawer) ≈ 17–18 min measured; the default 10-min budget would SIGKILL it mid-sweep (exit 124)
  { name: "accent-volume-sweep", file: "scripts/accent-volume-sweep.mjs", runtime: "node", timeoutMs: 25 * 60_000 }, // S42: the data-volume × dark × accent stress — 7 accents × the 7 volume views under the 300/200/250 profile (the Prisma insert + the volume checker over 4000–8000-node DOMs) ≈ 10–15 min measured; the default 10-min budget would SIGKILL it (exit 124 — the S38-C/S39/S40/S41 lesson)
  { name: "accent-volume-light-sweep", file: "scripts/accent-volume-light-sweep.mjs", runtime: "node", timeoutMs: 25 * 60_000 }, // S43: the data-volume × LIGHT × accent stress — the S42 dark half's light sibling (the documented bracketed non-gap, now closed): 7 accents × the 7 volume views under the same COUNT-verified 300/200/250 profile at 1280×800 in light, navigated through the sidebar ≈ 10–15 min expected (the S42 dark half measured ~2.6 min); the default 10-min budget would SIGKILL it (exit 124 — the S38-C/S39/S40/S41/S42 lesson)
  { name: "accent-volume-dark-mobile-sweep", file: "scripts/accent-volume-dark-mobile-sweep.mjs", runtime: "node", timeoutMs: 25 * 60_000 }, // S44: the dark × mobile × volume stress — the S13 profile at 390×844 navigated through the drawer (the volume family together: dark desktop, light desktop, then dark mobile; the drawer open/close adds ~1s per view over the S42 desktop half's ~2.6 min); the default 10-min budget would SIGKILL it (exit 124 — the S38-C/S39/S40/S41/S42/S43 lesson)
  { name: "accent-volume-light-mobile-sweep", file: "scripts/accent-volume-light-mobile-sweep.mjs", runtime: "node", timeoutMs: 25 * 60_000 }, // S45: the light × mobile × volume stress — the S44 dark half's light sibling at the SAME 390×844 cell (the documented bracketed non-gap, now closed): 7 accents × the 7 volume views under the COUNT-verified 300/200/250 profile in LIGHT, navigated through the drawer, with the S43 light checker (the THREE signature-strict light exemptions — the CTA-face + the calendar adjacent-day + the yellow priority-pill) + the light-mode hydration gate + the shell-presence guard from birth; the S44 dark half measured ~2.9 min; the default 10-min budget would SIGKILL it (exit 124 — the S38-C/S39/S40/S41/S42/S43/S44 lesson)
  { name: "accent-volume-dark-midband-sweep", file: "scripts/accent-volume-dark-midband-sweep.mjs", runtime: "node", timeoutMs: 25 * 60_000 }, // S46: the dark × mid-band × volume stress — the S45 summary's first named next candidate (the mid-band/landscape × volume cells, the dark half first: the S42→S43 / S44→S45 family pattern): 7 accents × the 7 volume views under the COUNT-verified 300/200/250 profile at 768×1024 in DARK, navigated through the drawer (the only vehicle below 1024), with the S42/S44 dark checker (flashbulbs always findings; the CTA-face exemption ONLY) + the drawer-own nav-scroll contract at the mid-band geometry (scrollHeight ~1068 vs the ~935px nav area at 1024 height — measured) + the shell-presence guard from birth; the S44/S45 mobile halves measured ~2.9 min; the default 10-min budget would SIGKILL it (exit 124 — the S38-C/S39/S40/S41/S42/S43/S44/S45 lesson)
  { name: "accent-volume-light-midband-sweep", file: "scripts/accent-volume-light-midband-sweep.mjs", runtime: "node", timeoutMs: 25 * 60_000 }, // S47: the light × mid-band × volume stress — the S46 summary's own first named next candidate (the S47 mirror — the S42→S43 / S44→S45 / S46→S47 family pattern): 7 accents × the 7 volume views under the COUNT-verified 300/200/250 profile at 768×1024 in LIGHT, navigated through the drawer (the only vehicle below 1024), with the S43/S45 light checker (NO flashbulbs — the class exists only in dark; the THREE signature-strict light exemptions: the CTA-face + the calendar adjacent-day + the yellow priority-pill) + the light-mode hydration gate (the greeting heading — the S43/S45 lesson: !html.dark is TRUE at first paint) + the drawer-own nav-scroll contract at the mid-band geometry + the shell-presence guard from birth; the S44/S45 mobile halves and the S46 dark mid-band half measured ~2.9–3.0 min; the default 10-min budget would SIGKILL it (exit 124 — the S38-C/S39/S40/S41/S42/S43/S44/S45/S46 lesson)
  { name: "accent-volume-dark-landscape-sweep", file: "scripts/accent-volume-dark-landscape-sweep.mjs", runtime: "node", timeoutMs: 25 * 60_000 }, // S48: the dark × landscape × volume stress — the S47 summary's own named next candidate (the landscape × volume cells, the dark half first: the S42→S43 / S44→S45 / S46→S47 / S48→S49 family pattern — the LAST viewport band): 7 accents × the 7 volume views under the COUNT-verified 300/200/250 profile at 844×390 in DARK, navigated through the drawer (the only vehicle below 1024), with the S42/S44/S46 dark checker (flashbulbs always findings; the CTA-face exemption ONLY) + the drawer-own nav-scroll contract at the LANDSCAPE geometry (scrollHeight ~1068 vs the ~301px nav area at 390 height — links ~8–20 below the fold, measured) + the shell-presence guard from birth (the S47 initial-gate field correction folded in); the S44–S47 volume halves measured ~2.9–3.0 min; the default 10-min budget would SIGKILL it (exit 124 — the S38-C/S39/S40/S41/S42/S43/S44/S45/S46/S47 lesson)
  { name: "accent-volume-light-landscape-sweep", file: "scripts/accent-volume-light-landscape-sweep.mjs", runtime: "node", timeoutMs: 25 * 60_000 }, // S49: the light × landscape × volume stress — the S48 summary's own named next candidate (the S49 mirror, completing the volume × theme × viewport cross-axis's last band): 7 accents × the 7 volume views under the COUNT-verified 300/200/250 profile at 844×390 in LIGHT, navigated through the drawer (the only vehicle below 1024), with the S43/S45/S47 light checker (NO flashbulbs — the class exists only in dark; the THREE signature-strict light exemptions: the CTA-face + the calendar adjacent-day + the yellow priority-pill) + the light-mode hydration gate (the greeting heading — the S43/S45/S47 lesson: !html.dark is TRUE at first paint) + the drawer-own nav-scroll contract at the LANDSCAPE geometry (scrollHeight ~1068 vs the ~301px nav area at 390 height — links ~8–20 below the fold, measured) + the shell-presence guard from birth (the AP-90 lesson applied to the landscape vehicle); the S44–S48 volume halves measured ~2.9–3.0 min; the default 10-min budget would SIGKILL it (exit 124 — the S38-C/S39/S40/S41/S42/S43/S44/S45/S46/S47/S48 lesson)
  { name: "accent-dark-landscape-seed-sweep", file: "scripts/accent-dark-landscape-seed-sweep.mjs", runtime: "node", timeoutMs: 20 * 60_000 }, // S50: the dark × landscape × SEED sweep for the 13 volume-invariant views — the S46 plan's carried note + the S49 plan's own non-gap entry (the views that render no task/note/event rows had never been rendered in dark at 844×390 under any accent): 7 accents × the 13 views at SEED volume in DARK, navigated through the drawer (the only vehicle below 1024), with the S42/S44/S46/S48 dark checker (flashbulbs always findings; the CTA-face exemption ONLY) + the drawer-own nav-scroll contract at the LANDSCAPE geometry + the shell-presence guard from birth (the AP-90 lesson) + the drawer link census (linkCount === 20 — the full NAV even though only 13 are navigated); the S40 20-view light sweep measured 9–12 min with this same 20-min budget; 13 views ≈ 6–8 min expected
  { name: "cwv", file: "scripts/cwv-audit-s16.mjs", runtime: "node" },
  { name: "cwv-volume-stress", file: "scripts/cwv-volume-stress.mjs", runtime: "node", timeoutMs: 15 * 60_000 }, // S51: the CWV × volume stress — the RUM-beacon cross-axis (the beacon's five field metrics under the COUNT-verified 300/200/250 profile on the 7 volume-affected views at 390×844 under the Lighthouse throttle, against the :3200 standalone this runner already ensures) ≈ 5–7 min measured (14 throttled mobile loads + the volume lifecycle + the INP proxy); the 15-min budget holds ~2.5× headroom for the throttle variance
  { name: "ai-error", file: "scripts/ai-error-audit.mjs", runtime: "node" },
  { name: "ai-a11y", file: "scripts/ai-a11y-audit.mjs", runtime: "node" },
  { name: "pre15-preflight", file: "scripts/pre15-preflight.mjs", runtime: "node" },
  { name: "dep-audit", file: "scripts/dep-audit.mjs", runtime: "bun" },
];

const STAGE_TIMEOUT_MS = 10 * 60_000;
const SETTLE_MS = 500;

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function run(cmd, args, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd: REPO, env: { ...process.env } });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      resolve({ code: 124, stdout, stderr: `${stderr}\n[standing-suite] timed out after ${timeoutMs} ms` });
    }, timeoutMs);
    child.stdout.on("data", (c) => (stdout += c));
    child.stderr.on("data", (c) => (stderr += c));
    child.on("error", (e) => {
      clearTimeout(timer);
      resolve({ code: 127, stdout, stderr: String(e) });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

async function health(base, timeoutMs = 4000) {
  try {
    const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(timeoutMs) });
    return res.status === 200;
  } catch {
    return false;
  }
}

// --- the :3200 standalone precondition (executable, the S31 spirit) --------

async function ensureStandalone() {
  if (await health(`http://localhost:${CWV_PORT}`)) return { ok: true, startedHere: false };
  const serverJs = join(REPO, ".next/standalone/server.js");
  if (!existsSync(serverJs)) {
    return { ok: false, error: "the standalone build is missing — run `bun run build` first (required before e2e/CWV)" };
  }
  const AUTH_SECRET = randomBytes(32).toString("hex"); // ephemeral per suite run — the S22 boot-guard satisfied
  const child = spawn("node", [serverJs], {
    cwd: join(REPO, ".next/standalone"),
    env: {
      ...process.env,
      PORT: String(CWV_PORT),
      HOSTNAME: "127.0.0.1",
      DATABASE_URL: "file:../db/custom.db",
      AUTH_SECRET,
    },
    stdio: "ignore",
    detached: false,
  });
  for (let i = 0; i < 40; i += 1) {
    await new Promise((r) => setTimeout(r, 500));
    if (await health(`http://localhost:${CWV_PORT}`, 2000)) return { ok: true, startedHere: true, pid: child.pid };
    if (child.exitCode !== null) break;
  }
  child.kill("SIGKILL");
  return { ok: false, error: "the standalone server on :3200 failed to become healthy (boot guard? build stale?)" };
}

// --- the stages ---------------------------------------------------------------

async function runAuditStage(spec) {
  const { code, stdout, stderr } = await run(spec.runtime, [join(REPO, spec.file)], spec.timeoutMs ?? STAGE_TIMEOUT_MS);
  writeFileSync(join(RAW_DIR, `${spec.name}.json`), stdout);
  if (code !== 0) {
    return {
      name: spec.name,
      verdict: { green: false, findings: 0, note: `stage exited ${code} — ${stderr.trim().split("\n").slice(-2).join(" ").slice(0, 160)}` },
      code,
    };
  }
  const parsed = parseAuditStdout(stdout);
  if (!parsed.ok) {
    return { name: spec.name, verdict: { green: false, findings: 0, note: `stdout did not parse: ${parsed.error}` }, code };
  }
  return { name: spec.name, verdict: classifyAudit(spec.name, parsed.json), code };
}

async function themeGuard() {
  // The audit-script pattern (ai-error-audit.mjs): the datasources URL is
  // schema-anchored — run from the repo root.
  const prisma = new PrismaClient({ datasources: { db: { url: "file:../db/custom.db" } } });
  try {
    const u = await prisma.user.findUnique({
      where: { email: "demo@studyflow.app" },
      select: { themeMode: true, accentColor: true },
    });
    if (!u) {
      return { name: "theme-restore", verdict: { green: false, findings: 1, note: "demo user not found — seed first (bun run db:seed)" } };
    }
    const okTheme = u.themeMode === "light" && u.accentColor === "violet";
    return {
      name: "theme-restore",
      verdict: {
        green: okTheme,
        findings: okTheme ? 0 : 1,
        note: `demo theme = ${u.themeMode}/${u.accentColor} (expected light/violet — a mid-suite crash must not leave the demo user mutated)`,
      },
    };
  } finally {
    await prisma.$disconnect();
  }
}

// --- main ------------------------------------------------------------------------

mkdirSync(RAW_DIR, { recursive: true });
const ranAt = new Date().toISOString();
const rows = [];
let standalone = null;
let aborted = false;
let cwvPreconditionFailed = false;

try {
  // Stage 0 — the S31 preflight FIRST, enforced (the suite never starts on an
  // unstable boot; the remedy rides the verdict).
  log(`[standing-suite] stage 0/33 — dev-server-preflight (the S31 boot-stability precondition)`);
  const pre = await run("bun", [join(REPO, "scripts/dev-server-preflight.mjs")], 90_000);
  writeFileSync(join(RAW_DIR, "dev-server-preflight.json"), pre.stdout);
  const preParsed = parseAuditStdout(pre.stdout);
  const preVerdict = preParsed.ok
    ? classifyAudit("dev-server-preflight", preParsed.json)
    : { green: false, findings: 1, note: `preflight output did not parse: ${preParsed.error}` };
  rows.push({ name: "dev-server-preflight", verdict: preVerdict });
  if (!preVerdict.green) {
    log(`[standing-suite] ABORTED before any audit — dev-server preflight not green.\n  remedy: ${preVerdict.note}`);
    aborted = true;
  }

  if (!aborted) {
    // The CWV standalone precondition (before the audits, so a missing build
    // is loud BEFORE half the suite has run; a failed precondition records
    // the loud cwv row and skips spawning that stage).
    const sa = await ensureStandalone();
    if (!sa.ok) {
      cwvPreconditionFailed = true;
      rows.push({ name: "cwv", verdict: { green: false, findings: 0, note: `shape not recognized — ${sa.error}` } });
    } else {
      standalone = { startedHere: sa.startedHere, pid: sa.pid };
    }

    for (let i = 0; i < STAGES.length; i += 1) {
      const spec = STAGES[i];
      if (spec.name === "cwv" && cwvPreconditionFailed) {
        log(`[standing-suite] stage ${i + 1}/33 — cwv SKIPPED (standalone precondition failed — the loud row is already recorded)`);
        continue;
      }
      log(`[standing-suite] stage ${i + 1}/33 — ${spec.name}`);
      const r = await runAuditStage(spec);
      rows.push({ name: r.name, verdict: r.verdict });
      await new Promise((res) => setTimeout(res, SETTLE_MS));
    }

    // The closing guard.
    log(`[standing-suite] stage 33/33 — theme-restore (the demo-theme closing guard)`);
    rows.push(await themeGuard());
  }
} finally {
  if (standalone && standalone.startedHere && standalone.pid) {
    try {
      process.kill(standalone.pid, "SIGKILL");
      log(`[standing-suite] stopped the standalone :3200 server it started (pid ${standalone.pid})`);
    } catch {
      /* already gone */
    }
  }
}

const agg = suiteVerdict(rows);
const envelope = {
  ranAt,
  source: "standing-suite",
  stages: rows.map((r) => ({ name: r.name, green: r.verdict.green, findings: r.verdict.findings, note: r.verdict.note })),
  rawDir: RAW_DIR,
  standalone: standalone ? { startedHere: standalone.startedHere } : null,
  aborted,
  ...agg,
};

log("");
log("STAGE                    | VERDICT | FINDINGS | NOTE");
log("-------------------------+---------+----------+-----------------------------------------------");
for (const r of rows) {
  const verdict = r.verdict.green ? "GREEN  " : "FAIL   ";
  log(`${r.name.padEnd(25)}| ${verdict} | ${String(r.verdict.findings).padEnd(8)} | ${r.verdict.note.slice(0, 110)}`);
}
log("");
log(JSON.stringify(envelope, null, 1));
log(`\nSTANDING SUITE: ${agg.green ? "GREEN" : "NOT GREEN"} — ${agg.summary}`);
process.exit(agg.green ? 0 : 1);
