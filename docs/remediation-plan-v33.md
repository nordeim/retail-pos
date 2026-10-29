# VeloxPOS — Remediation Plan v33 (Session V32→v33, 2026-10-30)

> Scope: **the width-scope completion + the live scrollable-region catch** —
> the neo-crm session-200 doctrine adopted (the a11y register's page-surface
> coverage audit + its width-scope census), mapped to this repo's register
> state. The V33 audit (18th cycle) found the reference UNCHANGED for the
> 18th consecutive cycle (KPIs, the 390×844 viewport lock, no hamburger),
> the baseline gates green exactly as V32 closed them (**589/589 unit ·
> 225/225 e2e · ZERO flakes — the V32 F1c pixel-read watch item did NOT
> recur**, the first-occurrence watch posture stands), the mobile drawer
> spine re-measured live at 390×844 EXACTLY matching the frozen v25 ledger
> (18th consecutive confirmation of the absent Tailwind v4 mobile-menu
> trap; Esc + aria reset verified live), the repo-wide citation sweep clean,
> the V27 title-guard probe re-run 90/90 clean (min margins 10ms/8ms),
> `bun audit` at the documented posture (1 high — the deepmerge-ts
> dev-toolchain decline; the zod floor standing), the V31/V32 cures
> re-verified standing (the five label associations + the six view
> registrations), and **neo-crm ADVANCED: `013232a` → `45ae4f6`
> (session-200 — THE A11Y REGISTER'S PAGE-SURFACE COVERAGE AUDIT)** — the
> first neo-crm movement in three cycles, read in full and adopted as this
> round's doctrine.
>
> The round material, mapped to this repo: neo-crm's s200 closed the
> register's PAGE family (three un-registered surfaces at both widths) and
> DECLARED the width-scope arm (the phone-width dialog family) its standing
> next-round candidate. This repo's register (V24 → V29 → V31 → V32) holds
> every public surface, every authed view, the drawer, and every
> dialog-open state — **but the WIDTH census exposes the arm neo-crm named:
> the authed views are registered DESKTOP-only (1280×800), the public
> login/signup/reset surfaces are registered desktop-only (the 404 is the
> one both-widths public registration), and the reset-password FORM state
> (the `?token=` face — the richer form, per the s200 shape-probe idiom)
> has never been axe-scanned at any width.** The live probe drove all
> twelve candidate surfaces with the smoke's exact axe config: eleven
> CLEAN, **one LIVE CATCH** — and the catch is a real WCAG defect the
> desktop-only register could never see.

## 0. Verification ledger (all live unless noted; clone :3000 dev / :3100 e2e vs reference)

- Baseline gates (fresh clone at `54af646`): lint 0 · tsc 0 · build ✓ ·
  **589/589 unit (44 files)** · **225/225 e2e (4.2m, zero flakes)** —
  exactly the V32 close. The V32 §0 F1c flake-watch item (the amber-600
  pixel read) did NOT recur: the first-occurrence posture stands (the
  V18/V26 title-flake form — documented, watched, root-cause only on
  recurrence).
- **neo-crm ADVANCED** (the rotation trigger): `013232a` → **`45ae4f6`**
  (session-200 — "THE A11Y REGISTER'S PAGE-SURFACE COVERAGE AUDIT").
  Read in full (the plan + the session-422 log + the commit). The
  doctrine: (1) D-200a1 — the register's page-surface coverage: every
  renderable page surface carries a two-gate registration at BOTH widths
  (their three un-registered surfaces: /about + /contact + /reset-password
  — the form state via the shape-probe token, the richer face); (2)
  D-200a2 — the spec's own stale count-anchored claim re-anchored to the
  count-proof NAME form + the negative pin pair; (3) the WIDTH-SCOPE
  CENSUS (LEG-5d): the register enumerated BY WIDTH — their dialog-open
  family is desktop-only, so the 11 phone-width dialog states became the
  STANDING NEXT-ROUND CANDIDATE (born-green pre-verified, banked). The
  live catch on their round: the reference's own marketing pages carry
  two nameless icon-only buttons (its defect, ours names them — never
  mirrored). This cycle maps the doctrine to this repo's register.
- **The width-scope probe (this cycle's own live census, run BEFORE the
  plan — the neo-crm born-green pre-verification discipline, which here
  found a live defect instead)** — a temporary probe spec (since deleted;
  its open paths reborn as the registrations) drove twelve surfaces with
  the smoke's exact axe config (`wcag2a/2aa/21a/21aa`, color-contrast
  disabled, critical/serious filter):
  - The eight authed surfaces at 390×844 (/Dashboard, `/`, /Inventory,
    /Sales, /Registers, /Cashiers, /Reports, /StoreSettings):
    **eleven of twelve probes CLEAN —
    phone /Cashiers FAILED** — `scrollable-region-focusable (serious):
    1 nodes` (the full node detail via the second probe pass):
    target `.vx-card.overflow-hidden:nth-child(4) >
    .overflow-x-auto.vx-scroll` — the recent-shifts table wrapper
    (`cashiers-view.tsx:152`, the `min-w-[720px]` dense shifts table):
    at 390px the table overflows its wrapper (the scrollable region
    exists), and the table is PURE TEXT — no focusable content, no
    `tabindex` — so keyboard users cannot scroll the region (WCAG 2.1.1;
    the axe fix: "Element should be focusable" OR "should have focusable
    content"). **Why the desktop-only register never saw it**: at 1280
    the table FITS (no scroll region — the rule never fires); the
    cashiers CRUD table at line 83 (also overflowing at 390) passes
    because its rows carry edit/delete BUTTONS (focusable content); the
    Inventario + Ventas tables pass for the same reason.
  - The public surfaces: phone /login CLEAN · phone /signup CLEAN · the
    reset-password FORM state (`?token=e2e-shape-probe`, the s200
    shape-probe idiom — any non-empty token renders the form; validity
    is submit-checked only) CLEAN at BOTH desktop and phone widths.
- **The cure pre-verified live** (the hypothesis test, before the plan's
  execution): `tabIndex={0}` + `role="region"` +
  `aria-label="Tabla de turnos recientes"` on the caught wrapper →
  rebuild → re-probe: **the violation GONE** (the keyboard focus stop +
  the named region — the WCAG-standard pattern for scrollable table
  wrappers). Reverted to the standing tree after the verification (the
  born-RED discipline: the cure re-lands inside the TDD order below).
- Reference (18th cycle, agent-browser login): dashboard $0.00 / 0 / 12 /
  0 KPIs, 390×844 viewport-locked (scrollWidth 390, scrollHeight 844 =
  innerHeight, scrollTop 0), no hamburger, the 220px sidebar squeeze —
  UNCHANGED. The reference's own pages remain viewport-LOCKED (no scroll
  containers at any width — its tables never scroll; the clone's flowing
  layout is the disclosed superset, so the caught defect is clone
  territory: the superset's own keyboard duty).
- Clone drawer spine (live, 390×844): panel [0,0,288,844] · header
  [0,0,287,69] · nav [0,69,287,727] · footer [0,796,287,48] · close
  [235,16,36,36] · 8 links at [12,y,263,40] y=81+44k · the "VeloxPOS"
  wordmark — EXACTLY the frozen v25 pin (18th consecutive); Esc closes,
  aria-expanded resets to "false", the panel leaves the DOM.
- Citation sweep: all `@/` imports cited by the 44 unit + 32 e2e files
  resolve (25 unique citations across 76 spec files, 0 unresolved).
- Probe-v27 re-run: 90/90 clean (30 natural + 60 fast-auth; min margins
  10ms/8ms).
- `bun audit`: 1 high — the documented deepmerge-ts decline (the PAD §6
  ledger row; re-triage clause standing). No drift from V32. The zod
  floor standing (one hoisted `zod@4.6.7`, manifest `^4.6.7` + override
  `^4.6.6`).
- The V31/V32 cures' standing state re-verified: the five label
  associations present (product Categoría/Unidad, shift Cajero/a,
  Ajustes Moneda/Proveedor) + the six V32 view registrations live in the
  smoke.

## 1. Findings

### F1 (LIVE, serious) — the phone-width Cajeros recent-shifts scroll region is keyboard-unreachable

The recent-shifts table wrapper (`src/components/views/cashiers-view.tsx:152`
— `div.vx-scroll.overflow-x-auto` around the `min-w-[720px]` dense shifts
table) becomes a scrollable region at phone width and carries no
`tabindex` and no focusable content (the table is read-only text): the
`scrollable-region-focusable (serious)` violation — a keyboard user who
tabs past the wrapper cannot reach the overflowed columns (WCAG 2.1.1).
The defect is invisible to every standing gate: at the desktop register
width the table fits (no scroll region → the rule never fires), and no
phone-width registration exists. The three sibling table wrappers
(inventory products, cashiers CRUD, sales history) all pass at phone
width because their rows carry action buttons (focusable content).

**The cure (F1a)**: `tabIndex={0}` + `role="region"` +
`aria-label="Tabla de turnos recientes"` on the caught wrapper — the
WCAG-standard pattern (a keyboard focus stop + a named landmark region;
pre-verified live: the violation gone). The Spanish UI copy names the
region for screen-reader users. One wrapper, one line — the surgical
form.

### F2 — the width-scope gap: the register's authed views + public family are desktop-only

The register covers every authed view (V32) and every public surface
(V29) — at desktop width only. The 404 is the one public registration
carrying the both-widths duty. The width census (the s200 LEG-5d form):
**eight authed surfaces + login + signup carry ZERO phone-width a11y
teeth**, and the reset-password FORM state (the `?token=` face — the
richer form: two htmlFor/id-wired password inputs + the submit) has
never been scanned at any width (the registered face is the no-token
"Invalid Reset Link" card). A phone-width-specific regression (an
unlabeled control in the stacked layout, a clipped focus target, a
scroll-region trap like F1) keeps every standing gate green today — F1
IS that regression class, caught live.

**The cure (F2a)**: eleven literal-titled registrations — the eight
authed phone surfaces (`the phone shell + dashboard…`, `the Terminal
view is clean at phone width`, … Ajustes), the two public phone
surfaces (`the login surface is clean at phone width`, `the signup
surface…`), and `the reset-password form state is clean at desktop and
phone widths` (the shape-probe token form state, the 404's both-widths
idiom — one test, two scans). Every registration carries its own
heading-anchored visible-wait BEFORE the axe scan (the L-164c2 guard —
the lazy view registry means the chunk may still be loading after
`goto`).

### F3 — the 404 registration's comment carries a uniqueness claim that goes stale the day F2 lands

The 404 test's V24/F2 comment justifies its both-widths registration
with "the phone layout is the one no other registration covers" — TRUE
for seventeen cycles, FALSE the moment the eleven width registrations
join. This is the D-200a2 form (a spec-comment claim going stale as the
register grows) — caught BEFORE it goes stale this time (V32's Ajustes
comment was caught one cycle late). The stale-comment sweep otherwise
found ZERO count-anchored live claims in the spec or the census (the
V31/V32 NAME-form discipline prevented the s200a2 shape).

**The cure (F3a)**: the comment re-anchored to the width-scope doctrine
form (count-free, NAME-form) + the negative pin (the retired uniqueness
claim never returns).

## 2. Design decisions (resolved)

1. **The registrations are explicit literal-titled tests, not a loop.**
   The census pins titles BY NAME (`toContain(title)`) — a loop-generated
   title never exists as a literal in the source and the NAME pin would
   silently fail to match. The V31/V32 idiom (self-contained tests,
   literal titles) is kept; the cost is eleven small bodies, the gain is
   census-grade teeth.
2. **The cure is the caught wrapper ONLY.** The three sibling table
   wrappers pass (focusable content — action buttons); preemptive
   `tabindex` on them would add tab stops with no defect to cure (the
   minimal-diff form). The IDIOM RULE joins AGENTS (the V31 label-idiom
   precedent): every NEW scrollable table wrapper that can carry no
   focusable content (read-only tables) ships `tabIndex` + `role="region"`
   + `aria-label` in the same commit.
3. **Phone-width registrations for the authed family, this cycle.** The
   V32 decline ("the authed-register idiom is desktop-form; the drawer
   covers mobile chrome") is superseded by the s200 width-scope doctrine
   — and by the LIVE CATCH: F1 is exactly the phone-width regression
   class the decline left uncovered. The drawer test stays the
   mobile-CHROME registration (the app bar + the open drawer); the
   eleven new registrations are the phone CLOSED surfaces.
4. **The reset FORM state registers at BOTH widths** (the richer face,
   the s200 choice; the no-token card is already registered and stays —
   the shared-component adjudication: the card's delta is the title +
   text + the Back link, all name-passing). The login/signup phone
   registrations complete the public family's both-widths duty (the
   404's duty since V24 — now the family's).
5. **Born-RED at three layers** (the V31 live-catch form, the strongest):
   the census pins RED on the standing tree (the eleven titles absent);
   the phone-Cashiers registration born-RED at the LIVE defect
   (`scrollable-region-focusable (serious): 1 nodes` — the registration
   proves its own teeth before the cure exists); the F3 negative pin
   born-RED (the stale claim present). Then the cure + the comment
   re-anchor → all GREEN.
6. **The count ladder**: unit 589 → 592 (+3 census tests: the width
   inventory NAME pin, the width order guard, the stale-claim negative
   pin; 44 files held); e2e 225 → 236 (+11 registrations); all doc
   counts move in the same commit (the count-lockstep rule).
7. **Extend, never weaken**: the twenty-four standing smoke tests are
   untouched (one comment rewritten — the F3 re-anchor); the census's
   nine standing tests untouched; the two probe specs deleted (their
   open paths reborn as the registrations).
8. **Desktop-width scans stay the authed family's deskop form; the
   phone family joins as its own registrations** — not viewport loops
   inside the standing tests (a loop breaks the NAME pin; a mid-test
   viewport change breaks the census order guard's index scoping).
9. **The mutation proofs take both axes** (the V31/V32 form): (a) the
   rendered axis — strip the cure (remove the `tabIndex`/`role`/
   `aria-label` from the caught wrapper) → rebuild → the phone-Cajeros
   registration REDs at exactly `scrollable-region-focusable (serious)` →
   restore → rebuild → GREEN; (b) the register axis — delete one width
   title from the spec → the census width-inventory pin REDs at the
   exact title → restore → GREEN.

## 3. Execution batches

### B1 — the audit (DONE)

The 18th-cycle ledger in §0 — reference unchanged (18th), spine exact
(18th), title-guard 90/90, audit-posture unchanged, neo-crm ADVANCED
(s200 read + adopted), the twelve-surface width probe run (eleven clean
+ the live catch), the cure pre-verified, the V31/V32 cures standing.

### B2 — the census pins FIRST (born-RED verified), then the registrations, then the cure

1. `tests/a11y-register-census.test.ts` EXTENDS with the
   `WIDTH_REGISTRATIONS` array (11 titles) + a new `v33` describe holding
   three tests: the width inventory (NAME form, live-read), the
   per-registration visible-wait ORDER guard (index-scoped: title →
   first `toBeVisible()` → first `blockingViolations(page)`), and the F3
   negative pin (the retired 404-comment uniqueness claim never returns)
   → all three RED today (the titles absent + the stale claim present).
2. `tests/e2e/a11y-smoke.spec.ts` EXTENDS: the eight authed phone
   registrations (after the Reportes view test, before the state-gated
   pair — literal titles, `setViewportSize({width:390,height:844})`
   BEFORE `goto`, heading-anchored visible-waits) + the three public
   registrations (inside the logged-out describe, after the reset card
   test) → the phone-Cajeros registration born-RED at the live defect;
   the other ten born-green (probed). The F3 comment re-anchored.
3. THE CURE: `cashiers-view.tsx:152` — `tabIndex={0}` + `role="region"`
   + `aria-label="Tabla de turnos recientes"` on the caught wrapper.
4. The two temp probe specs deleted (their open paths reborn as the
   registrations; their evidence in §0).

### B3 — the green run

The census suite (12/12) + the extended smoke (35 tests + setup) →
GREEN. `git diff --stat src/` = exactly one line changed (the cure —
the zero-pixel-delta form except the wrapper's three attributes, which
add no geometry).

### B4 — the mutation proofs + the full gates + the captures

1. Proof (a) the rendered axis: strip the cure → rebuild → the
   phone-Cajeros registration REDs at exactly
   `scrollable-region-focusable (serious): 1 nodes` → restore → rebuild
   → GREEN.
2. Proof (b) the register axis: delete the
   "the Reportes view is clean at phone width" title from the spec →
   the census width-inventory + order-guard tests RED at the exact
   title → restore → GREEN.
3. Full ladder: lint → typecheck → build → **592/592 unit (44 files)**
   → **236/236 e2e**.
4. The v33 captures (5): phone-cashiers-390 (the cycle's subject — the
   cured surface), phone-dashboard-390 (the phone landing), phone-login-
   390 (the public phone family), reset-form-1280 (the form state —
   never captured), mobile-drawer-open-390 (the standing mobile-nav
   face) — PNG-validated at exact dimensions.

### B5 — docs lockstep → commit + push

README (badge 592+236 + the register description's width completion),
AGENTS (the width-scope completion note + the scroll-wrapper idiom rule
in the test-suite rules), CLAUDE (the v33 contracts note, newest-first
+ the command counts), PAD **v2.20.0** (history entry + **ADR-042** +
the §8 count rows), SKILL **v1.27.0** (the v33 close layer + the count
sites), worklog, this plan's §6, session_67 (EN working log) +
session_68 (ZH summary, the session_64/66 convention). `.env.example`
verified unchanged-and-tracked (no new env vars this cycle). Commit to
main; push via the SSH wrapper (`--remote
git@github.com:nordeim/retail-pos.git` — the V30 lesson: the wrapper's
default remote is the stale task-management one). Post-push: the
session-log commit (session_69, the session_65 convention).

## 4. Test plan

- `bunx vitest run tests/a11y-register-census.test.ts` — the extended
  suite: the three new tests born-RED (before B2.2), then 12/12 GREEN
  (after B2.2 + B2.3).
- `bunx playwright test tests/e2e/a11y-smoke.spec.ts` — the extended
  smoke: the phone-Cajeros registration born-RED at the live defect
  (before B2.3), then all 35 tests green (after the cure).
- The two mutation proofs, each: RED at the exact target → restore →
  GREEN (no collateral).
- `bun run test` — 592/592 (the count ladder; re-run after every doc
  edit in B5 — the census pins read the live spec).
- `bun run lint` + `bun run typecheck` + `bun run build` + `bun run
  test:e2e` — the full ladder (236/236; the F1c watch item watched, not
  suppressed).
- `bun audit` — the standing posture re-verified (1 high, the
  documented decline).
- `git status` clean of gitignored artifacts before commit.

## 5. Out of scope (disclosed)

- **The phone-width DIALOG-open states (12 registrations)** — the
  width-scope arm's remaining family: the dialogs render full-bleed at
  <sm (`rounded-2xl sm:rounded-lg`, the v14 geometry — a genuinely
  different DOM at phone width), so the family deserves its own
  rotation with its own live probe; DECLINED this cycle as the STANDING
  NEXT-ROUND CANDIDATE (the neo-crm s200-declined phone-dialog family's
  exact analog).
- Phone-width variants of the state-gated pair (the payment +
  shift-close dialogs ride an open shift — the state cycle is
  desktop-form; the dialog family above owns the open-state arm).
- Preemptive `tabindex` on the three passing table wrappers (decision
  #2 — no defect, no cure; the idiom rule covers future wrappers).
- The reference's own broken flows (nothing to mirror, 18 cycles
  standing).
- The deepmerge-ts decline (the PAD §6 re-triage clause stands).
- The registry majors + dependency upgrades + the Prisma 6→7 rotation
  (the V30/V31/V32 declined lists unchanged).
- Every standing v8–v32 disclosure unchanged.

## 6. Execution results (filled on completion — 2026-10-30)

- B2: the census extension written FIRST and verified born-RED on the
  standing tree — all three new tests RED (the eleven width titles
  absent; the 404-comment uniqueness claim present), the nine standing
  tests green and untouched. En-route lesson (recorded in the census
  comment): the F3 negative pin's first draft (a bare whitespace
  collapse) was fooled by the hard wrap — the `//` comment marker
  survives BETWEEN the words ("…the phone layout is the // one no
  other…"), so the normalized text never matched the claim; the cure
  strips line-leading comment markers BEFORE collapsing whitespace (the
  D-200a2 first-draft-fooled lesson re-learned on the marker axis —
  the pin holds the CONTENT, never the wrap). The eleven registrations
  then landed (the eight authed phone tests after the Reportes view
  test; the three public tests inside the logged-out describe) with
  literal titles and heading-anchored visible-waits; the census order
  guard caught one idiom drift en route (the phone shell+dashboard test
  first used `toHaveText` — the guard demanded the `toBeVisible()`
  literal the V32 idiom carries; re-anchored to the filter+toBeVisible
  form). The phone-Cajeros registration verified born-RED at the LIVE
  DEFECT on the uncurd rebuild: exactly
  `scrollable-region-focusable (serious): 1 nodes`; the other ten
  born-green. The 404 comment re-anchored (the F3 cure). The cure then
  landed (tabIndex + role + aria-label + the idiom comment on the
  caught wrapper) → the smoke 36 passed (35 tests + setup). The two
  temp probe specs deleted.
- B3: `git diff --stat src/` = exactly one file, the cure (plus its
  comment); no other source change exists — the registrations + census
  + comment re-anchor are the coverage layer.
- B4: both mutation proofs RED-at-the-exact-target → restored → GREEN.
  Proof (a) the rendered axis: the cure strip (the three attributes
  removed) → rebuild → the phone-Cajeros registration RED at exactly
  `scrollable-region-focusable (serious): 1 nodes` → restored →
  rebuild → GREEN. Proof (b) the register axis: the phone Reportes
  registration deleted → BOTH new census tests RED at the exact title
  (`width registration missing from the a11y register: "the Reportes
  view is clean at phone width"` + the order-guard's existence
  assertion) → restored → census 12/12 GREEN. Full gates after the
  restore: **lint 0 · tsc 0 · build ✓ · 592/592 unit (44 files,
  589+3) · 236/236 e2e (4.5m, zero flakes — the V32 F1c watch item
  did not recur)**. Five v33 captures PNG-validated at exact
  dimensions: v33-phone-cashiers-390 (the cycle's subject — the cured
  surface, 41033B) + v33-phone-dashboard-390 (51641B) +
  v33-phone-login-390 (70257B) + v33-reset-form-1280 (the form state —
  never captured before, 32515B) + v33-mobile-drawer-open-390 (the
  standing mobile-nav face, 27987B), via
  `scripts/capture-v33-shots.ts` against the running dev server.
- B5: README (badge 592+236 + the Tested row + the register description
  extended to the width scope), AGENTS (the width-scope completion
  note + the scroll-wrapper idiom rule in the test-suite rules),
  CLAUDE (the v33 contracts note, newest-first + the command counts),
  PAD v2.20.0 (the history entry + ADR-042 + the §8 count rows), SKILL
  v1.27.0 (the v33 close layer live, the v32 layer demoted at its ship
  counts 589/225 + the count sites + the §8 register state), this §6,
  session_67 (EN working log) + session_68 (ZH summary, the
  session_64/66 convention), the worklog V33 entry. `.env.example`
  verified unchanged and tracked (no new env vars this cycle). The
  unit suite re-ran green after every doc edit (the census pins read
  the live spec). Committed to main; pushed via the SSH wrapper with
  `--remote git@github.com:nordeim/retail-pos.git`.
