// AI-surface failure-mode audit — session-13 (S13).
// Probes the clone's AI surfaces (assistant chat, math solver) under FAILURE
// conditions the normal happy-path specs never exercise:
//  1. transport failure (route aborted mid-flight) — does the client recover?
//     Is the user's message orphaned (rendered locally but never persisted)?
//  2. hung backend (route never responds) — is there ANY client timeout, or
//     does the composer stay disabled forever?
//  3. server-side error envelopes (500/502 from the SDK) — toast + recovery
//  4. math-solver payload edge cases (non-image data URL, over-length problem)
// Follows the forced-colors-sweep.mjs conventions (dev server on :3000,
// demo login, JSON finding output, /tmp evidence dir).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const BASE = "http://localhost:3000";
const OUT = "/tmp/ai-error-evidence";
mkdirSync(OUT, { recursive: true });
const prisma = new PrismaClient({ datasources: { db: { url: "file:../db/custom.db" } } });

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
// Family A1 — transport failure on /api/ai/chat
// ---------------------------------------------------------------------------
await openView(page, "AI Study Assistant", "AIAssistant");
await page.waitForTimeout(1500);

const chatUrl = "**/api/ai/chat";
await page.route(chatUrl, (route) => route.abort("failed"));

let toastSeen = false;
page.on("toast", () => (toastSeen = true)); // not supported — use DOM probe below.

await page.fill("input[aria-label='Message the assistant']", "audit probe A1");
await page.press("input[aria-label='Message the assistant']", "Enter");
await page.waitForTimeout(2500);

const afterAbort = await page.evaluate(() => {
  const msgs = [...document.querySelectorAll("main li")].map((li) => li.textContent.trim().slice(0, 40));
  const composer = document.querySelector("input[aria-label='Message the assistant']");
  const sendBtn = document.querySelector("button[aria-label='Send message']");
  const toasts = [...document.querySelectorAll("[data-slot=toast], [role=status], ol li")].map((t) => t.textContent.trim().slice(0, 70));
  return {
    messages: msgs,
    composerDisabled: composer ? composer.disabled : null,
    sendDisabled: sendBtn ? sendBtn.disabled : null,
    toastTexts: toasts.filter((t) => /unavailable|error|failed/i.test(t)),
  };
});

// The orphan check: the failed user message is rendered from LOCAL state.
const orphaned = afterAbort.messages.some((m) => m.includes("audit probe A1"));

// Reload: does the failed message survive (persisted) or vanish (orphan)?
await page.reload();
await page.waitForFunction(() => document.querySelector("main h1")?.textContent.trim() === "AI Study Assistant", null, { timeout: 20000 });
await page.waitForTimeout(1500);
const afterReload = await page.evaluate(() =>
  [...document.querySelectorAll("main li")].map((li) => li.textContent.trim().slice(0, 40)),
);
const persisted = afterReload.some((m) => m.includes("audit probe A1"));

if (orphaned && !persisted) {
  note("A1", "AI chat failed send", {
    finding: "user message rendered locally on failure but never persisted — silently vanishes on reload; no retry affordance",
    messagesAfterAbort: afterAbort.messages,
    persistedAfterReload: persisted,
  });
} else {
  ok("AI chat failed send", { orphaned, persisted });
}
if (!afterAbort.composerDisabled) ok("composer re-enabled after failure", {});
else note("A1", "AI chat composer", { finding: "composer still disabled after failure" });

await page.unroute(chatUrl);

// ---------------------------------------------------------------------------
// Family A2 — hung backend (deadline presence probe)
// S13-A2 fix: the AI call sites pass { timeoutMs: 120_000 } — a 120 s deadline
// (LLM completions legitimately run 30–60 s). Waiting 120 s in the audit is
// pointless, so this probe verifies the deadline is INSTALLED: a fetch spy
// records whether the outgoing request carried an abort signal. Busy-state
// at 25 s is EXPECTED (the deadline has not fired yet).
// ---------------------------------------------------------------------------
await page.evaluate(() => {
  window.__sigSeen = null;
  const orig = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (window.__sigSeen === null && String(input).includes("/api/ai/chat")) {
      window.__sigSeen = !!(init && init.signal);
    }
    return orig(input, init);
  };
});
await page.route(chatUrl, async (route) => {
  // Never fulfill. Hold the route open.
  await new Promise(() => {});
});
await page.fill("input[aria-label='Message the assistant']", "audit probe A2");
await page.press("input[aria-label='Message the assistant']", "Enter");
// Wait 25 s: busy is expected to persist (the 120 s deadline has not fired).
await page.waitForTimeout(25000);
const hungState = await page.evaluate(() => {
  const sendBtn = document.querySelector("button[aria-label='Send message']");
  const thinking = [...document.querySelectorAll("main li")].some((li) => /Thinking/i.test(li.textContent || ""));
  const composer = document.querySelector("input[aria-label='Message the assistant']");
  return {
    sendDisabled: sendBtn ? sendBtn.disabled : null,
    thinkingShown: thinking,
    composerValue: composer ? composer.value : null,
    deadlineInstalled: window.__sigSeen,
  };
});
if (hungState.deadlineInstalled) {
  ok("AI chat deadline installed (120 s timeoutMs on the fetch)", { sigSeen: true, busyAt25s: hungState.sendDisabled });
} else {
  note("A2", "AI chat hung backend", {
    finding: "no client deadline — the outgoing fetch carried NO abort signal; a hung SDK call leaves the composer disabled indefinitely",
    state: hungState,
  });
}
// Reset client state: the A2 fetch is still pending — a reload aborts it and
// clears `busy`, otherwise later probes silently no-op (send() early-returns).
await page.unroute(chatUrl);
await page.reload();
await page.waitForFunction(() => document.querySelector("main h1")?.textContent.trim() === "AI Study Assistant", null, { timeout: 20000 });
await page.waitForTimeout(1500);

