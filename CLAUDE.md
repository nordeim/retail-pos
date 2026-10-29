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
bun run test           # vitest unit layer (580 tests / 43 files)
bun run test:e2e       # playwright e2e layer (207 specs, boots standalone :3100)
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
- The v18 contracts: the error-recovery architecture — the lazy
  registry never ships a bare Suspense (`ViewErrorBoundary` wraps it,
  keyed `${view}-${viewEpoch}`, so a failed view chunk keeps the
  SHELL alive); stale-chunk errors (the Turbopack `ChunkLoadError:`
  family) auto-reload ONCE per 10 s window through the pure seam
  `src/lib/chunk-recovery.ts` (the `veloxpos:chunk-reload-at` flag
  written BEFORE the reload — the loop guard; guarded storage access);
  every other error renders the Spanish card ("No se pudo cargar la
  vista" + "Reintentar"); Reintentar bumps the view EPOCH (the lazy
  registry is a `useMemo` keyed on it — `React.lazy` caches rejected
  initializers forever, only a fresh instance re-imports); the outer
  nets are `src/app/error.tsx` (segment) + `src/app/global-error.tsx`
  (root, self-contained html/body + globals.css, zero component-tree
  imports); the boot prefetch is fire-and-forget-SILENT (`.catch(() =>
  undefined)`). Measured: a SINGLE aborted chunk fetch never reaches
  the boundary (the bundler runtime retries internally) — the card is
  for failures persisting past the runtime retry budget.
- The v20 contracts: the recovery cards ANNOUNCE — each of the three
  failure surfaces (the view card in `page.tsx`, the segment card in
  `error.tsx`, the root card in `global-error.tsx`) carries
  `role="alert"` on the card element that MOUNTS with the failure
  (the fresh mount of a live-region element is the screen-reader
  announcement). LANDMARK-SAFE placement: the role rides the card
  div, NEVER the `<main>` wrapper (one role per element —
  `role="alert"` on main would delete the main landmark). Pinned by
  `tests/recovery-a11y.test.ts` (source pins) + the v18 SHELL
  SURVIVAL e2e assertion (the live failure path). A disclosed
  superset: the reference ships no recovery surface at all and
  neo-crm's own cards carry no role (ADR-029).
- The v21 contracts: the deployment surfaces tell the truth —
  Dockerfile/docker-compose carry the VeloxPOS identity (service
  `veloxpos`, image `veloxpos:latest`, `VELOXPOS_PORT`),
  `docs/DEPLOYMENT.md` documents the ACTUAL app (the 6-var env
  contract, the real verification commands, the live route-handler
  count, the renamed Docker walkthrough, the account-security API as
  the disclosed API-only superset — no /rum, no export/import, no
  smoke-test), `bun.lock` is the SINGLE lockfile (the npm one was
  removed), and the four account-security routes
  (change-password/change-email/delete-account/resend-verification —
  real, rate-limited, password-first scaffold inheritances the
  reference lacks) are behaviorally pinned by
  `tests/e2e/account-security.spec.ts` + the source pins in
  `tests/deployment-surfaces.test.ts` (ADR-030; Known-Issue #6
  closed).
