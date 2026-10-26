// S16 CWV/performance audit — Lighthouse-class synthetic measurement without
// the Lighthouse dependency (the repo pins deps by design; the methodology
// is the same one Lighthouse itself uses):
//   LCP/CLS/FCP  — buffered PerformanceObserver entries (web-vitals APIs)
//   TTFB         — Navigation Timing 2
//   Long tasks   — PerformanceObserver('longtask') (the TBT proxy)
//   Throttling   — CDP Emulation.setCPUThrottlingRate(4) + Network
//                  emulation (150 ms RTT, 1.6 Mbps down / 0.75 up — the
//                  Lighthouse mobile preset), cache disabled.
// Surfaces: /login (first paint, logged out) and /Dashboard (the app shell,
// logged in) on the production standalone build (:3200, NEVER :3100 — the
// Playwright webServer owns that port), mobile (390x844 + throttle) and
// desktop (1280x800, no throttle), light + dark. The reference app is
// measured with the same instrumentation for the parity comparison.
// Verdict JSON to stdout. CWV "good" thresholds: LCP <= 2500ms,
// CLS <= 0.1 (INP measured as a nav-switch interaction-latency proxy).
import { chromium } from "playwright";

const BASE = process.env.CWV_BASE ?? "http://localhost:3200";
const REF = "https://omni-study1.base44.app";
const RUNS = Number(process.env.CWV_RUNS ?? 2);
const SETTLE_MS = 4000; // covers 4 live-clock ticks for late CLS

const THROTTLE = {
  latency: 150,
  down: (1.6 * 1024 * 1024) / 8,
  up: (750 * 1024) / 8,
};

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
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

async function instrument(page) {
  // Observers registered before any app script runs — buffered:true
  // recovers entries that fired before the observer attached.
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
      reqs,
      kb: Math.round(bytes / 1024),
      jsKb: Math.round(jsBytes / 1024),
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

async function loginRef(page) {
  await page.goto(`${REF}/login`, { waitUntil: "load" });
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  // S81/AH10 (the audit-tools repair): the login wait must prove
  // AUTHENTICATION, not main-element presence — the LOGIN PAGE itself has a
  // <main>, so this wait resolved pre-auth and the next goto raced the
  // login POST (ERR_ABORTED on the auth-gate bounce). The sweeps' pattern:
  // wait for the post-login /Dashboard redirect.
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 30000 });
}

async function setTheme(page, mode) {
  await page.request.patch(`${BASE}/api/settings/preferences`, {
    data: { themeMode: mode },
  });
  await page.waitForFunction(
    (m) => document.documentElement.classList.contains(m === "dark" ? "dark" : "light") ||
      !document.documentElement.classList.contains("dark"),
    mode
  );
}

async function measureLoad(page, url) {
  await page.goto(url, { waitUntil: "load", timeout: 90000 });
  await page.waitForTimeout(SETTLE_MS);
  return readMetrics(page);
}

async function inpProxy(page, cdp, throttle) {
  // Interaction-latency proxy (INP): click a nav item, measure click→h1
  // swap. Measured with CPU throttle to stress the re-render path.
  // Hydration gate first — the SSR h1 renders before React attaches
  // handlers and a pre-hydration click silently no-ops (the known trap).
  await page.waitForFunction(
    () => !!document.querySelector('nav') && getComputedStyle(document.documentElement).getPropertyValue("--sf-primary").trim() !== ""
  );
  await enableThrottle(cdp, throttle);
  const t0 = await page.evaluate(() => performance.now());
  await page.click('nav a[href="/Calculator"]');
  await page.waitForFunction(
    () => document.querySelector("main h1")?.textContent?.trim() === "Calculator Suite",
    null,
    { timeout: 30000 }
  );
  const ms = await page.evaluate((t) => Math.round(performance.now() - t), t0);
  await page.click('nav a[href="/Dashboard"]');
  await page.waitForFunction(
    () => /good (morning|afternoon|evening)/i.test(
      document.querySelector("main h1")?.textContent ?? ""
    ),
    null,
    { timeout: 30000 }
  );
  return ms;
}

const scenarios = [];
const results = {};

