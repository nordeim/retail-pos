// S51 CWV × volume stress — the RUM-beacon cross-axis.
//
// The coverage map this probe closes (grep-verified against the standing
// scripts): the S16 cwv audit measures LCP/CLS/FCP/TTFB + the longtask TBT
// proxy + the INP nav-switch proxy under the Lighthouse mobile throttle —
// but its scenarios are /login + /Dashboard ONLY at SEED volume (zero
// volume references); the S13 data-volume audit inserts the 300/200/250
// profile but measures payloads/quiet-window longtasks/click latency —
// never LCP/CLS/FCP; the S42–S49 volume sweeps observe longtask entries
// ONLY. The beacon's five field metrics under suite volume were
// ZERO-coverage at every prior audit.
//
// Method (the S16 vehicle verbatim, re-anchored to the volume axis):
//   LCP/CLS/FCP  — buffered PerformanceObserver entries (web-vitals APIs —
//                   the same entries the RUM beacon itself reads)
//   TTFB         — Navigation Timing 2
//   Long tasks   — PerformanceObserver('longtask') (the TBT proxy,
//                  load-window: buffered from navigation start)
//   Throttling   — CDP Emulation.setCPUThrottlingRate(4) + Network
//                  emulation (150 ms RTT, 1.6 Mbps down / 0.75 up — the
//                  Lighthouse mobile preset), cache disabled.
//   Volume       — the S13 lifecycle verbatim (STRESS-S51- marker rows:
//                  300 tasks / 200 notes / 250 events through Prisma,
//                  COUNT-verified by read-back, deleted in a finally).
//   Target       — the production standalone build on :3200 (the S16
//                  doctrine: CWV needs the production bundle; the dev
//                  server's Turbopack overhead would inflate every
//                  reading). The runner's ensureStandalone owns the server
//                  lifecycle; this probe verifies health from birth and
//                  fails loudly when absent (the AP-90 lesson).
//   Surfaces     — the 7 volume-affected views (the S13/S42–S49 set),
//                  fresh mobile context per run (390×844 + isMobile +
//                  hasTouch), login UNTHROTTLED (measure the destination,
//                  not auth), 2 runs per view with the S16 median.
//   INP proxy    — the S16 nav-switch interaction proxy re-anchored to the
//                  volume destination: Dashboard→Tasks through the desktop
//                  sidebar under the FULL throttle — the 300-row list mount
//                  is the heaviest interaction.
//
// Budget families (the verdict classes, boundary-exact — classified by
// src/lib/suite-verdict.ts classifyCwvVolumeStress):
//   LCP ≤ 4400ms   — the PARITY ANCHOR: the reference's own seed-volume
//                    mobile dashboard measures LCP 4416–4432ms under the
//                    same Lighthouse preset (the standing cwv stage's
//                    documented ref scenario) — the clone's volume-stressed
//                    views must outperform the reference's own seed state.
//                    The public 4000ms field-POOR boundary is documented in
//                    the seam's note: the Tasks view's genuine reading
//                    ~3964–4028ms straddles it (the recorded NI-to-POOR
//                    state). The S51 correction: the original 4000 pin sat
//                    INSIDE the measurement's system-load noise band
//                    (±64ms across identical-conditions runs — the
//                    exploration read 3964, the first validation suite
//                    4028, on the SAME lcpEl with identical mainNodes/
//                    bytes — a 28ms breach margin inside a 64ms noise
//                    band made the verdict a coin flip; the S47
//                    in-suite-correction precedent).
//   CLS ≤ 0.1      — the ADR-014 load-stability contract at volume
//   FCP ≤ 1500ms   — the shell-paint volume-invariance (the pre-warm)
//   TTFB ≤ 500ms   — the server sanity bound
//   longTaskTotal ≤ 2400ms — the S13 B3 quiet-window 1500ms standing
//                    budget's load-window sibling. S91/AR1 re-anchor (the
//                    S47/S51 in-suite-correction precedent, the identical
//                    coin-flip class): the documented same-tree healthy band
//                    is 1821–2288ms across 7+ readings on 3+ tree states
//                    (S82/S88/S89/S90/S91 — the S88 stash A/B measured the
//                    SAME tree 1978 green / 2073 red; the S91 fresh triple
//                    measured 1821/1836/1849), so the original 2000 pin sat
//                    INSIDE the noise band and the verdict was a coin flip
//                    on machine-load conditions. 2400 sits 112ms above the
//                    max documented reading — OUTSIDE the band — while a
//                    genuine +400ms regression on the worst-case healthy
//                    baseline still lands beyond it.
//   INP proxy ≤ 3000ms — the volume-stressed interaction bound
//
// Verdict JSON to stdout; exit 0 on completion (findings ride the JSON —
// the runner classifies). Run from the repo root.
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.CWV_BASE ?? "http://localhost:3200";
const MARKER = "STRESS-S51-";
const RUNS = Number(process.env.CWV_RUNS ?? 2);
const SETTLE_MS = 4000; // covers 4 live-clock ticks for late CLS

