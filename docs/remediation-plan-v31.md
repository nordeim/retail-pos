# VeloxPOS — Remediation Plan v31 (Session V30→v31, 2026-10-29)

> Scope: **the dialog-open a11y coverage audit** (the neo-crm session-199
> doctrine adopted). The V31 audit (16th cycle) found the reference
> UNCHANGED for the 16th consecutive cycle (KPIs, the 390×844 viewport
> lock, no hamburger), the baseline gates green exactly as V30 closed
> them (580/580 unit · 207/207 e2e after the fresh-clone rebuild:
> install, .env, db:push, db:seed, chromium-1243, then the full ladder),
> the mobile drawer spine re-measured live at 390×844 EXACTLY matching
> the frozen v25 ledger (16th consecutive confirmation of the absent
> Tailwind v4 mobile-menu trap; Esc + aria reset verified live), the
> repo-wide citation sweep clean, the V27 title-guard probe re-run 90/90
> clean (30 natural + 60 fast-auth; min margins 5ms/7ms — the race
> shape live, the guard correcting every iteration), `bun audit` at the
> documented posture (1 high — the deepmerge-ts dev-toolchain decline;
> the zod floor verified standing: one hoisted `zod@4.6.7`, manifest
> `^4.6.7` + override `^4.6.6`), and neo-crm ADVANCED by one commit
> (`56deef8` → `013232a`): **session-199 — THE A11Y REGISTER'S
> DIALOG-OPEN COVERAGE AUDIT** — new doctrine, read in full.
>
> The doctrine, mapped to this repo: **a Radix Dialog's content is
> ABSENT from the DOM while closed, so every dialog-open state deserves
> its own registration in the a11y register** (the F-172c criterion —
> the closed-surface scans never see dialog interiors). Retail-pos's
> register held ZERO dialog-open registrations. The first live census
> (14 dialog-open states probed with the smoke's own axe config) found
> **5 critical `button-name` violations** — the s199 round mapped here
> caught LIVE DEFECTS, not just a coverage gap.

## 0. Verification ledger (all live unless noted; clone :3000 dev / :3100 e2e vs reference)

- Baseline gates (fresh clone at `f2f2dd7`): lint 0 · tsc 0 · build ✓ ·
  **580/580 unit (43 files)** · **207/207 e2e (3.7m, zero flakes)** —
  exactly the V30 close. (One environment rebuild note: the fresh
  workspace needed `bunx playwright install chromium` — the v1243
  browser cache was wiped with the reset; the suite is green after.)
- **The dialog-open a11y census (the s199 duty, run for the FIRST time
  in this repo)** — a temporary probe spec (since deleted; its paths
  reborn as the registrations) drove all 14 dialog-open states with the
  smoke's exact axe config (`wcag2a/2aa/21a/21aa`, color-contrast
  disabled, critical/serious filter):
  - **product dialog (create/edit)**: `button-name` (critical) ×2 —
    `product-category-select` + `product-unit-select`
  - **shift-open dialog (Abrir Turno)**: `button-name` (critical) ×1 —
    `shift-cashier-select`
  - **the Ajustes view itself (closed surface, never registered)**:
    `button-name` (critical) ×2 — `settings-currency` (Moneda) +
    `settings-card-provider` (Proveedor)
  - CLEAN: product delete-confirm · caja-create · caja delete-confirm
    · cashier-create · cashier delete-confirm · ticket modal · the
    four Mi Cuenta dialogs · payment · shift-close — and all 7 OTHER
    authed views' closed surfaces (Terminal, Dashboard, Inventario,
    Ventas, Cajas, Cajeros, Reportes).
- **The root cause (all five, one shape)**: an unassociated `<Label>`
  above a Radix `SelectTrigger` — the trigger renders a `<button>` with
  NO accessible name (the label has no `htmlFor`, and a bare label is
  inert for accname without association). The five sites:
  `inventory-view.tsx` (Categoría, Unidad), `registers-view.tsx`
  (Cajero/a), `settings-view.tsx` (Moneda, Proveedor).
