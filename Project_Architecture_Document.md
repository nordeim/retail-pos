# VeloxPOS (`retail-pos`) — Master Project Architecture Document (PAD) v1.4.0

> Generated per the `skills/project-architecture-document-md` canonical
> section order. Evidence labels: **Verified** (executed/observed in this
> workspace), **Reasoned** (inference from code), **Assumed** (stated
> decision). Companion: `docs/reference-investigation.md` (the reference
> dossier), `docs/implementation-plan.md` (the replication plan),
> `docs/remediation-plan-v3.md` (the executed remediation record),
> `AGENTS.md` (agent gotchas), `worklog.md` (session journal).
>
> v1.1.0 (2026-10-26): the remediation-plan-v3 execution — security
> hardening (R1), data integrity (R2), visual parity (R3), hygiene (R4);
> ADR-011..013 added; §6 controls extended.
>
> v1.2.0 (2026-10-26): the remediation-plan-v4 execution — the deep
> visual-parity sweep (computed-style probes against the live reference):
> native Tailwind radius scale, the reference card system (vx-card), the
> glass-button gradient action system, the translucent-violet active nav
> pill, StatCard blob anatomy + row-layout reports cards, official social
> brand marks + hosted logo PNG on the auth surface, the `/Inventory` route
> alignment, and the reference's own lucide nav icons; ADR-014 added.
>
> v1.3.0 (2026-10-26): the remediation-plan-v5 execution — the
> view-internals parity sweep (24-item live probe ledger): the flush shell
> gutter (ml-[220px]/[68px]; H1 at x=244), the full-bleed Terminal (two-pane
> h-screen layout with the border-l ticket RAIL, the transient emerald
> "Agregado" banner, the 12px uppercase Ticket header, ShoppingBag COBRAR,
> the muted empty-state card), the reference table system (slate-50
> hairlines + white/40 hover + slate-600 body + mono indigo ticket cells),
> the two-shape StatusPill (6px soft table badges vs the register-card
> round pill), 12px transparent form controls, the reference's neutral
> `--secondary` token, tinted (non-gradient) reports chips, the Reports
> bright H1, the reference dashboard grids, settings parity (max-w-4xl,
> 54px Guardar, glass category chips), and the button.tsx study-remnant
> purge; ADR-015 added.
>
> v1.4.0 (2026-10-26): the remediation-plan-v6 execution — the
> functional-superset completion + document-head suite: the Unidad options
> completed to the reference's six (+ Servicio superset), product photos
> and the store logo stored as client-resized data URLs
> (`src/lib/image.ts`), every mutation failure surfaced through the
> toaster (the four silent `void err` deletes), the Ventas mail action as
> a fully-formed `mailto:` (`src/lib/ticket-mail.ts`), the 42px dialog
> button contract with the cva `glass` variant (F6 — the variant utilities
> were clobbering the glass fills), the sidebar tile's violet glow, the
> reference's head suite (title/description/OG/Twitter/apple/manifest +
> the app-router icon convention + the generated og-image), and the total
> sf-* token purge across the remaining UI primitives (switch, toast,
> badge, card, skeleton, progress, checkbox, slider); ADR-016 added.

## Table of Contents

1. System Overview & Decisions
2. High-Level System Topology
3. Application Architecture
4. Data Architecture
5. Design System Reference
6. Security Architecture
7. Worker / Background Service Architecture
8. Testing Strategy
9. Build & Deployment
10. Developer Handbook
11. Known Issues & Outstanding Tasks
12. Key Files Reference
13. Glossary

---

## 1. System Overview & Decisions `[MANDATORY]`

**What.** VeloxPOS is a single-tenant retail point-of-sale web app: a selling
terminal, inventory, receipt history, registers with shift lifecycles,
cashiers, revenue reporting, and store settings — Spanish UI, dark canvas,
mobile-first drawer navigation. It is a functional superset of the hosted
reference `veloxposretail.base44.app` rebuilt from observation
(`docs/reference-investigation.md`, evidence-labeled).

