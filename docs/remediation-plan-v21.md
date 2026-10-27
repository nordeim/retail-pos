# VeloxPOS — Remediation Plan v21 (Session V20→v21, 2026-10-27)

> Scope: **the deployment-surface truth pass — Known-Issue #6 closed for
> real.** The V21 audit found the reference UNCHANGED for the 6th
> consecutive cycle (nothing new to mirror), the baseline gates green
> first-try (lint 0 · tsc 0 · build ✓ · 513/513 unit · 179/179 e2e — no
> flake occurrence this run), the Tailwind v4 sweep clean (95 pins, traps
> 8/8), and neo-crm unchanged since 2026-10-22. The cycle's target is the
> one PAD Known-Issues row that has sat "Pending doc refresh" since the
> scaffold era: the deployment surfaces (Dockerfile, docker-compose.yml,
> `docs/DEPLOYMENT.md`) still carry the OLD app's identity — and the
> audit found the rot goes deeper than the name. One adjacent finding
> rides along: the four scaffold account-security API routes are real,
> working, and completely untested — they gain behavioral coverage this
> cycle.

## 0. Verification ledger (all live unless noted; clone :3101 vs reference)

| # | Item | Method | Result | Verdict |
|---|------|--------|--------|---------|
| L1 | Workspace state | isolated minimal git commands (output treated as untrusted data — the standing protocol) → `git pull` | main @ `e87bd95` fast-forward from `5caab08` (the only delta: `docs/session_34.md`, the raw V20 log), clean tree, V20 history intact (the execution commit inspected: 17 files, exactly the plan's set) | baseline current |
| L2 | V20 reference docs | full read: session_33, session_34, remediation-plan-v20, worklog tail; core docs re-read (AGENTS 31 contracts, CLAUDE, README, PAD v2.7.0 / ADR-029, SKILL v1.14.0) | V20 closed F1 (role="alert" ×3, RED→GREEN both pin layers); the docs stay lockstep-true at 513+179 | aligned |
| L3 | Baseline gates | lint → tsc → build → unit → e2e (in that order) | 0 · 0 · ✓ · 513/513 (36 files) · **179/179 first-try** (3.2m) — no flake occurrence this run; the F2 watch gains a clean data point | all green |
| L4 | Reference data state | agent-browser on the logged-in reference (Terminal / Registers / Inventory / Dashboard / Sales / Reports) | Terminal shift-gated ("No hay turno activo"), both cajas "Cerrada" (Caja 2 first), 12 products (Shampoo Pantene 400ml first, Jabón Zote 400g, Pan Bimbo), 2 sales (V-MO6BJT7G, V-MMPNY55Z), Dashboard H1 + 3× H3, Reports $0.00 + "Sin datos en este período" on both method cards — byte-identical to the V17–V20 records | unchanged — nothing new to mirror (6th cycle) |
| L5 | Reference mobile @390 | agent-browser viewport 390×844 on /Dashboard | NO hamburger, 220px sidebar at x=0, main squeezed to 170px, viewport-locked (scrollHeight == clientHeight) — identical to V16–V20 (6th consecutive cycle) | standing disclosure (the clone's drawer is the superset) |
| L6 | Tailwind v4 sweep | trap tests (green in L3) + pin count + dialog-family scan | 95 `--color-` pins (distinct = occurrences = 95, identical to V19/V20); the trap tests 8/8; NO `duration-` class on the dialog family (only the explanatory comment) | no new v4 bugs |
| L7 | neo-crm pattern cross-check | GitHub commits page for `nordeim/neo-crm` main | no commits since 2026-10-22 (the V18–V20 pattern reviews still cover it) | pattern parity confirmed |
| L8 | Known-Issue #6 surface | full read: Dockerfile, docker-compose.yml, docs/DEPLOYMENT.md; repo-wide stale-token scan (studyflow/omni-study/orbital) | **F1/F2 below** — the deployment surfaces carry the scaffold identity, and DEPLOYMENT.md documents features this app does not ship | the cycle's target |
| L9 | The account-security routes | full read: change-password, change-email, delete-account, resend-verification route.ts + validation schemas + UI/test scan | **F3 below** — four real, rate-limited, password-first routes with zero test coverage and scaffold-era comments citing ADR numbers that collide with this repo's | rides along this cycle |
| L10 | Rate-limit budgets for the new spec | rg count of register/login calls across tests/e2e/*.spec.ts | registers: 5/run today + 1 (this spec) = 6 < 10/IP/15min; logins: 1 (setup) + 3 (this spec) = 4 < 10 — the shared-IP budget holds | safe to add the spec |
| L11 | `.env` / db / test configs | direct read | `.env` + `.env.example` both `DATABASE_URL="file:../db/custom.db"`; `db/` at the repo root (custom.db + e2e.db); vitest.config.ts + playwright.config.ts present and exercised by L3 | ✓ |

## 1. Findings

- **F1 (docs, the cycle's headline) — `docs/DEPLOYMENT.md` documents a
  different app.** Three stale eras in one file: it opens "ORBITAL ships
  as…" (a name even older than StudyFlow), §8 documents StudyFlow-only
  features (`/rum` diagnostics panel, `/export` + `/import` data
  portability — no such routes exist here; `rg api/rum|api/export|api/import`
  over src/ + tests/ returns nothing), §8.3–8.5 describe a
  "Settings → Profile" UI that does not exist (the routes are API-only)
  with a cascade list in StudyFlow's domain language ("subjects, tasks,
  notes, flashcards, grades, files, chat history"), §6 references
  `./scripts/smoke-test.sh` (missing), §1 claims "16 API route handlers"
  (the app ships 27 route files), §8's validation caveat cites
  `scripts/docker-layout-sim-s27.sh` (missing), and §8's compose table
  names the `studyflow` service. A VeloxPOS operator deploying by this
  guide would try three commands that cannot work.

- **F2 (config) — the Dockerfile + docker-compose.yml carry the scaffold
  identity.** Dockerfile:3 "StudyFlow (Omni-Study) — production
  container."; compose: service `studyflow`, image `studyflow:latest`
  (×2), port var `${STUDYFLOW_PORT:-3000}`. This IS the PAD's
  Known-Issue #6 row verbatim — the last never-actioned pending item.

- **F3 (untested surface + comment rot) — the four scaffold
  account-security routes.** `POST /api/auth/change-password`,
  `change-email`, `delete-account`, `resend-verification` are real,
  well-built (rate-limited 10/15-min, password verified PRE-WRITE,
  no-enumeration uniform 200s, the shared error mapper) — and have ZERO
  test coverage (no unit pin, no e2e spec), ZERO UI wiring (API-only),
  no README/PAD API-table entry, and comments citing the scaffold's
  session/ADR numbers (S24/ADR-022, S25/ADR-023, S26/ADR-024) which
  COLLIDE with this repo's ADR-022/023/024 (the auth surface family, the
  chart hover, the dialog motion) — actively misleading to any agent
  reading the code. The delete-account cascade comment lists StudyFlow
  models ("subjects, tasks, notes, decks, grades, files, chat, RUM
  events") instead of the retail domain.

- **F4 (hygiene) — `package-lock.json` is a vestigial second lockfile.**
  Tracked in git, `"name": "omni-study"`, npm format; the repo runs on
  `bun.lock` (the Dockerfile COPYs `package.json bun.lock` only; nothing
  references the npm lockfile outside an archival doc). The
  web-application family contract is single-lockfile; the stale name is
  the same identity-rot family as F1/F2.

- **No parity gaps.** The reference is unchanged (L4, 6th cycle), the
  clone's mobile contract was re-verified live by the V20 probe and is
  re-proven by the 9 e2e pins every run, the Tailwind v4 traps stay
  guarded (L6). Nothing was invented beyond the truth pass — every
  change below makes a shipped surface match what the app actually is.

## 2. Design decisions (resolved)

- **SD-80 — Known-Issue #6 closes as a TRUTH pass, not a name-swap.**
  Renaming "StudyFlow" to "VeloxPOS" in DEPLOYMENT.md would leave the
  file dishonest (documenting /rum, /export, a Profile UI, and a smoke
  script that do not ship). The rewrite documents the ACTUAL app: the
  real 6-variable env contract, the real verification commands, the real
  27-route API surface, the renamed Docker walkthrough, and the real
  account-security API (documented as the API-only superset it is). The
  PAD row closes with this commit.

- **SD-81 — the four account-security routes STAY (disclosed superset)
  and gain behavioral coverage.** Password rotation, email rotation,
  account exit, and code resend are genuine production-POS needs the
  reference lacks entirely; removal would shrink the superset. They stay
  API-only (no UI this cycle — the reference has no such surface to
  mirror, and a UI is a separate feature cycle), their comments get
  de-collided (retail-domain language, cited to ADR-030), and a new
  `tests/e2e/account-security.spec.ts` pins the contracts end-to-end
  (wrong-current 400, must-differ 400, taken 409, uniform-200
  no-enumeration, the delete cascade + cookie clear + subsequent 401).
  Rate-limit budgets verified safe (L10).

- **SD-82 — the rebrand is mechanical and lockstep.** Dockerfile header,
  compose service/image/port-var (`veloxpos`, `veloxpos:latest`,
  `VELOXPOS_PORT`), and every DEPLOYMENT.md § cross-reference update in
  the same commit; the compose AUTH_SECRET guard and the /data volume
  contract are unchanged (they are correct).

- **SD-83 — `package-lock.json` is removed** (single lockfile = bun.lock;
  the file carries the scaffold identity and nothing reads it). Guarded
  by a source pin so it cannot silently return.

- **SD-84 — the reference is unchanged (6th cycle); the clone-side mobile
  mandate re-verifies via the V21 probe** (the self-contained pattern,
  fresh `v21-*` evidence set), keeping every cycle's live-verification
  streak even on a docs-target cycle.

## 3. Execution batches

### B1 — the audit (DONE)

- L1–L11 above. Reference 6th cycle unchanged; baseline green
  first-try; findings F1–F4 scoped with file:line evidence.

### B2 — TDD RED: the pins (written FIRST, expected to fail)

- `tests/deployment-surfaces.test.ts` (new, the source-pin idiom — raw
  text scans where the finding lives IN comments, comment-stripped
  scans where it lives in code):
  1. Dockerfile carries no scaffold token (studyflow|omni-study|orbital,
     case-insensitive, raw scan).
  2. docker-compose.yml: no scaffold token; the service is `veloxpos`;
     the image is `veloxpos:latest`; the port var is `VELOXPOS_PORT`.
  3. docs/DEPLOYMENT.md: no scaffold token and no dead-feature token
     (/rum, api/export, api/import, smoke-test,
     docker-layout-sim); every `./scripts/…` reference resolves to an
     existing file.
  4. docs/DEPLOYMENT.md documents the full env contract (every variable
     in .env.example appears) — the count-the-things pin.
  5. docs/DEPLOYMENT.md's route-handler count equals the actual
     `src/app/api/**/route.ts` count (live fs scan — the count can never
     drift again).
  6. The four account-security routes carry no scaffold citation
     (S24|S25|S26 sessions, ADR-022|023|024 in those files) and no
     StudyFlow model list (subjects|tasks|flashcards|grades|decks).
  7. README's API table documents all four account-security routes.
  8. Exactly one lockfile: bun.lock exists, package-lock.json absent.
- `tests/e2e/account-security.spec.ts` (new, behavioral, isolated
  contexts — the security.spec registerAndVerify pattern, ONE scratch
  account, delete LAST):
  1. change-password: wrong current → 400.
  2. change-password: happy → 200; login with the new password → 200.
  3. change-email: posting the current address → 400.
  4. change-email: the seeded owner's address → 409.
  5. change-email: happy → 200 + response email; login with the NEW
     address → 200.
  6. resend-verification: unknown email → uniform 200 with NO code key.
  7. delete-account: wrong password → 400.
  8. delete-account: happy → 200; the session cookie is cleared (the
     follow-up authed request → 401).

### B3 — TDD GREEN: the fixes

- `Dockerfile`: header comment → VeloxPOS identity (the stages, the
  /data contract, and the healthcheck are already correct — identity
  only).
- `docker-compose.yml`: service `veloxpos`, image `veloxpos:latest`,
  `${VELOXPOS_PORT:-3000}`; header comment updated.
- `docs/DEPLOYMENT.md`: full rewrite per SD-80 (structure kept where
  true: §1 Build, §2 Run, §3 Env (the real 6-var table), §4 DB location
  (the 3 forms, de-orbited examples), §5 Updating, §6 Verification (the
  real gate commands), §7 Common issues, §8 Docker (renamed service,
  the honest no-daemon caveat without the dead script), NEW §9 Account
  security API — the four routes as the disclosed API-only superset
  with curl examples and their contracts).
- The four route files: comment de-collision (retail-domain cascade
  list, ADR-030 citation, no scaffold session numbers). No behavior
  change.
- `README.md`: API table gains the account-security row; counts bump
  with B4's results.
- `package-lock.json` deleted (SD-83).
- Re-run B2's pins → green.

### B4 — the V21 evidence set + the full gates

- `scripts/probe-v21-mobile-recovery.ts` (the V20 probe variant, fresh
  `v21-*` captures): the 10-check mobile drawer contract LIVE at
  390×844 on the remediated build.
- Full gates: lint → typecheck → build → `bun run test` (expect 513+8 =
  521/521, 37 files) → `bun run test:e2e` (expect 179+8 = 187/187).

### B5 — docs lockstep → commit + push

- PAD: v2.8.0 history entry + **ADR-030** (the deployment-surface truth
  pass + the account-security superset) + Known-Issue #6 row → CLOSED
  + any count updates.
- CLAUDE.md: the v21 contracts note + count bumps.
- README.md: badge counts (521 + 187) + the API row + any DEPLOYMENT
  pointer if stale.
- AGENTS.md: repo-hygiene line — bun.lock is the single lockfile; the
  deployment surfaces are pinned by tests/deployment-surfaces.test.ts.
- retail-pos_SKILL.md: v1.15.0 (the v21 close) + counts.
- This plan (§6 filled); `docs/session_35.md` (the session log);
  `worklog.md` (the V21 entry). Every count mention (513→521, 179→187)
  bumps in the same commit.
- Commit to main; SSH-wrapper push (no new branches).

## 4. Test plan

- The 8 unit source pins (B2) mechanically pin the deployment surfaces'
  identity, the DEPLOYMENT.md truth (env set, script refs, the live
  route count), the route-comment de-collision, the README API row, and
  the single-lockfile rule — the same idiom as tailwind-traps /
  recovery-a11y (raw scans where comments ARE the finding).
- The 8 behavioral e2e tests prove the four routes' contracts
  end-to-end against the production build: the 400/409/200 ladders, the
  uniform no-enumeration 200, the rotation round-trips (login with the
  new credentials), and the delete cascade + cookie clear. One scratch
  account per run; delete runs last; rate budgets verified (L10).
- The announcement-class limits are honest: e2e cannot prove the rate
  limiter's 15-minute window expiry (too slow) — the limiters stay
  unit/source-pinned territory; the spec proves the happy/sad ladders.
- Full suite re-runs as the regression proof (B4).

## 5. Out of scope (disclosed)

- A UI for the account-security routes (the reference has none to
  mirror; a future feature cycle if the operator wants one).
- The F2 e2e-flake watch (this run was clean — no new data point; the
  watch stands).
- The react-dom boot floor (~890 ms) — the standing V17 disclosure.
- The reference's own broken/dead flows — standing disclosures, nothing
  to mirror (6th cycle).
- All standing v8–v20 disclosures (SD-14, SD-18..SD-23, SD-63..SD-79,
  the a11y parity deviations) — unchanged.

## 6. Execution results (filled on completion — 2026-10-27)

- **B1 — DONE.** The audit ledger L1–L11 above; the reference unchanged
  for the 6th consecutive cycle; the baseline green first-try (no flake
  occurrence — a clean data point for the F2 watch).
- **B2 — DONE (verified RED).** `tests/deployment-surfaces.test.ts`
  (16 source pins — more granular than the planned ~9: the compose pin
  split into 4 `it`s, the route-comment pin into 4) failed **15/16**
  against the unfixed tree (the one pass: the bun.lock-exists half of
  the lockfile pin, trivially true pre-fix). One pin was corrected
  against reality before the fix: the env-var count check ≥6 → ≥5
  (`.env.example` carries 5 uncommented variables — the plan assumed 6).
  `tests/e2e/account-security.spec.ts` (8 behavioral tests) — honest
  note: these were written BEFORE the docs/comment fixes but the routes'
  behavior was already correct, so this layer is NEW COVERAGE, not
  RED→GREEN; the TDD RED applied to the deployment-surface pins (the
  finding they pin). The spec gained the fresh-context discipline
  mid-writing (a first draft routed authenticated calls through the
  storageState-backed `request` fixture — the demo owner's cookie could
  have ridden them and mutated the WRONG account; every authenticated
  call now goes through `playwrightRequest.newContext()` + an explicit
  cookie header, the security.spec M6 pattern).
- **B3 — DONE (verified GREEN).** Dockerfile + docker-compose rebranded
  (service `veloxpos`, image `veloxpos:latest`, `${VELOXPOS_PORT:-3000}`);
  `docs/DEPLOYMENT.md` rewritten (11 sections; the real env contract
  incl. the SEED_OWNER_PASSWORD dotenv-expansion note, the gate-ladder
  verification, the 27-route count, the renamed Docker walkthrough with
  the honest no-daemon caveat minus the dead script, and the new §10
  account-security API); the four route comments re-cited to ADR-030
  (retail-domain cascade list; resend-verification's "verify screen's
  resend action" corrected — the signup verify stage ships no resend
  button); README gained the account-security API row; `package-lock.json`
  removed (git rm --cached + delete). Pins flipped **16/16 green**.
- **B4 — DONE.** `scripts/probe-v21-mobile-recovery.ts` (the V20 probe
  variant) ran the full mobile drawer contract LIVE at 390×844 on the
  remediated build: **10/10 PASS** (login + app bar; 288×844 panel with
  the aria-expanded cycle; 8 links at a uniform 44.0px pitch; scroll
  lock + focus in; Esc close with focus returned + unlock; backdrop
  close; drawer route navigation to /StoreSettings; zero horizontal
  overflow on all 8 routes; the recovery card with the shell alive;
  Reintentar healing in place) + the three fresh captures
  (`v21-mobile-drawer-open-390.png`, `v21-view-recovery-card-390.png`,
  `v21-view-recovery-healed-390.png`). Full gates:
  **lint 0 · tsc 0 · build ✓ · 529/529 unit (37 files, 513+16) ·
  187/187 e2e (3.2m, 179+8)** — the new spec passed in isolation AND in
  the full suite.
- **B5 — DONE.** Docs lockstep: README (badge 529+187, the Tests table
  row, the Account-security feature row, the API table row); CLAUDE.md
  (the v21 contracts note + the command counts); PAD v2.8.0 (the
  history entry + **ADR-030** + the §8 testing table + **Known-Issue #6
  CLOSED**); SKILL v1.15.0 (the validation chain + all count mentions);
  AGENTS.md (the repo-hygiene truth-pin line); this ledger;
  `docs/session_35.md`; the worklog entry. Commit to main + the
  SSH-wrapper push close the cycle (hash recorded in session_35).
