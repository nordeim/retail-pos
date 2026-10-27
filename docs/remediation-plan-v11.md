# VeloxPOS — Remediation Plan v11 (Session V10→v11, 2026-10-27)

> Scope: three finding families from the live audit of BOTH apps
> (ref = veloxposretail.base44.app, clone = the standalone build on :3100):
> **F1 the chart container geometry** (the reference's recharts
> ResponsiveContainers re-wrap the viewBox to the CONTAINER width while the
> chart HEIGHT and the donut's ring radii stay FIXED — the clone's
> fixed-viewBox SVGs scale uniformly, so every chart renders at the wrong
> size at every viewport except the donut's 1440 sweet spot), **F2 the
> form-control chrome family** (the focus-ring system: the reference's
> app-surface controls focus with a 1px #7f62f4 edge — ring-1, no offset —
> while the clone ships the shadcn ring-2 + 2px-offset indigo halo
> everywhere; plus the input/textarea/select base classes, the label→control
> gap, the auth inputs' slate-400 focus + white offset, the glass-button
> focus outline, and four misaligned root tokens), and **F3 the chart hover
> tooltips** (the reference's charts render the recharts default tooltip —
> white card, 12px radius, 10px padding, 0 4px 20px shadow; the clone's
> charts are tooltip-free, a standing v10 disclosure now observable and
> closable).
> Baseline re-verified before audit: fresh clone of `main @ ed1d5cd` (the
> v10 close `1ae6aa9` + the remote's session_13/session_14 transcripts),
> gates green (lint 0 · tsc 0 · build ✓ · unit 379/379 · e2e 127/127),
> workspace rebuilt (.env + db/custom.db pushed/seeded), both apps logged
> in live.

> Method: full source audit of the v10 diff (clean — every v10 contract
> holds in code: sectorPath, the measured palette, the seed's exact state,
> the tiebreakers, thinLabelIndices) + a fresh agent-browser sweep of BOTH
> apps at 1440/1280/1024/390 focused on the surfaces no prior session could
> measure: the charts' CONTAINER geometry (prior sessions pinned chart
> INTERNALS — colors, dashes, gradients, labels — but never the responsive
> box), the interactive focus states (session_13's own suggested next
> step), and the tooltip layer. The reference's data state was re-verified
> row-by-row first: UNCHANGED since v10 (the same 2 sales at 19/04/26
> 22:09 + 14/03/26 01:45, the same 12 products, $0.00/0/12/1 KPIs, the
> same 5-row donut legend, "Sin datos en este período" reports, the
> Atún Dolores low-stock row) — so no seeded-data work this cycle.

## 0. Verification ledger (all live unless noted; ref vs clone, viewport noted)

| # | Check | Method | Result |
|---|---|---|---|
| L1 | Dashboard sales chart box @1440 | DOM + rect, both | ref: recharts-wrapper 731×**280**, svg `viewBox="0 0 731 280"` width=731 height=280. Clone: svg `viewBox="0 0 640 260"` rendered 731×**297** (aspect-locked stretch: +17px taller than the ref) — **F1a** |
| L2 | Dashboard sales chart box @1280 | DOM + rect, both | ref `0 0 625 280` → 625×**280**. Clone 625×**254** (−26px). The e2e viewport (1280) has been rendering the chart 26px shorter than the reference since v9 — unpinned because every chart pin is an ATTRIBUTE pin (colors/dashes/labels), immune to scale — **F1a** |
| L3 | Dashboard sales chart box @1024 | DOM + rect, both | ref `0 0 454 280` → 454×**280**. Clone 454×**184** (−96px — the plot flattens to 66% of the reference's height) — **F1a** |
| L4 | Reports sales chart box @1280 | DOM + rect, both | ref: `0 0 970 220` → 970×**220** (fixed height 220). Clone: `0 0 640 280` stretched to 970×**424** (+204px — nearly double the reference's height; the single largest visual divergence found this cycle) — **F1b** |
| L5 | Reports sales chart box @1440 | DOM + rect, ref | `0 0 1130 220` → 1130×220 — height 220 at every measured width, confirming the per-surface fixed heights — **F1b** |
| L6 | Donut box + ring @1440 | DOM + getBBox union + rect, both | ref: box 333 (`0 0 333 200`), ring union 160 units → 160px. Clone: box 333, ring 160px ✓ (the only parity point — the card inner is 335 ≥ 333 there) |
| L7 | Donut box + ring @1280 | same, both | ref: box re-wraps to 279 (`0 0 279 200`), ring stays **160px** (fixed innerR 50/outerR 80, cy 100, cx = box/2 ≈ 139.5). Clone: fixed 333-box scaled to 279 → ring **134px** (−26px, 84% of the reference) — **F1c** |
| L8 | Donut box + ring @1024 | same, both | ref: box 194, ring **160px**. Clone: ring **93px** (58% of the reference) — **F1c** |
| L9 | Donut @390 (ref) | DOM | box `0 0 80 200` — the reference's squeezed mobile (220px sidebar) renders an 80px box; its charts still carry the fixed 280/200 heights. The clone's mobile is the documented superset (drawer nav, full-width main); the GEOMETRY rule (fixed heights/radii, container-width boxes) is the contract, not the reference's squeezed widths — **F1c** |
| L10 | Root tokens | getComputedStyle(root), both | ref: `--ring 252 87% 67%` (= #7f62f4), `--primary 252 87% 67%`, `--background 225 25% 8%` (= #0f121a, the dialog-panel surface — NOT the #080a14 canvas), `--border 225 18% 18%` (= #262a36), `--input 225 18% 18%` ✓, `--foreground 220 20% 92%` (≈ 231 233 239 ✓ same color as the clone's literal). Clone: `--ring 129 140 248` (indigo-400), `--primary 99 102 241`, `--background 8 10 20`, `--border 30 34 53` — four token misalignments; --primary/--border/--background are currently unrendered-or-literal-pinned surfaces (badge/progress unused; dialogs/dropdowns carry the v8 literals), --ring renders on every focus — **F2a** |
| L11 | App input focus (Ajustes + product dialog) | .focus() + computed, both | ref: `box-shadow: rgb(127,98,244) 0 0 0 1px` (+ its shadow-sm) — **ring-1, NO offset, #7f62f4**; border unchanged rgb(38,42,54). Clone: `rgb(8,10,20) 0 0 0 2px, rgb(129,140,248) 0 0 0 4px` — ring-2 + 2px dark offset + indigo-400 — **F2b** |
| L12 | App input BASE classes | className, both | ref: `flex h-9 w-full border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors … md:text-sm rounded-xl mt-1`. Clone: `… px-3 py-1 text-sm … rounded-xl` — missing `text-base md:text-sm` (the ref renders 16px under 768px, 14px above; the clone is 14px always), missing `shadow-sm` — **F2c** |
| L13 | Textarea (Ajustes ticket footer) | className + computed, both | ref: `flex min-h-[60px] w-full border border-input bg-transparent px-3 py-2 text-base shadow-sm … focus-visible:ring-1 focus-visible:ring-ring … md:text-sm rounded-xl mt-1` (12px radius, py-2, ring-1). Clone: `rounded-md` (6px!), `py-2.5`, `text-sm`, `ring-2 + offset-2` — and the Ajustes instance is a RAW `<textarea>` with `focus-visible:ring-2 focus-visible:ring-ring/45` — **F2d** |
| L14 | SelectTrigger (Ajustes + product dialog) | className + computed, both | ref: `flex h-9 w-full items-center justify-between … px-3 py-2 text-sm shadow-sm … focus:outline-none focus:ring-1 focus:ring-ring … rounded-xl mt-1` (12px radius, ring-1, `focus:` not `focus-visible:`). Clone: `rounded-md` (6px), `focus-visible:ring-2 + offset-2` — **F2e** |
| L15 | Label→control gap | className sweep, both | ref: the control carries `mt-1` (4px); the Label carries no margin (`text-sm font-medium leading-none` — identical to the clone's). Clone: 27 call sites pass `mt-1.5` (6px) across settings/inventory/registers/cashiers — a 2px gap drift on every form row — **F2f** |
| L16 | Switch focus (product dialog) | .focus() + computed, both | ref: `rgb(15,18,26) 0 0 0 2px, rgb(127,98,244) 0 0 0 4px` — ring-2 + offset-2 (offset = #0f121a = --background), ring #7f62f4 SOLID. Clone: `ring-[#7f62f4]/40` (40% alpha, no offset) — **F2g** |
| L17 | Glass button focus (Guardar Cambios) | .focus() + computed, both | ref: `outline: 1px auto rgba(127,98,244,0.5)` (the browser focus outline recolored violet; NO ring shadow — the ref's Button base carries no focus-ring classes). Clone: the cva base's `focus-visible:ring-2 ring-ring ring-offset-2` indigo halo — **F2h** |
| L18 | Auth input focus (login) | .focus() + computed, both | ref: `rgb(255,255,255) 0 0 0 2px, rgb(148,163,184) 0 0 0 4px` — ring-2 + offset-2 with a WHITE offset and a **slate-400** ring (`focus:ring-slate-400 focus:border-slate-400`); border → slate-400 on focus. Clone: indigo-400 ring + **#080a14 dark offset** (ring-offset-background resolving the app canvas on the light page) — **F2i** |
| L19 | Auth input BASE | className, both | ref: `… pl-10 h-11 sm:h-12 … md:text-sm … placeholder:text-slate-600` (40px icon gutter, 44px mobile/48px ≥640 height, 14px desktop text). Clone: `pl-9 h-12 text-base placeholder:text-slate-400` (36px gutter, 48px always, 16px text, lighter placeholder) — **F2j** |
| L20 | Auth page root background | getComputedStyle(root), both | ref /login: `--background: 0 0% 100%` (WHITE — the auth routes swap the token; that is why ring-offset-background renders white there). Clone: the dark app token everywhere — **F2k** |
| L21 | Auth submit focus (Sign in) | .focus() + computed, both | ref: `outline: 3px solid rgb(255,255,255)`, NO ring shadow. Clone: indigo ring-2 + dark offset — **F2l** |
| L22 | Chart hover tooltip (ref) | mouse + DOM | the sales chart renders `.recharts-default-tooltip` on hover: `background-color: rgb(255,255,255); border-radius: 12px; padding: 10px; box-shadow: rgba(0,0,0,0.1) 0 4px 20px; white-space: nowrap`, content = the recharts tooltip label (`<p class="recharts-tooltip-label">mar</p>` on its empty series). The donut carries the recharts interaction rect (323×190) — its tooltip content is hover-gated and not reliably triggerable headlessly (disclosed). The clone's charts have NO tooltip layer (the v10 disclosure) — **F3** |
| L23 | Pinned-surface re-checks | live, both | dashboard KPIs + date line + low-stock (Atún Dolores 295g, 3 en stock mín. 5) + donut legend 5 rows identical; ventas table (2 rows, exact datetimes/totals); reports 30-day ticks (27 sep…25 oct) + "Sin datos en este período" ×2; the ref's data UNCHANGED since v10 — no drift on any pinned surface |
| L24 | Mobile drawer contract (clone @390) | live | FULLY green: 8 links × 40px, 44px pitch, 288px panel (12 + 263 + 13), zero horizontal overflow, aria-expanded true/false, body scroll lock/unlock, Escape closes, focus RETURNS to the hamburger. The ref's mobile unchanged (220px squeeze, no burger — verified in prior cycles, re-confirmed L9's 80px chart box) |
| L25 | Baseline gates | repo | lint 0 · tsc 0 · build ✓ · unit 379/379 · e2e 127/127 — the v10 close intact |

## 1. Design decisions (resolved)

- **SD-37 (the charts go container-responsive, the recharts way):** both
  chart components adopt the reference's ResponsiveContainer contract —
  the SVG box re-wraps to the measured CONTAINER width while the HEIGHT
  stays FIXED per surface (dashboard sales **280**, reports sales **220**,
  donut **200) and the donut's ring geometry stays FIXED (innerR 50 /
  outerR 80, cy 100, cx = box/2; the box caps at 333 — the reference's
  max-width). Implementation: a `useContainerWidth` hook (a callback ref
  that measures `getBoundingClientRect().width` synchronously at commit —
  before first paint, no flash — plus a ResizeObserver for later resizes,
  cleaned up via React 19's ref-cleanup return). `SalesAreaChart` renders
  `viewBox={`0 0 ${w} ${h}`}` + explicit `width`/`height` attributes with
  the internal paddings (padLeft 52 / padTop 12 / padBottom 28) FIXED and
  the plot area flexing — exactly how recharts lays out at a new width.
  `DonutChart` renders `viewBox={`0 0 ${min(w,333)} 200`}` with the ring
  pinned. The `height` prop becomes per-variant (`dashboard` 280,
  `reports` 220) — retiring the 640×260/640×280 fixed boxes, which matched
  the reference at NO viewport. The pre-measure render uses the natural
  fallback widths (640 / 333) so SSR/hydration markup is stable and the
  first commit corrects it before paint.
- **SD-38 (the form-control chrome family, one system):** the reference's
  focus grammar becomes the clone's: app-surface text controls (Input,
  Textarea, SelectTrigger) use `focus[-visible]:ring-1` with **no offset**
  and `--ring: 127 98 244` (#7f62f4); the Switch keeps ring-2 + offset-2
  with the SOLID #7f62f4 and the offset riding `--background` (aligned to
  `15 18 26` — the reference's own surface token, which the dialogs
  already paint); the glass buttons recolor the browser's focus outline
  (`outline: 1px auto rgba(127, 98, 244, 0.5)` in the glass utilities) and
  the cva Button base DROPS its ring-2/offset-2 focus classes (they were
  the v6 F6 fight's leftover — the reference's own base carries none). The
  base classes align to the measured strings: Input gains
  `text-base shadow-sm md:text-sm`, Textarea becomes `rounded-xl py-2
  text-base shadow-sm md:text-sm ring-1` (and the Ajustes raw `<textarea>`
  adopts the component), SelectTrigger becomes `rounded-xl` with
  `focus:ring-1` (the reference's own `focus:` spelling). The 27 `mt-1.5`
  call sites become `mt-1` (the 4px label→control gap). Token hygiene in
  the same batch: `--primary: 127 98 244` and `--border: 38 42 54`
  (currently unrendered — badge/progress unused, dialogs/dropdowns carry
  the v8 literals — aligning them changes nothing visible and removes the
  drift liability).
- **SD-39 (the auth surface's own focus system):** the auth pages get the
  reference's light-theme focus: the auth layout scope sets
  `--background: 0 0% 100%` (so `ring-offset-background` renders WHITE
  like the reference), the auth inputs gain
  `focus:border-slate-400 focus:ring-slate-400` (ring-2 + offset-2 stays
  the shape there — the reference's auth inputs use the full ring, unlike
  the app surface) plus the measured base corrections (`pl-10`, `h-11
  sm:h-12`, `md:text-sm`, `placeholder:text-slate-600`), and the auth
  submit buttons carry `focus-visible:outline-solid
  focus-visible:outline-white focus-visible:outline-[3px]` (the measured
  3px white outline, no ring).
- **SD-40 (the charts gain the measured tooltip):** both charts render
  the reference's measured default-tooltip skin on hover — a white card
  (`background #fff; border-radius 12px; padding 10px; box-shadow
  rgba(0,0,0,0.1) 0 4px 20px; white-space: nowrap`) positioned beside the
  pointer, content = the point's label (sales charts: the day label + the
  day's total; donut: the category name + count — the recharts default
  item line). Empty series keep the label-only form the reference renders.
  Disclosed: the reference's populated-tooltip CONTENT is unobservable
  (its data is empty — only the label-only form was measurable); the
  label+value content follows the recharts default shape. This closes the
  v10 "donut tooltip" disclosure and is a functional superset (the clone's
  charts become hover-informative).

## 2. Execution batches (TDD: red → green → gate)

### B1 — the responsive charts (F1, SD-37)
1. `src/components/pos/shared.tsx`: `useContainerWidth` hook;
   `SalesAreaChart` (measured box + per-variant fixed heights 280/220 +
   fixed paddings + flexing plot); `DonutChart` (measured box cap 333,
   fixed ring).
2. `src/components/views/dashboard-view.tsx` + `reports-view.tsx`: drop
   the `height={280}` call-site override (the variant owns the height).

### B2 — the form-control chrome (F2, SD-38)
1. `src/app/globals.css`: `--ring/--primary: 127 98 244`,
   `--background: 15 18 26`, `--border: 38 42 54`; the glass utilities
   gain the focus outline.
2. `src/components/ui/input.tsx`, `textarea.tsx`, `select.tsx`,
   `button.tsx`, `switch.tsx`: the measured base strings.
3. The 27 `mt-1.5` → `mt-1` call sites (settings/inventory/registers/
   cashiers); the Ajustes raw textarea → the Textarea component.

### B3 — the auth focus system (F2, SD-39)
1. `src/components/auth/login-surface.tsx` + `signup-surface.tsx` (+ the
   auth layout): the scoped `--background: 0 0% 100%`, the inputs'
   `focus:border-slate-400 focus:ring-slate-400` + base corrections, the
   submit outline.

### B4 — the chart tooltips (F3, SD-40)
1. `src/components/pos/shared.tsx`: the tooltip layer on both charts
   (pointer tracking, the measured skin, label(+value) content).

### B5 — pins + screenshots + docs lockstep
1. Unit pins (`tests/functional-parity-v11.test.ts`) + e2e pins
   (`tests/e2e/functional-parity-v11.spec.ts`); realign the v10 donut
   pins to the responsive contract (the e2e viewport is 1280 → the donut
   box asserts 279 there, not 333).
2. The 18 screenshots regenerated from the production build; docs
   lockstep (AGENTS.md contract 24, CLAUDE.md counts + the v11 block,
   README badge if counts move, PAD v1.9.0 + ADR-021, SKILL v1.6.0,
   `docs/session_15.md`, worklog, this plan).

## 3. Test plan (pins first — red)

- **Unit (`tests/functional-parity-v11.test.ts`):**
  - `useContainerWidth` source pins (the callback-ref measure + RO +
    React 19 cleanup return).
  - `SalesAreaChart` source pins: the per-variant heights (280/220), the
    `width={w}`/`viewBox` template, the fixed paddings, no `h-auto` class
    (the aspect-lock retires).
  - `DonutChart` source pins: the 333 cap, `cx = w/2`, the fixed
    innerR/outerR/cy, the `min(w, 333)` box.
  - The tooltip skin's source pins (the measured white-card classes /
    inline styles, the label+value content shape).
  - The chrome source pins: `--ring: 127 98 244` + `--background:
    15 18 26` + `--border: 38 42 54` in globals.css; the Input/Textarea/
    SelectTrigger base strings (ring-1, text-base md:text-sm, shadow-sm,
    rounded-xl, the select's `focus:` spelling); the Button base WITHOUT
    ring-2/offset-2; the Switch's solid ring + offset; the glass
    utilities' focus outline; the auth strings (slate-400 focus, pl-10,
    h-11 sm:h-12, md:text-sm, placeholder slate-600, the white
    --background scope, the 3px white submit outline); `mt-1.5` absent
    from the four view files.
- **E2e (`tests/e2e/functional-parity-v11.spec.ts`, viewport 1280):**
  - The dashboard chart: svg width attr = the measured card inner width,
    height attr = **280** (rendered 280 — not 254).
  - The reports chart: height attr = **220**, rendered 220 (not 424).
  - The donut: the box = the card inner width (279 at 1280), the ring's
    rendered extent 160px (getBBox × scale), the first sector's M point
    at (box/2 + 80, 100).
  - The focus states: the Ajustes input's focused box-shadow matches
    `rgb(127, 98, 244) 0px 0px 0px 1px`; the select trigger 12px radius;
    the switch's focused shadow stack (offset #0f121a + ring #7f62f4);
    the login input's focused shadow (white offset + slate-400 ring) and
    its 44px mobile height at 390; the Guardar focus outline
    rgba(127,98,244,0.5).
  - The tooltip: hover the dashboard chart → the white card appears with
    the day label; hover the donut → the category + count.
- **Legacy pin realignment (updated, not weakened):** the v10 donut e2e
  pins (the 333-box/M-point assertions) move to the responsive contract
  (box 279 + M at (219.5, 100) at the 1280 viewport); the v10 unit pin on
  the literal `0 0 333 200` viewBox string retires (the box is now
  computed — pinned via the cap + cx formula instead); the visual-parity
  T3 pin (the 12px control radius) extends to the select/textarea.
- Full gate after each batch: `bun run lint` · `bun run typecheck` ·
  `bun run build` · `bun run test` · `bunx playwright test`.

## 4. Ship

1. Screenshots (B5.2); VLM spot-check the dashboard + reports + a focus
   state.
2. Docs lockstep; worklog entry; `docs/session_15.md`; commit; push via
   the SSH wrapper (main only).

## 5. Out of scope (disclosed)

- The reference's squeezed-mobile chart widths (80px boxes at 390) — the
  reference's own broken mobile (220px sidebar squeeze); the clone's
  mobile is the documented superset. The GEOMETRY RULE is replicated, not
  the squeeze.
- The donut tooltip's populated CONTENT on the reference — its hover
  layer is not reliably triggerable headlessly (the interaction rect
  exists; the sales-chart tooltip was measured directly); the content
  shape follows the recharts default, disclosed in SD-40.
- The terminal product-card hover — unobservable on the reference (its
  Terminal is shift-gated and its "Abrir Turno" dead-ends with an empty
  cashier combobox; the standing superset note).
- `--primary`/`--border` alignment renders nothing visible today (the
  Badge/Progress primitives are unused; the dialogs/dropdowns carry the
  v8 literal pins) — token hygiene against future drift, not a visual
  fix.
- Standing disclosures unchanged: SD-14 og:url/canonical, SD-18 readable
  Total tone, SD-19 mailto transport, SD-20 public 404/signup superset,
  SD-23 Spanish-path 404s, the "Detalle por método" table skin
  (empty-on-both, re-verified), in-memory limiter, the terminal grid, the
  ref's "Demo Cashier" shift, the legend's slice(0,5) inference, the
  S4/S5 2° recharts float anomaly.

## 6. Execution results (2026-10-27, all green)

- **B1 shipped as planned:** `useContainerWidth` (the callback-ref measure
  at commit + ResizeObserver + the React 19 ref-cleanup return) +
  `SalesAreaChart` on `SALES_CHART_HEIGHTS` (dashboard 280 / reports 220)
  with the fixed paddings (52/28/12) and a flexing plot + `DonutChart` on
  the fixed ring (innerR 50/outerR 80, cy 100, cx = box/2) inside the
  333-capped re-wrapping box; the reports call site's `height={280}`
  override retired (the variant owns the height).
- **B2 shipped:** the token realignment (--ring/--primary 127 98 244,
  --background 15 18 26 with the body now painting the #080a14 canvas
  token — the reference's own split, --border 38 42 54); the Input /
  Textarea / SelectTrigger measured bases (ring-1 no-offset, text-base
  md:text-sm, shadow-sm, rounded-xl controls with the 6px dropdown
  panel kept, the select's `focus:` spelling); the cva Button base's
  focus-ring classes retired; the glass utilities' violet outline; the
  Switch's solid ring-2 + offset-2 over the surface token; the 27
  mt-1.5 → mt-1 call sites; the Ajustes raw textarea → the Textarea
  component.
- **B3 shipped:** the AuthShell's scoped `--background: 255 255 255`
  (an RGB triplet — the first attempt used the reference's HSL form
  "0 0% 100%", which rgb() parsed as BLUE; caught by the e2e and fixed);
  the auth inputs' `focus:border-slate-400 focus:ring-slate-400` family
  with `pl-10 h-11 sm:h-12 md:text-sm placeholder:text-slate-600`; the
  3px-solid-white submit outlines (login ×3, signup ×2).
- **B4 shipped:** `ChartTooltip` (the measured recharts default skin with
  readable dark text — the SD-18 precedent) + pointer tracking on both
  charts (`tooltipForSales` nearest-point, `tooltipForDonut`
  sector-under-pointer with the CCW angle math).
- **Legacy pin realignment (updated, not weakened):** the v10 donut e2e
  pins to the responsive contract (the box asserts dynamically, the M
  point computes from box/2 + 80); the v10 unit viewBox pin to the
  template + cap; the v4 signup input heights; the v10 reports tick pins
  went DATE-RELATIVE (labelDaysBack) — the windows anchor to the current
  day and the absolute strings rolled over at the UTC midnight boundary
  mid-session, caught live and generalized.
- **Gate: lint 0 · tsc 0 · build ✓ · unit 397/397 (379+18) · e2e 139/139
  (127+12).** Docs lockstep: AGENTS.md contract 24, CLAUDE.md counts +
  the v11 block, README badge (397+139), PAD v1.9.0 + ADR-021 +
  §8 counts, retail-pos_SKILL.md v1.6.0, session_15.md, worklog, this
  plan.
- **Evidence:** all 18 screenshots regenerated from the production
  standalone build (varied sizes verified); live parity probes at
  1440/1280/1024 — the dashboard sales chart 625×280 and 454×280 EXACT
  (viewBox `0 0 625 280` / `0 0 454 280`, the reference's own boxes),
  the reports chart 714×220 and 970×220 EXACT (viewBox byte-identical),
  the donut ring 160px at every viewport with the box re-wrapping
  333/279/194; the input focus shadow `rgb(127, 98, 244) 0px 0px 0px
  1px` byte-identical to the reference's.
- **Probe lessons recorded:** (1) chart CONTAINERS are a parity surface —
  attribute pins (colors/dashes/labels) are scale-immune, so an
  aspect-locked chart can pass every pin while rendering at the wrong
  size — pin the rendered geometry; (2) `transition-colors` covers
  outline-color: a focused outline FADES IN from currentColor over
  ~150ms — settle-wait before reading computed outlines (the e2e's
  first reads caught white and a 91%-blended lavender mid-transition);
  (3) the reference's own glass-button focus alternates auto/1px and
  solid/3px across probe states (base44 platform CSS) — the stable
  measured fact is the COLOR, so the deterministic 3px solid ships,
  disclosed; (4) a scoped --background must follow the repo's RGB-triplet
  token convention — the reference's HSL form fed to rgb() parses as
  blue; (5) reports windows anchor to the CURRENT day — absolute date
  strings in pins roll over at midnight (date-relative pins are the
  contract); (6) both apps' label-bottom → control-top gap measures 8px
  (the 4px mt-1 + the inline label's 16px-box overshoot) — pin the
  observable geometry, not the margin.
