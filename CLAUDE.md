# CLAUDE.md — VeloxPOS

Guidance for Claude Code sessions in this repository. Generated per the
`skills/claude-md` skill; verified against the actual configs (commands exist,
versions match lockfiles). Agent-focused gotchas live in `AGENTS.md` — this
file covers the working contract: project shape, conventions, and the
validation loop.

## Project Overview

- **Product**: VeloxPOS — a Spanish-language retail point-of-sale (terminal,
  inventory, sales history, registers, cashiers, reports, store settings),
  self-hosted as a functional superset of `veloxposretail.base44.app`.
- **Stack**: Next.js 16.4 (App Router, standalone output, Turbopack) · React
  19 · TypeScript 5 (strict) · Tailwind CSS **v4** (CSS-first) · Prisma 6 +
  SQLite · Zustand 5 · Zod 4 · Vitest 5 + Playwright 1.5x · Bun 1.3 runtime.
- **Shape**: ONE page (`src/app/page.tsx`) renders all 8 views; the
  PascalCase routes are `rewrites()` in `next.config.ts`. Server state flows
  through `src/app/api/**` route handlers; client state lives in two Zustand
  stores (`src/lib/store.ts`).

## Commands

```bash
bun install            # deps (bun 1.3; scripts assume bun)
bun run dev            # dev server :3000 (tees to dev.log)
bun run lint           # eslint 9 (flat config)
bun run typecheck      # tsc --noEmit — run BEFORE tests
bun run build          # production standalone build (REQUIRED before e2e)
bun run test           # vitest unit layer (486 tests / 33 files)
bun run test:e2e       # playwright e2e layer (176 specs, boots standalone :3100)
bun run db:push        # prisma db push (schema-anchored, see AGENTS.md)
bun run db:seed        # seed the owner + the reference dataset
```

The full gate, in order: `lint → typecheck → build → test → test:e2e`.
Never skip a failing gate; never weaken a pin to pass.

## Project Conventions (verified from the codebase)

### File organization

```
src/app/            ONE page + /login /signup /reset-password + not-found + api/**
src/app/api/        route handlers: thin shells over src/lib/server factories
src/components/
  layout/           sidebar (dark, 220/68px), mobile-chrome (app bar + drawer)
  views/            the 8 view components (terminal, dashboard, inventario,
                    ventas, cajas, cajeros, reportes, ajustes)
  pos/              shared presentational pieces (StatCard, charts, pills)
  ui/               shadcn/radix primitives (do not hand-roll new ones)
  auth/             login + signup surfaces (LIGHT theme)
src/lib/            pure domain seams: money, ticket, date (es-MX), router,
                    validation (Zod), api (fetch seam), db-path, store (zustand)
src/lib/server/     next/headers-dependent layer: auth, http (route factories),
                    entities (delegates)
prisma/             schema.prisma + seed.ts (reference dataset)
tests/              vitest units (*.test.ts) + e2e/ playwright (*.spec.ts)
docs/               investigation dossier, plan, v4 trap report, evidence
```

### Naming & language

- UI copy is **Spanish** (reference parity); code identifiers are English.
- Views are `<name>-view.tsx`; dialogs are local to their view file unless
  shared (`src/components/pos/`).
- Routes are PascalCase as the reference spells them: `/Sales`, `/Registers`,
  `/Cashiers`, `/Reports`, `/StoreSettings` (NOT /Ventas /Cajas /Cajeros /
  /Reportes /Ajustes — those are aliases). Terminal is `/`.

### State management

- Zustand stores only — no React Context, no prop drilling of server data.
- `useAppStore`: active view (synced with `location.pathname` via
  `viewFromPath`), sidebar collapse (persisted), mobile drawer open.
- `usePosStore`: products/categories/registers/cashiers/shifts/sales/settings
  collections + the in-progress ticket + `activeShift` (an OPEN shift gates
  the Terminal). Mutations go through the api seam and settle back into the
  store via `loadCollections`.
- Dialog form state resets by **key-remount**, never by effect writes (the
  `react-hooks/set-state-in-effect` lint rule).

### API patterns

- Collection: `makeCollectionRoutes(delegate)` → GET list + POST create.
  Item: `makeItemRoutes(delegate)` → PATCH + DELETE (ownership-checked 404).
- Money crosses the boundary as decimal strings and is parsed to integer
  cents by `moneyCents` in `src/lib/validation.ts`.
- Ticket numbers are generated SERVER-side (`src/lib/ticket.ts`, `V-` +
  8 base-36); sale prices/IVA always recompute from DB rows, never client
  input; stock decrements inside the sale's transaction.
- Errors: Zod → 400 · P2002 → 409 · P2025 → 404 · no session → 401 ·
  unknown → 500 (details logged server-side only).

