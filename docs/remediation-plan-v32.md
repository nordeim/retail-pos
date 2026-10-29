# VeloxPOS — Remediation Plan v32 (Session V31→v32, 2026-10-30)

> Scope: **the view-register completion** — the V31-declined "future cycle's
> register completion" (its plan §5, decision #8), taken now. The V32 audit
> (17th cycle) found the reference UNCHANGED for the 17th consecutive cycle
> (KPIs, the 390×844 viewport lock, no hamburger), the baseline gates green
> exactly as V31 closed them after the fresh-clone rebuild (install, .env,
> db:push, db:seed, chromium-1243, then the full ladder: 587/587 unit ·
> 219/219 e2e — one first-occurrence flake-watch item, §0), the mobile
> drawer spine re-measured live at 390×844 EXACTLY matching the frozen v25
> ledger (17th consecutive confirmation of the absent Tailwind v4
> mobile-menu trap; Esc + aria reset verified live), the repo-wide citation
> sweep clean, the V27 title-guard probe re-run 90/90 clean (30 natural +
> 60 fast-auth; min margins 7ms/7ms — the race shape live, the guard
> correcting every iteration), `bun audit` at the documented posture (1
> high — the deepmerge-ts dev-toolchain decline; the zod floor verified
> standing: one hoisted `zod@4.6.7`, manifest `^4.6.7` + override
> `^4.6.6`), and **neo-crm UNCHANGED at `013232a`** (session-199 — the
> same commit V31 adopted; no new doctrine to read this cycle).
>
> The round material, mapped to this repo: the a11y register's doctrine
> chain (V24 the register → V29 the public-surface completion → V31 the
> dialog-open coverage) has ONE named remainder — the authed views'
> closed-surface registrations V31 declined (its plan decision #8: "all
> probed CLEAN; a future cycle's register completion if wanted"). The
> register currently covers every public surface (login, signup,
> reset-password, the 404 — at both widths), the authed shell + Dashboard,
> the Ajustes view, the mobile drawer, and every dialog-open state — but
> SIX of the eight authed views have NO closed-surface registration:
> Terminal, Inventario, Ventas, Cajas, Cajeros, Reportes. A view-interior
> a11y regression (a new unlabeled control, a broken heading order) keeps
> every standing gate green today. This cycle completes the register: the
> coverage becomes **every public surface + every authed view + the drawer
> + every dialog-open state** — the register's own end state.

## 0. Verification ledger (all live unless noted; clone :3000 dev / :3100 e2e vs reference)

- Baseline gates (fresh clone at `98485cb`): lint 0 · tsc 0 · build ✓ ·
  **587/587 unit (44 files)** · **219/219 e2e (4.1m)** — exactly the V31
  close, on the SECOND full run. **Flake-watch (first occurrence)**: the
  first full e2e run failed exactly one spec —
  `functional-parity-v16.spec.ts` F1c ("the low-stock count computes the
  v3 amber-600 exactly", a getImageData pixel read); the isolated re-run
  passed 8/8 and the full-suite re-run passed 219/219 (zero code changes
  between). Recorded in the V18/V26 title-flake precedent's watch
  posture: first occurrence, documented, re-run green — if it recurs the
  next cycle root-causes it (the ±1-per-channel color-space rounding
  boundary under load is the standing hypothesis).
- **The view-register probe (this cycle's own live census, run before the
  plan)** — a temporary probe spec (since deleted; its paths reborn as
  the registrations) drove all six unregistered views' closed surfaces
  with the smoke's exact axe config (`wcag2a/2aa/21a/21aa`,
  color-contrast disabled, critical/serious filter):
  **all six CLEAN** (Terminal `/`, Inventario `/Inventory`, Ventas
  `/Sales`, Cajas `/Registers`, Cajeros `/Cashiers`, Reportes
  `/Reports` — heading-anchored visible-waits, the navigation spec's own
  ROUTES headings). This is the **coverage-extension form** (V31's nine
  born-green registrations), not the live-catch form: no defects exist
  to cure — the gap is the absent teeth themselves.
- The V31 cure's standing state re-verified: the five label associations
  present (product Categoría/Unidad, shift Cajero/a, Ajustes
  Moneda/Proveedor — htmlFor + id pairs confirmed in the three view
  files), and the repo-wide `<Label` sweep finds ZERO unassociated
  consumer Labels (every consumer Label carries htmlFor; the five
  SelectTriggers carry their ids).
- Reference (17th cycle, agent-browser login): dashboard $0.00 / 0 /
  12 / 0 KPIs, 390×844 viewport-locked (scrollHeight 844 = innerHeight,
  scrollTop 0), no hamburger, the 220px sidebar squeeze — UNCHANGED.
- Clone drawer spine (live, 390×844): panel [0,0,288,844] · header
  [0,0,287,69] · nav [0,69,287,727] · footer [0,796,287,48] · close
  [235,16,36,36] · 8 links at [12,y,263,40] y=81+44k · the "VeloxPOS"
  wordmark — EXACTLY the frozen v25 pin (17th consecutive); Esc closes,
  aria-expanded resets to "false", the panel leaves the DOM.
- Citation sweep: all `@/` imports cited by the 44 unit + 32 e2e files
  resolve.
- Probe-v27 re-run: 90/90 clean (30 natural + 60 fast-auth; min
  margins 7ms/7ms).
- `bun audit`: 1 high — the documented deepmerge-ts decline (the PAD
  §6 ledger row; re-triage clause standing). No drift from V31.
- neo-crm: still `013232a` (session-199) — read in full LAST cycle,
  adopted as ADR-040. No new session material this cycle (the standing
  "review neo-crm's post-s199 cadence" recommendation stays open).

## 1. Findings

### F1 — the view-register gap: six authed views carry zero closed-surface a11y teeth

The register (V24's doctrine, V29's public completion, V31's dialog-open
layer) covers the public surfaces at both widths, the authed shell +
Dashboard (`the shell + dashboard are clean…` — the register's own
landing test), the Ajustes view (V31, the defect-bearing surface), the
mobile drawer, and every dialog-open state — but Terminal, Inventario,
Ventas, Cajas, Cajeros, and Reportes have NO registration. The lazy view
registry (v17) makes the gap concrete: after `page.goto`, the view chunk
may still be loading — and a scan on a not-yet-rendered view passes
vacuously (the L-164c2 shape, here at the view layer). All six probed
CLEAN this cycle, so the exposure is latent, not live: a future
view-interior regression (an unlabeled control, a demoted heading, a
focus trap) ships silently. V31's own plan named this completion as "a
future cycle's register completion if the operator wants it" — the
operator's standing cycle instruction (the register as the coverage
truth) takes it now.

