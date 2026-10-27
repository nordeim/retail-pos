# Session 25 (V16) — the pixel-diff pass, the palette discovery, and the
category order

Baseline re-established first: `git pull` acquired the remote's
session_24 transcript (the V15 execution record — the cycle closed at
`7872255`, pushed and remote-verified). The workspace survived intact
(deps, the three DBs, the Playwright chromium binary, the correct
`.env`); the baseline re-ran fully green before any probing:
**lint 0 · tsc 0 · build ✓ · 470/470 unit · 166/166 e2e**. This round
is the V16 cycle — the full-page pixel-diff pass session_23/24
suggested, plus the login-surface hover sweep and the mobile drawer
timing carry-over.

The login sweep resolved CLEAN: the reference's social buttons carry
`hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm
transition-all duration-200`, the Sign in `hover:bg-slate-800`, the
two footer links the `hover:text-slate-700` family — the clone's
classes match EXACTLY (source-verified at `login-surface.tsx:412/287`),
the geometry pins hold (54px/16px socials, 12px radius, 48px submit,
12px footer gap), and the card sections measure identical
(96/72/580px). The reference's /signup and /forgot-password direct
URLs 404 (SD-20 unchanged). The mobile drawer carry-over CLOSED with
the timing measured: the panel animates `enter 0.2s` (the
`animate-in slide-in-from-left duration-200` — the disclosed 200ms
slide), 288px wide, 8 links at the uniform 44px pitch, zero horizontal
overflow. No work on either.

The pixel-diff pass (Playwright full-page captures of both apps at
1280×800 across all 9 surfaces + the 390px mobile pair, then per-view
diff bands + VLM reads + computed-geometry verification) produced
three discoveries:

**The headline: Tailwind v4's default palette is NOT the reference's
palette.** The VLM flagged the Completada badge and the amber low-stock
count as tone-shifted; the pixel reads confirmed it, and a
browser-authoritative palette check (`scripts/palette-drift-v16.ts` —
canvas pixel reads of every v4 oklch vs its v3 hex) found 17/22
spot-checked entries beyond ±2 per channel: indigo-500 Δ56, red-500
Δ24, green-700 Δ21, violet-600 Δ24, blue-600 Δ17, indigo-600 Δ17,
emerald-500 Δ16, amber-500 Δ11. The reference renders the v3 hexes
(live-measured on its own DOM); the clone rendered the drifted oklch
values — the class-pinning idiom (v10+) had silently accepted it
(class parity ≠ color parity; green-100 happened to sit within ±1,
which masked the drift for six cycles). The fix: a `@theme` block
pinning all 61 used palette entries to their v3 hexes — one source,
every consumer inherits, with e2e v3-exactness pins reading the
literal reference values.

**The category display order.** The reference's Inventario chips AND
Ajustes categorías render `Snacks, Lácteos, Higiene Personal,
Limpieza, Alimentos, Bebidas` (DOM-measured twice) — a THIRD sequence,
distinct from both the clone's createdAt order and alphabetical. The
donut's legend renders yet another order (`Lácteos, Limpieza, Higiene,
Alimentos, Snacks` — the v10 seed's). The fix: a server-managed
`Category.sortOrder` column seeded to the chip sequence (create
computes max+1; never client-writable), the category delegate listing
by sortOrder while the donut keeps its own createdAt pin — both
reference orders now matched.

**The reference's viewport-locked scrolling (new evidence).** Its
document never scrolls — scrollTop pinned to 0 under programmatic
scroll, scrollHeight == clientHeight, no internal scroll container.
Its inventory rows 4-12, its settings sections below the fold, and its
low-stock card bottom are PERMANENTLY UNREACHABLE at 1280×800. This
explains every "height drift" the pixel-diff showed (the reference
captures cap at the viewport; the clone flows and scrolls — the
functional superset). Recorded in AGENTS.md 29 as the standing
disclosure.

Everything else the VLM flagged resolved to misreads under
computed-geometry verification (the KPI "bolder" claim — identical
fw700/24px; the reports "spacing" claim — x[244,587,929] gaps[16,16]
exact; the zap "purple vs white" claim — both white in the violet
chip; the badge "darker green" — ±1 pixel rounding) or to the standing
disclosures (the Cajeros data state, the CRUD supersets, the mobile
squeeze). One probe artifact became a tooling lesson: closing a shift
directly in the DB without resetting `register.status` leaves phantom
"Abierta" cards (the close endpoint writes both in one transaction —
the capture scripts now reset both).

Execution (TDD — 8 unit pins + 7 e2e pins, red first): the palette
block + the sortOrder mechanism; the e2e v3-exactness pins read the
literal reference values (the badge text `rgb(21,128,61)`, the amber
count `rgb(217,119,6)`, the ticket cell `rgb(79,70,229)` — and the
pill's PIXEL bytes, since the /opacity color-mix modifiers serialize
oklab even over hex-pinned vars, the v15 lesson re-confirmed).

Verification: **lint 0 · tsc 0 · build ✓ · 478/478 unit · 173/173 e2e**
(470+8 / 166+7); evidence: desktop-inventory-chips.png (the chip
sequence verified live + VLM-verified) + the full standard set
refreshed (the palette touches every surface). Docs lockstep: AGENTS.md
contract 29, CLAUDE.md counts + the v16 block, README badge, PAD
v2.4.0 + ADR-026 + §8 counts, retail-pos_SKILL.md v1.11.0, the plan
with the full execution ledger, this log, worklog.

Known-open (disclosed): the reference's own broken flows (the 403
settings save, the shift-gated terminal, the empty cashier combobox)
have no clone-side work to mirror; the reports with-data skins remain
unobservable (no sales in any window); every standing v8–v15
disclosure unchanged (SD-14, SD-18, SD-19, SD-20, SD-23, the in-memory
limiter, the terminal grid, the squeezed-mobile charts, the terminal
card hover, --primary/--border token hygiene, the drawer's 200ms
slide, the reference's dead focus-ring classes, the oklab gradient
interpolation); the reference's clipped scrolling is now recorded
(AGENTS.md 29) — nothing to mirror, the clone's scroll is the
superset.

Suggested next steps: open Inventario to see the chips in the
reference's order (Snacks lands second), and hover the Ventas rows to
feel the now-v3-exact indigo/red/blue hover tones. The next cycle
could run the Core Web Vitals performance pass (the parity families
are now pinned to the pixel), or sweep the reference's REGISTER-card
action surfaces once its shift state changes, or deepen the mobile 390
audit (the drawer's inside-view scroll behavior vs the reference's
clip).
