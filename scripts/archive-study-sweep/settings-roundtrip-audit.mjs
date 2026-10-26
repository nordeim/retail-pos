// Settings persistence round-trip audit — session 14 (S14-B).
// The theme/accent round-trips are pinned by prior specs; this audits the
// REMAINING settings surfaces the session-13 narrative suggested:
//  1. Display-name round-trip: UI edit -> PATCH -> reload -> still there?
//     Sidebar footer + Settings profile both reflect it?
//  2. Avatar round-trip: UI pick -> PATCH -> reload -> still selected?
//  3. Whitespace/empty display-name edge (schema has no trim/min).
//  4. Cross-surface consistency: /api/auth/me vs the settings PATCH
//     response vs the rendered UI after reload.
//  5. Revert round-trip: change twice, second change wins on reload.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "/tmp/s14-settings-evidence";
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

const ORIGINAL_NAME = "Demo Student";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
await login(page);

// ---------------------------------------------------------------------------
// B1 — display-name round-trip through the real UI
// ---------------------------------------------------------------------------
await page.goto(`${BASE}/Settings`);
await page.waitForFunction(() => [...document.querySelectorAll('[role="tab"]')].length > 0, null, { timeout: 20000 });
await page.click('[role="tab"][data-state="active"] ~ [role="tab"]:has-text("Profile"), [role="tab"]:has-text("Profile")');
await page.waitForFunction(() => document.body.textContent.includes("Display name"), null, { timeout: 20000 });
await page.waitForTimeout(800);
const nameInput = page.locator("#display-name");
await nameInput.fill("S14 Probe Name");
// S81/AH10 (audit-tools repair): the Profile tab has TWO save buttons —
// the display-name card's "Save name" and the study-fields' "Save
// profile". The old click hit the wrong one (the rename never landed and
// the probe reported the API round-trip as broken). The display-name
// card's own button is the one that PATCHes the name.
await page.click("button:has-text('Save name')");
await page.waitForTimeout(1500);
const sidebarAfter = await page.evaluate(() => {
  const foot = document.querySelector("aside") || document.body;
  return foot.textContent.includes("S14 Probe Name");
});
// reload — does it survive?
await page.reload();
await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 20000 });
await page.waitForTimeout(1000);
const afterReload = await page.evaluate(async () => {
  const me = await fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json());
  const aside = document.querySelector("aside");
  return {
    apiName: me.user?.name,
    sidebarShows: aside ? aside.textContent.includes("S14 Probe Name") : null,
  };
});
if (afterReload.apiName === "S14 Probe Name" && afterReload.sidebarShows) {
  ok("Display-name round-trip (UI -> PATCH -> reload -> sidebar + API)", JSON.stringify(afterReload));
} else {
  note("B", "Display-name round-trip broken", { measured: JSON.stringify(afterReload), sidebarAfterSave: sidebarAfter });
}

// ---------------------------------------------------------------------------
// B2 — avatar round-trip through the real UI
// ---------------------------------------------------------------------------
await page.goto(`${BASE}/Settings`);
await page.waitForFunction(() => [...document.querySelectorAll('[role="tab"]')].length > 0, null, { timeout: 20000 });
await page.waitForFunction(() => !!document.querySelector('button[aria-label="Choose avatar 🎓"]'), null, { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('button[aria-label="Choose avatar 🎓"]');
await page.waitForTimeout(1500);
await page.reload();
await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 20000 });
await page.waitForTimeout(1000);
const avatarAfter = await page.evaluate(async () => {
  const me = await fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json());
  const selected = document.querySelector('button[aria-label="Choose avatar 🎓"]');
  return {
    apiAvatar: me.user?.avatarEmoji,
    tilePressed: selected ? selected.getAttribute("aria-pressed") : null,
    tileHasRing: selected ? (selected.className || "").includes("ring") : null,
  };
});
if (avatarAfter.apiAvatar === "🎓" && avatarAfter.tilePressed === "true") {
  ok("Avatar round-trip (UI -> PATCH -> reload -> selected tile + API)", JSON.stringify(avatarAfter));
} else {
  note("B", "Avatar round-trip broken", { measured: JSON.stringify(avatarAfter) });
}

