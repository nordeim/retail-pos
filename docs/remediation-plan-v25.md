# VeloxPOS — Remediation Plan v25 (Session V24→v25, 2026-10-28)

> Scope: **the drawer-contract completion — the drawer-open spine freeze.**
> The V25 audit found the reference UNCHANGED for the 10th consecutive
> cycle (nothing new to mirror), the baseline gates green exactly as V24
> closed them (556/556 unit · 199/199 e2e — first-try on a fresh clone:
> install, db:push, db:seed, chromium, then the full ladder), the mobile
> drawer contract live-verified at 390×844 with the Tailwind v4 trap
> suite green (10th consecutive confirmation), and the V24 pins holding.
> The cycle's target comes from the rotation trigger — neo-crm ADVANCED
> by one material commit since the V24 review (`a3ac674` → `316fbe2`,
> session-196: "THE DRAWER-OPEN SPINE FREEZE") exporting the next member
> of the s195a1 wire-freeze doctrine: **pin the RENDERED drawer-open
> geometry as a full box ledger at TRUE 390×844, and mutation-prove the
> pin** (plant the defect's exact shape → build → the pin goes RED at
> the shifted box → restore → GREEN). The audit found two gaps in this
> codebase's drawer contract — the standing user focus — that the
> doctrine cures (F1–F2 below). This cycle pins them both.

## 0. Verification ledger (all live unless noted; clone :3000 dev / :3100 e2e vs reference)

