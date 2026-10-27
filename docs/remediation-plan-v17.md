# VeloxPOS — Remediation Plan v17 (Session V16→v17, 2026-10-27)

> Scope: the **Core Web Vitals pass** session_25 suggested as the next
> cycle's headline, plus the task-mandated re-verification of the mobile
> navigation menu (the drawer's full lifecycle) and a fresh Tailwind v4
> sweep. The audit ran live against both apps (Playwright probes on the
> booted standalone build :3101, agent-browser on the reference) and
> measured Lighthouse 13 on three surfaces. Two findings need work (F1
> stale evidence, F2 the views bundle); one is a disclosure-only close
> (F3 the a11y deductions). Baseline re-verified before audit: fresh
> clone at main @ 8250e12, gates green
> (lint 0 · tsc 0 · build ✓ · unit 478/478 · e2e 173/173).

## 0. Verification ledger (all live unless noted; clone :3101 vs reference)

| # | Item | Method | Result | Verdict |
|---|------|--------|--------|---------|
| L1 | Workspace state | fresh `git clone` (the prior workspace had been reset) | main @ 8250e12, tree clean, V14–V16 history present | baseline verified |
| L2 | Baseline gates | lint → tsc → build → unit → e2e | 0 · 0 · ✓ · 478/478 · 173/173 | all green (matches V16 close) |
| L3 | Mobile app bar @390×844 | Playwright probe | 64px (h-16), fixed top, hamburger + brand chip + store name | ✓ |
| L4 | Mobile drawer lifecycle | Playwright probe | opens (aria-expanded true), closes via Esc / backdrop tap / route change; body scroll locks + unlocks | ✓ (the contract holds) |
| L5 | Drawer geometry + timing | Playwright probe (mid-flight + settled) | panel 288×844 at (0,0), computed `enter` 0.2s, transform −288 mid-flight, 8 links at uniform 44px pitch (40px + gap), zero horizontal overflow | ✓ (the disclosed 200ms slide) |
| L6 | Drawer focus contract (L11) | Playwright probe | focus lands IN the panel on open, Esc returns focus to the hamburger (activeElement-verified) | ✓ |
| L7 | Drawer inside-scroll @390×480 | Playwright probe (short viewport) | panel `overflow-y: auto`, scrollHeight 489 > clientHeight 480, last link reachable after inside scroll | ✓ (session_25's carry-question CLOSED) |
| L8 | All 8 routes @390 overflow | Playwright sweep | scrollWidth 390 on every route — zero horizontal overflow | ✓ |
| L9 | Reference mobile @390 | agent-browser | 220px sidebar stays expanded (x0 w220), main squeezed to 170px wide, NO hamburger, NO drawer | standing disclosure (the clone's drawer is the superset) |
| L10 | Reference data state | agent-browser (Registers/Cashiers/Sales) | both cajas "Abrir Turno" (closed), "0 usuarios registrados" + the 3 shift rows, 2 sales | unchanged from V16 — no new surfaces to mirror |
| L11 | Reference heading structure | agent-browser (Dashboard DOM) | `H1:Dashboard → H3×3` — NO h2; identical to the clone | heading-order is parity-faithful (F3) |
| L12 | Clone login CWV | Lighthouse 13 (desktop, no throttling emulation off) | **perf 86 · a11y 100 · bp 100 · seo 100**; FCP 0.9s · LCP 2.4s · TBT 50ms · CLS 0 | strong |
| L13 | Reference login CWV | Lighthouse 13 (same flags) | **perf 51**; FCP 5.4s · LCP **14.4s** · TBT 170ms · CLS 0.001; 2,314 KiB (the clone ships 314 KiB — 7× lighter) | the clone outperforms the reference on every metric |
| L14 | Clone Dashboard CWV (authed) | Lighthouse 13 + `--extra-headers Cookie: sf_session=…` (session cookie extracted via Playwright login) | **perf 54 · a11y 94 · bp 100 · seo 100**; FCP 1.0s · LCP 3.7s · TBT 550ms · CLS 0; zero console errors, zero redirects | F2 (improvable) + F3 (disclosure) |
| L15 | Lighthouse CDP lesson | first dashboard attempt via `--port 9222` attach | Lighthouse opens a FRESH INCOGNITO context on CDP attach — cookies do NOT transfer; the run measured the logged-out bounce (/Dashboard → 401 → /login?from_url=…) | tooling lesson → SD-68 methodology |
| L16 | TBT blocking source | bootup-time breakdown | react-dom chunk 893ms (framework floor — not actionable) + views chunk 135ms/**69 KiB gz unused on any single view** (0iytuzl6v72yp.js: 307 KiB raw) + 27 KiB unused in a second chunk | **F2** — the one actionable split |
| L17 | Dashboard a11y deductions | report detail | `color-contrast` (H1 slate-800, sub/KPI-labels slate-500 — the reference's own measured low-contrast family, already disclosed + excluded in the a11y smoke) + `heading-order` (H1→H3 — L11 proves the reference identical) | **F3** — disclosures, no code change (parity wins) |
| L18 | docs/lighthouse/ contents | report inspection (URL + fetchTime) | the before/after set measures **localhost:3200** (the retired study-app — "Grade Tracker"/"Study Groups" era, 2026-10-18); only 62-/65- scores relate to an app that no longer exists in this repo | **F1** — stale evidence |
| L19 | Environment contract | direct verification | `.env` = `DATABASE_URL="file:../db/custom.db"`; `db/custom.db` at the repo root (pushed + seeded: 12 products / 6 categories / 2 registers / 2 sales / 2 shifts); `.env.example` tracked + current; vitest 5 (`vitest.config.ts`, 32 files) + Playwright (`playwright.config.ts`, standalone :3100) configured | ✓ |
| L20 | Tailwind v4 sweep | version check + live probes | tailwindcss 4.3.3 + tw-animate-css 1.4.0; the drawer's `duration-200` threads `--tw-duration` correctly (the INTENDED disclosed 200ms — not the v14 dialog trap, which forbids duration- on the DIALOG family only); the V16 palette pins hold (61-entry `@theme` block verified in globals.css); trap tests green | no new v4 bugs |

## 1. Findings

- **F1 — stale Lighthouse evidence.** `docs/lighthouse/` ships the
  retired study-app's before/after reports (localhost:3200, fetched
  2026-10-18, titles from the "Grade Tracker" era). They measure an app
  that no longer exists in this repo and mislead any future audit that
  reads them as this app's evidence. Replace with the v17 measurement
  set + a methodology note.
- **F2 — the views bundle ships all 8 views to every surface.**
  `src/app/page.tsx` statically imports all 8 view components; the
  build merges them into one 307 KiB (88 KiB gz) chunk of which ~69 KiB
  gz is unused on ANY single surface (the dashboard never runs the
  terminal/inventory/sales code, etc.). The authed dashboard pays for
  it: TBT 550 ms, LCP 3.7 s, perf 54. The react-dom chunk (893 ms) is
  the framework floor and stays. Fix: code-split the view registry
  (`React.lazy` per view) + prefetch the ACTIVE view's chunk during
  boot (in parallel with `/api/auth/me` + the collection pre-warm — the
  existing `INITIAL_COLLECTIONS` seam already knows the active view).
- **F3 — the dashboard a11y 94 decomposes into parity-faithful
  deviations.** `color-contrast` (the reference's own low-contrast
  headings — the long-standing disclosed deviation the a11y smoke
  already excludes) and `heading-order` (H1→h3 with no h2 — L11
  measured the reference's Dashboard rendering the IDENTICAL structure).
  The parity contract wins: document both as measured reference
  deviations; no code change.

## 2. Design decisions (resolved)

- **SD-67 — the view registry goes lazy, the ACTIVE view's chunk warms
  during boot.** `VIEW_COMPONENTS` becomes a map of
  `React.lazy(() => import("@/components/views/<name>-view"))` loaders;
  the boot effect fires the active view's loader immediately (fire and
  forget — it settles in parallel with the auth round-trip + the
  collection pre-warm, so by the time `status` flips "ready" the chunk
  is resident in the common case); `<ActiveView />` renders inside a
  `<React.Suspense fallback={null}>`. Route switches after boot fetch
  the target view's chunk on first navigation (one local chunk fetch;
  strictly better than the reference's 2.3 MiB upfront payload whose
  LCP is 14.4 s). The Splash flow, the HydrationMarker, the main
  chrome classes, and the pre-warm seam are untouched — the 173 e2e
  specs (navigation sweep + visual parity + functional parity) are the
  safety net.
- **SD-68 — the Lighthouse evidence refresh.** Delete the study-app
  reports; land `v17-login.json`, `v17-dashboard.json`,
  `v17-ref-login.json` + `README.md` documenting: the desktop flags,
  the CHROME_PATH requirement, the CDP-incognito lesson (L15), and the
  `--extra-headers Cookie` methodology for authed surfaces. The probe
  scripts (`scripts/lighthouse-v17.sh` for the public surface,
  `scripts/lighthouse-v17-authed.sh` for the cookie-injected authed
  run) are committed as the reproducible tooling.
- **SD-69 — the a11y disclosures are recorded, not "fixed".** F3's two
  deductions join the standing deviation register (AGENTS.md): both are
  the reference's own measured rendering; "fixing" either would break
  parity. The plan records the L11 heading-order evidence (measured
  2026-10-27: `H1:Dashboard → H3×3`, no h2, identical to the clone).

## 3. Execution batches (TDD: red → green → gate)

### B1 — F2: the lazy view registry (SD-67)

- `src/app/page.tsx`:
  - the 8 static imports → a `VIEW_LOADERS: Record<ViewId,
    React.lazy>` map (one dynamic `import()` per view);
  - the boot effect fires `void VIEW_LOADERS[activeView]`-adjacent
    prefetch (the import() call) alongside the pre-warm;
  - `<ActiveView />` wraps in `<React.Suspense fallback={null}>`.
- Unit pin (RED first) — `tests/functional-parity-v17.test.ts`:
  - page.tsx contains NO static view imports (no
    `import { TerminalView }` etc.);
  - the lazy map covers all 8 view ids with dynamic `import(`;
  - the boot effect prefetches the active view's chunk;
  - the Suspense wrapper mounts the ActiveView;
  - the existing shell pins stay green (lg:ml-[220px] etc. — the
    refactor must not touch the chrome classes).
- E2e safety net: the existing `navigation.spec.ts` route sweep + SPA
  switch + the visual-parity suite (no new spec needed — they are the
  contract); ADD one v17 spec asserting the chunk split is real (the
  dashboard route does not load the terminal view's module — asserted
  via a script-injection marker or the network log: the
  `terminal-view` chunk URL is absent from the /Dashboard boot).

### B2 — F1: the Lighthouse evidence refresh (SD-68)

- Delete the stale study-app reports (62-/65-*, *-before/-after
  study-era files).
- Land `docs/lighthouse/v17-login.json`, `v17-dashboard.json`,
  `v17-ref-login.json` + `docs/lighthouse/README.md` (the methodology
  note: flags, CHROME_PATH, the incognito lesson, the cookie
  injection, the scores table incl. the reference comparison).
- Commit the two probe scripts.

### B3 — F3: the disclosure documentation (SD-69)

- AGENTS.md: extend the a11y disclosure line — the dashboard's
  Lighthouse a11y 94 = color-contrast (standing) + heading-order (the
  reference's own H1→H3, measured 2026-10-27).
- The plan's ledger carries the evidence (L11/L17).

### B4 — re-measure + evidence

- Re-run `scripts/lighthouse-v17-authed.sh` post-B1: record the
  before/after TBT + LCP + perf deltas in the plan's §6 ledger.
- Refresh the standard screenshot set (`scripts/capture-screenshots-prod.sh`)
  + save the v17 evidence shots (dashboard + a mobile drawer shot) into
  `docs/screenshots/`.

### B5 — gates → docs lockstep → commit + push

- Full gates: lint → typecheck → build → unit → e2e (count grows by the
  new unit pins + the e2e pin).
- Docs lockstep: AGENTS.md (contract 30 — the lazy registry + the a11y
  disclosure), CLAUDE.md (v17 block + counts), README (badge + tests
  row + the lighthouse pointer), PAD (v2.5.0 + ADR-027 + §8 counts),
  retail-pos_SKILL.md (v1.12.0), docs/session_27.md, this plan's §6,
  worklog.
- Commit + SSH-wrapper push to main (no new branches).

## 4. Test plan (pins first — red)

Unit: the B1 source pins (no static view imports; the lazy map; the
prefetch; the Suspense). E2e: the B1 chunk-split pin; everything
existing stays green untouched (no weakened pins — the 173 specs are
the regression contract).

## 5. Out of scope (disclosed)

- The react-dom boot cost (893 ms) — the framework floor; no
  meaningful action without leaving React.
- The reference's own performance (perf 51, LCP 14.4 s, 2.3 MiB) —
  nothing to mirror; the clone already outperforms it 7:1 on payload.
- The color-contrast + heading-order a11y deductions — parity-faithful
  (SD-69); "fixing" them breaks parity.
- The reference's broken/dead flows (the 403 settings save, the empty
  cashier combobox, the shift-gated terminal) — standing disclosures,
  no clone-side work.
- All standing v8–v16 disclosures (SD-14, SD-18..SD-23, SD-63..66, the
  viewport-locked reference scrolling, the drawer's disclosed 200 ms).

## 6. Execution results (filled on completion — 2026-10-27)

All batches executed TDD; the unit pins ran red first (5 red / 3
pre-existing guards green) and the e2e pins were authored against the
split implementation (verified green + the full 176-spec suite as the
regression net).

- **B1 (F2, SD-67) — DONE.** `src/app/page.tsx` ships no static view
  imports: `VIEW_LOADERS` (8 dynamic `import()`s, the named exports
  adapted via `.then((m) => ({ default: m.XView }))`) feeds the
  `React.lazy` registry; the boot effect fires
  `void VIEW_LOADERS[activeView]()` in the same parallel window as
  auth/me + the pre-warm; `<ActiveView />` mounts inside
  `<React.Suspense fallback={null}>`. The build splits 17 → 27 chunks
  (terminal 12 KiB, registers 10, cashiers 13, dashboard 15, inventory
  21, sales 30, settings 29 — none in the entry set). Pins:
  `tests/functional-parity-v17.test.ts` (8) +
  `tests/e2e/functional-parity-v17.spec.ts` (3: the boot-ships-no-
  terminal-code scan over every boot chunk body, the on-demand SPA
  chunk fetch, the no-Suspense-gap h1 attachment).
- **B2 (F1, SD-68) — DONE.** The stale study-app reports deleted
  (git rm); `docs/lighthouse/` now holds the v17 set (login 86/100/100/
  100 · dashboard 67/94/100/100 · reference login 51) +
  `README.md` (the scores table, the clone-vs-reference comparison, the
  methodology with CHROME_PATH/flags, the CDP-incognito lesson, the
  cookie-injection channel, the before/after table). The probe scripts
  committed (`scripts/lighthouse-v17.sh`, `-authed.sh`,
  `probe-v17-clone.sh`, `probe-v17.ts`, `probe-v17-lcp.ts`,
  `capture-v17-mobile.ts`).
- **B3 (F3, SD-69) — DONE.** The a11y decomposition recorded in
  AGENTS.md contract 30 + the PAD ADR-027 + the lighthouse README: the
  dashboard's a11y 94 = color-contrast (the reference's own
  low-contrast family, standing) + heading-order (H1→h3, measured
  IDENTICAL on the reference 2026-10-27). No code change — the parity
  contract wins.
- **B4 (re-measure + evidence) — DONE.** Post-split authed dashboard
  (the same cookie-injected methodology): **performance 54 → 67 (+13),
  TBT 550 ms → 280 ms (−49%), LCP 3.7 s → 3.5 s, FCP 1.0 s =, CLS 0 =
  0**; zero console errors, zero redirects. The standard 32-shot
  screenshot set refreshed from the production build +
  `v17-mobile-drawer-short-viewport-scrolled.png` (the inside-scroll
  proof) + `mobile-drawer-open.png` re-captured.

**Final gate: lint 0 · tsc 0 · build ✓ (exit 0, the 1 documented
pre-existing instrumentation warning) · unit 486/486 (478+8, 33 files)
· e2e 176/176 (173+3).**

Docs lockstep: AGENTS.md contract 30, CLAUDE.md counts + the v17 block,
README badge (486+176) + the Views row + the lighthouse pointer, PAD
v2.5.0 + ADR-027 + §8 counts, retail-pos_SKILL.md v1.12.0,
docs/session_27.md, this ledger, worklog.

Environment audit: `.env` → `DATABASE_URL="file:../db/custom.db"` ✓;
`db/` at the repo root ✓; `.env.example` tracked and current ✓; vitest
+ playwright suites configured and extended ✓; the mobile drawer
contract re-verified live end-to-end (L3-L8) ✓.
