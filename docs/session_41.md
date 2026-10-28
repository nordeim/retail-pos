# Session 41 (V24) — the gate-coverage
# truth pass

The cycle started from the refreshed workspace (a `git pull` brought
main from `96b1021` to `9afdcb8` — only `docs/session_40.md`, the V23
raw log, arrived; the locals were intact: `.env` with
`DATABASE_URL="file:../db/custom.db"`, `db/custom.db` + `db/e2e.db` at
the repo root, node_modules, the Playwright chromium build). The V23
reference docs were read in full (session_39, session_40,
remediation-plan-v23 with its L1–L12 ledger and execution results, the
worklog tail) against the re-read core docs — AGENTS.md's contracts +
the Tailwind v4 traps + the account UI contract, CLAUDE.md, README,
the PAD at v2.10.0/ADR-032, SKILL v1.17.0 — and the repo-included
skills were used for the audit (web-application §5/§12 for the
security/Tailwind contracts, nextjs16-tailwind4 §9 for the mobile-nav
failure taxonomy, the tdd doctrine for the RED→GREEN loop,
clone-app-pat-pro's computed-styles doctrine, agent-browser for the
live walks).

**The baseline gates: lint 0 · tsc 0 · build ✓ · 550/550 unit ·
196→197/197 e2e (3.5m) — first-try, zero code changes.**

**The audit (9th cycle).** agent-browser on the reference: the data
state UNCHANGED — Terminal shift-gated, both cajas "Cerrada" (Caja 2
first), 12 products, 2 sales (V-MO6BJT7G, V-MMPNY55Z), Dashboard
"martes 27 de octubre, 2026" + $0.00 KPIs, Reports $0.00 + "Sin datos
en este período" on both method cards; at 390px still NO hamburger
(nav 219px, main 170px, viewport-locked); Ajustes carries exactly the
five store sections — no account surface anywhere. The clone's mobile
drawer re-verified LIVE at 390×844 (aria-expanded cycle, scroll lock,
**8 links at a uniform 44px pitch**, Esc close + focus return + unlock
— the TailwindCSS v4 mobile-menu trap is NOT present, the trap suite
green — the 9th consecutive confirmation). The V23 additions verified
LIVE (the Mi Cuenta four-action row, the prefilled "Cambiar nombre"
dialog). neo-crm ADVANCED by one material commit since the V23 review
(`facdd56` → `9ff0d37`, session-195: "THE 404 GATE-COVERAGE PINS") —
its doctrine ADOPTED as this cycle's headline: **a shipped behavioral
claim that a doc or a consumer leans on, but that no standing
assertion pins, is a latent regression.**

**The findings (five, all in the gate-coverage family).** F1: the
true-HTTP-404 contract carries no status pin — both 404 e2e tests
reach the surface via `page.goto()`, which tolerates any status
(live-verified: `/NonExistent` genuinely returns 404 today). F2: the
public 404 surface (the one PUBLIC app surface, live-verified no login
bounce) sits outside the a11y smoke's register at both widths. F3:
the Playwright webServer child env spreads `...process.env` without
pinning the auth-behavior knobs — a stray `RESET_INAPP_DELIVERY=1`
parent-shell export flips the C1 production-posture spec (the
flip mechanism demonstrated LIVE: a manual standalone boot with the
stray export hands out the one-shot reset token in the production
response body), and a stray `AUTH_PROXY_HOPS=1` breaks the H3
verify-bucket isolation. F4: the `/api/health` body contract — three
documented consumers (the webServer boot poll, the Docker healthcheck,
the README verify-setup instruction) and ZERO assertions. F5 (found by
the RED run itself): the e2e AUTH_SECRET was 62-hex under the S22
comment's "64-hex" claim.

**The fixes (TDD-first, ADR-033).** RED: the new
`tests/e2e-harness.test.ts` failed 3/6 against the unfixed tree (the
two knob pins + the hex-shape pin — the RED run itself surfacing F5).
GREEN: `RESET_INAPP_DELIVERY: ""` + `AUTH_PROXY_HOPS: "0"` pinned
after the webServer's env spread (the neo-crm N-69a cure) + a genuine
64-hex AUTH_SECRET. Born-green freeze pins (the disclosed battery-gap
form): the status line pinned inside navigation's existing 404 test
(`page.request.get` — `page.goto` tolerates any status); the 404
registered in the a11y smoke at BOTH widths (the logged-out
anon-surface form); `/api/health`'s body pinned by its own spec
(`tests/e2e/health.spec.ts`); and the harness's own contract (the
isolated e2e.db, NODE_ENV=production, the pinned seed identity)
frozen by the same e2e-harness file. The determinism proven BOTH
ways: the flip demo above, and the pin-wins proof —
`RESET_INAPP_DELIVERY=1 AUTH_PROXY_HOPS=1 bunx playwright test
tests/e2e/security.spec.ts` stays 6/6 green.

**The evidence set.** Four captures under `docs/screenshots/`
(v24-404-desktop.png, v24-404-mobile-390.png, v24-health-json.png,
v24-mobile-drawer-open-390.png), all VLM-verified for correct
rendering.

**The gates at close: lint 0 · tsc 0 · build ✓ · 556/556 unit (39
files — 550+6) · 199/199 e2e (3.5m, 197+2).** The docs lockstep rode
along: README (badge 556+199 + the testing table), AGENTS (the
test-suite rules gain the shell-state-proof + gate-coverage doctrine
lines), CLAUDE (the v24 contracts note + counts), the PAD (v2.11.0 +
ADR-033 + the §8 testing table), SKILL v1.18.0 (the §12 F8 lesson) —
every count mention bumped 550→556 / 197→199 in the same commit.

Suggested next steps: none blocking. The watch items stand; the next
cycle could re-check neo-crm's sessions (the doctrine export now
flows BOTH ways), run another Known-Issues truth sweep, or target
another superset surface — the operator's call.
