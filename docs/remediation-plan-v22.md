# VeloxPOS — Remediation Plan v22 (Session V21→v22, 2026-10-28)

> Scope: **close the account-security loop end-to-end.** The V22 audit
> found the reference UNCHANGED for the 7th consecutive cycle (nothing
> new to mirror), the baseline gates green (529/529 unit · 187/187 e2e
> after a browser-binary environment fix — no code changes), and the
> clone's mobile drawer contract re-verified live. The cycle's target is
> the V21 session's own suggested next step: the four tested
> account-security routes remain UI-less — this cycle surfaces them as
> the "Mi Cuenta" section in Ajustes. Two adjacent REAL findings ride
> along: the signup verify stage DISCARDS the register response's
> verification code (in the no-SMTP self-hosted delivery model the user
> can never see their code — signup verification is UI-unusable on a
> fresh install), and the login 403 dead-end tells an unverified user to
> "check your email" that never arrives with no resend affordance. One
> docs-truth item closes the set: the PAD's Known-Issue #7 describes a
> `typescript.ignoreBuildErrors` flag that `next.config.ts` no longer
> sets.

## 0. Verification ledger (all live unless noted; clone :3000 dev / :3100 e2e vs reference)

| # | Item | Method | Result | Verdict |
|---|------|--------|--------|---------|
| L1 | Workspace state | fresh `git clone` (the sandbox had been reset); `git log` inspected | main @ `b3439bb` (the V21 session-log commit on top of the V21 execution `3d36d7a`), clean tree; `.env` + `db/` recreated from `.env.example` (`db:push` + `db:seed` — the gitignored locals); Playwright's matching chromium build installed (`playwright install chromium` — the cache held a DIFFERENT revision than the pinned `@playwright/test` 1.63.0 requires; the first e2e run failed 168/187 at browser launch, all `(1ms)` infra failures, zero code failures) | baseline current |
| L2 | V21 reference docs | full read: session_35, session_36 (the raw V21 log), remediation-plan-v21, the worklog tail; core docs re-read (AGENTS 31 contracts, CLAUDE, README, PAD v2.8.0 / ADR-030, SKILL v1.15.0) | V21 closed Known-Issue #6 (deployment-surface truth pass + the account-security routes pinned); the docs stay lockstep-true at 529+187 | aligned |
| L3 | Baseline gates | lint → tsc → build → unit → e2e (in that order) | 0 · 0 · ✓ · 529/529 (37 files) · **187/187** (3.2m, first-try once the browser binary matched) | all green |
| L4 | Reference data state | agent-browser on the logged-in reference (Terminal / Cajas / Inventario / Dashboard / Ventas / Reportes) | Terminal shift-gated ("No hay turno activo"), both cajas "Cerrada" (Caja 2 first), 12 products (Shampoo Pantene 400ml first, category chips in the sortOrder sequence), 2 sales (V-MO6BJT7G $21.46, V-MMPNY55Z $61.48), Dashboard "martes 27 de octubre, 2026" + $0.00 KPIs, Reports $0.00 + "Sin datos en este período" on both method cards — identical to the V17–V21 records | unchanged — nothing new to mirror (7th cycle) |
| L5 | Reference mobile @390 | agent-browser `set viewport 390 844` on /Dashboard | NO hamburger, 220px sidebar, main squeezed to 170px, viewport-locked — identical to V16–V21 (7th consecutive cycle) | standing disclosure (the clone's drawer is the superset) |
| L6 | Clone mobile live probe | agent-browser on the dev server @390×844 | the drawer contract holds live: `aria-expanded` cycles, body scroll locks (`overflow: hidden`), focus moves INTO the panel, **8 links at a uniform 44px pitch** (y-deltas 81→125→169→213→257→301→345→389), Esc closes + returns focus to the hamburger + unlocks scroll; capture `v22-mobile-drawer-open-390.png` | superset verified |
| L7 | neo-crm pattern cross-check | `git ls-remote` + the commits page + session-doc spot reads | HEAD moved: `6d655f9a` "session-194 — THE 404 INTERIOR'S INTERACTIVE ARMS" (2026-10-27; the docs folder lists sessions through session_219). Reviewed the newest sessions — they are neo-crm-specific parity/audit cycles (calendar grid, tab strips, drift sweeps); no NEW family pattern this cycle's scope needs beyond what the standing adoptions already cover (drift sweeps, mobile drawer focus contracts, TDD-first remediation — all present here) | pattern parity holds |
| L8 | The account-security surface | full re-read: the four route files + validation schemas; live reference check (sidebar bottom innerHTML + Ajustes text) | the routes are real, rate-limited, password-first, and UI-less (zero components reference them); the reference has NO account surface at all — its sidebar bottom is ONLY the collapse chevron (`p-3 border-t border-[#1e2235]` + chevron-left), its Ajustes is store settings only | the cycle's target (pure superset — nothing to mirror) |
| L9 | The signup/login verification flow | full read: signup-surface.tsx, login surface, register/login routes | **F2 below** — `submitForm` calls `apiSend<{ ok: boolean; code?: string }>` and DISCARDS the returned `code`; the verify stage tells the user "Enter the 6-digit code we sent to {email}" while the register route's own comment promises "the verify screen's self-hosted code note" — which does not exist. **F3 below** — login's 403 `UNVERIFIED_COPY` says "Check your email for the verification code" with no email channel and no resend affordance on the login surface | real bugs |
| L10 | Rate-limit budgets for the new spec | `rg -c` of register/login/resend calls across tests/e2e | registers: 6 today + 2 (this spec) = 8 < 10/IP/15min; logins: 12 today + 3 (1 failed-403 + 2 successful) — successful sign-ins RESET the limiter (the login route's documented model), failed attempts stay ≤4 < 10; resends: 3 today + 2 = 5 < 10 | safe to add the spec |
| L11 | Auth error-language convention | live: wrong-password login on the reference → "Invalid email or password" (English) | the reference's own auth surface mixes Spanish UI chrome with ENGLISH auth copy; the clone matches; the account-security routes' English error messages passing through toasts are consistent with the measured convention | SD-91 resolved |
| L12 | Known-Issues register sweep | PAD §11 vs `next.config.ts` | Known-Issue #7 claims `typescript.ignoreBuildErrors: true` is set — the config sets NO `typescript` key at all (the flag was retired in an earlier cycle; the row was never swept). The web-application skill's own rule: "an Open row that's actually fixed is a lie" | docs-truth item (F5) |

## 1. Findings

- **F1 (the headline) — the account-security API is UI-less (the disclosed
  superset gap).** `POST /api/auth/change-password` · `change-email` ·
  `delete-account` · `resend-verification` are real, rate-limited,
  password-verified-first routes pinned end-to-end by V21's
  `tests/e2e/account-security.spec.ts` — and ZERO UI reaches any of them.
  A VeloxPOS operator cannot rotate their password, change their login
  email, or exit their account without curl. The V21 session log's own
  suggested next step: "a future cycle could surface a profile/settings
  UI for it" — this is that cycle.

- **F2 (real bug) — the signup verify stage discards the verification
  code.** The no-SMTP self-hosted delivery model (SD-19-adjacent,
  documented in DEPLOYMENT.md §10) delivers the 6-digit OTP in the
  register response body — the route's header comment explicitly names
  "the verify screen's self-hosted code note" as the delivery surface.
  `src/components/auth/signup-surface.tsx` `submitForm` awaits
  `apiSend<{ ok: boolean; code?: string }>` and never reads `code`; the
  verify stage then instructs "Enter the 6-digit code we sent to
  {email}" — an email that never arrives. On a fresh self-hosted
  install, signup verification is UI-unusable: the user cannot ever see
  their code (the only recovery is re-registering, which re-issues a
  code the UI again hides).

- **F3 (dead-end) — the login 403 tells an unverified user to check an
  email that never arrives, with no resend affordance.** An unverified
  account's login answers 403 "Please verify your email before logging
  in. Check your email for the verification code." The login surface
  renders the inline alert and nothing else — no resend action, no
  path to the code. The workaround (re-register the same address from
  /signup, which re-issues a code) exists but is undiscoverable.

- **F4 (type alignment, minor) — `AppUser` lacks `emailVerified`.** The
  API's `publicUser` returns `emailVerified` on `/api/auth/me`, but the
  client `AppUser` type (src/lib/store.ts) omits it — the account
  section's verified badge needs it.

- **F5 (docs truth) — PAD Known-Issue #7 describes a flag the config no
  longer sets.** The row claims `next.config.ts` sets
  `typescript.ignoreBuildErrors: true`; the file sets no `typescript`
  key. The row should close (the mitigation it describes — the
  mandatory typecheck gate — remains the contract).

- **No parity gaps.** The reference is unchanged (L4, 7th cycle), the
  clone's mobile contract re-verified live (L6) and re-proven by the 9
  e2e pins every run, the Tailwind v4 sweep stayed clean (95 pins —
  unchanged from V19–V21; the trap tests green in L3). Every change
  below either fixes a shipped bug (F2/F3) or surfaces tested superset
  surface (F1) in the established component families.

## 2. Design decisions (resolved)

- **SD-85 — placement: a "Mi Cuenta" SectionCard at the bottom of
  Ajustes.** No new route, no chrome change, no store refactor: the
  settings view already owns the settings-surface family, and the
  account section slots after "Categorías de Producto" in the same
  `SectionCard` grammar. A separate route/sidebar entry would add
  navigation surface the reference cannot mirror (its sidebar is
  measured at 8 links) — the section keeps the superset additive and
  invisible to parity.

- **SD-86 — the section icon joins the measured family.** Ajustes
  headers carry per-section icons at `w-5 h-5`: Store/indigo,
  Palette/purple, FileText/green, CreditCard/blue, Tag/amber. "Mi
  Cuenta" adds **ShieldCheck/rose-500** (rose is unused in the family;
  the security connotation reads instantly). The verified badge is the
  emerald pill family ("Verificada").

- **SD-87 — F2 fix: the verify stage SHOWS the code.** The register
  response's `code` lands in component state and renders as the auth
  Alert family note below the code field: the shadcn slate variant
  (`border-slate-200 bg-slate-50/70 p-4 rounded-xl` +
  `text-slate-700 text-sm leading-relaxed`), English copy matching the
  auth surface's measured language: "No email service is configured on
  this self-hosted install — your verification code is:" + the code in
  `font-mono font-semibold`. The same note renders after a resend.

- **SD-88 — F3 fix: the login 403 renders a resend affordance.** When
  the login failure's status is 403, the surface appends a
  "Resend the code" button (the auth `h-10 sm:h-11` control family)
  under the inline alert; clicking POSTs
  `/api/auth/resend-verification` with the submitted email and renders
  the returned code in the SD-87 note (the uniform no-code 200 renders
  the neutral "If that address needs a new code, one has been issued."
  — no enumeration leak through the UI either). The e2e pins both
  branches.

- **SD-89 — the dialogs ride the measured families.** Change-password
  and change-email use the `Dialog` family (max-w-lg,
  `rounded-2xl sm:rounded-lg`, the full tailwindcss-animate grammar,
  NO `duration-` class, key-remount reset, the 42px footer:
  `glass-button-primary h-auto rounded-xl px-4 py-2.5` submit with a
  visible icon + `glass-button h-auto rounded-xl px-4 py-2.5
  text-slate-700` cancel). Delete-account uses the `AlertDialog`
  primitive with the destructive red path (`bg-red-500/15
  border-red-500/30` chrome family) + the cascade warning copy naming
  the retail domain's wipe (products, categories, registers, cashiers,
  shifts, sales, settings). Numeric/field validation is client-side
  must-match + server-enforced (the routes own the truth).

