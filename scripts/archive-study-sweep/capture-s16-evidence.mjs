// S16 evidence captures — the remediated mobile auth geometry + the
// load-stability-fixed dashboard, saved to docs/screenshots/s16-*.png
// (follows the capture-s15 precedent: dev server on :3000, deterministic
// states). All S16 fixes are mobile-only responsive adjustments — the
// desktop renders are byte-identical to the standing 31-capture record;
// these document the MOBILE parity state.
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";
const EMAIL = `s16-evidence-${Date.now()}@example.com`;
const PASSWORD = "Evidence1234!";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();

// 1. The sign-in card at mobile — the 44px Sign in button (h-11 sm:h-12).
await page.goto(`${BASE}/login`);
await page.waitForSelector("div.shadow-2xl");
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/s16-login-mobile-signin.png` });

// 2. The signup screen at mobile — the 20px h2 (text-xl sm:text-2xl).
await page.getByRole("button", { name: /sign up/i }).click();
await page.waitForSelector("h2:has-text('Create your account')");
await page.fill("#signup-email", EMAIL);
await page.fill("#signup-password", PASSWORD);
await page.fill("#signup-confirm", PASSWORD);
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/s16-login-mobile-signup.png` });

// 3. Register → the verify screen at mobile — the 76px Back→h2 rhythm
//    (circle mb-5 sm:mb-8). Wait for the VERIFY h2 BY TEXT (the signup
//    screen has its own h2 — the AP-60b lesson).
await page.getByRole("button", { name: /create account/i }).click();
await page.waitForSelector("h2:has-text('Verify your email')", { timeout: 15000 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/s16-login-mobile-verify.png` });

// 4. Back → forgot at mobile — the 28px Back→h2 gap (h2 mt-2 sm:mt-4).
await page.getByRole("button", { name: /back to sign in/i }).click();
await page.waitForFunction(() =>
  [...document.querySelectorAll("input")].some((i) => i.type === "password"),
);
await page.getByRole("button", { name: /forgot password/i }).click();
await page.waitForSelector("h2:has-text('Reset your password')");
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/s16-login-mobile-forgot.png` });

// 5. Forgot submit → check-email at mobile (the green alert + envelope).
await page.fill("#forgot-email", EMAIL);
await page.getByRole("button", { name: /send reset link/i }).click();
await page.waitForSelector("h2:has-text('Check your email')", { timeout: 15000 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/s16-login-mobile-check-email.png` });

await context.close();

// 6. The dashboard at mobile — the CLS-fixed cold load surface. Login in a
//    fresh context (the measured journey), then capture the settled view.
const context2 = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
const page2 = await context2.newPage();
await page2.goto(`${BASE}/login`);
await page2.fill("input[type=email]", "demo@studyflow.app");
await page2.fill("input[type=password]", "Demo1234!");
await page2.click("button[type=submit]");
await page2.waitForFunction(
  () => /good (morning|afternoon|evening)/i.test(document.querySelector("main h1")?.textContent ?? ""),
  null,
  { timeout: 30000 },
);
await page2.waitForTimeout(1500);
await page2.screenshot({ path: `${OUT}/s16-dashboard-mobile.png` });
await context2.close();

await browser.close();
console.log("S16 evidence captured: 6 mobile captures in docs/screenshots/");
