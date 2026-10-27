# VeloxPOS — Remediation Plan v13 (Session V12→v13, 2026-10-27)

> Scope: one finding family from the live audit of BOTH apps
> (ref = veloxposretail.base44.app, clone = the standalone build on :3101),
> the family session_17 itself suggested next: **the chart hover
> micro-interactions** — the interactive states BELOW the chart surfaces that
> no prior session had measured. The reference's dashboard line-chart hover
> is triggerable headlessly (synthetic mousemove on the chart svg — probe
> lesson below), and for the first time the donut's tooltip too
> (mouseenter/mousemove ON THE SECTOR PATH — the v10/v11 "not reliably
> triggerable" disclosure closes). Five finding families:
> **F1 the sales-chart activeDot** (the reference renders the recharts
> default `<circle r="4" fill="#6366f1" stroke="#fff" stroke-width="2">` at
> the active point — the clone renders nothing),
> **F2 the sales-chart tooltip CURSOR** (a vertical `stroke="#ccc"` line at
> the active x spanning the plot area — the clone renders nothing),
> **F3 the tooltip CONTENT grammar** (the reference renders the recharts
> DEFAULT item line — the label `<p>` (margin 0) + a `<ul><li>` item at 4px
> pad-y colored the LINE color `#6366f1`: `ventas` + `" : "` + the RAW
> value `"0"` — never `$`-formatted; 16px. The clone ships a custom 2-line
> card at 14px: a 600-weight label + a formatted value, no series name),
> **F4 the tooltip POSITION + motion** (the reference's wrapper sits at
> (active-point.x + 10, POINTER.y + 10) — the x snaps, the y follows the
> mouse — flips LEFT of the point at the container's right edge, and glides
> with `transition: transform 400ms`; the clone anchors centered ABOVE the
> point, no flip, no transition, and unmounts on leave while the reference's
> wrapper persists with `visibility: hidden`),
> **F5 the donut tooltip's OWN skin** (the reference's donut tooltip is the
> RAW recharts default — white bg + a 1px `#ccc` border, NO radius, NO
> shadow, an EMPTY label `<p>`, the item in BLACK `rgb(0,0,0)`:
> `Lácteos : 2` — anchored at the sector centroid +10/+10 with the same
> left-flip and 400ms glide. The v11 measurement was taken on the SALES
> chart and its white-card skin was applied to BOTH charts — the donut needs
> the raw skin).
> Baseline re-verified before audit: main @ 5e7415c (the v12 close 0268bd8 +
> the remote's session_18 transcript), gates green (lint 0 · tsc 0 · build ✓
> · unit 429/429 · e2e 153/153), workspace intact (.env, deps, db/custom.db
> seeded — no rebuild needed).

## 0. Verification ledger (all live unless noted; ref vs clone)

