# VeloxPOS — Remediation Plan v23 (Session V22→v23, 2026-10-28)

> Scope: **surface the profile/name-edit UI — the last account field with
> no route and no surface.** The V23 audit found the reference UNCHANGED
> for the 8th consecutive cycle (nothing new to mirror), the baseline
> gates green exactly as V22 closed them (542/542 unit · 196/196 e2e),
> and the V22 additions verified LIVE end-to-end this cycle (the signup
> code note → the login-403 verify card → the resend → the verify
> journey into the app, plus the Mi Cuenta readout at desktop and
> 390px). The cycle's target is the V22 session log's own suggested next
> step: the account's `fullName` renders in the Mi Cuenta readout but
> nothing can change it — no route accepts an update, no dialog offers
> the edit. This cycle ships `POST /api/auth/update-profile` + the
> "Cambiar nombre" dialog, completing the account-surface family.

## 0. Verification ledger (all live unless noted; clone :3000 dev / :3100 e2e vs reference)

| # | Item | Method | Result | Verdict |
|---|------|--------|--------|---------|
| L1 | Workspace state | `git pull` on the existing workspace (e411d06 → 2feac28: only `docs/session_38.md` — the V22 raw log — arrived); `git log`/`git status` inspected | main @ `2feac28`, clean tree; the locals intact (`.env` with `DATABASE_URL="file:../db/custom.db"`, `db/custom.db` + `db/e2e.db` at the repo root, `node_modules`, the Playwright chromium build); `.env.example` present and matching | baseline current |
| L2 | V22 reference docs | full read: session_37, session_38 (the raw V22 log), remediation-plan-v22 (ledger + execution results), the worklog tail; core docs re-read (AGENTS 31 contracts + the Tailwind v4 traps, CLAUDE, README, PAD v2.9.0 / ADR-031, SKILL v1.16.0) | V22 closed the account-security loop end-to-end (Mi Cuenta UI + the discarded-OTP fix + the login-403 dead-end); the docs stay lockstep-true at 542+196 | aligned |
| L3 | Baseline gates | lint → tsc → build → unit → e2e (in that order) | 0 · 0 · ✓ · 542/542 (38 files) · **196/196** (3.5m, first-try) | all green |
| L4 | Reference data state | agent-browser on the logged-in reference (Terminal / Registers / Inventory / Sales / Dashboard / Reports / StoreSettings) | Terminal shift-gated ("No hay turno activo"), both cajas "Cerrada" (Caja 2 first), 12 products (Shampoo Pantene 400ml first, chips in the sortOrder sequence), 2 sales (V-MO6BJT7G $21.46 @ 19/04/26 22:09, V-MMPNY55Z $61.48 @ 14/03/26 01:45), Dashboard "martes 27 de octubre, 2026" + $0.00 KPIs, Reports $0.00 + "Sin datos en este período" on both method cards — identical to the V17–V22 records | unchanged — nothing new to mirror (8th cycle) |
| L5 | Reference mobile @390 | agent-browser `set viewport 390 844` on /Dashboard | NO hamburger (nav 219px measured, main squeezed to 170px, scrollH=clientH — viewport-locked) — identical to V16–V22 (8th consecutive cycle) | standing disclosure (the clone's drawer is the superset) |
| L6 | Reference account surface | sidebar-bottom innerHTML + Ajustes h3 census | the sidebar bottom is ONLY the collapse chevron; Ajustes carries exactly the five store sections (Información del Negocio, Personalización, Ticket/Recibo, Proveedor de Pagos, Categorías) — no account/user/profile surface anywhere | pure superset territory |
| L7 | Clone mobile live probe | agent-browser on the dev server @390×844 | the drawer contract holds live: `aria-expanded` cycles, body scroll locks (`overflow: hidden`), **8 links at a uniform 44px pitch** (y-deltas 81→125→169→213→257→301→345→389), Esc closes + returns focus to the hamburger (`Abrir menú de navegación`) + unlocks scroll — **the TailwindCSS v4 mobile-menu trap (space-y margin children) is NOT present**; `tests/tailwind-traps.test.ts` green in L3 | superset verified |
| L8 | The V22 additions, live | agent-browser on the dev server: the Mi Cuenta readout (desktop + 390px — email/`Verificada`/name/member-since + the three action buttons, the section card 358px wide at 390); the F2/F3 journey with a scratch account (register → the code note shows 470303 → /login → the 403 card renders + "Resend the code" delivers 047530 → entering the code lands in the app at "/"); the scratch account deleted via the API + the dev-DB user census re-checked | every V22 surface functions live; the scratch account cleaned up (only the seeded owner + the prior sessions' probe accounts remain — local gitignored dev artifacts, not repo state) | V22 verified end-to-end |
| L9 | neo-crm pattern cross-check | `git ls-remote` + a shallow clone at depth 12 + the newest session-doc reads | HEAD `facdd56` = the session-194 log commit ON TOP of `6d655f9` — exactly where the V22 review left it; the docs' newest sessions (through session_411) are neo-crm-specific parity/audit cycles (walks, VLM batteries, drift gates) — no NEW family pattern this cycle's scope needs beyond the standing adoptions (TDD-first remediation, mobile focus contracts, computed-styles doctrine) | pattern parity holds |
| L10 | The profile/name-edit gap | full read: the auth route family (`change-email` as the family's exemplar — requireUser → per-user rate limit → Zod parse → guards → ONE write → `publicUser` envelope), `src/lib/validation.ts` (the account schemas), `publicUser`, the signup form's "Full name" field, the Mi Cuenta readout | `fullName` is set ONCE (register: `z.string().max(100).optional().default("")` — the seed or the signup form) and rendered ONCE (the Mi Cuenta readout's `me.name` line); NO route accepts an update and NO UI offers the edit — the V22 session log's own "future work" note | the cycle's target (F1) |
| L11 | The house dialog grammar | `<form` / `onSubmit` census across `src/components/views/*.tsx` + the cashiers delete-dialog read | the view dialogs are uniformly BUTTON-DRIVEN (zero `<form>` in any view dialog; the auth pages own the only forms) — the V22 dialogs match the house pattern; the name dialog follows the same grammar | design anchored |
| L12 | Rate-limit budgets for the new spec | the account-ui.spec journey read + the limiter constants | the new e2e test adds ONE successful login (successful sign-ins RESET the limiter — the documented model) and ZERO register/verify/resend calls; the per-USER `updateProfile` bucket is fresh territory | safe to add the spec |

## 1. Findings

- **F1 (the headline) — the account's `fullName` is read-only everywhere.**
  The register form collects "Full name", the seed sets it, the API
  exposes it (`publicUser().name`), and the V22 Mi Cuenta readout
  displays it — but no route accepts an update and no UI offers the
  edit. An operator who registered as "Cesar" cannot become "Cesar
  Martínez" without curl or a reseed. The V22 session log names it:
  "a profile/name-edit UI remains future work (no route ships it)" —
  this is that cycle. Pure superset: the reference has no account
  surface at all (L6), so there is nothing to mirror and no parity
  risk — the new surface rides the already-shipped measured families
  (the SectionCard, the Dialog grammar, the glass buttons).

- **No other real findings.** The baseline is green exactly as V22
  closed it (L3); the reference is unchanged for the 8th consecutive
  cycle (L4/L5/L6); the V22 additions verified live end-to-end (L8);
  the mobile drawer contract holds live at 390px with the Tailwind v4
  trap suite green (L7); the Known-Issues register is clean (every
  closed row properly struck, every open row disclosed); the docs
  counts are lockstep-true at 542+196; `skills/` excluded from all
  checking/compilation per the standing instruction; the
  vitest/playwright configs verified live by the green runs; the
  `process.exit` dev warning is the pinned ADR-020 boot-guard design
  (not a defect).

## 2. Design decisions (resolved)

- **SD-93 — the route: `POST /api/auth/update-profile`, body
  `{ fullName }`.** The family's exact shape (the `change-email`
  exemplar): `requireUser()` → per-user rate limit
  (`updateProfile:${user.id}`, 10/15min — the account-family posture)
  → `parseWith(updateProfileSchema, …)` → the route-side guard → ONE
  `db.user.update` → `{ ok: true, name, user: publicUser(updated) }`.
  The response mirrors change-email's `{ok, email, user}` shape so the
  dialog's `onChanged` seam is uniform.

- **SD-94 — NO password proof on this route.** The three ADR-030
  routes are password-first because they rotate credentials or destroy
  the account; `fullName` is a benign display field with zero
  auth-bearing semantics — the posture that matches is the store
  SETTINGS PATCH (session-gated, no password, rate-limited), not the
  credential family. Requiring a password to fix a typo would be
  cargo-cult security; the session cookie IS the proof of identity
  here. Disclosed as a deliberate family split.

- **SD-95 — the validation: `fullName: z.string().trim().min(1).max(100)`
  + the route-side must-differ guard.** Trim-then-validate (a
  whitespace-only name is empty); min 1 / max 100 matches the register
  schema's ceiling. Posting the current name (server state, not a body
  field) → 400 "This is already your name." — the change-email
  must-differ precedent, and the e2e negative branch.

- **SD-96 — the dialog: "Cambiar nombre" in the measured family.** A
  FOURTH action button in the Mi Cuenta row (inserted between "Cambiar
  correo" and "Eliminar cuenta" — the destructive exit stays last),
  the measured Dialog grammar (max-w-lg, `rounded-2xl sm:rounded-lg`,
  the 42px glass-button footer, key-remount reset, NO `duration-`
  class), the transparent settings-view input (measured trap 13 — the
  v22 pin that caught the first draft), Spanish chrome with the
  route's English errors passing through the inline alert (the
  reference's own mixed convention, L11 of the v22 ledger), the input
  PREFILLED with the current name, and `onChanged(name)` patching the
  readout's `me.name` (the change-email `onChanged(email)` seam).
  data-testids: `account-change-name-button`, `change-name-dialog`,
  `name-input`, `change-name-submit`, `change-name-error`,
  `change-name-success`.

- **SD-97 — the pins EXTEND, never weaken.** The V22 unit pin
  "offers the three actions in Spanish (password, email, delete)"
  grows to the four-action superset ("Cambiar nombre" joins the
  expectation); the wiring pin adds `/api/auth/update-profile`. New
  pins: the route file's family shape (requireUser + the per-user rate
  limit + the must-differ guard + `publicUser` envelope) and the
  validation schema's trim/min/max. The v10 Ajustes icon pin is
  untouched (the section count stays six — no new SECTION, just a
  fourth button in the existing one).

## 3. Execution batches

### B1 — the audit (DONE)

- L1–L12 above. Reference 8th cycle unchanged; baseline green; the
  mobile contract live-verified (trap-free); the V22 surfaces
  live-verified; the profile gap scoped with file:line evidence.

### B2 — TDD RED: the pins (written FIRST, expected to fail)

- `tests/account-ui.test.ts` (EXTENDED — a new describe block, plus
  the two V22 pins grown to the superset):
  1. The route file EXISTS and carries the family shape:
     `src/app/api/auth/update-profile/route.ts` raw scan —
     `requireUser`, `updateProfile:${user.id}` rate-limit key, the
     must-differ 400, `publicUser`.
  2. `updateProfileSchema` exists in validation.ts with
     trim/min(1)/max(100).
  3. settings-view renders "Cambiar nombre" + wires
     `/api/auth/update-profile` + the `onChanged` name seam.
  4. The V22 "three actions" pin grows to FOUR (the superset
     extension).
  5. The V22 route-wiring pin adds `/api/auth/update-profile`.
- `tests/e2e/account-ui.spec.ts` (EXTENDED — one behavioral test in
  the F1 describe, riding the existing beforeEach login):
  1. **The name round-trip**: open "Cambiar nombre" → the dialog is
     prefilled with the current name → post the SAME name → the 400
     surfaces in the dialog → post a NEW name → the success note →
     the readout updates → a fresh `/api/auth/me` reflects the new
     name (the server state moved; storageState-free API context —
     the account-security spec's discipline).
- Both layers expected RED against the unfixed tree.

### B3 — TDD GREEN: the implementation

- `src/lib/validation.ts`: `updateProfileSchema` (SD-95).
- `src/app/api/auth/update-profile/route.ts`: the SD-93/94 route.
- `src/components/views/settings-view.tsx`: the "Cambiar nombre"
  button + `ChangeNameDialog` (SD-96), `onChanged` patching `me.name`.
- Re-run B2's pins → green; `bun run typecheck` after each file.

### B4 — the V23 evidence set + the full gates

- Fresh captures under `docs/screenshots/`:
  `v23-mobile-drawer-open-390.png` (the cycle's audit capture),
  `v23-account-section.png` (the four-action row),
  `v23-change-name-dialog.png`, `v23-name-updated-readout.png`.
- Full gates: lint → typecheck → build → `bun run test` (expect
  542+~6 = ~548) → `bun run test:e2e` (expect 196+1 = 197).

### B5 — docs lockstep → commit + push

- README: the account-security feature row gains the name edit; the
  badge counts bump.
- AGENTS.md: the account UI contract note extends (the fourth action).
- CLAUDE.md: the v23 contracts note + counts.
- PAD: v2.10.0 history entry + **ADR-032** (the profile/name-edit
  superset + the no-password family split rationale) + the §10
  account-security prose + the testing counts.
- DEPLOYMENT.md §10: `update-profile` joins the account-security
  table.
- retail-pos_SKILL.md: v1.17.0 + counts.
- This plan (§6 filled); `docs/session_39.md` (the session log);
  `worklog.md` (the V23 entry). Every count mention (542→548,
  196→197 — final numbers recorded at close) bumps in the same commit.
- Commit to main; SSH-wrapper push (no new branches).

## 4. Test plan

- The unit source pins mechanically pin the route's family shape and
  the view's wiring — the same idiom as account-ui/tailwind-traps.
- The behavioral e2e proves the user-visible contract end-to-end
  against the production build: the prefill, the must-differ 400, the
  happy path, the readout update, and the SERVER state moved (the
  fresh-context `/api/auth/me` assertion).
- The rate budget is safe (L12): one successful login (limiter
  reset), zero register/verify/resend spend, a fresh per-user bucket.
- Full suite re-runs as the regression proof (B4).

## 5. Out of scope (disclosed)

- A full profile page (avatar upload, phone, address fields) — the
  domain has none of those fields; `fullName` is the entire profile
  surface the data model carries.
- SMTP delivery of verification codes / reset links — the standing
  no-SMTP self-hosted disclosure (SD-19) is unchanged.
- The F2 e2e-flake watch (clean in the L3 run — no new data point;
  the watch stands).
- The react-dom boot floor (~890 ms) — the standing V17 disclosure.
- The reference's own broken/dead flows — standing disclosures,
  nothing to mirror (8th cycle).
- All standing v8–v22 disclosures — unchanged.

## 6. Execution results (filled on completion — 2026-10-28)

- **B1 — DONE.** The audit ledger L1–L12 above; the reference
  unchanged for the 8th consecutive cycle; the baseline green exactly
  as V22 closed it (542/542 unit · 196/196 e2e, first-try); the
  mobile drawer contract live-verified at 390×844 (aria cycle, scroll
  lock, 8 links at the uniform 44px pitch, Esc + focus return — the
  Tailwind v4 trap suite green); the V22 additions live-verified
  end-to-end with a scratch account (register → code note 470303 →
  the login-403 card → resend 047530 → verify → the app; the account
  then deleted via the API and the dev-DB census re-checked); neo-crm
  unchanged since the V22 review.
- **B2 — DONE (verified RED).** The extended
  `tests/account-ui.test.ts` failed **9/21** against the unfixed tree
  (the two grown V22 action/wiring pins + 7 of the 8 new pins; the
  one pass is the no-verifyPassword guard, trivially true pre-fix
  against an empty route string — exactly the disclosed pattern).
  The new e2e test failed at the missing surfaces pre-fix.
- **B3 — DONE (verified GREEN).** `updateProfileSchema` shipped
  (`z.string().trim().min(1).max(100)`); the route shipped in the
  change-email family shape with the deliberate no-password split
  (one design refinement at implementation time: requireUser's
  SessionUser already carries `fullName`, so the planned extra
  `findUnique` read was dropped — the must-differ guard reads the
  session user directly); the "Cambiar nombre" dialog shipped as the
  fourth Mi Cuenta action with the prefill + the `onChanged` seam.
  Unit pins 21/21; typecheck clean after each file.
- **B3-adjacent (the pin that caught the docs):** the V21
  deployment-surfaces **route-count pin failed exactly as designed**
  on the first full-suite run (the filesystem hit 28 route handlers
  while DEPLOYMENT.md claimed 27) — the count-the-things rule
  working; DEPLOYMENT.md's count and §10 (the five-endpoint table +
  the no-password split disclosure) updated in the same commit. This
  is the cycle's proof that the mechanical docs-truth pins pay rent.
- **B4 — DONE.** The four v23 captures saved under docs/screenshots/
  (v23-account-section.png — the four-action row;
  v23-change-name-dialog.png — the prefilled dialog;
  v23-name-updated-readout.png — the readout after the rotation, with
  the seeded name restored via the API after the shot;
  v23-mobile-drawer-open-390.png — the audit's drawer capture). The
  implementation was also verified LIVE on the dev server (the
  four-button row, the prefilled dialog, the must-differ 400, the
  readout + server state update, the seeded name restored). Full
  gates: **lint 0 · tsc 0 · build ✓ · 550/550 unit (38 files,
  542+8) · 197/197 e2e (3.4m, 196+1)** — the new spec passed in
  isolation AND in the full suite.
- **B5 — DONE.** Docs lockstep: README (badge 550+197, the
  account-security feature row, the API-table row), AGENTS (the
  account UI contract extended to v22 + v23), CLAUDE (the v23
  contracts note + the command counts + the v22 pin counts
  annotated), PAD v2.10.0 (the history entry + **ADR-032** + the §8
  testing table), DEPLOYMENT.md (28 route handlers + §10's
  five-endpoint table + the no-password split disclosure), SKILL
  v1.17.0, this ledger, `docs/session_39.md`, the worklog entry.
  Commit to main + the SSH-wrapper push close the cycle (hash
  recorded in session_39).
