// AI-surface accessibility audit — session 14 (S14-D).
// The toast stack is aria-live (errors ARE announced); this audits the
// AI surfaces themselves for screen-reader semantics:
//  1. The AI assistant transcript: no aria-live region — new assistant
//     replies land silently for screen readers (the sighted user sees the
//     message appear; the SR user gets nothing until they re-navigate).
//  2. The "Thinking…" busy indicator: purely visual (spinner + text in a
//     non-live list) — not announced.
//  3. The math solver's solution block: announced or silent?
//  4. Button state semantics: busy buttons communicate via disabled +
//     label change (acceptable) — but check aria-busy usage.
//  5. The quick-action mode cards use aria-pressed (S12-scoped — fine).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const BASE = "http://localhost:3000";
const OUT = "/tmp/s14-a11y-evidence";
mkdirSync(OUT, { recursive: true });

// S32: the probe-row ledger. The D2 probe holds the /api/ai/chat route and
// must NEVER leak the held request to the real server (the S14 lesson:
// reload FIRST — document unload aborts the fetch — THEN unroute). The
// auditStart timestamp + the closing cleanup below are the defense-in-depth
// guard: whatever this audit persisted to the demo chat history is deleted
// before the script exits (the ai-error-audit.mjs pattern). Without it, each
// run leaks a "s14 a11y probe D2" pair, which the dark/accent sweeps then
// flag as flashbulbs through the designed user-bubble inversion.
const auditStart = new Date();
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
// D1 — the AI transcript live-region semantics
// (seed one message first — the <ul> only renders when messages exist)
// ---------------------------------------------------------------------------
await openView(page, "AI Study Assistant", "AIAssistant");
await page.waitForTimeout(1200);
// S81/AH10 (the s81 audit-tools repair): the view renders the reply from the
// PERSISTED transcript — the send() flow POSTs /api/ai/chat, then re-fetches
// GET /api/ai/messages to render. The old probe mocked only the POST, so the
// refresh hit the real API (which never saw the mocked turn) and the seed
// reply never rendered — the probe timed out on every run. Both routes must
// be fulfilled for the D1 seed to land.
const seedReply = {
  id: `probe-${Date.now()}`,
  role: "assistant",
  content: "D1 seed reply.",
  surface: "assistant",
  createdAt: new Date().toISOString(),
};
await page.route("**/api/ai/chat", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ message: seedReply }),
  }),
);
await page.route("**/api/ai/messages", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify([seedReply]),
  }),
);
await page.fill("input[aria-label='Message the assistant']", "s14 a11y probe D1 seed");
await page.click("button[aria-label='Send message']");
// S81/AH10: the transcript bubbles are <div>s inside the aria-live sf-scroll
// pane — the <ul>/<li> markup the old wait targeted predates a refactor.
await page.waitForFunction(() => {
  const pane = [...document.querySelectorAll('main [aria-live]')].find(
    (el) => (el.getAttribute("aria-label") || "") !== "Notifications",
  );
  return pane ? pane.textContent.includes("D1 seed reply.") : false;
}, null, { timeout: 10000 });
await page.unroute("**/api/ai/chat");
await page.unroute("**/api/ai/messages");
const d1 = await page.evaluate(() => {
  const liveRegions = [...document.querySelectorAll('[aria-live], [role="status"], [role="alert"]')];
  // The transcript pane is the aria-live region in <main> that is NOT the
  // Toaster (the Toaster carries aria-label="Notifications"). The bubbles
  // are the whitespace-pre-wrap divs inside it.
  const transcriptPane = [...document.querySelectorAll('main [aria-live]')].find(
    (el) => (el.getAttribute("aria-label") || "") !== "Notifications",
  ) || null;
  const bubbles = transcriptPane
    ? [...transcriptPane.querySelectorAll("div")].filter((el) => (el.className || "").includes("whitespace-pre-wrap"))
    : [];
  const composer = document.querySelector("input[aria-label='Message the assistant']");
  // The live region may be the pane itself OR its container — resolve upward.
  const liveAncestor = bubbles[0] ? (bubbles[0].closest('[aria-live]') || null) : null;
  return {
    liveRegionCount: liveRegions.length,
    liveRegionLabels: liveRegions.map((el) => el.getAttribute("aria-label") || el.getAttribute("role") || "unlabelled"),
    transcriptIsLive: liveAncestor ? liveAncestor.getAttribute("aria-live") : (transcriptPane ? "no-bubbles" : "no-pane"),
    transcriptRole: transcriptPane ? transcriptPane.getAttribute("role") : null,
    composerLabel: composer ? composer.getAttribute("aria-label") : null,
  };
});
const transcriptLive = [...(await page.evaluate(() => [...document.querySelectorAll('[aria-live]')].map((el) => ({ label: el.getAttribute("aria-label"), cls: (el.className || "").slice(0, 40) }))))];
// The only aria-live region should be the Toaster (notifications) —
// nothing covers the transcript
const toasterLive = transcriptLive.filter((r) => (r.label || "").includes("Notification"));
if ((d1.transcriptIsLive === null || d1.transcriptIsLive === "no-pane") && toasterLive.length > 0) {
  note("D", "The AI transcript is not a live region — assistant replies land unannounced", {
    measured: JSON.stringify(d1),
    detail: "Screen-reader users send a message and hear ONLY the composer clearing (if that); the assistant's reply renders into a plain <ul> with no aria-live — no announcement, no polite ping. The 'Thinking…' indicator is equally silent (spinner + text inside the non-live list). WCAG 4.1.3 (Status Messages) asks for programmatic status announcements. Fix: aria-live='polite' on the transcript scroll container (the messages + Thinking indicator both land announced); keep it assertive-free (polite is the right interruption level for chat).",
  });
} else if (d1.transcriptIsLive === "polite" || d1.transcriptIsLive === "assertive") {
  ok("Transcript is a live region", JSON.stringify(d1));
} else {
  note("D", "Transcript live-region probe ambiguous", { measured: JSON.stringify(d1), regions: JSON.stringify(transcriptLive) });
}

