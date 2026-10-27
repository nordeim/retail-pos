# Session 21 (V14) — the interaction-state family: dialogs, focus, reports

Baseline re-established first: the workspace had been reset, so the repo was
re-cloned to `main @ 20b68e4` (the v13 close `214e196` + the remote's
session_20 transcript); the environment rebuilt (.env with
`DATABASE_URL="file:../db/custom.db"`, bun deps, `db/custom.db` pushed +
seeded, the Playwright chromium binary reinstalled — the fresh workspace's
first e2e run failed 1ms-per-test on the missing binary). Gates green:
lint 0 · tsc 0 · build ✓ · 445/445 unit · 158/158 e2e (one first-run
failure was the documented sequential flake — green in isolation and on the
full rerun). The v13 source diff was audited in full (clean — the SalesTip,
DonutTip, hybrid anchor, persistent wrapper, cursor + activeDot contracts
all hold in code), and the reference's data state re-verified BEFORE any
new probing: UNCHANGED since v13 (KPIs $0.00/0/12, the Atún Dolores
low-stock row, the date line); the Terminal still shift-gated, the Cajas →
Abrir Turno cashier combobox still EMPTY (the reference's selling flow
remains a dead end — the standing disclosure). No seeded-data work this
cycle.

The audit then went where session_19 itself suggested — the remaining
interaction states — and caught the reference's dialog **MID-ENTER for the
first time** (60ms into its 150ms run: `transform: matrix3d(0.999649,…,
-256, -156.956,…)` + `opacity: 0.992979` — scale, translate AND fade all
in flight; the −256px tx is the −50% centering of the 512px box). Three
finding families, all measured live on BOTH apps at 1280 + 390:

