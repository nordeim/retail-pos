# Session 19 (V13) — the chart hover micro-interactions

Baseline re-verified first: `git pull` to `main @ 5e7415c` (the v12 close
`0268bd8` + the remote's session_18 transcript), the workspace intact
(.env, deps, db/custom.db — no rebuild needed), gates green (lint 0 ·
tsc 0 · build ✓ · 429/429 unit · 153/153 e2e) — the v12 close intact.
The v12 source diff was audited in full (clean — the auth card chrome,
the login grammar, the English sub-screens, the platform reset page all
hold in code, pinned by their 32 unit + 14 e2e tests), and the
reference's data state re-verified BEFORE any new probing: UNCHANGED
since v12 (KPIs $0.00/0/12/1, the 5-row donut legend, the Atún Dolores
low-stock row, "martes 27 de octubre, 2026") — no seeded-data work this
cycle.

The audit then went where session_17 itself suggested: **the chart hover
micro-interactions** — and the probe unlocked them headlessly. A plain
synthetic `MouseEvent('mousemove')` on the reference's chart svg
activates its recharts tooltip + activeDot + cursor (reliable, three
probe positions), and the donut's "not reliably triggerable" tooltip
(the standing v10/v11 disclosure) yields to `mouseenter`/`mousemove`
dispatched ON THE SECTOR PATH. Five finding families, all measured:

**F1 the activeDot**: the reference renders the recharts default
`<circle r="4" fill="#6366f1" stroke-width="2" stroke="#fff">` at the
snapped point (8×8 box) — the clone rendered nothing.

**F2 the tooltip cursor**: a vertical `<path d="M342.5,5L342.5,245">`
`stroke="#ccc"` — a 1px line at the active x spanning the plot area —
the clone rendered nothing.

**F3 the tooltip content grammar**: the reference's tooltip is the
recharts DEFAULT content — the label `<p class="recharts-tooltip-label"
style="margin: 0px">` ("sáb") + the `<ul><li>` item
(`display:block; padding-top:4px; padding-bottom:4px; color:
rgb(99,102,241)`) with the spans `ventas` + `" : "` + `0` — the literal
dataKey, the default separator, the RAW value (never `$`-formatted),
inherited 16px. The label's computed color is the inherited
`rgb(231,233,239)` — #e7e9ef-on-white, INVISIBLE (the v11 disclosure,
now precisely located: the item line is readable indigo, only the label
is the platform's inheritance bug). The clone shipped a custom 2-line
card (a 600-weight label + a formatted value) at 14px.

**F4 the tooltip position + motion**: three probes pinned the hybrid
anchor — the wrapper's LEFT = the dot's x + 10 (stable across pointer
moves at the same column: dot 607 → 617, the pointer at 577 not
followed), the wrapper's TOP = the pointer's y + 10 (419→429, 309→319;
the dot's y 524 never followed). At the container's right edge the
wrapper FLIPS left (`recharts-tooltip-wrapper-left` — right edge = dot
x − 10, the mirrored gap). The wrapper carries `transition: transform
400ms` (the glide between points) and PERSISTS mounted (leave flips
`visibility`, re-enter glides from the last position). The clone
anchored centered ABOVE the point, no flip, no transition, unmounted on
leave.

**F5 the donut tooltip's own skin**: the reference's donut tooltip is
the RAW recharts default — NOT the sales chart's white card: white bg +
`border: 1px solid rgb(204,204,204)`, NO border-radius, NO box-shadow,
10px padding, the label `<p>` EMPTY, the item in BLACK `rgb(0,0,0)`:
`Lácteos : 2` (110×54 box, anchored at the sector centroid +10/+10,
flipped left, the same 400ms). The v11 measurement had been taken on
the SALES chart and its white-card skin applied to BOTH charts — the
donut needed the raw skin. The v13 e2e also verified the clone's flip
transform math exactly: translate(75.79, 77.5) = the 30° ring-midpoint
anchor − 110 − 10 on the 279-wide box.

Two disclosures RETIRED with measurements: the v12 "social-button hover
icon-transform" known-open (a real hover + a DOM scan found ZERO
`group-hover` utilities on the reference's button — the icon wrapper's
`transition-transform duration-200` is dead code there too; the
button's own hover states bg/border/shadow are at exact parity) and the
donut-tooltip disclosure (above). Verified at parity with no work: the
reports window chips (active `bg-violet-600 text-white shadow-lg
shadow-violet-500/30` exact, both apps on the 30-day window), the
dashboard chart labels (plain Y numbers + day names), the low-stock
rows (no hover on either app), the donut sectors (no hover state on the
reference — `transition: all` inert), and the reference's Terminal
still shift-gated (the product-card hover stays unobservable).

Execution (TDD — 16 unit pins + 5 e2e pins, all red first): the
SalesAreaChart's hover state became `{idx, pointerY, visible}`; the
cursor + activeDot render under the visibility gate; the new `SalesTip`
component (the white-card skin + the recharts default content with the
literal `ventas` series name + the RAW value at 16px, the readable
label as the SD-18 superset) anchors through `tipTransform` ((point.x +
10, pointer.y + 10) with the right-edge left-flip + the bottom guard),
glides on `transform 400ms`, and persists via the visibility flag;
`useSelfMeasure` (callback-ref + ResizeObserver, the
useContainerWidth pattern) feeds the flips without setState-in-effect;
the new `DonutTip` ships the raw skin (the empty label p, the black
`name : count` item, the centroid anchor, the same flip/glide); "N
productos" retired. Legacy pins realigned (not weakened): the v11 unit
`ChartTooltip` → `SalesTip`, the v11 line-chart leave pin → the
persistent-wrapper contract, the v11 donut pin → `donut-tooltip` +
"Lácteos : 2".

Verification: **lint 0 · tsc 0 · build ✓ · 445/445 unit · 158/158
e2e**; live parity probes on the production build (the tip
"sábventas : 0" with the #6366f1 item, the dot r4/#6366f1/#fff/2px, the
cursor #ccc, the donut's raw skin + black item + empty label — the
content, colors, geometry, and flip math all matching the reference's
measurements); two pixel-verified evidence shots
(`scripts/capture-hover-shots.ts` → desktop-dashboard-chart-hover.png +
desktop-donut-hover.png — the cursor a 235px gray run at column 353,
the dot 301 indigo samples, the donut border 33 #ccc pixels). Docs
lockstep: AGENTS.md contract 26, CLAUDE.md counts + the v13 block,
README badge (445+158), PAD v2.1.0 + ADR-023 + §8 counts,
retail-pos_SKILL.md v1.8.0 (+ two stale 127/127 counts corrected), the
plan with the full execution ledger, this log, worklog.

Probe lessons recorded mid-flight: (1) a 0-width SVG line and the
flat-$0 area path have EMPTY Playwright bounding boxes — assert
attachment + geometry, never toBeVisible; (2) Chromium serializes
`400ms` as `0.4s` in computed transitions; (3) e2e hovers must GATE on
the data (the area path / the legend row) before the mouse.move — a
move on the empty-payload chart never activates a point; (4) the
reference's PIE tooltip activates only via mouseenter/mousemove ON THE
SECTOR PATH; (5) Playwright's `waitFor()` defaults to "visible" —
degenerate shapes need `{state: "attached"}`.

Known-open (disclosed): the tooltip label's readable #1e293b (the
SD-18 family — the reference's own inherited #e7e9ef is invisible on
white); the reports chart's tooltip content (unobservable on the
reference — no data in any window; the recharts default shape + the
literal `ventas` name ride); the reference's empty
`recharts-tooltip-item-unit` span (renders nothing — not replicated);
the Terminal product-card hover (the reference is still shift-gated).
All standing v8/v9/v10/v11/v12 disclosures unchanged (SD-14, SD-18,
SD-19, SD-20, SD-23, the "Detalle por método" table, the in-memory
limiter, the terminal grid, the squeezed-mobile charts, the terminal
card hover, --primary/--border token hygiene).

Suggested next steps: hover the Dashboard chart and the donut on both
apps side by side — the glide + the flip are the visible wins. The next
cycle could sweep the remaining interaction states (the sidebar's
collapse animation, the dialog open/close transitions, the focus rings
in motion) or revisit the reports page's per-method table with live
sale data (a scratch-user selling flow inside the window).
