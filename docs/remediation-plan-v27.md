# VeloxPOS — Remediation Plan v27 (Session V26→v27, 2026-10-28)

> Scope: **the shell title-guard pass — the F2-flake-watch family finally
> root-caused and closed.** The V27 audit found the reference UNCHANGED
> for the 12th consecutive cycle (nothing new to mirror), the baseline
> gates green exactly as V26 closed them (563/563 unit · 201/201 e2e —
> after the fresh-clone rebuild: install, .env, db:push, db:seed,
> chromium, then the full ladder), the mobile drawer contract
> live-verified at 390×844 with the spine ledger EXACTLY matching the
> frozen pin (12th consecutive confirmation of the absent Tailwind v4
> mobile-menu trap), the repo-wide citation sweep clean (17 test
> citations across `src/`, all resolve — the V26 instrument re-run), and
> neo-crm UNCHANGED at `316fbe2` (no new doctrine to adopt). The cycle's
> finding comes from the repo's own audit sweep, in the ADR-033
> gate-coverage family plus the Mode-B debugging discipline: **F1 — the
> shell's title effect in `src/app/page.tsx` is a BARE effect write
> racing Next's client metadata manager, and the race is the live
> root-cause candidate for the v9 Spanish-alias title flake** (1
> occurrence in V18, 1 in V26, a 9-cycle "known-open" watch item, always
> re-run green, zero code changes involved). The probe
> (`scripts/probe-v27-title-race.ts`) quantifies the race empirically
> this cycle: Next's metadata manager re-applies the root layout title
> ("VeloxPOS") 5–6 times per boot with the LAST write as late as ~295ms
> post-commit, and the shell's write lands as little as **9ms** after
> it — under full-suite load variance the order can flip, clobbering the
> shell's write PERMANENTLY (nothing re-fires the effect), which is the
> flake's exact signature (a 10s `toHaveTitle` retry window reading
> "VeloxPOS" forever). The repo already solved the IDENTICAL race on the
> 404 surface in v7 (`src/app/not-found-title.tsx` — the guarded
> MutationObserver that "wins the last write"); the shell never got the
> same treatment. This cycle ports the proven cure to the shell and pins
> the defense deterministically.

## 0. Verification ledger (all live unless noted; clone :3000 dev / :3102 probe vs reference)

