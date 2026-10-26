# Session 11 (V9) — the alias map, the path-driven title, and the two chart skins

Baseline re-verified first: `main @ b7f0237` (the v8 close; the remote's only
delta after the v8 push was `docs/session_10.md`, the v8 session's raw
transcript), gates green (lint 0 · tsc 0 · 324→342/342 unit · build ✓ ·
105/105 e2e — wait: 342/105, the v8 close's own counts). The v8 source diff
was audited in full (clean — every v8 contract holds in code), and the
pinned surfaces re-probed live: the mobile drawer contract FULLY green
(288px panel, 8×40px links, uniform 44px pitch, scroll-lock, aria-expanded,
Escape + focus return), the ref's mobile navigation unchanged (the 220px
squeezed sidebar, no drawer), the 404 pages identical, the Ventas/
Inventory/Cashiers table CELLS class-for-class identical, the low-stock
card 1012px on both — no drift on any pinned surface.

The audit then went where no prior session had probed — the route ALIAS
space. **The rewrites accept the Spanish names (`/Ventas`, `/Inventario`,
`/Cajas`, `/Cajeros`, `/Reportes`, `/Ajustes`, `/Terminal`) but
`viewFromPath()` only mapped the English canonical paths — every Spanish
alias silently rendered the TERMINAL** (the URL stayed `/Ventas` while the
Terminal's product grid showed). `router.ts`'s own `isKnownPath` comment
claimed the aliases were accepted — a documented superset that was
half-implemented (F1, the session's headline). Alongside it, the reference's
title algorithm was pinned across nine probes: **exact-case canonical match
→ canonical title, everything else slug-cased** — the ref titles `/SALES`
"SALES | VeloxPOS" while RENDERING the Sales view (case-insensitive
routing, path-driven titles); the clone canonicalized every variant through
the view (F2). The table sweep found the ref's tables are BARE (`w-full`,
16px base — cells carry their own sizes) while the clone's carried a
table-level `text-sm` that shrank the **Ventas Total to 14px** (the ref
renders it at the inherited 16px — F3; every other cell class was already
identical). The `--foreground` token measured `#e7e9ef` on the ref vs the
clone's `#f8fafc` (F4). And the chart SVG internals — never measured
pre-v9 — revealed the reference renders **TWO chart skins**: the Dashboard
chart (light `#e2e8f0` "3 3" gridlines — prominent, `#94a3b8` 12px labels,
`salesGrad` gradient `#6366f1` 0.3→0, line w2.5) vs the Reports chart
(white/4% gridlines, white/30% 11px labels, gradient 0.35, line w2); the
clone served both pages one dashboard-ish skin with a FLAT violet area and
a `#262a36` grid (F5-F8). A dashboard VLM diff raised two more: the
"bottom-left avatar" turned out to be the **Next.js dev-tools indicator**
that had LEAKED INTO the shipped screenshots (F9 — methodology), and a
clone-invented `ShoppingBasket + "VeloxPOS"` dashboard footer the reference
does not have (F10 — initially dismissed by a flawed leaf-node DOM probe,
then scrollHeight-verified: the ref's dashboard ends at the low-stock rows).

Execution (TDD — 21 unit pins + 10 e2e pins, all red first): `SPANISH_ALIASES`
in the router (consulted by `viewFromPath`/`isKnownPath` after the canonical
case-insensitive paths), `documentTitleForPath()` went exact-case, the
shell's title effect now reads the PATH (`documentTitleForPath(window.
location.pathname)` — the `[status, view]` deps stay sufficient: SPA nav
always pairs a view change with a path change), the four ref-aligned tables
dropped their `text-sm`, the foreground family aligned to `231 233 239`,
`SalesAreaChart` gained the `variant` prop with the two measured skins (the
`salesGrad` gradient defs + per-skin gridlines/labels/line), and the
dashboard footer was removed. One v7 source pin aligned to the new title
contract (updated, not weakened); every other v7 title pin survived the
exact-case change verbatim — they were written with the ref's behavior in
mind.

Verification: **lint 0 · tsc 0 · build ✓ · 363/363 unit · 115/115 e2e**;
live parity probes on every changed surface (all six Spanish aliases render
their views with the ref's own titles; `/SALES` renders the view but titles
"SALES | VeloxPOS"; the Total at a computed 16px; the body at
rgb(231,233,239); the dashboard chart on #e2e8f0/"3 3" + 12px #94a3b8 +
url(#salesGrad); the reports chart on white/4% + 11px white/30%); **all 18
screenshots regenerated from the PRODUCTION standalone build** (:3100 — no
dev badge; `scripts/capture-screenshots-prod.sh`), VLM-verified (no footer,
no badge). Docs lockstep: AGENTS.md contracts 21-22, CLAUDE.md counts + the
v9 notes, README badge (363+115) + table row, PAD v1.7.0 + ADR-019 + §8
counts, retail-pos_SKILL.md v1.4.0 (counts + the v9 block), the plan with
F10 folded in, this log, worklog.

Known-open (disclosed): the reference's own Spanish-path 404s are NOT
replicated (the clone's aliases are the superset — SD-23); the
"Detalle por método" table's skin is unobservable on the ref (its reports
data is empty); the donut palette stays the standing disclosure. All the
standing v8 disclosures unchanged (SD-18 readable Total tone, SD-19
mailto: transport, SD-20 public 404/signup superset, SD-14 og:url/canonical,
aspect-true preview, in-memory limiter, terminal grid).
