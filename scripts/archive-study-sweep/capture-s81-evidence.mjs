// S81 · the AH surface evidence captures — the toast/banner dark family,
// the calculator footer, the flashcards rows, and the notes tag row.
// Targets the :3200 standalone (avoids disturbing anything on :3000).
// The dark-mode application rides the API (PATCH themeMode) and the gate
// waits for the REAL app shell (the sf-clock date renders only inside the
// authed shell — the login page also carries --sf-primary, so the var is
// NOT a post-login proof).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3200";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });
const PREFERENCES = `${BASE}/api/settings/preferences`;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

await page.goto(`${BASE}/login`);
await page.fill("input[type=email]", "demo@studyflow.app");
await page.fill("input[type=password]", "Demo1234!");
await page.click("button[type=submit]");
await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });
await page.waitForFunction(() => !!document.querySelector(".sf-clock-date"), null, { timeout: 15000 });

const setMode = async (mode) => {
  const cookie = await context.cookies();
  const header = cookie.map((c) => `${c.name}=${c.value}`).join("; ");
  const res = await fetch(PREFERENCES, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", cookie: header },
    body: JSON.stringify({ themeMode: mode }),
  });
  if (!res.ok) throw new Error(`preferences PATCH failed: ${res.status}`);
};

// ---- AH3a: the dashboard overdue banner in dark --------------------------------
await setMode("dark");
await page.goto(`${BASE}/Dashboard`);
await page.waitForFunction(
  () => document.documentElement.classList.contains("dark") && !!document.querySelector('[aria-label="Overdue alert"]'),
  null,
  { timeout: 15000 },
);
await page.screenshot({ path: `${OUT}/81-clone-ah3a-overdue-banner-dark.png` });

// ---- AH3b: the success toast in dark (the emerald-200 pin) ---------------------
await page.goto(`${BASE}/Notes`);
await page.waitForFunction(() => !!document.querySelector("main h1"), null, { timeout: 15000 });
await page.getByRole("button", { name: /Dot product intuition/ }).first().click();
await page.waitForSelector(".ql-editor", { timeout: 15000 });
await page.getByRole("button", { name: "Save", exact: true }).click();
await page.waitForSelector('[aria-label=Notifications] button', { timeout: 10000 });
await page.screenshot({ path: `${OUT}/81-clone-ah3b-success-toast-dark.png` });
await page.waitForTimeout(6000); // let the toast auto-dismiss before the next capture

// ---- AH4a: the calculator footer in dark ----------------------------------------
await page.goto(`${BASE}/Calculator`);
await page.waitForFunction(() => !!document.querySelector('[aria-label="Calculator display"]'), null, { timeout: 15000 });
await page.screenshot({ path: `${OUT}/81-clone-ah4a-calc-footer-dark.png` });

// ---- back to light for the light-mode captures ----------------------------------
await setMode("light");
await page.goto(`${BASE}/Flashcards`);
await page.waitForFunction(
  () => !document.documentElement.classList.contains("dark") && !!document.querySelector('[aria-label="Deck rows"]'),
  null,
  { timeout: 15000 },
);
await page.screenshot({ path: `${OUT}/81-clone-ah6-flashcards-rows-light.png` });

// ---- AH8: the notes editor tag row in light --------------------------------------
await page.goto(`${BASE}/Notes`);
await page.waitForFunction(() => !!document.querySelector('[aria-label="Notes list pane"]'), null, { timeout: 15000 });
await page.getByRole("button", { name: /Dot product intuition/ }).first().click();
await page.waitForSelector(".ql-editor", { timeout: 15000 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/81-clone-ah8-notes-editor-tag-row-light.png` });

// ---- restore the resting state (light) -------------------------------------------
await setMode("light");
await browser.close();
console.log("AH evidence captured: 5 surfaces");
