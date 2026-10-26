# VeloxPOS — Remediation Plan v10 (Session V9→v10, 2026-10-27)

> Scope: the category DONUT family (the standing "unobservable" disclosure
> since v5 — the reference's donut now renders with full data and measures
> completely: palette, ring geometry, sector strokes, start angle and
> direction, legend cap, legend row colors, and the stacked layout), the
> low-stock header spacing (mb-3 vs mb-4), the Ajustes section-header icon
> system (per-section icons + colors at w-5 h-5), the seeded DATA parity
> (product order + the 12th product's real values, register card order, the
> two historical sales' exact datetimes and the second sale's real items),
> and the reports chart's X-tick algorithm (the reference thins by day-step
> from the window start, not by even index).
> Baseline re-verified before audit: fresh clone of `main @ ba55cdb` (the
> v9 close `dd42192` + `docs/session_12.md`), gates green (lint 0 · tsc 0 ·
> build ✓ · unit 363/363 · e2e 115/115), env rebuilt (.env +
> db/custom.db pushed/seeded), both apps logged in live.

> Method: full source audit of the v9 diff (clean — every v9 contract holds
> in code: SPANISH_ALIASES, exact-case titles, bare tables, 231 233 239
> foreground, CHART_SKINS, no dashboard footer) + a fresh agent-browser
> sweep of BOTH apps focused on surfaces no prior session could measure.
> The headline unlock: **the reference's donut chart is now fully
> observable** (6 sectors with real data — Lácteos 2, Limpieza 2, Higiene
> Personal 2, Alimentos 3, Snacks 1, Bebidas 2) and was measured to the
> pixel: sector paths, fills, strokes, angles, ring radii, the legend's 5
> rows, and the stacked chart-over-legend layout. The seeded data was then
> re-verified row-by-row against the reference's now-fully-rendered tables
> (Inventario 12/12 rows — the 12th was count-pinned but value-ASSUMED in
> the dossier era; Ventas dates; both ticket modals; the Turnos table).

## 0. Verification ledger (all live unless noted; ref = veloxposretail.base44.app vs clone = localhost:3000)

