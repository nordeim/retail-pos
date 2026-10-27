# Session 35 (V21) — the deployment-surface
# truth pass, the sixth unchanged reference,
# and the untested superset pinned

The cycle resumed mid-stream (the previous session died at the
codebase-validation step with the whole tool environment down; the
restart re-verified the workspace with isolated minimal git commands
under the standing tool-output-is-untrusted protocol: main @ `e87bd95`
clean, the V20 execution commit `5caab08` inspected file-by-file — 17
files, exactly the V20 plan's set). The V20 reference docs were read in
full (session_33, session_34, remediation-plan-v20, the worklog tail)
against the re-read core docs — AGENTS.md's 31 contracts, CLAUDE.md,
README, the PAD at v2.7.0/ADR-029, SKILL v1.14.0 — and validated
against the code: `role="alert"` present in all three recovery surfaces,
`.env`/`.env.example` at `file:../db/custom.db`, the root `db/` folder,
both test configs, all exercised.

**The baseline gates: lint 0 · tsc 0 · build ✓ · 513/513 unit · 179/179
e2e FIRST-TRY** (3.2m) — no flake occurrence this run; the F2 watch
gains a clean data point. One tool-output integrity note: an rg over
the signup surface returned mangled text (`"form" | "ln"` where the
file reads `"form" | "verify"`); a direct re-read with a narrower
pattern confirmed the file is correct — the incident is recorded, the
re-verification protocol worked.

**The audit.** agent-browser on the reference: the data state UNCHANGED
for the 6th consecutive cycle — Terminal shift-gated, both cajas
"Cerrada" (Caja 2 first), 12 products (Shampoo Pantene 400ml first,
Jabón Zote 400g, Pan Bimbo), 2 sales (V-MO6BJT7G, V-MMPNY55Z), the
same Dashboard H1 + 3× H3, Reports $0.00 + "Sin datos en este período"
on both method cards; at 390px still NO hamburger (220px sidebar,
main 170px, viewport-locked). The Tailwind v4 sweep stayed clean (95
`--color-` pins — distinct = occurrences — the trap tests 8/8, no
`duration-` class on the dialog family), and neo-crm has no commits
since 2026-10-22.

**The target: Known-Issue #6, closed for real.** The one never-actioned
PAD row ("Dockerfile/DEPLOYMENT.md inherited from the scaffold reference
the old app name in prose — pending doc refresh") turned out to be the
tip of the rot: DEPLOYMENT.md opened "ORBITAL ships as…" (a name even
older than StudyFlow), documented StudyFlow-only features that do not
exist here (/rum diagnostics, /export + /import portability, a
Settings→Profile UI), referenced a missing `smoke-test.sh` and a dead
layout-sim script, claimed "16 route handlers" (the app ships 27), and
named the `studyflow` compose service. A VeloxPOS operator deploying by
that guide would try three commands that cannot work.

**The fixes (ADR-030, TDD-first).** RED:
`tests/deployment-surfaces.test.ts` (16 source pins — raw scans where
the finding lives IN comments, live fs checks for the script refs and
the route count) failed 15/16 against the unfixed tree; one pin was
corrected against reality first (the env-var count: 5, not 6).
GREEN: Dockerfile + docker-compose rebranded (service `veloxpos`, image
`veloxpos:latest`, `${VELOXPOS_PORT:-3000}`); DEPLOYMENT.md rewritten
to the ACTUAL app (the full env contract incl. the SEED_OWNER_PASSWORD
dotenv-expansion note, the gate-ladder verification, the 27-route
count, the renamed Docker walkthrough, and the new §10 account-security
API); `package-lock.json` removed (single lockfile = bun.lock — the
npm one still carried the omni-study name). Pins flipped 16/16.

**The adjacent finding: four real routes, zero tests.** The scaffold's
account-security endpoints — change-password, change-email,
delete-account, resend-verification — are real, rate-limited,
password-verified-first routes the reference lacks entirely, but they
shipped with ZERO coverage and comments citing the scaffold's S24/S25/
S26 + ADR-022/023/024 numbers (which COLLIDE with this repo's own
ADR-022..024) and a StudyFlow model list in the delete cascade prose.
Kept as the disclosed API-only superset, comments re-cited to ADR-030,
and pinned end-to-end by the new `tests/e2e/account-security.spec.ts`
(8 behavioral tests: the 400/409 ladders, the uniform no-enumeration
200, the rotation round-trips, the delete cascade + cookie clear +
subsequent 401). The spec's own drafting caught a real hazard: the
first draft routed authenticated calls through the storageState-backed
`request` fixture — the demo owner's cookie could have ridden them and
mutated the WRONG account; every authenticated call now goes through a
fresh context + explicit cookie header (the security.spec M6 pattern).

**The evidence set.** `scripts/probe-v21-mobile-recovery.ts` (the
self-contained server-lifecycle owner) ran the full mobile-drawer
contract LIVE at 390×844 on the remediated build — **10/10 PASS** —
and captured the three v21-* shots (the drawer open, the recovery card
with the shell alive, the healed view after Reintentar).

**The gates at close: lint 0 · tsc 0 · build ✓ · 529/529 unit (37
files — 513+16) · 187/187 e2e (179+8).** The docs lockstep rode along:
README (badge 529+187, the feature row, the API row), CLAUDE (the v21
contracts note), the PAD (v2.8.0 + ADR-030 + Known-Issue #6 CLOSED),
SKILL v1.15.0, AGENTS (the repo-hygiene truth-pin line) — every count
mention bumped 513→529 / 179→187 in the same commit. Known-open
(disclosed): the F2 flake watch (one clean data point this run); the
react-dom boot floor; the reference's own broken flows (nothing to
mirror, 6th cycle); every standing v8–v20 disclosure unchanged; the
account-security routes remain UI-less by design (a future feature
cycle if the operator wants one).

Suggested next steps: none blocking. The watch items stand (the flake
family, the reference's register-card surfaces); the next cycle could
surface a UI for the account-security API or target another superset
surface — the operator's call.