// ---------------------------------------------------------------------------
// Family A3 — server error envelope (500) from the SDK
// ---------------------------------------------------------------------------
await page.route(chatUrl, (route) =>
  route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Internal server error" }) }),
);
await page.fill("input[aria-label='Message the assistant']", "audit probe A3");
await page.press("input[aria-label='Message the assistant']", "Enter");
await page.waitForTimeout(1500);
const errState = await page.evaluate(() => {
  // S81/AH10 (audit-tools repair): the toaster's items are plain <button>
  // elements inside the aria-live="Notifications" region — there is no
  // [role=status] on the items (the REGION carries the live semantics).
  // The old [role=status] probe matched nothing, so every 500-toast was
  // reported as a false "no visible toast" finding.
  const toasts = [...document.querySelectorAll('[aria-label=Notifications] button')].map((t) => t.textContent.trim().slice(0, 70));
  const sendBtn = document.querySelector("button[aria-label='Send message']");
  return { toastTexts: toasts, sendDisabled: sendBtn ? sendBtn.disabled : null };
});
if (errState.toastTexts.length > 0) ok("AI chat 500 shows toast", { toasts: errState.toastTexts });
else note("A3", "AI chat 500", { finding: "no visible toast for a 500 response" });
if (!errState.sendDisabled) ok("composer recovers after 500", {});
await page.unroute(chatUrl);
await page.waitForTimeout(800);

// ---------------------------------------------------------------------------
// Family A4 — math solver payload edge cases (server-side validation)
// ---------------------------------------------------------------------------
await openView(page, "Math Solver", "MathSolver");

// A4a: non-image data URL (server regex requires data:image/...)
const solverUrl = "**/api/math/solve";
const solveRes1 = await page.evaluate(async () => {
  const res = await fetch("/api/math/solve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ problem: "1+1", image: "data:application/pdf;base64,SGVsbG8=" }),
  });
  return { status: res.status, body: await res.json() };
});
if (solveRes1.status === 400) ok("math solver rejects non-image data URL", solveRes1);
else note("A4", "math solver non-image data URL", { finding: "expected 400", got: solveRes1 });

// A4b: empty problem
const solveRes2 = await page.evaluate(async () => {
  const res = await fetch("/api/math/solve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ problem: "" }),
  });
  return { status: res.status, body: await res.json() };
});
if (solveRes2.status === 400) ok("math solver rejects empty problem", solveRes2);
else note("A4", "math solver empty problem", { finding: "expected 400", got: solveRes2 });

// A4c: over-length problem (schema max 4000 — raised from 2000 when the
// solver prompt outgrew the old cap; the audit's 2001-char probe now PASSES
// validation and hits the real SDK. Send 4001 chars to test the actual
// boundary.)
const solveRes3 = await page.evaluate(async () => {
  const res = await fetch("/api/math/solve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ problem: "9".repeat(4001) }),
  });
  return { status: res.status, body: await res.json() };
});
if (solveRes3.status === 400) ok("math solver rejects over-length problem", solveRes3);
else note("A4", "math solver over-length", { finding: "expected 400", got: solveRes3 });

// A4d: unauthenticated access
const solveRes4 = await context.request.post(`${BASE}/api/math/solve`, {
  headers: { "Content-Type": "application/json" },
  data: { problem: "1+1" },
});
// NOTE: the request context shares cookies; force a no-cookie variant.
const noAuth = await page.evaluate(async () => {
  const res = await fetch("/api/math/solve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ problem: "1+1" }),
    credentials: "omit",
  });
  return { status: res.status };
});
if (noAuth.status === 401) ok("math solver requires auth", noAuth);
else note("A4", "math solver auth", { finding: "expected 401", got: noAuth });
void solveRes4;

await page.screenshot({ path: `${OUT}/math-solver-view.png`, fullPage: false });

// ---------------------------------------------------------------------------
// Family A5 — client image guards (RESOLVED in S13-A3)
// The caps are in DIFFERENT UNITS, not inconsistent: the client guards the
// FILE at 4 MB; the server schema caps the base64 STRING at 6 MB (base64
// inflates ~33%, so a 4 MB file encodes to ~5.3 MB — safely under). The
// S13-A3 fix added the client MIME-type guard so non-images never leave the
// browser. Recorded as a verified non-gap.
// ---------------------------------------------------------------------------
ok("math solver image guards coherent (4 MB file cap vs 6 MB base64 schema cap + client MIME check)", {
  clientFileCap: "4 * 1024 * 1024",
  serverBase64Cap: "6 * 1024 * 1024",
  clientMimeGuard: "file.type.startsWith('image/')",
});

await browser.close();

// Cleanup — remove any probe messages that DID reach the server (the hung-
// route pass-through after unroute can persist them).
try {
  const del = await prisma.aiChatMessage.deleteMany({
    where: { content: { contains: "audit probe" } },
  });
  console.error(`[cleanup] removed ${del.count} probe chat rows`);
} finally {
  await prisma.$disconnect();
}

console.log(JSON.stringify({ findings, nonGaps, counts: { findings: findings.length, nonGaps: nonGaps.length } }, null, 2));