### Styling (Tailwind v4)

- CSS-first config: `@theme`/`@theme inline` in `src/app/globals.css`; there
  is NO `tailwind.config.js`. Custom utilities are `@utility vx-*`.
- The five trap rules in `AGENTS.md` (§ Tailwind v4 traps) are enforced by
  `tests/tailwind-traps.test.ts` — read them before touching layout CSS.
- Design tokens are reference-measured (canvas `#080a14`, surface `#0d0f1a`,
  border `#1e2235`); the store's two configurable colors ride the
  `--vx-primary` / `--vx-secondary` CSS vars (Ajustes → Personalización).

### Testing

- Unit (vitest, node env): pure seams — money/ticket/date/router/validation/
  schema/db-path/auth/api-timeout/api-offline + the remediation pins
  (security-hardening, http-body, sale-integrity, visual-parity, hygiene)
  + source pins (tailwind-traps, schema). `bun run test`.
- E2E (playwright, chromium): boots the standalone build on :3100 against
  `db/e2e.db` (force-reset per run). Auth once via the setup project's
  storageState. Remediation specs: `security.spec.ts` (R1, production
  posture), `sale-integrity.spec.ts` (R2), `visual-parity.spec.ts` (R3,
  computed styles with OKLCH probe comparison), `hygiene.spec.ts` (R4,
  toast + drawer focus). `bun run test:e2e` (build first!).
- A11y: axe smoke (critical/serious, color-contrast excluded as a disclosed
  parity deviation) in `tests/e2e/a11y-smoke.spec.ts`.
- Visual contract: `SectionCard` has `variant="card"` (dashboard/ajustes
  h3 title-case slate-700 16px) vs `variant="kicker"` (reports h2
  uppercase white/60 14px) — measured live; the H1 is 24px FIXED at every
  width (Reports is the reference's only BRIGHT H1 — `tone="bright"`
  white/90). The TAB TITLE
  is per-route and PATH-driven (v9: `documentTitleForPath()` — exact-case
  canonical match, slug-case everything else, e.g. "/SALES" → "SALES |
  VeloxPOS"; the 404 slug title rides the guarded observer in
  `src/app/not-found-title.tsx`; the Spanish aliases resolve to their
  views via `SPANISH_ALIASES`). Chart X labels thin the REFERENCE's way
  (v10: ≤14-day windows label every day; longer windows step
  `ceil((count-1)/9)` from the window start — 30 → every 4th, 90 → every
  10th; the last day is NOT force-labeled); Y labels are integers ($ on
  Reports).
- The auth round-trip (v8): a logged-out app route bounces to
  `/login?from_url=…` and login RETURNS there through
  `safeReturnTo(raw, origin)` (`src/lib/router.ts` — same-origin only,
  fails closed to "/"). Dialogs ride `bg-[#0f121a] text-[#e7e9ef]`;
  dropdown panels `bg-[#161922]`; the ticket modal is the reference's
  2×2 meta grid + `{qty}x` lines; the mail action prompts for the
  recipient; the Ajustes colors carry editable hex inputs.
