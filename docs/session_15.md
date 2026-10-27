# Session 15 (V11) — the chart containers, the focus grammar, and the tooltip

Baseline re-verified first: a fresh clone of `main @ ed1d5cd` (the v10 close
`1ae6aa9` + the remote's session_14 transcript), the workspace rebuilt (.env,
bun install, db push + seed, playwright chromium reinstalled after the
workspace reset), gates green (lint 0 · tsc 0 · build ✓ · 379/379 unit ·
127/127 e2e) — the v10 close intact. The v10 source diff was audited in full
(clean — sectorPath, the measured palette, the exact seed, the tiebreakers,
thinLabelIndices all hold in code), and the reference's data state
re-verified row-by-row BEFORE any new probing: UNCHANGED since v10 (the same
2 sales at 19/04/26 22:09 + 14/03/26 01:45, 12 products, $0.00/0/12/1 KPIs,
the 5-row donut legend, the Atún Dolores low-stock row, "Sin datos en este
período" reports) — no seeded-data work this cycle. The mobile drawer
contract re-verified live at 390px: fully green (288px panel, 8×40px links,
44px pitch, zero horizontal overflow, aria-expanded, scroll lock, Escape +
focus return).

The audit then went where no prior session had measured: **the chart
CONTAINERS** (prior cycles pinned chart INTERNALS — colors, dashes, gradient
stops, labels — but never the responsive box) and **the interactive focus
states** (session_13's own suggested next step). Both unlocked immediate
findings. The reference's recharts ResponsiveContainers re-wrap the viewBox
to the CONTAINER width while the chart HEIGHT stays FIXED per surface
(dashboard sales 280, reports sales 220, donut 200) and the donut's ring
radii stay FIXED (innerR 50/outerR 80, cy 100, cx = box/2, the box capped at
333). The clone's charts were aspect-locked fixed-viewBox SVGs that scaled
uniformly: at the e2e's own 1280 viewport the dashboard chart rendered
**254px tall vs the reference's 280** (unpinnable — every chart pin was an
attribute pin, immune to scale), the reports chart **424px vs 220** (nearly
double), and the donut ring **134px vs 160**; at 1024 the dashboard chart
was 184px vs 280 and the ring 93px vs 160 (F1). The focus sweep found the
clone shipping the shadcn default everywhere — ring-2 + 2px-offset indigo
halo — while the reference's app controls focus with a **1px #7f62f4 edge
(ring-1, no offset)**; --ring was indigo-400 instead of #7f62f4, the Input
base was missing text-base md:text-sm + shadow-sm, the Textarea and
SelectTrigger were 6px-radius with the halo focus, the label→control gap
was 6px (mt-1.5) instead of 4px (mt-1) at 27 call sites, the glass buttons
had no focus treatment (the reference recolors the browser outline violet),
and the auth surface focused indigo over a DARK canvas offset instead of
slate-400 over WHITE — the reference's auth routes swap --background to
white at the root (F2). The chart hover tooltip — a standing v10 disclosure
— became observable: the recharts default skin (white card, 12px radius,
10px padding, 0 4px 20px shadow), and the reference's own tooltip TEXT is
#e7e9ef-on-white (unreadable — a platform bug) (F3).

Execution (TDD — 18 unit pins + 12 e2e pins, all red first): the
`useContainerWidth` hook (a callback ref measuring at commit — before first
paint, no flash — plus a ResizeObserver with React 19's ref-cleanup return),
`SalesAreaChart` on the measured per-variant fixed heights with fixed
paddings and a flexing plot, `DonutChart` on the fixed ring with the 333-cap
box; the token realignment (--ring/--primary 127 98 244, --background
15 18 26 with the body painting the #080a14 canvas token, --border 38 42
54); the Input/Textarea/SelectTrigger/Button/Switch bases to the measured
strings; the 27 mt-1.5→mt-1 call sites; the Ajustes raw textarea adopted
the Textarea component; the AuthShell's scoped white --background (as an
RGB triplet — the first attempt used the reference's HSL form "0 0% 100%"
which rgb() parsed as BLUE, caught by the e2e); the auth inputs' slate-400
focus family + measured bases; the 3px white submit outlines; and the
ChartTooltip with the measured skin and readable dark text (the SD-18
precedent). Legacy pins realigned (the v10 donut box/M-point to the
responsive contract — the box asserts dynamically and the M point computes
from box/2; the v4 signup input heights; the v10 reports tick pins went
DATE-RELATIVE — the windows anchor to the current day and the absolute
date strings rolled over at the UTC midnight boundary mid-session, caught
live).

Verification: **lint 0 · tsc 0 · build ✓ · 397/397 unit · 139/139 e2e**;
live parity probes at 1440/1280/1024 on the changed surfaces — the
dashboard sales chart 625×280 and 454×280 EXACT (viewBox 0 0 625 280 /
0 0 454 280 matching the reference's own), the reports chart 714×220 and
970×220 EXACT (viewBox byte-identical), the donut ring 160px at every
viewport with the box re-wrapping 333/279/194 like the reference; the input
focus shadow `rgb(127, 98, 244) 0px 0px 0px 1px` byte-identical to the
reference's; two probe lessons settled mid-flight (transition-colors covers
outline-color — settle-wait ~300ms before reading a focused outline, it
fades in from currentColor; and the reference's own glass-outline
mechanism alternates auto/1px and solid/3px across focus states — a
base44 platform artifact, so the deterministic 3px solid ships with the
measured color, disclosed). All 18 screenshots regenerated from the
production build (varied sizes verified — the v10 identical-login-page
lesson). Docs lockstep: AGENTS.md contract 24, CLAUDE.md counts + the v11
block, README badge (397+139), PAD v1.9.0 + ADR-021, retail-pos_SKILL.md
v1.6.0, the plan with the full execution ledger, this log, worklog.

Known-open (disclosed): the reference's squeezed-mobile chart widths (80px
boxes at 390 — its own broken 220px-sidebar mobile; the clone's mobile is
the documented superset, the GEOMETRY rule is what replicates); the donut
tooltip's populated CONTENT on the reference (its hover layer is not
reliably triggerable headlessly — the content shape follows the recharts
default, disclosed); the terminal product-card hover (unobservable — the
reference's Terminal is shift-gated and its "Abrir Turno" dead-ends);
--primary/--border render nothing visible today (badge/progress unused,
dialogs/dropdowns carry the v8 literals — token hygiene against drift).
All standing v8/v9/v10 disclosures unchanged (SD-14, SD-18, SD-19, SD-20,
SD-23, the now-tooltip-closed v10 donut disclosure, the empty-on-both
"Detalle por método" table, in-memory limiter, terminal grid).
