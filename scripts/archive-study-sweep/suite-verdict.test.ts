// Unit pins for the S32 standing-suite seam — src/lib/suite-verdict.ts.
//
// The fixtures are HARVESTED from the session-65 production-readiness sweep's
// genuine audit envelopes (the byte-exact shapes the audits printed on
// 2026-10-10): every GREEN shape is the real thing, every rot/phantom fixture
// is the documented failure family (S27 mode rot, S28 shape rot, the S29/S31/
// S65 double-run phantom, the accent WARN/FAIL boundary, the CWV
// ref-POOR-is-not-a-clone-finding boundary).
//
// The doctrine under test (AP-77): a missing key on a known audit shape is a
// LOUD shape-error — NEVER a silent green, NEVER a silent zero. That guard is
// the difference between a tool and a trap.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  classifyAudit,
  parseAuditStdout,
  suiteVerdict,
  type StageVerdict,
} from "@/lib/suite-verdict";

const isErr = (v: StageVerdict) => v.green === false && /shape not recognized/i.test(v.note);

// --- genuine fixtures (session-65, 2026-10-10) ------------------------------

const SECURITY_GREEN = {
  findings: [],
  nonGaps: [
    { surface: "Session cookie flags (httpOnly + SameSite=Lax + Path=/ + 30d Max-Age; secure is NODE_ENV-gated — dev false, prod true by code)", detail: "{\"httpOnly\":true,\"sameSite\":\"lax\",\"secure\":false}" },
    { surface: "AI routes rate-limited (20 then 429)", detail: "20x400 then 2x429; cutoffAt=21" },
  ],
};

const FC_GREEN = {
  clone: {
    views: { Dashboard: { invisible: [], unbounded: [] }, Tasks: { invisible: [], unbounded: [] } },
    states: { Tasks: { found: true, border: "2px solid rgb(0, 0, 0)" } },
    focus: [{ tag: "BUTTON", label: "Collapse sidebar", outline: "2px solid rgba(5, 0, 73, 0.8)" }],
  },
  reference: { dashboard: { invisible: [] }, nav: { activeCount: 20 } },
};

const PRINT_GREEN = {
  lightPrint: { Dashboard: 0, MyDay: 0, Timetable: 0 },
  darkPrint: { Dashboard: 0, MyDay: 0, Timetable: 0 },
  overflow: { Dashboard: { overflowRight: [{ tag: "DIV", cls: "flex flex-col gap-8", right: 1248 }], bodyScrollW: 1280 } },
  pdfs: ["Dashboard-light.pdf", "Timetable-light.pdf"],
};

const FOCUS_GREEN = {
  views: { Dashboard: { stopCount: 26, reachedBody: false, firstMainStop: 1, anomalies: [], sequence: ["A:Skip to main content"] } },
  dialogs: { newTask: { stops: [{ tag: "BUTTON", label: "☀ My Day", inDialog: true }] } },
  drawer: { trap: true, escapeClosed: true },
  skipLink: { present: true, first: true },
};

const DARK_GREEN = { mode: "dark", views: { Dashboard: { flashbulbs: [], unreadable: [] }, Tasks: { flashbulbs: [], unreadable: [] } } };

// --- accent-dark-sweep full-shape generators (S38 — the mobile 20-view matrix)
// The pre-S38 envelope recorded only NON-CLEAN views (omission-means-clean —
// the S11 shape): the seam could not distinguish "clean because measured"
// from "clean because never rendered", and the mobile pass swept only 6 of
// 20 views. The S38 shape records EVERY view explicitly on BOTH surfaces,
// carries the per-accent self-verified `applied` readings, the `mode`, and
// the mobile pass's `mobileViewport` — the ALL-ACCENTS + ALL-VIEWS guards
// (the S37 anti-phantom doctrine applied to the accent-dark family) make a
// silently-skipped accent or view a LOUD shape-error, never green-by-omission.

const S38_ACCENTS = ["violet", "blue", "green", "orange", "pink", "red", "teal"] as const;
const S38_VIEWS = [
  "Dashboard", "MyDay", "Tasks", "Calendar", "Events", "Timetable",
  "Assignments", "Exams", "Notes", "Flashcards", "PracticeTests",
  "StudyGroups", "GradeTracker", "Analytics", "Files", "Calculator",
  "MathSolver", "AIAssistant", "FocusTimer", "Settings",
];
// The pre-S38 mobile pass (the exact rot the ALL-VIEWS guard catches).
const S38_MOBILE_VIEWS_PRE_S38 = ["Dashboard", "MyDay", "Timetable", "Tasks", "Settings", "Calendar"];

type S38Rec = Record<string, unknown>;

function s38DesktopRec(o: S38Rec = {}): S38Rec {
  return { flashbulbs: [] as unknown[], unreadable: [] as unknown[], lowcontrast: [] as unknown[], ...o };
}
function s38MobileRec(o: S38Rec = {}): S38Rec {
  return { flashbulbs: [] as unknown[], unreadable: [] as unknown[], lowcontrast: [] as unknown[], scrollWidth: 390, ...o };
}
function s38DrawerRec(o: S38Rec = {}): S38Rec {
  return { linkCount: 20, flashbulbs: [] as unknown[], unreadable: [] as unknown[], lowcontrast: [] as unknown[], ...o };
}

/** The full accent-dark envelope: 7 accents × 20 views on BOTH surfaces +
 *  the drawer per mobile accent, with per-view detector overrides merged in. */
function s38Envelope(
  desktopOverrides: Record<string, Record<string, S38Rec>> = {},
  mobileOverrides: Record<string, Record<string, S38Rec>> = {},
): S38Rec {
  const desktop: S38Rec = {};
  const mobile: S38Rec = {};
  const applied: S38Rec = {};
  for (const a of S38_ACCENTS) {
    applied[a] = a;
    const d: S38Rec = {};
    const m: S38Rec = {};
    for (const v of S38_VIEWS) {
      d[v] = s38DesktopRec(desktopOverrides[a]?.[v]);
      m[v] = s38MobileRec(mobileOverrides[a]?.[v]);
    }
    m["(drawer)"] = s38DrawerRec();
    desktop[a] = d;
    mobile[a] = m;
  }
  return { mode: "dark", mobileViewport: { width: 390, height: 844 }, applied, desktop, mobile };
}

const ACCENT_GREEN = s38Envelope(
  { violet: { Calendar: { lowcontrast: [
    { text: "27", color: "rgb(71, 85, 105)", bgEff: "rgb(15,23,42)", contrast: 2.36, cls: "text-sm font-medium" },
  ] } } },
  { violet: { Calendar: { lowcontrast: [
    { text: "27", color: "rgb(71, 85, 105)", bgEff: "rgb(15,23,42)", contrast: 2.36, cls: "text-sm font-medium" },
  ] } } },
);

const CWV_GREEN = {
  thresholds: { lcp: 2500, cls: 0.1 },
  scenarios: { viewport: { width: 390, height: 844 } },
  verdicts: {
    "clone-login-mobile-throttled": { lcp: "GOOD", cls: "GOOD" },
    "clone-dashboard-mobile-throttled": { lcp: "NI", cls: "GOOD" },
    "ref-login-mobile-throttled": { lcp: "POOR", cls: "GOOD" },
    "ref-dashboard-mobile-throttled": { lcp: "POOR", cls: "GOOD" },
  },
};

const PRE15_GREEN = {
  runtimeDependencyCount: 13, devDependencyCount: 9, pinnedMajorStack: true,
  clientStaticKb: 214, outdatedCount: 0,
  verdict: "GREEN — deps pinned by design (majors), client bundle lean, no action",
};

const DEPAUDIT_GREEN = {
  advisories: [
    { module: "braces", severity: "high", surface: "dev", runtimeReachable: false, verdict: "NON-PRODUCTION", rationale: "Not in the standalone trace; every path roots in a devDependency (eslint-config-next) — dev-time tooling only; documented non-production risk." },
    { module: "deepmerge-ts", severity: "high", surface: "cli", runtimeReachable: false, verdict: "NON-PRODUCTION", rationale: "Not in the standalone trace, but reached from the prod-declared tooling prisma (the CLI/build class — the app runtime never imports it); documented non-production risk." },
  ],
  verdict: "GREEN — 2 advisory(ies) documented as non-production (dev/CLI surface), 0 runtime-reachable",
};

const PREFLIGHT_GREEN = {
  ranAt: "2026-10-10T07:57:59.400Z", source: "dev-server-preflight", base: "http://localhost:3000",
  path: "/login", navigations: 1, hydrated: true, reachable: true, verdict: "green", remedy: null,
};

// --- parseAuditStdout ------------------------------------------------------

describe("parseAuditStdout", () => {
  it("parses clean JSON (security — no prefix noise)", () => {
    const r = parseAuditStdout(JSON.stringify(SECURITY_GREEN, null, 1));
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.json as { findings: unknown[] }).findings).toEqual([]);
  });

  it("strips the dark-sweep 'MODE: dark' prefix line", () => {
    const r = parseAuditStdout(`MODE: dark\n${JSON.stringify(DARK_GREEN, null, 1)}`);
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.json as { mode: string }).mode).toBe("dark");
  });

  it("strips the upload-edge '[cleanup]' prefix line", () => {
    const r = parseAuditStdout(`[cleanup] removed probe rows\n${JSON.stringify({ findings: [], nonGaps: [] }, null, 1)}`);
    expect(r.ok).toBe(true);
  });

  it("strips CWV per-scenario progress lines before the JSON", () => {
    const r = parseAuditStdout(`clone-login-mobile-throttled: done\nclone-login-desktop: done\n${JSON.stringify(CWV_GREEN, null, 1)}`);
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.json as { verdicts: object }).verdicts).toBeTruthy();
  });

  it("is a LOUD error on non-JSON output (a crashed audit is never green)", () => {
    const r = parseAuditStdout("node:internal/modules/cjs/loader:2075\nthrow err;\n");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/parse/i);
  });

  // S81/AH7: the preflight prints a human GREEN line to STDOUT AFTER the
  // JSON (the original scaffolding's seam bug — the orchestrator aborted at
  // stage 0 because the slice-to-end parse failed). The parser must
  // tolerate trailing prose after a COMPLETE envelope.
  it("tolerates trailing human prose AFTER a complete JSON envelope (the preflight GREEN line)", () => {
    const r = parseAuditStdout(`${JSON.stringify({ ok: true, checks: [] }, null, 1)}\nDEV SERVER PREFLIGHT: GREEN — dev server is warm and login works\n`);
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.json as { ok: boolean }).ok).toBe(true);
  });

  // S81/AH7 guard: a TRUNCATED envelope still fails LOUD — the tolerance
  // must never manufacture a green verdict from a partial payload (the
  // anti-phantom contract).
  it("is still a LOUD error on a truncated JSON envelope (no manufactured green)", () => {
    const r = parseAuditStdout(`{"findings": [], "nonG`);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/parse/i);
  });

  // S82/AI3: the SINGLE-LINE envelope shape — the shrink loop's bound
  // (end > start + 1) never tested the single-line slice, so a compact
  // JSON envelope followed by a prose line still failed LOUD (the exact
  // AH7 failure class, latent only because the preflight prints
  // multi-line envelopes). The bound must test every slice down to and
  // including the single line.
  it("tolerates trailing prose after a SINGLE-LINE JSON envelope (the skipped shrink slice)", () => {
    const r = parseAuditStdout(`{"ok": true, "checks": []}\nDEV SERVER PREFLIGHT: GREEN — login works\n`);
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.json as { ok: boolean }).ok).toBe(true);
  });

  // S83/AJ3 (the Mode-C audit's L2): the FIRST-envelope-wins contract for
  // NDJSON-ish output — with the `end > start` bound, stdout whose first
  // `{`-opening line is itself a complete object followed by FURTHER JSON
  // lines parses to that FIRST envelope (the pre-S82 form failed LOUD
  // here). Pinned so a future "last envelope wins" or "join all lines"
  // change cannot land silently; the AP-77 shape guard remains the
  // backstop when the first object matches no known audit shape.
  it("parses the FIRST envelope when multiple one-line objects are printed (NDJSON-ish output)", () => {
    const r = parseAuditStdout(`{"ok": true, "checks": []}\n{"ok": false, "error": "later"}\n`);
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.json as { ok: boolean }).ok).toBe(true);
  });
});

// --- classifyAudit: the GREEN shapes (genuine fixtures) ---------------------

describe("classifyAudit GREEN", () => {
  it("security: findings-array empty, nonGaps counted into the note", () => {
    const v = classifyAudit("security", SECURITY_GREEN);
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/2 nonGaps/);
  });

  it("settings-roundtrip / connectivity / upload-edge / data-volume / ai-error / ai-a11y: findings-array rule", () => {
    for (const name of ["settings-roundtrip", "connectivity", "upload-edge", "data-volume", "ai-error", "ai-a11y"] as const) {
      const v = classifyAudit(name, { findings: [], nonGaps: [{ surface: "x" }] });
      expect(v.green, name).toBe(true);
      expect(v.findings, name).toBe(0);
    }
  });

  it("forced-colors: every clone view invisible/unbounded empty", () => {
    const v = classifyAudit("forced-colors", FC_GREEN);
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
  });

  it("print: light/dark print text counts all zero (overflow data rides the note)", () => {
    const v = classifyAudit("print", PRINT_GREEN);
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/overflow/i);
  });

  it("focus-order: anomalies empty + dialog/drawer guards", () => {
    const v = classifyAudit("focus-order", FOCUS_GREEN);
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
  });

  it("dark-sweep: mode=dark and zero flashbulbs/unreadable (the note carries the actual view count)", () => {
    const v = classifyAudit("dark-sweep", DARK_GREEN);
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/2 views/);
  });

  it("accent-dark-sweep: lowcontrast is WARN (the S11 non-gap family), NOT findings", () => {
    const v = classifyAudit("accent-dark-sweep", ACCENT_GREEN);
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/2 WARN/);
  });

  it("cwv: clone scenarios GOOD/NI; the reference's own POOR LCP is informational", () => {
    const v = classifyAudit("cwv", CWV_GREEN);
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/ref POOR/);
  });

  it("pre15-preflight: GREEN verdict string", () => {
    const v = classifyAudit("pre15-preflight", PRE15_GREEN);
    expect(v.green).toBe(true);
  });

  it("dep-audit: GREEN verdict string with advisories counted into the note", () => {
    const v = classifyAudit("dep-audit", DEPAUDIT_GREEN);
    expect(v.green).toBe(true);
    expect(v.note).toMatch(/2 advisories/);
  });

  it("dev-server-preflight: verdict=green (1 benign nav)", () => {
    const v = classifyAudit("dev-server-preflight", PREFLIGHT_GREEN);
    expect(v.green).toBe(true);
  });
});

// --- the anti-phantom guard (AP-77 / the S28 lesson encoded) ----------------

describe("classifyAudit shape-error (never a silent green)", () => {
  it("a findings-array audit WITHOUT the findings key reads shape-error — this is the exact manual-parse trap of session-65", () => {
    const v = classifyAudit("security", { nonGaps: [] }); // findings key absent
    expect(isErr(v)).toBe(true);
    expect(v.findings).toBe(0);
  });

  it("findings present but not an Array → shape-error", () => {
    const v = classifyAudit("security", { findings: "oops" });
    expect(isErr(v)).toBe(true);
  });

  it("forced-colors without clone.views → shape-error", () => {
    const v = classifyAudit("forced-colors", { clone: { states: {} } });
    expect(isErr(v)).toBe(true);
  });

  it("print with a non-numeric lightPrint count → shape-error", () => {
    const v = classifyAudit("print", { lightPrint: { Dashboard: null } });
    expect(isErr(v)).toBe(true);
  });

  it("focus-order without views → shape-error", () => {
    const v = classifyAudit("focus-order", { dialogs: {} });
    expect(isErr(v)).toBe(true);
  });

  it("dark-sweep without mode → shape-error", () => {
    const v = classifyAudit("dark-sweep", { views: {} });
    expect(isErr(v)).toBe(true);
  });

  it("accent entry with non-Array flashbulbs → shape-error", () => {
    const v = classifyAudit("accent-dark-sweep", { desktop: { violet: { Calendar: { flashbulbs: "x", unreadable: [] } } } });
    expect(isErr(v)).toBe(true);
  });

  it("cwv without verdicts → shape-error", () => {
    const v = classifyAudit("cwv", { thresholds: {} });
    expect(isErr(v)).toBe(true);
  });

  it("a cwv rating outside GOOD/NI/POOR/BAD → shape-error", () => {
    const v = classifyAudit("cwv", { verdicts: { "clone-x": { lcp: "MEH", cls: "GOOD" } } });
    expect(isErr(v)).toBe(true);
  });

  it("verdict-string audit without the verdict key → shape-error", () => {
    const v = classifyAudit("pre15-preflight", { outdatedCount: 3 });
    expect(isErr(v)).toBe(true);
  });

  it("an unknown audit name is a loud error (never a silent pass-through)", () => {
    const v = classifyAudit("typo-audit", { findings: [] });
    expect(isErr(v)).toBe(true);
  });
});

// --- the documented non-gap signatures (surfaced by the S32 orchestrator's
// first genuine run — each verified against the codebase and the S11/S12
// documentation before being encoded; see the session-32 execution log) ----

