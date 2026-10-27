# VeloxPOS — Remediation Plan v16 (Session V15→v16, 2026-10-27)

> Scope: the full-page PIXEL-DIFF pass session_23/24 suggested next (both
> viewports, every view) plus the login-surface hover sweep and the mobile
> drawer timing carry-over — executed with a browser-authoritative palette
> analysis that surfaced the cycle's headline finding: **Tailwind v4's
> default palette is NOT the reference's palette**. The v4 engine
> re-derived every default color in oklch and 17+ of the 22 spot-checked
> entries render beyond ±2 per channel of the reference's v3 hexes
> (indigo-500 Δ56, red-500 Δ24, green-700 Δ21, violet-600 Δ24, blue-600
> Δ17, indigo-600 Δ17, emerald-500 Δ16, amber-500 Δ11 — pixel-read in
> Chromium via `scripts/palette-drift-v16.ts`). The reference renders v3
> values (live-measured: badge text rgb(21,128,61), pill bg
> rgba(124,58,237,0.2), amber count rgb(217,119,6) — all v3 hexes); the
> clone renders the drifted oklch values. The class-pinning idiom (v10+)
> silently accepted the drift — class parity ≠ color parity. The second
> finding: **the category display order** — the reference's Inventario
> chips AND Ajustes categorías render `Snacks, Lácteos, Higiene
> Personal, Limpieza, Alimentos, Bebidas` (measured twice via DOM), a
> THIRD sequence distinct from both the clone's createdAt order
> (`Lácteos, Limpieza, Higiene, Alimentos, Snacks, Bebidas` — the donut
> order v10/F1 seeded) and alphabetical; the clone's chips/Ajustes render
> the donut order today. New evidence also closes the pixel-diff height
> question: **the reference's pages are viewport-locked** — its document
> never scrolls (scrollHeight pinned to clientHeight, scrollTop stays 0
> under programmatic scroll, no internal scroll container) so its
> inventory rows 4-12, its settings sections below the fold, and its
> low-stock card bottom are PERMANENTLY UNREACHABLE at 1280×800; the
> clone's flowing layout (all content scrollable) is the functional
> superset. Baseline re-verified before audit: main @ d757f49 (the v15
> close 7872255 + the remote's session_24 transcript), gates green
> (lint 0 · tsc 0 · build ✓ · unit 470/470 · e2e 166/166).

## 0. Verification ledger (all live unless noted; ref vs clone)

| # | Item | Method | Reference | Clone | Verdict |
|---|------|--------|-----------|-------|---------|
| L1 | Login social-button hovers | DOM class dump both apps | `hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200` ×4 socials | identical class family + 54px/16px geometry (v12 pins hold) | at parity |
| L2 | Login link hovers | DOM class dump | Forgot `text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors`; Sign-up same minus font-medium | identical (exact strings) | at parity |
| L3 | Sign in button | DOM class dump | `w-full h-11 sm:h-12 bg-slate-900 hover:bg-slate-800 … rounded-xl transition-all duration-200`; no password toggle | identical; computed radius 12px / h 48 / footer gap 12px — all equal | at parity |
| L4 | Login card sections | geometry probe | card 16→916 (h900), col 812: logo 96 / heading 72 / social+form 580 | identical values | at parity (the 8px docH delta is platform chrome below main) |
| L5 | Reference /signup · /forgot-password | direct nav | /signup → the 404 page (SD-20 unchanged); /forgot → 404 unless client-navigated | the public working pages (superset, SD-20) | standing disclosure |
| L6 | Mobile drawer | data-testid probes at 390px | NO drawer (the plain squeezed sidebar — standing) | panel 288px, `animate-in slide-in-from-left duration-200` → computed `enter 0.2s`, overlay + aria-expanded, 8 links at uniform 40px height + 4px gap (44px pitch), zero horizontal overflow | superset (session_22 carry-over CLOSED: timing = the disclosed 200ms slide) |
| L7 | Full-page pixel diff @1280 | Playwright full-page ×9 surfaces | — | terminal 1.49% · sales 2.46% · login 2.75% (AA noise + the oklab text rendering) vs inventory 7% · registers 6% · reports 8.5% · dashboard 11.7% · settings 11.4% · cashiers 17.3% | the >2.5% views decompose into F1 (palette) + F2 (chips) + the disclosed supersets (L9/L10/L12) |
| L8 | Dashboard geometry | section-Y probe | H1 y24 · KPI y104 h94 · charts y279 (280/200) · low-stock h3 y689 | H1 y24 · KPI y104 h94 · charts y283 (280/200) · low-stock h3 y689 — every section anchor equal | at parity (the ref's 800px capture height was a settle artifact; its settled docH also grows to 836) |
| L9 | The reference's scroll architecture | scrollTo + container sweep | scrollTop locked at 0, scrollHeight==clientHeight, NO internal scroll container; inventory table bottom y982 UNREACHABLE; settings/reports clip below the fold | the document flows and scrolls (inventory docH 1006, settings 1458) | **F3 disclosure** — the clone's scroll is the superset |
| L10 | Cajeros data state | DOM + prior docs | "0 usuarios registrados" empty list + Turnos: Demo Cashier (Caja 2, 26/10, $0.00) + the 2 Cesar historical shifts | the seeded cashier row (the FK the clone's data model needs) + the 2 historical shifts (v10 L14: Demo Cashier = platform activity, excluded) | standing disclosure (v10) |
| L11 | Cashiers CRUD | pixel diff + v15 L16 | read-only view, no action buttons | edit/delete + Nuevo (superset, v6) | standing disclosure |
| L12 | Registers card states | pixel diff + DOM | both cards "Cerrada" (its shifts all closed) | Caja 2 showed "Abierta" — the probe DB's register.status wasn't reset by the direct shift write (the close endpoint sets BOTH shift.status AND register.status in one transaction; my probe only wrote the shift) | app logic correct — probe artifact (F4 tooling fix) |
| L13 | Category chip order | DOM dumps ×2 | `Todos, Snacks, Lácteos, Higiene Personal, Limpieza, Alimentos, Bebidas` | `Todos, Lácteos, Limpieza, Higiene Personal, Alimentos, Snacks, Bebidas` (createdAt asc = the donut order) | **F2** |
| L14 | Ajustes categorías order | DOM dump | `Snacks, Lácteos, Higiene Personal, Limpieza, Alimentos, Bebidas` | createdAt asc (same as chips) | **F2** (same fix) |
| L15 | Donut legend order | DOM dump | `Lácteos, Limpieza, Higiene, Alimentos, Snacks` (first 5) | identical (the v10 seed order) | at parity — the donut keeps its OWN order (guard in B3) |
| L16 | Palette drift | canvas pixel reads in Chromium (`scripts/palette-drift-v16.ts`, 22 spot colors) | v3 hexes (e.g. green-100 [220,252,231], green-700 [21,128,61], amber-600 [217,119,6], violet-600 [124,58,237]) | v4 oklch values (green-100 [219,252,231] ok ±1; green-700 [0,130,54] Δ21; amber-600 [225,113,0] Δ8; violet-600 [127,34,254] Δ24) | **F1** — 17/22 drift beyond ±2 |
| L17 | Low-stock row family | DOM + pixels | `bg-amber-50/50 border-amber-100` + amber-600 count rgb(217,119,6) | identical classes; bg pixels [255,251,233]≈±2; count pixels [225,113,0] Δ8 | F1 (class parity confirmed; value drift is F1) |
| L18 | Completada badge | DOM + pixels | bg rgb(220,252,231) + text rgb(21,128,61) | bg [219,252,231] ±1; text = v4 green-700 [0,130,54] Δ21 | F1 |
| L19 | KPI cards | computed styles | values fw700/24px, Tailwind default font stack, card rgba(16,18,32,.9) + hairline | identical (fw700/24px, same stack, same chrome) | at parity (the VLM "bolder" claim was a misread) |
| L20 | Reports KPI grid | geometry probe | cards x[244,587,929] w327 gaps[16,16] | identical | at parity (the VLM spacing claim was a misread) |
| L21 | Settings inputs + zap chip | computed styles | input border rgb(38,42,54) 1px, transparent bg, 12px radius, 36px; zap WHITE in the violet gradient chip | identical | at parity |
| L22 | Active nav pill | computed styles | bg rgba(124,58,237,0.2) + text rgb(196,181,253) | classes pinned (v4); the rendered violet rides F1's drift | F1 covers it |
| L23 | Sidebar/table/badge hovers | v15 pins re-run in baseline | — | 166/166 green | at parity (v15 holds) |
| L24 | Mobile 390px pair | VLM + prior docs | the squeezed sidebar (its 220px chrome eats half of 390px) | the app bar + stacked layout (the v12 superset) | standing disclosure |

## 1. Design decisions (resolved)

- **SD-63 — the palette pins are sRGB hexes in `@theme`, the single
  source.** One block in `globals.css` redefines every palette variable
  the app uses (61 entries across slate/gray/red/orange/amber/green/
  emerald/teal/blue/indigo/violet/purple) to its Tailwind v3 hex — the
  values the reference actually renders. Utilities, opacity modifiers
  (`bg-violet-600/20` → color-mix with a hex keeps the sRGB hue →
  rgba(124,58,237,0.2) exact), ring/shadow/border/fill consumers all
  inherit. Probe-identity e2e pins stay green automatically (both sides
  of each probe read the overridden vars); NEW literal pins prove
  v3-exactness (rgb(21,128,61) badge text, rgba(124,58,237,0.2) pill,
  rgb(217,119,6) amber count, rgb(79,70,229) ticket cell). Chart
  literals (#6366f1 line, DONUT_COLORS) and shadcn tokens (--primary
  127 98 244) are already exact — untouched. The oklab-interpolation
  disclosure for `bg-gradient-to-*` (trap 4) is unchanged; the pinned
  gradient ENDPOINTS now match the reference's v3 endpoints exactly.
- **SD-64 — the category display order is a `sortOrder` column, seeded
  to the reference's observed chip sequence.** The reference renders
  TWO orders: the entities surfaces (chips + Ajustes:
  Snacks, Lácteos, Higiene, Limpieza, Alimentos, Bebidas) and the
  donut's byCategory (Lácteos, Limpieza, Higiene, Alimentos, Snacks) —
  its internal rules are unobservable, only the sequences are. The
  clone keeps the donut on createdAt (the v10 pin) and moves the
  entities surfaces to `sortOrder` (seeded 1-6 in the chip sequence);
  the category delegate's list orders `[{sortOrder asc},{createdAt
  asc},{id asc}]`; user-created categories append (create computes
  max+1 server-side — sortOrder is never client-writable); the chips +
  Ajustes render the store's order unchanged.
- **SD-65 — the reference's viewport-locked scrolling is a disclosure,
  not a clone change.** Its document never scrolls; long content
  (inventory rows 4-12, the settings lower sections) is unreachable on
  the reference itself. The clone's scrolling layout is the correct
  superset — recorded in AGENTS.md 29 so future pixel-diffs read the
  height deltas correctly.
- **SD-66 — probe tooling: a shift close must reset BOTH `shift.status`
  AND `register.status`.** The close endpoint writes both in one
  transaction; direct probe-DB manipulation that skips the register
  write leaves phantom "Abierta" cards. The v16 probe/capture scripts
  now reset both (F4).

## 2. Execution batches (TDD: red → green → gate)

### B1 — F1: the v3 palette pin block (61 entries)

- `src/app/globals.css`: a new `@theme` block after the vx-* tokens —
  the 61 used palette entries pinned to v3 hexes, with the comment
  explaining the drift + the "new palette usage requires its pin"
  rule. No component/class changes anywhere else.
- Unit pin (`tests/functional-parity-v16.test.ts`): the source pin —
  globals.css contains every `--color-<family>-<step>: #<v3 hex>` entry
  (all 61, exact hexes); the block sits inside `@theme`.

### B2 — F2: the category sortOrder

- `prisma/schema.prisma`: `Category.sortOrder Int @default(0)`.
- `prisma/seed.ts`: the category creation stamps sortOrder 1-6 in the
  reference's chip sequence (Snacks=1, Lácteos=2, Higiene=3, Limpieza=4,
  Alimentos=5, Bebidas=6); the comment records both measured orders.
