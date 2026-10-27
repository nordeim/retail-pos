# AGENTS.md — VeloxPOS (`retail-pos`)

Instructions for AI coding agents working in this repository. Every line
answers "would an agent likely miss this without help?" — if it reads like
generic advice, it does not belong here. Companion docs:
`CLAUDE.md` (workflow), `README.md` (setup), `Project_Architecture_Document.md`
(the full PAD), `docs/reference-investigation.md` + `docs/implementation-plan.md`
(the replication dossier), `docs/remediation-plan-v3.md` (the executed
remediation record + its finding IDs).

## What this app is

A self-hosted, functional-superset clone of the `veloxposretail.base44.app`
POS (Spanish UI). One Next.js page + `rewrites()` renders 8 views at
reference-measured PascalCase paths; Zustand stores are the only mutation
path; Prisma/SQLite owns persistence. The domain is RETAIL — when a file
name says "Caja/Cajero/Shift/Ticket", that is a register/cashier/turn/receipt.

## Commands

| Task | Command |
|---|---|
| Install | `bun install` |
| Dev server | `bun run dev` (port 3000; `dev.log` tees output) |
| Lint | `bun run lint` |
| Typecheck | `bun run typecheck` (run BEFORE tests — it is the fast gate) |
| Unit tests | `bun run test` (vitest; `*.test.ts` only) |
| E2E | `bun run test:e2e` (builds required FIRST; see below) |
| Build | `bun run build` (standalone output; required before e2e) |
| DB push | `bun run db:push` (schema-anchored) |
| DB seed | `bun run db:seed` |

Order matters: **lint → typecheck → build → `bun run test` → `bun run test:e2e`**.
The e2e webServer boots `.next/standalone/server.js` — a stale build means the
suite tests dead code. Single unit file: `bunx vitest run tests/money.test.ts`.
Single e2e spec: `bunx playwright test tests/e2e/inventory.spec.ts`.

## The database contract (do not improvise)

- `.env` MUST read `DATABASE_URL="file:../db/custom.db"`; the file lands at
  `<repo>/db/custom.db`. Pinned by `tests/schema.test.ts`.
- **Prisma CLI anchors shell-provided relative `file:` URLs against
  `prisma/schema.prisma`** — but Next dev (Turbopack) pre-resolves the SAME
  value against the project dir and injects an absolute path one level OFF
  (`<project>/../db/custom.db`), creating a stray EMPTY db at `<parent>/db/`
  on boot. `src/lib/db-path.ts` hardens against this (v3): when an absolute
  target is `<elsewhere>/db/custom.db` while the repo owning
  `prisma/schema.prisma` has its own `db/custom.db`, the repo wins. Do not
  "simplify" that branch — its unit pins live in `tests/db-path.test.ts`.
- Money is **integer cents everywhere** (`Int` columns; `src/lib/money.ts`).
  Floats at a money boundary are a bug. IVA is per-PRODUCT (`ivaRate`,
  default 16); prices are IVA-exclusive; the line formula rounds ONCE over
  the whole line: `lineTotal = round(price × (1+iva/100) × qty)` —
  `lineTotalCents()` is the single implementation; views/routes must call
  it, never re-derive (M3: `round(unit)×qty` diverged by 1¢ on screen)
  (verified reference ticket: $18.50 → $21.46).
- The e2e suite runs against `db/e2e.db`, force-reset + reseeded by
  `tests/e2e/global-setup.ts` every run (the sale specs decrement stock).
- Seed credentials ride `SEED_OWNER_*` env vars; **bun's dotenv expands `$…`
  in .env values** — the seed password default therefore lives IN
  `prisma/seed.ts`, not in `.env` (a `'$Abcd1234'` .env value arrives as `""`).

## The security contract (remediation R1 — do not regress)

- **Reset delivery (C1/ADR-011)**: `forgot-password` carries
  `resetPath`/`resetUrl` ONLY when `inAppResetDeliveryEnabled()` (pure seam in
  `src/lib/auth.ts`) says so — non-production, or production with
  `RESET_INAPP_DELIVERY=1`. A production response never contains the one-shot
  token. Pinned by `tests/e2e/security.spec.ts` in the true production posture.
