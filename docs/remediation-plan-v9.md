# VeloxPOS — Remediation Plan v9 (Session V8→v9, 2026-10-26)

> Scope: the Spanish route aliases that silently render the Terminal, the
> document-title algorithm (view-driven vs the reference's path-driven
> exact-case + slug-case), the table-level `text-sm` that shrinks the Ventas
> Total (ref 16px → clone 14px), the `--foreground` token drift, the
> two chart skins the reference renders (Dashboard vs Reports measure
> DIFFERENTLY — one component currently serves both), and the screenshot
> methodology (the Next.js dev badge leaked into the shipped captures).
> Baseline re-verified before audit: `main @ b7f0237` (the v8 close plus the
> remote's `docs/session_10.md` transcript — the only delta after the v8
> push), gates green (lint 0 · tsc 0 · unit 342/342 · build ✓ · e2e 105/105).

> Method: source audit of the v8 diff (all clean — every v8 contract holds)
> + a fresh agent-browser sweep of BOTH apps focused on the surfaces no
> prior session had probed: the route ALIAS space (Spanish names, case
> variants — the rewrites accept more paths than the view map resolves),
> the per-view TABLE typography, the chart SVG internals (gridlines,
> gradient, line, axis labels — never measured pre-v9), and a dashboard
> VLM diff. Every pinned surface from v4-v8 was re-probed for drift —
> **no drift** (mobile drawer contract fully green live: 288px panel,
> 8×40px links, uniform 44px pitch, scroll-lock, aria-expanded, Escape +
> focus return to the hamburger; shell, pills, low-stock card 1012px both,
> 404 pages identical, KPI casing is CSS-uppercased on both — invisible).

> History: v3 security/integrity (`d91fe91`), v4 design system (`d04e6f4`),
> v5 view internals (`980dfe4`), v6 functional superset + head (`aeea5d5`),
> v7 titles + data lifecycle (`8b251eb`), v8 from_url round-trip + modal
> chrome (`00edb12`).

## 0. Verification ledger (all live unless noted; ref = veloxposretail.base44.app vs clone = localhost:3000)

