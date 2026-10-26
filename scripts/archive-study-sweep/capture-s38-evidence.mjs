// S38 evidence capture — the drawer OPEN at 390×844 in DARK mode under a
// non-violet accent (the accent × dark × mobile story in one frame),
// modeled on the S36/S37 capture scripts. PATCHes dark + teal through the
// settings API (the real lifecycle, self-verified on <html data-accent> +
// the dark class), opens the drawer, captures the frame, restores the
// resting state (light + violet, verified via Prisma by the caller).
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots/s38-accent-dark-drawer-teal-390.png";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
try {
  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });

  // dark + teal through the real lifecycle, self-verified
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "dark", accentColor: "teal" } });
  await page.goto(`${BASE}/Dashboard`, { waitUntil: "load" });
  await page.waitForFunction(
    () => document.documentElement.dataset.accent === "teal" && document.documentElement.classList.contains("dark"),
    undefined,
    { timeout: 30000 },
  );

  // open the drawer
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(700);

  const rec = await page.evaluate(() => {
    const dlg = document.querySelector('[role=dialog]');
    const active = dlg?.querySelector('a[aria-current="page"]');
    const inner = active ? active.querySelector('span') : null;
    return {
      linkCount: dlg ? dlg.querySelectorAll("a").length : 0,
      panelBg: dlg ? getComputedStyle(dlg).backgroundColor : null,
      activeTint: inner ? getComputedStyle(inner).backgroundImage.slice(0, 90) : null,
      darkClass: document.documentElement.classList.contains("dark"),
      accent: document.documentElement.dataset.accent,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });
  console.error(JSON.stringify(rec));
  await page.screenshot({ path: OUT });
  console.error(`saved ${OUT}`);

  // restore the resting state
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } });
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForFunction(
    () => document.documentElement.dataset.accent === "violet" && !document.documentElement.classList.contains("dark"),
    undefined,
    { timeout: 30000 },
  );
  writeFileSync("/tmp/s38-evidence-record.json", JSON.stringify(rec, null, 1));
} catch (e) {
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } }).catch(() => {});
  console.error(`S38 EVIDENCE CAPTURE FAILED: ${e}`);
  process.exit(1);
} finally {
  await browser.close();
}
