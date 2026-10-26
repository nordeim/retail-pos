// Connectivity (offline/online) audit — session 14 (S14-A).
// Probes the clone's behavior when the network drops MID-SESSION:
//  1. AI send while offline — does the S13 rollback survive a real
//     transport failure (not just a route abort)? Toast + bounce-back?
//  2. Task create while offline — what does the user see? Data loss?
//  3. View navigation while offline — does the SPA shell still work?
//  4. Recovery: back online — does a retry succeed? Is there ANY
//     connectivity indicator anywhere (navigator.onLine listener)?
//  5. Hard load while offline — the auth gate bounces to /login?
//     What does the user see (the reference: hosted platform, unknown)?
// Follows the S13 audit conventions (dev server :3000, demo login,
// JSON findings, /tmp evidence, reload-between-probes).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "/tmp/s14-connectivity-evidence";
mkdirSync(OUT, { recursive: true });

const findings = [];
const nonGaps = [];
const note = (family, surface, detail) => findings.push({ family, surface, ...detail });
const ok = (surface, detail) => nonGaps.push({ surface, detail });

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  // S81/AH10 (the audit-tools repair): the login wait must prove
  // AUTHENTICATION, not main-element presence — the LOGIN PAGE itself has a
  // <main>, so this wait resolved pre-auth and the next goto raced the
  // login POST (ERR_ABORTED on the auth-gate bounce). The sweeps' pattern:
  // wait for the post-login /Dashboard redirect.
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });
}

async function openView(page, title, path) {
  await page.goto(`${BASE}/${path}`);
  await page.waitForFunction(
    (t) => {
      const h = document.querySelector("main h1");
      return h && h.textContent.trim() === t;
    },
    title,
    { timeout: 20000 },
  );
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
await login(page);

// ---------------------------------------------------------------------------
// Static code surface check: any offline handling at all?
// (typeof window.onoffline is ALWAYS non-"undefined" in Chromium — the
// honest check is whether the app ASSIGNS it: onoffline === null means
// nobody registered the handler. Verified against src/ by grep: no
// navigator.onLine / offline listener exists in the codebase.)
// ---------------------------------------------------------------------------
await openView(page, "AI Study Assistant", "AIAssistant");
// S14-A0 remediated: the banner mounts in the app shell and renders null
// while online — verify absence online (byte-parity guard) and presence
// during the A1 offline window below.
// S81/AH10 (audit-tools repair): the banner is the amber role="status" pill
// (connectivity-banner.tsx) — there is no [data-offline] attribute in the
// implementation. Probe by the real contract: a role=status div whose text
// mentions offline.
const onlineBannerAbsent = await page.evaluate(() =>
  ![...document.querySelectorAll('div[role="status"]')].some((el) => /offline/i.test(el.textContent || ""))
);
if (!onlineBannerAbsent) {
  note("A", "Offline banner visible while ONLINE (byte-parity break)", {
    measured: "document.querySelector([data-offline]) present while online",
  });
} else {
  ok("No offline surface in the DOM while online (byte-parity guard)", "bannerAbsent=true");
}

// ---------------------------------------------------------------------------
// A1 — AI send while offline (real transport failure, not route abort)
// ---------------------------------------------------------------------------
await page.fill("input[aria-label='Message the assistant']", "connectivity probe A1 offline send");
await context.setOffline(true);
await page.click("button[aria-label='Send message']");
await page.waitForTimeout(2500);
const a1 = await page.evaluate(() => {
  // S81/AH10: the transcript bubbles are divs (not li — the markup predates
  // a refactor); the banner is the amber role=status pill; the app toasts
  // are BUTTONS inside the aria-live Notifications region (role=status on
  // the items never existed). The composer is an <Input>, not a textarea.
  const items = [...document.querySelectorAll("main [aria-live] div")];
  const composer = document.querySelector("input[aria-label='Message the assistant']");
  const toasts = [
    ...[...document.querySelectorAll('[aria-label=Notifications] button')].map((t) => t.textContent.trim().slice(0, 90)),
    ...[...document.querySelectorAll('div[role="status"]')].map((t) => t.textContent.trim().slice(0, 90)),
  ];
  const banner = [...document.querySelectorAll('div[role="status"]')].find((el) => /offline/i.test(el.textContent || ""));
  return {
    transcriptItems: items.length,
    transcriptHasProbe: items.some((el) => (el.textContent || "").includes("connectivity probe A1")),
    composerValue: composer ? composer.value : null,
    sendEnabled: composer ? !document.querySelector("button[aria-label='Send message']").disabled : null,
    toasts,
    offlineBannerVisible: !!banner,
    offlineBannerText: banner ? banner.textContent.trim().slice(0, 60) : null,
  };
});
await page.screenshot({ path: `${OUT}/a1-ai-send-offline.png` });
if (a1.transcriptHasProbe || !a1.composerValue) {
  note("A", "AI offline send rollback degraded under real transport failure", {
    measured: JSON.stringify(a1),
    detail: "The S13 rollback was verified via route.abort(); a real offline fetch must hit the same path, but the measured state shows the message was NOT bounced back or the composer kept the text missing.",
  });
} else if (!a1.offlineBannerVisible) {
  note("A", "Offline banner did NOT appear during the offline window", { measured: JSON.stringify(a1) });
} else {
  ok("AI offline send rolls back (bounce-back + toast) AND the offline banner is visible", JSON.stringify(a1));
}
// A0b: the transport failure now toasts the HUMAN message (not raw browser text)
const humanToast = (a1.toasts || []).some((t) => /appear to be offline/i.test(t));
if (humanToast) {
  ok("Offline transport failures toast the human message", JSON.stringify(a1.toasts));
} else {
  note("A", "Offline toast is still raw/generic text", { measured: JSON.stringify(a1.toasts) });
}
await context.setOffline(false);
await page.reload();
await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 20000 });

