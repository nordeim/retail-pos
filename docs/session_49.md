# Session 49 (V27) — raw work transcript

The workspace had been RESET (no retail-pos clone in /home/z/my-project
— reset twice this session; the second reset is itself a recorded
environment fact). Fresh `git clone https://github.com/nordeim/retail-pos.git`
— main @ `d02d793` (V26 complete + session_47 + session_48). My session
is the **V27 cycle**.

Core docs read in full: AGENTS.md (31 contracts + the Tailwind v4 traps
+ the account UI contract + the mobile drawer contract with the v25
spine-freeze paragraphs + the v26 failure-path pins), CLAUDE.md,
README.md, the PAD at v2.13.0/ADR-035, retail-pos_SKILL.md v1.20.0.
Then the V26 reference docs: session_47 (raw), session_48 (the second
raw log), remediation-plan-v26 (ledger L1–L12 + execution results),
the worklog tail.

Locals rebuilt from scratch: `.env` from `.env.example`
(`DATABASE_URL="file:../db/custom.db"`), `bun install` (488 packages),
`bun run db:push` + `bun run db:seed` (12 products / 6 categories /
2 registers / 2 sales / 2 shifts — the reference mirror).

Baseline gates, in order: lint 0 · tsc 0 · build ✓ · unit **563/563**
(41 files) · e2e — first run ALL-RED at 0-1ms per test: **the
chromium-1243 binary was absent** (the fresh sandbox), an infra miss
root-caused on the spot; `bunx playwright install chromium` → full
suite **201/201** (3.6m). Matching the V26 close exactly.

The audit (12th cycle). agent-browser loaded; dev server started
daemonized — healthy. Reference site logged in (sepnetflix2023@
outlook.com): Terminal shift-gated, Registers with Caja 2 first (both
Cerrada), 12 products (Pan Bimbo last), 2 sales (V-MO6BJT7G,
V-MMPNY55Z), Dashboard $0.00 KPIs + the flat 7-day chart + the
byCategory legend, Reports "Sin datos en este período", Ajustes =
exactly the five store sections; at 390px a pair of `aria-expanded`
buttons appeared — **investigated before concluding**: they are Radix
Select comboboxes on the Ajustes page (`role="combobox"`, the
 Personalización selects), NOT a hamburger; viewport-locked (scrollH =
clientH = 844). **Reference UNCHANGED for the 12th consecutive
cycle.**

neo-crm cross-check: `git ls-remote` → HEAD `316fbe2` — UNCHANGED
since the V25 review. No new doctrine; the cycle's target must come
from the repo's own audit.

