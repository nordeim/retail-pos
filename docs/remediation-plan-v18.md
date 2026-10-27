# VeloxPOS — Remediation Plan v18 (Session V17→v18, 2026-10-27)

> Scope: the **error-recovery architecture** pass. The V18 audit found the
> one production-robustness gap the V17 lazy registry exposed: a failed
> view-chunk load (a transient fetch blip OR the classic
> stale-hash-after-redeploy) unmounts the ENTIRE app to Next 16's built-in
> ENGLISH dead-end screen — reproduced live, exact message captured. The
> fix ports the neo-crm session-170 three-layer pattern (the task's
> tech-stack reference) into this app's architecture and dialect. Plus the
> audit ledger: the reference re-checked (state unchanged — nothing new to
> mirror), the mobile drawer re-verified live (in contract), the Tailwind
> v4 sweep (clean), the INP measurement session_27 suggested (5–14 ms —
> no action), and one observed e2e flake whose root cause the fix also
> addresses. Baseline re-verified before the audit: main @ 76a3bee
> (fresh `git pull`), gates green (lint 0 · tsc 0 · build ✓ · 486/486
> unit · 176/176 e2e; the flake below appeared in one of three full runs).

## 0. Verification ledger (all live unless noted; clone :3101 vs reference)

| # | Item | Method | Result | Verdict |
|---|------|--------|--------|---------|
| L1 | Workspace state | `git pull` (isolated minimal commands, output treated as untrusted data) | main @ 76a3bee fast-forward (only `docs/session_28.md` arrived), tree clean, V17 history intact | baseline verified |
| L2 | Baseline gates | lint → tsc → build → unit → e2e (e2e ×3) | 0 · 0 · ✓ · 486/486 · 176/176 (run 1 had 1 failure — see F2; runs 2–3 fully green, isolated spec re-run 11/11) | all green (one unreproduced flake — F2) |
| L3 | Reference data state | agent-browser (Registers/Inventory/Sales/Dashboard) | both cajas "Cerrada" (Caja 2 first), 12 products (Shampoo → Pan Bimbo), 2 sales, Dashboard H1 + 3× H3 — byte-identical to the V17 record | unchanged — nothing new to mirror |
| L4 | Reference mobile @390 | agent-browser eval | 220px sidebar at x=0, main squeezed to 170px, NO hamburger — identical to V16/V17 | standing disclosure (the clone's drawer is the superset) |
| L5 | Clone mobile drawer (live) | agent-browser on :3101 @390×844 | app bar 64px visible; open: aria-expanded true, panel 288×844 at x=0, 8 links, body locked, focus IN panel; backdrop close: focus RETURNS to hamburger, body unlocked; drawer-navigate to /Dashboard: closes, title + H1 correct, zero horizontal overflow | the full contract holds live (matches the 9 e2e pins) |
| L6 | **The chunk-failure reproduction** | `scripts/probe-v18-chunk-failure.ts` (Playwright route-abort of the settings chunk, SPA nav from /Dashboard) | the SPA click to /StoreSettings with the settings chunk aborted → the app UNMOUNTS ENTIRELY: `h1: "This page couldn't load"`, body `"Reload to try again, or go back. Reload Back"`, `title: ""`; pageerror: **`ChunkLoadError: Failed to load chunk /_next/static/chunks/2w6vrdma1wc3u.js from module 53770`** (the Turbopack message form) | **F1** — reproduced with evidence |
| L7 | Error-boundary census | `rg` over src/ + `ls src/app/error.tsx global-error.tsx` | NO error.tsx, NO global-error.tsx, NO class ErrorBoundary, NO chunk retry/recovery anywhere | **F1** — the gap is total |
| L8 | The neo-crm reference pattern | read `src/lib/chunk-recovery.ts` + `src/app/error.tsx` + `src/app/global-error.tsx` + `tests/chunk-recovery.test.ts` (12 pins) from github.com/nordeim/neo-crm | the three-layer pattern: the pure injectable seam (message family / 10s cooldown / flag-before-reload loop guard / guarded storage), the segment card, the self-contained root card | the port template (SD-70) |
| L9 | INP (session_27's suggestion) | `scripts/probe-v18-inp.ts` (in-page rAF-bracketed click→ticket-paint, 10 samples) | min 5.3 · median 13.4 · max 14.4 ms on the seeded 12-product catalog | far under the 200 ms "good" INP bar — **no action** (the reference ships the same 12 products) |
| L10 | Tailwind v4 sweep | trap tests (green in L2) + `--color-` pin count + V17 diff review | 95 `--color-` entries in globals.css (the 61 V16 palette pins + the token family); the V17 diff added no new CSS patterns; the drawer's duration-200 remains the intended disclosed 200ms | no new v4 bugs |
| L11 | Environment contract | direct verification | `.env` = `DATABASE_URL="file:../db/custom.db"`; `db/custom.db` + `db/e2e.db` at the repo root; `.env.example` tracked + current; vitest 5 (`vitest.config.ts`) + Playwright (`playwright.config.ts`, standalone :3100) configured | ✓ |
| L12 | Dependencies | package.json census (43 deps) | next ^16.4.2 · react ^19 · tailwindcss ^4 · prisma ^6.11 · zustand ^5 · zod ^4.6 · vitest ^5 · playwright ^1.63 — matches the documented stack, no drift | ✓ |
| L13 | The e2e flake | first full-run failure: `functional-parity-v9.spec.ts:29:7 › /Ajustes renders the settings view`; isolated re-run 11/11; two further full runs 176/176 | one-time, unreproduced; the failure shape (heading never appears) matches a transient chunk-fetch failure crashing the page — exactly F1's blast radius | **F2** — hypothesis recorded; F1's auto-heal closes the user-facing path and self-heals the suite |

## 1. Findings

- **F1 — a failed view-chunk load crashes the whole app (no error
  boundary anywhere).** The V17 lazy registry renders `<ActiveView />`
  inside `<React.Suspense>` with NO error boundary above it, and the app
  ships no `error.tsx`/`global-error.tsx`. When a view chunk fails to
  load — a transient network blip, or the classic production case where a
  redeploy invalidates content-hashed filenames and a tab left open holds
  the old graph — `React.lazy` throws, the error unwinds past the
  Suspense (which is NOT an error boundary) past the page, and lands in
  Next 16's built-in root boundary: the ENTIRE app (sidebar, app bar,
  navigation) unmounts and the user gets an ENGLISH dead-end card
  ("This page couldn't load — Reload to try again, or go back") in a
  Spanish-UI app. Reproduced live (L6) with the exact Turbopack message
  form captured. The reference never lazy-loads (it ships its 2.3 MiB
  monolith upfront), so this is a production-readiness superset gap — the
  clone's architecture is faster but must also own its new failure mode.

- **F2 — one unreproduced e2e flake with F1's signature.** The first
  baseline e2e run failed `/Ajustes renders the settings view` (the
  heading never appeared); the isolated re-run and two further full runs
  are green. The most plausible root cause is a transient settings-chunk
  fetch failure during `page.goto` — which pre-F1 crashes the page (L6's
  exact shape). The F1 fix (the stale-chunk auto-reload) makes the
  transient case self-heal: the boundary catches the ChunkLoadError, the
  guarded reload refetches the chunk, the view renders — the user (and
  the suite) never see the failure. Recorded as a hypothesis (not
  "verified root cause" — the failure was not captured in the act).

- **F3 — the boot prefetch can leak an unhandled rejection.**
  `void VIEW_LOADERS[activeView]()` in the boot effect discards the
  promise without a catch; a rejected prefetch surfaces as an unhandled
  promise rejection (console noise at best, noise in error telemetry at
  worst). The lazy mount owns the real error path; the prefetch should
  be fire-and-forget-silent: `.catch(() => undefined)`.

## 2. Design decisions (resolved)

- **SD-70 — the three-layer error architecture (the neo-crm session-170
  port, adapted to this app).** Layer 1: `src/lib/chunk-recovery.ts` —
  the pure injectable seam (`isStaleChunkError` matching all five bundler
  message forms INCLUDING the captured Turbopack form
  `ChunkLoadError: Failed to load chunk … from module …`,
  `shouldHardReload` over the injected clock with the 10 s cooldown,
  `reloadOnStaleChunk` with storage/now/reload injectables, the
  flag-written-BEFORE-reload loop guard, and guarded storage access —
  unavailable storage disables the reload, never throws); the flag key
  is app-namespaced `veloxpos:chunk-reload-at`. Layer 2: the IN-PAGE
  view boundary in `src/app/page.tsx` — a class component wrapping the
  `<React.Suspense>` so a failed view keeps the SHELL (sidebar, app bar,
  navigation) alive; stale-chunk errors auto-reload once per cooldown
  window before the user reads any card; every other error renders the
  Spanish recovery card ("No se pudo cargar la vista" + "Reintentar") in
  the app's own card dialect (the `bg-[#0f121a] text-[#e7e9ef]` dialog
  chrome family + the `glass-button-primary` CTA grammar). Layer 3:
  `src/app/error.tsx` (the route-segment net for NON-view crashes — the
  same self-heal + a Spanish card in the 404's `vx-card` dialect +
  `reset()`) and `src/app/global-error.tsx` (the self-contained root net
  — its own `<html lang="es">` + `<body>` + a direct `./globals.css`
  import, zero component-tree imports per the neo-crm lesson that a
  resilience surface must not stand on the tree that broke).

