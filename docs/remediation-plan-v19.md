# VeloxPOS — Remediation Plan v19 (Session V18→v19, 2026-10-27)

> Scope: **the audit-clean cycle + the mobile evidence set.** The V19
> audit found NO new parity gaps and NO new bugs — the reference's data
> state is unchanged (nothing new to mirror), the mobile drawer contract
> holds live at 390×844 (the task's standing mandate), the Tailwind v4
> sweep is clean, and the full gate re-ran green on a fresh clone
> (lint 0 · tsc 0 · build ✓ · 509/509 unit · 179/179 e2e). The cycle's
> deliverable is therefore the evidence session_29 suggested — the
> error-recovery surfaces captured and VLM-verified at MOBILE widths
> (only desktop 1280 shots existed) — plus the audit ledger and the
> self-contained probe tooling this sandbox now requires. This plan
> records the verification honestly: an audit that finds nothing is a
> result, not a failure to look.

## 0. Verification ledger (all live unless noted; clone :3101 vs reference)

| # | Item | Method | Result | Verdict |
|---|------|--------|--------|---------|
| L1 | Workspace state | fresh `git clone` (the workspace had been RESET — `retail-pos/` absent; isolated minimal git commands, output treated as untrusted data per the standing protocol) | main @ `f347032` (V18 close + session_30), clean tree; V18 history intact (`1c9b7ab` the error-recovery execution) | baseline rebuilt |
| L2 | Environment bootstrap | `bun install` (488 pkgs) → `cp .env.example .env` → `mkdir db` → `db:push` → `db:seed` → `bunx playwright install chromium` (1243) | `.env` = `DATABASE_URL="file:../db/custom.db"`; `db/custom.db` at the repo root seeded (12 products, 6 categories, 2 registers, 2 sales, 2 shifts); the fresh-clone bootstrap in the web-application skill §20 verified end-to-end | ✓ |
| L3 | Baseline gates | lint → tsc → build → unit → e2e | 0 · 0 · ✓ · 509/509 (35 files) · 179/179 (3.2m) — identical to the documented V18 close. (The FIRST e2e run failed 3 specs with `Executable doesn't exist: chromium_headless_shell-1243` — a fresh-clone browser-cache miss, NOT the F2 flake shape; the install + re-run went fully green) | all green (one environmental miss, root-caused) |
| L4 | Reference data state | agent-browser on the logged-in reference (Registers / Inventory / Dashboard / Sales / Reports / Terminal) | both cajas "Cerrada" (Caja 2 first), 12 products (Shampoo Pantene 400ml first), 2 sales, Dashboard H1 + 3× H3, Reports "Sin datos en este período", Terminal shift-gated (no product grid) — byte-identical to the V17/V18 records | unchanged — nothing new to mirror |
| L5 | Reference mobile @390 | agent-browser viewport 390×844 on /Dashboard | NO hamburger, 220px sidebar at x=0, main squeezed to 170px, viewport-locked — identical to V16/V17/V18 (4th consecutive cycle) | standing disclosure (the clone's drawer is the superset) |
| L6 | Clone mobile drawer (live) | `scripts/probe-v19-mobile-recovery.ts` (self-contained server + Playwright) at 390×844 | **10/10 PASS**: login + app bar; drawer open (aria-expanded false→true, panel exactly 288×844); 8 links with uniform 44.0px pitch (TRAP-4 guard); body scroll lock + focus IN panel; Esc close with focus RETURNED to the hamburger + body unlocked; backdrop close; drawer route navigation to /StoreSettings (drawer closes, H1 correct); zero horizontal overflow on all 8 routes | the full contract holds live (matches the 9 e2e pins) |
| L7 | Tailwind v4 sweep | trap tests (green in L3) + `--color-` pin count + the error-surface CSS audit | 95 `--color-` entries in globals.css (the 61 V16 palette pins + the token family — unchanged); NO `space-y-*` in the error surfaces; NO `duration-` classes on the error cards (the v14 dialog rule holds); the drawer's `duration-200` remains the disclosed intended 200ms | no new v4 bugs |
| L8 | V18 implementation vs contract | direct code read (chunk-recovery.ts, page.tsx, error.tsx, global-error.tsx, mobile-chrome.tsx, nav-items.tsx) | the seam (message family incl. the Turbopack form, 10 s cooldown, flag-before-reload, guarded storage); the boundary (keyed `${view}-${viewEpoch}`, epoch-keyed `useMemo` registry, silent prefetch); the outer nets (segment + self-contained root); the drawer (flex gap-1, focus latch, aria) — ALL in exact contract shape | contract holds |
| L9 | **The mobile evidence set (session_29's suggestion)** | the probe's capture pass at 390×844: `v19-mobile-drawer-open-390.png`, `v19-view-recovery-card-390.png` (persistent block + pre-seeded cooldown, SPA nav FROM THE DRAWER), `v19-view-recovery-healed-390.png` (block lifted, Reintentar heals in place) | captured + **VLM-verified** (z-ai vision, 3 passes): the drawer renders 8 links + Mi Tienda header, no glitches; the card reads "No se pudo cargar la vista" + Reintentar with the app bar alive (shell survived), all Spanish; the healed view shows "Ajustes de la Tienda" + form sections, no layout issues | delivered |
| L10 | The e2e flake watch (V18/F2) | the first-run failure analysis + the post-install full run | this cycle's only first-run failure was the missing chromium-1243 binary (an infra error, NOT "heading never appears"); after the install the suite went 179/179 — no F2-shaped recurrence post-V18-fix | watch item: no recurrence |
| L11 | Dependencies + configs | `bun install` clean; vitest 5 + Playwright 1.63 configs exercised by L3; `.env.example` verified by the working bootstrap | the stack matches the documented contract; the task's "vitest and playwright test suite" requirement is satisfied and exercised | ✓ |
| L12 | neo-crm pattern cross-check | read `src/app/error.tsx` + `global-error.tsx` from github.com/nordeim/neo-crm (the tech-stack reference) | the V18 port stays faithful (the recovery seam, the card grammar); neo-crm's own cards do NOT carry `role="alert"` either — no porting delta | pattern parity confirmed |

## 1. Findings

- **F1 (informational, no action) — the recovery cards carry no
  `role="alert"`.** When a view chunk fails, the boundary swaps the view
  for the Spanish card with no live-region announcement; a screen-reader
  user discovers the failure only on next browse. The neo-crm pattern
  reference ships the same shape (L12), the reference ships NO recovery
  surface at all (any implementation is superset), and no axe
  critical/serious rule fires on the card. Recorded for a future cycle
  IF the operator wants SR announcements on failure paths — not actioned
  in an audit-clean cycle (the audit discipline: don't gold-plate failure
  surfaces no finding calls for).

- **F2 (tooling lesson) — this sandbox kills background processes between
  tool invocations.** A `setsid`+`nohup`+`disown` `sleep 60` does not
  survive the next command; the prior cycles' "keep a probe server on
  :3101 across commands" pattern is impossible here. The adaptation:
  `scripts/probe-v19-mobile-recovery.ts` owns its server's WHOLE
  lifecycle (spawn → health-poll → probe → SIGTERM) inside one
  invocation — the new probe-tooling shape for this environment.

- **No parity gaps, no bugs.** The reference is unchanged (L4), the
  clone's mobile contract holds live (L6), the Tailwind v4 traps stay
  guarded (L7), and the V18 architecture is in exact contract shape
  (L8). An honest zero: nothing was invented to fill the cycle.

## 2. Design decisions (resolved)

- **SD-74 — the evidence set IS the cycle's deliverable.** session_29's
  suggested next step ("the error-card surfaces could get a VLM-verified
  screenshot pass on mobile widths — only the desktop 1280 shots exist
  today") becomes the V19 headline: the three 390×844 captures (drawer
  open, recovery card with the shell alive, healed view) + the VLM
  verification pass + the self-contained probe that produced them,
  committed as reusable tooling alongside the v18 probe family.

- **SD-75 — no code changes without a finding.** The audit found none;
  the codebase stays byte-identical outside `scripts/` and `docs/`. The
  509 + 179 pins remain the regression contract, untouched and re-proven
  on a fresh clone. (The alternative — inventing a "fix" to justify the
  cycle — violates the audit discipline both this repo and the coding
  contract demand.)

- **SD-76 — the F2 tooling lesson is institutionalized.** The probe
  script's header documents the sandbox constraint and the
  server-lifecycle-owning pattern so the next cycle (or a fresh agent)
  doesn't rediscover it the hard way.

## 3. Execution batches

### B1 — the probe tooling (DONE)

- `scripts/probe-v19-mobile-recovery.ts` — the self-contained probe:
  spawns the standalone server on :3101 (random AUTH_SECRET, seeded
  `db/custom.db`), health-polls, runs the 10-check mobile-drawer
  contract verification at 390×844, captures the three mobile evidence
  shots, SIGTERMs the server in a `finally`. Lints and typechecks with
  the repo gates (verified).

### B2 — the evidence set (DONE)

- `docs/screenshots/v19-mobile-drawer-open-390.png` — the drawer open,
  8 links, Mi Tienda header.
- `docs/screenshots/v19-view-recovery-card-390.png` — the Spanish
  recovery card, the app bar (shell) alive.
- `docs/screenshots/v19-view-recovery-healed-390.png` — the view
  rendered after Reintentar.
- All three VLM-verified (L9) — session_29's suggestion closed.

### B3 — the gates re-run (DONE)

- lint 0 · tsc 0 · build ✓ · unit 509/509 · e2e 179/179 — re-proven on
  the fresh clone after the probe script landed (the script is in the
  typecheck/lint scope; the PNGs are inert).

### B4 — docs lockstep → commit + push

- This plan (with the §6 execution ledger); `docs/session_31.md` (the
  session log); `worklog.md` (the V19 entry appended). No AGENTS.md /
  CLAUDE.md / README / PAD / SKILL version bumps — no code or contract
  changed, and the counts stay 509 + 179 (the docs stay lockstep-true by
  NOT bumping).
- Commit to main; SSH-wrapper push (no new branches).

## 4. Test plan

No new pins: the audit found no behavior to pin that the existing 509
unit + 179 e2e suite doesn't already cover (the drawer contract has its
9 mobile-navigation pins; the recovery surfaces have their 3 v18
failure-path pins; the probe's 10 checks re-verify the same contract
LIVE rather than duplicating it in CI). The full suite re-ran green as
the regression proof (B3).

## 5. Out of scope (disclosed)

- F1 (`role="alert"` on the recovery cards) — informational; no finding
  calls for it (SD-75).
- The react-dom boot floor (~890 ms) — the standing V17 disclosure.
- The reference's own broken/dead flows (the 403 settings save, the
  empty cashier combobox, the shift-gated terminal) — standing
  disclosures, no clone-side work; the reference's data state is
  unchanged (L4).
- All standing v8–v18 disclosures (SD-14, SD-18..SD-23, SD-63..70, the
  viewport-locked reference scrolling, the drawer's disclosed 200 ms,
  the oklab gradient interpolation, the a11y parity deviations, the
  reports with-data skins unobservability).

## 6. Execution results (filled on completion — 2026-10-27)

- **B1 — DONE.** The probe (10/10 checks PASS; see L6) committed; lint
  + tsc green with it in scope.
- **B2 — DONE.** The three 390×844 captures saved and VLM-verified
  (L9); the desktop 1280 v18 pair remains alongside them.
- **B3 — DONE.** Full gate green on the fresh clone: lint 0 · tsc 0 ·
  build ✓ · unit 509/509 (35 files) · e2e 179/179 (3.2m).
- **B4 — DONE.** This ledger, `docs/session_31.md`, and the worklog
  entry; committed to main and pushed via the SSH wrapper (remote
  verified, key shredded).