| # | Check | Method | Result |
|---|---|---|---|
| L1 | Donut sector fills (ref) | DOM + pixel sampling @r=65 every 15° | 6 sectors, counterclockwise from 3 o'clock (screen): **#6366f1** (Lácteos, 0–60°), **#8b5cf6** (Limpieza, 60–120°), **#a78bfa** (Higiene, 120–180°), **#c4b5fd** (Alimentos 3, 180–270°), **#ddd6fe** (Snacks 1, 270–300°), **#22c55e** (Bebidas 2, 300–360°) — the classic recharts ramp indigo-500→violet-200 + green-500 last. Pixel-sampled rgb values match the fills exactly — **F1a** |
| L2 | Donut ring geometry (ref) | sector path parse (A 80,80 outer / A 50,50 inner) | viewBox **333×200** (recharts responsive container, width 100% / max-width 333 / height 200), pie **cx=166.5 cy=100**, **innerR=50, outerR=80** (ring width 30), sectors run **counterclockwise starting at 3 o'clock**, ~**2° padding per side** (4° gaps between slices; boundaries at 0/60/120/180/270/300°) — **F1b** |
| L3 | Donut sector stroke (ref) | path attrs | every sector path carries **stroke="#fff"** (width default 1px) — **F1c** |
| L4 | Donut legend rows (ref) | DOM | **5 rows only** — Lácteos 2, Limpieza 2, Higiene Personal 2, Alimentos 3, Snacks 1. The 6th data item (Bebidas 2, the green sector) is rendered in the chart but **absent from the legend** (the ref caps its legend at the first 5 items — inference from observation) — **F1d** |
| L5 | Donut legend row anatomy (ref) | DOM + computed | container `div.space-y-2.mt-2` BELOW the chart; row `div.flex.items-center.justify-between.text-sm` > left `div.flex.items-center.gap-2` > swatch `div.w-3.h-3.rounded-full` (**12px**, inline bg) + `span.text-slate-600` name (**#475569**); right `span.font-semibold.text-slate-700` count (**#334155**) — **F1e/F1f/F1g** |
| L6 | Donut layout (ref) | DOM order + container styles | **stacked**: the recharts container (w-full, h-200, max-w-333) sits ABOVE the legend (`space-y-2 mt-2`) — NOT side-by-side. The clone renders `[SVG 190×190] + legend` in a `sm:flex-row` row — **layout drift, F1g** |
| L7 | Clone donut (current) | DOM + computed | viewBox 190×190, r=70 strokeW=26 (ring 57–83, ratio drift), clockwise from 12 o'clock, 2px arc gaps, no sector stroke; DONUT_COLORS = [#8b5cf6, #7c3aed, #a78bfa, #c4b5fd, #22c55e, #e2e8f0] — wrong values AND wrong index mapping; legend shows ALL 6 rows, name slate-300 (#cbd5e1-ish lab 84.8) / count slate-400 (lab 65.5), swatch 10px — **all of F1** |
| L8 | byCategory order determinism | live clone + sqlite query | the dashboard route orders `createdAt asc` with NO tiebreaker; Higiene and Alimentos share a timestamp → Prisma/SQLite tie order is arbitrary (live rendered Alimentos BEFORE Higiene; the sqlite rowid order is the seed order). The ref's donut order = the clone's seed creation order (Lácteos, Limpieza, Higiene, Alimentos, Snacks, Bebidas) — **determinism gap, F1h** |
| L9 | Low-stock card header | DOM + live gap measurement | ref: the H3 ITSELF carries `font-bold text-slate-700 mb-3 flex items-center gap-2` with the amber `lucide-triangle-alert w-5 h-5 text-amber-500` INSIDE; header→list gap **12px**. Clone: wrapper `mb-4 flex items-center gap-2` + icon beside the H3; gap **16px** — **spacing drift, F2** (the chart-card headers are mb-4 on BOTH — only the low-stock card is mb-3 on the ref) |
| L10 | Ajustes section headers | DOM + computed, both | ref: wrapper `flex items-center gap-2 mb-4`, H3 `font-bold text-slate-700` (16px), icon `w-5 h-5` with **per-section colors**: store/**text-indigo-500** (Información), palette/**text-purple-500** (Personalización), **file-text**/**text-green-500** (Ticket/Recibo), credit-card/**text-blue-500** (Proveedor), **tag** (singular)/**text-amber-500** (Categorías). Clone: ALL `h-4.5 w-4.5 text-violet-400` with **receipt-text** and **tags** (plural) substituted — **icon system drift, F3** (the icon+color pattern exists ONLY on Ajustes; every other view's headers are bare on both — verified) |
| L11 | Registers card order | live, both | ref page order: **Caja 2, Caja 1** (Caja 2 = "Área de abarrotes", Caja 1 = "Entrada principal" — locations match). Clone: Caja 1, Caja 2 (createdAt asc + seed created Caja 1 first). Fix = seed order (the ref's ordering rule is backend-internal; the observable page order for the reference data is reproducible by creating Caja 2 first) — **F4** |
| L12 | Inventory rows vs reference | live, both, 12/12 rows | the ref renders all 12 rows; order: Shampoo, Agua, Coca-Cola, Papel Higiénico, Yogurt, Frijoles, Cloro, Leche, Sabritas, Atún, **Jabón Zote 400g**, Pan Bimbo. The clone's seed order differs entirely, and the 12th row was ASSUMED in the dossier era: real values are name **"Jabón Zote 400g"** (not "Barra"), barcode **7501025403010** (not the 7501234567890 placeholder), stock **19** (not 20); price $18.00 / Limpieza match. Every other row's name/barcode/price/stock matches — **F5** |
| L13 | The two historical sales | live, both (table + modals) | ref sale 1 (V-MO6BJT7G): **19/04/26 22:09**, Cesar Martínez, Efectivo, Caja 1, 1x Coca-Cola $21.46 — clone matches except the DATE (relativized "yesterday"). Ref sale 2 (V-MMPNY55Z): **14/03/26 01:45**, 1x **Jabón Zote $20.88** + 1x **Papel Higiénico $40.60** = $53.00/$8.48/$61.48 — the clone seeds 2x Coca-Cola + 1x Sabritas (same totals by coincidence, WRONG items) — **F6/F7** |
| L14 | The historical shifts | live, both (Turnos table) | ref: Cesar × Caja 1 **09/04 01:39 → 19/04 22:16** ($21.46) and **14/03 01:36 → 20/03 03:30** ($61.48). Clone: relativized dates with the same times. Plus one ref-only row: "Demo Cashier, Caja 2, 26/10 01:15→01:19, $0.00" — platform activity from 26/10 (an empty shift opened/closed on the hosted app), **excluded** (not the app's design state) |
| L15 | Reports windows (ref) | live, ticks per window | default active tab on load = **30 días** (both apps); 7 días → 7 ticks (every day); 14 días → **14 ticks (every day)**; 30 días → 8 ticks at **exact 4-day steps from the window start** (27 sep, 1, 5, 9, 13, 17, 21, 25 oct — ends day 28, the last day NOT labeled); 90 días → 9 ticks at **exact 10-day steps** (29 jul … 17 oct, ends day 80). Clone: even-index thinning with forced last label (14 oct/18/22/26 on 30-day; 8 labels on 14-day) — **tick algorithm drift, F8** |
| L16 | Empty-window states (ref) | live | the ref's reports: $0.00 / 0 / $0.00 + "Sin datos en este período" ×2 (its sales are 6 months old); its dashboard chart renders FLAT (bottom line + flat gradient area, y-ticks 0–4). The clone currently shows live data (yesterday's sale) — **the seeded-data fix (F6) closes this too** |
| L17 | Pinned-surface re-checks | live, both | mobile drawer contract FULLY green (288px panel, 8×40px links, 44px pitch, scroll-lock, aria-expanded, Escape + focus return); ref mobile unchanged (220px squeeze, no burger); toasts silent on no-change save (both); chips + Agregar button class-identical; COBRAR 347×70 both; Terminal VLM-parity (the flagged "N avatar" = the Next.js dev-tools portal — dev-only); "Turnos Recientes" headers bare on both; low-stock list rows (slate-700 14px name / amber-600 12px sub) identical; KPI values + date line identical; 404/table contracts standing — **no drift on any pinned surface** |
| L18 | Baseline gates | repo | lint 0 · tsc 0 · build ✓ · unit 363/363 · e2e 115/115 — the v9 close intact |

## 1. Design decisions (resolved)

- **SD-29 (the donut goes recharts-faithful):** rewrite `DonutChart` to the
  measured spec. One pure geometry helper `sectorPath(cx, cy, innerR,
  outerR, a0, a1)` emits each sector as a filled PATH (outer arc → line →
  inner arc → close) with `stroke="#fff" strokeWidth={1}`; the ring is
  innerR 50 / outerR 80 centered at (166.5, 100) inside a `viewBox="0 0 333
  200"` rendered in a full-width, 200px-tall container (max-w matches the
  card). Sectors run **counterclockwise from 3 o'clock** with 2° shaved off
  each side of every slice (the measured padding). The palette is the
  measured ramp `DONUT_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa",
  "#c4b5fd", "#ddd6fe", "#22c55e"]` mapped by ORIGINAL data index (the
  existing L5 colorByName rule stays — one assignment feeds arcs and
  swatches). The empty state keeps the #1e2235 ring.
- **SD-30 (the legend caps at 5):** the legend renders `data.slice(0, 5)`
  (the chart still renders every visible category — 6 sectors for 6
  categories). Inference disclosed: the ref's rule is unobservable; the
  measured behavior for the reference data is "first 5 items in the legend".
  Rows switch to the ref's anatomy: `div.space-y-2.mt-2` under the chart,
  row `flex items-center justify-between text-sm`, swatch `w-3 h-3
  rounded-full` (12px), name `text-slate-600`, count `font-semibold
  text-slate-700` — replacing the current UL/LI slate-300/400 10px rows.
- **SD-31 (byCategory determinism):** the dashboard route's category query
  adds an id tiebreaker (`orderBy: [{ createdAt: "asc" }, { id: "asc" }]`),
  and the seed staggers each category's createdAt (+1 per row) so the dev
  and e2e dbs are deterministic. Same tiebreakers added to the products /
  registers / cashiers delegates (`[{ createdAt: "asc" }, { id: "asc" }]`)
  — the clone's lists become fully deterministic against timestamp ties.
- **SD-32 (the low-stock header's mb-3):** `SectionCard` gains
  `titleClassName` (merged onto the `mb-4 flex items-center gap-2` wrapper);
  the low-stock card passes `mb-3` (the ref's measured 12px gap). The
  chart-card headers keep mb-4 (measured on both).
- **SD-33 (the Ajustes icon system):** the five section headers adopt the
  ref's per-section icon + color at `w-5 h-5`: Store/text-indigo-500,
  Palette/text-purple-500, **FileText**/text-green-500,
  CreditCard/text-blue-500, **Tag**/text-amber-500 (the receipt-text →
  file-text and tags → tag substitutions are part of the contract).
- **SD-34 (seeded data = the reference account):** the seed mirrors the
  reference's observable state exactly —
  products in the ref's page order (Shampoo … Pan Bimbo) with the 12th row's
  real values (Jabón Zote 400g / 7501025403010 / stock 19);
  **Caja 2 created before Caja 1** (page order Caja 2, Caja 1);
  the sales at the ref's exact datetimes — sale 1 at 2026-04-19T22:09:00Z
  (shift 2026-04-09T01:39:00Z → 2026-04-19T22:16:00Z), sale 2 at
  2026-03-14T01:45:00Z (shift 2026-03-14T01:36:00Z → 2026-03-20T03:30:00Z)
  with the REAL items (1x Jabón Zote + 1x Papel Higiénico — totals land on
  the same $61.48); the categories keep the donut's creation order with
  staggered createdAt. Consequences (all toward parity, disclosed): the
  Ventas dates match the ref, the dashboard chart goes flat like the ref's,
  the reports windows render the ref's empty state, and the e2e reports
  pins move to the empty-state contract (below). The relativized "daysAgo"
  seeding is retired — fixed dates are also deterministic across reseeds.
- **SD-35 (the reports tick rule):** `thinLabelIndices` adopts the
  reference's measured algorithm: **windows ≤ 14 days label every day**;
  longer windows step by `ceil((count - 1) / 9)` **from the window start**
  (30 → every 4th day, 8 labels ending day 28; 90 → every 10th day, 9
  labels ending day 80); the last day is NOT force-labeled. The dashboard
  chart (7 points) is unaffected (all 7 labels, both apps).
- **SD-36 (reports e2e realignment):** the two data-bearing reports pins
  move to the reference's own observable state (the seeded sales now fall
  outside every window): transactions 0, revenue $0.00, average $0.00, and
  "Sin datos en este período" in both method sections — asserted against
  the 90-day window (the widest). The aggregation path keeps LIVE coverage:
  the terminal-sales spec gains a post-sale reports assertion (after its
  $64.38 sale, the reports window shows 1 transaction / $64.38). Pins are
  updated to the new contracts, never weakened (the v8/F7 posture).