**The cure (F1a)**: six closed-surface registrations in the smoke, the
Ajustes-view idiom verbatim (`goto` → a heading-anchored visible-wait →
the smoke's exact axe config → the empty-violations assertion) — placed
after the Ajustes view test, before the state-gated pair (which stays
LAST: its cycle mutates and restores server state). The visible-wait
anchors are the navigation spec's own ROUTES headings ("No hay turno
activo", "Inventario", "Historial de Ventas", "Cajas Registradoras",
"Cajeros", "Reportes") — the same anchors 219 standing specs already
prove. The Ajustes test's stale "the other seven authed views … stay
unregistered this cycle" comment is rewritten to the V32 form (the six
join; the Dashboard rides the shell test — documented, not
double-registered).

### F2 — the census extension: the view inventory needs the NAME-form pin and its own order guard

The unit-side register census (`tests/a11y-register-census.test.ts`,
V31) pins the DIALOG-open inventory by NAME plus the scanner helper's
contract. The view layer now needs the same teeth: (1) the VIEW
inventory pin — the seven view-closed registration titles (Ajustes + the
six new) live in the spec by name (the D-197a2/D-199a2 form: a name
never goes stale when a registration joins); and (2) the per-registration
visible-wait ORDER guard — for each view title, the spec must carry a
`toBeVisible()` wait BEFORE its `blockingViolations(page)` scan
(index-scoped from the title: the first wait and the first scan after
the title must be in that order). The order guard is the view layer's
own L-164c2 pin: deleting a registration's visible-wait (the
lazy-registry vacuous-green hole) goes RED at the exact registration.
The Dashboard's closed surface rides the shell test (its `toHaveText`
h1 guard predates the doctrine) — documented in the census comment, not
double-pinned.

## 2. Design decisions (resolved)

1. **The registrations are explicit literal-titled tests, not a loop.**
   The census pins titles BY NAME (`toContain(title)`) — a
   loop-generated title (`test(`the ${label} view…`)`) never exists as a
   literal in the source and the NAME pin would silently fail to match.
   The V31 idiom (self-contained tests, literal titles) is kept; the
   cost is six small bodies, the gain is census-grade teeth.
