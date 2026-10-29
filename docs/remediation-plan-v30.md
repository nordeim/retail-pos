# VeloxPOS — Remediation Plan v30 (Session V29→v30, 2026-10-29)

> Scope: **the advisories re-triage** (the neo-crm session-198 doctrine
> adopted). The V30 audit (15th cycle) found the reference UNCHANGED for
> the 15th consecutive cycle (data, views, the 390×844 viewport lock —
> nothing new to mirror), the baseline gates green exactly as V29 closed
> them (577/577 unit · 207/207 e2e after the fresh-clone rebuild:
> install, .env, db:push, db:seed, chromium-1243, then the full ladder),
> the mobile drawer spine re-measured live at 390×844 EXACTLY matching
> the frozen v25 ledger (15th consecutive confirmation of the absent
> Tailwind v4 mobile-menu trap; Esc + aria reset + focus return verified
> live), the repo-wide citation sweep clean (19 test citations across
> `src/`, all resolve), the V27 title-guard probe re-run 90/90 clean
> (30 natural + 60 fast-auth; min margins 9ms/8ms — the race shape
> live, the guard correcting every iteration), the Known-Issues
> register clean (zero live watch items), and neo-crm ADVANCED by one
> commit (`ba30355` → `56deef8`): **session-198 — THE ADVISORIES
> RE-TRIAGE** — new doctrine, read in full.
>
> The doctrine, mapped to this repo: **the manifest-truth family has
> TWO halves — dead packages (V28: earns-its-place) and VULNERABLE
> versions (the advisories axis) — and the second half had ZERO
> standing duty here.** The repo-included `skills/security-and-hardening`
> SKILL.md's Always-Do tier mandates "Run `npm audit` (or equivalent)
> before every release"; the duty had never run in this repo. The first
> live run (this cycle) found **2 HIGH advisories, one on a DIRECT
> RUNTIME chain** — the exact s198 catch shape (their census had
> drifted 9 → 12 with a critical on a runtime chain; ours had never
> been counted at all).

## 0. Verification ledger (all live unless noted; clone :3000 dev / :3102 probe vs reference)

- Baseline gates (fresh clone at `41acd3c`): lint 0 · tsc 0 · build ✓ ·
  **577/577 unit (43 files)** · **207/207 e2e (3.6m, zero flakes)** —
  exactly the V29 close.
