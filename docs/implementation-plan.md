# Implementation Plan — VeloxPOS clone on the `web-retail-pos` scaffold

> Target: a production-ready, enterprise-grade clone (functional superset,
> visual parity) of `veloxposretail.base44.app`, built on this repo's
> Next.js 16 + React 19 + Tailwind v4 + Prisma/SQLite scaffold.
> Companion dossier: `docs/reference-investigation.md`.

## 0. Stack Decision Record

| Decision | Choice | Why |
|---|---|---|
| Runtime | Next.js 16 (standalone) + React 19 — **kept** | The scaffold's tested pipeline (build → standalone server, e2e webServer) |
| Styling | Tailwind CSS **v4** CSS-first — **kept** | ADR-004/005 constraints; the v3→v4 traps are already documented and test-pinned in this repo (`docs/Tailwind-V4-Validation-Report.md`) |
| DB | Prisma + SQLite at `db/custom.db` via `DATABASE_URL="file:../db/custom.db"` — **kept** | User requirement; `src/lib/db-path.ts` already implements the schema-anchored + runtime-anchored resolution contract |
| SPA routing | One page + `rewrites()` — **kept** | The reference is a SPA at PascalCase paths; the scaffold already proves this pattern (ADR-014 pre-warm, CLS 0.00) |
| Charts | Hand-rolled SVG (area, bars, donut) — **new** | Zero new dependencies, deterministic tests, pixel control for parity |
| State | Zustand store — **kept** | Matches scaffold idioms |
| Money | Integer-cents domain module (`src/lib/money.ts`) | IVA math must round like the reference (verified: $18.50 + $2.96 = $21.46) |
| i18n | Hard-coded Spanish UI (parity) | The reference UI is Spanish; no i18n layer is warranted |

## 1. Prisma schema (rewrite — auth models preserved)

Keep `User`, `Session`, `PasswordResetToken` (auth flows unchanged). New
retail models (all user-owned, `onDelete: Cascade` on the owner):

```
StoreSetting (1:1 owner)  name, logoUrl?, address?, phone?, email?,
                          fiscalId?, currency="MXN", primaryColor="#6366f1",
                          secondaryColor="#8b5cf6", ticketFooter?, cardProvider="Ninguno"
Category                  name (unique per user)
Product                   name, barcode, categoryId?, price(cents Int), cost?,
                          stock Int, minStock Int=5, ivaRate Int=16, unit="Pieza",
                          imageUrl?, active Boolean=true
Register (Caja)           name, location?, status: open|closed
Cashier                   name, email?, active
Shift (Turno)             registerId, cashierId, openingFloat, openedAt,
                          closedAt?, closingAmount?, status: open|closed
Sale                      ticketNo (unique), method: efectivo|tarjeta, status,
                          subtotal, tax, total (cents), clientName?, cashierName,
                          registerName, shiftId?, createdAt
SaleItem                  saleId, productId?, name, qty, unitPrice, ivaRate, lineTotal
```