- **The cure idiom, pre-verified live**: one exploratory association
  (`<Label htmlFor="product-category">` + `id="product-category"` on
  the trigger) on the dev server, then an injected axe-core 4.10.2 run
  scoped to `button-name` on the open dialog → the fixed node dropped
  from the violation list (only the unfixed sibling stayed RED); the
  DOM-level check (`element.labels` carries "Categoría") confirmed the
  association. The edit was then REVERTED to the standing tree for the
  born-RED discipline (B2 before B3).
- Reference (16th cycle, agent-browser login): dashboard $0.00 / 0 /
  12 / 0 KPIs, 390×844 viewport-locked (scrollHeight 844 =
  innerHeight, scrollTop 0), no hamburger, the 220px sidebar squeeze —
  UNCHANGED.
- Clone drawer spine (live, 390×844): panel [0,0,288,844] · header
  [0,0,287,69] · nav [0,69,287,727] · footer [0,796,287,48] · close
  [235,16,36,36] · 8 links at [12,y,263,40] y=81+44k — EXACTLY the
  frozen v25 pin; Esc closes, aria resets.
- Citation sweep: all `@/` imports cited by unit tests + all `src/…`
  paths cited by e2e resolve.
- Probe-v27 re-run: 90/90 clean (30 natural + 60 fast-auth; min
  margins 5ms/7ms).
- `bun audit`: 1 high — the documented deepmerge-ts decline (the PAD
  §6 ledger row; re-triage clause standing). No drift from V30.
- neo-crm: `013232a` (session-199) read in full — the dialog-open
  coverage audit is the round material; D-199a1 (the register's
  dialog-open coverage + the visible-dialog open-wait guard + the
  register census pin; mutation-proven on the rendered-tree axis) and
  D-199a2 (the spec's own stale count claim re-anchored to the NAME
  form) are the adoptable cures; the declined list (same-component
  edit-mode registrations, popover/menu-open registrations, registry
  majors) informs our scope.

## 1. Findings

### F1 — five unlabeled SelectTriggers: critical `button-name` violations on three surfaces (LIVE, first-run catch)