- **The advisories audit (the s198 duty, run for the FIRST time in this
  repo)**: `bun audit` → **2 vulnerabilities (2 high)**:
  - **zod 4.6.5 < 4.6.6** (GHSA-mrhx-c7xc-m3w5, "Zod can exhaust
    memory while validating oversized constrained collections") — a
    **DIRECT runtime dependency**: the Zod validation layer at every
    API boundary (`src/lib/validation.ts`, strip-mode schemas,
    `parseWith`). The lockfile holds ONE hoisted resolution
    (`zod@4.6.5`, line 1153) serving BOTH the root entry AND the
    `eslint-config-next › eslint-plugin-react-hooks` chain (its range
    `^3.25.0 || ^4.0.0` dedupes to the root) — one bump cures both.
  - **deepmerge-ts 7.1.5 < 8.0.0** (GHSA-ggr8-5vv4-36mx, "DeepmergeTS
    has stack exhaustion when merging recursive object graphs") — via
    `prisma › @prisma/config` only, the prisma CLI's dev-toolchain,
    zero runtime request-path — neo-crm s198's own DECLINED
    composition.
- The exposure shape (the zod advisory's runtime reach): **zero
  `.json()` parses outside `readJson` in `src/app/api/`** — every zod
  parse sits behind the M4 1MB body gate (413), already pinned by
  `tests/http-body.test.ts`. The floor bump is defense-in-depth on
  top of the standing brake.
- The skill's own triage ladder (`security-and-hardening` §"Triaging
  npm audit Results"): HIGH + reachable in production → **fix
  immediately**; HIGH + dev-only → "fix soon, but not a blocker" +
  **document the reason and set a review date** (the re-triage clause).
- Reference (15th cycle, agent-browser login): dashboard $0.00 / 0 /
  12 / 0 KPIs, flat 7-day chart, 390×844 viewport-locked
  (scrollHeight 844 = innerHeight, scrollTop 0), no hamburger —
  UNCHANGED.
- Clone drawer spine (live, 390×844): panel [0,0,288,844] · nav
  [0,69,287,727] · footer/wordmark [0,796,287,48] · close
  [235,16,36,36] · 8 links at [12,y,263,40] y=81+44k — EXACTLY the
  frozen v25 pin; Esc closes, aria resets, focus returns to the
  hamburger.
- Clone desktop spot-check: /Ventas renders "Ventas | VeloxPOS" (the
  V27 guard's face), H1 "Historial de Ventas", 2 seeded sales.
- Citation sweep: 19/19 resolve.
- Probe-v27 re-run: 90/90 clean (30 natural + 60 fast-auth; min
  margins 9ms/8ms).
- neo-crm: `56deef8` (session-198) read in full — the advisories
  re-triage is the round material; D-198a1 (the transitive override +
  the EXHAUSTIVE lockfile pin + the dormancy freeze) + D-198a2 (the
  stale security-ledger census + the whitespace-normalized doc pin)
  are the adoptable cures; the declined list (dev-toolchain bumps,
  registry majors, the no-runtime-surface e2e extensions) informs our
  scope.

## 1. Findings

### F1 — the advisories axis has ZERO standing duty or pin (the s198 shape, first-run edition)

The V28 dependency census made "every package earns its place"
standing — the DEAD half of the manifest-truth family. The VULNERABLE
half — the advisories axis — has no duty, no ledger row, no pin:
`bun audit` appears nowhere in the repo's history, docs, or tests,
despite the repo-included `skills/security-and-hardening` SKILL.md's
Always-Do mandate ("Run `npm audit` (or equivalent) before every
release") and its verification checklist row ("`npm audit` shows no
critical or high vulnerabilities"). The first live run found:

| Chain | Advisory | Triage (the skill's ladder) |
|---|---|---|
| `zod@4.6.5` — DIRECT runtime (the validation layer at every API boundary; root + eslint chains resolve the one hoisted copy) | HIGH GHSA-mrhx-c7xc-m3w5 (< 4.6.6) | reachable in production → **fix immediately** |
| `deepmerge-ts@7.1.5` — dev-toolchain (prisma CLI via @prisma/config; zero runtime request-path) | HIGH GHSA-ggr8-5vv4-36mx (< 8.0.0) | dev-only → **documented decline + re-triage clause** (the s164/s198 no-mid-rotation toolchain posture; an override to 8.x risks the gate-critical prisma CLI) |

**The cure (F1a)**: `bun add zod@^4.6.6` (resolves 4.6.7, the latest
4.x) — the DIRECT-dep cure through the package manager, never a
hand-edited manifest/lockfile. No `overrides` block is needed (neo-crm
needed one because its vulnerable dep was an OPTIONAL TRANSITIVE of
jspdf; ours is a direct dependency whose range we own). The manifest
range itself moves to `^4.6.6` — the range then EXCLUDES the
vulnerable versions for any future resolution.

**The decline (F1b)**: deepmerge-ts rides the prisma CLI only
(grep-verified: absent from the manifest, zero imports in src/); the
advisory's vector (recursive object graphs) is operator-controlled
local config merging, not a runtime request path. Documented in the
PAD §6 ledger row with the re-triage clause: re-triage when
@prisma/config bumps or a runtime chain appears.

### S — the security ledger (PAD §6) has no advisories row at all (the D-198a2 shape, INVERTED)

neo-crm's D-198a2 swept a STALE census (the ledger row carried the
s164 numbers verbatim for 33 sessions, zero teeth). Retail-pos's
shape is the inversion: the ledger row never existed — the axis was
absent from birth rather than drifted. The cure therefore CREATES the
row WITH teeth from birth: the PAD §6 advisories row (the post-cure
census + the composition + the declined member + the re-triage
clause) is pinned whitespace-normalized in the census suite (the pin
holds the CONTENT, never the wrap — the D-198a2 live lesson). Born
RED (the row is absent today), GREEN after the row ships.

## 2. Design decisions (resolved)

1. **The one-suite doctrine: the pins extend
   `tests/dependency-census.test.ts`.** Dead packages (V28) and
   vulnerable versions (v30) are the same family — manifest/lockfile
   claims that need gate teeth. A new suite would fragment the
   census's own concept; the census file's self-exclusion rule
   already covers the new prose.
2. **Born-RED, the V28 form.** The pins catch LIVE defects (the
   vulnerable zod resolution; the absent ledger row) — RED on the
   standing tree, GREEN after the cure. (The V29 born-green +
   mutation-proof form applies only to already-correct surfaces.)
3. **The exhaustive lockfile form (the D-198a1 hardening).** The
   zod-floor test collects EVERY `zod@x.y.z` resolution in bun.lock
   and asserts each ≥ 4.6.6 — a first-match or root-only pin would
   pass a NESTED vulnerable copy (neo-crm's first cure attempt left a
   nested jspdf/dompurify surviving on disk; the exhaustive form is
   what catches that shape). The mutation proof plants exactly that
   nested copy.
4. **The manifest range floor.** package.json's zod range minimum is
   asserted ≥ 4.6.6 — the RANGE is what a future `bun update` or
   fresh resolve moves within; a lockfile-only pin would leave the
   range admitting the vulnerable versions.
5. **The doc pin is whitespace-normalized.** The PAD §6 row's census
   claim is pinned on normalized content (the s198 live lesson: their
   first draft failed on a hard-wrapped head — the pin holds the
   CONTENT, never the wrap).
6. **deepmerge-ts DECLINED, documented.** The s164/s198 toolchain
   posture: prisma-CLI-only member, zero runtime request-path; the
   override to 8.x risks `db:push`/`db:seed` (gate-critical CLI
   commands). The decline carries the re-triage clause in the ledger
   row.
7. **The count ladder moves only unit**: 577 → 580 (+3 census tests);
   files 43 HELD (the suite is extended, not added); e2e 207 HELD —
   the zod bump's compatibility is proven by the FULL battery re-run
   (the validation layer's whole pin set), not by new e2e coverage.
   All doc counts move in the same commit (the count-lockstep rule).
8. **No e2e/a11y extension for the advisories axis** (neo-crm's
   declined list): no page surface changed — the standing 207 battery
   re-run green IS the cure's inertness proof.

## 3. Execution batches

### B1 — the audit (DONE)

The 15th-cycle ledger in §0 — reference unchanged, spine exact,
probe clean, citations clean, Known-Issues zero, neo-crm s198 read,
the advisories audit run live for the first time (the catch: 2 highs,
1 on the direct runtime chain).

### B2 — the pins (written FIRST, born-RED verified)

Extend `tests/dependency-census.test.ts` with the advisories block:

1. **The exhaustive lockfile zod floor**: parse bun.lock, collect
   every `zod@x.y.z` resolution (regex over the lockfile text, numeric
   triple compare against [4,6,6]) → RED today (the single
   `zod@4.6.5`).
2. **The manifest zod range floor**: package.json's zod range minimum
   ≥ 4.6.6 (caret-range parsing) → RED today (`^4.6.5`).
3. **The PAD §6 advisories-ledger content pin**: the normalized PAD
   text must carry the ledger row's census claim (the zod floor, the
   declined deepmerge-ts composition, the re-triage clause) → RED
   today (the row is absent).

### B3 — the cure

1. `bun add zod@^4.6.6` (package.json range + bun.lock resolution
   move together through the package manager).
2. The PAD §6 advisories ledger row (the post-cure census, the
   composition, the declined member, the re-triage clause).
3. AGENTS.md repo-hygiene: the standing advisories-duty note (the
   Always-Do tier made standing; the runtime-chain rule; the census
   suite's new block; the "editing the floor or the row means running
   the census" clause).
4. Re-run the census suite → GREEN (all three pins).

### B4 — the mutation proofs + the full gates

1. Proof (a) the nested vulnerable copy (the first-match-passes
   shape): plant a SECOND `zod@4.6.5` resolution line in bun.lock
   (nested-form, after the clean root entry) → exactly 1 RED at the
   lockfile-floor assertion (a root-only/first-match pin would have
   stayed green) → restore (`git checkout -- bun.lock`) → GREEN.
2. Proof (b) the ledger drift: plant the stale census in the PAD §6
   row (the pre-cure "2 high" census) → exactly 1 RED at the doc
   pin → restore → GREEN.
3. Full ladder: lint → typecheck → build → **580/580 unit (43
   files)** → **207/207 e2e** (the zod bump's compatibility proof).
4. The v30 captures (5): desktop-terminal-1280 (the cycle's own
   subject — the runtime validation chain's most visible face, the
   sale surface), desktop-dashboard-1280, desktop-ventas-1280,
   mobile-terminal-390, mobile-drawer-open-390 — PNG-validated at
   exact dimensions.

### B5 — docs lockstep → commit + push

README (badge 580+207), AGENTS (the advisories duty + the audit),
CLAUDE (the v30 contracts note + counts), PAD **v2.17.0** (history +
**ADR-039** + the §6 advisories row + the §8 unit-count row), SKILL
**v1.24.0** (the v30 close layer + counts + the §12 F14 lesson),
worklog, this plan's §6, session_57 (EN) + session_58 (ZH, the
session_55 convention). `.env.example` verified unchanged-and-tracked
(no new env vars this cycle). Commit to main; push via the SSH
wrapper.

## 4. Test plan

- `bunx vitest run tests/dependency-census.test.ts` — the extended
  suite alone: the three new tests born-RED (before B3), then GREEN
  (after B3), the six standing tests green throughout.
- The two mutation proofs, each: RED at the exact target → restore →
  GREEN (no collateral — the other census tests stay green).
- `bun run test` — 580/580 (the count ladder; re-run after every doc
  edit in B5 — the census/doc pins read the live docs).
- `bun run lint` + `bun run typecheck` + `bun run build` + `bun run
  test:e2e` — the full ladder (the zod compatibility proof).
- `bun audit` — the post-cure census: 1 high (deepmerge-ts,
  dev-toolchain, documented) — the documented posture, recorded in
  the ledger row.
- `git status` clean of gitignored artifacts before commit.

## 5. Out of scope (disclosed)

- The deepmerge-ts 8.x override (decision #6 — the s164/s198
  toolchain posture; the prisma CLI's own member, gate-critical).
- The registry majors (Prisma 6→7, lucide-react, next 16.4.3,
  zustand 5.0.16 — their own rotation cycles, none carrying an
  advisory on our locked versions; neo-crm's identical declined
  list).
- e2e/a11y extensions for the advisories axis (decision #8 — no page
  surface changed).
- The reference's own broken flows (nothing to mirror, 15 cycles
  standing).
- Every standing v8–v29 disclosure unchanged.

## 6. Execution results (filled on completion — 2026-10-29)

- B2: the three advisories pins written FIRST and verified born-RED on
  the standing tree — the exhaustive lockfile floor RED at the single
  `zod@4.6.5` resolution; the manifest range floor RED at `^4.6.5`;
  the PAD ledger content pin RED at the absent row; the three
  standing V28 census tests green throughout (3 RED + 3 green).
- B3 — **the cure, with the D-198a1 discovery en route**: `bun add
  zod@^4.6.6` resolved the root to 4.6.7 (manifest range `^4.6.7`)
  but CREATED a NESTED `eslint-plugin-react-hooks/zod@4.6.5`
  resolution — the bare bump left the vulnerable copy surviving on
  disk, `bun update zod` unable to clear it (the neo-crm first-attempt
  shape verbatim; design decision #8's "no overrides block needed"
  premise was WRONG — the direct-dep bump is not the whole cure).
  The completed cure: the `overrides.zod: "^4.6.6"` tree-wide floor +
  `bun install` — the tree deduped back to ONE hoisted `zod@4.6.7`;
  the manifest-floor pin widened to BOTH seats (dependencies.zod +
  overrides.zod). Post-cure `bun audit`: **1 high — the documented
  deepmerge-ts decline** (prisma CLI, dev-toolchain, re-triage clause
  in the PAD §6 ledger row). The census suite GREEN 6/6.
- B4: both mutation proofs RED-at-the-exact-target → restored →
  GREEN. Proof (a) the planted NESTED `zod@4.6.5` (after the clean
  root — the first-match/root-only-passes shape): exactly 1 RED at
  the exhaustive lockfile assertion, the other five tests green.
  Proof (b) the planted stale census ("zero advisories" in the PAD §6
  row): exactly 1 RED at the doc content pin, zero collateral. Full
  gates after the restore: **lint 0 · tsc 0 · build ✓ · 580/580 unit
  (43 files, 577+3) · 207/207 e2e (3.6m)** — the zod bump's
  compatibility proven by the full battery. One first-run F1c flake
  (the v16 low-stock color pin) on the cold standalone boot —
  isolated re-run green AND full-suite re-run green (207/207, F1c
  761ms), first occurrence in 15 cycles, recorded for watch (the
  V18/V26 always-re-run-green family; root-cause escalation only on
  recurrence, the V27 precedent). Five v30 captures PNG-validated at
  exact dimensions (desktop-terminal-1280 — the cycle's subject,
  desktop-dashboard-1280, desktop-ventas-1280, mobile-terminal-390,
  mobile-drawer-open-390).
- B5: README (badge + Tested row 580+207), AGENTS (the advisories
  axis census-pinned note — the standing duty, the override lesson,
  the pin inventory), CLAUDE (the v30 contracts note, newest-first +
  counts), PAD v2.17.0 (history entry + ADR-039 + the §6 advisories
  ledger row + the §8 unit row 580 + the census seam row extension),
  SKILL v1.24.0 (the v30 close layer live, the v29 layer demoted +
  three count sites + the §12 F14 lesson), session_57 + session_58
  (the dual raw logs), the worklog V30 entry, this §6. `.env.example`
  verified unchanged and tracked (no new env vars this cycle). The
  unit suite re-ran green after every doc edit (the census + doc pins
  read the live docs). Committed to main; pushed via the SSH wrapper
  (remote == local HEAD verified by the wrapper's post-push check).
