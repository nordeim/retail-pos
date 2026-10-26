# VeloxPOS — Remediation Plan v6 (Session V5→v6, 2026-10-26)

> Scope: the functional-superset completion + dialog chrome parity + document
> head suite. Baseline re-verified before audit: `main @ 67ceea8`, gates green
> (lint 0 · tsc 0 · unit 277/277 · build ✓ · e2e 83/83 — the v5 close).
>
> Method: agent-browser logged into BOTH apps side by side (reference auth
> re-established; DOM + computed-style probes; VLM pair-comparison for the
> product modal). The reference was first re-diffed against the v5 evidence
> ledger — **NO reference drift found** (shell 220/244, table contract, badge
> ramps, input radius 12px, reports H1 white/90, terminal rail 380px, COBRAR —
> all byte-identical to the v5 measurements), so every finding below is a
> clone-side gap.
>
> History: v3 (security/integrity — `d91fe91`), v4 (design system —
> `d04e6f4`), v5 (view internals — `980dfe4`). v6 sweeps what the visual
> audits could not see: **dead controls** (state exists, UI absent), **silent
> failure paths**, the **document head** (meta/favicon/OG), and the dialog
> chrome the table-level probes skipped.

## 0. Verification ledger (all live unless noted; ref = veloxposretail.base44.app vs clone = localhost:3000)

| # | Check | Method | Result |
|---|---|---|---|
| L1 | Reference drift vs v5 ledger | computed probes (shell/H1/tables/badges/inputs/rail/reports) | **unchanged** — no reference-side drift to chase |
| L2 | Reference mobile @390 | live | sidebar still `display:flex` 220px, no hamburger — clone drawer remains the superset |
| L3 | Clone mobile drawer | live, full contract | 288px panel (w-72), 8 links, 40px link + 4px gap = **44px pitch**, aria-expanded, body scroll-lock, focus into drawer, Escape closes + focus returns to hamburger — **green, no action** |
| L4 | Sidebar collapse | live both | both 220→68px, `transition all .3s`, main flush — **match** |
| L5 | Sidebar branding tile | computed both | ref tile `shadow-lg shadow-violet-500/30` → `rgba(139,92,246,.3) 0 10px 15px -3px, … 4px 6px -4px`; clone = generic black `shadow` — **drift, V2**. Store-name classes match (14px/700/white-90). Icon stroke 2.5 vs 2 (folded into V2) |
| L6 | Product modal | DOM+computed+VLM both | ref "Crear" = `glass-button-primary px-4 py-2.5` → **42px**, visible `lucide-save w-4 h-4`; ref "Cancelar" = 42px `glass-button text-slate-700`. Clone dialog buttons ride the cva `h-9` → **36px**, Cancelar missing `text-slate-700`, Crear carries a deliberately-HIDDEN `Upload` icon — **drift, V1** (product/cashier/register dialogs; the page-level CTAs are 36px on BOTH — no action) |
| L7 | Product modal fields | DOM both | ref: Nombre/Código/Categoría/Precio/Costo/Stock actual/Stock mínimo/IVA (%)/**Unidad**/Imagen/Activo. Clone: **identical field set including the Unidad select** (already wired to `unit` state → payload → API). The REAL gap: the clone's `UNITS` enum lacks the reference's **Metro** + **Caja** options (ref: Pieza/Kilogramo/Litro/Metro/Caja/Paquete; clone had Servicio as a superset extra) — **F1 (enum only)** |
| L8 | Product image input | source + live | clone `void imageFile` — the picked file is DISCARDED; `imageUrl` is wired through schema→entities→store→type but never sent. Ref stores its uploads — **no-op control, F2** |
| L9 | Settings "Subir logo" | live on ref + source on clone | ref: file input accepted + saved (no visible sidebar change — its sidebar is a gradient tile, verified). Clone: onChange stores only the FILENAME for display; `logoUrl` column exists in Prisma but is absent from `settingsSchema`, the route, and all of src/ — **no-op control, F2b** |
| L10 | Delete failures | source sweep | 4 catch blocks `void err` with no user surface: product delete (inventory-view:66), cashier delete (cashiers-view:49), register delete (registers-view:61), category delete (settings-view:105). The purpose-built zustand Toaster is mounted in the layout and **never called by any view** (only loadCollections uses it) — **silent failures, F3** |
| L11 | Ventas row actions | live both | ref rows: eye + **mail** (`prompt("Enviar ticket a:")` → base44 email API — native prompt, blocking). Clone rows: eye (works, superset dialog) + mail **with NO onClick — a dead button**, F4 |
| L12 | Ref delete confirm | live | native `confirm()` — the clone's styled Dialog is the better superset — **no action** |
| L13 | Document head | DOM both | ref: title "VeloxPOS", full description, og:* (title/desc/url/type/site_name/image=rendered logo 1200×630), twitter:* (summary_large_image), mobile-web-app-capable + apple meta, manifest link (dead 302 on their host), icon = hosted logo. Clone: title "VeloxPOS — Punto de venta", description only, **no OG/Twitter/apple/manifest/icon** — **drift, M1/M2/M3** |
| L14 | Favicon | DOM + file | clone `public/favicon.svg` is an **orphaned study-app graduation-cap mark** (never linked; the tab shows no icon). Ref tab shows its logo — **drift, M2** |
| L15 | Product dialog input fills | source | 3 controls still `bg-[#0d0f1a]` (name/barcode/file) — a v5 B3 sweep miss, AGENTS.md contract 13 violation — **drift, V4** |
| L16 | Price/cost placeholders | DOM both | ref modal inputs have NO placeholders; clone price+cost show "0.00" — **drift, V3** |
| L17 | Agregado banner (v5) | live | add → max-h 96px/op 1 → auto-collapses to 0/0 after 1.6s; line persists — **green, no action** |
| L18a | UI primitive tokens | source + live | MORE dead study-app tokens beyond v5's button.tsx H1 sweep: switch.tsx `data-[state=checked]:bg-sf-primary` (the checked toggle rendered HOLLOW — the live cause behind the VLM's "toggle OFF in clone" note), toast.tsx `sf-alert-*` (error/success toasts unstyled), badge/card/skeleton/progress/checkbox/slider all reference utilities that never existed in globals.css — **F5** |
| L18 | Test suite wiring | package.json + configs | vitest (21 files) + playwright (13 specs) wired; `.env` DATABASE_URL + db/ at root verified — **no action** |