**F1 the dialog motion + geometry family** (the core): the reference's
dialog content carries the FULL shadcn `tailwindcss-animate` grammar — the
clone's fade + zoom PLUS the slide quartet
`slide-in-from-left-1/2` + `slide-in-from-top-[48%]` /
`slide-out-to-left-1/2` + `slide-out-to-top-[48%]`; the reference's
OVERLAY fades (`animate-in fade-in-0` / `animate-out fade-out-0`) while
the clone's snapped (no animation classes at all); the reference's
computed animation runs **0.15s** — its own `duration-200` class is INERT
on its older stack (it only sets transition-duration there), but the
clone's Tailwind 4.3.3 threads `--tw-duration` to 200ms through
tw-animate's `--animate-in: enter var(--tw-animation-duration,
var(--tw-duration, .15s))` resolution; and the geometry is the SHARED
`max-w-lg` (512px) base with `rounded-2xl sm:rounded-lg` — 16px radius
full-bleed edge-to-edge below sm (390 × 0 × 16px measured), 8px at ≥sm —
where the clone shipped `max-w-md` + per-surface `max-w-sm`/`max-w-md`
overrides + a flat `rounded-lg` (384px wide, 3px margins, 8px radius at
390). Both of the reference's observable dialogs (Abrir Turno + the
product modal) are 512px — the uniform shared system is the contract.

**F2 the focus family**: real Tab sweeps on the reference show its
platform recolors EVERY default outline violet — `rgba(127, 98, 244, 0.5)`
measured on nav links AND icon buttons (a global base44 platform
`outline-color`; the auto/1px/2px/3px alternation is the platform
artifact, the COLOR is the stable fact). The clone's `vx-focus` chrome
utility still drew the retired indigo halo (`box-shadow: 0 0 0 2px
rgba(129, 140, 248, 0.45)` — the exact ring v11 removed from the form
controls and glass buttons), and the plain `Button` cva base carried NO
focus color at all.

**F3 the reports empty-state skins**: both the "Ingresos por método de
pago" and "Detalle por método" cards' empty state on the reference is a
measured `h-40 flex items-center justify-center text-white/25 text-sm` box
("Sin datos en este período" centered in 160px) — the clone shipped a
plain left-aligned `text-slate-400` paragraph; and all three reports card
headings carry `mb-5` (20px) where the clone's SectionCard wrapper pinned
`mb-4`.

**The sidebar collapse — session_19's suggestion — resolves MEASURED AT
PARITY, no work**: the reference's bottom chevron toggle collapses
220→68px over `0.3s cubic-bezier(0.4, 0, 0.2, 1)` (rAF-sampled both
directions on both apps), the "Mi Tienda" header span AND the link labels
are removed from the DOM when collapsed, the chevron flips left↔right —
the clone is identical (its `rotate-180` on the same chevron is visually
identical) PLUS aria-label/aria-expanded/data-testid. At 390px the
reference has NO drawer (the 68px strip persists, main squeezed to 322px)
— the clone's 288px drawer remains the established functional superset.
Also verified at parity with no work: the dialog X close button
(character-for-character classes), the select/dropdown motion family
(150ms, both apps), the reports window chips, and the login card.

Execution (TDD — 13 unit pins + 4 e2e pins, all red first): `DialogContent`
and `AlertDialogContent` adopt the complete grammar class-for-class (the
slide quartet on the content, the fade pair on the OVERLAY), `duration-200`
is REMOVED (the tw-animate `.15s` default is the measured observable),
the base goes `max-w-lg` + `rounded-2xl sm:rounded-lg`, and all 10
`DialogContent` call sites drop their width overrides (registers ×4,
cashiers ×2, terminal ×1, sales ×1, inventory delete ×1; the inventory
editor keeps only its `max-h-[90vh] overflow-y-auto` long-form affordance
— its now-redundant `max-w-lg` drops with the base); `vx-focus`'s
:focus-visible becomes `outline: 3px solid rgba(127, 98, 244, 0.5)` (the
same form V11/F2h shipped for the glass buttons) plus the one-line global
base-layer `outline-color: rgba(127, 98, 244, 0.5)` — the platform
mechanism (no double rings: the outline-none controls keep their own
deterministic rings); both reports empty states adopt the measured h-40
centered `text-white/25` box (the e2e text pin holds) and the three
reports cards pass `titleClassName="mb-5"` (the V10 per-card mechanism;
the dashboard's mb-4/mb-3 pins untouched). The dark dialog skin (the v8
pins) is unchanged everywhere.

Two e2e-authoring lessons surfaced mid-run (both hardened, neither
weakened): (1) `toBeVisible()` resolves mid-enter, and mid-flight
`zoom-in-95` scales the rect — the 512px dialog read 508/510; the fix is
settling via `el.getAnimations().map(a => a.finished)` before geometry
reads (applied to the v14 pins AND the v8 ticket-modal pin whose
boundingBox reads the new family races — its assertions unchanged); (2)
`test.use()` is illegal inside a test body — the mobile viewport switch
rides `page.setViewportSize()` (the v12 convention). One documented
sequential flake recurred (a v9 title test, green in isolation and on the
full rerun).

Verification: **lint 0 · tsc 0 · build ✓ · 458/458 unit · 162/162 e2e**
(445+13 / 158+4); evidence from the production build: the standard set
re-captured (only 2 shots changed — the cobrar dialog now 512px, the
reports empty states — everything else pixel-identical), three new
VLM-verified shots (`scripts/capture-v14-shots.sh` →
desktop-dialog-abrir-turno.png: the 512px dialog + the dimming overlay;
mobile-dialog-abrir-turno.png: the full-bleed 390px 16px-radius skin;
desktop-focus-nav-violet.png: exactly one nav link under the violet
outline) plus the reports shot spot-verified (both 160px centered boxes).
Docs lockstep: AGENTS.md contract 27, CLAUDE.md counts + the v14 block,
README badge (458+162), PAD v2.2.0 + ADR-024 + §8 counts,
retail-pos_SKILL.md v1.9.0, the plan with the full execution ledger, this
log, worklog.

Session note: this cycle spanned three conversation sessions — the audit
was interrupted twice by tool-infrastructure failures (5 consecutive Bash
failures, then 3 more) with all state preserved on disk each time; the
plan, both pin files, and the audit ledger survived verbatim and the
execution resumed from the recorded continuation point.

Known-open (disclosed): the with-data skins of the reports "Detalle por
método" table and the "Ingresos" bars (UNOBSERVABLE on the reference — no
sales in any window; the clone's rendering stands); the reference's
`bg-background` vs the clone's per-site dark skin (the v8 pins hold); the
mobile drawer's own 200ms slide (a superset surface — the reference has
NO drawer); the reference's `translate-x-[-50%]` vs the clone's
`-translate-x-1/2` (the same computed centering — the matrix3d
measurement confirms identical geometry). All standing v8–v13 disclosures
unchanged (SD-14, SD-18, SD-19, SD-20, SD-23, the in-memory limiter, the
terminal grid, the squeezed-mobile charts, the terminal card hover,
--primary/--border token hygiene).

Suggested next steps: open Cajas → Abrir Turno side by side and watch the
overlay fade + the slide quartet land (the motion is the visible win), and
Tab through the clone's sidebar to feel the violet platform outline. The
next cycle could sweep the remaining motion language (the page/view
transitions, the toast enter/exit) or run a scratch-user selling flow to
bring the reports per-method table's with-data skin into the observable
set.