// ---------------------------------------------------------------------------
// B3 — whitespace display-name edge (schema: z.string().max(80), no trim/min)
// ---------------------------------------------------------------------------
const ws = await page.evaluate(async () => {
  const res = await fetch("/api/settings/preferences", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "   " }),
  });
  return { status: res.status, body: (await res.json()).user?.name };
});
if (ws.status === 200 && ws.body === "   ") {
  note("B", "Whitespace-only display name persisted verbatim", {
    measured: JSON.stringify(ws),
    detail: "preferencesSchema.name is bounded(80) — no trim, no min. A whitespace-only save wipes the visible name (the sidebar falls back to 'Student' but the record is blank); the client sends nameDraft untrimmed too. Fix: trim + reject emptiness server-side (mirror the S13 empty-filename guard) + trim client-side.",
  });
} else {
  ok("Whitespace display-name rejected or trimmed", JSON.stringify(ws));
}

// restore the name for later probes
await page.evaluate(async () => {
  await fetch("/api/settings/preferences", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "S14 Probe Name" }),
  });
});

// ---------------------------------------------------------------------------
// B4 — second-write-wins (revert round-trip)
// ---------------------------------------------------------------------------
await page.goto(`${BASE}/Settings`);
await page.waitForFunction(() => [...document.querySelectorAll('[role="tab"]')].length > 0, null, { timeout: 20000 });
await page.click('[role="tab"]:has-text("Profile")');
await page.waitForFunction(() => document.body.textContent.includes("Display name"), null, { timeout: 20000 });
await page.waitForTimeout(800);
const draftBefore = await page.inputValue("#display-name");
await page.locator("#display-name").fill("S14 Second Write");
await page.click("button:has-text('Save profile')");
await page.waitForTimeout(1200);
await page.locator("#display-name").fill("S14 Probe Name");
await page.click("button:has-text('Save profile')");
await page.waitForTimeout(1200);
await page.reload();
await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 20000 });
await page.waitForTimeout(800);
// Radix unmounts inactive tab panes — switch to Profile before reading the draft
await page.click('[role="tab"]:has-text("Profile")');
await page.waitForFunction(() => !!document.querySelector("#display-name"), null, { timeout: 10000 });
await page.waitForTimeout(400);
const finalName = await page.evaluate(async () => {
  const me = await fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json());
  return { apiName: me.user?.name, draft: document.querySelector("#display-name")?.value };
});
if (finalName.apiName === "S14 Probe Name" && finalName.draft === "S14 Probe Name") {
  ok("Second-write-wins + draft re-initializes from the fresh value after reload", JSON.stringify(finalName));
} else {
  note("B", "Revert round-trip broken (stale draft or API mismatch)", {
    measured: JSON.stringify(finalName),
    detail: `draftBefore=${draftBefore}`,
  });
}

// ---------------------------------------------------------------------------
// B5 — avatar persistence across a MODE change in the same session
// (settings PATCHes must not clobber each other — the theme write and the
// avatar write go through the same endpoint)
// ---------------------------------------------------------------------------
await page.goto(`${BASE}/Settings`);
await page.waitForFunction(() => !!document.querySelector('button[aria-label="Choose avatar 📚"]'), null, { timeout: 20000 });
await page.waitForTimeout(600);
await page.evaluate(async () => {
  await fetch("/api/settings/preferences", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ themeMode: "dark" }),
  });
});
await page.waitForTimeout(600);
await page.click('button[aria-label="Choose avatar 📚"]');
await page.waitForTimeout(1200);
const b5 = await page.evaluate(async () => {
  const me = await fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json());
  return { mode: me.user?.themeMode, avatar: me.user?.avatarEmoji, name: me.user?.name };
});
// restore mode + avatar + name — the documented RESTING STATE is
// light/violet (every sweep's convention + the suite's stage-33 guard);
// restoring "system" left the demo user off the resting state and the
// NEXT stage's preconditions read the wrong mode (the S81/AH10 repair).
await page.evaluate(async () => {
  await fetch("/api/settings/preferences", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ themeMode: "light", avatarEmoji: "", name: "Demo Student" }),
  });
});
if (b5.mode === "dark" && b5.avatar === "📚" && b5.name === "S14 Probe Name") {
  ok("Concurrent setting families persist independently (mode + avatar + name)", JSON.stringify(b5));
} else {
  note("B", "Setting families clobber each other", { measured: JSON.stringify(b5) });
}

await browser.close();
console.log(JSON.stringify({ findings, nonGaps }, null, 2));
