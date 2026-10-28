# Session 46 (V26) — the failure-path truth pass: the
# health DEGRADED branch + the boot-guard wiring, both
# pinned, the stale citation swept

The cycle started from a RESET workspace (the sandbox had wiped the
retail-pos clone — `git clone https://github.com/nordeim/retail-pos.git`
re-materialized main @ `554b094`; the locals were rebuilt from scratch:
`bun install` (488 packages), `.env` from `.env.example` with
`DATABASE_URL="file:../db/custom.db"`, `bun run db:push` + `db:seed`
(the 12-product / 6-category / 2-register / 2-sale reference mirror),
the Playwright chromium build). The V25 reference docs were read in
full (session_44, session_45, remediation-plan-v25 with its L1–L12
ledger and execution results, the worklog tail) against the re-read
core docs — AGENTS.md's 31 contracts + the Tailwind v4 traps + the
account UI contract + the mobile drawer contract with the v25
spine-freeze paragraphs, CLAUDE.md, README, the PAD at v2.12.0/ADR-034,
SKILL v1.19.0 — and the repo-included skills were used for the audit
(web-application's review dimensions, the tdd doctrine for the
RED→GREEN loop, agent-browser for the live walks; `skills/` stayed
excluded from every check/compile run per the standing instruction).

**The baseline gates: lint 0 · tsc 0 · build ✓ · 556/556 unit ·
201/201 e2e (3.6m) — first-try on the fresh clone, zero code
changes.**

**The audit (11th cycle).** agent-browser on the reference: the data
state UNCHANGED — Terminal shift-gated ("No hay turno activo"), both
cajas present with Caja 2 first, 12 products, 2 sales (V-MO6BJT7G,
V-MMPNY55Z), Dashboard $0.00 KPIs, Reports "Sin datos en este
período"; at 390px still NO hamburger (viewport-locked,
scrollH = clientH = 844); Ajustes carries exactly the five store
sections (the full text read: Información del Negocio /
Personalización / Ticket Recibo / Proveedor de Pagos con Tarjeta /
Categorías de Producto). The clone's mobile drawer re-verified LIVE
at 390×844: the drawer-open spine RE-MEASURED as a complete ledger
and matching the frozen v25 pin EXACTLY (panel [0,0,288,844] ·
header [0,0,287,69] · nav [0,69,287,727] · footer [0,796,287,48] ·
close [235,16,36,36] · 8 links at [12,y,263,40] y=81+44k); Esc
closes + returns focus to the hamburger — the TailwindCSS v4
mobile-menu trap is NOT present (the 11th consecutive confirmation;
`tests/tailwind-traps.test.ts` green in the baseline). neo-crm
UNCHANGED at `316fbe2` (session-196 — the doctrine V25 already
adopted; no new material to import). With no rotation trigger, the
cycle's target came from the repo's own audit sweep — and the sweep
found two findings in the ADR-033 gate-coverage family, both on the
FAILURE side of shipped contracts.

