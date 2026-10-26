// S44 evidence capture — the dark × mobile × volume story in one frame:
// the Tasks view at 300 rows in DARK mode under a non-violet accent (teal)
// at 390×844, with the DRAWER OPEN on the navigated Tasks view showing the
// teal ACTIVE-LINK gradient and the dense stacked task list rendering
// clean (the S43 capture pattern, mirrored onto the dark mobile half).
// PATCHes dark + teal through the settings API (the real lifecycle,
// self-verified on <html data-accent> + the dark class), inserts the S13
// volume profile through Prisma (marker rows, COUNT-verified), navigates
// to Tasks THROUGH THE DRAWER (the mobile vehicle — the interaction under
// test), verifies the MOBILE chrome contract (the sidebar hidden + the
// hamburger visible at 390), verifies the drawer's active link is TASKS
// with the teal NAV_ACTIVE_GRADIENT_STOPS tint (the dark × mobile ×
// volume interaction cell), verifies the rendered row density (the volume
// actually visible in the frame), verifies the DARK mode (the mode
// contract), captures the frame, cleans up every marker row, and restores
// the resting state (light + violet, verified via Prisma by the caller).
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots/s44-accent-volume-dark-mobile-teal-tasks-390.png";
const MARKER = "STRESS-S44-CAP-";
const prisma = new PrismaClient({ datasources: { db: { url: "file:../db/custom.db" } } });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
try {
  // --- the volume lifecycle (the S44 probe's own family, marker-isolated --
  // the STRESS-S44-CAP- prefix never collides with the probe's STRESS-S44-) --
  await prisma.task.deleteMany({ where: { title: { startsWith: MARKER } } });
  const user = await prisma.user.findUnique({ where: { email: "demo@studyflow.app" } });
  if (!user) throw new Error("the demo user is missing — run bun run db:seed first.");
  const today = new Date();
  const dayOffset = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    d.setHours(12, 0, 0, 0);
    return d.toISOString();
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
  await prisma.task.createMany({ data: taskData });
  const count = await prisma.task.count({ where: { title: { startsWith: MARKER } } });
  if (count !== 300) throw new Error(`the volume verification read ${count} marker rows, expected 300.`);
  console.error(`[capture] volume verified: ${count} marker tasks`);

  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });

  // dark + teal through the real lifecycle, self-verified (the dark-mode
  // contract)
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "dark", accentColor: "teal" } });
  await page.goto(`${BASE}/Dashboard`, { waitUntil: "load" });
  await page.waitForFunction(
    () => document.documentElement.dataset.accent === "teal" && document.documentElement.classList.contains("dark") && !!document.querySelector("header"),
    undefined,
    { timeout: 30000 },
  );

  // the MOBILE chrome contract at 390 — the drawer is the mobile vehicle
  // (getClientRects for the fixed-position sidebar — offsetParent reads
  // null for fixed elements even when rendered, the Chromium quirk)
  const chrome = await page.evaluate(() => ({
    sidebarVisible: (() => { const a = document.querySelector("aside"); return !!a && a.getClientRects().length > 0; })(),
    hamburgerVisible: (() => { const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("aria-label") === "Open navigation menu"); return !!b && b.offsetParent !== null; })(),
  }));
  if (chrome.sidebarVisible || !chrome.hamburgerVisible) {
    throw new Error(`the MOBILE chrome contract broke at 390 — ${JSON.stringify(chrome)}`);
  }

  // navigate to Tasks THROUGH THE DRAWER (the mobile vehicle — the
  // interaction under test)
  const dialog = page.getByRole("dialog");
  const t0 = Date.now();
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await dialog.waitFor({ state: "visible", timeout: 10000 });
  await dialog.getByRole("link", { name: "Tasks", exact: true }).click();
  await page.locator("main h1:visible, main h2:visible").first().waitFor({ state: "visible", timeout: 15000 });
  const clickLatencyMs = Date.now() - t0;
  await page.waitForTimeout(1500); // the 300-row fetch + render settle band

  // reopen the drawer for the interaction read + the frame (the story:
  // the drawer OPEN on the navigated Tasks view with the teal gradient)
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await dialog.waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(500);

  const rec = await page.evaluate((marker) => {
    const dlg = document.querySelector('[role="dialog"]');
    const active = dlg?.querySelector('a[aria-current="page"]');
    const inner = active ? active.querySelector("span") : null;
    const main = document.querySelector("main");
    // The dark-mode flashbulb + unreadable probe, main-scoped (the frame's
    // own surfaces): any flashbulb (a light surface on the dark canvas) or
    // NON-EXEMPT unreadable text fails the capture. The CTA-face
    // white-on-accent exemption applies (the S42/S44 dark doctrine — the
    // light-mode calendar-day + yellow-pill exemptions do NOT: those
    // surfaces re-theme in dark).
    const lum = (r, g, b) => {
      const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const parse = (c) => {
      const m = c && c.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const parts = m[1].split(",").map((s) => parseFloat(s));
      if (parts.length < 3 || parts.some((p) => Number.isNaN(p))) return null;
      return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
    };
    let flashbulbs = 0;
    for (const el of main.querySelectorAll("*")) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const bg = parse(cs.backgroundColor);
      if (!bg || bg.a <= 0.9) continue;
      if (lum(bg.r, bg.g, bg.b) <= 0.8) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 40 || rect.height < 20) continue;
      const cls = (el.className && el.className.toString) ? el.className.toString() : "";
      if (/sf-gradient|UserAvatar|avatar/.test(cls)) continue;
      flashbulbs += 1;
    }
    let unreadableNonExempt = 0;
    let ctaFace = 0;
    for (const el of main.querySelectorAll("*")) {
      const cs = getComputedStyle(el);
      if (cs.display === "none") continue;
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
      if (!hasText) continue;
      const fg = parse(cs.color);
      if (!fg) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) continue;
      let bgEff = { r: 9, g: 9, b: 11 };
      let node = el;
      while (node && node !== document.documentElement) {
        const cs2 = getComputedStyle(node);
        const bg = parse(cs2.backgroundColor);
        if (bg && bg.a > 0.85) { bgEff = bg; break; }
        node = node.parentElement;
      }
      const c = (Math.max(lum(fg.r, fg.g, fg.b), lum(bgEff.r, bgEff.g, bgEff.b)) + 0.05) / (Math.min(lum(fg.r, fg.g, fg.b), lum(bgEff.r, bgEff.g, bgEff.b)) + 0.05);
      if (c >= 2.2) continue;
      if (cs.color === "rgb(255, 255, 255)") { ctaFace += 1; continue; }
      unreadableNonExempt += 1;
    }
    const rows = [...main.querySelectorAll("*")].filter((el) => (el.textContent || "").includes(marker)).length;
    return {
      drawerOpen: !!dlg,
      linkCount: dlg ? dlg.querySelectorAll("a").length : 0,
      activeLabel: active ? (active.textContent || "").trim() : null,
      activeTint: inner ? getComputedStyle(inner).backgroundImage.slice(0, 90) : null,
      darkClass: document.documentElement.classList.contains("dark"),
      accent: document.documentElement.dataset.accent,
      scrollWidth: document.documentElement.scrollWidth,
      mainNodes: main ? main.querySelectorAll("*").length : 0,
      stressRows: rows,
      flashbulbs,
      unreadableNonExempt,
      ctaFace,
      viewport: { w: window.innerWidth, h: window.innerHeight },
    };
  }, `${MARKER}task`);
  console.error(JSON.stringify({ ...rec, clickLatencyMs }));
  if (rec.activeLabel !== "Tasks") {
    throw new Error(`the drawer's active link was "${rec.activeLabel}", expected "Tasks" — the interaction did not follow the navigation`);
  }
  if (!rec.activeTint || rec.activeTint === "none") {
    throw new Error(`the active-link gradient computed to "${rec.activeTint}" — the S8 no-var rot class`);
  }
  if (rec.stressRows < 100) {
    throw new Error(`only ${rec.stressRows} stress-row surfaces rendered in the Tasks main — the volume is not visible in the frame`);
  }
  if (rec.flashbulbs > 0) {
    throw new Error(`${rec.flashbulbs} flashbulb surface(s) on the dark canvas — the S38 dark doctrine`);
  }
  if (rec.unreadableNonExempt > 0) {
    throw new Error(`${rec.unreadableNonExempt} non-exempt unreadable surface(s) on the dark canvas — the dark doctrine`);
  }
  await page.screenshot({ path: OUT });
  console.error(`saved ${OUT}`);

  // restore the resting state + clean the marker rows
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden", timeout: 10000 });
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } });
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForFunction(
    () => document.documentElement.dataset.accent === "violet" && !document.documentElement.classList.contains("dark"),
    undefined,
    { timeout: 30000 },
  );
  writeFileSync("/tmp/s44-evidence-record.json", JSON.stringify({ ...rec, clickLatencyMs }, null, 1));
} catch (e) {
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } }).catch(() => {});
  console.error(`S44 EVIDENCE CAPTURE FAILED: ${e}`);
  process.exit(1);
} finally {
  await browser.close();
  await prisma.task.deleteMany({ where: { title: { startsWith: MARKER } } });
  await prisma.$disconnect();
}