- **SD-71 — the fresh-registry retry (the "Reintentar" semantics).**
  `React.lazy` caches a rejected initializer FOREVER — resetting an
  error boundary re-renders the same lazy instance and re-throws the
  cached error. The retry therefore rebuilds the registry: the lazy map
  moves into a `useMemo` keyed on a `viewEpoch` counter, and "Reintentar"
  bumps the epoch (fresh `React.lazy` instances → fresh `import()`
  attempts) before resetting the boundary. This also heals the
  persistent-block case honestly: if the chunk is genuinely gone the
  card stays; if the blip passed the view renders.

- **SD-72 — the prefetch hygiene.** The boot prefetch becomes
  `VIEW_LOADERS[activeView]().catch(() => undefined)` — fire-and-forget
  silent; the lazy mount owns the surfaced error (and the boundary owns
  the recovery).

- **SD-73 — the flake stays recorded, not "fixed".** F2 is a hypothesis
  with strong circumstantial evidence (the failure shape matches L6
  exactly); the honest position is: fix F1 (which makes the transient
  case self-healing for users AND the suite), keep `retries: 0` (the
  suite's no-hidden-flakes policy), and record the linkage in this
  ledger. If the flake recurs post-F1, it gets its own investigation.

## 3. Execution batches (TDD: red → green → gate)

### B1 — F1+F3 (SD-70/71/72): the seam + the boundaries

- `src/lib/chunk-recovery.ts` — the pure seam (the neo-crm port, the
  VeloxPOS namespace).
- `src/app/page.tsx`:
  - `VIEW_COMPONENTS` → a `useMemo`-ed `buildViewComponents()` keyed on
    `viewEpoch` (SD-71);
  - the boot prefetch gains `.catch(() => undefined)` (SD-72);
  - `<React.Suspense>` wraps inside a `ViewErrorBoundary` class
    component: `componentDidCatch` fires `reloadOnStaleChunk(error)`
    (stale chunks auto-reload once/10 s), the fallback renders the
    Spanish card with "Reintentar" (`setViewEpoch(n+1)` + reset).
- `src/app/error.tsx` — the segment net (Spanish card, 404 dialect,
  self-heal in the effect, `reset()` affordance, digest ref).
- `src/app/global-error.tsx` — the root net (self-contained html/body +
  globals.css, same card + self-heal).
- Unit pins (RED first) — `tests/chunk-recovery.test.ts`: the message
  family (incl. the captured Turbopack form), the cooldown arithmetic,
  the guarded reload (flag-before-reload ordering, cooldown suppression,
  non-chunk pass-through, storage-disabled, corrupt-record tolerance),
  the namespace + 10 s constants. `tests/functional-parity-v18.test.ts`
  (source pins): page.tsx wraps the Suspense in the boundary; the
  epoch-keyed registry rebuild; the prefetch `.catch`; error.tsx +
  global-error.tsx exist, import the seam, and render the Spanish copy;
  global-error imports globals.css; the v17 pins (no static view
  imports, the lazy map, the prefetch, the Suspense) stay green.

### B2 — the e2e pins (the realistic failure paths)

- `tests/e2e/functional-parity-v18.spec.ts`:
  1. **Shell survival (the headline contract):** discover the settings
     chunk at runtime (collect chunk URLs on a normal /StoreSettings
     load, find the body containing "Ajustes de la Tienda"), block it
     persistently, SPA-navigate from /Dashboard → the Spanish recovery
     card IS visible, the SHELL (sidebar) is STILL alive, and Next's
     English dead-end text is ABSENT.
  2. **Reintentar heals:** block ONCE (first request aborts, subsequent
     pass) → SPA-navigate → the card shows → click "Reintentar" → the
     fresh import succeeds → H1 "Ajustes de la Tienda" renders (the
     SD-71 fresh-registry semantics proven end-to-end).
  3. **The stale-chunk auto-reload self-heal:** abort the settings
     chunk's first TWO requests (boot prefetch + lazy mount), allow the
     rest → a FULL load of /StoreSettings auto-reloads → the view
     renders with no user action, and the cooldown flag
     (`veloxpos:chunk-reload-at`) is set in sessionStorage.

### B3 — the full gates

- `bun run lint` → `bun run typecheck` → `bun run build` → `bun run
  test` → `bun run test:e2e` — all green; the counts grow by the new
  pins (unit + the seam + the source pins; e2e +3).

### B4 — evidence

- The probe scripts committed (`scripts/probe-v18-chunk-failure.ts`,
  `scripts/probe-v18-inp.ts` — the L6/L9 evidence tooling).
- Screenshots: the recovery card state (the persistent-block case) +
  the healed view post-Reintentar, saved to `docs/screenshots/`
  (v18-prefixed), via a small capture script against :3101.
- The standard set stays as-is (no visual surface changed — the
  boundaries are failure-path-only surfaces).

### B5 — docs lockstep → commit + push

- AGENTS.md contract 31 (the error-recovery architecture + the
  fresh-registry rule: never re-add a bare Suspense without the
  boundary); CLAUDE.md (the v18 block + counts); README (the error
  recovery row + badge counts); PAD v2.6.0 + ADR-028 + §8 counts;
  retail-pos_SKILL.md v1.13.0; docs/session_29.md (this session's log);
  this plan's §6 execution ledger; worklog.md.
- Commit to main; SSH-wrapper push (no new branches).

## 4. Test plan (pins first — red)

Unit: the seam contract (13+ cases mirroring the neo-crm shape + the
Turbopack message form) + the source pins (6). E2e: the three
failure-path pins above. Everything existing stays green untouched (the
176 specs are the regression contract — none weakened).

## 5. Out of scope (disclosed)

- The react-dom boot floor (~890 ms) — the standing V17 disclosure.
- The reference's own broken/dead flows (the 403 settings save, the
  empty cashier combobox, the shift-gated terminal) — standing
  disclosures, no clone-side work; the reference's data state is
  unchanged (L3).
- INP optimization — measured 5–14 ms median (L9); nothing to do at
  reference-parity scale.
- All standing v8–v17 disclosures (SD-14, SD-18..SD-23, SD-63..69, the
  viewport-locked reference scrolling, the drawer's disclosed 200 ms,
  the oklab gradient interpolation, the a11y parity deviations).

## 6. Execution results (filled on completion — 2026-10-27)

All batches executed TDD; the unit pins ran red first (10 source pins +
the missing seam module) and went green on implementation; the e2e pins
were authored against the live failure semantics (see the L14 lesson
below) and all pass with the full suite as the regression net.

- **B1 (F1+F3, SD-70/71/72) — DONE.** The seam: `src/lib/chunk-recovery.ts`
  (the pure injectable form — `isStaleChunkError` matching all five
  bundler message forms incl. the captured Turbopack form,
  `shouldHardReload` over the injected clock, `reloadOnStaleChunk` with
  the flag-before-reload loop guard + guarded storage;
  `veloxpos:chunk-reload-at`, 10 s cooldown). The view boundary:
  `ViewErrorBoundary` in `src/app/page.tsx` wraps the Suspense, keyed
  `${view}-${viewEpoch}`; the registry moved into a `useMemo` keyed on
  the epoch (SD-71 — fresh `React.lazy` instances per retry); the boot
  prefetch is now `.catch(() => undefined)` (SD-72); the fallback is
  the Spanish card ("No se pudo cargar la vista" + "Reintentar" in the
  `bg-[#0f121a]` dialog chrome + `glass-button-primary` grammar). The
  outer nets: `src/app/error.tsx` (segment) + `src/app/global-error.tsx`
  (root, self-contained html/body + globals.css) — both Spanish, both
  self-healing, zero component-tree imports. Pins:
  `tests/chunk-recovery.test.ts` (13) +
  `tests/functional-parity-v18.test.ts` (10 source pins).
- **B2 (the e2e pins) — DONE, with one measurement lesson (L14).**
  `tests/e2e/functional-parity-v18.spec.ts` (3): SHELL SURVIVAL (the
  persistent block keeps the shell + the Spanish card; Next's English
  dead-end text absent), REINTENTAR HEALS (the cooldown-suppressed
  persistent block → the card; the block lifts; Reintentar → the
  fresh-registry import renders the view IN PLACE, the flag untouched),
  and THE SELF-HEAL (the full-load double abort → the guarded reload →
  the view renders with no user action, the cooldown flag set).
  **L14 — the runtime sits BELOW the boundary:** a SINGLE aborted chunk
  fetch never surfaces the card — the bundler runtime retries the fetch
  internally and the view renders below the boundary (debug-instrumented:
  request → FAILED → retry-request → render, no boundary catch, no
  reload, no card). The card is the surface for failures that PERSIST
  past the runtime's retry budget. The REINTENTAR pin therefore blocks
  persistently (exhausting the runtime retry) with the cooldown
  pre-seeded (suppressing the auto-reload), then lifts the block for
  the retry — the realistic flaky-network-recovering scenario.
- **B3 (gates) — ALL GREEN: lint 0 · tsc 0 · build ✓ · unit 509/509
  (486+23, 35 files) · e2e 179/179 (176+3).**
- **B4 (evidence) — DONE.** `docs/screenshots/v18-view-recovery-card.png`
  (the card + the shell alive) + `v18-view-recovery-healed.png` (the
  view rendered after Reintentar) — captured by
  `scripts/capture-v18-recovery.ts` against the booted standalone build;
  the probe scripts committed (`scripts/probe-v18-chunk-failure.ts` —
  the L6 reproduction; `scripts/probe-v18-inp.ts` — the L9 measurement).
  The standard 32-shot set unchanged (no visual surface changed — the
  boundaries are failure-path-only surfaces).
- **B5 (docs lockstep) — DONE.** AGENTS.md contract 31; CLAUDE.md the
  v18 block + the counts; README the badge + the error-recovery row;
  PAD v2.6.0 + ADR-028 + §8 counts; retail-pos_SKILL.md v1.13.0;
  docs/session_29.md; this ledger; worklog.

Environment audit: `.env` → `DATABASE_URL="file:../db/custom.db"` ✓;
`db/` at the repo root ✓; `.env.example` tracked and current ✓; vitest
+ playwright suites configured and extended ✓; the mobile drawer
contract re-verified live (L5) ✓; the reference state re-checked —
unchanged (L3) ✓.
