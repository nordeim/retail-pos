# VeloxPOS — Remediation Plan v7 (Session V6→v7, 2026-10-26)

> Scope: the per-route title system, the image/logo clear-and-preview
> semantics, numeric-input parity, and the docs lockstep the v6 close left
> behind. Baseline re-verified before audit: `main @ 9b82111`, gates green
> (lint 0 · tsc 0 · unit 311/311 · build ✓ · e2e 91/91 — the v6 close).
>
> Method: source audit of the full v6 diff + a fresh agent-browser sweep of
> BOTH apps. The reference was re-probed on shell/tables/tile/modal/switch/
> head/mobile — **unchanged from the v6 ledger** (220/244 shell, vx-card
> rgba(16,18,32,.9), 12px/600/slate-500 headers, tile glow rgba(139,92,246,.3)
> pair, 11-field modal with the 42px glass pair, switch #7f62f4, mobile flex
> sidebar) — so every finding below is either a NEW reference behavior the
> prior sessions never probed, or a clone-side bug the v6 execution left.
>
> History: v3 (security/integrity — `d91fe91`), v4 (design system —
> `d04e6f4`), v5 (view internals — `980dfe4`), v6 (functional superset +
> head — `aeea5d5`). v7 sweeps what per-route observation reveals: the
> **document title system** (only the root title was measured before), the
> **data-URL image lifecycle's clear path**, and the settings **logo
> preview** the v6 plan promised but never shipped.

## 0. Verification ledger (all live unless noted; ref = veloxposretail.base44.app vs clone = localhost:3000)

