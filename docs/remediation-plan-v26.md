# VeloxPOS — Remediation Plan v26 (Session V25→v26, 2026-10-28)

> Scope: **the failure-path truth pass — the ADR-033 gate-coverage doctrine
> continued at the unit layer.** The V26 audit found the reference UNCHANGED
> for the 11th consecutive cycle (nothing new to mirror), the baseline gates
> green exactly as V25 closed them (556/556 unit · 201/201 e2e — first-try
> on a fresh clone: install, db:push, db:seed, chromium, then the full
> ladder), the mobile drawer contract live-verified at 390×844 with the
> spine ledger EXACTLY matching the frozen pin (11th consecutive
> confirmation of the absent Tailwind v4 mobile-menu trap), and neo-crm
> UNCHANGED at `316fbe2` (session-196 — no new doctrine to adopt). The
> cycle's two findings come from the repo's own audit sweep, both in the
> ADR-033 family: **F1 — the health endpoint's DEGRADED branch (503)
> carries zero standing assertions** (a "known-open" disclosure carried
> since V24 on the belief that pinning it required breaking the DB
> mid-suite — the unit layer dissolves that objection via `vi.mock`), and
> **F2 — the boot-guard WIRING (`register()` → `console.error` +
> `process.exit(1)`) carries zero standing assertions while its own source
> comment claims "pinned by `tests/e2e/s22-boot-guard.spec.ts`" — a spec
> deleted in the V1 pivot (`0b78972`, the study-layer archive) and never
> replaced: the claim is FALSE today** (the repo-wide citation sweep
> confirms it is the ONLY stale test citation in `src/`). Both are pinned
> this cycle, both mutation-proven.

## 0. Verification ledger (all live unless noted; clone :3000 dev / :3100 e2e vs reference)