- **Session revocation (M6/ADR-012)**: the session token payload carries `v`
  (the user's `tokenVersion`); `reset-password` bumps it in the same
  transaction as the password write; `getCurrentUser` rejects mismatches.
  Pre-reset cookies die on their next request.
- **Client-IP selection (H3)**: `resolveClientIp(xff, hops)` picks the
  x-forwarded-for hop at the DECLARED trusted depth (`AUTH_PROXY_HOPS`,
  default 0 = rightmost), fail-closed. Never read the first hop — that is
  the client-controlled spoof position.
- **OTP lockout (H2)**: verify-email rate-limits 10/IP/15min AND counts
  per-token attempts (`attempts` column, 6 strikes → the row is invisible
  to the fetch). Both brakes required.
- **Body gates (M4)**: `readJson` → 413 over 1MB, 415 on non-JSON content
  types; the mapper's full contract: ZodError/ValidationError → 400,
  PayloadTooLargeError → 413, UnsupportedMediaTypeError → 415,
  BusinessRuleError → 422 (stock/cash-short/…), ConflictError → 409,
  P2002 → 409, P2025 → 404, unauth → 401, unknown → 500.
- **Sale integrity (M1/L2)**: the stock decrement is the GUARDED
  `updateMany({ stock: { gte: qty } })` INSIDE the transaction — never
  move it back out; efectivo must arrive with `cashReceived ≥ total`
  (`paymentCoversTotal`, 422 otherwise).
- Rate-limit buckets are pruned in-flight (L10) — `checkRateLimit` also
  sweeps; don't bypass it with a second map.

## Tailwind v4 traps (the repo's raison d'être)

The reference was built on Tailwind v3; this clone compiles on v4. The five
documented traps live in `docs/Tailwind-V4-Validation-Report.md`; the build
rules:

1. **Never** put `mt-*`/`mb-*` utilities on children of `space-y-*`/`space-x-*`
   containers — v4's `:where()` rewrite flips the specificity outcome and the
   gaps change (the reference's own mobile-menu bug). Use `flex flex-col gap-*`.
   Pinned by `tests/tailwind-traps.test.ts` + e2e geometry checks.
2. `@theme inline` values must be FULL colors (`rgb(var(--x))`), never bare
   triplets; raw triplets live in `:root` only.
3. `--shadow-sm` is pinned to the reference geometry in `@theme` — v4 shifted
   the scale one notch; do not remove the pin.
4. Exact-sRGB gradients are explicit `linear-gradient(...)` utilities
   (`vx-gradient`), never `bg-gradient-to-*` (v4 interpolates in oklab).
5. The measured design tokens (`--color-vx-canvas: #080a14`, surface
   `#0d0f1a`, border `#1e2235`) are reference evidence — changing them breaks
   visual parity with `docs/reference-evidence/ref-*.png`.
6. The radius scale is NATIVE Tailwind v4 (`--radius-xl: 0.75rem`,
   `--radius-lg: 0.5rem`, ...) — the shadcn `calc(var(--radius) ...)` remap
   was removed in v4 because the reference's own shadcn runs native
   (`rounded-xl` = 12px there). Re-adding any remap drifts every control
   +4px (v4 finding V1; pinned by tests/visual-parity-v4.test.ts).
7. Cards ride `vx-card` — the reference's card system: translucent
   `rgba(16,18,32,.9)` fill + `rgba(255,255,255,.07)` hairline +
   `0 8px 32px rgba(0,0,0,.5)` elevation. The SIDEBAR stays solid
   `#0d0f1a` (a different surface, verified live).
8. Action buttons use the `glass-button-primary` / `-success` /
   `-warning` utilities (CSS extracted from the reference's own
   `.glass-button*` classes: 135° ramps, colored hairline, glow, hover
   lift, active press). Sizing rides call-site utilities
   (`px-4 py-2.5 text-sm rounded-xl` for page CTAs, `px-3 py-1.5 text-sm
   rounded-lg` for card actions, `px-8 py-5 rounded-2xl text-xl font-black`
   for COBRAR).
9. The ACTIVE nav item is the translucent violet pill
   (`bg-violet-600/20 text-violet-300 shadow-sm shadow-violet-500/10`)
   with its 1px violet edge on a RING (`ring-1 ring-violet-500/30`),
   NEVER a `border` — a border inflates the active row 2px and breaks the
   drawer's uniform 44px pitch (mobile-navigation TRAP-4 guard).
10. The auth surface ships the OFFICIAL social brand marks (SVG paths
    extracted from the reference DOM) and the hosted logo PNG
    (`public/veloxpos-logo.png`) — no substitute glyphs.
11. The shell gutter is FLUSH: `main` sits at `lg:ml-[220px]` /
    `lg:ml-[68px]` (sidebar 220/68) and the view's own padding provides the
    24px gutter — the H1 lands at x=244 like the reference. Never re-add the
    old `ml-[244px]` (it double-padded the gutter; v5 G1). The TERMINAL is
    the one full-bleed view: main drops its padding and locks `lg:h-screen`
    there; the ticket panel is the reference's RAIL (`rounded-none border-l
    border-[#1e2235] bg-[#0d0f1a] md:w-[380px]`), not a card — the footer
    hairline is `border-white/5`, totals render only with lines, and the
    COBRAR icon is ShoppingBag. "Agregado" is the transient emerald banner
    (max-h-0/opacity-0 idle), never a permanent label (v5 T4-T7).
12. Tables (v5, live-measured): headers `text-xs font-semibold
    text-slate-500 uppercase` + per-column alignment; rows
    `border-b border-slate-50` + `hover:bg-white/40`; body cells
    `text-sm text-slate-600`; the ventas ticket cell is `font-mono
    text-indigo-600`; totals `font-bold text-slate-800` right-aligned. The
    cajeros shifts table is the DENSE variant (px-4 py-2 headers, py-2.5
    cells, no hover). StatusPill has TWO shapes: `variant="table"` (6px
    soft badges — green-100/green-700, slate-100/slate-500) vs
    `variant="card"` (the register-card rounded-full pill). The shadcn
    `--secondary` token is the reference's neutral `33 37 49` (NOT violet —
    the categoría badge depends on it).
13. Form controls are 12px-radius (`rounded-xl` on the Input base — the
    reference's remapped control radius) with TRANSPARENT backgrounds —
    never fill an input with a solid surface. Reports is the reference's
    only bright H1 (`PageHeading tone="bright"` → white/90); its summary
    chips are TINTED (15% bg + 30% border + 400-tone icon), while the
    dashboard KPI chips stay gradient (different element families).
14. Dialog buttons (v6, live-measured): the reference's dialog footer is
    42px — submit `glass-button-primary h-auto rounded-xl px-4 py-2.5
    text-sm font-medium` with a VISIBLE `Save` icon; cancel `glass-button
    h-auto rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700`.
    The cva Button ships a dedicated EMPTY `glass` variant for this: the
    glass-button* utilities carry the fill/hairline, so NO other variant
    (the default's `bg-violet-600 text-white` and the outline's
    `bg-transparent border` both CLOBBER the flat glass fills — the F6
    bug). Page-level CTAs stay 36px (`h-9`) — the reference's own page
    buttons measure 36px. The settings Agregar is the 34px card-action
    (`glass-button h-auto rounded-lg px-3 py-1.5`).
15. The document head (v6): title is EXACTLY "VeloxPOS", the reference's
    description verbatim, the full openGraph + twitter cards
    (summary_large_image, og:image = the 1200x630 `/og-image.png` render),
    `appleWebApp { capable, statusBarStyle: "black", title }`, and a
    WORKING `/manifest.json` (the reference's own manifest link 302s).
    The tab icon rides the app-router `src/app/icon.png` convention (the
    VeloxPOS logo — the same asset the reference's favicon serves); the
    study-app favicon.svg is deleted. Assets regenerate via
    `scripts/generate-head-assets.py` (repo scripts/).
16. Media + failures (v6): product photos and the store logo are stored as
    DATA URLs (`src/lib/image.ts` — canvas resize to 512px, JPEG q0.85,
    300KB source guard; schema ceiling 600k chars). The Unidad options are
    the reference's six (Pieza/Kilogramo/Litro/Metro/Caja/Paquete) plus
    Servicio (superset). Every mutation failure toasts through
    `useToast().toast.error(...)` — `void err` catches are FORBIDDEN. The
    Ventas mail action opens a `mailto:` with the full ticket body
    (`src/lib/ticket-mail.ts` — no SMTP channel, disclosed). UI primitives
    reference NO class that is absent from globals.css (the sf-* purge is
    total; the checked Switch fills with the measured `#7f62f4`).
17. The document TITLE is per-route (v7, live-measured on every reference
    route): `DOCUMENT_TITLES` in `src/lib/router.ts` is the single map
    ("VeloxPOS" at the root; "Dashboard | VeloxPOS", "Inventory |
    VeloxPOS", "Sales | VeloxPOS", "Registers | VeloxPOS", "Cashiers |
    VeloxPOS", "Reports | VeloxPOS", "Store Settings | VeloxPOS"; Ajustes
    titles in English like the reference). The shell's effect applies it on
    view change (after `status === "ready"` — later than Next's one-time
    post-hydration metadata re-apply, so it sticks); `/signup` titles via
    its server layout; 404s title the slug-cased route through
    `documentTitleForPath()` + the GUARDED MutationObserver in
    `src/app/not-found-title.tsx` (a bare effect write is overwritten
    ~0-50ms after mount — the observer wins the last write and disconnects
    on unmount). The per-route og:url/canonical variance is NOT replicated
    (single-page architecture — disclosed SD-14).
18. Image-clear + numeric inputs (v7): "Quitar" is a REAL clear — the
    dialog sends `imageUrl: null` (schema `.nullable()`); NEVER `undefined`
    (JSON.stringify drops the key and `sentKeysPatch` skips it — the clear
    silently no-ops server-side). A failed pick or a picker-cancel leaves
    the stored value untouched; only an explicit Quitar clears. The
    product-dialog numeric fields (Precio/Costo/Stock/Stock mínimo/IVA)
    are `type="number"` with steps — the reference's own control type
    (spinners render, role=spinbutton, native keystroke filtering). The
    Ajustes logo block renders the pending/stored `logoUrl` as a 56px
    preview (`h-[56px] w-[56px]` — NOT `h-14`, the v5 swatch pin forbids
    that token in settings-view) plus a Quitar that PATCHes null.
19. The from_url round-trip (v8, live-measured): a logged-out hit on ANY
    app route bounces to `/login?from_url=<encodeURIComponent(pathname +
    search)>`, and a successful login returns the user to that route —
    NEVER redirect blindly to a value that rode the URL:
    `safeReturnTo(raw, origin)` in `src/lib/router.ts` is THE validator
    (same-origin absolute URLs and site-relative paths pass; foreign
    origins, protocol-relative URLs, and javascript:/data: fail closed to
    "/"; "/login" maps to "/" so the param can never loop). The reference
    also gates 404s and /signup behind login — NOT replicated (platform
    artifacts; the clone's public 404/signup are superset behaviors,
    SD-20). The reference's own token lives in localStorage; the clone's
    httpOnly cookie stays.
20. Dialog + modal contracts (v8, live-measured): every `DialogContent`
    rides the measured chrome `border-[#262a36] bg-[#0f121a]
    text-[#e7e9ef]`; every `SelectContent` (dropdown panel — a DIFFERENT
    reference surface) rides `bg-[#161922] text-[#e7e9ef]`. The Ventas
    ticket modal is the reference's layout: a `grid grid-cols-2 gap-3
    text-sm` meta block of STACKED `dt.text-slate-500`/`dd.font-medium`
    cells, items as `{qty}x {name}` + `font-medium` prices over
    `border-slate-100`, totals over `border-slate-200` with `text-slate-500`
    rows and a `text-lg font-bold` Total (the reference's own slate-800
    Total color is unreadable — a readable tone ships, SD-18), title icon
    `Receipt` `text-indigo-500`, and NO footer Close button (the X alone).
    The mail action PROMPTS `window.prompt("Enviar ticket a:")` first —
    cancel is a no-op — then opens `mailto:<entered>?subject=&body=`
    (`buildTicketMailto(sale, to)`); there is no SMTP channel (SD-19).
    The Ajustes colors pair each `type=color` swatch with an EDITABLE hex
    `<Input>` bound to the same field (the swatch falls back to #000000
    mid-edit; the `hexColor` schema regex is the server-side gate).

21. Route aliases + the path-driven title (v9, live-measured): the rewrites
    accept the Spanish names (`/Ventas`, `/Inventario`, `/Cajas`,
    `/Cajeros`, `/Reportes`, `/Ajustes`, `/Terminal`) as a SUPERSET (the
    reference 404s every one) — `SPANISH_ALIASES` in `src/lib/router.ts`
    maps them to their views; never let them fall to the terminal fallback
    again (pre-v9 they silently rendered the WRONG view). The tab title is
    PATH-driven, exactly like the reference: `documentTitleForPath()`
    matches the canonical PascalCase path EXACT-CASE → that route's
    canonical title; everything else slug-cases the first segment
    (`/SALES` → "SALES | VeloxPOS", `/storesettings` → "Storesettings",
    `/Ventas` → "Ventas"). The shell's title effect reads
    `documentTitleForPath(window.location.pathname)` — NOT
    `DOCUMENT_TITLES[view]`.
22. Table + chart contracts (v9, live-measured): the ref's tables are BARE
    (`<table class="w-full">` — 16px base); cells carry their own sizes —
    never add a table-level `text-sm` (it shrank the Ventas Total to 14px;
    the ref renders it at the inherited 16px). The foreground family is
    `#e7e9ef` (`--foreground: 231 233 239` — the ref's measured body
    default; also card-foreground/popover-foreground). The sales chart has
    TWO measured skins via `SalesAreaChart variant=`: "dashboard"
    (gridlines `#e2e8f0` "3 3", labels `#94a3b8` 12px, line `#6366f1`
    w2.5, `salesGrad` gradient top 0.3) and "reports" (gridlines
    `rgba(255,255,255,0.04)`, labels `rgba(255,255,255,0.3)` 11px, line
    w2, gradient top 0.35) — one component, two skins; the dashboard has
    NO footer credit line (the ref's dashboard ends at the low-stock rows).

23. The donut + the seeded data (v10, live-measured): the category donut
    is the reference's recharts rendering — filled sector PATHS
    (`sectorPath()` in `shared.tsx`), ring innerR 50 / outerR 80 centered
    at (166.5, 100) in a `0 0 333 200` viewBox, sectors COUNTERCLOCKWISE
    from 3 o'clock with a TRAILING 4° gap per slice (each sector starts
    exactly at its boundary), `stroke="#fff" strokeWidth={1}` on every
    sector, and the palette `DONUT_COLORS = ["#6366f1", "#8b5cf6",
    "#a78bfa", "#c4b5fd", "#ddd6fe", "#22c55e"]` mapped by ORIGINAL data
    index. The legend renders the FIRST 5 rows only (`slice(0, 5)` — the
    ref renders 6 sectors but 5 legend rows; its internal rule is
    unobservable) stacked BELOW the chart (`space-y-2 mt-2`, swatch
    `w-3 h-3 rounded-full`, name `text-slate-600`, count
    `font-semibold text-slate-700`). The low-stock card's header gap is
    the ref's `mb-3` (`SectionCard titleClassName`); every other card
    header stays mb-4. The Ajustes section headers carry per-section
    icons at `w-5 h-5`: Store/text-indigo-500, Palette/text-purple-500,
    **FileText**/text-green-500, CreditCard/text-blue-500,
    **Tag**/text-amber-500 (never receipt-text/tags/violet-400 — v10
    retired those). The SEED mirrors the reference account's observable
    state exactly: the products in the ref's page order (Shampoo → Pan
    Bimbo; the 12th row is the measured "Jabón Zote 400g" /
    7501025403010 / stock 19 — the dossier-era "Barra" values are
    retired), Caja 2 created before Caja 1 (the ref's page order), and
    the two sales at the ref's EXACT datetimes (19/04/2026 22:09 and
    14/03/2026 01:45 with the second's real items: 1x Jabón Zote +
    1x Papel Higiénico = $61.48) — the relativized daysAgo seeding is
    GONE, so the clone's dashboard chart renders flat and its reports
    render "Sin datos en este período" exactly like the reference.
    Ordering is deterministic everywhere: `[{ createdAt: "asc" }, { id:
    "asc" }]` (the delegates, the product list, and the dashboard's
    byCategory) plus staggered seed createdAt — a rewrite-listed or
    seeded list must never depend on SQLite's tie order again. The
    reports X-ticks follow the ref's rule (`thinLabelIndices`): windows
    ≤14 days label EVERY day; longer windows step by
    `ceil((count-1)/9)` from the window start (30 → every 4th day ending
    day 28, 90 → every 10th ending day 80) — the last day is NOT
    force-labeled.

24. The chart CONTAINERS + the focus system (v11, live-measured at
    1440/1280/1024/390 on both apps): the charts are container-responsive
    the recharts way — `useContainerWidth` (a callback ref that measures
    at commit, before first paint, + a ResizeObserver with the React 19
    ref-cleanup return) feeds the SVG box, the chart HEIGHT stays FIXED
    per surface (`SALES_CHART_HEIGHTS`: dashboard 280, reports 220; the
    donut 200), the internal paddings (52/28/12) stay fixed while the
    plot flexes, and the donut's ring is FIXED (innerR 50 / outerR 80,
    cy 100, cx = box/2, the box capped at 333 by the wrapper's max-w) —
    NEVER aspect-lock a chart SVG (`w-full h-auto` scaled the whole
    drawing: the dashboard chart rendered 254px tall vs the ref's 280 at
    1280, the reports chart 424px vs 220, the donut ring 134px vs 160).
    The focus grammar: app text controls (Input/Textarea/SelectTrigger)
    focus `ring-1` in the #7f62f4 edge with NO offset (`--ring: 127 98
    244`); the Switch keeps ring-2 + offset-2 (the offset rides
    `--background: 15 18 26` — the shadcn SURFACE, not the #080a14 canvas
    the body paints via `--color-vx-canvas`); the glass buttons focus
    through `outline: 3px solid rgba(127, 98, 244, 0.5)` in the glass
    utilities (the cva Button base carries NO focus-ring classes); the
    auth inputs focus `focus:border-slate-400 focus:ring-slate-400`
    ring-2 + a WHITE offset (AuthShell scopes `--background: 255 255
    255`) with `pl-10 h-11 sm:h-12 md:text-sm placeholder:text-slate-600`;
    the auth submits carry a 3px white outline. The Input/Textarea bases
    ride `text-base md:text-sm shadow-sm` (16px under 768 — the iOS
    no-zoom size); the SelectTrigger is `rounded-xl` with the `focus:`
    spelling (the dropdown PANEL stays rounded-md — 6px, the ref's own);
    the label→control gap is `mt-1` (4px margin — the measured
    label-bottom→control-top gap is 8px on BOTH apps: the 4px margin +
    the inline label's 16px-box overshoot). `transition-colors` covers
    outline-color — settle-wait ~300ms before reading a focused outline
    (it fades in from currentColor). The charts render the measured
    recharts default tooltip on hover (`ChartTooltip`: white card, 12px
    radius, 10px padding, `rgba(0,0,0,0.1) 0 4px 20px`, nowrap,
    pointer-events none) with READABLE dark text — the ref's own tooltip
    text is #e7e9ef-on-white (unreadable, a platform bug; the SD-18
    readable-superset precedent). Reports X-tick pins are DATE-RELATIVE
    (the windows anchor to the current day — absolute date strings roll
    over at midnight).

25. The auth surface family (v12, live-measured on both apps at 1280+390):
    the auth CARD carries a 4px slate gradient HAIRLINE at its top edge
    (`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200
    via-slate-300 to-slate-200`) and `overflow-hidden` to clip it; the
    padding steps `p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10`; the inner
    column is `flex flex-col items-center text-center space-y-6
    sm:space-y-8` (never per-child margins). The login grammar: H1
    `text-2xl sm:text-3xl` (24/30px), subtext `text-sm sm:text-base
    font-medium text-slate-500`, social buttons `text-[16px]` (54px tall)
    with `hover:bg-slate-50 … hover:shadow-sm` and the icon wrapper's
    `-ml-4` optical offset, the OR chip = a shadcn Separator (the 1px
    slate-200 line + `bg-white px-3 font-medium tracking-wider
    text-slate-500` with the LITERAL "or" — uppercased by the wrapper's
    `text-xs uppercase`), the form `space-y-4 sm:space-y-5` with the
    fields group (`space-y-3 sm:space-y-4`) and the actions group
    (`space-y-3`), the footer row `flex flex-col sm:flex-row
    items-center justify-between gap-2 sm:gap-0` INSIDE the form (Forgot
    left / "Need an account? Sign up" right at ≥sm), and the submit
    `h-11 sm:h-12 … shadow-sm … transition-all duration-200` (44px
    mobile — settle-wait ~300ms before measuring heights across viewport
    changes). The forgot screen is the reference's ENGLISH family:
    back-at-top (`w-fit … -mb-2`, lucide-arrow-left), H2 24px, subtext
    16px slate-600, the SMALLER controls (`h-10 sm:h-11`,
    `placeholder:text-slate-400`), "Send reset link" `h-10 sm:h-11`; the
    sent screen = the `w-14 h-14 sm:w-16 sm:h-16 bg-slate-100` icon
    circle + lucide-mail + the email `font-medium text-slate-900` + the
    GREEN alert (`border-green-200 bg-green-50/70 p-4 rounded-xl` +
    `text-green-700 text-sm leading-relaxed`) + the w-full back; the
    in-app reset link rides INSIDE the green alert (the no-SMTP superset
    — the flow lands on /reset-password like the email link would). The
    /reset-password page is the base44 PLATFORM template (NOT the app
    card): a plain WHITE page, `rounded-lg … shadow-lg bg-white
    overflow-hidden` card + the 2px `bg-gray-900` top strip, the GRAY
    palette (`bg-gray-50/50 border-gray-200 focus:gray-400` inputs,
    lucide-lock `text-gray-400`), H2 `text-2xl font-bold text-gray-900`
    "Set new password", New Password + Confirm New Password (`pl-10
    h-11`), the `text-xs text-gray-500` helper, the `h-11 bg-gray-900`
    submit, "Back to login" `w-full text-sm text-gray-600`; NO token →
    the "Invalid Reset Link" state (the `w-20 h-20 bg-red-100` circle +
    lucide-circle-alert + the standard button). The error/success
    alerts are the shadcn Alert family everywhere on auth:
    `border-{red|green|slate}-200 bg-{red|green|slate}-50/70 p-4
    rounded-xl` + `text-{red|green|slate}-700 text-sm leading-relaxed`
    (NEVER the old `rounded-lg bg-red-50 px-3 py-2`). Tailwind v4
    resolves palette colors through oklab()/lab() in Chromium —
    probe-compare colors or assert the alpha, never literal rgb strings.

26. The chart HOVER micro-interactions (v13, live-measured on both apps):
    the sales chart renders the reference's recharts hover artifacts while a
    point is active — the CURSOR (a vertical `stroke="#ccc"` 1px line at the
    active x spanning the plot area, `y1={padTop}`→`y2={padTop + innerH}`)
    and the activeDot (`<circle r="4" fill={skin.lineStroke} stroke="#fff"
    strokeWidth={2}>` at the point) — and the tooltip is the recharts
    DEFAULT content on the v11 white-card skin: the margin-0 label p (the
    day, readable #1e293b — the SD-18 superset; the reference's inherited
    #e7e9ef is invisible on white) + the ul/li item (4px pad-y, the LINE
    color #6366f1) carrying the literal series name `ventas` + the " : "
    separator + the RAW value (`String(value)` — NEVER the formatted Y
    string), 16px. The tooltip ANCHOR is the reference's measured hybrid —
    x = the snapped POINT's x + 10, y = the POINTER's y + 10 — flipping to
    the mirrored −10 gap when the box would overflow the container
    (`tipTransform`), gliding with `transition: transform 400ms`, and the
    wrapper PERSISTS after the first hover (leave flips `visibility`,
    never unmounts — re-enter glides from the last position, recharts' own
    behavior; the tooltip measures itself via the callback-ref +
    ResizeObserver `useSelfMeasure` — never setState-in-effect). The DONUT
    tooltip is a DIFFERENT skin: the RAW recharts default — white bg + a
    1px `#ccc` border, NO radius, NO shadow, the EMPTY label p, the item in
    BLACK (`rgb(0,0,0)`): `{name} : {raw count}` ("N productos" RETIRED) —
    anchored at the sector's ring midpoint (the measured recharts centroid)
    with the same flip + glide. Probe lessons: a 0-width SVG line (the
    cursor) has an EMPTY Playwright bounding box — assert attachment +
    geometry, never toBeVisible; the flat-$0 area path is a 0-height shape
    (same rule); Chromium serializes `400ms` as `0.4s` in computed
    transitions; e2e hovers must GATE on the data (the area path) before
    the mouse.move — a move on the empty-payload chart never activates a
    point; the reference's PIE tooltip needs mouseenter/mousemove ON THE
    SECTOR PATH (the chart-wrapper mousemove never activates it).

27. The dialog MOTION + geometry family and the focus family (v14,
    live-measured on both apps): the dialog system is UNIFORM — every
    DialogContent/AlertDialogContent rides the shared `max-w-lg` (512px)
    base with `rounded-2xl sm:rounded-lg` (16px full-bleed below sm —
    `w-full` takes the viewport under the cap — 8px at ≥sm); NO per-surface
    width overrides ship (the inventory editor keeps only
    `max-h-[90vh] overflow-y-auto`). The content carries the FULL
    tailwindcss-animate grammar — fade + zoom + the slide quartet
    (`data-[state=open]:slide-in-from-left-1/2` +
    `slide-in-from-top-[48%]`, the `slide-out-to-*` mirrors) — and the
    OVERLAY fades (`animate-in fade-in-0` / `animate-out fade-out-0`).
    The DURATION trap: `tw-animate-css` resolves
    `--animate-in: enter var(--tw-animation-duration, var(--tw-duration,
    .15s))…` — on Tailwind 4.3.3 a `duration-200` class sets
    `--tw-duration: 200ms` and the animation runs 200ms, while the
    reference's older stack leaves its own `duration-200` INERT (computed
    150ms — the class only sets transition-duration there). NEVER put a
    `duration-` class on the dialog family; the observable is the tw-animate
    `.15s` default. E2e geometry reads must WAIT for the enter run —
    mid-flight, `zoom-in-95` scales the rect (512 reads ~508-510): settle
    via `el.getAnimations().map(a => a.finished)`. The focus family:
    `vx-focus` draws `outline: 3px solid rgba(127, 98, 244, 0.5)` on
    :focus-visible (the retired indigo 129,140,248 box-shadow halo stays
    retired), and the base layer sets a GLOBAL
    `outline-color: rgba(127, 98, 244, 0.5)` — the reference platform's
    mechanism — so every element falling back to the UA default outline
    (the plain Button, unstyled links) focuses violet; outline-none
    controls (inputs/textareas with their own 1px edge, the glass buttons
    with their own outline) never double-ring. The reports empty states
    are the measured `flex h-40 items-center justify-center text-sm
    text-white/25` boxes; the three reports cards carry
    `titleClassName="mb-5"` (20px heading gap; the dashboard's mb-4/mb-3
    pins are untouched). The sidebar collapse is MEASURED AT PARITY
    (220↔68px, 300ms cubic-bezier(0.4,0,0.2,1), labels conditionally
    removed from the DOM, chevron flip) — do not re-audit.

28. The hover micro-interaction families (v15, live-measured on both
    apps): every row-action icon button carries the grammar
    `rounded-lg p-2 text-slate-400 transition-colors` + a per-action
    hover family — edit/detail INDIGO (`hover:bg-indigo-50
    hover:text-indigo-600`), delete RED (`hover:bg-red-50
    hover:text-red-500`), MAIL BLUE (`hover:bg-blue-50
    hover:text-blue-600` — the Ventas mail button is NOT the Eye's
    indigo). The grammar applies on unobservable superset surfaces too
    (the cashiers CRUD — the reference's view is read-only). The table
    badges carry the shadcn hover tints: the StatusPill TABLE variant
    rides `transition-colors hover:bg-primary/80` (measured under a real
    hover: green-100 → the platform violet rgba(127,98,244,0.8) with the
    text tone unchanged, 150ms) and the categoría badge rides
    `hover:bg-secondary/80`; the CARD pill variant (register cards) stays
    hover-free. The Ajustes category chip's remove control is lucide
    TRASH2 `w-3.5 h-3.5` (14×14) — never an X icon. The reference NEVER
    fires a toast in any observable flow (its settings save 403s
    SILENTLY, its product save closes the modal with zero feedback, its
    failed login renders the inline alert) — the clone's zustand toaster
    is the disclosed functional superset; do not chase toast parity.
    COLOR-MIX TRAP: Tailwind v4 computes `bg-primary/80` through
    color-mix and Chromium serializes it as `oklab(… / 0.8)` — even
    canvas fillStyle preserves the notation; read the sRGB PIXEL bytes
    via getImageData (±1 per channel is color-space rounding) or pin
    the class, never the computed string. HOVER EVIDENCE TRAP: every
    agent-browser command after a `mouse move` resets the hover state —
    hover screenshots ride Playwright's `page.mouse` (the v13 lesson),
    with the hover state verified before the shot.

29. The palette pins + the category display order + the reference's
    clipped scrolling (v16, live-measured on both apps): **Tailwind v4's
    default palette is NOT the reference's palette** — the v4 engine
    re-derived every default color in oklch and 17/22 spot-checked
    entries render beyond ±2 per channel of the reference's v3 hexes
    (indigo-500 Δ56, red-500 Δ24, green-700 Δ21, violet-600 Δ24,
    amber-600 Δ8; pixel-read via `scripts/palette-drift-v16.ts`). The
    `@theme` block in globals.css pins every palette entry the app uses
    (61) to its v3 hex — the values the reference renders; utilities,
    /opacity modifiers, ring/shadow/border consumers all inherit. RULE:
    a NEW palette color in any component requires adding its v3 pin in
    the same commit — class parity is NOT color parity on v4 (the
    e2e v3-exactness pins in `tests/e2e/functional-parity-v16.spec.ts`
    read literal `rgb(21,128,61)` / `rgb(217,119,6)` / `rgb(79,70,229)`
    and the pill's pixel bytes). Chart literals (#6366f1,
    DONUT_COLORS) and shadcn tokens (--primary 127 98 244) are exact by
    construction and stay out of the block. The category ENTITIES
    order (Inventario chips + Ajustes categorías) is `sortOrder` —
    seeded to the reference's measured chip sequence (Snacks, Lácteos,
    Higiene Personal, Limpieza, Alimentos, Bebidas) while the DONUT's
    byCategory keeps its own createdAt order (Lácteos first — the v10
    pin; the reference renders two different orders and both are now
    matched); `sortOrder` is server-managed (create computes max+1,
    never client-writable). The reference's pages are VIEWPORT-LOCKED —
    its document never scrolls (scrollTop pinned to 0, no internal
    scroll container): its inventory rows 4-12, its settings sections
    below the fold, and its low-stock card bottom are PERMANENTLY
    UNREACHABLE at 1280×800; the clone's flowing layout is the
    functional superset — future pixel-diffs read full-page height
    deltas against that fact. PROBE TOOLING: a shift close must reset
    BOTH `shift.status` AND `register.status` (the close endpoint
    writes both in one transaction — a direct DB write that skips the
    register leaves phantom "Abierta" cards).

30. The lazy view registry + the CWV evidence (v17, live-measured):
    `src/app/page.tsx` ships NO static view imports — the registry is
    `VIEW_LOADERS` (one dynamic `import()` per view, the named exports
    adapted via `.then((m) => ({ default: m.XView }))`) consumed through
    `React.lazy`, and the boot effect PREFETCHES the active view's chunk
    fire-and-forget in the same parallel window as `/api/auth/me` + the
    collection pre-warm (`void VIEW_LOADERS[activeView]()`), so the
    chunk is resident before `status` flips "ready" (no Suspense gap on
    the standard flow). `<ActiveView />` mounts inside
    `<React.Suspense fallback={null}>`. RULE: never re-add a static
    view import — the monolithic registry billed every route ~69 KiB gz
    of views it never runs (the authed dashboard measured TBT 550 ms /
    perf 54 pre-split; the split took it to 280 ms / 67 — the evidence
    lives in `docs/lighthouse/README.md`). The react-dom boot cost
    (~890 ms) is the framework floor — not actionable. LIGHTHOUSE
    TOOLING: a CDP attach (`--port`) opens a FRESH INCOGNITO context —
    cookies do NOT transfer (the run silently measures the logged-out
    bounce instead of the authed surface); the working channel for
    authed runs is `--extra-headers '{"Cookie":"sf_session=…"}'` with
    the cookie extracted via a Playwright login
    (`scripts/lighthouse-v17-authed.sh`). The dashboard's Lighthouse
    a11y 94 = the disclosed `color-contrast` family PLUS
    `heading-order` (H1→h3, no h2 — measured IDENTICAL on the reference
    2026-10-27); both are reference-parity deviations, not bugs — do
    not "fix" either.

31. The error-recovery architecture (v18, reproduced live): the lazy
    registry NEVER ships a bare Suspense — `<React.Suspense>` mounts
    INSIDE `ViewErrorBoundary` (a class boundary keyed
    `${view}-${viewEpoch}`) so a failed view chunk keeps the SHELL
    (sidebar, app bar) alive. A stale-chunk error (the redeploy case:
    the Turbopack message family, e.g. `ChunkLoadError: Failed to load
    chunk /…​.js from module N`) auto-reloads ONCE per 10 s window via
    `src/lib/chunk-recovery.ts` (the pure injectable seam — the
    `veloxpos:chunk-reload-at` sessionStorage flag is written BEFORE
    the reload fires, the crash-mid-reload loop guard; unavailable
    storage disables the reload, never throws); every other error gets
    the Spanish recovery card ("No se pudo cargar la vista" +
    "Reintentar" — `bg-[#0f121a]` chrome + `glass-button-primary`; the
    card element carries `role="alert"` — V20/F1: the fresh mount IS
    the screen-reader announcement, LANDMARK-SAFE (the role rides the
    card div, never the `<main>` wrapper — one role per element;
    pinned by tests/recovery-a11y.test.ts + the v18 SHELL SURVIVAL
    e2e)).
    "Reintentar" bumps the view EPOCH — the lazy registry is a
    `useMemo` keyed on it, because `React.lazy` caches a rejected
    initializer FOREVER (only a fresh `React.lazy` instance re-imports;
    resetting a boundary alone re-throws the cached error). The outer
    nets: `src/app/error.tsx` (segment — non-view crashes) +
    `src/app/global-error.tsx` (root — self-contained html/body +
    globals.css, zero component-tree imports: a resilience surface
    never stands on the tree that broke). RUNTIME REALITY (measured):
    a SINGLE aborted chunk fetch never reaches the boundary — the
    bundler runtime retries internally and the view renders below it;
    the card is the surface for failures that PERSIST past the runtime
    retry budget (the e2e pins in
    `tests/e2e/functional-parity-v18.spec.ts` block persistently +
    pre-seed the cooldown to suppress the auto-reload). The boot
    prefetch is fire-and-forget-SILENT
    (`VIEW_LOADERS[activeView]().catch(() => undefined)`) — the lazy
    mount owns the surfaced error.

## The mobile drawer contract

The reference has NO working mobile menu (its 220px sidebar squeezes content
at 390px — verified). The clone's drawer (`src/components/layout/mobile-chrome.tsx`)
is the superset: w-72 panel, 8 links, Esc/backdrop/route-change close, body
scroll lock, `aria-expanded` on the hamburger. Geometry (288px panel, uniform
44px link pitch, zero horizontal overflow) is pinned by
`tests/e2e/mobile-navigation.spec.ts` — touching the drawer means running it.
The focus contract (L11) is pinned by `tests/e2e/hygiene.spec.ts`: focus moves
INTO the panel on open (rAF retries verified against `activeElement`),
Tab wraps inside (first⇄last focusable), and close RETURNS focus to the
hamburger. The rAF loop LATCHES once focus lands inside the drawer — a focus
loop must never re-steal focus the user has already moved (the unbounded
retry shape fights the first Tab).

## React conventions that bite

- **No setState synchronously inside effect bodies** — the
  `react-hooks/set-state-in-effect` rule fails lint. Dialogs reset via
  key-remount (`<Dialog key={entity?.id ?? "new"}>` rendered only when open);
  URL-derived state defers with `setTimeout(…, 0)`.
- Next 15+/16 route handlers receive `params` as a Promise — use the
  `withUserParams` wrapper from `src/lib/server/http.ts`, never raw contexts.
- API routes are 3-line shells over the factories
  (`makeCollectionRoutes`/`makeItemRoutes` + delegates from
  `src/lib/server/entities.ts`). Hand-rolled handler logic (sales, shifts,
  reports) still goes through `withUser` + `parseWith` + `toErrorResponse`
  (the full status contract lives in the security section above).
- Zod schemas are strip-mode; partial PATCHes go through `sentKeysPatch` so
  absent keys are never writes.
- State: `useAppStore` (view/chrome) + `usePosStore` (retail collections +
  ticket). Views subscribe with selectors; no React Context.

## Test-suite rules

- vitest matches `src/**/*.test.ts` + `tests/**/*.test.ts` ONLY — e2e
  (`*.spec.ts`) never leaks into it, and vice versa via playwright.config.
- Auth in e2e: the "setup" project signs in ONCE (storageState). Real login
  attempts are rate-limited 10/IP/15min — do not add per-test logins.
- The seeded e2e identity is `owner@veloxpos.local` / `VeloxDemo123!`
  (pinned in `tests/e2e/global-setup.ts` + `tests/e2e/helpers.ts`), NOT the
  developer's local owner from `.env`.
- Never weaken or delete a failing pin to make a gate green — fix the cause.
  The archived study-app tests/scripts live in `scripts/archive-study-sweep/`
  (excluded from tsconfig) and are historical reference only.

## Repo hygiene

- `docs/reference-evidence/` holds the LIVE reference captures (evidence,
  not assets); `docs/screenshots/` holds this app's own screenshots
  (`bun scripts/capture-screenshots.ts` against a running dev server
  regenerates the set).
- Git: single-branch (`main`), no merge commits without need; pushes go
  through `docs/ssh_git_wrapper_v3.py` (see
  `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`).
- Do not commit `db/*.db`, `.env`, `dev.log`, `server.log`, or
  `tests/e2e/.auth/` (all gitignored).