- **SD-90 — identity readout + post-mutation behavior.** The section
  fetches `/api/auth/me` itself (self-contained; `AppUser` gains
  `emailVerified: boolean` — F4) and renders email, name, a
  "Verificada" emerald badge, and member-since (es-MX date family).
  Change-email updates the readout from the route's response. A
  successful password rotation toasts success ("Contraseña
  actualizada.") — the session SURVIVES by design (ADR-030 comment:
  the cookie is an HMAC over AUTH_SECRET, not the password) and the UI
  stays put. Delete-account resets `usePosStore` + redirects to
  `/login` (the `logout()` mechanics — the route already clears the
  cookie).

- **SD-91 — language: Spanish section chrome, English auth errors.**
  The app-family copy is Spanish ("Mi Cuenta", "Cambiar contraseña",
  "Cambiar correo", "Eliminar cuenta"); API error messages (English,
  like the reference's own "Invalid email or password" — L11) pass
  through the toaster untouched, matching every other view's
  `toast.error(err.message)` pattern.

- **SD-92 — Known-Issue #7 closes as a docs-truth row** (the flag is
  already absent; the PAD row retires with a strikethrough note, the
  typecheck-gate contract sentence moves to §8 Testing where it
  already lives).

## 3. Execution batches

### B1 — the audit (DONE)