// ---------------------------------------------------------------------------
// A2 — Task create while offline (CRUD failure path, no optimistic layer)
// ---------------------------------------------------------------------------
await openView(page, "All Tasks", "Tasks");
await page.waitForTimeout(1200);
await context.setOffline(true);
await page.click("button:has-text('Add Task')");
await page.waitForTimeout(600);
await page.fill("input#task-title", "S14-A2 offline task probe");
const dialogCreate = page.locator("button:has-text('Create')");
if ((await dialogCreate.count()) > 0) {
  await dialogCreate.first().click();
  await page.waitForTimeout(2500);
}
const a2 = await page.evaluate(() => {
  // S81/AH10: same toast-probe repair as A1 — the app toasts are buttons in
  // the Notifications region; the ambient offline banner is role=status.
  const toasts = [
    ...[...document.querySelectorAll('[aria-label=Notifications] button')].map((t) => t.textContent.trim().slice(0, 120)),
    ...[...document.querySelectorAll('div[role="status"]')].map((t) => t.textContent.trim().slice(0, 120)),
  ];
  const rows = [...document.querySelectorAll("main h3, main p")].some((el) => el.textContent.includes("S14-A2 offline task probe"));
  const dialogStillOpen = !!document.querySelector('[role="dialog"]');
  return { toasts, rowVisible: rows, dialogStillOpen };
});
await page.screenshot({ path: `${OUT}/a2-task-create-offline.png` });
await context.setOffline(false);
if (!a2.toasts.length) {
  note("A", "Task create offline shows NO feedback", {
    measured: JSON.stringify(a2),
    detail: "No toast, no error text, dialog state unclear — the user loses the typed work silently.",
  });
} else if (a2.dialogStillOpen) {
  ok("Task create offline toasts the error (dialog kept for retry)", JSON.stringify(a2));
} else {
  note("A", "Task create offline toasts but CLOSES the dialog (typed fields lost)", {
    measured: JSON.stringify(a2),
    detail: "The toast appears but the dialog is gone — the retry affordance (kept form contents) is missing on the CRUD surface (the AI chat got a bounce-back in S13; the task dialog did not).",
  });
}
await page.reload();
await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 20000 });

// ---------------------------------------------------------------------------
// A3 — SPA navigation while offline (view switching should still work)
// ---------------------------------------------------------------------------
await context.setOffline(true);
const navOk = [];
for (const [label, title] of [["Calendar", "Calendar"], ["Notes", "Notes"], ["Analytics", "Analytics"]]) {
  try {
    await page.click(`nav a:has-text('${label}')`, { timeout: 4000 });
    await page.waitForFunction(
      (t) => {
        const h = document.querySelector("main h1");
        return h && h.textContent.trim() === t;
      },
      title,
      { timeout: 6000 },
    );
    navOk.push(`${label}:ok`);
  } catch {
    navOk.push(`${label}:fail`);
  }
}
await context.setOffline(false);
if (navOk.every((s) => s.endsWith(":ok"))) {
  ok("SPA navigation works offline (shell + cached data)", navOk.join(", "));
} else {
  note("A", "SPA navigation breaks offline", { measured: navOk.join(", ") });
}

