# Session 67 — V33 (EN working log)

Continuing the audit-remediate-align-push cycle. The task brief references
`docs/session_65.md`, `docs/remediation-plan-v32.md`, `worklog.md`, and
`docs/session_66.md` — confirming V32 completed elsewhere (the fix commit
`c26f169` + the session-log commits). This session = **V33 cycle (18th
audit)**. Baseline expectation: 589 unit + 225 e2e.

Workspace reset again — fresh clone at `54af646`. The five core docs
re-read (AGENTS's 31 numbered contracts + the V32 width notes, CLAUDE, README,
PAD v2.19.0/ADR-041, SKILL v1.26.0) + the cycle docs (session_65,
remediation-plan-v32 §0–§6, the worklog V32 tail, session_66).

Environment rebuild: `.env` (DATABASE_URL="file:../db/custom.db" from
.env.example), bun install (484 packages), db:push + db:seed (the reference
mirror: 12 products / 6 categories / 2 registers / 2 sales / 2 shifts),
chromium-1243 (the reset wiped the browser cache again — the V31/V32
environment note, third occurrence).

Baseline gates: lint 0 · tsc 0 · build ✓ · 589/587 unit (44 files) ·
225/225 e2e (4.2m) — **zero flakes; the V32 F1c pixel-read watch item did
NOT recur** (the first-occurrence watch posture stands).

THE ROTATION TRIGGER: **neo-crm ADVANCED** — `013232a` → `45ae4f6`
(**session-200 — THE A11Y REGISTER'S PAGE-SURFACE COVERAGE AUDIT**, the
first movement in three cycles). Read in full: the s200 plan + session_422
+ the commit. The doctrine: (1) the register's page-surface coverage (every
renderable page surface registered at BOTH widths; their three unregistered:
/about + /contact + /reset-password — the FORM state via the shape-probe
token, the richer face); (2) the spec's own stale count-anchored claim
re-anchored to the count-proof NAME form + the negative pin pair; (3) the
WIDTH-SCOPE CENSUS — the register enumerated BY WIDTH; their phone-width
dialog family DECLINED as the standing next-round candidate (born-green
pre-verified, banked).

The standing battery: `bun audit` 1 high (the documented deepmerge-ts
decline — no drift; the zod floor standing); the citation sweep clean (25
unique @/ citations, 76 spec files); the reference (agent-browser login,
18th cycle): $0.00/0/12/0 KPIs, 390×844 viewport-locked, no hamburger —
UNCHANGED; the clone drawer spine at true 390×844: panel [0,0,288,844] ·
header [0,0,287,69] · nav [0,69,287,727] · footer [0,796,287,48] · close
[235,16,36,36] · 8 links y=81+44k · wordmark — **the 18th EXACT match to
the frozen v25 ledger; no Tailwind v4 bug, the mobile menu works as
expected** (Esc + aria reset verified live); the V27 title-guard probe
90/90 (margins 10ms/8ms); the V31/V32 cures standing (the five label
associations + the six view registrations).

THE ROUND MATERIAL: the s200 width-scope census mapped to this repo. The
register held every NAMED surface — but the authed views were registered
DESKTOP-only (the V32 decline), the public login/signup/reset surfaces were
desktop-only (the 404 was the one both-widths public registration), and the
reset-password FORM state was never scanned at any width.

THE LIVE PROBE (the born-green pre-verification discipline — which found a
live defect instead): a temporary spec drove TWELVE surfaces with the
smoke's exact axe config — eleven CLEAN, **phone /Cashiers FAILED:
`scrollable-region-focusable (serious): 1 nodes`** — the recent-shifts
table wrapper (`min-w-[720px]` overflows at 390; pure-text rows = no
focusable content; keyboard users cannot scroll the region, WCAG 2.1.1).
Invisible to every standing gate: at 1280 the table fits (the rule never
fires); the sibling tables pass via their action buttons. THE CURE
PRE-VERIFIED LIVE: tabIndex={0} + role="region" + aria-label on the
wrapper → rebuild → the violation GONE → reverted (the born-RED order).

`docs/remediation-plan-v33.md` written (the width-scope completion + the
live catch; the count ladder 589→592 unit / 225→236 e2e; the phone
dialog-open family DECLINED as the next-round candidate; the F3 stale-
comment find — the 404 test's "the phone layout is the one no other
registration covers" uniqueness claim goes stale the day the width
registrations join, caught BEFORE it goes stale). The plan validated
against the codebase (insertion points, literal titles, count sites, the
F3 comment's hard wrap — the negative pin must strip comment markers).

B2 (born-RED first): the census extension (WIDTH_REGISTRATIONS, eleven
titles, NAME form + the width order guard + the F3 negative pin) → all
three RED on the standing tree (the titles absent; the stale claim
present). En-route lesson: the negative pin's first draft (a bare
whitespace collapse) was fooled by the hard wrap — the `//` marker
survives between the words; the cure strips line-leading comment markers
BEFORE collapsing whitespace (the D-200a2 first-draft-fooled lesson
re-learned on the marker axis). The eleven registrations landed; the
order guard caught one idiom drift (the phone shell+dashboard first used
toHaveText — re-anchored to the filter+toBeVisible form). **The phone-
Cajeros registration verified born-RED at the LIVE DEFECT on the uncurd
rebuild** (`scrollable-region-focusable (serious): 1 nodes`); the other
ten born-green. The 404 comment re-anchored. THE CURE landed → the smoke
36 passed. The two probe specs deleted.

B4 (mutation proofs ×2): (a) the rendered axis — the cure strip → rebuild
→ the phone-Cajeros registration RED at exactly scrollable-region-focusable
→ restored → GREEN; (b) the register axis — the phone Reportes title
deletion → BOTH census tests RED at the exact title → restored → GREEN.

FULL GATES: **lint 0 · tsc 0 · build ✓ · 592/592 unit (44 files, 589+3) ·
236/236 e2e (4.5m, zero flakes)** — the count ladder exactly as planned.

The v33 captures (5, PNG-validated): v33-phone-cashiers-390 (the cycle's
subject — the cured surface) + v33-phone-dashboard-390 + v33-phone-login-
390 + v33-reset-form-1280 (the form state, never captured before) +
v33-mobile-drawer-open-390 (the standing mobile-nav face), via
`scripts/capture-v33-shots.ts`.

B5 (docs lockstep): README (badge 592+236 + the register description's
width completion), AGENTS (the width-scope completion note + the
SCROLL-WRAPPER IDIOM rule), CLAUDE (the v33 contracts note, newest-first),
PAD v2.20.0 (the history entry + ADR-042 + the §8 rows), SKILL v1.27.0
(the v33 close layer, the v32 layer demoted, the count sites + the §8
register state), plan §6, session_67 + session_68, the worklog V33 entry.
`.env.example` verified unchanged and tracked. The unit suite re-ran green
after every doc edit.

Commit to main; push via the SSH wrapper (`--remote
git@github.com:nordeim/retail-pos.git`). Post-push: the session-log commit
(session_69, the session_65 convention).
