// S15 auth-flow audit — probes the CLONE (dev server :3000) auth surface and
// compares against the reference ground truth captured by
// scripts/ref-auth-probe-s15.mjs. Pre-fix run records the findings (A1/A2/A3);
// post-fix run must be all GREEN. JSON verdict to stdout.
import { chromium } from "playwright";

const CLONE = "http://localhost:3000";
const DEMO = { email: "demo@studyflow.app", password: "Demo1234!" };

const findings = [];
const nonGaps = [];
const record = (id, ok, detail) =>
  findings.push({ id, ok, detail });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
await page.goto(`${CLONE}/login`);
await page.waitForSelector("input[type=email]");

// A1 — wrong password renders INLINE (role=alert, between Password and Sign in)
await page.fill("input[type=email]", DEMO.email);
await page.fill("input[type=password]", "wrong-password-1");
await page.click("button[type=submit]");
await page.waitForTimeout(2000);
const a1 = await page.evaluate(() => {
  const alert = document.querySelector('[role="alert"]');
  const toast = [...document.querySelectorAll("[data-slot], [role=status], [aria-live]")].find(
    (el) => el.textContent.includes("Invalid email or password"),
  );
  const order = alert
    ? {
        afterPassword: !!alert.previousElementSibling?.querySelector('input[type=password]') ||
          (alert.previousElementSibling?.querySelector("label")?.textContent === "Password"),
        beforeSubmit: alert.nextElementSibling?.querySelector('button[type=submit]') !== null ||
          alert.nextElementSibling?.tagName === "BUTTON",
      }
    : null;
  return {
    hasInlineAlert: !!alert,
    alertText: alert?.textContent.trim() ?? null,
    alertClasses: alert?.className.slice(0, 120) ?? null,
    order,
    hasToastError: !!toast,
  };
});
record("A1-inline-login-error", a1.hasInlineAlert && a1.order?.afterPassword === true && a1.order?.beforeSubmit === true,
  JSON.stringify(a1));

// A3 — Sign up opens the real Create-your-account form
await page.goto(`${CLONE}/login`);
await page.waitForSelector("input[type=email]");
await page.getByRole("button", { name: /sign up/i }).click();
await page.waitForTimeout(800);
const a3 = await page.evaluate(() => {
  const h2 = document.querySelector("h2");
  const labels = [...document.querySelectorAll("label")].map((l) => l.textContent.trim());
  const buttons = [...document.querySelectorAll("button")].map((b) => b.textContent.trim());
  return {
    h2: h2?.textContent.trim() ?? null,
    labels,
    hasConfirm: labels.includes("Confirm Password"),
    back: buttons.includes("Back to sign in"),
    create: buttons.some((b) => /create account/i.test(b)),
  };
});
record("A3-signup-form", a3.h2 === "Create your account" && a3.hasConfirm && a3.back && a3.create,
  JSON.stringify(a3));

// A2 — Forgot password opens the Reset-your-password flow
await page.goto(`${CLONE}/login`);
await page.waitForSelector("input[type=email]");
await page.getByRole("button", { name: /forgot password/i }).click();
await page.waitForTimeout(800);
const a2 = await page.evaluate(() => {
  const h2 = document.querySelector("h2");
  const buttons = [...document.querySelectorAll("button")].map((b) => b.textContent.trim());
  return {
    h2: h2?.textContent.trim() ?? null,
    sendReset: buttons.some((b) => /send reset link/i.test(b)),
    back: buttons.includes("Back to sign in"),
  };
});
record("A2-forgot-flow", a2.h2 === "Reset your password" && a2.sendReset && a2.back,
  JSON.stringify(a2));

await browser.close();
console.log(JSON.stringify({ findings, nonGaps }, null, 2));
process.exit(findings.every((f) => f.ok) ? 0 : 1);