2. **Heading anchors, not new testids.** The navigation spec's ROUTES
   headings are the canonical per-view wait anchors (219 specs already
   prove them; each view renders its own PageHeading, so the heading's
   visibility IS the view's mount proof). No source change rides this
   cycle — the coverage layer is tests-only (the zero-pixel-delta form
   by construction).
3. **The Ajustes title joins VIEW_REGISTRATIONS (7 titles), and stays
   in DIALOG_REGISTRATIONS.** The V31 census counted the Ajustes scan
   among its 12 registrations; the overlapping membership is harmless
   (both arrays pin the same literal title — a deletion REDs both), and
   rewriting V31's array would be a weaken-to-refactor the house rules
   forbid. Extend, never rewrite.
4. **Born-RED at the census, born-green at the registrations (the s199
   hybrid minus the live catch).** The two new unit pins are RED on the
   standing tree (the six titles absent — the defect IS the absent
   coverage); the six e2e registrations are born-green (all probed
   CLEAN — the disclosed coverage-extension form). No src/ file changes
   this cycle.
5. **The count ladder**: unit 587 → 589 (+2 census tests; 44 files
   held); e2e 219 → 225 (+6 view registrations); all doc counts move in
   the same commit (the count-lockstep rule).
6. **Extend, never weaken**: the nineteen standing smoke tests are
   untouched (one comment rewritten to the true state); the census's
   seven standing tests are untouched; the probe spec is deleted (its
   paths reborn as the registrations).
7. **Desktop-width scans for the authed views** (the authed-register
   idiom — the shell, Ajustes, and the drawer tests set the form; the
   public surfaces keep their both-widths duty). Phone-width variants of
   six authed views would double the scan time for no doctrine gain —
   declined, disclosed.
8. **The mutation proofs take both axes** (the V31 form): (a) the
   rendered tree — strip the `aria-label` from the cashiers edit action
   (`Editar ${cashier.name}`, cashiers-view.tsx) → the Cajeros view
   registration REDs at `button-name` (the exact rendered-axis class no
   source pin can see) → restore → GREEN; (b) the register — delete one
   view registration title from the spec → the census view-inventory
   pin REDs at the exact title → restore → GREEN.

## 3. Execution batches

### B1 — the audit (DONE)

The 17th-cycle ledger in §0 — reference unchanged, spine exact,
probe clean, citations clean, audit-posture unchanged, neo-crm
unchanged, the six-view live census run clean (the probe), the V31 cure
re-verified standing (five associations + the label sweep).

### B2 — the pins + registrations (written FIRST, born-RED verified)

1. `tests/a11y-register-census.test.ts` EXTENDS with the
   `VIEW_REGISTRATIONS` array (7 titles) + two tests: the view
   inventory (NAME form, live-read) and the per-registration
   visible-wait ORDER guard (index-scoped: title → first
   `toBeVisible()` → first `blockingViolations(page)`, in that order)
   → both RED today (the six titles absent).
2. `tests/e2e/a11y-smoke.spec.ts` EXTENDS with the six view
   registrations (after the Ajustes view test, before the state-gated
   pair) + the Ajustes test's stale comment rewritten → born-green
   (probed CLEAN this cycle).
3. The temp probe spec (`tests/e2e/v32-view-register-probe.spec.ts`)
   is deleted (its open paths reborn as the registrations; its evidence
   recorded in this plan's §0).

### B3 — the green run

The census suite + the smoke → GREEN (589/589 unit, all 25 smoke tests
green). No src change exists to verify beyond the gates themselves (the
registrations ARE the cure; the standing 219 tests prove the
zero-source-delta by construction).

### B4 — the mutation proofs + the full gates

1. Proof (a) the rendered axis: remove the cashiers edit action's
   `aria-label` → rebuild → the Cajeros view registration REDs at
   `button-name (critical)` → restore → GREEN.
2. Proof (b) the register axis: delete the "the Reportes view is clean
   of critical/serious violations" title from the spec → the census
   view-inventory pin REDs at the exact title → restore → GREEN.
3. Full ladder: lint → typecheck → build → **589/589 unit (44
   files)** → **225/225 e2e**.
4. The v32 captures (5): desktop-reports-1280 (the cycle's subject — a
   newly-registered view, the bright-H1 surface never captured before),
   desktop-terminal-1280, desktop-dashboard-1280, mobile-terminal-390,
   mobile-drawer-open-390 — PNG-validated at exact dimensions.

### B5 — docs lockstep → commit + push

README (badge 589+225 + the Tested row + the register description
extended to every authed view), AGENTS (the view-register completion
note in the test-suite rules), CLAUDE (the v32 contracts note,
newest-first + counts), PAD **v2.19.0** (history entry + **ADR-041** +
the §8 count rows), SKILL **v1.26.0** (the v32 close layer + the five
count sites), worklog, this plan's §6, session_63 (EN working log) +
session_64 (ZH summary, the session_58/61 convention). `.env.example`
verified unchanged-and-tracked (no new env vars this cycle). Commit to
main; push via the SSH wrapper (`--remote
git@github.com:nordeim/retail-pos.git` — the V30 lesson: the wrapper's
default remote is the stale task-management one). Post-push: the
session-log commit (session_65, the session_59/62 convention).

## 4. Test plan

- `bunx vitest run tests/a11y-register-census.test.ts` — the extended
  suite: the two new tests born-RED (before B2.2), then 9/9 GREEN
  (after B2.2).
- `bunx playwright test tests/e2e/a11y-smoke.spec.ts` — the extended
  smoke: all 25 tests green (19 standing + 6 new, born-green).
- The two mutation proofs, each: RED at the exact target → restore →
  GREEN (no collateral).
- `bun run test` — 589/589 (the count ladder; re-run after every doc
  edit in B5 — the census pins read the live spec).
- `bun run lint` + `bun run typecheck` + `bun run build` + `bun run
  test:e2e` — the full ladder (225/225; the flake-watch item from §0
  watched, not suppressed).
- `bun audit` — the standing posture re-verified (1 high, the
  documented decline).
- `git status` clean of gitignored artifacts before commit.

## 5. Out of scope (disclosed)

- Phone-width variants of the six authed view scans (decision #7 — the
  authed-register idiom is desktop-form; the public surfaces keep the
  both-widths duty; the drawer covers mobile chrome).
- A DEDICATED Dashboard closed-surface registration (it rides the shell
  test — "the shell + dashboard are clean…" — the register's landing
  test since its inception; documented in the census comment, not
  double-registered).
- The Select dropdown PANEL interiors (the s199 declined list — not
  the Dialog genus; measured-contract-pinned).
- The reference's own broken flows (nothing to mirror, 17 cycles
  standing).
- The deepmerge-ts decline (the PAD §6 re-triage clause stands).
- The registry majors + dependency upgrades + the Prisma 6→7 rotation
  (the V30/V31 declined lists unchanged — the rotation would also
  re-triage deepmerge-ts; a future cycle's call).
- Every standing v8–v31 disclosure unchanged.

## 6. Execution results (filled on completion — 2026-10-30)

- B2: the census extension written FIRST and verified born-RED on the
  standing tree — both new tests RED at the exact missing-title
  assertion ("the Terminal view is clean of critical/serious
  violations" — the first absent title), the seven standing tests green
  and untouched. The six view registrations then landed in the smoke
  (after the Ajustes test, before the state-gated pair) with literal
  titles and heading-anchored visible-waits; the Ajustes test's stale
  "the other seven authed views … stay unregistered" comment was
  rewritten to the V32 state. The temp probe spec deleted (its open
  paths reborn as the registrations). Census → 9/9 GREEN; the extended
  smoke → 25 passed (24 smoke tests + the setup project's login).
- B3: no src/ change exists — the registrations ARE the cure (the
  coverage-extension form); `git diff --stat src/` empty at the close.
- B4: both mutation proofs RED-at-the-exact-target → restored → GREEN.
  Proof (a) the planted cashiers edit-action aria-label removal
  (`Editar ${cashier.name}`) → the Cajeros view registration RED at
  exactly `button-name (critical): 1 nodes` (the rendered-tree class —
  no source pin can see it) → restored (git diff src/ clean) → GREEN.
  Proof (b) the planted Reportes registration-title deletion → both
  new census tests RED at the exact title (the order guard's first
  assertion is the title's existence — both failures name the same
  title) → restored → GREEN. One en-route lesson: the restore of (b)
  first used `git checkout` on the whole spec (reverting the six new
  registrations with it); the re-application verified the final tree
  byte-identical to the post-B2 state (census 9/9 + smoke 25/25
  re-run). Full gates after the restore: **lint 0 · tsc 0 · build ✓ ·
  589/589 unit (44 files, 587+2) · 225/225 e2e (4.3m, zero flakes —
  the §0 F1c watch item did not recur)**. Five v32 captures
  PNG-validated at exact dimensions: desktop-reports-1280 (the cycle's
  subject — the bright-H1 surface never captured before, 70342B) +
  desktop-terminal-1280, desktop-dashboard-1280, mobile-terminal-390
  (the three BYTE-IDENTICAL to the v31 set — the zero-source-delta
  proof in the bytes) + mobile-drawer-open-390 (9 of 329,160 pixels
  differ, 0.0027%, max channel delta 7 — capture-time font
  rasterization noise; the v30→v31 precedent's own 2-byte shape; the
  spine geometry measured EXACT this cycle).
- B5: README (badge 589+225 + the Tested row + the register description
  extended to every authed view), AGENTS (the view-register completion
  note in the test-suite rules), CLAUDE (the v32 contracts note,
  newest-first + the command counts), PAD v2.19.0 (history entry +
  ADR-041 + the §8 count rows), SKILL v1.26.0 (the v32 close layer
  live, the v31 layer demoted at its ship counts 587/219 + the five
  count sites), this §6, session_63 (EN working log) + session_64 (ZH
  summary, the session_58/61 convention), the worklog V32 entry.
  `.env.example` verified unchanged and tracked (no new env vars this
  cycle). The unit suite re-ran green after the doc edits (the census
  pins read the live spec). Committed to main; pushed via the SSH
  wrapper with `--remote git@github.com:nordeim/retail-pos.git`
  (remote == local HEAD verified by the wrapper's post-push check).
