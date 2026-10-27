# VeloxPOS — Remediation Plan v14 (Session V13→v14, 2026-10-27)

> Scope: the interaction-state family session_19 itself suggested next —
> **the dialog open/close transitions** (the V14 core), **the focus rings in
> motion**, and **the reports per-method surfaces** — plus the resolution of
> the sidebar-collapse question (measured at parity, no work). The reference
> dialog was caught MID-ENTER for the first time (60ms into its 150ms run:
> scale 0.99965 + translate + opacity 0.993 all in flight), and its full
> class family extracted. Three finding families:
> **F1 the dialog motion + geometry family** (the reference's dialog content
> carries the FULL shadcn `tailwindcss-animate` grammar —
> `slide-in-from-left-1/2` + `slide-in-from-top-[48%]` /
> `slide-out-to-left-1/2` + `slide-out-to-top-[48%]` on top of the
> clone's fade+zoom, its OVERLAY fades (`animate-in fade-in-0` /
> `animate-out fade-out-0` — the clone's overlay SNAPS), its computed
> animation runs **0.15s** (the clone's `duration-200` resolves to 0.2s
> through Tailwind 4.3.3's `--tw-duration` — the reference's older stack
> leaves the tw-animate `.15s` default), its geometry is `max-w-lg`
> (512px) + `rounded-2xl sm:rounded-lg` (16px mobile / 8px ≥sm) where the
> clone ships `max-w-md` base + per-surface `max-w-sm`/`max-w-md`
> overrides + flat `rounded-lg`),
> **F2 the focus-ring family** (the reference's platform recolors EVERY
> default outline violet — `rgba(127, 98, 244, 0.5)` measured on nav links
> AND icon buttons under real Tab sweeps; the clone's `vx-focus` chrome
> utility still draws the retired indigo halo —
> `box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.45)` — the exact ring the
> v11 cycle removed from the form controls and glass buttons, and the
> plain `Button` ships NO focus color at all),
> **F3 the reports empty-state skins** (both the "Ingresos por método de
> pago" and "Detalle por método" cards' empty state is a measured
> `h-40 flex items-center justify-center text-white/25 text-sm` box — the
> clone ships a plain left-aligned `text-slate-400` paragraph; and the
> three reports card headings carry `mb-5` where the clone's SectionCard
> wrapper pins `mb-4`).
> Baseline re-verified before audit: main @ 20b68e4 (the v13 close 214e196
> + the remote's session_20 transcript), gates green (lint 0 · tsc 0 ·
> build ✓ · unit 445/445 · e2e 158/158 — one documented sequential flake
> green on rerun), probe server live on :3101 with a seeded probe DB.

## 0. Verification ledger (all live unless noted; ref vs clone)