describe("classifyAudit documented non-gap signatures", () => {
  it("focus-order: NEXTJS-PORTAL anomalies are dev-portal artifacts (dev-mode only) — excluded from findings, counted in the note", () => {
    // The genuine session-65 suite output: 2 anomalies, both the Next.js
    // dev-tools portal ("no-indicator", out-of-viewport) — injected by the
    // dev server, absent from the standalone build.
    const v = classifyAudit("focus-order", {
      views: {
        StudyGroups: {
          stopCount: 26,
          anomalies: [
            { i: 25, tag: "NEXTJS-PORTAL", label: "", inVp: false, outlineVisible: false, ring: false, indicator: false, issue: "no-indicator" },
            { i: 25, issue: "no-indicator", tag: "NEXTJS-PORTAL", label: "", inVp: false, outlineVisible: false },
          ],
        },
      },
    });
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/2 dev-portal/);
  });

  it("focus-order: a NON-portal anomaly is still a finding (the exclusion is signature-strict)", () => {
    const v = classifyAudit("focus-order", {
      views: {
        Tasks: { anomalies: [{ issue: "tab-escape", tag: "BUTTON", label: "Save" }] },
      },
    });
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("forced-colors: sr-only unbounded controls are the designed a11y pattern (the Events date input) — excluded, noted", () => {
    // The genuine session-65 suite output: Events carries one unbounded
    // control — the sr-only INPUT[type=date] paired with the visible day
    // picker (events-view.tsx:445). Visually hidden BY DESIGN.
    const v = classifyAudit("forced-colors", {
      clone: {
        views: {
          Events: { invisible: [], unbounded: [{ tag: "INPUT", label: "", cls: "sr-only" }] },
          Dashboard: { invisible: [], unbounded: [] },
        },
        states: {}, focus: [],
      },
    });
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/1 sr-only/);
  });

  it("forced-colors: a NON-sr-only unbounded control is still a finding", () => {
    const v = classifyAudit("forced-colors", {
      clone: { views: { Tasks: { invisible: [], unbounded: [{ tag: "BUTTON", cls: "bg-white rounded-xl" }] } }, states: {}, focus: [] },
    });
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("accent-dark-sweep: white-on-accent unreadable entries are the accent CTA face (the documented S11 family-2 non-gap) — excluded, counted as CTA-face", () => {
    // The genuine session-65 suite output: the ORANGE accent's Calendar chip
    // + PracticeTests Start Test — color rgb(255,255,255) on the accent bg
    // (orange-500, contrast 2.15) — the same in light mode; the reference's
    // own accent-CTA design (remediation-plan-session11 family 2). The S38
    // full-shape fixture: the same entries riding the all-accents ×
    // all-views envelope.
    const v = classifyAudit("accent-dark-sweep", s38Envelope(
      { orange: {
        Calendar: { flashbulbs: [], unreadable: [{ text: "Calendar", color: "rgb(255, 255, 255)", bgEff: "rgb(245,158,11)", contrast: 2.15, cls: "flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium tr" }], lowcontrast: [] },
        PracticeTests: { flashbulbs: [], unreadable: [{ text: "Start Test", color: "rgb(255, 255, 255)", bgEff: "rgb(245,158,11)", contrast: 2.15, cls: "inline-flex items-center justify-center whitespace-nowrap rounded-" }], lowcontrast: [] },
      } },
      { orange: { Calendar: { flashbulbs: [], unreadable: [{ text: "Calendar", color: "rgb(255, 255, 255)", bgEff: "rgb(245,158,11)", contrast: 2.15 }], lowcontrast: [] } } },
    ));
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/3 CTA-face/);
  });

  it("accent-dark-sweep: a NON-white unreadable entry is still a finding (the CTA-face signature is strict)", () => {
    const v = classifyAudit("accent-dark-sweep", s38Envelope(
      { violet: { Tasks: { flashbulbs: [], unreadable: [{ text: "hint", color: "rgb(71, 85, 105)", bgEff: "rgb(15,23,42)", contrast: 1.4 }], lowcontrast: [] } } },
    ));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("accent-dark-sweep: flashbulbs are ALWAYS findings (never a signature class) — the genuine stale-probe-row flashbulb", () => {
    // The genuine session-65 finding: the leaked "s14 a11y probe D2" chat row
    // rendered through the designed user-bubble inversion (dark:bg-slate-100)
    // — a flashbulb in every accent. The FIX is the probe-row cleanup, never
    // a re-classification of flashbulbs.
    const v = classifyAudit("accent-dark-sweep", s38Envelope(
      { violet: { AIAssistant: { flashbulbs: [{ cls: "max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px]", bg: "rgb(241, 245, 249)", text: "s14 a11y probe D2" }], unreadable: [], lowcontrast: [] } } },
    ));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("dark-sweep: the same stale-probe-row flashbulb reads non-green (the genuine finding that surfaced the ai-a11y leak)", () => {
    const v = classifyAudit("dark-sweep", {
      mode: "dark",
      views: { AIAssistant: { flashbulbs: [{ cls: "max-w-[78%]", bg: "rgb(241, 245, 249)", text: "s14 a11y probe D2" }], unreadable: [] } },
    });
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });
});

// --- the rot / finding fixtures (each documented failure family) -----------

describe("classifyAudit findings (non-green)", () => {
  it("the double-run phantom shape (session-65's genuine second run): a NON-EMPTY findings array is a real finding under the strict rule", () => {
    const v = classifyAudit("security", {
      findings: [{ family: "C", surface: "AI-route limiter shape wrong", measured: "cutoffAt=1, statuses=429" }],
      nonGaps: [],
    });
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the pre-spent-budget differential (session-65 run 2's genuine lesson): a limiter-shape finding carries the differential diagnosis in the note", () => {
    // cutoffAt=15 (5 of the 20 already spent by manual audit runs inside the
    // window — the suite must be the window's ONLY consumer; a clean-window
    // re-run that reproduces it is a genuine limiter defect).
    const v = classifyAudit("security", {
      findings: [{ family: "C", surface: "AI-route limiter shape wrong", measured: "cutoffAt=15, statuses=400,429" }],
      nonGaps: [{ surface: "Session cookie flags", detail: "httpOnly" }],
    });
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/pre-spent-budget differential/);
    expect(v.note).toMatch(/restart the dev server/);
    expect(v.note).toMatch(/window's ONLY consumer/);
  });

  it("a non-limiter security finding does NOT carry the differential note", () => {
    const v = classifyAudit("security", {
      findings: [{ family: "A", surface: "cookie flags missing", measured: "secure=false in prod" }],
      nonGaps: [],
    });
    expect(v.green).toBe(false);
    expect(v.note).not.toMatch(/pre-spent-budget/);
  });

  it("the S27 rot: a light-mode dark-sweep with zero findings reads NON-green (mode=light)", () => {
    const v = classifyAudit("dark-sweep", { mode: "light", views: { Dashboard: { flashbulbs: [], unreadable: [] } } });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=light/);
  });

  it("dark-sweep with a flashbulb → findings=1", () => {
    const v = classifyAudit("dark-sweep", { mode: "dark", views: { Dashboard: { flashbulbs: [{ text: "x" }], unreadable: [] } } });
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("accent FAIL-class (flashbulbs non-empty) → findings counted; lowcontrast stays WARN", () => {
    const v = classifyAudit("accent-dark-sweep", s38Envelope({ violet: { Calendar: { flashbulbs: [{ text: "x" }], unreadable: [], lowcontrast: [] } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("a clone CWV scenario rated POOR is a finding (a ref POOR alone is not — the boundary)", () => {
    const v = classifyAudit("cwv", { verdicts: { "clone-login-mobile-throttled": { lcp: "POOR", cls: "GOOD" }, "ref-login-mobile-throttled": { lcp: "POOR", cls: "GOOD" } } });
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("print with light text in print media → findings counted", () => {
    const v = classifyAudit("print", { lightPrint: { Dashboard: 3 }, darkPrint: { Dashboard: 0 } });
    expect(v.green).toBe(false);
    expect(v.findings).toBe(3);
  });

  it("focus-order with an anomaly → findings counted", () => {
    const v = classifyAudit("focus-order", { views: { Dashboard: { anomalies: [{ what: "tab escape" }] } } });
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("forced-colors with an invisible-text finding → findings counted", () => {
    const v = classifyAudit("forced-colors", { clone: { views: { Dashboard: { invisible: ["txt"], unbounded: [] } } } });
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("pre15 non-GREEN verdict → non-green with the string in the note", () => {
    const v = classifyAudit("pre15-preflight", { verdict: "ACTION NEEDED — outdated deps", outdatedCount: 4 });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/ACTION NEEDED/);
  });

  it("dep-audit FAIL verdict → non-green", () => {
    const v = classifyAudit("dep-audit", { verdict: "FAIL — 1 runtime-reachable advisory", advisories: [] });
    expect(v.green).toBe(false);
  });

  it("preflight reload-loop verdict carries the remedy in the note", () => {
    const v = classifyAudit("dev-server-preflight", { verdict: "reload-loop", remedy: "stop the daemon, rm -rf .next/dev, restart (bun run dev), re-run this preflight", navigations: 19, hydrated: false });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/rm -rf \.next\/dev/);
  });
});

// --- mobile-sweep (S33 — the light-mode 390×844 drawer-navigation sweep) ----
// The fixture mirrors the genuine probe envelope: every view navigated THROUGH
// THE DRAWER (the mobile navigation menu is the vehicle), each carrying its
// identity heading, the no-overflow measurement, the drawer-closed flag, the
// app-bar check, and the per-view console-error list.

const MOBILE_SWEEP_GREEN = {
  mode: "light",
  viewport: { width: 390, height: 844 },
  drawer: { linkCount: 20, order: "Dashboard,My Day,Tasks,Calendar,Events,Timetable,Assignments,Exams,Notes,Flashcards,Practice Tests,Study Groups,Grade Tracker,Analytics,Files,Calculator,Math Solver,AI Assistant,Focus Timer,Settings" },
  views: {
    Dashboard: { heading: "Good evening, Demo Student 👋", scrollWidth: 390, drawerClosed: true, appBar: true, consoleErrors: [] },
    Tasks: { heading: "All Tasks", scrollWidth: 390, drawerClosed: true, appBar: true, consoleErrors: [] },
    Timetable: { heading: "Timetable", scrollWidth: 390, drawerClosed: true, appBar: true, consoleErrors: [] },
    Settings: { heading: "Settings", scrollWidth: 390, drawerClosed: true, appBar: true, consoleErrors: [] },
  },
  findings: [],
};

describe("classifyAudit mobile-sweep (S33)", () => {
  it("the GREEN shape: 20-link drawer, per-view records, zero findings", () => {
    const v = classifyAudit("mobile-sweep", MOBILE_SWEEP_GREEN);
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/4 views/);
    expect(v.note).toMatch(/drawer/);
  });

  it("a missing findings key is a LOUD shape-error (the anti-phantom guard)", () => {
    const { findings, ...noFindings } = MOBILE_SWEEP_GREEN;
    expect(findings).toEqual([]);
    const v = classifyAudit("mobile-sweep", noFindings);
    expect(isErr(v)).toBe(true);
  });

  it("a non-Array findings key is a shape-error", () => {
    const v = classifyAudit("mobile-sweep", { ...MOBILE_SWEEP_GREEN, findings: "none" });
    expect(isErr(v)).toBe(true);
  });

  it("a view record missing its scrollWidth is a shape-error (the measurement IS the guarantee)", () => {
    const views = { ...MOBILE_SWEEP_GREEN.views, Tasks: { heading: "All Tasks", drawerClosed: true, appBar: true, consoleErrors: [] } };
    const v = classifyAudit("mobile-sweep", { ...MOBILE_SWEEP_GREEN, views });
    expect(isErr(v)).toBe(true);
    expect(v.note).toMatch(/Tasks/);
  });

  it("a view record with a non-boolean drawerClosed is a shape-error", () => {
    const views = { ...MOBILE_SWEEP_GREEN.views, Tasks: { ...MOBILE_SWEEP_GREEN.views.Tasks, drawerClosed: "yes" } };
    const v = classifyAudit("mobile-sweep", { ...MOBILE_SWEEP_GREEN, views });
    expect(isErr(v)).toBe(true);
  });

  it("a missing views object is a shape-error", () => {
    const { views, ...rest } = MOBILE_SWEEP_GREEN;
    const v = classifyAudit("mobile-sweep", rest);
    expect(isErr(v)).toBe(true);
  });

  it("a non-390 viewport is a shape-error (the finding classes are width-dependent)", () => {
    const v = classifyAudit("mobile-sweep", { ...MOBILE_SWEEP_GREEN, viewport: { width: 1280, height: 800 } });
    expect(isErr(v)).toBe(true);
    expect(v.note).toMatch(/viewport/i);
  });

  it("the S27 rot class: a dark-mode run of the LIGHT sweep reads NON-green with the mode in the note", () => {
    const v = classifyAudit("mobile-sweep", { ...MOBILE_SWEEP_GREEN, mode: "dark" });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=dark/);
    expect(v.note).toMatch(/S27 rot/);
  });

  it("a non-string mode is a shape-error", () => {
    const v = classifyAudit("mobile-sweep", { ...MOBILE_SWEEP_GREEN, mode: 1 });
    expect(isErr(v)).toBe(true);
  });

  it("an overflow finding (scrollWidth 512) → non-green, findings=1", () => {
    const views = { ...MOBILE_SWEEP_GREEN.views, Timetable: { ...MOBILE_SWEEP_GREEN.views.Timetable, scrollWidth: 512 } };
    const v = classifyAudit("mobile-sweep", { ...MOBILE_SWEEP_GREEN, views, findings: [{ view: "Timetable", kind: "overflow", detail: "scrollWidth 512 > 390" }] });
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("a drawer-stuck finding → non-green", () => {
    const v = classifyAudit("mobile-sweep", { ...MOBILE_SWEEP_GREEN, findings: [{ view: "Files", kind: "drawer-stuck", detail: "the dialog did not close after link navigation" }] });
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("a link-count finding (the drawer lost a view) → non-green", () => {
    const v = classifyAudit("mobile-sweep", { ...MOBILE_SWEEP_GREEN, drawer: { linkCount: 19, order: "Dashboard,My Day" }, findings: [{ kind: "link-count", detail: "drawer carried 19 links, expected 20" }] });
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the unknown-audit guard still holds: a name outside AUDIT_NAMES is a shape-error", () => {
    const v = classifyAudit("mobile-sweeep", MOBILE_SWEEP_GREEN);
    expect(isErr(v)).toBe(true);
  });
});

// --- midband-sweep (S34) -----------------------------------------------------
// The light-mode 768×1024 drawer-navigation sweep — the md breakpoint, the
// switchiest width in the 391–1023px band the standing surface never probed
// (the AP-79 lesson: a viewport band between pinned widths is a blind band).
// Same per-view shape as the mobile sweep + the chrome record — the
// vehicle contract (sidebar hidden, hamburger visible: the drawer is the
// only navigation vehicle below lg).

const MIDBAND_SWEEP_GREEN = {
  mode: "light",
  viewport: { width: 768, height: 1024 },
  chrome: { sidebarVisible: false, hamburgerVisible: true },
  drawer: { linkCount: 20, order: "Dashboard,My Day,Tasks,Calendar,Events,Timetable,Assignments,Exams,Notes,Flashcards,Practice Tests,Study Groups,Grade Tracker,Analytics,Files,Calculator,Math Solver,AI Assistant,Focus Timer,Settings" },
  views: {
    Dashboard: { heading: "Good evening, Demo Student 👋", scrollWidth: 768, drawerClosed: true, appBar: true, consoleErrors: [] },
    Tasks: { heading: "All Tasks", scrollWidth: 768, drawerClosed: true, appBar: true, consoleErrors: [] },
    Timetable: { heading: "Timetable", scrollWidth: 768, drawerClosed: true, appBar: true, consoleErrors: [] },
    Settings: { heading: "Settings", scrollWidth: 768, drawerClosed: true, appBar: true, consoleErrors: [] },
  },
  findings: [],
};

describe("classifyAudit midband-sweep (S34)", () => {
  it("the GREEN shape: the chrome contract holds, per-view records, zero findings", () => {
    const v = classifyAudit("midband-sweep", MIDBAND_SWEEP_GREEN);
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/4 views/);
    expect(v.note).toMatch(/768/);
  });

  it("a missing findings key is a LOUD shape-error (the anti-phantom guard)", () => {
    const { findings, ...noFindings } = MIDBAND_SWEEP_GREEN;
    const v = classifyAudit("midband-sweep", noFindings);
    expect(isErr(v)).toBe(true);
  });

  it("a view record missing scrollWidth is a shape-error", () => {
    const views = { ...MIDBAND_SWEEP_GREEN.views, Timetable: { heading: "Timetable", drawerClosed: true, appBar: true, consoleErrors: [] } };
    const v = classifyAudit("midband-sweep", { ...MIDBAND_SWEEP_GREEN, views });
    expect(isErr(v)).toBe(true);
    expect(v.note).toMatch(/Timetable/);
  });

  it("a 390 viewport (the mobile-sweep envelope) is a shape-error — the band's representative width is 768", () => {
    const v = classifyAudit("midband-sweep", { ...MIDBAND_SWEEP_GREEN, viewport: { width: 390, height: 844 } });
    expect(isErr(v)).toBe(true);
  });

  it("a missing chrome record is a shape-error (the vehicle contract rides the envelope)", () => {
    const { chrome, ...rest } = MIDBAND_SWEEP_GREEN;
    const v = classifyAudit("midband-sweep", rest);
    expect(isErr(v)).toBe(true);
  });

  it("a chrome record with a non-boolean sidebarVisible is a shape-error", () => {
    const v = classifyAudit("midband-sweep", { ...MIDBAND_SWEEP_GREEN, chrome: { sidebarVisible: "no", hamburgerVisible: true } });
    expect(isErr(v)).toBe(true);
  });

  it("mode=dark → non-green with the mode + the S27 class in the note", () => {
    const v = classifyAudit("midband-sweep", { ...MIDBAND_SWEEP_GREEN, mode: "dark" });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=dark/);
    expect(v.note).toMatch(/S27 rot/);
  });

  it("an overflow finding (scrollWidth 800) → non-green, findings=1", () => {
    const views = { ...MIDBAND_SWEEP_GREEN.views, Timetable: { ...MIDBAND_SWEEP_GREEN.views.Timetable, scrollWidth: 800 } };
    const v = classifyAudit("midband-sweep", { ...MIDBAND_SWEEP_GREEN, views, findings: [{ view: "Timetable", kind: "overflow", detail: "scrollWidth 800 > 768" }] });
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the chrome contract broken (sidebarVisible: true) → NON-GREEN with the lg-contract note — the vehicle class", () => {
    const v = classifyAudit("midband-sweep", { ...MIDBAND_SWEEP_GREEN, chrome: { sidebarVisible: true, hamburgerVisible: false }, findings: [] });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/lg contract/);
  });

  it("the chrome contract broken (hamburgerVisible: false) → NON-GREEN — the drawer is the vehicle below lg", () => {
    const v = classifyAudit("midband-sweep", { ...MIDBAND_SWEEP_GREEN, chrome: { sidebarVisible: false, hamburgerVisible: false }, findings: [] });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/vehicle/);
  });

  it("the unknown-audit guard still holds: a name outside AUDIT_NAMES is a shape-error", () => {
    const v = classifyAudit("midband-sweeep", MIDBAND_SWEEP_GREEN);
    expect(isErr(v)).toBe(true);
  });
});

// --- landscape-sweep (S35) ---------------------------------------------------
// The light-mode 844×390 phone-landscape drawer-navigation sweep — the
// iPhone-class landscape, the representative of the 390–430px-tall band the
// standing surface never probed (the AP-80 lesson: an axis never varied is
// an axis never verified — every pinned viewport was portrait-tall). Same
// per-view shape as the midband sweep + headingClearance (the fixed-bar
// clearance — the h-16 bar covers 16% of a 390px viewport) + the chrome
// record gains drawerNavScrollable (the short-viewport contract: the 20
// reference-measured nav rows cannot fit the ~300px nav area at 390 height —
// the nav scroll is the ONLY path to links 8–20 in landscape).

const LANDSCAPE_SWEEP_GREEN = {
  mode: "light",
  viewport: { width: 844, height: 390 },
  chrome: { sidebarVisible: false, hamburgerVisible: true, drawerNavScrollable: true },
  drawer: { linkCount: 20, order: "Dashboard,My Day,Tasks,Calendar,Events,Timetable,Assignments,Exams,Notes,Flashcards,Practice Tests,Study Groups,Grade Tracker,Analytics,Files,Calculator,Math Solver,AI Assistant,Focus Timer,Settings" },
  views: {
    Dashboard: { heading: "Good evening, Demo Student 👋", scrollWidth: 844, drawerClosed: true, appBar: true, headingClearance: true, consoleErrors: [] },
    Tasks: { heading: "All Tasks", scrollWidth: 844, drawerClosed: true, appBar: true, headingClearance: true, consoleErrors: [] },
    Timetable: { heading: "Timetable", scrollWidth: 844, drawerClosed: true, appBar: true, headingClearance: true, consoleErrors: [] },
    Settings: { heading: "Settings", scrollWidth: 844, drawerClosed: true, appBar: true, headingClearance: true, consoleErrors: [] },
  },
  findings: [],
};

describe("classifyAudit landscape-sweep (S35)", () => {
  it("the GREEN shape: both contracts hold, per-view records with clearance, zero findings", () => {
    const v = classifyAudit("landscape-sweep", LANDSCAPE_SWEEP_GREEN);
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/4 views/);
    expect(v.note).toMatch(/844/);
  });

  it("a missing findings key is a LOUD shape-error (the anti-phantom guard)", () => {
    const { findings, ...noFindings } = LANDSCAPE_SWEEP_GREEN;
    const v = classifyAudit("landscape-sweep", noFindings);
    expect(isErr(v)).toBe(true);
  });

  it("a view record missing headingClearance is a shape-error (the clearance is this audit's per-view key)", () => {
    const views = { ...LANDSCAPE_SWEEP_GREEN.views, Timetable: { heading: "Timetable", scrollWidth: 844, drawerClosed: true, appBar: true, consoleErrors: [] } };
    const v = classifyAudit("landscape-sweep", { ...LANDSCAPE_SWEEP_GREEN, views });
    expect(isErr(v)).toBe(true);
    expect(v.note).toMatch(/Timetable/);
  });

  it("the 390×844 PORTRAIT envelope (the mobile-sweep shape) is a shape-error — the finding classes are HEIGHT-dependent", () => {
    const v = classifyAudit("landscape-sweep", { ...LANDSCAPE_SWEEP_GREEN, viewport: { width: 390, height: 844 } });
    expect(isErr(v)).toBe(true);
  });

  it("the 768×1024 mid-band envelope is a shape-error — the phone-landscape class is this audit's contract", () => {
    const v = classifyAudit("landscape-sweep", { ...LANDSCAPE_SWEEP_GREEN, viewport: { width: 768, height: 1024 } });
    expect(isErr(v)).toBe(true);
  });

  it("a chrome record missing drawerNavScrollable is a shape-error (the short-viewport contract rides the envelope)", () => {
    const v = classifyAudit("landscape-sweep", { ...LANDSCAPE_SWEEP_GREEN, chrome: { sidebarVisible: false, hamburgerVisible: true } });
    expect(isErr(v)).toBe(true);
  });

  it("a chrome record with a non-boolean drawerNavScrollable is a shape-error", () => {
    const v = classifyAudit("landscape-sweep", { ...LANDSCAPE_SWEEP_GREEN, chrome: { sidebarVisible: false, hamburgerVisible: true, drawerNavScrollable: "yes" } });
    expect(isErr(v)).toBe(true);
  });

  it("mode=dark → non-green with the mode + the S27 class in the note", () => {
    const v = classifyAudit("landscape-sweep", { ...LANDSCAPE_SWEEP_GREEN, mode: "dark" });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=dark/);
    expect(v.note).toMatch(/S27 rot/);
  });

  it("a heading-clearance finding (the heading slid under the fixed bar) → non-green, findings=1", () => {
    const views = { ...LANDSCAPE_SWEEP_GREEN.views, "Focus Timer": { heading: "Focus Timer", scrollWidth: 844, drawerClosed: true, appBar: true, headingClearance: false, consoleErrors: [] } };
    const v = classifyAudit("landscape-sweep", { ...LANDSCAPE_SWEEP_GREEN, views, findings: [{ view: "Focus Timer", kind: "heading-clearance", detail: "the identity heading's top is y=41 < 64 — under the fixed app bar" }] });
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the vehicle contract broken (sidebarVisible: true) → NON-GREEN with the lg-contract note", () => {
    const v = classifyAudit("landscape-sweep", { ...LANDSCAPE_SWEEP_GREEN, chrome: { sidebarVisible: true, hamburgerVisible: false, drawerNavScrollable: true }, findings: [] });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/lg contract/);
  });

  it("the SHORT-VIEWPORT contract broken (drawerNavScrollable: false) → NON-GREEN with the geometry note — the new class this audit owns", () => {
    const v = classifyAudit("landscape-sweep", { ...LANDSCAPE_SWEEP_GREEN, chrome: { sidebarVisible: false, hamburgerVisible: true, drawerNavScrollable: false }, findings: [] });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/scroll/);
    expect(v.note).toMatch(/geometry|nav|rows/i);
  });

  it("an overflow finding (scrollWidth 900) → non-green, findings=1", () => {
    const views = { ...LANDSCAPE_SWEEP_GREEN.views, Timetable: { ...LANDSCAPE_SWEEP_GREEN.views.Timetable, scrollWidth: 900 } };
    const v = classifyAudit("landscape-sweep", { ...LANDSCAPE_SWEEP_GREEN, views, findings: [{ view: "Timetable", kind: "overflow", detail: "scrollWidth 900 > 844" }] });
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the unknown-audit guard still holds: a name outside AUDIT_NAMES is a shape-error", () => {
    const v = classifyAudit("landscape-sweeep", LANDSCAPE_SWEEP_GREEN);
    expect(isErr(v)).toBe(true);
  });
});

// --- dark-mobile-sweep (S36) ---------------------------------------------------
// The dark-mode 390×844 drawer-navigation sweep — the MODE axis at the mobile
// viewport the standing surface never varied (the AP-81 lesson: dark × mobile
// was covered for 6 of 20 views by accent-dark-sweep's mobile pass; 14 views
// had never been rendered in dark at the stacked mobile layout by any
// standing audit, and every light mobile sweep is mode-rot-guarded by
// construction). Dark mode is the clone's SUPERSET feature (the reference's
// own Dark/System options are a measured Base44 no-op — S10-1). Per-view
// shape as the landscape sweep + flashbulbs/unreadable (the dark-sweep
// detector family ported to the mobile layout); the drawer record gains
// dark (the drawer's own dark rendering: dark:bg-slate-950 panel).

const DARK_MOBILE_SWEEP_GREEN = {
  mode: "dark",
  viewport: { width: 390, height: 844 },
  chrome: { sidebarVisible: false, hamburgerVisible: true },
  drawer: {
    linkCount: 20,
    order: "Dashboard,My Day,Tasks,Calendar,Events,Timetable,Assignments,Exams,Notes,Flashcards,Practice Tests,Study Groups,Grade Tracker,Analytics,Files,Calculator,Math Solver,AI Assistant,Focus Timer,Settings",
    dark: { flashbulbs: 0, unreadable: 0, panelBg: "rgb(2, 6, 23)" },
  },
  views: {
    Dashboard: { heading: "Good evening, Demo Student 👋", scrollWidth: 390, drawerClosed: true, appBar: true, headingClearance: true, flashbulbs: [], unreadable: [], consoleErrors: [] },
    Notes: { heading: "Notes", scrollWidth: 390, drawerClosed: true, appBar: true, headingClearance: true, flashbulbs: [], unreadable: [], consoleErrors: [] },
    Flashcards: { heading: "Flashcards", scrollWidth: 390, drawerClosed: true, appBar: true, headingClearance: true, flashbulbs: [], unreadable: [], consoleErrors: [] },
    Settings: { heading: "Settings", scrollWidth: 390, drawerClosed: true, appBar: true, headingClearance: true, flashbulbs: [], unreadable: [], consoleErrors: [] },
  },
  findings: [],
};

describe("classifyAudit dark-mobile-sweep (S36)", () => {
  it("the GREEN shape: dark mode, detector arrays empty, zero findings, contracts hold", () => {
    const v = classifyAudit("dark-mobile-sweep", DARK_MOBILE_SWEEP_GREEN);
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/4 views/);
    expect(v.note).toMatch(/390/);
    expect(v.note).toMatch(/MODE dark/);
  });

  it("a missing findings key is a LOUD shape-error (the anti-phantom guard)", () => {
    const { findings, ...noFindings } = DARK_MOBILE_SWEEP_GREEN;
    const v = classifyAudit("dark-mobile-sweep", noFindings);
    expect(isErr(v)).toBe(true);
  });

  it("a view record missing flashbulbs is a shape-error (the dark detector keys are this audit's per-view contract)", () => {
    const views = { ...DARK_MOBILE_SWEEP_GREEN.views, Notes: { heading: "Notes", scrollWidth: 390, drawerClosed: true, appBar: true, headingClearance: true, unreadable: [], consoleErrors: [] } };
    const v = classifyAudit("dark-mobile-sweep", { ...DARK_MOBILE_SWEEP_GREEN, views });
    expect(isErr(v)).toBe(true);
    expect(v.note).toMatch(/Notes/);
  });

  it("a view record missing unreadable is a shape-error", () => {
    const views = { ...DARK_MOBILE_SWEEP_GREEN.views, Flashcards: { heading: "Flashcards", scrollWidth: 390, drawerClosed: true, appBar: true, headingClearance: true, flashbulbs: [], consoleErrors: [] } };
    const v = classifyAudit("dark-mobile-sweep", { ...DARK_MOBILE_SWEEP_GREEN, views });
    expect(isErr(v)).toBe(true);
    expect(v.note).toMatch(/Flashcards/);
  });

  it("the drawer record missing dark is a shape-error (the drawer's own dark rendering rides the envelope)", () => {
    const { dark, ...drawerNoDark } = DARK_MOBILE_SWEEP_GREEN.drawer;
    const v = classifyAudit("dark-mobile-sweep", { ...DARK_MOBILE_SWEEP_GREEN, drawer: drawerNoDark });
    expect(isErr(v)).toBe(true);
  });

  it("the 844×390 LANDSCAPE envelope is a shape-error — the portrait mobile class is this audit's contract", () => {
    const v = classifyAudit("dark-mobile-sweep", { ...DARK_MOBILE_SWEEP_GREEN, viewport: { width: 844, height: 390 } });
    expect(isErr(v)).toBe(true);
  });

  it("the 768×1024 mid-band envelope is a shape-error — the documented non-gap combos are not this audit's contract", () => {
    const v = classifyAudit("dark-mobile-sweep", { ...DARK_MOBILE_SWEEP_GREEN, viewport: { width: 768, height: 1024 } });
    expect(isErr(v)).toBe(true);
  });

  it("mode=light → non-green with the mode + the S27 class in the note — the INVERSE rot guard (light is the wrong mode here)", () => {
    const v = classifyAudit("dark-mobile-sweep", { ...DARK_MOBILE_SWEEP_GREEN, mode: "light" });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=light/);
    expect(v.note).toMatch(/S27 rot/);
  });

  it("a flashbulb finding at Notes → non-green, findings=1", () => {
    const views = { ...DARK_MOBILE_SWEEP_GREEN.views, Notes: { ...DARK_MOBILE_SWEEP_GREEN.views.Notes, flashbulbs: [{ cls: "bg-white", bg: "rgb(255, 255, 255)" }] } };
    const v = classifyAudit("dark-mobile-sweep", { ...DARK_MOBILE_SWEEP_GREEN, views, findings: [{ view: "Notes", kind: "flashbulb", detail: "1 light surface(s) in dark mode" }] });
    expect(v.green).toBe(false);
    expect(v.findings).toBeGreaterThanOrEqual(1);
  });

  it("a NON-EMPTY flashbulbs array with an EMPTY findings array → STILL non-green (the independent counting — the dark-sweep semantics; a probe that forgets to push the detector hit still fails)", () => {
    const views = { ...DARK_MOBILE_SWEEP_GREEN.views, Notes: { ...DARK_MOBILE_SWEEP_GREEN.views.Notes, flashbulbs: [{ cls: "bg-white", bg: "rgb(255, 255, 255)" }] } };
    const v = classifyAudit("dark-mobile-sweep", { ...DARK_MOBILE_SWEEP_GREEN, views, findings: [] });
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/dark detection/);
  });

  it("the vehicle contract broken (sidebarVisible: true) → NON-GREEN with the lg-contract note", () => {
    const v = classifyAudit("dark-mobile-sweep", { ...DARK_MOBILE_SWEEP_GREEN, chrome: { sidebarVisible: true, hamburgerVisible: false }, findings: [] });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/lg contract/);
  });

  it("the unknown-audit guard still holds: a name outside AUDIT_NAMES is a shape-error", () => {
    const v = classifyAudit("dark-mobile-sweeep", DARK_MOBILE_SWEEP_GREEN);
    expect(isErr(v)).toBe(true);
  });
});

// --- accent-light-sweep (S37) --------------------------------------------------
// The ACCENT axis in LIGHT mode — the theme dimension the standing surface
// never varies in light (the AP-82 lesson: the accent-dark-sweep varies the
// accent ONLY in dark — its own name is the blind spot; every light pin
// rides the default violet; the only light × non-violet rendering in any
// standing artifact is ONE desktop calculator view). The reference's accent
// picker saves but never re-themes (re-verified live in session 3) — the
// clone's working accent system is the functional superset, so its
// light-mode correctness is a superset-quality contract. Per-accent shape:
// applied (the self-verified <html data-accent> reading) + views (heading /
// scrollWidth / unreadable / lowcontrast / consoleErrors — the contrast
// detector family ported to the light canvas; the flashbulb class does not
// apply in light mode) + the drawer record (the active-link tint is
// accent-driven). The ALL-ACCENTS guard: an accent that silently did not
// run must never read green-by-omission. The CTA-face exemption (the S11
// family-2 non-gap in light: white on accent-500 is the reference's own
// accent-CTA choice) counts into the note, never the findings.

function s37AccentRecord(applied: string, views: Record<string, unknown> = {}) {
  const defaultViews = {
    Dashboard: { heading: "Good evening, Demo Student 👋", scrollWidth: 390, unreadable: [], lowcontrast: [], consoleErrors: [] },
    Notes: { heading: "Notes", scrollWidth: 390, unreadable: [], lowcontrast: [], consoleErrors: [] },
  };
  return {
    applied,
    views: { ...defaultViews, ...views },
    drawer: { linkCount: 20, unreadable: [], lowcontrast: [], activeTint: "linear-gradient(to right, rgb(139, 92, 246), rgb(99, 102, 241))" },
  };
}

const ACCENT_LIGHT_SWEEP_GREEN = {
  mode: "light",
  viewport: { width: 390, height: 844 },
  chrome: { sidebarVisible: false, hamburgerVisible: true },
  accents: {
    violet: s37AccentRecord("violet"),
    blue: s37AccentRecord("blue"),
    green: s37AccentRecord("green"),
    orange: s37AccentRecord("orange", {
      Dashboard: { heading: "Good evening, Demo Student 👋", scrollWidth: 390, unreadable: [{ text: "Add Task", color: "rgb(255, 255, 255)", contrast: 2.15 }], lowcontrast: [], consoleErrors: [] },
    }),
    pink: s37AccentRecord("pink"),
    red: s37AccentRecord("red"),
    teal: s37AccentRecord("teal"),
  },
  findings: [],
};

describe("classifyAudit accent-light-sweep (S37)", () => {
  it("the GREEN shape: all 7 accents, clean detectors → green with the swept count", () => {
    const v = classifyAudit("accent-light-sweep", ACCENT_LIGHT_SWEEP_GREEN);
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/7 accents/);
    expect(v.note).toMatch(/CTA-face exempt/);
  });

  it("mode rot: a dark run is the wrong mode (the accent × dark family belongs to accent-dark-sweep)", () => {
    const v = classifyAudit("accent-light-sweep", { ...ACCENT_LIGHT_SWEEP_GREEN, mode: "dark" });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=dark/);
    expect(v.note).toMatch(/accent-dark-sweep/);
  });

  it("shape-error: a missing findings Array", () => {
    const { findings: _drop, ...noFindings } = ACCENT_LIGHT_SWEEP_GREEN;
    const v = classifyAudit("accent-light-sweep", noFindings);
    expect(isErr(v)).toBe(true);
  });

  it("shape-error: a missing accent (the ALL-ACCENTS guard — an accent that silently did not run)", () => {
    const accents = { ...ACCENT_LIGHT_SWEEP_GREEN.accents } as Record<string, unknown>;
    delete accents.teal;
    const v = classifyAudit("accent-light-sweep", { ...ACCENT_LIGHT_SWEEP_GREEN, accents });
    expect(isErr(v)).toBe(true);
    expect(v.note).toMatch(/all 7/);
    expect(v.note).toMatch(/teal/);
  });

  it("shape-error: a view record missing unreadable", () => {
    const accents = { ...ACCENT_LIGHT_SWEEP_GREEN.accents } as Record<string, Record<string, unknown>>;
    accents.violet = { ...accents.violet, views: { Notes: { heading: "Notes", scrollWidth: 390, lowcontrast: [], consoleErrors: [] } } };
    const v = classifyAudit("accent-light-sweep", { ...ACCENT_LIGHT_SWEEP_GREEN, accents });
    expect(isErr(v)).toBe(true);
  });

  it("shape-error: a view record missing lowcontrast", () => {
    const accents = { ...ACCENT_LIGHT_SWEEP_GREEN.accents } as Record<string, Record<string, unknown>>;
    accents.blue = { ...accents.blue, views: { Notes: { heading: "Notes", scrollWidth: 390, unreadable: [], consoleErrors: [] } } };
    const v = classifyAudit("accent-light-sweep", { ...ACCENT_LIGHT_SWEEP_GREEN, accents });
    expect(isErr(v)).toBe(true);
  });

  it("shape-error: an accent record missing its drawer", () => {
    const accents = { ...ACCENT_LIGHT_SWEEP_GREEN.accents } as Record<string, Record<string, unknown>>;
    const { drawer: _d, ...greenNoDrawer } = accents.green;
    accents.green = greenNoDrawer;
    const v = classifyAudit("accent-light-sweep", { ...ACCENT_LIGHT_SWEEP_GREEN, accents });
    expect(isErr(v)).toBe(true);
  });

  it("shape-error: the 1280×800 desktop envelope fed to the mobile classifier", () => {
    const v = classifyAudit("accent-light-sweep", { ...ACCENT_LIGHT_SWEEP_GREEN, viewport: { width: 1280, height: 800 } });
    expect(isErr(v)).toBe(true);
  });

  it("shape-error: the 768×1024 mid-band envelope fed to the mobile classifier", () => {
    const v = classifyAudit("accent-light-sweep", { ...ACCENT_LIGHT_SWEEP_GREEN, viewport: { width: 768, height: 1024 } });
    expect(isErr(v)).toBe(true);
  });

  it("findings-present: a non-CTA unreadable entry under teal is a genuine finding", () => {
    const accents = { ...ACCENT_LIGHT_SWEEP_GREEN.accents } as Record<string, Record<string, unknown>>;
    accents.teal = s37AccentRecord("teal", {
      Notes: { heading: "Notes", scrollWidth: 390, unreadable: [{ text: "pinned note", color: "rgb(148, 163, 184)", contrast: 1.9 }], lowcontrast: [], consoleErrors: [] },
    });
    const v = classifyAudit("accent-light-sweep", { ...ACCENT_LIGHT_SWEEP_GREEN, accents, findings: [{ accent: "teal", view: "Notes", kind: "unreadable", detail: "1 unreadable text node(s)" }] });
    expect(v.green).toBe(false);
    expect(v.findings).toBeGreaterThanOrEqual(1);
  });

  it("the CTA-face exemption: white-on-accent unreadable entries stay GREEN (the S11 family-2 non-gap)", () => {
    const v = classifyAudit("accent-light-sweep", ACCENT_LIGHT_SWEEP_GREEN);
    expect(v.green).toBe(true);
    expect(v.note).toMatch(/1 CTA-face exempt/);
  });

  it("the calendar adjacent-day exemption: slate-300 day numbers stay GREEN (the S6-G reference-measured pin, re-verified live)", () => {
    const accents = { ...ACCENT_LIGHT_SWEEP_GREEN.accents } as Record<string, Record<string, unknown>>;
    accents.violet = s37AccentRecord("violet", {
      Calendar: { heading: "Calendar", scrollWidth: 390, unreadable: [{ text: "27", color: "rgb(203, 213, 225)", contrast: 1.48 }, { text: "30", color: "rgb(203, 213, 225)", contrast: 1.48 }], lowcontrast: [], consoleErrors: [] },
    });
    const v = classifyAudit("accent-light-sweep", { ...ACCENT_LIGHT_SWEEP_GREEN, accents, findings: [] });
    expect(v.green).toBe(true);
    expect(v.note).toMatch(/2 calendar adjacent-day exempt/);
  });

  it("the calendar exemption is signature-strict: slate-300 NON-day-number text is still a genuine finding", () => {
    const accents = { ...ACCENT_LIGHT_SWEEP_GREEN.accents } as Record<string, Record<string, unknown>>;
    accents.violet = s37AccentRecord("violet", {
      Calendar: { heading: "Calendar", scrollWidth: 390, unreadable: [{ text: "some paragraph text", color: "rgb(203, 213, 225)", contrast: 1.48 }], lowcontrast: [], consoleErrors: [] },
    });
    const v = classifyAudit("accent-light-sweep", { ...ACCENT_LIGHT_SWEEP_GREEN, accents, findings: [] });
    expect(v.green).toBe(false);
  });

  it("the yellow-pill exemption: yellow-500 priority vocabulary stays GREEN (the S6/S8 reference-measured pin)", () => {
    const accents = { ...ACCENT_LIGHT_SWEEP_GREEN.accents } as Record<string, Record<string, unknown>>;
    accents.orange = s37AccentRecord("orange", {
      Dashboard: { heading: "Good evening, Demo Student 👋", scrollWidth: 390, unreadable: [{ text: "high", color: "rgb(234, 179, 8)", contrast: 1.85 }, { text: "medium", color: "rgb(234, 179, 8)", contrast: 1.85 }], lowcontrast: [], consoleErrors: [] },
    });
    const v = classifyAudit("accent-light-sweep", { ...ACCENT_LIGHT_SWEEP_GREEN, accents, findings: [] });
    expect(v.green).toBe(true);
    expect(v.note).toMatch(/2 yellow-pill exempt/);
  });

  it("the yellow-pill exemption is signature-strict: yellow-500 text OUTSIDE the priority vocabulary is still a finding", () => {
    const accents = { ...ACCENT_LIGHT_SWEEP_GREEN.accents } as Record<string, Record<string, unknown>>;
    accents.pink = s37AccentRecord("pink", {
      Assignments: { heading: "Assignments", scrollWidth: 390, unreadable: [{ text: "Urgent heading text", color: "rgb(234, 179, 8)", contrast: 1.85 }], lowcontrast: [], consoleErrors: [] },
    });
    const v = classifyAudit("accent-light-sweep", { ...ACCENT_LIGHT_SWEEP_GREEN, accents, findings: [] });
    expect(v.green).toBe(false);
  });

  it("the independent counting: a NON-EMPTY unreadable array with an EMPTY findings array still reads non-green", () => {
    const accents = { ...ACCENT_LIGHT_SWEEP_GREEN.accents } as Record<string, Record<string, unknown>>;
    accents.red = s37AccentRecord("red", {
      Notes: { heading: "Notes", scrollWidth: 390, unreadable: [{ text: "note title", color: "rgb(100, 116, 139)", contrast: 2.0 }], lowcontrast: [], consoleErrors: [] },
    });
    const v = classifyAudit("accent-light-sweep", { ...ACCENT_LIGHT_SWEEP_GREEN, accents, findings: [] });
    expect(v.green).toBe(false);
    expect(v.findings).toBeGreaterThanOrEqual(1);
    expect(v.note).toMatch(/unreadable/);
  });

  it("the applied-mismatch: an accent whose self-verified applied reading differs from its key reads non-green", () => {
    const accents = { ...ACCENT_LIGHT_SWEEP_GREEN.accents } as Record<string, Record<string, unknown>>;
    accents.teal = s37AccentRecord("violet");
    const v = classifyAudit("accent-light-sweep", { ...ACCENT_LIGHT_SWEEP_GREEN, accents });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/teal/);
    expect(v.note).toMatch(/appl/);
  });

  it("the vehicle contract: a visible sidebar at 390 reads non-green (the lg contract)", () => {
    const v = classifyAudit("accent-light-sweep", { ...ACCENT_LIGHT_SWEEP_GREEN, chrome: { sidebarVisible: true, hamburgerVisible: false }, findings: [] });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/lg contract/);
  });

  it("the unknown-audit guard still holds: a name outside AUDIT_NAMES is a shape-error", () => {
    const v = classifyAudit("accent-light-sweeep", ACCENT_LIGHT_SWEEP_GREEN);
    expect(isErr(v)).toBe(true);
  });
});

// --- accent-dark-sweep (S38 — the mobile 20-view matrix) ----------------------
// The accent × dark × MOBILE combo covered only 6 of 20 views (MOBILE_VIEWS
// — Dashboard, MyDay, Timetable, Tasks, Settings, Calendar); the other 14
// had NEVER been rendered in dark × accent at the stacked mobile layout by
// any standing audit (mobile/midband/landscape are LIGHT + violet-only;
// dark-mobile is violet-only; accent-light is LIGHT-only). The S38 shape
// closes the matrix AND retires the omission-means-clean recording: every
// view is recorded explicitly on BOTH surfaces, the per-accent `applied`
// self-verification, `mode`, and the mobile `mobileViewport` ride the
// envelope, and the ALL-ACCENTS + ALL-VIEWS + drawer-present guards make
// every silently-skipped dimension a LOUD shape-error (the S37 anti-phantom
// doctrine applied to the accent-dark family — an audit that cannot verify
// its own coverage cannot be green).

describe("classifyAudit accent-dark-sweep (S38 — the mobile 20-view matrix)", () => {
  it("the GREEN shape: all 7 accents × 20 views on BOTH surfaces + the drawer per accent → green with the swept counts", () => {
    const v = classifyAudit("accent-dark-sweep", s38Envelope());
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/280 view renderings/);
    expect(v.note).toMatch(/7 drawer records/);
  });

  it("the ALL-VIEWS guard (mobile): an accent map missing ONE view reads shape-error — a view that silently did not run must never read green-by-omission", () => {
    const env = s38Envelope() as { mobile: Record<string, Record<string, unknown>> };
    delete env.mobile.violet.Notes;
    const v = classifyAudit("accent-dark-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the ALL-VIEWS guard (desktop): the omission-means-clean recording shape is RETIRED — a desktop accent map missing a view reads shape-error", () => {
    const env = s38Envelope() as { desktop: Record<string, Record<string, unknown>> };
    delete env.desktop.teal.Files;
    const v = classifyAudit("accent-dark-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the ALL-ACCENTS guard: a surface missing ONE accent reads shape-error", () => {
    const env = s38Envelope() as { mobile: Record<string, unknown> };
    delete env.mobile.red;
    const v = classifyAudit("accent-dark-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the ALL-ACCENTS guard (applied map): a missing self-verified reading reads shape-error", () => {
    const env = s38Envelope() as { applied: Record<string, unknown> };
    delete env.applied.green;
    const v = classifyAudit("accent-dark-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the historical 6-view mobile envelope (the pre-S38 MOBILE_VIEWS rot) reads shape-error — the exact shrink this guard catches", () => {
    const env = s38Envelope() as { mobile: Record<string, Record<string, unknown>> };
    for (const view of S38_VIEWS) {
      if (!S38_MOBILE_VIEWS_PRE_S38.includes(view)) delete env.mobile.violet[view];
    }
    const v = classifyAudit("accent-dark-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the missing drawer record reads shape-error (the drawer is part of the mobile contract per accent)", () => {
    const env = s38Envelope() as { mobile: Record<string, Record<string, unknown>> };
    delete env.mobile.pink["(drawer)"];
    const v = classifyAudit("accent-dark-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("mode is part of the contract: an envelope without mode reads shape-error", () => {
    const env = s38Envelope() as Record<string, unknown>;
    delete env.mode;
    const v = classifyAudit("accent-dark-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("mobileViewport must be the 390×844 mobile contract — a desktop viewport fed here reads shape-error, never a silent re-scope", () => {
    const v = classifyAudit("accent-dark-sweep", { ...s38Envelope(), mobileViewport: { width: 1280, height: 800 } });
    expect(isErr(v)).toBe(true);
  });

  it("the mode rot guard: mode=light reads NON-green (the accent × light family belongs to accent-light-sweep — the INVERSE guard)", () => {
    const v = classifyAudit("accent-dark-sweep", { ...s38Envelope(), mode: "light" });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=light/);
  });

  it("the applied-mismatch family: an accent whose self-verified reading differs from its key is a finding", () => {
    const env = s38Envelope() as { applied: Record<string, unknown> };
    env.applied.teal = "violet";
    const v = classifyAudit("accent-dark-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the drawer-error family: a drawer that failed to open is a FINDING (never a swallow)", () => {
    const env = s38Envelope() as { mobile: Record<string, Record<string, unknown>> };
    env.mobile.blue["(drawer)"] = { linkCount: 0, flashbulbs: [], unreadable: [], lowcontrast: [], error: "TimeoutError: locator.click: Timeout 10000ms" };
    const v = classifyAudit("accent-dark-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the mobile overflow family: scrollWidth > 390 is a finding (the S16 mobile-only-gap class, measured never ignored)", () => {
    const v = classifyAudit("accent-dark-sweep", s38Envelope({}, { green: { Notes: { scrollWidth: 420 } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the strict record shape: a mobile record missing lowcontrast reads shape-error", () => {
    const env = s38Envelope() as { mobile: Record<string, Record<string, unknown>> };
    delete (env.mobile.red.Tasks as Record<string, unknown>).lowcontrast;
    const v = classifyAudit("accent-dark-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the mobile record shape: scrollWidth must be a number — a missing reading is a shape-error", () => {
    const env = s38Envelope() as { mobile: Record<string, Record<string, unknown>> };
    delete (env.mobile.orange.Events as Record<string, unknown>).scrollWidth;
    const v = classifyAudit("accent-dark-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the lowcontrast WARN family rides the note on the new shape (the S11 non-gap family)", () => {
    const env = s38Envelope({ violet: { Calendar: { lowcontrast: [
      { text: "27", color: "rgb(148, 163, 184)", bgEff: "rgb(15,23,42)", contrast: 2.36 },
    ] } } });
    const v = classifyAudit("accent-dark-sweep", env);
    expect(v.green).toBe(true);
    expect(v.note).toMatch(/1 WARN/);
  });

  it("the unknown-audit guard still holds for the extended shape: a name outside AUDIT_NAMES is a shape-error", () => {
    const v = classifyAudit("accent-dark-swep", s38Envelope());
    expect(isErr(v)).toBe(true);
  });
});

// --- accent-midband-sweep (S39 — the accent × mid-band drawer-navigation sweep)

// The full-shape generator: 7 accents × 20 views navigated through the
// drawer at 768×1024 (the md breakpoint) in LIGHT mode + the drawer record
// per accent, with the per-view interaction keys (activeTint — the inner
// span's accent gradient while THIS view was active; activeLabel — the
// drawer's aria-current link when read, MUST equal the view's own label).
const S39_ACCENTS = ["violet", "blue", "green", "orange", "pink", "red", "teal"] as const;
// The 20 canonical views by DISPLAY labels — the drawer links' accessible
// names, the S34 midband-sweep envelope convention (the vehicle family this
// audit extends); the per-view activeLabel reading is the same label.
const S39_VIEWS = [
  "Dashboard", "My Day", "Tasks", "Calendar", "Events", "Timetable",
  "Assignments", "Exams", "Notes", "Flashcards", "Practice Tests",
  "Study Groups", "Grade Tracker", "Analytics", "Files", "Calculator",
  "Math Solver", "AI Assistant", "Focus Timer", "Settings",
];
const S39_TINT = "linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))";

type S39Rec = Record<string, unknown>;

function s39ViewRec(o: S39Rec = {}): S39Rec {
  return {
    heading: "ok", scrollWidth: 768, drawerClosed: true, appBar: true,
    unreadable: [] as unknown[], lowcontrast: [] as unknown[], consoleErrors: [] as unknown[],
    activeTint: S39_TINT, activeLabel: "",
    ...o,
  };
}
function s39DrawerRec(o: S39Rec = {}): S39Rec {
  return { linkCount: 20, unreadable: [] as unknown[], lowcontrast: [] as unknown[], activeView: "Settings", activeTint: S39_TINT, ...o };
}

/** The full accent-midband envelope: 7 accents × 20 views + the drawer per
 *  accent, with per-view overrides merged in (the activeLabel defaults are
 *  filled to the view's own label — the interaction contract). */
function s39Envelope(viewOverrides: Record<string, Record<string, S39Rec>> = {}): S39Rec {
  const accents: S39Rec = {};
  for (const a of S39_ACCENTS) {
    const views: S39Rec = {};
    for (const v of S39_VIEWS) {
      const base = s39ViewRec(viewOverrides[a]?.[v]);
      if (base.activeLabel === "") base.activeLabel = v; // the interaction contract default
      views[v] = base;
    }
    accents[a] = { applied: a, views, drawer: s39DrawerRec() };
  }
  return {
    source: "accent-midband-sweep", mode: "light",
    viewport: { width: 768, height: 1024 },
    chrome: { sidebarVisible: false, hamburgerVisible: true },
    accents, findings: [] as unknown[],
  };
}

describe("classifyAudit accent-midband-sweep (S39 — the accent × mid-band drawer-navigation sweep)", () => {
  it("the GREEN shape: 7 accents × 20 views navigated through the drawer at 768×1024 + the drawer per accent → green with the swept counts", () => {
    const v = classifyAudit("accent-midband-sweep", s39Envelope());
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/140 view renderings/);
    expect(v.note).toMatch(/140 active-tint readings/);
    expect(v.note).toMatch(/7 drawer records/);
    expect(v.note).toMatch(/768×1024/);
  });

  it("the ALL-VIEWS guard: an accent map missing ONE view reads shape-error — a view that silently did not run must never read green-by-omission", () => {
    const env = s39Envelope() as { accents: Record<string, { views: Record<string, unknown> }> };
    delete env.accents.violet.views.Notes;
    const v = classifyAudit("accent-midband-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the ALL-ACCENTS guard: the accents map missing ONE accent reads shape-error", () => {
    const env = s39Envelope() as { accents: Record<string, unknown> };
    delete env.accents.red;
    const v = classifyAudit("accent-midband-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the historical S34-shape envelope (a violet-only midband sweep — the exact pre-S39 state) reads shape-error, never green-by-resemblance", () => {
    // The S34 midband-sweep envelope: a flat views map (no accents), mode light.
    const s34Shape = {
      source: "midband-sweep", mode: "light", viewport: { width: 768, height: 1024 },
      chrome: { sidebarVisible: false, hamburgerVisible: true },
      views: Object.fromEntries(S39_VIEWS.map((v) => [v, { heading: "ok", scrollWidth: 768, drawerClosed: true, appBar: true, consoleErrors: [] }])),
      drawer: { linkCount: 20, order: S39_VIEWS.join(",") },
      findings: [],
    };
    const v = classifyAudit("accent-midband-sweep", s34Shape);
    expect(isErr(v)).toBe(true);
  });

  it("the missing drawer record reads shape-error (the drawer is part of the per-accent contract)", () => {
    const env = s39Envelope() as { accents: Record<string, Record<string, unknown>> };
    delete (env.accents.pink as Record<string, unknown>).drawer;
    const v = classifyAudit("accent-midband-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("mode is part of the contract: an envelope without mode reads shape-error", () => {
    const env = s39Envelope() as Record<string, unknown>;
    delete env.mode;
    const v = classifyAudit("accent-midband-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the viewport guard: the 390×844 mobile envelope fed here reads shape-error, never a silent re-scope (the mobile accent family belongs to accent-light-sweep)", () => {
    const v = classifyAudit("accent-midband-sweep", { ...s39Envelope(), viewport: { width: 390, height: 844 } });
    expect(isErr(v)).toBe(true);
  });

  it("the mode rot guard: mode=dark reads NON-green (the dark × mid-band combos are the documented S36 non-gap family — this audit owns the LIGHT mid-band accent surface)", () => {
    const v = classifyAudit("accent-midband-sweep", { ...s39Envelope(), mode: "dark" });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=dark/);
  });

  it("the applied-mismatch family: an accent whose self-verified reading differs from its key is a finding", () => {
    const env = s39Envelope() as { accents: Record<string, Record<string, unknown>> };
    (env.accents.teal as Record<string, unknown>).applied = "violet";
    const v = classifyAudit("accent-midband-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the vehicle-contract family: a visible desktop sidebar at 768 is the finding class (the lg contract broke — the drawer is the only vehicle below 1024)", () => {
    const v = classifyAudit("accent-midband-sweep", { ...s39Envelope(), chrome: { sidebarVisible: true, hamburgerVisible: true } });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/vehicle/i);
  });

  it("the tint-rot family: an activeTint that computed to none is a FINDING (the S8 no-var rot class — the NAV_ACTIVE_GRADIENT_STOPS pair did not resolve)", () => {
    const v = classifyAudit("accent-midband-sweep", s39Envelope({ green: { Notes: { activeTint: "none" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/active-link gradient/);
  });

  it("the interaction family: an activeLabel that does not equal the view's own label is a FINDING (the active state did not follow the navigation)", () => {
    const v = classifyAudit("accent-midband-sweep", s39Envelope({ blue: { Notes: { activeLabel: "Dashboard" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/did not follow the navigation/);
  });

  it("the overflow family: scrollWidth > 768 is a finding (the S16/S34 overflow class — the Timetable canvas must live inside its container)", () => {
    const v = classifyAudit("accent-midband-sweep", s39Envelope({ orange: { Timetable: { scrollWidth: 800 } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the strict record shape: a view record missing lowcontrast reads shape-error", () => {
    const env = s39Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.red.views.Tasks.lowcontrast;
    const v = classifyAudit("accent-midband-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the strict record shape: a view record missing activeTint reads shape-error (the interaction evidence is part of the record)", () => {
    const env = s39Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.violet.views.Files.activeTint;
    const v = classifyAudit("accent-midband-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the drawer-error family: a drawer that failed to open is a FINDING (never a swallow)", () => {
    const env = s39Envelope() as { accents: Record<string, { drawer: Record<string, unknown> }> };
    env.accents.blue.drawer = { linkCount: 0, unreadable: [], lowcontrast: [], activeView: null, activeTint: null, error: "TimeoutError: locator.click: Timeout 10000ms" };
    const v = classifyAudit("accent-midband-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the counting semantics: a non-exempt unreadable entry with an EMPTY findings array still reads NON-green (the independent counting doctrine)", () => {
    const env = s39Envelope({ teal: { Analytics: { unreadable: [
      { text: "streak", color: "rgb(148, 163, 184)", contrast: 1.9 },
    ] } } });
    const v = classifyAudit("accent-midband-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the CTA-face exemption is SIGNATURE-STRICT: white-on-accent rides the note; a white text NOT on the CTA face still counts", () => {
    const exempt = classifyAudit("accent-midband-sweep", s39Envelope({ violet: { Calendar: { unreadable: [
      { text: "Calendar", color: "rgb(255, 255, 255)", contrast: 2.1 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/1 CTA-face exempt/);
    // signature-strictness negative: the exemption matches the COLOR, not the
    // mere presence of white — but any OTHER unreadable color still counts.
    const other = classifyAudit("accent-midband-sweep", s39Envelope({ violet: { Calendar: { unreadable: [
      { text: "27", color: "rgb(100, 116, 139)", contrast: 1.8 },
    ] } } }));
    expect(other.green).toBe(false);
    expect(other.findings).toBe(1);
  });

  it("the calendar adjacent-day exemption (slate-300 1-2-digit) and the yellow-pill exemption ({high,medium,low}) ride the note — but a slate-300 PARAGRAPH or yellow-500 heading still counts", () => {
    const exempt = classifyAudit("accent-midband-sweep", s39Envelope({ pink: { Calendar: { unreadable: [
      { text: "27", color: "rgb(203, 213, 225)", contrast: 1.6 },
      { text: "30", color: "rgb(203, 213, 225)", contrast: 1.7 },
    ], lowcontrast: [] }, "My Day": { unreadable: [
      { text: "high", color: "rgb(234, 179, 8)", contrast: 2.0 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/2 calendar adjacent-day exempt/);
    expect(exempt.note).toMatch(/1 yellow-pill exempt/);
    const strict1 = classifyAudit("accent-midband-sweep", s39Envelope({ pink: { Calendar: { unreadable: [
      { text: "September 2026", color: "rgb(203, 213, 225)", contrast: 1.6 },
    ] } } }));
    expect(strict1.green).toBe(false);
    const strict2 = classifyAudit("accent-midband-sweep", s39Envelope({ pink: { Exams: { unreadable: [
      { text: "Biology Midterm", color: "rgb(234, 179, 8)", contrast: 2.0 },
    ] } } }));
    expect(strict2.green).toBe(false);
  });

  it("the lowcontrast WARN family rides the note, never the findings (the S11 non-gap family)", () => {
    const env = s39Envelope({ green: { Assignments: { lowcontrast: [
      { text: "essay", color: "rgb(217, 119, 6)", contrast: 3.07 },
    ] } } });
    const v = classifyAudit("accent-midband-sweep", env);
    expect(v.green).toBe(true);
    expect(v.note).toMatch(/1 WARN/);
  });

  it("the unknown-audit guard still holds: a misspelled name is a shape-error even with a perfect envelope", () => {
    const v = classifyAudit("accent-midband-swep", s39Envelope());
    expect(isErr(v)).toBe(true);
  });
});

// --- accent-landscape-sweep (S40 — the accent × landscape drawer-navigation sweep)

// The full-shape generator: 7 accents × 20 views navigated through the
// drawer at 844×390 (the iPhone-class landscape) in LIGHT mode + the drawer
// record per accent, with the per-view interaction keys (activeTint — the
// inner span's accent gradient while THIS view was active; activeLabel —
// the drawer's aria-current link when read, MUST equal the view's own
// label) AND the landscape-own headingClearance key (the fixed-bar
// clearance — the h-16 bar covers 16% of a 390px viewport).
const S40_ACCENTS = ["violet", "blue", "green", "orange", "pink", "red", "teal"] as const;
// The 20 canonical views by DISPLAY labels — the drawer links' accessible
// names, the S34/S35/S39 vehicle-family envelope convention; the
// per-view activeLabel reading is the same label.
const S40_VIEWS = [
  "Dashboard", "My Day", "Tasks", "Calendar", "Events", "Timetable",
  "Assignments", "Exams", "Notes", "Flashcards", "Practice Tests",
  "Study Groups", "Grade Tracker", "Analytics", "Files", "Calculator",
  "Math Solver", "AI Assistant", "Focus Timer", "Settings",
];
const S40_TINT = "linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))";

type S40Rec = Record<string, unknown>;

function s40ViewRec(o: S40Rec = {}): S40Rec {
  return {
    heading: "ok", scrollWidth: 844, drawerClosed: true, appBar: true, headingClearance: true,
    unreadable: [] as unknown[], lowcontrast: [] as unknown[], consoleErrors: [] as unknown[],
    activeTint: S40_TINT, activeLabel: "",
    ...o,
  };
}
function s40DrawerRec(o: S40Rec = {}): S40Rec {
  return { linkCount: 20, unreadable: [] as unknown[], lowcontrast: [] as unknown[], activeView: "Settings", activeTint: S40_TINT, ...o };
}

/** The full accent-landscape envelope: 7 accents × 20 views + the drawer
 *  per accent at 844×390, with per-view overrides merged in (the
 *  activeLabel defaults are filled to the view's own label — the
 *  interaction contract). */
function s40Envelope(viewOverrides: Record<string, Record<string, S40Rec>> = {}): S40Rec {
  const accents: S40Rec = {};
  for (const a of S40_ACCENTS) {
    const views: S40Rec = {};
    for (const v of S40_VIEWS) {
      const base = s40ViewRec(viewOverrides[a]?.[v]);
      if (base.activeLabel === "") base.activeLabel = v; // the interaction contract default
      views[v] = base;
    }
    accents[a] = { applied: a, views, drawer: s40DrawerRec() };
  }
  return {
    source: "accent-landscape-sweep", mode: "light",
    viewport: { width: 844, height: 390 },
    chrome: { sidebarVisible: false, hamburgerVisible: true, drawerNavScrollable: true },
    accents, findings: [] as unknown[],
  };
}

describe("classifyAudit accent-landscape-sweep (S40 — the accent × landscape drawer-navigation sweep)", () => {
  it("the GREEN shape: 7 accents × 20 views navigated through the drawer at 844×390 + the drawer per accent → green with the swept counts", () => {
    const v = classifyAudit("accent-landscape-sweep", s40Envelope());
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/140 view renderings/);
    expect(v.note).toMatch(/140 active-tint readings/);
    expect(v.note).toMatch(/7 drawer records/);
    expect(v.note).toMatch(/844×390/);
  });

  it("the ALL-VIEWS guard: an accent map missing ONE view reads shape-error — a view that silently did not run must never read green-by-omission", () => {
    const env = s40Envelope() as { accents: Record<string, { views: Record<string, unknown> }> };
    delete env.accents.violet.views.Notes;
    const v = classifyAudit("accent-landscape-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the ALL-ACCENTS guard: the accents map missing ONE accent reads shape-error", () => {
    const env = s40Envelope() as { accents: Record<string, unknown> };
    delete env.accents.red;
    const v = classifyAudit("accent-landscape-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the historical S35-shape envelope (a violet-only landscape sweep — the exact pre-S40 state) reads shape-error, never green-by-resemblance", () => {
    // The S35 landscape-sweep envelope: a flat views map (no accents), mode
    // light, the chrome with drawerNavScrollable.
    const s35Shape = {
      source: "landscape-sweep", mode: "light", viewport: { width: 844, height: 390 },
      chrome: { sidebarVisible: false, hamburgerVisible: true, drawerNavScrollable: true },
      views: Object.fromEntries(S40_VIEWS.map((v) => [v, { heading: "ok", scrollWidth: 844, drawerClosed: true, appBar: true, headingClearance: true, consoleErrors: [] }])),
      drawer: { linkCount: 20, order: S40_VIEWS.join(",") },
      findings: [],
    };
    const v = classifyAudit("accent-landscape-sweep", s35Shape);
    expect(isErr(v)).toBe(true);
  });

  it("the missing drawer record reads shape-error (the drawer is part of the per-accent contract)", () => {
    const env = s40Envelope() as { accents: Record<string, Record<string, unknown>> };
    delete (env.accents.pink as Record<string, unknown>).drawer;
    const v = classifyAudit("accent-landscape-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("mode is part of the contract: an envelope without mode reads shape-error", () => {
    const env = s40Envelope() as Record<string, unknown>;
    delete env.mode;
    const v = classifyAudit("accent-landscape-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the viewport guard: the 390×844 mobile envelope AND the 768×1024 mid-band envelope fed here read shape-error, never a silent re-scope (the sibling families own those surfaces)", () => {
    const mobile = classifyAudit("accent-landscape-sweep", { ...s40Envelope(), viewport: { width: 390, height: 844 } });
    expect(isErr(mobile)).toBe(true);
    const midband = classifyAudit("accent-landscape-sweep", { ...s40Envelope(), viewport: { width: 768, height: 1024 } });
    expect(isErr(midband)).toBe(true);
  });

  it("the mode rot guard: mode=dark reads NON-green (the dark × landscape combos are the documented S36 non-gap family — this audit owns the LIGHT landscape accent surface)", () => {
    const v = classifyAudit("accent-landscape-sweep", { ...s40Envelope(), mode: "dark" });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=dark/);
  });

  it("the applied-mismatch family: an accent whose self-verified reading differs from its key is a finding", () => {
    const env = s40Envelope() as { accents: Record<string, Record<string, unknown>> };
    (env.accents.teal as Record<string, unknown>).applied = "violet";
    const v = classifyAudit("accent-landscape-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the vehicle-contract family: a visible desktop sidebar at 844 is the finding class (the lg contract broke — the drawer is the only vehicle below 1024)", () => {
    const v = classifyAudit("accent-landscape-sweep", { ...s40Envelope(), chrome: { sidebarVisible: true, hamburgerVisible: true, drawerNavScrollable: true } });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/vehicle/i);
  });

  it("the short-viewport-contract family: drawerNavScrollable=false is the S35-own finding class (links 8–20 would be unreachable at 390 height)", () => {
    const v = classifyAudit("accent-landscape-sweep", { ...s40Envelope(), chrome: { sidebarVisible: false, hamburgerVisible: true, drawerNavScrollable: false } });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/nav-scroll|short-viewport/i);
  });

  it("the tint-rot family: an activeTint that computed to none is a FINDING (the S8 no-var rot class — the NAV_ACTIVE_GRADIENT_STOPS pair did not resolve)", () => {
    const v = classifyAudit("accent-landscape-sweep", s40Envelope({ green: { Notes: { activeTint: "none" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/active-link gradient/);
  });

  it("the interaction family: an activeLabel that does not equal the view's own label is a FINDING (the active state did not follow the navigation)", () => {
    const v = classifyAudit("accent-landscape-sweep", s40Envelope({ blue: { Notes: { activeLabel: "Dashboard" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/did not follow the navigation/);
  });

  it("the overflow family: scrollWidth > 844 is a finding (the S16/S34 overflow class — the Timetable canvas must live inside its container)", () => {
    const v = classifyAudit("accent-landscape-sweep", s40Envelope({ orange: { Timetable: { scrollWidth: 900 } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the strict record shape: a view record missing lowcontrast reads shape-error", () => {
    const env = s40Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.red.views.Tasks.lowcontrast;
    const v = classifyAudit("accent-landscape-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the strict record shape: a view record missing activeTint reads shape-error (the interaction evidence is part of the record)", () => {
    const env = s40Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.violet.views.Files.activeTint;
    const v = classifyAudit("accent-landscape-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the strict record shape: a view record missing headingClearance reads shape-error (the landscape-own clearance is part of the record)", () => {
    const env = s40Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.green.views.Calendar.headingClearance;
    const v = classifyAudit("accent-landscape-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the drawer-error family: a drawer that failed to open is a FINDING (never a swallow)", () => {
    const env = s40Envelope() as { accents: Record<string, { drawer: Record<string, unknown> }> };
    env.accents.blue.drawer = { linkCount: 0, unreadable: [], lowcontrast: [], activeView: null, activeTint: null, error: "TimeoutError: locator.click: Timeout 10000ms" };
    const v = classifyAudit("accent-landscape-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the counting semantics: a non-exempt unreadable entry with an EMPTY findings array still reads NON-green (the independent counting doctrine)", () => {
    const env = s40Envelope({ teal: { Analytics: { unreadable: [
      { text: "streak", color: "rgb(148, 163, 184)", contrast: 1.9 },
    ] } } });
    const v = classifyAudit("accent-landscape-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the CTA-face exemption is SIGNATURE-STRICT: white-on-accent rides the note; a non-white unreadable text still counts", () => {
    const exempt = classifyAudit("accent-landscape-sweep", s40Envelope({ violet: { Calendar: { unreadable: [
      { text: "Calendar", color: "rgb(255, 255, 255)", contrast: 2.1 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/1 CTA-face exempt/);
    const other = classifyAudit("accent-landscape-sweep", s40Envelope({ violet: { Calendar: { unreadable: [
      { text: "27", color: "rgb(100, 116, 139)", contrast: 1.8 },
    ] } } }));
    expect(other.green).toBe(false);
    expect(other.findings).toBe(1);
  });

  it("the calendar adjacent-day exemption (slate-300 1-2-digit) and the yellow-pill exemption ({high,medium,low}) ride the note — but a slate-300 PARAGRAPH or yellow-500 heading still counts", () => {
    const exempt = classifyAudit("accent-landscape-sweep", s40Envelope({ pink: { Calendar: { unreadable: [
      { text: "27", color: "rgb(203, 213, 225)", contrast: 1.6 },
      { text: "30", color: "rgb(203, 213, 225)", contrast: 1.7 },
    ], lowcontrast: [] }, "My Day": { unreadable: [
      { text: "high", color: "rgb(234, 179, 8)", contrast: 2.0 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/2 calendar adjacent-day exempt/);
    expect(exempt.note).toMatch(/1 yellow-pill exempt/);
    const strict1 = classifyAudit("accent-landscape-sweep", s40Envelope({ pink: { Calendar: { unreadable: [
      { text: "September 2026", color: "rgb(203, 213, 225)", contrast: 1.6 },
    ] } } }));
    expect(strict1.green).toBe(false);
    const strict2 = classifyAudit("accent-landscape-sweep", s40Envelope({ pink: { Exams: { unreadable: [
      { text: "Biology Midterm", color: "rgb(234, 179, 8)", contrast: 2.0 },
    ] } } }));
    expect(strict2.green).toBe(false);
  });

  it("the lowcontrast WARN family rides the note, never the findings (the S11 non-gap family)", () => {
    const env = s40Envelope({ green: { Assignments: { lowcontrast: [
      { text: "essay", color: "rgb(217, 119, 6)", contrast: 3.07 },
    ] } } });
    const v = classifyAudit("accent-landscape-sweep", env);
    expect(v.green).toBe(true);
    expect(v.note).toMatch(/1 WARN/);
  });

  it("the unknown-audit guard still holds: a misspelled name is a shape-error even with a perfect envelope", () => {
    const v = classifyAudit("accent-landscape-swep", s40Envelope());
    expect(isErr(v)).toBe(true);
  });
});

// --- accent-desktop-sweep (S41 — the desktop light-accent sidebar-navigation sweep)

// The full-shape generator: 7 accents × 20 views navigated through the
// SIDEBAR (the desktop vehicle) at 1280×800 in LIGHT mode + the sidebar
// record per accent, with the per-view interaction keys (activeTint — the
// inner span's accent gradient while THIS view was active; activeLabel —
// the sidebar's aria-current link when read, MUST equal the view's own
// label) AND the desktop-own keys (headingOffset — the content clears the
// fixed 260px sidebar; sidebarVisible — the vehicle persists through
// navigation).
const S41_ACCENTS = ["violet", "blue", "green", "orange", "pink", "red", "teal"] as const;
// The 20 canonical views by DISPLAY labels — the sidebar links' accessible
// names, the S34/S39/S40 vehicle-family envelope convention; the
// per-view activeLabel reading is the same label.
const S41_VIEWS = [
  "Dashboard", "My Day", "Tasks", "Calendar", "Events", "Timetable",
  "Assignments", "Exams", "Notes", "Flashcards", "Practice Tests",
  "Study Groups", "Grade Tracker", "Analytics", "Files", "Calculator",
  "Math Solver", "AI Assistant", "Focus Timer", "Settings",
];
const S41_TINT = "linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))";

type S41Rec = Record<string, unknown>;

function s41ViewRec(o: S41Rec = {}): S41Rec {
  return {
    heading: "ok", scrollWidth: 1280, sidebarVisible: true, headingOffset: true,
    unreadable: [] as unknown[], lowcontrast: [] as unknown[], consoleErrors: [] as unknown[],
    activeTint: S41_TINT, activeLabel: "",
    ...o,
  };
}
function s41SidebarRec(o: S41Rec = {}): S41Rec {
  return { linkCount: 20, unreadable: [] as unknown[], lowcontrast: [] as unknown[], activeView: "Settings", activeTint: S41_TINT, ...o };
}

/** The full accent-desktop envelope: 7 accents × 20 views + the sidebar
 *  per accent at 1280×800, with per-view overrides merged in (the
 *  activeLabel defaults are filled to the view's own label — the
 *  interaction contract). */
function s41Envelope(viewOverrides: Record<string, Record<string, S41Rec>> = {}): S41Rec {
  const accents: S41Rec = {};
  for (const a of S41_ACCENTS) {
    const views: S41Rec = {};
    for (const v of S41_VIEWS) {
      const base = s41ViewRec(viewOverrides[a]?.[v]);
      if (base.activeLabel === "") base.activeLabel = v; // the interaction contract default
      views[v] = base;
    }
    accents[a] = { applied: a, views, sidebar: s41SidebarRec() };
  }
  return {
    source: "accent-desktop-sweep", mode: "light",
    viewport: { width: 1280, height: 800 },
    chrome: { sidebarVisible: true, hamburgerVisible: false, sidebarNavScrollable: true },
    accents, findings: [] as unknown[],
  };
}

describe("classifyAudit accent-desktop-sweep (S41 — the desktop light-accent sidebar-navigation sweep)", () => {
  it("the GREEN shape: 7 accents × 20 views navigated through the sidebar at 1280×800 + the sidebar per accent → green with the swept counts", () => {
    const v = classifyAudit("accent-desktop-sweep", s41Envelope());
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/140 view renderings/);
    expect(v.note).toMatch(/140 active-tint readings/);
    expect(v.note).toMatch(/7 sidebar records/);
    expect(v.note).toMatch(/1280×800/);
  });

  it("the ALL-VIEWS guard: an accent map missing ONE view reads shape-error — a view that silently did not run must never read green-by-omission", () => {
    const env = s41Envelope() as { accents: Record<string, { views: Record<string, unknown> }> };
    delete env.accents.violet.views.Notes;
    const v = classifyAudit("accent-desktop-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the ALL-ACCENTS guard: the accents map missing ONE accent reads shape-error", () => {
    const env = s41Envelope() as { accents: Record<string, unknown> };
    delete env.accents.red;
    const v = classifyAudit("accent-desktop-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the historical S38-shape envelope (an accent-dark desktop pass — the exact pre-S41 state: flat desktop/mobile maps, no per-view interaction keys) reads shape-error, never green-by-resemblance", () => {
    const s38Shape = {
      source: "accent-dark-sweep", mode: "dark", mobileViewport: { width: 390, height: 844 },
      applied: Object.fromEntries(S41_ACCENTS.map((a) => [a, a])),
      desktop: Object.fromEntries(S41_ACCENTS.map((a) => [a, Object.fromEntries(S41_VIEWS.map((v) => [v, { heading: "ok", unreadable: [], lowcontrast: [], flashbulbs: [] }]))])),
      mobile: {},
      findings: [],
    };
    const v = classifyAudit("accent-desktop-sweep", s38Shape);
    expect(isErr(v)).toBe(true);
  });

  it("the missing sidebar record reads shape-error (the sidebar is part of the per-accent contract)", () => {
    const env = s41Envelope() as { accents: Record<string, Record<string, unknown>> };
    delete (env.accents.pink as Record<string, unknown>).sidebar;
    const v = classifyAudit("accent-desktop-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("mode is part of the contract: an envelope without mode reads shape-error", () => {
    const env = s41Envelope() as Record<string, unknown>;
    delete env.mode;
    const v = classifyAudit("accent-desktop-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the viewport guard: the 390×844 mobile, 768×1024 mid-band, AND 844×390 landscape envelopes fed here read shape-error, never a silent re-scope (the sibling families own those surfaces)", () => {
    const mobile = classifyAudit("accent-desktop-sweep", { ...s41Envelope(), viewport: { width: 390, height: 844 } });
    expect(isErr(mobile)).toBe(true);
    const midband = classifyAudit("accent-desktop-sweep", { ...s41Envelope(), viewport: { width: 768, height: 1024 } });
    expect(isErr(midband)).toBe(true);
    const landscape = classifyAudit("accent-desktop-sweep", { ...s41Envelope(), viewport: { width: 844, height: 390 } });
    expect(isErr(landscape)).toBe(true);
  });

  it("the mode rot guard: mode=dark reads NON-green (the desktop DARK accent family belongs to accent-dark-sweep — this audit owns the desktop LIGHT accent surface)", () => {
    const v = classifyAudit("accent-desktop-sweep", { ...s41Envelope(), mode: "dark" });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=dark/);
  });

  it("the applied-mismatch family: an accent whose self-verified reading differs from its key is a finding", () => {
    const env = s41Envelope() as { accents: Record<string, Record<string, unknown>> };
    (env.accents.teal as Record<string, unknown>).applied = "violet";
    const v = classifyAudit("accent-desktop-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the INVERTED vehicle-contract family: a hidden sidebar at 1280 is the finding class (the lg contract broke — the sidebar is the desktop vehicle), and a visible hamburger is the same class (the app bar is lg:hidden)", () => {
    const hidden = classifyAudit("accent-desktop-sweep", { ...s41Envelope(), chrome: { sidebarVisible: false, hamburgerVisible: false, sidebarNavScrollable: true } });
    expect(hidden.green).toBe(false);
    expect(hidden.note).toMatch(/vehicle/i);
    const burger = classifyAudit("accent-desktop-sweep", { ...s41Envelope(), chrome: { sidebarVisible: true, hamburgerVisible: true, sidebarNavScrollable: true } });
    expect(burger.green).toBe(false);
    expect(burger.note).toMatch(/vehicle/i);
  });

  it("the scroll-contract family: sidebarNavScrollable=false is the S41-own finding class (links ~13–20 would be unreachable at 800 height — the nav's scroll is the only path below the fold)", () => {
    const v = classifyAudit("accent-desktop-sweep", { ...s41Envelope(), chrome: { sidebarVisible: true, hamburgerVisible: false, sidebarNavScrollable: false } });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/sidebarNavScrollable|scroll/i);
  });

  it("the tint-rot family: an activeTint that computed to none is a FINDING (the S8 no-var rot class — the NAV_ACTIVE_GRADIENT_STOPS pair did not resolve)", () => {
    const v = classifyAudit("accent-desktop-sweep", s41Envelope({ green: { Notes: { activeTint: "none" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/active-link gradient/);
  });

  it("the interaction family: an activeLabel that does not equal the view's own label is a FINDING (the active state did not follow the navigation)", () => {
    const v = classifyAudit("accent-desktop-sweep", s41Envelope({ blue: { Notes: { activeLabel: "Dashboard" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/did not follow the navigation/);
  });

  it("the overflow family: scrollWidth > 1280 is a finding (the S16/S34 overflow class — the Timetable canvas must live inside its container)", () => {
    const v = classifyAudit("accent-desktop-sweep", s41Envelope({ orange: { Timetable: { scrollWidth: 1400 } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the strict record shape: a view record missing lowcontrast reads shape-error", () => {
    const env = s41Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.red.views.Tasks.lowcontrast;
    const v = classifyAudit("accent-desktop-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the strict record shape: a view record missing activeTint reads shape-error (the interaction evidence is part of the record)", () => {
    const env = s41Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.violet.views.Files.activeTint;
    const v = classifyAudit("accent-desktop-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the strict record shape: a view record missing headingOffset reads shape-error (the desktop clearance is part of the record)", () => {
    const env = s41Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.green.views.Calendar.headingOffset;
    const v = classifyAudit("accent-desktop-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the strict record shape: a view record missing sidebarVisible reads shape-error (the vehicle-persistence evidence is part of the record)", () => {
    const env = s41Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.blue.views.Exams.sidebarVisible;
    const v = classifyAudit("accent-desktop-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the sidebar-error family: a sidebar record carrying an error is a FINDING (never a swallow)", () => {
    const env = s41Envelope() as { accents: Record<string, { sidebar: Record<string, unknown> }> };
    env.accents.blue.sidebar = { linkCount: 0, unreadable: [], lowcontrast: [], activeView: null, activeTint: null, error: "TypeError: Cannot read properties of null" };
    const v = classifyAudit("accent-desktop-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the counting semantics: a non-exempt unreadable entry with an EMPTY findings array still reads NON-green (the independent counting doctrine)", () => {
    const env = s41Envelope({ teal: { Analytics: { unreadable: [
      { text: "streak", color: "rgb(148, 163, 184)", contrast: 1.9 },
    ] } } });
    const v = classifyAudit("accent-desktop-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the CTA-face exemption is SIGNATURE-STRICT: white-on-accent rides the note; a non-white unreadable text still counts", () => {
    const exempt = classifyAudit("accent-desktop-sweep", s41Envelope({ violet: { Calendar: { unreadable: [
      { text: "Calendar", color: "rgb(255, 255, 255)", contrast: 2.1 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/1 CTA-face exempt/);
    const other = classifyAudit("accent-desktop-sweep", s41Envelope({ violet: { Calendar: { unreadable: [
      { text: "27", color: "rgb(100, 116, 139)", contrast: 1.8 },
    ] } } }));
    expect(other.green).toBe(false);
    expect(other.findings).toBe(1);
  });

  it("the calendar adjacent-day exemption (slate-300 1-2-digit) and the yellow-pill exemption ({high,medium,low}) ride the note — but a slate-300 PARAGRAPH or yellow-500 heading still counts", () => {
    const exempt = classifyAudit("accent-desktop-sweep", s41Envelope({ pink: { Calendar: { unreadable: [
      { text: "27", color: "rgb(203, 213, 225)", contrast: 1.6 },
      { text: "30", color: "rgb(203, 213, 225)", contrast: 1.7 },
    ], lowcontrast: [] }, "My Day": { unreadable: [
      { text: "high", color: "rgb(234, 179, 8)", contrast: 2.0 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/2 calendar adjacent-day exempt/);
    expect(exempt.note).toMatch(/1 yellow-pill exempt/);
    const strict1 = classifyAudit("accent-desktop-sweep", s41Envelope({ pink: { Calendar: { unreadable: [
      { text: "September 2026", color: "rgb(203, 213, 225)", contrast: 1.6 },
    ] } } }));
    expect(strict1.green).toBe(false);
    const strict2 = classifyAudit("accent-desktop-sweep", s41Envelope({ pink: { Exams: { unreadable: [
      { text: "Biology Midterm", color: "rgb(234, 179, 8)", contrast: 2.0 },
    ] } } }));
    expect(strict2.green).toBe(false);
  });

  it("the lowcontrast WARN family rides the note, never the findings (the S11 non-gap family)", () => {
    const env = s41Envelope({ green: { Assignments: { lowcontrast: [
      { text: "essay", color: "rgb(217, 119, 6)", contrast: 3.07 },
    ] } } });
    const v = classifyAudit("accent-desktop-sweep", env);
    expect(v.green).toBe(true);
    expect(v.note).toMatch(/1 WARN/);
  });

  it("the unknown-audit guard still holds: a misspelled name is a shape-error even with a perfect envelope", () => {
    const v = classifyAudit("accent-desktop-swep", s41Envelope());
    expect(isErr(v)).toBe(true);
  });
});

// --- accent-volume-sweep (S42 — the data-volume × dark × accent stress)

// The full-shape generator: 7 accents × the 7 volume-affected views
// navigated through the SIDEBAR (the desktop vehicle) at 1280×800 in DARK
// mode under the S13 volume profile (300 tasks / 200 notes / 250 events),
// with the per-view interaction keys (activeTint/activeLabel — the FIRST
// dark-mode readings of the sidebar's active-link tint through the
// navigation lifecycle) AND the volume keys (nodes/mainNodes/
// longTaskTotal/clickLatencyMs — the S13 measurement family) AND the S38
// dark detector family (flashbulbs/unreadable/lowcontrast).
const S42_ACCENTS = ["violet", "blue", "green", "orange", "pink", "red", "teal"] as const;
// The 7 volume-affected views by DISPLAY labels — the S13 data-volume
// audit's own view set (the views that render task/note/event rows; the
// other 13 are volume-invariant and stay covered by the S38/S41 seed
// sweeps).
const S42_VIEWS = ["Dashboard", "My Day", "Tasks", "Calendar", "Events", "Notes", "Analytics"];
const S42_TINT = "linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))";

type S42Rec = Record<string, unknown>;

function s42ViewRec(o: S42Rec = {}): S42Rec {
  return {
    heading: "ok", scrollWidth: 1280, sidebarVisible: true, headingOffset: true,
    flashbulbs: [] as unknown[], unreadable: [] as unknown[], lowcontrast: [] as unknown[],
    consoleErrors: [] as unknown[],
    activeTint: S42_TINT, activeLabel: "",
    nodes: 4200, mainNodes: 3100, longTaskTotal: 420, clickLatencyMs: 610,
    ...o,
  };
}
function s42SidebarRec(o: S42Rec = {}): S42Rec {
  return { linkCount: 20, unreadable: [] as unknown[], lowcontrast: [] as unknown[], activeView: "Analytics", activeTint: S42_TINT, ...o };
}

/** The full accent-volume envelope: 7 accents × 7 views + the sidebar per
 *  accent at 1280×800 dark under the S13 volume profile, with per-view
 *  overrides merged in (the activeLabel defaults are filled to the view's
 *  own label — the interaction contract). */
function s42Envelope(viewOverrides: Record<string, Record<string, S42Rec>> = {}): S42Rec {
  const accents: S42Rec = {};
  for (const a of S42_ACCENTS) {
    const views: S42Rec = {};
    for (const v of S42_VIEWS) {
      const base = s42ViewRec(viewOverrides[a]?.[v]);
      if (base.activeLabel === "") base.activeLabel = v; // the interaction contract default
      views[v] = base;
    }
    accents[a] = { applied: a, views, sidebar: s42SidebarRec() };
  }
  return {
    source: "accent-volume-sweep", mode: "dark",
    viewport: { width: 1280, height: 800 },
    volume: { tasks: 300, notes: 200, events: 250 },
    chrome: { sidebarVisible: true, hamburgerVisible: false, sidebarNavScrollable: true },
    api: {
      "/api/tasks": { ms: 140, bytes: 190_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    },
    accents, findings: [] as unknown[],
  };
}

describe("classifyAudit accent-volume-sweep (S42 — the data-volume × dark × accent stress)", () => {
  it("the GREEN shape: 7 accents × 7 volume views navigated through the sidebar at 1280×800 dark under the 300/200/250 profile → green with the swept counts", () => {
    const v = classifyAudit("accent-volume-sweep", s42Envelope());
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/49 view renderings/);
    expect(v.note).toMatch(/49 active-tint readings/);
    expect(v.note).toMatch(/7 sidebar records/);
    expect(v.note).toMatch(/1280×800/);
    expect(v.note).toMatch(/300\/200\/250/);
  });

  it("the ALL-VIEWS guard: an accent map missing ONE volume view reads shape-error — a view that silently did not run must never read green-by-omission", () => {
    const env = s42Envelope() as { accents: Record<string, { views: Record<string, unknown> }> };
    delete env.accents.violet.views.Tasks;
    const v = classifyAudit("accent-volume-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the ALL-ACCENTS guard: the accents map missing ONE accent reads shape-error", () => {
    const env = s42Envelope() as { accents: Record<string, unknown> };
    delete env.accents.red;
    const v = classifyAudit("accent-volume-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the historical S13-shape envelope (the data-volume audit's own flat findings/nonGaps shape — the exact pre-S42 state) reads shape-error, never green-by-resemblance", () => {
    const s13Shape = {
      source: "data-volume-audit", findings: [], nonGaps: [{ surface: "Tasks render", longTaskTotal: 400 }],
      inserted: { tasks: 300, notes: 200, events: 250 },
    };
    const v = classifyAudit("accent-volume-sweep", s13Shape);
    expect(isErr(v)).toBe(true);
  });

  it("the volume contract is part of the shape: an envelope without volume reads shape-error", () => {
    const env = s42Envelope() as Record<string, unknown>;
    delete env.volume;
    const v = classifyAudit("accent-volume-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the missing sidebar record reads shape-error (the sidebar is part of the per-accent contract)", () => {
    const env = s42Envelope() as { accents: Record<string, Record<string, unknown>> };
    delete (env.accents.pink as Record<string, unknown>).sidebar;
    const v = classifyAudit("accent-volume-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("mode is part of the contract: an envelope without mode reads shape-error", () => {
    const env = s42Envelope() as Record<string, unknown>;
    delete env.mode;
    const v = classifyAudit("accent-volume-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the viewport guard: the 390×844 mobile, 768×1024 mid-band, AND 844×390 landscape envelopes fed here read shape-error, never a silent re-scope (the sibling families own those surfaces)", () => {
    const mobile = classifyAudit("accent-volume-sweep", { ...s42Envelope(), viewport: { width: 390, height: 844 } });
    expect(isErr(mobile)).toBe(true);
    const midband = classifyAudit("accent-volume-sweep", { ...s42Envelope(), viewport: { width: 768, height: 1024 } });
    expect(isErr(midband)).toBe(true);
    const landscape = classifyAudit("accent-volume-sweep", { ...s42Envelope(), viewport: { width: 844, height: 390 } });
    expect(isErr(landscape)).toBe(true);
  });

  it("the mode rot guard: mode=light reads NON-green (the volume × LIGHT family is the documented bracketed non-gap — this audit owns the volume × DARK × accent surface)", () => {
    const v = classifyAudit("accent-volume-sweep", { ...s42Envelope(), mode: "light" });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=light/);
  });

  it("the volume rot guard: a seed-volume envelope (tasks 0) reads NON-green — the sweep measured the wrong density and must never read green (the S38 omission-means-clean retirement, applied to the volume axis)", () => {
    const v = classifyAudit("accent-volume-sweep", { ...s42Envelope(), volume: { tasks: 0, notes: 200, events: 250 } });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/volume/);
  });

  it("the volume rot guard: each leg of the profile is pinned — notes 199 and events 0 each read NON-green", () => {
    const notes = classifyAudit("accent-volume-sweep", { ...s42Envelope(), volume: { tasks: 300, notes: 199, events: 250 } });
    expect(notes.green).toBe(false);
    expect(notes.note).toMatch(/volume/);
    const events = classifyAudit("accent-volume-sweep", { ...s42Envelope(), volume: { tasks: 300, notes: 200, events: 0 } });
    expect(events.green).toBe(false);
    expect(events.note).toMatch(/volume/);
  });

  it("the applied-mismatch family: an accent whose self-verified reading differs from its key is a finding", () => {
    const env = s42Envelope() as { accents: Record<string, Record<string, unknown>> };
    (env.accents.teal as Record<string, unknown>).applied = "violet";
    const v = classifyAudit("accent-volume-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the INVERTED vehicle-contract family: a hidden sidebar at 1280 is the finding class (the lg contract broke — the sidebar is the desktop vehicle), and a visible hamburger is the same class (the app bar is lg:hidden)", () => {
    const hidden = classifyAudit("accent-volume-sweep", { ...s42Envelope(), chrome: { sidebarVisible: false, hamburgerVisible: false, sidebarNavScrollable: true } });
    expect(hidden.green).toBe(false);
    expect(hidden.note).toMatch(/vehicle/i);
    const burger = classifyAudit("accent-volume-sweep", { ...s42Envelope(), chrome: { sidebarVisible: true, hamburgerVisible: true, sidebarNavScrollable: true } });
    expect(burger.green).toBe(false);
    expect(burger.note).toMatch(/vehicle/i);
  });

  it("the scroll-contract family: sidebarNavScrollable=false is the finding class (links ~13–20 would be unreachable at 800 height — the nav's scroll is the only path below the fold)", () => {
    const v = classifyAudit("accent-volume-sweep", { ...s42Envelope(), chrome: { sidebarVisible: true, hamburgerVisible: false, sidebarNavScrollable: false } });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/sidebarNavScrollable|scroll/i);
  });

  it("the tint-rot family: an activeTint that computed to none is a FINDING (the S8 no-var rot class — the NAV_ACTIVE_GRADIENT_STOPS pair did not resolve)", () => {
    const v = classifyAudit("accent-volume-sweep", s42Envelope({ green: { Notes: { activeTint: "none" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/active-link gradient/);
  });

  it("the interaction family: an activeLabel that does not equal the view's own label is a FINDING (the active state did not follow the navigation)", () => {
    const v = classifyAudit("accent-volume-sweep", s42Envelope({ blue: { Tasks: { activeLabel: "Dashboard" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/did not follow the navigation/);
  });

  it("the overflow family: scrollWidth > 1280 is a finding (the S16/S34 overflow class — a 300-row list must never widen the document)", () => {
    const v = classifyAudit("accent-volume-sweep", s42Envelope({ orange: { Tasks: { scrollWidth: 1400 } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the S13 B3 volume budget: longTaskTotal > 1500 per view is a FINDING (main-thread blocking under stress); the boundary value 1500 stays green", () => {
    const hot = classifyAudit("accent-volume-sweep", s42Envelope({ violet: { Tasks: { longTaskTotal: 1600 } } }));
    expect(hot.green).toBe(false);
    expect(hot.findings).toBe(1);
    expect(hot.note).toMatch(/long-task/i);
    const boundary = classifyAudit("accent-volume-sweep", s42Envelope({ violet: { Tasks: { longTaskTotal: 1500 } } }));
    expect(boundary.green).toBe(true);
  });

  it("the S13 B2 volume budget: clickLatencyMs > 1500 per view is a FINDING (nav interactivity under stress); the boundary value 1500 stays green", () => {
    const hot = classifyAudit("accent-volume-sweep", s42Envelope({ teal: { Events: { clickLatencyMs: 1600 } } }));
    expect(hot.green).toBe(false);
    expect(hot.findings).toBe(1);
    expect(hot.note).toMatch(/click/i);
    const boundary = classifyAudit("accent-volume-sweep", s42Envelope({ teal: { Events: { clickLatencyMs: 1500 } } }));
    expect(boundary.green).toBe(true);
  });

  it("the flashbulb family: a flashbulb entry is ALWAYS a finding in dark mode (the dark doctrine — a light surface on the dark canvas), independent of the findings array", () => {
    const v = classifyAudit("accent-volume-sweep", s42Envelope({ red: { "My Day": { flashbulbs: [{ cls: "bg-white rounded-xl", bg: "rgb(255, 255, 255)", tag: "DIV" }] } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/flashbulb/i);
  });

  it("the strict record shape: a view record missing longTaskTotal reads shape-error (the volume measurement is part of the record)", () => {
    const env = s42Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.red.views.Tasks.longTaskTotal;
    const v = classifyAudit("accent-volume-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the strict record shape: a view record missing clickLatencyMs reads shape-error", () => {
    const env = s42Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.violet.views.Calendar.clickLatencyMs;
    const v = classifyAudit("accent-volume-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the strict record shape: a view record missing flashbulbs reads shape-error (the S38 dark detector family is part of the record)", () => {
    const env = s42Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.green.views.Events.flashbulbs;
    const v = classifyAudit("accent-volume-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the sidebar-error family: a sidebar record carrying an error is a FINDING (never a swallow)", () => {
    const env = s42Envelope() as { accents: Record<string, { sidebar: Record<string, unknown> }> };
    env.accents.blue.sidebar = { linkCount: 0, unreadable: [], lowcontrast: [], activeView: null, activeTint: null, error: "TypeError: Cannot read properties of null" };
    const v = classifyAudit("accent-volume-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the sidebar link census: linkCount !== 20 is a finding (the navigation census broke — the sidebar always carries all 20 links)", () => {
    const env = s42Envelope() as { accents: Record<string, { sidebar: Record<string, unknown> }> };
    env.accents.orange.sidebar = { linkCount: 19, unreadable: [], lowcontrast: [], activeView: "Analytics", activeTint: S42_TINT };
    const v = classifyAudit("accent-volume-sweep", env);
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/19|link/i);
  });

  it("the counting semantics: a non-exempt unreadable entry with an EMPTY findings array still reads NON-green (the independent counting doctrine)", () => {
    const env = s42Envelope({ teal: { Analytics: { unreadable: [
      { text: "streak", color: "rgb(148, 163, 184)", contrast: 1.9 },
    ] } } });
    const v = classifyAudit("accent-volume-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the CTA-face exemption is SIGNATURE-STRICT: white-on-accent rides the note; a non-white unreadable text still counts", () => {
    const exempt = classifyAudit("accent-volume-sweep", s42Envelope({ violet: { Dashboard: { unreadable: [
      { text: "New Task", color: "rgb(255, 255, 255)", contrast: 2.1 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/1 CTA-face exempt/);
    const other = classifyAudit("accent-volume-sweep", s42Envelope({ violet: { Dashboard: { unreadable: [
      { text: "STRESS-S42-task 42", color: "rgb(100, 116, 139)", contrast: 1.8 },
    ] } } }));
    expect(other.green).toBe(false);
    expect(other.findings).toBe(1);
  });

  it("the LIGHT-mode exemptions do NOT apply in dark: a slate-300 numeric entry (the light calendar-day signature) and a yellow-500 priority-pill entry (the light pill signature) still COUNT — in dark those surfaces re-theme, so any unreadable hit is genuine", () => {
    const v = classifyAudit("accent-volume-sweep", s42Envelope({ pink: { Calendar: { unreadable: [
      { text: "27", color: "rgb(203, 213, 225)", contrast: 1.6 },
      { text: "high", color: "rgb(234, 179, 8)", contrast: 2.0 },
    ] } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(2);
  });

  it("the lowcontrast WARN family rides the note, never the findings (the S11 non-gap family)", () => {
    const env = s42Envelope({ green: { Notes: { lowcontrast: [
      { text: "STRESS-S42-note 7", color: "rgb(167, 139, 250)", contrast: 3.07 },
    ] } } });
    const v = classifyAudit("accent-volume-sweep", env);
    expect(v.green).toBe(true);
    expect(v.note).toMatch(/1 WARN/);
  });

  it("the S13 B1 API bound: /api/tasks bytes > 500000 is a FINDING (the unbounded-payload guard); the boundary 500000 stays green", () => {
    const fat = classifyAudit("accent-volume-sweep", { ...s42Envelope(), api: {
      "/api/tasks": { ms: 400, bytes: 512_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    } });
    expect(fat.green).toBe(false);
    expect(fat.note).toMatch(/payload/i);
    const boundary = classifyAudit("accent-volume-sweep", { ...s42Envelope(), api: {
      "/api/tasks": { ms: 400, bytes: 500_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    } });
    expect(boundary.green).toBe(true);
  });

  it("the unknown-audit guard still holds: a misspelled name is a shape-error even with a perfect envelope", () => {
    const v = classifyAudit("accent-volume-swep", s42Envelope());
    expect(isErr(v)).toBe(true);
  });
});

// --- accent-volume-light-sweep (S43 — the data-volume × light × accent stress)

// The full-shape generator: 7 accents × the 7 volume-affected views
// navigated through the SIDEBAR (the desktop vehicle) at 1280×800 in LIGHT
// mode under the S13 volume profile (300 tasks / 200 notes / 250 events),
// with the per-view interaction keys (activeTint/activeLabel — the
// light × volume interaction cell: S41 proved light at SEED, S42 proved
// dark at volume) AND the volume keys (nodes/mainNodes/longTaskTotal/
// clickLatencyMs — the S13 measurement family) AND the LIGHT detector
// family (unreadable/lowcontrast — NO flashbulbs: the flashbulb class, a
// light surface on the dark canvas, exists only in dark; in light mode
// light surfaces are by-design — the S37/S39/S40/S41 convention).
const S43_ACCENTS = ["violet", "blue", "green", "orange", "pink", "red", "teal"] as const;
// The 7 volume-affected views by DISPLAY labels — the S13 data-volume
// audit's own view set (the views that render task/note/event rows; the
// other 13 are volume-invariant and stay covered by the S38/S41 seed
// sweeps).
const S43_VIEWS = ["Dashboard", "My Day", "Tasks", "Calendar", "Events", "Notes", "Analytics"];
const S43_TINT = "linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))";

type S43Rec = Record<string, unknown>;

function s43ViewRec(o: S43Rec = {}): S43Rec {
  return {
    heading: "ok", scrollWidth: 1280, sidebarVisible: true, headingOffset: true,
    unreadable: [] as unknown[], lowcontrast: [] as unknown[],
    consoleErrors: [] as unknown[],
    activeTint: S43_TINT, activeLabel: "",
    nodes: 4200, mainNodes: 3100, longTaskTotal: 420, clickLatencyMs: 610,
    ...o,
  };
}
function s43SidebarRec(o: S43Rec = {}): S43Rec {
  return { linkCount: 20, unreadable: [] as unknown[], lowcontrast: [] as unknown[], activeView: "Analytics", activeTint: S43_TINT, ...o };
}

/** The full accent-volume-light envelope: 7 accents × 7 views + the sidebar
 *  per accent at 1280×800 light under the S13 volume profile, with per-view
 *  overrides merged in (the activeLabel defaults are filled to the view's
 *  own label — the interaction contract). */
function s43Envelope(viewOverrides: Record<string, Record<string, S43Rec>> = {}): S43Rec {
  const accents: S43Rec = {};
  for (const a of S43_ACCENTS) {
    const views: S43Rec = {};
    for (const v of S43_VIEWS) {
      const base = s43ViewRec(viewOverrides[a]?.[v]);
      if (base.activeLabel === "") base.activeLabel = v; // the interaction contract default
      views[v] = base;
    }
    accents[a] = { applied: a, views, sidebar: s43SidebarRec() };
  }
  return {
    source: "accent-volume-light-sweep", mode: "light",
    viewport: { width: 1280, height: 800 },
    volume: { tasks: 300, notes: 200, events: 250 },
    chrome: { sidebarVisible: true, hamburgerVisible: false, sidebarNavScrollable: true },
    api: {
      "/api/tasks": { ms: 140, bytes: 190_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    },
    accents, findings: [] as unknown[],
  };
}

describe("classifyAudit accent-volume-light-sweep (S43 — the data-volume × light × accent stress)", () => {
  it("the GREEN shape: 7 accents × 7 volume views navigated through the sidebar at 1280×800 light under the 300/200/250 profile → green with the swept counts (NO flashbulbs family — the light shape)", () => {
    const v = classifyAudit("accent-volume-light-sweep", s43Envelope());
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/49 view renderings/);
    expect(v.note).toMatch(/49 active-tint readings/);
    expect(v.note).toMatch(/7 sidebar records/);
    expect(v.note).toMatch(/1280×800/);
    expect(v.note).toMatch(/300\/200\/250/);
    expect(v.note).toMatch(/MODE light/);
  });

  it("the ALL-VIEWS guard: an accent map missing ONE volume view reads shape-error — a view that silently did not run must never read green-by-omission", () => {
    const env = s43Envelope() as { accents: Record<string, { views: Record<string, unknown> }> };
    delete env.accents.violet.views.Tasks;
    const v = classifyAudit("accent-volume-light-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the ALL-ACCENTS guard: the accents map missing ONE accent reads shape-error", () => {
    const env = s43Envelope() as { accents: Record<string, unknown> };
    delete env.accents.red;
    const v = classifyAudit("accent-volume-light-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the historical S13-shape envelope (the data-volume audit's own flat findings/nonGaps shape — the exact pre-S43 state) reads shape-error, never green-by-resemblance", () => {
    const s13Shape = {
      source: "data-volume-audit", findings: [], nonGaps: [{ surface: "Tasks render", longTaskTotal: 400 }],
      inserted: { tasks: 300, notes: 200, events: 250 },
    };
    const v = classifyAudit("accent-volume-light-sweep", s13Shape);
    expect(isErr(v)).toBe(true);
  });

  it("the historical S42 DARK envelope (mode=dark, the sibling dark half's own shape) reads NON-green here — the mode rot guard inverted: THIS audit owns the LIGHT half", () => {
    const v = classifyAudit("accent-volume-light-sweep", s42Envelope());
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=dark/);
  });

  it("the volume contract is part of the shape: an envelope without volume reads shape-error", () => {
    const env = s43Envelope() as Record<string, unknown>;
    delete env.volume;
    const v = classifyAudit("accent-volume-light-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the missing sidebar record reads shape-error (the sidebar is part of the per-accent contract)", () => {
    const env = s43Envelope() as { accents: Record<string, Record<string, unknown>> };
    delete (env.accents.pink as Record<string, unknown>).sidebar;
    const v = classifyAudit("accent-volume-light-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("mode is part of the contract: an envelope without mode reads shape-error", () => {
    const env = s43Envelope() as Record<string, unknown>;
    delete env.mode;
    const v = classifyAudit("accent-volume-light-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the viewport guard: the 390×844 mobile, 768×1024 mid-band, AND 844×390 landscape envelopes fed here read shape-error, never a silent re-scope (the sibling families own those surfaces)", () => {
    const mobile = classifyAudit("accent-volume-light-sweep", { ...s43Envelope(), viewport: { width: 390, height: 844 } });
    expect(isErr(mobile)).toBe(true);
    const midband = classifyAudit("accent-volume-light-sweep", { ...s43Envelope(), viewport: { width: 768, height: 1024 } });
    expect(isErr(midband)).toBe(true);
    const landscape = classifyAudit("accent-volume-light-sweep", { ...s43Envelope(), viewport: { width: 844, height: 390 } });
    expect(isErr(landscape)).toBe(true);
  });

  it("the mode rot guard: mode=dark reads NON-green (the volume × DARK × accent surface is the S42 audit's contract — this seam owns the LIGHT half)", () => {
    const v = classifyAudit("accent-volume-light-sweep", { ...s43Envelope(), mode: "dark" });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=dark/);
  });

  it("the volume rot guard: a seed-volume envelope (tasks 0) reads NON-green — the sweep measured the wrong density and must never read green (the S38 omission-means-clean retirement, applied to the volume axis)", () => {
    const v = classifyAudit("accent-volume-light-sweep", { ...s43Envelope(), volume: { tasks: 0, notes: 200, events: 250 } });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/volume/);
  });

  it("the volume rot guard: each leg of the profile is pinned — notes 199 and events 0 each read NON-green", () => {
    const notes = classifyAudit("accent-volume-light-sweep", { ...s43Envelope(), volume: { tasks: 300, notes: 199, events: 250 } });
    expect(notes.green).toBe(false);
    expect(notes.note).toMatch(/volume/);
    const events = classifyAudit("accent-volume-light-sweep", { ...s43Envelope(), volume: { tasks: 300, notes: 200, events: 0 } });
    expect(events.green).toBe(false);
    expect(events.note).toMatch(/volume/);
  });

  it("the applied-mismatch family: an accent whose self-verified reading differs from its key is a finding", () => {
    const env = s43Envelope() as { accents: Record<string, Record<string, unknown>> };
    (env.accents.teal as Record<string, unknown>).applied = "violet";
    const v = classifyAudit("accent-volume-light-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the INVERTED vehicle-contract family: a hidden sidebar at 1280 is the finding class (the lg contract broke — the sidebar is the desktop vehicle), and a visible hamburger is the same class (the app bar is lg:hidden)", () => {
    const hidden = classifyAudit("accent-volume-light-sweep", { ...s43Envelope(), chrome: { sidebarVisible: false, hamburgerVisible: false, sidebarNavScrollable: true } });
    expect(hidden.green).toBe(false);
    expect(hidden.note).toMatch(/vehicle/i);
    const burger = classifyAudit("accent-volume-light-sweep", { ...s43Envelope(), chrome: { sidebarVisible: true, hamburgerVisible: true, sidebarNavScrollable: true } });
    expect(burger.green).toBe(false);
    expect(burger.note).toMatch(/vehicle/i);
  });

  it("the scroll-contract family: sidebarNavScrollable=false is the finding class (links ~13–20 would be unreachable at 800 height — the nav's scroll is the only path below the fold)", () => {
    const v = classifyAudit("accent-volume-light-sweep", { ...s43Envelope(), chrome: { sidebarVisible: true, hamburgerVisible: false, sidebarNavScrollable: false } });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/sidebarNavScrollable|scroll/i);
  });

  it("the tint-rot family: an activeTint that computed to none is a FINDING (the S8 no-var rot class — the NAV_ACTIVE_GRADIENT_STOPS pair did not resolve at volume)", () => {
    const v = classifyAudit("accent-volume-light-sweep", s43Envelope({ green: { Notes: { activeTint: "none" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/active-link gradient/);
  });

  it("the interaction family: an activeLabel that does not equal the view's own label is a FINDING (the active state did not follow the navigation — the light × volume interaction cell)", () => {
    const v = classifyAudit("accent-volume-light-sweep", s43Envelope({ blue: { Tasks: { activeLabel: "Dashboard" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/did not follow the navigation/);
  });

  it("the overflow family: scrollWidth > 1280 is a finding (the S16/S34 overflow class — a 300-row list must never widen the document)", () => {
    const v = classifyAudit("accent-volume-light-sweep", s43Envelope({ orange: { Tasks: { scrollWidth: 1400 } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the S13 B3 volume budget: longTaskTotal > 1500 per view is a FINDING (main-thread blocking under stress); the boundary value 1500 stays green", () => {
    const hot = classifyAudit("accent-volume-light-sweep", s43Envelope({ violet: { Tasks: { longTaskTotal: 1600 } } }));
    expect(hot.green).toBe(false);
    expect(hot.findings).toBe(1);
    expect(hot.note).toMatch(/long-task/i);
    const boundary = classifyAudit("accent-volume-light-sweep", s43Envelope({ violet: { Tasks: { longTaskTotal: 1500 } } }));
    expect(boundary.green).toBe(true);
  });

  it("the S13 B2 volume budget: clickLatencyMs > 1500 per view is a FINDING (nav interactivity under stress); the boundary value 1500 stays green", () => {
    const hot = classifyAudit("accent-volume-light-sweep", s43Envelope({ teal: { Events: { clickLatencyMs: 1600 } } }));
    expect(hot.green).toBe(false);
    expect(hot.findings).toBe(1);
    expect(hot.note).toMatch(/click/i);
    const boundary = classifyAudit("accent-volume-light-sweep", s43Envelope({ teal: { Events: { clickLatencyMs: 1500 } } }));
    expect(boundary.green).toBe(true);
  });

  it("the strict record shape: a view record missing longTaskTotal reads shape-error (the volume measurement is part of the record)", () => {
    const env = s43Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.red.views.Tasks.longTaskTotal;
    const v = classifyAudit("accent-volume-light-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the strict record shape: a view record missing clickLatencyMs reads shape-error", () => {
    const env = s43Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.violet.views.Calendar.clickLatencyMs;
    const v = classifyAudit("accent-volume-light-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the LIGHT shape carries NO flashbulbs family: the sibling S42 dark envelope with mode=light reads GREEN here (extra dark-only keys are ignored — the light seam requires the light detector family only; the flashbulb class exists only in dark)", () => {
    const v = classifyAudit("accent-volume-light-sweep", { ...s42Envelope(), mode: "light" });
    expect(v.green).toBe(true);
  });

  it("the sidebar-error family: a sidebar record carrying an error is a FINDING (never a swallow)", () => {
    const env = s43Envelope() as { accents: Record<string, { sidebar: Record<string, unknown> }> };
    env.accents.blue.sidebar = { linkCount: 0, unreadable: [], lowcontrast: [], activeView: null, activeTint: null, error: "TypeError: Cannot read properties of null" };
    const v = classifyAudit("accent-volume-light-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the sidebar link census: linkCount !== 20 is a finding (the navigation census broke — the sidebar always carries all 20 links)", () => {
    const env = s43Envelope() as { accents: Record<string, { sidebar: Record<string, unknown> }> };
    env.accents.orange.sidebar = { linkCount: 19, unreadable: [], lowcontrast: [], activeView: "Analytics", activeTint: S43_TINT };
    const v = classifyAudit("accent-volume-light-sweep", env);
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/19|link/i);
  });

  it("the counting semantics: a non-exempt unreadable entry with an EMPTY findings array still reads NON-green (the independent counting doctrine)", () => {
    const env = s43Envelope({ teal: { Analytics: { unreadable: [
      { text: "streak", color: "rgb(148, 163, 184)", contrast: 1.9 },
    ] } } });
    const v = classifyAudit("accent-volume-light-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the CTA-face exemption is SIGNATURE-STRICT: white-on-accent rides the note; a non-white unreadable text still counts", () => {
    const exempt = classifyAudit("accent-volume-light-sweep", s43Envelope({ violet: { Dashboard: { unreadable: [
      { text: "New Task", color: "rgb(255, 255, 255)", contrast: 2.1 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/1 CTA-face exempt/);
    const other = classifyAudit("accent-volume-light-sweep", s43Envelope({ violet: { Dashboard: { unreadable: [
      { text: "STRESS-S43-task 42", color: "rgb(100, 116, 139)", contrast: 1.8 },
    ] } } }));
    expect(other.green).toBe(false);
    expect(other.findings).toBe(1);
  });

  it("the calendar adjacent-day exemption is SIGNATURE-STRICT: slate-300 1–2-digit day numbers ride the note; a slate-300 NON-numeric text still counts (the mutated signature)", () => {
    const exempt = classifyAudit("accent-volume-light-sweep", s43Envelope({ pink: { Calendar: { unreadable: [
      { text: "27", color: "rgb(203, 213, 225)", contrast: 1.6 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/1 calendar adjacent-day exempt/);
    const mutated = classifyAudit("accent-volume-light-sweep", s43Envelope({ pink: { Calendar: { unreadable: [
      { text: "overdue", color: "rgb(203, 213, 225)", contrast: 1.6 },
    ] } } }));
    expect(mutated.green).toBe(false);
    expect(mutated.findings).toBe(1);
  });

  it("the yellow priority-pill exemption is SIGNATURE-STRICT: yellow-500 high/medium/low rides the note; a yellow-400 pill of the same vocabulary still counts (the color mutation), and a yellow-500 NON-vocabulary text counts too", () => {
    const exempt = classifyAudit("accent-volume-light-sweep", s43Envelope({ pink: { Tasks: { unreadable: [
      { text: "high", color: "rgb(234, 179, 8)", contrast: 2.0 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/1 yellow-pill exempt/);
    const colorMutated = classifyAudit("accent-volume-light-sweep", s43Envelope({ pink: { Tasks: { unreadable: [
      { text: "high", color: "rgb(202, 138, 4)", contrast: 2.0 },
    ] } } }));
    expect(colorMutated.green).toBe(false);
    expect(colorMutated.findings).toBe(1);
    const vocabMutated = classifyAudit("accent-volume-light-sweep", s43Envelope({ pink: { Tasks: { unreadable: [
      { text: "urgent", color: "rgb(234, 179, 8)", contrast: 2.0 },
    ] } } }));
    expect(vocabMutated.green).toBe(false);
    expect(vocabMutated.findings).toBe(1);
  });

  it("the lowcontrast WARN family rides the note, never the findings (the S11 non-gap family)", () => {
    const env = s43Envelope({ green: { Notes: { lowcontrast: [
      { text: "STRESS-S43-note 7", color: "rgb(167, 139, 250)", contrast: 3.07 },
    ] } } });
    const v = classifyAudit("accent-volume-light-sweep", env);
    expect(v.green).toBe(true);
    expect(v.note).toMatch(/1 WARN/);
  });

  it("the S13 B1 API bound: /api/tasks bytes > 500000 is a FINDING (the unbounded-payload guard); the boundary 500000 stays green", () => {
    const fat = classifyAudit("accent-volume-light-sweep", { ...s43Envelope(), api: {
      "/api/tasks": { ms: 400, bytes: 512_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    } });
    expect(fat.green).toBe(false);
    expect(fat.note).toMatch(/payload/i);
    const boundary = classifyAudit("accent-volume-light-sweep", { ...s43Envelope(), api: {
      "/api/tasks": { ms: 400, bytes: 500_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    } });
    expect(boundary.green).toBe(true);
  });

  it("the unknown-audit guard still holds: a misspelled name is a shape-error even with a perfect envelope", () => {
    const v = classifyAudit("accent-volume-light-swep", s43Envelope());
    expect(isErr(v)).toBe(true);
  });
});

// --- accent-volume-dark-mobile-sweep (S44 — the dark × mobile × volume stress)

// The full-shape generator: 7 accents × the 7 volume-affected views
// navigated through the DRAWER (the mobile vehicle — the only vehicle below
// 1024) at 390×844 in DARK mode under the S13 volume profile (300 tasks /
// 200 notes / 250 events), with the mobile structural keys (drawerClosed/
// appBar/headingClearance — the S33/S35/S36 family), the per-view
// interaction keys (activeTint/activeLabel — read at the next drawer open,
// the S40 pendingView pattern: the dark × mobile × volume cell: S36 proved
// dark × mobile at SEED, S40 accent × drawer at SEED light, S42 dark ×
// volume at DESKTOP) AND the volume keys (nodes/mainNodes/longTaskTotal/
// clickLatencyMs — the S13 measurement family) AND the DARK detector family
// (flashbulbs/unreadable/lowcontrast — the S38/S42 dark doctrine: flashbulbs
// are ALWAYS findings; the unreadable CTA-face exemption ONLY — the
// calendar-day and yellow-pill light exemptions do NOT apply in dark, those
// surfaces re-theme).
const S44_ACCENTS = ["violet", "blue", "green", "orange", "pink", "red", "teal"] as const;
// The 7 volume-affected views by DISPLAY labels — the S13 data-volume
// audit's own view set (the views that render task/note/event rows; the
// other 13 are volume-invariant and stay covered by the S36/S40 seed
// sweeps).
const S44_VIEWS = ["Dashboard", "My Day", "Tasks", "Calendar", "Events", "Notes", "Analytics"];
const S44_TINT = "linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))";

type S44Rec = Record<string, unknown>;

function s44ViewRec(o: S44Rec = {}): S44Rec {
  return {
    heading: "ok", scrollWidth: 390, drawerClosed: true, appBar: true, headingClearance: true,
    flashbulbs: [] as unknown[], unreadable: [] as unknown[], lowcontrast: [] as unknown[],
    consoleErrors: [] as unknown[],
    activeTint: S44_TINT, activeLabel: "",
    nodes: 4200, mainNodes: 3100, longTaskTotal: 420, clickLatencyMs: 610,
    ...o,
  };
}
function s44DrawerRec(o: S44Rec = {}): S44Rec {
  return { linkCount: 20, flashbulbs: [] as unknown[], unreadable: [] as unknown[], lowcontrast: [] as unknown[], activeView: "Analytics", activeTint: S44_TINT, ...o };
}

/** The full accent-volume-dark-mobile envelope: 7 accents × 7 views + the
 *  drawer record per accent at 390×844 dark under the S13 volume profile,
 *  with per-view overrides merged in (the activeLabel defaults are filled to
 *  the view's own label — the interaction contract). */
function s44Envelope(viewOverrides: Record<string, Record<string, S44Rec>> = {}): S44Rec {
  const accents: S44Rec = {};
  for (const a of S44_ACCENTS) {
    const views: S44Rec = {};
    for (const v of S44_VIEWS) {
      const base = s44ViewRec(viewOverrides[a]?.[v]);
      if (base.activeLabel === "") base.activeLabel = v; // the interaction contract default
      views[v] = base;
    }
    accents[a] = { applied: a, views, drawer: s44DrawerRec() };
  }
  return {
    source: "accent-volume-dark-mobile-sweep", mode: "dark",
    viewport: { width: 390, height: 844 },
    volume: { tasks: 300, notes: 200, events: 250 },
    chrome: { sidebarVisible: false, hamburgerVisible: true, drawerNavScrollable: true },
    api: {
      "/api/tasks": { ms: 140, bytes: 190_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    },
    accents, findings: [] as unknown[],
  };
}

describe("classifyAudit accent-volume-dark-mobile-sweep (S44 — the dark × mobile × volume stress)", () => {
  it("the GREEN shape: 7 accents × 7 volume views navigated through the drawer at 390×844 dark under the 300/200/250 profile → green with the swept counts (the dark detector family — flashbulbs + the CTA-face-only exemption)", () => {
    const v = classifyAudit("accent-volume-dark-mobile-sweep", s44Envelope());
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/49 view renderings/);
    expect(v.note).toMatch(/49 active-tint readings/);
    expect(v.note).toMatch(/7 drawer records/);
    expect(v.note).toMatch(/390×844/);
    expect(v.note).toMatch(/300\/200\/250/);
    expect(v.note).toMatch(/MODE dark/);
  });

  it("the ALL-VIEWS guard: an accent map missing ONE volume view reads shape-error — a view that silently did not run must never read green-by-omission", () => {
    const env = s44Envelope() as { accents: Record<string, { views: Record<string, unknown> }> };
    delete env.accents.violet.views.Tasks;
    const v = classifyAudit("accent-volume-dark-mobile-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the ALL-ACCENTS guard: the accents map missing ONE accent reads shape-error", () => {
    const env = s44Envelope() as { accents: Record<string, unknown> };
    delete env.accents.red;
    const v = classifyAudit("accent-volume-dark-mobile-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the historical S13-shape envelope (the data-volume audit's own flat findings/nonGaps shape — the exact pre-S44 state) reads shape-error, never green-by-resemblance", () => {
    const s13Shape = {
      source: "data-volume-audit", findings: [], nonGaps: [{ surface: "Tasks render", longTaskTotal: 400 }],
      inserted: { tasks: 300, notes: 200, events: 250 },
    };
    const v = classifyAudit("accent-volume-dark-mobile-sweep", s13Shape);
    expect(isErr(v)).toBe(true);
  });

  it("the historical S42 DARK DESKTOP envelope (viewport 1280×800) reads shape-error here — the viewport is this seam's own contract (the S42/S43 desktop pair own 1280×800; this seam owns 390×844)", () => {
    const v = classifyAudit("accent-volume-dark-mobile-sweep", s42Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S43 LIGHT DESKTOP envelope (viewport 1280×800) reads shape-error here — the same viewport guard", () => {
    const v = classifyAudit("accent-volume-dark-mobile-sweep", s43Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the volume contract is part of the shape: an envelope without volume reads shape-error", () => {
    const env = s44Envelope() as Record<string, unknown>;
    delete env.volume;
    const v = classifyAudit("accent-volume-dark-mobile-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the missing drawer record reads shape-error (the drawer is part of the per-accent contract — the mobile vehicle's own rendering)", () => {
    const env = s44Envelope() as { accents: Record<string, Record<string, unknown>> };
    delete (env.accents.pink as Record<string, unknown>).drawer;
    const v = classifyAudit("accent-volume-dark-mobile-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("mode is part of the contract: an envelope without mode reads shape-error", () => {
    const env = s44Envelope() as Record<string, unknown>;
    delete env.mode;
    const v = classifyAudit("accent-volume-dark-mobile-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the viewport guard: the 1280×800 desktop, 768×1024 mid-band, AND 844×390 landscape envelopes fed here read shape-error, never a silent re-scope (the sibling families own those surfaces)", () => {
    const desktop = classifyAudit("accent-volume-dark-mobile-sweep", { ...s44Envelope(), viewport: { width: 1280, height: 800 } });
    expect(isErr(desktop)).toBe(true);
    const midband = classifyAudit("accent-volume-dark-mobile-sweep", { ...s44Envelope(), viewport: { width: 768, height: 1024 } });
    expect(isErr(midband)).toBe(true);
    const landscape = classifyAudit("accent-volume-dark-mobile-sweep", { ...s44Envelope(), viewport: { width: 844, height: 390 } });
    expect(isErr(landscape)).toBe(true);
  });

  it("the mode rot guard: mode=light reads NON-green (the light × mobile × volume family is a documented future cross-axis candidate — this seam owns the DARK half)", () => {
    const v = classifyAudit("accent-volume-dark-mobile-sweep", { ...s44Envelope(), mode: "light" });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=light/);
  });

  it("the volume rot guard: a seed-volume envelope (tasks 0) reads NON-green — the sweep measured the wrong density and must never read green (the S38 omission-means-clean retirement, applied to the volume axis)", () => {
    const v = classifyAudit("accent-volume-dark-mobile-sweep", { ...s44Envelope(), volume: { tasks: 0, notes: 200, events: 250 } });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/volume/);
  });

  it("the volume rot guard: each leg of the profile is pinned — notes 199 and events 0 each read NON-green", () => {
    const notes = classifyAudit("accent-volume-dark-mobile-sweep", { ...s44Envelope(), volume: { tasks: 300, notes: 199, events: 250 } });
    expect(notes.green).toBe(false);
    expect(notes.note).toMatch(/volume/);
    const events = classifyAudit("accent-volume-dark-mobile-sweep", { ...s44Envelope(), volume: { tasks: 300, notes: 200, events: 0 } });
    expect(events.green).toBe(false);
    expect(events.note).toMatch(/volume/);
  });

  it("the applied-mismatch family: an accent whose self-verified reading differs from its key is a finding", () => {
    const env = s44Envelope() as { accents: Record<string, Record<string, unknown>> };
    (env.accents.teal as Record<string, unknown>).applied = "violet";
    const v = classifyAudit("accent-volume-dark-mobile-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the MOBILE vehicle-contract family (the INVERSE of the desktop seams): a VISIBLE sidebar at 390 is the finding class (the sidebar is hidden lg:flex — below 1024 the drawer is the only vehicle), and a HIDDEN hamburger is the same class (the app bar's hamburger is the vehicle's handle)", () => {
    const sidebar = classifyAudit("accent-volume-dark-mobile-sweep", { ...s44Envelope(), chrome: { sidebarVisible: true, hamburgerVisible: true, drawerNavScrollable: true } });
    expect(sidebar.green).toBe(false);
    expect(sidebar.note).toMatch(/vehicle/i);
    const burger = classifyAudit("accent-volume-dark-mobile-sweep", { ...s44Envelope(), chrome: { sidebarVisible: false, hamburgerVisible: false, drawerNavScrollable: true } });
    expect(burger.green).toBe(false);
    expect(burger.note).toMatch(/vehicle/i);
  });

  it("the drawer-nav-scroll family: drawerNavScrollable=false is the finding class (at 844 height the 20 nav rows cannot fit the ~700px nav area — the nav's scroll is the only path to links ~14–20)", () => {
    const v = classifyAudit("accent-volume-dark-mobile-sweep", { ...s44Envelope(), chrome: { sidebarVisible: false, hamburgerVisible: true, drawerNavScrollable: false } });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/drawerNavScrollable|scroll/i);
  });

  it("the tint-rot family: an activeTint that computed to none is a FINDING (the S8 no-var rot class — the NAV_ACTIVE_GRADIENT_STOPS pair did not resolve at volume)", () => {
    const v = classifyAudit("accent-volume-dark-mobile-sweep", s44Envelope({ green: { Notes: { activeTint: "none" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/active-link gradient/);
  });

  it("the interaction family: an activeLabel that does not equal the view's own label is a FINDING (the active state did not follow the navigation — the dark × mobile × volume interaction cell)", () => {
    const v = classifyAudit("accent-volume-dark-mobile-sweep", s44Envelope({ blue: { Tasks: { activeLabel: "Dashboard" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/did not follow the navigation/);
  });

  it("the overflow family: scrollWidth > 390 is a finding (the S16 mobile-only-gap class — a 300-row list must never widen the 390px document)", () => {
    const v = classifyAudit("accent-volume-dark-mobile-sweep", s44Envelope({ orange: { Tasks: { scrollWidth: 410 } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the structural mobile family: a drawer that did not close on navigation, a missing app bar, and a heading under the fixed bar are each findings (the S33/S35/S36 structural contracts at volume)", () => {
    const stuck = classifyAudit("accent-volume-dark-mobile-sweep", s44Envelope({ violet: { Tasks: { drawerClosed: false } } }));
    expect(stuck.green).toBe(false);
    expect(stuck.findings).toBe(1);
    expect(stuck.note).toMatch(/drawer/i);
    const noBar = classifyAudit("accent-volume-dark-mobile-sweep", s44Envelope({ blue: { Events: { appBar: false } } }));
    expect(noBar.green).toBe(false);
    expect(noBar.findings).toBe(1);
    expect(noBar.note).toMatch(/app bar/i);
    const under = classifyAudit("accent-volume-dark-mobile-sweep", s44Envelope({ teal: { Notes: { headingClearance: false } } }));
    expect(under.green).toBe(false);
    expect(under.findings).toBe(1);
    expect(under.note).toMatch(/clearance/i);
  });

  it("the S13 B3 volume budget: longTaskTotal > 1500 per view is a FINDING (main-thread blocking under stress); the boundary value 1500 stays green", () => {
    const hot = classifyAudit("accent-volume-dark-mobile-sweep", s44Envelope({ violet: { Tasks: { longTaskTotal: 1600 } } }));
    expect(hot.green).toBe(false);
    expect(hot.findings).toBe(1);
    expect(hot.note).toMatch(/long-task/i);
    const boundary = classifyAudit("accent-volume-dark-mobile-sweep", s44Envelope({ violet: { Tasks: { longTaskTotal: 1500 } } }));
    expect(boundary.green).toBe(true);
  });

  it("the S13 B2 volume budget: clickLatencyMs > 1500 per view is a FINDING (the drawer-click → heading path — nav interactivity under stress); the boundary value 1500 stays green", () => {
    const hot = classifyAudit("accent-volume-dark-mobile-sweep", s44Envelope({ teal: { Events: { clickLatencyMs: 1600 } } }));
    expect(hot.green).toBe(false);
    expect(hot.findings).toBe(1);
    expect(hot.note).toMatch(/click/i);
    const boundary = classifyAudit("accent-volume-dark-mobile-sweep", s44Envelope({ teal: { Events: { clickLatencyMs: 1500 } } }));
    expect(boundary.green).toBe(true);
  });

  it("the strict record shape: a view record missing longTaskTotal reads shape-error (the volume measurement is part of the record)", () => {
    const env = s44Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.red.views.Tasks.longTaskTotal;
    const v = classifyAudit("accent-volume-dark-mobile-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the strict record shape: a view record missing clickLatencyMs reads shape-error", () => {
    const env = s44Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.violet.views.Calendar.clickLatencyMs;
    const v = classifyAudit("accent-volume-dark-mobile-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the flashbulb family: ONE flashbulb entry is a FINDING, always (a light surface on the dark canvas — the S38 dark doctrine, at the mobile layout under volume)", () => {
    const v = classifyAudit("accent-volume-dark-mobile-sweep", s44Envelope({ pink: { Tasks: { flashbulbs: [
      { cls: "bg-white rounded-xl", bg: "rgb(255, 255, 255)", tag: "DIV", w: 340, h: 60, text: "STRESS-S44-task 12" },
    ] } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/flashbulb/);
  });

  it("the counting semantics: a non-exempt unreadable entry with an EMPTY findings array still reads NON-green (the independent counting doctrine)", () => {
    const env = s44Envelope({ teal: { Analytics: { unreadable: [
      { text: "streak", color: "rgb(148, 163, 184)", contrast: 1.9 },
    ] } } });
    const v = classifyAudit("accent-volume-dark-mobile-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the CTA-face exemption is SIGNATURE-STRICT: white-on-accent rides the note; a non-white unreadable text still counts", () => {
    const exempt = classifyAudit("accent-volume-dark-mobile-sweep", s44Envelope({ violet: { Dashboard: { unreadable: [
      { text: "New Task", color: "rgb(255, 255, 255)", contrast: 2.1 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/1 CTA-face exempt/);
    const other = classifyAudit("accent-volume-dark-mobile-sweep", s44Envelope({ violet: { Dashboard: { unreadable: [
      { text: "STRESS-S44-task 42", color: "rgb(100, 116, 139)", contrast: 1.8 },
    ] } } }));
    expect(other.green).toBe(false);
    expect(other.findings).toBe(1);
  });

  it("the LIGHT exemptions do NOT apply in dark (the S42 re-theme doctrine): a slate-300 calendar-day signature and a yellow-500 priority-pill signature each COUNT as findings here — those surfaces re-theme in dark", () => {
    const calDay = classifyAudit("accent-volume-dark-mobile-sweep", s44Envelope({ pink: { Calendar: { unreadable: [
      { text: "27", color: "rgb(203, 213, 225)", contrast: 1.6 },
    ] } } }));
    expect(calDay.green).toBe(false);
    expect(calDay.findings).toBe(1);
    const pill = classifyAudit("accent-volume-dark-mobile-sweep", s44Envelope({ pink: { Tasks: { unreadable: [
      { text: "high", color: "rgb(234, 179, 8)", contrast: 2.0 },
    ] } } }));
    expect(pill.green).toBe(false);
    expect(pill.findings).toBe(1);
  });

  it("the lowcontrast WARN family rides the note, never the findings (the S11 non-gap family)", () => {
    const env = s44Envelope({ green: { Notes: { lowcontrast: [
      { text: "STRESS-S44-note 7", color: "rgb(167, 139, 250)", contrast: 3.07 },
    ] } } });
    const v = classifyAudit("accent-volume-dark-mobile-sweep", env);
    expect(v.green).toBe(true);
    expect(v.note).toMatch(/1 WARN/);
  });

  it("the drawer-error family: a drawer record carrying an error is a FINDING (never a swallow)", () => {
    const env = s44Envelope() as { accents: Record<string, { drawer: Record<string, unknown> }> };
    env.accents.blue.drawer = { linkCount: 0, flashbulbs: [], unreadable: [], lowcontrast: [], activeView: null, activeTint: null, error: "TypeError: Cannot read properties of null" };
    const v = classifyAudit("accent-volume-dark-mobile-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the drawer link census: linkCount !== 20 is a finding (the navigation census broke — the drawer always carries all 20 links)", () => {
    const env = s44Envelope() as { accents: Record<string, { drawer: Record<string, unknown> }> };
    env.accents.orange.drawer = { linkCount: 19, flashbulbs: [], unreadable: [], lowcontrast: [], activeView: "Analytics", activeTint: S44_TINT };
    const v = classifyAudit("accent-volume-dark-mobile-sweep", env);
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/19|link/i);
  });

  it("the S13 B1 API bound: /api/tasks bytes > 500000 is a FINDING (the unbounded-payload guard); the boundary 500000 stays green", () => {
    const fat = classifyAudit("accent-volume-dark-mobile-sweep", { ...s44Envelope(), api: {
      "/api/tasks": { ms: 400, bytes: 512_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    } });
    expect(fat.green).toBe(false);
    expect(fat.note).toMatch(/payload/i);
    const boundary = classifyAudit("accent-volume-dark-mobile-sweep", { ...s44Envelope(), api: {
      "/api/tasks": { ms: 400, bytes: 500_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    } });
    expect(boundary.green).toBe(true);
  });

  it("the unknown-audit guard still holds: a misspelled name is a shape-error even with a perfect envelope", () => {
    const v = classifyAudit("accent-volume-dark-mobile-swep", s44Envelope());
    expect(isErr(v)).toBe(true);
  });
});

// --- accent-volume-light-mobile-sweep (S45 — the light × mobile × volume stress)

// The full-shape generator: 7 accents × the 7 volume-affected views navigated
// through the DRAWER (the mobile vehicle — the only vehicle below 1024) at
// 390×844 in LIGHT mode under the S13 volume profile (300 tasks / 200 notes /
// 250 events), with the mobile structural keys (drawerClosed/appBar/
// headingClearance — the S33/S35/S36 family), the per-view interaction keys
// (activeTint/activeLabel — read at the next drawer open, the S40 pendingView
// pattern: the light × mobile × volume cell: S37 proved light × accent at
// mobile at SEED, S40 accent × drawer at SEED light, S43 light × volume at
// DESKTOP, S44 dark × volume at MOBILE) AND the volume keys (nodes/mainNodes/
// longTaskTotal/clickLatencyMs — the S13 measurement family) AND the LIGHT
// detector family (the S43 doctrine: NO flashbulbs — the class exists only in
// dark, light surfaces are by-design on the light canvas; the THREE
// signature-strict light exemptions — the CTA-face white-on-accent + the
// calendar adjacent-month slate-300 day numbers + the yellow priority-pill
// yellow-500; those surfaces are the reference's own design in light).
const S45_ACCENTS = ["violet", "blue", "green", "orange", "pink", "red", "teal"] as const;
// The 7 volume-affected views by DISPLAY labels — the S13 data-volume audit's
// own view set (the views that render task/note/event rows; the other 13 are
// volume-invariant and stay covered by the S36/S37/S40 seed sweeps).
const S45_VIEWS = ["Dashboard", "My Day", "Tasks", "Calendar", "Events", "Notes", "Analytics"];
const S45_TINT = "linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))";

type S45Rec = Record<string, unknown>;

function s45ViewRec(o: S45Rec = {}): S45Rec {
  // The LIGHT family's own record shape: NO flashbulbs key (the flashbulb
  // class exists only in dark — the S43 doctrine).
  return {
    heading: "ok", scrollWidth: 390, drawerClosed: true, appBar: true, headingClearance: true,
    unreadable: [] as unknown[], lowcontrast: [] as unknown[],
    consoleErrors: [] as unknown[],
    activeTint: S45_TINT, activeLabel: "",
    nodes: 4200, mainNodes: 3100, longTaskTotal: 420, clickLatencyMs: 610,
    ...o,
  };
}
function s45DrawerRec(o: S45Rec = {}): S45Rec {
  return { linkCount: 20, unreadable: [] as unknown[], lowcontrast: [] as unknown[], activeView: "Analytics", activeTint: S45_TINT, ...o };
}

/** The full accent-volume-light-mobile envelope: 7 accents × 7 views + the
 *  drawer record per accent at 390×844 light under the S13 volume profile,
 *  with per-view overrides merged in (the activeLabel defaults are filled to
 *  the view's own label — the interaction contract). */
function s45Envelope(viewOverrides: Record<string, Record<string, S45Rec>> = {}): S45Rec {
  const accents: S45Rec = {};
  for (const a of S45_ACCENTS) {
    const views: S45Rec = {};
    for (const v of S45_VIEWS) {
      const base = s45ViewRec(viewOverrides[a]?.[v]);
      if (base.activeLabel === "") base.activeLabel = v; // the interaction contract default
      views[v] = base;
    }
    accents[a] = { applied: a, views, drawer: s45DrawerRec() };
  }
  return {
    source: "accent-volume-light-mobile-sweep", mode: "light",
    viewport: { width: 390, height: 844 },
    volume: { tasks: 300, notes: 200, events: 250 },
    chrome: { sidebarVisible: false, hamburgerVisible: true, drawerNavScrollable: true },
    api: {
      "/api/tasks": { ms: 140, bytes: 190_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    },
    accents, findings: [] as unknown[],
  };
}

describe("classifyAudit accent-volume-light-mobile-sweep (S45 — the light × mobile × volume stress)", () => {
  it("the GREEN shape: 7 accents × 7 volume views navigated through the drawer at 390×844 light under the 300/200/250 profile → green with the swept counts (the LIGHT detector family — NO flashbulbs; the THREE signature-strict light exemptions)", () => {
    const v = classifyAudit("accent-volume-light-mobile-sweep", s45Envelope());
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/49 view renderings/);
    expect(v.note).toMatch(/49 active-tint readings/);
    expect(v.note).toMatch(/7 drawer records/);
    expect(v.note).toMatch(/390×844/);
    expect(v.note).toMatch(/300\/200\/250/);
    expect(v.note).toMatch(/MODE light/);
  });

  it("the ALL-VIEWS guard: an accent map missing ONE volume view reads shape-error — a view that silently did not run must never read green-by-omission", () => {
    const env = s45Envelope() as { accents: Record<string, { views: Record<string, unknown> }> };
    delete env.accents.violet.views.Tasks;
    const v = classifyAudit("accent-volume-light-mobile-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the ALL-ACCENTS guard: the accents map missing ONE accent reads shape-error", () => {
    const env = s45Envelope() as { accents: Record<string, unknown> };
    delete env.accents.red;
    const v = classifyAudit("accent-volume-light-mobile-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the historical S13-shape envelope (the data-volume audit's own flat findings/nonGaps shape — the exact pre-S45 state) reads shape-error, never green-by-resemblance", () => {
    const s13Shape = {
      source: "data-volume-audit", findings: [], nonGaps: [{ surface: "Tasks render", longTaskTotal: 400 }],
      inserted: { tasks: 300, notes: 200, events: 250 },
    };
    const v = classifyAudit("accent-volume-light-mobile-sweep", s13Shape);
    expect(isErr(v)).toBe(true);
  });

  it("the historical S42 DARK DESKTOP envelope (viewport 1280×800) reads shape-error here — the viewport is this seam's own contract (the S42/S43 desktop pair own 1280×800; this seam owns 390×844)", () => {
    const v = classifyAudit("accent-volume-light-mobile-sweep", s42Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S43 LIGHT DESKTOP envelope (viewport 1280×800) reads shape-error here — the same viewport guard", () => {
    const v = classifyAudit("accent-volume-light-mobile-sweep", s43Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S44 DARK MOBILE envelope reads NON-green here via the mode rot — the same 390×844 cell, the MODE is the discriminator (the dark half is the S44 audit's own contract; this seam owns the light half)", () => {
    const v = classifyAudit("accent-volume-light-mobile-sweep", s44Envelope());
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=dark/);
  });

  it("the volume contract is part of the shape: an envelope without volume reads shape-error", () => {
    const env = s45Envelope() as Record<string, unknown>;
    delete env.volume;
    const v = classifyAudit("accent-volume-light-mobile-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the missing drawer record reads shape-error (the drawer is part of the per-accent contract — the mobile vehicle's own rendering)", () => {
    const env = s45Envelope() as { accents: Record<string, Record<string, unknown>> };
    delete (env.accents.pink as Record<string, unknown>).drawer;
    const v = classifyAudit("accent-volume-light-mobile-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("mode is part of the contract: an envelope without mode reads shape-error", () => {
    const env = s45Envelope() as Record<string, unknown>;
    delete env.mode;
    const v = classifyAudit("accent-volume-light-mobile-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the viewport guard: the 1280×800 desktop, 768×1024 mid-band, AND 844×390 landscape envelopes fed here read shape-error, never a silent re-scope (the sibling families own those surfaces)", () => {
    const desktop = classifyAudit("accent-volume-light-mobile-sweep", { ...s45Envelope(), viewport: { width: 1280, height: 800 } });
    expect(isErr(desktop)).toBe(true);
    const midband = classifyAudit("accent-volume-light-mobile-sweep", { ...s45Envelope(), viewport: { width: 768, height: 1024 } });
    expect(isErr(midband)).toBe(true);
    const landscape = classifyAudit("accent-volume-light-mobile-sweep", { ...s45Envelope(), viewport: { width: 844, height: 390 } });
    expect(isErr(landscape)).toBe(true);
  });

  it("the mode rot guard: mode=dark reads NON-green (the dark × mobile × volume family is the S44 audit's contract — this seam owns the LIGHT half)", () => {
    const v = classifyAudit("accent-volume-light-mobile-sweep", { ...s45Envelope(), mode: "dark" });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=dark/);
  });

  it("the volume rot guard: a seed-volume envelope (tasks 0) reads NON-green — the sweep measured the wrong density and must never read green (the S38 omission-means-clean retirement, applied to the volume axis)", () => {
    const v = classifyAudit("accent-volume-light-mobile-sweep", { ...s45Envelope(), volume: { tasks: 0, notes: 200, events: 250 } });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/volume/);
  });

  it("the volume rot guard: each leg of the profile is pinned — notes 199 and events 0 each read NON-green", () => {
    const notes = classifyAudit("accent-volume-light-mobile-sweep", { ...s45Envelope(), volume: { tasks: 300, notes: 199, events: 250 } });
    expect(notes.green).toBe(false);
    expect(notes.note).toMatch(/volume/);
    const events = classifyAudit("accent-volume-light-mobile-sweep", { ...s45Envelope(), volume: { tasks: 300, notes: 200, events: 0 } });
    expect(events.green).toBe(false);
    expect(events.note).toMatch(/volume/);
  });

  it("the applied-mismatch family: an accent whose self-verified reading differs from its key is a finding", () => {
    const env = s45Envelope() as { accents: Record<string, Record<string, unknown>> };
    (env.accents.teal as Record<string, unknown>).applied = "violet";
    const v = classifyAudit("accent-volume-light-mobile-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the MOBILE vehicle-contract family (the INVERSE of the desktop seams): a VISIBLE sidebar at 390 is the finding class (the sidebar is hidden lg:flex — below 1024 the drawer is the only vehicle), and a HIDDEN hamburger is the same class (the app bar's hamburger is the vehicle's handle)", () => {
    const sidebar = classifyAudit("accent-volume-light-mobile-sweep", { ...s45Envelope(), chrome: { sidebarVisible: true, hamburgerVisible: true, drawerNavScrollable: true } });
    expect(sidebar.green).toBe(false);
    expect(sidebar.note).toMatch(/vehicle/i);
    const burger = classifyAudit("accent-volume-light-mobile-sweep", { ...s45Envelope(), chrome: { sidebarVisible: false, hamburgerVisible: false, drawerNavScrollable: true } });
    expect(burger.green).toBe(false);
    expect(burger.note).toMatch(/vehicle/i);
  });

  it("the drawer-nav-scroll family: drawerNavScrollable=false is the finding class (at 844 height the 20 nav rows cannot fit the ~700px nav area — the nav's scroll is the only path to links ~14–20)", () => {
    const v = classifyAudit("accent-volume-light-mobile-sweep", { ...s45Envelope(), chrome: { sidebarVisible: false, hamburgerVisible: true, drawerNavScrollable: false } });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/drawerNavScrollable|scroll/i);
  });

  it("the tint-rot family: an activeTint that computed to none is a FINDING (the S8 no-var rot class — the NAV_ACTIVE_GRADIENT_STOPS pair did not resolve at volume)", () => {
    const v = classifyAudit("accent-volume-light-mobile-sweep", s45Envelope({ green: { Notes: { activeTint: "none" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/active-link gradient/);
  });

  it("the interaction family: an activeLabel that does not equal the view's own label is a FINDING (the active state did not follow the navigation — the light × mobile × volume interaction cell)", () => {
    const v = classifyAudit("accent-volume-light-mobile-sweep", s45Envelope({ blue: { Tasks: { activeLabel: "Dashboard" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/did not follow the navigation/);
  });

  it("the overflow family: scrollWidth > 390 is a finding (the S16 mobile-only-gap class — a 300-row list must never widen the 390px document)", () => {
    const v = classifyAudit("accent-volume-light-mobile-sweep", s45Envelope({ orange: { Tasks: { scrollWidth: 410 } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the structural mobile family: a drawer that did not close on navigation, a missing app bar, and a heading under the fixed bar are each findings (the S33/S35/S36 structural contracts at volume)", () => {
    const stuck = classifyAudit("accent-volume-light-mobile-sweep", s45Envelope({ violet: { Tasks: { drawerClosed: false } } }));
    expect(stuck.green).toBe(false);
    expect(stuck.findings).toBe(1);
    expect(stuck.note).toMatch(/drawer/i);
    const noBar = classifyAudit("accent-volume-light-mobile-sweep", s45Envelope({ blue: { Events: { appBar: false } } }));
    expect(noBar.green).toBe(false);
    expect(noBar.findings).toBe(1);
    expect(noBar.note).toMatch(/app bar/i);
    const under = classifyAudit("accent-volume-light-mobile-sweep", s45Envelope({ teal: { Notes: { headingClearance: false } } }));
    expect(under.green).toBe(false);
    expect(under.findings).toBe(1);
    expect(under.note).toMatch(/clearance/i);
  });

  it("the S13 B3 volume budget: longTaskTotal > 1500 per view is a FINDING (main-thread blocking under stress); the boundary value 1500 stays green", () => {
    const hot = classifyAudit("accent-volume-light-mobile-sweep", s45Envelope({ violet: { Tasks: { longTaskTotal: 1600 } } }));
    expect(hot.green).toBe(false);
    expect(hot.findings).toBe(1);
    expect(hot.note).toMatch(/long-task/i);
    const boundary = classifyAudit("accent-volume-light-mobile-sweep", s45Envelope({ violet: { Tasks: { longTaskTotal: 1500 } } }));
    expect(boundary.green).toBe(true);
  });

  it("the S13 B2 volume budget: clickLatencyMs > 1500 per view is a FINDING (the drawer-click → heading path — nav interactivity under stress); the boundary value 1500 stays green", () => {
    const hot = classifyAudit("accent-volume-light-mobile-sweep", s45Envelope({ teal: { Events: { clickLatencyMs: 1600 } } }));
    expect(hot.green).toBe(false);
    expect(hot.findings).toBe(1);
    expect(hot.note).toMatch(/click/i);
    const boundary = classifyAudit("accent-volume-light-mobile-sweep", s45Envelope({ teal: { Events: { clickLatencyMs: 1500 } } }));
    expect(boundary.green).toBe(true);
  });

  it("the strict record shape: a view record missing longTaskTotal reads shape-error (the volume measurement is part of the record)", () => {
    const env = s45Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.red.views.Tasks.longTaskTotal;
    const v = classifyAudit("accent-volume-light-mobile-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the strict record shape: a view record missing clickLatencyMs reads shape-error", () => {
    const env = s45Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.violet.views.Calendar.clickLatencyMs;
    const v = classifyAudit("accent-volume-light-mobile-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the LIGHT shape carries NO flashbulbs family: the sibling S44 dark envelope with mode=light reads GREEN here (its extra dark-only flashbulbs keys ride along — the shape checks required keys; the flashbulb class is dark-only and never fires in light)", () => {
    const v = classifyAudit("accent-volume-light-mobile-sweep", { ...s44Envelope(), mode: "light" });
    expect(v.green).toBe(true);
  });

  it("the drawer-error family: a drawer record carrying an error is a FINDING (never a swallow)", () => {
    const env = s45Envelope() as { accents: Record<string, { drawer: Record<string, unknown> }> };
    env.accents.blue.drawer = { linkCount: 0, unreadable: [], lowcontrast: [], activeView: null, activeTint: null, error: "TypeError: Cannot read properties of null" };
    const v = classifyAudit("accent-volume-light-mobile-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the drawer link census: linkCount !== 20 is a finding (the navigation census broke — the drawer always carries all 20 links)", () => {
    const env = s45Envelope() as { accents: Record<string, { drawer: Record<string, unknown> }> };
    env.accents.orange.drawer = { linkCount: 19, unreadable: [], lowcontrast: [], activeView: "Analytics", activeTint: S45_TINT };
    const v = classifyAudit("accent-volume-light-mobile-sweep", env);
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/19|link/i);
  });

  it("the counting semantics: a non-exempt unreadable entry with an EMPTY findings array still reads NON-green (the independent counting doctrine)", () => {
    const env = s45Envelope({ teal: { Analytics: { unreadable: [
      { text: "streak", color: "rgb(148, 163, 184)", contrast: 1.9 },
    ] } } });
    const v = classifyAudit("accent-volume-light-mobile-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the CTA-face exemption is SIGNATURE-STRICT: white-on-accent rides the note; a non-white unreadable text still counts", () => {
    const exempt = classifyAudit("accent-volume-light-mobile-sweep", s45Envelope({ violet: { Dashboard: { unreadable: [
      { text: "New Task", color: "rgb(255, 255, 255)", contrast: 2.1 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/1 CTA-face/);
    const other = classifyAudit("accent-volume-light-mobile-sweep", s45Envelope({ violet: { Dashboard: { unreadable: [
      { text: "STRESS-S45-task 42", color: "rgb(100, 116, 139)", contrast: 1.8 },
    ] } } }));
    expect(other.green).toBe(false);
    expect(other.findings).toBe(1);
  });

  it("the calendar adjacent-day exemption is SIGNATURE-STRICT: slate-300 1–2-digit day numbers ride the note; a slate-300 NON-day text still counts", () => {
    const exempt = classifyAudit("accent-volume-light-mobile-sweep", s45Envelope({ pink: { Calendar: { unreadable: [
      { text: "27", color: "rgb(203, 213, 225)", contrast: 1.6 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/1 calendar-day/);
    const other = classifyAudit("accent-volume-light-mobile-sweep", s45Envelope({ pink: { Calendar: { unreadable: [
      { text: "Notes", color: "rgb(203, 213, 225)", contrast: 1.6 },
    ] } } }));
    expect(other.green).toBe(false);
    expect(other.findings).toBe(1);
  });

  it("the yellow priority-pill exemption is SIGNATURE-STRICT: yellow-500 high/medium/low rides the note; a yellow-400 pill of the same shape still counts (the wrong shade is not the signature)", () => {
    const exempt = classifyAudit("accent-volume-light-mobile-sweep", s45Envelope({ green: { Tasks: { unreadable: [
      { text: "high", color: "rgb(234, 179, 8)", contrast: 2.0 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/1 yellow-pill/);
    const other = classifyAudit("accent-volume-light-mobile-sweep", s45Envelope({ green: { Tasks: { unreadable: [
      { text: "high", color: "rgb(250, 204, 21)", contrast: 2.0 },
    ] } } }));
    expect(other.green).toBe(false);
    expect(other.findings).toBe(1);
  });

  it("the lowcontrast WARN family rides the note, never the findings (the S11 non-gap family)", () => {
    const env = s45Envelope({ green: { Notes: { lowcontrast: [
      { text: "STRESS-S45-note 7", color: "rgb(167, 139, 250)", contrast: 3.07 },
    ] } } });
    const v = classifyAudit("accent-volume-light-mobile-sweep", env);
    expect(v.green).toBe(true);
    expect(v.note).toMatch(/1 WARN/);
  });

  it("the S13 B1 API bound: /api/tasks bytes > 500000 is a FINDING (the unbounded-payload guard); the boundary 500000 stays green", () => {
    const fat = classifyAudit("accent-volume-light-mobile-sweep", { ...s45Envelope(), api: {
      "/api/tasks": { ms: 400, bytes: 512_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    } });
    expect(fat.green).toBe(false);
    expect(fat.note).toMatch(/payload/i);
    const boundary = classifyAudit("accent-volume-light-mobile-sweep", { ...s45Envelope(), api: {
      "/api/tasks": { ms: 400, bytes: 500_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    } });
    expect(boundary.green).toBe(true);
  });

  it("the unknown-audit guard still holds: a misspelled name is a shape-error even with a perfect envelope", () => {
    const v = classifyAudit("accent-volume-light-mobile-swep", s45Envelope());
    expect(isErr(v)).toBe(true);
  });
});

// --- S46: the dark × mid-band × volume stress ------------------------------------
// The s46 envelope generator's record shape: the S44/S45 mobile-volume
// family re-anchored to the MID-BAND viewport (768×1024, the md breakpoint —
// the S34/S39 mid-band class): the per-view records carry the mid-band
// structural family (drawerClosed/appBar/headingClearance — the below-lg
// chrome is IDENTICAL at 768: the fixed glass app bar + the pt-20 offset)
// AND the volume keys (nodes/mainNodes/longTaskTotal/clickLatencyMs — the
// S13 measurement family) AND the DARK detector family
// (flashbulbs/unreadable/lowcontrast — the S38/S42/S44 dark doctrine:
// flashbulbs are ALWAYS findings; the unreadable CTA-face exemption ONLY —
// the calendar-day and yellow-pill light exemptions do NOT apply in dark,
// those surfaces re-theme). The drawer-own nav-scroll contract at the
// mid-band geometry: the nav scrollHeight ~1068 vs the ~934px clientHeight
// at 1024 height (the 1024 viewport minus the ~90px brand header) — the nav
// MUST scroll; links ~17–20 sit below the fold.
const S46_ACCENTS = ["violet", "blue", "green", "orange", "pink", "red", "teal"] as const;
// The 7 volume-affected views by DISPLAY labels — the S13 data-volume
// audit's own view set (the views that render task/note/event rows; the
// other 13 are volume-invariant and stay covered by the S34/S39 seed
// sweeps).
const S46_VIEWS = ["Dashboard", "My Day", "Tasks", "Calendar", "Events", "Notes", "Analytics"];
const S46_TINT = "linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))";

type S46Rec = Record<string, unknown>;

function s46ViewRec(o: S46Rec = {}): S46Rec {
  return {
    heading: "ok", scrollWidth: 768, drawerClosed: true, appBar: true, headingClearance: true,
    flashbulbs: [] as unknown[], unreadable: [] as unknown[], lowcontrast: [] as unknown[],
    consoleErrors: [] as unknown[],
    activeTint: S46_TINT, activeLabel: "",
    nodes: 4200, mainNodes: 3100, longTaskTotal: 420, clickLatencyMs: 610,
    ...o,
  };
}
function s46DrawerRec(o: S46Rec = {}): S46Rec {
  return { linkCount: 20, flashbulbs: [] as unknown[], unreadable: [] as unknown[], lowcontrast: [] as unknown[], activeView: "Analytics", activeTint: S46_TINT, ...o };
}

/** The full accent-volume-dark-midband envelope: 7 accents × 7 views + the
 *  drawer record per accent at 768×1024 dark under the S13 volume profile,
 *  with per-view overrides merged in (the activeLabel defaults are filled to
 *  the view's own label — the interaction contract). */
function s46Envelope(viewOverrides: Record<string, Record<string, S46Rec>> = {}): S46Rec {
  const accents: S46Rec = {};
  for (const a of S46_ACCENTS) {
    const views: S46Rec = {};
    for (const v of S46_VIEWS) {
      const base = s46ViewRec(viewOverrides[a]?.[v]);
      if (base.activeLabel === "") base.activeLabel = v; // the interaction contract default
      views[v] = base;
    }
    accents[a] = { applied: a, views, drawer: s46DrawerRec() };
  }
  return {
    source: "accent-volume-dark-midband-sweep", mode: "dark",
    viewport: { width: 768, height: 1024 },
    volume: { tasks: 300, notes: 200, events: 250 },
    chrome: { sidebarVisible: false, hamburgerVisible: true, drawerNavScrollable: true },
    api: {
      "/api/tasks": { ms: 140, bytes: 190_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    },
    accents, findings: [] as unknown[],
  };
}

describe("classifyAudit accent-volume-dark-midband-sweep (S46 — the dark × mid-band × volume stress)", () => {
  it("the GREEN shape: 7 accents × 7 volume views navigated through the drawer at 768×1024 dark under the 300/200/250 profile → green with the swept counts (the dark detector family — flashbulbs + the CTA-face-only exemption)", () => {
    const v = classifyAudit("accent-volume-dark-midband-sweep", s46Envelope());
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/49 view renderings/);
    expect(v.note).toMatch(/49 active-tint readings/);
    expect(v.note).toMatch(/7 drawer records/);
    expect(v.note).toMatch(/768×1024/);
    expect(v.note).toMatch(/300\/200\/250/);
    expect(v.note).toMatch(/MODE dark/);
  });

  it("the ALL-VIEWS guard: an accent map missing ONE volume view reads shape-error — a view that silently did not run must never read green-by-omission", () => {
    const env = s46Envelope() as { accents: Record<string, { views: Record<string, unknown> }> };
    delete env.accents.violet.views.Tasks;
    const v = classifyAudit("accent-volume-dark-midband-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the ALL-ACCENTS guard: the accents map missing ONE accent reads shape-error", () => {
    const env = s46Envelope() as { accents: Record<string, unknown> };
    delete env.accents.red;
    const v = classifyAudit("accent-volume-dark-midband-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the historical S13-shape envelope (the data-volume audit's own flat findings/nonGaps shape — the exact pre-S46 state) reads shape-error, never green-by-resemblance", () => {
    const s13Shape = {
      source: "data-volume-audit", findings: [], nonGaps: [{ surface: "Tasks render", longTaskTotal: 400 }],
      inserted: { tasks: 300, notes: 200, events: 250 },
    };
    const v = classifyAudit("accent-volume-dark-midband-sweep", s13Shape);
    expect(isErr(v)).toBe(true);
  });

  it("the historical S42 DARK DESKTOP envelope (viewport 1280×800) reads shape-error here — the viewport is this seam's own contract (the S42/S43 desktop pair own 1280×800; this seam owns 768×1024)", () => {
    const v = classifyAudit("accent-volume-dark-midband-sweep", s42Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S43 LIGHT DESKTOP envelope (viewport 1280×800) reads shape-error here — the same viewport guard", () => {
    const v = classifyAudit("accent-volume-dark-midband-sweep", s43Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S44 DARK MOBILE envelope (viewport 390×844) reads shape-error here — the mobile pair own 390×844; this seam owns the mid-band 768×1024", () => {
    const v = classifyAudit("accent-volume-dark-midband-sweep", s44Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S45 LIGHT MOBILE envelope (viewport 390×844) reads shape-error here — the same viewport guard", () => {
    const v = classifyAudit("accent-volume-dark-midband-sweep", s45Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the S44 dark envelope re-scoped to 768×1024 reads GREEN here — the same dark family shape (the seams discriminate on the VIEWPORT, not the shape: the mobile sibling owns 390×844, this seam owns 768×1024)", () => {
    const v = classifyAudit("accent-volume-dark-midband-sweep", { ...s44Envelope(), viewport: { width: 768, height: 1024 } });
    expect(v.green).toBe(true);
  });

  it("the volume contract is part of the shape: an envelope without volume reads shape-error", () => {
    const env = s46Envelope() as Record<string, unknown>;
    delete env.volume;
    const v = classifyAudit("accent-volume-dark-midband-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the missing drawer record reads shape-error (the drawer is part of the per-accent contract — the mid-band vehicle's own rendering)", () => {
    const env = s46Envelope() as { accents: Record<string, Record<string, unknown>> };
    delete (env.accents.pink as Record<string, unknown>).drawer;
    const v = classifyAudit("accent-volume-dark-midband-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("mode is part of the contract: an envelope without mode reads shape-error", () => {
    const env = s46Envelope() as Record<string, unknown>;
    delete env.mode;
    const v = classifyAudit("accent-volume-dark-midband-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the viewport guard: the 1280×800 desktop, 390×844 mobile, AND 844×390 landscape envelopes fed here read shape-error, never a silent re-scope (the sibling families own those surfaces)", () => {
    const desktop = classifyAudit("accent-volume-dark-midband-sweep", { ...s46Envelope(), viewport: { width: 1280, height: 800 } });
    expect(isErr(desktop)).toBe(true);
    const mobile = classifyAudit("accent-volume-dark-midband-sweep", { ...s46Envelope(), viewport: { width: 390, height: 844 } });
    expect(isErr(mobile)).toBe(true);
    const landscape = classifyAudit("accent-volume-dark-midband-sweep", { ...s46Envelope(), viewport: { width: 844, height: 390 } });
    expect(isErr(landscape)).toBe(true);
  });

  it("the mode rot guard: mode=light reads NON-green (the light × mid-band × volume family is the documented future cross-axis candidate — this seam owns the DARK half)", () => {
    const v = classifyAudit("accent-volume-dark-midband-sweep", { ...s46Envelope(), mode: "light" });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=light/);
  });

  it("the volume rot guard: a seed-volume envelope (tasks 0) reads NON-green — the sweep measured the wrong density and must never read green (the S38 omission-means-clean retirement, applied to the volume axis)", () => {
    const v = classifyAudit("accent-volume-dark-midband-sweep", { ...s46Envelope(), volume: { tasks: 0, notes: 200, events: 250 } });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/volume/);
  });

  it("the volume rot guard: each leg of the profile is pinned — notes 199 and events 0 each read NON-green", () => {
    const notes = classifyAudit("accent-volume-dark-midband-sweep", { ...s46Envelope(), volume: { tasks: 300, notes: 199, events: 250 } });
    expect(notes.green).toBe(false);
    expect(notes.note).toMatch(/volume/);
    const events = classifyAudit("accent-volume-dark-midband-sweep", { ...s46Envelope(), volume: { tasks: 300, notes: 200, events: 0 } });
    expect(events.green).toBe(false);
    expect(events.note).toMatch(/volume/);
  });

  it("the applied-mismatch family: an accent whose self-verified reading differs from its key is a finding", () => {
    const env = s46Envelope() as { accents: Record<string, Record<string, unknown>> };
    (env.accents.teal as Record<string, unknown>).applied = "violet";
    const v = classifyAudit("accent-volume-dark-midband-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the MID-BAND vehicle-contract family (the below-lg contract, the S34/S39 mid-band doctrine at volume): a VISIBLE sidebar at 768 is the finding class (the sidebar is hidden lg:flex — below 1024 the drawer is the only vehicle), and a HIDDEN hamburger is the same class (the app bar's hamburger is the vehicle's handle)", () => {
    const sidebar = classifyAudit("accent-volume-dark-midband-sweep", { ...s46Envelope(), chrome: { sidebarVisible: true, hamburgerVisible: true, drawerNavScrollable: true } });
    expect(sidebar.green).toBe(false);
    expect(sidebar.note).toMatch(/vehicle/i);
    const burger = classifyAudit("accent-volume-dark-midband-sweep", { ...s46Envelope(), chrome: { sidebarVisible: false, hamburgerVisible: false, drawerNavScrollable: true } });
    expect(burger.green).toBe(false);
    expect(burger.note).toMatch(/vehicle/i);
  });

  it("the drawer-nav-scroll family: drawerNavScrollable=false is the finding class (at 1024 height the 20 nav rows measure scrollHeight ~1068 vs the ~934px nav area — links ~17–20 sit below the fold; the nav's scroll is the only path to them, the S44/S45 contract carried to the mid-band geometry)", () => {
    const v = classifyAudit("accent-volume-dark-midband-sweep", { ...s46Envelope(), chrome: { sidebarVisible: false, hamburgerVisible: true, drawerNavScrollable: false } });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/drawerNavScrollable|scroll/i);
  });

  it("the tint-rot family: an activeTint that computed to none is a FINDING (the S8 no-var rot class — the NAV_ACTIVE_GRADIENT_STOPS pair did not resolve at volume)", () => {
    const v = classifyAudit("accent-volume-dark-midband-sweep", s46Envelope({ green: { Notes: { activeTint: "none" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/active-link gradient/);
  });

  it("the interaction family: an activeLabel that does not equal the view's own label is a FINDING (the active state did not follow the navigation — the dark × mid-band × volume interaction cell)", () => {
    const v = classifyAudit("accent-volume-dark-midband-sweep", s46Envelope({ blue: { Tasks: { activeLabel: "Dashboard" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/did not follow the navigation/);
  });

  it("the overflow family: scrollWidth > 768 is a finding (the S16 mobile-only-gap class at the mid-band width — a 300-row list must never widen the 768px document)", () => {
    const v = classifyAudit("accent-volume-dark-midband-sweep", s46Envelope({ orange: { Tasks: { scrollWidth: 778 } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the structural mobile family at the mid-band: a drawer that did not close on navigation, a missing app bar, and a heading under the fixed bar are each findings (the S33/S35/S36 structural contracts at volume — the below-lg chrome is identical at 768)", () => {
    const stuck = classifyAudit("accent-volume-dark-midband-sweep", s46Envelope({ violet: { Tasks: { drawerClosed: false } } }));
    expect(stuck.green).toBe(false);
    expect(stuck.findings).toBe(1);
    expect(stuck.note).toMatch(/drawer/i);
    const noBar = classifyAudit("accent-volume-dark-midband-sweep", s46Envelope({ blue: { Events: { appBar: false } } }));
    expect(noBar.green).toBe(false);
    expect(noBar.findings).toBe(1);
    expect(noBar.note).toMatch(/app bar/i);
    const under = classifyAudit("accent-volume-dark-midband-sweep", s46Envelope({ teal: { Notes: { headingClearance: false } } }));
    expect(under.green).toBe(false);
    expect(under.findings).toBe(1);
    expect(under.note).toMatch(/clearance/i);
  });

  it("the S13 B3 volume budget: longTaskTotal > 1500 per view is a FINDING (main-thread blocking under stress); the boundary value 1500 stays green", () => {
    const hot = classifyAudit("accent-volume-dark-midband-sweep", s46Envelope({ violet: { Tasks: { longTaskTotal: 1600 } } }));
    expect(hot.green).toBe(false);
    expect(hot.findings).toBe(1);
    expect(hot.note).toMatch(/long-task/i);
    const boundary = classifyAudit("accent-volume-dark-midband-sweep", s46Envelope({ violet: { Tasks: { longTaskTotal: 1500 } } }));
    expect(boundary.green).toBe(true);
  });

  it("the S13 B2 volume budget: clickLatencyMs > 1500 per view is a FINDING (the drawer-click → heading path — nav interactivity under stress); the boundary value 1500 stays green", () => {
    const hot = classifyAudit("accent-volume-dark-midband-sweep", s46Envelope({ teal: { Events: { clickLatencyMs: 1600 } } }));
    expect(hot.green).toBe(false);
    expect(hot.findings).toBe(1);
    expect(hot.note).toMatch(/click/i);
    const boundary = classifyAudit("accent-volume-dark-midband-sweep", s46Envelope({ teal: { Events: { clickLatencyMs: 1500 } } }));
    expect(boundary.green).toBe(true);
  });

  it("the strict record shape: a view record missing longTaskTotal reads shape-error (the volume measurement is part of the record)", () => {
    const env = s46Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.red.views.Tasks.longTaskTotal;
    const v = classifyAudit("accent-volume-dark-midband-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the strict record shape: a view record missing clickLatencyMs reads shape-error", () => {
    const env = s46Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.violet.views.Calendar.clickLatencyMs;
    const v = classifyAudit("accent-volume-dark-midband-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the DARK shape carries the flashbulbs family: a flashbulb detection (a light surface on the dark canvas) is ALWAYS a FINDING in dark mode — the S38/S42/S44 doctrine at the mid-band layout", () => {
    const v = classifyAudit("accent-volume-dark-midband-sweep", s46Envelope({ pink: { "My Day": { flashbulbs: [
      { cls: "bg-white rounded-xl", bg: "rgb(255, 255, 255)", tag: "DIV", w: 340, h: 80, text: "light card on the dark canvas" },
    ] } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/flashbulb/i);
  });

  it("the drawer-error family: a drawer record carrying an error is a FINDING (never a swallow)", () => {
    const env = s46Envelope() as { accents: Record<string, { drawer: Record<string, unknown> }> };
    env.accents.blue.drawer = { linkCount: 0, flashbulbs: [], unreadable: [], lowcontrast: [], activeView: null, activeTint: null, error: "TypeError: Cannot read properties of null" };
    const v = classifyAudit("accent-volume-dark-midband-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the drawer link census: linkCount !== 20 is a finding (the navigation census broke — the drawer always carries all 20 links)", () => {
    const env = s46Envelope() as { accents: Record<string, { drawer: Record<string, unknown> }> };
    env.accents.orange.drawer = { linkCount: 19, flashbulbs: [], unreadable: [], lowcontrast: [], activeView: "Analytics", activeTint: S46_TINT };
    const v = classifyAudit("accent-volume-dark-midband-sweep", env);
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/19|link/i);
  });

  it("the counting semantics: a non-exempt unreadable entry with an EMPTY findings array still reads NON-green (the independent counting doctrine)", () => {
    const env = s46Envelope({ teal: { Analytics: { unreadable: [
      { text: "streak", color: "rgb(148, 163, 184)", contrast: 1.9 },
    ] } } });
    const v = classifyAudit("accent-volume-dark-midband-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the CTA-face exemption is SIGNATURE-STRICT: white-on-accent rides the note; a non-white unreadable text still counts", () => {
    const exempt = classifyAudit("accent-volume-dark-midband-sweep", s46Envelope({ violet: { Dashboard: { unreadable: [
      { text: "New Task", color: "rgb(255, 255, 255)", contrast: 2.1 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/1 CTA-face/);
    const other = classifyAudit("accent-volume-dark-midband-sweep", s46Envelope({ violet: { Dashboard: { unreadable: [
      { text: "STRESS-S46-task 42", color: "rgb(100, 116, 139)", contrast: 1.8 },
    ] } } }));
    expect(other.green).toBe(false);
    expect(other.findings).toBe(1);
  });

  it("the DARK doctrine: the light-mode calendar adjacent-day exemption does NOT apply in dark — a slate-300 day number still counts (those surfaces re-theme in dark, the S42/S44 lesson applied to the mid-band)", () => {
    const v = classifyAudit("accent-volume-dark-midband-sweep", s46Envelope({ pink: { Calendar: { unreadable: [
      { text: "27", color: "rgb(203, 213, 225)", contrast: 1.6 },
    ] } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the DARK doctrine: the light-mode yellow priority-pill exemption does NOT apply in dark — a yellow-500 pill still counts (those surfaces re-theme in dark)", () => {
    const v = classifyAudit("accent-volume-dark-midband-sweep", s46Envelope({ green: { Tasks: { unreadable: [
      { text: "high", color: "rgb(234, 179, 8)", contrast: 2.0 },
    ] } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the lowcontrast WARN family rides the note, never the findings (the S11 non-gap family)", () => {
    const env = s46Envelope({ green: { Notes: { lowcontrast: [
      { text: "STRESS-S46-note 7", color: "rgb(167, 139, 250)", contrast: 3.07 },
    ] } } });
    const v = classifyAudit("accent-volume-dark-midband-sweep", env);
    expect(v.green).toBe(true);
    expect(v.note).toMatch(/1 WARN/);
  });

  it("the S13 B1 API bound: /api/tasks bytes > 500000 is a FINDING (the unbounded-payload guard); the boundary 500000 stays green", () => {
    const fat = classifyAudit("accent-volume-dark-midband-sweep", { ...s46Envelope(), api: {
      "/api/tasks": { ms: 400, bytes: 512_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    } });
    expect(fat.green).toBe(false);
    expect(fat.note).toMatch(/payload/i);
    const boundary = classifyAudit("accent-volume-dark-midband-sweep", { ...s46Envelope(), api: {
      "/api/tasks": { ms: 400, bytes: 500_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    } });
    expect(boundary.green).toBe(true);
  });

  it("the unknown-audit guard still holds: a misspelled name is a shape-error even with a perfect envelope", () => {
    const v = classifyAudit("accent-volume-dark-midband-swep", s46Envelope());
    expect(isErr(v)).toBe(true);
  });
});

// --- S47: the light × mid-band × volume stress ------------------------------------
// The S46 dark half's light mirror at the SAME 768×1024 cell (the S46
// summary's own first named next candidate — the S47 mirror): the LIGHT
// family's record shape carries NO flashbulbs key (the flashbulb class
// exists only in dark — the S43/S45 doctrine), and the light checker's
// THREE signature-strict exemptions apply (the CTA-face + the calendar
// adjacent-month slate-300 day + the yellow-500 priority-pill).
const S47_ACCENTS = ["violet", "blue", "green", "orange", "pink", "red", "teal"] as const;
// The 7 volume-affected views by DISPLAY labels — the S13 data-volume
// audit's own view set (the views that render task/note/event rows; the
// other 13 are volume-invariant and stay covered by the S34/S39 seed
// sweeps).
const S47_VIEWS = ["Dashboard", "My Day", "Tasks", "Calendar", "Events", "Notes", "Analytics"];
const S47_TINT = "linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))";

type S47Rec = Record<string, unknown>;

function s47ViewRec(o: S47Rec = {}): S47Rec {
  // The LIGHT family's own record shape: NO flashbulbs key (the flashbulb
  // class exists only in dark — the S43/S45 doctrine).
  return {
    heading: "ok", scrollWidth: 768, drawerClosed: true, appBar: true, headingClearance: true,
    unreadable: [] as unknown[], lowcontrast: [] as unknown[],
    consoleErrors: [] as unknown[],
    activeTint: S47_TINT, activeLabel: "",
    nodes: 4200, mainNodes: 3100, longTaskTotal: 420, clickLatencyMs: 610,
    ...o,
  };
}
function s47DrawerRec(o: S47Rec = {}): S47Rec {
  return { linkCount: 20, unreadable: [] as unknown[], lowcontrast: [] as unknown[], activeView: "Analytics", activeTint: S47_TINT, ...o };
}

/** The full accent-volume-light-midband envelope: 7 accents × 7 views + the
 *  drawer record per accent at 768×1024 LIGHT under the S13 volume profile,
 *  with per-view overrides merged in (the activeLabel defaults are filled to
 *  the view's own label — the interaction contract). */
function s47Envelope(viewOverrides: Record<string, Record<string, S47Rec>> = {}): S47Rec {
  const accents: S47Rec = {};
  for (const a of S47_ACCENTS) {
    const views: S47Rec = {};
    for (const v of S47_VIEWS) {
      const base = s47ViewRec(viewOverrides[a]?.[v]);
      if (base.activeLabel === "") base.activeLabel = v; // the interaction contract default
      views[v] = base;
    }
    accents[a] = { applied: a, views, drawer: s47DrawerRec() };
  }
  return {
    source: "accent-volume-light-midband-sweep", mode: "light",
    viewport: { width: 768, height: 1024 },
    volume: { tasks: 300, notes: 200, events: 250 },
    chrome: { sidebarVisible: false, hamburgerVisible: true, drawerNavScrollable: true },
    api: {
      "/api/tasks": { ms: 140, bytes: 190_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    },
    accents, findings: [] as unknown[],
  };
}

describe("classifyAudit accent-volume-light-midband-sweep (S47 — the light × mid-band × volume stress)", () => {
  it("the GREEN shape: 7 accents × 7 volume views navigated through the drawer at 768×1024 LIGHT under the 300/200/250 profile → green with the swept counts (the LIGHT detector family — NO flashbulbs; the THREE signature-strict light exemptions)", () => {
    const v = classifyAudit("accent-volume-light-midband-sweep", s47Envelope());
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/49 view renderings/);
    expect(v.note).toMatch(/49 active-tint readings/);
    expect(v.note).toMatch(/7 drawer records/);
    expect(v.note).toMatch(/768×1024/);
    expect(v.note).toMatch(/300\/200\/250/);
    expect(v.note).toMatch(/MODE light/);
  });

  it("the ALL-VIEWS guard: an accent map missing ONE volume view reads shape-error — a view that silently did not run must never read green-by-omission", () => {
    const env = s47Envelope() as { accents: Record<string, { views: Record<string, unknown> }> };
    delete env.accents.violet.views.Tasks;
    const v = classifyAudit("accent-volume-light-midband-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the ALL-ACCENTS guard: the accents map missing ONE accent reads shape-error", () => {
    const env = s47Envelope() as { accents: Record<string, unknown> };
    delete env.accents.red;
    const v = classifyAudit("accent-volume-light-midband-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the historical S13-shape envelope (the data-volume audit's own flat findings/nonGaps shape — the exact pre-S47 state) reads shape-error, never green-by-resemblance", () => {
    const s13Shape = {
      source: "data-volume-audit", findings: [], nonGaps: [{ surface: "Tasks render", longTaskTotal: 400 }],
      inserted: { tasks: 300, notes: 200, events: 250 },
    };
    const v = classifyAudit("accent-volume-light-midband-sweep", s13Shape);
    expect(isErr(v)).toBe(true);
  });

  it("the historical S42 DARK DESKTOP envelope (viewport 1280×800) reads shape-error here — the viewport is this seam's own contract (the S42/S43 desktop pair own 1280×800; this seam owns 768×1024)", () => {
    const v = classifyAudit("accent-volume-light-midband-sweep", s42Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S43 LIGHT DESKTOP envelope (viewport 1280×800) reads shape-error here — the same viewport guard", () => {
    const v = classifyAudit("accent-volume-light-midband-sweep", s43Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S44 DARK MOBILE envelope (viewport 390×844) reads shape-error here — the mobile pair own 390×844; this seam owns the mid-band 768×1024", () => {
    const v = classifyAudit("accent-volume-light-midband-sweep", s44Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S45 LIGHT MOBILE envelope (viewport 390×844) reads shape-error here — the same viewport guard", () => {
    const v = classifyAudit("accent-volume-light-midband-sweep", s45Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S46 DARK MIDBAND envelope (768×1024, mode=dark) reads NON-green here via the mode rot — the same mid-band cell, the MODE is the discriminator (the dark half is the S46 audit's own contract; this seam owns the light half)", () => {
    const v = classifyAudit("accent-volume-light-midband-sweep", s46Envelope());
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=dark/);
  });

  it("the S45 light envelope re-scoped to 768×1024 reads GREEN here — the same light family shape (the seams discriminate on the VIEWPORT, not the shape: the mobile sibling owns 390×844, this seam owns 768×1024)", () => {
    const v = classifyAudit("accent-volume-light-midband-sweep", { ...s45Envelope(), viewport: { width: 768, height: 1024 } });
    expect(v.green).toBe(true);
  });

  it("the volume contract is part of the shape: an envelope without volume reads shape-error", () => {
    const env = s47Envelope() as Record<string, unknown>;
    delete env.volume;
    const v = classifyAudit("accent-volume-light-midband-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the missing drawer record reads shape-error (the drawer is part of the per-accent contract — the mid-band vehicle's own rendering)", () => {
    const env = s47Envelope() as { accents: Record<string, Record<string, unknown>> };
    delete (env.accents.pink as Record<string, unknown>).drawer;
    const v = classifyAudit("accent-volume-light-midband-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("mode is part of the contract: an envelope without mode reads shape-error", () => {
    const env = s47Envelope() as Record<string, unknown>;
    delete env.mode;
    const v = classifyAudit("accent-volume-light-midband-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the viewport guard: the 1280×800 desktop, 390×844 mobile, AND 844×390 landscape envelopes fed here read shape-error, never a silent re-scope (the sibling families own those surfaces)", () => {
    const desktop = classifyAudit("accent-volume-light-midband-sweep", { ...s47Envelope(), viewport: { width: 1280, height: 800 } });
    expect(isErr(desktop)).toBe(true);
    const mobile = classifyAudit("accent-volume-light-midband-sweep", { ...s47Envelope(), viewport: { width: 390, height: 844 } });
    expect(isErr(mobile)).toBe(true);
    const landscape = classifyAudit("accent-volume-light-midband-sweep", { ...s47Envelope(), viewport: { width: 844, height: 390 } });
    expect(isErr(landscape)).toBe(true);
  });

  it("the mode rot guard: mode=dark reads NON-green (the dark × mid-band × volume family is the S46 audit's contract — this seam owns the LIGHT half)", () => {
    const v = classifyAudit("accent-volume-light-midband-sweep", { ...s47Envelope(), mode: "dark" });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=dark/);
  });

  it("the volume rot guard: a seed-volume envelope (tasks 0) reads NON-green — the sweep measured the wrong density and must never read green (the S38 omission-means-clean retirement, applied to the volume axis)", () => {
    const v = classifyAudit("accent-volume-light-midband-sweep", { ...s47Envelope(), volume: { tasks: 0, notes: 200, events: 250 } });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/volume/);
  });

  it("the volume rot guard: each leg of the profile is pinned — notes 199 and events 0 each read NON-green", () => {
    const notes = classifyAudit("accent-volume-light-midband-sweep", { ...s47Envelope(), volume: { tasks: 300, notes: 199, events: 250 } });
    expect(notes.green).toBe(false);
    expect(notes.note).toMatch(/volume/);
    const events = classifyAudit("accent-volume-light-midband-sweep", { ...s47Envelope(), volume: { tasks: 300, notes: 200, events: 0 } });
    expect(events.green).toBe(false);
    expect(events.note).toMatch(/volume/);
  });

  it("the applied-mismatch family: an accent whose self-verified reading differs from its key is a finding", () => {
    const env = s47Envelope() as { accents: Record<string, Record<string, unknown>> };
    (env.accents.teal as Record<string, unknown>).applied = "violet";
    const v = classifyAudit("accent-volume-light-midband-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the MID-BAND vehicle-contract family (the below-lg contract, the S34/S39/S46 mid-band doctrine at volume): a VISIBLE sidebar at 768 is the finding class (the sidebar is hidden lg:flex — below 1024 the drawer is the only vehicle), and a HIDDEN hamburger is the same class (the app bar's hamburger is the vehicle's handle)", () => {
    const sidebar = classifyAudit("accent-volume-light-midband-sweep", { ...s47Envelope(), chrome: { sidebarVisible: true, hamburgerVisible: true, drawerNavScrollable: true } });
    expect(sidebar.green).toBe(false);
    expect(sidebar.note).toMatch(/vehicle/i);
    const burger = classifyAudit("accent-volume-light-midband-sweep", { ...s47Envelope(), chrome: { sidebarVisible: false, hamburgerVisible: false, drawerNavScrollable: true } });
    expect(burger.green).toBe(false);
    expect(burger.note).toMatch(/vehicle/i);
  });

  it("the drawer-nav-scroll family: drawerNavScrollable=false is the finding class (at 1024 height the 20 nav rows measure scrollHeight ~1068 vs the ~934px nav area — links ~17–20 sit below the fold; the nav's scroll is the only path to them, the S44/S45/S46 contract carried at the mid-band geometry)", () => {
    const v = classifyAudit("accent-volume-light-midband-sweep", { ...s47Envelope(), chrome: { sidebarVisible: false, hamburgerVisible: true, drawerNavScrollable: false } });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/drawerNavScrollable|scroll/i);
  });

  it("the tint-rot family: an activeTint that computed to none is a FINDING (the S8 no-var rot class — the NAV_ACTIVE_GRADIENT_STOPS pair did not resolve at volume)", () => {
    const v = classifyAudit("accent-volume-light-midband-sweep", s47Envelope({ green: { Notes: { activeTint: "none" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/active-link gradient/);
  });

  it("the interaction family: an activeLabel that does not equal the view's own label is a FINDING (the active state did not follow the navigation — the light × mid-band × volume interaction cell)", () => {
    const v = classifyAudit("accent-volume-light-midband-sweep", s47Envelope({ blue: { Tasks: { activeLabel: "Dashboard" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/did not follow the navigation/);
  });

  it("the overflow family: scrollWidth > 768 is a finding (the S16 mobile-only-gap class at the mid-band width — a 300-row list must never widen the 768px document)", () => {
    const v = classifyAudit("accent-volume-light-midband-sweep", s47Envelope({ orange: { Tasks: { scrollWidth: 778 } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the structural below-lg family at the mid-band: a drawer that did not close on navigation, a missing app bar, and a heading under the fixed bar are each findings (the S33/S35/S36 structural contracts at volume — the below-lg chrome is identical at 768)", () => {
    const stuck = classifyAudit("accent-volume-light-midband-sweep", s47Envelope({ violet: { Tasks: { drawerClosed: false } } }));
    expect(stuck.green).toBe(false);
    expect(stuck.findings).toBe(1);
    expect(stuck.note).toMatch(/drawer/i);
    const noBar = classifyAudit("accent-volume-light-midband-sweep", s47Envelope({ blue: { Events: { appBar: false } } }));
    expect(noBar.green).toBe(false);
    expect(noBar.findings).toBe(1);
    expect(noBar.note).toMatch(/app bar/i);
    const under = classifyAudit("accent-volume-light-midband-sweep", s47Envelope({ teal: { Notes: { headingClearance: false } } }));
    expect(under.green).toBe(false);
    expect(under.findings).toBe(1);
    expect(under.note).toMatch(/clearance/i);
  });

  it("the S13 B3 volume budget: longTaskTotal > 1500 per view is a FINDING (main-thread blocking under stress); the boundary value 1500 stays green", () => {
    const hot = classifyAudit("accent-volume-light-midband-sweep", s47Envelope({ violet: { Tasks: { longTaskTotal: 1600 } } }));
    expect(hot.green).toBe(false);
    expect(hot.findings).toBe(1);
    expect(hot.note).toMatch(/long-task/i);
    const boundary = classifyAudit("accent-volume-light-midband-sweep", s47Envelope({ violet: { Tasks: { longTaskTotal: 1500 } } }));
    expect(boundary.green).toBe(true);
  });

  it("the S13 B2 volume budget: clickLatencyMs > 1500 per view is a FINDING (the drawer-click → heading path — nav interactivity under stress); the boundary value 1500 stays green", () => {
    const hot = classifyAudit("accent-volume-light-midband-sweep", s47Envelope({ teal: { Events: { clickLatencyMs: 1600 } } }));
    expect(hot.green).toBe(false);
    expect(hot.findings).toBe(1);
    expect(hot.note).toMatch(/click/i);
    const boundary = classifyAudit("accent-volume-light-midband-sweep", s47Envelope({ teal: { Events: { clickLatencyMs: 1500 } } }));
    expect(boundary.green).toBe(true);
  });

  it("the strict record shape: a view record missing longTaskTotal reads shape-error (the volume measurement is part of the record)", () => {
    const env = s47Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.red.views.Tasks.longTaskTotal;
    const v = classifyAudit("accent-volume-light-midband-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the strict record shape: a view record missing clickLatencyMs reads shape-error", () => {
    const env = s47Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.violet.views.Calendar.clickLatencyMs;
    const v = classifyAudit("accent-volume-light-midband-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the LIGHT shape carries NO flashbulbs family: the sibling S46 dark envelope with mode=light reads GREEN here (its extra dark-only flashbulbs keys ride along — the shape checks require keys; the flashbulb class is dark-only and never fires in light)", () => {
    const v = classifyAudit("accent-volume-light-midband-sweep", { ...s46Envelope(), mode: "light" });
    expect(v.green).toBe(true);
  });

  it("the drawer-error family: a drawer record carrying an error is a FINDING (never a swallow)", () => {
    const env = s47Envelope() as { accents: Record<string, { drawer: Record<string, unknown> }> };
    env.accents.blue.drawer = { linkCount: 0, unreadable: [], lowcontrast: [], activeView: null, activeTint: null, error: "TypeError: Cannot read properties of null" };
    const v = classifyAudit("accent-volume-light-midband-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the drawer link census: linkCount !== 20 is a finding (the navigation census broke — the drawer always carries all 20 links)", () => {
    const env = s47Envelope() as { accents: Record<string, { drawer: Record<string, unknown> }> };
    env.accents.orange.drawer = { linkCount: 19, unreadable: [], lowcontrast: [], activeView: "Analytics", activeTint: S47_TINT };
    const v = classifyAudit("accent-volume-light-midband-sweep", env);
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/19|link/i);
  });

  it("the counting semantics: a non-exempt unreadable entry with an EMPTY findings array still reads NON-green (the independent counting doctrine)", () => {
    const env = s47Envelope({ teal: { Analytics: { unreadable: [
      { text: "streak", color: "rgb(148, 163, 184)", contrast: 1.9 },
    ] } } });
    const v = classifyAudit("accent-volume-light-midband-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the CTA-face exemption is SIGNATURE-STRICT: white-on-accent rides the note; a non-white unreadable text still counts", () => {
    const exempt = classifyAudit("accent-volume-light-midband-sweep", s47Envelope({ violet: { Dashboard: { unreadable: [
      { text: "New Task", color: "rgb(255, 255, 255)", contrast: 2.1 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/1 CTA-face/);
    const other = classifyAudit("accent-volume-light-midband-sweep", s47Envelope({ violet: { Dashboard: { unreadable: [
      { text: "STRESS-S47-task 42", color: "rgb(100, 116, 139)", contrast: 1.8 },
    ] } } }));
    expect(other.green).toBe(false);
    expect(other.findings).toBe(1);
  });

  it("the calendar adjacent-day exemption is SIGNATURE-STRICT: a slate-300 1–2-digit day number rides the note; a slate-300 NON-day-number text still counts", () => {
    const exempt = classifyAudit("accent-volume-light-midband-sweep", s47Envelope({ pink: { Calendar: { unreadable: [
      { text: "27", color: "rgb(203, 213, 225)", contrast: 1.6 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/1 calendar/);
    const other = classifyAudit("accent-volume-light-midband-sweep", s47Envelope({ pink: { Calendar: { unreadable: [
      { text: "October 2026", color: "rgb(203, 213, 225)", contrast: 1.6 },
    ] } } }));
    expect(other.green).toBe(false);
    expect(other.findings).toBe(1);
  });

  it("the yellow priority-pill exemption is SIGNATURE-STRICT: a yellow-500 high/medium/low pill rides the note; a yellow-500 non-pill text still counts", () => {
    const exempt = classifyAudit("accent-volume-light-midband-sweep", s47Envelope({ green: { Tasks: { unreadable: [
      { text: "high", color: "rgb(234, 179, 8)", contrast: 2.0 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/1 yellow-pill/);
    const other = classifyAudit("accent-volume-light-midband-sweep", s47Envelope({ green: { Tasks: { unreadable: [
      { text: "STRESS-S47-task 7", color: "rgb(234, 179, 8)", contrast: 2.0 },
    ] } } }));
    expect(other.green).toBe(false);
    expect(other.findings).toBe(1);
  });

  it("the lowcontrast WARN family rides the note, never the findings (the S11 non-gap family)", () => {
    const env = s47Envelope({ green: { Notes: { lowcontrast: [
      { text: "STRESS-S47-note 7", color: "rgb(167, 139, 250)", contrast: 3.07 },
    ] } } });
    const v = classifyAudit("accent-volume-light-midband-sweep", env);
    expect(v.green).toBe(true);
    expect(v.note).toMatch(/1 WARN/);
  });

  it("the S13 B1 API bound: /api/tasks bytes > 500000 is a FINDING (the unbounded-payload guard); the boundary 500000 stays green", () => {
    const fat = classifyAudit("accent-volume-light-midband-sweep", { ...s47Envelope(), api: {
      "/api/tasks": { ms: 400, bytes: 512_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    } });
    expect(fat.green).toBe(false);
    expect(fat.note).toMatch(/payload/i);
    const boundary = classifyAudit("accent-volume-light-midband-sweep", { ...s47Envelope(), api: {
      "/api/tasks": { ms: 400, bytes: 500_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    } });
    expect(boundary.green).toBe(true);
  });

  it("the unknown-audit guard still holds: a misspelled name is a shape-error even with a perfect envelope", () => {
    const v = classifyAudit("accent-volume-light-midband-swep", s47Envelope());
    expect(isErr(v)).toBe(true);
  });
});

// --- S48: the dark × landscape × volume stress ------------------------------------
// The S44/S46 dark-family shape re-anchored to the LANDSCAPE viewport
// (844×390, the iPhone-class landscape — the 390–430px-tall band's canonical
// width, the LAST viewport band; the S47 summary's own named next candidate):
// the per-view records carry the below-lg structural family
// (drawerClosed/appBar/headingClearance — the fixed glass app bar covers 16%
// of the 390px viewport, so the heading-clearance contract is at its
// tightest) AND the volume keys (nodes/mainNodes/longTaskTotal/
// clickLatencyMs — the S13 measurement family) AND the DARK detector family
// (flashbulbs/unreadable/lowcontrast — the S38/S42/S44/S46 dark doctrine:
// flashbulbs are ALWAYS findings; the unreadable CTA-face exemption ONLY —
// the calendar-day and yellow-pill light exemptions do NOT apply in dark,
// those surfaces re-theme). The drawer-own nav-scroll contract at the
// LANDSCAPE geometry: the nav scrollHeight ~1068 vs the ~301px clientHeight
// at 390 height (the 390 viewport minus the ~89px brand header) — the nav
// MUST scroll; links ~8–20 sit below the fold.
const S48_ACCENTS = ["violet", "blue", "green", "orange", "pink", "red", "teal"] as const;
// The 7 volume-affected views by DISPLAY labels — the S13 data-volume
// audit's own view set (the views that render task/note/event rows; the
// other 13 are volume-invariant and stay covered by the S35/S40 seed
// sweeps).
const S48_VIEWS = ["Dashboard", "My Day", "Tasks", "Calendar", "Events", "Notes", "Analytics"];
const S48_TINT = "linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))";

type S48Rec = Record<string, unknown>;

function s48ViewRec(o: S48Rec = {}): S48Rec {
  return {
    heading: "ok", scrollWidth: 844, drawerClosed: true, appBar: true, headingClearance: true,
    flashbulbs: [] as unknown[], unreadable: [] as unknown[], lowcontrast: [] as unknown[],
    consoleErrors: [] as unknown[],
    activeTint: S48_TINT, activeLabel: "",
    nodes: 4200, mainNodes: 3100, longTaskTotal: 420, clickLatencyMs: 610,
    ...o,
  };
}
function s48DrawerRec(o: S48Rec = {}): S48Rec {
  return { linkCount: 20, flashbulbs: [] as unknown[], unreadable: [] as unknown[], lowcontrast: [] as unknown[], activeView: "Analytics", activeTint: S48_TINT, ...o };
}

/** The full accent-volume-dark-landscape envelope: 7 accents × 7 views + the
 *  drawer record per accent at 844×390 DARK under the S13 volume profile,
 *  with per-view overrides merged in (the activeLabel defaults are filled to
 *  the view's own label — the interaction contract). */
function s48Envelope(viewOverrides: Record<string, Record<string, S48Rec>> = {}): S48Rec {
  const accents: S48Rec = {};
  for (const a of S48_ACCENTS) {
    const views: S48Rec = {};
    for (const v of S48_VIEWS) {
      const base = s48ViewRec(viewOverrides[a]?.[v]);
      if (base.activeLabel === "") base.activeLabel = v; // the interaction contract default
      views[v] = base;
    }
    accents[a] = { applied: a, views, drawer: s48DrawerRec() };
  }
  return {
    source: "accent-volume-dark-landscape-sweep", mode: "dark",
    viewport: { width: 844, height: 390 },
    volume: { tasks: 300, notes: 200, events: 250 },
    chrome: { sidebarVisible: false, hamburgerVisible: true, drawerNavScrollable: true },
    api: {
      "/api/tasks": { ms: 140, bytes: 190_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    },
    accents, findings: [] as unknown[],
  };
}

describe("classifyAudit accent-volume-dark-landscape-sweep (S48 — the dark × landscape × volume stress)", () => {
  it("the GREEN shape: 7 accents × 7 volume views navigated through the drawer at 844×390 dark under the 300/200/250 profile → green with the swept counts (the dark detector family — flashbulbs + the CTA-face-only exemption)", () => {
    const v = classifyAudit("accent-volume-dark-landscape-sweep", s48Envelope());
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/49 view renderings/);
    expect(v.note).toMatch(/49 active-tint readings/);
    expect(v.note).toMatch(/7 drawer records/);
    expect(v.note).toMatch(/844×390/);
    expect(v.note).toMatch(/300\/200\/250/);
    expect(v.note).toMatch(/MODE dark/);
  });

  it("the ALL-VIEWS guard: an accent map missing ONE volume view reads shape-error — a view that silently did not run must never read green-by-omission", () => {
    const env = s48Envelope() as { accents: Record<string, { views: Record<string, unknown> }> };
    delete env.accents.violet.views.Tasks;
    const v = classifyAudit("accent-volume-dark-landscape-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the ALL-ACCENTS guard: the accents map missing ONE accent reads shape-error", () => {
    const env = s48Envelope() as { accents: Record<string, unknown> };
    delete env.accents.red;
    const v = classifyAudit("accent-volume-dark-landscape-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the historical S13-shape envelope (the data-volume audit's own flat findings/nonGaps shape — the exact pre-S48 state) reads shape-error, never green-by-resemblance", () => {
    const s13Shape = {
      source: "data-volume-audit", findings: [], nonGaps: [{ surface: "Tasks render", longTaskTotal: 400 }],
      inserted: { tasks: 300, notes: 200, events: 250 },
    };
    const v = classifyAudit("accent-volume-dark-landscape-sweep", s13Shape);
    expect(isErr(v)).toBe(true);
  });

  it("the historical S42 DARK DESKTOP envelope (viewport 1280×800) reads shape-error here — the viewport is this seam's own contract (the S42/S43 desktop pair own 1280×800; this seam owns 844×390)", () => {
    const v = classifyAudit("accent-volume-dark-landscape-sweep", s42Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S43 LIGHT DESKTOP envelope (viewport 1280×800) reads shape-error here — the same viewport guard", () => {
    const v = classifyAudit("accent-volume-dark-landscape-sweep", s43Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S44 DARK MOBILE envelope (viewport 390×844) reads shape-error here — the mobile pair own 390×844; this seam owns the landscape 844×390 (the TRANSPOSED pair of axes is a different device class)", () => {
    const v = classifyAudit("accent-volume-dark-landscape-sweep", s44Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S45 LIGHT MOBILE envelope (viewport 390×844) reads shape-error here — the same viewport guard (the transposed mobile viewport)", () => {
    const v = classifyAudit("accent-volume-dark-landscape-sweep", s45Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S46 DARK MIDBAND envelope (viewport 768×1024) reads shape-error here — the mid-band pair own 768×1024; this seam owns the landscape 844×390", () => {
    const v = classifyAudit("accent-volume-dark-landscape-sweep", s46Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S47 LIGHT MIDBAND envelope (viewport 768×1024) reads shape-error here — the same viewport guard (the mid-band pair own 768×1024)", () => {
    const v = classifyAudit("accent-volume-dark-landscape-sweep", s47Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the mode discriminator on this very cell: the S44 dark envelope re-scoped to 844×390 with mode=light reads NON-green via the mode rot (the light × landscape × volume family is the documented S49 mirror; this seam owns the dark half — the S44→S45 mirror pattern). NOTE the LIGHT-shaped envelope (the S47 record, NO flashbulbs keys) reads shape-error here instead: the dark seam requires the flashbulbs keys the light family does not carry — the shape is the first guard", () => {
    const v = classifyAudit("accent-volume-dark-landscape-sweep", { ...s44Envelope(), viewport: { width: 844, height: 390 }, mode: "light" });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=light/);
    const lightShape = classifyAudit("accent-volume-dark-landscape-sweep", { ...s47Envelope(), viewport: { width: 844, height: 390 } });
    expect(isErr(lightShape)).toBe(true);
  });

  it("the S44 dark envelope re-scoped to 844×390 reads GREEN here — the same dark family shape (the seams discriminate on the VIEWPORT, not the shape: the mobile sibling owns 390×844, this seam owns 844×390)", () => {
    const v = classifyAudit("accent-volume-dark-landscape-sweep", { ...s44Envelope(), viewport: { width: 844, height: 390 } });
    expect(v.green).toBe(true);
  });

  it("the volume contract is part of the shape: an envelope without volume reads shape-error", () => {
    const env = s48Envelope() as Record<string, unknown>;
    delete env.volume;
    const v = classifyAudit("accent-volume-dark-landscape-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the missing drawer record reads shape-error (the drawer is part of the per-accent contract — the landscape vehicle's own rendering)", () => {
    const env = s48Envelope() as { accents: Record<string, Record<string, unknown>> };
    delete (env.accents.pink as Record<string, unknown>).drawer;
    const v = classifyAudit("accent-volume-dark-landscape-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("mode is part of the contract: an envelope without mode reads shape-error", () => {
    const env = s48Envelope() as Record<string, unknown>;
    delete env.mode;
    const v = classifyAudit("accent-volume-dark-landscape-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the viewport guard: the 1280×800 desktop, 390×844 mobile, AND 768×1024 mid-band envelopes fed here read shape-error, never a silent re-scope (the sibling families own those surfaces; the landscape is the TRANSPOSED 844×390 — BOTH axes)", () => {
    const desktop = classifyAudit("accent-volume-dark-landscape-sweep", { ...s48Envelope(), viewport: { width: 1280, height: 800 } });
    expect(isErr(desktop)).toBe(true);
    const mobile = classifyAudit("accent-volume-dark-landscape-sweep", { ...s48Envelope(), viewport: { width: 390, height: 844 } });
    expect(isErr(mobile)).toBe(true);
    const midband = classifyAudit("accent-volume-dark-landscape-sweep", { ...s48Envelope(), viewport: { width: 768, height: 1024 } });
    expect(isErr(midband)).toBe(true);
  });

  it("the mode rot guard: mode=light reads NON-green (the light × landscape × volume family is the documented S49 mirror — this seam owns the DARK half)", () => {
    const v = classifyAudit("accent-volume-dark-landscape-sweep", { ...s48Envelope(), mode: "light" });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=light/);
  });

  it("the volume rot guard: a seed-volume envelope (tasks 0) reads NON-green — the sweep measured the wrong density and must never read green (the S38 omission-means-clean retirement, applied to the volume axis)", () => {
    const v = classifyAudit("accent-volume-dark-landscape-sweep", { ...s48Envelope(), volume: { tasks: 0, notes: 200, events: 250 } });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/volume/);
  });

  it("the volume rot guard: each leg of the profile is pinned — notes 199 and events 0 each read NON-green", () => {
    const notes = classifyAudit("accent-volume-dark-landscape-sweep", { ...s48Envelope(), volume: { tasks: 300, notes: 199, events: 250 } });
    expect(notes.green).toBe(false);
    expect(notes.note).toMatch(/volume/);
    const events = classifyAudit("accent-volume-dark-landscape-sweep", { ...s48Envelope(), volume: { tasks: 300, notes: 200, events: 0 } });
    expect(events.green).toBe(false);
    expect(events.note).toMatch(/volume/);
  });

  it("the applied-mismatch family: an accent whose self-verified reading differs from its key is a finding", () => {
    const env = s48Envelope() as { accents: Record<string, Record<string, unknown>> };
    (env.accents.teal as Record<string, unknown>).applied = "violet";
    const v = classifyAudit("accent-volume-dark-landscape-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the LANDSCAPE vehicle-contract family (the below-lg contract, the S35/S40 landscape doctrine at volume): a VISIBLE sidebar at 844 is the finding class (the sidebar is hidden lg:flex — below 1024 the drawer is the only vehicle), and a HIDDEN hamburger is the same class (the app bar's hamburger is the vehicle's handle)", () => {
    const sidebar = classifyAudit("accent-volume-dark-landscape-sweep", { ...s48Envelope(), chrome: { sidebarVisible: true, hamburgerVisible: true, drawerNavScrollable: true } });
    expect(sidebar.green).toBe(false);
    expect(sidebar.note).toMatch(/vehicle/i);
    const burger = classifyAudit("accent-volume-dark-landscape-sweep", { ...s48Envelope(), chrome: { sidebarVisible: false, hamburgerVisible: false, drawerNavScrollable: true } });
    expect(burger.green).toBe(false);
    expect(burger.note).toMatch(/vehicle/i);
  });

  it("the drawer-nav-scroll family: drawerNavScrollable=false is the finding class (at 390 height the 20 nav rows measure scrollHeight ~1068 vs the ~301px nav area — links ~8–20 sit below the fold; the nav's scroll is the only path to them, the S35/S40 short-viewport contract at volume)", () => {
    const v = classifyAudit("accent-volume-dark-landscape-sweep", { ...s48Envelope(), chrome: { sidebarVisible: false, hamburgerVisible: true, drawerNavScrollable: false } });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/drawerNavScrollable|scroll/i);
  });

  it("the tint-rot family: an activeTint that computed to none is a FINDING (the S8 no-var rot class — the NAV_ACTIVE_GRADIENT_STOPS pair did not resolve at volume)", () => {
    const v = classifyAudit("accent-volume-dark-landscape-sweep", s48Envelope({ green: { Notes: { activeTint: "none" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/active-link gradient/);
  });

  it("the interaction family: an activeLabel that does not equal the view's own label is a FINDING (the active state did not follow the navigation — the dark × landscape × volume interaction cell)", () => {
    const v = classifyAudit("accent-volume-dark-landscape-sweep", s48Envelope({ blue: { Tasks: { activeLabel: "Dashboard" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/did not follow the navigation/);
  });

  it("the overflow family: scrollWidth > 844 is a finding (the S16 mobile-only-gap class at the landscape width — a 300-row list must never widen the 844px document)", () => {
    const v = classifyAudit("accent-volume-dark-landscape-sweep", s48Envelope({ orange: { Tasks: { scrollWidth: 854 } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the structural below-lg family at the landscape: a drawer that did not close on navigation, a missing app bar, and a heading under the fixed bar are each findings (the S33/S35/S40 structural contracts at volume — the below-lg chrome is identical at 844, the bar 16% of the short viewport)", () => {
    const stuck = classifyAudit("accent-volume-dark-landscape-sweep", s48Envelope({ violet: { Tasks: { drawerClosed: false } } }));
    expect(stuck.green).toBe(false);
    expect(stuck.findings).toBe(1);
    expect(stuck.note).toMatch(/drawer/i);
    const noBar = classifyAudit("accent-volume-dark-landscape-sweep", s48Envelope({ blue: { Events: { appBar: false } } }));
    expect(noBar.green).toBe(false);
    expect(noBar.findings).toBe(1);
    expect(noBar.note).toMatch(/app bar/i);
    const under = classifyAudit("accent-volume-dark-landscape-sweep", s48Envelope({ teal: { Notes: { headingClearance: false } } }));
    expect(under.green).toBe(false);
    expect(under.findings).toBe(1);
    expect(under.note).toMatch(/clearance/i);
  });

  it("the S13 B3 volume budget: longTaskTotal > 1500 per view is a FINDING (main-thread blocking under stress); the boundary value 1500 stays green", () => {
    const hot = classifyAudit("accent-volume-dark-landscape-sweep", s48Envelope({ violet: { Tasks: { longTaskTotal: 1600 } } }));
    expect(hot.green).toBe(false);
    expect(hot.findings).toBe(1);
    expect(hot.note).toMatch(/long-task/i);
    const boundary = classifyAudit("accent-volume-dark-landscape-sweep", s48Envelope({ violet: { Tasks: { longTaskTotal: 1500 } } }));
    expect(boundary.green).toBe(true);
  });

  it("the S13 B2 volume budget: clickLatencyMs > 1500 per view is a FINDING (the drawer-click → heading path — nav interactivity under stress); the boundary value 1500 stays green", () => {
    const hot = classifyAudit("accent-volume-dark-landscape-sweep", s48Envelope({ teal: { Events: { clickLatencyMs: 1600 } } }));
    expect(hot.green).toBe(false);
    expect(hot.findings).toBe(1);
    expect(hot.note).toMatch(/click/i);
    const boundary = classifyAudit("accent-volume-dark-landscape-sweep", s48Envelope({ teal: { Events: { clickLatencyMs: 1500 } } }));
    expect(boundary.green).toBe(true);
  });

  it("the strict record shape: a view record missing longTaskTotal reads shape-error (the volume measurement is part of the record)", () => {
    const env = s48Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.red.views.Tasks.longTaskTotal;
    const v = classifyAudit("accent-volume-dark-landscape-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the strict record shape: a view record missing clickLatencyMs reads shape-error", () => {
    const env = s48Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.violet.views.Calendar.clickLatencyMs;
    const v = classifyAudit("accent-volume-dark-landscape-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the DARK shape carries the flashbulbs family: a flashbulb detection (a light surface on the dark canvas) is ALWAYS a FINDING in dark mode — the S38/S42/S44/S46 doctrine at the landscape layout", () => {
    const v = classifyAudit("accent-volume-dark-landscape-sweep", s48Envelope({ pink: { "My Day": { flashbulbs: [
      { cls: "bg-white rounded-xl", bg: "rgb(255, 255, 255)", tag: "DIV", w: 340, h: 80, text: "light card on the dark canvas" },
    ] } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/flashbulb/i);
  });

  it("the drawer-error family: a drawer record carrying an error is a FINDING (never a swallow)", () => {
    const env = s48Envelope() as { accents: Record<string, { drawer: Record<string, unknown> }> };
    env.accents.blue.drawer = { linkCount: 0, flashbulbs: [], unreadable: [], lowcontrast: [], activeView: null, activeTint: null, error: "TypeError: Cannot read properties of null" };
    const v = classifyAudit("accent-volume-dark-landscape-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the drawer link census: linkCount !== 20 is a finding (the navigation census broke — the drawer always carries all 20 links)", () => {
    const env = s48Envelope() as { accents: Record<string, { drawer: Record<string, unknown> }> };
    env.accents.orange.drawer = { linkCount: 19, flashbulbs: [], unreadable: [], lowcontrast: [], activeView: "Analytics", activeTint: S48_TINT };
    const v = classifyAudit("accent-volume-dark-landscape-sweep", env);
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/19|link/i);
  });

  it("the counting semantics: a non-exempt unreadable entry with an EMPTY findings array still reads NON-green (the independent counting doctrine)", () => {
    const env = s48Envelope({ teal: { Analytics: { unreadable: [
      { text: "streak", color: "rgb(148, 163, 184)", contrast: 1.9 },
    ] } } });
    const v = classifyAudit("accent-volume-dark-landscape-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the CTA-face exemption is SIGNATURE-STRICT: white-on-accent rides the note; a non-white unreadable text still counts", () => {
    const exempt = classifyAudit("accent-volume-dark-landscape-sweep", s48Envelope({ violet: { Dashboard: { unreadable: [
      { text: "New Task", color: "rgb(255, 255, 255)", contrast: 2.1 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/1 CTA-face/);
    const other = classifyAudit("accent-volume-dark-landscape-sweep", s48Envelope({ violet: { Dashboard: { unreadable: [
      { text: "STRESS-S48-task 42", color: "rgb(100, 116, 139)", contrast: 1.8 },
    ] } } }));
    expect(other.green).toBe(false);
    expect(other.findings).toBe(1);
  });

  it("the DARK doctrine: the light-mode calendar adjacent-day exemption does NOT apply in dark — a slate-300 day number still counts (those surfaces re-theme in dark, the S42/S44/S46 lesson applied to the landscape)", () => {
    const v = classifyAudit("accent-volume-dark-landscape-sweep", s48Envelope({ pink: { Calendar: { unreadable: [
      { text: "27", color: "rgb(203, 213, 225)", contrast: 1.6 },
    ] } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the DARK doctrine: the light-mode yellow priority-pill exemption does NOT apply in dark — a yellow-500 pill still counts (those surfaces re-theme in dark)", () => {
    const v = classifyAudit("accent-volume-dark-landscape-sweep", s48Envelope({ green: { Tasks: { unreadable: [
      { text: "high", color: "rgb(234, 179, 8)", contrast: 2.0 },
    ] } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the lowcontrast WARN family rides the note, never the findings (the S11 non-gap family)", () => {
    const env = s48Envelope({ green: { Notes: { lowcontrast: [
      { text: "STRESS-S48-note 7", color: "rgb(167, 139, 250)", contrast: 3.07 },
    ] } } });
    const v = classifyAudit("accent-volume-dark-landscape-sweep", env);
    expect(v.green).toBe(true);
    expect(v.note).toMatch(/1 WARN/);
  });

  it("the S13 B1 API bound: /api/tasks bytes > 500000 is a FINDING (the unbounded-payload guard); the boundary 500000 stays green", () => {
    const fat = classifyAudit("accent-volume-dark-landscape-sweep", { ...s48Envelope(), api: {
      "/api/tasks": { ms: 400, bytes: 512_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    } });
    expect(fat.green).toBe(false);
    expect(fat.note).toMatch(/payload/i);
    const boundary = classifyAudit("accent-volume-dark-landscape-sweep", { ...s48Envelope(), api: {
      "/api/tasks": { ms: 400, bytes: 500_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    } });
    expect(boundary.green).toBe(true);
  });

  it("the unknown-audit guard still holds: a misspelled name is a shape-error even with a perfect envelope", () => {
    const v = classifyAudit("accent-volume-dark-landscape-swep", s48Envelope());
    expect(isErr(v)).toBe(true);
  });
});

// --- S49: the light × landscape × volume stress ------------------------------------
// The S43/S45/S47 light-family shape re-anchored to the LANDSCAPE viewport
// (844×390, the iPhone-class landscape — the 390–430px-tall band's canonical
// width, the LAST viewport band; the S48 summary's own named next candidate —
// the S49 mirror, completing the volume × theme × viewport cross-axis's last
// band): the per-view records carry the below-lg structural family
// (drawerClosed/appBar/headingClearance — the fixed glass app bar covers 16%
// of the 390px viewport, so the heading-clearance contract is at its
// tightest) AND the volume keys (nodes/mainNodes/longTaskTotal/
// clickLatencyMs — the S13 measurement family) AND the LIGHT detector family
// (unreadable/lowcontrast with the THREE signature-strict light exemptions —
// the CTA-face + the calendar adjacent-day + the yellow priority-pill; NO
// flashbulbs: the class exists only in dark, a light surface on the light
// canvas is by-design). The drawer-own nav-scroll contract at the LANDSCAPE
// geometry: the nav scrollHeight ~1068 vs the ~301px clientHeight at 390
// height (the 390 viewport minus the ~89px brand header) — the nav MUST
// scroll; links ~8–20 sit below the fold.
const S49_ACCENTS = ["violet", "blue", "green", "orange", "pink", "red", "teal"] as const;
// The 7 volume-affected views by DISPLAY labels — the S13 data-volume
// audit's own view set (the views that render task/note/event rows; the
// other 13 are volume-invariant and stay covered by the S35/S40 seed
// sweeps).
const S49_VIEWS = ["Dashboard", "My Day", "Tasks", "Calendar", "Events", "Notes", "Analytics"];
const S49_TINT = "linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))";

type S49Rec = Record<string, unknown>;

function s49ViewRec(o: S49Rec = {}): S49Rec {
  return {
    heading: "ok", scrollWidth: 844, drawerClosed: true, appBar: true, headingClearance: true,
    unreadable: [] as unknown[], lowcontrast: [] as unknown[],
    consoleErrors: [] as unknown[],
    activeTint: S49_TINT, activeLabel: "",
    nodes: 4200, mainNodes: 3100, longTaskTotal: 420, clickLatencyMs: 610,
    ...o,
  };
}
function s49DrawerRec(o: S49Rec = {}): S49Rec {
  return { linkCount: 20, unreadable: [] as unknown[], lowcontrast: [] as unknown[], activeView: "Analytics", activeTint: S49_TINT, ...o };
}

/** The full accent-volume-light-landscape envelope: 7 accents × 7 views + the
 *  drawer record per accent at 844×390 LIGHT under the S13 volume profile,
 *  with per-view overrides merged in (the activeLabel defaults are filled to
 *  the view's own label — the interaction contract). */
function s49Envelope(viewOverrides: Record<string, Record<string, S49Rec>> = {}): S49Rec {
  const accents: S49Rec = {};
  for (const a of S49_ACCENTS) {
    const views: S49Rec = {};
    for (const v of S49_VIEWS) {
      const base = s49ViewRec(viewOverrides[a]?.[v]);
      if (base.activeLabel === "") base.activeLabel = v; // the interaction contract default
      views[v] = base;
    }
    accents[a] = { applied: a, views, drawer: s49DrawerRec() };
  }
  return {
    source: "accent-volume-light-landscape-sweep", mode: "light",
    viewport: { width: 844, height: 390 },
    volume: { tasks: 300, notes: 200, events: 250 },
    chrome: { sidebarVisible: false, hamburgerVisible: true, drawerNavScrollable: true },
    api: {
      "/api/tasks": { ms: 140, bytes: 190_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    },
    accents, findings: [] as unknown[],
  };
}

describe("classifyAudit accent-volume-light-landscape-sweep (S49 — the light × landscape × volume stress)", () => {
  it("the GREEN shape: 7 accents × 7 volume views navigated through the drawer at 844×390 light under the 300/200/250 profile → green with the swept counts (the light detector family — NO flashbulbs; the THREE light exemptions)", () => {
    const v = classifyAudit("accent-volume-light-landscape-sweep", s49Envelope());
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/49 view renderings/);
    expect(v.note).toMatch(/49 active-tint readings/);
    expect(v.note).toMatch(/7 drawer records/);
    expect(v.note).toMatch(/844×390/);
    expect(v.note).toMatch(/300\/200\/250/);
    expect(v.note).toMatch(/MODE light/);
  });

  it("the ALL-VIEWS guard: an accent map missing ONE volume view reads shape-error — a view that silently did not run must never read green-by-omission", () => {
    const env = s49Envelope() as { accents: Record<string, { views: Record<string, unknown> }> };
    delete env.accents.violet.views.Tasks;
    const v = classifyAudit("accent-volume-light-landscape-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the ALL-ACCENTS guard: the accents map missing ONE accent reads shape-error", () => {
    const env = s49Envelope() as { accents: Record<string, unknown> };
    delete env.accents.red;
    const v = classifyAudit("accent-volume-light-landscape-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the historical S13-shape envelope (the data-volume audit's own flat findings/nonGaps shape — the exact pre-S49 state) reads shape-error, never green-by-resemblance", () => {
    const s13Shape = {
      source: "data-volume-audit", findings: [], nonGaps: [{ surface: "Tasks render", longTaskTotal: 400 }],
      inserted: { tasks: 300, notes: 200, events: 250 },
    };
    const v = classifyAudit("accent-volume-light-landscape-sweep", s13Shape);
    expect(isErr(v)).toBe(true);
  });

  it("the historical S42 DARK DESKTOP envelope (viewport 1280×800) reads shape-error here — the viewport is this seam's own contract (the S42/S43 desktop pair own 1280×800; this seam owns 844×390)", () => {
    const v = classifyAudit("accent-volume-light-landscape-sweep", s42Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S43 LIGHT DESKTOP envelope (viewport 1280×800) reads shape-error here — the same viewport guard", () => {
    const v = classifyAudit("accent-volume-light-landscape-sweep", s43Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S44 DARK MOBILE envelope (viewport 390×844) reads shape-error here — the mobile pair own 390×844; this seam owns the landscape 844×390 (the TRANSPOSED pair of axes is a different device class)", () => {
    const v = classifyAudit("accent-volume-light-landscape-sweep", s44Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S45 LIGHT MOBILE envelope (viewport 390×844) reads shape-error here — the same viewport guard (the transposed mobile viewport)", () => {
    const v = classifyAudit("accent-volume-light-landscape-sweep", s45Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S46 DARK MIDBAND envelope (viewport 768×1024) reads shape-error here — the mid-band pair own 768×1024; this seam owns the landscape 844×390", () => {
    const v = classifyAudit("accent-volume-light-landscape-sweep", s46Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S47 LIGHT MIDBAND envelope (viewport 768×1024) reads shape-error here — the same viewport guard (the mid-band pair own 768×1024)", () => {
    const v = classifyAudit("accent-volume-light-landscape-sweep", s47Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the mode discriminator on this very cell: the S48 DARK-landscape envelope (already at 844×390, mode=dark) fed here reads NON-green via the mode rot — the mode is the discriminator on this very cell (the S48→S49 mirror pattern; the dark shape is a SUPERSET of the light shape, its extra flashbulbs keys ride along — the shape checks require keys and never reject extras)", () => {
    const v = classifyAudit("accent-volume-light-landscape-sweep", s48Envelope());
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=dark/);
  });

  it("the S45 light mobile envelope re-scoped to 844×390 reads GREEN here — the same light family shape (the seams discriminate on the VIEWPORT, not the shape: the mobile sibling owns 390×844, this seam owns 844×390)", () => {
    const v = classifyAudit("accent-volume-light-landscape-sweep", { ...s45Envelope(), viewport: { width: 844, height: 390 } });
    expect(v.green).toBe(true);
  });

  it("the volume contract is part of the shape: an envelope without volume reads shape-error", () => {
    const env = s49Envelope() as Record<string, unknown>;
    delete env.volume;
    const v = classifyAudit("accent-volume-light-landscape-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the missing drawer record reads shape-error (the drawer is part of the per-accent contract — the landscape vehicle's own rendering)", () => {
    const env = s49Envelope() as { accents: Record<string, Record<string, unknown>> };
    delete (env.accents.pink as Record<string, unknown>).drawer;
    const v = classifyAudit("accent-volume-light-landscape-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("mode is part of the contract: an envelope without mode reads shape-error", () => {
    const env = s49Envelope() as Record<string, unknown>;
    delete env.mode;
    const v = classifyAudit("accent-volume-light-landscape-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the viewport guard: the 1280×800 desktop, 390×844 mobile, AND 768×1024 mid-band envelopes fed here read shape-error, never a silent re-scope (the sibling families own those surfaces; the landscape is the TRANSPOSED 844×390 — BOTH axes)", () => {
    const desktop = classifyAudit("accent-volume-light-landscape-sweep", { ...s49Envelope(), viewport: { width: 1280, height: 800 } });
    expect(isErr(desktop)).toBe(true);
    const mobile = classifyAudit("accent-volume-light-landscape-sweep", { ...s49Envelope(), viewport: { width: 390, height: 844 } });
    expect(isErr(mobile)).toBe(true);
    const midband = classifyAudit("accent-volume-light-landscape-sweep", { ...s49Envelope(), viewport: { width: 768, height: 1024 } });
    expect(isErr(midband)).toBe(true);
  });

  it("the mode rot guard INVERTED: mode=dark reads NON-green (the dark × landscape × volume family is the S48 audit's own — this seam owns the LIGHT half)", () => {
    const v = classifyAudit("accent-volume-light-landscape-sweep", { ...s49Envelope(), mode: "dark" });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=dark/);
  });

  it("the volume rot guard: a seed-volume envelope (tasks 0) reads NON-green — the sweep measured the wrong density and must never read green (the S38 omission-means-clean retirement, applied to the volume axis)", () => {
    const v = classifyAudit("accent-volume-light-landscape-sweep", { ...s49Envelope(), volume: { tasks: 0, notes: 200, events: 250 } });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/volume/);
  });

  it("the volume rot guard: each leg of the profile is pinned — notes 199 and events 0 each read NON-green", () => {
    const notes = classifyAudit("accent-volume-light-landscape-sweep", { ...s49Envelope(), volume: { tasks: 300, notes: 199, events: 250 } });
    expect(notes.green).toBe(false);
    expect(notes.note).toMatch(/volume/);
    const events = classifyAudit("accent-volume-light-landscape-sweep", { ...s49Envelope(), volume: { tasks: 300, notes: 200, events: 0 } });
    expect(events.green).toBe(false);
    expect(events.note).toMatch(/volume/);
  });

  it("the applied-mismatch family: an accent whose self-verified reading differs from its key is a finding", () => {
    const env = s49Envelope() as { accents: Record<string, Record<string, unknown>> };
    (env.accents.teal as Record<string, unknown>).applied = "violet";
    const v = classifyAudit("accent-volume-light-landscape-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the LANDSCAPE vehicle-contract family (the below-lg contract, the S35/S40/S48 landscape doctrine at volume): a VISIBLE sidebar at 844 is the finding class (the sidebar is hidden lg:flex — below 1024 the drawer is the only vehicle), and a HIDDEN hamburger is the same class (the app bar's hamburger is the vehicle's handle)", () => {
    const sidebar = classifyAudit("accent-volume-light-landscape-sweep", { ...s49Envelope(), chrome: { sidebarVisible: true, hamburgerVisible: true, drawerNavScrollable: true } });
    expect(sidebar.green).toBe(false);
    expect(sidebar.note).toMatch(/vehicle/i);
    const burger = classifyAudit("accent-volume-light-landscape-sweep", { ...s49Envelope(), chrome: { sidebarVisible: false, hamburgerVisible: false, drawerNavScrollable: true } });
    expect(burger.green).toBe(false);
    expect(burger.note).toMatch(/vehicle/i);
  });

  it("the drawer-nav-scroll family: drawerNavScrollable=false is the finding class (at 390 height the 20 nav rows measure scrollHeight ~1068 vs the ~301px nav area — links ~8–20 sit below the fold; the nav's scroll is the only path to them, the S35/S40/S48 short-viewport contract at volume)", () => {
    const v = classifyAudit("accent-volume-light-landscape-sweep", { ...s49Envelope(), chrome: { sidebarVisible: false, hamburgerVisible: true, drawerNavScrollable: false } });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/drawerNavScrollable|scroll/i);
  });

  it("the tint-rot family: an activeTint that computed to none is a FINDING (the S8 no-var rot class — the NAV_ACTIVE_GRADIENT_STOPS pair did not resolve at volume)", () => {
    const v = classifyAudit("accent-volume-light-landscape-sweep", s49Envelope({ green: { Notes: { activeTint: "none" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/active-link gradient/);
  });

  it("the interaction family: an activeLabel that does not equal the view's own label is a FINDING (the active state did not follow the navigation — the light × landscape × volume interaction cell)", () => {
    const v = classifyAudit("accent-volume-light-landscape-sweep", s49Envelope({ blue: { Tasks: { activeLabel: "Dashboard" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/did not follow the navigation/);
  });

  it("the overflow family: scrollWidth > 844 is a finding (the S16 mobile-only-gap class at the landscape width — a 300-row list must never widen the 844px document)", () => {
    const v = classifyAudit("accent-volume-light-landscape-sweep", s49Envelope({ orange: { Tasks: { scrollWidth: 854 } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the structural below-lg family at the landscape: a drawer that did not close on navigation, a missing app bar, and a heading under the fixed bar are each findings (the S33/S35/S40 structural contracts at volume — the below-lg chrome is identical at 844, the bar 16% of the short viewport)", () => {
    const stuck = classifyAudit("accent-volume-light-landscape-sweep", s49Envelope({ violet: { Tasks: { drawerClosed: false } } }));
    expect(stuck.green).toBe(false);
    expect(stuck.findings).toBe(1);
    expect(stuck.note).toMatch(/drawer/i);
    const noBar = classifyAudit("accent-volume-light-landscape-sweep", s49Envelope({ blue: { Events: { appBar: false } } }));
    expect(noBar.green).toBe(false);
    expect(noBar.findings).toBe(1);
    expect(noBar.note).toMatch(/app bar/i);
    const under = classifyAudit("accent-volume-light-landscape-sweep", s49Envelope({ teal: { Notes: { headingClearance: false } } }));
    expect(under.green).toBe(false);
    expect(under.findings).toBe(1);
    expect(under.note).toMatch(/clearance/i);
  });

  it("the S13 B3 volume budget: longTaskTotal > 1500 per view is a FINDING (main-thread blocking under stress); the boundary value 1500 stays green", () => {
    const hot = classifyAudit("accent-volume-light-landscape-sweep", s49Envelope({ violet: { Tasks: { longTaskTotal: 1600 } } }));
    expect(hot.green).toBe(false);
    expect(hot.findings).toBe(1);
    expect(hot.note).toMatch(/long-task/i);
    const boundary = classifyAudit("accent-volume-light-landscape-sweep", s49Envelope({ violet: { Tasks: { longTaskTotal: 1500 } } }));
    expect(boundary.green).toBe(true);
  });

  it("the S13 B2 volume budget: clickLatencyMs > 1500 per view is a FINDING (the drawer-click → heading path — nav interactivity under stress); the boundary value 1500 stays green", () => {
    const hot = classifyAudit("accent-volume-light-landscape-sweep", s49Envelope({ teal: { Events: { clickLatencyMs: 1600 } } }));
    expect(hot.green).toBe(false);
    expect(hot.findings).toBe(1);
    expect(hot.note).toMatch(/click/i);
    const boundary = classifyAudit("accent-volume-light-landscape-sweep", s49Envelope({ teal: { Events: { clickLatencyMs: 1500 } } }));
    expect(boundary.green).toBe(true);
  });

  it("the strict record shape: a view record missing longTaskTotal reads shape-error (the volume measurement is part of the record)", () => {
    const env = s49Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.red.views.Tasks.longTaskTotal;
    const v = classifyAudit("accent-volume-light-landscape-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the strict record shape: a view record missing clickLatencyMs reads shape-error", () => {
    const env = s49Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.violet.views.Calendar.clickLatencyMs;
    const v = classifyAudit("accent-volume-light-landscape-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the LIGHT shape carries NO flashbulbs family: the sibling S48 dark envelope with mode=light reads GREEN here (its extra dark-only flashbulbs keys ride along — the shape checks require keys; the flashbulb class is dark-only and never fires in light)", () => {
    const v = classifyAudit("accent-volume-light-landscape-sweep", { ...s48Envelope(), mode: "light" });
    expect(v.green).toBe(true);
  });

  it("the drawer-error family: a drawer record carrying an error is a FINDING (never a swallow)", () => {
    const env = s49Envelope() as { accents: Record<string, { drawer: Record<string, unknown> }> };
    env.accents.blue.drawer = { linkCount: 0, unreadable: [], lowcontrast: [], activeView: null, activeTint: null, error: "TypeError: Cannot read properties of null" };
    const v = classifyAudit("accent-volume-light-landscape-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the drawer link census: linkCount !== 20 is a finding (the navigation census broke — the drawer always carries all 20 links)", () => {
    const env = s49Envelope() as { accents: Record<string, { drawer: Record<string, unknown> }> };
    env.accents.orange.drawer = { linkCount: 19, unreadable: [], lowcontrast: [], activeView: "Analytics", activeTint: S49_TINT };
    const v = classifyAudit("accent-volume-light-landscape-sweep", env);
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/19|link/i);
  });

  it("the counting semantics: a non-exempt unreadable entry with an EMPTY findings array still reads NON-green (the independent counting doctrine)", () => {
    const env = s49Envelope({ teal: { Analytics: { unreadable: [
      { text: "streak", color: "rgb(148, 163, 184)", contrast: 1.9 },
    ] } } });
    const v = classifyAudit("accent-volume-light-landscape-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the CTA-face exemption is SIGNATURE-STRICT: white-on-accent rides the note; a non-white unreadable text still counts", () => {
    const exempt = classifyAudit("accent-volume-light-landscape-sweep", s49Envelope({ violet: { Dashboard: { unreadable: [
      { text: "New Task", color: "rgb(255, 255, 255)", contrast: 2.1 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/1 CTA-face/);
    const other = classifyAudit("accent-volume-light-landscape-sweep", s49Envelope({ violet: { Dashboard: { unreadable: [
      { text: "STRESS-S49-task 42", color: "rgb(100, 116, 139)", contrast: 1.8 },
    ] } } }));
    expect(other.green).toBe(false);
    expect(other.findings).toBe(1);
  });

  it("the calendar adjacent-day exemption is SIGNATURE-STRICT: a slate-300 1–2-digit day number rides the note; a slate-300 NON-day-number text still counts", () => {
    const exempt = classifyAudit("accent-volume-light-landscape-sweep", s49Envelope({ pink: { Calendar: { unreadable: [
      { text: "27", color: "rgb(203, 213, 225)", contrast: 1.6 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/1 calendar/);
    const other = classifyAudit("accent-volume-light-landscape-sweep", s49Envelope({ pink: { Calendar: { unreadable: [
      { text: "October 2026", color: "rgb(203, 213, 225)", contrast: 1.6 },
    ] } } }));
    expect(other.green).toBe(false);
    expect(other.findings).toBe(1);
  });

  it("the yellow priority-pill exemption is SIGNATURE-STRICT: a yellow-500 high/medium/low pill rides the note; a yellow-500 non-pill text still counts", () => {
    const exempt = classifyAudit("accent-volume-light-landscape-sweep", s49Envelope({ green: { Tasks: { unreadable: [
      { text: "high", color: "rgb(234, 179, 8)", contrast: 2.0 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/1 yellow-pill/);
    const other = classifyAudit("accent-volume-light-landscape-sweep", s49Envelope({ green: { Tasks: { unreadable: [
      { text: "STRESS-S49-task 7", color: "rgb(234, 179, 8)", contrast: 2.0 },
    ] } } }));
    expect(other.green).toBe(false);
    expect(other.findings).toBe(1);
  });

  it("the lowcontrast WARN family rides the note, never the findings (the S11 non-gap family)", () => {
    const env = s49Envelope({ green: { Notes: { lowcontrast: [
      { text: "STRESS-S49-note 7", color: "rgb(167, 139, 250)", contrast: 3.07 },
    ] } } });
    const v = classifyAudit("accent-volume-light-landscape-sweep", env);
    expect(v.green).toBe(true);
    expect(v.note).toMatch(/1 WARN/);
  });

  it("the S13 B1 API bound: /api/tasks bytes > 500000 is a FINDING (the unbounded-payload guard); the boundary 500000 stays green", () => {
    const fat = classifyAudit("accent-volume-light-landscape-sweep", { ...s49Envelope(), api: {
      "/api/tasks": { ms: 400, bytes: 512_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    } });
    expect(fat.green).toBe(false);
    expect(fat.note).toMatch(/payload/i);
    const boundary = classifyAudit("accent-volume-light-landscape-sweep", { ...s49Envelope(), api: {
      "/api/tasks": { ms: 400, bytes: 500_000, status: 200 },
      "/api/notes": { ms: 90, bytes: 210_000, status: 200 },
      "/api/events": { ms: 110, bytes: 150_000, status: 200 },
    } });
    expect(boundary.green).toBe(true);
  });

  it("the unknown-audit guard still holds: a misspelled name is a shape-error even with a perfect envelope", () => {
    const v = classifyAudit("accent-volume-light-landscape-swep", s49Envelope());
    expect(isErr(v)).toBe(true);
  });
});

// --- S50: the dark × landscape × SEED sweep for the 13 volume-invariant views --------
// The S40 landscape seed-family shape re-anchored to the DARK half on the
// 13 volume-invariant views (Timetable, Assignments, Exams, Flashcards,
// Practice Tests, Study Groups, Grade Tracker, Files, Calculator, Math
// Solver, AI Assistant, Focus Timer, Settings — they render no task/note/
// event rows, so the S48/S49 volume sweeps never navigated them): the
// per-view records carry the below-lg structural family (drawerClosed/
// appBar/headingClearance — the fixed glass app bar covers 16% of the
// 390px viewport, so the heading-clearance contract is at its tightest)
// AND the DARK detector family (flashbulbs — a light surface on the dark
// canvas is ALWAYS a finding; unreadable < 2.2 with the CTA-face exemption
// ONLY — the light-mode calendar-day + yellow-pill exemptions do NOT apply
// in dark, those surfaces re-theme; lowcontrast < 3.2 = WARN). The
// drawer-own nav-scroll contract at the LANDSCAPE geometry: the nav
// scrollHeight ~1068 vs the ~301px clientHeight at 390 height — the nav
// MUST scroll; links ~8–20 sit below the fold.
const S50_ACCENTS = ["violet", "blue", "green", "orange", "pink", "red", "teal"] as const;
// The 13 volume-invariant views by DISPLAY labels — the views the S13
// data-volume audit's own set EXCLUDES (they render no task/note/event
// rows); the 7 volume-affected views at dark × landscape are the S48
// audit's own (at volume), and the light half at seed is the S40
// accent-landscape-sweep's own (all 20 views).
const S50_VIEWS = [
  "Timetable", "Assignments", "Exams", "Flashcards", "Practice Tests",
  "Study Groups", "Grade Tracker", "Files", "Calculator", "Math Solver",
  "AI Assistant", "Focus Timer", "Settings",
];
const S50_TINT = "linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))";

type S50Rec = Record<string, unknown>;

function s50ViewRec(o: S50Rec = {}): S50Rec {
  return {
    heading: "ok", scrollWidth: 844, drawerClosed: true, appBar: true, headingClearance: true,
    flashbulbs: [] as unknown[], unreadable: [] as unknown[], lowcontrast: [] as unknown[],
    consoleErrors: [] as unknown[],
    activeTint: S50_TINT, activeLabel: "",
    ...o,
  };
}
function s50DrawerRec(o: S50Rec = {}): S50Rec {
  return { linkCount: 20, flashbulbs: [] as unknown[], unreadable: [] as unknown[], lowcontrast: [] as unknown[], activeView: "Settings", activeTint: S50_TINT, ...o };
}

/** The full accent-dark-landscape-seed envelope: 7 accents × the 13
 *  volume-invariant views + the drawer record per accent at 844×390 DARK at
 *  SEED volume, with per-view overrides merged in (the activeLabel defaults
 *  are filled to the view's own label — the interaction contract). */
function s50Envelope(viewOverrides: Record<string, Record<string, S50Rec>> = {}): S50Rec {
  const accents: S50Rec = {};
  for (const a of S50_ACCENTS) {
    const views: S50Rec = {};
    for (const v of S50_VIEWS) {
      const base = s50ViewRec(viewOverrides[a]?.[v]);
      if (base.activeLabel === "") base.activeLabel = v; // the interaction contract default
      views[v] = base;
    }
    accents[a] = { applied: a, views, drawer: s50DrawerRec() };
  }
  return {
    source: "accent-dark-landscape-seed-sweep", mode: "dark",
    viewport: { width: 844, height: 390 },
    chrome: { sidebarVisible: false, hamburgerVisible: true, drawerNavScrollable: true },
    accents, findings: [] as unknown[],
  };
}

describe("classifyAudit accent-dark-landscape-seed-sweep (S50 — the dark × landscape × SEED sweep for the 13 volume-invariant views)", () => {
  it("the GREEN shape: 7 accents × 13 volume-invariant views navigated through the drawer at 844×390 dark at seed → green with the swept counts (the dark detector family — flashbulbs always findings; the CTA-face exemption ONLY)", () => {
    const v = classifyAudit("accent-dark-landscape-seed-sweep", s50Envelope());
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/91 view renderings/);
    expect(v.note).toMatch(/91 active-tint readings/);
    expect(v.note).toMatch(/7 drawer records/);
    expect(v.note).toMatch(/844×390/);
    expect(v.note).toMatch(/MODE dark/);
  });

  it("the ALL-VIEWS guard: an accent map missing ONE of the 13 views reads shape-error — a view that silently did not run must never read green-by-omission", () => {
    const env = s50Envelope() as { accents: Record<string, { views: Record<string, unknown> }> };
    delete env.accents.violet.views.Timetable;
    const v = classifyAudit("accent-dark-landscape-seed-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the ALL-ACCENTS guard: the accents map missing ONE accent reads shape-error", () => {
    const env = s50Envelope() as { accents: Record<string, unknown> };
    delete env.accents.red;
    const v = classifyAudit("accent-dark-landscape-seed-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the historical S13-shape envelope (the data-volume audit's own flat findings/nonGaps shape) reads shape-error, never green-by-resemblance", () => {
    const s13Shape = {
      source: "data-volume-audit", findings: [], nonGaps: [{ surface: "Tasks render", longTaskTotal: 400 }],
      inserted: { tasks: 300, notes: 200, events: 250 },
    };
    const v = classifyAudit("accent-dark-landscape-seed-sweep", s13Shape);
    expect(isErr(v)).toBe(true);
  });

  it("the historical S48 DARK-landscape VOLUME envelope reads shape-error here — the 7 volume views are the S48 audit's own; this seam owns the 13 volume-invariant views (the view sets are disjoint discriminators on the same cell)", () => {
    const v = classifyAudit("accent-dark-landscape-seed-sweep", s48Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S49 LIGHT-landscape volume envelope reads shape-error here — the viewport matches but the view set AND the mode differ (the shape checks run before the mode guard)", () => {
    const v = classifyAudit("accent-dark-landscape-seed-sweep", s49Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S42 DARK DESKTOP envelope (viewport 1280×800) reads shape-error here — the desktop pair own 1280×800; this seam owns 844×390", () => {
    const v = classifyAudit("accent-dark-landscape-seed-sweep", s42Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S44 DARK MOBILE envelope (viewport 390×844) reads shape-error here — the mobile pair own 390×844; this seam owns the landscape 844×390 (the TRANSPOSED pair of axes is a different device class)", () => {
    const v = classifyAudit("accent-dark-landscape-seed-sweep", s44Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S46 DARK MIDBAND envelope (viewport 768×1024) reads shape-error here — the mid-band pair own 768×1024; this seam owns the landscape 844×390", () => {
    const v = classifyAudit("accent-dark-landscape-seed-sweep", s46Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the mode discriminator on this very cell: the S40 LIGHT-landscape envelope re-scoped to the 13-view dark shape with mode=dark reads NON-green via the mode rot when the shape matches (the mirror pattern — the mode is the discriminator on this very cell)", () => {
    // Build the S40 light envelope re-scoped: same viewport family, mode flipped.
    const env = s50Envelope() as Record<string, unknown>;
    env.mode = "light";
    const v = classifyAudit("accent-dark-landscape-seed-sweep", env);
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=light/);
  });

  it("the viewport guard: the 1280×800 desktop, 390×844 mobile, AND 768×1024 mid-band envelopes fed here read shape-error, never a silent re-scope (the sibling families own those surfaces; the landscape is the TRANSPOSED 844×390 — BOTH axes)", () => {
    const desktop = classifyAudit("accent-dark-landscape-seed-sweep", { ...s50Envelope(), viewport: { width: 1280, height: 800 } });
    expect(isErr(desktop)).toBe(true);
    const mobile = classifyAudit("accent-dark-landscape-seed-sweep", { ...s50Envelope(), viewport: { width: 390, height: 844 } });
    expect(isErr(mobile)).toBe(true);
    const midband = classifyAudit("accent-dark-landscape-seed-sweep", { ...s50Envelope(), viewport: { width: 768, height: 1024 } });
    expect(isErr(midband)).toBe(true);
  });

  it("the missing drawer record reads shape-error (the drawer is part of the per-accent contract — the landscape vehicle's own rendering)", () => {
    const env = s50Envelope() as { accents: Record<string, Record<string, unknown>> };
    delete (env.accents.pink as Record<string, unknown>).drawer;
    const v = classifyAudit("accent-dark-landscape-seed-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("mode is part of the contract: an envelope without mode reads shape-error", () => {
    const env = s50Envelope() as Record<string, unknown>;
    delete env.mode;
    const v = classifyAudit("accent-dark-landscape-seed-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the applied-mismatch family: an accent whose self-verified reading differs from its key is a finding", () => {
    const env = s50Envelope() as { accents: Record<string, Record<string, unknown>> };
    (env.accents.teal as Record<string, unknown>).applied = "violet";
    const v = classifyAudit("accent-dark-landscape-seed-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the LANDSCAPE vehicle-contract family (the below-lg contract, the S35/S40/S48/S49 landscape doctrine at seed): a VISIBLE sidebar at 844 is the finding class (the sidebar is hidden lg:flex — below 1024 the drawer is the only vehicle), and a HIDDEN hamburger is the same class (the app bar's hamburger is the vehicle's handle)", () => {
    const sidebar = classifyAudit("accent-dark-landscape-seed-sweep", { ...s50Envelope(), chrome: { sidebarVisible: true, hamburgerVisible: true, drawerNavScrollable: true } });
    expect(sidebar.green).toBe(false);
    expect(sidebar.note).toMatch(/vehicle/i);
    const burger = classifyAudit("accent-dark-landscape-seed-sweep", { ...s50Envelope(), chrome: { sidebarVisible: false, hamburgerVisible: false, drawerNavScrollable: true } });
    expect(burger.green).toBe(false);
    expect(burger.note).toMatch(/vehicle/i);
  });

  it("the drawer-nav-scroll family: drawerNavScrollable=false is the finding class (at 390 height the 20 nav rows measure scrollHeight ~1068 vs the ~301px nav area — links ~8–20 sit below the fold; the nav's scroll is the only path to them, the S35/S40/S48/S49 short-viewport contract at seed)", () => {
    const v = classifyAudit("accent-dark-landscape-seed-sweep", { ...s50Envelope(), chrome: { sidebarVisible: false, hamburgerVisible: true, drawerNavScrollable: false } });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/drawerNavScrollable|scroll/i);
  });

  it("the tint-rot family: an activeTint that computed to none is a FINDING (the S8 no-var rot class — the NAV_ACTIVE_GRADIENT_STOPS pair did not resolve in dark at the landscape layout)", () => {
    const v = classifyAudit("accent-dark-landscape-seed-sweep", s50Envelope({ green: { Files: { activeTint: "none" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/active-link gradient/);
  });

  it("the interaction family: an activeLabel that does not equal the view's own label is a FINDING (the active state did not follow the navigation — the dark × landscape × seed interaction cell on the 13 views)", () => {
    const v = classifyAudit("accent-dark-landscape-seed-sweep", s50Envelope({ blue: { Exams: { activeLabel: "Dashboard" } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
    expect(v.note).toMatch(/did not follow the navigation/);
  });

  it("the overflow family: scrollWidth > 844 is a finding (the S16 mobile-only-gap class at the landscape width — the Timetable canvas must live INSIDE its overflow-x-auto container, never widen the document)", () => {
    const v = classifyAudit("accent-dark-landscape-seed-sweep", s50Envelope({ orange: { Timetable: { scrollWidth: 854 } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the structural below-lg family at the landscape: a drawer that did not close on navigation, a missing app bar, and a heading under the fixed bar are each findings (the S33/S35/S40 structural contracts at seed — the below-lg chrome is identical at 844, the bar 16% of the short viewport)", () => {
    const stuck = classifyAudit("accent-dark-landscape-seed-sweep", s50Envelope({ violet: { Timetable: { drawerClosed: false } } }));
    expect(stuck.green).toBe(false);
    expect(stuck.findings).toBe(1);
    expect(stuck.note).toMatch(/drawer/i);
    const noBar = classifyAudit("accent-dark-landscape-seed-sweep", s50Envelope({ blue: { Calculator: { appBar: false } } }));
    expect(noBar.green).toBe(false);
    expect(noBar.findings).toBe(1);
    expect(noBar.note).toMatch(/app bar/i);
    const under = classifyAudit("accent-dark-landscape-seed-sweep", s50Envelope({ teal: { Settings: { headingClearance: false } } }));
    expect(under.green).toBe(false);
    expect(under.findings).toBe(1);
    expect(under.note).toMatch(/clearance/i);
  });

  it("the DARK detector family: a flashbulb in a view record is a FINDING counted independently of the findings array (a light surface on the dark canvas — the S10 @theme inline trap's own family at the landscape layout)", () => {
    const v = classifyAudit("accent-dark-landscape-seed-sweep", s50Envelope({ violet: { Files: { flashbulbs: [
      { cls: "bg-white rounded-xl border", bg: "rgb(255, 255, 255)", tag: "DIV", w: 600, h: 300, text: "" },
    ] } } }));
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/flashbulb/i);
  });

  it("the DARK detector family: a flashbulb in the DRAWER record is a FINDING (the drawer's own dark rendering — dark:bg-slate-950)", () => {
    const env = s50Envelope() as { accents: Record<string, { drawer: Record<string, unknown> }> };
    env.accents.blue.drawer = { linkCount: 20, flashbulbs: [
      { cls: "bg-white", bg: "rgb(255, 255, 255)", tag: "DIV", w: 200, h: 80, text: "" },
    ], unreadable: [], lowcontrast: [], activeView: "Settings", activeTint: S50_TINT };
    const v = classifyAudit("accent-dark-landscape-seed-sweep", env);
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/flashbulb/i);
  });

  it("the counting semantics: a non-exempt unreadable entry with an EMPTY findings array still reads NON-green (the independent counting doctrine)", () => {
    const env = s50Envelope({ teal: { "Grade Tracker": { unreadable: [
      { text: "GPA", color: "rgb(148, 163, 184)", contrast: 1.9 },
    ] } } });
    const v = classifyAudit("accent-dark-landscape-seed-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the CTA-face exemption is SIGNATURE-STRICT: white-on-accent rides the note; a non-white unreadable text still counts", () => {
    const exempt = classifyAudit("accent-dark-landscape-seed-sweep", s50Envelope({ violet: { Timetable: { unreadable: [
      { text: "Add Class", color: "rgb(255, 255, 255)", contrast: 2.1 },
    ] } } }));
    expect(exempt.green).toBe(true);
    expect(exempt.note).toMatch(/1 CTA-face/);
    const other = classifyAudit("accent-dark-landscape-seed-sweep", s50Envelope({ violet: { Timetable: { unreadable: [
      { text: "Monday", color: "rgb(100, 116, 139)", contrast: 1.8 },
    ] } } }));
    expect(other.green).toBe(false);
    expect(other.findings).toBe(1);
  });

  it("the DARK doctrine: the light-mode calendar adjacent-day exemption does NOT apply in dark — a slate-300 day number still counts (those surfaces re-theme in dark, the S42/S44/S46/S48 lesson applied to the landscape seed family)", () => {
    const v = classifyAudit("accent-dark-landscape-seed-sweep", s50Envelope({ pink: { Timetable: { unreadable: [
      { text: "27", color: "rgb(203, 213, 225)", contrast: 1.6 },
    ] } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the DARK doctrine: the light-mode yellow priority-pill exemption does NOT apply in dark — a yellow-500 pill still counts (those surfaces re-theme in dark)", () => {
    const v = classifyAudit("accent-dark-landscape-seed-sweep", s50Envelope({ green: { Assignments: { unreadable: [
      { text: "high", color: "rgb(234, 179, 8)", contrast: 2.0 },
    ] } } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the lowcontrast WARN family rides the note, never the findings (the S11 non-gap family)", () => {
    const env = s50Envelope({ green: { Flashcards: { lowcontrast: [
      { text: "deck swatch", color: "rgb(167, 139, 250)", contrast: 3.07 },
    ] } } });
    const v = classifyAudit("accent-dark-landscape-seed-sweep", env);
    expect(v.green).toBe(true);
    expect(v.note).toMatch(/1 WARN/);
  });

  it("the drawer-error family: a drawer record carrying an error is a FINDING (never a swallow)", () => {
    const env = s50Envelope() as { accents: Record<string, { drawer: Record<string, unknown> }> };
    env.accents.blue.drawer = { linkCount: 0, flashbulbs: [], unreadable: [], lowcontrast: [], activeView: null, activeTint: null, error: "TypeError: Cannot read properties of null" };
    const v = classifyAudit("accent-dark-landscape-seed-sweep", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the drawer link census: linkCount !== 20 is a finding (the navigation census broke — the drawer always carries all 20 links even though only 13 are navigated)", () => {
    const env = s50Envelope() as { accents: Record<string, { drawer: Record<string, unknown> }> };
    env.accents.orange.drawer = { linkCount: 19, flashbulbs: [], unreadable: [], lowcontrast: [], activeView: "Settings", activeTint: S50_TINT };
    const v = classifyAudit("accent-dark-landscape-seed-sweep", env);
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/19|link/i);
  });

  it("the strict record shape: a view record missing flashbulbs reads shape-error (the dark detector family is part of the record — the class exists only in dark)", () => {
    const env = s50Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.red.views.Files.flashbulbs;
    const v = classifyAudit("accent-dark-landscape-seed-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the strict record shape: a view record missing activeTint reads shape-error (the interaction evidence is part of the record)", () => {
    const env = s50Envelope() as { accents: Record<string, { views: Record<string, Record<string, unknown>> }> };
    delete env.accents.violet.views.Calculator.activeTint;
    const v = classifyAudit("accent-dark-landscape-seed-sweep", env);
    expect(isErr(v)).toBe(true);
  });

  it("the unknown-audit guard still holds: a misspelled name is a shape-error even with a perfect envelope", () => {
    const v = classifyAudit("accent-dark-landscape-seed-swep", s50Envelope());
    expect(isErr(v)).toBe(true);
  });
});

// --- S51: the CWV × volume stress (the RUM-beacon cross-axis) -----------------------
// The S16 CWV vehicle re-anchored to the VOLUME axis: the beacon's five
// field metrics (TTFB/FCP/LCP/CLS + the INP interaction proxy) measured
// under the COUNT-verified 300/200/250 profile (the S13 data-volume
// contract) on the 7 volume-affected views (the S13/S42–S49 set — the
// views that render task/note/event rows), at the S16 canonical stress
// viewport (390×844 mobile + the Lighthouse throttle preset: 4x CPU +
// Slow-4G, cache disabled), in LIGHT mode (the volume axis is the
// discriminator; the S16 matrix's own dark deltas were <100ms — the dark
// half is the documented non-gap), against the STANDALONE build (the S16
// doctrine: CWV needs the production bundle — the dev server's Turbopack
// overhead would inflate every reading). The budget families, calibrated
// against the recorded S16 seed readings (throttled dashboard LCP 2684ms /
// FCP 588ms / CLS 0 / TTFB 8ms / longTasks 225ms / INP proxy 397ms):
// LCP ≤ 4400 (the S51-cycle 4000 → 4400 re-anchor — the parity-anchor
// budget, the reference's own seed LCP under the same preset; findings =
// POOR only, NI is the documented S16 state), CLS ≤ 0.1 (the ADR-014
// load-stability contract extended to volume), FCP ≤ 1500 (the
// shell-paint volume-invariance), TTFB ≤ 500 (the server sanity bound),
// longTaskTotal ≤ 2400 (the S91/AR1 re-anchor: the documented same-tree
// healthy band 1821–2288ms made the original 2000 pin a coin flip; the
// S13 B3 quiet-window 1500ms standing budget's load-window sibling), and
// the INP proxy ≤ 3000 (Dashboard→Tasks under the full throttle — the
// 300-row list mount is the heaviest interaction). [S92/AS2: this fifth
// live budget site re-anchored — the AR1 sync sweep's miss, the s91
// audit's L1.]
const S51_VIEWS = ["Dashboard", "My Day", "Tasks", "Calendar", "Events", "Notes", "Analytics"];

type S51Rec = Record<string, unknown>;

function s51ViewRec(o: S51Rec = {}): S51Rec {
  return {
    lcp: 2684, lcpEl: "H1text-2xl font-bold", fcp: 588, cls: 0, ttfb: 42,
    longTaskTotal: 225, maxLongTask: 215, mainNodes: 2430, runs: 2,
    ...o,
  };
}

/** The full cwv-volume-stress envelope: the 7 volume-affected views × the
 *  five field metrics (2-run medians) + the INP proxy + the COUNT-verified
 *  volume profile, with per-view overrides merged in. */
function s51Envelope(viewOverrides: Record<string, S51Rec> = {}): S51Rec {
  const views: S51Rec = {};
  for (const v of S51_VIEWS) {
    views[v] = s51ViewRec(viewOverrides[v]);
  }
  return {
    source: "cwv-volume-stress", mode: "light",
    target: "http://localhost:3200",
    viewport: { width: 390, height: 844 },
    throttle: true,
    volume: { tasks: 300, notes: 200, events: 250 },
    views,
    inpProxy: {
      viewport: { width: 1280, height: 800 }, cpuRate: 4, networkThrottled: true,
      from: "Dashboard", to: "Tasks", ms: 2100,
    },
    findings: [] as unknown[],
  };
}

describe("classifyAudit cwv-volume-stress (S51 — the CWV × volume stress, the RUM-beacon cross-axis)", () => {
  it("the GREEN shape: the 7 volume-affected views × the five field metrics at 390×844 under the Lighthouse throttle in light mode at the 300/200/250 profile against the standalone build → green with the swept counts + the budget summary", () => {
    const v = classifyAudit("cwv-volume-stress", s51Envelope());
    expect(v.green).toBe(true);
    expect(v.findings).toBe(0);
    expect(v.note).toMatch(/7 volume-affected views/);
    expect(v.note).toMatch(/390×844/);
    expect(v.note).toMatch(/Lighthouse throttle/);
    expect(v.note).toMatch(/MODE light/);
    expect(v.note).toMatch(/300\/200\/250/);
    expect(v.note).toMatch(/standalone build/);
    expect(v.note).toMatch(/INP proxy Dashboard→Tasks/);
  });

  it("the ALL-VIEWS guard: a views map missing ONE of the 7 volume-affected views reads shape-error — a view that silently did not run must never read green-by-omission (the S38 retirement)", () => {
    const env = s51Envelope() as { views: Record<string, unknown> };
    delete env.views.Analytics;
    const v = classifyAudit("cwv-volume-stress", env);
    expect(isErr(v)).toBe(true);
  });

  it("the volume-EXACT guard: a 299/200/250 profile reads shape-error — the S13 data-volume contract is 300/200/250 verbatim (a different profile is a different audit, never a silent re-scope)", () => {
    const v = classifyAudit("cwv-volume-stress", { ...s51Envelope(), volume: { tasks: 299, notes: 200, events: 250 } });
    expect(isErr(v)).toBe(true);
  });

  it("the volume-EXACT guard: a 300/100/250 profile (the notes axis short) reads shape-error too — every axis is pinned", () => {
    const v = classifyAudit("cwv-volume-stress", { ...s51Envelope(), volume: { tasks: 300, notes: 100, events: 250 } });
    expect(isErr(v)).toBe(true);
  });

  it("the volume-EXACT guard: a missing volume object reads shape-error (the density evidence is part of the contract)", () => {
    const env = s51Envelope() as Record<string, unknown>;
    delete env.volume;
    const v = classifyAudit("cwv-volume-stress", env);
    expect(isErr(v)).toBe(true);
  });

  it("the throttle guard: throttle=false reads shape-error — the Lighthouse mobile preset (4x CPU + Slow-4G, cache disabled) is the contract; an unthrottled run reads different values and is a different cell", () => {
    const v = classifyAudit("cwv-volume-stress", { ...s51Envelope(), throttle: false });
    expect(isErr(v)).toBe(true);
  });

  it("the mode rot guard: mode=dark reads NON-green via the mode rot (the S27 rot class; the CWV × volume LIGHT surface is this audit's contract — the dark half is the documented non-gap: the S16 matrix's own dark deltas were <100ms)", () => {
    const v = classifyAudit("cwv-volume-stress", { ...s51Envelope(), mode: "dark" });
    expect(v.green).toBe(false);
    expect(v.note).toMatch(/mode=dark/);
  });

  it("mode is part of the contract: an envelope without mode reads shape-error", () => {
    const env = s51Envelope() as Record<string, unknown>;
    delete env.mode;
    const v = classifyAudit("cwv-volume-stress", env);
    expect(isErr(v)).toBe(true);
  });

  it("the viewport guard: the 1280×800 desktop and the 844×390 landscape (the transposed pair) envelopes fed here read shape-error, never a silent re-scope (the desktop CWV family is the cwv audit's own; the landscape is a different device class)", () => {
    const desktop = classifyAudit("cwv-volume-stress", { ...s51Envelope(), viewport: { width: 1280, height: 800 } });
    expect(isErr(desktop)).toBe(true);
    const landscape = classifyAudit("cwv-volume-stress", { ...s51Envelope(), viewport: { width: 844, height: 390 } });
    expect(isErr(landscape)).toBe(true);
  });

  it("the target guard: an empty target string reads shape-error (the standalone-build origin is part of the record — the S16 doctrine)", () => {
    const v = classifyAudit("cwv-volume-stress", { ...s51Envelope(), target: "" });
    expect(isErr(v)).toBe(true);
  });

  it("the historical S16 cwv envelope (the verdicts-shape) reads shape-error here — the seed CWV audit's own shape; this seam owns the volume axis", () => {
    const v = classifyAudit("cwv-volume-stress", CWV_GREEN);
    expect(isErr(v)).toBe(true);
  });

  it("the historical S13 data-volume envelope (the flat findings/nonGaps shape) reads shape-error here, never green-by-resemblance", () => {
    const s13Shape = {
      source: "data-volume-audit", findings: [], nonGaps: [{ surface: "Tasks render", longTaskTotal: 400 }],
      inserted: { tasks: 300, notes: 200, events: 250 },
    };
    const v = classifyAudit("cwv-volume-stress", s13Shape);
    expect(isErr(v)).toBe(true);
  });

  it("the historical S42 volume-sweep envelope reads shape-error here — the accent×volume sweeps carry the accents map this seam does not own (the shape discriminates before any budget)", () => {
    const v = classifyAudit("cwv-volume-stress", s42Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the historical S49 volume-light-landscape envelope reads shape-error here — the landscape viewport AND the accents map both discriminate", () => {
    const v = classifyAudit("cwv-volume-stress", s49Envelope());
    expect(isErr(v)).toBe(true);
  });

  it("the per-view metric shape family: a string lcp reads shape-error (the anti-phantom doctrine — a mistyped metric must never read as a green zero)", () => {
    const v = classifyAudit("cwv-volume-stress", s51Envelope({ Tasks: { lcp: "2,684" as unknown as number } }));
    expect(isErr(v)).toBe(true);
  });

  it("the per-view metric shape family: a view record missing mainNodes reads shape-error (the density evidence is part of the record even though it carries no budget)", () => {
    const env = s51Envelope() as { views: Record<string, Record<string, unknown>> };
    delete env.views.Notes.mainNodes;
    const v = classifyAudit("cwv-volume-stress", env);
    expect(isErr(v)).toBe(true);
  });

  it("the per-view metric shape family: a missing lcpEl reads shape-error (the LCP element attribution rides the record)", () => {
    const env = s51Envelope() as { views: Record<string, Record<string, unknown>> };
    delete env.views.Events.lcpEl;
    const v = classifyAudit("cwv-volume-stress", env);
    expect(isErr(v)).toBe(true);
  });

  it("the LCP budget family, boundary-exact: 4400 reads green (the PARITY ANCHOR — the reference's own seed-volume mobile dashboard measures LCP 4416–4432ms under the same Lighthouse preset, the standing cwv stage's documented ref scenario: the clone's volume-stressed views must outperform the reference's own seed state; the public 4000ms field-POOR boundary is documented in the note — the Tasks view's genuine ~4000ms boundary-straddling is the recorded NI-to-POOR state) and 4401 is a counted finding", () => {
    const at = classifyAudit("cwv-volume-stress", s51Envelope({ Tasks: { lcp: 4400 } }));
    expect(at.green).toBe(true);
    const over = classifyAudit("cwv-volume-stress", s51Envelope({ Tasks: { lcp: 4401 } }));
    expect(over.green).toBe(false);
    expect(over.findings).toBe(1);
    expect(over.note).toMatch(/lcp=4401/);
    expect(over.note).toMatch(/>4400/);
  });

  it("the CLS budget family, boundary-exact: 0.1 reads green (the ADR-014 load-stability contract at volume) and 0.11 is a counted finding", () => {
    const at = classifyAudit("cwv-volume-stress", s51Envelope({ Dashboard: { cls: 0.1 } }));
    expect(at.green).toBe(true);
    const over = classifyAudit("cwv-volume-stress", s51Envelope({ Dashboard: { cls: 0.11 } }));
    expect(over.green).toBe(false);
    expect(over.findings).toBe(1);
    expect(over.note).toMatch(/cls=0\.11/);
  });

  it("the FCP budget family, boundary-exact: 1500 reads green (the shell-paint volume-invariance — the pre-warm contract) and 1501 is a counted finding", () => {
    const at = classifyAudit("cwv-volume-stress", s51Envelope({ Notes: { fcp: 1500 } }));
    expect(at.green).toBe(true);
    const over = classifyAudit("cwv-volume-stress", s51Envelope({ Notes: { fcp: 1501 } }));
    expect(over.green).toBe(false);
    expect(over.findings).toBe(1);
    expect(over.note).toMatch(/fcp=1501/);
  });

  it("the TTFB budget family, boundary-exact: 500 reads green (the server sanity bound) and 501 is a counted finding", () => {
    const at = classifyAudit("cwv-volume-stress", s51Envelope({ Calendar: { ttfb: 500 } }));
    expect(at.green).toBe(true);
    const over = classifyAudit("cwv-volume-stress", s51Envelope({ Calendar: { ttfb: 501 } }));
    expect(over.green).toBe(false);
    expect(over.findings).toBe(1);
    expect(over.note).toMatch(/ttfb=501/);
  });

  it("the longTaskTotal budget family, boundary-exact: 2400 reads green (the S91/AR1 re-anchor: the load-window sibling of the S13 B3 quiet-window 1500ms budget — the documented same-tree healthy band is 1821–2288ms across 7+ readings on 3+ tree states [S82/S88/S89/S90/S91; the S88 stash A/B measured the SAME tree 1978 green / 2073 red], so the original 2000 pin sat INSIDE the noise band and the verdict was a coin flip on machine-load conditions — the exact S51 LCP class; 2400 sits 112ms above the max documented reading, OUTSIDE the band, and a genuine +400ms regression on the worst-case healthy baseline still lands beyond it) and 2401 is a counted finding", () => {
    const at = classifyAudit("cwv-volume-stress", s51Envelope({ "My Day": { longTaskTotal: 2400 } }));
    expect(at.green).toBe(true);
    const over = classifyAudit("cwv-volume-stress", s51Envelope({ "My Day": { longTaskTotal: 2401 } }));
    expect(over.green).toBe(false);
    expect(over.findings).toBe(1);
    expect(over.note).toMatch(/longTaskTotal=2401/);
    expect(over.note).toMatch(/>2400/);
  });

  it("the multi-breach counting: TWO views breaching the SAME family read findings=2 (each breach counted independently)", () => {
    const v = classifyAudit("cwv-volume-stress", s51Envelope({ Tasks: { lcp: 4600 }, Events: { lcp: 4500 } }));
    expect(v.green).toBe(false);
    expect(v.findings).toBe(2);
    expect(v.note).toMatch(/2 budget breach/);
  });

  it("the live-tally dedupe (S92/AS4): an env.findings entry whose family+view matches a recomputed breach counts ONCE — the script-side S51-* findings stop double-counting, the anti-phantom recompute stays the authority, and an envelope-only finding still surfaces", () => {
    const env = s51Envelope({ "My Day": { longTaskTotal: 2401 } }) as { findings: unknown[] };
    // the live script shape: the probe pushes its own finding for the SAME
    // breach the classifier recomputes (the s91 seam tallied both → 2).
    env.findings = [{ family: "S51-longtask", view: "My Day", finding: "load-window longTaskTotal 2500ms > 2400ms", value: 2500, budget: 2400 }];
    const v = classifyAudit("cwv-volume-stress", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1); // the s91 seam returned 2 here — the S92 dedupe
    // an envelope-only finding (no recomputed counterpart) still counts alone
    const env2 = s51Envelope() as { findings: unknown[] };
    env2.findings = [{ family: "S51-other", view: "Dashboard", finding: "an envelope-only finding" }];
    const v2 = classifyAudit("cwv-volume-stress", env2);
    expect(v2.green).toBe(false);
    expect(v2.findings).toBe(1);
  });

  // S93/AT2 (the s92 audit's I4): S51_FAMILY_BY_METRIC has no runtime
  // completeness guard — a future S51_BUDGETS metric without a map entry
  // dedupes against "undefined|view" and nothing fails. The seam's
  // literals are not exported, so this is the AP3 source-scan precedent
  // (the hue-tokens style): parse both literals from the seam source and
  // assert set inclusion. GREEN-by-design on the current seam;
  // mutation-proven s93 (a map entry removed → RED at this pin).
  it("the S51 dedupe map covers EVERY budget metric (a future metric without a family entry dedupes against undefined — nothing fails)", () => {
    const seam = readFileSync(path.resolve(process.cwd(), "src/lib/suite-verdict.ts"), "utf8");
    const budgetBlock = seam.match(/const S51_BUDGETS[^=]*=\s*\[([\s\S]*?)\];/)?.[1] ?? "";
    const mapBlock = seam.match(/const S51_FAMILY_BY_METRIC[^=]*=\s*\{([\s\S]*?)\};/)?.[1] ?? "";
    const metrics = [...budgetBlock.matchAll(/metric:\s*"([^"]+)"/g)].map((m) => m[1]);
    const mapped = [...mapBlock.matchAll(/^\s*([A-Za-z]+):\s*"S51-/gm)].map((m) => m[1]);
    expect(metrics.length, "the S51_BUDGETS literal parsed").toBeGreaterThanOrEqual(5);
    const unmapped = metrics.filter((m) => !mapped.includes(m));
    expect(
      unmapped,
      `S51_FAMILY_BY_METRIC is missing entries for: ${unmapped.join(", ")} — every budget metric needs its family tag or the dedupe silently stops working`,
    ).toEqual([]);
  });

  it("the INP proxy family, boundary-exact: 3000 reads green and 3001 is a counted finding (the volume-stressed interaction budget — Dashboard→Tasks under the full throttle)", () => {
    const at = classifyAudit("cwv-volume-stress", { ...s51Envelope(), inpProxy: { viewport: { width: 1280, height: 800 }, cpuRate: 4, networkThrottled: true, from: "Dashboard", to: "Tasks", ms: 3000 } });
    expect(at.green).toBe(true);
    const over = classifyAudit("cwv-volume-stress", { ...s51Envelope(), inpProxy: { viewport: { width: 1280, height: 800 }, cpuRate: 4, networkThrottled: true, from: "Dashboard", to: "Tasks", ms: 3001 } });
    expect(over.green).toBe(false);
    expect(over.findings).toBe(1);
    expect(over.note).toMatch(/3001ms/);
    expect(over.note).toMatch(/3000ms volume interaction budget/);
  });

  it("the INP proxy shape family: a missing ms reads shape-error; from/to must be strings (the proxy's identity is part of the record)", () => {
    const noMs = classifyAudit("cwv-volume-stress", { ...s51Envelope(), inpProxy: { viewport: { width: 1280, height: 800 }, cpuRate: 4, networkThrottled: true, from: "Dashboard", to: "Tasks" } });
    expect(isErr(noMs)).toBe(true);
    const noFrom = classifyAudit("cwv-volume-stress", { ...s51Envelope(), inpProxy: { viewport: { width: 1280, height: 800 }, cpuRate: 4, networkThrottled: true, to: "Tasks", ms: 2100 } });
    expect(isErr(noFrom)).toBe(true);
  });

  it("the findings-array ride: a findings entry with zero budget breaches still reads non-green (the probe-computed findings are counted, not replaced)", () => {
    const env = s51Envelope() as { findings: unknown[] };
    env.findings.push({ family: "probe", view: "Tasks", detail: "a probe-computed finding" });
    const v = classifyAudit("cwv-volume-stress", env);
    expect(v.green).toBe(false);
    expect(v.findings).toBe(1);
  });

  it("the mainNodes strictness negative: a low mainNodes value reads GREEN — the density evidence is informational, never a budget (the Analytics view measures ~224 nodes at volume: its density lives in the SVG chart data, not the DOM)", () => {
    const v = classifyAudit("cwv-volume-stress", s51Envelope({ Analytics: { mainNodes: 224 } }));
    expect(v.green).toBe(true);
  });

  it("the runs doctrine: each view record carries its run count (the 2-run median — the S16 dampening doctrine; the shape guard pins the key)", () => {
    const env = s51Envelope() as { views: Record<string, Record<string, unknown>> };
    delete env.views.Dashboard.runs;
    const v = classifyAudit("cwv-volume-stress", env);
    expect(isErr(v)).toBe(true);
  });

  it("the unknown-audit guard still holds: a misspelled name is a shape-error even with a perfect envelope", () => {
    const v = classifyAudit("cwv-volume-stres", s51Envelope());
    expect(isErr(v)).toBe(true);
  });
});

// --- suiteVerdict (the aggregate) -------------------------------------------

describe("suiteVerdict", () => {
  it("all green → green with empty failed list", () => {
    const r = suiteVerdict([
      { name: "security", verdict: { green: true, findings: 0, note: "2 nonGaps" } },
      { name: "cwv", verdict: { green: true, findings: 0, note: "ref POOR informational" } },
    ]);
    expect(r.green).toBe(true);
    expect(r.failed).toEqual([]);
    expect(r.summary).toMatch(/2\/2/);
  });

  it("mixed → non-green, failed lists the non-green stages, shape-errors ride the summary", () => {
    const r = suiteVerdict([
      { name: "security", verdict: { green: true, findings: 0, note: "" } },
      { name: "dark-sweep", verdict: { green: false, findings: 0, note: "mode=light — the sweep ran in the wrong mode" } },
      { name: "print", verdict: { green: false, findings: 0, note: "shape not recognized — the audit script changed; update the seam" } },
    ]);
    expect(r.green).toBe(false);
    expect(r.failed).toEqual(["dark-sweep", "print"]);
    expect(r.summary).toMatch(/1\/3 green/);
    expect(r.summary).toMatch(/shape not recognized/);
  });
});