Every Radix `SelectTrigger` in the app renders a `<button>`; five of
them carry NO accessible name because their preceding `<Label>` is
unassociated (no `htmlFor` → inert for the accname computation). The
axe census flagged them critical on the product dialog (×2), the
shift-open dialog (×1), and the Ajustes view (×2). The screen-reader
user navigating the product dialog hears "button, button" where the
sighted user sees "Categoría" and "Unidad" — the WCAG 4.1.2 failure
(Strictly — axe's `button-name` is the 4.1.2 rule face).

**The cure (F1a)**: connect each existing label to its trigger —
`<Label htmlFor="X">` + `<SelectTrigger id="X">` (a `<button>` IS a
labelable element; the association is accname-legal and was proven
live against axe). Visual parity: ZERO delta — attributes only, no
pixels, no layout. Interaction superset (disclosed): clicking the
label now focuses/opens the select, the same behavior the form
`<Input>` labels already have.

### F2 — the a11y register holds ZERO dialog-open registrations (the s199 coverage gap)

The register (V24's doctrine, V29's completion) covers the public
surfaces + the authed shell/dashboard + the mobile drawer — but NO
dialog-open state. The app ships 14 of them (product create/edit,
product delete-confirm, caja create/edit, caja delete-confirm,
shift-open, shift-close, cashier create/edit, cashier delete-confirm,
payment, ticket modal, and the four Mi Cuenta dialogs). A Radix
Dialog's content is ABSENT from the DOM while closed — every
closed-surface scan runs on a page where the dialogs do not exist.
A dialog-interior regression (F1 is the live proof: the product
dialog has shipped with two critical violations through 30 cycles
while every gate was green) keeps every standing gate green.

**The cure (F2a)**: the register EXTENDS (never weakens) with the
dialog-open registrations — the s199 "open → scan → Escape" form,
baked into a shared helper that (1) waits for the dialog to be
VISIBLE before scanning (the L-164c2 vacuous-green cure — scanning a
closed surface passes vacuously), (2) runs the smoke's exact axe
config, (3) closes via Escape and asserts hidden (the Radix close
contract). Plus the Ajustes view's own closed-surface registration
(the defect-bearing surface). Plus the unit-side census: a new
`tests/a11y-register-census.test.ts` pinning the registration
inventory by NAME (the D-197a2/D-199a2 lesson — a count-anchored
claim goes stale the day a registration joins; the name form never
does), the helper's visible-wait contract, and the five label
associations.

### S — the state-gated pair (payment + shift-close): the registration shape needs a mutation-safe cycle

The payment dialog requires an OPEN shift + a ticket line; the
shift-close dialog requires an open shift. The registration test
opens a real shift on the first register (cashier + float 500),
scans the payment dialog (Escape — no sale, no stock change), scans
the shift-close dialog (Escape — no close), then closes the shift
for real with a counted 500 (no discrepancy → clean close; state
restored to "no open shift"; +1 closed shift row in history — the
later specs' assertions are containment-based, verified tolerant).
The probe already proved this exact cycle green end-to-end.

## 2. Design decisions (resolved)

1. **The cure idiom is the label association, not aria-label.** The
   house grammar renders visible `<Label>` elements; connecting them
   (htmlFor + id) keeps ONE label source (the visible one) and adds
   zero markup. aria-label would fork the name from the visible label
   (a drift risk the association form does not have). Empirically
   proven against axe 4.10.2 live before adoption.
2. **The registration form is a shared helper with the L-164c2
   guard.** `scanDialogOpen(page, open, label)`: open the dialog →
   `expect(dialog).toBeVisible()` (the vacuous-green cure — a scan on
   a closed surface passes trivially) → the smoke's exact axe config
   → Escape → `toBeHidden()` (the close contract asserted, not
   assumed).
3. **Twelve registrations, the census minus same-component
   duplicates** (the neo-crm adjudication: a create registration
   scans the same DOM the edit dialog renders — the shared component;
   edit-mode registrations declined): product-create ·
   product-delete-confirm · caja-create · caja-delete-confirm ·
   shift-open · cashier-create · cashier-delete-confirm ·
   ticket-modal · the Mi Cuenta family (ONE test scanning the four
   dialogs sequentially — the "404 at desktop and phone widths"
   multi-surface precedent) · payment (state-gated) · shift-close
   (state-gated) · the Ajustes view closed-surface scan. The popover
   family (Select dropdown PANELS) is declined — the s199 declined
   list (not the Radix Dialog genus; the panels' interior is pinned
   by the v9/v11 measured contracts).
4. **The unit census file is NEW** (`tests/a11y-register-census.test.ts`):
   the concept is "the a11y register and its covered surfaces tell
   the truth" — distinct from the dependency census (manifest truth)
   and the account-ui source pins (surface family). Seven tests: the
   helper contract pin, the inventory NAME-form pin (each
   registration title present in the spec, live-read; zero-match
   fails loudly), and the five label-association pairs
   (live-read of the three view files).
5. **Born-RED, the V28/V30 form.** The unit pins catch live defects
   (the absent registrations, the unassociated labels) — RED on the
   standing tree; the three defect-bearing e2e registrations
   (product-create, shift-open, the Ajustes view) are born-RED at the
   exact `button-name` nodes; the nine clean-dialog registrations are
   born-green coverage (the s199 form: the live catch and the
   coverage extension ship together).
6. **The count ladder**: unit 580 → 587 (+7; files 43 → 44); e2e 207
   → 219 (+12 registrations); all doc counts move in the same commit
   (the count-lockstep rule).
7. **Extend, never weaken**: the seven standing smoke tests are
   untouched; the logged-out register family stays intact.
8. **The Ajustes closed-surface registration is in scope** (the
   defect-bearing surface — its two violations need rendered teeth);
   the OTHER seven authed views' closed-surface registrations are
   DECLINED this cycle (all probed CLEAN; the register covers the
   landing view + the defect-bearing view + the drawer + every
   public surface + every dialog-open state — a future cycle can
   complete the view register if the operator wants it).

## 3. Execution batches

### B1 — the audit (DONE)

The 16th-cycle ledger in §0 — reference unchanged, spine exact,
probe clean, citations clean, audit-posture unchanged, neo-crm s199
read, the dialog-open census run live (the catch: 5 critical
button-name violations across 3 surfaces; 9 clean dialogs; 7 clean
views).

### B2 — the pins + registrations (written FIRST, born-RED verified)

1. `tests/a11y-register-census.test.ts` (7 tests): the helper
   contract (visible-wait + analyze + Escape + hidden), the
   registration inventory (12 titles, NAME form, live-read), the
   five label pairs (htmlFor + id, live-read) → all RED today.
2. `tests/e2e/a11y-smoke.spec.ts` EXTENDS with the shared
   `scanDialogOpen` helper + the 12 registrations → the three
   defect-bearing registrations RED at the exact `button-name`
   nodes; the other nine born-green.
3. The temp probe spec is deleted (its open paths reborn as the
   registrations; its evidence recorded in this plan's §0).

### B3 — the cure

1. The five label associations: `inventory-view.tsx`
   (product-category, product-unit), `registers-view.tsx`
   (shift-cashier), `settings-view.tsx` (settings-currency,
   settings-card-provider) — `<Label htmlFor="X">` + `id="X"` on the
   trigger. Zero visual delta; the disclosed interaction superset
   (label clicks now focus the select).
2. Re-run the census suite + the smoke → GREEN (all 7 unit pins +
   all 12 registrations).

### B4 — the mutation proofs + the full gates

1. Proof (a) the rendered axis: remove the `htmlFor` from the
   product-category Label (the exact defect this cycle caught) → the
   product-create registration REDs at `button-name` (the
   rendered-tree class — no source pin can see it) → restore →
   GREEN.
2. Proof (b) the register axis: delete one registration title from
   the spec → the unit inventory pin REDs at the exact title →
   restore → GREEN.
3. Full ladder: lint → typecheck → build → **587/587 unit (44
   files)** → **219/219 e2e**.
4. The v31 captures (5): desktop-product-dialog-1280 (the cycle's
   subject — the catch's most visible face), desktop-terminal-1280,
   desktop-dashboard-1280, mobile-terminal-390,
   mobile-drawer-open-390 — PNG-validated at exact dimensions.

### B5 — docs lockstep → commit + push

README (badge 587+219 + the Tested row), AGENTS (the dialog-open
register duty note + the label-association idiom), CLAUDE (the v31
contracts note, newest-first + counts), PAD **v2.18.0** (history +
**ADR-040** + §8 count rows), SKILL **v1.25.0** (the v31 close layer
+ counts + the §12 F15 lesson), worklog, this plan's §6, session_60
(EN) + session_61 (ZH, the session_58 convention). `.env.example`
verified unchanged-and-tracked (no new env vars this cycle). Commit
to main; push via the SSH wrapper (`--remote
git@github.com:nordeim/retail-pos.git` — the V30 lesson: the
wrapper's default remote is the stale task-management one).

## 4. Test plan

- `bunx vitest run tests/a11y-register-census.test.ts` — the new
  suite alone: the seven tests born-RED (before B3), then GREEN
  (after B3).
- `bunx playwright test tests/e2e/a11y-smoke.spec.ts` — the extended
  smoke: the three defect-bearing registrations born-RED at the
  exact `button-name` nodes (before B3), all nineteen green after
  (7 standing + 12 new).
- The two mutation proofs, each: RED at the exact target → restore →
  GREEN (no collateral).
- `bun run test` — 587/587 (the count ladder; re-run after every doc
  edit in B5 — the census pins read the live spec).
- `bun run lint` + `bun run typecheck` + `bun run build` + `bun run
  test:e2e` — the full ladder (the cure's inertness proof: the label
  associations change zero pixels; the full visual battery re-run
  green IS the proof).
- `bun audit` — the standing posture re-verified (1 high, the
  documented decline).
- `git status` clean of gitignored artifacts before commit.

## 5. Out of scope (disclosed)

- The seven clean authed views' closed-surface registrations
  (decision #8 — all probed CLEAN; a future cycle's register
  completion if wanted).
- The Select dropdown PANEL interiors (the s199 declined list — not
  the Dialog genus; measured-contract-pinned).
- The reference's own broken flows (nothing to mirror, 16 cycles
  standing).
- The deepmerge-ts decline (the PAD §6 re-triage clause stands).
- The registry majors + dependency upgrades (the V30 declined list
  unchanged).
- Every standing v8–v30 disclosure unchanged.

## 6. Execution results (filled on completion — 2026-10-29)

- B2: the census suite written FIRST and verified born-RED on the
  standing tree — 6 of 7 pins RED (the helper-contract pin at the
  absent `scanDialogOpen`; the five label pairs at the unassociated
  labels); the inventory NAME pin born-green WITH the registrations
  (the s199 form — its teeth are the deletion mutation, proven in B4).
  The extended smoke verified born-RED at the exact defect nodes: the
  product dialog registration RED at `button-name (critical): 2
  nodes`, the shift-open registration at `1 node`, the Ajustes view
  scan at `2 nodes`; the other nine registrations born-green; the
  seven standing tests untouched and green throughout. The temp probe
  spec deleted (its open paths reborn as the registrations).
- B3 — the cure, with TWO en-route discoveries: (1) the five label
  associations landed exactly as designed (htmlFor + id on the
  Categoría/Unidad/Cajero-a/Moneda/Proveedor triggers) and the smoke
  went 19/19 GREEN after the rebuild. (2) **The comment-stripper
  trap**: the census suite's first run showed the Moneda pin RED
  after the cure — the naive regex stripper had swallowed the
  settings-view source between the `accept="image/*"` attribute
  (line 199) and the next real comment close (line 284) as a phantom
  block comment (the Moneda label lives inside that span); node's
  readFileSync proved the raw file correct, isolating the stripper.
  The cure: the QUOTE-AWARE stripper (never strips `/*` or `//`
  inside string literals). The standing suites verified
  NON-VACUOUS under the same trap (title-guard's files carry no
  string-embedded `/*`; 0 of 34 account-ui regex pins + 0 toContain
  pins fall in any phantom span — and the trap's failure mode is
  loud-false-RED, never false-GREEN). A helper-contract regex was
  also re-scoped inside the helper declaration (an unscoped
  order-regex never matched: `analyze()` lives in `blockingViolations`
  ABOVE the helper).
- B4: both mutation proofs RED-at-the-exact-target → restored →
  GREEN. Proof (a) the planted `htmlFor` removal on the product
  Categoría label (the exact defect this cycle caught) → exactly 1
  RED at the product-dialog registration's rendered `button-name:
  1 nodes` (the rendered-tree class — no source pin sees it; the
  s199 mutation axis), zero collateral. Proof (b) the planted
  registration-title deletion ("the ticket modal opens clean" →
  REDACTED) → exactly 1 RED at the census inventory pin, the other
  six green. Full gates after the restore: **lint 0 · tsc 0 · build
  ✓ (the standing V26 boot-guard warning alone) · 587/587 unit (44
  files, 580+7) · 219/219 e2e (4.2m, zero flakes)** — the cure's
  zero-pixel-delta proven by the full visual battery re-run green.
  Five v31 captures PNG-validated at exact dimensions
  (desktop-product-dialog-1280 — the cycle's subject, the dialog
  element at its 512px max-w-lg base, 512×642; desktop-terminal-1280,
  desktop-dashboard-1280, mobile-terminal-390, mobile-drawer-open-390
  — the four state surfaces byte-stable vs the v30 set at the same
  seeded state, the label associations' inertness visible in the
  bytes). The capture script's dialog settle uses the plain 500ms
  wait (a getAnimations().finished await rejects on cancelled
  animations — the stable form for captures, noted in the script).
- B5: README (badge 587+219 + the Tested row + the register
  description extended with the dialog-open coverage), AGENTS (the
  dialog-open register duty + the label-association idiom + the
  stripper trap note), CLAUDE (the v31 contracts note, newest-first
  + counts), PAD v2.18.0 (history entry + ADR-040 + the §8 count
  rows), SKILL v1.25.0 (the v31 close layer live, the v30 layer
  demoted + five count sites + the §12 F15 lesson), this §6,
  session_60 (EN) + session_61 (ZH, the session_58 convention), the
  worklog V31 entry. `.env.example` verified unchanged and tracked
  (no new env vars this cycle). The unit suite re-ran green after
  every doc edit (the census pins read the live spec). Committed to
  main; pushed via the SSH wrapper with `--remote
  git@github.com:nordeim/retail-pos.git` (remote == local HEAD
  verified by the wrapper's post-push check).
