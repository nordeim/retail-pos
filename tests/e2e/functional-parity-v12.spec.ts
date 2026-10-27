import { execSync } from "node:child_process";
import path from "node:path";

import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// E2e pins for remediation-plan-v12 — the AUTH surface family, measured
// below the card level for the first time (agent-browser on BOTH apps at
// 1280 + 390; docs/remediation-plan-v12 §0 L4-L16):
//
// F1 the auth card chrome: the 4px slate gradient hairline at the card's
//    top edge, overflow-hidden, the md: padding step (pt-12/pb-10/px-10).
// F2 the login grammar: the responsive H1 (24/30px) + subtext (14/16px,
//    500), the 16px social text (54px buttons), the sm:flex-row footer
//    (Forgot left, Sign up right), the h-11 sm:h-12 submit (44px mobile).
// F3 the forgot/sent screens: the back-at-top, the 24px H2, the SMALLER
//    controls (h-10 sm:h-11), the sent screen's icon circle + green alert.
// F4 the /reset-password page: the platform template (white page, the
//    rounded-lg card + the 2px gray-900 strip, the h-11 gray pair, the
//    invalid-token state) + a full reset round-trip (the superset proof).
// F5 the error alert: the shadcn Alert shape (red-50/70, red-200 border,
//    12px radius, p-4, red-700 14px text) on a wrong-password login.
//
// Probe lessons (v11/v12): transition-all buttons animate through viewport
// changes — settle-wait ~300ms before measuring; Tailwind v4 resolves
// palette colors through oklab()/lab() in this Chromium — assert class
// facts or probe-compare, never literal rgb strings.
// ---------------------------------------------------------------------------

const repo = path.resolve(__dirname, "..", "..");

/** Read the latest reset token for an email straight from the e2e DB (the
 *  security.spec precedent — the e2e server runs the PRODUCTION delivery
 *  posture, so the response never carries the one-shot token). */
function probeLatestResetToken(email: string): string {
  const script =
    "const {Database} = require('bun:sqlite'); " +
    "const db = new Database(process.env.E2E_DB_PATH, {readonly: true}); " +
    "const row = db.query('SELECT t.token FROM PasswordResetToken t " +
    "JOIN User u ON u.id = t.userId WHERE u.email = ? " +
    "ORDER BY t.createdAt DESC LIMIT 1').get(process.env.PROBE_EMAIL); " +
    "console.log(JSON.stringify(row));";
  const out = execSync(`bun -e "${script}"`, {
    cwd: repo,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      E2E_DB_PATH: path.join(repo, "db", "e2e.db"),
      PROBE_EMAIL: email,
      NO_COLOR: "1",
      FORCE_COLOR: "0",
      TERM: "dumb",
    } as NodeJS.ProcessEnv,
  }).toString();
  const cleaned = out.replace(/[\u0000-\u001f\u007f]/g, "");
  const parsed = JSON.parse(cleaned.trim().split("\n").pop() ?? "null") as {
    token: string;
  } | null;
  if (!parsed?.token) throw new Error(`No reset token found for ${email}`);
  return parsed.token;
}

/** The settle-wait after a viewport change: the auth buttons ride
 *  transition-all duration-200, so a height read mid-transition catches
 *  the animating value (the v11 outline lesson generalized). */
const SETTLE = 350;

test.describe("functional parity (v12) — the auth card chrome (F1)", () => {
  test("the 4px slate gradient hairline rides the card's top edge", async ({ page }) => {
    await page.goto("/login");
    const hairline = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>(
        '[class*="h-1"][class*="top-0"]',
      );
      if (!el) return null;
      const card = el.parentElement!;
      const hr = el.getBoundingClientRect();
      const cr = card.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        h: hr.height,
        atTop: Math.abs(hr.top - cr.top) < 1,
        spansWidth: Math.abs(hr.width - cr.width) < 1,
        bg: cs.backgroundImage,
      };
    });
    expect(hairline).toBeTruthy();
    expect(hairline!.h).toBe(4);
    expect(hairline!.atTop).toBe(true);
    expect(hairline!.spansWidth).toBe(true);
    expect(hairline!.bg).toContain("linear-gradient");
  });

  test("the card clips (overflow hidden) and steps its padding at md", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    const card = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>("main div.max-w-md")!;
      const cs = getComputedStyle(el);
      return { overflow: cs.overflow, pt: cs.paddingTop, pb: cs.paddingBottom, px: cs.paddingLeft };
    });
    expect(card.overflow).toBe("hidden");
    // md:pt-12 md:pb-10 md:px-10 at >=768
    expect(card.pt).toBe("48px");
    expect(card.pb).toBe("40px");
    expect(card.px).toBe("40px");
  });
});

