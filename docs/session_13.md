# Session 13 (V10) — the donut family closes, the seeded data goes exact, and the tick rule lands

Baseline re-verified first: a fresh clone of `main @ ba55cdb` (the v9 close
`dd42192` + the remote's `docs/session_12.md` transcript), the workspace
rebuilt (.env, bun install, db push + seed), gates green (lint 0 · tsc 0 ·
build ✓ · 363/363 unit · 115/115 e2e) — the v9 close intact. The v9 source
diff was audited in full (clean — SPANISH_ALIASES, exact-case titles, bare
tables, the 231-233-239 foreground, CHART_SKINS, no dashboard footer all
hold in code), and the mobile drawer contract re-verified live (288px
panel, 8×40px links, 44px pitch, scroll-lock, aria-expanded, Escape +
focus return — fully green; the reference's own mobile state unchanged:
the 220px squeezed sidebar, no burger).

The audit then went where no prior session COULD go: **the reference's
category donut finally rendered with full data** (6 sectors — Lácteos 2,
Limpieza 2, Higiene Personal 2, Alimentos 3, Snacks 1, Bebidas 2), and it
measured completely — the standing v5 "donut palette unobservable"
disclosure closed. The measured spec: filled sector PATHS (recharts), the
ring innerR 50 / outerR 80 centered at (166.5, 100) inside a 333×200
responsive box, sectors COUNTERCLOCKWISE from 3 o'clock with a
TRAILING-only 4° gap (every sector starts exactly at its boundary —
[0,56], [60,116], [120,176], [300,356]), #fff 1px strokes, the palette
[#6366f1, #8b5cf6, #a78bfa, #c4b5fd, #ddd6fe, #22c55e], and a legend
capped at the FIRST 5 rows (Bebidas' green sector renders in the chart but
not the legend) stacked BELOW the chart with slate-600/slate-700 rows and
12px swatches. The clone's donut had shipped a different palette, stroked
circles at the wrong geometry, and a 6-row side-by-side legend (F1, the
headline). Alongside it: the low-stock header gap (ref 12px vs clone 16px,
F2), the Ajustes per-section header icons (Store/indigo, Palette/purple,
FileText/green, CreditCard/blue, Tag/amber at w-5 h-5 vs the clone's
uniform violet-400 18px, F3), and — once the reference's tables rendered
their full state — the SEEDED DATA audit: the products in a different page
order with the 12th row's dossier-era ASSUMED values ("Jabón Zote Barra
400g"/placeholder barcode/stock 20 vs the measured "Jabón Zote
400g"/7501025403010/19, F5), the registers ordered Caja 1-first (the ref
shows Caja 2 first, F4), the sales' relativized daysAgo dates drifting the
Ventas table away from the ref's fixed 19/04/26 22:09 + 14/03/26 01:45
(F6), the second sale's items coincidentally totaling the same $61.48 but
WRONG (2x Coca + Sabritas vs the ref's 1x Jabón Zote + 1x Papel
Higiénico, F7), and the reports chart thinning labels by even index
instead of the ref's day-step-from-start rule (30 days → 8 ticks at exact
4-day steps ending day 28; 90 → 9 at 10-day steps; 14 → every day, F8).

Execution (TDD — 16 unit pins + 12 e2e pins, all red first):
`sectorPath()` + the rewritten `DonutChart` (one geometry refinement
mid-flight: the padding is TRAILING-only, not symmetric — the first
slice's M point is literally 246.5,100), the byCategory/delegate/product
`[{createdAt asc},{id asc}]` tiebreakers (SQLite's tie order had even
flipped Higiene/Alimentos live), the staggered seed createdAt, the
SectionCard titleClassName with the low-stock mb-3, the five measured
Ajustes icons, the seed rewritten to the reference account's exact
observable state (product order, the real 12th row, Caja 2 first, the
exact datetimes, the real items — the relativized daysAgo seeding
retired), and `thinLabelIndices` on the ref's rule. Legacy pins realigned
(2 visual-parity thinning pins, 2 reports data pins now asserting the
ref's own empty-window state, SEEDED_PRODUCTS to the ref's order);
terminal-sales gained a LIVE post-sale reports assertion so the
aggregation keeps coverage through the real selling path.

Verification: **lint 0 · tsc 0 · build ✓ · 379/379 unit · 127/127 e2e**;
live parity probes on every changed surface (the donut pixel-verified a
full ring at all 8 sampled angles with the ref's color sequence; the
dashboard chart flat with 0-4 y-ticks; the low-stock card 1172px on both;
the KPIs and date line identical); all 18 screenshots regenerated from
the production build. Two VLM misreads were settled by pixel probes (the
"semi-circular gauge" claim and the "N avatar" — the latter the dev-tools
portal), and one genuine discovery documented: Tailwind v4's compiled
palette differs from v3's hex values (indigo-500 → #625fff, amber-500 →
#f99c00) — computed-color pins stay CLASS-based, the standing idiom. Docs
lockstep: AGENTS.md contract 23, CLAUDE.md counts + the v10 block, README
badge (379+127), PAD v1.8.0 + ADR-020 + §8 counts, retail-pos_SKILL.md
v1.5.0, the plan with the full execution ledger, this log, worklog.

Known-open (disclosed): the ref's "Demo Cashier" shift (Caja 2, 26/10
01:15→01:19, $0.00 — live platform activity, not design state; not
mirrored); the ref's Cajeros "0 usuarios" empty state (the clone's seeded
cashier is the documented superset); the legend's slice(0,5) cap is an
inference (the ref's internal rule unobservable); the ref's register-card
ordering rule (backend-internal — the seed order reproduces the observed
page); the donut tooltip (the ref's hover-only recharts default skin);
the S4/S5 2° boundary anomaly (a recharts float artifact — the clone
ships the clean boundary rule). All standing v8/v9 disclosures unchanged
(SD-14, SD-18, SD-19, SD-20, SD-23, the now-empty-on-both "Detalle por
método" table, in-memory limiter, terminal grid).