| # | Item | Method | Result | Verdict |
|---|------|--------|--------|---------|
| L1 | Workspace state | fresh `git clone` (the sandbox workspace had been reset mid-session — twice; the second reset is itself a recorded environment fact); main @ `d02d793` (V26 + session_47 + session_48), clean tree; locals rebuilt twice: `bun install` (488 pkgs), `.env` from `.env.example` with `DATABASE_URL="file:../db/custom.db"`, `bun run db:push` + `db:seed` (12 products / 6 categories / 2 registers / 2 sales / 2 shifts — the reference mirror), `bunx playwright install chromium` (1243), `bun run build` | baseline current |
| L2 | V26 reference docs | full read: session_47 (the V26 raw log), session_48 (the V26 second raw log, Chinese), remediation-plan-v26 (ledger L1–L12 + execution results), the worklog tail (the V26 entry); core docs re-read (AGENTS 31 contracts + traps + account UI + mobile drawer contract incl. the v25 spine freeze + the v26 failure-path pins, CLAUDE, README, PAD v2.13.0/ADR-035, SKILL v1.20.0) | V26 closed the failure-path truth pass (the health DEGRADED branch + the boot-guard wiring, both mutation-proven); the docs stay lockstep-true at 563+201 | aligned |
| L3 | Baseline gates | lint → tsc → build → unit → e2e (in that order, on the fresh clone; the e2e run additionally required `bunx playwright install chromium` — a sandbox-binary absence, an infra miss root-caused on the spot, not a code failure) | 0 · 0 · ✓ · 563/563 (41 files) · **201/201** (3.6m, first-try after the chromium install) | all green |
| L4 | Reference data state | agent-browser on the logged-in reference (Terminal / Dashboard / Inventory / Sales / Registers / Reports / Ajustes; mobile 390×844) | Terminal shift-gated ("No hay turno activo"), Dashboard $0.00 KPIs + the 7-day flat chart + the byCategory legend (Lácteos 2, Limpieza 2, Higiene Personal 2, Alimentos 3, Snacks 1), 12 products (Pan Bimbo last), 2 sales (V-MO6BJT7G, V-MMPNY55Z), Caja 2 first (both Cerrada), Reports "Sin datos en este período" + the 7/14/30/90 chips, Ajustes = exactly the five store sections; at 390px NO hamburger (the two `aria-expanded` buttons found are Radix Select comboboxes on the Ajustes page, NOT nav controls — verified by role/HTML), viewport-locked (scrollH = clientH = 844) | unchanged — nothing new to mirror (12th cycle) |
| L5 | Clone mobile drawer live | agent-browser on the dev server @390×844 (the user's standing focus — the Tailwind v4 bug check) | the drawer spine RE-MEASURED live, EXACTLY the frozen ledger: panel `[0,0,288,844]` · header `[0,0,287,69]` · nav `[0,69,287,727]` · footer `[0,796,287,48]` ("VeloxPOS" wordmark) · close `[235,16,36,36]` · 8 links at `[12, 81+44k, 263, 40]`; Esc closes + RETURNS focus to the hamburger (`Abrir menú de navegación`); zero horizontal overflow — the TailwindCSS v4 mobile-menu trap is NOT present (12th consecutive confirmation; `tests/tailwind-traps.test.ts` green in L3) | superset verified (12th cycle) |
| L6 | Citation sweep (the V26 instrument, re-run) | `rg` every `tests/**` citation across `src/` + existence check | 17 citations found, **all 17 resolve** — the V26 sweep's fix (the s22 re-point) holds; zero stale citations | instrument clean |
| L7 | neo-crm pattern cross-check | `git ls-remote` (HEAD `316fbe2`) | UNCHANGED since the V25 review (session-196, the drawer-open spine freeze — already ADOPTED as V25's ADR-034). No new doctrine; the cycle's target comes from the repo's own audit | no adoption this cycle |
| L8 | **F1 scope — the shell title race** | `scripts/probe-v27-title-race.ts` (NEW, committed): self-contained (spawns the standalone server on :3102 against the seeded `db/e2e.db`, native-fetch login, storageState), instruments every context with a title recorder (a `Document.prototype.title` setter patch + a MutationObserver on `documentElement` — diagnosed live: `documentElement` is NULL at init-script time, so the observer attaches via 1ms poll; the naive `document.head` observer never fires — the init-time head is a placeholder node), then 12 natural + 24 fast-auth iterations (`/api/auth/me` fulfilled instantly — the widest race window) | every iteration shows the same shape: SSR ships `<title>VeloxPOS</title>`, Next's client metadata manager re-applies "VeloxPOS" **5–6 times per boot** with the last write as late as ~295ms post-commit, and the shell's bare effect write lands **9–30ms after** the last metadata write (min margins: natural **9ms**, fast **11ms**). The order is decided by single-digit-ms margins; a load-variance flip clobbers the shell's write permanently (the effect never re-fires) — the v9 title flake's exact signature. Corroborating repo evidence: `src/app/not-found-title.tsx`'s own v7 comment documents the SAME manager re-applying the root title "between the 0-50ms marks" on the 404 surface, where the repo already ships the guarded-observer cure | the cycle's F1 |
| L9 | The flake's 9-cycle history | worklog + plan sweep: V18 (first occurrence, hypothesis-linked to the then-unfixed chunk-recovery F1), V21–V24 ("clean this run"), V26 (second occurrence — zero code changes, re-run green) | the watch item outlived its V18 hypothesis (V18's fix landed and the flake RECURRED in V26) — an independent root cause was required; the title-race mechanism (L8) matches every observable: title-only failures, full-suite-only occurrences, re-run green, zero code changes | root cause identified |
| L10 | The fix's precedent | full read: `src/app/not-found-title.tsx` (the guarded MutationObserver — apply-when-different, observe `document.head` subtree, disconnect on unmount, "the guarded observer wins the LAST write") + the shell's current effect (`src/app/page.tsx` — the bare write gated on `status === "ready"` with `[status, view]` deps) + the existing source pin (`tests/functional-parity-v9.test.ts:125` — `document.title =` exists in page.tsx; the guarded write keeps it true) | the cure is a PROVEN in-repo pattern (v7, 404 surface, green since); porting it to the shell is additive; the SPA-nav shape (`window.history.pushState` in `src/lib/store.ts:59` — not next/router) means the metadata manager only writes at boot, so the observer's defense covers the entire hazard surface | cure design validated |
| L11 | Config pins + env contract | `rg` over playwright.config.ts (the V24 knob pins after the spread) + `.env` / `.env.example` round-trip | all V24 pins intact; `DATABASE_URL="file:../db/custom.db"` live in `.env`; `db/` at the repo root (custom.db + e2e.db); vitest + playwright configs present and unmodified this cycle so far | contract holds |
| L12 | The user's standing checklist | `.env` DATABASE_URL ✓ · `db/` at root ✓ · vitest/playwright config files present ✓ (this cycle ADDS to them only via new test files, per SD-115) · `.env.example` matches the codebase ✓ · `skills/` excluded from checking/testing/compilation ✓ (tsconfig exclude + vitest include patterns) | all satisfied |

## 1. Findings

- **F1 — the shell's title effect is a bare write racing Next's client
  metadata manager.** `src/app/page.tsx`'s effect
  (`document.title = documentTitleForPath(window.location.pathname)` when
  `status === "ready"`) is exactly the shape the repo's own v7 discovery
  calls fragile: a bare effect write that Next's metadata manager can
  overwrite after the fact. The probe quantifies the boot-time sequence:
  the SSR title "VeloxPOS" is re-applied by the manager 5–6 times (last
  write ~295ms post-commit), and the shell's write lands 9–30ms later.
  The margin is single-digit milliseconds — under full-suite load the
  order flips occasionally, the clobber is permanent (nothing re-fires
  the effect), and the v9 title assertion reads "VeloxPOS" for its whole
  10s retry window: RED, re-run green, zero code changes — the flake's
  complete signature (V18 + V26 occurrences across a 9-cycle watch that
  outlived its original V18 hypothesis). The identical race was already
  probed, documented, and fixed on the 404 surface in v7; the shell never
  received the same treatment.

- **No other real findings.** The baseline is green exactly as V26
  closed it (L3); the reference is unchanged for the 12th consecutive
  cycle (L4); the drawer spine matches the frozen ledger exactly (L5);
  the citation sweep is clean (L6); neo-crm is unchanged (L7); the
  Known-Issues register is clean apart from the F2 flake watch (closed
  by this cycle) and the standing disclosures; the docs counts are
  lockstep-true at 563+201; the config pins hold (L11); `.env.example`
  is bidirectional-true (the install/db/login round-trip proved it during
  setup); `skills/` excluded from all checking/compilation per the
  standing instruction.

## 2. Design decisions (resolved)

- **SD-112 — F1's cure: the guarded title effect (the not-found-title.tsx
  pattern ported to the shell).** The shell's effect becomes: apply the
  path-driven title only when it DIFFERS (no write-loop), then arm a
  `MutationObserver` on `document.head` (`subtree + childList +
  characterData`) that re-applies the same guarded write whenever ANY
  head mutation leaves the title wrong — the observer "wins the last
  write" against the metadata manager, exactly as the 404 surface has
  done since v7. The effect keeps its `[status, view]` deps (SPA
  navigation re-applies on view change; the observer covers everything
  between), and the cleanup disconnects the observer. No new component,
  no new module — a 10-line change inside the existing effect, the
  proven in-repo shape.