test.describe("functional parity (v12) — the login grammar (F2)", () => {
  test("the H1 + subtext are responsive (24/14px at 390; 30/16px medium at 1280)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    const mobile = await page.evaluate(() => ({
      h1: getComputedStyle(document.querySelector("h1")!).fontSize,
      sub: getComputedStyle(document.querySelector("h1 + p, h1 ~ p")!).fontSize,
    }));
    expect(mobile.h1).toBe("24px");
    expect(mobile.sub).toBe("14px");

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(SETTLE);
    const desktop = await page.evaluate(() => {
      const p = document.querySelector("h1 + p, h1 ~ p")!;
      return { h1: getComputedStyle(document.querySelector("h1")!).fontSize, sub: getComputedStyle(p).fontSize, weight: getComputedStyle(p).fontWeight };
    });
    expect(desktop.h1).toBe("30px");
    expect(desktop.sub).toBe("16px");
    expect(desktop.weight).toBe("500");
  });

  test("the social buttons render 16px text (54px tall at 1280)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    const social = await page.getByTestId("social-google").evaluate((el) => ({
      size: getComputedStyle(el).fontSize,
      h: Math.round(el.getBoundingClientRect().height),
    }));
    expect(social.size).toBe("16px");
    expect(social.h).toBe(54);
  });

  test("the submit is 44px at 390 / 48px at 1280 (h-11 sm:h-12)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    const mobile = await page.getByTestId("login-submit").evaluate(
      (el) => Math.round(el.getBoundingClientRect().height),
    );
    expect(mobile).toBe(44);

    await page.setViewportSize({ width: 1280, height: 800 });
    // transition-all duration-200 — settle before reading (v11 lesson).
    await page.waitForTimeout(SETTLE);
    const desktop = await page.getByTestId("login-submit").evaluate(
      (el) => Math.round(el.getBoundingClientRect().height),
    );
    expect(desktop).toBe(48);
  });

  test("the Forgot/Sign-up footer row: side-by-side at 1280, stacked at 390", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    const row = await page.evaluate(() => {
      const forgot = Array.from(document.querySelectorAll("button, a")).find(
        (e) => e.textContent?.trim() === "Forgot password?",
      )!;
      const signup = Array.from(document.querySelectorAll("button, a")).find(
        (e) => e.textContent?.includes("Need an account? Sign up"),
      )!;
      const fr = forgot.getBoundingClientRect();
      const sr = signup.getBoundingClientRect();
      return { dy: Math.abs(fr.y - sr.y), forgotLeft: fr.x < sr.x, inForm: !!forgot.closest("form") };
    });
    expect(row.dy).toBeLessThan(5);
    expect(row.forgotLeft).toBe(true);
    expect(row.inForm).toBe(true);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(SETTLE);
    const stacked = await page.evaluate(() => {
      const forgot = Array.from(document.querySelectorAll("button, a")).find(
        (e) => e.textContent?.trim() === "Forgot password?",
      )!;
      const signup = Array.from(document.querySelectorAll("button, a")).find(
        (e) => e.textContent?.includes("Need an account? Sign up"),
      )!;
      return Math.abs(forgot.getBoundingClientRect().y - signup.getBoundingClientRect().y);
    });
    expect(stacked).toBeGreaterThan(10);
  });

  test("the OR chip renders the uppercased 'or' in slate-500 with tracking", async ({ page }) => {
    await page.goto("/login");
    const chip = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll("span"));
      const el = spans.find((s) => s.textContent.trim().toLowerCase() === "or");
      if (!el) return null;
      const cs = getComputedStyle(el);
      // Probe-compare the color (v4 compiles slate-500 through oklab/lab —
      // never assert a literal rgb string).
      const probe = document.createElement("span");
      probe.className = "text-slate-500";
      probe.style.display = "none";
      document.body.appendChild(probe);
      const probeColor = getComputedStyle(probe).color;
      probe.remove();
      return {
        text: el.textContent,
        transform: getComputedStyle(el.parentElement!).textTransform,
        color: cs.color,
        probeColor,
        spacing: cs.letterSpacing !== "normal",
      };
    });
    expect(chip).toBeTruthy();
    expect(chip!.text.trim()).toBe("or");
    expect(chip!.transform).toBe("uppercase");
    expect(chip!.color).toBe(chip!.probeColor);
    expect(chip!.spacing).toBe(true);
  });
});