- The v9 contracts: the Spanish route aliases render their views
  (`SPANISH_ALIASES` — the ref 404s them; the clone's superset works);
  tables are BARE `<table class="w-full">` (cells carry their own sizes —
  the Ventas Total inherits the ref's 16px); the foreground family is
  #e7e9ef; `SalesAreaChart` has two measured skins
  (`variant="dashboard"` vs `"reports"` — gridlines/labels/line/gradient
  all differ); the dashboard has NO footer credit (the ref ends at the
  low-stock rows).
- The v13 contracts: the chart HOVER micro-interactions — the sales
  chart renders the recharts hover artifacts (the #ccc cursor line
  spanning the plot at the active x, the r-4 activeDot in the line color
  with the #fff 2px stroke) and the recharts DEFAULT tooltip content (the
  margin-0 day label + the ul/li item in the LINE color: the literal
  `ventas` + " : " + the RAW value, 16px) on the v11 white-card skin; the
  tooltip anchors at (point.x + 10, POINTER.y + 10) — the x snaps, the y
  follows the mouse — with the right-edge left-flip, the transform 400ms
  glide, and the PERSISTENT wrapper (leave flips visibility, never
  unmounts). The DONUT tooltip is its OWN raw skin: the 1px #ccc border,
  NO radius, NO shadow, the empty label p, the black `name : raw-count`
  item, anchored at the sector's ring midpoint with the same flip/glide.
- The v14 contracts: the dialog motion + geometry family — the shared
  `max-w-lg` (512px) base with `rounded-2xl sm:rounded-lg` (16px
  full-bleed below sm / 8px at ≥sm), the FULL tailwindcss-animate grammar
  on the content (fade + zoom + the slide quartet
  `slide-in-from-left-1/2`/`slide-in-from-top-[48%]` and the out mirrors)
  and the FADING overlay (`animate-in fade-in-0` / `animate-out
  fade-out-0` — never a snap), and the tw-animate `.15s` default — NO
  `duration-` class on the dialog (Tailwind 4.3.3 threads `--tw-duration`
  to 200ms where the reference's older stack leaves its own duration-200
  inert); NO per-surface width overrides (every DialogContent rides the
  base; the inventory editor keeps only `max-h-[90vh] overflow-y-auto`).
  The focus family: `vx-focus` draws the deterministic violet outline
  (`outline: 3px solid rgba(127, 98, 244, 0.5)` on :focus-visible — the
  retired indigo 129,140,248 halo stays retired) and a global base-layer
  `outline-color: rgba(127, 98, 244, 0.5)` recolors every UA-default
  outline violet (the platform mechanism). The reports empty states are
  the measured `flex h-40 items-center justify-center text-sm
  text-white/25` boxes and the three reports cards carry
  `titleClassName="mb-5"` (the 20px heading gap). The sidebar collapse is
  MEASURED AT PARITY (220↔68px, 300ms, labels conditionally removed) —
  do not re-audit.
- The v16 contracts: **the Tailwind v4 default palette is NOT the
  reference's palette** — the v4 engine re-derived every default color
  in oklch and 17/22 spot-checked entries render beyond ±2 per channel
  of the reference's v3 hexes (indigo-500 Δ56, red-500 Δ24,
  green-700 Δ21, violet-600 Δ24 — pixel-read via
  `scripts/palette-drift-v16.ts`); the `@theme` block in globals.css
  pins every used entry (61) to its v3 hex, a NEW palette color
  requires its pin in the same commit (class parity ≠ color parity;
  the e2e v3-exactness pins read literal rgb(21,128,61) /
  rgb(217,119,6) / rgb(79,70,229) + the pill's pixel bytes — the
  color-mix /opacity modifiers serialize oklab even over hex vars,
  pixel-reads carry those). The category ENTITIES order (Inventario
  chips + Ajustes categorías) rides `Category.sortOrder` — seeded to
  the reference's chip sequence (Snacks, Lácteos, Higiene, Limpieza,
  Alimentos, Bebidas), server-managed (create = max+1, never
  client-writable), while the donut's byCategory KEEPS its own
  createdAt order (Lácteos first — the v10 pin; the reference renders
  two different orders, both matched). The reference's pages are
  VIEWPORT-LOCKED (no document scroll — its inventory rows 4-12 and
  settings sections below the fold are unreachable at 1280×800); the
  clone's flowing layout is the functional superset. Probe tooling: a
  shift close must reset BOTH shift.status AND register.status.
- The v17 contracts: the view registry is LAZY — `VIEW_LOADERS` (one
  dynamic `import()` per view) consumed through `React.lazy` with the
  boot effect prefetching the ACTIVE view's chunk in parallel with
  auth/me + the pre-warm (`void VIEW_LOADERS[activeView]()`, the
  Suspense fallback null — no gap on the standard flow); never re-add
  a static view import (the monolith billed every route ~69 KiB gz;
  the split took the authed dashboard TBT 550→280 ms, perf 54→67 —
  the evidence + methodology live in `docs/lighthouse/README.md`,
  including the CDP-incognito lesson: authed Lighthouse runs need
  `--extra-headers Cookie`, a `--port` attach silently measures the
  logged-out bounce). The dashboard's Lighthouse a11y 94 = the
  disclosed color-contrast family + heading-order (H1→h3 — measured
  identical on the reference; parity wins).
- The v15 contracts: the hover micro-interaction families — every
  row-action icon button carries `rounded-lg p-2 text-slate-400
  transition-colors` + its per-action family (edit/detail indigo,
  delete red, MAIL blue — `hover:bg-blue-50 hover:text-blue-600`); the
  StatusPill TABLE variant rides `transition-colors
  hover:bg-primary/80` (the measured violet-at-80% hover tint) and the
  categoría badge `hover:bg-secondary/80` (the CARD pill stays
  hover-free); the Ajustes category chip's remove control is lucide
  Trash2 `w-3.5 h-3.5` (14×14); the reference NEVER fires a toast in
  any observable flow (settings save 403s silently, product save is
  feedback-free, failed login renders the inline alert) — the clone's
  toaster is the disclosed superset.
