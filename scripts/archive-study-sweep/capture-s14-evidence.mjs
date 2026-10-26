// S14 evidence captures — the remediated ambient states, saved to
// docs/screenshots/s14-*.png (follows the capture-s13-evidence.mjs precedent:
// dev server on :3000, demo login, deterministic route interception / context
// offline so the captured states are reproducible). No default-media visual
// changed in session 14 — the standard 31 captures remain the parity record.
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

// 1. The offline banner + the human transport-failure toast + the S13
//    bounce-back, all in one frame: go offline on the AI view, send, and
//    capture the amber pill + "You appear to be offline" toast + the
//    composer holding the bounced-back text.
await page.goto(`${BASE}/AIAssistant`);
await page.waitForFunction(
  () => document.querySelector("main h1")?.textContent.trim() === "AI Study Assistant",
  null,
  { timeout: 20000 },
);
await page.waitForTimeout(1200);
const composer = page.getByLabel("Message the assistant");
await composer.fill("Summarize the causes of World War I");
await context.setOffline(true);
await composer.press("Enter");
await page.waitForFunction(
  () => document.querySelector("textarea[aria-label='Message the assistant']")?.value === "Summarize the causes of World War I",
  null,
  { timeout: 8000 },
).catch(() => {});
await page.waitForFunction(() => !!document.querySelector("[data-offline]"), null, { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/s14-offline-banner.png` });
await context.setOffline(false);
await page.waitForTimeout(600);
await page.reload();
await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 20000 });
await page.waitForTimeout(800);

// 2. The AI rate limit toast: exhaust the budget via direct API posts (the
//    storageState cookie rides the request context), then send from the UI
//    — the 429 lands as a clear toast while the composer recovers.
const cookieHeader = await context
  .cookies(BASE)
  .then((cookies) => cookies.map((c) => `${c.name}=${c.value}`).join("; "));
for (let i = 0; i < 21; i++) {
  await fetch(`${BASE}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: cookieHeader },
    body: JSON.stringify({ messages: "not-an-array" }),
  }).catch(() => {});
}
await page.goto(`${BASE}/AIAssistant`);
await page.waitForFunction(
  () => document.querySelector("main h1")?.textContent.trim() === "AI Study Assistant",
  null,
  { timeout: 20000 },
);
await page.waitForTimeout(1000);
await page.getByLabel("Message the assistant").fill("Explain photosynthesis");
await page.getByLabel("Send message").click();
await page.waitForFunction(
  () => [...document.querySelectorAll('[role="status"]')].some((t) => /Too many AI requests/i.test(t.textContent || "")),
  null,
  { timeout: 8000 },
).catch(() => {});
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/s14-ai-rate-limit.png` });

// 3. The display-name guard: a whitespace-only save toasts the clear error
//    and the profile keeps its value.
await page.goto(`${BASE}/Settings`);
await page.waitForFunction(() => !!document.querySelector('button[aria-label="Choose avatar 🎓"]'), null, { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('[role="tab"]:has-text("Profile")');
await page.waitForFunction(() => !!document.querySelector("#display-name"), null, { timeout: 10000 });
await page.waitForTimeout(400);
await page.locator("#display-name").fill("   ");
await page.click("button:has-text('Save profile')");
await page.waitForFunction(
  () => [...document.querySelectorAll('[role="status"]')].some((t) => /Display name cannot be empty/i.test(t.textContent || "")),
  null,
  { timeout: 8000 },
).catch(() => {});
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/s14-display-name-guard.png` });

// 4. The AI transcript live region + Thinking state: hold the chat route,
//    send, and capture the Thinking indicator (inside the aria-live pane —
//    the a11y tree in the shot's alt text is documented in the plan).
await page.goto(`${BASE}/AIAssistant`);
await page.waitForFunction(
  () => document.querySelector("main h1")?.textContent.trim() === "AI Study Assistant",
  null,
  { timeout: 20000 },
);
await page.waitForTimeout(1000);
await page.route("**/api/ai/chat", () => {
  /* held — never fulfills; the reload below kills the in-flight request
     BEFORE the unroute (unrouting alone lets a pending held request proceed
     to the real server — the S14 audit-tooling lesson) */
});
await page.getByLabel("Message the assistant").fill("Quiz me on integrals");
await page.getByLabel("Send message").click();
await page.waitForFunction(() => document.body.textContent.includes("Thinking"), null, { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/s14-ai-live-region-thinking.png` });
// Reload FIRST (document unload aborts the pending fetch), then unroute.
await page.reload();
await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 20000 });
await page.unroute("**/api/ai/chat");

await browser.close();
console.log("S14 evidence captures complete: offline-banner, ai-rate-limit, display-name-guard, ai-live-region-thinking");
