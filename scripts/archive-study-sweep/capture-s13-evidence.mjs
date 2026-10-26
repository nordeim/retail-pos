// S13 evidence captures — the remediated failure states, saved to
// docs/screenshots/s13-*.png (follows the capture-s12-evidence.mjs precedent:
// dev server on :3000, demo login, deterministic route interception so the
// captured states are reproducible).
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

// Login.
await page.goto(`${BASE}/login`);
await page.fill("input[type=email]", "demo@studyflow.app");
await page.fill("input[type=password]", "Demo1234!");
await page.click("button[type=submit]");
await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 20000 });

// 1. AI chat failed-send rollback: the composer holds the bounced-back text,
//    the error toast explains, the transcript has no orphan.
await page.goto(`${BASE}/AIAssistant`);
await page.waitForFunction(() => document.querySelector("main h1")?.textContent.trim() === "AI Study Assistant", null, { timeout: 20000 });
await page.waitForTimeout(1200);
await page.route("**/api/ai/chat", (route) =>
  route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ error: "The assistant is unavailable right now." }) }),
);
const composer = page.getByLabel("Message the assistant");
await composer.fill("Explain the quadratic formula");
await composer.press("Enter");
await page.waitForFunction(
  () => document.querySelector("textarea[aria-label='Message the assistant']")?.value === "Explain the quadratic formula",
  null,
  { timeout: 5000 },
).catch(() => {});
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/s13-ai-chat-rollback.png` });
await page.unroute("**/api/ai/chat");

// 2. Math solver MIME guard: the toast fires, no request leaves the browser.
await page.goto(`${BASE}/MathSolver`);
await page.waitForFunction(() => document.querySelector("main h1")?.textContent.trim() === "Math Solver", null, { timeout: 20000 });
await page.waitForTimeout(800);
await page.setInputFiles('input[type=file][accept="image/*"]', {
  name: "lecture-notes.txt",
  mimeType: "text/plain",
  buffer: Buffer.from("not an image"),
});
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/s13-math-solver-mime-guard.png` });

// 3. The mobile drawer on the remediated build (the standing priority).
const mobile = await context.newPage();
await mobile.setViewportSize({ width: 390, height: 844 });
await mobile.goto(`${BASE}/Dashboard`);
await mobile.waitForFunction(() => document.querySelector("main h1") !== null, null, { timeout: 20000 });
await mobile.waitForTimeout(1200);
await mobile.getByLabel("Open navigation menu").click();
await mobile.waitForTimeout(800);
await mobile.screenshot({ path: `${OUT}/s13-mobile-drawer.png` });
await mobile.keyboard.press("Escape");

// 4. The Files view (the hardened upload surface).
await page.goto(`${BASE}/Files`);
await page.waitForFunction(() => document.querySelector("main h1")?.textContent.trim() === "Files", null, { timeout: 20000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/s13-files-view.png` });

await browser.close();
console.log(`[s13-evidence] 4 captures written to ${OUT}/`);