| # | Check | Method | Result |
|---|---|---|---|
| L1 | Spanish route aliases (`/Ventas` `/Inventario` `/Cajas` `/Cajeros` `/Reportes` `/Ajustes`) | live, clone: full navigations | the rewrites accept all six (next.config.ts lists them) but `viewFromPath()` only maps the ENGLISH canonical paths — every Spanish alias falls to the **terminal fallback**: the URL stays `/Ventas` while the TERMINAL renders (title "VeloxPOS", no view H1). `router.ts`'s own `isKnownPath` comment claims "case-insensitive + the Spanish names" are accepted — **the superset is half-implemented — gap, F1** |
| L2 | The reference's own Spanish-path behavior | live, ref | ALL six Spanish paths **404** on the ref (title slug-cased: "Cajas \| VeloxPOS" + "Página no encontrada") — the clone's accepted-alias superset stands, but must render the right VIEW |
| L3 | Case-variant paths (`/sales` `/SALES` `/dashboard` `/DASHBOARD` `/storesettings`) | live, both | BOTH render the view (Next's rewrite matching is case-insensitive; the ref's SPA router is too). Ref titles are **path-driven**: `/sales`→"Sales", `/SALES`→"SALES", `/DASHBOARD`→"DASHBOARD", `/storesettings`→"Storesettings" (slug-case = first-letter-upper per hyphen-word, rest preserved). Clone titles are **view-driven** (case-insensitive canonicalization): every variant → the canonical title ("Sales", "Store Settings"). **Title drift, F2** |
| L4 | The ref's title algorithm (pinned) | live, ref, 9 probes | exact-case match against the canonical path → that route's canonical title ("/StoreSettings" → "Store Settings \| VeloxPOS"); EVERYTHING else slug-cases ("/storesettings" → "Storesettings", "/INVENTORY" → "INVENTORY", "/ventas" → "Ventas", "/foo-bar-baz" → "Foo Bar Baz"); "/" → bare "VeloxPOS". The 404 page and the view render INDEPENDENTLY of the title (the ref renders the VIEW for `/sales` but slug-titles it) |
| L5 | Ventas/Inventory/Cashiers table cells | DOM + computed, both | per-CELL classes are **identical** on both apps (ticket `font-mono text-sm font-semibold text-indigo-600`, date `text-sm text-slate-600`, total `text-right font-bold text-slate-800`, pill `inline-flex … px-2.5 py-0.5 text-xs font-semibold`). The TABLE element differs: ref `w-full` (16px base) vs clone `w-full min-w-[…] text-sm` (14px) — so every cell WITHOUT its own `text-sm` (the Ventas **Total**, inventory name/stock/actions TDs, shifts estado TD) renders **16px on the ref, 14px on the clone — drift, F3** |
| L6 | `--foreground` token | computed, both | ref body default + `text-foreground` elements = **rgb(231,233,239) = #e7e9ef**; clone = rgb(248,250,252) = #f8fafc (globals.css `--foreground: 248 250 252`). Affects the MethodPill text, inputs, selects, outline buttons — **token drift, F4** (subtle; VLM sees no difference, but the v8 dialog sweep already established #e7e9ef as the ref's dialog text) |
| L7 | Dashboard chart SVG internals | DOM attrs, both | ref: gridlines **#e2e8f0 dash "3 3"** (LIGHT slate-200 — prominent), axis labels **#94a3b8 12px**, area = **linearGradient id `salesGrad` #6366f1 stop-opacity 0.3 (offset 5%) → 0 (95%)**, line **#6366f1 strokeWidth 2.5**. Clone: gridlines #262a36 "3 4", labels #64748b 11px, area flat rgba(139,92,246,0.12), line #8b5cf6 w2 — **drift, F5/F6/F7/F8** |
| L8 | Reports chart SVG internals | DOM attrs, both | the ref's Reports chart is a **SECOND SKIN**: gridlines **rgba(255,255,255,0.04) "3 3"**, labels **rgba(255,255,255,0.3) 11px**, same `salesGrad` gradient but stop **0.35**, line **w2**. The clone renders BOTH pages with the one dashboard-ish skin — **the variant is the fix** |
| L9 | Mobile drawer contract | live, clone @390px | fully green: 288px panel (`w-72`), 8 links × 40px, uniform 44px pitch, body scroll-lock, aria-expanded, Escape closes, focus returns to the hamburger — **no drift from v8** |
| L10 | Ref mobile navigation | live, ref @390px | unchanged: the 220px squeezed sidebar, NO drawer button (its nav still rides `space-y-0.5` — the v3-vs-v4 trap) — the clone's drawer remains the documented superset |
| L11 | Dashboard KPI cards / low-stock list | computed + VLM | KPI label casing differs in the DOM ("Ventas Hoy" vs "Ventas hoy") but BOTH render `uppercase` CSS — invisible; low-stock card **1012px on both**; the VLM's "bottom-left avatar" flag was re-probed: it is the **Next.js dev-tools indicator** (`nextjs-portal` — dev-mode only, not app UI) — **but it leaked into the shipped docs/screenshots/ captures — methodology gap, F9**. The VLM's OTHER flag — a clone-only "VeloxPOS" credit line under the low-stock list — was initially dismissed by a flawed leaf-node DOM probe, then RE-VERIFIED by scrolling the ref to its scrollHeight: the ref's dashboard ENDS at the low-stock rows — **the clone's `ShoppingBasket + VeloxPOS` footer is clone-invented — drift, F10** |
| L12 | Ref Reports data state | live, ref | the ref's reports render "$0.00 / Sin datos en este período" (its sales are 6 months old) — the "Detalle por método" table remains UNOBSERVABLE on the ref; the clone's rendering there stands |
| L13 | Ventas table pills | computed, both | classes identical; ref pill text #e7e9ef (its foreground) vs clone #f8fafc — the L6 token fix closes this too; status pill bg-green-100/text-green-700 identical |
| L14 | The 404 page | live, both | identical copy ("404 \| Página no encontrada \| La página que buscas no existe o fue movida. \| Ir al Terminal") + identical slug titles — match |
| L15 | Baseline gates | repo | lint 0 · tsc 0 · build ✓ · unit 342/342 · e2e 105/105 — the v8 close intact |