## 2. Execution batches (TDD: red → green → gate)

### B1 — The donut (F1, SD-29/30/31)
1. `src/components/pos/shared.tsx`: `sectorPath()` pure helper + the
   rewritten `DonutChart` (path sectors, measured geometry/palette/strokes,
   stacked layout, the capped ref-anatomy legend).
2. `src/app/api/dashboard/route.ts`: the byCategory tiebreaker.

### B2 — The low-stock header spacing (F2, SD-32)
1. `SectionCard`: the `titleClassName` prop; the low-stock call passes
   `mb-3`.

### B3 — The Ajustes icon system (F3, SD-33)
1. `settings-view.tsx`: the five measured icon/color pairs at `w-5 h-5`.

### B4 — Seeded data parity (F4/F5/F6/F7, SD-34)
1. `prisma/seed.ts`: product order + the 12th row's real values; Caja 2
   before Caja 1; the exact sale/shift datetimes; sale 2's real items;
   staggered category createdAt.
2. `src/lib/server/entities.ts` + the product list + the dashboard route:
   id tiebreakers everywhere createdAt orders.
3. Reseed `db/custom.db` (reset + seed) — the dev db adopts the new data.

### B5 — The reports tick rule + test realignment (F8, SD-35/36)
1. `thinLabelIndices`: the measured rule (≤14 all; else day-step from
   start, no forced last).
