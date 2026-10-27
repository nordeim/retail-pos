# Session 39 (V23) — the profile/name-edit
# superset, the account-surface family's completion

The cycle started from the refreshed workspace (a `git pull` brought
main from `e411d06` to `2feac28` — only `docs/session_38.md`, the V22
raw log, arrived; the locals were intact: `.env` with
`DATABASE_URL="file:../db/custom.db"`, `db/custom.db` + `db/e2e.db` at
the repo root, node_modules, the Playwright chromium build). The V22
reference docs were read in full (session_37, session_38,
remediation-plan-v22 with its L1–L12 ledger and execution results, the
worklog tail) against the re-read core docs — AGENTS.md's contracts +
the Tailwind v4 traps, CLAUDE.md, README, the PAD at v2.9.0/ADR-031,
SKILL v1.16.0 — and the repo-included skills were used for the audit
(web-application §5/§12/§16 for the security and Tailwind contracts,
the tdd doctrine for the RED→GREEN loop, clone-app-pat-pro's
computed-styles-over-screenshots doctrine — already the house method).

**The baseline gates: lint 0 · tsc 0 · build ✓ · 542/542 unit ·
196/196 e2e (3.5m) — first-try, zero code changes.**

**The audit (8th cycle).** agent-browser on the reference: the data
state UNCHANGED — Terminal shift-gated, both cajas "Cerrada" (Caja 2
first), 12 products (Shampoo Pantene 400ml first, chips in the
sortOrder sequence), 2 sales (V-MO6BJT7G $21.46, V-MMPNY55Z $61.48),
Dashboard "martes 27 de octubre, 2026" + $0.00 KPIs, Reports $0.00 +
"Sin datos en este período" on both method cards; at 390px still NO
hamburger (nav 219px, main 170px, viewport-locked); the sidebar bottom
is ONLY the collapse chevron and Ajustes carries exactly the five
store sections — no account surface anywhere. The clone's mobile
drawer re-verified LIVE at 390×844 (aria-expanded cycle, scroll lock,
**8 links at a uniform 44px pitch**, Esc close + focus return + unlock
— the TailwindCSS v4 mobile-menu trap is NOT present, the trap suite
green). The V22 additions were verified LIVE end-to-end with a scratch
account (register → the code note displays 470303 → the login-403
verify card → resend delivers 047530 → entering the code lands in the
app; the account then deleted via the API, the dev-DB census
re-checked); the Mi Cuenta readout verified at desktop and 390px.
neo-crm UNCHANGED since the V22 review (HEAD `facdd56` = the
session-194 log commit on `6d655f9`; the newest session docs are
neo-crm-specific parity cycles — no new family pattern needed).

**The finding (the V22 session log's own suggested next step).** F1:
the account's `fullName` renders in the Mi Cuenta readout but NOTHING
can change it — no route accepts an update, no dialog offers the edit.
The register form collects it once; the seed sets it once; an operator
who registered as "Cesar" cannot become "Cesar Martínez" without curl
or a reseed. No other real findings (the Known-Issues register clean,
the docs counts lockstep-true at 542+196, the `process.exit` dev
warning is the pinned ADR-020 boot-guard design).

**The fix (ADR-032, TDD-first).** RED: the extended
`tests/account-ui.test.ts` failed 9/21 against the unfixed tree (the
two V22 action pins grown to the four-action superset + the new
route/schema/dialog pins); the new e2e behavioral test (the name
round-trip) failed at the missing surfaces. GREEN: **`POST
/api/auth/update-profile`** in the change-email family shape —
requireUser, the per-user rate limit (`updateProfile:${user.id}`,
10/15min), `updateProfileSchema` (`z.string().trim().min(1).max(100)`),
the route-side must-differ 400, the publicUser envelope — with the
**deliberate no-password split** (fullName is a benign display field;
the store-settings-PATCH posture, not the credential-rotation posture
— cargo-cult password prompts on benign fields are not security); and
the **"Cambiar nombre" dialog** — the FOURTH Mi Cuenta action
(between the email rotation and the destructive exit), the measured
Dialog grammar, the TRANSPARENT settings-view input (trap 13)
PREFILLED with the current name, the `onChanged(name)` seam patching
the readout (the change-email precedent).

**One execution-time catch the plan did foresee but still earned its
keep:** the V21 deployment-surfaces **route-count pin failed exactly
as designed** on the first full-suite run — the filesystem hit 28
route handlers while DEPLOYMENT.md claimed 27 (the count-the-things
rule; the docs-truth update rode the same commit). One design
refinement at implementation time: requireUser's SessionUser already
carries `fullName`, so the planned extra findUnique read was dropped.

**The evidence set.** Four captures under `docs/screenshots/`:
v23-account-section.png (the four-action row),
v23-change-name-dialog.png (the prefilled dialog),
v23-name-updated-readout.png (the readout after the rotation; the
seeded name restored via the API after the shot), and
v23-mobile-drawer-open-390.png (the audit's drawer capture). The
implementation was also verified live on the dev server (the
four-button row, the prefill, the must-differ 400 "This is already
your name.", the readout + server state update through
/api/auth/me, the seeded name restored).

**The gates at close: lint 0 · tsc 0 · build ✓ · 550/550 unit (38
files — 542+8) · 197/197 e2e (3.4m, 196+1).** The docs lockstep rode
along: README (badge 550+197, the account-security feature row, the
API-table row), AGENTS (the account UI contract extended to v22+v23),
CLAUDE (the v23 contracts note + counts), the PAD (v2.10.0 + ADR-032
+ the testing table), DEPLOYMENT.md (28 route handlers + §10's
five-endpoint table + the no-password split disclosure), SKILL
v1.17.0 — every count mention bumped 542→550 / 196→197 in the same
commit. Known-open (disclosed): the F2 flake watch (clean this run);
the react-dom boot floor; the reference's own broken flows (nothing
to mirror, 8th cycle); every standing v8–v22 disclosure unchanged.

Suggested next steps: none blocking. The watch items stand; the next
cycle could target another superset surface (the operator's call —
the account family is complete now), a Known-Issues truth sweep, or
the neo-crm sessions 195–219 pattern check — the operator's call.