// ---------------------------------------------------------------------------
// A4 — Hard load while offline: the auth gate
// ---------------------------------------------------------------------------
const ctx4 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page4 = await ctx4.newPage();
await page4.goto(`${BASE}/login`).catch(() => {});
await page4.fill("input[type=email]", "demo@studyflow.app");
await page4.fill("input[type=password]", "Demo1234!");
await ctx4.setOffline(true);
await page4.click("button[type=submit]");
await page4.waitForTimeout(3000);
// S28 — assert the DESIGNED failure channel, never a retired expectation.
// A4 was written in S14 against the then-current toast design; S15
// (ADR-013) replaced the login card's error rendering with the reference's
// MEASURED pattern — auth errors render INLINE as a role=alert wash between
// Password and Sign in ("the reference's measured pattern, replacing the
// S14 toast" — login-card.tsx), pinned by tests/e2e/auth-flows.spec.ts
// (div.shadow-2xl getByRole("alert") + toHaveURL(/\/login/)). A toast on
// the login route is now the WRONG design (parity-breaking). The probe
// enumerates the observable end state from the live DOM: the user stays on
// the card, the alert announces, the button recovers. A probe that asserts
// a design that no longer exists produces findings whose own measured
// evidence disproves them (the AP-73 expectation-rot lesson).
const a4 = await page4
  .evaluate(() => {
    const card = document.querySelector("div.shadow-2xl");
    const button = document.querySelector("button[type=submit]");
    return {
      url: location.pathname,
      // Scoped to the auth card — Next's route announcer also uses
      // role=alert (the S15 e2e lesson); never enumerate page-wide.
      alert: card
        ? [...card.querySelectorAll('[role="alert"]')].map((t) => t.textContent.trim().slice(0, 90))
        : [],
      button: button ? { disabled: button.disabled, text: button.textContent.trim() } : null,
    };
  })
  .catch(() => null);
await ctx4.setOffline(false);
await page4.screenshot({ path: `${OUT}/a4-login-offline.png` }).catch(() => {});
await ctx4.close();
const a4StaysCard = a4 && a4.url === "/login";
const a4Announces = a4 && a4.alert.some((t) => /offline/i.test(t));
const a4Recovered = a4 && a4.button && !a4.button.disabled && a4.button.text !== "Signing in…";
if (a4 && a4StaysCard && a4Announces && a4Recovered) {
  ok(
    "Login offline announces the failure through the S15 inline alert (stays on the card, button recovered)",
    JSON.stringify(a4)
  );
} else {
  note("A", "Login offline fails silently or loses the card", { measured: JSON.stringify(a4) });
}

// ---------------------------------------------------------------------------
// A5 — Recovery: back online, retry the AI send
// ---------------------------------------------------------------------------
await openView(page, "AI Study Assistant", "AIAssistant");
await page.waitForTimeout(800);
await context.setOffline(true);
await page.fill("input[aria-label='Message the assistant']", "connectivity probe A5 recovery");
await page.click("button[aria-label='Send message']");
await page.waitForTimeout(2000);
await context.setOffline(false);
await page.fill("input[aria-label='Message the assistant']", "");
await page.fill("input[aria-label='Message the assistant']", "connectivity probe A5 retry");
// route the real AI call to a canned reply so the probe is deterministic
// S81/AH10: the view renders the reply from the PERSISTED transcript — the
// send() flow POSTs /api/ai/chat then re-fetches GET /api/ai/messages — so
// BOTH routes must be fulfilled (the POST-only mock never rendered). The
// transcript wait also targets the div bubbles, not li.
const a5Reply = {
  id: `probe-${Date.now()}`,
  role: "assistant",
  content: "Probe reply for A5.",
  surface: "assistant",
  createdAt: new Date().toISOString(),
};
await page.route("**/api/ai/chat", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ message: a5Reply }),
  }),
);
await page.route("**/api/ai/messages", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify([a5Reply]),
  }),
);
await page.click("button[aria-label='Send message']");
let recovered = false;
try {
  await page.waitForFunction(
    () => {
      const pane = [...document.querySelectorAll('main [aria-live]')].find(
        (el) => (el.getAttribute("aria-label") || "") !== "Notifications",
      );
      return pane ? pane.textContent.includes("Probe reply for A5.") : false;
    },
    null,
    { timeout: 8000 },
  );
  recovered = true;
} catch {}
await page.unroute("**/api/ai/chat");
await page.unroute("**/api/ai/messages");
if (recovered) {
  ok("Post-offline retry succeeds (composer usable immediately)", "recovered=true");
} else {
  note("A", "Post-offline retry does not recover", { measured: "recovered=false" });
}

await browser.close();
console.log(JSON.stringify({ findings, nonGaps }, null, 2));