// ---------------------------------------------------------------------------
// D2 — the Thinking… indicator semantics (during a real held request)
// ---------------------------------------------------------------------------
await page.route("**/api/ai/chat", () => {
  /* hold the route — never fulfill (the S13 reload-between-probes lesson
     applies AFTER this probe: we reload below) */
});
await page.fill("input[aria-label='Message the assistant']", "s14 a11y probe D2");
await page.click("button[aria-label='Send message']");
await page.waitForTimeout(1500);
const d2 = await page.evaluate(() => {
  // S81/AH10: same selector repair as D1 — the transcript pane (the aria-live
  // region in <main> that is NOT the Toaster) and its div children.
  const transcriptPane = [...document.querySelectorAll('main [aria-live]')].find(
    (el) => (el.getAttribute("aria-label") || "") !== "Notifications",
  ) || null;
  const items = transcriptPane ? [...transcriptPane.querySelectorAll("div")] : [];
  const thinking = items.find((el) => (el.textContent || "").includes("Thinking"));
  const composer = document.querySelector("input[aria-label='Message the assistant']");
  const sendBtn = document.querySelector("button[aria-label='Send message']");
  return {
    thinkingPresent: !!thinking,
    thinkingAnnounced: thinking ? !!thinking.closest('[aria-live], [role="status"]') : null,
    thinkingHasLoadingAttrs: thinking ? thinking.getAttribute("aria-busy") || thinking.querySelector('[aria-label]')?.getAttribute("aria-label") : null,
    paneAriaBusy: transcriptPane ? transcriptPane.getAttribute("aria-busy") : null,
    composerBusy: composer ? composer.getAttribute("aria-busy") : null,
    sendDisabled: sendBtn ? sendBtn.disabled : null,
    sendAriaBusy: sendBtn ? sendBtn.getAttribute("aria-busy") : null,
  };
});
// S32: the S14 remedy, in the right order — reload FIRST (the document
// unload aborts the held request), THEN unroute. The previous order
// (unroute → reload) released the held D2 request to the REAL server, and
// the real AI route persisted the probe pair on every run (4 pairs
// accumulated in db/custom.db before this fix — the standing-suite's
// dark-sweep surfaced them as flashbulbs).
await page.reload();
await page.unroute("**/api/ai/chat");
await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 20000 });
await page.waitForTimeout(1000);
if (d2.thinkingPresent && !d2.thinkingAnnounced && d2.sendAriaBusy === null) {
  note("D", "The busy state ('Thinking…') carries no loading semantics", {
    measured: JSON.stringify(d2),
    detail: "During generation the button disables (DOM-only) and the Thinking row renders without aria-busy/loading semantics — assistive tech gets no 'working' signal (WCAG 4.1.3 + the aria-busy pattern). Fix: aria-busy on the transcript container while busy; the visible text ('Thinking…') inside the live region then announces.",
  });
} else {
  ok("Busy state carries loading semantics", JSON.stringify(d2));
}