- **SD-113 — the pins (TDD: born RED on the bare-write tree).**
  (a) ONE new e2e spec `tests/e2e/title-guard.spec.ts`: the
  deterministic clobber pin — navigate to `/Ventas`, assert the correct
  title, then `page.evaluate(() => { document.title = "VeloxPOS"; })`
  (simulating the manager's late re-apply — the empirically documented
  write family), then assert the title RETURNS to "Ventas | VeloxPOS"
  (the guard corrects; on the bare-effect build the clobber is permanent
  → the pin is born RED). A second test re-runs the clobber then
  performs a SPA navigation and asserts the title follows the NEW route
  (the guard never breaks navigation titling). (b) ONE new unit source
  pin file `tests/title-guard.test.ts` (the recovery-a11y idiom —
  comment-stripped source, regex pins): page.tsx carries the
  MutationObserver wiring + the guarded (conditional) write +
  observer.disconnect cleanup; not-found-title.tsx keeps its own (both
  surfaces defended); the existing v9 pin (`document.title =` present)
  stays true.

- **SD-114 — the mutation proof (the standing discipline).** After the
  born-green run: plant the regression — revert the effect to the bare
  write (drop the observer + the guard) → the e2e clobber pin goes RED
  (the clobber sticks again) and the source pin goes RED → restore →
  GREEN. The TDD RED-first run on the bare-write tree is itself the
  primary proof; the planted-regression re-run is the recorded
  confirmation (§6).