| # | Item | Method | Result | Verdict |
|---|------|--------|--------|---------|
| L1 | Workspace state | fresh `git clone` (the sandbox workspace had been reset); main @ `554b094` (V25 + session_44 + session_45), clean tree; locals rebuilt: `bun install` (488 pkgs, 6.9s), `.env` from `.env.example` with `DATABASE_URL="file:../db/custom.db"`, `bun run db:push` + `db:seed` (12 products / 6 categories / 2 registers / 2 sales / 2 shifts — the reference mirror), Playwright chromium | baseline current |
| L2 | V25 reference docs | full read: session_44 (the V25 raw log), session_45 (the V25 second raw log), remediation-plan-v25 (ledger L1–L12 + execution results), the worklog tail (the V25 entry); core docs re-read (AGENTS 31 contracts + the Tailwind v4 traps + the account UI + the mobile drawer contract + the v25 spine-freeze paragraphs, CLAUDE, README, PAD v2.12.0/ADR-034, SKILL v1.19.0) | V25 closed the drawer-contract completion (the spine freeze + the breakpoint close); the docs stay lockstep-true at 556+201 | aligned |
| L3 | Baseline gates | lint → tsc → build → unit → e2e (in that order, on the fresh clone) | 0 · 0 · ✓ · 556/556 (39 files) · **201/201** (3.6m, first-try) | all green |
| L4 | Reference data state | agent-browser on the logged-in reference (Terminal / Registers / Inventory / Sales / Dashboard / Reports / StoreSettings) | Terminal shift-gated ("No hay turno activo"), both cajas present with Caja 2 first, 12 products, 2 sales (V-MO6BJT7G, V-MMPNY55Z), Dashboard $0.00 KPIs, Reports "Sin datos en este período", Ajustes = exactly the five store sections (Información del Negocio / Personalización / Ticket Recibo / Proveedor de Pagos / Categorías — the full text read) | unchanged — nothing new to mirror (11th cycle) |
| L5 | Reference mobile @390 | agent-browser `set viewport 390 844` on Ajustes | NO hamburger, viewport-locked (scrollH = clientH = 844) — identical to V16–V25 | standing disclosure (the clone's drawer is the superset) |
| L6 | Clone mobile drawer live | agent-browser on the dev server @390×844 (the user's standing focus — the Tailwind v4 bug check) | the drawer spine RE-MEASURED live, EXACTLY the frozen ledger: panel `[0,0,288,844]` · header `[0,0,287,69]` · nav `[0,69,287,727]` · footer `[0,796,287,48]` ("VeloxPOS") · close `[235,16,36,36]` · 8 links at `[12, 81+44k, 263, 40]`; Esc closes + RETURNS focus to the hamburger (`Abrir menú de navegación`, aria-expanded false after) — the TailwindCSS v4 mobile-menu trap is NOT present (11th consecutive confirmation; `tests/tailwind-traps.test.ts` green in L3) | superset verified (11th cycle) |
| L7 | neo-crm pattern cross-check | `git ls-remote` (HEAD `316fbe2`) | UNCHANGED since the V25 review (session-196, the drawer-open spine freeze — already ADOPTED as V25's ADR-034). No new doctrine; the cycle's target comes from the repo's own audit | no adoption this cycle |
| L8 | **F1 scope — the health DEGRADED branch** | full read: `src/app/api/health/route.ts` (the catch → 503 + `{status:"degraded",db:"down",app:"veloxpos"}`) + `tests/e2e/health.spec.ts` (pins ONLY the 200 branch; its own comment: "The DEGRADED branch (503) stays unpinned — forcing it would mean breaking the DB mid-suite") + `docker-compose.yml` (the healthcheck `r.ok?0:1` — a consumer that LEANS on the 503: a regression to 200-with-degraded-body would report a broken-DB container HEALTHY) + the disclosure chain (remediation-plan-v24 §5, remediation-plan-v25 §5, worklog V24 + V25 "known-open") | the branch is shipped, consumed, and pinned by NOTHING — the standing "break the DB mid-suite" objection applies only to the E2E layer; the unit layer (`vi.mock("@/lib/db")` — the PrismaClient is never constructed) pins it cleanly (prototype verified 2/2 GREEN, then deleted) | the cycle's F1 |
| L9 | **F2 scope — the boot-guard wiring + the stale citation** | full read: `src/instrumentation.ts` + `src/lib/env-check.ts` + `tests/env-check.test.ts`; `rg` over `src/` for every `tests/**` citation (16 found); each existence-checked; `git log --all -- tests/e2e/s22-boot-guard.spec.ts` | `env-check.test.ts` pins the PURE seam (`authSecretBootStatus` — the fatal/warn/ok classification), but the WIRING (`register()`: fatal → `console.error` + `process.exit(1)`; warn → `console.warn`) carries ZERO assertions. `src/instrumentation.ts:9` claims "pinned by tests/e2e/s22-boot-guard.spec.ts" — that spec was ADDED with the initial scaffolding (`01cb829`), DELETED in the V1 pivot (`0b78972` — "study layer archived"), and never replaced: **the citation is FALSE today**. The repo-wide sweep: 16 test citations in `src/`, 15 resolve, 1 stale (this one). The regression shape is the comment's OWN documented defect: "A plain throw is CAUGHT by Next and leaves a degraded 500-everything server — the explicit exit is the validated fail-fast mechanism" — a regression swapping exit(1) for a throw flips the production fail-fast posture with every standing gate green | the cycle's F2 |
| L10 | The V25 commit + recent changes | `git show 09bd808/7024f60/554b094 --stat` | the V25 commit touched the test layer + docs + screenshots only (mobile-navigation.spec.ts +103 lines — the two new pins; all docs lockstep); the two follow-ups added the raw session logs; all verified green by L3's baseline run; `git status` clean; every docs count mention (556+201) true | recent changes verified |
| L11 | Config pins | `rg` over playwright.config.ts (the V24 knob pins `RESET_INAPP_DELIVERY: ""` + `AUTH_PROXY_HOPS: "0"` AFTER the spread + the 64-hex AUTH_SECRET) | all V24 pins intact | contract holds |
| L12 | `.env.example` contract | `cp .env.example .env` → install → db:push → db:seed → dev server boot + login round-trip (owner@veloxpos.local / the seed's in-code `$Abcd1234` default — the bun `$`-expansion contract) | bidirectional-true (every knob consumed, every consumer documented; the login round-trip proves the dev posture end-to-end) | contract holds |

## 1. Findings

- **F1 — the health DEGRADED branch (503) carries no pin.** The route
  implements the failure posture (catch → 503 +
  `{status:"degraded",db:"down",app:"veloxpos"}`) and the Docker
  healthcheck consumes it (`r.ok?0:1` — a 503 marks the container
  unhealthy, which is the point). The e2e spec pins only the 200 branch,
  and the branch has been carried as "known-open" since V24 on the
  objection that forcing it in e2e means breaking the DB mid-suite. That
  objection does not apply at the unit layer: `vi.mock("@/lib/db")`
  intercepts the module BEFORE the PrismaClient is ever constructed, so
  the probe can be made to reject deterministically with zero DB
  involvement. A payload/status regression on this branch (503 → 200, or
  the body reshaped) would leave the Docker healthcheck reporting a
  broken-DB container as healthy with every standing gate green — the
  ADR-033 latent-regression shape exactly.

- **F2 — the boot-guard wiring carries no pin, and its source comment
  cites a deleted spec.** The production fail-fast posture (bad
  AUTH_SECRET → console.error + `process.exit(1)`, never a plain throw
  that Next catches into a degraded 500-everything server) lives in
  `src/instrumentation.ts`'s `register()`. The pure seam is pinned
  (`tests/env-check.test.ts` — the classification), but the WIRING that
  turns "fatal" into an actual process exit has zero standing assertions.
  Worse, the file's own comment claims "pinned by
  `tests/e2e/s22-boot-guard.spec.ts`" — a spec deleted in the V1 pivot
  (`0b78972`) and never replaced: a shipped pin claim that is FALSE
  today. The repo-wide citation sweep (16 test citations across `src/`)
  confirms this is the only stale one — the sweep itself is the audit's
  new instrument this cycle.

- **No other real findings.** The baseline is green exactly as V25
  closed it (L3, first-try); the reference is unchanged for the 11th
  consecutive cycle (L4/L5); the mobile drawer spine matches the frozen
  ledger exactly (L6 — the v25 pin holding); neo-crm is unchanged (L7);
  the Known-Issues register is clean (items 4–7 closed, the rest standing
  disclosures); the docs counts are lockstep-true at 556+201; the config
  pins hold (L11); `.env.example` is bidirectional-true (L12); `skills/`
  excluded from all checking/compilation per the standing instruction.

## 2. Design decisions (resolved)

- **SD-108 — F1's cure: the unit-layer health pin.** ONE new file
  `tests/health-route.test.ts`: `vi.mock("@/lib/db", …)` (the mock is
  hoisted above the import — the real PrismaClient is never constructed;
  the route module imports cleanly in the node environment), then TWO
  behavioral pins: (a) `$queryRaw` resolves → `GET()` returns 200 with
  EXACTLY `{status:"ok",db:"up",app:"veloxpos"}` (the e2e contract
  mirrored at the unit layer — the documented README body); (b)
  `$queryRaw` rejects → `GET()` returns 503 with EXACTLY
  `{status:"degraded",db:"down",app:"veloxpos"}` (the branch the Docker
  healthcheck leans on). Born-green BY DESIGN (nothing is broken today —
  verified by the feasibility prototype, 2/2) and MUTATION-PROVEN per
  SD-110.

- **SD-109 — F2's cure: the wiring pin + the citation fix.** ONE new
  file `tests/boot-guard-wiring.test.ts`: import `register()` from
  `src/instrumentation.ts` (its import graph is pure — `./lib/env-check`,
  zero deps), save/restore `process.env.NODE_ENV` + `AUTH_SECRET` around
  each case, spy `console.error` / `console.warn` (mocked silent — the
  test output stays clean) and `process.exit` (**mockImplementation —
  NEVER a real exit; a live exit would kill the vitest worker**), then
  pin the three wiring branches: fatal (production + blank secret, and
  production + the `.env.example` constant) → `console.error` with the
  remedy message + `process.exit(1)`; warn (production + a weak secret,
  and dev + unset) → `console.warn`, NO exit; ok (production + a 64-hex
  secret) → silent (no exit, no console). PLUS the source fix: the stale
  citation comment in `src/instrumentation.ts` re-pointed at
  `tests/boot-guard-wiring.test.ts` (comment-only — no behavior change;
  no existing pin scans the file: `tests/env-check.test.ts` imports only
  the pure seam, `tests/deployment-surfaces.test.ts` never references
  instrumentation).

- **SD-110 — the mutation proofs (the V25 discipline extended to the
  unit layer).** After the born-green runs: (a) plant the F1 defect shape
  — the route's catch branch degraded status 503 → 200 (the
  Docker-healthcheck-blindness shape) → the pin goes RED at the status
  assertion → restore → GREEN; (b) plant the F2 defect shape — `register()`'s
  `process.exit(1)` replaced by a plain `throw` (the comment's OWN
  documented regression: "a plain throw is CAUGHT by Next and leaves a
  degraded 500-everything server") → the wiring pin goes RED (the awaited
  register() rejects / the exit spy never fires) → restore → GREEN. The
  mutations never reach the commit; their RED output is the execution
  evidence recorded in §6.

- **SD-111 — the pins EXTEND, never weaken.** No existing test is edited
  away; TWO new unit files land. Counts only move up (556 → 563; the e2e
  layer is untouched at 201).

## 3. Execution batches

### B1 — the audit (DONE)

- L1–L12 above. Reference 11th cycle unchanged; baseline green
  first-try on the fresh clone; the drawer spine matching the frozen
  ledger exactly; neo-crm unchanged; the two failure-path findings
  mapped (F1 the health DEGRADED branch; F2 the boot-guard wiring + the
  stale citation — the citation sweep executed).

### B2 — the pins (written FIRST)

- `tests/health-route.test.ts` (NEW — SD-108): the two-branch health
  contract (200/ok + 503/degraded).
- `tests/boot-guard-wiring.test.ts` (NEW — SD-109): the three-branch
  wiring contract (fatal/warn/ok) over the spied console + exit.
- `src/instrumentation.ts` (comment-only): the stale citation re-pointed
  at the new pin file.
- Both verified against the standing tree (born-green expected).

### B3 — the mutation proofs

- F1: plant the 503→200 defect in the route's catch branch → the health
  pin RED → restore → GREEN (SD-110a).
- F2: plant the exit→throw defect in `register()` → the wiring pin RED →
  restore → GREEN (SD-110b).

### B4 — the V26 evidence set + the full gates

- Fresh captures under `docs/screenshots/`:
  `v26-desktop-dashboard-1280.png` (the standing desktop surface),
  `v26-mobile-drawer-open-390.png` (the standing mobile surface — the
  spine freeze holding),
  `v26-desktop-health-json.png` (the F1 surface — the live health body
  as the browser renders it),
  `v26-desktop-ajustes-mi-cuenta-1280.png` (the F2 surface's adjacent
  shipped superset — the account-security family the boot guard
  protects).
- Full gates: lint → typecheck → build → `bun run test` (expect 563,
  41 files — 556+7) → `bun run test:e2e` (expect 201, unchanged).

### B5 — docs lockstep → commit + push

- README: the badge + the Testing-table counts (563 + 201).
- AGENTS.md: the security contract section gains the failure-path pins
  line (the health DEGRADED branch + the boot-guard wiring are pinned;
  editing either file means running the new specs).
- CLAUDE.md: the command counts (563 tests / 41 files) + a v26
  contracts note.
- PAD: v2.13.0 history entry + **ADR-035** (the failure-path truth
  pass) + the §8 testing table.
- retail-pos_SKILL.md: v1.20.0 + counts + the §12 lesson (the
  citation-sweep instrument: a "pinned by" comment is a claim — verify
  the pin exists).
- This plan (§6 filled); `docs/session_46.md` (the session log);
  `worklog.md` (the V26 entry). Every count mention (556→563) bumps in
  the same commit.
- Commit to main; SSH-wrapper push (no new branches).

## 4. Test plan

- The born-green pins freeze the live-verified truths (the L8 DEGRADED
  branch's source behavior; the L9 wiring's source behavior) — each
  carries its disclosure in the test file's comment block.
- The mutation proofs (B3) demonstrate mechanically that each pin
  catches its documented defect family — the RED output is the evidence.
- The full suite re-runs as the regression proof (B4) — the unit count
  includes the new files; the e2e layer must stay 201.

## 5. Out of scope (disclosed)

- The react-dom boot floor, the F2 flake watch, the reference's own
  broken flows (nothing to mirror), and every standing v8–v25 disclosure
  — unchanged.
- The instrumentation hook's Next.js INTEGRATION (Next calling
  `register()` at boot) — not unit-testable without booting a real
  server; the wiring pin covers the function's own contract, which is
  the shipped code's entirety.
- The drawer at intermediate below-lg widths — unchanged standing
  disclosure.

## 6. Execution results (filled on completion — 2026-10-28)

- **B1 — DONE.** The audit ledger L1–L12 above; the reference unchanged
  for the 11th consecutive cycle; the baseline green exactly as V25
  closed it (556/556 unit · 201/201 e2e, first-try on a fresh clone —
  install, db:push, db:seed, chromium, then the full ladder); the
  mobile drawer spine re-measured live, EXACTLY matching the frozen
  ledger (11th confirmation, no Tailwind v4 trap); neo-crm unchanged at
  `316fbe2`; the two failure-path findings mapped (F1 the health
  DEGRADED branch; F2 the boot-guard wiring + the stale citation — the
  citation sweep executed: 16 test citations in `src/`, 15 resolved,
  1 stale).
- **B2 — DONE (born-green, after a TS round).** The two new unit files
  landed: `tests/health-route.test.ts` (2 tests — both branches' status
  + exact body) and `tests/boot-guard-wiring.test.ts` (5 tests — both
  fatal shapes → console.error + process.exit(1); production-weak and
  dev-unset warn shapes → console.warn, NO exit; ok → silent). The RED
  run earned its keep on the TYPE layer this time: `process.env.NODE_ENV`
  is readonly in @types/node — three direct assignments failed tsc; the
  record-shaped view (`const env = process.env as Record<string,
  string | undefined>`) is the standard escape (a typing constraint,
  not a runtime one). Fixed → **7/7 green** (2+5). The stale citation
  comment in `src/instrumentation.ts` re-pointed at the new pin file
  (comment-only — verified no existing pin scans that file).
- **B3 — DONE (both mutation proofs executed per SD-110).** (a) The F1
  proof: planted the degraded status 503 → 200 in the route's catch
  branch (the Docker-healthcheck-blindness shape — `r.ok` would be TRUE
  and the broken-DB container would report HEALTHY) → the health pin
  went **RED exactly at the status assertion**
  (`AssertionError: expected 200 to be 503`) while the route's own
  e2e spec (the 200-branch pin) would stay green — the battery gap by
  construction; restored → GREEN (2/2). (b) The F2 proof: planted
  `throw new Error(...)` in place of `process.exit(1)` in `register()`
  (the comment's OWN documented defect — "A plain throw is CAUGHT by
  Next and leaves a degraded 500-everything server") → the wiring pin
  went **RED at BOTH fatal-path tests** (2 failed) while the 3 warn/ok
  tests stayed green, and the standing env-check pins (the pure-seam
  classification) stay green under the mutation — the battery gap
  demonstrated live; restored → GREEN (5/5).
- **B4 — DONE.** The four v26 captures saved under docs/screenshots/
  (v26-desktop-dashboard-1280.png — the standing desktop surface;
  v26-mobile-drawer-open-390.png — the standing mobile surface, the
  spine freeze holding; v26-desktop-health-json.png — the F1 surface,
  the live health body as the browser renders it; 
  v26-desktop-ajustes-mi-cuenta-1280.png — the F2 surface's adjacent
  shipped superset). All four VLM-verified (the drawer capture 5/5: the
  288px panel, the header + X close, the 8 links, the VeloxPOS footer
  wordmark, the dark backdrop; the health capture confirms the exact
  `{status:"ok",db:"up",app:"veloxpos"}` body; the Ajustes capture
  confirms the Mi Cuenta section). Full gates: **lint 0 · tsc 0 ·
  build ✓ · 563/563 unit (41 files, 556+7) · 201/201 e2e** — the first
  full-suite run hit ONE flake (the v9 Spanish-alias title test — the
  known F2-flake-watch family), re-run green alone (11/11) then the
  full suite re-run **201/201** green (3.7m); zero code changes were
  involved in the flake.
- **B5 — DONE.** Docs lockstep: README (badge 563+201 + the testing
  table), AGENTS (the security contract gains the failure-path pins
  paragraph), CLAUDE (the v26 contracts note + counts 563/41), PAD
  v2.13.0 (the history entry + **ADR-035** + the §8 testing table + the
  unit-seams list), SKILL v1.20.0 (the v26 close layer + counts + the
  §12 **F10** lesson: a "pinned by" comment is a claim — verify the pin
  exists), this ledger, `docs/session_46.md`, the worklog V26 entry.
  Commit to main + the SSH-wrapper push close the cycle (hash recorded
  in session_46).