Non-gaps re-verified (no action): page-level CTA heights (36px both); the
settings Guardar 54px (v5 pin green); ticket rail internals; table system;
Reports tone; nav active pill; auth surface; native-confirm delete (superset);
the reference's Unidad dropdown is a custom button (the clone's Select is the
equivalent control — same pattern as its Categoría select).

## 1. Design decisions (resolved)

- **SD-8 (mailto: over fake email):** the reference emails tickets via its
  platform API. The clone has no SMTP channel (disclosed since v3); a
  `mailto:` with the fully-formatted ticket body is REAL local-first
  functionality (opens the operator's mail client pre-filled) — no dead
  button, no faked send. The pure builder is unit-tested.
- **SD-9 (data-URL images):** product photos + the store logo are stored as
  data URLs in the existing `imageUrl`/`logoUrl` columns (SQLite-friendly,
  zero infrastructure). Client-side canvas resize (max 512px, JPEG .85)
  keeps them ~30–80KB; a 300KB source guard rejects pathological files with
  an inline error. Schema max raised to 600 000 chars. The reference's
  TABLE chip stays the Package icon (visual parity — its table shows no
  photos either); the image renders in the product dialog preview only.
- **SD-10 (Unidad superset):** the UNITS enum becomes the reference's six
  (Pieza, Kilogramo, Litro, Metro, Caja, Paquete) PLUS the clone's existing
  Servicio (7 total — documented superset; no data migration needed, the
  column is a free String).
- **SD-11 (title parity):** the tab title becomes exactly "VeloxPOS" and the
  description the reference's verbatim string — the head is part of the
  shipped identity (link previews, tab, PWA install). `lang="es"` stays
  (correct for the clone's Spanish content; the reference's `lang="en"` with
  Spanish UI is its own bug — not one to copy).
- **SD-12 (favicon = the logo):** the reference's tab icon IS its hosted
  logo; the clone ships the same asset via the app-router `src/app/icon.png`
  convention (auto `<link rel="icon">`). The orphaned graduation-cap
  favicon.svg is deleted. The og:image is a generated 1200×630 dark-canvas
  render of the logo (the reference's is a hosted contain-render of the
  same). The manifest is a WORKING superset (theirs 302s).
- **SD-13 (dialog buttons):** dialog submit/cancel buttons get `h-auto` so
  the call-site `px-4 py-2.5` produces the reference's 42px (the cva base
  `h-9` was winning at 36px); Cancelar gains `text-slate-700`; the Crear
  icon becomes a visible `Save` (the reference's lucide-save) — the hidden
  `Upload` remnant is removed.

## 2. Execution batches (TDD: red → green → gate)

### B1 — Unidad field (F1, L7)
1. `validation.ts`: `UNITS = ["Pieza", "Kilogramo", "Litro", "Metro", "Caja",
   "Paquete", "Servicio"]` (SD-10). The select itself is already wired —
   this batch is the enum plus a `data-testid` on the trigger for e2e.

### B2 — Product image upload (F2, L8, SD-9)
1. New `src/lib/image.ts`: `fileToDataUrl(file)` — canvas resize to max
   512×512, JPEG q0.85, rejects > 300KB sources and non-images; returns
   `{ dataUrl }` or a typed error.
2. Product dialog: on file pick → `fileToDataUrl` → `setImageUrl` (state) +
   inline preview chip (h-10 thumb + name); errors inline. Payload sends
   `imageUrl ?? undefined`.
3. `validation.ts`: `imageUrl: z.string().max(600_000).optional()`.

### B3 — Settings logo upload (F2b, L9, SD-9)
1. `settingsSchema` += `logoUrl: z.string().max(600_000).optional()` (the
   route's spread persists it automatically).
2. Settings view: file pick → `fileToDataUrl` → preview beside "Subir logo"
   + include `logoUrl` in the PATCH payload. The sidebar stays untouched
   (parity — L9).

### B4 — Error toasts for mutation failures (F3, L10)
1. `inventory-view` remove, `cashiers-view` remove, `registers-view`
   remove, `settings-view` category delete: replace `void err` with
   `toast.error(err instanceof ApiError ? err.message : "<específico>")`
   via `useToast()` — the dialog stays open, the button re-enables, the
   user SEES why.

### B5 — Ticket email (F4, L11, SD-8)
1. New `src/lib/ticket-mail.ts`: `buildTicketMailto(sale)` → pure string
   builder (subject `Ticket {n}`, body = date/cashier/method/register/
   client + item lines + subtotal/IVA/total, `\n`-joined, URI-encoded).
2. `sales-view`: the mail button gets `onClick` → fresh fetch (like
   openDetail) → `window.location.href = buildTicketMailto(fresh)`.

### B6 — Dialog chrome (V1, L6, SD-13)
1. Product/cashier/register dialogs: submit → `glass-button-primary h-auto
   rounded-xl px-4 py-2.5 text-sm font-medium` + visible `<Save
   className="h-4 w-4" />`; cancel → `glass-button h-auto rounded-xl
   border-0 px-4 py-2.5 text-sm font-medium text-slate-700`.
2. Delete-confirm dialogs: same `h-auto` treatment for consistency.

### B7 — Sidebar tile glow (V2, L5)
`sidebar/mobile-chrome` branding tile: `shadow` → `shadow-lg
shadow-violet-500/30`; icon `strokeWidth={2}` (both desktop sidebar + the
mobile drawer header + the app bar, wherever the tile repeats).

### B8 — Product dialog polish (V3 + V4, L15/L16)
1. Remove the `bg-[#0d0f1a]` fills from the 3 product-dialog controls
   (name/barcode/file) — AGENTS.md contract 13.
2. Drop the "0.00" placeholders on price/cost (the reference ships none).

### B9 — Document head (M1/M2/M3, L13/L14, SD-11/SD-12)
1. `layout.tsx` metadata: title "VeloxPOS"; the reference's description;
   `openGraph` (title/description/url/type/site_name/images=[og-image]);
   `twitter` (card summary_large_image + title/description/images);
   `appleWebApp { capable: true, statusBarStyle: "black", title: "VeloxPOS" }`;
   `manifest: "/manifest.json"`.
2. Assets: `src/app/icon.png` (the VeloxPOS logo — replaces the orphaned
   favicon.svg), `src/app/apple-icon.png`, `public/og-image.png` (1200×630
   generated), `public/manifest.json` (name/short_name VeloxPOS, icons
   192+512, theme `#080a14`, display standalone). Delete
   `public/favicon.svg` (study-app remnant).
3. Generation script persisted at `scripts/generate-head-assets.py` (PIL)
   for reproducibility.

### B10 — UI primitive token purge (F5, found during execution)
The v5 H1 sweep caught button.tsx only; the live switch probe surfaced the
rest. All now map to real tokens: switch/checkbox/slider → the measured
violet `#7f62f4` (the reference's own checked-switch fill, live-probed);
toast error/success → red-950/emerald-950 ramps; badge → bg-primary and a
tinted soft variant; card → vx-card; skeleton → animate-pulse on white/5;
progress → bg-primary. Zero `sf-` strings remain in src/ (comment wordings
included — the v5 pin lesson).

### B11 — Docs lockstep
AGENTS.md (new contracts: dialog chrome, head suite, data-URL images, toast
policy, Unidad superset); CLAUDE.md counts; README (favicon/meta notes);
PAD v1.4.0 + ADR-016 (document head + image storage); retail-pos_SKILL.md;
`.env.example` re-verified; `docs/session_5.md`; worklog.md.

## 3. Test plan (pins first — red)

- **Unit (`tests/functional-parity-v6.test.ts`):** UNITS enum contents;
  the dialog renders a unit Select bound to state (source pin); image.ts
  contract (resize/guard/error branches — mocked FileReader/canvas);
  payload includes imageUrl; settingsSchema accepts logoUrl; the four
  deletes call toast.error (source pins); buildTicketMailto output (pure);
  dialog button classes (h-auto/glass/text-slate-700/Save); sidebar tile
  shadow classes; no bg-[#0d0f1a] in the product dialog; no "0.00"
  placeholders; layout metadata (title/OG/twitter/appleWebApp/manifest);
  icon assets exist; favicon.svg gone.
- **E2e (`tests/e2e/functional-parity-v6.spec.ts`):** product dialog —
  select Unidad=Kilogramo → save → row/API reflect it; image pick (via
  setInputFiles) → data URL persisted (DB probe); delete-failure toast
  (route interception → 500 → toast visible); mail button wired (click →
  no dead button: handler asserted via the mailto: href monkeypatch);
  dialog Crear height 42px; document.title === "VeloxPOS"; icon link
  present; og:title meta present.
- **Existing pins to re-check:** visual-parity v4/v5 suites, hygiene (toast
  store), inventory/cashiers/registers CRUD specs, a11y smoke, mobile
  navigation.
- Full gate after each batch: `bun run lint` · `bun run typecheck` ·
  `bun run test` · `bun run build` · `bunx playwright test`.

## 4. Ship

1. Regenerate the 18 screenshots; VLM spot-check the changed surfaces
   (product modal, sidebar, dialogs).
2. Docs lockstep (B10); worklog entry; `docs/session_5.md`; commit; push
   via the SSH wrapper (main only).

## 5. Out of scope (disclosed)

- Real SMTP email (mailto: is the local-first channel — SD-8; the v3
  disclosure stands).
- Rendering product photos in the inventory TABLE chip (the reference's
  table shows the Package icon — parity keeps ours the same).
- The reference's native `confirm()`/`prompt()` dialogs (the clone's styled
  Dialog superset stays).
- In-memory rate limiter single-instance; donut palette unobservable;
  terminal product-grid card design (superset decision) — all unchanged
  from v5's disclosure list.
