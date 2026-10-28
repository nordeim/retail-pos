# Session 54 (V29) — raw work transcript

The workspace had been RESET (no retail-pos clone under /home/z/my-project
— the 4th recorded reset). Per the standing instructions I cloned fresh —
and the log revealed the prior session HAD closed and pushed V28 after
all: `67feee5` (the shipped-artifacts truth pass) + the owner's own
`1469ff7` (docs/session_53.md, the V28 raw transcript). So this session
is the **V29 cycle, the 14th audit**.

## Environment + baseline

`.env` from `.env.example` (DATABASE_URL="file:../db/custom.db"), bun
install (484 packages — the V28 census shape), db:push + db:seed (12
products / 6 categories / 2 registers / 2 sales / 2 shifts — the
reference mirror), chromium-1243 installed (the cache held only
chromium-1200). **Baseline gates all green first-try: lint 0 · tsc 0 ·
build ✓ · 577/577 unit (43 files) · 203/203 e2e (3.5m, zero flakes)** —
exactly the V28 close.

## The docs intake

Read in full: AGENTS.md (the operating contracts), CLAUDE.md, README.md,
the PAD's header/history/ADR-037/Known-Issues (zero live watch items),
retail-pos_SKILL.md (v1.22.0 close layer + F12), worklog's V28 entry,
remediation-plan-v28, session_52 (the Chinese V28 log), session_53 (the
owner-committed V28 transcript). The count lockstep held everywhere
(577+203).

## The audit (14th cycle)