- L1–L12 above. Reference 7th cycle unchanged; baseline green; the
  mobile contract live-verified; findings F1–F5 scoped with
  file:line evidence.

### B2 — TDD RED: the pins (written FIRST, expected to fail)

- `tests/account-ui.test.ts` (new, the source-pin idiom):
  1. `src/components/views/settings-view.tsx` renders a "Mi Cuenta"
     section (raw scan) with the ShieldCheck icon import and the
     rose-500 header tone; the three action labels exist
     ("Cambiar contraseña", "Cambiar correo", "Eliminar cuenta").
  2. The section wires the four account-security paths
     (`/api/auth/change-password`, `/api/auth/change-email`,
     `/api/auth/delete-account` references in the view file).
  3. `AppUser` carries `emailVerified: boolean` (store.ts raw scan).
  4. `signup-surface.tsx` KEEPS the register response's code (state
     scan: the verify stage renders the self-hosted code note —
     "self-hosted" / `code` rendering + the Alert family classes).
  5. The login surface renders a resend affordance gated on the 403
     (login-surface.tsx: `resend-verification` reference + a 403
     status check).
  6. `next.config.ts` sets NO `ignoreBuildErrors` (comment-stripped
     scan — the F5 docs-truth guard).
- `tests/e2e/account-ui.spec.ts` (new, behavioral):
  1. **The signup code note (F2)**: register a scratch account through
     the /signup UI → the verify stage displays the 6-digit code (the
     note is visible, the code matches the API response's).
  2. **The login 403 resend (F3)**: attempt login with the unverified
     scratch account → the inline 403 alert + "Resend the code" →
     click → the code note renders a fresh code.
  3. **The section renders (F1)**: verify the scratch account (API),
     sign in, navigate /StoreSettings → "Mi Cuenta" shows the
     identity readout (email + "Verificada").
  4. **Change-password round-trip**: open the dialog → wrong current →
     the 400 surfaces in the dialog; happy path → success toast; a
     fresh-context login with the NEW password succeeds.
  5. **Change-email round-trip**: the dialog's must-differ 400; happy
     path → the readout updates to the new address; a fresh-context
     login with the NEW address succeeds.
  6. **Delete-account**: the AlertDialog's cascade warning renders;
     happy path → redirect to /login; the cookie is dead (the
     follow-up authed request 401s).
- Both layers expected RED against the unfixed tree (the unit pins
  fail mechanically; the e2e spec fails at the missing surfaces).

### B3 — TDD GREEN: the implementation

- `src/lib/store.ts`: `AppUser` gains `emailVerified: boolean` (F4).
- `src/components/views/settings-view.tsx`: the "Mi Cuenta"
  `SectionCard` (SD-85/86) — the identity readout (`/api/auth/me`
  fetch in-component), the three actions, the two `Dialog`s and the
  destructive `AlertDialog` (SD-89/90), Spanish chrome + passthrough
  errors (SD-91), toast on success, store reset + `/login` redirect
  on delete.
- `src/components/auth/signup-surface.tsx`: capture the register
  response's `code`; render the SD-87 note on the verify stage.
- `src/components/auth/login-surface.tsx`: the 403-gated "Resend the
  code" affordance + the SD-88 note (both branches).
- `Project_Architecture_Document.md`: Known-Issue #7 closed (F5/SD-92).
- Re-run B2's pins → green.

### B4 — the V22 evidence set + the full gates

- Fresh captures under `docs/screenshots/`:
  `v22-mobile-drawer-open-390.png` (already captured in the audit),
  `v22-account-section.png`, `v22-account-change-password-dialog.png`,
  `v22-account-delete-dialog.png`, `v22-signup-code-note.png`.
- Full gates: lint → typecheck → build → `bun run test` (expect
  529+~10 = ~539) → `bun run test:e2e` (expect 187+~10 = ~197).

### B5 — docs lockstep → commit + push

- README: the account-security feature row updates ("API-only" → the
  Mi Cuenta UI); badge counts bump.
- AGENTS.md: the contract line — the account UI is the disclosed
  superset surface (Ajustes → Mi Cuenta), the four routes are
  UI-wired.
- CLAUDE.md: the v22 contracts note + counts.
- PAD: v2.9.0 history entry + **ADR-031** (the account-security UI
  superset + the verification-code delivery fix) + Known-Issue #7
  CLOSED + the §10 account-security prose update (routes now have
  UI).
- DEPLOYMENT.md §10: the four routes' "API-only" framing updates to
  "UI-wired in Ajustes → Mi Cuenta (the API remains available for
  scripting)".