- **SD-115 — the pins EXTEND, never weaken.** No existing test is edited
  or deleted; TWO new files land (one e2e spec, one unit file). Counts
  only move up (563 → 566 unit; 201 → 203 e2e — exact numbers recorded
  in §6).

## 3. Execution batches

### B1 — the audit (DONE)

- L1–L12 above. Reference 12th cycle unchanged; baseline green on the
  fresh clone; the drawer spine matching the frozen ledger exactly; the
  citation sweep clean; neo-crm unchanged; the title race quantified
  (the probe committed as the cycle's instrument); the flake's 9-cycle
  history swept; the fix precedent validated.

### B2 — the pins (written FIRST, born RED)

- `tests/e2e/title-guard.spec.ts` (NEW — SD-113a): the clobber-correction
  pin + the clobber-then-navigate pin.
- `tests/title-guard.test.ts` (NEW — SD-113b): the source pins on
  page.tsx's observer wiring + not-found-title.tsx's standing guard.
- Both run against the standing tree → RED expected (the clobber sticks;
  the observer absent).

### B3 — the fix

- `src/app/page.tsx`: the guarded title effect (SD-112).
- Re-run both pins → GREEN expected.
- `bunx vitest run tests/functional-parity-v9.test.ts` — the existing
  title pins must stay green (extend, never weaken).

### B4 — the mutation proof + the full gates

- Plant the bare-write regression → both new pins RED → restore → GREEN
  (SD-114).
- Full gates: lint → typecheck → build → `bun run test` (expect 566, 42
  files) → `bun run test:e2e` (expect 203).
- The evidence set: four v27 captures under `docs/screenshots/`
  (`v27-desktop-ventas-1280.png` — the F1 surface whose title the guard
  defends; `v27-desktop-dashboard-1280.png` — the standing desktop
  surface; `v27-mobile-drawer-open-390.png` — the standing mobile
  surface, the spine freeze holding; `v27-mobile-terminal-390.png` — the
  closed chrome with the reference-matching shift-gated state), all
  captured against the running dev server.

### B5 — docs lockstep → commit + push

- README: the badge + the Testing-table counts (566 + 203).
- AGENTS.md: the shell title-guard contract (the v27 section — the
  guarded observer on the shell, the same pattern as the 404 surface).
- CLAUDE.md: the v27 contracts note + the counts.
- PAD: v2.14.0 history entry + **ADR-036** (the shell title-guard pass —
  the flake root-caused and closed) + the §8 testing table.
- retail-pos_SKILL.md: v1.21.0 + counts + the §12 **F11** lesson (a
  bare effect write against a framework-owned DOM slot is a race — win
  the last write with the guarded observer; the probe instrument that
  proved it).
- This plan (§6 filled); `docs/session_49.md` (the distilled session
  log); `worklog.md` (the V27 entry). Every count mention (563→566,
  201→203) bumps in the same commit.
- Commit to main; SSH-wrapper push (no new branches).

## 4. Test plan

- The born-RED pins prove the defense deterministically: the clobber
  simulation replaces the probabilistic race with a controlled write,
  and the correction assertion pins the guarded observer's contract (the
  same mechanical-proof style as the V25/V26 mutation batteries).
- The mutation proof (B4) demonstrates that removing the guard flips the
  pin RED — the pin guards the guard.
- The full suite re-runs as the regression proof — the v9 title family
  must stay green (the fix changes the write's guard, not its value).
- The probe script (committed) re-runs the margin ledger post-fix for
  the record: the observer's corrections appear in the timeline as
  immediate re-writes after any simulated clobber.

## 5. Out of scope (disclosed)

- The react-dom boot floor, the reference's own broken flows (nothing to
  mirror), and every standing v8–v26 disclosure — unchanged.
- Next's metadata manager internals (the multiple re-applies are
  framework behavior; the guard coexists with them by design — it only
  writes when the title is WRONG, never fighting a correct write).
- The F2 flake watch itself: this cycle closes the title-race mechanism;
  if a title-family flake recurs POST-fix, it gets a fresh investigation
  (the watch item retires with the mechanism, not with a hope).