test.describe("functional parity (v12) — the forgot + sent screens (F3)", () => {
  test("the forgot screen: back ABOVE the H2, 24px heading, English copy", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    await page.getByText("Forgot password?").click();
    await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
    const geo = await page.evaluate(() => {
      const back = Array.from(document.querySelectorAll("button")).find(
        (e) => e.textContent.includes("Back to sign in"),
      )!;
      const h2 = document.querySelector("h2")!;
      // The reference's -mb-2 tucks the H2's box UP over the back button's
      // margin box — the observable order is the TOPS (back starts higher).
      return {
        backTopAbove: back.getBoundingClientRect().top < h2.getBoundingClientRect().top,
        h2size: getComputedStyle(h2).fontSize,
      };
    });
    expect(geo.backTopAbove).toBe(true);
    expect(geo.h2size).toBe("24px");
    await expect(page.getByText("Enter your email and we'll send you a link")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
  });

  test("the forgot controls are the smaller size (44px at 1280 / 40px at 390)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    await page.getByText("Forgot password?").click();
    const input = page.locator("form input").first();
    const mobile = await input.evaluate((el) => Math.round(el.getBoundingClientRect().height));
    expect(mobile).toBe(40);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(SETTLE);
    const desktop = await input.evaluate((el) => Math.round(el.getBoundingClientRect().height));
    expect(desktop).toBe(44);
    const send = await page
      .getByRole("button", { name: "Send reset link" })
      .evaluate((el) => Math.round(el.getBoundingClientRect().height));
    expect(send).toBe(44);
  });

  test("the sent screen: the icon circle + the green alert (the production posture)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    await page.getByText("Forgot password?").click();
    await page.getByLabel("Email").fill("owner@veloxpos.local");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();

    const sent = await page.evaluate(() => {
      const circle = document.querySelector<HTMLElement>(
        '[class*="rounded-full"][class*="bg-slate-100"]',
      );
      const alert = document.querySelector<HTMLElement>('[class*="bg-green-50"]');
      const acs = alert ? getComputedStyle(alert) : null;
      return {
        circle: circle ? Math.round(circle.getBoundingClientRect().width) : 0,
        alertBg: acs?.backgroundColor ?? "",
        alertBorderW: acs?.borderTopWidth ?? "",
        alertRadius: acs?.borderRadius ?? "",
        alertPad: acs?.padding ?? "",
      };
    });
    expect(sent.circle).toBe(64);
    // green-50/70 through v4 = oklab(... / 0.7) — assert the alpha family
    // (the card's 0.95 precedent) + the shape facts.
    expect(sent.alertBg).toContain("/ 0.7)");
    expect(sent.alertBorderW).toBe("1px");
    expect(sent.alertRadius).toBe("12px");
    expect(sent.alertPad).toBe("16px");
    await expect(
      page.getByText("Please check your email for the password reset link."),
    ).toBeVisible();
    // The in-app delivery link is the DEV-mode superset (unit-pinned; the
    // e2e server runs the production posture — no resetPath in responses).
  });
});