- The v22 contracts: the account-security superset is UI-wired — the
  **Mi Cuenta** SectionCard in Ajustes (SD-85: sixth section,
  ShieldCheck/rose-500 at the measured 20px — the tone the five store
  sections leave free; the v10 icon pin counts SIX now) renders the
  /api/auth/me identity readout (email + Verificada badge +
  member-since) and drives change-password / change-email through the
  Dialog family (42px footer, glass buttons, key-remount) and
  delete-account through a plain Dialog + the new
  `glass-button-danger` utility (the warning-ramp extension
  precedent; the AlertDialog primitive stays unused — its cva
  defaults clobber glass fills, the F6 trap). The signup verify stage
  DISPLAYS the register response's code (F2 — previously discarded:
  signup verification was UI-unusable on a no-SMTP install); the
  login 403 renders the verify sub-card (F3 — the code entry +
  "Resend the code" + the delivered-code note, a plain DIV never a
  nested form — HTML forbids `<form>` in `<form>` and hydration
  rejects it; the resend's neutral branch never leaks account state).
  `AppUser` carries `emailVerified`. Pinned by `tests/account-ui.test.ts`
  (13 source pins at v22) + `tests/e2e/account-ui.spec.ts` (9 behavioral
  tests at v22 — one scratch account, delete LAST, the verify bucket isolated
  via the H3 xff precedent because the shared localhost verify budget
  runs at exactly 10/15min; v23 grew both to 21 pins + 10 tests).
- The v23 contracts: the profile/name-edit superset — `POST
  /api/auth/update-profile` (`{ fullName }` → `{ ok, name, user }`;
  trim-validated 1–100 chars, must-differ 400, per-user rate limit
  10/15min, and DELIBERATELY no password proof: `fullName` is a benign
  display field — the store-settings-PATCH posture, not the
  credential-rotation posture; ADR-032). The "Cambiar nombre" dialog
  (the fourth Mi Cuenta action, between the email rotation and the
  destructive exit) PREFILLS the current name and patches the readout
  through the `onChanged` seam (the change-email precedent); the two
  V22 action pins grew to the four-action superset (extend, never
  weaken). The route-count pin in deployment-surfaces counts 28 route
  handlers now — DEPLOYMENT.md §10 carries the update-profile row.
- The v30 contracts: the advisories re-triage (the neo-crm session-198
  doctrine adopted) — the manifest-truth family's OTHER half. The
  repo-included security-and-hardening skill's Always-Do tier ("Run
  `npm audit` (or equivalent) before every release") had never run
  here; the first live run found 2 highs: **zod 4.6.5 < 4.6.6**
  (GHSA-mrhx-c7xc-m3w5, memory exhaustion validating oversized
  constrained collections) on the DIRECT runtime validation chain,
  and **deepmerge-ts 7.1.5 < 8.0.0** (GHSA-ggr8-5vv4-36mx) on the
  prisma CLI's dev-toolchain. The cure: `bun add zod@^4.6.6` (root
  4.6.7) + **`overrides.zod: "^4.6.6"` + reinstall** — the override
  is LOAD-BEARING (observed live: the bare add hoisted the root while
  a NESTED `eslint-plugin-react-hooks/zod@4.6.5` survived on disk —
  the D-198a1 shape; the override dedupes the tree to one hoisted
  ≥-floor copy; the post-cure audit = 1 high, the documented
  deepmerge-ts decline). The pins (the census suite's advisories
  block, born-RED): the EXHAUSTIVE lockfile zod floor (every
  `zod@x.y.z` resolution ≥ 4.6.6 — first-match/root-only passes a
  nested copy), the manifest range floors (direct dep + override),
  and the PAD §6 ledger row's whitespace-normalized content pin (the
  D-198a2 teeth — the census claim can no longer drift silently).
  A HIGH on a runtime chain is fixed in-cycle through the package
  manager; dev-toolchain members are documented declines with the
  re-triage clause. Editing the zod floors, the overrides block, or
  the ledger row means running the census.
- The v29 contracts: the public-surface coverage audit (the neo-crm
  session-197 doctrine adopted — a decoded, behavior-pinned surface can
  still have ZERO gate teeth on its designed content). (1) The 404
  content-family freeze (`tests/e2e/not-found-surface.spec.ts`): the
  level-1 h1 BY ROLE+LEVEL (getByText passes on a demoted div — the
  s197 mutation shape), the exact body copy, the "404" badge + its
  80×80 geometry, the CTA's accessible name, and the card's measured
  max-w-md 448px are pinned; mutation-proven ×2 (the planted h1→div
  demotion and the copy drift each RED at the exact assertion, zero
  collateral). (2) The a11y register COMPLETED: /signup and
  /reset-password (both public — the SD-20 superset posture) join the
  smoke's register (the V24 doctrine's "every public surface" — the
  register had login + 404 only); the axe `label` rule's
  placeholder-acceptance (the non-empty-placeholder check) means a
  label-disconnection regression is NOT caught by the scan while
  placeholders exist — the mutation proof strips BOTH the htmlFor and
  the placeholder (a bare input) to demonstrate the teeth. (3) The
  D-197a2 NAME form: count-anchored live descriptions of the LIVE_DOCS
  set go stale the day a doc joins — the array is the source of truth,
  the name form never goes stale (historical records untouched).
- The v28 contracts: the shipped-artifacts truth pass — (1) every
  LIVE operational doc (the six-doc set: README, AGENTS, CLAUDE, PAD,
  SKILL, DEPLOYMENT.md) references only scripts that exist (the
  deployment-surfaces pin's block 10 — F1 swept the stale
  "assets regenerate via a repo script" claim that rode AGENTS/SKILL
  since v6: the v6 workspace's generator never shipped; the head
  assets are one-time-generated committed evidence); historical
  session logs and executed plans under docs/ are archives of what
  was true at their own time and stay out of the pin's scope by
  design. (2) The dependency census (`tests/dependency-census.test.ts`)
  — every manifest package earns its place: a live string reference
  across the executable surface (src/, tests/, scripts/ minus the
  archive, prisma/, the root configs, package.json's own scripts
  block) or an explicit INFRA allowlist row (react-dom — the Next
  runtime peer; @types/react + @types/react-dom — TSX compilation).
  V28/F2 retired four dead riders (react-radio-group,
  react-scroll-area, react-toast — the repo's toaster is the custom
  zustand build — and bun-types, empirically dead: tsc passes with
  the package removed). Editing package.json dependencies means
  running the census.