2. `tests/visual-parity.test.ts`: realign the 30-day pin (step 4, ends 28)
   and the 9→all boundary pin.
3. `tests/e2e/reports.spec.ts`: the empty-state parity pins;
   `tests/e2e/terminal-sales.spec.ts`: the live-sale reports assertion.

### B6 — Screenshots + docs lockstep
1. Regenerate the 18 screenshots from the production standalone build
   (`scripts/capture-screenshots-prod.sh` — :3100; the dashboard shot now
   carries the flat chart + new donut; the ventas shot carries 19/04/14 03;
   the inventory shot carries the ref's row order).
2. AGENTS.md contract 23; CLAUDE.md counts + the v10 note; README badge if
   counts move; PAD v1.8.0 + ADR-020; retail-pos_SKILL.md v1.5.0;
   `docs/session_13.md`; worklog; this plan.

## 3. Test plan (pins first — red)

- **Unit (`tests/functional-parity-v10.test.ts`):**
  - `sectorPath`: start/end points at the measured angles (0°→56° for the
    first 60° slice with 2° padding), inner/outer radii 50/80 around
    (166.5, 100), the counterclockwise sweep (the first slice's outer arc
    rises from 3 o'clock).
  - `DONUT_COLORS` pin: the six measured hex values in order.
  - `DonutChart` source pins: viewBox `0 0 333 200`, `stroke="#fff"`, the
    legend cap (`slice(0, 5)`), the ref legend row classes (space-y-2 mt-2,
    w-3 h-3, text-slate-600, font-semibold text-slate-700), the stacked
    layout (no `sm:flex-row`).
  - `thinLabelIndices`: 30 → [0,4,…,28] (8, step 4, NOT ending 29); 90 →
    [0,10,…,80] (9, step 10); 14 → all; 9 → all; 7 → all; 0 → [].
  - `byCategory` ordering source pin (the `[{ createdAt: "asc" }, { id:
    "asc" }]` array in the dashboard route); the delegates' tiebreakers.
  - Seed source pins: the product array's order (first = Shampoo, 11th =
    Jabón Zote 400g / 7501025403010 / 19; last = Pan Bimbo), the Caja 2
    before Caja 1 creation, the exact sale datetimes (2026-04-19T22:09:00Z,
    2026-03-14T01:45:00Z), sale 2's items (Jabón Zote + Papel Higiénico).
  - `SectionCard` source pin: the `titleClassName` prop + the low-stock
    call's `mb-3`.
  - `settings-view` source pins: FileText/Tag imports; the five
    icon+color classes (text-indigo-500 / purple-500 / green-500 /
    blue-500 / amber-500 at w-5 h-5).
- **E2e (`tests/e2e/functional-parity-v10.spec.ts`):**
  - The donut: 6 sector paths with the measured fills (in order), each
    stroke #fff; the first sector's path starts at (246.5, 100) — 3
    o'clock on the 333×200 viewBox; the legend renders exactly 5 rows,
    name color rgb(71, 85, 105), count color rgb(51, 65, 85), swatch 12px.
  - The low-stock header gap: 12px (header bottom → first row top).
  - Ajustes headers: the five icons' computed colors (99,102,241 /
    168,85,247 / 34,197,94 / 59,130,246 / 245,158,11) at 20px.
  - Inventory: the first row is Shampoo Pantene 400ml; the 11th row is
    "Jabón Zote 400g" with stock 19.
  - Registers: the cards render Caja 2 first.
  - Ventas: the first row's date cell reads "19/04/26 22:09"; the ticket
    modal lists "1x Jabón Zote 400g" + "1x Papel Higiénico…".
  - Reports (default 30 días): the X labels are exactly [27 sep, 1 oct,
    5 oct, 9 oct, 13 oct, 17 oct, 21 oct, 25 oct]; the KPIs read $0.00 /
    0 / $0.00; both method sections show "Sin datos en este período".
  - Dashboard: the weekly chart's area path is flat at the bottom (all
    y equal) with fill url(#salesGrad) — the ref's empty-window posture.
- **Legacy pin realignment (updated, not weakened):** visual-parity.test.ts
  30-day thinning (last index 29 → 28, exact step 4) + the 9-label
  boundary (8 → all 9); reports.spec.ts's two data pins (the seeded sales
  now sit outside every window — the ref's own empty state) with the
  aggregation coverage moving to a LIVE post-sale assertion in
  terminal-sales.spec.ts.
- Full gate after each batch: `bun run lint` · `bun run typecheck` ·
  `bun run build` · `bun run test` · `bunx playwright test`.

## 4. Ship

1. Screenshots (B6.1); VLM spot-check the donut card + the reports page.
2. Docs lockstep (B6.2); worklog entry; `docs/session_13.md`; commit; push
   via the SSH wrapper (main only).

## 5. Out of scope (disclosed)

- The ref's "Demo Cashier" shift (Caja 2, 26/10 01:15→01:19, $0.00) —
  live platform activity on the hosted app, not its design state; not
  mirrored (the clone's Turnos table shows the two historical shifts).
- The ref's Cajeros page "0 usuarios registrados" empty state — the
  clone's seeded Cesar Martínez + CRUD is the documented superset (the
  Terminal's selling flow needs a cashier).
- The ref's Ajustes category LIST order (Snacks first — its backend's
  internal order); the DONUT order is the visible color-mapping contract
  and is matched. The legend's slice(0,5) cap is an inference (the ref's
  internal rule is unobservable).
