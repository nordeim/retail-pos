// S15 reference-site auth-flow probe — captures the exact copy, DOM structure
// and geometry of the reference (omni-study1.base44.app) auth sub-screens:
//   1. login inline error rendering (wrong password)
//   2. signup ("Create your account") screen
//   3. verify-email (6-digit OTP) screen reached after registering
//   4. login of an UNVERIFIED account (the gate copy)
//   5. forgot-password 3-state flow ("Reset your password" → check-email)
// The findings feed docs/remediation-plan-session15.md. JSON output only.
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
const REF_EMAIL = "sepnetflix2023@outlook.com";
const REF_PASSWORD = "$Abcd1234";
const PROBE_EMAIL = `s15probe${Date.now()}@outlook.com`;
const OUT = "/tmp/s15-ref-auth-probe.json";

const findings = {};

function text(el) {
  return el ? el.textContent.trim() : null;
}

async function captureStructure(page, label) {
  return page.evaluate((lbl) => {
    const card = document.querySelector("div.shadow-2xl") || document.body;
    const cardBox = card.getBoundingClientRect();
    const out = {
      label: lbl,
      cardWidth: Math.round(cardBox.width),
      headings: [...card.querySelectorAll("h1, h2, h3")].map((h) => ({
        tag: h.tagName,
        text: h.textContent.trim(),
        fontSize: getComputedStyle(h).fontSize,
        fontWeight: getComputedStyle(h).fontWeight,
      })),
      labels: [...card.querySelectorAll("label")].map((l) => l.textContent.trim()),
      buttons: [...card.querySelectorAll("button")].map((b) => ({
        text: b.textContent.trim().slice(0, 40),
        type: b.type,
        classes: b.className.split(" ").slice(0, 6).join(" "),
        visible: b.getBoundingClientRect().width > 0,
      })),
      inputs: [...card.querySelectorAll("input")].map((i) => ({
        type: i.type,
        id: i.id,
        name: i.name,
        placeholder: i.placeholder,
        required: i.required,
        inputMode: i.inputMode,
        maxLength: i.maxLength,
        autoComplete: i.autocomplete,
        width: Math.round(i.getBoundingClientRect().width),
        height: Math.round(i.getBoundingClientRect().height),
      })),
      textSnippets: [...card.querySelectorAll("p, span, div")]
        .filter((el) => el.children.length === 0 && el.textContent.trim().length > 5)
        .map((el) => el.textContent.trim().slice(0, 90))
        .slice(0, 14),
      hasLogo: !!card.querySelector("svg, img"),
      hasH1: !!card.querySelector("h1"),
      alerts: [...card.querySelectorAll('[role="alert"]')].map((a) => ({
        text: a.textContent.trim().slice(0, 120),
        classes: a.className,
        prevLabel: a.previousElementSibling
          ? (a.previousElementSibling.querySelector("label")?.textContent.trim() ??
            a.previousElementSibling.textContent.trim().slice(0, 30))
          : null,
        nextButton: a.nextElementSibling?.textContent?.trim().slice(0, 30) ?? null,
      })),
    };
    // Geometry: back-link/button → first h2 vertical gap
    const back = [...card.querySelectorAll("button, a")].find((b) =>
      /^back/i.test(b.textContent.trim()),
    );
    const h2 = card.querySelector("h2");
    if (back && h2) {
      out.backToH2Gap = Math.round(h2.getBoundingClientRect().top - back.getBoundingClientRect().bottom);
    }
    return out;
  }, label);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

// ---- 1. Login screen baseline + wrong-password inline error ----------------
await page.goto(`${REF}/login`);
await page.waitForSelector("input[type=email]");
findings.login = await captureStructure(page, "login");

await page.fill("input[type=email]", REF_EMAIL);
await page.fill("input[type=password]", "wrong-password-1");
await page.click("button[type=submit]");
await page.waitForTimeout(2500);
findings.loginWrongPassword = await captureStructure(page, "login-wrong-password");
findings.loginWrongPasswordAlert = await page
  .locator('[role="alert"]')
  .first()
  .evaluate((el) => ({
    text: el.textContent.trim(),
    classes: el.className,
    color: getComputedStyle(el).color,
    fontSize: getComputedStyle(el).fontSize,
    display: getComputedStyle(el).display,
  }))
  .catch(() => null);
await page.screenshot({ path: "/tmp/s15-ref-login-error.png" });

// ---- 2. Signup screen ("Sign up" from the login card) ----------------------
await page.goto(`${REF}/login`);
await page.waitForSelector("input[type=email]");
await page.getByRole("button", { name: /sign up/i }).click();
await page.waitForTimeout(1200);
findings.signup = await captureStructure(page, "signup");
await page.screenshot({ path: "/tmp/s15-ref-signup.png" });

// ---- 3. Register the probe account → verify-email screen -------------------
await page.fill("input[type=email]", PROBE_EMAIL);
const pwInputs = page.locator("input[type=password]");
const pwCount = await pwInputs.count();
for (let i = 0; i < pwCount; i++) {
  await pwInputs.nth(i).fill("ProbePass1234!");
}
await page.screenshot({ path: "/tmp/s15-ref-signup-filled.png" });
await page.getByRole("button", { name: /create account|sign up|register/i }).click();
await page.waitForTimeout(3000);
findings.verify = await captureStructure(page, "verify-email");
// OTP box details
findings.verifyOtpBoxes = await page.evaluate(() => {
  const card = document.querySelector("div.shadow-2xl") || document.body;
  return [...card.querySelectorAll("input")]
    .filter((i) => i.type === "text" || i.type === "tel" || i.type === "number")
    .map((i) => ({
      width: Math.round(i.getBoundingClientRect().width),
      height: Math.round(i.getBoundingClientRect().height),
      maxLength: i.maxLength === -1 ? null : i.maxLength,
      inputMode: i.inputMode,
      classes: i.className.split(" ").slice(0, 8).join(" "),
    }));
});
await page.screenshot({ path: "/tmp/s15-ref-verify.png" });

// ---- 4. Unverified login gate -----------------------------------------------
await page.goto(`${REF}/login`);
await page.waitForSelector("input[type=email]");
await page.fill("input[type=email]", PROBE_EMAIL);
await page.fill("input[type=password]", "ProbePass1234!");
await page.click("button[type=submit]");
await page.waitForTimeout(2500);
findings.loginUnverified = await page
  .locator('[role="alert"]')
  .first()
  .evaluate((el) => ({ text: el.textContent.trim(), classes: el.className }))
  .catch(() => null);
await page.screenshot({ path: "/tmp/s15-ref-login-unverified.png" });

// ---- 5. Forgot-password 3-state flow ----------------------------------------
await page.goto(`${REF}/login`);
await page.waitForSelector("input[type=email]");
await page.getByRole("button", { name: /forgot password/i }).click();
await page.waitForTimeout(1200);
findings.forgot = await captureStructure(page, "forgot-password");
await page.screenshot({ path: "/tmp/s15-ref-forgot.png" });

// Submit the reset request (watch the network for the endpoint shape)
const seenRequests = [];
page.on("request", (r) => {
  if (r.url().includes("/api/") || r.url().includes("auth")) {
    seenRequests.push(`${r.method()} ${r.url().replace(REF, "")}`);
  }
});
await page.fill("input[type=email]", PROBE_EMAIL);
await page.getByRole("button", { name: /send reset link|send|reset/i }).click();
await page.waitForTimeout(3000);
findings.forgotCheckEmail = await captureStructure(page, "forgot-check-email");
findings.forgotNetworkCalls = seenRequests;
await page.screenshot({ path: "/tmp/s15-ref-forgot-check-email.png" });

// Duplicate-register behavior (platform re-sends → back at verify screen)
await page.goto(`${REF}/login`);
await page.waitForSelector("input[type=email]");
await page.getByRole("button", { name: /sign up/i }).click();
await page.waitForTimeout(1200);
await page.fill("input[type=email]", PROBE_EMAIL);
const pw2 = page.locator("input[type=password]");
for (let i = 0; i < await pw2.count(); i++) {
  await pw2.nth(i).fill("ProbePass1234!");
}
await page.getByRole("button", { name: /create account|sign up|register/i }).click();
await page.waitForTimeout(3000);
findings.duplicateRegister = await captureStructure(page, "duplicate-register");
findings.duplicateRegister.networkCalls = seenRequests.slice(-4);
await page.screenshot({ path: "/tmp/s15-ref-duplicate-register.png" });

await browser.close();

findings.probeEmail = PROBE_EMAIL;
await (await import("node:fs/promises")).writeFile(OUT, JSON.stringify(findings, null, 2));
console.log(`saved ${OUT}`);
console.log(JSON.stringify(findings, null, 2));