- The v27 contracts: the shell title-guard — the tab-title effect in
  `src/app/page.tsx` carries the GUARDED write + the armed
  MutationObserver (the not-found-title.tsx v7 pattern ported to the
  shell): Next's client metadata manager re-applies the root layout
  title 5-6 times per boot (last write ~295ms post-commit — the
  probe-v27 ledger) and the shell's write lands as little as 9ms after
  it; a bare write is a permanent-clobber race under load variance (the
  v9 Spanish-alias title flake's root cause, closed this cycle). The
  guard wins the last write: apply-when-different, correct on any head
  mutation, disconnect on cleanup. Pinned by `tests/title-guard.test.ts`
  (source) + `tests/e2e/title-guard.spec.ts` (the controlled-clobber
  correction + the post-nav re-arm); editing the title effect means
  running both.
- The v26 contracts: the failure-path truth pass (ADR-035 — the ADR-033
  doctrine continued at the unit layer). The health route's DEGRADED
  branch is pinned by `tests/health-route.test.ts`
  (`vi.mock("@/lib/db")` — the PrismaClient is never constructed, so the
  probe is made to reject deterministically with zero DB involvement;
  both branches pinned: 200/ok + 503/degraded — the Docker healthcheck's
  `r.ok?0:1` leans on the 503). The boot-guard WIRING is pinned by
  `tests/boot-guard-wiring.test.ts` (register(): fatal → console.error +
  process.exit(1) SPIED — never a real exit; warn → console.warn, no
  exit; ok → silent) — and the stale citation that claimed
  "pinned by tests/e2e/s22-boot-guard.spec.ts" (a spec deleted with the
  V1 study-layer archive) is swept. Both pins mutation-proven (the
  planted 503→200 and exit→throw defects went RED at the exact
  assertions). Editing the health route or instrumentation.ts means
  running those two specs.
- The v25 contracts: the drawer-open SPINE FREEZE (the neo-crm
  session-196 doctrine adopted) — the mobile drawer's RENDERED geometry
  ledger is now e2e-pinned at TRUE 390×844: panel [0,0,288,844] · header
  [0,0,287,69] · nav [0,69,287,727] · footer [0,796,287,48] · close
  [235,16,36,36] · 8 links at [12,y,263,40] y=81+44k + the "VeloxPOS"
  wordmark (the expect.poll starved-read idiom — the slide-in must
  settle; exact equality on rounded reads; the heights are
  padding-driven, not font-driven). Mutation-proven: a planted mb-2 on
  the drawer header (the trap-4 computed-margin shape) goes RED at the
  nav/link/footer boxes while every OTHER drawer pin stays green — the
  battery gap the freeze closes. The lg-BREAKPOINT CLOSE is pinned too
  (cross 390→1280 closes the drawer + resets aria-expanded; back to 390
  it STAYS closed — no mobileMenuOpen state leak; the lg:hidden chrome
  asserts with toBeHidden, never toHaveCount(0) — display:none keeps
  the element in the DOM). Both live in mobile-navigation.spec.ts
  (199→201).
- The v24 contracts: the gate-coverage truth pass (ADR-033 — the
  neo-crm session-195 doctrine adopted: a shipped behavioral claim
  that a doc or consumer leans on, but that no standing assertion
  pins, is a latent regression). The 404 contract now carries its TRUE
  HTTP status pin (a `page.request.get` line inside navigation's
  existing test — `page.goto` tolerates any status); the public 404
  surface is registered in the a11y smoke at BOTH widths (the
  logged-out anon-surface form); `/api/health`'s body contract
  (`{status:"ok",db:"up",app:"veloxpos"}`) is pinned by its own spec
  (three documented consumers — the webServer boot poll only proves
  a 2xx); and the Playwright webServer child env PINS
  `RESET_INAPP_DELIVERY: ""` + `AUTH_PROXY_HOPS: "0"` after the
  `...process.env` spread (the N-69a "the dev server lies" family — a
  stray parent-shell export used to be able to flip the C1 production
  posture or the H3 verify-bucket isolation). The harness's own
  contract (isolated e2e.db, NODE_ENV=production, the 64-hex
  AUTH_SECRET, the pinned seed identity) is frozen by
  `tests/e2e-harness.test.ts` — editing playwright.config.ts or
  global-setup.ts means running it.
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