## 1. Design decisions (resolved)

- **SD-23 (Spanish aliases — the superset made whole):** the six Spanish
  names stay in the rewrites (a deliberate, documented superset — the ref
  404s them) and gain a real view map: `SPANISH_ALIASES` in `router.ts`
  (`ventas→ventas, inventario→inventario, cajas→cajas, cajeros→cajeros,
  reportes→reportes, ajustes→ajustes, terminal→terminal`), consulted by
  `viewFromPath()` and `isKnownPath()` after the canonical (case-insensitive)
  English paths. `/Terminal` maps explicitly too (the ref 404s it; the
  clone's rewrite accepts it — the superset keeps rendering the Terminal
  view there, now deliberately rather than via the fallback).
- **SD-24 (the title algorithm goes path-driven):** `page.tsx`'s title
  effect switches from `DOCUMENT_TITLES[view]` to
  `documentTitleForPath(window.location.pathname)`, and the helper's lookup
  drops its `.toLowerCase()` — **exact-case** canonical match → canonical
  title, everything else slug-cases. This matches the ref on every measured
  case: `/Sales`→"Sales", `/sales`→"Sales" (slug coincides),
  `/SALES`→"SALES", `/storesettings`→"Storesettings", `/Ventas`→"Ventas"
  (what the ref itself titles that URL), `/foo-bar-baz`→"Foo Bar Baz",
  `/`→"VeloxPOS". The `[status, view]` effect deps remain sufficient:
  SPA navigation always pairs a view change with a path change, and
  alias→alias same-view navigation is unreachable through the UI (sidebar
  links are canonical). All v7 `documentTitleForPath` pins survive
  unchanged (verified case-by-case); ONE v7 source pin (`DOCUMENT_TITLES[view]`)
  is aligned to the new contract — updated, not weakened (the v8/F7 posture).
- **SD-25 (tables go bare):** the four ref-aligned tables drop their
  table-level `text-sm` (sales, inventory, cashiers management,
  recent-shifts) — the cells' own classes then rule exactly like the ref's
  (the ONLY visible change: the Ventas **Total** 14px → 16px; every other
  text element in those tables carries an explicit size). The reports
  "Detalle por método" table keeps its `text-sm` — unobservable on the ref
  (L12), so no guidance exists to match.
