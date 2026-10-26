// S31 dev-server boot-stability preflight — the standing loud-diagnosis probe.
//
// The browser-context audits (connectivity, security, settings-roundtrip,
// capture-studyflow, …) assume a hydrated, navigation-stable dev server as
// a PRECONDITION. A stale Turbopack `.next/dev` cache can put a route into
// a sustained full-page reload loop (captured session-31: 17+ main-frame
// navigations per 15 s on /login; React never hydrates) — and the loop
// SURVIVES a daemon restart (the S9 lesson's remedy is insufficient; only
// `rm -rf .next/dev` clears it). Under that state the audits fail OPAQUELY
// (a 30 s click timeout naming the disabled button, not the cache).
//
// This preflight measures the two boot-stability signals and classifies
// them through the PURE seam (../src/lib/dev-preflight.ts — unit-pinned by
// tests/dev-preflight.test.ts):
//   1. navigation stability — main-frame same-path navigations counted in
//      an 8 s window AFTER the load event (healthy: 0; the loop: ~1/s);
//   2. hydration — fill both login fields, wait for the submit button to
//      enable (SSR renders it `disabled={busy || !email || !password}`;
//      only hydrated React + landed input events can enable it). The form
//      is NEVER submitted — zero login requests, zero rate-limit budget.
//
// Run with BUN (the prisma/seed.ts + dep-audit.mjs precedent — plain node
// cannot import the TypeScript seam):
//   bun scripts/dev-server-preflight.mjs
//   PREFLIGHT_BASE=http://localhost:3000 bun scripts/dev-server-preflight.mjs
//
// Exit 0 iff the verdict is GREEN (the S27 doctrine: loud failures,
// self-describing output — the envelope rides stdout, the verdict's remedy
// names the exact fix for its class).
import { chromium } from "playwright";
import { classifyBootStability } from "../src/lib/dev-preflight.ts";

const BASE = process.env.PREFLIGHT_BASE ?? "http://localhost:3000";
const PATH = "/login";

// The fixed post-load navigation-count window (ms) and the hydration wait
// budget (ms).
const NAV_WINDOW_MS = 8_000;
const HYDRATION_TIMEOUT_MS = 10_000;

const envelope = {
  ranAt: new Date().toISOString(),
  source: "dev-server-preflight",
  base: BASE,
  path: PATH,
  navigations: 0,
  hydrated: false,
  reachable: false,
};

const browser = await chromium.launch();

try {
  const context = await browser.newContext();
  const page = await context.newPage();

  // --- Signal 0: reachability (a dead server is its own class) -------------
  try {
    await page.goto(`${BASE}${PATH}`, { waitUntil: "load", timeout: 10_000 });
    envelope.reachable = true;
  } catch {
    envelope.reachable = false;
  }

  if (envelope.reachable) {
    // --- Signal 1: navigation stability (same-path main-frame navs) -------
    let navCount = 0;
    const navListener = (frame) => {
      if (frame === page.mainFrame()) {
        try {
          const u = new URL(frame.url());
          if (u.pathname === PATH) navCount += 1;
        } catch {
          // about:blank / transient URLs during a reload burst — count the
          // event itself (the burst is the signal).
          navCount += 1;
        }
      }
    };
    page.on("framenavigated", navListener);
    await page.waitForTimeout(NAV_WINDOW_MS);
    page.off("framenavigated", navListener);
    envelope.navigations = navCount;

    // --- Signal 2: hydration (fill → the submit button enables) -----------
    try {
      await page.fill("input[type=email]", "demo@studyflow.app", { timeout: 5_000 });
      await page.fill("input[type=password]", "Demo1234!", { timeout: 5_000 });
      await page.waitForFunction(
        () => {
          const btn = document.querySelector("button[type=submit]");
          return !!btn && !btn.disabled;
        },
        null,
        { timeout: HYDRATION_TIMEOUT_MS, polling: 250 },
      );
      envelope.hydrated = true;
    } catch {
      envelope.hydrated = false;
    }
  }

  await context.close();
} finally {
  await browser.close();
}

const { verdict, remedy } = classifyBootStability({
  reachable: envelope.reachable,
  navigations: envelope.navigations,
  hydrated: envelope.hydrated,
});

console.log(JSON.stringify({ ...envelope, verdict, remedy }, null, 1));

if (verdict === "green") {
  // S81/AH7: the human GREEN line goes to STDERR — stdout must stay
  // JSON-only (the orchestrator's parseAuditStdout parses stdout, and a
  // trailing prose line after the envelope made the slice-to-end parse
  // fail: the standing-suite aborted at stage 0 on its first-ever run).
  console.error("DEV-SERVER PREFLIGHT: GREEN — hydrated and navigation-stable.");
  process.exit(0);
}

console.error(`DEV-SERVER PREFLIGHT: ${verdict.toUpperCase()} — ${remedy}`);
process.exit(1);