// ---------------------------------------------------------------------------
// D3 — the math solver's solution announcement
// ---------------------------------------------------------------------------
await openView(page, "Math Solver", "MathSolver");
await page.waitForTimeout(800);
const d3 = await page.evaluate(() => {
  const live = [...document.querySelectorAll('[aria-live], [role="status"]')];
  const main = document.querySelector("main");
  return {
    liveOutsideToaster: live.filter((el) => (el.getAttribute("aria-label") || "") !== "Notifications").length,
    solutionRegion: main ? [...main.querySelectorAll("div")].find((el) => (el.className || "").includes("whitespace-pre-wrap"))?.getAttribute("aria-live") ?? "none-found" : null,
  };
});
if (d3.liveOutsideToaster === 0) {
  note("D", "The solver's solution block is not announced either", {
    measured: JSON.stringify(d3),
    detail: "Same pattern as the chat: the AI solution renders into a static div — a screen-reader user gets no completion signal. The fix rides the same seam: an aria-live='polite' wrapper for AI-generated output.",
  });
} else {
  ok("Solver output is announced", JSON.stringify(d3));
}

// ---------------------------------------------------------------------------
// D4 — composer + quick-action semantics (non-gaps to verify — on the
// ASSISTANT view; D3 left the page on MathSolver)
// ---------------------------------------------------------------------------
await openView(page, "AI Study Assistant", "AIAssistant");
await page.waitForTimeout(1000);
const d4 = await page.evaluate(() => {
  const composer = document.querySelector("input[aria-label='Message the assistant']") || document.querySelector("main textarea");
  // S81/AH10: the quick actions were redesigned as click-to-fill buttons
  // (onClick fills the composer — NOT toggles), so aria-pressed is gone BY
  // DESIGN. The correct semantics probe: the quick-actions grid is labeled
  // (aria-label="Quick actions") and each card exposes accessible text
  // (the aria-level=2 heading span) + a focus-visible ring class.
  const quickGrid = document.querySelector('div[aria-label="Quick actions"]');
  const quickCards = quickGrid ? [...quickGrid.querySelectorAll("button")] : [];
  const sendBtn = document.querySelector("button[aria-label='Send message']") || document.querySelector("main button[type=submit]");
  return {
    composerLabelled: composer ? !!composer.getAttribute("aria-label") || !!composer.labels?.length : null,
    sendLabelled: sendBtn ? !!sendBtn.getAttribute("aria-label") : null,
    quickGridLabelled: !!quickGrid,
    quickCardCount: quickCards.length,
    quickCardsLabelled: quickCards.every((b) => (b.textContent || "").trim().length > 0),
    quickCardsFocusable: quickCards.every((b) => (b.className || "").includes("focus-visible:ring")),
  };
});
if (d4.composerLabelled && d4.sendLabelled && d4.quickGridLabelled && d4.quickCardCount >= 6 && d4.quickCardsLabelled && d4.quickCardsFocusable) {
  ok("Composer, send button, and quick-action cards carry semantics (labels + accessible text + focus-visible)", JSON.stringify(d4));
} else {
  note("D", "AI composer semantics incomplete", { measured: JSON.stringify(d4) });
}

await browser.close();

// S32 cleanup — remove any probe chat rows THIS run persisted (the
// ai-error-audit.mjs pattern): everything the demo user gained since
// auditStart. Idempotent; a zero count is the expected healthy case.
try {
  const demo = await prisma.user.findUnique({ where: { email: "demo@studyflow.app" }, select: { id: true } });
  if (demo) {
    const del = await prisma.aiChatMessage.deleteMany({
      where: { userId: demo.id, createdAt: { gte: auditStart } },
    });
    console.error(`[cleanup] removed ${del.count} probe chat rows created by this audit`);
  }
} finally {
  await prisma.$disconnect();
}
console.log(JSON.stringify({ findings, nonGaps }, null, 2));
