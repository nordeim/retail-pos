---
name: retail-pos
description: >
  VeloxPOS — a self-hosted Spanish-language retail point-of-sale (terminal,
  inventory, sales history, registers, cashiers, reports, store settings)
  built as a functional-superset clone of veloxposretail.base44.app on
  Next.js 16 + React 19 + Prisma/SQLite, hardened through the v3 remediation
  (security, data integrity, visual parity, hygiene). This SKILL is the
  codebase-verified engineering reference for future agents: architecture,
  contracts, anti-patterns, debugging procedures, and pre-ship gates.
version: 1.20.0
last_updated: "2026-10-28"
tags:
  - pos
  - retail
  - nextjs
  - prisma
  - sqlite
  - tailwind-v4
  - zustand
  - security-remediation
---

# retail-pos_SKILL.md — VeloxPOS Engineering Reference

> Distilled per `skills/to-distill-project-into-skill` (six-phase process)
> and `skills/distill-codebase-skill` (the post-remediation reference
> template), validated against the codebase at the v26 remediation close:
> **lint 0 · tsc 0 · build ✓ · 563/563 unit · 201/201 e2e** (the v26
> close: the failure-path truth pass — the ADR-033 gate-coverage doctrine
> continued at the unit layer: the health route's DEGRADED branch
> (catch → 503 + the degraded body — the Docker healthcheck's
> `r.ok?0:1` leans on it) pinned by `tests/health-route.test.ts` via
> `vi.mock("@/lib/db")` (the mock is hoisted above the import — the
> PrismaClient is never constructed; the "breaking the DB mid-suite"
> objection dissolves at the unit layer), and the boot-guard WIRING
> (register(): fatal → console.error + process.exit(1)) pinned by
> `tests/boot-guard-wiring.test.ts` (process.exit SPIED — never a real
> exit) with its stale citation — the comment claimed "pinned by
> tests/e2e/s22-boot-guard.spec.ts", a spec deleted with the V1
> study-layer archive — swept (the repo-wide citation sweep: 16 test
> citations in src/, 15 resolved, 1 stale). Both MUTATION-PROVEN (the
> planted 503→200 defect went RED at the status assertion; the planted
> exit→throw defect went RED at both fatal-path tests while the
> pure-seam env-check pins stayed green — the battery gap demonstrated;
> restored → GREEN); ADR-035, PAD v2.13.0). The prior close (v25): the
> drawer-contract completion — the drawer-open SPINE FREEZE,
> the neo-crm session-196 doctrine adopted (the s195a1 wire-freeze
> doctrine's next member): the mobile drawer's RENDERED geometry ledger
> is e2e-pinned at TRUE 390×844 (panel [0,0,288,844] · header
> [0,0,287,69] · nav [0,69,287,727] · footer [0,796,287,48] · close
> [235,16,36,36] · 8 links at [12,y,263,40] y=81+44k + the VeloxPOS
> wordmark — the expect.poll starved-read idiom, exact equality on
> rounded reads), MUTATION-PROVEN (a planted mb-2 on the drawer header
> went RED at the nav/link/footer boxes — nav y 69→77, links +8 — while
> the other 11 drawer tests stayed green: the battery gap demonstrated
> live), and the lg-breakpoint close pinned in the same spec (390→1280
> closes + aria reset; back at 390 it STAYS closed — no mobileMenuOpen
> state leak; lg:hidden asserts with toBeHidden, never toHaveCount(0) —
> display:none keeps the element in the DOM); ADR-034, PAD v2.12.0; the
> RED run caught two first-draft pin defects — the transcribed y=12 vs
> the measured 81, and the toHaveCount(0) shape). The prior close (v24):
> the gate-coverage truth pass — every shipped behavioral claim
> a doc or consumer leans on now carries a standing assertion: the
> true-HTTP-404 status pin, the public 404 registered in the a11y
> smoke at both widths, the /api/health body contract pinned by its
> own spec, the e2e webServer child env shell-state-proof
> (`RESET_INAPP_DELIVERY: ""` + `AUTH_PROXY_HOPS: "0"` pinned after
> the spread — the neo-crm N-69a doctrine), the 64-hex AUTH_SECRET
> truth-restored, and the harness contract frozen by
> `tests/e2e-harness.test.ts`; ADR-033, PAD v2.11.0; the RED run
> itself caught the 62-hex secret under a 64-hex claim). The
> prior close: the account-security loop closed end-to-end — the "Mi
> Cuenta" UI in Ajustes (change-password / change-email / delete-account
> dialogs + the identity readout), the signup verify stage's
> self-hosted code note (the discarded-OTP bug fixed), and the login
> 403's verify/resend sub-card; ADR-031, PAD v2.9.0, Known-Issue #7
> closed; the nested-form hydration lesson — a `<form>` inside the
> login `<form>` silently never submits, the verify card is a plain
> DIV). The prior
> close: the deployment-surface truth pass — Dockerfile + docker-compose
> rebranded to the VeloxPOS identity (service `veloxpos`, image
> `veloxpos:latest`, `VELOXPOS_PORT`), `docs/DEPLOYMENT.md` rewritten to
> the ACTUAL app (the full env contract, the real verification commands,
> the live route-handler count, the account-security API §10 — no
> scaffold-era /rum or /export or smoke-test references), the four
> scaffold account-security routes kept as the disclosed API-only
> superset and pinned end-to-end by the new
> `tests/e2e/account-security.spec.ts` + 16 source pins in
> `tests/deployment-surfaces.test.ts` (ADR-030; Known-Issue #6 CLOSED;
> `package-lock.json` removed — `bun.lock` is the single lockfile);
> the v20 close: the recovery cards announce — `role="alert"` on the card
> element that MOUNTS with the failure in all three V18 surfaces
> (view/segment/root), LANDMARK-SAFE (never on the `<main>` wrapper —
> one role per element), TDD-pinned RED→GREEN by source pins + the
> live failure-path e2e assertion — a disclosed superset beyond both
> the reference (no recovery surface) and neo-crm (no role on their
> cards); the v19 close was audit-clean — no code changes, the mobile
> evidence set + the self-contained probe tooling; the v18 close:
> the error-recovery architecture — the V17 lazy registry's one unowned
> failure mode reproduced live (a failed view chunk unmounted the whole
> app to Next's English dead-end screen) and closed with the neo-crm
> session-170 three-layer pattern: the pure `src/lib/chunk-recovery.ts`
> seam (the Turbopack `ChunkLoadError:` message family, the 10s cooldown,
> the flag-before-reload loop guard), the `ViewErrorBoundary` keeping the
> SHELL alive (the Spanish "No se pudo cargar la vista" card + the
> epoch-keyed fresh-registry Reintentar — `React.lazy` caches rejected
> initializers forever), and the two outer nets (`error.tsx` +
> `global-error.tsx`, zero component-tree imports); measured: a single
> aborted chunk fetch never reaches the boundary — the bundler runtime
> retries internally, the card is for failures persisting past the
> runtime retry budget; the v17 close:
> the lazy view registry + the CWV evidence set; the v16 close:
> the full-page pixel-diff pass found that **Tailwind v4's default palette
> is not the reference's palette** — 17/22 spot-checked entries render
> beyond ±2 per channel of the reference's v3 hexes (indigo-500 Δ56,
> red-500 Δ24, green-700 Δ21, violet-600 Δ24); a globals.css `@theme`
> block now pins all 61 used entries to their v3 hexes with e2e
> v3-exactness pins; the category ENTITIES order (chips + Ajustes)
> moved to a server-managed `Category.sortOrder` seeded to the
> reference's chip sequence while the donut keeps its own createdAt
> order; new evidence: the reference's pages are viewport-locked — its
> long content is unreachable below the fold; the clone's flowing
> layout is the functional superset). Previously v1.10.0 (the v15 close:
> the hover micro-interaction families went reference-faithful — every
> row-action icon button carries `transition-colors` + its per-action
> family (edit/detail indigo, delete red, MAIL blue), the table badges
> ride the shadcn hover tints (the StatusPill table variant's
> `hover:bg-primary/80` — the measured violet-at-80% — and the categoría
> `hover:bg-secondary/80`; the card pill stays hover-free), the Ajustes
> category chip's remove control is the reference's 14×14 lucide TRASH,
> and the toast question closed by evidence: the reference NEVER fires a
> toast in any observable flow (its settings save 403s silently, its
> product save is feedback-free, its failed login renders the inline
> alert) — the clone's toaster is the disclosed superset — on top of
> the v14 close: the interaction-state family went reference-faithful —
> the dialog system rides the shared max-w-lg 512px base with
> rounded-2xl sm:rounded-lg (16px full-bleed below sm), the full
> tailwindcss-animate grammar (fade + zoom + the slide quartet) with
> the FADING overlay and the tw-animate .15s default (NO duration-
> class — Tailwind 4.3.3 threads --tw-duration to 200ms where the
> reference's own duration-200 is inert), the focus family lands the
> platform violet (vx-focus's 3px solid rgba(127,98,244,0.5) outline +
> the global outline-color recolor, the indigo halo retired), and the
> reports empty states adopt the measured h-40 centered text-white/25
> boxes with the mb-5 heading gap —
> on top of the v13 close: the chart hover micro-interactions went
> recharts-faithful — the #ccc
> cursor line + the r-4 activeDot on the sales chart, the recharts default
> tooltip content (the `ventas : RAW-value` item in the line color) on the
> measured white-card skin, the hybrid anchor ((point.x + 10, pointer.y +
> 10)) with the right-edge left-flip + the transform 400ms glide + the
> persistent visibility wrapper, and the donut's OWN raw tooltip skin (the
> 1px #ccc border, no radius, no shadow, the empty label, the black `name :
> raw-count` item) — on top of the v12 close: the auth surface family went
> card-faithful — the 4px slate gradient
> hairline + the md-stepped padding on the card, the responsive login
> typography with the 16px social buttons and the footer ROW, the
> forgot/sent screens rebuilt to the reference's English family with the
> sent screen's icon circle + green alert, the /reset-password page rebuilt
> to the platform template, and the shadcn Alert family on every auth
> note). Evidence labels:
> **Verified** (executed here), **Reasoned** (inference), **Assumed**
> (decision).

## §1 Project Identity & Design Philosophy

VeloxPOS is a production-ready, self-hosted retail POS — a functional
SUPERSET of the base44 reference app (the reference is the visual contract,
not the ceiling). Core philosophy, in binding order:

1. **Correctness of money and stock first.** Integer cents everywhere; one
   rounding per line; stock never goes negative (guarded in-transaction
   decrement). Verified against the reference ticket ($18.50 + 16% IVA →
   $21.46 exactly).
2. **Security defaults that fail closed.** The reset token never rides a
   production response; the OTP dies after 6 strikes; the client IP is the
   x-forwarded-for hop at the DECLARED proxy depth; unparsable = pooled,
   never the attacker's pick.
3. **The reference is measured, never guessed.** Every visual constant
   (24px H1, slate-700 card headings, white/60 report kickers, ~8 chart
   labels, amber low-stock rows) was measured live with computed styles and
   pinned by e2e; superset features (mobile drawer, cashier CRUD) are kept
   BECAUSE the reference lacks them, not despite it.
4. **One source per truth.** `lineTotalCents()` is THE line formula;
   `resolveClientIp()` is THE ip selector; `inAppResetDeliveryEnabled()` is
   THE delivery gate. Views/routes call them; nobody re-derives.
5. **TDD as the working method.** Every remediation fix landed red-test
   first (`tests/security-hardening.test.ts`, `http-body`, `sale-integrity`,
   `visual-parity`, `hygiene` + four new e2e specs).

## §2 Tech Stack & Environment (locked, verified)

| Layer | Version (package.json + lockfile) | Notes |
|---|---|---|
| Runtime | Bun 1.3.14 | Scripts, seed, `bun -e` probes; NOT the unit runner (vitest is) |
| Framework | next ^16.4.2 | App Router, standalone output, Turbopack dev, `rewrites()` SPA |
| UI | react ^19.0.0, react-dom ^19.0.0 | |
| Language | typescript ^5 (strict; `noImplicitAny` back ON — remediation L1) | `tsc --noEmit` is the fast gate |
| Styling | tailwindcss ^4 (CSS-first `@theme`/`@utility`), tw-animate-css ^1.3.5 | v3 reference → v4 clone traps (§9) |
| Data | prisma/@prisma/client ^6.11.1 + SQLite | `DATABASE_URL="file:../db/custom.db"` → `<repo>/db/custom.db` |
| State | zustand ^5.0.6 | Two stores; no React Context |
| Validation | zod ^4.6.5 | Strip-mode; raw ZodError maps → 400 |
| Unit | vitest ^5.0.1 (node env) | 563 tests / 41 files |
| E2E | @playwright/test ^1.63.0 + chromium | 201 specs; standalone prod server :3100 (child env shell-state-proof) |
| Icons | lucide-react ^0.525.0 | |
| UI primitives | Radix (^1.x per component) via shadcn-style wrappers | `src/components/ui/*` |

No chart library (hand-rolled SVG — ADR-007), no toast library (zustand
toaster), no auth library (scrypt + HMAC, own seams), NO dead deps
(`quill`/`web-vitals`/`z-ai-web-dev-sdk` removed — remediation M8).

Environment contract (`.env.example` documents all of it):

| Variable | Required | Contract |
|---|---|---|
| `DATABASE_URL` | yes | `file:../db/custom.db` — schema-anchored AND runtime-anchored (db-path v3) |
| `AUTH_SECRET` | prod | 64-hex; missing/blank/`DEV_FALLBACK_SECRET`/`EXAMPLE_ENV_SECRET` = FATAL boot (exit 1) |
| `NEXT_PUBLIC_SITE_URL` | no | metadata/sitemap origin (`src/lib/site.ts`) |
| `RESET_INAPP_DELIVERY` | no | `"1"` opts production into in-app reset-link delivery (default OFF) |
| `AUTH_PROXY_HOPS` | no | trusted proxy depth for client-IP selection (default `0` = rightmost hop) |
| `SEED_OWNER_EMAIL/PASSWORD/NAME` | no | seed identity overrides (defaults live in `prisma/seed.ts` because bun dotenv expands `$…`) |

## §3 Bootstrapping & Configuration

```bash
bun install                # 498 packages
cp .env.example .env       # then set a real AUTH_SECRET for anything shared
bun run db:push            # prisma db push --accept-data-loss (schema-anchored)
bun run db:seed            # owner + 6 categories + 12 products + 2 registers
                           # + 2 closed shifts + 2 completed sales
bun run dev                # :3000 (tees dev.log; allowedDevOrigins incl. 127.0.0.1)
bun run lint && bun run typecheck   # the fast gates — ALWAYS before tests
bun run build              # standalone → .next/standalone/server.js (e2e needs it)
bun run test               # vitest: 563/563
bun run test:e2e           # playwright: 201/201 (boots NODE_ENV=production :3100,
                           #   its own db/e2e.db force-reset per run)
```

The gate order is binding: **lint → typecheck → build → unit → e2e**. The
e2e webServer boots the standalone build — a stale build tests dead code.
Single file: `bunx vitest run tests/money.test.ts` /
`bunx playwright test tests/e2e/inventory.spec.ts`.

Configuration gotchas (all Verified):
- **bun dotenv expands `$…`** — a `'$Abcd1234'` .env value arrives as `""`;
  the seed password default therefore lives in `prisma/seed.ts`.
- **Turbopack pre-resolves** relative `file:` DATABASE_URL against the
  project dir (one level off) — `src/lib/db-path.ts` v3 makes the repo
  owning `prisma/schema.prisma` win. Unit-pinned; do not simplify.
- **next.config.ts**: standalone + `outputFileTracingRoot` + `rewrites()`
  for the 8 PascalCase view paths + `allowedDevOrigins`. The e2e server runs
  `NODE_ENV=production` — the boot guard would exit(1) on a weak secret.

## §4 The Design System (Code-First, reference-measured)

`src/app/globals.css` is CSS-first Tailwind v4: `@theme inline` tokens +
`@utility` component classes. Measured tokens (do not change — they are
parity evidence against `docs/reference-evidence/ref-*.png`):

| Token / utility | Value | Role |
|---|---|---|
| `--color-vx-canvas` | `#080a14` | app background |
| surface | `#0d0f1a` | sidebar, drawer, auth inputs (SOLID — different from cards) |
| `vx-card` | `rgba(16,18,32,.9)` bg + `rgba(255,255,255,.07)` hairline + `0 8px 32px rgba(0,0,0,.5)` + radius 1rem | every card surface (v4 re-probe: translucent + elevation, NOT the solid `#0d0f1a`) |
| chart grid | `#262a36` | dashed gridlines, scrollbar thumb |
| chart axis text | `#64748b` | SVG `<text fill>` (NOT a Tailwind class — raw hex in the SVG) |
| `vx-gradient` | `linear-gradient(to right, #8b5cf6, #6d28d9)` | data-element fills (chart bars) only — CTAs moved to glass |
| `glass-button` | `rgba(28,31,52,.85)` bg + white/9 hairline + lavender text | Cancelar buttons, inactive chips, the Ajustes "Subir logo" control |
| `glass-button-primary` | `135deg #7c3aed→#6366f1` + violet hairline + glow + hover lift | Nuevo Producto/Caja/Cajero, Guardar, Crear, active chips |
| `glass-button-success` | `135deg #059669→#10b981` + emerald hairline + glow | Abrir/Iniciar Turno, COBRAR (70px, `py-5 text-xl font-black`) |
| `glass-button-warning` | `135deg #d97706→#f97316` amber sibling | Cerrar Turno (the superset-only state) |
| `vx-focus` | focus-visible box-shadow ring | shared focus ring |
| `vx-auth-page` | `to right bottom #f8fafc→#f1f5f9` | login/signup ONLY — /reset-password is the platform's plain WHITE page (v12/F4; the app gradient never paints there) |
| auth card chrome | `overflow-hidden rounded-2xl bg-white/95 shadow-2xl` + the 4px hairline `h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200` + `p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10` | every app-auth card (v12/F1); the column inside is `text-center space-y-6 sm:space-y-8` |
| radius scale | NATIVE v4 (`--radius-xl: 0.75rem`) | the shadcn remap was REMOVED (v4 V1) — re-adding it drifts every control +4px |
| shell gutter | `lg:ml-[220px]` / `lg:ml-[68px]` | main is FLUSH to the sidebar; the view padding provides the 24px gutter (H1 at x=244) — never re-add `ml-[244px]` (v5 G1) |
| terminal rail | `rounded-none border-l border-[#1e2235] bg-[#0d0f1a] md:w-[380px]` | the ticket panel is a full-height RAIL inside the ONE full-bleed view (`lg:h-screen` main) — not a card (v5 T7) |
| table system | headers `text-xs font-semibold text-slate-500 uppercase` per-column-aligned; rows `border-b border-slate-50 hover:bg-white/40`; body `text-sm text-slate-600`; ticket cells `font-mono text-indigo-600` | all list tables; cajeros shifts = the dense px-4/py-2.5 variant, no hover (v5 T1) |
| StatusPill shapes | `variant="table"`: 6px soft badges (green-100/green-700, slate-100/slate-500) · `variant="card"`: rounded-full px-2.5 py-1 | two DIFFERENT badge systems on the reference — do not unify them (v5 T2) |
| `--secondary` token | `33 37 49` (neutral #212531) | the shadcn secondary badge (categoría) — the reference's own value, NOT the brand violet (v5 follow-up caught by VLM) |
| form controls | Input base `rounded-xl` (12px) + `bg-transparent` | never fill an input with a solid surface (v5 T3) |
| reports accents | H1 `tone="bright"` white/90; summary chips TINTED (15% bg + 30% border + 400 icon) | Reports is the reference's only bright H1; its chips are NOT the dashboard's gradients (v5 F1/F2) |

The five Tailwind v3→v4 traps (each has a source pin in
`tests/tailwind-traps.test.ts` — read before touching layout CSS):
1. Never `mt-*`/`mb-*` on children of `space-y-*` (v4 `:where()` flips
   specificity; the reference's own mobile-menu bug) — use `flex gap-*`.
2. `@theme inline` values must be full `rgb(var(--x))` colors, not bare
   triplets.
3. `--shadow-sm` is pinned to reference geometry (v4 shifted the scale).
4. Exact-sRGB gradients are explicit `linear-gradient` utilities, never
   `bg-gradient-to-*` (v4 interpolates oklab).
5. The `h-dvh` class is NOT needed here: the drawer overlay is
   `fixed inset-0` (viewport-anchored, no vh units) — neo-crm's dvh fix
   targets a different drawer construction.

The v6 contract additions (AGENTS.md 14-16, all live-measured):
- Dialog footers are the 42px glass pair — `glass-button-primary h-auto
  rounded-xl px-4 py-2.5 text-sm font-medium` + a visible `Save` icon for
  submit, `glass-button h-auto rounded-xl px-4 py-2.5 text-sm font-medium
  text-slate-700` for cancel — and the Button component ships an EMPTY
  `glass` variant for them: any other variant's bg/text utilities clobber
  the flat `.glass-button` fill (the F6 bug). Page CTAs stay `h-9` (36px —
  the reference's own page buttons).
- The document head mirrors the reference: title "VeloxPOS", its
  description, OG/Twitter cards, appleWebApp, a WORKING manifest, and the
  app-router `src/app/icon.png` (the logo). Regenerate the assets with
  `scripts/generate-head-assets.py`.
- Media are data URLs (`src/lib/image.ts`: canvas ≤512px, JPEG q0.85,
  300KB guard) — product `imageUrl` + settings `logoUrl`; schema ceiling
  600k chars, `logoUrl` nullable (the column boots NULL).
- Unidad = the reference's six options + Servicio (superset). Mutation
  failures toast (`useToast().toast.error` — `void err` is forbidden).
  The Ventas mail action builds a `mailto:` from `src/lib/ticket-mail.ts`.
- Zero dead study-app classes: the checked Switch fills `#7f62f4` (the
  reference's live-measured violet).

The v7 contract additions (AGENTS.md 17-18, all live-measured):
- The document TITLE is per-route — `DOCUMENT_TITLES` in
  `src/lib/router.ts` is the single map (root "VeloxPOS" only;
  "Dashboard | VeloxPOS" … "Store Settings | VeloxPOS"; the reference
  titles in English even though its UI is Spanish). The shell applies it
  after the auth gate flips `ready` (later than Next's one-time
  post-hydration metadata re-apply, so it sticks); 404s title the
  slug-cased route via `documentTitleForPath()` + the GUARDED
  MutationObserver in `src/app/not-found-title.tsx` (rewrite only when
  the title differs — no mutation loop; disconnect on unmount).
- "Quitar" sends `imageUrl: null` (schema `.nullable()`). NEVER
  `undefined` — JSON.stringify drops the key and `sentKeysPatch` skips
  it, so the clear silently no-ops server-side (the v6 bug). A failed
  pick or picker-cancel leaves the stored value untouched.
- The product-dialog numeric fields (Precio/Costo/Stock/Stock mínimo/
  IVA) are `type="number"` with steps — the reference's own control
  (spinners render, role=spinbutton, native keystroke filtering).
- The Ajustes logo block renders the pending/stored logo at
  `h-[56px] w-[56px]` (NOT `h-14` — the v5 swatch pin forbids that token
  in settings-view) + a Quitar that PATCHes `logoUrl: null`.

The v8 contract additions (AGENTS.md 19-20, all live-measured):
- The auth DEEP-LINK round-trip: a logged-out app-route hit bounces to
  `/login?from_url=<encoded path+search>` and login RETURNS there via
  `safeReturnTo(raw, origin)` (`src/lib/router.ts`) — same-origin
  absolute URLs and site-relative paths pass; foreign origins,
  protocol-relative URLs, and javascript:/data: fail closed to "/";
  "/login" maps to "/". The param is an open-redirect vector if trusted
  blindly — never redirect to a raw URL value. The reference's gates on
  404s and /signup are base44 platform artifacts (its token lives in
  localStorage; the clone's httpOnly cookie is strictly stronger).
- Dialog chrome is TWO measured surfaces, not one: `DialogContent`
  rides `border-[#262a36] bg-[#0f121a] text-[#e7e9ef]`; `SelectContent`
  (dropdown panels) ride `bg-[#161922] text-[#e7e9ef]`.
- The Ventas ticket modal is the reference's layout: a
  `grid grid-cols-2 gap-3 text-sm` meta block of STACKED
  `dt.text-slate-500` + `dd.font-medium` cells (Fecha/Cajero row 1,
  Método/Caja row 2), `{qty}x {name}` item lines (plain span + a
  `font-medium` price) over `border-t border-slate-100 pt-3`, totals
  over `border-t border-slate-200 pt-3` with `text-slate-500` rows and
  a `text-lg font-bold` Total (the reference's own slate-800 Total is
  unreadable at ≈1.4:1 — a readable tone ships, SD-18), the `Receipt`
  `text-indigo-500` title icon, and NO footer Close button (the X
  alone; its accessible name is "Close" via shadcn's sr-only span —
  e2e pins it by its ≤20px width).
- The mail action PROMPTS `window.prompt("Enviar ticket a:")` before
  anything else — cancel is a no-op — then opens
  `mailto:<entered>?subject=&body=` via `buildTicketMailto(sale, to)`.
  e2e lesson: a synchronous prompt BLOCKS the Playwright click action —
  arm `page.once("dialog", …)` (accept/dismiss) BEFORE the click so the
  handler runs concurrently and unblocks it.
- The Ajustes colors pair each `type=color` swatch with an EDITABLE hex
  `<Input>` (h-9, same form field, two-way; the swatch shows #000000
  while the typed value is mid-edit; the `hexColor` schema regex stays
  the server-side gate — invalid hex 400s to a toast on save).

The v9 contract additions (AGENTS.md 21-22, all live-measured):
- The Spanish route names are a working SUPERSET: `/Ventas`, `/Inventario`,
  `/Cajas`, `/Cajeros`, `/Reportes`, `/Ajustes`, `/Terminal` all resolve to
  their views via `SPANISH_ALIASES` in `src/lib/router.ts` (the reference
  404s every one — its own titles for those URLs are the slug-cased names).
  Pre-v9 they fell to the terminal fallback and silently rendered the
  WRONG view — a rewrite-listed path MUST resolve in `viewFromPath`.
- The tab title is PATH-driven (the reference's algorithm):
  `documentTitleForPath()` matches the canonical PascalCase path EXACT-CASE
  → that route's canonical title; EVERYTHING else slug-cases the first
  segment ("/SALES" → "SALES | VeloxPOS", "/storesettings" →
  "Storesettings", "/Ventas" → "Ventas"). The shell's title effect reads
  `documentTitleForPath(window.location.pathname)`, not `DOCUMENT_TITLES[view]`.
- Tables are BARE: `<table class="w-full">` — the reference's tables
  inherit the 16px base and CELLS carry their own sizes. Never add a
  table-level `text-sm` (it shrank the Ventas Total from the ref's 16px
  to 14px).
- The shadcn foreground family is the ref's measured `#e7e9ef`
  (`--foreground: 231 233 239` — also card/popover foreground).
- `SalesAreaChart` has TWO measured skins via `variant=`: "dashboard"
  (gridlines `#e2e8f0` "3 3" — light/prominent, labels `#94a3b8` 12px,
  line `#6366f1` w2.5, `salesGrad` gradient top opacity 0.3) and
  "reports" (gridlines `rgba(255,255,255,0.04)`, labels
  `rgba(255,255,255,0.3)` 11px, line w2, gradient 0.35). One component,
  two skins — the ref renders DIFFERENT chart chrome per page.
- The dashboard has NO footer credit line (the reference's dashboard ends
  at the low-stock rows — scrollHeight-verified).
- Screenshot methodology: capture from the PRODUCTION standalone build
  (`scripts/capture-screenshots-prod.sh`, :3100) — the dev server leaks
  the Next.js dev-tools badge into captures.

The v10 contract additions (AGENTS.md 23, all live-measured):
- The category donut is the reference's recharts rendering, fully measured
  for the first time (the v5 "donut palette unobservable" disclosure
  closes): `sectorPath()` in `pos/shared.tsx` emits filled sector paths on
  the ring innerR 50 / outerR 80 centered at (166.5, 100) inside the
  `0 0 333 200` viewBox, sectors COUNTERCLOCKWISE from 3 o'clock with a
  TRAILING 4° gap (each sector starts exactly at its boundary), every
  sector stroked `#fff` 1px, and `DONUT_COLORS = ["#6366f1", "#8b5cf6",
  "#a78bfa", "#c4b5fd", "#ddd6fe", "#22c55e"]` mapped by ORIGINAL data
  index. The legend renders the FIRST 5 rows ONLY (the ref renders 6
  sectors but 5 legend rows) stacked BELOW the chart with slate-600
  names, semibold slate-700 counts, and 12px swatches.
- The low-stock card's header gap is the ref's 12px (mb-3 via
  `SectionCard titleClassName`); every OTHER card header stays mb-4.
- The Ajustes headers carry per-section icons at w-5 h-5: Store/
  text-indigo-500, Palette/text-purple-500, FileText/text-green-500,
  CreditCard/text-blue-500, Tag/text-amber-500 (the uniform violet-400
  18px set was clone-invented — retired).
- The SEED mirrors the reference account's observable state exactly: the
  ref's product page order (Shampoo → Pan Bimbo, the 12th row the
  MEASURED "Jabón Zote 400g"/7501025403010/stock 19), Caja 2 before
  Caja 1, and the two sales at the ref's EXACT datetimes (19/04/2026
  22:09, 14/03/2026 01:45) with the second's real items (1x Jabón Zote
  + 1x Papel Higiénico). The relativized daysAgo seeding is RETIRED —
  the clone's dashboard chart renders flat and its reports render "Sin
  datos en este período" exactly like the reference. Seeded dates are
  now FIXED, so reseeding never drifts the visible data.
- List ordering is deterministic everywhere: `[{createdAt asc}, {id
  asc}]` on the delegates, the product list, and the dashboard's
  byCategory (SQLite's tie order is arbitrary — never rely on it).
- The reports X-ticks follow the ref's rule (`thinLabelIndices`): ≤14-day
  windows label every day; longer windows step `ceil((count-1)/9)` from
  the window start (30 → every 4th day ending day 28; 90 → every 10th
  ending day 80); the last day is NOT force-labeled.

## §5 Component Architecture & Patterns

Four layers, one direction of dependency:

```
src/app/api/**        route shells (3-line factories or withUser handlers)
src/lib/server/**     http.ts (errors/factories), auth.ts (cookie/session), entities.ts (delegates)
src/lib/**            PURE seams: money, validation, date, auth primitives, db-path, env-check, store, api
src/components/**     views/ (8 SPA views) · pos/shared.tsx · layout/ (sidebar, mobile-chrome) · auth/ · ui/
```

- **Route factories** (`makeCollectionRoutes`/`makeItemRoutes` +
  `EntityDelegate`): every owned model gets list/create/update/remove with
  `where:{userId}` scoping and ownership pre-checks (404 before mutate).
- **Error contract** (the mapper is the single root — `toErrorResponse`):
  `ZodError`/`ValidationError` → 400 · `PayloadTooLargeError` → 413 ·
  `UnsupportedMediaTypeError` → 415 · `BusinessRuleError` → 422 ·
  `ConflictError` → 409 · `NotFoundError` → 404 · `P2002` → 409 ·
  `P2025` → 404 · `UnauthorizedError` → 401 · unknown → 500 (detail logged
  server-side ONLY).
- **SPA shell**: ONE page (`src/app/page.tsx`) renders the 8 views at real
  paths via `rewrites()`; `src/lib/router.ts` + `useAppStore` sync
  `location.pathname` ⇄ view state.
- **Key-remount dialogs**: `<Dialog key={entity?.id ?? "new"}>` rendered
  only while open — no setState-in-effect (the lint rule bites otherwise).
- **Store discipline**: `useAppStore` (view/chrome), `usePosStore` (retail
  collections + ticket); selector subscriptions; views never fetch
  bare-handed — mutations go through `apiSend` and settle back into the
  store.

## §6 State, Data-Binding & Async Patterns (hooks-level knowledge)

There are no custom hooks by design; the equivalents are store-driven:

- **Collection loading**: `usePosStore.loadCollections(keys)` —
  `Promise.allSettled` burst; one error toast per failed burst
  ("No se pudieron cargar los datos…") via the zustand toaster (L6 — never
  render failures silently); loaded-but-empty keeps the view's own empty
  state.
- **Async button states**: `submitting` in component state; buttons
  disabled during async; toasts for failures (never alert()).
- **URL-derived state**: hydrate once on mount with a `setTimeout(0)` deferral
  for the SPA path; never setState synchronously in an effect body.
- **Per-store selectors are the memo boundary** — `usePosStore((s) => s.x)`
  per consumed field; the ticket math is derived at render via
  `computeTicketTotals` (store.ts), which delegates to `money.ts`.

## §7 The Retail Domain Model (data layer)

Prisma schema (`prisma/schema.prisma`) — User-owned cascade models:

```
User (tokenVersion Int @default(0)) ──┬─ StoreSetting (1:1)
                                     ├─ Category/─┐
VerificationToken (attempts Int)     Product ─┬── SaleItem ─┬─ Sale ── Shift ── Register
PasswordResetToken (one-shot)        (SetNull)─┘   (Cascade)─┘   (SetNull)   Cashier
```

- **Money**: `Int` cents; prices IVA-exclusive; per-product `ivaRate`
  (default 16). Line formula (ONE rounding): `lineTotalCents = round(price ×
  (1 + iva/100) × qty)`. Subtotal = Σ pre-tax; tax = Σ per-line tax; total
  = subtotal + tax. Never floats at a boundary; never re-derive in views.
- **Sale creation invariants** (all server-side): open shift required ·
  prices/IVA from DB rows · guarded decrement `updateMany({where:{id,
  userId, stock:{gte:qty}}})` INSIDE the transaction (count<1 → 422 +
  rollback) · efectivo requires `cashReceived ≥ total`
  (`paymentCoversTotal` → 422) · ticket numbers server-generated `V-XXXXXXXX`
  (3-attempt P2002 retry).
- **Shift lifecycle**: open (in-tx duplicate re-check → 409) → sales accrue
  → close stamps `closingAmount`/`closedAt` and re-closes the register.
  Listing aggregates via ONE `groupBy(shiftId, _sum)` (M5) — never
  per-shift row loads. Sales list capped `take: 200` newest-first.
- **Indexes (L8)**: `Sale([userId, createdAt])`, `SaleItem([saleId])`,
  `Shift([userId, registerId, status])`, per-user `@@index([userId])` on
  Product/Category/Register/Cashier.
- **Seed** (`prisma/seed.ts`): the reference-verified dataset — owner
  (`SEED_OWNER_*`), 6 categories, 12 products (incl. low-stock
  "Atún Dolores 295g" stock 3/min 5), 2 registers, Cesar Martínez cashier,
  2 completed sales on closed shifts. The e2e seed password is
  `VeloxDemo123!` (pinned in global-setup; the DEV seed default is
  `$Abcd1234` living in code, not .env).

## §8 Accessibility (the enforced set)

- Skip link (`vx-skip-link`) → `#main-content`; every view's landmarks:
  banner (mobile app bar) / navigation (drawer + sidebar) / main.
- **Drawer focus contract (L11)**: focus moves INTO the panel on open (rAF
  retries verified against `activeElement`), Tab wraps inside
  (first⇄last focusable), close RETURNS focus to the hamburger;
  `aria-expanded` on the trigger. The rAF loop LATCHES once focus is inside
  the drawer — a focus loop must never re-steal user-moved focus.
- Axe smoke (`a11y-smoke.spec.ts`): critical/serious only;
  color-contrast is a disclosed exclusion (the reference's own palette).
- All interactive chrome shares `vx-focus` (visible focus-visible ring);
  disabled states carry opacity + `cursor-not-allowed`; the toaster is an
  `aria-live=polite` region.

## §9 Anti-Patterns & Common Bugs (the "never again" list)

Each entry is a real defect found in this codebase (pre-remediation) and
now pinned against by a test. Findings use the `docs/remediation-plan-v3.md`
IDs.

1. **Money rounded per-unit then multiplied** (M3): `round(unit×1.16)×qty`
   diverged from the stored `round(unit×1.16×qty)` by 1¢ ($12.34×2 showed
   $28.62, stored $28.63). Pin: `lineTotalCents(1234,2,16) === 2863` + the
   view imports the seam.
2. **Raw ZodError → 500** (H1): delegates call `.parse` directly; the
   factory routes answered 500 for invalid payloads. Fix: map `ZodError` in
   `toErrorResponse` (single root). Pin: unit + e2e (invalid POST/PATCH → 400).
3. **Secret-bearing responses** (C1): forgot-password returned the one-shot
   reset token to ANY unauthenticated caller. Fix: the
   `inAppResetDeliveryEnabled` gate (production = `{ok:true}` only).
4. **First-hop x-forwarded-for trust** (H3): the limiter keyed on the
   client-controlled leftmost hop — header rotation un-bypassed every
   brake. Fix: `resolveClientIp(xff, hops)` rightmost-by-depth, fail-closed.
5. **Unguarded stock decrement** (M1): sufficiency checked OUTSIDE the
   transaction; concurrent sales oversold into negative stock. Fix: guarded
   `updateMany` inside the tx → 422 + rollback.
6. **Client-only cash gate** (L2): a vacuous `.refine(... || true)` accepted
   any `cashReceived`; the server never re-checked. Fix:
   `paymentCoversTotal` → 422.
7. **Positional weekday labels** (M2): `WEEKDAY_MIN[index]` on a rolling
   window labeled 6 of 7 days wrong. Fix: `weekWindow()` + per-date
   `isoWeekday` (today last).
8. **Unbounded request bodies** (M4): `readJson` read any length, any
   content type. Fix: 1MB → 413, non-JSON → 415.
9. **Unbounded list reads** (M5): sales unbounded; shifts loaded EVERY sale
   row per shift. Fix: `take: 200` + `groupBy` aggregation.
10. **`void` dead-code hacks** (L3): `void formatDayDash;`, built-then-voided
    `productById`, identical `cond ? "Agregado" : "Agregado"` ternary —
    deleted, never suppressed.
11. **Focus loops that re-steal** (L11 lesson): an rAF retry loop checking
    only `activeElement !== panel` will fight the user's first Tab for its
    whole window. Fix: latch once focus lands ANYWHERE inside the drawer.
12. **Bun `-e` probes through Playwright env** (e2e infra): `FORCE_COLOR`
    leaks from the test env; bun wraps output in ANSI escapes that corrupt
    `JSON.parse`. Fix: neutralize color env AND strip control chars before
    parsing.
13. **Animation-race geometry assertions** (e2e infra): measuring the drawer
    panel immediately after open catches the 200ms slide-in mid-flight.
    Fix: `expect.poll` until settled (assertion stays strict: exactly 288).
14. **Tailwind v4 computed-style literals** (e2e infra): v4 resolves
    `text-slate-700` to OKLCH/LAB — a computed `color` string is not
    `rgb(51,65,85)`. Fix: compare against a probe element with the same
    class in the same page.
15. **Spec-order-dependent pins** (e2e infra): a sale-creating spec running
    BEFORE `reports.spec.ts` breaks its seeded-total pins; a register
    left open breaks `terminal-sales`. Fix: alphabetical file naming as
    ordering contract (`sale-integrity` runs after `reports`) + afterAll
    state restoration.

## §10 Debugging Guide (symptom → root cause → fix)

| Symptom | Likely root cause | Fix / verification |
|---|---|---|
| Unit tests fail only under `bun test` | Wrong runner — bun test picks up `*.spec.ts` too | Use `bun run test` (vitest, `*.test.ts` only) |
| E2E "server is not running"/timeout | Stale standalone build or port 3100 busy | `bun run build` first; check `E2E_PORT` |
| e2e DB probe returns garbage/`null` | ANSI-wrapped bun -e output | `NO_COLOR=1`,`FORCE_COLOR=0`, strip `[\u0000-\u001f\u007f]`, parse last line |
| Drawer geometry test flaky (288px ±) | Measured mid-slide-in | `expect.poll` the boundingBox until settled |
| `tsc` green but build fails | Next's compiler stricter in some paths | Build is a gate for a reason — fix, never `ignoreBuildErrors` (removed, L1) |
| Empty database at `<parent>/db/custom.db` | Turbopack pre-resolution | db-path v3 handles it; if it regressed, `tests/db-path.test.ts` goes red first |
| Seed sets owner password to `""` | bun dotenv expanded `$Abcd1234` | Defaults live in `prisma/seed.ts`; override via `SEED_OWNER_*` |
| 500 on invalid POST/PATCH to products/categories/registers/cashiers | Raw ZodError escaping the mapper (regression) | `tests/security-hardening.test.ts` H1 pin + `security.spec.ts` |
| 401 after password reset for OLD sessions | tokenVersion revocation WORKING (expected) | Not a bug — ADR-012; the user simply signs in again |
| Toast storm "No se pudieron…" on every boot | A collection fetch failing — check `/api/health` + db + which 500s | `loadCollections` surfaces bursts; the failing key is in the network tab |
| 429s during e2e auth flows | The shared "local" IP limiter budget (10/15min) spent | Keep real login attempts per run low; successful logins reset their bucket; isolate bursts on distinct XFF keys |
| Dashboard labels look shifted | Positional labeling regressed | `visual-parity.test.ts` weekWindow pins |

## §11 Pre-Ship Checklist (run in this order — all must be green)

```bash
bun run lint          # eslint 9 flat config — 0 errors
bun run typecheck     # tsc --noEmit — strict, noImplicitAny ON
bun run build         # standalone build compiles + prerenders
bun run test          # 563/563 vitest
bun run test:e2e      # 201/201 playwright (production posture)
```

Verification beyond the gates:
- No secrets in the diff: `git diff --stat` must not touch `.env`, `db/*.db`,
  `*.key`, `ssh-key.txt` (gitignored — double-check staged files).
- Screenshots regenerated if visuals changed: `bun scripts/capture-screenshots.ts`
  (needs a live `bun run dev`), review the diff on `docs/screenshots/`.
- Doc counts in sync: README badge, CLAUDE.md commands, this file's §2
  (unit/e2e counts change with every pin added).
- Schema changed? `bun run db:generate && bun run db:push` (e2e's global-setup
  force-resets its own db; the DEV db needs the manual push).
- Single-branch: commit to `main`; push via `docs/ssh_git_wrapper_v3.py`.

## §12 Lessons Learnt (remediation v3 — how each class of bug arises)

1. **F1 — Dual math implementations drift.** The view re-derived the line
   formula "for convenience." Lesson: when two call sites need one number,
   the seam is the ONLY place the formula may live; source-pin the import.
2. **F2 — The error mapper is the contract, not the caller.** Delegates
   threw ZodErrors because the mapper "should have" caught them. Lesson:
   audit thrown types against mapper branches; a type with no branch = 500.
3. **F3 — Convenience delivery is a security boundary.** "The response IS
   the delivery" was fine for localhost and catastrophic on a network. The
   environment must gate the channel (ADR-011), not the copy.
4. **F4 — Stateless sessions need a revocation axis.** HMAC cookies can't be
   revoked; tokenVersion gives stateless sessions a per-user epoch (ADR-012).
5. **F5 — Test-visible randomness hides in tooling.** bun's `-e` output is
   colorized when the parent env carries FORCE_COLOR — the probe "worked on
   my machine." Neutralize the environment inside the helper, every time.
6. **F6 — Focus management must be idempotent-after-landing.** Any focus
   loop needs a latch: once the user has focus, the loop is done. Retry
   windows that re-check "is focus where I put it" will fight the user.
7. **F7 — Layout engines outlive the literal colors.** Tailwind v4's OKLCH
   pipeline changes computed strings; write style pins against identity
   probes, not rgb literals.
8. **F8 (v24) — An unpinned claim is a latent regression.** The 404
   rendered correctly at the true HTTP 404 status, the health endpoint
   returned the documented body, and the e2e suite booted deterministically
   — none of it was PINNED (`page.goto` tolerates any status; the webServer
   poll proves only a 2xx; the child env inherited the parent shell). The
   gate-coverage doctrine (ADR-033): every behavioral claim a doc or a
   consumer leans on needs a standing assertion — and the RED run itself
   caught a fifth gap (a 62-hex secret under a 64-hex comment claim).
9. **F9 (v25) — Behavior pins do not catch geometry drift; freeze the
   spine and mutation-prove it.** The drawer's panel box, pitch
   uniformity, and close paths were all pinned — yet a computed-margin
   regression (mb-* re-entering the flex column, the trap-4 family)
   would shift the header 69→77, cascade through every link and the
   footer, and keep every gate green. The cure (ADR-034): pin the FULL
   rendered box ledger (header/nav/footer/close/links) at the phone
   width with exact equality — and plant the defect's exact shape
   (mb-2 on the header) to prove the pin goes RED while the rest of the
   battery stays green. A born-green freeze pin without the mutation
   proof is a hope; with it, it is a contract. (Corollary: lg:hidden
   elements stay in the DOM — assert with toBeHidden, never
   toHaveCount(0).)
10. **F10 (v26) — A "pinned by" comment is a claim; verify the pin
   exists.** `src/instrumentation.ts`'s comment said "pinned by
   tests/e2e/s22-boot-guard.spec.ts" — a spec deleted with the V1
   study-layer archive (`0b78972`) and never replaced: the claim was
   FALSE, and the wiring it described (register() → console.error +
   process.exit(1)) carried zero assertions. The citation sweep (rg
   every `tests/**` citation in src/, existence-check each) is a cheap
   recurring audit instrument. Companion lesson: the failure branches a
   consumer leans on (the health DEGRADED 503 the Docker healthcheck's
   `r.ok?0:1` reads) stay unpinned when pinning them "would break the
   environment" — but `vi.mock` at the unit layer dissolves that
   objection (the mocked module's PrismaClient is never constructed;
   the probe rejects deterministically). An environment-breaking failure
   is only unpinnable at the layer that owns the environment.

## §13 Pitfalls to Avoid (don't do these in this repo)

- Do NOT round money twice or re-derive totals outside `money.ts`.
- Do NOT read the first x-forwarded-for hop, or trust any header without a
  declared depth.
- Do NOT check stock outside the transaction that decrements it.
- Do NOT return tokens, hashes, stacks, or provider messages in responses.
- Do NOT add a per-test login in e2e (rate limiter is shared per IP).
- Do NOT use `space-y-*` with margin-utility children (v4 trap #1).
- Do NOT relax `ignoreBuildErrors`/`noImplicitAny` to make a gate pass —
  they were removed/turned back ON deliberately (L1).
- Do NOT measure animating geometry without polling to a settled state.
- Do NOT hand-edit `package.json` dependency lists — use `bun add/remove`
  (identity fields by direct edit are fine).
- Do NOT create a new branch; main is the only branch.

## §14 Best Practices (the house style)

- Pure seams with explicit args first (`authSecretBootStatus`,
  `paymentCoversTotal`, `resolveClientIp`); env reads happen at the route
  boundary, seams stay unit-testable.
- Source pins for server-file contracts that import `next/headers`
  (`readSource(...)` + `toContain`) — the established idiom.
- e2e specs own their preconditions and restore their state (afterAll close
  shifts; fresh emails per run; isolated playwright request contexts for
  cookie-sensitive pins).
- Every status the API can emit has exactly one constructor class in
  `http.ts` — add a class, add a mapper branch, add a pin.
- Screenshots are evidence: same filenames, overwritten, git-diffed.

## §15 Coding Patterns (copy these shapes)

```ts
// Money: ONE rounding per line (M3) — the single implementation.
lineTotalCents(unitPriceCents, qty, ivaRate)   // round(price × (1+iva/100) × qty)

// Payment gate (L2) — server-side, 422 on failure.
paymentCoversTotal(method, totalCents, cashReceivedCents)

// Client IP (H3) — declared trusted depth, fail-closed to "local".
resolveClientIp(request.headers.get("x-forwarded-for"), hops)

// Delivery gate (C1) — pure seam, route reads the env.
inAppResetDeliveryEnabled(process.env.NODE_ENV, process.env.RESET_INAPP_DELIVERY)

// Guarded stock decrement (M1) — inside the sale transaction.
const decremented = await tx.product.updateMany({
  where: { id, userId, stock: { gte: qty } },
  data: { stock: { decrement: qty } },
});
if (decremented.count < 1) throw new BusinessRuleError(INSUFFICIENT_STOCK);

// Chart label thinning (V3) — first + last always kept, ≤ maxLabels.
thinLabelIndices(points.length, 8)

// Transient feedback banner (v5 T4) — always mounted, collapsed when idle;
// NEVER a permanent label, and the hide timer lives in the handler (not an
// effect) so the set-state-in-effect lint rule never fires.
const [addedName, setAddedName] = React.useState<string | null>(null);
const timer = React.useRef<number | null>(null);
const onAdd = (product: Product) => {
  ticketAdd(product);
  setAddedName(product.name);
  if (timer.current !== null) window.clearTimeout(timer.current);
  timer.current = window.setTimeout(() => setAddedName(null), 1600);
};
React.useEffect(() => () => {
  if (timer.current !== null) window.clearTimeout(timer.current);
}, []);

// View-conditional shell geometry (v5 G2) — ONE view opts out of the padded
// main; every other view keeps the p-6 rhythm.
view === "terminal"
  ? "lg:h-screen lg:overflow-hidden lg:p-0"
  : "lg:px-6 lg:pb-6 lg:pt-6"

// Latched focus entry (L11) — retries only while focus never landed inside.
if (panel.contains(document.activeElement) || document.activeElement === panel) {
  landed = true; return;            // the user owns focus from here
}
panel.focus({ preventScroll: true });
frame = requestAnimationFrame(() => moveFocusIn(attempt + 1));

// (v4) Layout-neutral "border" on an active item — a real border shifts
// box size and breaks uniform-gap geometry pins; a ring is a box-shadow:
className={active
  ? "bg-violet-600/20 text-violet-300 ring-1 ring-violet-500/30"
  : "text-white/40 hover:text-white/80"}

// (v4) The glass action system — the reference's own CSS, extracted live;
// sizing rides call-site utilities, the utility carries ramp+hairline+glow.
<button className="glass-button-primary rounded-xl px-4 py-2.5 text-sm font-medium" />

// (v4) Probe-identity color assertions — Tailwind v4 resolves utilities
// through OKLCH, so a computed color is never a literal rgb() string;
// render a probe element with the same utility and compare resolved values.
const probe = getComputedStyle(makeProbe("bg-slate-900")).backgroundColor;
expect(getComputedStyle(submit).backgroundColor).toBe(probe);
```

## §16 Coding Anti-Patterns (seen and removed)

- `Math.round(unit * (1 + iva / 100)) * qty` — dual math (use the seam).
- `forwarded?.split(",")[0]` — first-hop trust (use `resolveClientIp`).
- `.refine((x) => condition || true)` — vacuous validation.
- `if (product.stock < qty) throw ...` OUTSIDE the tx only — the guard
  belongs INSIDE with `updateMany`.
- `void someSymbol;` / built-then-voided locals / identical-branch ternaries.
- Loop that re-`focus()`es while `activeElement !== target` — no latch.
- `getComputedStyle(el).color === "rgb(51,65,85)"` — v4 OKLCH (probe it).

## §17 Responsive Breakpoint Reference

| Range | Chrome |
|---|---|
| `< 1024px` (lg) | fixed app bar (h-16) + slide-in drawer (w-72=288px, 200ms), `lg:hidden` |
| `≥ 1024px` | desktop sidebar (collapsible, `vx-sidebar-collapsed` persisted), drawer never rendered |

The reference has NO mobile menu at 390px (its 220px sidebar squeezes
content — verified); the drawer is the superset. Breakpoint-crossing while
the drawer is open closes it (matchMedia `change` handler). Pinned
surfaces: 390×844 (mobile-navigation.spec), 1280×800 (desktop views +
visual-parity.spec). Zero horizontal overflow is asserted on every view at
390px (`scrollWidth - clientWidth ≤ 1`).

## §18 Z-Index Layer Map

| Layer | z | Element |
|---|---|---|
| Toaster | `z-[60]` | fixed bottom-right notification region |
| Drawer overlay | `z-50` | modal nav (backdrop + panel) |
| App bar | `z-40` | mobile fixed header |
| Radix dialogs/popovers | component defaults | below toaster |

## §19 Color Reference (complete, measured)

Dark POS canvas family: canvas `#080a14` · surface `#0d0f1a` · surface-2
`#12141f` · border `#1e2235` · grid `#262a36` · axis text `#64748b`.
Text scale: headings `slate-800` (H1) / `slate-700` (card headings, V1) /
`slate-100/200/300` (body on dark) / `slate-400`-`500` (muted) · reports
kickers `white/60` (V1). Brand: violet `#8b5cf6` / indigo `#6366f1` /
deep `#6d28d9` (`vx-gradient`). Semantic: emerald (success/cash), amber
`amber-400` (low-stock rows, V6), red (errors), violet-300 (price accents).
Charts: stroke `#8b5cf6`, area fill `rgba(139,92,246,0.12)`, donut palette
`["#8b5cf6","#7c3aed","#a78bfa","#c4b5fd","#22c55e","#e2e8f0","#6366f1",
"#f59e0b"]` assigned by `colorByName` (L5 — one map feeds arcs AND swatches).
Auth pages: light `#eef2f7→#e2e8f0` gradient (`vx-auth-page`).

## §20 TypeScript Interface Reference (the boundary shapes)

```ts
// src/lib/auth.ts
type SessionPayload = { uid: string; iat: number; exp: number; v: number };
function sessionMatchesVersion(payload: SessionPayload, tokenVersion: number): boolean;
function resolveClientIp(xff: string | null | undefined, hops?: number): string;
function inAppResetDeliveryEnabled(nodeEnv?: string, flag?: string): boolean;

// src/lib/money.ts
function lineTotalCents(unitPriceCents: number, qty: number, ivaRate: number): number;
function paymentCoversTotal(method: string, totalCents: number, cash?: number): boolean;

// src/lib/server/http.ts — the error classes (one per status)
class BusinessRuleError extends Error {}   // → 422
class ConflictError extends Error {}       // → 409
class PayloadTooLargeError extends Error {}     // → 413
class UnsupportedMediaTypeError extends Error {} // → 415

// src/lib/server/entities.ts
type EntityDelegate = { list(userId); create(userId, input); update(userId, id, input); remove(userId, id) };

// API boundaries (JSON)
type DashboardData = { salesToday; transactionsToday; productCount; lowStockCount;
  weekly: { key: string; label: string; total: number }[];   // labels roll per-date (M2)
  byCategory: { name: string; count: number }[]; lowStock: { id; name; stock; minStock }[] };
type ReportData = { totalRevenue; transactions; averageTicket; daily: { label; total }[]; byMethod: { method; total; count }[] };

// src/lib/store.ts — the mutation surface
type PosStore = { …collections; ticket: TicketLine[]; loadCollections(keys): Promise<void>;
  ticketAdd/ticketSetQty/ticketRemove/ticketClear; loadAll(); setActiveShiftFrom(shifts) };
```

## §21 Appendices

**A. ADR index (the binding decisions)** — full table in
`Project_Architecture_Document.md` (v1.1.0): ADR-001 single page + SPA
rewrites · ADR-002 SQLite schema-anchored · ADR-003 integer-cents money ·
ADR-004 Tailwind v4 CSS-first + trap pins · ADR-005 two zustand stores ·
ADR-006 route factories · ADR-007 hand-rolled SVG charts · ADR-008 drawer
superset · ADR-009 SEED_OWNER_* env · ADR-010 db-path v3 · **ADR-011
environment-gated reset delivery** · **ADR-012 tokenVersion session
revocation** · **ADR-013 the remediation contract set**.

**B. The remediation batches (v3, executed 2026-10-26)** —
`docs/remediation-plan-v3.md` is the record:
R1 security (C1 delivery gate, H1 ZodError→400, H2 OTP lockout, H3
proxy-hop IP, M4 body gates, M6 tokenVersion, M7 timing equalizer, L10
pruning) · R2 integrity (M1 guarded decrement, M3 line math, L2 cash gate,
L4 409 in-tx, M5 bounded/aggregated reads, L8 indexes) · R3 visual parity
(V1 card/kicker variants, V2 24px H1, V3 thinned labels, V4 rolling
weekdays, V5 glass logo button, V6 amber low-stock rows) · R4 hygiene (M8
identity + dead deps, L1 strict gates, L3 dead code, L5 donut map, L6
toast, L9 env example, L11 drawer focus) · R5 ship (18 screenshots, docs
lockstep, this SKILL, worklog).

**C. Evidence set** — `docs/reference-evidence/` (live reference captures)
· `docs/screenshots/` (18 remediated captures, regenerated via
`scripts/capture-screenshots.ts`) · `docs/Tailwind-V4-Validation-Report.md`
(the trap proofs) · `docs/reference-investigation.md` (the parity dossier).

**D. Quick Reference Card**

| Need | File |
|---|---|
| The line formula | `src/lib/money.ts` (`lineTotalCents`) |
| The IP selector | `src/lib/auth.ts` (`resolveClientIp`) |
| The delivery gate | `src/lib/auth.ts` (`inAppResetDeliveryEnabled`) |
| The error mapper | `src/lib/server/http.ts` (`toErrorResponse`) |
| The session/cookie seam | `src/lib/server/auth.ts` |
| The chart components | `src/components/pos/shared.tsx` |
| The drawer | `src/components/layout/mobile-chrome.tsx` |
| The stores | `src/lib/store.ts` |
| The schema contract pins | `tests/schema.test.ts` |
| The security e2e | `tests/e2e/security.spec.ts` |
| The DB probe helper | inside `tests/e2e/security.spec.ts` (`probeLatestResetToken`) |
| Screenshots | `scripts/capture-screenshots.ts` → `docs/screenshots/` |
| Push procedure | `docs/how-to-git-push-using-ssh-wrapper_SKILL.md` + `docs/ssh_git_wrapper_v3.py` |