- retail-pos_SKILL.md: v1.16.0 + counts.
- This plan (§6 filled); `docs/session_37.md` (the session log);
  `worklog.md` (the V22 entry). Every count mention (529→539,
  187→197 — final numbers recorded at close) bumps in the same
  commit.
- Commit to main; SSH-wrapper push (no new branches).

## 4. Test plan

- The unit source pins (B2) mechanically pin the surfaces' existence
  and wiring — the same idiom as tailwind-traps /
  deployment-surfaces (raw scans where presence IS the contract).
- The behavioral e2e proves the user-visible contracts end-to-end
  against the production build: the code-note visibility (F2), the
  403-resend loop (F3), the section identity readout, and the three
  rotation/exit round-trips with fresh-context logins proving the
  SERVER state moved (the account-security spec's discipline — no
  storageState cookie riding authenticated scratch calls).
- One scratch account serves the whole spec (serial workers — order
  is deterministic): register → code note → 403/resend → verify →
  section → change-password → change-email → delete LAST. Rate
  budgets verified (L10).
- Honest limits: e2e cannot prove the rate limiter's 15-minute window
  expiry (too slow) — the limiters stay unit/source-pinned territory.
- Full suite re-runs as the regression proof (B4).

## 5. Out of scope (disclosed)

- A profile/name-edit UI (`fullName` edit) — the reference has none
  and the routes don't expose it; a future cycle if wanted.
