# Session 37 (V22) — the account-security loop
# closed end-to-end, the discarded OTP
# fixed, and the login dead-end un-dead-ended

The cycle started from a fresh clone (the sandbox had been reset):
main @ `b3439bb` clean, the locals recreated (`.env` from the example,
`db/` pushed + seeded), and one environment repair — the sandbox's
Playwright cache held a DIFFERENT chromium revision than the pinned
`@playwright/test` 1.63.0 requires, so the first e2e run failed
168/187 at browser launch (all `(1ms)` infra failures, zero code
failures); `./node_modules/.bin/playwright install chromium` fixed it
with zero code changes. The V21 reference docs were read in full
(session_35, session_36, remediation-plan-v21, the worklog tail)
against the re-read core docs — AGENTS.md's 31 contracts + the mobile
drawer contract, CLAUDE.md, README, the PAD at v2.8.0/ADR-030, SKILL
v1.15.0 — and the repo-included skills were used for the audit
(web-application §5/§12/§16 for the security and Tailwind contracts,
tailwind-patterns for the v4 rules, tdd for the RED→GREEN loop,
clone-app-pat-pro's computed-styles-over-screenshots doctrine —
already the house method).

**The baseline gates: lint 0 · tsc 0 · build ✓ · 529/529 unit ·
187/187 e2e** (3.2m, first-try once the browser matched).

**The audit (7th cycle).** agent-browser on the reference: the data
state UNCHANGED — Terminal shift-gated, both cajas "Cerrada" (Caja 2
first), 12 products (Shampoo Pantene 400ml first, Jabón Zote 400g,
Pan Bimbo), 2 sales (V-MO6BJT7G $21.46, V-MMPNY55Z $61.48), Dashboard
$0.00 + "martes 27 de octubre, 2026", Reports $0.00 + "Sin datos en
este período" on both method cards; at 390px still NO hamburger (220px
sidebar, main 170px, viewport-locked). The reference's failed-login
copy measured English ("Invalid email or password") — the mixed
convention the clone's toasts already follow. The clone's mobile
drawer re-verified LIVE at 390×844: aria-expanded cycles, scroll
locks, focus moves in, **8 links at a uniform 44px pitch**, Esc closes
+ returns focus + unlocks. neo-crm HAS moved (HEAD `6d655f9a`,
session-194, Oct 27 — the docs list sessions through 219): the newest
sessions reviewed are neo-crm-specific parity cycles (calendar grids,
tab strips, drift sweeps); no new family pattern this cycle's scope
needed beyond the standing adoptions.

**The findings.** F1: the four ADR-030 account-security routes —
tested, rate-limited, password-first — remained UI-less (the V21
session's own suggested next step). F2 (a REAL bug): the signup verify
stage DISCARDED the register response's verification code — the
no-SMTP self-hosted delivery model puts the OTP in the response body,
the route's comment even names "the verify screen's self-hosted code
note" as the delivery surface, and it did not exist: signup
verification was UI-unusable on a fresh install. F3: the login 403
told an unverified user to "check your email" that never arrives, with
no resend affordance — a dead end whose only escape (re-registering)
was undiscoverable. F4: `AppUser` lacked `emailVerified`. F5 (docs
truth): PAD Known-Issue #7 described an `ignoreBuildErrors` flag the
config no longer sets.

**The fixes (ADR-031, TDD-first).** RED:
`tests/account-ui.test.ts` (13 source pins) failed 12/13 against the
unfixed tree; `tests/e2e/account-ui.spec.ts` (9 behavioral tests)
failed at the missing surfaces. GREEN: the **Mi Cuenta** SectionCard
in Ajustes (sixth section, ShieldCheck/rose-500 at the measured 20px —
the tone the five store sections leave free; the identity readout from
/api/auth/me with the Verificada badge + member-since; the
change-password / change-email dialogs in the measured Dialog family;
the destructive delete via a plain Dialog + the NEW
`glass-button-danger` @utility — the AlertDialog primitive stays
unused, its cva defaults clobber glass fills, the F6 trap); the signup
code note (the slate-Alert family — the OTP is finally VISIBLE); and
the login 403 verify sub-card (code entry + "Resend the code" + the
delivered/neutral note + "Verify and sign in" — verify-email sets the
session cookie, so the journey completes in one round-trip).

**Three execution-time lessons the plan did not foresee:** (1) the
nested-form hydration kill — the first verify-card implementation was
a `<form>` inside the login `<form>`; React logged "In HTML, form
cannot be a descendant of form" and the inner submit silently never
fired (reproduced live on the dev server); the card is now a plain DIV
with a button-driven submit + an explicit Enter route. (2) the v5
form-control pin caught the first draft's solid input fills
(`bg-[#0d0f1a]` copied from the cashiers pattern — settings-view
inputs must stay TRANSPARENT, measured trap 13). (3) the full-suite
verify budget: the shared localhost verify-email bucket runs at
exactly 10/15min (H2's 7 + M6 1 + account-security 1 + v12 1); the
new spec's verify would have been the 11th and 429'd M6 — observed
live — so the spec isolates its verify via the H3 xff precedent
(`page.route` + `x-forwarded-for: 198.51.100.9`, the documented
hop-selection contract). The v10 Ajustes icon pin was EXTENDED (not
weakened) to the six-section superset.

**The evidence set.** Five captures under `docs/screenshots/`:
v22-mobile-drawer-open-390.png (the audit), v22-account-section.png,
v22-account-change-password-dialog.png,
v22-account-delete-dialog.png, v22-signup-code-note.png (the latter
four live on the dev server against the remediated code).

**The gates at close: lint 0 · tsc 0 · build ✓ · 542/542 unit (38
files — 529+13) · 196/196 e2e (3.5m, 187+9).** The docs lockstep rode
along: README (badge 542+196, the feature row, the API row), AGENTS
(the "account UI contract" section), CLAUDE (the v22 note + counts),
the PAD (v2.9.0 + ADR-031 + Known-Issue #7 CLOSED + the testing
table), DEPLOYMENT.md §10 (the UI-wired framing), SKILL v1.16.0 —
every count mention bumped 529→542 / 187→196 in the same commit.
Known-open (disclosed): the F2 flake watch (clean this run); the
react-dom boot floor; the reference's own broken flows (nothing to
mirror, 7th cycle); every standing v8–v21 disclosure unchanged; a
profile/name-edit UI remains future work (no route ships it).

Suggested next steps: none blocking. The watch items stand; the next
cycle could target another superset surface (the operator's call) or
another docs-truth sweep — the #7 closure shows the register still
pays dividends.
