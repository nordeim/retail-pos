// S22 evidence captures — the AUTH_SECRET production boot guard, saved to
// docs/screenshots/s22-* (follows the capture-s21 precedent: dev server on
// :3000 for the app captures, the standalone build for the guard probes).
// The captured evidence:
//   1. The NEGATIVE boot guard: the standalone production server spawned
//      WITHOUT AUTH_SECRET exits non-zero with the actionable message.
//   2. The POSITIVE control: the same server WITH a 64-hex secret answers
//      /api/health 200 {"status":"ok"}.
//   3. The dev-server boot log line — the warn path (dev never blocks).
//   4. Dev-server screenshots of the remediated codebase: the dashboard
//      (desktop light), the /export owner surface, the mobile dashboard.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";
const GUARD_PORT = 3999;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
try {
  // ---- 1+2. The boot-guard probes against the STANDALONE build ----------
  const server = ".next/standalone/server.js";
  if (!existsSync(server)) throw new Error("run `bun run build` first (standalone server missing)");

  const spawnServer = (authSecret) =>
    new Promise((resolve) => {
      const env = {
        PATH: process.env.PATH ?? "",
        HOME: process.env.HOME ?? "",
        PORT: String(GUARD_PORT),
        NODE_ENV: "production",
        DATABASE_URL: "file:../db/e2e.db",
      };
      if (authSecret !== undefined) env.AUTH_SECRET = authSecret;
      const child = spawn("bun", [server], { env, stdio: ["ignore", "pipe", "pipe"] });
      let output = "";
      child.stdout.on("data", (c) => (output += c.toString()));
      child.stderr.on("data", (c) => (output += c.toString()));
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        resolve({ exited: false, code: null, output });
      }, 20000);
      child.once("exit", (code) => {
        clearTimeout(timer);
        resolve({ exited: true, code, output });
      });
    });

  const GOOD_SECRET = "5f3a9c1e7b2d4f6a8c0e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f";
  const negative = await spawnServer(undefined);
  const negativeLines = negative.output
    .split("\n")
    .filter((l) => l.includes("AUTH_SECRET") || l.includes("[boot]"))
    .slice(0, 4);

  // Positive control: boot WITH the secret, poll health, kill.
  const positive = await new Promise((resolve) => {
    const child = spawn("bun", [server], {
      env: {
        PATH: process.env.PATH ?? "",
        HOME: process.env.HOME ?? "",
        PORT: String(GUARD_PORT),
        NODE_ENV: "production",
        DATABASE_URL: "file:../db/e2e.db",
        AUTH_SECRET: GOOD_SECRET,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let health = null;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:${GUARD_PORT}/api/health`);
        health = { status: res.status, body: await res.json() };
        clearInterval(poll);
        child.kill("SIGKILL");
        resolve(health);
      } catch {
        /* not up yet */
      }
    }, 500);
    setTimeout(() => {
      clearInterval(poll);
      child.kill("SIGKILL");
      resolve(health ?? { status: null, body: null });
    }, 15000);
  });

  // ---- 3. The dev-server boot log (the warn path — dev never blocks) ----
  const bootLine = existsSync("dev.log")
    ? readFileSync("dev.log", "utf8")
        .split("\n")
        .find((l) => l.includes("[boot]")) ?? null
    : null;

  // ---- 4. Dev-server screenshots (the remediated codebase, demo account) -
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/s22-dev-dashboard.png`, fullPage: false });

  await page.goto(`${BASE}/export`);
  await page.getByRole("heading", { name: "Export Your Data" }).waitFor({ timeout: 30000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/s22-dev-export-page.png`, fullPage: false });
  await ctx.close();

  const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobile = await mobileCtx.newPage();
  await mobile.goto(`${BASE}/login`);
  await mobile.fill("input[type=email]", "demo@studyflow.app");
  await mobile.fill("input[type=password]", "Demo1234!");
  await mobile.click("button[type=submit]");
  await mobile.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 30000 });
  await mobile.waitForTimeout(1500);
  await mobile.screenshot({ path: `${OUT}/s22-dev-dashboard-mobile.png`, fullPage: false });
  const mobileOverflow = await mobile.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  await mobileCtx.close();

  writeFileSync(
    `${OUT}/s22-boot-guard-evidence.json`,
    JSON.stringify(
      {
        negativeSpawn: {
          exited: negative.exited,
          exitCode: negative.code,
          guardMessageLines: negativeLines,
          refusedAfterExit: await fetch(`http://localhost:${GUARD_PORT}/api/health`)
            .then(() => false)
            .catch(() => true),
        },
        positiveControl: positive,
        devBootWarnLine: bootLine,
      },
      null,
      2,
    ) + "\n",
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        captured: [
          "s22-boot-guard-evidence.json",
          "s22-dev-dashboard.png",
          "s22-dev-export-page.png",
          "s22-dev-dashboard-mobile.png",
        ],
        negative: { exited: negative.exited, exitCode: negative.code, message: negativeLines[0] },
        positive,
        devBootWarn: !!bootLine,
        mobileOverflow,
      },
      null,
      2,
    ),
  );
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 300) }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