| # | Item | Method | Result | Verdict |
|---|------|--------|--------|---------|
| L1 | Workspace state | fresh `git clone` (the sandbox workspace had been reset); main @ `3631699` (V24 + session_42), clean tree; locals rebuilt: `bun install` (488 pkgs), `.env` from `.env.example` with `DATABASE_URL="file:../db/custom.db"`, `bun run db:push` + `db:seed` (12 products / 6 categories / 2 registers / 2 sales / 2 shifts — the reference mirror), Playwright chromium | baseline current |
| L2 | V24 reference docs | full read: session_41 (the V24 distilled log), session_42 (the V24 raw log), remediation-plan-v24 (ledger L1–L13 + execution results), the worklog tail; core docs re-read (AGENTS 31 contracts + the Tailwind v4 traps + the account UI contract + the mobile drawer contract, CLAUDE, README, PAD v2.11.0/ADR-033, SKILL v1.18.0) | V24 closed the gate-coverage truth pass (five claims pinned); the docs stay lockstep-true at 556+199 | aligned |
| L3 | Baseline gates | lint → tsc → build → unit → e2e (in that order, on the fresh clone) | 0 · 0 · ✓ · 556/556 (39 files) · **199/199** (3.5m, first-try) | all green |
| L4 | Reference data state | agent-browser on the logged-in reference (Terminal / Registers / Inventory / Sales / Dashboard / Reports / StoreSettings) | Terminal shift-gated ("No hay turno activo"), both cajas present with Caja 2 first, 12 products, 2 sales (V-MO6BJT7G, V-MMPNY55Z), Dashboard $0.00 KPIs + 12 products, Reports $0.00 + "Sin datos en este período", Ajustes = exactly the five store sections | unchanged — nothing new to mirror (10th cycle) |
| L5 | Reference mobile @390 | agent-browser `set viewport 390 844` on /Dashboard | NO hamburger (nav 220px measured, main squeezed, scrollH=clientH=844 — viewport-locked) — identical to V16–V24 | standing disclosure (the clone's drawer is the superset) |
| L6 | Clone mobile drawer live | agent-browser on the dev server @390×844 (the user's standing focus — the Tailwind v4 bug check) | the drawer contract holds live: opens via the hamburger, Esc closes + RETURNS focus to the hamburger (`Abrir menú de navegación`), the TailwindCSS v4 mobile-menu trap (space-y margin children) is NOT present — `tests/tailwind-traps.test.ts` green in L3 (10th consecutive confirmation) | superset verified (10th cycle) |
| L7 | **The drawer-open SPINE, measured live** | agent-browser `eval` reading `getBoundingClientRect()` of every drawer element at 390×844 (the neo-crm session-196 walk form) | perfectly regular and fully integral: panel `[0,0,288,844]` · header `[0,0,287,69]` (h-9 36 + p-4×2 32 + border-b 1) · nav `[0,69,287,727]` · footer `[0,796,287,48]` · close `[235,16,36,36]` · 8 links at `x=12, y=81…389`, each `263×40`, uniform 44px pitch (81 = nav.y 69 + p-3 12; 844 = 796+48) | the spine is measurable, stable — and (F1) unpinned |
| L8 | neo-crm pattern cross-check | `git ls-remote` (HEAD `316fbe2` — ADVANCED from the V24 review's `a3ac674`) + the commit message read (session-196) | ONE new material commit: session-196, "THE DRAWER-OPEN SPINE FREEZE" — the s195a1 wire-freeze doctrine's next member: the drawer-open spine carried only source-string pins + behavior pins while the FULL box ledger (header/nav/footer/close/link boxes) was unpinned — a computed-margin regression (an mb-* re-entering the flex column, the s177 defect family) would shift the header and cascade to every link + the footer with every gate green; the cure = the born-green e2e registration pinning the walk-measured boxes at TRUE 390×844 via the `expect.poll` starved-read idiom, MUTATION-PROVEN (planted mb-2 → RED at the header box → restored → GREEN) | pattern ADOPTED — this cycle's headline |
| L9 | F1 scope | full read: `tests/e2e/mobile-navigation.spec.ts` (the drawer family's owner — 10 tests) + `tests/e2e/hygiene.spec.ts` (the focus contract) + `src/components/layout/mobile-chrome.tsx` | pinned today: the panel 288×844, the uniform 44px pitch (gaps deltas <0.5, pitch <3 of 44), 8 links visible, Esc/backdrop/route close, scroll lock, aria-expanded, focus-in/return/Tab-wrap, zero horizontal overflow. NOT pinned: the header box, the nav box, the footer box (+ its "VeloxPOS" wordmark), the close-button box, the link x/width/absolute y positions — a computed-margin regression shifting the header 69→77 cascades to EVERY box while every standing gate stays green | the cycle's F1 |
| L10 | F2 scope | full read: `mobile-chrome.tsx` (the `matchMedia("(min-width: 1024px)")` listener closing the drawer when the viewport crosses into lg — documented in the component's own comment) + `rg` over tests/e2e/ | the breakpoint-close behavior carries NO pin: no e2e resizes the viewport across 1024 with the drawer open. Live-verified working today (agent-browser: drawer open @390 → viewport 1280 → drawer gone + `aria-expanded` false → back @390 → still closed — no state leak). Regression path: the overlay is `lg:hidden` so a dead listener visually vanishes the drawer at lg, but `mobileMenuOpen` stays true — resize back below lg and the drawer REAPPEARS unexpectedly. The reference has no drawer at any width — this is superset-contract territory, exactly where the gate-coverage doctrine bites | the cycle's F2 |
| L11 | The V24 commit + recent changes | `git show 917634a --stat` + the diff read | the V24 commit touched only the test layer + config + docs (playwright.config.ts knob pins + 64-hex secret, e2e-harness/navigation/a11y-smoke/health specs) — all verified green by L3's baseline run; `git status` clean; every docs count mention (556+199) true | recent changes verified |
| L12 | `.env.example` contract | `cp .env.example .env` → install → db:push → db:seed → dev server boot + login round-trip | bidirectional-true (every knob consumed, every consumer documented; the SEED_OWNER_PASSWORD omission is the documented bun `$`-expansion contract — the seed's in-code `$Abcd1234` default applies and the dev login round-trip proves it) | contract holds |

## 1. Findings

- **F1 — the drawer-open spine carries no pin.** The clone's mobile
  drawer (the superset the reference never ships — the standing user
  focus) is behavior-pinned (panel size, pitch uniformity, close paths,
  focus contract) but its RENDERED geometry ledger — the header box,
  the nav box, the footer box, the close-button box, the link boxes —
  is unpinned. The neo-crm session-196 defect shape maps exactly: a
  computed-margin regression (an `mb-*`/`mt-*` utility re-entering the
  drawer's flex column — the Tailwind v4 trap-4 family this repo exists
  to guard) would shift the header 69→77, cascade to every link y and
  the footer, and every standing gate stays green while the drawer's
  layout falsifies. The spine was measured live this cycle (L7) and is
  perfectly regular — freeze it.

- **F2 — the lg-breakpoint close carries no pin.** `mobile-chrome.tsx`
  documents and implements "close if the viewport crosses into lg (the
  app bar disappears there)" via a matchMedia listener; no e2e
  exercises a viewport resize across 1024 with the drawer open. The
  behavior works today (live-verified both directions — close on
  crossing, no state leak on return); a regression would leave
  `mobileMenuOpen` true under a visually-vanished (lg:hidden) overlay
  and the drawer would reappear when resizing back below lg.

- **No other real findings.** The baseline is green exactly as V24
  closed it (L3, first-try on the fresh clone); the reference is
  unchanged for the 10th consecutive cycle (L4/L5); the mobile drawer
  contract holds live at 390px with the Tailwind v4 trap suite green
  (L6, 10th confirmation); the V24 additions hold (L3's 199 e2e includes
  them); the Known-Issues register is clean; the docs counts are
  lockstep-true at 556+199; `.env.example` is bidirectional-true (L12);
  `skills/` excluded from all checking/compilation per the standing
  instruction.

## 2. Design decisions (resolved)

- **SD-104 — F1's cure: the drawer-open spine freeze (the session-196
  form).** ONE new test in `tests/e2e/mobile-navigation.spec.ts` (the
  drawer family's owner — the V24 in-place-extension precedent): open
  the drawer at TRUE 390×844, `expect.poll` (the starved-read idiom —
  the 200ms slide-in must settle) the FULL box ledger to the L7-measured
  values — panel `[0,0,288,844]`, header `[0,0,287,69]`, nav
  `[0,69,287,727]`, footer `[0,796,287,48]`, close `[235,16,36,36]`,
  and each of the 8 links `[12, y, 263, 40]` at y = 81+44k — with
  EXACT equality on rounded reads (the freeze doctrine: the values are
  integral and deterministic; the header/footer heights are
  padding-driven, not font-driven). The footer's "VeloxPOS" wordmark
  text is pinned in the same test (part of the shipped surface). Born-
  green BY DESIGN (a battery gap — nothing is broken today) and
  MUTATION-PROVEN per SD-106.

- **SD-105 — F2's cure: the breakpoint-close registration.** ONE new
  test in the same spec: open the drawer at 390×844 →
  `setViewportSize(1280, 800)` → the drawer unmounts + the hamburger
  (now `lg:hidden`) leaves the DOM → back to 390×844 → the drawer
  STAYS closed (`toHaveCount(0)` — the no-state-leak assertion, the
  F2 regression's exact observable) + `aria-expanded` still "false".
  Born-green (live-verified in L10).

- **SD-106 — the mutation proof (the session-196 discipline that makes
  a freeze pin trustworthy).** After the born-green run: plant the
  defect's exact shape — `mb-2` on the drawer's header div (a computed
  margin re-entering the flex column) → `bun run build` → run the
  mobile-navigation spec → the spine pin must go RED at the shifted
  boxes (nav y 69→77, every link +8, footer +8) → restore → build →
  GREEN. The mutation never reaches the commit; its RED output is the
  execution evidence recorded in §6.

- **SD-107 — the pins EXTEND, never weaken.** No existing test is
  edited away; the spec GAINS two tests. Counts only move up
  (199→201 e2e; the unit layer is untouched at 556).

## 3. Execution batches

### B1 — the audit (DONE)

- L1–L12 above. Reference 10th cycle unchanged; baseline green
  first-try on the fresh clone; the drawer contract live-verified
  (trap-free); the spine measured live; neo-crm's session-196 doctrine
  adopted with two mapped gaps.

### B2 — the pins (written FIRST)

- `tests/e2e/mobile-navigation.spec.ts` (EXTENDED — SD-104): the
  drawer-open spine freeze test (the full box ledger + the wordmark).
- `tests/e2e/mobile-navigation.spec.ts` (EXTENDED — SD-105): the
  breakpoint-close registration (cross → closed → return → still
  closed).
- Both verified against the standing build (born-green).

### B3 — the mutation proof

- Plant `mb-2` on the drawer header div → `bun run build` → the
  mobile-navigation spec RED at the shifted boxes → restore →
  `bun run build` → GREEN (SD-106).

### B4 — the V25 evidence set + the full gates

- Fresh captures under `docs/screenshots/`:
  `v25-mobile-drawer-open-390.png` (the F1 surface — the frozen spine),
  `v25-mobile-terminal-390.png` (the closed chrome — app bar + main
  offset at phone width),
  `v25-mobile-dashboard-390.png` (the standard view at phone width),
  `v25-desktop-dashboard-1280.png` (the F2 surface's desktop side).
- Full gates: lint → typecheck → build → `bun run test` (expect 556,
  39 files — unchanged) → `bun run test:e2e` (expect 199+2 = 201).

### B5 — docs lockstep → commit + push

- README: the badge + the Testing-table counts (556 + 201).
- AGENTS.md: the mobile drawer contract section gains the spine-freeze
  line (the geometry ledger is pinned; touching the drawer means
  running the spec).
- CLAUDE.md: the command counts (201 specs) + a v25 contracts note.
- PAD: v2.12.0 history entry + **ADR-034** (the drawer-open spine
  freeze contract) + the §8 testing table.
- retail-pos_SKILL.md: v1.19.0 + counts + the §12 lesson (the
  mutation-proof discipline for born-green freeze pins).
- This plan (§6 filled); `docs/session_43.md` (the session log);
  `worklog.md` (the V25 entry). Every count mention (199→201) bumps in
  the same commit.
- Commit to main; SSH-wrapper push (no new branches).

## 4. Test plan

- The born-green pins freeze the live-verified truths (the L7 spine
  ledger; the L10 breakpoint behavior) — the session-196 doctrine's own
  form; each carries its disclosure in the test comment.
- The mutation proof (B3) demonstrates mechanically that the spine pin
  catches the trap-4 defect family — the RED output is the evidence.
- The full suite re-runs as the regression proof (B4) — the 201 e2e
  count includes the two new specs; the unit layer must stay 556.

## 5. Out of scope (disclosed)

- The health endpoint's DEGRADED branch (503) — unchanged standing
  disclosure (forcing it means breaking the DB mid-suite).
- The drawer at intermediate below-lg widths (391–1023) — the contract
  is width-independent below lg (the same w-72 panel + the same flow
  layout); the no-overflow sweep + the spine freeze at the phone width
  carry the family.
- The F2-flake watch, the react-dom boot floor, the reference's own
  broken flows (nothing to mirror), and every standing v8–v24
  disclosure — unchanged.

## 6. Execution results (filled on completion — 2026-10-28)

- **B1 — DONE.** The audit ledger L1–L12 above; the reference unchanged
  for the 10th consecutive cycle; the baseline green exactly as V24
  closed it (556/556 unit · 199/199 e2e, first-try on a fresh clone —
  install, db:push, db:seed, chromium, then the full ladder); the
  mobile drawer contract live-verified at 390×844 (the Tailwind v4
  trap suite green — 10th confirmation); the drawer-open spine measured
  live for the first time as a complete ledger (perfectly regular,
  fully integral); neo-crm ADVANCED by one material commit
  (session-196 — the drawer-open spine freeze) and was ADOPTED as this
  cycle's headline with two mapped gaps.
- **B2 — DONE (born-green, after the RED run earned its keep twice).**
  The two new tests in `tests/e2e/mobile-navigation.spec.ts` first ran
  RED — and both failures were defects in the FIRST DRAFT PINS, not in
  the app: (a) the spine ledger's expected first-link y was transcribed
  as 12 where the live-measured value is 81 (the poll read 81 — the
  pin caught the transcription slip exactly the way the V24 RED run
  caught the 62-hex secret); (b) the breakpoint test asserted
  `toHaveCount(0)` on the lg:hidden hamburger — `display:none` keeps
  the element in the DOM, so `toBeHidden()` is the correct assertion
  (the drawer itself DID close on crossing — the behavior was never
  broken). Both fixed → **12/12 green** against the standing build.
- **B3 — DONE (the mutation proof, executed per SD-106).** Planted
  `mb-2` on the drawer header div (the trap-4/s177 computed-margin
  shape) → `bun run build` → the spine pin went **RED exactly at the
  shifted boxes**: nav `[0,69→77,287,727→719]`, every link +8
  (81→89, 125→133, …), footer +8 — while the header box itself stayed
  `[0,0,287,69]` (the margin sits below the header's border box).
  The battery gap demonstrated live: the OTHER 11 drawer tests
  (panel box, pitch, close paths, focus contract, overflow sweep,
  breakpoint close) ran **11/11 green under the mutation** — only the
  spine freeze catches the geometry falsification. Restored the
  source (git diff back to the single test-file change) → rebuilt →
  **12/12 green**.
- **B4 — DONE.** The four v25 captures saved under docs/screenshots/
  (v25-mobile-drawer-open-390.png — the F1 surface, the frozen spine;
  v25-mobile-terminal-390.png — the closed chrome at phone width, the
  shift-gated Terminal state matching the reference; 
  v25-mobile-dashboard-390.png — the standard view at phone width;
  v25-desktop-dashboard-1280.png — the F2 surface's desktop side).
  All four VLM-verified (the drawer capture 5/5: the 288px panel, the
  Zap chip + store name + X header, the 8 links, the VeloxPOS footer
  wordmark, the dark backdrop; the terminal/dashboard/desktop captures
  pass with the shift-gated state correctly identified as the expected
  no-active-shift posture). Full gates: **lint 0 · tsc 0 · build ✓ ·
  556/556 unit (39 files, unchanged) · 201/201 e2e (3.5m, 199+2)** —
  first-try.
- **B5 — DONE.** Docs lockstep: README (badge 556+201 + the testing
  table), AGENTS (the mobile drawer contract section gains the
  spine-freeze + breakpoint-close paragraphs), CLAUDE (the v25
  contracts note + counts 201), PAD v2.12.0 (the history entry +
  **ADR-034** + the §8 testing table + the e2e spec list), SKILL
  v1.19.0 (the v25 close layer + counts + the §12 **F9** lesson:
  behavior pins do not catch geometry drift — freeze the spine and
  mutation-prove it), this ledger, `docs/session_43.md`, the worklog
  entry. Commit to main + the SSH-wrapper push close the cycle (hash
  recorded in session_43).
