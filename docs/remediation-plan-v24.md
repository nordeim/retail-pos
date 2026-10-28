# VeloxPOS — Remediation Plan v24 (Session V23→v24, 2026-10-28)

> Scope: **the gate-coverage truth pass.** The V24 audit found the
> reference UNCHANGED for the 9th consecutive cycle (nothing new to
> mirror), the baseline gates green exactly as V23 closed them (550/550
> unit · 197/197 e2e), the mobile drawer contract live-verified at
> 390×844 (no Tailwind v4 bug — 9th consecutive confirmation), and the
> V23 additions working live. The cycle's target comes from the rotation
> trigger — neo-crm's newest commit (`9ff0d37`, session-195: "THE 404
> GATE-COVERAGE PINS") exports a doctrine this repo should own too:
> **a shipped behavioral claim that a doc or a consumer leans on, but
> that no standing assertion pins, is a latent regression** — every gate
> can stay green while the contract silently falsifies. The audit found
> four such claims in this codebase (F1–F4); the RED run itself surfaced
> a fifth (F5 — the e2e AUTH_SECRET was 62-hex under a "64-hex" claim).
> This cycle pins them all.

## 0. Verification ledger (all live unless noted; clone :3000 dev / :3100 e2e vs reference)

| # | Item | Method | Result | Verdict |
|---|------|--------|--------|---------|
| L1 | Workspace state | `git pull` on the existing workspace (96b1021 → 9afdcb8: only `docs/session_40.md` — the V23 raw log — arrived); `git log`/`git status` inspected | main @ `9afdcb8`, clean tree; the locals intact (`.env` with `DATABASE_URL="file:../db/custom.db"`, `db/custom.db` + `db/e2e.db` at the repo root, `node_modules`, the Playwright chromium build); `.env.example` present and matching the codebase contract (every knob consumed, every consumer documented; SEED_OWNER_PASSWORD deliberately absent per the bun `$`-expansion note) | baseline current |
| L2 | V23 reference docs | full read: session_39 (the V23 distilled log), session_40 (the V23 raw log), remediation-plan-v23 (ledger + execution results), the worklog tail; core docs re-read (AGENTS 31 contracts + the Tailwind v4 traps + the account UI contract, CLAUDE, README, PAD v2.10.0/ADR-032, SKILL v1.17.0) | V23 closed the account-surface family (the profile/name-edit superset); the docs stay lockstep-true at 550+197 | aligned |
| L3 | Baseline gates | lint → tsc → build → unit → e2e (in that order) | 0 · 0 · ✓ · 550/550 (38 files) · **197/197** (3.5m, first-try) | all green |
| L4 | Reference data state | agent-browser on the logged-in reference (Terminal / Registers / Inventory / Sales / Dashboard / Reports / StoreSettings) | Terminal shift-gated ("No hay turno activo"), both cajas "Cerrada" (Caja 2 first), 12 products, 2 sales (V-MO6BJT7G, V-MMPNY55Z), Dashboard "martes 27 de octubre, 2026" + $0.00 KPIs, Reports $0.00 + "Sin datos en este período" on both method cards, Ajustes = exactly the five store sections — identical to the V17–V23 records | unchanged — nothing new to mirror (9th cycle) |
| L5 | Reference mobile @390 | agent-browser `set viewport 390 844` on /Dashboard | NO hamburger (nav 219px measured, main squeezed to 170px, scrollH=clientH — viewport-locked) — identical to V16–V23 (9th consecutive cycle) | standing disclosure (the clone's drawer is the superset) |
| L6 | Clone mobile drawer live | agent-browser on the dev server @390×844 (the user's standing focus — the Tailwind v4 bug check) | the drawer contract holds live: `aria-expanded` cycles true/false, body scroll locks (`overflow: hidden`) and unlocks, **8 links at a uniform 44px pitch** (y-deltas 81→125→…→389, all exactly 44), zero horizontal overflow, Esc closes + RETURNS focus to the hamburger (`Abrir menú de navegación`) — the TailwindCSS v4 mobile-menu trap (space-y margin children) is NOT present; `tests/tailwind-traps.test.ts` green in L3 | superset verified (9th cycle) |
| L7 | The V23 additions, live | agent-browser on the dev server: the Mi Cuenta section renders the identity readout + the FOUR-action row; the "Cambiar nombre" dialog opens PREFILLED ("Cesar Martínez") with the measured Dialog grammar | every V23 surface functions live | V23 verified |
| L8 | neo-crm pattern cross-check | `git ls-remote` (HEAD `a3ac674` — ADVANCED from the V23 review's `facdd56`) + a shallow clone + the session-195 plan/doc read | ONE new material commit: `9ff0d37` (session-195 — the 404 gate-coverage pins: a shipped-contract-without-a-pin is a latent regression; the cure family = born-green status assertions inside existing e2e tests, a11y registrations for uncovered surfaces, webServer child-env kill-switch pinning, `.env.example` bidirectional verification). Every element of the doctrine maps to a REAL gap in this repo (F1–F4 below) | pattern ADOPTED — this cycle's headline |
| L9 | F1 scope | full read: `tests/e2e/navigation.spec.ts` + `tests/e2e/functional-parity-v7.spec.ts` (the two 404 tests) + a live fetch probe on the dev server | `/NonExistent` returns the TRUE HTTP **404** (live-verified via `fetch` in the browser) but BOTH tests reach the surface through `page.goto()` — which tolerates any status; NO assertion pins the status line. A future catch-all route or rewrite regression would render the card under a 200 with every gate green | the cycle's F1 |
| L10 | F2 scope | full read: `tests/e2e/a11y-smoke.spec.ts` + the live logged-out 404 walk (cookies cleared → `/NonExistent` renders the card AT the URL — the public SD-20 superset posture, no login bounce) | the smoke registers exactly three surfaces (dashboard, mobile drawer, login) — the PUBLIC 404 (the one surface whose contrast family rides the same disclosed slate-800/slate-400 deviation) sits outside the register at BOTH widths | the cycle's F2 |
| L11 | F3 scope | full read: `playwright.config.ts` (the webServer env spreads `...process.env`, pinning only PORT/NODE_ENV/DATABASE_URL/AUTH_SECRET) + `src/lib/auth.ts` (`inAppResetDeliveryEnabled`) + `src/lib/server/auth.ts:143` (`AUTH_PROXY_HOPS` consumer) + `tests/e2e/security.spec.ts` (C1) + the account-ui xff isolation | a stray `RESET_INAPP_DELIVERY=1` export in the parent shell flips the C1 production-posture spec's expected response (the one-shot token appears in the body); a stray `AUTH_PROXY_HOPS=1` breaks the H3 verify-bucket isolation (single-hop xff fails closed to "local" → the shared localhost verify budget at exactly 10/15min). The neo-crm N-69a "the dev server lies" family, on the env axis | the cycle's F3 |
| L12 | F4 scope | `rg "api/health" tests/` → ZERO hits; full read: `src/app/api/health/route.ts` + README ("Verify setup" promises the exact body) + `docs/DEPLOYMENT.md` (the Docker healthcheck + two verification curl rows) | the health body contract (`{"status":"ok","db":"up","app":"veloxpos"}`) has THREE documented consumers (the Playwright webServer boot gate — which only proves a 2xx; the Docker healthcheck; the README verify-setup instruction) and ZERO assertions. A payload regression reshapes the body with every gate green | the cycle's F4 |
| L13 | Harness-contract freeze scope | full read: `playwright.config.ts` + `tests/e2e/global-setup.ts` | the standing harness truths (the isolated e2e.db, NODE_ENV=production, the 64-hex AUTH_SECRET shape so the boot guard stays silent, the seed-identity pinning against `.env` leakage) are TRUE today but carry no source pins — the same latent-regression family | born-green freeze (the e2e-harness family) |

## 1. Findings

- **F1 — the true-HTTP-404 contract carries no status pin.** The clone's
  404 story ("the reference's 404: dark canvas, centered card…" —
  `src/app/not-found.tsx`) is true today (live-verified 404) but both
  e2e tests reach it via `page.goto()`, which tolerates any status. The
  server's routing truth (a real 404 status line) is unpinned.

- **F2 — the public 404 surface sits outside the a11y register.** The
  smoke covers dashboard/drawer/login; the 404 — the one PUBLIC app
  surface (SD-20 superset), whose slate-800 H1 + slate-400 body ride the
  same disclosed color-contrast deviation — is unregistered at both
  widths.

- **F3 — the e2e webServer child env is shell-state-dependent.** The
  env spread inherits stray parent-shell exports of the two
  auth-behavior knobs; the C1 production-posture spec and the
  verify-bucket isolation can fail (or silently change meaning) with
  confusing symptoms — deterministic only when the developer's shell is
  clean. The neo-crm session-195 cure: pin the knobs to their default
  values after the spread.

- **F4 — the /api/health body contract has zero coverage.** Three
  documented consumers, zero assertions; the webServer boot poll proves
  only a 2xx.

- **F5 — the e2e AUTH_SECRET was 62-hex under a 64-hex claim (found
  by the RED run itself).** The S22 comment in playwright.config.ts
  claimed "64-hex shape (the documented production form — openssl rand
  -hex 32)"; the shipped value was 62 hex chars. Functionally silent
  (the boot guard's weak threshold is < 32 chars) but a docs-truth
  defect in exactly this cycle's family — the pin caught it on its
  first RED run. Cure: a genuine 64-hex value (the comment becomes
  true; the setup project re-signs-in each run so the rotation is
  inert).

- **No other real findings.** The baseline is green exactly as V23
  closed it (L3); the reference is unchanged for the 9th consecutive
  cycle (L4/L5); the mobile drawer contract holds live at 390px with
  the Tailwind v4 trap suite green (L6); the V23 additions verified
  live (L7); the Known-Issues register is clean; the docs counts are
  lockstep-true at 550+197; the `.env.example` contract is
  bidirectional-true (L1); `skills/` excluded from all
  checking/compilation per the standing instruction; the
  `process.exit` dev warning is the pinned ADR-020 boot-guard design.

## 2. Design decisions (resolved)

- **SD-98 — F1's cure: the status assertion INSIDE the existing test
  (the born-green freeze form).** One `page.request.get("/NonExistent")`
  + `expect(response.status()).toBe(404)` added at the top of
  navigation.spec.ts's "unknown routes render the Spanish 404" test —
  the neo-crm D-195a1 exact form: the pin freezes a genuine, live-
  verified truth; it is born-green BY DESIGN (a battery gap, not a
  behavior bug — there is nothing to make RED). The v7 title test stays
  untouched (its contract — the slug-cased title — is already pinned).

- **SD-99 — F2's cure: the 404 registered at BOTH widths as an
  anon-surface.** One new test in a11y-smoke.spec.ts's logged-out
  describe (the 404 is session-independent BY DESIGN — live-verified:
  cookies cleared → the card renders at the URL, no bounce): scan at
  1280×800, `setViewportSize` 390×844, scan again. The scan rules match
  the standing smoke (critical/serious, color-contrast disabled — the
  same disclosed deviation family the surface belongs to).

- **SD-100 — F3's cure: the two auth knobs pinned to their defaults in
  the webServer child env.** `RESET_INAPP_DELIVERY: ""` (the production
  posture becomes shell-state-proof — `inAppResetDeliveryEnabled`
  reads "" as disabled under NODE_ENV=production) + `AUTH_PROXY_HOPS:
  "0"` (the rightmost-hop selection — the H3 default the specs assume).
  Placed after the `...process.env` spread with the N-69a citation
  comment. This is the cycle's ONLY source-of-truth change outside the
  test layer — and it is TDD RED→GREEN (the pin fails against the
  unfixed config first).

- **SD-101 — F4's cure: a dedicated health spec.** A new
  `tests/e2e/health.spec.ts` (its own family — the unauthenticated
  production surface) asserting the 200 + the exact body
  `{status:"ok", db:"up", app:"veloxpos"}`. The degraded branch (503)
  stays unpinned — forcing it would mean breaking the DB mid-suite
  (disclosed out-of-scope).

- **SD-102 — the harness-contract freeze (the e2e-harness family).** A
  NEW unit file `tests/e2e-harness.test.ts` (source pins, the
  account-ui/deployment-surfaces idiom) freezing the standing harness
  truths: the isolated e2e.db + NODE_ENV=production + the 64-hex
  AUTH_SECRET shape (born-green), the two SD-100 knob pins (RED first),
  and the global-setup seed-identity pinning (born-green). A new FAMILY
  file — not a bolt-on to deployment-surfaces — because the contract
  owner is the test harness itself (the recovery-a11y precedent: a new
  family gets its own file).

- **SD-103 — the pins EXTEND, never weaken.** No existing test is
  edited away; the navigation 404 test GAINS a line; the a11y smoke
  GAINS a registration; the config GAINS two pins. Counts only move up
  (550→555 unit expected, 197→199 e2e).

## 3. Execution batches

### B1 — the audit (DONE)

- L1–L13 above. Reference 9th cycle unchanged; baseline green; the
  mobile contract live-verified (trap-free); the V23 surfaces
  live-verified; neo-crm's session-195 doctrine adopted with four
  mapped gaps.

### B2 — TDD: the pins (written FIRST)

- `tests/e2e-harness.test.ts` (NEW — the SD-102 family):
  1. The webServer env pins NODE_ENV=production + the isolated e2e.db
     DATABASE_URL (born-green).
  2. The AUTH_SECRET is the documented 64-hex shape (born-green).
  3. `RESET_INAPP_DELIVERY` pinned to "" in the webServer env (**RED**).
  4. `AUTH_PROXY_HOPS` pinned to "0" in the webServer env (**RED**).
  5. The global-setup pins the seed identity (SEED_OWNER_EMAIL/
     PASSWORD/NAME present after its spread — born-green).
- `tests/e2e/navigation.spec.ts` (EXTENDED — SD-98): the status
  assertion inside the existing 404 test (born-green).
- `tests/e2e/a11y-smoke.spec.ts` (EXTENDED — SD-99): the 404
  registration at both widths (born-green).
- `tests/e2e/health.spec.ts` (NEW — SD-101): the body contract
  (born-green).
- The two RED pins verified failing against the unfixed config; the
  born-green pins verified passing (the freeze form — disclosed).

### B3 — GREEN: the implementation

- `playwright.config.ts`: the two knob pins after the spread (SD-100)
  with the N-69a citation comment.
- Re-run B2's pins → green; `bun run typecheck` after the change.

### B4 — the V24 evidence set + the full gates

- Fresh captures under `docs/screenshots/`:
  `v24-404-desktop.png` (the F1/F2 surface at 1280×800),
  `v24-404-mobile-390.png` (the phone-width registration),
  `v24-health-json.png` (the F4 contract rendered in the browser),
  `v24-mobile-drawer-open-390.png` (the cycle's standing audit capture).
- Full gates: lint → typecheck → build → `bun run test` (expect
  550+5 = 555, 39 files) → `bun run test:e2e` (expect 197+2 = 199).
- Live verification on the dev server: the stray-export repro —
  `RESET_INAPP_DELIVERY=1` in the parent shell flips the PRE-fix
  posture (demonstrated once pre-fix on a scratch boot) and is inert
  post-fix (the pin wins over the spread).

### B5 — docs lockstep → commit + push

- README: the badge + the Testing-table counts (555 + 199).
- AGENTS.md: the test-suite rules gain the harness-determinism line.
- CLAUDE.md: the command counts (555 tests / 39 files · 199 specs) + a
  v24 contracts note.
- PAD: v2.11.0 history entry + **ADR-033** (the gate-coverage truth
  contract) + the §8 testing table.
- retail-pos_SKILL.md: v1.18.0 + counts.
- This plan (§6 filled); `docs/session_41.md` (the session log);
  `worklog.md` (the V24 entry). Every count mention (550→555,
  197→199) bumps in the same commit.
- Commit to main; SSH-wrapper push (no new branches).

## 4. Test plan

- The RED pins prove the config gap mechanically (they fail on the
  unfixed spread); the GREEN run proves the cure.
- The born-green pins freeze live-verified truths (the 404 status, the
  health body, the a11y posture, the harness contract) — the
  session-195 doctrine's own form; each carries its disclosure in the
  test comment.
- The full suite re-runs as the regression proof (B4) — the 199 e2e
  count includes the two new specs; the 555 unit count includes the
  five harness pins.
- The stray-export repro (B4) demonstrates the pre/post determinism
  flip live, not just by inspection.

## 5. Out of scope (disclosed)

- The health endpoint's DEGRADED branch (503) — forcing it requires
  breaking the DB mid-suite; the branch is source-reviewed and stays
  unpinned.
- `NEXT_PUBLIC_SITE_URL` in the webServer env — a build-time inline,
  not a runtime knob; pinning it in the child env is a no-op.
- `E2E_PORT` — a deliberate, documented escape hatch (BASE_URL and the
  webServer read it consistently); not an auth-behavior knob.
- A full sitemap/robots e2e leg — the metadata surfaces are already
  unit-pinned (`tests/site.test.ts`) and the manifest is e2e-pinned
  (v6); the sitemap's 200 is exercised by no consumer contract this
  cycle needs.
- The F2-flake watch, the react-dom boot floor, the reference's own
  broken flows, and every standing v8–v23 disclosure — unchanged.

## 6. Execution results (filled on completion — 2026-10-28)

- **B1 — DONE.** The audit ledger L1–L13 above; the reference unchanged
  for the 9th consecutive cycle; the baseline green exactly as V23
  closed it (550/550 unit · 197/197 e2e, first-try); the mobile drawer
  contract live-verified at 390×844 (aria cycle, scroll lock, 8 links
  at the uniform 44px pitch, Esc + focus return — the Tailwind v4 trap
  suite green); the V23 additions live-verified (the four-action row,
  the prefilled Cambiar nombre dialog); neo-crm ADVANCED by one
  material commit (session-195 — the gate-coverage doctrine) and was
  ADOPTED as this cycle's headline.
- **B2 — DONE (verified RED where designed).** The new
  `tests/e2e-harness.test.ts` failed **3/6** against the unfixed tree —
  the two SD-100 knob pins PLUS the AUTH_SECRET 64-hex pin (the
  unplanned F5 catch: the value was 62-hex under a 64-hex claim — the
  RED run earning its keep); the three born-green freeze pins passed
  as designed (the disclosed battery-gap form). The three e2e
  extensions (F1's status line, F2's 404 registration, F4's health
  spec) were verified against the standing build.
- **B3 — DONE (verified GREEN).** `playwright.config.ts` gained the two
  knob pins after the `...process.env` spread (SD-100, the N-69a
  citation) + the genuine 64-hex AUTH_SECRET (F5). Pins 6/6. The
  determinism proof ran BOTH ways live: (a) the flip mechanism — a
  manual standalone boot with a stray `RESET_INAPP_DELIVERY=1` export
  hands out the one-shot reset token in the production response body
  (the exact C1 violation a polluted shell would have caused pre-fix);
  (b) the pin-wins proof — `RESET_INAPP_DELIVERY=1 AUTH_PROXY_HOPS=1
  bunx playwright test tests/e2e/security.spec.ts` stays **6/6 green**
  (the pinned child env overrides the parent shell; the suite is
  shell-state-proof).
- **B3-adjacent:** the three touched e2e specs ran green in isolation
  (18/18 across navigation + a11y-smoke + health, 18.6s) — the F1
  status line, the F2 dual-width registration, and the F4 body
  contract all pass against the production build.
- **B4 — DONE.** The four v24 captures saved under docs/screenshots/
  (v24-404-desktop.png — the F1/F2 surface at 1280×800;
  v24-404-mobile-390.png — the phone-width registration;
  v24-health-json.png — the F4 contract rendered in the browser;
  v24-mobile-drawer-open-390.png — the cycle's standing drawer
  capture). All four VLM-verified (correct render, no breakage: the
  8-item drawer with Dashboard active, the centered 404 card at both
  widths, the raw JSON body). Full gates: **lint 0 · tsc 0 · build ✓ ·
  556/556 unit (39 files, 550+6) · 199/199 e2e (3.5m, 197+2)** —
  first-try.
- **B5 — DONE.** Docs lockstep: README (badge 556+199, the testing
  table), AGENTS (the test-suite rules gain the shell-state-proof +
  gate-coverage doctrine lines), CLAUDE (the v24 contracts note +
  counts 556/39 · 199), PAD v2.11.0 (the history entry + **ADR-033** +
  the §8 testing table + the infrastructure bullet), SKILL v1.18.0
  (the v24 close note + counts + the §12 F8 lesson), this ledger,
  `docs/session_41.md`, the worklog entry. Commit to main + the
  SSH-wrapper push close the cycle (hash recorded in session_41).