Clone live audit on :3000 (logged in with owner@veloxpos.local /
the seed's `$Abcd1234` default — the bun `$`-expansion contract): at
390×844 the drawer opened and the SPINE was re-measured as a complete
ledger — panel [0,0,288,844] · header [0,0,287,69] · nav [0,69,287,727]
· footer [0,796,287,48] ("VeloxPOS") · close [235,16,36,36] · 8 links
at [12,y,263,40] y=81+44k — EXACTLY the frozen v25 pin. Esc close +
focus return verified. **No Tailwind v4 mobile-menu trap (12th
consecutive confirmation).**

The audit sweep that found the cycle's target — the flake
root-cause pass:
1. The citation sweep re-run (the V26 instrument): 17 test citations
   across `src/`, all resolve — clean.
2. The Known-Issues register: one live watch item — the **F2 flake
   watch** (the v9 Spanish-alias title test: 1 occurrence in V18, 1 in
   V26, always re-run green, zero code changes). The V18 hypothesis
   (the chunk-failure unmount) was FIXED in V18 — and the flake
   RECURRED in V26: the hypothesis is falsified. Mechanism
   investigation required.
3. The title chain read end-to-end: the root layout ships
   `title: "VeloxPOS"` (SSR verified via curl — `<title>VeloxPOS</
   title>` in the HTML); the shell's effect (page.tsx:271) is a BARE
   `document.title = documentTitleForPath(…)` write gated on
   `status === "ready"`; and `src/app/not-found-title.tsx` — the
   repo's own v7 fix — documents Next's client metadata manager
   re-applying the root title "between the 0-50ms marks" and ships the
   guarded-MutationObserver cure for the IDENTICAL race on the 404
   surface. The shell never got the same treatment.

The probe (`scripts/probe-v27-title-race.ts`, committed): self-contained
— spawns the standalone server on :3102 (e2e db, the pinned e2e
AUTH_SECRET), logs in via native fetch (playwright's request API
mis-parses relative URLs under Bun — ERR_INVALID_URL, fixed), and
records EVERY title write via an init script: a
`Document.prototype.title` setter patch + a MutationObserver on
`documentElement` — **diagnosed live**: `documentElement` is NULL at
init-script time (hasDocElem=false, readyState "loading"), so the
observer attaches via 1ms poll; the naive `document.head` observer
NEVER FIRES (the init-time head is a placeholder node the parser
replaces).

The probe's margin ledger (36 iterations): every boot shows the same
shape — SSR "VeloxPOS", the metadata manager re-applies "VeloxPOS"
**5–6 times** (last write as late as ~295ms post-commit), then the
shell's write lands **9–30ms after** the last one. Min margins:
natural **9ms**, fast-auth (instant /api/auth/me fulfillment)
**11ms**. Single-digit-ms margins = a load-variance flip clobbers the
shell's write permanently (a bare effect never re-fires) → the v9
title assertion reads "VeloxPOS" for its whole 10s retry window: RED,
re-run green — the flake's complete signature.

Wrote `docs/remediation-plan-v27.md` — the shell title-guard pass:
SD-112 (the guarded effect), SD-113 (the pins: e2e controlled-clobber
+ unit source pins), SD-114 (the mutation proof), SD-115 (extend only).
Batches B1–B5.

**B2 — the pins, born RED.** `tests/e2e/title-guard.spec.ts` (2
tests: the boot clobber corrected; the post-nav clobber corrected +
navigation titling intact) and `tests/title-guard.test.ts` (5 source
pins: the observer, the observe shape, the guarded write, the
disconnect, the 404 surface's standing guard). First runs: e2e test 1
RED with the flake's EXACT signature ("Expected: 'Ventas | VeloxPOS'
Received: 'VeloxPOS'", 24 retries over 10s); e2e test 2 RED on its
guard-sensitive step AND its first draft carried a test defect — the
Ventas sidebar link targets the canonical `/Sales` (title "Sales |
VeloxPOS"), not the alias; corrected to assert both the canonical nav
title and two clobber corrections. Unit: 4/5 RED (the not-found pin
passes — the 404 guard already true).

**B3 — the fix.** page.tsx's effect became the guarded observer
(apply-when-different; `new MutationObserver(apply)`; `observe(
document.head, { subtree, childList, characterData })`;
`return () => observer.disconnect()`; deps `[status, view]` kept).
Both pin layers GREEN: unit 5/5 · e2e 2/2.

**B4 — the mutation proof + full gates.** Planted the bare-write
regression (the exact root-cause shape restored) → rebuild → unit 4
RED + e2e 2 RED while the standing battery stayed green (the battery
gap demonstrated live); restored → GREEN. Full gates: **lint 0 · tsc
0 · build ✓ · 568/568 unit (42 files, 563+5) · 203/203 e2e (201+2,
3.6m, ZERO flakes)**. Four captures under docs/screenshots/
(v27-desktop-ventas-1280 — the F1 surface, its title verified live;
v27-desktop-dashboard-1280; v27-mobile-terminal-390; v27-mobile-
drawer-open-390 — the spine freeze holding), PNG-validated at the
expected dimensions. The probe re-ran post-fix: identical timeline
shapes, no write-loop.

**B5 — docs lockstep.** README (badge 568+203), AGENTS (§17 gains the
V27 guard paragraph), CLAUDE (the v27 contracts note + counts), PAD
v2.14.0 (history + **ADR-036** + §8 table + both seam lists), SKILL
v1.21.0 (the v27 close layer + the §12 **F11** lesson), the plan's §6,
this log, the worklog V27 entry. `.env.example` unchanged and
bidirectional-true.

**The V27 cycle is complete and pushed to main.**

**What this cycle delivered:**
- **Audit**: reference unchanged for the **12th consecutive cycle**
  (the mobile `aria-expanded` pair investigated and identified as
  Radix Selects, not a hamburger); the clone's mobile drawer spine
  re-measured EXACTLY matching the frozen ledger (**no Tailwind v4
  bug**, 12th confirmation); the citation sweep clean (17/17); neo-crm
  unchanged.
- **A 9-cycle flake root-caused and closed (ADR-036)**: the shell's
  bare title write raced Next's client metadata manager (probe: last
  metadata write ~295ms post-commit, shell write 9–30ms later,
  min margin 9ms); the cure is the repo's own v7 guarded-observer
  pattern ported to the shell — pinned by a controlled-clobber e2e
  pair + 5 unit source pins, **mutation-proven both directions** (the
  planted bare-write regression flipped the pins RED while the
  standing battery stayed green).
- **Gates**: lint 0 · tsc 0 · build ✓ · **568/568 unit · 203/203 e2e
  (zero flakes)**; 4 PNG-validated screenshots; full docs lockstep
  (PAD v2.14.0, SKILL v1.21.0, session_49, worklog).

**Suggested next steps**: everything is green and current — a future
cycle could re-check neo-crm's newest sessions, re-run the
citation sweep + Known-Issues pass, or target a new superset surface.
Your call.