- `src/lib/server/entities.ts`: `OwnedConfig` grows an optional
  `listOrderBy` (full orderBy array — defaults to the v10
  createdAt+id) and an optional `prepareCreate` hook; the
  categoryDelegate passes the sortOrder ordering + a create that
  computes max+1.
- Unit pins: the seed's sortOrder map matches the reference sequence;
  the delegate's ordering config; sortOrder absent from the client
  schema (never writable).

### B3 — e2e pins (`tests/e2e/functional-parity-v16.spec.ts`)

1. The Inventario chips render `Todos, Snacks, Lácteos, Higiene
   Personal, Limpieza, Alimentos, Bebidas` (the F2 sequence).
2. The Ajustes categorías list renders the reference order.
3. The donut legend still renders `Lácteos, Limpieza, Higiene,
   Alimentos` first (the v10 order guard).
4. The Completada badge text computes `rgb(21, 128, 61)` EXACTLY
   (v3-exactness — the F1 proof on green-700).
5. The active nav pill bg computes `rgba(124, 58, 237, 0.2)` (v3
   violet-600 at 20% — the F1 proof on the pill).
6. The low-stock count computes `rgb(217, 119, 6)` (amber-600 v3).

### B4 — probe/tooling (F4) + evidence

- `scripts/capture-v16-pixeldiff.ts`: the probe prep resets
  register.status too; the shift-close write uses the real endpoint
  semantics.
