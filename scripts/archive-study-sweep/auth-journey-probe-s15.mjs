// S15 full auth-journey probe (dev server): register → verify (code from the
// self-hosted note) → dashboard; then forgot → check-email → reset link →
// new password → sign in. Verifies the whole state machine end-to-end.
import { chromium } from "playwright";

const CLONE = "http://localhost:3000";
const EMAIL = `journey${Date.now()}@example.com`;
const PASSWORD = "JourneyPass123!";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const steps = [];
const ok = (name, cond, extra = "") => steps.push({ name, ok: !!cond, extra });

await page.goto(`${CLONE}/login`);
await page.waitForSelector("input[type=email]");

// 1. signup
await page.getByRole("button", { name: /sign up/i }).click();
await page.waitForSelector("#signup-email");
await page.fill("#signup-email", EMAIL);
await page.fill("#signup-password", PASSWORD);
await page.fill("#signup-confirm", PASSWORD);
await page.getByRole("button", { name: /create account/i }).click();
await page.waitForSelector("h2:has-text('Verify your email')", { timeout: 10000 });
ok("signup → verify screen", true);

// 2. read the surfaced code from the self-hosted note
const code = await page.evaluate(() => {
  const note = [...document.querySelectorAll("p")].find((p) =>
    p.textContent.includes("your code is"),
  );
  const m = note?.textContent.match(/\b(\d{6})\b/) ?? null;
  return m ? m[1] : null;
});
ok("self-hosted code surfaced", code, `code=${code}`);

// 3. enter the OTP
const boxes = page.locator("input[inputmode=numeric]");
for (let i = 0; i < 6; i++) {
  await boxes.nth(i).fill(String(code).charAt(i));
}
await page.getByRole("button", { name: /verify email/i }).click();
await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 20000 });
ok("verify → app (main rendered)", true);

// 4. unverified login gate (fresh user, no verify)
const EMAIL2 = `gate${Date.now()}@example.com`;
await page.context().clearCookies();
await page.goto(`${CLONE}/login`);
await page.getByRole("button", { name: /sign up/i }).click();
await page.fill("#signup-email", EMAIL2);
await page.fill("#signup-password", PASSWORD);
await page.fill("#signup-confirm", PASSWORD);
await page.getByRole("button", { name: /create account/i }).click();
await page.waitForSelector("h2:has-text('Verify your email')");
await page.getByRole("button", { name: /back to sign in/i }).click();
await page.waitForSelector("#email");
await page.fill("#email", EMAIL2);
await page.fill("#password", PASSWORD);
await page.getByRole("button", { name: "Sign in", exact: true }).click();
await page.waitForSelector('[role="alert"]', { timeout: 10000 });
await page.waitForTimeout(800);
const gateText = await page.locator('[role="alert"]').first().textContent();

ok("unverified login gate", gateText?.includes("Please verify your email before logging in"), gateText?.slice(0, 60));

// 5. forgot → check-email → reset link → reset → sign in with new password
await page.goto(`${CLONE}/login`);
await page.getByRole("button", { name: /forgot password/i }).click();
await page.waitForSelector("#forgot-email");
await page.fill("#forgot-email", EMAIL);
await page.getByRole("button", { name: /send reset link/i }).click();
await page.waitForSelector("h2:has-text('Check your email')", { timeout: 10000 });
ok("forgot → check-email screen", true);
const link = await page.locator('a:has-text("Open your reset link")').getAttribute("href");
ok("reset link surfaced", !!link, `href=${link?.slice(0, 30)}…`);

await page.goto(`${CLONE}${link}`);
await page.waitForSelector("h2:has-text('Reset your password')", { timeout: 10000 });
ok("reset deep-link screen", true);
await page.fill("#reset-password", "NewJourney123!");
await page.fill("#reset-confirm", "NewJourney123!");
await page.getByRole("button", { name: /reset password/i }).click();
await page.waitForSelector("#email", { timeout: 10000 });
const notice = await page.locator('[role="alert"]').first().textContent().catch(() => null);
ok("reset → back at signin with success note", notice?.includes("Password reset successfully"), notice?.slice(0, 50) ?? "");

await page.fill("#email", EMAIL);
await page.fill("#password", "NewJourney123!");
await page.getByRole("button", { name: "Sign in", exact: true }).click();
await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 20000 });
ok("new password signs in", true);

await browser.close();
console.log(JSON.stringify(steps, null, 2));
process.exit(steps.every((s) => s.ok) ? 0 : 1);
