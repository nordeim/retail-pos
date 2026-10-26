# VeloxPOS — Remediation Plan v4 (Session V4, 2026-10-26)

> Scope: the deep visual-parity audit of session V4. Baseline re-verified
> before audit: `main @ 6606df3`, gates green (lint · tsc · unit 213/213 ·
> build; e2e 70/70 per v3's closing run).
>
> Method: every fix lands TDD — the pin (unit source-pin or e2e
> computed-style probe) is written red first, then the fix, then the full
> gate. Evidence labels: **Verified** (executed here, live), **Reasoned**
> (inference from code/DOM), **Assumed** (documented decision).
>
> History: v1 (study app, historical), v2 (audit + parity findings),
> v3 (security/integrity/parity/hygiene execution — done, shipped in
> `d91fe91`). This v4 re-audits visual parity against the live reference
> with computed-style probes (not screenshots alone) and fixes the drift
> the audit surfaced.

## 0. Verification ledger (this session, all live on veloxposretail.base44.app vs localhost:3000)

| Check | Method | Result |
|---|---|---|
| Baseline gates | lint/tsc/vitest executed | 0 errors · 0 errors · 213/213 |
| Login + token | agent-browser localStorage token reuse | both apps reachable, logged in |
| Canvas/sidebar hex | computed styles both apps | canvas `#080a14`, sidebar `#0d0f1a`, border `#1e2235` — **parity, no action** |
| H1 / section headings / subtitle | computed styles both apps | 24px/700 slate-800; 16px/700 slate-700; 14px slate-500 — **parity, no action** (v3 pins hold) |
| Table views (ventas/inventario/cajas/cajeros) | VLM pair-comparison ×10 | layouts, colors, columns, pills match; only data-row counts differ (clone = seeded superset) — **no action** |
| Mobile nav | prior-session live check at 390×844 + v3 e2e pins | reference has NO drawer; clone drawer = functional superset — **no action** |
| Reference dead-end | live "Abrir Turno" dialog | cashier combobox empty, no create path — clone cashier CRUD = superset — **no action** |
| **Radius scale** | computed styles: ref nav/sign-in/inputs/buttons | ref `rounded-xl` = 12px, `rounded-lg` = 8px (native Tailwind v4). Clone remaps `--radius-*` one step up (xl→16px, lg→12px, md→10px, sm→2px) — **drift, V1** |
| **Nav active pill** | computed styles both | ref `bg-violet-600/20 text-violet-300 border-violet-500/30 shadow-sm shadow-violet-500/10 rounded-xl(12px)`; clone `vx-gradient text-white shadow-[0_4px_14px]` (solid gradient pill) — **drift, V2** |
| **Nav inactive** | computed styles both | ref `text-white/40 hover:text-white/80 transition-all duration-150`; clone `text-slate-400 hover:text-slate-100 transition-colors` — **drift, V3** |
| **Brand block** | computed styles + DOM both | ref chip `w-8 h-8(32px) rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow` + `lucide-zap w-4 h-4`; text `text-sm font-bold text-white/90 tracking-wide`; row `py-5 px-4`; nav `py-4 space-y-0.5 px-2`. Clone chip `h-10 w-10(40px) vx-gradient` + `Zap h-5 w-5`; text `text-base text-white`; row `p-4`; nav `p-3 gap-1` — **drift, V4** |
| **Collapse toggle** | computed styles both | ref `w-full justify-center p-2 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/5 transition-all`; clone `h-9 w-9 rounded-lg text-slate-500` — **drift, V5** |
| **Stat cards (dashboard ×4)** | DOM tree + computed styles both | ref: card `rounded-2xl p-5 relative overflow-hidden` bg `rgba(16,18,32,.9)` border `rgba(255,255,255,.07)`; gradient BLOB `absolute -top-6 -right-6 w-20 h-20 rounded-full from-X-400 to-Y-500 opacity-20`; layout `flex items-start justify-between` = [label `text-xs font-semibold text-slate-500 uppercase tracking-wider` + value `text-2xl font-bold mt-1`] left, icon chip `p-2.5 rounded-xl bg-gradient-to-br` right. Clone: `vx-card` + svg watermark + label-above + `text-3xl font-bold text-slate-100` + solid `h-11 w-11 bg-{c}-500` chip — **drift, V6** |
| **Card surface system** | computed styles ref (dashboard section card + Ventas table card) | ref cards: bg `rgba(16,18,32,.9)` + border `rgba(255,255,255,.07)` + shadow `0 8px 32px rgba(0,0,0,.5)` + 16px radius. Clone `vx-card`: solid `#0d0f1a` + solid `#1e2235` border + no shadow — **drift, V0** |
| **Reports period tabs** | computed styles both | ref container `flex gap-2 p-1 rounded-2xl` bg `rgba(28,31,52,.85)` border white/7; active `px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 shadow-lg shadow-violet-500/30`; inactive `text-white/40 hover:text-white/70`. Clone: `rounded-full` bordered solid container + `vx-gradient` active — **drift, V7b** |
| KPI value contrast | pixel sampling ref screenshot | ref renders `text-slate-800` on `rgb(16,18,32)` = **1.27:1 contrast** (VLM: "appearing almost like placeholder text"); ref's own Reports page uses `text-white font-black` for the same value type — reference bug, clone keeps readable color (**SD-1**) |
| **Reports summary cards** | DOM tree both | ref: `rounded-2xl p-5 flex items-center gap-4` icon chip LEFT `w-12 h-12 rounded-2xl` + [label `text-xs text-white/35 uppercase tracking-wider`, value `text-2xl font-black text-white`]. Clone: StatCard layout (icon right) — **drift, V7** |
| **Login card** | computed styles both | ref `rounded-2xl(16px) bg-white/95 backdrop-blur-sm shadow-2xl border-0`, page bg `to right bottom #f8fafc→#f1f5f9`; clone `rounded-3xl(24px) solid white` custom shadow, page `180deg #eef2f7→#e2e8f0` — **drift, V8** |
| **Login social buttons** | DOM + CSS both | ref `px-5 py-3.5(48px) rounded-xl(12px) border-slate-200 hover:border-slate-300 hover:shadow` + official brand SVGs (Google 4-color, MS 4-square, FB #1877F2, Apple black). Clone `px-4 py-2.5(44px) rounded-xl(16px) border-slate-300` + letter glyphs on colored circles — **drift, V8** |
| **Login inputs / submit** | computed styles both | ref inputs `h-12(48px) rounded-xl(12px) bg-slate-50/50 text-base border-slate-200`; submit `h-12(48px) rounded-xl(12px) bg-slate-900`. Clone `h-11(44px) rounded-xl(16px) bg-white text-sm border-slate-300`; submit `h-9(36px) rounded-md bg-indigo-600` — **drift, V8** |
| **Login logo** | DOM both | ref `<img>` (VeloxPOS crystal PNG) in `h-20 w-20 sm:h-24 sm:w-24 rounded-full shadow-lg ring-4 ring-white/50` + slate glow div. Clone hand-rolled cube SVG in flat `#221f45` circle — **drift, V8** (asset downloaded to `public/veloxpos-logo.png`) |
| **Primary action buttons** | CSS rule extraction | ref `.glass-button-primary`: `linear-gradient(135deg,#7c3aed,#6366f1)` + `border violet-500/45` + `0 4px 20px violet-600/40` + hover lift (`translateY(-1px)`, brighter gradient) + active `scale(.97)`. Used by "Nuevo Producto" (`px-4 py-2.5 text-sm rounded-xl` h=42px). Clone `vx-gradient` horizontal, no border/glow/lift — **drift, V9** |
| **Success action buttons** | CSS rule extraction | ref `.glass-button-success`: `linear-gradient(135deg,#059669,#10b981)` + `border emerald-500/35` + glow + hover lift. "Abrir Turno" = `px-3 py-1.5 text-sm rounded-lg` h=34px; COBRAR = `px-8 py-5 rounded-2xl w-full text-xl font-black` h=70px (disabled = `opacity-50 pointer-events-none`). Clone solid `bg-emerald-500 hover:bg-emerald-500/90` `h-12` — **drift, V9** |
| **Table icon buttons** | computed styles both | ref edit `p-2 rounded-lg(8px) text-slate-400 hover:bg-indigo-50 hover:text-indigo-600`; delete `hover:bg-red-50 hover:text-red-500`. Clone `hover:bg-white/5 hover:text-violet-300` / `hover:text-red-400` — **drift, V10** |
| **Low-stock count color** | computed styles both | ref `text-amber-600`; clone `text-amber-400` — **drift, V11** |
| Search input (inventario) | computed styles both | ref `h-9 bg-transparent text-base shadow-sm border-input rounded-xl(12px)`; clone differs in size/text/bg — **folded into V1/V12** |

Non-gaps re-verified: route casing (`/Dashboard`, `/Reports`, `/Registers`, `/Inventario` — capitalized, SPA router maps them), product modal native file input, Ajustes `glass-button` "Subir logo", status pills, table typography, VeloxPOS footer.

## 1. Design decisions (resolved)

- **SD-1 (stat value readability):** the reference's dashboard renders KPI
  values at `text-slate-800` on `rgb(16,18,32)` — 1.27:1 contrast, effectively
  invisible; its own Reports page renders the same value type as
  `text-2xl font-black text-white`. The clone matches every structural aspect
  (size `text-2xl`, weight, layout, chip, blob) but keeps a READABLE value
  color (`text-slate-100`), consistent with the reference's own readable
  instances. Documented as a superset deviation, not parity drift.
- **Superset features retained untouched:** mobile drawer + focus lifecycle,
  cashier CRUD, ticket detail expansion, sidebar user footer, register
  "Cerrar Turno" state (reference cannot reach it), VeloxPOS footer credit.
- **Cerrar Turno button** (superset-only state): gets the same glass system
  in an amber/orange ramp (`glass-button-warning`) — reasoned extension of
  the reference's own `glass-button-primary/success` pattern.
- **Reference platform chrome** ("Edit with Base44" badge) is NOT cloned —
  it is the reference's builder-platform artifact, not app UI.

## 2. Execution batches (TDD: red → green → gate)

### B1 — Radius scale + nav chrome (V1–V5)
1. **V1** `globals.css` `@theme inline`: restore Tailwind-native radius
   steps (`--radius-sm: 0.25rem; --radius-md: 0.375rem; --radius-lg: 0.5rem;
   --radius-xl: 0.75rem;` drop the `--radius` remap). Sweep every `rounded-*`
   usage in `src/` against the reference surfaces (12 files) — the audit
   showed the remap was the ROOT CAUSE of radius drift everywhere (nav,
   chips, buttons, inputs, login social row).
2. **V2** `nav-items.tsx` active: `bg-violet-600/20 text-violet-300 border
   border-violet-500/30 shadow-sm shadow-violet-500/10` (12px radius after
   V1). Kill `vx-gradient` + glow on the active pill.
3. **V3** `nav-items.tsx` inactive: `text-white/40 hover:text-white/80
   hover:bg-white/5 transition-all duration-150`.
4. **V4** `sidebar.tsx` brand: chip `h-8 w-8 rounded-xl bg-gradient-to-br
   from-violet-500 to-indigo-600 shadow` + `Zap h-4 w-4`; label `text-sm
   font-bold text-white/90 tracking-wide`; row `py-5 px-4`; nav `py-4
   space-y-0.5 px-2`.
5. **V5** collapse toggle: full-width `justify-center p-2 rounded-xl
   text-white/30 hover:text-white/70 hover:bg-white/5 transition-all`.
   Desktop sidebar contract in AGENTS.md updated to match (44px pitch stays —
   the reference's own `py-2.5` rows keep it).

### B2 — Card surfaces + stat cards + reports cards (V0, V6, V7, V7b, V11)
1. **V0** `vx-card` utility (globals.css): reference card system measured on
   section cards AND table cards (`rounded-2xl p-5` / `p-0 overflow-hidden`
   both): `background-color: rgba(16,18,32,0.9)` (translucent #101020),
   `border: 1px solid rgba(255,255,255,0.07)` (white-alpha hairline),
   `box-shadow: 0 8px 32px rgba(0,0,0,0.5)` (elevation), radius 1rem (already
   correct). One root fix — every view's cards/tables inherit it. The
   sidebar stays solid `#0d0f1a` (verified — different surface).
2. **V6** `StatCard` restructure to the reference anatomy: translucent card
   (`bg-[#101020]/90` + `border-white/[0.07]`), gradient blob per color
   (`-top-6 -right-6 w-20 h-20 rounded-full opacity-20`), `flex
   items-start justify-between` with label+value left, gradient icon chip
   right (`p-2.5 rounded-xl bg-gradient-to-br`), label `text-xs
   font-semibold text-slate-500 uppercase tracking-wider`, value
   `text-2xl font-bold mt-1` (SD-1 color). Color ramps from the live
   reference: success `from-green-400 to-emerald-500`, primary
   `from-indigo-400 to-purple-500`, info `from-blue-400 to-indigo-500`,
   warning `from-amber-400 to-orange-500`.
3. **V7** reports summary: icon-LEFT horizontal (`rounded-2xl p-5 flex
   items-center gap-4`), chip `w-12 h-12 rounded-2xl`, label `text-xs
   text-white/35`, value `text-2xl font-black text-white`.
4. **V7b** reports period tabs: container `flex gap-2 p-1 rounded-2xl` +
   `bg-[#1c1f34]/85` + `border-white/[0.07]`; active `px-4 py-2 rounded-xl
   text-xs font-bold bg-violet-600 text-white shadow-lg
   shadow-violet-500/30`; inactive `text-white/40 hover:text-white/70`.
5. **V11** low-stock count `text-amber-600` (label stays slate-400/500 per
   B2-V6).

### B3 — Button system (V9)
1. `globals.css`: add `@utility glass-button-primary` and `@utility
   glass-button-success` (extracted reference CSS, incl. hover lift + active
   scale); add `glass-button-warning` (amber ramp, superset Cerrar Turno).
2. Apply: "Nuevo Producto", "Nueva Caja" (+ dialog save), "Nuevo Cajero",
   Ajustes "Guardar Cambios", register "Abrir Turno"/"Cerrar Turno", COBRAR
   (both states, incl. `py-5 text-xl font-black` 70px geometry + disabled
   `opacity-50 pointer-events-none`).
3. `vx-gradient` stays ONLY where the reference truly uses a solid gradient
   (brand chip now diagonal; login logo badge n/a after V8).

### B4 — Login/signup parity (V8)
1. Card: `rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl` (border-0),
   padding per reference (`p-8`).
2. Page bg: `linear-gradient(to right bottom, #f8fafc, #f1f5f9)`.
3. Logo: `<img src="/veloxpos-logo.png">` in `h-24 w-24 rounded-full
   shadow-lg ring-4 ring-white/50` + slate glow div (asset already in
   `public/`).
4. Social buttons: official brand SVGs (Google/MS/FB/Apple paths extracted
   from the reference), `px-5 py-3.5 rounded-xl border-slate-200
   hover:border-slate-300 hover:shadow`.
5. Inputs: `h-12 rounded-xl bg-slate-50/50 text-base border-slate-200`.
6. Submit: `h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white`
   (reference's near-black, not indigo).
7. Signup + forgot/reset screens share `AuthShell`/`AuthInput`/
   `SocialButton` — one fix, all screens. Links: `text-slate-500
   hover:text-slate-700 font-medium`; "Sign up" link stays indigo-600
   (matches reference).
8. Search input (inventario + others): `h-9 bg-transparent text-base
   shadow-sm` with border-input (12px radius after B1).

### B5 — Ship
1. Regenerate the 18 screenshots via `scripts/capture-screenshots.ts`.
2. Docs lockstep: AGENTS.md (nav/button/stat-card contracts + radius note),
   CLAUDE.md (counts), README (no env change), PAD (v1.2.0 + ADR-014
   glass-button system + radius scale), retail-pos_SKILL.md (§15 patterns),
   `.env.example` (verify — no change expected).
3. worklog.md entry; commit; push via SSH wrapper (main only).

## 3. Test plan (pins first — red)

- **Unit (source pins, `tests/visual-parity-v4.test.ts`):** globals.css
  contains `glass-button-primary`/`glass-button-success` utilities + native
  radius steps (no `calc(var(--radius) + 4px)` remap); `nav-items.tsx`
  active/inactive contracts; `sidebar.tsx` brand/toggle contracts;
  `shared.tsx` StatCard blob+layout contract; `reports-view.tsx` icon-left
  contract; `terminal-view.tsx` COBRAR geometry; `login-surface.tsx` card/
  social/input/submit contracts + logo img; icon-button hover contracts.
- **E2e (`tests/e2e/visual-parity.spec.ts` v4 describe block):** computed
  probes — nav active pill 12px radius + translucent bg; StatCard value
  24px + blob presence; COBRAR 70px + gradient bg; login card 16px radius +
  `bg-white/95`; social button h=48px; submit `rgb(15,23,42)`.
- Full gate after each batch: `bun run lint` · `bun run typecheck` ·
  `bun run test` · `bun run build` · `bunx playwright test`.

## 4. Out of scope (disclosed)

- Reference donut chart colors: the reference dashboard renders EMPTY
  charts (no data) — segment colors are unobservable; clone palette stays.
- In-memory rate limiter single-instance (v3 disclosure, unchanged).
- No SMTP channel; image upload storage stays URL-based (v3, unchanged).