async function runScenario(browser, s) {
  const runs = [];
  for (let i = 0; i < RUNS; i++) {
    const context = await browser.newContext(s.viewport);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await instrument(page);
    try {
      // Login (unthrottled — we measure the destination surface, not auth)
      if (s.login === "clone") await loginClone(page);
      if (s.login === "ref") await loginRef(page);
      if (s.theme === "dark" && s.login === "clone") await setTheme(page, "dark");
      if (s.theme === "dark" && s.login === "ref") await page.emulateMedia({ colorScheme: "dark" });
      if (s.theme === "dark" && !s.login) await page.emulateMedia({ colorScheme: "dark" });
      await enableThrottle(cdp, s.throttle);
      // Base44's SPA bootstrap can redirect mid-load (ERR_ABORTED on the
      // first goto) — one settle + retry makes the measurement robust.
      try {
        runs.push(await measureLoad(page, s.url));
      } catch (e1) {
        if (String(e1).includes("ERR_ABORTED")) {
          await page.waitForTimeout(2500);
          runs.push(await measureLoad(page, s.url));
        } else throw e1;
      }
    } catch (e) {
      runs.push({ error: String(e).slice(0, 200) });
    } finally {
      if (s.theme === "dark" && s.login === "clone") {
        await page.request
          .patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light" } })
          .catch(() => {});
      }
      await context.close();
    }
  }
  const okRuns = runs.filter((r) => !r.error);
  const agg = okRuns.length
    ? {
        ttfb: median(okRuns.map((r) => r.ttfb)),
        fcp: median(okRuns.map((r) => r.fcp)),
        lcp: median(okRuns.map((r) => r.lcp)),
        lcpEl: okRuns[okRuns.length - 1].lcpEl,
        cls: median(okRuns.map((r) => r.cls)),
        longTaskTotal: median(okRuns.map((r) => r.longTaskTotal)),
        maxLongTask: Math.max(...okRuns.map((r) => Math.max(0, ...r.longTasks))),
        reqs: median(okRuns.map((r) => r.reqs)),
        kb: median(okRuns.map((r) => r.kb)),
        jsKb: median(okRuns.map((r) => r.jsKb)),
        runs: runs.length,
        errors: runs.length - okRuns.length,
      }
    : { error: runs[0]?.error ?? "all runs failed" };
  results[s.name] = agg;
  const line = agg.error
    ? `${s.name}: ERROR ${agg.error}`
    : `${s.name}: LCP ${agg.lcp}ms (el: ${agg.lcpEl}) · FCP ${agg.fcp}ms · CLS ${agg.cls} · TTFB ${agg.ttfb}ms · longTasks ${agg.longTaskTotal}ms/${agg.maxLongTask}ms · ${agg.reqs} reqs · ${agg.kb}KB (js ${agg.jsKb}KB)`;
  console.log(line);
}

async function main() {
  const browser = await chromium.launch();

  const mobile = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
  const desktop = { viewport: { width: 1280, height: 800 } };

  // --- Clone scenarios (production standalone :3200) ---
  const clone = [
    { name: "clone-login-mobile-throttled", url: `${BASE}/login`, viewport: mobile, throttle: true },
    { name: "clone-login-desktop", url: `${BASE}/login`, viewport: desktop, throttle: false },
    {
      name: "clone-login-mobile-throttled-dark",
      url: `${BASE}/login`,
      viewport: mobile,
      throttle: true,
      theme: "dark",
    },
    {
      name: "clone-dashboard-mobile-throttled",
      url: `${BASE}/Dashboard`,
      viewport: mobile,
      throttle: true,
      login: "clone",
    },
    {
      name: "clone-dashboard-desktop",
      url: `${BASE}/Dashboard`,
      viewport: desktop,
      throttle: false,
      login: "clone",
    },
    {
      name: "clone-dashboard-mobile-throttled-dark",
      url: `${BASE}/Dashboard`,
      viewport: mobile,
      throttle: true,
      login: "clone",
      theme: "dark",
    },
    {
      name: "clone-dashboard-desktop-dark",
      url: `${BASE}/Dashboard`,
      viewport: desktop,
      throttle: false,
      login: "clone",
      theme: "dark",
    },
  ];

  // --- Reference scenarios (same instrumentation) ---
  const ref = [
    { name: "ref-login-mobile-throttled", url: `${REF}/login`, viewport: mobile, throttle: true },
    { name: "ref-login-desktop", url: `${REF}/login`, viewport: desktop, throttle: false },
    {
      name: "ref-dashboard-mobile-throttled",
      url: `${REF}/Dashboard`,
      viewport: mobile,
      throttle: true,
      login: "ref",
    },
    {
      name: "ref-dashboard-desktop",
      url: `${REF}/Dashboard`,
      viewport: desktop,
      throttle: false,
      login: "ref",
    },
  ];

  for (const s of [...clone, ...ref]) {
    scenarios.push(s);
    await runScenario(browser, s);
  }

  // --- INP proxy on the clone dashboard (throttled CPU) ---
  try {
    const context = await browser.newContext(desktop);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await loginClone(page);
    await page.goto(`${BASE}/Dashboard`, { waitUntil: "load" });
    await page.waitForFunction(() => !!document.querySelector("main h1"));
    await enableThrottle(cdp, true);
    const inp = await inpProxy(page, cdp, true);
    results["clone-navswitch-inp-proxy-4xcpu"] = { ms: inp };
    console.log(`clone-navswitch-inp-proxy-4xcpu: ${inp}ms click→h1 (CPU 4x)`);
    await context.close();
  } catch (e) {
    console.log(`inp-proxy failed: ${String(e).slice(0, 160)}`);
  }

  await browser.close();

  // --- Verdict vs CWV "good" thresholds ---
  const verdicts = {};
  for (const [name, m] of Object.entries(results)) {
    if (m.error || m.ms !== undefined) continue;
    verdicts[name] = {
      lcp: m.lcp <= 2500 ? "GOOD" : m.lcp <= 4000 ? "NI" : "POOR",
      cls: m.cls <= 0.1 ? "GOOD" : m.cls <= 0.25 ? "NI" : "POOR",
    };
  }
  const summary = {
    thresholds: { lcpGood: 2500, lcpNI: 4000, clsGood: 0.1, clsNI: 0.25 },
    scenarios: results,
    verdicts,
  };
  console.log("\nCWV AUDIT JSON:");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