| # | Check | Method | Result |
|---|---|---|---|
| L1 | Reference drift vs v6 ledger | computed probes (shell/H1/tables/tile/modal/switch/head) | **unchanged** — no reference-side drift on any pinned surface |
| L2 | Reference mobile @390 | live | sidebar still `display:flex` 220px, no hamburger — clone drawer remains the superset |
| L3 | Clone mobile drawer | live, full contract | 8 links, 40px links, **uniform 44px pitch**, scroll-lock, aria-expanded, focus into drawer, Escape closes + focus returns to the hamburger — **green, no action** (e2e pins 91/91 include the geometry + focus specs) |
| L4 | Document titles | live, every route on BOTH apps | ref: root "VeloxPOS"; "Dashboard \| VeloxPOS"; "Inventory \| VeloxPOS"; "Sales \| VeloxPOS"; "Registers \| VeloxPOS"; "Cashiers \| VeloxPOS"; "Reports \| VeloxPOS"; "Store Settings \| VeloxPOS"; /login "VeloxPOS"; /signup "Signup \| VeloxPOS"; 404 = title-cased route slug + " \| VeloxPOS" ("/foo-bar-baz" → "Foo Bar Baz \| VeloxPOS"). Clone: static "VeloxPOS" on EVERY route — **drift, M1 (v6 measured only the root)** |
| L5 | og/twitter per-route | DOM on ref | ref varies og:title/og:url/twitter:title/canonical per route. Clone: static root metadata (single-page architecture, ADR-001) — **disclosed deviation SD-14** |
| L6 | Product modal fields | DOM+computed both | 11 labels byte-identical; Categoría/Unidad triggers 36px transparent border #262a36 both; file input native both; Cancelar/Crear 42px glass pair both — **match** |
| L7 | Modal numeric inputs | DOM both | ref: `type="number"` on Precio/Costo/Stock actual/Stock mínimo/IVA (spinner `::-webkit-inner-spin-button` display:flex — arrows render; role=spinbutton). Clone: `type="text"` + inputMode (no spinners; role=textbox) — **drift, V2** |
| L8 | Product image "Quitar" | source + live end-to-end | dialog sends `imageUrl: undefined` when cleared → JSON drops the key → `sentKeysPatch` skips undefined → **the stored image SURVIVES remove+save** (live: preview returns on fresh reopen; API still returns the data URL). Schema is `.optional()` not `.nullable()` — **bug, F1** |
| L9 | Picker-cancel branch | source | `if (!file) { setImageUrl(""); return; }` — a browser firing onChange with an empty FileList (picker cancel) silently clears the local preview — **fold into F1, F3** |
| L10 | Settings logo preview | source + live both | ref renders a data-URL `<img>` at pick time (w=56). Clone: NO img rendered anywhere in Ajustes — the v6 plan B3 + the code comment promise a preview that does not exist; also no way to REMOVE a stored logo — **drift, F2** |
| L11 | Settings PATCH semantics | source | full-form PATCH through `settingsSchema`; `logoUrl` `.optional().nullable()` — a null write clears it (the route's `update: input` applies null). The wiring for a remove-logo control exists — **F2 is view-layer only** |
| L12 | Sidebar tile glow | computed both | both `rgba(139,92,246,.3) 0 10px 15px -3px, … 0 4px 6px -4px`, strokeWidth 2 — **match** (v6 pin green) |
| L13 | Switch checked | computed both | both rgb(127, 98, 244) — **match** (v6 pin green) |
| L14 | Head suite | DOM both | ref og/twitter/apple/manifest/icon unchanged; clone ships the v6 suite (icon link, og:title, twitter:card, working manifest) — **match on the root card** (per-route variance = L5 disclosure) |
| L15 | Docs truth | file reads | PAD §11 rows #4 (product images "Known gap") + #5 (mail "Known gap") are FIXED since v6 but still listed open — **D1**. retail-pos_SKILL.md §2 "238 tests / 20 files" + "70 specs", §3 + §12 "238/238" + "70/70" — actual 311/22 files/91 — **D2** |
| L16 | Dialog button heights | computed both | Cancelar 42px rgba(28,31,52,.85)/white-9 hairline + Crear 42px violet hairline — **byte-match both** (no action) |

## 1. Design decisions (resolved)

- **SD-14 (per-route titles, SPA-side):** the tab title is the user-observable
  surface; the clone mirrors the reference's EXACT per-view strings through a
  pure `DOCUMENT_TITLES` map + a `documentTitleForPath()` helper in
  `src/lib/router.ts` (both unit-pinned), a view-sync effect in the shell
  (`src/app/page.tsx`), a `layout.tsx` metadata export on `/signup`
  ("Signup | VeloxPOS"), and the reference's title-cased-slug behavior on
  404s via the same pure helper (a tiny client title-setter in
  `not-found.tsx` — the page itself stays a server component). The per-route
  og:url/canonical variance stays static: crawlers never execute the SPA's
  route changes, and a single-page architecture (ADR-001) serves one
  server-rendered card — disclosed, not silently dropped. `/login` keeps
  "VeloxPOS" (the reference's own login title); `/reset-password` is
  unobservable on the reference (platform flow) and keeps the root title.
- **SD-15 (numeric inputs):** the five product-dialog numeric fields
  (Precio de venta, Costo, Stock actual, Stock mínimo, IVA %) become
  `type="number"` — the reference's own control type (spinners render on
  hover, role=spinbutton, native keystroke filtering is a functional bonus).
  State stays string-valued (`.value` on a number input is still a string);
  the submit payload and `moneyCents`/`intField` parsing are unchanged, and
  the `valid` guard still requires a non-empty price. The payment dialog and
  register/cashier dialogs are UNOBSERVABLE on the reference (dead-end flows)
  and stay text+inputMode — the documented superset posture.
- **SD-16 (image-clear semantics):** "Quitar" becomes a REAL clear — the
  schema's `imageUrl` gains `.nullable()`, the dialog sends `null` when
  cleared (`sentKeysPatch` passes null through; both Prisma columns are
  already `String?`), and the picker-cancel branch no longer touches the
  stored value (only an explicit Quitar clears). POST with `null` is
  harmless (column nullable). The preview chip keeps its "Quitar" affordance
  and now tells the truth.
- **SD-17 (settings logo preview):** the Ajustes logo block renders the
  pending/stored `logoUrl` as a real `<img>` (h-14 w-14 rounded-xl
  object-contain on the dark surface, beside the Subir logo control — the
  reference renders a 56px-wide preview at pick time; ours keeps the aspect
  true instead of the reference's squashed 56×14 fill, a disclosed
  refinement) plus a Quitar that clears `form.logoUrl` (null rides the
  existing PATCH wiring — L11). The filename chip stays.

## 2. Execution batches (TDD: red → green → gate)

### B1 — The per-route title system (M1/L4, SD-14)
1. `src/lib/router.ts`: `DOCUMENT_TITLES: Record<ViewId, string>` (the
   reference's exact strings, root "VeloxPOS", Ajustes "Store Settings |
   VeloxPOS") + pure `documentTitleForPath(pathname)` (known path → view
   title; unknown → title-cased first segment + " | VeloxPOS";
   "/" → "VeloxPOS").
2. `src/app/page.tsx`: effect — `document.title =
   DOCUMENT_TITLES[view]` on view change (mounted after auth, so /login
   never flickers).
3. `src/app/signup/layout.tsx`: server metadata `{ title: "Signup |
   VeloxPOS" }` (the page stays a client component).
4. `not-found.tsx`: render a tiny client `<NotFoundTitle />` that sets
   `document.title = documentTitleForPath(location.pathname)` on mount
   (server-rendered content unchanged).

### B2 — The image-clear fix (F1/F3/L8/L9, SD-16)
1. `validation.ts`: `imageUrl: z.string().max(600_000).nullable().optional()`.
2. `inventory-view.tsx` ProductDialog: payload `imageUrl: imageUrl === ""
   ? null : imageUrl`; the `!file` branch returns WITHOUT touching state.
3. Guard: `sentKeysPatch` already passes null; verify the create path
   tolerates null (Prisma `String?`).

### B3 — Numeric input parity (V2/L7, SD-15)
1. ProductDialog: `type="number"` (+ `step="0.01"` on Precio/Costo,
   `step="1"` on Stock/Stock mínimo/IVA) on the five fields; ids, testids,
   state, and payload unchanged.

### B4 — Settings logo preview + remove (F2/L10/L11, SD-17)
1. `settings-view.tsx`: beside "Subir logo" render `{form.logoUrl ? <img
   src={form.logoUrl} … h-14 w-14 rounded-xl object-contain /> + a Quitar
   button that sets `logoUrl` to null}`. The chip keeps the picked filename.

### B5 — Docs lockstep (D1/D2)
1. PAD §11: retire rows #4/#5 (both closed by v6/ADR-016); bump PAD to
   v1.5.0 + ADR-017 (the v7 contract set).
2. retail-pos_SKILL.md: correct every stale count (311 unit / 22 files /
   91 specs) + add the v7 block.
3. AGENTS.md: new contracts (title system, image-clear semantics, numeric
   inputs, logo preview); CLAUDE.md counts; README if affected; this plan;
   `docs/session_7.md` (the session log); worklog.

## 3. Test plan (pins first — red)

- **Unit (`tests/functional-parity-v7.test.ts`):** DOCUMENT_TITLES exact
  strings (all 8); `documentTitleForPath` — every canonical path (aliases
  like "/inventario" get the slug treatment, CONSISTENT with viewFromPath's
  unknown-path classification),
  "/" and "" → "VeloxPOS", "/foo-bar-baz" → "Foo Bar Baz | VeloxPOS",
  "/Nonexistent-Route-XYZ" → "Nonexistent Route XYZ | VeloxPOS"; the page
  shell carries the title effect (source pin); signup layout metadata
  (source pin); not-found renders the client title-setter (source pin);
  imageUrl schema accepts null (validation pin); the dialog payload sends
  null on clear + the `!file` branch is a bare return (source pins); the
  five numeric inputs are type=number with steps (source pin); the settings
  view renders a logoUrl preview + Quitar (source pin).
- **E2e (`tests/e2e/functional-parity-v7.spec.ts`):** SPA title follows
  view switches (goto /Dashboard → "Dashboard | VeloxPOS", click to Ventas
  → "Sales | VeloxPOS", back to Terminal → "VeloxPOS"); a full load of all
  8 routes lands on each title; /signup title; unknown route → slug title +
  "Página no encontrada" still renders; image clear round-trip (create with
  image → Quitar → save → API row has imageUrl null → fresh dialog shows NO
  preview); numeric input spinners (computed `::-webkit-inner-spin-button`
  display flex on Precio) + letters never enter a number field;
  settings logo preview appears on pick (setInputFiles) and clears on
  Quitar + the PATCH round-trips null.
- **Existing pins to re-check:** functional-parity-v6 (B2 image preview
  e2e must still pass — the create path is unchanged), visual-parity v4/v5,
  hygiene, mobile-navigation, a11y smoke.
- Full gate after each batch: `bun run lint` · `bun run typecheck` ·
  `bun run test` · `bun run build` · `bunx playwright test`.

### 3a. Execution findings (mid-stream, folded into the batches)

- **F4 (the 404 title race — found live):** Next's client metadata manager
  re-applies the root layout's title ONCE, ~0-50ms after mount — a bare
  effect write in NotFoundTitle was overwritten before paint (probe: the
  attribute write landed at t=0 but the title read "VeloxPOS" again at
  t=50). Fix: a GUARDED MutationObserver on document.head that rewrites
  only when the title differs (no mutation loop) and disconnects on
  unmount so navigating away titles normally. The shell's own title effect
  needs no such guard — it fires only after the auth/prewarm gate flips
  `status` (well past the metadata applier); the full-load e2e pin proves
  it on all 8 routes.
- **F5 (stale `.next/types` after adding a layout):** adding
  `src/app/signup/layout.tsx` made `tsc --noEmit` fail inside the GENERATED
  `.next/dev/types/validator.ts` (the stale global `LayoutRoutes = "/"`
  from the pre-layout production build conflicted with the fresh dev
  types). Resolution: `bun run build` regenerates `.next/types` — lesson:
  rebuild before typecheck after adding/removing route segments.
- **F6 (v5 pin collisions, by design):** the settings logo preview
  initially used `h-14 w-14` + `bg-[#0d0f1a]` — both tripped v5's S1/T3
  source-sweep pins (swatch geometry + no-solid-fill). The pins were RIGHT
  to complain; the preview now uses the reference-measured `h-[56px]
  w-[56px]` with no backdrop (the reference renders its preview bare).

## 4. Ship

1. Regenerate the 18 screenshots (titles/inputs/previews changed surfaces);
   VLM spot-check the product modal + settings.
2. Docs lockstep (B5); worklog entry; `docs/session_6.md`; commit; push
   via the SSH wrapper (main only).

## 5. Out of scope (disclosed)

- Per-route og:url/canonical/twitter:url variance (SD-14 — single-page
   architecture serves one server-rendered card; the SPA's client-side
   head rewrite is invisible to crawlers).
- The reference's squashed 56×14 logo preview geometry (ours renders
  aspect-true at 56px — a disclosed refinement, SD-17).
- Numeric input types on the payment/register/cashier dialogs
   (unobservable on the reference — superset posture, SD-15).
- Everything unchanged from v6's disclosure list: in-memory limiter
  single-instance; no SMTP (mailto: stands); donut palette unobservable;
  terminal product-grid design (superset decision).
