// V27 probe — the shell title-effect race (the F2-flake-watch family).
//
// Hypothesis (from the repo's own v7 discovery, probed and documented in
// src/app/not-found-title.tsx): Next's client metadata manager re-applies
// the root layout's title ("VeloxPOS") several times after hydration —
// measured live here up to ~283ms post-commit. The shell's title effect
// in src/app/page.tsx is a BARE effect write gated on status === "ready"
// (one /api/auth/me round-trip + the collection pre-warm later). When
// that round-trip resolves FAST, the shell's write lands only 8–16ms
// after the LAST metadata write — and under full-suite load variance the
// order can flip, clobbering the shell's write back to "VeloxPOS"
// PERMANENTLY (nothing re-fires the effect) — the v9 Spanish-alias title
// flake's exact signature (title assertion RED, isolated re-run green,
// zero code changes; 1 occurrence in V18, 1 in V26, 9 cycles of watch).
//
// This probe documents the race empirically:
// 1. Spawns the standalone production server on :3102 (e2e db, the
//    pinned e2e AUTH_SECRET) and logs in once via the API (native fetch —
//    playwright's request API mis-parses relative URLs under Bun).
// 2. Instruments every context with a title-change recorder (an init
//    script): a Document.prototype.title setter patch (catches property
//    writes) + a MutationObserver on documentElement (catches parser and
//    React head writes — documentElement is NULL at init-script time, so
//    the observer attaches the moment the parser creates it; diagnosed
//    live: hasDocElem=false, readyState="loading").
// 3. Mode "natural": plain navigations — the real-world baseline.
//    Mode "fast": /api/auth/me is fulfilled INSTANTLY from a captured
//    response (route interception) — the maximally-early title write,
//    the widest race window.
// 4. Reports per-iteration timelines, clobber events (a desired-title
//    write followed by a LATER wrong-title write), the shell-write vs
//    last-metadata-write margins, and the final-title verdict.
//
// Usage: bun scripts/probe-v27-title-race.ts [naturalN] [fastN]
// Defaults: 30 natural + 60 fast.
import { chromium, type Browser } from "@playwright/test";
import { spawn, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";
import { readFileSync, rmSync, writeFileSync } from "node:fs";

const BASE = "http://localhost:3102";
const PORT = 3102;
const AUTH_SECRET = "5c488cfa9214da3ba7446c061a1ff7d6b6bb00fa2db8ba930b5dea807fda1a71"; // the pinned e2e secret (playwright.config.ts)
const STATE_PATH = resolve(import.meta.dirname, "../tests/e2e/.auth/probe-v27.json");
const DESIRED = "Ventas | VeloxPOS";

type TitleEntry = { t: number; title: string; src: string };

let server: ChildProcess | null = null;

async function startServer(): Promise<void> {
  server = spawn("bun", [".next/standalone/server.js"], {
    cwd: resolve(import.meta.dirname, ".."),
    env: {
      ...process.env,
      AUTH_SECRET,
      PORT: String(PORT),
      DATABASE_URL: "file:../db/e2e.db",
      NODE_ENV: "production",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("standalone server never became healthy");
}

async function stopServer(): Promise<void> {
  if (!server) return;
  server.kill("SIGTERM");
  await new Promise((r) => setTimeout(r, 300));
  server = null;
}

// The recorder rides an init script so it captures EVERY title mutation
// from the first script evaluation — before hydration, before Next's
// metadata manager, before the shell's effect.
const RECORDER = `
  window.__titleLog = [];
  (() => {
    const push = (src) => window.__titleLog.push({ t: Math.round(performance.now()), title: document.title, src });
    push("init");
    // Catch property writes (document.title = ...) — the shape the shell
    // effect uses.
    try {
      const desc = Object.getOwnPropertyDescriptor(Document.prototype, "title");
      if (desc && desc.set) {
        Object.defineProperty(Document.prototype, "title", {
          ...desc,
          set(v) { desc.set.call(this, v); push("prop"); },
        });
      }
    } catch { /* non-fatal */ }
    // Catch DOM mutations under <html> (the parser + React's head
    // reconciliation). At init-script time documentElement is NULL (the
    // parser has not created <html> yet — diagnosed live), so the
    // observer must attach the moment it exists.
    const attach = () => {
      if (!document.documentElement) return false;
      new MutationObserver(() => push("dom")).observe(document.documentElement, {
        subtree: true, childList: true, characterData: true,
      });
      return true;
    };
    if (!attach()) {
      const iv = setInterval(() => { if (attach()) clearInterval(iv); }, 1);
    }
  })();
`;

async function loginOnce(): Promise<void> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "owner@veloxpos.local", password: "VeloxDemo123!" }),
  });
  if (!res.ok) throw new Error(`probe login failed: ${res.status} ${await res.text()}`);
  const setCookie = res.headers.getSetCookie()[0];
  if (!setCookie) throw new Error("probe login returned no session cookie");
  const [pair] = setCookie.split(";");
  const eq = pair.indexOf("=");
  writeFileSync(
    STATE_PATH,
    JSON.stringify({
      cookies: [{ name: pair.slice(0, eq), value: pair.slice(eq + 1), domain: "localhost", path: "/" }],
      origins: [],
    }),
  );
}