- The ref's register-card ordering RULE (backend-internal); the seed order
  reproduces the observable page order for the reference data.
- The donut tooltip (the ref's recharts tooltip only renders on hover with
  a white default skin — the clone's chart stays tooltip-free like the
  v5-era decision; disclosed).
- Standing disclosures unchanged: SD-14 og:url/canonical, SD-18 readable
  Total tone, SD-19 mailto transport, SD-20 public 404/signup superset,
  SD-23 Spanish-path 404s, the "Detalle por método" table skin (now
  empty-on-both — still unobservable), in-memory limiter, terminal grid.

## 6. Execution results (2026-10-27, all green)

- **B1** shipped as planned: `sectorPath()` (the pure geometry helper —
  filled sector paths, counterclockwise from 3 o'clock, TRAILING-only 4°
  gap; the first slice's M point is literally `246.5,100` like the ref,
  and the Snacks slice's trailing endpoint matches the ref's own S5 arc
  digit-for-digit) + the rewritten `DonutChart` (the 333×200 box, ring
  50/80 at (166.5,100), #fff 1px strokes, the measured palette, the
  stacked chart-over-legend layout, the 5-row legend with the ref's
  anatomy) + the dashboard route's byCategory tiebreaker. One measurement
  refinement mid-execution: the ref's sector padding is TRAILING-only
  (every sector starts exactly at its boundary and ends 4° short —
  [0,56]/[60,116]/[120,176]/[300,356]), not the initially-assumed
  symmetric 2°+2°; the S4/S5 boundary carries a 2° recharts float
  anomaly (unobservable rule, disclosed in §5).