test.describe("functional parity (v12) — the reset page (F4)", () => {
  test("no token: the Invalid Reset Link state with the 80px red circle", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: "Invalid Reset Link" })).toBeVisible();
    await expect(
      page.getByText("This password reset link is invalid or has expired."),
    ).toBeVisible();
    const circle = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>('[class*="bg-red-100"]');
      return el ? Math.round(el.getBoundingClientRect().width) : 0;
    });
    expect(circle).toBe(80);
    await expect(page.getByRole("link", { name: "Back to Login" })).toBeVisible();
  });

  test("with a token: the platform template (strip, card radius, the 44px pair)", async ({ page }) => {
    await page.goto("/reset-password?token=anything");
    await expect(page.getByRole("heading", { name: "Set new password" })).toBeVisible();
    const tpl = await page.evaluate(() => {
      const strip = document.querySelector<HTMLElement>('[class*="h-0.5"][class*="bg-gray-900"]');
      const card = document.querySelector<HTMLElement>('div[class*="rounded-lg"]') ?? document.querySelector("main div.max-w-md")!;
      const inputs = Array.from(document.querySelectorAll('input[type="password"]'));
      // Probe-compare the strip color (v4 → lab()).
      const probe = document.createElement("div");
      probe.className = "bg-gray-900";
      probe.style.display = "none";
      document.body.appendChild(probe);
      const probeBg = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return {
        stripH: strip ? strip.getBoundingClientRect().height : 0,
        stripBg: strip ? getComputedStyle(strip).backgroundColor : "",
        probeBg,
        radius: getComputedStyle(card).borderRadius,
        inputH: inputs.map((i) => Math.round(i.getBoundingClientRect().height)),
        pageBg: getComputedStyle(document.querySelector("main")!).backgroundColor,
      };
    });
    expect(tpl.stripH).toBe(2);
    expect(tpl.stripBg).toBe(tpl.probeBg);
    expect(tpl.radius).toBe("8px");
    expect(tpl.inputH).toEqual([44, 44]);
    expect(tpl.pageBg).toBe("rgb(255, 255, 255)");
    await expect(page.getByText("Must be at least 8 characters").first()).toBeVisible();
  });

  test("the full reset round-trip on a scratch user (the functional superset proof)", async ({
    page,
  }) => {
    // A SCRATCH user — resetting the owner would bump tokenVersion and kill
    // the storageState session every later spec rides (the v10 order lesson).
    const email = `reset-v12-${Date.now()}@veloxpos.local`;
    const register = await page.request.post("/api/auth/register", {
      data: { name: "Reset Pin", email, password: "Demo1234!" },
    });
    // Login gates unverified accounts — complete the verify step first
    // (the no-SMTP delivery: the OTP rides the register response).
    const { code } = (await register.json()) as { ok: boolean; code: string };
    await page.request.post("/api/auth/verify-email", { data: { email, code } });

    // The e2e server runs the PRODUCTION delivery posture — the one-shot
    // token is read from the e2e DB (the security.spec precedent), exactly
    // like reading it from the email the reference would have sent.
    await page.request.post("/api/auth/forgot-password", { data: { email } });
    const token = probeLatestResetToken(email);

    await page.goto(`/reset-password?token=${encodeURIComponent(token)}`);
    await expect(page.getByRole("heading", { name: "Set new password" })).toBeVisible();

    // Client gates: too short + mismatch.
    await page.getByLabel("New Password", { exact: true }).fill("short");
    await page.getByLabel("Confirm New Password", { exact: true }).fill("short");
    await page.getByRole("button", { name: "Reset password" }).click();
    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();

    await page.getByLabel("New Password", { exact: true }).fill("FreshPass123!");
    await page.getByLabel("Confirm New Password", { exact: true }).fill("Different123!");
    await page.getByRole("button", { name: "Reset password" }).click();
    await expect(page.getByText("Passwords do not match")).toBeVisible();

    // The real reset — success lands on /login.
    await page.getByLabel("New Password", { exact: true }).fill("FreshPass123!");
    await page.getByLabel("Confirm New Password", { exact: true }).fill("FreshPass123!");
    await page.getByRole("button", { name: "Reset password" }).click();
    await page.waitForURL("/login", { timeout: 15000 });

    // Log in with the NEW password (the reset actually took).
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("FreshPass123!");
    await page.getByTestId("login-submit").click();
    await page.waitForURL("/", { timeout: 15000 });
  });
});

test.describe("functional parity (v12) — the error alert (F5)", () => {
  test("a wrong password renders the shadcn Alert shape (12px, red-50/70, red-200)", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("owner@veloxpos.local");
    await page.getByLabel("Password").fill("wrong-password-xyz");
    await page.getByTestId("login-submit").click();
    const alert = page.locator('[role="alert"][data-testid="auth-error"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Invalid email or password");
    const skin = await alert.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        radius: cs.borderRadius,
        borderWidth: cs.borderTopWidth,
        pad: cs.padding,
        color: getComputedStyle(el.querySelector("div")!).color,
        size: getComputedStyle(el.querySelector("div")!).fontSize,
        lineHeight: getComputedStyle(el.querySelector("div")!).lineHeight,
      };
    });
    expect(skin.radius).toBe("12px");
    expect(skin.borderWidth).toBe("1px");
    expect(skin.pad).toBe("16px");
    expect(skin.size).toBe("14px");
    // leading-relaxed on 14px text = 1.625 line-height.
    expect(skin.lineHeight).toBe("22.75px");
  });
});