| # | Check | Method | Result |
|---|---|---|---|
| L1 | Baseline gates | repo | lint 0 · tsc 0 · build ✓ · unit 445/445 · e2e 158/158 — the v13 close intact (playwright chromium reinstalled on the fresh workspace; the single first-run failure was the documented sequential flake, green in isolation and on the full rerun) |
| L2 | Reference data state | DOM, ref | UNCHANGED since v13: KPIs $0.00/0/12, the Atún Dolores low-stock row, the date line — no seeded-data work |
| L3 | Reference Terminal gate | DOM, ref | STILL shift-gated ("No hay turno activo"); Cajas → Abrir Turno cashier combobox STILL EMPTY — the reference's selling flow remains a dead end (standing disclosure) |
| L4 | Ref dialog content classes | DOM, ref ('Abrir Turno') | `fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200` + the FULL motion family: open `animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%]`, closed `animate-out fade-out-0 zoom-out-95 slide-out-to-left-1/2 slide-out-to-top-[48%]`, radius `rounded-2xl sm:rounded-lg` |
| L5 | Ref dialog mid-enter | computed @60ms, ref | `animation: enter 0.15s none` with `transform: matrix3d(0.999649,…, -256, -156.956,…)` + `opacity: 0.992979` — scale, translate AND fade all in flight; the -256px tx = the -50% centering of the 512px box |
| L6 | Ref dialog settled geometry | computed + rect, ref | 512×314 (max-w-lg), radius 8px at 1280 (sm:rounded-lg), computed `enter 0.15s fill:none` — **the `duration-200` class is INERT for the animation** (it only sets transition-duration on the ref's older stack; the tw-animate default .15s runs) |
| L7 | Ref dialog overlay | DOM + computed, ref | `fixed inset-0 z-50 bg-black/80` + `data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0` — the overlay FADES (computed `enter 0.15s`) |
| L8 | Ref product modal | DOM + rect, ref (Inventario → Nuevo Producto) | SAME shared contract: 512×674, max-w-lg, the full slide family, `enter 0.15s` — the reference's dialog system is uniformly 512px |
| L9 | Ref dialog mobile geometry | rect @390, ref | FULL-BLEED: w 390, x 0 (w-full under the 512 cap), radius 16px (rounded-2xl) |
| L10 | Ref dialog X close button | DOM, ref | `absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2` — the clone's X is IDENTICAL (with `focus-visible:` — the established a11y superset). AT PARITY |
| L11 | Ref select content motion | DOM + computed, ref (the Abrir Turno cashier select) | `animate-in fade-in-0 zoom-…` family, computed `enter 0.15s`, rounded-md (6px) — the clone's select.tsx ships the same family with NO duration class → also 150ms. AT PARITY |
| L12 | Clone dialog live | computed + rect, clone (:3101) | content: `max-w-sm` 384px, radius 8px flat, computed `enter 0.2s` (duration-200 → Tailwind 4.3.3 `--tw-duration: 200ms` → tw-animate picks it up), fade+zoom ONLY (no slide family); overlay: `fixed inset-0 z-50 bg-black/80` — `animation: none 0s` (SNAPS) |
| L13 | Clone dialog mobile | rect @390, clone | 384px wide, x=3 (the max-w-sm cap, NOT full-bleed), radius 8px |
| L14 | The duration mechanism | package inspect | clone: tailwindcss 4.3.3 + tw-animate-css 1.4.0 — `--animate-in: enter var(--tw-animation-duration, var(--tw-duration, .15s))…`; the clone's `duration-200` sets `--tw-duration` → 0.2s. The reference computes 0.15s → its stack does NOT thread `--tw-duration` through. **The observable is 150ms** |
| L15 | Ref sidebar collapse | DOM + rAF sampling, ref | the bottom chevron toggle (195×32 @ x12/y756) collapses 220→`w-[68px]`; transition `0.3s cubic-bezier(0.4, 0, 0.2, 1)` (rAF-sampled 68→220 over ~17 frames); the "Mi Tienda" header span AND the link labels are REMOVED from the DOM (conditional render); the icon swaps chevron-left↔right |
| L16 | Clone sidebar collapse | same probes, clone | IDENTICAL: 220↔68px, same 300ms curve (rAF-sampled), labels conditionally removed, `rotate-180` on the same chevron (visually identical), same bottom-toggle geometry — PLUS aria-label/aria-expanded/data-testid (a11y superset). **AT PARITY — the session_19 suggestion resolves with NO work** |
| L17 | Ref sidebar at mobile | rect @390, ref | NO drawer, NO hamburger: the 68px collapsed strip persists (main squeezed to 322px); the clone's 288px drawer remains the established functional superset |
| L18 | Ref focus rings | real Tab sweeps, ref | the platform recolors EVERY default outline: nav link `rgba(127, 98, 244, 0.5) auto 2px`, icon button `… auto 1px` — the violet `auto` outline everywhere; a global `outline-color` (base44 platform artifact), alternates 1px/2px/3px across states |
| L19 | Clone focus rings | same probes, clone | nav link keyboard focus: `box-shadow: rgba(129, 140, 248, 0.45) 0 0 0 2px` — the indigo 2px halo (the exact ring v11 retired from the form controls); the plain `Button` cva base carries NO focus color (UA default outline); skip-link = the a11y superset (first Tab stop) |
| L20 | V11 focus pins | e2e source | inputs/select/textarea: the 1px `rgb(127, 98, 244)` EDGE (`focus-visible:ring-1 ring-ring`, outline-none); glass buttons: `outline: 3px solid rgba(127, 98, 244, 0.5)` — the deterministic violet family precedent (V11/F2h) |
| L21 | Ref reports empty states | DOM, ref | BOTH cards ("Ingresos por método de pago" + "Detalle por método"): `h-40 flex items-center justify-center text-white/25 text-sm` — "Sin datos en este período" centered in a 160px box |
| L22 | Ref reports card headings | DOM, ref | ALL THREE (Ventas diarias / Ingresos / Detalle): `text-sm font-bold text-white/60 uppercase tracking-wider mb-5` — the 20px header→content gap |
| L23 | Clone reports surfaces | DOM, clone (:3101) | empty states: plain `<p className="text-sm text-slate-400">` left-aligned, no height; SectionCard wrapper pins `mb-4` (16px) for all variants; the with-data table/list skins are unobservable on the ref (standing disclosure) |
| L24 | Test pins on the dialog family | repo grep | NO test pins the dialog width/motion classes; the v8 dialog skin pins (bg-[#0f121a] text-[#e7e9ef]) hold and stay; the e2e `main div.max-w-md` selectors target the LOGIN card, not dialogs; `tests/e2e/reports.spec.ts` pins the empty-state TEXT (stays true) |
| L25 | The superset dialogs | repo | the clone's 8 dialog call sites (terminal payment, inventory delete+editor, sales detail, cashiers ×2, registers ×4) have NO reference counterpart (the ref's only observable dialogs: Abrir Turno + the product modal, both 512px) — the shared-512px system is the observable contract |

## 1. Design decisions (resolved)

- **SD-53 (the dialog motion family):** the clone's `DialogContent` and
  `AlertDialogContent` adopt the reference's complete grammar, class for
  class: the content gains
  `data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]`
  and
  `data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]`
  on top of the existing fade+zoom, and the OVERLAY gains
  `data-[state=open]:animate-in data-[state=open]:fade-in-0` /
  `data-[state=closed]:animate-out data-[state=closed]:fade-out-0`
  (the overlay fades instead of snapping). `duration-200` is REMOVED from
  both components: the reference's own `duration-200` is inert on its older
  stack (its computed animation is 150ms), while the clone's Tailwind 4.3.3
  WOULD thread it to 200ms — removing it lands on the tw-animate `.15s`
  default, the measured observable (L5/L6/L14).
- **SD-54 (the dialog geometry):** the base content goes
  `max-w-md` → `max-w-lg` and `rounded-lg` → `rounded-2xl sm:rounded-lg`
  (512px at ≥sm, 8px; full-bleed w-full with 16px radius below sm — L8/L9).
  The per-surface width overrides RETIRE (the reference's dialog system is
  uniformly 512px, L8/L25; the S5 "max-w-md + rounded-lg" comment was the
  shadcn-default assumption, superseded by the live measurement): registers
  ×4, cashiers ×2, terminal ×1, sales ×1 drop `max-w-sm`/`max-w-md`; the
  inventory editor KEEPS its `max-h-[90vh] overflow-y-auto` long-form
  affordance (its `max-w-lg` becomes the base and drops as redundant). The
  dark dialog skin (the v8 pins: `border-[#262a36] bg-[#0f121a]
  text-[#e7e9ef]`) is UNCHANGED — every call site keeps its skin classes.
- **SD-55 (the focus family):** two moves replicate the reference's
  platform behavior. (a) `vx-focus` — the chrome utility used by the nav
  links, icon buttons, chips and cards — replaces the retired indigo halo
  (`box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.45)`) with the
  deterministic violet outline `outline: 3px solid rgba(127, 98, 244, 0.5)`
  on `:focus-visible` — the SAME form V11/F2h shipped for the glass
  buttons (the color is the stable measured fact; the ref's auto/1-2-3px
  alternation is a base44 platform artifact). (b) a one-line global
  `outline-color: rgba(127, 98, 244, 0.5)` in the base layer — the exact
  platform mechanism (L18): every element that falls back to the UA
  default outline (the plain `Button`, light-surface links, anything
  unstyled) focuses violet. The inputs/textareas (outline-none + the 1px
  edge) and the glass buttons (their own outline) are unaffected — no
  double rings (L20).
- **SD-56 (the reports empty states + headings):** both empty states adopt
  the measured skin — `flex h-40 items-center justify-center text-sm
  text-white/25` with the same "Sin datos en este período" copy (the
  e2e text pin holds). The three reports SectionCards pass
  `titleClassName="mb-5"` — the V10 per-card mechanism (cn/twMerge cleanly
  overrides the wrapper's mb-4); the dashboard/low-stock card margins are
  untouched (their own measured pins: mb-4/mb-3).
- **SD-57 (the sidebar collapse):** measured AT PARITY end-to-end (L15/L16)
  — no work; the session_19 suggestion is resolved as verified parity, and
  the finding is recorded so future sessions do not re-audit it.

## 2. Execution batches (TDD: red → green → gate)

### B1 — the dialog family (F1, SD-53/54)
1. `src/components/ui/dialog.tsx`: the overlay gains the fade pair; the
   content gains the slide quartet, loses `duration-200`, goes
   `max-w-lg` + `rounded-2xl sm:rounded-lg`; the stale S5 comment
   re-anchors to the v14 measurement.
2. `src/components/ui/alert-dialog.tsx`: the same family (it mirrors
   dialog; currently unused but part of the ui library).
3. The 8 call sites drop their width overrides (registers-view ×4,
   cashiers-view ×2, terminal-view ×1, sales-view ×1 — keep all dark-skin
   classes; inventory-view ×2: the delete keeps its skin, the editor keeps
   `max-h-[90vh] overflow-y-auto` and drops the now-redundant `max-w-lg`).

### B2 — the focus family (F2, SD-55)
1. `src/app/globals.css`: the `vx-focus` `:focus-visible` block — the
   indigo box-shadow ring → `outline: 3px solid rgba(127, 98, 244, 0.5)`
   (with the V11/F2h provenance comment extended to the chrome family).
2. `src/app/globals.css` base layer: `*, ::before, ::after {
   outline-color: rgba(127, 98, 244, 0.5); }` — the platform parity line.

### B3 — the reports surfaces (F3, SD-56)
1. `src/components/views/reports-view.tsx`: both empty states → the
   h-40 centered `text-white/25` box; the three SectionCards gain
   `titleClassName="mb-5"`.

### B4 — the pins (all red first)
1. `tests/functional-parity-v14.test.ts` — the source pins (§3).
2. `tests/e2e/functional-parity-v14.spec.ts` — the live pins (§3).
3. Legacy check: the v8 dialog-skin unit pins and the e2e reports text
   pins hold unchanged (no realignment needed — L24).

### B5 — evidence + docs lockstep
1. Evidence shots from the production build: the dialog mid-open at 1280
   AND at 390 (the full-bleed 16px-radius mobile skin), the violet keyboard
   focus on a nav link, the reports empty-state boxes.
2. Docs lockstep: AGENTS.md contract, CLAUDE.md counts + the v14 block,
   README badge, PAD, retail-pos_SKILL.md, `docs/session_21.md`, worklog,
   this plan's execution ledger.

## 3. Test plan (pins first — red)

- **Unit (`tests/functional-parity-v14.test.ts`, source pins):**
  - `dialog.tsx`: contains `max-w-lg`, `rounded-2xl sm:rounded-lg`, the
    four slide utilities, the overlay's four fade utilities; does NOT
    contain `duration-200`, `max-w-md`, a bare `rounded-lg` on the
    content path.
  - `alert-dialog.tsx`: the same family assertions.
  - The 8 call sites: no `max-w-sm`/`max-w-md` inside any
    `DialogContent className=` (the v8 skin substrings still present).
  - `globals.css`: `vx-focus`'s `:focus-visible` carries
    `outline: 3px solid rgba(127, 98, 244, 0.5)`; the indigo
    `129, 140, 248` ring ABSENT from the vx-focus block; the global
    `outline-color: rgba(127, 98, 244, 0.5)` line present.
  - `reports-view.tsx`: both empty states carry
    `h-40 items-center justify-center text-white/25`; three
    `titleClassName="mb-5"` call sites; the `mb-4` wrapper default intact
    in shared.tsx (the dashboard pins unaffected).
- **E2E (`tests/e2e/functional-parity-v14.spec.ts`):**
  - Desktop 1280, Cajas → Abrir Turno open: the content's computed
    `animationName` = `enter`, `animationDuration` = `0.15s`; width 512;
    borderRadius 8px; the overlay's computed `animationName` = `enter`
    (it fades, not snaps).
  - Mobile 390, the same dialog: width 390, x 0 (full-bleed),
    borderRadius 16px.
  - Keyboard focus: Tab to an aside nav link → computed `outlineColor`
    `rgba(127, 98, 244, 0.5)`, `outlineStyle` `solid`, `outlineWidth`
    `3px`, and the boxShadow carries NO `rgb(129, 140, 248)` ring
    (settle-wait 300ms — the transition-all outline fade, the v11
    lesson).
  - Reports page (probe DB, empty window): both empty-state boxes 160px
    tall, flex-centered, the text present; the heading→content gap 20px.
- Full gate after each batch: `bun run lint` · `bun run typecheck` ·
  `bun run build` · `bun run test` · `bunx playwright test`.

## 4. Ship

1. The evidence shots (B5.1); a live agent-browser parity probe of the
   mid-enter animation + the close transition on both apps.
2. Docs lockstep; worklog entry; `docs/session_21.md`; commit; push via
   the SSH wrapper (main only).

## 5. Out of scope (disclosed)

- The with-data skins of the reports "Detalle por método" table and the
  "Ingresos" bars: UNOBSERVABLE on the reference (no sales in any window
  — its Terminal is shift-gated with an empty cashier combobox, L3); the
  clone's rendering stands (standing disclosure, unchanged).
- The reference's dialog `bg-background` vs the clone's per-site dark
  skin: the v8 pins hold (the measured dark-dialog skin).
- The mobile drawer's own motion (`animate-in slide-in-from-left
  duration-200`): a superset surface (the reference has NO drawer, L17) —
  its 200ms slide stays (within the reference's motion language; e2e
  pinned).
- The reference's `translate-x-[-50%]` vs the clone's `-translate-x-1/2`:
  the same computed centering in v4 (the class spelling differs; the
  matrix3d measurement confirms identical geometry).
- The sidebar collapse: AT PARITY (SD-57) — no work.
- The X close button, the select/dropdown motion, the reports window
  chips, the login card: all measured at parity (L10/L11, v13 L17, L24) —
  no work.
- Standing v8-v13 disclosures unchanged (SD-14, SD-18, SD-19, SD-20,
  SD-23, the in-memory limiter, the terminal grid, the squeezed-mobile
  charts, the terminal card hover, --primary/--border token hygiene).

## 6. Execution results (filled on completion — 2026-10-27)

All batches executed TDD; every pin ran red before its implementation.

- **B1 (F1, SD-53/54)** — DONE. `dialog.tsx` + `alert-dialog.tsx`: the
  overlay gains the fade pair (consolidated into the first cn() string —
  the pin's extraction contract), the content gains the slide quartet +
  `max-w-lg` + `rounded-2xl sm:rounded-lg` (the radius pair adjacent in
  the real class string — the first pass matched only the re-anchored
  comment, a false pass caught and fixed), `duration-200` removed from
  both. All 10 call sites drop their width overrides (registers ×4,
  cashiers ×2, terminal ×1, sales ×1, inventory ×2 — the editor keeps
  `max-h-[90vh] overflow-y-auto`, drops the now-redundant `max-w-lg`);
  the stale S5 comment re-anchored to the v14 measurement. The v8
  dark-skin pins survive everywhere.
- **B2 (F2, SD-55)** — DONE. `vx-focus`'s :focus-visible →
  `outline: 3px solid rgba(127, 98, 244, 0.5)` with the V11/F2h
  provenance comment; the base layer gains the global
  `outline-color: rgba(127, 98, 244, 0.5)` platform line. No double
  rings (inputs/glass buttons own their rings).
- **B3 (F3, SD-56)** — DONE. Both reports empty states → the measured
  `flex h-40 items-center justify-center text-sm text-white/25` box; the
  three reports cards pass `titleClassName="mb-5"`; the SectionCard
  mb-4 default untouched (the dashboard pins hold).
- **B4 (the pins)** — DONE. 13 unit pins
  (`tests/functional-parity-v14.test.ts`) + 4 e2e pins
  (`tests/e2e/functional-parity-v14.spec.ts`),
  all red first (10 failed / 3 pre-existing-skin passes), all green
  after. Legacy pins hold unchanged (v8 dialog skins, reports text).
- **B5 (evidence + docs)** — DONE. Standard set re-captured from the
  production build (only 2 shots changed: desktop-cobrar-dialog now
  512px, desktop-reportes' new empty-state boxes — everything else
  pixel-identical); three new VLM-verified shots via
  `scripts/capture-v14-shots.sh`: desktop-dialog-abrir-turno.png (the
  512px dialog + dimming overlay), mobile-dialog-abrir-turno.png (the
  full-bleed 390px 16px-radius skin), desktop-focus-nav-violet.png
  (exactly one nav link under the violet outline). Docs lockstep:
  AGENTS.md 27, CLAUDE.md counts + v14 block, README badge, PAD v2.2.0
  + ADR-024, SKILL v1.9.0, session_21, worklog.

**E2e authoring lessons (hardened, not weakened):**
1. `toBeVisible()` resolves mid-enter; mid-flight `zoom-in-95` scales
   the rect (512 read 508/510). Fix: settle via
   `el.getAnimations().map(a => a.finished.catch(() => {}))` before
   geometry reads — applied to both v14 dialog pins AND the v8
   ticket-modal pin (its boundingBox reads race the new family;
   assertions unchanged).
2. `test.use()` is illegal inside a test body — the mobile viewport
   switch rides `page.setViewportSize({390, 844})` (the v12 convention).
3. One documented sequential flake recurred during the runs (a v9 title
   test) — green in isolation and on the full rerun (the session_20
   protocol).

**Final gate: lint 0 · tsc 0 · build ✓ (exit 0, the 1 documented
pre-existing instrumentation warning) · unit 458/458 (445+13, 30 files)
· e2e 162/162 (158+4).**

Environment audit: `.env` → `DATABASE_URL="file:../db/custom.db"` ✓;
`db/` at the repo root with the pushed+seeded custom.db ✓;
`.env.example` tracked, current, production-fatal example secret ✓;
vitest + playwright suites configured and extended ✓.

