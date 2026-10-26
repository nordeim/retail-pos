// S15 evidence captures — the remediated auth-flow surfaces + the calculator
// keyboard superset, saved to docs/screenshots/s15-*.png (follows the
// capture-s14-evidence.mjs precedent: dev server on :3000, deterministic
// states). No default-media visual changed on the 20 app views — the standard
// 31 captures remain the parity record; these document the NEW surfaces.
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";
const EMAIL = `s15-evidence-${Date.now()}@example.com`;
const PASSWORD = "Evidence1234!";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

// 1. The sign-in card with the INLINE error (wrong password) — S15-A1.
await page.goto(`${BASE}/login`);
await page.fill("input[type=email]", "demo@studyflow.app");
await page.fill("input[type=password]", "wrong-password-1");
await page.click("button[type=submit]");
await page.waitForSelector('[role="alert"]');
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/s15-login-inline-error.png` });

// 2. The signup screen (fresh state).
await page.goto(`${BASE}/login`);
await page.getByRole("button", { name: /sign up/i }).click();
await page.waitForSelector("h2");
await page.fill("#signup-email", EMAIL);
await page.fill("#signup-password", PASSWORD);
await page.fill("#signup-confirm", PASSWORD);
await page.screenshot({ path: `${OUT}/s15-signup-form.png` });

// 3. Register → the verify screen (with the self-hosted code note visible).
// Wait for the VERIFY h2 by text — the signup screen has its own h2, so a
// bare h2 wait resolves before the register round-trip completes.
await page.getByRole("button", { name: /create account/i }).click();
await page.waitForSelector("h2:has-text('Verify your email')", { timeout: 15000 });
const code = await page.evaluate(() => {
  const note = [...document.querySelectorAll("p")].find((p) =>
    p.textContent.includes("your code is"),
  );
  return note?.textContent.match(/\b(\d{6})\b/)?.[1] ?? null;
});
const boxes = page.locator("input[inputmode=numeric]");
for (let i = 0; i < 6; i++) {
  await boxes.nth(i).fill(String(code).charAt(i));
}
await page.waitForFunction(
  () => [...document.querySelectorAll("input[inputmode=numeric]")].every((b) => b.value !== ""),
  null,
  { timeout: 8000 },
);
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/s15-verify-otp.png` });

// 4. The check-email screen (green alert + reset link note) — forgot flow.
await page.context().clearCookies();
await page.goto(`${BASE}/login`);
await page.getByRole("button", { name: /forgot password/i }).click();
await page.waitForSelector("#forgot-email");
await page.fill("#forgot-email", EMAIL);
await page.getByRole("button", { name: /send reset link/i }).click();
await page.waitForSelector("h2");
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/s15-check-email.png` });

// 5. The calculator physical-keyboard superset: a typed expression, its
//    evaluated result, and the history drawer noting the keyboard-driven row.
await page.goto(`${BASE}/login`);
await page.fill("input[type=email]", "demo@studyflow.app");
await page.fill("input[type=password]", "Demo1234!");
await page.click("button[type=submit]");
await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 20000 });
await page.goto(`${BASE}/Calculator`);
await page.waitForFunction(
  () => document.documentElement.style.getPropertyValue("--sf-primary") !== "",
  null,
  { timeout: 20000 },
);
await page.waitForTimeout(900);
await page.keyboard.type("12*8", { delay: 60 });
await page.waitForTimeout(400);
await page.keyboard.press("Enter");
await page.waitForFunction(
  () => page.getByLabel("Calculator display") && true,
).catch(() => {});
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/s15-calculator-keyboard.png` });

await browser.close();
console.log("S15 evidence captures saved:", [
  "s15-login-inline-error.png",
  "s15-signup-form.png",
  "s15-verify-otp.png",
  "s15-check-email.png",
  "s15-calculator-keyboard.png",
]);
