// capture-v16-pixeldiff.ts — the V16 full-page pixel-diff pass.
// Boots the clone standalone on :3101 against a probe DB (custom.db copy
// with the open shift CLOSED so the Terminal renders the reference's
// shift-gated empty state), logs into BOTH apps, and captures full-page
// screenshots of every view at 1280x800 + the login page. A Python step
// then diffs ref vs clone per view.
//
// Usage: bun scripts/capture-v16-pixeldiff.ts <serverPidHandledInternally>
import { chromium } from "playwright";
import { execSync, spawn } from "node:child_process";
import { mkdirSync, copyFileSync } from "node:fs";

const ROOT = "/home/z/my-project/retail-pos";
const OUT = "/tmp/pixeldiff";
mkdirSync(`${OUT}/ref`, { recursive: true });
mkdirSync(`${OUT}/clone`, { recursive: true });

// 1. Prepare the probe DB: copy + close the open shift.
execSync(`cp ${ROOT}/db/custom.db ${ROOT}/db/v16_probe.db`);
{
  const { PrismaClient } = await import(`${ROOT}/node_modules/@prisma/client/index.js`);
  const p = new PrismaClient({
    datasources: { db: { url: "file:/home/z/my-project/retail-pos/db/v16_probe.db" } },
  });
  // V16/F4: a shift close must reset BOTH shift.status AND register.status
  // (the close endpoint writes both in one transaction — skipping the
  // register write leaves phantom "Abierta" cards).
  await p.shift.updateMany({
    where: { status: "open" },
    data: { status: "closed", closedAt: new Date() },
  });
  await p.register.updateMany({ where: { status: "open" }, data: { status: "closed" } });
  const open = await p.shift.count({ where: { status: "open" } });
  console.log("probe DB ready, open shifts:", open);
  await p.$disconnect();
}

// 2. Boot the standalone server on :3101 against the probe DB.
import { openSync } from "node:fs";
const serverLog = openSync("/tmp/v16-server.log", "a");
const server = spawn("bun", [`${ROOT}/.next/standalone/server.js`], {
  cwd: ROOT,
  env: {
    ...process.env,
    PORT: "3101",
    NODE_ENV: "production",
    DATABASE_URL: "file:../db/v16_probe.db",
    AUTH_SECRET: "5f3a9c1e7b2d4f6a8c0e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f",
  },
  stdio: ["ignore", serverLog, serverLog],
});
const up = async () => {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch("http://127.0.0.1:3101/api/health");
      if (r.status === 200) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};
if (!(await up())) {
  console.error("server failed to boot");
  process.exit(1);
}
console.log("clone server up on :3101");

const VIEWS: Array<[string, string]> = [
  ["terminal", "/"],
  ["dashboard", "/Dashboard"],
  ["inventory", "/Inventory"],
  ["sales", "/Sales"],
  ["registers", "/Registers"],
  ["cashiers", "/Cashiers"],
  ["reports", "/Reports"],
  ["settings", "/StoreSettings"],
];

const browser = await chromium.launch();

// Reference context.
const refCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const ref = await refCtx.newPage();
await ref.goto("https://veloxposretail.base44.app/login", { waitUntil: "networkidle" });
await ref.fill('input[type="email"]', "sepnetflix2023@outlook.com");
await ref.fill('input[type="password"]', "$Abcd1234");
await ref.click('button[type="submit"]');
await ref.waitForURL(/base44\.app\/(Dashboard|$)/, { timeout: 20000 }).catch(() => {});
await ref.waitForTimeout(2500);
console.log("ref logged in:", ref.url());

// Clone context.
const clCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const cl = await clCtx.newPage();
await cl.goto("http://127.0.0.1:3101/login", { waitUntil: "networkidle" });
await cl.fill('input[type="email"]', "owner@veloxpos.local");
await cl.fill('input[type="password"]', "$Abcd1234");
await cl.click('button[type="submit"]');
await cl.waitForURL(/127\.0\.0\.1:3101\/(Dashboard)?$|\/$/, { timeout: 20000 }).catch(() => {});
await cl.waitForTimeout(2500);
console.log("clone logged in:", cl.url());

// 3. Capture every view on both apps.
for (const [name, path] of VIEWS) {
  await ref.goto(`https://veloxposretail.base44.app${path}`, { waitUntil: "networkidle" }).catch(() => {});
  await ref.waitForTimeout(2000);
  await ref.screenshot({ path: `${OUT}/ref/${name}.png`, fullPage: true });

  await cl.goto(`http://127.0.0.1:3101${path}`, { waitUntil: "networkidle" }).catch(() => {});
  await cl.waitForTimeout(2000);
  await cl.screenshot({ path: `${OUT}/clone/${name}.png`, fullPage: true });
  console.log(`captured ${name}`);
}

// 4. The login page (logged-out contexts).
await refCtx.clearCookies();
await ref.goto("https://veloxposretail.base44.app/login", { waitUntil: "networkidle" });
await ref.waitForTimeout(1500);
await ref.screenshot({ path: `${OUT}/ref/login.png`, fullPage: true });

await clCtx.clearCookies();
await cl.goto("http://127.0.0.1:3101/login", { waitUntil: "networkidle" });
await cl.waitForTimeout(1500);
await cl.screenshot({ path: `${OUT}/clone/login.png`, fullPage: true });
console.log("captured login");

// 5. Mobile spot-check: terminal + dashboard at 390x844 (the squeezed
// reference vs the clone's responsive handling — documented difference,
// captured for the record).
for (const ctx of [refCtx, clCtx]) await ctx.close();
const refM = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await refM.goto("https://veloxposretail.base44.app/login", { waitUntil: "networkidle" });
await refM.fill('input[type="email"]', "sepnetflix2023@outlook.com");
await refM.fill('input[type="password"]', "$Abcd1234");
await refM.click('button[type="submit"]');
await refM.waitForTimeout(3000);
await refM.screenshot({ path: `${OUT}/ref/mobile-terminal.png`, fullPage: true });
await refM.goto("https://veloxposretail.base44.app/Dashboard", { waitUntil: "networkidle" });
await refM.waitForTimeout(2000);
await refM.screenshot({ path: `${OUT}/ref/mobile-dashboard.png`, fullPage: true });

const clM = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await clM.goto("http://127.0.0.1:3101/login", { waitUntil: "networkidle" });
await clM.fill('input[type="email"]', "owner@veloxpos.local");
await clM.fill('input[type="password"]', "$Abcd1234");
await clM.click('button[type="submit"]');
await clM.waitForTimeout(3000);
await clM.screenshot({ path: `${OUT}/clone/mobile-terminal.png`, fullPage: true });
await clM.goto("http://127.0.0.1:3101/Dashboard", { waitUntil: "networkidle" });
await clM.waitForTimeout(2000);
await clM.screenshot({ path: `${OUT}/clone/mobile-dashboard.png`, fullPage: true });
console.log("captured mobile pair");

await browser.close();
server.kill("SIGTERM");
console.log("ALL CAPTURED");