- **B2** shipped: `SectionCard titleClassName` + the low-stock card's
  mb-3 (the 12px header→list gap, live-verified 12px after the fix).
- **B3** shipped: the five measured icon+color pairs at w-5 h-5
  (FileText and Tag replace receipt-text/tags; per-section colors replace
  the uniform violet-400).
- **B4** shipped: the seed rewritten to the reference account's
  observable state (product page order + the real 12th row, Caja 2 first,
  the exact April/March datetimes, the second sale's real items, the
  staggered createdAt); the id tiebreakers on the delegates + product
  list + byCategory; db/custom.db reset + reseeded twice (the second
  reseed adopted the capture script's default-password contract after the
  first reseed's screenshots captured the login page — the script's login
  is hardcoded, and a password mismatch produced 8 identical shots; the
  run was repeated clean).
- **B5** shipped: `thinLabelIndices` on the ref's rule (≤14 → every day;
  30 → [0,4,…,28]; 90 → [0,10,…,80]); the two v3-era pins realigned
  (the 30-day "first and last kept" inference retired — the ref's last
  label is day 28; the 9→8 boundary pin retired — the ref labels every
  day up to 14); reports.spec's two data pins moved to the ref's
  empty-state contract; terminal-sales gained the LIVE post-sale reports
  assertion (order-robust numerics — earlier specs' sales are tolerated).
- **Legacy pin alignment (updated, not weakened):** visual-parity.test.ts
  (2 pins), reports.spec.ts (2 pins), helpers.ts SEEDED_PRODUCTS (the
  ref's page order + the real 12th name), hygiene.test.ts's L5 pin held
  verbatim (both donut consumers still read the one colorByName map).
- **Gate: lint 0 · tsc 0 · build ✓ · unit 379/379 (363+16) · e2e 127/127
  (115+12).** Docs lockstep: AGENTS.md contract 23, CLAUDE.md counts +
  the v10 block, README badge (379+127), PAD v1.8.0 + ADR-020 +
  §8 counts, retail-pos_SKILL.md v1.5.0, session_13.md, worklog, this
  plan.
- **Evidence:** all 18 screenshots regenerated from the production
  standalone build (the dashboard shot now carries the flat chart + the
  recharts donut; the ventas shot carries 19/04/26 22:09; the inventory
  shot carries the ref's row order); VLM + pixel-verified (both donuts
  full rings at all 8 sampled angles with the same color sequence; the
  low-stock card 1172px on both; the KPI/date line identical; the
  "semi-circular gauge" and "N avatar" VLM flags were misreads — the
  pixel probes and DOM geometry settled both).
- **Probe lessons recorded:** (1) a VLM's shape claims need pixel
  settlement — the "semi-circular gauge" reading was wrong at the pixel
  level twice; (2) Tailwind v4's compiled palette genuinely differs from
  the v3 hex values (indigo-500 compiles to #625fff, amber-500 to
  #f99c00, slate-600 to #45556c) — computed-color pins must be CLASS-based
  (the standing idiom), not rasterized-value-based; (3) e2e evaluates
  need data-loaded waits (the SPA renders "Cargando…" and $0.00/0
  placeholders that are indistinguishable from the loaded-empty state);
  (4) test-order pollution is real within one e2e run — order-robust
  numeric assertions (≥ the spec's own contribution) survive earlier
  specs' sales; (5) a running dev server holds the deleted SQLite inode
  after a reset — restart it before re-probing; (6) the capture script's
  hardcoded login password is a reseed contract — a password-mismatched
  db yields N identical login screenshots (loud enough to notice, but
  check the shot sizes).
