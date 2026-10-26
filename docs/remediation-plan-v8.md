# VeloxPOS — Remediation Plan v8 (Session V7→v8, 2026-10-26)

> Scope: the deep-link return-to round-trip (`from_url`), the ticket-detail
> modal's measured layout, the mail action's recipient prompt, the Ajustes
> hex inputs, and the dialog-family chrome the v6 ledger never measured.
> Baseline re-verified before audit: `main @ 4d1ac4c`, gates green
> (lint 0 · tsc 0 · unit 324/324 · build ✓ · e2e 98/98 — the v7 close; the
> remote's only delta after the v7 push was `docs/session_8.md`, the v7
> session's raw log).

> Method: source audit of the v7 diff (all clean — the v7 contracts hold) +
> a fresh agent-browser sweep of BOTH apps focused on the surfaces no prior
> session had probed: the authenticated-visit and logged-out behaviors of
> the auth pages, the Ventas ticket-detail modal, the mail action's real
> interaction, and the Ajustes color controls. Every pinned surface from
> v4-v7 was re-probed for drift — **unchanged** (shell 220/244, vx-card
> rgba(16,18,32,.9), tile glow rgba(139,92,246,.3), mobile drawer full
> contract green live, reports 30-day default, static charts, inventory and
> sales search filtering, product modal, head suite).

> History: v3 security/integrity (`d91fe91`), v4 design system (`d04e6f4`),
> v5 view internals (`980dfe4`), v6 functional superset + head (`aeea5d5`),
> v7 titles + data lifecycle (`8b251eb`).

## 0. Verification ledger (all live unless noted; ref = veloxposretail.base44.app vs clone = localhost:3000)

| # | Check | Method | Result |
|---|---|---|---|
| L1 | Reference drift vs v7 ledger (shell/card/tile/modal/switch/head/drawer) | computed probes both apps | **unchanged** — no drift on any pinned surface; the clone's drawer contract re-verified live (288px panel, 8×40px links, uniform 44px pitch, scroll-lock, aria-expanded, Escape + focus return to the hamburger) |
| L2 | `/login` while AUTHENTICATED | live, both apps | both render the login form (no redirect); after a valid submit both land on `/` — **match, no action** |
| L3 | Logged-out deep route (app views) | live, ref: localStorage cleared | ref: `/Dashboard` → **`/login?from_url=https%3A%2F%2F…%2FDashboard`** → after login lands BACK on `/Dashboard` (title "Dashboard \| VeloxPOS"); 404 routes gate the same way (`/foo-bar-baz` → login?from_url=…). Clone: `window.location.replace("/login")` — no param; post-login always lands `/` — **gap, F1** |
| L4 | Logged-out `/signup` | live, ref | ref REDIRECTS to `/login?from_url=…/signup` (signup needs a platform session — a base44 artifact); the clone's signup is public (self-hosted auth) — **superset, keep (SD-20)** |
| L5 | Reference auth storage | live, ref | ref keeps `token` + `base44_access_token` in **localStorage** (XSS-exfiltratable); the clone's httpOnly cookie is strictly stronger — **keep (superset posture, informational)** |
| L6 | Ventas ticket-detail modal (eye action) | live + DOM both | ref: meta block is a **2×2 grid** (`grid grid-cols-2 gap-3 text-sm`, stacked label/value cells — label `text-slate-500`, value `font-medium`), items `"{qty}x {name}"` plain span + `font-medium` price over a **`border-slate-100`** divider, totals over **`border-slate-200`** with `text-slate-500` rows and a **`text-lg font-bold`** Total, title icon **lucide-receipt `text-indigo-500`**, **NO footer Close button** (X only). Clone: vertical flex meta list (slate-400 labels), `{qty} × {name}` with a bold qty, `#1e2235` dividers, slate-400 totals rows, `text-base` Total, `ReceiptText text-violet-400`, an extra outline Close footer button — **drift, F2** |
| L7 | The Total row's color | computed + VLM ×2, ref | ref renders the Total at **slate-800 rgb(30,41,59) on a #0f121a modal** — contrast ≈1.4:1; the VLM misread the amount in the full-shot pass and called it "darker/muted" in the 2× crop. Replicating it ships an unreadable total — **refinement, SD-18** (match 18px/bold, keep a readable color) |
| L8 | Ventas mail action | live, ref (prompt + XHR instrumented) | ref: **`window.prompt("Enviar ticket a:")`** → on an address, `POST …/integration-endpoints/Core/SendEmail` (platform SMTP); cancel = no-op. Clone: direct `mailto:?subject=&body=` — **no recipient, no prompt** — **drift, F3** |
| L9 | Ajustes Personalización | DOM both | ref: each color = `type=color` swatch (`w-10 h-10 rounded-lg cursor-pointer`) **paired with an editable hex Input** (`h-9 w-full … rounded-xl bg-transparent`, same value), wrapper `grid grid-cols-1 md:grid-cols-2 gap-4`, row `flex items-center gap-3 mt-1`. Clone: swatch + a **static span**, wrapper `sm:grid-cols-2`, row `mt-1.5` — **drift, F4** |
| L10 | Dialog-family chrome (never measured pre-v8) | computed, ref (product + ticket modals) | ref dialogs: bg **rgb(15,18,26) = #0f121a**, border #262a36 ✓, text **rgb(231,233,239) ≈ #e7e9ef**. Clone (all 10 DialogContent sites): bg `#12141f`, text `slate-100` — **drift, F5** (no existing pin asserts the old values; the v5 #12141f prohibitions are scoped to MethodPill/search-inputs/swatch — no conflict) |
| L11 | Reports default window | live both | both default **30 días** active — **match** (no action) |
| L12 | Dashboard chart interactivity | DOM, ref | no cursor-pointers/tooltips — static SVGs like the clone's — **match** |
| L13 | Inventory + Ventas search filtering | live both ("Coca" / "Cesar") | both filter live by name/cashier — **match** |
| L14 | Terminal chips/search on ref | live, ref | UNOBSERVABLE — the ref terminal is shift-dead ("No hay turno activo"; no cashier create path); the clone's search + chips remain the documented superset |

## 1. Design decisions (resolved)

- **SD-18 (Total color):** the reference's ticket-modal Total is `text-lg
  font-bold` — but at slate-800 on a #0f121a surface it is functionally
  invisible (VLM-verified). The clone matches the measured SIZE + WEIGHT
  (18px/700) and keeps a readable light color (`text-slate-100`), the same
  disclosed-refinement posture as v7's aspect-true logo preview (SD-17).
- **SD-19 (mail transport):** the prompt interaction is replicated exactly
  (`window.prompt("Enviar ticket a:")`, cancel = no-op) and the resulting
  `mailto:` carries the entered address as the recipient. The transport
  stays the operator's mail client — no SMTP channel exists in a
  self-hosted deploy (standing disclosure since v3, refined by v8: the
  recipient is now asked for, like the reference).
- **SD-20 (auth-gate scope):** the from_url round-trip is implemented for
  APP routes (the 401 gate in `page.tsx`). The reference's extra gates —
  login-before-404 and login-before-signup — are base44 platform artifacts
  that would REMOVE function from the clone (a public 404 and a public
  signup are superset behaviors); disclosed, not replicated.
- **SD-21 (from_url shape):** the 401 gate carries the FULL current URL
  (`encodeURIComponent(window.location.pathname + window.location.search)`)
  and `safeReturnTo(raw, origin)` accepts both same-origin absolute URLs
  and relative paths — foreign origins, protocol-relative URLs, and
  `javascript:` schemes fail closed to `/` (open-redirect guard); `/login`
  itself maps to `/` (no login loops).
- **SD-22 (dialog chrome):** the measured `bg-[#0f121a] text-[#e7e9ef]`
  replaces `bg-[#12141f] text-slate-100` at all 10 DialogContent sites
  (per-site classes stay — the house "sizing rides call-site utilities"
  pattern; no existing pin asserts the old values).

## 2. Execution batches (TDD: red → green → gate)

### B1 — The from_url deep-link round-trip (F1/L3, SD-21)
1. `src/lib/router.ts`: `safeReturnTo(raw: string | null | undefined,
   origin: string): string` — pure, unit-pinned (same-origin absolute →
   pathname+search; relative path → itself; foreign/protocol-relative/
   non-http → "/"; "/login*" → "/"; empty → "/").
2. `src/app/page.tsx` 401 branch: `window.location.replace("/login?from_url="
   + encodeURIComponent(pathname + search))`.
3. `src/components/auth/login-surface.tsx` submitLogin: on success read
   `from_url` from `window.location.search` → `safeReturnTo` → replace.

### B2 — The ticket-detail modal rework (F2/L6-L7, SD-18) + dialog chrome (F5/L10, SD-22)
1. `sales-view.tsx` SaleDetailDialog: meta block → `grid grid-cols-2 gap-3
   text-sm` with stacked `dt.text-slate-500` + `dd.font-medium` cells
   (Fecha/Cajero row 1, Método/Caja row 2, Cliente conditional cell);
   items → `space-y-2 border-t border-slate-100 pt-3` with
   `flex justify-between text-sm` rows, plain `{qty}x {name}` span +
   `font-medium` price; totals → `space-y-1 border-t border-slate-200 pt-3
   text-sm` with `text-slate-500` rows + `text-lg font-bold` readable
   Total; title icon → `Receipt` `text-indigo-500`; the footer Close
   button is REMOVED (the X + Escape + overlay close remain).
2. All 10 `DialogContent` sites: `bg-[#12141f] text-slate-100` →
   `bg-[#0f121a] text-[#e7e9ef]`.

### B3 — The mail recipient prompt (F3/L8, SD-19)
1. `src/lib/ticket-mail.ts`: `buildTicketMailto(sale, to?)` — the entered
   address rides the recipient slot (`mailto:<to>?subject=&body=`).
2. `sales-view.tsx` sendByEmail: `window.prompt("Enviar ticket a:")`;
   null/empty → no-op; otherwise the addressed mailto:.

### B4 — The Ajustes hex inputs (F4/L9)
1. `settings-view.tsx` Personalización: wrapper → `grid grid-cols-1
   md:grid-cols-2 gap-4`; each row → `flex items-center gap-3 mt-1` with
   the swatch + a shadcn `<Input>` bound to the same form field
   (`settings-primary-hex` / `settings-secondary-hex`); the swatch falls
   back to `#000000` while the typed hex is mid-edit (browser-native); the
   PATCH's `hexColor` regex stays the server-side gate (400 + toast on
   invalid, the existing error path).

### B5 — Docs lockstep (D1)
1. AGENTS.md: new contracts (the from_url round-trip + safeReturnTo; the
   ticket-modal layout; the mail prompt; the hex inputs; the dialog
   chrome tokens). CLAUDE.md counts; README badge if counts move.
2. PAD v1.6.0 + ADR-018 (the v8 contract set); retail-pos_SKILL.md v1.3.0
   (counts + the v8 block); `docs/session_9.md`; worklog; this plan.

## 3. Test plan (pins first — red)

- **Unit (`tests/functional-parity-v8.test.ts`):** `safeReturnTo` matrix —
  same-origin absolute URL → pathname; relative path; relative with search;
  foreign origin → "/"; `//evil.com` → "/"; `javascript:alert(1)` → "/";
  "/login" → "/"; "/login?x" → "/"; "" / null → "/". `buildTicketMailto`
  with and without a recipient. Source pins: page.tsx 401 carries
  from_url; login-surface reads it through safeReturnTo; sales-view modal
  carries `grid grid-cols-2 gap-3`, `border-slate-100`, `border-slate-200`,
  `{item.qty}x {item.name}`, `text-lg font-bold`, `Receipt` +
  `text-indigo-500`, NO footer Close button, the "Enviar ticket a:" prompt;
  every view's DialogContent carries `bg-[#0f121a] text-[#e7e9ef]` (sweep);
  settings-view carries the hex Input bindings.
- **E2e (`tests/e2e/functional-parity-v8.spec.ts`):** logged-out deep-link
  round-trip (goto /Reports → URL `/login?from_url=…` → login → lands on
  /Reports with its title); open-redirect guard (from_url=https://evil.example
  → lands on "/"); ticket-modal geometry (meta cells 2×2 — Fecha/Cajero
  share a row, Método/Caja the next; the line reads "1x "; the Total row
  is 18px/700; no footer Close button; the X renders); the mail prompt
  (Playwright dialog event with the exact message; cancel leaves the page
  untouched); the settings hex input drives the swatch; one dialog's
  computed bg === rgb(15, 18, 26).
- **Existing pins to re-check:** functional-parity-v6 (B2 image preview +
  the 42px buttons), functional-parity-v7 (titles, image clear, spinners),
  visual-parity v4/v5, hygiene, mobile-navigation, a11y smoke.
- Full gate after each batch: `bun run lint` · `bun run typecheck` ·
  `bun run build` · `bun run test` · `bunx playwright test`.

### 3a. Execution findings (mid-stream, folded into the batches)

- **F6 (the dialog-vs-dropdown chrome split — found mid-sweep):** the
  F5 sweep initially applied the measured dialog bg (#0f121a) to the
  `SelectContent` dropdown panels too. A follow-up probe of the
  reference's OPEN dropdown measured its panels at **#161922** — a
  THIRD surface. The 5 SelectContent sites now ride
  `bg-[#161922] text-[#e7e9ef]`; the 10 DialogContent sites keep
  `bg-[#0f121a]`.
- **F7 (three legacy pins were asserting pre-v8 contracts — updated,
  not weakened):** terminal-sales' `"3 × Coca-Cola 600ml"` → the new
  measured `"3x …"` format; v6's B5 mail pin (fetch-on-click) now arms
  `page.once("dialog")` + accepts the recipient prompt — the prompt
  BLOCKS a Playwright click until handled concurrently; v6's B9
  `toHaveTitle("VeloxPOS")` on /Dashboard was a LATENT RACE against the
  v7 title effect (it only passed when the first poll preceded the
  effect — it failed on a warm-server isolated run) and is retired in
  favor of the v7 spec's per-route title pins (B9 keeps the static head
  metas, which are deterministic).
- **F8 (the X button's accessible name is "Close"):** shadcn's
  DialogClose carries an sr-only "Close" span, so "no footer Close
  button" cannot pin by role name alone — the e2e pin asserts exactly
  ONE Close-named button AND that it is ≤20px wide (the 16px X icon,
  not a text footer).

## 4. Ship

1. Regenerate the 18 screenshots (ventas + ajustes + a dialog surface
   changed); VLM spot-check the ticket modal + ajustes.
2. Docs lockstep (B5); worklog entry; `docs/session_9.md`; commit; push
   via the SSH wrapper (main only).

## 5. Out of scope (disclosed)

- The reference's login-before-404 and login-before-signup gates (SD-20 —
  base44 platform artifacts; the clone's public 404/signup are superset
  behaviors).
- The reference's localStorage token storage (L5 — the clone's httpOnly
  cookie is strictly stronger; keep).
- The reference's near-invisible Total color (SD-18 — readable refinement).
- Server-side SMTP (SD-19 — mailto: remains the transport).
- Everything unchanged from v7's disclosure list: per-route og:url/canonical
  variance (SD-14); aspect-true 56px logo preview; text+inputMode on the
  unobservable dialogs; in-memory limiter; donut palette; terminal grid.
