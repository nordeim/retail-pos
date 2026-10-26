// S16 mobile auth-geometry probe — the S15 auth sub-screens (signup, verify,
// forgot, check-email, reset) were measured and built at DESKTOP geometry;
// mobile (390x844) was never probed on either app. This probe walks the
// same sub-screen journey on BOTH apps at mobile viewport and records the
// geometry that matters: card width vs viewport, h2 metrics, input heights,
// primary button height + full-width behavior, Back-link position, and
// horizontal overflow (scrollWidth vs clientWidth — the mobile killer).
// The clone probe registers a throwaway account (S15A16- prefix) and
// cleans nothing (unverified accounts are inert); the reference probe
// registers its own throwaway (the platform re-sends on duplicates).
import { chromium } from "playwright";

const BASE = process.env.CWV_BASE ?? "http://localhost:3200";
const REF = "https://omni-study1.base44.app";
const STAMP = Date.now().toString(36);

const geo = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return {
    x: Math.round(r.x),
    y: Math.round(r.y),
    w: Math.round(r.width),
    h: Math.round(r.height),
    font: cs.fontSize,
    weight: cs.fontWeight,
  };
};

async function screenGeo(page) {
  return page.evaluate(() => {
    const card = document.querySelector("div.shadow-2xl") ?? document.querySelector("form")?.parentElement;
    const h2 = document.querySelector("h2");
    const inputs = [...document.querySelectorAll("input:not([type=hidden])")];
    const primary = [...document.querySelectorAll("button[type=submit], button")].find(
      (b) => /sign in|sign up|send|verify|reset|create/i.test(b.textContent ?? "")
    );
    const back = [...document.querySelectorAll("button, a")].find((b) =>
      /back to sign in|back/i.test(b.textContent ?? "")
    );
    const q = (s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
        font: cs.fontSize,
        weight: cs.fontWeight,
      };
    };
    const overflowX = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return {
      viewportW: document.documentElement.clientWidth,
      overflowX,
      card: card ? q("div.shadow-2xl") ?? { x: Math.round(card.getBoundingClientRect().x), w: Math.round(card.getBoundingClientRect().width) } : null,
      h2: h2 ? q("h2") : null,
      h2Text: h2?.textContent?.trim() ?? null,
      inputCount: inputs.length,
      firstInput: inputs[0]
        ? {
            h: Math.round(inputs[0].getBoundingClientRect().height),
            w: Math.round(inputs[0].getBoundingClientRect().width),
          }
        : null,
      primary: primary
        ? {
            text: primary.textContent?.trim(),
            h: Math.round(primary.getBoundingClientRect().height),
            w: Math.round(primary.getBoundingClientRect().width),
            x: Math.round(primary.getBoundingClientRect().x),
          }
        : null,
      back: back
        ? {
            text: back.textContent?.trim(),
            y: Math.round(back.getBoundingClientRect().y),
            x: Math.round(back.getBoundingClientRect().x),
          }
        : null,
    };
  });
}

async function runClone(browser) {
  const out = {};
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "load" });
  await page.waitForSelector("div.shadow-2xl");
  out.signin = await screenGeo(page);

  // -> signup
  await page.click("text=Sign up");
  await page.waitForSelector("h2:has-text('Create your account')");
  out.signup = await screenGeo(page);

  // -> register (throwaway) -> verify screen
  await page.fill("input[type=email]", `s16a-${STAMP}@outlook.com`);
  await page.fill("input[type=password]", "Probe1234!");
  await page.fill("input[type=password] >> nth=1", "Probe1234!");
  await page.click("button[type=submit]");
  await page.waitForSelector("h2:has-text('Verify your email')", { timeout: 15000 });
  out.verify = await screenGeo(page);

  // OTP boxes geometry
  out.verify.otpBoxes = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll("input[maxlength='1'], input[inputmode='numeric'][maxlength='1']")];
    return boxes.map((b) => {
      const r = b.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) };
    });
  });

  // -> back to signin -> forgot -> check-email
  await page.click("text=Back to sign in");
  await page.waitForFunction(() => {
    const inputs = [...document.querySelectorAll("input")];
    return inputs.some((i) => i.type === "password") && inputs.some((i) => i.type === "email");
  });
  await page.click("text=Forgot password?");
  await page.waitForSelector("h2:has-text('Reset your password')");
  out.forgot = await screenGeo(page);
  await page.fill("input[type=email]", `s16a-${STAMP}@outlook.com`);
  await page.click("button[type=submit]");
  await page.waitForSelector("h2:has-text('Check your email')");
  out.checkEmail = await screenGeo(page);

  // -> reset screen via a token deep-link shape (fabricate — geometry only)
  await page.goto(`${BASE}/login?token=${"ab".repeat(24)}`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  out.reset = await screenGeo(page);
  await context.close();
  return out;
}

async function runRef(browser) {
  const out = {};
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(`${REF}/login`, { waitUntil: "load" });
  await page.waitForSelector("div.shadow-2xl", { timeout: 30000 });
  out.signin = await screenGeo(page);

  await page.click("text=Sign up");
  await page.waitForSelector("h2:has-text('Create your account')");
  out.signup = await screenGeo(page);

  await page.fill("input[type=email]", `s16a-${STAMP}@outlook.com`);
  await page.fill("input[type=password]", "Probe1234!");
  await page.fill("input[type=password] >> nth=1", "Probe1234!");
  await page.click("button[type=submit]");
  await page.waitForSelector("h2:has-text('Verify your email')", { timeout: 30000 });
  out.verify = await screenGeo(page);
  out.verify.otpBoxes = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll("input[maxlength='1'], input[inputmode='numeric'][maxlength='1']")];
    return boxes.map((b) => {
      const r = b.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) };
    });
  });

  await page.click("text=Back to sign in");
  await page.waitForFunction(() => {
    const inputs = [...document.querySelectorAll("input")];
    return inputs.some((i) => i.type === "password") && inputs.some((i) => i.type === "email");
  });
  await page.click("text=Forgot password?");
  await page.waitForSelector("h2:has-text('Reset your password')");
  out.forgot = await screenGeo(page);
  await page.fill("input[type=email]", `s16a-${STAMP}@outlook.com`);
  await page.click("button[type=submit]");
  await page.waitForSelector("h2:has-text('Check your email')");
  out.checkEmail = await screenGeo(page);
  await context.close();
  return out;
}

async function main() {
  const browser = await chromium.launch();
  const clone = await runClone(browser);
  let ref = null;
  try {
    ref = await runRef(browser);
  } catch (e) {
    ref = { error: String(e).slice(0, 200) };
  }
  await browser.close();
  console.log(JSON.stringify({ clone, ref }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