Seed (`prisma/seed.ts`): owner user (env-provided), 6 categories, the 12
verified products, 2 registers ("Caja 1 · Entrada principal", "Caja 2 ·
Área de abarrotes"), 2 closed shifts for "Cesar Martínez", 2 completed
sales (V-MO6BJT7G $21.46, V-MMPNY55Z $61.48) with items.

## 2. Route & view map (SPA, rewrites)

Views (8): `terminal` (/), `dashboard` (/Dashboard), `inventario`
(/Inventario), `ventas` (/Sales), `cajas` (/Registers), `cajeros`
(/Cashiers), `reportes` (/Reports), `ajustes` (/StoreSettings).
Aliases rewrite `/Terminal`, `/Inventario`, `/Ventas`, `/Cajas`,
`/Cashiers`… onto `/`; unknown paths → Spanish 404 (`not-found.tsx`,
dark card + violet badge). Lowercase aliases resolve case-insensitively
(superset); true unknowns 404.

## 3. API surface (all behind the session cookie)

```
GET/POST           /api/products        GET/PATCH/DELETE /api/products/[id]
GET/POST           /api/categories      DELETE /api/categories/[id]
GET/POST           /api/sales           GET /api/sales/[id]
GET/POST           /api/registers       PATCH/DELETE /api/registers/[id]
GET/POST           /api/cashiers        PATCH/DELETE /api/cashiers/[id]
GET/POST           /api/shifts          POST /api/shifts/[id]/close
GET/PATCH          /api/settings        (store settings; PATCH re-seeds categories)
GET                /api/dashboard       (stats + 7-day series + category split + low stock)
GET                /api/reports?days=7|14|30|90
GET                /api/auth/me         POST /api/auth/login|logout|register
POST               /api/auth/request-reset + /reset  (existing pattern)
GET                /api/health          (kept)
```

Server rules: Zod-validated bodies, ownership scoping via the session
user, `userId` cascade everywhere, ticket numbers `V-` + 8 base-36 chars
generated server-side, sales decrement stock in a transaction and reject
insufficient stock (422), shift gate: creating a sale requires an OPEN
shift for the chosen register; duplicate active-shift-per-register
guarded (409).

## 4. Frontend architecture

```
src/app/page.tsx          auth gate → shell → view switcher (kept pattern)
src/app/login/page.tsx    LIGHT login card (social buttons + email/password)
src/app/signup/page.tsx   light sign-up card (same design system)
src/app/reset-password/*  light reset surfaces (kept routes, restyled)
src/app/not-found.tsx     dark 404 (violet badge, "Ir al Terminal")
src/components/layout/    sidebar.tsx (dark, 220/68, bottom toggle)
                          mobile-chrome.tsx (dark app bar + drawer)
                          nav-items.tsx (shared link list)
src/components/pos/       stat-card, section-card, pos-charts (Area/Bars/Donut),
                          status-pill, product-modal, sale-detail-dialog,
                          shift-dialog, confirm-dialog, money-input…
src/components/views/     terminal/dashboard/inventory/sales/registers/
                          cashiers/reports/settings-view.tsx
src/lib/                  router.ts (8 views) · store.ts (zustand: session,
                          sidebar, mobile drawer, POS collections) ·
                          money.ts (cents, IVA, change) · ticket.ts (V-ID) ·
                          date.ts (es-MX formatting) · api.ts (kept)
```

**Design tokens** (globals.css, `@theme inline`): canvas `#080a14`,
surface `#0d0f1a`, border `#1e2235`, primary violet→indigo gradient,
emerald/amber/blue stat fills, rounded-xl buttons, rounded-2xl cards.
The store settings' primary/secondary colors override the accent CSS
vars at runtime (Personalización is live).

### Tailwind v4 traps (from `docs/Tailwind-V4-Validation-Report.md`) — build rules

1. **Never** put `mt-*`/`mb-*` children inside `space-y-*` containers —
   drawer/nav lists use `flex flex-col gap-*` (Trap 4; the mobile-menu CTA
   gap bug). Pinned by `tests/e2e/mobile-navigation.spec.ts`.
2. `shadow-sm` pinned in `@theme inline` to the v3 geometry (Trap 5) if
   used; prefer explicit `shadow-*` arbitrary values on dark surfaces.
3. Theme vars must be full `hsl(...)`/rgb values, never bare triplets
   (Trap 1). Gradients via explicit `linear-gradient` utilities (Trap 3).

### Mobile drawer contract (the reference has NONE — superset, e2e-pinned)

App bar (<1024px): dark, h-16, hamburger + brand chip + store name.
Drawer: full-height left panel (w-72), all 8 links, Esc + backdrop close,
body scroll lock, focus trap, `aria-expanded` on the hamburger, closes on
route change. Geometry asserted at 390×844 (panel width, CTA gap = flex
gap, no horizontal overflow).

## 5. Testing plan (vitest + playwright — configs modified)

- **vitest.config.ts** — unchanged include shape (`src|tests/**/*.test.ts`);
  new POS unit files: `money.test.ts`, `ticket.test.ts`, `router.test.ts`
  (rewritten), `pos-validation.test.ts`, `shift-state.test.ts`,
  `schema.test.ts` (retail model pins), `db-path.test.ts` (kept),
  `auth.test.ts` (kept subset), `settings-colors.test.ts`.
- **playwright.config.ts** — kept architecture (standalone server +
  `db/e2e.db` + storageState auth). New/rewritten specs:
  `auth.spec.ts` (login/logout/reset), `navigation.spec.ts` (8 routes +
  404), `mobile-navigation.spec.ts` (drawer contract + v4-trap guards),
  `inventory.spec.ts` (CRUD + filters), `terminal-sales.spec.ts`
  (shift → ticket → COBRAR → receipt → stock decrement), `registers.spec.ts`
  (create/open/close), `cashiers.spec.ts`, `settings.spec.ts` (colors +
  categories), `reports.spec.ts` (periods + KPIs), `a11y-smoke.spec.ts`
  (axe on shell + drawer).
- Old study-domain specs/tests are **removed** with the views they pinned
  (they assert strings that no longer exist by design); the standing-suite
  census scripts under `scripts/` that grep the old src tree are archived
  to `scripts/archive-study-sweep/` to keep `npm test` meaningful.

## 6. Delivery bar (Definition of Done)

1. `bun run lint`, `bun run typecheck`, `bun run build` green.
2. `bun run test` (vitest) and `bun run test:e2e` (playwright) green;
   failures disclosed, never suppressed.
3. Dev server screenshot set in `docs/screenshots/` (desktop 8 views +
   login + 404 + mobile drawer open/closed) captured from the RUNNING app
   via agent-browser.
4. Visual parity spot-checks vs `docs/reference-evidence/ref-*.png`
   (colors, layout, copy) recorded in the verification ledger.
5. `AGENTS.md`, `CLAUDE.md`, `README.md`, `Project_Architecture_Document.md`
   regenerated for the POS domain; `worklog.md` appended.
6. Single-branch git history on `main`; push via
   `docs/ssh_git_wrapper_v3.py` per `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`.

## 7. Sequenced work plan

| # | Batch | Contents |
|---|---|---|
| 1 | Foundations | `.env` + `db/`, schema, seed, db push, money/ticket/date libs |
| 2 | Shell | globals.css tokens, layout, sidebar, mobile chrome, router, store, login/signup/reset, 404 |
| 3 | APIs | products, categories, registers, cashiers, shifts, sales, settings, dashboard, reports |
| 4 | Views | inventory, dashboard, sales, registers, cashiers, reports, settings, terminal |
| 5 | Tests | vitest units + playwright specs; configs; scripts archive |
| 6 | Verification | lint/tsc/build/tests, agent-browser sweeps (desktop + 390px drawer), fix loop |
| 7 | Evidence | `docs/screenshots/` captures |
| 8 | Docs | AGENTS/CLAUDE/README/Architecture, worklog |
| 9 | Ship | commits + push via SSH wrapper (main only) |

## 8. Risks & mitigations

- **Reference dead ends** (no cashiers → no active-shift UI): designed from
  the app's own language; disclosed in the dossier (§8), not guessed silently.
- **v4 engine traps**: build rules above + e2e pins; the report's trap log
  is the checklist.
- **Money rounding drift**: integer-cents module, unit-tested against the
  verified ticket math (18.50 → 21.46).
- **Test flakiness from rate limiter**: storageState auth (single setup
  login) — the scaffold's proven pattern.
- **Scope creep**: the 8 reference views + superset gaps in §7 of the
  dossier bound the build; no speculative features.