- SMTP delivery of verification codes / reset links — the standing
  no-SMTP self-hosted disclosure (SD-19) is unchanged; the UI note
  makes the existing in-response delivery VISIBLE instead of changing
  it.
- The F2 e2e-flake watch (this run was clean — no new data point; the
  watch stands).
- The react-dom boot floor (~890 ms) — the standing V17 disclosure.
- The reference's own broken/dead flows — standing disclosures,
  nothing to mirror (7th cycle).
- All standing v8–v21 disclosures (SD-14, SD-18..SD-23, SD-63..SD-84,
  the a11y parity deviations) — unchanged.

## 6. Execution results (filled on completion — 2026-10-28)

- **B1 — DONE.** The audit ledger L1–L12 above; the reference
  unchanged for the 7th consecutive cycle; the baseline green
  (529/529 unit · 187/187 e2e — the only failure all session was the
  environment's browser-binary mismatch, fixed with
  `playwright install chromium`, zero code changes); the mobile
  drawer contract live-verified at 390×844 (aria/scroll-lock/focus/
  44px pitch/Esc-return).
- **B2 — DONE (verified RED).** `tests/account-ui.test.ts` (13 source
  pins — one more granular than the planned ~10: the section's
  `/api/auth/me` seam and the delete-path mechanics split out) failed
  **12/13** against the unfixed tree (the one pass: the F5
  docs-truth guard, trivially true pre-fix — exactly as disclosed in
  the plan). One pin was corrected against the codebase's real idiom
  BEFORE counting as GREEN: the slate-Alert class order (the plan's
  prose-derived regex didn't match the actual
  `rounded-xl border border-slate-200 bg-slate-50/70 p-4` string —
  corrected to the codebase's own order, a tightening not a
  loosening). `tests/e2e/account-ui.spec.ts` (9 behavioral tests —
  one fewer than the planned ~10: the section-render + the three
  rotation round-trips consolidated) failed at the missing surfaces
  pre-fix.
