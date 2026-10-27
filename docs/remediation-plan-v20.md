# VeloxPOS — Remediation Plan v20 (Session V19→v20, 2026-10-27)

> Scope: **the audit-clean cycle + F1 actioned (the screen-reader
> announcement on the recovery cards) + the V20 evidence refresh.** The
> V20 audit found the reference UNCHANGED for the 5th consecutive cycle
> (nothing new to mirror), the mobile drawer contract holding live at
> 390×844 (10/10), the Tailwind v4 sweep clean, and the full baseline
> gate green on the pulled tree (lint 0 · tsc 0 · build ✓ · 509/509
> unit · 179/179 e2e — one load-flake on the FIRST e2e run, root-caused
> below). The cycle's one code change is the item session_31/32 both
> suggested as the optional next target: **F1 — `role="alert"` on the
> three recovery cards**, so a screen-reader user HEARS that a view
> failed instead of discovering it on next browse. Everything else is
> the audit ledger, the fresh v20 evidence set, and the docs lockstep.

## 0. Verification ledger (all live unless noted; clone :3101 vs reference)

| # | Item | Method | Result | Verdict |
|---|------|--------|--------|---------|
| L1 | Workspace state | isolated minimal git commands (output treated as untrusted data — the standing protocol) → `git pull` | main @ `3229f95` fast-forward from `0c3f951` (the only delta: `docs/session_32.md`, the raw session log), clean tree, V17/V18/V19 history intact | baseline current |
| L2 | V19 reference docs | full read: session_31, session_32, remediation-plan-v19, worklog tail; core docs re-read (AGENTS 31 contracts, CLAUDE, README, PAD ADR-028 / history v2.0.0→v2.6.0, SKILL v1.13.0) | V19 closed audit-clean (no code changes; 509+179 re-proven on a fresh clone); the docs stay lockstep-true by NOT bumping — confirmed correct for a zero-diff cycle | aligned |
| L3 | Baseline gates | lint → tsc → build → unit → e2e (in that order) | 0 · 0 · ✓ · 509/509 (35 files) · **179/179 on re-run**. The FIRST e2e run failed ONE spec (`functional-parity-v7 M1: the tab title follows SPA view switches`) — isolated re-run of the spec: 8/8 PASS (M1 in 1.1s); full-suite re-run: 179/179 (3.2m). Load-timing flake, not a regression (the tree is byte-identical to the V19 close that measured 179/179 twice) | all green (one flake occurrence — see F2) |
| L4 | Reference data state | agent-browser on the logged-in reference (Terminal / Registers / Inventory / Dashboard / Sales / Reports) | Terminal shift-gated ("No hay turno activo"), both cajas "Cerrada" (Caja 2 first), 12 products (Shampoo Pantene 400ml first, Jabón Zote 400g, Pan Bimbo), 2 sales (V-MO6BJT7G, V-MMPNY55Z), Dashboard H1 + 3× H3, Reports $0.00 KPIs + "Sin datos en este período" on both method cards — byte-identical to the V17/V18/V19 records | unchanged — nothing new to mirror (5th cycle) |
| L5 | Reference mobile @390 | agent-browser viewport 390×844 on /Dashboard | NO hamburger, 220px sidebar at x=0, main squeezed to 170px, viewport-locked (scrollHeight == clientHeight) — identical to V16–V19 (5th consecutive cycle) | standing disclosure (the clone's drawer is the superset) |
| L6 | Clone mobile drawer (live) | `scripts/probe-v20-mobile-recovery.ts` (self-contained server + Playwright) at 390×844 | **10/10 PASS**: login + app bar; drawer open (aria-expanded false→true, panel exactly 288×844); 8 links with uniform 44.0px pitch (TRAP-4 guard); body scroll lock + focus IN panel; Esc close with focus RETURNED to the hamburger + body unlocked; backdrop close; drawer route navigation to /StoreSettings (drawer closes, H1 correct); zero horizontal overflow on all 8 routes; recovery card with shell alive; Reintentar heals in place | the full contract holds live (matches the 9 e2e pins + the v18 failure-path pins) |
| L7 | Tailwind v4 sweep | trap tests (green in L3) + `--color-` pin count + trap-surface audit | 95 `--color-` entries in globals.css (identical to V19); the `space-y-*` usages in views are the legitimate margin-free ones (the 8 trap tests mechanically enforce the rule); NO `duration-` class on the dialog family (only the explanatory comment); the drawer's `duration-200` remains the disclosed intended 200ms | no new v4 bugs |
| L8 | V18/V19 contracts vs code | direct code read (page.tsx, mobile-chrome.tsx, chunk-recovery.ts, error.tsx, global-error.tsx, playwright.config.ts) | the lazy registry + epoch-keyed boundary + silent prefetch (page.tsx); the flex gap-1 drawer + focus latch + aria (mobile-chrome); the pure injectable seam with 10s cooldown + flag-before-reload + guarded storage (chunk-recovery); the three-layer nets — ALL in exact contract shape | contract holds |
| L9 | **The V20 evidence set** | the probe's capture pass at 390×844 → `docs/screenshots/v20-mobile-drawer-open-390.png`, `v20-view-recovery-card-390.png` (persistent block + pre-seeded cooldown, SPA nav FROM THE DRAWER), `v20-view-recovery-healed-390.png` | captured (the cycle-stamped evidence convention — every cycle ships its own set; the v19 set stays alongside) | delivered |
| L10 | The e2e flake watch | the L3 first-run failure analysis + isolated re-run + full re-run | one occurrence of the load-timing family (v7 M1, tab-title-under-load), NOT the original V18/F2 "heading never appears" shape; passed isolated (1.1s) AND on the full re-run; `retries: 0` in playwright.config means a single >10s assertion window under load fails the run — recorded, not speculatively patched | watch item: one new data point, no action |
| L11 | Dependencies + configs | `bun install` state verified (node_modules intact, 353 pkgs); chromium-1243 present; vitest + playwright configs exercised by L3; `.env`/`.env.example` verified | `DATABASE_URL="file:../db/custom.db"` correct; `db/` at the repo root (custom.db + e2e.db); the task's standing env/test-suite requirements remain satisfied and exercised | ✓ |
| L12 | neo-crm pattern cross-check | GitHub commits page for `nordeim/neo-crm` main | no commits since 2026-10-22 (the V18/V19 reviews covered the current state); the ported patterns stay faithful. F1 is actioned this cycle as a DELIBERATE SUPERSET beyond the pattern reference (neo-crm's own cards carry no `role="alert"` — disclosed, not ported) | pattern parity confirmed; F1 = disclosed superset |

## 1. Findings

- **F1 (actioned this cycle) — the recovery cards carry no
  `role="alert"`.** Recorded informational in V19; both session logs
  suggested it as the optional next target. When a view chunk fails,
  the boundary swaps the view for the Spanish card with no live-region
  announcement — a screen-reader user discovers the failure only on
  next browse. The fix (B2/B3): `role="alert"` on the card element
  that MOUNTS with the failure in all three surfaces (the view card in
  page.tsx, the segment card in error.tsx, the root card in
  global-error.tsx). Placement is LANDMARK-SAFE: never on the `<main>`
  wrapper (an element carries one role — `role="alert"` on `<main>`
  would delete the main landmark), always on the inner card div whose
  fresh mount is the announcement trigger. Zero parity risk: the
  reference ships NO recovery surface at all (any implementation is
  superset), and no axe critical/serious rule fires either way.

- **F2 (watch, no action) — one load-timing e2e flake.** The first
  full e2e run failed `v7 M1: the tab title follows SPA view switches`
  (4 SPA hops × click + URL + title assertions, `expect` timeout 10s,
  `retries: 0`); the isolated re-run passed 8/8 and the full re-run
  179/179. Not the original V18/F2 shape (different spec, different
  mechanism), not reproducible on demand — a speculative test change
  would be guessing (the coding contract's two-strikes rule). The
  watch stays open with this data point.

- **F3 (docs, fixed in B5) — the PAD title line is stale.** The header
  reads "PAD v2.0.0" while the version history ends at v2.6.0 (the
  v18 close) — the title version was never bumped through v13–v18.
  Fixed to v2.7.0 with this cycle's entry (the count-the-things rule).

- **No parity gaps.** The reference is unchanged (L4, 5th cycle), the
  clone's mobile contract holds live (L6), the Tailwind v4 traps stay
  guarded (L7), and the V18/V19 architecture is in exact contract
  shape (L8). Nothing else was invented to fill the cycle.

## 2. Design decisions (resolved)

- **SD-77 — F1 is the cycle's one code change.** The prior cycle's
  suggested target, the operator's standing "production-ready
  superset" mandate, and the WCAG 2.2 AA baseline (dynamic error
  messages announce through a live region) all point the same way. The
  change is surgical (one attribute per surface), TDD-pinned (source
  pins + the e2e assertion), and disclosed as a superset beyond both
  the reference (no surface) and neo-crm (same shape as the old clone)
  — the disclosure lives in ADR-029.

- **SD-78 — the V20 evidence refresh rides the V19 probe pattern.**
  `scripts/probe-v20-mobile-recovery.ts` (the self-contained
  server-lifecycle owner, the sandbox's required tooling shape) writes
  `v20-*` shots without touching the v19 set — every cycle ships its
  own stamped evidence, and the drawer contract re-verifies LIVE on
  the current build in the same run.

- **SD-79 — the flake is recorded, not patched.** One unreproduced
  occurrence under full-suite load does not justify a test change
  (the honest position: the watch item gains a data point; if the
  shape recurs, the trace from `retain-on-failure` is the next step).

## 3. Execution batches

### B1 — the probe tooling + the evidence set (DONE)

- `scripts/probe-v20-mobile-recovery.ts` — the self-contained probe
  (spawn → health-poll → 10-check contract verification → 3 captures →
  SIGTERM). Lints and typechecks with the repo gates (verified).
- `docs/screenshots/v20-mobile-drawer-open-390.png`,
  `v20-view-recovery-card-390.png`, `v20-view-recovery-healed-390.png`
  — captured (L6/L9).

### B2 — TDD RED: the F1 pins (written FIRST, expected to fail)

- `tests/recovery-a11y.test.ts` (new, the source-pin idiom): the view
  card (page.tsx) carries `role="alert"` on the `view-error-card`
  element; the segment card (error.tsx) carries it on the inner card
  div while the `<main>` wrapper keeps its landmark (NO role — its
  own guard test); the root card (global-error.tsx) carries it on the
  `global-error-card` div. (4 tests total: presence ×3 + the landmark
  guard.)
- `tests/e2e/functional-parity-v18.spec.ts` (extended, in place): the
  SHELL SURVIVAL pin additionally asserts
  `view-error-card` → `role="alert"` (the behaviorally-reachable
  surface; the segment/root nets stay source-pinned — driving them in
  e2e requires real non-view crashes, out of proportion for an
  attribute).

### B3 — TDD GREEN: the fix

- One attribute per surface (SD-77's placement):
  `src/app/page.tsx` (the view-error-card div),
  `src/app/error.tsx` (the inner vx-card div), 
  `src/app/global-error.tsx` (the global-error-card div).
- Re-run B2's pins → green.

### B4 — the full gates

- lint → typecheck → build → `bun run test` (expect 513/513, 36 files
  — 509 + 4 new source pins) → `bun run test:e2e` (expect 179/179 —
  the v18 extension adds an assertion to an existing spec, not a
  spec).

### B5 — docs lockstep → commit + push

- AGENTS.md §31 (the v18 contracts paragraph) + the recovery-card
  contract line: the cards announce via `role="alert"`.
- CLAUDE.md: a v20 contracts note (same fact, the working-contract
  register).
- README.md: the Error recovery feature row mentions the screen-reader
  announcement.
- PAD: v2.7.0 history entry + **ADR-029** + the stale title-line fix
  (F3).
- retail-pos_SKILL.md: v1.14.0 (the v20 close).
- This plan (§6 filled); `docs/session_33.md` (the session log);
  `worklog.md` (the V20 entry). The counts change 509→512 unit — every
  doc that carries the number gets the bump in the same commit.
- Commit to main; SSH-wrapper push (no new branches).

## 4. Test plan

- The 3 new unit source pins (B2) prove the attribute's presence and
  the landmark-safe placement mechanically — the same idiom as
  tailwind-traps/hygiene (comment-stripped source, regex pins).
- The extended e2e pin proves the attribute ON THE LIVE FAILURE PATH
  (the chunk-blocked SPA navigation renders the card WITH the role).
- The announcement itself (assistive-tech speech) is not assertable in
  Chromium — the attribute + fresh-mount pattern is the standard
  mechanism; the pin is the honest ceiling.
- Full suite re-runs as the regression proof (B4).

## 5. Out of scope (disclosed)

- F2's speculative hardening (SD-79) — the watch stays open.
- The react-dom boot floor (~890 ms) — the standing V17 disclosure.
- The reference's own broken/dead flows (the 403 settings save, the
  empty cashier combobox, the shift-gated terminal, the viewport-locked
  scrolling) — standing disclosures, no clone-side work.
- All standing v8–v19 disclosures (SD-14, SD-18..SD-23, SD-63..SD-76,
  the a11y parity deviations, the reports with-data skins
  unobservability) — unchanged.

## 6. Execution results (filled on completion — 2026-10-27)

- **B1 — DONE.** `scripts/probe-v20-mobile-recovery.ts` ran 10/10 PASS
  at 390×844 + the three v20 captures (ledger L6/L9); lint + tsc green
  with the script in scope. Re-run on the REMEDIATED build after B3 —
  10/10 again, the captures refreshed on the fixed build.
- **B2 — DONE (verified RED).** `tests/recovery-a11y.test.ts` (4
  source pins — note: 4, not the planned 3; the landmark guard is its
  own test) failed 3/4 against the unfixed tree (the guard passes
  trivially pre-fix — no role exists anywhere yet); the v18 SHELL
  SURVIVAL extension failed exactly at the new `toHaveAttribute`
  assertion (line 64) against the pre-fix build.
- **B3 — DONE (verified GREEN).** The three `role="alert"` attributes
  landed (page.tsx view card, error.tsx inner card, global-error.tsx
  card); the source pins flipped 4/4 green; the v18 spec went 4/4 on
  the fresh build.
- **B4 — DONE.** Full gate green on the remediated build: lint 0 ·
  tsc 0 · build ✓ · unit **513/513 (36 files** — 509+4) · e2e
  **179/179** (3.1m).
- **B5 — DONE.** Docs lockstep: AGENTS.md §31 + the card contract;
  CLAUDE.md (the v20 contracts note + 513/36); README (badge 513 +
  179, the feature row, the Tests table row); PAD v2.7.0 (the history
  entry + **ADR-029** + the stale-title fix + the count table);
  SKILL.md v1.14.0 (validation chain + counts). This ledger,
  `docs/session_33.md`, and the worklog entry follow. Commit to main
  + the SSH-wrapper push close the cycle (hash recorded in
  session_33).