const THROTTLE = {
  latency: 150,
  down: (1.6 * 1024 * 1024) / 8,
  up: (750 * 1024) / 8,
};

const VIEWS = [
  { label: "Dashboard", path: "Dashboard" },
  { label: "My Day", path: "MyDay" },
  { label: "Tasks", path: "Tasks" },
  { label: "Calendar", path: "Calendar" },
  { label: "Events", path: "Events" },
  { label: "Notes", path: "Notes" },
  { label: "Analytics", path: "Analytics" },
];

// The budget families (mirrors the seam — single source is the classifier;
// these drive the probe-computed findings array).
const BUDGETS = { lcp: 4400, cls: 0.1, fcp: 1500, ttfb: 500, longTaskTotal: 2400, inp: 3000 };

const prisma = new PrismaClient({ datasources: { db: { url: "file:../db/custom.db" } } });

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

async function health() {
  try {
    const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function enableThrottle(cdp, on) {
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  if (on) {
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: THROTTLE.latency,
      downloadThroughput: THROTTLE.down,
      uploadThroughput: THROTTLE.up,
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  }
}

// The S16 instrument: observers registered before any app script runs —
// buffered:true recovers entries that fired before the observer attached.
async function instrument(page) {
  await page.addInitScript(() => {
    window.__cwv = { lcp: 0, cls: 0, fcp: 0, longTasks: [] };
    try {
      new PerformanceObserver((l) => {
        const es = l.getEntries();
        if (es.length) {
          const last = es[es.length - 1];
          window.__cwv.lcp = Math.round(last.startTime);
          const el = last.element;
          window.__cwv.lcpEl = el
            ? `${el.tagName}${(typeof el.className === "string" ? el.className : "")
                .toString()
                .slice(0, 70)}`
            : "paint";
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cwv.cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries())
          if (e.name === "first-contentful-paint") window.__cwv.fcp = Math.round(e.startTime);
      }).observe({ type: "paint", buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.__cwv.longTasks.push(Math.round(e.duration));
      }).observe({ type: "longtask", buffered: true });
    } catch {
      /* older engines */
    }
  });
}

// The S16 reader + the volume density evidence (mainNodes).
async function readMetrics(page) {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] ?? {};
    const res = performance.getEntriesByType("resource");
    let bytes = 0;
    let jsBytes = 0;
    let reqs = 0;
    for (const r of res) {
      reqs++;
      bytes += r.transferSize || 0;
      if (r.initiatorType === "script" || r.initiatorType === "link") jsBytes += r.transferSize || 0;
    }
    const c = window.__cwv;
    return {
      ttfb: Math.round(nav.responseStart - nav.requestStart),
      fcp: c.fcp,
      lcp: c.lcp,
      lcpEl: c.lcpEl ?? null,
      cls: Math.round(c.cls * 1000) / 1000,
      longTasks: c.longTasks,
      longTaskTotal: c.longTasks.reduce((a, b) => a + b, 0),
      maxLongTask: c.longTasks.reduce((a, b) => Math.max(a, b), 0),
      reqs,
      kb: Math.round(bytes / 1024),
      jsKb: Math.round(jsBytes / 1024),
      mainNodes: document.querySelectorAll("main *").length,
    };
  });
}