- **B3 — DONE (verified GREEN), with three execution-time lessons the
  plan did not foresee:** (1) **the nested-form hydration kill** —
  the first implementation mounted the login 403 verify card as a
  `<form>` INSIDE the login `<form>`; React logged "In HTML, form
  cannot be a descendant of form" and the inner submit silently
  never fired (reproduced live on the dev server before the fix);
  the card is now a plain DIV with a button-driven submit and an
  explicit Enter-key route. (2) **the v5 form-control pin caught the
  first draft** — the dialog inputs copied the cashiers-view
  `bg-[#0d0f1a]` solid fill, and `tests/visual-parity-v5.test.ts`
  failed (settings-view inputs must stay TRANSPARENT, measured trap
  13); the fills were removed. (3) **the AlertDialog primitive was
  deliberately NOT used** — its cva `buttonVariants()` defaults
  clobber the glass fills (the F6 trap); the delete confirm rides a
  plain Dialog + the new `glass-button-danger` @utility (the
  warning-ramp extension precedent), matching every other
  destructive confirm in the codebase. GREEN state: AppUser.emailVerified
  added; the Mi Cuenta section + three dialogs shipped; the signup
  code note shipped; the login 403 verify sub-card shipped; PAD
  Known-Issue #7 closed. Unit pins 13/13.
- **B3-adjacent (the full-suite integration pins).** Two existing
  tests needed the superset accounted for — NOT weakened, extended:
  the **v10 Ajustes icon pin** now counts SIX sections (the five
  reference sections keep their exact class assertions; "Mi Cuenta"
  joins the expected map at `h-5 w-5 text-rose-500`, 20px); and the
  new spec's verify-email call is **bucket-isolated via the H3 xff
  precedent** (`x-forwarded-for: 198.51.100.9` through
  `page.route`) because the shared localhost verify budget runs at
  exactly 10/15min (security.spec's H2 spends 7 + M6 1 +
  account-security 1 + v12 1 = 10; the 11th would 429 M6 — observed
  live in the first full-suite run before the isolation).
- **B4 — DONE.** The five v22-* captures saved under
  docs/screenshots/ (v22-mobile-drawer-open-390.png from the audit;
  v22-account-section.png; v22-account-change-password-dialog.png;
  v22-account-delete-dialog.png; v22-signup-code-note.png — the
  latter four captured live on the dev server against the remediated
  code). Full gates: **lint 0 · tsc 0 · build ✓ · 542/542 unit (38
  files, 529+13) · 196/196 e2e (3.5m, 187+9)** — the new spec passed
  in isolation AND in the full suite.
- **B5 — DONE.** Docs lockstep: README (badge 542+196, the
  account-security feature row rewritten for the UI, the API-table
  row), AGENTS (the new "The account UI contract (v22)" section),
  CLAUDE (the v22 contracts note + the command counts), PAD v2.9.0
  (the history entry + **ADR-031** + Known-Issue #7 CLOSED + the
  §8 testing table), DEPLOYMENT.md §10 (the UI-wired framing),
  SKILL v1.16.0, this ledger, `docs/session_37.md`, the worklog
  entry. Commit to main + the SSH-wrapper push close the cycle (hash
  recorded in session_37).
