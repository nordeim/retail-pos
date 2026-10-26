// S34 evidence capture — the Timetable at 768×1024 (the md breakpoint):
// the view whose layout swaps at md (the mobile accordion hides, the
// min-w-[900px] scroll canvas appears inside overflow-x-auto) + the mobile
// app bar (lg:hidden — visible through the whole band).
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots/s34-midband-timetable-768.png";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 768, height: 1024 } });

try {
  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });

  // Light mode through the real lifecycle (the S27 doctrine).
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light" } });

  // Navigate to Timetable through the drawer (the band's navigation vehicle).
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible", timeout: 10000 });
  await dialog.getByRole("link", { name: "Timetable", exact: true }).click();
  await dialog.waitFor({ state: "hidden", timeout: 10000 });

  // The identity heading + the md-swap canvas visible, then settle.
  await page.locator("main h1:visible, main h2:visible").first().waitFor({ state: "visible", timeout: 15000 });
  await page.waitForTimeout(1500);

  const canvasVisible = await page.locator('section[aria-label="Week grid"]').isVisible().catch(() => false);
  const accordionHidden = await page.locator('section[aria-label="Week grid mobile"]').isVisible().then((v) => !v).catch(() => true);
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);

  await page.screenshot({ path: OUT, fullPage: false });
  console.log(JSON.stringify({ out: OUT, canvasVisible, accordionHidden, scrollWidth: scrollW, viewport: "768x1024" }, null, 1));

  // The closing restore (explicit + awaited).
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light" } });
} finally {
  await browser.close();
}