- **SD-26 (the foreground token):** `--foreground: 248 250 252` →
  **`231 233 239`** (the ref's measured body default). The v8 dialog sweep's
  explicit `text-[#e7e9ef]` becomes redundant-but-consistent (kept — it pins
  the dialog text independently of the shadcn plumbing).
- **SD-27 (two chart skins, one component):** `SalesAreaChart` gains
  `variant: "dashboard" | "reports"` (default `"dashboard"`):
  shared — area fill becomes the ref's **linearGradient `salesGrad`
  (#6366f1, 5% → 95% offsets)** and the line stroke becomes **#6366f1**;
  dashboard — gridlines `#e2e8f0` dash `3 3`, labels `#94a3b8` 12px, line
  width **2.5**, gradient top opacity **0.3**; reports — gridlines
  `rgba(255,255,255,0.04)` dash `3 3`, labels `rgba(255,255,255,0.3)` 11px,
  line width **2**, gradient top opacity **0.35**. The dashboard call site
  passes `variant="dashboard"`, the reports call site `variant="reports"`.
- **SD-28 (screenshots without the dev badge):** the 18 captures regenerate
  from the **production standalone build** (the e2e webServer's :3100
  posture — `NODE_ENV=production node .next/standalone/server.js`) instead
  of the dev server, which also validates the production rendering. The
  Next.js dev-tools indicator never exists there.

## 2. Execution batches (TDD: red → green → gate)

### B1 — The alias map + the path-driven title (F1/F2, SD-23/SD-24)
1. `src/lib/router.ts`: add `SPANISH_ALIASES` (the seven lowercase
   segments → ViewId); `viewFromPath()` consults it after the canonical
   paths; `isKnownPath()` does the same; `documentTitleForPath()`'s
   canonical lookup goes exact-case (drop `.toLowerCase()` — the slug
   fallback already handles the rest).
2. `src/app/page.tsx` title effect:
   `document.title = documentTitleForPath(window.location.pathname)`.

### B2 — The table sweep (F3, SD-25)
1. Remove the table-level `text-sm` from `sales-view.tsx`,
   `inventory-view.tsx`, and both tables in `cashiers-view.tsx`
   (the `min-w-*` responsive guards stay). `reports-view.tsx` untouched.

### B3 — The foreground token (F4, SD-26)
1. `src/app/globals.css`: `--foreground: 248 250 252` → `231 233 239`.

### B4 — The chart skins (F5-F8, SD-27)
1. `src/components/pos/shared.tsx` `SalesAreaChart`: the `variant` prop +
   the `<defs><linearGradient id="salesGrad">` fill + per-variant
   gridline/label/line values.
2. `dashboard-view.tsx` passes `variant="dashboard"`;
   `reports-view.tsx` passes `variant="reports"`.

### B4b — The clone-invented dashboard footer (F10, found mid-execution)
1. `dashboard-view.tsx`: the `ShoppingBasket + "VeloxPOS"` credit line under
   the low-stock card is REMOVED (the ref's dashboard ends at the low-stock
   rows — scrollHeight-verified) along with the now-unused import.

### B5 — Screenshots + docs lockstep (F9, SD-28)
1. Regenerate the 18 screenshots from the production standalone server
   (port 3100, seeded db/e2e.db posture → the SAME db/custom.db data the
   dev captures used, via a temporary server boot; no dev badge).
2. AGENTS.md: the alias + title contracts fold into the existing routing
   section; CLAUDE.md counts; README badge if counts move; PAD v1.7.0 +
   ADR-019; retail-pos_SKILL.md v1.4.0 (counts + the v9 block);
   `docs/session_11.md`; worklog; this plan.

## 3. Test plan (pins first — red)

- **Unit (`tests/functional-parity-v9.test.ts`):**
  - `viewFromPath` Spanish matrix: `/Ventas`→ventas, `/ventas`→ventas,
    `/Inventario`→inventario, `/Cajas`→cajas, `/Cajeros`→cajeros,
    `/Reportes`→reportes, `/Ajustes`→ajustes, `/Terminal`→terminal;
    canonical case-insensitive paths unchanged; unknown → terminal.
  - `isKnownPath`: all six Spanish names + `/Terminal` true.
  - `documentTitleForPath` exact-case matrix: `/SALES`→"SALES | VeloxPOS",
    `/DASHBOARD`→"DASHBOARD | VeloxPOS", `/storesettings`→"Storesettings |
    VeloxPOS", `/Ventas`→"Ventas | VeloxPOS" (and the v7 canonical cases
    re-asserted — they must NOT regress).
  - Source pins: page.tsx titles through `documentTitleForPath`; the four
    tables carry no table-level `text-sm` (sweep); globals
    `--foreground: 231 233 239`; `SalesAreaChart` carries the variant prop,
    the `salesGrad` gradient, and the per-variant gridline/label/line
    values; the dashboard call passes `variant="dashboard"`, reports
    `variant="reports"`.
- **E2e (`tests/e2e/functional-parity-v9.spec.ts`):** `/Ventas` renders the
  Ventas view (H1 "Historial de Ventas") with title "Ventas | VeloxPOS";
  `/Inventario` renders the inventory view; `/SALES` renders the view with
  title "SALES | VeloxPOS"; the Ventas Total computed font-size is 16px;
  the dashboard chart's first gridline is #e2e8f0/"3 3" + a 12px #94a3b8
  label + the area path fill url(#salesGrad) + line #6366f1; the reports
  chart's first gridline is rgba(255,255,255,0.04) + an 11px
  rgba(255,255,255,0.3) label; the body computed color is
  rgb(231, 233, 239).
- **Legacy pin alignment (updated, not weakened):** v7's
  `DOCUMENT_TITLES[view]` source pin → the new documentTitleForPath
  contract. All other v7 title pins re-asserted verbatim.
- Full gate after each batch: `bun run lint` · `bun run typecheck` ·
  `bun run build` · `bun run test` · `bunx playwright test`.

## 4. Ship

1. Screenshots (SD-28); VLM spot-check the Ventas table + both charts.
2. Docs lockstep (B5.2); worklog entry; `docs/session_11.md`; commit; push
   via the SSH wrapper (main only).

## 5. Out of scope (disclosed)

- The reference's own Spanish-path 404s (SD-23 — the clone's accepted
  aliases are the superset; the ref's 404 behavior is not replicated).
- The "Detalle por método" table's skin (L12 — unobservable on the ref).
- The donut palette (standing disclosure since v5 — the ref's data-dependent
  donut rendering stays unobservable).
- The ref's localStorage auth, login-before-404/signup gates, SMTP
  transport, near-invisible slate-800 tones where the clone already ships
  readable refinements (standing v8 disclosures SD-18..SD-20 unchanged).
- Per-route og:url/canonical variance (SD-14, standing); the Next.js dev
  badge itself (dev-mode only — the capture methodology is what changes).

## 6. Execution results (2026-10-26, all green)

- **B1** shipped as planned: `SPANISH_ALIASES` + the exact-case
  `documentTitleForPath` + the path-reading title effect. One v7 source pin
  aligned (`DOCUMENT_TITLES[view]` → `documentTitleForPath(window.
  location.pathname)`); every other v7 title pin survived verbatim.
- **B2** shipped: the four tables are bare; the Ventas Total computed at
  **16px** (live-verified); the reports table kept its `text-sm`
  (unobservable, documented).
- **B3** shipped: the foreground family (body/card/popover) at
  `231 233 239` — the body's computed color live-verified
  `rgb(231, 233, 239)`.
- **B4** shipped: `CHART_SKINS` + the `salesGrad` gradient defs + the
  per-skin values; both call sites pass their variants. Live-verified:
  the dashboard gridline `#e2e8f0`/"3 3" + a 12px `#94a3b8` label + the
  `url(#salesGrad)` area; the reports gridline
  `rgba(255,255,255,0.04)` + an 11px `rgba(255,255,255,0.3)` label.
- **B4b (F10, found mid-execution)**: the clone-invented
  `ShoppingBasket + "VeloxPOS"` dashboard footer removed — the VLM diff
  caught it, a leaf-node DOM probe initially missed it (lesson recorded),
  and the ref's scrollHeight settled it (its dashboard ends at the
  low-stock rows).
- **B5** shipped: all 18 screenshots regenerated from the PRODUCTION
  standalone build (`scripts/capture-screenshots-prod.sh` — :3100,
  db/custom.db, fresh standalone); the dashboard re-shot after the footer
  removal; VLM-verified (no dev badge, no footer).
- **Gate: lint 0 · tsc 0 · build ✓ · unit 363/363 (342+21) · e2e 115/115
  (105+10).** Docs lockstep: AGENTS.md 21-22, CLAUDE.md, README, PAD
  v1.7.0 + ADR-019, retail-pos_SKILL.md v1.4.0, session_11.md, worklog.