- The drawer at intermediate below-lg widths — unchanged standing
  disclosure.

## 6. Execution results (filled on completion — 2026-10-28)

- **B1 — DONE.** The audit ledger L1–L12 above; the reference unchanged
  for the 12th consecutive cycle (the two `aria-expanded` mobile buttons
  investigated and identified as Radix Select comboboxes — NOT a
  hamburger); the baseline green exactly as V26 closed it (563/563 unit
  · 201/201 e2e — after the fresh-clone rebuild + the chromium-1243
  binary install, an infra miss root-caused on the spot); the mobile
  drawer spine re-measured live, EXACTLY matching the frozen ledger
  (12th confirmation, no Tailwind v4 trap); the citation sweep clean
  (17/17 resolve); neo-crm unchanged at `316fbe2`; the title race
  quantified by the probe (committed as
  `scripts/probe-v27-title-race.ts`): the metadata manager's last write
  ~295ms post-commit, the shell's write 9–30ms later, min margins 9ms
  (natural) / 11ms (fast-auth) across 36 iterations — plus 8 further
  iterations post-fix confirming no write-loop.
- **B2 — DONE (born RED, exactly as designed).**
  `tests/e2e/title-guard.spec.ts`: test 1 (the boot clobber) RED with
  the flake's exact signature — "Expected: 'Ventas | VeloxPOS' Received:
  'VeloxPOS'", 24 retries over the full 10s window; test 2 (post-nav
  clobber) RED on its guard-sensitive step (the first RED run also
  exposed a first-draft test defect — the Ventas sidebar link targets
  the canonical `/Sales`, so the nav title is "Sales | VeloxPOS", not
  the alias title; the test was corrected to assert BOTH the canonical
  nav title AND two clobber corrections — the TDD loop earning its keep
  on the pin itself, the F5/F9 precedent). `tests/title-guard.test.ts`:
  4/5 RED (the page.tsx observer pins fail; the not-found-title pin
  passes — the standing 404 guard already true).
- **B3 — DONE.** The guarded title effect landed in `src/app/page.tsx`
  (the not-found-title.tsx pattern: apply-when-different, the
  MutationObserver on `document.head` with subtree+childList+
  characterData, disconnect on cleanup, the `[status, view]` deps kept).
  Both pin layers GREEN: unit 5/5, e2e 2/2 (3/3 with setup). The
  existing v9 title pins re-ran green inside the full suite (extend,
  never weaken — the v9 source pin's `document.title =` regex still
  matches the guarded write).
- **B4 — DONE (mutation-proven both directions).** Planted the
  bare-write regression (the effect reverted to the exact root-cause
  shape) → rebuild → **unit 4 RED + e2e 2 RED** (the clobber sticks
  again; the standing battery stays green — the battery gap the pins
  close, demonstrated live); restored → rebuild → **GREEN** (unit 5/5 ·
  e2e 2/2). Full gates: **lint 0 · tsc 0 · build ✓ · 568/568 unit (42
  files, 563+5) · 203/203 e2e (201+2, 3.6m, ZERO flakes)**. The evidence
  set: four v27 captures under docs/screenshots/ (v27-desktop-ventas-1280
  — the F1 surface, title "Ventas | VeloxPOS" verified live pre-capture;
  v27-desktop-dashboard-1280; v27-mobile-terminal-390 — the
  shift-gated chrome; v27-mobile-drawer-open-390 — the spine freeze
  holding), all PNG-validated at the expected dimensions. The probe
  re-ran post-fix: identical timeline shapes, no write-loop (the guard
  writes only when the title is wrong).
- **B5 — DONE.** Docs lockstep: README (badge 568+203 + the testing
  table), AGENTS (the §17 title contract gains the V27 guard paragraph),
  CLAUDE (the v27 contracts note + counts 568/42 · 203), PAD v2.14.0
  (the history entry + **ADR-036** + the §8 testing table + both seam
  lists), SKILL v1.21.0 (the v27 close layer + counts + the §12 **F11**
  lesson), this ledger's §6, `docs/session_49.md` (the distilled log),
  the worklog V27 entry. `.env.example` unchanged and bidirectional-true
  (the install/db/login round-trip proved it during setup). Commit to
  main + the SSH-wrapper push close the cycle.