- Evidence: the chip-sequence shot (desktop-inventory-chips.png), the
  refreshed standard desktop set (the palette touches every surface),
  VLM-verified.

### B5 — gates → docs lockstep → commit + push

## 3. Test plan (pins first — red)

Unit: the 61-entry source pin (B1) + the seed/delegate pins (B2).
E2e: the 6 pins above (B3) — the chip-sequence pins run RED against
today's createdAt order; the v3-exactness color pins run RED against
the oklch values (they compute lab()/oklch() today, rgb() after B1).

## 4. Ship

- Full gates: lint → typecheck → build → unit → e2e
- Evidence into `docs/screenshots/` (the chip shot + the refreshed set)
- Docs lockstep: AGENTS.md (contract 29 + the traps-section palette
  rule + the L9/L12 disclosures), CLAUDE.md (v16 block + counts),
  README badge, PAD (v2.4.0 + ADR-026), retail-pos_SKILL.md v1.11.0,
  docs/session_25.md, worklog
- Commit + SSH-wrapper push to main

## 5. Out of scope (disclosed)

- The reference's own clipped scrolling (SD-65 — nothing to mirror; the
  clone's scroll is the superset)
- The reference's broken/dead flows (the 403 settings save, the empty
  cashier combobox, the shift-gated terminal) — standing