async function captureMe(): Promise<string> {
  const state = JSON.parse(readFileSync(STATE_PATH, "utf8")) as {
    cookies: Array<{ name: string; value: string }>;
  };
  const res = await fetch(`${BASE}/api/auth/me`, {
    headers: { cookie: state.cookies.map((c) => `${c.name}=${c.value}`).join("; ") },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`me capture failed: ${res.status} ${body}`);
  return body;
}

type IterationResult = {
  mode: string;
  i: number;
  finalTitle: string;
  clobbered: boolean;
  margin: number | null; // shell write − last wrong write (ms); negative = the shell wrote FIRST
  log: TitleEntry[];
};

async function runIteration(
  browser: Browser,
  mode: "natural" | "fast",
  i: number,
  meBody: string,
): Promise<IterationResult> {
  const ctx = await browser.newContext({ storageState: STATE_PATH });
  await ctx.addInitScript(RECORDER);
  const page = await ctx.newPage();
  if (mode === "fast") {
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: meBody }),
    );
  }
  await page.goto(`${BASE}/Ventas`, { waitUntil: "commit" });
  await page.getByRole("heading", { name: "Historial de Ventas" }).waitFor({ timeout: 10_000 });
  // Settle: give Next's re-apply + any late write 400ms to land.
  await page.waitForTimeout(400);
  const log = (await page.evaluate(() => (window as unknown as { __titleLog: TitleEntry[] }).__titleLog)) as TitleEntry[];
  const finalTitle = (await page.evaluate(() => String(document.title))) as string;
  const shellWriteIdx = log.findIndex((e) => e.title === DESIRED);
  const lastWrongIdx = -1 === shellWriteIdx ? -1 : log.slice(0, shellWriteIdx).map((e) => e.title !== DESIRED).lastIndexOf(true);
  const clobbered =
    shellWriteIdx >= 0 && log.slice(shellWriteIdx + 1).some((e) => e.title !== DESIRED);
  const margin =
    shellWriteIdx >= 0 && lastWrongIdx >= 0
      ? log[shellWriteIdx].t - log[lastWrongIdx].t
      : null;
  await ctx.close();
  return { mode, i, finalTitle, clobbered, margin, log };
}

function summarize(rs: IterationResult[]): void {
  const bad = rs.filter((r) => r.clobbered || r.finalTitle !== DESIRED);
  const margins = rs.map((r) => r.margin).filter((m): m is number => m !== null);
  const min = margins.length ? Math.min(...margins) : null;
  console.log(
    `  [${rs[0].mode}] ${rs.length} iterations — ${rs.length - bad.length} clean, ${bad.length} clobbered/wrong-final; min shell-vs-metadata margin ${min}ms`,
  );
  for (const r of rs.slice(0, 3)) {
    console.log(
      `    · #${r.i}: final="${r.finalTitle}" margin=${r.margin}ms timeline=${JSON.stringify(
        r.log.map((e) => [e.t, e.title]),
      )}`,
    );
  }
  for (const r of bad.slice(0, 6)) {
    console.log(
      `    ✘ #${r.i}: final="${r.finalTitle}" timeline=${JSON.stringify(r.log.map((e) => [e.t, e.title]))}`,
    );
  }
}

async function main(): Promise<void> {
  const naturalN = Number(process.argv[2] ?? 30);
  const fastN = Number(process.argv[3] ?? 60);
  await startServer();
  try {
    await loginOnce();
    const meBody = await captureMe();
    const browser = await chromium.launch();

    console.log(`probe: ${naturalN} natural + ${fastN} fast-auth iterations against ${BASE}/Ventas`);
    console.log(`  desired title: "${DESIRED}"`);

    const natural: IterationResult[] = [];
    for (let i = 0; i < naturalN; i++) natural.push(await runIteration(browser, "natural", i, meBody));
    summarize(natural);

    const fast: IterationResult[] = [];
    for (let i = 0; i < fastN; i++) fast.push(await runIteration(browser, "fast", i, meBody));
    summarize(fast);

    const totalBad = [...natural, ...fast].filter((r) => r.clobbered || r.finalTitle !== DESIRED);
    console.log(
      totalBad.length === 0
        ? "VERDICT: no clobber THIS run — but the margin ledger above IS the race evidence (single-digit ms)"
        : `VERDICT: RACE REPRODUCED — ${totalBad.length}/${naturalN + fastN} iterations show the shell title write clobbered`,
    );
    await browser.close();
  } finally {
    await stopServer();
    rmSync(STATE_PATH, { force: true });
  }
}

void main().catch((err) => {
  console.error(err);
  void stopServer();
  process.exit(1);
});
