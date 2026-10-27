# VeloxPOS — Remediation Plan v12 (Session V11→v12, 2026-10-27)

> Scope: five finding families from the live audit of BOTH apps
> (ref = veloxposretail.base44.app, clone = the standalone build on :3100),
> all on the AUTH surface family — the one surface family never measured
> below the card level: **F1 the auth card chrome** (the reference's card
> carries a 4px slate gradient hairline, `overflow-hidden`, and an `md:`
> padding variant the clone lacks), **F2 the login typography + layout
> grammar** (the responsive h1/subtext, the 16px social buttons with the
> `-ml-4` icon optical offset, the OR chip, the sm:step form gaps, the
> Forgot/Sign-up ROW at ≥sm inside the form, and the `h-11 sm:h-12`
> submit — the clone ships fixed sizes everywhere), **F3 the forgot/sent
> sub-screens** (the clone's Spanish one-off screens vs the reference's
> measured English family — different heading sizes, input heights, button
> heights, back-button placement, and a fully missing sent-state anatomy:
> the icon circle + the green alert), **F4 the /reset-password page** (the
> reference's platform template — a WHITE page, the `rounded-lg` card with
> a 2px gray-900 strip, the gray palette, the New Password + Confirm pair
> — vs the clone's custom rounded-3xl indigo design), and **F5 the error
> alert skin** (the reference's shadcn Alert family `bg-red-50/70
> border-red-200 rounded-xl p-4` + `text-red-700 text-sm leading-relaxed`
> vs the clone's `rounded-lg bg-red-50 px-3 py-2 text-red-600`).
> Baseline re-verified before audit: fresh clone of `main @ d125bca` (the
> v11 close `c4a7a8d` + the remote's session_16 transcript), gates green
> (lint 0 · tsc 0 · build ✓ · unit 397/397 · e2e 139/139 — one first-run
> order-flake re-run clean, the documented v10 lesson), workspace rebuilt
> (.env + db/custom.db pushed/seeded), both apps logged in live.

> Method: full source audit of the v11 diff (clean — useContainerWidth,
> the chart contracts, the focus grammar, the token realignment all hold
> in code) + a fresh agent-browser sweep of BOTH apps focused on the
> surfaces no prior session had measured below the card: the auth card's
> own chrome, the login column's typography scale and block grammar, and
> the three auth sub-screens (forgot → sent → reset). The reference's
> data state was re-verified first: UNCHANGED since v11 (the same 2 sales,
> 12 products, $0.00/0/12/1 KPIs, the 5-row donut legend, the Atún Dolores
> low-stock row) — no seeded-data work this cycle. The mobile drawer
> contract re-verified live at 390px on the clone: fully green (288px
> panel, 8×40px links, 44px pitch, aria-expanded, scroll lock, Escape +
> focus return — a probe artifact initially suggested an aria bug; the
> query was matching the HIDDEN desktop collapse toggle, not the
> hamburger).

## 0. Verification ledger (all live unless noted; ref vs clone)

| # | Check | Method | Result |
|---|---|---|---|
| L1 | Baseline gates | repo | lint 0 · tsc 0 · build ✓ · unit 397/397 · e2e 139/139 (after one order-flake re-run) — the v11 close intact |
| L2 | Reference data state | DOM, ref | UNCHANGED since v11: KPIs $0.00/0/12/1, donut legend 5 rows (Lácteos…Snacks), Atún Dolores 295g "3 en stock (mín. 5)", date line "martes 27 de octubre, 2026" — no seeded-data work |
| L3 | Mobile drawer (clone @390) | DOM + rect, live | FULLY green: 288px panel (w-72), 8 links, 40px link height, 44px pitch, aria-expanded true/false on the hamburger, body scroll lock, zero horizontal overflow, Escape closes, focus RETURNS to the hamburger (the false alarm: `querySelector('[aria-expanded]')` matches the hidden desktop "Contraer barra lateral" toggle FIRST — always select by aria-label) |
| L4 | Auth card chrome | DOM, both | ref card: `text-card-foreground relative overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl` + child 1 = the hairline `absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200` (4px, live-verified) + child 2 = `p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10`. Clone card: `relative w-full max-w-md rounded-2xl border-0 bg-white/95 p-8 shadow-2xl backdrop-blur-sm sm:p-10` — NO hairline, NO overflow-hidden, NO md: variant — **F1a/F1b** |
| L5 | Auth card inner column | DOM, both | ref: `flex flex-col items-center text-center space-y-6 sm:space-y-8` — the logo→h1 block gap is the column's space-y (24px mobile / 32px ≥sm). Clone: `flex flex-col items-center` + per-child margins (logo mb-5 = 20px) — no text-center, no space-y, block gaps 20px at every width — **F1c** |
| L6 | Login H1 + subtext | className + computed, both, 390 + 1280 | ref H1: `text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight` → 24px @390 / 30px @1280; ref subtext: `text-slate-500 text-sm sm:text-base font-medium` → 14px/500 @390, 16px/500 @1280. Clone: `text-3xl` fixed (30px both) + plain `text-slate-500` (16px/400 both) — **F2a/F2b** |
| L7 | Social buttons | className + computed, both | ref: `w-full flex items-center justify-center gap-3 bg-white text-slate-700 px-5 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 font-medium text-[16px] group` + the icon wrapper `transition-transform duration-200 -ml-4` (the optical centering offset). Clone: `text-sm` (14px!), `hover:shadow` (not sm), no hover bg, no icon offset — **F2c** |
| L8 | OR divider | DOM, both | ref: a shadcn Separator — `relative my-6` + the 1px `bg-slate-200` line + the chip `relative flex justify-center text-xs uppercase` > `span.bg-white.px-3.text-slate-500.font-medium.tracking-wider` with the literal text "or" (uppercased by CSS). Clone: flex gap-4 + `text-xs font-medium text-slate-400` "OR" — slate-400 vs slate-500, no tracking-wider — **F2d** |
| L9 | Form gaps + structure | className, both | ref FORM: `space-y-4 sm:space-y-5` with children [fields-group `space-y-3 sm:space-y-4`, (error alert when present), actions-group `space-y-3`]. Clone: `space-y-4` fixed, flat children — **F2e** |
| L10 | The Forgot/Sign-up footer row | DOM + rect, both, 390 + 1280 | ref: INSIDE the form's actions group — `flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0` with "Forgot password?" (`text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors`) LEFT and the one-button "Need an account? Sign up" (`text-sm text-slate-500 hover:text-slate-700 transition-colors`) RIGHT at ≥sm. Clone: two stacked full-width blocks OUTSIDE the form (mt-4 each) — **F2f** |
| L11 | The submit button | className + rect, both, 390 + 1280 | ref: `px-3 py-2 w-full h-11 sm:h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm rounded-xl transition-all duration-200` → 44px @390 / 48px @1280 (+ its 3px white focus outline, v11-pinned). Clone: `h-12` fixed → 48px at BOTH (44 vs 48 mobile), no shadow-sm, px-4 — **F2g** |
| L12 | The login error alert | DOM + computed, both | ref (triggered live, wrong password): `role=alert` shadcn Alert — `relative w-full border p-4 … bg-red-50/70 border-red-200 rounded-xl` + inner `[&_p]:leading-relaxed text-red-700 text-sm` "Invalid email or password" (the message text already matches the clone's API), rendered BETWEEN the fields group and the actions group. Clone: `rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600` — 8px radius, no border, red-600, p-2 — **F5** |
| L13 | The forgot screen | DOM + computed, both | ref (from "Forgot password?"): back button FIRST (`flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors -mb-2`, lucide-arrow-left h-4 w-4), H2 "Reset your password" (`text-2xl`-equivalent 24px/700 slate-900), subtext "Enter your email and we'll send you a link to reset your password" (16px slate-600), Email label (centered `text-sm font-medium text-slate-700`, 10px label→input gap) + input `… pl-10 h-10 sm:h-11 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-400` (lucide-mail left-3 icon) — 40px @390 / 44px ≥sm, placeholder slate-400, submit "Send reset link" `px-3 py-2 w-full h-10 sm:h-11 … shadow-sm rounded-xl transition-all duration-200`. Clone: Spanish copy ("Recuperar contraseña"…), h2 `text-xl` (20px), subtext 14px slate-500, inputs h-11 sm:h-12 (the login sizes), button h-12, back button at the BOTTOM (mt-4) — **F3a/F3b** |
| L14 | The sent screen | DOM, both | ref (triggered live): `w-full > space-y-4 sm:space-y-6` with [text-center group `space-y-3 sm:space-y-4` (the icon circle `mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center` + `lucide-mail h-7 w-7 sm:h-8 sm:w-8 text-slate-700`, H2 "Check your email" 24px/700, "We've sent password reset instructions to " (`text-slate-600 text-sm sm:text-base`) + the email SPAN `font-medium text-slate-900`), the GREEN alert (`bg-green-50/70 border-green-200 rounded-xl p-4` + `text-green-700 text-sm leading-relaxed` "Please check your email for the password reset link. It may take a few minutes to arrive."), "Back to sign in" (`w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors`)]. Clone: a plain Spanish text screen ("Revisa tu correo") + an indigo left-aligned back link — no icon circle, no green alert — **F3c** |
| L15 | The /reset-password page | DOM + computed, both | ref (`?token=…`, the platform template): page bg WHITE (no slate gradient), card `rounded-lg text-card-foreground max-w-md w-full overflow-hidden border-0 shadow-lg bg-white` + the 2px top strip `absolute top-0 left-0 right-0 h-0.5 bg-gray-900`, H2 "Set new password" (`text-2xl font-bold text-gray-900`), subtext "Enter your new password for VeloxPOS" (`text-gray-600`), FORM `space-y-6`, labels "New Password" + "Confirm New Password" (centered `text-sm font-medium`), inputs `pl-10 h-11 bg-gray-50/50 border-gray-200 focus:border-gray-400 focus:ring-gray-400` (lucide-lock `h-4 w-4 text-gray-400` icons) 44px, helper `text-xs text-gray-500` "Must be at least 8 characters", submit "Reset password" `px-3 py-2 w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium shadow-sm`, back "Back to login" `w-full text-sm text-gray-600 hover:text-gray-700` — the GRAY family, not slate. Clone: a custom `rounded-3xl border-slate-200/70` card + an indigo button + token+password fields + Spanish — **F4a** |
| L16 | The invalid/missing-token state | DOM, ref | ref (no token): the same card with an 80px `mx-auto w-20 h-20 bg-red-100 rounded-full` icon circle, H2 "Invalid Reset Link" (`text-2xl font-bold text-gray-900`), subtext "This password reset link is invalid or has expired." (`text-gray-600`), "Back to Login" (`w-full h-11 bg-gray-900 …` the standard button) — **F4b** |
| L17 | Nav link hover | className, both | IDENTICAL: `text-white/40 hover:bg-white/5 hover:text-white/80 transition-all duration-150` — at parity, no work |
| L18 | StatCard | className + computed, both | ref: `rounded-2xl p-5 relative overflow-hidden`, no hover transition. Clone (vx-card): same geometry — at parity, no work |
| L19 | Reference /signup | DOM, ref | 404s ("Página no encontrada") both logged-in and logged-out — the documented SD-20 platform artifact; the clone's public signup stays the superset; only its CHROME aligns to the fixed card/buttons/alerts this cycle |

## 1. Design decisions (resolved)

- **SD-41 (the auth card chrome):** `AuthShell` becomes the reference's
  card exactly: `relative w-full max-w-md overflow-hidden rounded-2xl
  border-0 bg-white/95 shadow-2xl backdrop-blur-sm` + the hairline child
  (`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200
  via-slate-300 to-slate-200`) + the padding child `p-8 sm:p-10 md:pt-12
  md:pb-10 md:px-10` wrapping the column `flex flex-col items-center
  text-center space-y-6 sm:space-y-8`. The /reset-password page does NOT
  use this shell (it is the platform's own template — SD-44). The scoped
  `--background: 255 255 255` stays on the `<main>` (v11/SD-39).
- **SD-42 (the login typography + layout grammar):** the login content
  reorganizes into the reference's column children: [logo group] [h1+
  subtext wrapper `space-y-2 sm:space-y-3`] [the w-full block: social
  `space-y-3` + OR divider + form]. The H1 goes responsive (`text-2xl
  sm:text-3xl`), the subtext (`text-sm sm:text-base font-medium
  text-slate-500`), the social buttons adopt `text-[16px]` +
  `hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm` + the
  `-ml-4` icon wrapper (`transition-transform duration-200`), the OR chip
  becomes `bg-white px-3 text-slate-500 font-medium tracking-wider` on
  the 1px line (literal "or", uppercased by the wrapper's `text-xs
  uppercase`), the form `space-y-4 sm:space-y-5` with the fields group
  `space-y-3 sm:space-y-4` and the actions group `space-y-3`, the footer
  row `flex flex-col sm:flex-row items-center justify-between gap-2
  sm:gap-0` INSIDE the actions group ("Forgot password?" left, the
  one-link "Need an account? Sign up" right), and the submit adopts
  `h-11 sm:h-12 px-3 py-2 … shadow-sm … transition-all duration-200`
  (keeping the v11 3px white focus outline). The signup surface rides the
  same grammar (its own content stays — the superset).
- **SD-43 (the forgot/sent screens, English + the measured anatomy):**
  the forgot screen rebuilds to the reference: back-at-top (`flex
  items-center gap-2 text-sm text-slate-500 hover:text-slate-700
  font-medium transition-colors -mb-2` + lucide-arrow-left), H2
  "Reset your password" (24px/700), subtext "Enter your email and we'll
  send you a link to reset your password" (16px slate-600), the email
  input at the SMALLER auth size (`h-10 sm:h-11`, placeholder
  slate-400), "Send reset link" (`h-10 sm:h-11`). The sent screen
  rebuilds to the measured anatomy (icon circle + copy + the green
  alert + the w-full back). The in-app delivery stays the documented
  superset: when the API returns `resetPath`, the sent screen renders
  the reference's green alert PLUS the reset link inside it (an anchor
  styled as the alert's own text link — "Open your reset link" — the
  only added element, disclosed); the auto-advance to the in-card reset
  form RETIRES (the flow lands on /reset-password?token=… like the
  reference's email link would). The in-card "reset" screen therefore
  retires entirely — /reset-password owns the token form.
- **SD-44 (the /reset-password page, the platform template):** the page
  rebuilds to the reference's measured template: a WHITE page (no
  vx-auth-page gradient — the platform page is plain white), the card
  `rounded-lg … overflow-hidden border-0 shadow-lg bg-white` + the 2px
  `bg-gray-900` top strip, the GRAY palette throughout (text-gray-600
  subtext, gray-50/50 inputs with gray focus + lucide-lock gray-400
  icons), H2 "Set new password" + "Enter your new password for
  VeloxPOS", the field pair New Password + Confirm New Password (`pl-10
  h-11`), the helper `text-xs text-gray-500` "Must be at least 8
  characters" (client-side: the confirm mismatch + the 8-char gate
  mirror the reference's copy), "Reset password" (`w-full h-11
  bg-gray-900 hover:bg-gray-800 … shadow-sm`), "Back to login" (`w-full
  text-sm text-gray-600 hover:text-gray-700`). The token rides the URL
  (hidden state); NO token → the reference's "Invalid Reset Link" state
  (the 80px bg-red-100 circle + the copy + "Back to Login" button). A
  failed reset (expired/unknown token) renders the same invalid state —
  matching the reference's "invalid or has expired" copy.
- **SD-45 (the alert family):** `AuthError` becomes the reference's
  shadcn Alert shape — `relative w-full border p-4 bg-red-50/70
  border-red-200 rounded-xl` + inner `[&_p]:leading-relaxed text-red-700
  text-sm` — used by login, signup (both stages), and the reset page's
  in-form errors. The sent screen's green note is the same component
  family (bg-green-50/70 border-green-200 + text-green-700). The login
  error renders BETWEEN the fields group and the actions group (the
  reference's position). The social-button notice (the clone's superset
  affordance) adopts the same shape with the neutral slate family
  (bg-slate-50/70 border-slate-200 + text-slate-700) — disclosed as the
  clone's own (the reference's social buttons dead-end at the platform's
  OAuth).

## 2. Execution batches (TDD: red → green → gate)

### B1 — the AuthShell card chrome (F1, SD-41)
1. `src/components/auth/login-surface.tsx` (AuthShell): overflow-hidden
   + the hairline child + the md: padding + the space-y column +
   text-center. The login/signup/forgot/sent content re-parents into the
   column structure.

### B2 — the login surface grammar (F2, SD-42)
1. login-surface.tsx: the responsive H1/subtext, the h1 wrapper, the
   w-full block (social space-y-3 + OR + form), the social button
   string, the OR chip, the form groups + footer row, the submit family
   (`h-11 sm:h-12` + shadow-sm + transition-all).
2. signup-surface.tsx: rides the same grammar (submit family, error
   alert, English labels/placeholders/fallbacks — "Full name",
   "Verification code", the copy strings).

### B3 — the forgot + sent screens (F3, SD-43)
1. login-surface.tsx: the forgot screen (back-at-top, 24px H2, the
   smaller input, "Send reset link"); the sent screen (icon circle,
   copy, green alert + the in-app reset-link superset, w-full back);
   the in-card reset screen retires.

### B4 — the /reset-password page (F4, SD-44)
1. `src/app/reset-password/page.tsx`: the platform template (white page,
   the gray card + strip, the field pair + helper + client gates, the
   invalid-token state, "Back to login").

### B5 — the alert family (F5, SD-45)
1. AuthError → the shadcn Alert shape; the green sent note; the neutral
   social notice; wired at the reference's positions on every auth
   surface.

### B6 — pins + screenshots + docs lockstep
1. Unit pins (`tests/functional-parity-v12.test.ts`) + e2e pins
   (`tests/e2e/functional-parity-v12.spec.ts`); realign any legacy auth
   pins the grammar moves (the v4 signup heights keep h-11 sm:h-12 —
   verify; the v11 login focus/height pins keep — verify).
2. The 18 screenshots regenerated from the production build; docs
   lockstep (AGENTS.md contract 25, CLAUDE.md counts + the v12 block,
   README badge, PAD v2.0.0 + ADR-022, SKILL v1.7.0,
   `docs/session_17.md`, worklog, this plan).

## 3. Test plan (pins first — red)

- **Unit (`tests/functional-parity-v12.test.ts`, source pins):**
  - AuthShell: `overflow-hidden`, the hairline class string, `md:pt-12
    md:pb-10 md:px-10`, the column `space-y-6 sm:space-y-8` +
    `text-center`.
  - The login grammar: the H1 `text-2xl sm:text-3xl`, the subtext
    `text-sm sm:text-base font-medium`, the social `text-[16px]` +
    `hover:bg-slate-50` + `hover:shadow-sm` + the `-ml-4` icon wrapper,
    the OR chip (`bg-white px-3 … tracking-wider` + literal "or"), the
    form `space-y-4 sm:space-y-5` + the fields/actions groups, the
    footer row `flex-col sm:flex-row … justify-between` INSIDE the
    form, the submit `h-11 sm:h-12 … shadow-sm … transition-all
    duration-200`.
  - The forgot screen: "Reset your password" / "Send reset link" /
    "Back to sign in" copy, the H2 24px class, `h-10 sm:h-11` on input
    + submit, `placeholder:text-slate-400`, the back-at-top `-mb-2`.
  - The sent screen: the icon circle classes, "Check your email" copy,
    the email `font-medium text-slate-900` span, the green alert
    string, the w-full back; the in-card reset screen ABSENT (no
    "Código de restablecimiento" anywhere).
  - The reset page: "Set new password" / "New Password" / "Confirm New
    Password" / "Must be at least 8 characters" / "Reset password" /
    "Back to login" copy, `bg-gray-900` strip, `rounded-lg` card, the
    gray input string, `h-11`, the invalid state ("Invalid Reset
    Link").
  - The alert family: `bg-red-50/70 border-red-200 rounded-xl p-4` +
    `text-red-700`, the green + slate siblings.
  - Spanish auth strings ABSENT from the auth components
    ("Recuperar contraseña", "Revisa tu correo", "Enviar enlace",
    "Volver a iniciar sesión", "Código", "Nombre").
- **E2e (`tests/e2e/functional-parity-v12.spec.ts`, viewports 1280 +
  390):**
  - The card: the hairline element exists, 4px tall, at the card's top
    edge; the card's computed overflow hidden; the md: padding at 1280
    (pt 48 / pb 40 / px 40).
  - The H1: 24px @390 / 30px @1280; the subtext 14px/500 @390, 16px/500
    @1280.
  - The social buttons: 16px text; the submit 44px @390 / 48px @1280.
  - The footer row: Forgot and Sign-up on the SAME line @1280
    (|Δy| < 5) with Forgot's x < Sign-up's x; stacked @390.
  - The forgot flow: click Forgot → the back button is ABOVE the H2
    (Δy < 0), the H2 24px, the input 40px @390 / 44px @1280, the
    English copy present.
  - The sent flow (the e2e db returns resetPath — the superset link
    renders inside the green alert): the icon circle 64px @1280, the
    green alert's computed bg/border/radius, "Check your email".
  - The reset page: /reset-password (no token) → "Invalid Reset Link";
    with a token → the two password fields 44px, the gray strip 2px
    bg-gray-900, the card 8px radius; a full reset round-trip
    (forgot → follow the link → set a new password → login with it) —
    the functional superset proof.
  - The error alert: wrong password on /login → the alert's 12px
    radius, red-50/70 bg, red-200 border, 14px red-700 text.
- **Legacy realignment (updated, not weakened):** the v4 signup input
  pins keep `h-11 sm:h-12` (the login-size family — unchanged); the
  v11 login-input focus pins keep (the AuthInput base is untouched —
  only the forgot screen passes the smaller override); the v11
  submit-outline pins keep (the outline classes ride the new heights).
- Full gate after each batch: `bun run lint` · `bun run typecheck` ·
  `bun run build` · `bun run test` · `bunx playwright test`.

## 4. Ship

1. Screenshots (B6.2); VLM spot-check the login card + the forgot
   screen + the reset page.
2. Docs lockstep; worklog entry; `docs/session_17.md`; commit; push via
   the SSH wrapper (main only).

## 5. Out of scope (disclosed)

- The reference's social-button hover ICON transform (the
  `transition-transform` on the icon wrapper is measured; the actual
  hover-translate amount is a platform micro-interaction behind the
  OAuth dead-end — the wrapper ships without the translate, disclosed).
- The reference's login card `text-card-foreground` class — the light
  auth card's foreground is slate-900 everywhere by explicit utilities;
  the class would render nothing new (the dark token maps to the same
  family). Not adopted.
- The reference's /signup — 404s on the platform (SD-20); the clone's
  public signup keeps its measured-v4 fields with the aligned chrome
  only.
- The reference's "Remember me" / OAuth functionality — neither exists
  on the reference's login; nothing to mirror.
- The reference's platform toasts (the "Notifications" region exists
  only on its login pages — the base44 platform chrome, not the app);
  the clone's toaster stays the documented superset.
- Standing disclosures unchanged: SD-14 og:url/canonical, SD-18
  readable tones, SD-19 mailto transport, SD-20 public 404/signup,
  SD-23 Spanish-path 404s, the "Detalle por método" table skin, the
  in-memory limiter, the terminal grid, the ref's squeezed-mobile
  charts, the donut tooltip content, the terminal card hover,
  --primary/--border token hygiene.

## 6. Execution results (2026-10-27, all green)

- **B1 shipped as planned:** the AuthShell card rebuilt — `overflow-hidden`
  + the 4px slate gradient hairline child + `p-8 sm:p-10 md:pt-12
  md:pb-10 md:px-10` + the `flex flex-col items-center text-center
  space-y-6 sm:space-y-8` column (the scoped `--background: 255 255 255`
  kept on the main, v11/SD-39).
- **B2 shipped:** the login surface reorganized to the reference's column
  grammar ([logo] [the h1+subtext `space-y-2 sm:space-y-3` wrapper] [the
  w-full block: social `space-y-3` + the OR Separator + the form]); the
  H1 `text-2xl sm:text-3xl`, the subtext `text-sm sm:text-base
  font-medium text-slate-500`; the social buttons `text-[16px]` +
  `hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm` + the `-ml-4`
  icon wrapper; the OR chip (`bg-white px-3 font-medium tracking-wider
  text-slate-500`, literal "or" under `text-xs uppercase`); the form
  `space-y-4 sm:space-y-5` with the fields group (`space-y-3
  sm:space-y-4`) and the actions group (`space-y-3`); the footer row
  `flex flex-col items-center justify-between gap-2 sm:flex-row sm:gap-0`
  INSIDE the actions group; the submit `h-11 sm:h-12 px-3 py-2 … shadow-sm
  … transition-all duration-200` (keeping the v11 3px white outline). The
  signup surface rode the same grammar (English labels "Full name" /
  "Verification code", the same submit family, the alert boxes).
- **B3 shipped:** the forgot screen rebuilt (back-at-top `w-fit … -mb-2` +
  lucide-arrow-left, H2 `text-2xl font-bold` "Reset your password", the
  16px slate-600 subtext, the `compact` AuthInput — `h-10 sm:h-11` +
  `placeholder:text-slate-400` — and "Send reset link" `h-10 sm:h-11`);
  the sent screen built to the measured anatomy (the `h-14 w-14 sm:h-16
  sm:w-16 bg-slate-100` circle + lucide-mail, the `text-sm sm:text-base`
  copy with the email as `font-medium text-slate-900`, the green Alert,
  the w-full back); the in-app reset link rides INSIDE the green alert
  (`data-testid="inapp-reset-link"`) — the in-card token screen retired;
  the flow lands on /reset-password?token=… like the email link would.
- **B4 shipped:** the /reset-password page rebuilt to the platform
  template — the `bg-white` page (no vx-auth-page gradient), the
  `rounded-lg … shadow-lg bg-white overflow-hidden` card + the 2px
  `bg-gray-900` strip, the gray palette (`border-gray-200 bg-gray-50/50` +
  `focus:border-gray-400 focus:ring-gray-400` + lucide-lock
  `text-gray-400`), "Set new password" + "Enter your new password for
  VeloxPOS", New Password + Confirm New Password (`pl-10 h-11`), the
  `text-xs text-gray-500` helper, the client gates ("Password must be at
  least 8 characters" / "Passwords do not match"), the `h-11 bg-gray-900`
  submit, "Back to login" `w-full text-sm text-gray-600`, and the
  no/invalid-token "Invalid Reset Link" state (the `w-20 h-20 bg-red-100`
  circle + lucide-circle-alert + the standard button); a failed reset
  (404) renders the same invalid state; success redirects to /login.
- **B5 shipped:** the shadcn Alert family on every auth note — AuthError
  (`border-red-200 bg-red-50/70 p-4 rounded-xl` + `text-sm
  leading-relaxed text-red-700`), the green sent note, the neutral slate
  social notice (the clone's superset affordance, disclosed); the login
  error renders between the fields group and the actions group (the
  reference's position).
- **Legacy pin alignment (updated, not weakened):** the v4 social-height
  e2e pin 50→54px (+ the 16px font assertion — the 16px text's 24px line);
  the auth.spec copy pins ("or" literal + the English social notice); the
  v4/v11 unit pins all held (substring-compatible: `hover:shadow` matches
  `hover:shadow-sm`, `sm:h-12` matches the responsive submit, the focus
  families untouched).
- **Gate: lint 0 · tsc 0 · build ✓ · unit 429/429 (397+32) · e2e 153/153
  (139+14).** Docs lockstep: AGENTS.md contract 25, CLAUDE.md counts +
  the v12 block, README badge (429+153), PAD v2.0.0 + ADR-022 + §8
  counts, retail-pos_SKILL.md v1.7.0 (+ the §4 auth-chrome rows),
  session_17.md, worklog, this plan.
- **Evidence:** all 18 screenshots regenerated from the production
  standalone build + 5 new auth-surface shots (desktop-forgot-password,
  desktop-sent, desktop-reset-password, desktop-reset-invalid,
  mobile-login); live parity probes — the hairline pixel-identical
  (4×rgb(203,213,225) vs 4×rgb(202,213,226), oklab rounding), the H1
  24/30px, the social 54px/16px, the submit 44/48px, the footer row
  side-by-side with Forgot at x=456 (the content's left edge, both apps),
  the forgot H2 24px + 44px inputs + the back 12px above the H2, the
  sent circle 64px + the alert 12px radius/p-4, the reset strip 2px + the
  English labels; a full scratch-user reset round-trip (register →
  verify → forgot → token from the e2e db → reset → login with the new
  password) green in the e2e.
- **Probe lessons recorded:** (1) the e2e webServer REUSES a running
  :3100 server — a leftover probe server makes the setup authenticate
  against the WRONG db (kill :3100 before e2e); (2) `transition-all
  duration-200` animates through viewport changes — settle-wait ~350ms
  before measuring heights; (3) Tailwind v4 resolves palette colors
  through oklab()/lab() — probe-compare or assert the alpha ("/ 0.7)"),
  never literal rgb; (4) login gates UNVERIFIED accounts — scratch-user
  flows must complete the verify step (the OTP rides the register
  response); (5) resetting the OWNER mid-suite bumps tokenVersion and
  kills the storageState session — always a scratch user; (6)
  `page.evaluate` runs in the BROWSER context — Node-side consts are not
  in scope (inline the selectors); (7) the VLM claimed the clone's
  hairline was missing — the pixel crop settled it (v10's "VLM needs
  pixel settlement" lesson, again).
