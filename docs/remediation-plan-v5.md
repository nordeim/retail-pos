# VeloxPOS — Remediation Plan v5 (Session V5, 2026-10-26)

> Scope: the view-internals parity audit. Baseline re-verified before audit:
> `main @ 7ddacdb`, gates green (lint 0 · tsc 0 · unit 239/239 · build ✓ ·
> e2e 74/74 per v4's closing run).
>
> Method: agent-browser logged into BOTH apps side by side (reference auth
> state reused); every candidate gap verified with LIVE computed-style probes
> and full-DOM dumps (VLM pair-comparisons of fresh 8-view screenshot sets
> used for discovery only). Evidence labels: **Verified** (executed here,
> live), **Reasoned** (inference from code/DOM), **Assumed** (documented
> decision).
>
> History: v3 (security/integrity/parity/hygiene — `d91fe91`), v4 (radius,
> card system, glass buttons, nav + auth parity — `d04e6f4`). v4 fixed the
> SYSTEM-level design tokens; this v5 sweeps the VIEW INTERNALS the systems
> compose into: tables, pills, the terminal's layout skeleton, per-view
> leftovers, plus two hygiene finds.

## 0. Verification ledger (all live, ref = veloxposretail.base44.app vs clone = localhost:3000)

| # | Check | Method | Result |
|---|---|---|---|
| L1 | Baseline gates | lint/tsc/vitest executed | 0 · 0 · **239/239** (docs say 238 — count drift, H3) |
| L2 | App shell gutter | getBoundingClientRect both | ref: sidebar 0–220, main x=220, H1 x=244 (wrapper p-6). Clone: sidebar 0–220, main x=**244** (`lg:ml-[244px]`), H1 x=**268** — a 24px EXTRA gutter — **drift, G1** |
| L3 | Per-view wrappers | DOM walk all 8 ref views | non-terminal = `p-6 space-y-6` (Ajustes + `max-w-4xl`); Terminal = `flex h-screen overflow-hidden` (full-bleed, p-0) — clone pads ALL views incl. terminal and wraps Ajustes in `max-w-3xl` — **drifts, T7 + G2** |
| L4 | Ventas table | DOM+computed both | ref headers `text-xs font-semibold text-slate-500 uppercase px-5 py-3` (+per-col align); rows `border-b border-slate-50 hover:bg-white/40`; ticket cell `font-mono text-sm font-semibold text-indigo-600`; body `text-sm text-slate-600`; total `text-right font-bold text-slate-800`. Clone: `text-[11px] font-bold tracking-wider py-3.5` headers, `border-[#1e2235] hover:bg-white/[0.02]` rows, `text-violet-400` (no mono), `text-slate-400` px-4, `font-semibold text-slate-500` — **drift, T1** |
| L5 | Estado pills | DOM+computed ref | table badges = shadcn Badge `rounded-md … bg-green-100 text-green-700` (Completada/Activo) and `bg-slate-100 text-slate-500` (Cerrado) — **6px radius**, not full. Register-card pill = `px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500` (Cerrada). Clone StatusPill = `rounded-full bg-emerald-400/90 text-emerald-950` everywhere — **drift, T2** |
| L6 | Method pill | DOM ref | shadcn outline badge `rounded-md border px-2.5 py-0.5 text-xs font-semibold text-foreground gap-1` + banknote `w-3 h-3`. Clone `rounded-lg bg-[#12141f] border-[#262a36]` — **drift, T2** |
| L7 | Search inputs | computed both | ref `h-9 border-input bg-transparent` radius **12px**, icon `text-slate-400`, wrapper `relative max-w-md`. Clone radius 6px, `bg-[#12141f]` override, icon slate-500 — **drift, T3** |
| L8 | Terminal layout | DOM walk ref | ref = `main flex h-screen overflow-hidden` → left `flex-1 flex flex-col p-4 gap-4 overflow-hidden min-w-0` + right rail `w-full md:w-[380px] flex flex-col rounded-none border-l border-[#1e2235] p-4 min-h-0 bg-[#0d0f1a]` — a FULL-HEIGHT RAIL, no page padding, no page scroll. Clone = padded grid page + ticket as sticky `vx-card` — **drift, T7** |
| L9 | "Agregado" | DOM ref | NOT a label — a transient success BANNER (hidden `max-h-0 opacity-0`): `bg-gradient-to-r from-emerald-600/80 to-teal-600/70 rounded-2xl px-4 py-3 border-emerald-500/30` + CircleCheck `w-6 h-6 text-emerald-300` + "Agregado" `text-[10px] font-bold uppercase tracking-widest text-emerald-300/70` + product name `text-lg font-black text-white truncate`. Clone renders a PERMANENT "Agregado" label — **drift, T4** |
| L10 | Ticket header | computed ref | h2 "Ticket" = **12px/700/white-80/uppercase/0.3px tracking** in `flex items-center justify-between mb-3`. Clone = 18px `text-slate-100` "TICKET" — **drift, T5** |
| L11 | Ticket empty state | DOM ref | `flex-1 overflow-y-auto min-h-0` scroll area; empty = `flex flex-col items-center justify-center h-full text-white/20 py-8` + cart svg **64px** strokeWidth 1.5 + p `text-sm mt-3 text-white/25`. Clone 48px slate-600 + slate-400, fixed py-12 — **drift, T5** |
| L12 | Ticket footer | DOM ref | `mt-auto pt-4 border-t border-white/5 space-y-3` — when EMPTY only the COBRAR button renders (no totals rows). COBRAR icon = **ShoppingBag** `w-6 h-6`. Clone: totals always + Banknote icon + `mb-3 border-[#1e2235] pt-3` — **drifts, T5/T6** |
| L13 | Terminal empty state | DOM ref | card `rounded-2xl text-center p-8 max-w-md` (vx-card system) + Monitor `w-16 h-16 text-violet-400/30 mx-auto mb-4` + h2 `text-xl font-bold text-white/70 mb-2` + p `text-white/35 text-sm` + `<strong class="text-white/60">Cajas</strong>`. Clone: h-12 full violet-400, slate-100 h2, slate-400 p, p-10 min-h card, underlined button — **drift, T8** |
| L14 | Register cards | DOM both | ref: strip `h-1 bg-slate-200`; chip `w-12 h-12 rounded-xl bg-slate-50` + Monitor `w-6 h-6 text-slate-400`; h3 `font-bold text-slate-800`; location `text-xs text-slate-500`; pill rounded-full (L5); delete `p-2 text-slate-400`. Clone: `h-1.5 bg-slate-100/90`, `h-11 w-11` chip, `text-slate-400` h3, `text-sm` location, `p-2.5 text-slate-500` delete — **drift, R1** |
| L15 | Cajeros | DOM both | ref "Turnos Recientes" heading = `font-bold text-slate-700 mb-4` (16px title-case). Shifts table: headers `px-4 py-2`, rows `border-b border-slate-50` (no hover), cells `px-4 py-2.5` — name `text-sm font-medium text-slate-700`, others `text-sm text-slate-500`, ventas `text-sm font-bold text-slate-800 text-right`, estado centered + `bg-slate-100 text-slate-500` badge. Clone: violet uppercase heading, px-5/py-3.5 + hover rows — **drifts, C1** |
| L16 | Reports H1 + chips | computed ref | Reports H1 = `text-2xl font-bold text-white/90` (**white**, unlike every other view's slate-800 — VLM flagged). Summary chips = `w-12 h-12 rounded-2xl` + **15% tinted bg + 30% colored border + colored icon** (indigo/emerald/violet) — NOT gradients: Ingresos `bg-indigo-500/15 border-indigo-500/30` + TrendingUp `text-indigo-400`; Transacciones emerald + CalendarDays; Ticket promedio `bg-violet-500/15 border-violet-500/30` + CreditCard `text-violet-400`. Clone: slate-800 H1 + gradient chips — **drifts, F1/F2** (v4's gradient-chip probe measured the wrong element family) |
| L17 | Dashboard grids | DOM ref | stats `grid grid-cols-2 lg:grid-cols-4 gap-4`; chart row `grid grid-cols-1 lg:grid-cols-3 gap-6` (chart spans 2). Clone `sm:grid-cols-2 xl:grid-cols-4` + `lg:grid-cols-[1.6fr_1fr] gap-4` — **drift, F3** |
| L18 | Low-stock row icon | DOM ref | chip icon Package `w-5 h-5 text-amber-600`. Clone `h-4.5 w-4.5` — **drift (minor), F4** |
| L19 | Settings | DOM+computed ref | wrapper `max-w-4xl`; Guardar = `glass-button-primary px-6 py-3.5 text-base` (≈54px); swatches `w-10 h-10 rounded-lg` (no border); Agregar = `glass-button text-slate-700 px-3 py-1.5 text-sm rounded-lg`; category chips = `glass-button rounded-xl px-3 py-2 text-sm font-medium text-slate-700` + X `text-slate-400 hover:text-red-500`; inputs `bg-transparent`. Clone: max-w-3xl, 36px Guardar, `w-14 h-10` bordered swatches, outline Agregar, custom-border chips, `bg-[#0d0f1a]` inputs — **drifts, S1** |
| L20 | Inventory producto cell | DOM ref | chip `w-10 h-10 rounded-lg bg-indigo-50` + Package `w-5 h-5 text-indigo-300`; name `font-semibold text-sm text-slate-800`; código `text-sm text-slate-500 font-mono`; precio `text-sm font-bold text-slate-800 text-right`; stock `text-sm font-bold text-slate-700` right; categoría = secondary badge `bg rgb(33,37,49) / text rgb(182,188,201) / rounded-md`. Clone: h-9 chip slate-50, `font-medium text-slate-400` name, no mono, no bold/right — **drift, T1b** |
| L21 | Icon-button hovers | source grep clone | v4 fixed inventory only; sales + cashiers still `hover:bg-white/5 hover:text-violet-300` / `hover:text-red-400` — **drift, T9** |
| L22 | button.tsx tokens | grep | `default`/`gradient`/`neutral` variants reference `sf-*` classes that DO NOT EXIST in globals.css (dead study-app remnants); `outline` carries light-theme hardcoded colors; stale study comments — **hygiene, H1** |
| L23 | Mobile chrome (clone) | live at 390×844 | sidebar hidden, app-bar + hamburger present, drawer contract e2e-green — superset intact, **no action** |
| L24 | Reference mobile | live at 390×844 | 220px sidebar still `display:flex`, no hamburger, content squeezed — re-confirmed; clone drawer remains the superset — **no action** |

Non-gaps re-verified (no action): COBRAR 70px geometry + emerald ramp; nav
active pill; vx-card system; period tabs; low-stock row tint; auth surfaces;
H1 24px on non-report views; section-card variants; glass Subir logo;
dashboard stack StatCard (blob + gradient chip stays — L16's chip finding is
reports-row-only); donut palette (ref renders empty — unobservable, disclosed);
status pills' text content; Spanish copy; date formats.

## 1. Design decisions (resolved)

- **SD-2 (muted table text):** the reference's tables render `text-slate-600`
  body text, `border-slate-50` hairlines and a `hover:bg-white/40` wash on
  translucent dark cards — the same muted design language as its slate-800
  headings (v3 SD). We MATCH it exactly; the a11y smoke's color-contrast
  exclusion already covers this disclosed deviation.
- **SD-3 (two pill shapes):** the reference ships TWO badge systems — shadcn
  `rounded-md` badges inside tables (green-100/green-700, slate-100/slate-500)
  and a `rounded-full` status pill on register cards. Both are reproduced;
  `StatusPill` gains a shape/variant split instead of one-forcing-the-other.
- **SD-4 (superset states):** unobservable states (Abierta/Abierto pills,
  open-register strip, ticket lines, Agregado banner with a real product)
  extend the reference's own soft-badge / tint language: `green-100/green-700`
  for open, emerald strip for the open register, the Agregado banner uses the
  reference's own extracted markup verbatim.
- **SD-5 (terminal mobile):** the reference's mobile terminal is squeezed
  beside its always-visible sidebar (broken). The clone keeps its superset
  mobile flow (app bar + drawer + page scroll, ticket stacked `w-full`); the
  full-height rail + `h-screen` two-pane layout applies from `lg:` up.
- **SD-6 (reports H1):** Reports is the reference's ONLY white/90 H1 — a
  deliberate tone break in their design. Reproduced via a `tone` prop on
  PageHeading rather than a one-off local heading.
- **SD-7 (Cajas link):** the terminal empty state's "Cajas" keeps the clone's
  clickable navigation (superset) but renders as the reference's
  `<strong class="text-white/60">` (no underline) — visual parity, functional
  superset.

## 2. Execution batches (TDD: red → green → gate)

### B1 — App shell (G1, G2)
1. **G1** `page.tsx`: `lg:ml-[244px]` → `lg:ml-[220px]`, `lg:ml-[92px]` →
   `lg:ml-[68px]` (content flush to the sidebar's border; the view's own p-6
   provides the gutter — H1 lands at x=244 like the reference).
2. **G2** `page.tsx`: all-view bottom padding `lg:pb-8` → `lg:pb-6`; when
   `view === "terminal"`, main additionally drops `lg:px-6 lg:pt-6 lg:pb-6`
   and gains `lg:h-screen lg:overflow-hidden` (the terminal manages its own
   panes).

### B2 — Table system + pills (T1, T2, T9, T1b)
1. **T2** `shared.tsx`: `StatusPill` splits into `variant="table"`
   (`rounded-md border-transparent px-2.5 py-0.5`; success `bg-green-100
   text-green-700`, neutral `bg-slate-100 text-slate-500`, warning
   `bg-amber-100 text-amber-700`, danger `bg-red-100 text-red-700`) and
   `variant="card"` (`rounded-full px-2.5 py-1`; same soft ramps). `MethodPill`
   → the shadcn outline badge (`rounded-md border px-2.5 py-0.5 text-xs
   font-semibold gap-1 text-foreground` + banknote `h-3 w-3`), no bg fill.
2. **T1** `sales-view.tsx`: thead row → per-th `text-xs font-semibold
   text-slate-500 uppercase` + alignment (Ticket/Fecha/Cajero left, Método
   center, Total right, Estado center, Acciones right) + `px-5 py-3`; rows →
   `border-b border-slate-50 transition-colors last:border-0 hover:bg-white/40`;
   ticket cell `px-5 py-3 font-mono text-sm font-semibold text-indigo-600`;
   fecha/cajero `px-5 py-3 text-sm text-slate-600`; total `px-5 py-3
   text-right font-bold text-slate-800`; método/estado cells `text-center`.
3. **T1b** `inventory-view.tsx`: same row/header treatment; producto chip →
   `w-10 h-10 rounded-lg bg-indigo-50` + Package `w-5 h-5 text-indigo-300` +
   name `font-semibold text-sm text-slate-800`; código `px-5 py-3 text-sm
   text-slate-500 font-mono`; precio `px-5 py-3 text-sm font-bold
   text-slate-800 text-right`; stock `px-5 py-3 text-right` + span
   `text-sm font-bold text-slate-700`; categoría badge → `rounded-md
   bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground`;
   estado `text-center`.
4. **T9** `sales-view.tsx` + `cashiers-view.tsx` icon buttons: edit →
   `hover:bg-indigo-50 hover:text-indigo-600`, delete → `hover:bg-red-50
   hover:text-red-500` (v4's inventory contract).
5. Empty-row states + search wrappers stay (unobservable on the ref).

### B3 — Inputs (T3)
1. `ui/input.tsx`: base `rounded-md` → `rounded-xl` (12px — the reference's
   computed input radius); update the stale S5 comment.
2. Call-site sweep: remove every `bg-[#12141f]` / `bg-[#0d0f1a]` input
   override (terminal/sales/inventory searches, settings inputs, payment
   dialog); search icons `text-slate-500` → `text-slate-400`; settings
   textarea → `border-input bg-transparent`.

### B4 — Terminal parity (T4–T8)
1. **T7** `terminal-view.tsx` root → `flex h-full flex-col lg:h-screen
   lg:flex-row lg:overflow-hidden`; left pane `flex flex-1 flex-col gap-4 p-4
   lg:min-w-0 lg:overflow-y-auto`; ticket rail → `flex w-full flex-col
   rounded-none border-l border-[#1e2235] bg-[#0d0f1a] p-4 md:w-[380px]
   lg:min-h-0` (no card, no sticky).
2. **T4** remove the permanent "Agregado" label; add the transient banner
   (always in DOM, `max-h-0 opacity-0` when idle): wrapper `transition-all
   duration-300 overflow-hidden` + inner `bg-gradient-to-r
   from-emerald-600/80 to-teal-600/70 rounded-2xl px-4 py-3 flex items-center
   gap-3 border border-emerald-500/30` + CircleCheck `h-6 w-6
   text-emerald-300` + "Agregado" `text-[10px] font-bold uppercase
   tracking-widest text-emerald-300/70` + product name `truncate text-lg
   font-black text-white`; shown for ~1.6s on `ticketAdd`.
3. **T5** ticket header → h2 "Ticket" `text-xs font-bold uppercase
   tracking-wide text-white/80` in `mb-3 flex items-center justify-between`;
   empty state → `flex-1 min-h-0 overflow-y-auto` area + inner `flex h-full
   flex-col items-center justify-center py-8 text-white/20` + ShoppingCart
   64px strokeWidth 1.5 + p `mt-3 text-sm text-white/25`; footer → `mt-auto
   space-y-3 border-t border-white/5 pt-4`, totals block ONLY when
   `ticket.length > 0`.
4. **T6** COBRAR icon → `ShoppingBag` (both states, `h-6 w-6`); ticket line
   list → `flex-1 min-h-0` internal scroll (drop `max-h-[46vh]`).
5. **T8** no-shift empty state → card `vx-card max-w-md p-8 text-center` (no
   min-h/p-10) wrapped in `flex flex-1 items-center justify-center`; Monitor
   `h-16 w-16 text-violet-400/30`; h2 `mb-2 text-xl font-bold text-white/70`;
   p `text-sm text-white/35` with the Cajas link as `font-bold text-white/60`
   (no underline, keeps navigation).
6. Payment dialog: input bg overrides dropped (B3); testids preserved.

### B5 — Registers cards (R1)
strip `h-1 bg-slate-200` (closed) / `h-1 bg-emerald-500` (open, superset);
chip `w-12 h-12 rounded-xl bg-slate-50` + Monitor `h-6 w-6 text-slate-400`;
h3 `font-bold text-slate-800`; location `text-xs text-slate-500`; status pill
→ `StatusPill variant="card"` (Cerrada slate-100/slate-500; Abierta
green-100/green-700 per SD-4); delete `p-2 text-slate-400`.

### B6 — Cajeros (C1)
"Turnos Recientes" h3 → `mb-4 font-bold text-slate-700` (title case);
shifts-table headers `px-4 py-2` + alignment; rows `border-b border-slate-50`
(no hover); cells `px-4 py-2.5` — name `text-sm font-medium text-slate-700`,
caja/inicio/fin `text-sm text-slate-500`, ventas `text-sm font-bold
text-slate-800 text-right`, estado `text-center` + table badges (Cerrado
slate, Abierto green per SD-4). Cashier CRUD table keeps the B2 treatment.

### B7 — Reports + dashboard (F1–F4)
1. **F1** `PageHeading` gains `tone?: "default" | "bright"`; reports passes
   `bright` → H1 `text-white/90`.
2. **F2** `StatCard` row-variant chips → tinted (NEW tint map, row layout
   only): primary `bg-indigo-500/15 border-indigo-500/30 text-indigo-400`,
   success emerald, info `bg-violet-500/15 border-violet-500/30
   text-violet-400` (the stack/blob gradients stay — different element
   family, v4-verified).
3. **F3** dashboard stats grid → `grid grid-cols-2 gap-4 lg:grid-cols-4`;
   chart row → `grid grid-cols-1 gap-6 lg:grid-cols-3` with the weekly chart
   `lg:col-span-2`.
4. **F4** low-stock chip icon `h-4.5 w-4.5` → `h-5 w-5`.

### B8 — Settings (S1)
wrapper `max-w-3xl` → `max-w-4xl`; Guardar → `glass-button-primary h-auto
rounded-xl px-6 py-3.5 text-base font-medium`; swatches → `h-10 w-10
rounded-lg` (drop `w-14` + border); Agregar → `glass-button text-slate-700
rounded-lg px-3 py-1.5 text-sm font-medium` (drop outline variant); category
chips → `glass-button rounded-xl px-3 py-2 text-sm font-medium text-slate-700`
+ X `text-slate-400 hover:text-red-500 transition-colors`.

### B9 — Hygiene + docs lockstep (H1–H4)
1. **H1** `button.tsx`: purge the dead `gradient`/`neutral` variants and all
   `sf-*` references; `default` → real tokens (`bg-violet-600
   hover:bg-violet-500 text-white`); `outline` → dark-app tokens (`border
   border-input bg-transparent text-foreground hover:bg-white/5`); comments
   rewritten to the retail domain.
2. **H2** input.tsx comment (folded into B3.1).
3. **H3** CLAUDE.md test count 238 → (post-v5 count); README badge count;
   README quick-start repo name `web-retail-pos` → `retail-pos` (2 places);
   README docs-map `capture-screenshots.sh` → `.ts`.
4. AGENTS.md: new contracts (§ tables/pills two-shape system, § terminal rail
   + gutter, § reports tone); PAD v1.3.0 + ADR-015 (view-internals parity +
   shell gutter); retail-pos_SKILL.md §4/§15; `.env.example` re-verified (no
   change expected); worklog entry.

## 3. Test plan (pins first — red)

- **Unit (`tests/visual-parity-v5.test.ts`):** source pins for every batch —
  page.tsx gutter classes + terminal full-bleed condition; StatusPill
  table/card variants + soft ramps; MethodPill outline badge; sales/inventory
  table contracts (headers, rows, per-cell classes); terminal contracts
  (banner markup, 12px Ticket header, empty states, ShoppingBag, rail
  classes); registers card contract; cajeros heading + shifts-table contract;
  PageHeading tone; StatCard row tints; dashboard grids; settings contract;
  input.tsx rounded-xl + no call-site bg overrides; button.tsx has no sf-*.
- **E2e (`tests/e2e/visual-parity.spec.ts` v5 block):** computed probes — H1
  lands at x=244; table header 12px/600/uppercase; row hairline
  (border-bottom color); Completada pill 6px radius + green-100 bg; ticket
  rail full-height + border-l + solid `rgb(13,15,26)`; Ticket h2 12px;
  settings Guardar ≈54px; reports chip bg `rgba(99,102,241,0.15)` + border
  `rgba(99,102,241,0.3)`; input radius 12px.
- **Existing pins to re-check:** v4's COBRAR geometry (icon change only),
  v3's low-stock row (icon size), terminal-sales e2e (testids preserved),
  mobile-navigation TRAP-4 (drawer untouched), a11y smoke.
- Full gate after each batch: `bun run lint` · `bun run typecheck` ·
  `bun run test` · `bun run build` · `bunx playwright test`.

## 4. Ship

1. Regenerate the 18 screenshots (`bun scripts/capture-screenshots.ts`).
2. VLM spot-check the changed views (terminal, sales, inventory, cajeros,
   registers, reports, settings) against the fresh reference set.
3. Docs lockstep (B9.3/.4); worklog entry; commit; push via the SSH wrapper
   (main only).

## 5. Out of scope (disclosed)

- Donut palette + populated-legend design (reference renders empty —
  unobservable; v4 disclosure unchanged).
- In-memory rate limiter single-instance; no SMTP channel; URL-based image
  storage (v3/v4 disclosures, unchanged).
- Terminal product-grid card design (unobservable on the reference — its
  terminal can never leave the empty state; the clone's card design is the
  documented superset).
- Reference category-chip ORDER on Inventario (data ordering, not styling).