- **neo-crm ADVANCED by two commits** — `769ba13` → `a482f72` +
  `ba30355`: **session-197, THE SWEEP-STATE COVERAGE AUDIT** — the
  first genuinely new doctrine in several cycles, read in full (the
  commit message, the 246-line plan, session_416/417). The doctrine:
  a decoded, behavior-pinned surface can still have ZERO gate teeth on
  its designed content — neo-crm's 404 had faces decoded + status +
  a11y pinned, yet "NO gate held its PIXELS — a future
  NOT_FOUND_LAYOUT regression would keep every gate green." The cure
  there: the sweep registration + baselines, born-green,
  mutation-proven ×2; plus D-197a2 (the count-proof NAME form —
  neo-crm's "the ten pages" comments survived three page additions).
- **The reference UNCHANGED for the 14th consecutive cycle**
  (agent-browser login): dashboard $0.00 / 0 / 12 / 0, flat chart,
  5-row donut legend, 12 inventory rows, 390×844 viewport-locked
  (scrollHeight 844 = innerHeight), no hamburger.
- **The clone drawer spine re-measured live at 390×844**: panel
  [0,0,288,844] · nav [0,69,287,727] · close [235,16,36,36] · 8 links
  at [12,y,263,40] y=81+44k — EXACTLY the frozen v25 ledger, **14th
  confirmation, no Tailwind v4 trap**; Esc closes + aria resets +
  focus returns to the hamburger (all verified live).
- The clone desktop spot-check: /Ventas renders "Ventas | VeloxPOS"
  (the V27 guard's face), H1 "Historial de Ventas", 2 seeded rows.
- Citation sweep 19/19 clean (trailing-period regex artifacts stripped
  — the known V28 lesson); the V27 title-guard probe re-run **12/12
  clean** (margins 12ms/13ms — the race shape live, the guard
  correcting every iteration).
- **The s197 methodology applied here — the coverage inventory
  (renderable routes vs gate inventories) found the mapping of the
  doctrine**:
  - **F1 — the 404 content family has ZERO gate teeth**: pinned today
    are the TRUE-404 status (V24), the card's visibility + ONE
    getByText + the CTA click (navigation), the slug title (v7/V27),
    and the axe registration (V24) — but the h1's ROLE+LEVEL
    (getByText passes on a demoted div), the exact body copy, the
    "404" badge + its 80×80 box, the CTA's accessible name, and the
    card's max-w-md 448px are pinned NOWHERE. Measured live on both
    apps first (the reference's own 404 carries the identical content
    family — the two-app surface).
  - **F2 — the a11y register is incomplete**: the AGENTS V24 doctrine
    says "every public surface belongs in the a11y smoke's register,"
    but /signup and /reset-password (both public — the SD-20 superset
    posture) never joined login + the 404. Verified by grep: the only
    AxeBuilder scans live in the smoke, and the smoke never visits
    them (the v12 "axe" hit was a false positive on "leading-relaxed").
  - **S — the count-anchored "six" live-doc descriptions** (the
    D-197a2 shape): the block 10 comment + the AGENTS repo-hygiene
    live description — the LIVE_DOCS array is the source of truth, a
    count-anchored description goes stale the day a doc joins.

## The plan + the execution (TDD)

remediation-plan-v29.md written with the full verification ledger, the
three findings, six design decisions (e2e layer not unit source pins;
born-green + mutation proof, the V25/s197 form — the surfaces are
CORRECT; one new spec file; the smoke extended in place; NO sweep tool
ported — that would be speculative scaffolding against this repo's
computed-style pin architecture; the count ladder e2e-only 203→207).

- **B2 the pins, born-green**: `tests/e2e/not-found-surface.spec.ts`
  (T1 the content family: h1 by role+level+exact name, the exact copy,
  the badge text, the CTA accessible name; T2 the geometry: card 448px,
  badge 80×80) — **2/2 green**; the a11y smoke extended with the signup
  + reset-password registrations (the no-token "Invalid Reset Link"
  state is the session-free reset render) — **6/6 green** (4+2). Lint
  0 · tsc 0 held.
- **B4 the mutation proofs, each RED at the exact target then
  restored**:
  - (a) the planted h1→div demotion (the s197 text-8xl proof's shape):
    RED at `getByRole('heading', …)` — "element(s) not found" — with
    T2 green, zero collateral.
  - (b) the planted copy drift: RED at the exact-string getByText (the
    h1 step passed first — proof (a)'s restore implicitly verified).
  - (c) the register's teeth — the instructive one: stripping
    `htmlFor` alone stayed GREEN. Diagnosed against a minimal static
    page: **axe-core's `label` rule ACCEPTS a placeholder as a label**
    (the non-empty-placeholder check — the bare input flags, the
    placeholder input does not). The honest proof strips BOTH the
    htmlFor and the Email field's placeholder: **RED with
    `label:critical`** at the exact signup registration, six other
    smoke tests green. The lesson recorded in AGENTS/CLAUDE/SKILL F13.
- The full gate ladder after the restore: **lint 0 · tsc 0 · build ✓ ·
  577/577 unit (43 files, held) · 207/207 e2e (3.7m, zero flakes)** —
  the count ladder exactly as designed.
- The v29 evidence set: five captures PNG-validated at exact
  dimensions (byte-16 IHDR reads) — desktop-ventas-1280,
  desktop-dashboard-1280, **desktop-404-1280 (the cycle's own
  subject)**, mobile-terminal-390, mobile-drawer-open-390.

## The docs lockstep

README (badge + Tested row 577+207); AGENTS (the gate-coverage
doctrine's V29/ADR-038 completion + the axe placeholder probe lesson +
the LIVE-DOC name form); CLAUDE (the v29 contracts note, newest-first
+ counts); PAD **v2.16.0** (the history entry + **ADR-038** + the §8
e2e row 207 + the seam list's not-found-surface row + the name form);
SKILL **v1.23.0** (the v29 close layer live, the v28 layer demoted +
the three count sites + the **§12 F13 lesson**); session_54 + this
log's Chinese sibling session_55; the worklog V29 entry; the plan's §6
filled with the verified results. The unit suite re-ran green after
every doc edit (the census + doc pins read the live docs).

Committed to main and pushed via the SSH wrapper
(docs/ssh_git_wrapper_v3.py per the wrapper SKILL) — remote verified
== local HEAD.

## What this cycle delivered

**The public-surface coverage audit (ADR-038, the neo-crm session-197
doctrine adopted)**: the 404's designed content family is now frozen
by gate teeth (role+level h1, exact copy, badge + geometry, CTA name,
card geometry — mutation-proven ×2), the a11y register now REALLY
holds every public surface (signup + reset-password registered), and
the LIVE_DOCS descriptions carry the count-proof NAME form. The axe
placeholder-label discovery is the cycle's own probe lesson. The
reference stands unchanged for the 14th cycle; the drawer spine
matches the frozen ledger for the 14th time (no Tailwind v4 bug); the
gates: 577 unit + 207 e2e, zero flakes.

**Suggested next**: a future cycle could re-check neo-crm's newest
sessions (the s197 cadence is live again), re-run the standing
instruments (citation sweep, probe, census), or explore a new superset
surface — your call.