**The findings (two, both failure-path gaps — the ADR-033 doctrine
continued).** F1: the health endpoint's DEGRADED branch (catch → 503 +
`{status:"degraded",db:"down",app:"veloxpos"}`) carries ZERO standing
assertions — a known-open disclosure held since V24 on the belief that
pinning it required breaking the DB mid-suite. But that objection only
binds the E2E layer: at the unit layer `vi.mock("@/lib/db")` is hoisted
above the import, the PrismaClient is never constructed, and the probe
rejects deterministically (feasibility prototyped 2/2, then deleted).
The consumer that leans on the branch: docker-compose.yml's healthcheck
`fetch(…).then(r => process.exit(r.ok ? 0 : 1))` — a regression to
200-with-degraded-body would report a broken-DB container as HEALTHY
with every standing gate green. F2: the boot-guard WIRING
(`src/instrumentation.ts`'s register(): fatal → console.error +
process.exit(1) — the validated fail-fast) carries ZERO assertions
while the file's own comment claims "pinned by
tests/e2e/s22-boot-guard.spec.ts" — a spec deleted in the V1 pivot
(`0b78972`, the study-layer archive) and never replaced: **the claim
was FALSE today.** The repo-wide citation sweep (rg every `tests/**`
citation across `src/` — 16 found, each existence-checked: 15 resolve,
1 stale) is the audit instrument this cycle adds. The pure seam
(`authSecretBootStatus` — env-check.test.ts) was always pinned; the
wiring that turns "fatal" into an actual exit was not — a regression
swapping exit(1) for a plain throw (the comment's own documented
defect shape: "A plain throw is CAUGHT by Next and leaves a degraded
500-everything server") would flip the production fail-fast posture
with every gate green.

**The cures (SD-108/109/110/111 — the plan validated against the
codebase before execution).** `docs/remediation-plan-v26.md` written
with the L1–L12 verification ledger and the B1–B5 batches, then
executed TDD-style. B2 — the pins: `tests/health-route.test.ts`
(2 tests: both branches' status + exact body, the e2e contract
mirrored at the unit layer + the 503 the Docker healthcheck leans on)
and `tests/boot-guard-wiring.test.ts` (5 tests: both fatal shapes →
console.error + process.exit(1) SPIED with mockImplementation — never
a real exit, a live exit(1) would kill the vitest worker; both warn
shapes → console.warn, NO exit; ok → silent; env saved/restored around
every case) + the stale citation comment re-pointed at the real pin
(comment-only — verified no existing pin scans that file). Born-green
after one TYPE round: `process.env.NODE_ENV` is readonly in
@types/node, the record-shaped view
(`process.env as Record<string, string | undefined>`) is the standard
escape — the RED run earning its keep on the typecheck gate this
cycle. 7/7 green.

**B3 — the mutation proofs (the V25 discipline extended to the unit
layer).** (a) The planted 503→200 defect in the route's catch branch
(the Docker-healthcheck-blindness shape) went RED exactly at the
status assertion — `AssertionError: expected 200 to be 503` — while
the standing e2e health spec (the 200-branch pin) would stay green:
the battery gap by construction; restored → 2/2 GREEN. (b) The planted
exit→throw defect in `register()` (the comment's own documented
regression) went RED at BOTH fatal-path tests (2 failed) while the
warn/ok tests stayed green AND the standing env-check pins (the pure
seam classification) stay green under the mutation — the battery gap
demonstrated live; restored → 5/5 GREEN.

**B4 — the evidence set + the full gates.** Four v26 captures under
docs/screenshots/ (v26-desktop-dashboard-1280.png, 
v26-mobile-drawer-open-390.png — the spine freeze holding,
v26-desktop-health-json.png — the F1 surface, the live health body,
v26-desktop-ajustes-mi-cuenta-1280.png — the F2 surface's adjacent
shipped superset), all VLM-verified (the drawer capture 5/5; the
health body read back EXACTLY `{status:"ok",db:"up",app:"veloxpos"}`).
Full gates: lint 0 · tsc 0 · build ✓ · **563/563 unit (41 files,
556+7)** · **201/201 e2e** — the first full-suite run hit ONE flake
(the v9 Spanish-alias title test, the known F2-flake-watch family),
re-run green alone (11/11), then the full suite re-run 201/201 (3.7m);
zero code changes were involved in the flake.

**B5 — docs lockstep.** README (badge 563+201 + the testing table),
AGENTS (the security contract gains the failure-path pins paragraph),
CLAUDE (the v26 contracts note + counts), PAD v2.13.0 (the history
entry + ADR-035 + the §8 testing table + the unit-seams list), SKILL
v1.20.0 (the v26 close layer + counts + the §12 F10 lesson: a "pinned
by" comment is a claim — verify the pin exists; the companion lesson:
an environment-breaking failure is only unpinnable at the layer that
owns the environment), the plan's §6 execution results, this session
log, the worklog V26 entry. `.env.example` verified bidirectional-true
by the install/db/login round-trip (L12).

**The V26 cycle is complete and pushed to main** (the commit hash in
the git log; the push via `docs/ssh_git_wrapper_v3.py` per
`docs/how-to-git-push-using-ssh-wrapper_SKILL.md`, main only, no new
branches).

**What this cycle delivered:**

- **Audit**: the reference unchanged for the 11th consecutive cycle
  (desktop + 390px mobile); the clone's mobile drawer re-verified live
  with the spine EXACTLY matching the frozen ledger (**no Tailwind v4
  bug**, 11th confirmation); neo-crm unchanged; the citation sweep
  (16 refs, 1 stale) executed as a new recurring audit instrument.
- **Two pinned contracts (ADR-035)**: the health DEGRADED branch (503 +
  the degraded body — the Docker healthcheck's consumer) and the
  boot-guard wiring (fatal → error + exit(1); warn → warn, no exit; ok
  → silent), with the stale s22 citation swept from
  `src/instrumentation.ts`. Both MUTATION-PROVEN — the planted
  503→200 and exit→throw defects went RED at the exact assertions
  while the standing battery stayed green (the gap demonstrated).
- **Gates**: lint 0 · tsc 0 · build ✓ · **563/563 unit · 201/201 e2e**;
  4 VLM-verified screenshots; full docs lockstep (PAD v2.13.0, SKILL
  v1.20.0, session_46, worklog).

**Suggested next steps**: everything is green and current — a future
cycle could re-check neo-crm's newest sessions, run another
citation-sweep + Known-Issues pass, or target a new superset surface.
Your call.
