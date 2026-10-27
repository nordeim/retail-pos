# Session 33 (V20) — the F1 announcement, the fifth
# unchanged reference, and the flake data point

The cycle opened with the workspace INTACT for the first time in three
cycles (no reset): `git pull` fast-forwarded `0c3f951 → 3229f95` (the
only delta: `docs/session_32.md`, the raw V19 session log pushed from
outside), clean tree, V17–V19 history verified with isolated minimal
git commands under the standing tool-output-is-untrusted protocol. The
V19 reference files were read in full (session_31's audit-clean
record, session_32's raw log, remediation-plan-v19's L1–L12 ledger,
the worklog tail) against the re-read core docs — AGENTS.md's 31
contracts, CLAUDE.md, README, the PAD (history v2.0.0→v2.6.0, ADR-028,
and one stale fact found: the title line still read v2.0.0),
retail-pos_SKILL.md v1.13.0 — then validated against the code: the
lazy registry + epoch-keyed boundary + silent prefetch in page.tsx,
the flex-gap drawer with its focus latch, and the pure chunk-recovery
seam all in exact contract shape. The `.env` DATABASE_URL
(`file:../db/custom.db`), the root `db/` folder, and both test configs
verified present and exercised.

**The baseline gates.** lint 0 · tsc 0 · build ✓ · unit 509/509 ·
e2e **179/179 on re-run** — the FIRST e2e run failed one spec
(`functional-parity-v7 M1: the tab title follows SPA view switches`);
the isolated re-run passed 8/8 (M1 in 1.1s) and the full re-run went
green, on a tree byte-identical to the V19 close that had measured
179/179 twice. Root-caused as a load-timing fluke (the suite runs
`retries: 0`, one worker, 10s expect windows under a 3.4m full load),
NOT the original V18/F2 shape — recorded as the watch's newest data
point, not speculatively patched (two-strike discipline: one
unreproduced occurrence buys documentation, not a diff).

**The audit.** agent-browser on the reference: the data state
UNCHANGED for the 5th consecutive cycle — Terminal shift-gated, both
cajas "Cerrada" (Caja 2 first), 12 products, 2 sales, the same
Dashboard headings, Reports at $0.00 + "Sin datos en este período"
(one false alarm en route: the compact accessibility snapshot hides
static text — the innerText read settled it), and at 390px still NO
hamburger (220px sidebar squeezing main to 170px, viewport-locked).
The Tailwind v4 sweep stayed clean (95 `--color-` pins, the trap
tests 8/8, no `duration-` on the dialog family), and neo-crm — the
tech-stack pattern reference — has no commits since 2026-10-22, so
the V18/V19 pattern reviews still cover it.

**The one code change (the prior cycle's suggested target, actioned
TDD-first).** F1: the three recovery cards carried no `role="alert"` —
a screen-reader user never HEARD that a view failed. RED:
`tests/recovery-a11y.test.ts` (4 source pins in the tailwind-traps
idiom — role presence ×3 + the `<main>`-keeps-its-landmark guard)
failed 3/4 against the unfixed tree, and the v18 SHELL SURVIVAL e2e
failed exactly at its new `toHaveAttribute("role", "alert")` line
against the pre-fix build. GREEN: one attribute per surface — the
view card div in page.tsx, the inner card div in error.tsx, the card
div in global-error.tsx — LANDMARK-SAFE placement throughout (the
role never rides `<main>`; one role per element, `role="alert"` on
main would delete the main landmark). The pins flipped 4/4 and the
v18 spec 4/4. A disclosed superset on two axes: the reference ships
no recovery surface at all, and neo-crm's own cards carry no role —
the divergence is deliberate (ADR-029), justified by the
production-ready-superset mandate and the WCAG 2.2 AA baseline.

**The evidence set.** `scripts/probe-v20-mobile-recovery.ts` (the
self-contained server-lifecycle owner this sandbox requires) ran the
full mobile-drawer contract LIVE at 390×844 — **10/10 PASS** (login +
app bar; 288×844 panel with the aria-expanded cycle; 8 links at a
uniform 44.0px pitch; scroll lock + focus in; Esc close with focus
returned; backdrop close; drawer route navigation; zero horizontal
overflow on all 8 routes; the recovery card with the shell alive;
Reintentar healing in place) — and captured the three v20-* shots
(`v20-mobile-drawer-open-390.png`, `v20-view-recovery-card-390.png`,
`v20-view-recovery-healed-390.png`), re-run on the REMEDIATED build
so the evidence reflects the shipped code.

**The gates at close: lint 0 · tsc 0 · build ✓ · 513/513 unit (36
files — 509+4) · 179/179 e2e.** The docs lockstep rode along: AGENTS
§31, the CLAUDE v20 contracts note, the README badge/feature/table
rows, the PAD (v2.7.0 + ADR-029 + the stale-title fix), SKILL v1.14.0
— every count mention bumped 509→513 in the same commit. Known-open
(disclosed): the F2 flake watch (one new data point); the react-dom
boot floor; the reference's own broken flows (nothing to mirror, 5th
cycle); every standing v8–v19 disclosure unchanged.

Suggested next steps: none blocking. The watch items stand (the
reference's register-card surfaces, the flake family); if the flake
recurs, the `retain-on-failure` trace is the next diagnostic step.