- The Cajeros data-state deltas + the CRUD supersets (v6/v10 — standing)
- The donut/byCategory ordering (measured at parity — guarded, not
  changed)
- Chart literals, shadcn tokens, vx-* design tokens (already exact)
- The oklab gradient-interpolation engine difference (trap 4 — standing
  disclosure; the endpoints are now v3-exact)
- The login page's 8px docH delta below the card (platform chrome;
  every visible element at computed parity — L4)

## 6. Execution results (filled on completion — 2026-10-27)

All batches executed TDD; every pin ran red before its implementation
(unit 5 red / 3 pre-existing guards; e2e 7 red / 2 green-by-design — the
auth setup + the F2c donut guard).

- **B1 (F1, SD-63)** — DONE. The `@theme` palette pin block lands in
  globals.css after the vx-* tokens: 61 entries (slate ×10, gray ×9,
  red ×8, orange ×1, amber ×6, green ×6, emerald ×6, teal ×1, blue ×4,
  indigo ×5, violet ×4, purple ×1) pinned to their v3 hexes with the
  drift comment + the new-usage rule. No component changes anywhere —
  the single source propagates through every utility, /opacity
  color-mix modifier, and ring/shadow/border consumer.
- **B2 (F2, SD-64)** — DONE. `Category.sortOrder Int @default(0)` lands
  in the schema (db:push applied); the seed stamps
  `CATEGORY_SORT_ORDER` (Snacks=1 … Bebidas=6) on BOTH the create and
  the upsert update paths (idempotent reseeds converge); the delegate
  factory grows optional `listOrderBy` + `prepareCreate` (defaults
  preserve the v10 createdAt+id rule for every other delegate); the
  categoryDelegate lists `[{sortOrder asc},{createdAt asc},{id asc}]`
  and appends new categories at max+1; `sortOrder` stays absent from
  the client schema (never writable).
- **B3-the-pins** — DONE. 8 unit pins
  (`tests/functional-parity-v16.test.ts`: the 61-entry source pin, the
  seed map, the delegate config, the schema column, the donut guard ×3)
  + 7 e2e pins
  (`tests/e2e/functional-parity-v16.spec.ts`: the chip sequence, the
  Ajustes sequence, the donut guard, and the four v3-exactness proofs).
  Authoring lessons (hardened): the /opacity modifiers serialize
  `oklab(… / 0.2)` even over hex-pinned vars (color-mix forces the
  notation — the F1b pin reads the sRGB PIXEL bytes, the v15 idiom);
  the Ajustes chips are `<li>` rows (leaf-text walks miss them — query
  `li.glass-button`).
- **B4 (F4 + evidence)** — DONE. The capture script's probe prep resets
  BOTH shift.status and register.status (the phantom-"Abierta" fix).
  Evidence: `docs/screenshots/desktop-inventory-chips.png` (the chip
  sequence verified in the live DOM before the shot AND VLM-verified:
  Todos, Snacks, Lácteos, Higiene Personal, Limpieza, Alimentos,
  Bebidas) + the full standard set refreshed via
  `scripts/capture-screenshots-prod.sh` (the palette touches every
  surface).

**Final gate: lint 0 · tsc 0 · build ✓ (exit 0, the 1 documented
pre-existing instrumentation warning) · unit 478/478 (470+8, 32 files)
· e2e 173/173 (166+7).**

Docs lockstep: AGENTS.md contract 29, CLAUDE.md counts + the v16 block,
README badge (478+173) + the tests row, PAD v2.4.0 + ADR-026 + §8
counts, retail-pos_SKILL.md v1.11.0, docs/session_25.md, this ledger,
worklog.

Environment audit: `.env` → `DATABASE_URL="file:../db/custom.db"` ✓;
`db/` at the repo root (custom.db pushed + reseeded with sortOrder) ✓;
`.env.example` tracked and current ✓; vitest + playwright suites
configured and extended ✓.