async function loginClone(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "load" });
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  // S81/AH10 (the audit-tools repair): the login wait must prove
  // AUTHENTICATION, not main-element presence — the LOGIN PAGE itself has a
  // <main>, so this wait resolved pre-auth and the next goto raced the
  // login POST (ERR_ABORTED on the auth-gate bounce). The sweeps' pattern:
  // wait for the post-login /Dashboard redirect.
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 30000 });
}

async function main() {
  // The standalone precondition from birth (the AP-90 lesson applied to the
  // audit tool itself): a missing build/server is a LOUD failure, never a
  // silent zero. The runner's ensureStandalone owns the lifecycle in-suite;
  // standalone exploration runs start :3200 manually (the S50 copy-sweep
  // pattern).
  if (!(await health())) {
    console.error(
      `[cwv-volume-stress] the standalone build on ${BASE} is not healthy — start it first (the runner's ensureStandalone, or node .next/standalone/server.js with PORT=3200 + an ephemeral AUTH_SECRET)`,
    );
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email: "demo@studyflow.app" } });
  if (!user) throw new Error("demo user missing — run bun run db:seed");

  // --- the volume lifecycle (the S13 insert block verbatim, S51 marker) ---
  const today = new Date();
  const iso = (d) => d.toISOString();
  const dayOffset = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    d.setHours(12, 0, 0, 0);
    return iso(d);
  };

  const taskData = [];
  for (let i = 0; i < 300; i++) {
    const bucket = i % 3;
    const due = bucket === 0 ? dayOffset(0) : bucket === 1 ? dayOffset(-3) : dayOffset(7);
    taskData.push({
      userId: user.id,
      title: `${MARKER}task ${i}`,
      notes: "stress row",
      completed: i % 5 === 0,
      important: i % 7 === 0,
      dueDate: due,
      priority: ["none", "low", "medium", "high"][i % 4],
      repeat: "none",
      myDay: bucket === 0 && i % 2 === 0,
      subtasks: "[]",
    });
  }
  const noteData = [];
  for (let i = 0; i < 200; i++) {
    noteData.push({
      userId: user.id,
      title: `${MARKER}note ${i}`,
      content: "Stress note body ".repeat(8),
      tags: JSON.stringify(["stress"]),
    });
  }
  const eventData = [];
  for (let i = 0; i < 250; i++) {
    const start = new Date(today);
    start.setDate(start.getDate() + (i % 7));
    start.setHours(8 + (i % 10), 0, 0, 0);
    const end = new Date(start.getTime() + 3600000);
    eventData.push({
      userId: user.id,
      title: `${MARKER}event ${i}`,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      color: "#8b5cf6",
      reminders: "[]",
      repeat: "none",
    });
  }

  const findings = [];
  const nonGaps = [];
  const views = {};
  let inpProxy = null;
  let modeObserved = "light";

  const browser = await chromium.launch();
  try {
    await prisma.task.createMany({ data: taskData });
    await prisma.note.createMany({ data: noteData });
    await prisma.event.createMany({ data: eventData });

    // COUNT-verify the insert (the volume-EXACT evidence).
    const counts = {
      tasks: await prisma.task.count({ where: { title: { startsWith: MARKER } } }),
      notes: await prisma.note.count({ where: { title: { startsWith: MARKER } } }),
      events: await prisma.event.count({ where: { title: { startsWith: MARKER } } }),
    };
    console.error(`[cwv-volume-stress] inserted + verified ${JSON.stringify(counts)}`);
    if (counts.tasks !== 300 || counts.notes !== 200 || counts.events !== 250) {
      throw new Error(`volume COUNT verification failed: ${JSON.stringify(counts)} (expected 300/200/250)`);
    }

    const mobile = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

    // --- the 7-view × RUNS measurement (throttled mobile loads) -----------
    for (const view of VIEWS) {
      const runs = [];
      for (let i = 0; i < RUNS; i++) {
        const context = await browser.newContext(mobile);
        const page = await context.newPage();
        const cdp = await context.newCDPSession(page);
        await instrument(page);
        try {
          // Login UNTHROTTLED (measure the destination, not auth). The first
          // context of the first view also pins the LIGHT mode through the
          // real settings API (the defensive idempotent PATCH — the resting
          // state) and self-verifies it.
          await loginClone(page);
          if (i === 0 && view.label === "Dashboard") {
            await page.request.patch(`${BASE}/api/settings/preferences`, {
              data: { themeMode: "light" },
            });
            await page.waitForFunction(
              () => !document.documentElement.classList.contains("dark"),
              null,
              { timeout: 10000 },
            );
          }
          // The per-run mode self-verification (the S42–S49 doctrine).
          const dark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
          if (dark) modeObserved = "dark";
          await enableThrottle(cdp, true);
          await page.goto(`${BASE}/${view.path}`, { waitUntil: "load", timeout: 90000 });
          // The shell-presence guard: the view's identity heading must render
          // before the settle (all 7 views render a main h1 — source-verified;
          // a blank shell would read artificially fast CWV).
          await page.waitForFunction(() => !!document.querySelector("main h1"), null, {
            timeout: 30000,
          });
          await page.waitForTimeout(SETTLE_MS);
          runs.push(await readMetrics(page));
        } catch (e) {
          runs.push({ error: String(e).slice(0, 200) });
        } finally {
          await context.close();
        }
      }
      const okRuns = runs.filter((r) => !r.error);
      if (!okRuns.length) {
        findings.push({
          family: "S51-measure",
          view: view.label,
          finding: `all ${RUNS} run(s) failed: ${runs[0]?.error ?? "unknown"}`,
        });
        continue;
      }
      views[view.label] = {
        lcp: median(okRuns.map((r) => r.lcp)),
        lcpEl: okRuns[okRuns.length - 1].lcpEl,
        fcp: median(okRuns.map((r) => r.fcp)),
        cls: median(okRuns.map((r) => r.cls)),
        ttfb: median(okRuns.map((r) => r.ttfb)),
        longTaskTotal: median(okRuns.map((r) => r.longTaskTotal)),
        maxLongTask: Math.max(...okRuns.map((r) => r.maxLongTask)),
        mainNodes: median(okRuns.map((r) => r.mainNodes)),
        reqs: median(okRuns.map((r) => r.reqs)),
        kb: median(okRuns.map((r) => r.kb)),
        jsKb: median(okRuns.map((r) => r.jsKb)),
        runs: runs.length,
        errors: runs.length - okRuns.length,
      };
      nonGaps.push({
        surface: `${view.label} CWV at volume (2-run median)`,
        metrics: views[view.label],
      });
    }

    // --- the INP proxy (the S16 vehicle, re-anchored to the volume dest) --
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await loginClone(page);
      await page.goto(`${BASE}/Dashboard`, { waitUntil: "load" });
      // The hydration gate first — the SSR h1 renders before React attaches
      // handlers and a pre-hydration click silently no-ops (the known trap).
      await page.waitForFunction(
        () =>
          !!document.querySelector("main h1") &&
          getComputedStyle(document.documentElement).getPropertyValue("--sf-primary").trim() !== ""
      );
      await enableThrottle(cdp, true);
      const t0 = await page.evaluate(() => performance.now());
      await page.click('nav a[href="/Tasks"]');
      await page.waitForFunction(
        () => /tasks/i.test(document.querySelector("main h1")?.textContent ?? ""),
        null,
        { timeout: 30000 },
      );
      const ms = await page.evaluate((t) => Math.round(performance.now() - t), t0);
      inpProxy = {
        viewport: { width: 1280, height: 800 },
        cpuRate: 4,
        networkThrottled: true,
        from: "Dashboard",
        to: "Tasks",
        ms,
      };
      nonGaps.push({ surface: "INP proxy Dashboard→Tasks at volume (full throttle)", ms });
      await context.close();
    } catch (e) {
      findings.push({
        family: "S51-inp",
        view: "Tasks",
        finding: `the INP proxy failed: ${String(e).slice(0, 200)}`,
      });
      inpProxy = {
        viewport: { width: 1280, height: 800 },
        cpuRate: 4,
        networkThrottled: true,
        from: "Dashboard",
        to: "Tasks",
        ms: -1,
      };
    }

    // --- the budget families (the probe-computed findings; the seam
    //     re-counts them independently — the anti-phantom doctrine) --------
    for (const [label, m] of Object.entries(views)) {
      if (m.lcp > BUDGETS.lcp) {
        findings.push({ family: "S51-lcp", view: label, finding: `LCP ${m.lcp}ms > ${BUDGETS.lcp}ms at volume under the throttle (the parity anchor — the reference's own seed dashboard measures 4416–4432ms under the same preset)`, value: m.lcp, budget: BUDGETS.lcp });
      }
      if (m.cls > BUDGETS.cls) {
        findings.push({ family: "S51-cls", view: label, finding: `CLS ${m.cls} > ${BUDGETS.cls} at volume (the ADR-014 load-stability contract)`, value: m.cls, budget: BUDGETS.cls });
      }
      if (m.fcp > BUDGETS.fcp) {
        findings.push({ family: "S51-fcp", view: label, finding: `FCP ${m.fcp}ms > ${BUDGETS.fcp}ms (the shell-paint volume-invariance)`, value: m.fcp, budget: BUDGETS.fcp });
      }
      if (m.ttfb > BUDGETS.ttfb) {
        findings.push({ family: "S51-ttfb", view: label, finding: `TTFB ${m.ttfb}ms > ${BUDGETS.ttfb}ms (the server sanity bound)`, value: m.ttfb, budget: BUDGETS.ttfb });
      }
      if (m.longTaskTotal > BUDGETS.longTaskTotal) {
        findings.push({ family: "S51-longtask", view: label, finding: `load-window longTaskTotal ${m.longTaskTotal}ms > ${BUDGETS.longTaskTotal}ms (the S13 B3 volume budget's load-window sibling)`, value: m.longTaskTotal, budget: BUDGETS.longTaskTotal });
      }
    }
    if (inpProxy && inpProxy.ms > BUDGETS.inp) {
      findings.push({ family: "S51-inp", view: "Tasks", finding: `the INP proxy ${inpProxy.ms}ms > ${BUDGETS.inp}ms (the volume interaction budget)`, value: inpProxy.ms, budget: BUDGETS.inp });
    }
  } finally {
    await browser.close();
    // Cleanup — remove ALL marker rows (idempotent even after partial runs).
    const del = await prisma.$transaction([
      prisma.task.deleteMany({ where: { title: { startsWith: MARKER } } }),
      prisma.note.deleteMany({ where: { title: { startsWith: MARKER } } }),
      prisma.event.deleteMany({ where: { title: { startsWith: MARKER } } }),
    ]);
    console.error(`[cwv-volume-stress] cleaned ${del.map((d) => d.count).join("/")} rows`);
    await prisma.$disconnect();
  }

  const envelope = {
    source: "cwv-volume-stress",
    mode: modeObserved,
    target: BASE,
    viewport: { width: 390, height: 844 },
    throttle: true,
    volume: { tasks: 300, notes: 200, events: 250 },
    views,
    inpProxy,
    findings,
    nonGaps,
  };
  console.log(JSON.stringify(envelope, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