| # | Check | Method | Result |
|---|---|---|---|
| L1 | Baseline gates | repo | lint 0 · tsc 0 · build ✓ · unit 429/429 · e2e 153/153 — the v12 close intact |
| L2 | Reference data state | DOM, ref | UNCHANGED since v12: KPIs $0.00/0/12/1, the 5-row donut legend, the Atún Dolores low-stock row, date line "martes 27 de octubre, 2026" — no seeded-data work |
| L3 | Line-chart hover trigger | synthetic mousemove on the chart svg, ref | TOOLTIP + activeDot + cursor all render: content "sáb" + item `ventas : 0` — the recharts default (raw value, no $); the trigger is a plain `MouseEvent('mousemove')` on the element at the point — reliable headless |
| L4 | The tooltip skin (line) | DOM + computed, ref | `recharts-default-tooltip`: white bg, 12px radius, 10px padding, `rgba(0,0,0,0.1) 0px 4px 20px`, nowrap — the v11-pinned skin ✓; the label `<p>` margin 0; the item `<li>` `display:block; padding-top:4px; padding-bottom:4px; color: rgb(99,102,241)` with spans name + `" : "` separator + value + empty unit |
| L5 | The tooltip label color | computed, ref | rgb(231, 233, 239) — #e7e9ef inherited onto white = UNREADABLE (the v11 disclosure); the item color rgb(99,102,241) is readable |
| L6 | The activeDot | DOM, ref | `<g class="recharts-layer recharts-active-dot"><circle cx cy r="4" fill="#6366f1" stroke-width="2" stroke="#fff">` — the recharts default active dot (8×8 box) |
| L7 | The tooltip cursor | DOM, ref | a `<path>` `d="M342.5,5L342.5,245"` `stroke="#ccc"` — a 1px (default width) vertical line at the active x spanning the plot area (y 5→245 on the 280-tall chart) |
| L8 | The tooltip anchor | rect math, ref, 3 probes | x = the ACTIVE POINT's x + 10 (stable across pointer moves at the same column — the dot at 607 → wrapper left 617; the pointer at 577 NOT followed); y = the POINTER's y + 10 (pointer 419→wrapper 429; pointer 309→wrapper 319; the dot's y 524 NOT followed) |
| L9 | The right-edge flip | rect math, ref | at the last point (dot x 885, container right 889.5): the wrapper flips LEFT — `recharts-tooltip-wrapper-left`, wrapper right = dot x − 10 (875) — the same 10px gap mirrored |
| L10 | The tooltip motion | style, ref | the wrapper carries `transition: transform 400ms` — the tooltip GLIDES between positions while hovering (and on re-enter: the wrapper persists mounted, `visibility: hidden` on leave) |
| L11 | The donut tooltip trigger | synthetic mouseenter/mousemove ON THE SECTOR PATH, ref | TRIGGERED (the v10/v11 disclosure closes): the pie's tooltip needs the events on the `.recharts-sector` path — the chart-wrapper mousemove does NOT activate it |
| L12 | The donut tooltip skin | DOM + computed, ref | the RAW recharts default — NOT the sales chart's skin: white bg + `border: 1px solid rgb(204, 204, 204)`, NO border-radius (0px), NO box-shadow, 10px padding, nowrap; the label `<p>` is EMPTY; the item `<li>` color rgb(0, 0, 0) — BLACK, not the sector fill |
| L13 | The donut tooltip content + anchor | DOM + rect math, ref | item `Lácteos : 2` (name + separator + raw count); the wrapper (110×54) anchored at the SECTOR CENTROID (the ring midpoint at the mid-angle ≈ (1152, 348)) +10/+10 → (1162, 358), flipped LEFT when it would overflow the container right edge (1033 = 1152 − 110 − 10 + rounding); `transition: transform 400ms` |
| L14 | The donut sector hover state | computed, ref | NONE — no transform/opacity/filter change on the hovered sector (`transition: all` is present but inert); nothing to replicate |
| L15 | The tooltip font size | computed, both charts, ref | 16px on BOTH tooltips (inherited from the body — no explicit size); the clone's current tooltip is 14px |
| L16 | The clone's current tooltip | DOM, clone | line: "sáb" + "0" custom 2-line card (label 600-weight #1e293b + value #475569), 14px, 48px wide, `translate(-50%, calc(-100% - 12px))` above the point, no dot, no cursor, no flip, no transition, unmounts on leave; donut: the SAME white-card skin + "Lácteos" + "2 productos" |
| L17 | Reports window chips | DOM + computed, both | AT PARITY: active `bg-violet-600 text-white shadow-lg shadow-violet-500/30`, inactive `text-white/40 hover:text-white/70` transparent — exact match (both apps default the 30-day window); the clone's `vx-focus` class is the v11 focus superset — no work |
| L18 | Dashboard chart labels | DOM, both | AT PARITY: Y plain "0 1 2 3 4" (no $), X day names mié..mar — the v9/v11 pins hold (the clone's Reports chart carries the $ Y labels like the ref) |
| L19 | Low-stock rows | DOM + real hover, both | AT PARITY: `flex items-center gap-3 rounded-xl border-amber-100 bg-amber-50/50 p-3`, NO hover state on either app (the ref's row unchanged under a real hover); the clone renders `<li>` vs the ref's `<div>` — same utilities, no work |
| L20 | Social icon hover transform | real hover + DOM scan, ref | NO SUCH INTERACTION: zero `group-hover` utilities in the button's DOM — the icon wrapper's `transition-transform duration-200` is inert dead code; the button's own hover (bg slate-50, border slate-300, shadow-sm) matches the clone — **the v12 disclosure RETIRES (at parity)** |
| L21 | Reference Terminal gate | DOM, ref | STILL shift-gated ("No hay turno activo") — the product-card hover remains unobservable (standing disclosure) |

## 1. Design decisions (resolved)

- **SD-46 (the sales tooltip content):** the tooltip adopts the reference's
  recharts-default content exactly: the label `<p style="margin: 0">`
  (the day) followed by `<ul style="margin:0; padding:0"><li
  style="display:block; padding-top:4px; padding-bottom:4px;
  color: #6366f1">` with the three spans — the literal series name
  `ventas`, the `" : "` separator, and the RAW value (`String(value)` —
  never `$`-formatted, never `formatY`). The font size goes 14→16px. The
  card keeps the measured white-card skin (bg #fff, 12px radius, 10px
  padding, the 0 4px 20px shadow, nowrap, pointer-events none — the v11
  skin pins hold). The label keeps the READABLE `#1e293b` (the SD-18
  disclosed superset — the reference's inherited #e7e9ef is invisible on
  white; the clone's users see the day, the reference's cannot).
- **SD-47 (the tooltip anchor + motion):** the wrapper is positioned
  `translate(pointX + 10, pointerY + 10)` — the x follows the SNAPPED
  point, the y follows the POINTER — inside the chart's relative box. The
  flip: if `pointX + 10 + tipW > containerW` then `pointX − tipW − 10`
  (the mirrored 10px gap); the same guard on y against the container
  bottom (flip above — recharts' documented default, defensive). The
  wrapper carries `transition: transform 400ms` (the glide) and PERSISTS
  while the chart is mounted after the first hover: leave sets
  `visibility: hidden` (never unmounts), re-enter re-shows at the new
  position → the glide-on-reenter matches recharts. The tooltip measures
  itself via a callback ref + ResizeObserver (the repo's
  `useContainerWidth` pattern — no setState-in-effect, the lint rule).
- **SD-48 (the donut tooltip):** the donut gets its OWN raw skin —
  white bg + `border: 1px solid #ccc`, NO radius, NO shadow, 10px padding,
  nowrap, 16px, the EMPTY label `<p>` (rendered empty, height 0 — DOM
  fidelity), and the item `<li>` in BLACK `rgb(0,0,0)`:
  `{name}` + `" : "` + `String(count)` (the raw count — "2 productos"
  RETIRES). The anchor is the sector's ring midpoint at the mid-angle
  (the existing `tooltipForDonut` anchor — measured ≈ the recharts
  centroid within 1px) +10/+10 with the same left-flip and the 400ms
  glide + the persistent wrapper. The white-card `ChartTooltip` skin now
  lives ONLY on the sales chart (the reference's two tooltips ship
  different skins — the v11 single-skin application was the bug).
- **SD-49 (the activeDot):** the sales chart renders the recharts default
  active dot while a point is active: a `<g data-testid="active-dot">`
  wrapping `<circle r="4" fill={skin.lineStroke} stroke="#fff"
  stroke-width="2">` at (x(idx), y(points[idx].value)) — #6366f1 on both
  skins. It unmounts with the hover state (the reference's dot is a hover
  child of the chart, not the persistent wrapper).
- **SD-50 (the tooltip cursor):** the sales chart renders the cursor
  while a point is active: `<line data-testid="tooltip-cursor"
  x1={x(idx)} x2={x(idx)} y1={padTop} y2={padTop + innerH}
  stroke="#ccc" strokeWidth={1} />` — the vertical line at the active x
  spanning the plot area (the reference's measured y 5→245 on its 280 box
  = its own plot; the clone spans its own plot 12→252).
- **SD-51 (the series name):** the item name is the literal `ventas` —
  the reference's own dataKey (the only observable series name). The
  reports chart rides the same name (its tooltip is unobservable on the
  reference — no data in any window — disclosed; the recharts default
  shape is the posture).
- **SD-52 (the disclosures):** two RETIRE this cycle — (a) the v12
  "social-button hover icon-transform" known-open: measured at parity
  (zero `group-hover` utilities on the reference — the transition class
  is dead code there too); (b) the v10/v11 "donut tooltip content not
  reliably triggerable": now measured (the sector-path mouseenter trigger
  — L11/L12/L13) and shipped. The standing disclosures that remain:
  the readable tooltip label (SD-18 family, now explicitly the tooltip
  case), the reports tooltip content (unobservable), the Terminal
  product-card hover (shift-gated), and the pre-existing v8-v12 set.

## 2. Execution batches (TDD: red → green → gate)

### B1 — the sales-chart hover set (F1 + F2 + F3 + F4, SD-46/47/49/50)
1. `src/components/pos/shared.tsx` (SalesAreaChart): the hover state
   becomes `{ idx, pointerY }` (the nearest index + the pointer's svg y);
   render the CURSOR line + the activeDot `<g>` while active; the tip
   data feeds the new positioned wrapper.
2. The new `SalesTip` component: the white-card skin + the recharts
   content grammar (label p + ul/li item in the line color) + the
   (point.x+10, pointer.y+10) anchor + the measured flip + the 400ms
   transform transition + the persistent visibility wrapper + the
   callback-ref/ResizeObserver self-measurement.

### B2 — the donut tooltip (F5, SD-48)
1. `shared.tsx` (DonutChart): the new `DonutTip` component — the raw
   skin (1px #ccc border, no radius, no shadow), the empty label p, the
   black `name : count` item, the centroid anchor + flip + 400ms glide +
   the persistent wrapper; "N productos" retires; the hover state keeps
   the sector hit-testing (the existing `tooltipForDonut` geometry).

### B3 — the pins (all red first)
1. `tests/functional-parity-v13.test.ts` — the source pins (below).
2. `tests/e2e/functional-parity-v13.spec.ts` — the live pins (below).
3. Realign the v11 e2e pins (updated, not weakened): the line-chart pin's
   leave assertion `toHaveCount(0)` → the persistent-wrapper contract
   (still in the DOM, `visibility: hidden`); the donut pin's content
   "2 productos" → the raw skin + "Lácteos : 2" + the empty label + the
   black item. The v11 unit pins hold (substring-compatible).

### B4 — evidence + docs lockstep
1. Two hover evidence shots via a one-off playwright capture:
   `desktop-dashboard-chart-hover.png` (the tooltip + dot + cursor live)
   and `desktop-donut-hover.png` (the raw tooltip on a sector).
2. Docs lockstep: AGENTS.md contract 26, CLAUDE.md counts + the v13
   block, README badge, PAD v2.1.0 + ADR-023, retail-pos_SKILL.md v1.8.0,
   `docs/session_19.md`, worklog, this plan's execution ledger.

## 3. Test plan (pins first — red)

- **Unit (`tests/functional-parity-v13.test.ts`, source pins on
  shared.tsx):**
  - The activeDot: the `active-dot` g + `r={4}` + `fill={skin.lineStroke}`
    + `stroke="#fff"` + `strokeWidth={2}` at `(x(idx), y(...))`.
  - The cursor: the `tooltip-cursor` line + `stroke="#ccc"` + the
    y-span `padTop` → `padTop + innerH` at the active x.
  - The sales tip content: the label `<p>` margin 0, the `ul/li` item
    with 4px pad-y + the line color, the `ventas` literal, the
    `" : "` separator, `String(...)` raw value (no `formatY` in the tip
    path), fontSize 16.
  - The anchor + flip: `+ 10` offsets, the `> containerW` (flip left)
    and the bottom guard; `transition: transform 400ms`; the persistent
    `visibility` wrapper (a `visible` flag, never a null unmount after
    the first hover).
  - The donut tip: `border: 1px solid #ccc` (or the equivalent string),
    NO borderRadius, NO boxShadow, the empty label p, the black item
    `rgb(0, 0, 0)`, `String(count)`, the centroid anchor + flip + the
    400ms transition; `"productos"` ABSENT from the tip path.
- **E2E (`tests/e2e/functional-parity-v13.spec.ts`, 1280 viewport):**
  - Hover the dashboard chart mid-plot → the tooltip visible with the
    label day + the item text `ventas : 0`; the item's computed color
    rgb(99,102,241), 4px top/bottom padding, 16px font; the label's
    color rgb(30,41,59) (the readable superset); the card skin (white,
    12px radius, 10px padding, the measured shadow) — the v11 skin pins
    re-asserted on the new structure.
  - The activeDot: `circle` r 4, fill rgb(99,102,241), stroke
    rgb(255,255,255), stroke-width 2, cx/cy at the line point.
  - The cursor: the line at the active x (|line.x − dot.x| < 2),
    stroke rgb(204,204,204), spanning the plot (y1 < y2, height ≥ 200).
  - The anchor: the wrapper's left = the dot's x + 10 ± 2; the wrapper's
    top = the pointer's y + 10 ± 2 (hover at a known y).
  - The right-edge flip: hover the LAST point → the wrapper's right ≤
    the dot's x − 8 (the mirrored gap); settle-wait ~450ms before
    asserting positions (the 400ms glide — the v12 settle lesson).
  - The transition: the wrapper's computed transition contains
    `transform` and `400ms`.
  - Leave → the tooltip `visibility: hidden` but still attached (the
    persistent wrapper); re-enter → visible again at the new position.
  - The donut: hover the first sector (the Lácteos ring midpoint) → the
    tooltip text `Lácteos : 2`; the raw skin (border 1px solid
    rgb(204,204,204), borderRadius 0px, boxShadow none, padding 10px);
    the item color rgb(0,0,0); the label `<p>` EMPTY; 16px; the wrapper
    flipped LEFT of the centroid (its right edge ≤ centroid.x + 2).
- **Legacy realignment:** the v11 line-chart pin's leave assertion
  (`toHaveCount(0)`) → the hidden-but-attached contract; the v11 donut
  pin ("Lácteos" + "2 productos") → the raw skin + `Lácteos : 2`. The
  v11 unit pins (ChartTooltip/tooltipForSales/tooltipForDonut substrings)
  hold if the names survive — verify, rename only if the implementation
  renames (then the pin follows the rename, never deletes).
- Full gate after each batch: `bun run lint` · `bun run typecheck` ·
  `bun run build` · `bun run test` · `bunx playwright test`.

## 4. Ship

1. The two hover evidence shots (B4.1); VLM spot-check optional (the v10
   lesson: pixel settle any VLM claim).
2. Docs lockstep; worklog entry; `docs/session_19.md`; commit; push via
   the SSH wrapper (main only).

## 5. Out of scope (disclosed)

- The tooltip label color: the reference's inherited #e7e9ef on white is
  invisible — the readable #1e293b ships (SD-18 precedent, disclosed).
- The reports chart's tooltip content: unobservable on the reference (no
  data in any window — its own "Sin datos en este período"); the recharts
  default shape + the literal `ventas` name ride (SD-51).
- The donut sector hover state: none exists on the reference (L14) —
  nothing to replicate.
- The reference's `recharts-tooltip-item-unit` empty span: renders
  nothing — not replicated (the three visible spans ship).
- The `<li>` vs `<div>` low-stock row tag: same utilities, same render —
  the clone's semantic `<li>` stays.
- The reference's Terminal product-card hover: still unobservable
  (shift-gated, L21) — the standing disclosure.
- The KPI cards (no hover on either app — v12 L18), the reports window
  chips (L17 at parity), the nav/table/button hovers (pinned v5/v12) —
  verified, no work.
- Standing v8-v12 disclosures unchanged (SD-14, SD-18, SD-19, SD-20,
  SD-23, the "Detalle por método" table, the in-memory limiter, the
  terminal grid, the squeezed-mobile charts, the terminal card hover,
  --primary/--border token hygiene).

## 6. Execution results (2026-10-27, all green)

- **B1 shipped as planned:** the SalesAreaChart's hover state became
  `{idx, pointerY, visible}` (the snapped index + the pointer's svg y);
  the CURSOR renders while active (`<line data-testid="tooltip-cursor"
  x1/x2={x(hover.idx)} y1={padTop} y2={padTop + innerH} stroke="#ccc"
  strokeWidth={1}>`); the activeDot renders (`<g
  data-testid="active-dot"><circle r="4" fill={skin.lineStroke}
  stroke="#fff" strokeWidth={2}>` at the point); the new `SalesTip`
  component carries the white-card skin + the recharts default content
  (the margin-0 day label in the readable #1e293b + the ul/li item in the
  line color: the literal `ventas` + " : " + `String(value)`, 16px) + the
  hybrid anchor through `tipTransform` ((point.x + 10, pointer.y + 10) —
  the x snaps, the y follows the pointer) with the right-edge left-flip
  (the mirrored −10 gap) + the bottom guard + `transition: transform
  400ms` + the PERSISTENT visibility wrapper; `useSelfMeasure` (the
  callback-ref + ResizeObserver pattern) feeds the flips without any
  setState-in-effect.
- **B2 shipped:** the new `DonutTip` — the RAW recharts default skin
  (white bg + `border: 1px solid #ccc`, NO radius, NO shadow, 10px
  padding, nowrap, 16px), the EMPTY label `<p style={{ margin: 0 }} />`,
  the BLACK item (`color: #000`: `{name}` + " : " + `{count}`), anchored
  at the sector's ring midpoint (the existing `tooltipForDonut` anchor —
  measured ≈ the recharts centroid) with the same flip + glide +
  persistent wrapper; the "N productos" phrasing retired; the white-card
  skin now lives ONLY on the sales chart.
- **Legacy-pin alignment (updated, not weakened):** the v11 unit pin
  `ChartTooltip` → `SalesTip` (the component renamed when the donut got
  its own skin — the skin regexes held via SalesTip's strings); the v11
  line-chart e2e pin's leave assertion `toHaveCount(0)` → the
  persistent-wrapper contract (`toBeHidden()` + `toHaveCount(1)`); the
  v11 donut e2e pin → the `donut-tooltip` testid + "Lácteos : 2".
- **Gate: lint 0 · tsc 0 · build ✓ · unit 445/445 (429+16) · e2e 158/158
  (153+5).**
- **Evidence:** two hover shots captured from the production build
  (`scripts/capture-hover-shots.ts` → desktop-dashboard-chart-hover.png +
  desktop-donut-hover.png) and PIXEL-verified: the cursor = a 235px
  vertical gray run at column 353 (the anti-aliased #ccc line), the dot =
  301 indigo samples, the donut's white tooltip + 33 #ccc-border pixels.
  Live parity probes on the new build: the tip "sábventas : 0" with the
  #6366f1 item at 16px, the dot r4/#6366f1/#fff/2px, the cursor
  x=332.5/#ccc, the donut "Lácteos : 2" with the 1px #ccc border + 0px
  radius + no shadow + black item + empty label — and the flip transform
  math exact (translate(75.79, 77.5) = the 30° ring-midpoint anchor −
  110 − 10 on the 279-wide box).
- **Probe lessons recorded (also in AGENTS.md 26):** (1) a 0-width SVG
  line (the cursor) and the flat-$0 area path have EMPTY Playwright
  bounding boxes — assert attachment + geometry, never toBeVisible;
  (2) Chromium serializes `400ms` as `0.4s` in computed transitions;
  (3) e2e hovers must GATE on the data (the area path / the legend row)
  before the mouse.move — a move on the empty-payload chart never
  activates a point; (4) the reference's PIE tooltip activates only via
  mouseenter/mousemove ON THE SECTOR PATH (the chart-wrapper mousemove
  never triggers it — the v10/v11 disclosure closes); (5) the reference's
  cartesian tooltip anchor is the measured hybrid (x = the snapped point,
  y = the pointer); (6) Playwright's `waitFor()` defaults to "visible" —
  the capture script needed `{state: "attached"}`.
- **Disclosures retired:** the v12 social-icon-transform known-open
  (L20: zero `group-hover` utilities on the reference — dead code, exact
  parity) and the v10/v11 donut-tooltip "not reliably triggerable"
  (L11-L13: measured + shipped). Remaining open: the readable tooltip
  label (SD-18 family — the reference's own is invisible on white), the
  reports tooltip content (unobservable — no data in any window), the
  Terminal product-card hover (shift-gated), and the standing v8-v12 set.
- **Docs lockstep:** AGENTS.md contract 26; CLAUDE.md counts + the v13
  block; README badge (445+158); PAD v2.1.0 + ADR-023 + §8 counts;
  retail-pos_SKILL.md v1.8.0 (incl. two stale 127/127 e2e counts
  corrected); session_19.md; worklog; this plan.