- The v12 contracts: the auth surface family measured BELOW the card —
  the card chrome (the 4px slate gradient hairline + overflow-hidden +
  `md:pt-12 md:pb-10 md:px-10` + the space-y-6/8 text-center column),
  the login grammar (H1 `text-2xl sm:text-3xl`, subtext `text-sm
  sm:text-base font-medium`, social `text-[16px]` 54px with the `-ml-4`
  icon offset, the OR chip with the literal "or", the sm-stepped form
  groups, the Forgot/Sign-up footer ROW inside the form, the `h-11
  sm:h-12` submit), the forgot/sent screens in the reference's ENGLISH
  family (back-at-top `-mb-2`, 24px H2, `h-10 sm:h-11` controls, the
  sent screen's slate-100 icon circle + the green alert; the in-app
  reset link rides inside the alert as the no-SMTP superset), the
  /reset-password page as the platform template (white page, the
  rounded-lg card + 2px bg-gray-900 strip, the gray palette, New
  Password + Confirm at h-11, the Invalid Reset Link state), and the
  shadcn Alert family for every auth error/success note
  (bg-X-50/70 border-X-200 rounded-xl p-4 + text-X-700 text-sm
  leading-relaxed).
- The v11 contracts: the charts are container-responsive the recharts way
  (`useContainerWidth` — measure at commit + ResizeObserver; FIXED heights
  dashboard 280 / reports 220 / donut 200; the donut's ring FIXED at
  innerR 50/outerR 80 with cx = box/2 capped at 333 — never aspect-lock a
  chart SVG); the focus grammar is the reference's (app controls ring-1
  in #7f62f4 with no offset, `--ring: 127 98 244`; the Switch ring-2 +
  offset-2 over the #0f121a surface `--background`; the glass buttons
  outline 3px solid rgba(127,98,244,0.5) with NO cva focus ring; the auth
  inputs slate-400 ring-2 over a WHITE offset with pl-10 / h-11 sm:h-12 /
  md:text-sm / slate-600 placeholders and the 3px white submit outline);
  Input/Textarea ride text-base md:text-sm + shadow-sm, the SelectTrigger
  is rounded-xl (the dropdown panel stays rounded-md), the label→control
  gap is mt-1; the charts carry the measured white tooltip card
  (readable dark text — the ref's own is unreadable); reports tick pins
  are date-relative (windows anchor to the current day).
- The v10 contracts: the category donut is the ref's recharts rendering
  (`sectorPath()` filled paths, ring 50/80 at (166.5,100) in 333×200,
  CCW from 3 o'clock, trailing 4° gap, #fff 1px strokes, the
  #6366f1→#22c55e palette by original index, legend = FIRST 5 rows
  stacked below with slate-600/700 rows); the low-stock header gap is
  mb-3; the Ajustes headers carry per-section icons (Store/indigo,
  Palette/purple, FileText/green, CreditCard/blue, Tag/amber at w-5
  h-5); the SEED mirrors the ref's observable data exactly (product
  page order + the real 12th row "Jabón Zote 400g"/7501025403010/19,
  Caja 2 before Caja 1, sales at 19/04/26 22:09 + 14/03/26 01:45 with
  the second's real items → the dashboard chart renders FLAT and the
  reports render "Sin datos en este período" like the ref); every
  list orders `[{createdAt asc},{id asc}]` (deterministic against
  SQLite tie order).
- Table contract (v5, live-measured): headers `text-xs font-semibold
  text-slate-500 uppercase` per-column-aligned; rows ride
  `border-b border-slate-50` + `hover:bg-white/40`; body cells `text-sm
  text-slate-600` px-5 py-3; the ticket cell is `font-mono text-indigo-600`;
  StatusPill has TWO shapes — `variant="table"` (6px soft badges:
  green-100/green-700, slate-100/slate-500) vs `variant="card"` (the
  register-card rounded-full pill); the categoría badge rides the shadcn
  `bg-secondary` token (the reference's neutral #212531, NOT violet).

## Framework-specific checklist (Next.js 16)

- Route handler `params` are a Promise — use `withUserParams`.
- `useSearchParams` needs a Suspense boundary — the auth pages avoid it
  (no search-param reads at module scope).
- `output: "standalone"`: the build copies `static/` + `public/` into the
  standalone dir (see the `build` script) — don't bypass the script.
- `allowedDevOrigins` pins `127.0.0.1`/`localhost` (Next 16 dev-origin
  protection) — extend it, don't remove it.
- Client components: `"use client"` at the top; server components never
  import the stores.

## Validation loop (every change)

1. `bun run lint` — zero errors expected.
2. `bun run typecheck` — strict, no `any` (use `unknown` + narrowing).
3. `bun run build` — before claiming anything about prod behavior.
4. `bun run test` — unit layer green.
5. `bun run test:e2e` — for anything touching views, routes, chrome, or APIs.
6. Update the doc chain when behavior/commands change: AGENTS.md, CLAUDE.md,
   README.md, Project_Architecture_Document.md, worklog.md.