**Why this shape.** The operator asked for the reference's UX with owned
infrastructure. The scaffold (this repo, previously the StudyFlow build)
already carried a proven Next.js 16 + React 19 + Tailwind v4 + Prisma/SQLite
pipeline with the v3→v4 trap work test-pinned — keeping it was the
lowest-risk path. **Verified.**

### ADR index (the decisions that bind future work)

| ADR | Decision | Status |
|---|---|---|
| ADR-001 | Single Next.js page + `rewrites()` SPA at reference PascalCase paths (`/`, `/Dashboard`, `/Inventory`, `/Sales`, `/Registers`, `/Cashiers`, `/Reports`, `/StoreSettings`) | Accepted — Verified (routes render via e2e; `/Inventario` kept as an alias rewrite) |
| ADR-002 | Prisma + SQLite at `<repo>/db/custom.db` via `DATABASE_URL="file:../db/custom.db"` (schema-anchored + runtime-anchored resolution) | Accepted — Verified (db exists; contract unit-pinned) |
| ADR-003 | Money as integer cents; prices IVA-exclusive; per-product `ivaRate` (default 16) | Accepted — Verified against the reference ticket ($18.50 → $21.46) |
| ADR-004 | Tailwind v4 CSS-first (`@theme`/`@utility`), the five trap rules enforced by source pins | Accepted — Verified (tests/tailwind-traps.test.ts) |
| ADR-005 | Two Zustand stores (`useAppStore`, `usePosStore`) — no React Context | Accepted — Verified (store.ts) |
| ADR-006 | API routes as 3-line shells over delegate factories; hand-rolled flows still `withUser` + `parseWith` + `toErrorResponse` | Accepted — Verified (api/**) |
| ADR-007 | Charts hand-rolled SVG (no chart dependency) | Accepted — Verified (pos/shared.tsx) |
| ADR-008 | Mobile drawer is a superset feature (the reference has none); geometry e2e-pinned at 390×844 | Accepted — Verified (mobile-navigation.spec.ts) |
| ADR-009 | Seed identity via `SEED_OWNER_*` env with an in-code password default (bun dotenv expands `$…`) | Accepted — Verified |
| ADR-010 | db-path v3 hardening: the repo owning `prisma/schema.prisma` wins over Turbopack's mangled sibling-db absolute form | Accepted — Verified (db-path.test.ts pins) |
| ADR-011 | Reset delivery is ENVIRONMENT-GATED: the forgot-password response carries the one-shot reset link only outside production or with `RESET_INAPP_DELIVERY=1` (a production response is `{ok:true}` only) | Accepted — Verified (security.spec.ts, production posture) |
| ADR-012 | Sessions carry a `tokenVersion`; reset-password bumps it transactionally — pre-reset cookies are revoked on their next request | Accepted — Verified (security.spec.ts) |
| ADR-013 | The remediation contract set: guarded in-transaction stock decrement + server-side cash gate (422), duplicate-open 409 via ConflictError, raw ZodError → 400, 413/415 body gates, OTP 6-strike lockout, proxy-hop-aware client IP, drawer focus contract (latched rAF + Tab wrap + focus return) | Accepted — Verified (213 unit + 70 e2e) |
| ADR-014 | The v4 visual-parity contract set: native Tailwind radius scale (shadcn `--radius` remap removed — the reference's own shadcn runs native), the reference card system on `vx-card` (translucent `rgba(16,18,32,.9)` + white-alpha hairline + elevation shadow), the `glass-button-primary/success/warning` gradient action system (135° ramps + colored hairline + glow + hover lift, CSS extracted live), the translucent-violet active nav pill on a RING (never a border — layout-neutral), StatCard blob anatomy, the icon-left reports summary cards, and the official social brand marks + hosted logo PNG on the auth surface | Accepted — Verified (238 unit + 74 e2e, live probe parity) |
| ADR-015 | The v5 view-internals contract set: the flush shell gutter (`lg:ml-[220px]`/`[68px]` — the view's own padding provides the 24px gutter, H1 at x=244); the Terminal as the ONE full-bleed view (`lg:h-screen` two-pane, ticket panel as the `rounded-none border-l bg-[#0d0f1a]` RAIL with the transient "Agregado" banner and ShoppingBag COBRAR); the reference table system (slate-50 hairlines, `hover:bg-white/40`, `text-slate-600` body, mono indigo ticket cells, per-column header alignment, the dense cajeros shifts variant); the two-shape StatusPill (6px soft table badges `green-100/green-700` + `slate-100/slate-500`, vs the register-card `rounded-full` pill); 12px-radius transparent form controls; the reference's neutral `--secondary` token (`33 37 49`); tinted reports chips (15%/30%/400-tone, NOT gradient) + the Reports-only bright H1 (`tone="bright"`) | Accepted — Verified (277 unit + 83 e2e, live probe parity) |
| ADR-016 | The v6 functional-superset contract set: dialog footer buttons are the reference's 42px glass pair, and the cva Button ships a dedicated EMPTY `glass` variant because the default/outline variants' bg/text utilities clobber the flat `.glass-button` fill (F6); product photos + the store logo persist as data URLs (canvas-resized ≤512px, JPEG q0.85, 300KB guard, 600k schema ceiling) with NO infrastructure dependency; the Unidad enum is the reference's six + Servicio; all mutation failures toast (`void err` forbidden); the Ventas mail row action opens a `mailto:` carrying the full ticket (no SMTP — disclosed); the document head mirrors the reference (title "VeloxPOS", its description, OG/Twitter cards, appleWebApp, a WORKING manifest, the app-router icon.png convention, the generated 1200x630 og-image); the UI primitives carry zero dead study-app classes (the checked Switch fills with the live-measured `#7f62f4`) | Accepted — Verified (311 unit + 91 e2e, live probe parity) |

---

## 2. High-Level System Topology `[MANDATORY]`

```mermaid
flowchart TB
  B["Browser (SPA: one page, 8 views)"]
  subgraph NextServer["Next.js 16 standalone server"]
    MW["Route rewrites + middleware-less auth gate"]
    subgraph API["Route handlers /api/**"]
      AUTH["/api/auth/*"]
      CRUD["products · categories · registers · cashiers"]
      FLOW["shifts · sales · settings · dashboard · reports"]
    end
    SEAM["src/lib/server: http factories + entity delegates + auth"]
  end
  DB[("SQLite · <repo>/db/custom.db")]
  B -->|JSON over fetch (cookie session)| API
  API --> SEAM --> DB
```

- Single process; no external services; SQLite file storage. **Verified.**
- The SPA authenticates through an httpOnly cookie; a 401 from
  `/api/auth/me` bounces the shell to `/login` via full reload. **Verified.**

---

## 3. Application Architecture `[MANDATORY]`

### 3.1 The view layer

- **One page** (`src/app/page.tsx`): auth gate → splash → shell (Sidebar +
  MobileChrome + view switcher). The view syncs with `location.pathname`
  through `viewFromPath` (`src/lib/router.ts`) — the rewrite map keeps URLs
  canonical while the SPA never reloads on nav. **Verified** (e2e
  navigation.spec asserts pushState URLs).
- **Views** (`src/components/views/*-view.tsx`): terminal (grid + ticket +
  payment dialog), dashboard (KPIs + charts + low stock), inventario (table +
  product dialog), ventas (history + ticket detail), cajas (register cards +
  shift dialogs), cajeros (cashier CRUD + shift history), reportes (period
  windows + KPIs + SVG area chart + method breakdown), ajustes (settings
  form, live theming, category chips).
- **Chrome**: desktop sidebar — dark, fixed, 220px expanded / 68px collapsed,
  bottom-parked toggle; mobile (<1024px) — app bar (hamburger + brand) and
  the w-72 drawer (Esc/backdrop/route-change close, body scroll lock). The
  drawer nav and sidebar share ONE `NavItemLink` source. **Verified** (e2e
  pins the widths, the 288px panel, and the uniform 44px link pitch — the
  Tailwind v4 space-y trap stays dead).

### 3.2 State

- `useAppStore` — view, sidebar collapse (localStorage-persisted), drawer.
- `usePosStore` — the retail collections + settings, the in-progress ticket
  (`ticketAdd/SetQty/Remove/Clear`), `activeShift` (derived from shifts), and
  `loadCollections(keys)` (parallel `Promise.allSettled` fetchers; failures
  never block the shell). **Verified.**
- Dialog form state initializes per mount (key-remount) — the
  `react-hooks/set-state-in-effect` lint rule forbids effect-driven writes.
  **Verified** (lint green).

### 3.3 The API layer

- **Factories** (`src/lib/server/http.ts`): `withUser`/`withUserParams`
  (session gate + error mapper), `parseWith` (Zod → 400), 
  `makeCollectionRoutes`/`makeItemRoutes` (GET/POST + PATCH/DELETE).
- **Delegates** (`src/lib/server/entities.ts`): every query scoped
  `where:{userId}`; updates/removes verify ownership BEFORE mutating;
  `sentKeysPatch` filters partial PATCHes to schema-validated sent keys.
- **Hand-rolled flows**: shifts (open: 409 on duplicate open register,
  flips register status in a transaction; close: stamps count, closes the
  register), sales (open-shift gate, DB-side price/IVA recompute, stock
  decrement in the same transaction, server-generated ticket `V-XXXXXXXX`
  with P2002 retry), settings (upsert singleton), dashboard/reports
  (aggregations over local-day buckets).
- **Error contract**: Zod → 400 · P2002 → 409 · P2025 → 404 · no session →
  401 · business rules → 422 (insufficient stock, no active shift) ·
  unknown → 500 (server log only). **Verified.**

---

## 4. Data Architecture `[MANDATORY]`

### 4.1 Model map (Prisma/SQLite)

```
User 1─1 StoreSetting          Store identity (name, colors, ticket footer…)
User 1─* Category              unique(userId, name)
User 1─* Product               unique(userId, name); optional category (SetNull)
User 1─* Register (Caja)       status closed|open
User 1─* Cashier               optional email, active flag
User 1─* Shift (Turno)         register + cashier; openingFloat; closedAt?
User 1─* Sale                  ticketNo unique; method efectivo|tarjeta;
                               subtotal/tax/total cents; register/shift (SetNull)
Sale 1─* SaleItem              product (SetNull); name/price/iva snapshots
User 1─* VerificationToken, PasswordResetToken   (auth, unchanged from scaffold)
```

All money columns are integer **cents**; every user-owned model cascades on
user delete; sale history survives product/register deletion via SetNull.
**Verified** (tests/schema.test.ts pins the model list, cascades, cents).

### 4.2 The db-path contract

`.env` `DATABASE_URL="file:../db/custom.db"`. The Prisma CLI anchors
shell-provided relative URLs against `prisma/schema.prisma` →
`<repo>/db/custom.db`. The runtime resolves the same value in
`src/lib/db-path.ts` (anchor order: standalone-root → module-root → CWD).
**v3 hardening**: Next dev (Turbopack) pre-resolves the relative URL one
level off (`<project>/../db/custom.db`) and *creates that stray file on
boot* — when an absolute target is the default's name inside a `/db`
directory outside the repo while the repo owns its own `db/custom.db`, the
repo wins. Pinned by three `tests/db-path.test.ts` cases. **Verified.**

### 4.3 Seeding

`prisma/seed.ts` upserts: the owner (`SEED_OWNER_*`, password hashed with the
app's own scrypt seam), 6 categories (reference order), the 12 reference
products (11 read live + the count-pinned 12th — dossier §8), 2 registers,
1 cashier, and the 2 verified historical sales inside their closed shifts
(`V-MO6BJT7G` $21.46, `V-MMPNY55Z` $61.48). Idempotent: sales/shifts only
when the store has none. **Verified.**

---

## 5. Design System Reference `[CONDITIONAL]`

| Token | Value | Source |
|---|---|---|
| Canvas | `#080a14` | computed `body` on the live reference — Verified |
| Surface / raised | `#0d0f1a` / `#12141f` | sidebar computed style — Verified |
| Border / strong border | `#1e2235` / `#262a36` | sidebar computed style — Verified |
| Primary / secondary | `#6366f1` / `#8b5cf6` | the reference's own settings inputs — Verified |
| Gradient | `linear-gradient(to right, var(--vx-secondary), var(--vx-primary-deep))` | explicit sRGB (v4 oklab trap) |
| Success / warning / info | emerald-500 / amber-orange / blue-500 | stat chips + pills — Verified visually |
| Headings | slate-800/900 on dark (24–30px bold) | computed h1 styles — Verified |
| Radius / font | 12px controls, 16px cards / system ui-sans | computed — Verified |

Typography: system stack (`ui-sans-serif, system-ui, …`); tables use
uppercase bold 11–12px headers. The auth surface is intentionally LIGHT
(self-contained `vx-auth-page` utility). The Ajustes color pickers write
`--vx-primary` / `--vx-secondary` at runtime — settings-driven theming is
live. **Verified** (settings.spec e2e).

---

## 6. Security Architecture `[MANDATORY]`

| Control | Implementation | Evidence |
|---|---|---|
| Password storage | scrypt (64-byte key, 16-byte salt), `scrypt$salt$key` format | src/lib/auth.ts — Verified |
| Sessions | HMAC-signed stateless token, httpOnly cookie `sf_session`, 7-day TTL; verification re-proves the user exists AND the token's `v` matches the user's `tokenVersion` (ADR-012) | Verified (auth.test.ts + security.spec.ts) |
| Rate limiting | In-memory per-IP buckets on login/forgot/verify/register (10/15min) with in-flight pruning; successful login RESETS the user's bucket; the client IP is the x-forwarded-for hop at the DECLARED trusted depth (`AUTH_PROXY_HOPS`, fail-closed) | Verified (security-hardening.test.ts + security.spec.ts) |
| Login timing | The unknown-email branch burns a real scrypt verify against a throwaway hash — no enumeration oracle | Verified (UNKNOWN_ACCOUNT_HASH pin) |
| Reset delivery | The one-shot reset token never rides a production response (ADR-011); the flow is completed via reset-password with the tokenVersion bump | Verified (security.spec.ts) |
| OTP lockout | verify-email: IP limiter + per-token atomic 6-strike counter (spent rows invisible to the fetch) | Verified (security.spec.ts) |
| Request bodies | 1MB budget (413), JSON-only content types (415), malformed → 400 | Verified (http-body.test.ts) |
| Error mapping | ZodError/ValidationError → 400, BusinessRuleError → 422, ConflictError → 409, P2002 → 409, P2025 → 404, 413/415, unauth → 401, unknown → 500 (detail logged server-side only) | Verified |
| Boot guard | Production fatals on missing/blank/public-dev/`.env.example` `AUTH_SECRET` values (exit 1, not a degraded server) | Verified (env-check.test.ts) |
| Ownership | Every retail query scoped `where:{userId}`; deletes verify ownership first | Verified (delegates) |
| Input validation | Zod strip-mode on every write path; unknown keys dropped; partial PATCH filtered by `sentKeysPatch` | Verified |
| Injection | Prisma parameterized queries only; no string-built SQL | Verified (code inspection) |
| Secret hygiene | `.env` gitignored; seed password default documented as demo-only; no credentials in src (the reference account's email/password never appear in committed code — seed reads env) | Verified |
| Money integrity | Prices/IVA recomputed server-side from DB rows; client cannot set totals; efectivo must cover the total (`paymentCoversTotal` → 422) | Verified (sale-integrity pins) |
| Shift/stock integrity | Open-shift gate + GUARDED in-transaction stock decrement (`stock:{gte:qty}` — no oversell); duplicate-open re-checked inside the transaction → 409; delete guards on registers/cashiers with open shifts | Verified (sale-integrity.spec.ts) |

Threat notes: the login limiter is in-memory (per-process) — acceptable for
single-tenant self-hosting; multi-instance deploys need a shared store.
Social-login buttons are intentionally honest placeholders (no OAuth apps
configured; they explain instead of dead-ending). **Reasoned/Assumed.**

---

## 7. Worker / Background Service Architecture `[CONDITIONAL]`

None. There are no queues, schedulers, or background workers; everything is
request-scoped. `src/instrumentation.ts` runs the AUTH_SECRET boot check once
per server start (fail-fast in production). The Next.js dev indicator and
`dev.log`/`server.log` tees are the only operational surfaces. **Verified.**

---

## 8. Testing Strategy `[MANDATORY]`

Two layers, two runners, disjoint file globs:

| Layer | Runner | Scope | Count |
|---|---|---|---|
| Unit | vitest (`tests/**/*.test.ts`, `src/**/*.test.ts`, node env) | Pure seams + source pins | 147 tests / 14 files — Verified |
| E2E | playwright (chromium, standalone server on :3100) | Browser contracts | 49 specs — Verified |

- **Unit seams**: money (the verified ticket math), ticket (V-ID shape),
  router (8-view map + aliases), date (es-MX formatters), validation
  (schemas + gates), schema (model/cascade/cents pins + .env contract),
  tailwind-traps (the v4 space-y/theme/shadow rules in source), db-path
  (anchors + the v3 mangled-form hardening), auth (scrypt/HMAC/limiter),
  api-timeout/api-offline (the fetch seam), env-check, site, dev-preflight.
- **E2E**: navigation (8 routes + 404 + collapse widths), mobile-navigation
  (the drawer contract incl. TRAP-4 geometry guard + no-overflow sweep),
  auth (logged-out surface, bad/good credentials), inventory (CRUD + search +
  chips), terminal-sales (no-shift gate → open shift → sell → receipt →
  stock decrement → close; cash-short block), registers (CRUD + guards),
  cashiers (CRUD), settings (round-trip + live chrome rename), reports
  (periods + verified KPIs), a11y smoke (axe minus color-contrast, disclosed).
- **Infrastructure**: e2e boots `.next/standalone/server.js` on an isolated
  port with `db/e2e.db` (force-reset + reseeded per run); one storageState
  login (rate-limiter budget); `AUTH_SECRET` pinned to a 64-hex shape.
- **Gates**: `lint → typecheck → build → test → test:e2e`, all green at
  PAD v1.0.0 (worklog entry). Failure policy: fix the cause; never weaken a
  pin (AGENTS.md).

---

## 9. Build & Deployment `[MANDATORY]`

- **Build**: `bun run build` → Next standalone output; the script then copies
  `.next/static` and `public/` into `.next/standalone/` (self-contained
  server at `.next/standalone/server.js`). `outputFileTracingRoot` pins
  tracing to this repo. **Verified.**
- **Run**: `bun run start` (NODE_ENV=production) or `bun
  .next/standalone/server.js` with `PORT`; `Dockerfile` + `docs/DEPLOYMENT.md`
  carry the container path (inherited from the scaffold — re-verify the
  healthcheck app label before shipping a container).
- **Env for production**: absolute `DATABASE_URL` (or the repo-anchored
  contract if deployed in-place), a real 64-hex `AUTH_SECRET`
  (`openssl rand -hex 32`), `NEXT_PUBLIC_SITE_URL`.
- **DB migration**: `bun run db:push` (SQLite file). The db directory is
  gitignored; the seed rebuilds the reference dataset.
- **Screenshots**: `scripts/capture-screenshots.sh` regenerates
  `docs/screenshots/` against a running server.

---

## 10. Developer Handbook `[MANDATORY]`

- **Setup → daily loop**: see README Quick Start; the gate order is
  `lint → typecheck → build → test → test:e2e`.
- **Add a view**: `src/lib/router.ts` (ViewId/NAV_ITEMS/VIEW_TITLES) →
  rewrite in `next.config.ts` → view component in `src/components/views/` →
  registry in `src/app/page.tsx` → tests: router.test + a navigation.spec
  entry.
- **Add a model**: schema.prisma → `bun run db:push` → Zod schema in
  `src/lib/validation.ts` → delegate in `src/lib/server/entities.ts` (or a
  hand-rolled route via `withUser`) → store keys in `src/lib/store.ts` →
  schema.test pins.
- **Money**: never floats; use `src/lib/money.ts` (+ moneyCents at the
  boundary); new ticket math gets a money.test pin.
- **Styling**: tokens in `globals.css`; respect the five v4 trap rules
  (flex gap, full-color theme vars, pinned shadow, explicit gradients);
  run `bun run test` — tailwind-traps.test.ts guards the source.
- **Docs discipline**: behavior changes update AGENTS.md/CLAUDE.md/README/
  this PAD + `worklog.md` in the same change.

---

## 11. Known Issues & Outstanding Tasks `[MANDATORY]`

| # | Item | Status |
|---|---|---|
| 1 | Reference dead ends designed-from-language (active-shift terminal UI, payment dialog, close-shift dialog are unobservable on the reference) | Disclosed — dossier §8; treated as superset designs, evidence-labeled Assumed |
| 2 | The 12th seeded product is count-pinned only (below the reference's fold) | Disclosed — dossier §8 |
| 3 | In-memory rate limiter (per-process) | Accepted for single-tenant; revisit for multi-instance |
| 4 | Product images: the dialog accepts a file but the clone does not store/serve uploads | Known gap (reference stores an image URL) |
| 5 | Receipt email action (`Mail` icon) is present but not wired (no SMTP) | Known gap |
| 6 | Dockerfile/DEPLOYMENT.md inherited from the scaffold reference the old app name in prose | Pending doc refresh |
| 7 | `next.config.ts` sets `typescript.ignoreBuildErrors: true` (scaffold default) | Mitigated by the mandatory `bun run typecheck` gate; keeping the gate green is the contract |
| 8 | a11y: the reference's own low-contrast headings are replicated for parity (axe color-contrast excluded, disclosed) | Disclosed deviation |

---

## 12. Key Files Reference `[MANDATORY]`

| File | Role |
|---|---|
| `src/app/page.tsx` | The shell: auth gate, pre-warm, view registry, live theming |
| `src/lib/router.ts` | The single view↔path map (+ aliases, titles) |
| `src/lib/store.ts` | Both Zustand stores; ticket math; activeShift pick |
| `src/lib/money.ts` | Cents/IVA/change — the verified money seam |
| `src/lib/ticket.ts` | `V-XXXXXXXX` ticket ids |
| `src/lib/validation.ts` | Every API payload schema |
| `src/lib/api.ts` | The client fetch seam (offline/timeout classes) |
| `src/lib/db-path.ts` | The DATABASE_URL resolution contract (v3-hardened) |
| `src/lib/server/http.ts` | Route factories + error mapper |
| `src/lib/server/entities.ts` | Owned delegates + sentKeysPatch |
| `src/app/api/sales/route.ts` | The sale transaction (gate, recompute, decrement) |
| `src/components/layout/sidebar.tsx` · `mobile-chrome.tsx` | The chrome + drawer |
| `src/components/views/terminal-view.tsx` | Grid + ticket + payment dialog |
| `src/app/globals.css` | The v4 design system + trap pins |
| `prisma/schema.prisma` · `prisma/seed.ts` | Data model + reference dataset |
| `tests/e2e/mobile-navigation.spec.ts` | The drawer contract + TRAP-4 guard |
| `docs/reference-investigation.md` | The evidence dossier |
| `scripts/capture-screenshots.sh` | The screenshot evidence generator |

---

## 13. Glossary `[CONDITIONAL]`

| Term | Meaning |
|---|---|
| Caja | Register — a physical checkout drawer |
| Cajero | Cashier — the person operating a shift |
| Turno | Shift — an open/close session on a register with a float and a count |
| Ticket | A sale's receipt (id `V-XXXXXXXX`) |
| IVA | VAT (default 16% in the reference's MXN context), per-product, price-exclusive |
| Fondo de caja inicial | Opening float |
| COBRAR | Charge/check-out action on the terminal |
| AGREGADO | The ticket panel's "added" kicker label (reference copy) |
