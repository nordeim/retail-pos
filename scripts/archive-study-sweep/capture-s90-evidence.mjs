// S90 · Batch AQ surface evidence captures — the AP3 third-leg closure
// (AQ1, the s89 audit's L3: the boot-script sync pin never pinned the
// ACCENT_TOKENS literals' OWN key insertion order — the order the VALUES
// generator rides; a value-equal key reorder inside a literal kept both
// AP3 assertions green while the pre-paint script paired names with wrong
// values).
//
// AQ1 frames (the GUARDED surface — the token system the third leg now
// protects, demonstrated on two non-default accents in dark mode, where
// the boot script's TOKENS×VALUES pairing paints the pre-hydration
// surface): Frame 1: the dark dashboard under accent TEAL (the clock chip
// gradient, the avatar gradient, the nav active tint — all painted from
// the accentCssVars token set the script's lists must align with). Frame
// 2: the same surface under accent ORANGE, switched through the REAL
// Settings accent picker interaction — never a re-shoot. The behavioral
// proof lives in the unit pin (tests/theme.test.ts S90/AQ1 —
// MUTATION-PROVEN: the violet emptyTo/emptyFrom reorder turned EXACTLY
// the new pin RED with AP3 green); these frames document the guarded
// surface on the final build.
//
// The AM2 convention: every frame is separated by a REAL interaction (the
// Settings accent switch) — both frames must be md5-DISTINCT (printed at
// the end).
//
// Usage: DATABASE_URL="file:../db/custom.db" node scripts/capture-s90-evidence.mjs
//        (clone :3200 standalone first — the S86 daemon recipe)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const BASE = "http://localhost:3200";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });
const PREFERENCES = "/api/settings/preferences";

const prisma = new PrismaClient();
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

try {
  const demo = await prisma.user.findUnique({ where: { email: "demo@studyflow.app" } });
  if (!demo) throw new Error("demo user missing — run bun run db:seed");

  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });
  await page.waitForFunction(() => !!document.querySelector(".sf-clock-date"), null, { timeout: 15000 });

  // ============ AQ1 · the guarded token surface, accent leg 1 ===========
  // Dark mode + TEAL through the real preferences seam, then a full reload
  // so the BOOT SCRIPT (the guarded surface — its TOKENS name-lists pair
  // positionally with its VALUES array) paints the pre-hydration document.
  await page.request.patch(`${BASE}${PREFERENCES}`, { data: { accentColor: "teal", themeMode: "dark" } });
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForTimeout(1200);
  await page.reload();
  await page.waitForFunction(() => !!document.querySelector(".sf-clock-date"), null, { timeout: 15000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/90-clone-aq-theme-teal-dark.png` });

  // ============ AQ1 · accent leg 2 — the REAL switch interaction =========
  // The Settings accent picker (a real user interaction, the AM2 rule):
  // teal → orange while the app stays live, then the reload for the boot
  // script's pre-paint pass on the new accent.
  await page.goto(`${BASE}/Settings`);
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Orange" }).click();
  await page.waitForTimeout(800);
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForTimeout(1000);
  await page.reload();
  await page.waitForFunction(() => !!document.querySelector(".sf-clock-date"), null, { timeout: 15000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/90-clone-aq-theme-orange-dark.png` });

  // ---- The distinct-frame verification (the AM2 closure: print the md5s) --
  const md5 = (p) => createHash("md5").update(readFileSync(p)).digest("hex").slice(0, 8);
  const frames = [
    `${OUT}/90-clone-aq-theme-teal-dark.png`,
    `${OUT}/90-clone-aq-theme-orange-dark.png`,
  ].map(md5);
  const distinct = new Set(frames).size === frames.length;
  console.log(`S90 AQ frames: ${frames.join(" ")} — ${distinct ? "all DISTINCT" : "DUPLICATE PRESENT"}`);
} finally {
  // The S4 restore lesson + the AL5/AN1 cleanup convention: the shared
  // demo surface is restored (accent violet, mode light) on EVERY path.
  await page.request.patch(`${BASE}${PREFERENCES}`, { data: { accentColor: "violet", themeMode: "light" } }).catch(() => {});
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
  await prisma.$disconnect().catch(() => {});
}
console.log("S90 AQ surface captures complete");
