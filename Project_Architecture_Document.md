# VeloxPOS (`retail-pos`) — Master Project Architecture Document (PAD) v2.15.0

> Generated per the `skills/project-architecture-document-md` canonical
> section order. Evidence labels: **Verified** (executed/observed in this
> workspace), **Reasoned** (inference from code), **Assumed** (stated
> decision). Companion: `docs/reference-investigation.md` (the reference
> dossier), `docs/implementation-plan.md` (the replication plan),
> `docs/remediation-plan-v3.md` (the executed remediation record),
> `AGENTS.md` (agent gotchas), `worklog.md` (session journal).
>
> v1.1.0 (2026-10-26): the remediation-plan-v3 execution — security
> hardening (R1), data integrity (R2), visual parity (R3), hygiene (R4);
> ADR-011..013 added; §6 controls extended.
>
> v1.2.0 (2026-10-26): the remediation-plan-v4 execution — the deep
> visual-parity sweep (computed-style probes against the live reference):
> native Tailwind radius scale, the reference card system (vx-card), the
> glass-button gradient action system, the translucent-violet active nav
> pill, StatCard blob anatomy + row-layout reports cards, official social
> brand marks + hosted logo PNG on the auth surface, the `/Inventory` route
> alignment, and the reference's own lucide nav icons; ADR-014 added.
>
> v1.3.0 (2026-10-26): the remediation-plan-v5 execution — the
> view-internals parity sweep (24-item live probe ledger): the flush shell
> gutter (ml-[220px]/[68px]; H1 at x=244), the full-bleed Terminal (two-pane
> h-screen layout with the border-l ticket RAIL, the transient emerald
> "Agregado" banner, the 12px uppercase Ticket header, ShoppingBag COBRAR,
> the muted empty-state card), the reference table system (slate-50
> hairlines + white/40 hover + slate-600 body + mono indigo ticket cells),
> the two-shape StatusPill (6px soft table badges vs the register-card
> round pill), 12px transparent form controls, the reference's neutral
> `--secondary` token, tinted (non-gradient) reports chips, the Reports
> bright H1, the reference dashboard grids, settings parity (max-w-4xl,
> 54px Guardar, glass category chips), and the button.tsx study-remnant
> purge; ADR-015 added.
>
> v1.4.0 (2026-10-26): the remediation-plan-v6 execution — the
> functional-superset completion + document-head suite: the Unidad options
> completed to the reference's six (+ Servicio superset), product photos
> and the store logo stored as client-resized data URLs
> (`src/lib/image.ts`), every mutation failure surfaced through the
> toaster (the four silent `void err` deletes), the Ventas mail action as
> a fully-formed `mailto:` (`src/lib/ticket-mail.ts`), the 42px dialog
> button contract with the cva `glass` variant (F6 — the variant utilities
> were clobbering the glass fills), the sidebar tile's violet glow, the
> reference's head suite (title/description/OG/Twitter/apple/manifest +
> the app-router icon convention + the generated og-image), and the total
> sf-* token purge across the remaining UI primitives (switch, toast,
> badge, card, skeleton, progress, checkbox, slider); ADR-016 added.
>
> v1.5.0 (2026-10-26): the remediation-plan-v7 execution — the per-route
> title system (the reference titles EVERY route; v6 had measured only the
> root): `DOCUMENT_TITLES` + `documentTitleForPath()` in the router, the
> shell's view-synced title effect, the signup layout metadata, and the
> 404 slug title through a guarded MutationObserver (Next's client
> metadata manager re-applies the root title ~0-50ms after mount); the
> image "Quitar" clear path fixed to a REAL server-side clear
> (`imageUrl: null` + schema `.nullable()` — undefined keys never ride the
> PATCH); the product-dialog numeric fields converted to the reference's
> `type="number"` with steps; and the Ajustes logo preview (the 56px
> pending/stored render + a Quitar that PATCHes null — the v6 plan had
> promised a preview that never shipped); ADR-017 added.

> v1.6.0 (2026-10-26): the remediation-plan-v8 execution — the auth
> deep-link round-trip + the measured dialog/modal sweep: the 401 gate
> carries `from_url` and login returns to the deep-linked route through
> `safeReturnTo` (same-origin only, fail-closed — the reference's
> round-trip, live-measured); the Ventas ticket modal rebuilt to the
> reference's layout (2×2 stacked meta grid, `{qty}x` lines, light slate
> dividers, the 18px bold Total — its own slate-800 Total color disclosed
> as unreadable, SD-18); the mail action prompts "Enviar ticket a:"
> before the pre-addressed mailto: (SD-19); the Ajustes colors pair each
> swatch with an editable hex input; and every dialog measured to the
> reference's `#0f121a`/`#e7e9ef` chrome with dropdown panels at
> `#161922`; ADR-018 added.

> v1.8.0 (2026-10-27): the remediation-plan-v10 execution — the donut
> family + the seeded-data parity sweep: the category donut is rebuilt to
> the reference's fully-measured recharts rendering (`sectorPath()` filled
> sector paths, ring innerR 50 / outerR 80 at (166.5, 100) in the 333×200
> viewBox, sectors counterclockwise from 3 o'clock with a trailing 4°
> gap, #fff 1px strokes, the measured #6366f1→#ddd6fe + #22c55e palette,
> and the legend capped at the FIRST 5 rows stacked below the chart with
> slate-600/slate-700 rows and 12px swatches — the v5-era "donut palette
> unobservable" disclosure closes); the low-stock header gap is the
> ref's 12px (mb-3); the Ajustes section headers adopt the ref's
> per-section icons (Store/indigo, Palette/purple, FileText/green,
> CreditCard/blue, Tag/amber at w-5 h-5); the SEED mirrors the reference
> account's observable state exactly (the ref's product page order with
> the real 12th row "Jabón Zote 400g"/7501025403010/stock 19, Caja 2
> before Caja 1, the two sales at the ref's exact datetimes 19/04/2026
> 22:09 + 14/03/2026 01:45 with the second's real items 1x Jabón Zote +
> 1x Papel Higiénico → the dashboard chart renders flat and the reports
> render "Sin datos en este período" like the reference); every list
> orders `[{createdAt asc},{id asc}]` (deterministic against SQLite tie
> order); and the reports X-ticks adopt the ref's measured rule (≤14-day
> windows label every day; longer windows step ceil((count-1)/9) from
> the window start, last day not force-labeled); ADR-020 added.
> v1.9.0 (2026-10-27): the remediation-plan-v11 execution — the chart
> CONTAINER geometry (the reference's recharts ResponsiveContainers
> re-wrap the viewBox to the container width with FIXED per-surface
> heights — dashboard 280 / reports 220 / donut 200 — and a FIXED donut
> ring innerR 50/outerR 80 at cx = box/2 capped 333; the clone's
> aspect-locked 640×260/640×280/333×200 boxes rendered at the wrong size
> at every viewport), the form-control chrome family (the reference's
> focus grammar: app controls ring-1 in the #7f62f4 edge with no offset,
> --ring/--primary 127 98 244, --background 15 18 26 the shadcn surface
> under the body's #080a14 canvas, --border 38 42 54, the Switch's solid
> ring-2 + offset-2, the glass buttons' violet browser-outline focus with
> the cva ring classes retired, the auth surface's own slate-400 focus
> over a WHITE --background scope with the measured pl-10 / h-11 sm:h-12
> / md:text-sm / slate-600 placeholders and the 3px white submit
> outline, Input/Textarea text-base md:text-sm + shadow-sm bases, the
> 12px SelectTrigger with the 6px dropdown panel, and the 4px mt-1
> label→control gap), and the measured chart tooltip (the recharts
> default skin — white card, 12px radius, 10px padding, 0 4px 20px
> shadow — with readable dark text, the SD-18 precedent: the reference's
> own tooltip text is #e7e9ef-on-white, unreadable); ADR-021 added.
> v2.0.0 (2026-10-27): the remediation-plan-v12 execution — the auth
> surface family measured BELOW the card for the first time: the auth
> card chrome (the 4px slate gradient hairline at the card's top edge +
> overflow-hidden + the `md:pt-12 md:pb-10 md:px-10` padding step + the
> space-y-6/8 text-center column), the login typography + layout grammar
> (the responsive H1 `text-2xl sm:text-3xl` and subtext `text-sm
> sm:text-base font-medium`, the 16px social buttons with the `-ml-4`
> icon optical offset, the shadcn-Separator OR chip with the literal
> "or", the sm-stepped form groups, the Forgot/Sign-up footer ROW inside
> the form, and the `h-11 sm:h-12` submit), the forgot/sent screens
> rebuilt to the reference's ENGLISH family (the back-at-top `-mb-2`, the
> 24px H2, the smaller `h-10 sm:h-11` controls, the sent screen's
> slate-100 icon circle + green alert with the in-app reset link riding
> inside it as the no-SMTP superset — the in-card token screen retired,
> the flow landing on /reset-password like the email link would), the
> /reset-password page rebuilt to the base44 PLATFORM template (the
> plain-white page, the rounded-lg shadow-lg card with the 2px
> bg-gray-900 top strip, the gray palette, the New Password + Confirm
> pair at h-11, the 8-char helper, and the no/invalid-token "Invalid
> Reset Link" state), and the shadcn Alert family adopted for every
> auth error/success note (bg-X-50/70 border-X-200 rounded-xl p-4 +
> text-X-700 text-sm leading-relaxed); ADR-022 added.
> v2.5.0 (2026-10-27): the remediation-plan-v17 execution — the Core
> Web Vitals pass (session_25's next-cycle suggestion) + the
> task-mandated mobile-navigation re-verification + the fresh Tailwind
> v4 sweep. The mobile drawer contract re-verified LIVE end-to-end
> (390×844 + the short-viewport 390×480): 288px panel, `enter 0.2s`,
> 44px pitch, Esc/backdrop/route close, focus in/out, body scroll lock,
> inside-panel scroll with the last link reachable, zero horizontal
> overflow on all 8 routes — and the reference re-confirmed to ship NO
> mobile menu (its 220px sidebar squeezes main to 170px at 390). The
> CWV measurements (Lighthouse 13, desktop, docs/lighthouse/): the
> clone's login 86/100/100/100 (LCP 2.4s) vs the reference's login 51
> (LCP 14.4s, 2,314 KiB — the clone ships 314 KiB, 7× lighter); the
> authed dashboard measured 54 (TBT 550ms, LCP 3.7s) — the actionable
> finding F2: page.tsx statically imported ALL 8 views (69 KiB gz
> unused on any single surface). The fix (ADR-027): the lazy view
> registry — VIEW_LOADERS (one dynamic import() per view) through
> React.lazy with the boot effect prefetching the ACTIVE view's chunk
> in parallel with auth/me + the pre-warm; the split took the authed
> dashboard to TBT 280ms / perf 67 (+13). The stale study-app
> Lighthouse reports (localhost:3200, 2026-10-18) deleted and replaced
> by the v17 set + the methodology README (the CDP-incognito lesson:
> authed Lighthouse runs need --extra-headers Cookie; a --port attach
> silently measures the logged-out bounce). The dashboard's Lighthouse
> a11y 94 decomposed into the disclosed color-contrast family +
> heading-order (H1→h3 — measured IDENTICAL on the reference
> 2026-10-27; parity wins, no fix). The react-dom boot cost (~890ms)
> recorded as the framework floor. ADR-027 added.
>
> v2.6.0 (2026-10-27): the remediation-plan-v18 execution — the
> error-recovery architecture pass. The audit reproduced the V17 lazy
> registry's one unowned failure mode LIVE (a Playwright route-abort of
> a view chunk): a failed dynamic import unmounted the ENTIRE app to
> Next 16's built-in ENGLISH dead-end screen ("This page couldn't
> load") with the exact Turbopack message captured
> (`ChunkLoadError: Failed to load chunk /_next/static/chunks/….js
> from module N`) — and the boundary census found NO error.tsx, NO
> global-error.tsx, NO class boundary anywhere. The fix (ADR-028, the
> neo-crm session-170 pattern ported): the pure injectable seam
> `src/lib/chunk-recovery.ts` (the stale-chunk message family incl.
> the Turbopack form, the 10s cooldown arithmetic, the guarded reload
> with the flag-written-BEFORE-reload loop guard, the
> `veloxpos:chunk-reload-at` sessionStorage namespace), the in-page
> `ViewErrorBoundary` wrapping the Suspense (the SHELL survives; the
> Spanish "No se pudo cargar la vista" card + "Reintentar"; the
> epoch-keyed fresh-registry retry because React.lazy caches rejected
> initializers forever), and the two outer nets (src/app/error.tsx +
> src/app/global-error.tsx, Spanish, self-healing, zero component-tree
> imports). Measured runtime reality: a SINGLE aborted chunk fetch
> never reaches the boundary (the bundler runtime retries internally);
> the card is the surface for failures persisting past the runtime
> retry budget. Also this cycle: the reference state re-checked
> (unchanged — nothing new to mirror), the mobile drawer contract
> re-verified live again, the INP measurement session_27 suggested
> (5-14ms median click→ticket-paint — no action), and one observed
> e2e flake whose failure shape matches a transient chunk failure
> (the self-heal now covers that path). Gates: 509/509 unit (486+23,
> 35 files) + 179/179 e2e (176+3). ADR-028 added.
>
> v2.9.0 (2026-10-28): the remediation-plan-v22 execution — the
> account-security loop closed end-to-end. The audit found the
> reference UNCHANGED for the 7th consecutive cycle (nothing new to
> mirror; the mobile 390px posture identical), the baseline green
> (529+187 — the only failure all session was the sandbox's
> Playwright browser-binary mismatch, fixed with `playwright install
> chromium`, zero code changes), and the clone's mobile drawer
> re-verified live. THREE real findings drove the cycle: (F1) the four
> ADR-030 account-security routes — tested, rate-limited,
> password-first — remained UI-less (the V21 session's own suggested
> next step); (F2) the signup verify stage DISCARDED the register
> response's verification code (in the no-SMTP self-hosted delivery
> model the user could never see their code — signup verification was
> UI-unusable on a fresh install, despite the route's comment naming
> "the verify screen's self-hosted code note" as the delivery
> surface); (F3) the login 403 told an unverified user to "check your
> email" that never arrives, with no resend affordance — a dead end
> whose only escape (re-registering) was undiscoverable. The fix
> (ADR-031): the "Mi Cuenta" SectionCard in Ajustes (sixth section,
> ShieldCheck/rose-500 — the measured icon family extended; the
> identity readout from /api/auth/me with the Verificada badge; the
> change-password / change-email dialogs in the measured Dialog
> family; the destructive delete via the new `glass-button-danger`
> utility — the warning-ramp extension precedent), the signup code
> note (the slate-Alert family), and the login 403 verify sub-card
> (code entry + "Resend the code" + the delivered/neutral note — a
> plain DIV, never a nested form: HTML forbids `<form>` in `<form>`
> and hydration silently kills the inner submit — the cycle's
> hard-won lesson, reproduced live before the fix). `AppUser` gained
> `emailVerified` (the API already returned it). Also: PAD
> Known-Issue #7 closed as a docs-truth row (next.config.ts sets no
> `ignoreBuildErrors` — the row described a flag retired in an
> earlier cycle), and the v10 Ajustes icon pin extended to the
> six-section superset. Pinned by `tests/account-ui.test.ts` (13
> source pins, RED 12/13 pre-fix) + `tests/e2e/account-ui.spec.ts` (9
> behavioral tests; the verify bucket isolated via the H3 xff
> precedent — the shared localhost verify budget runs at exactly
> 10/15min). Gates: 542/542 unit (529+13, 38 files) + 196/196 e2e
> (187+9, 3.5m). ADR-031 added; Known-Issue #7 CLOSED.
>
> v2.10.0 (2026-10-28): the remediation-plan-v23 execution — the
> profile/name-edit superset, the account-surface family's completion.
> The audit found the reference UNCHANGED for the 8th consecutive
> cycle (every view's data state identical; at 390px still no
> hamburger, 220px sidebar, main 170px, viewport-locked; no account
> surface anywhere — its sidebar bottom is the collapse chevron
> alone), the baseline green exactly as V22 closed it (542+196,
> first-try), and the V22 additions verified LIVE end-to-end this
> cycle (the signup code note → the login-403 verify card → the
> resend → the verify journey into the app, plus the Mi Cuenta
> readout at desktop and 390px — a scratch account, deleted after).
> The ONE finding (the V22 session log's own suggested next step):
> the account's `fullName` renders in the Mi Cuenta readout but
> NOTHING can change it — no route accepts an update, no dialog
> offers the edit. The fix (ADR-032): `POST /api/auth/update-profile`
> (the change-email family shape — requireUser, per-user rate limit
> 10/15min, Zod trim/min-1/max-100, the route-side must-differ 400,
> the publicUser envelope — and DELIBERATELY no password proof:
> fullName is a benign display field, the store-settings-PATCH
> posture, not the credential-rotation posture) + the "Cambiar
> nombre" dialog (the fourth Mi Cuenta action, between the email
> rotation and the destructive exit; prefilled with the current name;
> the onChanged seam patches the readout). The two V22 action pins
> grew to the four-action superset (extend, never weaken). The
> V21 route-count pin caught the new route exactly as designed —
> DEPLOYMENT.md's count now reads 28 and §10 documents the fifth
> endpoint. neo-crm UNCHANGED since the V22 review (HEAD `facdd56`
> = the session-194 log commit on `6d655f9`). Pinned by
> `tests/account-ui.test.ts` (8 new source pins, RED 9/21 pre-fix)
> + `tests/e2e/account-ui.spec.ts` (1 new behavioral test — the name
> round-trip with a fresh-context /api/auth/me assertion). Gates:
> 550/550 unit (542+8, 38 files) + 197/197 e2e (196+1, 3.4m).
> ADR-032 added.
>
> v2.11.0 (2026-10-28): the remediation-plan-v24 execution — the
> gate-coverage truth pass (ADR-033). The audit found the reference
> UNCHANGED for the 9th consecutive cycle (every view's data state
> identical; at 390px still no hamburger, nav 219px, viewport-locked;
> Ajustes = exactly the five store sections), the baseline green
> exactly as V23 closed it (550+197, first-try), the mobile drawer
> contract live-verified at 390×844 (aria cycle, scroll lock, 8 links
> at the uniform 44px pitch, Esc + focus return — the Tailwind v4
> trap suite green, 9th consecutive confirmation), and the V23
> additions working live (the four-action row, the prefilled Cambiar
> nombre dialog). The rotation trigger: neo-crm ADVANCED by one
> material commit — session-195, "THE 404 GATE-COVERAGE PINS" — whose
> doctrine this cycle adopted: a shipped behavioral claim that a doc
> or a consumer leans on, but that no standing assertion pins, is a
> latent regression. Four such claims found here (F1 the true-HTTP-404
> status unpinned — both tests reached the surface via `page.goto`,
> which tolerates any status; F2 the public 404 surface outside the
> a11y smoke's register; F3 the e2e webServer child env inheriting
> stray parent-shell auth-behavior exports; F4 the /api/health body
> contract with three documented consumers and zero assertions) + a
> fifth the RED run itself surfaced (F5: the e2e AUTH_SECRET was
> 62-hex under the S22 comment's "64-hex" claim). The fixes: the
> status line pinned inside navigation's existing 404 test; the 404
> registered in the a11y smoke at BOTH widths (the logged-out
> anon-surface form); `/api/health`'s body pinned by its own spec;
> `RESET_INAPP_DELIVERY: ""` + `AUTH_PROXY_HOPS: "0"` pinned after
> the webServer's `...process.env` spread (the neo-crm N-69a "the dev
> server lies" family — the determinism proven BOTH ways live: a
> stray `RESET_INAPP_DELIVERY=1` standalone boot hands out the
> one-shot reset token in the production response, while the suite
> with the same stray exports stays 6/6 green); a genuine 64-hex
> AUTH_SECRET; and the harness's own contract frozen by the NEW
> `tests/e2e-harness.test.ts` (6 source pins — the isolated e2e.db,
> NODE_ENV=production, the 64-hex shape, the two knob pins RED
> first, the seed-identity pinning). Gates: 556/556 unit (550+6,
> 39 files) + 199/199 e2e (197+2, 3.5m). ADR-033 added.
>
> v2.15.0 (2026-10-28): the remediation-plan-v28 execution — the
> shipped-artifacts truth pass (ADR-037). The audit found the reference
> UNCHANGED for the 13th consecutive cycle (identical data state; at
> 390px still no hamburger — the two aria-expanded buttons are the
> Radix Select comboboxes; viewport-locked), the baseline green exactly
> as V27 closed it (568+203, first-try on a fresh rebuilt clone after
> the chromium-1243 install — the same infra miss as V27's session),
> the mobile drawer spine re-measured live EXACTLY matching the frozen
> ledger (13th consecutive confirmation of the absent Tailwind v4
> mobile-menu trap), the citation sweep clean (19 test citations in
> src/, all resolve), neo-crm ADVANCED by exactly one commit
> (`316fbe2` → `769ba13`) whose entire diff is the raw session_415
> transcript of the ALREADY-ADOPTED session-196 spine-freeze work (no
> new doctrine), and the V27 title-guard probe re-run 12/12 clean in
> the fresh environment. The cycle's two findings, one family: F1 —
> AGENTS.md §15 and SKILL.md claimed the head assets "regenerate via
> a generate-head-assets repo script", a file with an EMPTY git log
> --all (the v6 workspace's generator never shipped); the standing
> script-reference pin scanned DEPLOYMENT.md ONLY, which is exactly how
> the stale claim survived 22 cycles. F2 — the web-application skill's
> §2 dead-dependency census, run for the first time in this repo, found
> FOUR dead riders: @radix-ui/react-radio-group,
> @radix-ui/react-scroll-area, @radix-ui/react-toast (the repo's
> toaster is the custom zustand build), and bun-types (empirically
> dead — tsc --noEmit passes with the package physically removed).
> The cures, both mutation-proven: the truthful asset-provenance
> statement replaces the regeneration claim in both docs + the
> deployment-surfaces pin's block 10 now iterates the SIX live
> operational docs (README/AGENTS/CLAUDE/PAD/SKILL/DEPLOYMENT.md —
> historical session logs and executed plans stay out of scope by
> design); and `bun remove` retires the four dead packages (package.json
> + bun.lock move together) + a NEW `tests/dependency-census.test.ts`
> freezes the census (every manifest package earns a live string
> reference across the executable surface or an explicit INFRA
> allowlist row — react-dom the Next runtime peer, @types/react and
> @types/react-dom the TSX compilation layer; the census file itself is
> excluded from its own surface — a census must not count its
> instrument as evidence). Born-RED exactly as designed (the doc pin
> RED on both generate-head-assets citations; the census RED on all
> four dead packages), fixes, GREEN; planted-bogus-script-reference and
> planted-fake-package mutations flip the pins RED at the exact
> targets. A bonus count-lockstep sweep caught a V27 residual (two
> SKILL command-block lines still read 201/201 — swept to 203/203).
> Gates: 577/577 unit (43 files, 568+9) + 203/203 e2e (3.6m, zero
> flakes). ADR-037 added.
>
> v2.14.0 (2026-10-28): the remediation-plan-v27 execution — the shell
> title-guard pass (ADR-036, the F2-flake-watch family root-caused and
> closed). The audit found the reference UNCHANGED for the 12th
> consecutive cycle (identical data state; at 390px still no hamburger —
> the two aria-expanded buttons found are Radix Select comboboxes, not
> nav controls; viewport-locked; Ajustes = exactly the five store
> sections), the baseline green exactly as V26 closed it (563+201,
> first-try on a fresh rebuilt clone after the chromium binary install —
> an infra miss, not a code failure), the mobile drawer spine re-measured
> live EXACTLY matching the frozen ledger (12th consecutive confirmation
> of the absent Tailwind v4 mobile-menu trap), the citation sweep clean
> (17 test citations in src/, all resolve — the V26 instrument re-run),
> and neo-crm UNCHANGED at `316fbe2`. The cycle's finding came from the
> repo's own audit: F1 — the shell's title effect in `src/app/page.tsx`
> was a BARE effect write racing Next's client metadata manager, the
> live root cause of the v9 Spanish-alias title flake (1 occurrence in
> V18, 1 in V26, a 9-cycle known-open watch that outlived its V18
> hypothesis). The probe (`scripts/probe-v27-title-race.ts`, committed —
> self-contained: standalone server on :3102, native-fetch login, a
> title recorder via a Document.prototype setter patch + a
> documentElement MutationObserver attached by 1ms poll because
> documentElement is NULL at init-script time, diagnosed live)
> quantified the race: the manager re-applies the root layout title 5-6
> times per boot (last write ~295ms post-commit) and the shell's write
> lands as little as 9ms after it — under full-suite load variance the
> order flips and the clobber is permanent (a bare effect never
> re-fires). The cure is the repo's own v7 fix for the IDENTICAL race on
> the 404 surface (`src/app/not-found-title.tsx` — the guarded
> MutationObserver that "wins the last write"), ported to the shell:
> apply-when-different, observe document.head, disconnect on cleanup.
> TDD born-RED (the unit source pins 4 RED; the e2e controlled-clobber
> pins 2 RED — a page.evaluate title write after ready sticks forever on
> the bare tree), fix, GREEN; MUTATION-PROVEN (planted bare-write
> regression → unit 4 RED + e2e 2 RED; restored → GREEN). Gates:
> 568/568 unit (42 files, 563+5) + 203/203 e2e (201+2, 3.6m, zero
> flakes). ADR-036 added.
>
> v2.13.0 (2026-10-28): the remediation-plan-v26 execution — the
> failure-path truth pass (ADR-035, the ADR-033 gate-coverage doctrine
> continued at the unit layer). The audit found the reference UNCHANGED
> for the 11th consecutive cycle (identical data state; at 390px still
> no hamburger, viewport-locked; Ajustes = exactly the five store
> sections), the baseline green exactly as V25 closed it (556+201,
> first-try on a fresh clone), the mobile drawer spine re-measured live
> EXACTLY matching the frozen ledger (11th consecutive confirmation of
> the absent Tailwind v4 mobile-menu trap), and neo-crm UNCHANGED at
> `316fbe2` (no new doctrine — the cycle's target came from the repo's
> own audit). Two findings in the ADR-033 family: F1 the health
> endpoint's DEGRADED branch (catch → 503 + the degraded body) carried
> zero standing assertions — a known-open disclosure held since V24 on
> an E2E-layer objection ("forcing it means breaking the DB mid-suite")
> that dissolves at the unit layer via `vi.mock("@/lib/db")` (the mock
> is hoisted above the import — the PrismaClient is never constructed;
> feasibility prototyped 2/2, then deleted); the Docker healthcheck's
> `r.ok?0:1` is the consumer that leans on the 503 (a 200-with-
> degraded-body regression would report a broken-DB container as
> HEALTHY with every gate green). F2 the boot-guard WIRING (`register()`
> → console.error + `process.exit(1)` on fatal) carried zero assertions
> while `src/instrumentation.ts`'s own comment claimed "pinned by
> tests/e2e/s22-boot-guard.spec.ts" — a spec deleted in the V1 pivot
> (`0b78972`, the study-layer archive) and never replaced: the claim
> was FALSE today (the repo-wide citation sweep — 16 test citations in
> src/, 15 resolved, 1 stale — is the audit's new instrument). Both
> pinned by two new unit files (`tests/health-route.test.ts`, 2 tests;
> `tests/boot-guard-wiring.test.ts`, 5 tests over the SPIED console +
> process.exit — never a real exit) with the stale citation re-pointed
> at the real pin. Both MUTATION-PROVEN (the planted 503→200 defect went
> RED at the status assertion — the Docker-healthcheck-blindness shape;
> the planted exit→throw defect — the comment's own documented
> regression — went RED at both fatal-path tests while the pure-seam
> env-check pins stayed green, the battery gap demonstrated; restored →
> GREEN both). Gates: 563/563 unit (41 files, 556+7) + 201/201 e2e
> (unchanged; one full-suite flake (the v9 Spanish-alias title test)
> re-run green alone then 201/201 on the suite re-run). ADR-035 added.
>
> v2.12.0 (2026-10-28): the remediation-plan-v25 execution — the
> drawer-contract completion (ADR-034, the drawer-open spine freeze).
> The audit found the reference UNCHANGED for the 10th consecutive
> cycle (identical data state across every view; at 390px still no
> hamburger, nav 220px, viewport-locked; Ajustes = exactly the five
> store sections), the baseline green exactly as V24 closed it
> (556+199, first-try on a fresh clone: install, db:push, db:seed,
> chromium, then the full ladder), the mobile drawer contract
> live-verified at 390×844 (the Tailwind v4 trap suite green, 10th
> consecutive confirmation), and the drawer-open SPINE measured live
> for the first time as a complete ledger (agent-browser walk: panel
> [0,0,288,844] · header [0,0,287,69] · nav [0,69,287,727] · footer
> [0,796,287,48] · close [235,16,36,36] · 8 links at [12,y,263,40]
> y=81+44k — perfectly regular and fully integral). The rotation
> trigger: neo-crm ADVANCED by one material commit — session-196,
> "THE DRAWER-OPEN SPINE FREEZE" — the s195a1 wire-freeze doctrine's
> next member: the drawer-open geometry carried only behavior pins
> (panel size, pitch uniformity, close paths, focus) while the FULL
> box ledger was unpinned; a computed-margin regression (an mb-*
> re-entering the flex column — the trap-4 family) would cascade
> through every box with every gate green. Two gaps mapped and pinned
> here (F1 the spine ledger itself; F2 the lg-breakpoint close —
> mobile-chrome's matchMedia listener, live-verified working both
> directions but never exercised by any e2e). Both pins live in
> mobile-navigation.spec.ts (born-green) with the session-196
> mutation proof executed: a planted `mb-2` on the drawer header went
> RED at the nav/link/footer boxes (nav y 69→77, links +8) while the
> OTHER 11 drawer tests stayed green — the battery gap demonstrated
> live; restored → GREEN. The RED run also caught two first-draft
> pin defects (a transcribed first-link y of 12 vs the measured 81;
> a `toHaveCount(0)` on the lg:hidden hamburger where `display:none`
> keeps the element in the DOM — `toBeHidden` is the correct
> assertion). Gates: 556/556 unit (39 files, unchanged) + 201/201
> e2e (199+2, 3.5m). ADR-034 added.
>
> v2.8.0 (2026-10-27): the remediation-plan-v21 execution — the
> deployment-surface truth pass, closing Known-Issue #6 for real. The
> audit found the reference UNCHANGED for the 6th consecutive cycle
> (nothing new to mirror), the baseline green first-try (513+179, no
> flake occurrence), and the one never-actioned PAD row rotting in
> plain sight: the deployment surfaces still carried the scaffold's
> identity — and `docs/DEPLOYMENT.md` documented a DIFFERENT app
> ("ORBITAL" in its opening line, StudyFlow-only features (/rum
> diagnostics, /export + /import data portability, a Settings→Profile
> UI) that do not ship here, a missing smoke-test.sh, "16 route
> handlers" vs the real 27, a dead layout-sim script reference, and
> the `studyflow` compose service). The fix (ADR-030): Dockerfile +
> docker-compose rebranded (service `veloxpos`, image
> `veloxpos:latest`, `VELOXPOS_PORT`), DEPLOYMENT.md rewritten to the
> ACTUAL app (the real env contract, the real verification commands,
> the live route count, the account-security API §10), and the four
> scaffold account-security routes (change-password / change-email /
> delete-account / resend-verification — real, rate-limited,
> password-first endpoints the reference lacks entirely) kept as the
> disclosed API-only superset with their scaffold-colliding comments
> de-cited to ADR-030 and their contracts pinned end-to-end by the new
> `tests/e2e/account-security.spec.ts` (they had shipped with ZERO
> coverage). Also: `package-lock.json` removed (single lockfile =
> bun.lock), `tests/deployment-surfaces.test.ts` (16 source pins)
> mechanically guards every surface, the mobile drawer contract
> re-verified live at 390×844 (10/10 via the v21 self-contained
> probe) with the fresh v21-* evidence set. Gates: 529/529 unit
> (513+16, 37 files) + 187/187 e2e (179+8). ADR-030 added;
> Known-Issue #6 CLOSED.
>
> v2.7.0 (2026-10-27): the remediation-plan-v20 execution — the
> screen-reader announcement on the recovery cards. The V19 cycle
> recorded F1 informational (the three V18 failure surfaces mount
> silently — a screen-reader user discovers a failed view only on
> next browse); both session logs suggested it as the next cycle's
> optional target, and the operator's production-ready-superset
> mandate plus the WCAG 2.2 AA baseline call for dynamic error
> messages that announce. The fix (ADR-029): `role="alert"` on the
> card element that MOUNTS with the failure in all three surfaces —
> the view card (`page.tsx`'s `view-error-card` div), the segment
> card (`error.tsx`'s inner `vx-card` div), the root card
> (`global-error.tsx`'s `global-error-card` div) — LANDMARK-SAFE (the
> role never rides the `<main>` wrapper: one role per element,
> `role="alert"` on main would delete the main landmark). Pinned
> TDD-first: `tests/recovery-a11y.test.ts` (4 source pins — presence
> ×3 + the landmark guard) written RED, then the fix, then GREEN;
> the v18 SHELL SURVIVAL e2e gained the live failure-path assertion
> (`view-error-card` → role="alert"). A disclosed superset: the
> reference ships no recovery surface at all, and neo-crm's own cards
> carry no role (no commit there since 2026-10-22). Also this cycle:
> the reference state re-checked (unchanged — 5th consecutive cycle,
> nothing new to mirror), the mobile drawer contract re-verified live
> at 390×844 (10/10 via `scripts/probe-v20-mobile-recovery.ts`, the
> self-contained probe pattern), the Tailwind v4 sweep clean (95
> pins, no trap surfaces), the V20 evidence set captured
> (`v20-mobile-drawer-open-390.png`, `v20-view-recovery-card-390.png`,
> `v20-view-recovery-healed-390.png`), one load-timing e2e flake
> recorded (v7 M1 under full-suite load — passed isolated AND on the
> full re-run; the F2 watch gains a data point, no speculative
> patch), and the stale PAD title version fixed (it read v2.0.0
> through the v2.1.0–v2.6.0 era). Gates: 513/513 unit (509+4, 36
> files) + 179/179 e2e. ADR-029 added.
> v2.4.0 (2026-10-27): the remediation-plan-v16 execution — the
> full-page pixel-diff pass (9 surfaces at 1280, the mobile pair at
> 390) closing with the cycle's headline finding: **Tailwind v4's
> default palette is not the reference's palette** (the v4 engine
> re-derived every default color in oklch; 17/22 spot-checked entries
> render beyond ±2 per channel of the reference's v3 hexes —
> indigo-500 Δ56, red-500 Δ24, green-700 Δ21, violet-600 Δ24 —
> pixel-read in Chromium via scripts/palette-drift-v16.ts); the fix
> pins all 61 used palette entries to their v3 hexes in a globals.css
> `@theme` block (one source; utilities, /opacity color-mix modifiers,
> and ring/shadow/border consumers all inherit; a new palette color
> requires its pin in the same commit), with e2e v3-exactness pins
> reading the literal reference values. The second finding: the
> category ENTITIES display order (Inventario chips + Ajustes
> categorías) — the reference renders Snacks, Lácteos, Higiene,
> Limpieza, Alimentos, Bebidas (DOM-measured twice) while its DONUT
> renders a different order; the clone's new `Category.sortOrder`
> (seeded to the chip sequence, server-managed max+1 on create, never
> client-writable) carries the entities order and the donut keeps the
> v10 createdAt pin — both reference orders now matched. New evidence:
> the reference's pages are VIEWPORT-LOCKED (its document never
> scrolls — inventory rows 4-12, the settings lower sections, and the
> low-stock card bottom are permanently unreachable at 1280×800); the
> clone's flowing layout is the functional superset, and future
> pixel-diffs read full-page height deltas against that fact. The
> login surface swept at full hover parity (socials, links, Sign in —
> the v12 family complete); the mobile drawer timing closed (288px
> panel, enter 0.2s, 44px pitch, zero overflow — session_22's
> carry-over); probe tooling hardened (a shift close must reset BOTH
> shift.status and register.status); ADR-026 added.
> v2.3.0 (2026-10-27): the remediation-plan-v15 execution — the hover
> micro-interaction families, measured live on BOTH apps with the toast
> question resolved by evidence: the reference NEVER fires a toast in
> any observable flow (its settings save `PUT` returns **403
> Forbidden** with ZERO user feedback — a silent failure on its own
> account; its product save returns 200, closes the modal, refreshes
> the collection, and renders NO feedback UI; its failed login renders
> the v12 inline shadcn Alert — the base44 `region "Notifications
> alt+T"` never mounts a child) — the clone's zustand toaster stays the
> disclosed functional superset. The findings: F1 the icon action
> button family — the reference's grammar is `p-2 rounded-lg
> hover:bg-{c}-50 text-slate-400 hover:text-{c}-{n} transition-colors`
> on EVERY row action (the clone's 6 sites dropped the transition; the
> registers delete already shipped it); F2 the Ventas MAIL button rides
> the reference's BLUE family (`hover:bg-blue-50 hover:text-blue-600`)
> where the clone shipped the Eye button's indigo on both; F3 the
> Ajustes category chip's remove control is lucide TRASH2 `w-3.5 h-3.5`
> (14×14 measured) where the clone shipped an X h-3 w-3; F4 the badge
> hover tints — the reference's status badges carry the shadcn stock
> `hover:bg-primary/80` + `transition-colors` (measured under a real
> mouse hover: green-100 `rgb(220,252,231)` → the platform violet
> `rgba(127,98,244,0.8)` with the text tone unchanged, 150ms) and the
> categoría badge `hover:bg-secondary/80` (the clone's StatusPill and
> categoría span had no hover; the CARD pill variant stays hover-free —
> the register pills never carried one); the Subir logo label resolved
> at COMPUTED parity (the reference's own `text-slate-700` loses the
> cascade to `.glass-button`'s lavender — both render
> `rgba(200,210,255,0.8)`); grammar alignment on unobservable superset
> surfaces (the cashiers CRUD, the Quitar image-remove buttons, the
> terminal ticket controls) adopts the measured small-red/transition
> grammar (SD-62). Two tooling traps recorded: Tailwind v4 computes
> `bg-primary/80` through color-mix and Chromium serializes it as
> `oklab(… / 0.8)` — even canvas fillStyle preserves the notation, so
> color pins read the sRGB pixel bytes via getImageData (±1 per channel
> is color-space rounding) or pin the class; and every agent-browser
> command after a `mouse move` resets the hover state — hover evidence
> rides Playwright's `page.mouse` with the hover verified before the
> shot (the v13 lesson re-confirmed). ADR-025 added.
> v2.2.0 (2026-10-27): the remediation-plan-v14 execution — the
> interaction-state family session_19 itself suggested next, measured live
> on BOTH apps: the dialog MOTION + GEOMETRY family (the reference's
> dialog content carries the FULL shadcn tailwindcss-animate grammar —
> fade + zoom + the slide quartet `slide-in-from-left-1/2` +
> `slide-in-from-top-[48%]` with the `slide-out-to-*` mirrors — while the
> clone shipped fade+zoom only; the reference's OVERLAY fades
> (`animate-in fade-in-0` / `animate-out fade-out-0`) while the clone's
> snapped; the reference's computed animation runs the tw-animate `.15s`
> default — its own `duration-200` class is INERT on its older stack, but
> the clone's Tailwind 4.3.3 threads `--tw-duration` to 200ms, so the
> class retires; the geometry is the SHARED `max-w-lg` (512px) base with
> `rounded-2xl sm:rounded-lg` — 16px full-bleed below sm, 8px at ≥sm —
> where the clone shipped max-w-md + per-surface max-w-sm/md overrides +
> flat rounded-lg; all 10 DialogContent call sites drop their width
> overrides, the inventory editor keeping only its `max-h-[90vh]
> overflow-y-auto` long-form affordance); the FOCUS family (the reference
> platform recolors EVERY default outline violet `rgba(127, 98, 244,
> 0.5)` — a global base44 platform `outline-color`; the clone's vx-focus
> still drew the retired indigo 129,140,248 2px box-shadow halo, and the
> plain Button carried no focus color at all — vx-focus now ships the
> deterministic `outline: 3px solid rgba(127, 98, 244, 0.5)` on
> :focus-visible, the same form V11/F2h shipped for the glass buttons,
> and a base-layer `outline-color: rgba(127, 98, 244, 0.5)` recolors
> every UA-default outline — no double rings: the outline-none controls
> keep their own deterministic rings); and the REPORTS empty-state skins
> (both per-method cards' empty state is the measured `flex h-40
> items-center justify-center text-sm text-white/25` box — the clone
> shipped a plain left-aligned text-slate-400 paragraph; the three
> reports card headings carry the measured `mb-5` 20px gap via
> `titleClassName` — the dashboard's mb-4/mb-3 pins untouched). The
> session_19 sidebar-collapse suggestion resolves MEASURED AT PARITY
> (220↔68px, the same 300ms cubic-bezier(0.4,0,0.2,1), labels
> conditionally removed from the DOM, the chevron flip — plus the clone's
> aria superset). E2e geometry reads on the dialog family settle via
> `getAnimations().finished` (mid-flight, zoom-in-95 scales the rect —
> 512 reads ~508-510); ADR-024 added.
> v2.1.0 (2026-10-27): the remediation-plan-v13 execution — the chart
> HOVER micro-interaction family, measured live on BOTH apps for the first
> time (the synthetic mousemove/PointerEvent probe triggers the reference's
> chart hovers headlessly; the donut's tooltip needed mouseenter ON THE
> SECTOR PATH — the v10/v11 "not reliably triggerable" disclosure closes):
> the sales chart gains the reference's recharts hover artifacts (the
> vertical #ccc 1px cursor line at the active x spanning the plot area, the
> r-4 activeDot — the line-color fill + the #fff 2px stroke), the recharts
> DEFAULT tooltip content (the margin-0 day label + the ul/li item in the
> LINE color #6366f1 carrying the literal `ventas` + the " : " separator +
> the RAW value — never the formatted Y string, 16px), the measured hybrid
> anchor ((point.x + 10, pointer.y + 10) — the x snaps, the y follows the
> mouse) with the right-edge left-flip at the mirrored −10 gap, the
> transform 400ms glide, and the PERSISTENT wrapper (leave flips
> visibility, never unmounts — re-enter glides like recharts' own); and the
> DONUT tooltip gets its OWN raw recharts-default skin (the 1px #ccc
> border, NO radius, NO shadow, the empty label p, the black `name :
> raw-count` item — "N productos" retired, anchored at the sector's ring
> midpoint with the same flip + glide); the v12 social-icon-transform
> disclosure retires (measured: zero group-hover utilities on the reference
> — dead code, exact parity); ADR-023 added.

> v1.7.0 (2026-10-26): the remediation-plan-v9 execution — the route
> alias + table/chart measurement sweep: the Spanish route names
> (`/Ventas`, `/Inventario`, `/Cajas`, `/Cajeros`, `/Reportes`,
> `/Ajustes`, `/Terminal`) resolve to their views via `SPANISH_ALIASES`
> (the rewrites had accepted them since v1 but `viewFromPath` silently
> rendered the Terminal — the documented superset is whole now); the tab
> title goes PATH-driven exactly like the reference (exact-case canonical
> match → canonical title, everything else slug-cased: "/SALES" is
> "SALES | VeloxPOS", "/storesettings" is "Storesettings"); the tables
> drop their table-level `text-sm` (the ref's bare tables inherit 16px —
> the Ventas Total was rendering 14px); the foreground family aligns to
> the ref's measured `#e7e9ef`; `SalesAreaChart` gains the two measured
> chart skins (`variant="dashboard"`: #e2e8f0 gridlines "3 3", #94a3b8
> 12px labels, #6366f1 line w2.5, salesGrad gradient 0.3 — vs
> `variant="reports"`: white/4% gridlines, white/30% 11px labels, w2,
> gradient 0.35); the clone-invented dashboard footer is removed; and
> the screenshots regenerate from the production build (no dev badge);
> ADR-019 added.

## Table of Contents

1. System Overview & Decisions
2. High-Level System Topology
3. Application Architecture
4. Data Architecture
5. Design System Reference
6. Security Architecture
7. Worker / Background Service Architecture
8. Testing Strategy
9. Build & Deployment
10. Developer Handbook
11. Known Issues & Outstanding Tasks
12. Key Files Reference
13. Glossary

---

## 1. System Overview & Decisions `[MANDATORY]`

**What.** VeloxPOS is a single-tenant retail point-of-sale web app: a selling
terminal, inventory, receipt history, registers with shift lifecycles,
cashiers, revenue reporting, and store settings — Spanish UI, dark canvas,
mobile-first drawer navigation. It is a functional superset of the hosted
reference `veloxposretail.base44.app` rebuilt from observation
(`docs/reference-investigation.md`, evidence-labeled).

**Why this shape.** The operator asked for the reference's UX with owned
infrastructure. The scaffold (this repo, previously the StudyFlow build)
already carried a proven Next.js 16 + React 19 + Tailwind v4 + Prisma/SQLite
pipeline with the v3→v4 trap work test-pinned — keeping it was the
lowest-risk path. **Verified.**

### ADR index (the decisions that bind future work)

| ADR | Decision | Status |
|---|---|---|
| ADR-001 | Single Next.js page + `rewrites()` SPA at reference PascalCase paths (`/`, `/Dashboard`, `/Inventory`, `/Sales`, `/Registers`, `/Cashiers`, `/Reports`, `/StoreSettings`) | Accepted — Verified (routes render via e2e; `/Inventario` kept as an alias rewrite) |
| ADR-002 | Prisma + SQLite at `<repo>/db/custom.db` via `DATABASE_URL="file:../db/custom.db"` (schema-anchored + runtime-anchored resolution) | Accepted — Verified (db exists; contract unit-pinned) |
| ADR-003 | Money as integer cents; prices IVA-exclusive; per-product `ivaRate` (default 16) | Accepted — Verified against the reference ticket ($18.50 → $21.46) |
| ADR-004 | Tailwind v4 CSS-first (`@theme`/`@utility`), the five trap rules enforced by source pins | Accepted — Verified (tests/tailwind-traps.test.ts) |
| ADR-005 | Two Zustand stores (`useAppStore`, `usePosStore`) — no React Context | Accepted — Verified (store.ts) |
| ADR-006 | API routes as 3-line shells over delegate factories; hand-rolled flows still `withUser` + `parseWith` + `toErrorResponse` | Accepted — Verified (api/**) |
| ADR-007 | Charts hand-rolled SVG (no chart dependency) | Accepted — Verified (pos/shared.tsx) |
| ADR-008 | Mobile drawer is a superset feature (the reference has none); geometry e2e-pinned at 390×844 | Accepted — Verified (mobile-navigation.spec.ts) |
| ADR-009 | Seed identity via `SEED_OWNER_*` env with an in-code password default (bun dotenv expands `$…`) | Accepted — Verified |
| ADR-010 | db-path v3 hardening: the repo owning `prisma/schema.prisma` wins over Turbopack's mangled sibling-db absolute form | Accepted — Verified (db-path.test.ts pins) |
| ADR-011 | Reset delivery is ENVIRONMENT-GATED: the forgot-password response carries the one-shot reset link only outside production or with `RESET_INAPP_DELIVERY=1` (a production response is `{ok:true}` only) | Accepted — Verified (security.spec.ts, production posture) |
| ADR-012 | Sessions carry a `tokenVersion`; reset-password bumps it transactionally — pre-reset cookies are revoked on their next request | Accepted — Verified (security.spec.ts) |
| ADR-013 | The remediation contract set: guarded in-transaction stock decrement + server-side cash gate (422), duplicate-open 409 via ConflictError, raw ZodError → 400, 413/415 body gates, OTP 6-strike lockout, proxy-hop-aware client IP, drawer focus contract (latched rAF + Tab wrap + focus return) | Accepted — Verified (213 unit + 70 e2e) |
| ADR-014 | The v4 visual-parity contract set: native Tailwind radius scale (shadcn `--radius` remap removed — the reference's own shadcn runs native), the reference card system on `vx-card` (translucent `rgba(16,18,32,.9)` + white-alpha hairline + elevation shadow), the `glass-button-primary/success/warning` gradient action system (135° ramps + colored hairline + glow + hover lift, CSS extracted live), the translucent-violet active nav pill on a RING (never a border — layout-neutral), StatCard blob anatomy, the icon-left reports summary cards, and the official social brand marks + hosted logo PNG on the auth surface | Accepted — Verified (238 unit + 74 e2e, live probe parity) |
| ADR-015 | The v5 view-internals contract set: the flush shell gutter (`lg:ml-[220px]`/`[68px]` — the view's own padding provides the 24px gutter, H1 at x=244); the Terminal as the ONE full-bleed view (`lg:h-screen` two-pane, ticket panel as the `rounded-none border-l bg-[#0d0f1a]` RAIL with the transient "Agregado" banner and ShoppingBag COBRAR); the reference table system (slate-50 hairlines, `hover:bg-white/40`, `text-slate-600` body, mono indigo ticket cells, per-column header alignment, the dense cajeros shifts variant); the two-shape StatusPill (6px soft table badges `green-100/green-700` + `slate-100/slate-500`, vs the register-card `rounded-full` pill); 12px-radius transparent form controls; the reference's neutral `--secondary` token (`33 37 49`); tinted reports chips (15%/30%/400-tone, NOT gradient) + the Reports-only bright H1 (`tone="bright"`) | Accepted — Verified (277 unit + 83 e2e, live probe parity) |
| ADR-016 | The v6 functional-superset contract set: dialog footer buttons are the reference's 42px glass pair, and the cva Button ships a dedicated EMPTY `glass` variant because the default/outline variants' bg/text utilities clobber the flat `.glass-button` fill (F6); product photos + the store logo persist as data URLs (canvas-resized ≤512px, JPEG q0.85, 300KB guard, 600k schema ceiling) with NO infrastructure dependency; the Unidad enum is the reference's six + Servicio; all mutation failures toast (`void err` forbidden); the Ventas mail row action opens a `mailto:` carrying the full ticket (no SMTP — disclosed); the document head mirrors the reference (title "VeloxPOS", its description, OG/Twitter cards, appleWebApp, a WORKING manifest, the app-router icon.png convention, the generated 1200x630 og-image); the UI primitives carry zero dead study-app classes (the checked Switch fills with the live-measured `#7f62f4`) | Accepted — Verified (311 unit + 91 e2e, live probe parity) |
| ADR-017 | The v7 per-route title + data-lifecycle contract set: the document title is per-route (the reference's exact strings — root "VeloxPOS", "<View> | VeloxPOS" elsewhere, "Store Settings | VeloxPOS" for Ajustes, "Signup | VeloxPOS", and the title-cased route slug on 404s) via `DOCUMENT_TITLES`/`documentTitleForPath()` + the shell's post-ready effect + the signup server layout + the guarded MutationObserver on 404s (Next's client metadata manager re-applies the root title once after mount — the observer wins the last write); "Quitar" clears the stored image with `imageUrl: null` (schema `.nullable()`; an undefined key is dropped by JSON.stringify and skipped by `sentKeysPatch` — the v6 clear was a silent server no-op); a failed pick or picker-cancel never touches the stored value; the product-dialog numeric fields are `type="number"` with steps (the reference's own control type — spinners, role=spinbutton, native filtering); the Ajustes logo block renders the 56px pending/stored preview + a Quitar that PATCHes null | Accepted — Verified (324 unit + 98 e2e, live probe parity) |
| ADR-018 | The v8 auth round-trip + measured dialog contract set: a logged-out hit on any app route bounces to `/login?from_url=<encoded current path>` and a successful login returns the user to that route through `safeReturnTo(raw, origin)` (same-origin absolute URLs and site-relative paths pass; foreign origins, protocol-relative URLs, and javascript:/data: fail closed to "/"; "/login" maps to "/" — the param is an open-redirect vector if trusted blindly; the reference's own gates on 404s and /signup are base44 platform artifacts, NOT replicated, SD-20); the Ventas ticket modal is the reference's measured layout (a `grid grid-cols-2 gap-3 text-sm` meta block of stacked `text-slate-500`/`font-medium` cells, `{qty}x {name}` item lines with `font-medium` prices over `border-slate-100`, totals over `border-slate-200` with `text-slate-500` rows and a `text-lg font-bold` Total, the `Receipt` `text-indigo-500` title icon, no footer Close button — the reference's own slate-800 Total color is an unreadable contrast bug, a readable tone ships, SD-18); the mail action prompts `window.prompt("Enviar ticket a:")` first (cancel = no-op) and the entered address rides `buildTicketMailto(sale, to)` (no SMTP channel — the mail client opens pre-addressed, SD-19); the Ajustes colors pair each swatch with an editable hex Input (the `hexColor` schema regex is the server gate); every `DialogContent` rides the measured `bg-[#0f121a] text-[#e7e9ef]` chrome and every `SelectContent` panel `bg-[#161922]` | Accepted — Verified (342 unit + 105 e2e, live probe parity) |
| ADR-019 | The v9 route-alias + typography/chart contract set: the Spanish route names the rewrites accept are a deliberate SUPERSET (the reference 404s every one — live-measured on all six) and `SPANISH_ALIASES` in `src/lib/router.ts` maps them to their views (`/Ventas`→ventas, `/Inventario`→inventario, `/Cajas`→cajas, `/Cajeros`→cajeros, `/Reportes`→reportes, `/Ajustes`→ajustes, `/Terminal`→terminal) — before v9 they fell to the terminal fallback and silently rendered the WRONG view; the document title is PATH-driven like the reference (`documentTitleForPath()`: exact-case match against the canonical PascalCase path → that route's canonical title, everything else slug-cases — "/SALES" → "SALES | VeloxPOS", "/storesettings" → "Storesettings", "/Ventas" → "Ventas" — the shell reads the pathname, not `DOCUMENT_TITLES[view]`); tables are BARE (`<table class="w-full">` — the ref's 16px base; cells carry their own sizes; a table-level `text-sm` had shrunk the Ventas Total to 14px); the shadcn foreground family is the ref's measured `#e7e9ef` (231 233 239 — body/card/popover); `SalesAreaChart` carries TWO measured skins — "dashboard" (gridlines `#e2e8f0` "3 3", labels `#94a3b8` 12px, line `#6366f1` w2.5, `salesGrad` gradient top 0.3) and "reports" (gridlines `rgba(255,255,255,0.04)`, labels `rgba(255,255,255,0.3)` 11px, line w2, gradient top 0.35); the dashboard carries NO footer credit (the ref ends at the low-stock rows) | Accepted — Verified (363 unit + 115 e2e, live probe parity) |
| ADR-020 | The v10 donut + seeded-data contract set: the category donut is the reference's recharts rendering, fully measured for the first time (the v5 "unobservable donut" disclosure closes) — `sectorPath()` in `src/components/pos/shared.tsx` emits filled sector paths on the ring innerR 50 / outerR 80 centered at (166.5, 100) inside the `0 0 333 200` viewBox, sectors COUNTERCLOCKWISE from 3 o'clock with a TRAILING 4° gap (each sector starts exactly at its slice boundary — measured [0,56]/[60,116]/[120,176]/[300,356]), every sector carries `stroke="#fff" strokeWidth={1}`, and `DONUT_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#22c55e"]` maps by ORIGINAL data index; the legend renders the FIRST 5 rows only (`slice(0, 5)` — the ref renders 6 sectors but 5 legend rows; its internal rule is unobservable, the cap is the measured behavior) stacked BELOW the chart with slate-600 names / semibold slate-700 counts / 12px round swatches; the low-stock card header's gap is the ref's 12px (`SectionCard titleClassName="mb-3"` — every other card header stays mb-4); the Ajustes section headers carry the ref's per-section icons at w-5 h-5 (Store/text-indigo-500, Palette/text-purple-500, FileText/text-green-500, CreditCard/text-blue-500, Tag/text-amber-500); the SEED mirrors the reference account's observable state exactly — products in the ref's page order (Shampoo → Pan Bimbo; the 12th row is the measured "Jabón Zote 400g" / 7501025403010 / stock 19, retiring the dossier-era ASSUMED "Barra" values), Caja 2 created before Caja 1 (the ref's page order), and the two historical sales at the ref's EXACT datetimes (19/04/2026 22:09 and 14/03/2026 01:45) with the second's REAL items (1x Jabón Zote + 1x Papel Higiénico = $61.48) — the relativized daysAgo seeding is RETIRED, so the clone's dashboard chart renders flat and its reports render "Sin datos en este período" exactly like the reference; every owned list orders `[{createdAt asc},{id asc}]` (deterministic against SQLite tie order — the delegates, the product list, and the dashboard's byCategory); and the reports X-ticks follow the ref's measured rule (`thinLabelIndices`: windows ≤14 days label every day; longer windows step `ceil((count-1)/9)` from the window start — 30 days → 8 labels at 4-day steps ending day 28, 90 → 9 labels at 10-day steps ending day 80; the last day is NOT force-labeled) | Accepted — Verified (379 unit + 127 e2e, live probe + pixel parity) |
| ADR-021 | The v11 chart-container + focus-system contract set: the charts are container-responsive the recharts way — `useContainerWidth` in `src/components/pos/shared.tsx` (a callback ref measuring `getBoundingClientRect().width` synchronously at commit, before first paint, plus a ResizeObserver cleaned up via React 19's ref-cleanup return) feeds each SVG box while the chart HEIGHT stays FIXED per surface (`SALES_CHART_HEIGHTS`: dashboard 280, reports 220; the donut 200) and the donut's ring geometry stays FIXED (innerR 50 / outerR 80, cy 100, cx = box/2, the wrapper's `max-w-[333px]` capping the box) — the v10-era aspect-locked fixed-viewBox SVGs (`w-full h-auto`, 640×260/640×280) rendered at the wrong size at every measured viewport (254px vs the ref's 280 on the dashboard at 1280, 424px vs 220 on reports, a 134px vs 160px donut ring); the focus grammar matches the reference (app Input/Textarea/SelectTrigger focus `ring-1` in `--ring: 127 98 244` (#7f62f4) with NO offset; the root tokens align to the reference's measured set — `--primary: 127 98 244`, `--background: 15 18 26` (the shadcn surface #0f121a, NOT the body canvas: the body paints `var(--color-vx-canvas)` #080a14), `--border: 38 42 54`; the Switch keeps ring-2 + ring-offset-2 in the SOLID violet; the glass-button utilities own the focus `outline: 3px solid rgba(127, 98, 244, 0.5)` — the cva Button base carries NO focus-ring classes; the auth AuthShell scopes `--background: 255 255 255` so the auth inputs' slate-400 ring-2 renders over a WHITE offset, with the measured bases `pl-10 h-11 sm:h-12 md:text-sm placeholder:text-slate-600` and the 3px-solid-white submit outline; Input/Textarea ride `text-base md:text-sm shadow-sm` (16px under 768px — the iOS no-zoom size), the SelectTrigger is `rounded-xl` with the `focus:` spelling while the dropdown PANEL stays `rounded-md` (6px, the reference's own panel), and every label→control gap is `mt-1`); and both charts render the reference's measured recharts default tooltip on hover (`ChartTooltip`: white card, 12px radius, 10px padding, `rgba(0,0,0,0.1) 0 4px 20px` shadow, nowrap, pointer-events none) with READABLE dark text — the reference's own tooltip text is #e7e9ef-on-white (unreadable; the SD-18 readable-superset precedent) | Accepted — Verified (397 unit + 139 e2e, live-probe parity at 1440/1280/1024: the sales chart 625×280/454×280 exact, the reports 714×220/970×220 exact, the donut ring 160px exact) |
| ADR-022 | The v12 auth-surface contract set: the auth CARD carries the reference's chrome — a 4px slate gradient hairline (`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200`) clipped by `overflow-hidden`, the `p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10` padding step, and the `flex flex-col items-center text-center space-y-6 sm:space-y-8` column (the v4-era per-child margins retired); the login grammar is the reference's measured family — the responsive H1 `text-2xl sm:text-3xl` (24/30px) and subtext `text-sm sm:text-base font-medium text-slate-500`, the social buttons at `text-[16px]` (54px) with `hover:bg-slate-50 … hover:shadow-sm` and the `-ml-4` icon optical offset, the shadcn-Separator OR chip (the 1px slate-200 line behind `bg-white px-3 font-medium tracking-wider text-slate-500` with the literal "or" uppercased by CSS), the `space-y-4 sm:space-y-5` form with its fields/actions groups, the Forgot/Sign-up footer ROW (`flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0`) INSIDE the form, and the `h-11 sm:h-12 … shadow-sm … transition-all duration-200` submit (44px mobile — the v11-era fixed h-12 was 48px everywhere); the forgot/sent screens are the reference's ENGLISH family (the back-at-top `w-fit … -mb-2`, the 24px H2, the 16px slate-600 subtext, the smaller `h-10 sm:h-11` controls with `placeholder:text-slate-400`, and the sent screen's `w-14 h-14 sm:w-16 sm:h-16 bg-slate-100` icon circle + the green shadcn Alert — the in-app reset link rides inside the alert as the no-SMTP superset, the in-card token screen retired); the /reset-password page is the base44 PLATFORM template (the plain-white page, the `rounded-lg … shadow-lg bg-white overflow-hidden` card with the 2px `bg-gray-900` strip, the gray palette with `focus:gray-400` + lucide-lock gray-400, the New Password + Confirm pair at `pl-10 h-11`, the `text-xs text-gray-500` 8-char helper, and the no/invalid-token "Invalid Reset Link" state with the `w-20 h-20 bg-red-100` circle); and the shadcn Alert family (`border-X-200 bg-X-50/70 p-4 rounded-xl` + `text-X-700 text-sm leading-relaxed`) owns every auth error/success note | Accepted — Verified (429 unit + 153 e2e; live-probe parity at 1280+390: the hairline pixel-identical (4× rgb(203,213,225) vs 4× rgb(202,213,226) — oklab rounding), the social 54px/16px exact, the submit 44/48px exact, the footer row side-by-side at ≥sm with Forgot at the content's left edge, the reset strip 2px + labels English, a full scratch-user reset round-trip green) |
| ADR-023 | The v13 chart-hover micro-interaction contract set: the sales chart renders the reference's recharts hover artifacts while a point is active — the CURSOR (a vertical `stroke="#ccc"` 1px `<line>` at the active x spanning the plot area `y1={padTop}`→`y2={padTop + innerH}`) and the activeDot (`<circle r="4" fill={skin.lineStroke} stroke="#fff" strokeWidth={2}>` at the snapped point) — and the tooltip is the recharts DEFAULT content on the v11 white-card skin: the margin-0 label `<p>` (the day — readable #1e293b, the SD-18 disclosed superset; the reference's inherited #e7e9ef is invisible on white) + the `<ul><li>` item (4px pad-y, the LINE color #6366f1) carrying the literal series name `ventas` + the `" : "` separator + the RAW value (`String(value)` — NEVER the formatted Y string), 16px; the tooltip ANCHOR is the reference's measured hybrid — x = the snapped POINT's x + 10, y = the POINTER's y + 10 — flipping to the mirrored −10 gap when the measured box would overflow the container (`tipTransform`), gliding via `transition: transform 400ms`, with the wrapper PERSISTING after the first hover (leave flips `visibility`, never unmounts — re-enter glides from the last position, recharts' own wrapper behavior; the box measures itself via the callback-ref + ResizeObserver `useSelfMeasure` hook — the repo's no-setState-in-effect rule); the DONUT tooltip is a DIFFERENT skin, the RAW recharts default (white bg + a 1px `#ccc` border, NO radius, NO shadow, the EMPTY label `<p>`, the item in BLACK `rgb(0,0,0)`: `{name} : {raw count}` — the v11-era "N productos" phrasing and the white-card skin on the donut retire) anchored at the sector's ring midpoint (the measured recharts centroid) with the same flip + glide; the v12 "social-button hover icon-transform" disclosure RETIRES (measured: zero `group-hover` utilities in the reference's button DOM — the `transition-transform` on the icon wrapper is dead code there too, exact parity); probe lessons: a 0-width SVG line and the flat-$0 area path have EMPTY Playwright bounding boxes (assert attachment + geometry, never toBeVisible), Chromium serializes `400ms` as `0.4s`, e2e hovers gate on the data (the area path) before the mouse.move, and the reference's PIE tooltip activates only via mouseenter/mousemove ON THE SECTOR PATH | Accepted — Verified (445 unit + 158 e2e; live-probe parity at 1280: the tip "sábventas : 0" with the #6366f1 item + 16px, the dot r4/#6366f1/#fff/2px, the cursor x=332.5 #ccc, the donut "Lácteos : 2" with the 1px #ccc border + 0px radius + no shadow + black item + empty label, the flip transform math exact (translate(75.79, 77.5) = the 30° ring midpoint anchor − 110 − 10), pixel-verified evidence shots) |
| ADR-024 | The v14 interaction-state contract set: the dialog system is UNIFORM — every DialogContent/AlertDialogContent rides the shared `max-w-lg` (512px) base with `rounded-2xl sm:rounded-lg` (16px full-bleed below sm — `w-full` takes the viewport under the cap — 8px at ≥sm), NO per-surface width overrides (the inventory editor keeps only `max-h-[90vh] overflow-y-auto`); the content carries the FULL tailwindcss-animate grammar (fade + zoom + the slide quartet `slide-in-from-left-1/2`/`slide-in-from-top-[48%]` and the `slide-out-to-*` mirrors) and the OVERLAY fades (`animate-in fade-in-0` / `animate-out fade-out-0` — never a snap); the tw-animate `.15s` default is the observable — NO `duration-` class on the dialog family (Tailwind 4.3.3 threads `--tw-duration` to 200ms where the reference's older stack leaves its own `duration-200` inert at 150ms); the focus family: `vx-focus` draws `outline: 3px solid rgba(127, 98, 244, 0.5)` on :focus-visible (the retired indigo 129,140,248 box-shadow halo stays retired) and a global base-layer `outline-color: rgba(127, 98, 244, 0.5)` — the reference platform's mechanism — recolors every UA-default outline violet with no double rings (the outline-none controls keep their own deterministic rings); the reports empty states are the measured `flex h-40 items-center justify-center text-sm text-white/25` boxes and the three reports cards carry `titleClassName="mb-5"` (the 20px heading gap — the dashboard's mb-4/mb-3 pins untouched); the sidebar collapse is MEASURED AT PARITY (220↔68px, 300ms cubic-bezier(0.4,0,0.2,1), labels conditionally removed from the DOM, the chevron flip) — the session_19 suggestion resolves with no work; e2e lesson: dialog geometry reads settle via `getAnimations().finished` (mid-flight, `zoom-in-95` scales the rect — 512 reads ~508-510) | Accepted — Verified (458 unit + 162 e2e; live-probe parity at 1280 + 390: the 512px/8px desktop dialog with the computed `enter 0.15s` + the four slide utilities + the fading overlay, the 390px full-bleed/16px mobile skin, the violet `rgba(127, 98, 244, 0.5)` 3px solid nav-link outline under a real Tab sweep with no indigo box-shadow, the 160px flex-centered empty-state boxes + the 20px heading gap; VLM-verified evidence shots) |
| ADR-025 | The v15 hover micro-interaction contract set: every row-action icon button carries the grammar `rounded-lg p-2 text-slate-400 transition-colors` + a per-action hover family — edit/detail INDIGO (`hover:bg-indigo-50 hover:text-indigo-600`), delete RED (`hover:bg-red-50 hover:text-red-500`), MAIL BLUE (`hover:bg-blue-50 hover:text-blue-600` — the Ventas mail button is NOT the Eye's indigo), the grammar applying on unobservable superset surfaces too (the cashiers CRUD — the reference's view is read-only; the registers delete already shipped it); the table badges carry the shadcn hover tints — the StatusPill TABLE variant rides `transition-colors hover:bg-primary/80` (measured under a real hover: green-100 → the platform violet rgba(127,98,244,0.8), the text tone unchanged, 150ms; the token `--primary: 127 98 244` is the reference's own violet, so no literals) and the categoría badge `hover:bg-secondary/80`, while the CARD pill variant (register cards) stays hover-free; the Ajustes category chip's remove control is lucide TRASH2 `w-3.5 h-3.5` (14×14) on `text-slate-400 hover:text-red-500 transition-colors` — never an X icon; the toast family CLOSES as unobservable-with-evidence: the reference never renders a toast in any observable flow (settings save `PUT` → 403 with zero feedback, product save → 200 + modal close + collection refresh with zero feedback, failed login → the inline alert; the base44 Notifications region never mounts a child) — the clone's zustand toaster is the disclosed functional superset; the Subir logo label is COMPUTED parity (the reference's `text-slate-700` loses the cascade to `.glass-button`'s lavender — both render rgba(200,210,255,0.8)); tooling traps: Tailwind v4's `bg-primary/80` computes through color-mix and Chromium serializes `oklab(… / 0.8)` (even canvas fillStyle preserves it — color pins read the sRGB pixel bytes via getImageData, ±1 per channel, or pin the class), and agent-browser resets hover state on every command after a `mouse move` (hover evidence rides Playwright's page.mouse, hover verified before the shot) | Accepted — Verified (470 unit + 166 e2e; live-probe parity at 1280: the mail button's blue hover beside the Eye's resting indigo, the Completada badge's violet-at-80% hover with the green text unchanged, the chip's 14×14 trash, the 403-silent settings save + the feedback-free product save on the reference; VLM-verified evidence shots) |
| ADR-026 | The v16 palette-pin + category-order contract set: **Tailwind v4's default palette is NOT the reference's palette** — the v4 engine re-derived every default color in oklch and 17/22 spot-checked entries render beyond ±2 per channel of the reference's v3 hexes (indigo-500 Δ56, red-500 Δ24, green-700 Δ21, violet-600 Δ24, blue-600 Δ17, indigo-600 Δ17, emerald-500 Δ16, amber-500 Δ11, amber-600 Δ8, violet-300 Δ8, slate-400/500/600/700 Δ3-4 — pixel-read in Chromium via `scripts/palette-drift-v16.ts`, canvas getImageData as the authority; the reference renders the v3 hexes: badge text rgb(21,128,61), pill bg rgba(124,58,237,0.2), amber count rgb(217,119,6), all v3); the class-pinning idiom (v10+) had silently accepted the drift — class parity ≠ color parity. The fix: a `@theme` block in globals.css pins every palette entry the app uses (61 across slate/gray/red/orange/amber/green/emerald/teal/blue/indigo/violet/purple) to its v3 hex — one source; utilities, /opacity modifiers (color-mix over a hex keeps the sRGB hue — `bg-violet-600/20` renders rgba(124,58,237,0.2) exact), and ring/shadow/border/fill consumers all inherit; RULE: a new palette color requires its v3 pin in the same commit; the e2e v3-exactness pins read the literal reference values (rgb(21,128,61) badge text, rgb(217,119,6) amber count, rgb(79,70,229) ticket cell, the pill's pixel bytes — the /opacity modifiers serialize oklab even over hex vars). The category ENTITIES display order (Inventario chips + Ajustes categorías) is `Category.sortOrder` — seeded to the reference's measured chip sequence (Snacks, Lácteos, Higiene Personal, Limpieza, Alimentos, Bebidas — DOM-measured twice) while the DONUT's byCategory KEEPS its own createdAt order (Lácteos first — the v10 pin; the reference renders two different orders, both now matched); sortOrder is server-managed (the category delegate's prepareCreate computes max+1; the column is absent from the client schema — never writable); the delegate factory grows `listOrderBy` + `prepareCreate` (optional, defaults preserve the v10 rule). New evidence: the reference's pages are VIEWPORT-LOCKED (scrollTop pinned to 0, scrollHeight == clientHeight, no internal scroll container — its inventory rows 4-12, settings sections below the fold, and low-stock card bottom are permanently unreachable at 1280×800); the clone's flowing layout is the functional superset. The login surface swept at full hover parity (the v12 family complete: socials `hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200`, the links, the Sign in `hover:bg-slate-800`); the mobile drawer timing closed (288px, `enter 0.2s`, 44px pitch, zero overflow); probe tooling: a shift close must reset BOTH shift.status AND register.status | Accepted — Verified (478 unit + 173 e2e; the full-gate run + the live chip-order verification + VLM-verified evidence shots) |
| ADR-027 | The v17 lazy-view-registry + CWV-evidence contract set: `src/app/page.tsx` ships NO static view imports — the registry is `VIEW_LOADERS` (one dynamic `import()` per view, the named exports adapted via `.then((m) => ({ default: m.XView }))`) consumed through `React.lazy`, and the boot effect PREFETCHES the active view's chunk fire-and-forget in the same parallel window as `/api/auth/me` + the collection pre-warm (`void VIEW_LOADERS[activeView]()`), so the chunk is resident before `status` flips "ready" (no Suspense gap on the standard flow); `<ActiveView />` mounts inside `<React.Suspense fallback={null}>`. RULE: never re-add a static view import — the monolithic registry billed every route ~69 KiB gz of views it never runs (the authed dashboard measured TBT 550 ms / LCP 3.7 s / perf 54 in Lighthouse 13 pre-split; the split took it to 280 ms / 3.5 s / 67 — measured with the session cookie injected via `--extra-headers`, because a Lighthouse CDP attach opens a FRESH INCOGNITO context that shares no cookies and silently measures the logged-out bounce). The reference benchmark: its public login measures perf 51 / LCP 14.4 s / 2,314 KiB vs the clone's 86 / 2.4 s / 314 KiB — the clone outperforms on every metric. The dashboard's Lighthouse a11y 94 = the disclosed color-contrast family PLUS heading-order (H1→h3, no h2 — measured IDENTICAL on the reference's Dashboard, 2026-10-27); both are reference-parity deviations, not bugs. The react-dom boot cost (~890 ms) is the framework floor — out of scope. The stale study-app Lighthouse evidence (localhost:3200, 2026-10-18) was deleted; the v17 set + the methodology README live in `docs/lighthouse/` | Accepted — Verified (486 unit + 176 e2e; the before/after Lighthouse runs + the mobile drawer's live lifecycle probe) |
| ADR-028 | The v18 error-recovery architecture contract set (the neo-crm session-170 pattern ported, reproduced live first): the lazy registry NEVER ships a bare Suspense — `<React.Suspense>` mounts INSIDE a `ViewErrorBoundary` class component keyed `` `${view}-${viewEpoch}` `` so a failed view chunk (transient blip or stale-hash-after-redeploy) keeps the SHELL (sidebar, app bar, navigation) alive; a stale-chunk error (the Turbopack message family, live-captured as `ChunkLoadError: Failed to load chunk /_next/static/chunks/….js from module N`) auto-reloads ONCE per 10 s window through the pure injectable seam `src/lib/chunk-recovery.ts` (`isStaleChunkError` / `shouldHardReload` / `reloadOnStaleChunk`; the `veloxpos:chunk-reload-at` sessionStorage flag written BEFORE the reload fires — the crash-mid-reload loop guard; unavailable/corrupt storage disables the reload, never throws); every other error renders the Spanish recovery card ("No se pudo cargar la vista" + "Reintentar" in the `bg-[#0f121a]` dialog chrome + `glass-button-primary` grammar); Reintentar bumps the view EPOCH — the lazy registry is a `useMemo` keyed on it because `React.lazy` caches a rejected initializer FOREVER (only a fresh instance re-imports; a bare boundary reset re-throws the cached error); the outer nets are `src/app/error.tsx` (route segment — non-view crashes; Spanish card in the 404's vx-card dialect + reset()) and `src/app/global-error.tsx` (root — self-contained `<html lang="es">` + body + a direct globals.css import, zero component-tree imports: a resilience surface never stands on the tree that broke); the boot prefetch is fire-and-forget-SILENT (`VIEW_LOADERS[activeView]().catch(() => undefined)` — the lazy mount owns the surfaced error). RUNTIME REALITY (debug-instrumented this cycle): a SINGLE aborted chunk fetch never reaches the boundary — the bundler runtime retries internally and the view renders below it; the card is the surface for failures persisting past the runtime retry budget (the e2e pins block persistently + pre-seed the cooldown to suppress the auto-reload). Pre-fix evidence: the same failure unmounted the ENTIRE app to Next 16's built-in English dead-end screen ("This page couldn't load") — no boundary existed anywhere | Accepted — Verified (509 unit + 179 e2e; the live reproduction probe + the three failure-path e2e pins + the recovery screenshot set) |
| ADR-029 | The v20 recovery-card announcement contract: every one of the three V18 failure surfaces carries `role="alert"` on the card element that MOUNTS with the failure — the view card (`src/app/page.tsx`'s `data-testid="view-error-card"` div), the segment card (`src/app/error.tsx`'s inner `vx-card` div), and the root card (`src/app/global-error.tsx`'s `data-testid="global-error-card"` div) — so a screen-reader user HEARS that a view failed (the fresh mount of a live-region element with its content is the announcement mechanism; no live region existed pre-fix — the V19 cycle's F1, recorded informational and suggested as the next target by both session logs). LANDMARK-SAFE placement: the role rides the card div, NEVER the `<main>` wrapper — an element carries exactly one role, and `role="alert"` on `<main>` would delete the main landmark from the accessibility tree. Pinned TDD-first: `tests/recovery-a11y.test.ts` (4 source pins in the tailwind-traps idiom — role presence ×3 + the `<main>`-keeps-its-landmark guard) written and verified RED against the unfixed tree, then the three one-attribute fixes, then GREEN; the v18 SHELL SURVIVAL e2e pin gained the live failure-path assertion (`view-error-card` → `role="alert"`), also verified RED-then-GREEN on the real chunk-blocked navigation. A DISCLOSED SUPERSET on two axes: the reference ships no recovery surface at all (any implementation is superset), and neo-crm's own error cards carry no role (no commit there since 2026-10-22 — the pattern reference was checked before diverging). The announcement itself (assistive-tech speech) is not assertable in Chromium — the attribute + fresh-mount pattern is the standard mechanism; the pins are the honest ceiling | Accepted — Verified (513 unit + 179 e2e; RED→GREEN evidence on both pin layers + the v20 mobile evidence set) |
| ADR-030 | The v21 deployment-surface truth contract: the shipped deployment surfaces describe THIS app, mechanically. (1) The container identity: Dockerfile + docker-compose.yml carry the VeloxPOS identity (service `veloxpos`, image `veloxpos:latest`, `${VELOXPOS_PORT:-3000}`) — the scaffold's `studyflow` service and header rot retired with the last never-actioned Known-Issues row (#6). (2) `docs/DEPLOYMENT.md` tells the truth about the shipped app — the full env contract (every `.env.example` variable documented), the real verification commands (the gate ladder, no phantom smoke-test.sh), the route-handler count pinned to the LIVE filesystem count (27 — the count-the-things rule, mechanically), the renamed Docker walkthrough, and NO documentation of unshipped features (the scaffold's /rum diagnostics, /export + /import portability, and Settings→Profile UI never existed here); every `scripts/` reference must resolve to a real file. (3) The four scaffold account-security routes — `POST /api/auth/change-password` · `change-email` · `delete-account` · `resend-verification` — are KEPT as a disclosed API-only superset (real, rate-limited 10/15-min, password-verified PRE-WRITE, no-enumeration uniform 200s; the reference has none of them; no UI ships — a future feature cycle if the operator wants one), with their scaffold-colliding comments (S24/ADR-022-style citations that collide with THIS repo's ADR numbering; StudyFlow model names in the delete cascade prose) re-cited to ADR-030 and their contracts pinned end-to-end by `tests/e2e/account-security.spec.ts` (8 behavioral tests: the 400/409 ladders, the uniform no-enumeration 200, the rotation round-trips via fresh-context logins, the delete cascade + cookie clear + subsequent 401 — written with the fresh-context discipline so the demo owner's storageState cookie can never ride an authenticated scratch call). (4) Single lockfile: `bun.lock` — the vestigial npm `package-lock.json` (still named "omni-study") removed. All guarded by `tests/deployment-surfaces.test.ts` (16 source pins — raw scans where the finding lives IN comments, live fs checks for the script refs and route count). The e2e layer is NEW COVERAGE of already-correct behavior (the routes worked; they had zero tests) — the TDD RED→GREEN applied to the deployment-surface pins (15/16 failed pre-fix) | Accepted — Verified (529 unit + 187 e2e; the RED→GREEN pin evidence + the 10/10 live mobile probe + the v21 evidence set) |
| ADR-031 | The v22 account-security UI contract: the four ADR-030 routes are UI-wired end-to-end — the loop the reference never ships (it has NO account surface: its sidebar bottom is the collapse chevron alone, its Ajustes is store settings only — live-verified). (1) **Ajustes → "Mi Cuenta"** (`settings-view.tsx`): a SIXTH SectionCard — ShieldCheck/rose-500 at the measured w-5 h-5 (the tone the five store sections leave free; the v10 icon pin counts SIX now) — owning a self-contained /api/auth/me fetch (the async-then setState shape) that renders the email + the "Verificada" emerald badge + member-since (es-MX); change-password and change-email ride the measured Dialog family (max-w-lg chrome, key-remount, the 42px glass-button footer, Spanish chrome with the routes' English errors passing through — the reference's own mixed convention, its login alert measured "Invalid email or password"); delete-account rides a plain Dialog + the NEW `glass-button-danger` @utility (the warning-ramp extension precedent — the reference's own button system one tone further; the AlertDialog primitive stays deliberately UNUSED: its cva `buttonVariants()` defaults clobber the glass fills, the F6 trap), with the cascade warning naming the retail domain's wipe and the logout() exit mechanics (store reset + /login redirect; the route clears the cookie). (2) **The signup verify stage displays the register response's code** (F2 — a REAL bug fixed: `submitForm` discarded the `code` the no-SMTP delivery model puts in the response body; the route's own comment named "the verify screen's self-hosted code note" as the delivery surface and it did not exist — signup verification was UI-unusable on a fresh self-hosted install); the note rides the auth slate-Alert family and hides for the uniform no-code 200 (the already-registered posture). (3) **The login 403 verify sub-card** (F3 — the dead-end closed: UNVERIFIED_COPY told the user to check an email that never arrives): the code entry + "Resend the code" + the delivered-code note (or the neutral no-enumeration copy) + "Verify and sign in" — verify-email sets the session cookie, so the journey completes without a second sign-in; the card is a plain DIV because HTML forbids a nested `<form>` and React hydration silently kills the inner submit (reproduced live: the browser console logged "In HTML, <form> cannot be a descendant of <form>"; Enter in the code field routes to submitVerify explicitly). (4) `AppUser` gains `emailVerified` (the API's publicUser already returned it — the type was stale). (5) The v5 form-control pin caught the first draft's solid input fills — settings-view inputs stay TRANSPARENT (measured trap 13). Pinned TDD-first: `tests/account-ui.test.ts` (13 source pins — RED 12/13 pre-fix, the one pass the trivially-true F5 docs guard) + `tests/e2e/account-ui.spec.ts` (9 behavioral tests, one scratch account deleted LAST; the verify-email bucket isolated via the H3 xff precedent — the shared localhost verify budget runs at exactly 10/15min and the 11th call would 429 M6). PAD Known-Issue #7 closed as a docs-truth row (the config sets no ignoreBuildErrors — the row described a flag retired earlier) | Accepted — Verified (542 unit + 196 e2e; RED→GREEN on both pin layers + the live manual probe of the full 403→resend→verify journey + the five v22 evidence captures) |

| ADR-032 | The v23 profile/name-edit superset: the account-surface family's completion — the account's `fullName` (rendered in the Mi Cuenta readout since v22, set once by the register form or the seed) gains its route and its dialog. (1) **`POST /api/auth/update-profile`** — the change-email family shape (`requireUser()` → per-user rate limit `updateProfile:${user.id}` 10/15min → `parseWith(updateProfileSchema)` → the route-side must-differ guard (posting the current name → 400 "This is already your name." — server state via requireUser's SessionUser, no extra read) → ONE `db.user.update` → `{ ok, name, user: publicUser(updated) }`). The schema: `fullName: z.string().trim().min(1).max(100)` (trim-then-validate; the register ceiling). (2) **The deliberate no-password family split**: the three ADR-030 credential routes verify the password FIRST because they rotate credentials or destroy the account; `fullName` is a benign display field with zero auth-bearing semantics, so the matching posture is the store SETTINGS PATCH (session-gated, no password, rate-limited) — cargo-cult password prompts on benign fields are not security. Disclosed in DEPLOYMENT.md §10 (the five-endpoint table now). (3) **The "Cambiar nombre" dialog** (`settings-view.tsx`): the FOURTH Mi Cuenta action (between the email rotation and the destructive exit — the destructive stays last), the measured Dialog grammar (max-w-lg, key-remount, the 42px glass-button footer), the TRANSPARENT settings-view input (measured trap 13) PREFILLED with the current name, `onChanged(name)` patching the readout's `me.name` (the change-email `onChanged(email)` seam — the route response is the source of truth). (4) **The pins extend, never weaken**: the V22 "three actions" pin grew to the four-action superset; the wiring pin added `/api/auth/update-profile`; 8 new pins guard the route's family shape + the schema + the dialog seam; 1 new e2e behavioral test (the name round-trip: prefill → must-differ 400 → happy path → readout update → a fresh-context `/api/auth/me` reflecting the new name — the no-storageState discipline). (5) The V21 route-count pin caught the new route exactly as designed (the filesystem hit 28 while DEPLOYMENT.md claimed 27 — the count-the-things rule working); DEPLOYMENT.md updated in the same commit | Accepted — Verified (550 unit + 197 e2e; RED→GREEN on the pin layer (9/21 RED pre-fix) + the live manual round-trip: the four-button row, the prefilled dialog, the must-differ 400, the readout + server state update, the seeded name restored + the four v23 evidence captures) |
| ADR-033 | The v24 gate-coverage truth contract (the neo-crm session-195 doctrine adopted): a shipped behavioral claim that a doc or a consumer leans on, but that no standing assertion pins, is a latent regression — every gate can stay green while the contract silently falsifies. The four claims this cycle found and pinned: (1) **The true-HTTP-404 status** — both 404 e2e tests reached the surface via `page.goto` (which tolerates any status); the cure is the `page.request.get` status assertion INSIDE navigation.spec.ts's existing test (the born-green freeze form — the live-verified truth frozen; a battery gap, not a behavior bug). (2) **The public 404 surface in the a11y register** — the smoke covered dashboard/drawer/login only; the 404 (the one PUBLIC app surface, the SD-20 superset — live-verified no login bounce) is now registered at BOTH widths (1280×800 + 390×844) in the logged-out anon-surface form, the same disclosed color-contrast deviation family. (3) **The e2e webServer child env is shell-state-proof** — the env block spread `...process.env` without pinning the auth-behavior knobs: a stray `RESET_INAPP_DELIVERY=1` parent-shell export would flip the C1 production-posture spec (the one-shot reset token would appear in the forgot-password response body — the flip mechanism demonstrated LIVE on a manual standalone boot), and a stray `AUTH_PROXY_HOPS=1` would break the H3 verify-bucket isolation (single-hop xff fails closed to "local", the shared localhost verify budget at exactly 10/15min). The cure: `RESET_INAPP_DELIVERY: ""` + `AUTH_PROXY_HOPS: "0"` pinned AFTER the spread (the neo-crm N-69a "the dev server lies" family); the determinism proven both ways (the suite with the stray exports stays 6/6 green — the pinned child env overrides the parent shell). (4) **The /api/health body contract** — three documented consumers (the Playwright webServer boot poll, the Docker healthcheck, the README verify-setup instruction) and zero assertions (the poll proves only a 2xx); the cure is the dedicated `tests/e2e/health.spec.ts` pinning the 200 + the exact `{status:"ok",db:"up",app:"veloxpos"}` body. (5) **F5, found by the RED run itself**: the e2e AUTH_SECRET was 62-hex under the S22 comment's "64-hex" claim — a docs-truth defect in the same family; cured with a genuine 64-hex value (the setup project re-signs-in each run, so the rotation is inert). The harness's own contract (the isolated e2e.db, NODE_ENV=production, the 64-hex AUTH_SECRET, the pinned seed identity) is frozen by the NEW `tests/e2e-harness.test.ts` (6 source pins; the two knob pins + the hex pin verified RED pre-fix) | Accepted — Verified (556 unit + 199 e2e; the RED→GREEN pin evidence (3/6 RED pre-fix) + the both-ways determinism proof + the four v24 evidence captures) |

| ADR-034 | The v25 drawer-open spine-freeze contract (the neo-crm session-196 doctrine adopted — the s195a1 wire-freeze doctrine's next member): the mobile drawer's RENDERED geometry is pinned as a complete box ledger, because behavior pins (the panel box, the pitch uniformity, the close paths, the focus contract) cannot catch a computed-margin regression — the trap-4 defect family this repo exists to guard. (1) **The spine ledger, live-measured then frozen**: panel `[0,0,288,844]` · header `[0,0,287,69]` (h-9 36 + p-4×2 32 + border-b 1) · nav `[0,69,287,727]` · footer `[0,796,287,48]` · close `[235,16,36,36]` · 8 links at `[12,y,263,40]` with y = 81+44k (81 = nav.y 69 + p-3 12; 796 + 48 = 844) + the footer "VeloxPOS" wordmark — read via the `expect.poll` starved-read idiom (the 200ms slide-in must settle) with EXACT equality on rounded reads; the heights are padding-driven, never font-driven, so the values are deterministic across dev and the standalone build. (2) **The mutation proof (the discipline that makes a born-green freeze pin trustworthy)**: a planted `mb-2` on the drawer header div (the exact s177/trap-4 computed-margin shape) → build → the pin goes RED at the shifted boxes (nav y 69→77, every link +8, footer +8) while the OTHER 11 drawer tests stay green — the battery gap demonstrated live, both directions; restored → GREEN. (3) **The lg-breakpoint close is pinned in the same spec** (mobile-chrome's matchMedia listener — "close if the viewport crosses into lg"): crossing 390→1280 unmounts the drawer AND resets `aria-expanded`; resizing back to 390 it STAYS closed (no `mobileMenuOpen` state leak under the visually-vanished lg:hidden overlay — the F2 regression's exact observable). The `lg:hidden` chrome asserts with `toBeHidden`, never `toHaveCount(0)` — `display:none` keeps the element in the DOM (the RED run's own catch). Both pins EXTEND `tests/e2e/mobile-navigation.spec.ts` in place (the drawer family's owner; the V24 in-place-extension precedent); counts only move up (199→201; the unit layer untouched at 556) | Accepted — Verified (556 unit + 201 e2e; the mutation-proof RED/GREEN evidence + the battery-gap demonstration (11 green under the mutation) + the live agent-browser spine walk + the four v25 evidence captures) |
| ADR-035 | The v26 failure-path truth contract (the ADR-033 gate-coverage doctrine continued at the unit layer): the failure branches a consumer leans on — not just the happy paths — need standing assertions, and the unit layer's `vi.mock` dissolves the "forcing a failure breaks the environment" objection that E2E-layer pinning cannot escape. (1) **The health DEGRADED branch** (`src/app/api/health/route.ts`'s catch → 503 + `{status:"degraded",db:"down",app:"veloxpos"}`) — a known-open disclosure carried since V24 on the belief that pinning it required breaking the DB mid-suite; but `vi.mock("@/lib/db")` is hoisted above the import, so the PrismaClient is never constructed and the probe rejects deterministically with zero DB involvement. The consumer that leans on the 503: docker-compose.yml's healthcheck `fetch(…).then(r => process.exit(r.ok ? 0 : 1))` — a regression to 200-with-degraded-body would report a broken-DB container as HEALTHY with every standing gate green. Pinned by the NEW `tests/health-route.test.ts` (2 tests: both branches' status + exact body). (2) **The boot-guard WIRING + the stale citation** — `src/instrumentation.ts`'s `register()` (fatal → `console.error` + `process.exit(1)`, the validated fail-fast; a plain throw is CAUGHT by Next and leaves a degraded 500-everything server) carried ZERO assertions while the file's own comment claimed "pinned by tests/e2e/s22-boot-guard.spec.ts" — a spec deleted in the V1 pivot (`0b78972`, the study-layer archive) and never replaced: the claim was FALSE today. The repo-wide citation sweep (16 test citations across `src/`, each existence-checked — 15 resolved, 1 stale) is the audit instrument this cycle adds. Pinned by the NEW `tests/boot-guard-wiring.test.ts` (5 tests: both fatal shapes → error + exit(1); both warn shapes → warn, NO exit; ok → silent) over the SPIED console + `process.exit` (mockImplementation — never a real exit; a live exit(1) would kill the vitest worker), with env save/restore around every case; the stale citation comment re-pointed at the real pin (comment-only — no existing pin scans the file). (3) **Both mutation-proven** (the V25 discipline extended to the unit layer): the planted 503→200 defect went RED at the status assertion (the Docker-healthcheck-blindness shape); the planted exit→throw defect (the comment's own documented regression) went RED at both fatal-path tests while the pure-seam env-check pins stayed green — the battery gap demonstrated; both restored → GREEN. Counts only move up (556→563 unit, 39→41 files; e2e untouched at 201) | Accepted — Verified (563 unit + 201 e2e; the mutation-proof RED/GREEN evidence for both pins + the citation-sweep ledger + the four v26 evidence captures) |
| ADR-036 | The v27 shell title-guard contract: a bare client effect write against a framework-owned DOM slot (document.title) is a RACE, not a write — the framework's own machinery (Next's client metadata manager re-applying the root layout title 5-6 times per boot, last write ~295ms post-commit, measured live by `scripts/probe-v27-title-race.ts`) can land after the effect's write and CLOBBER it permanently, because nothing re-fires a bare effect. (1) **The root cause closed**: the v9 Spanish-alias title flake (title-only failures, full-suite-only occurrences, re-run always green, zero code changes — V18 + V26 occurrences across a 9-cycle known-open watch) was this race; the probe quantified single-digit-ms margins (min 9ms natural / 11ms fast-auth between the shell's write and the manager's last write). The watch item retired WITH the mechanism, not with a hope: a post-fix recurrence of the title family gets a fresh investigation. (2) **The cure is the repo's own v7 precedent ported**: `src/app/not-found-title.tsx` solved the IDENTICAL race on the 404 surface with the guarded MutationObserver ("the guarded observer wins the last write"); V27 ports it to the shell's effect — apply-when-different (the write-loop guard), observe `document.head` (`subtree+childList+characterData`), disconnect on cleanup, keep the `[status, view]` deps (SPA pushState nav re-applies on view change; the manager never writes post-boot because the nav bypasses next/router). (3) **The pins replace the probabilistic race with a controlled clobber**: `tests/e2e/title-guard.spec.ts` writes the root title via `page.evaluate` AFTER ready (the same observable the flake leaves) and asserts the correction — born RED on the bare tree (the clobber sticks for the full 10s retry window, the flake's exact signature) and GREEN with the guard; the second pin re-runs the clobber post-SPA-nav (the guard re-arms on every route) and proves navigation titling survives. `tests/title-guard.test.ts` freezes the source wiring (the observer, the observe shape, the guarded write, the disconnect; the 404 surface keeps its own). (4) **MUTATION-PROVEN both directions**: the planted bare-write regression (the exact root-cause shape restored) flipped the pins RED (unit 4 + e2e 2) while the standing battery stayed green — the battery gap the pins close; restored → GREEN. Counts only move up (563→568 unit, 41→42 files; 201→203 e2e) | Accepted — Verified (568 unit + 203 e2e; the probe's margin ledger + the born-RED evidence + the mutation-proof RED/GREEN evidence + the four v27 evidence captures) |
| ADR-037 | The v28 shipped-artifacts truth contract: the repo's CLAIMS and the repo's MANIFEST are both shipped surfaces, and both need gate teeth. (1) **The script-reference family is scoped to the whole live-doc set, not one doc**: AGENTS.md §15 and retail-pos_SKILL.md had claimed since v6 that the head assets "regenerate via a generate-head-assets repo script" — a file with an EMPTY `git log --all` (the v6 workspace's generator never shipped; only the assets and the claims were committed). The standing pin ("references only scripts that exist") scanned `docs/DEPLOYMENT.md` ONLY — which is exactly how the stale claim survived 22 cycles: the claim family was real, the pin's scope was one doc wide (the ADR-033 gate-coverage shape). The cure: the truthful provenance statement (the assets are one-time-generated committed evidence) + the deployment-surfaces pin's block 10 iterating the SIX live operational docs (README, AGENTS, CLAUDE, PAD, SKILL, DEPLOYMENT.md) — historical session logs and executed plans under `docs/` are archives of what was true at their own time and stay OUT of scope by design; writing a NEW generator instead would be speculative scaffolding that byte-diffs the v6-verified evidence. (2) **The dependency census is standing**: the web-application skill §2 rule ("every dependency must have a live import within one commit of being added; run a dead-dependency census periodically") had never run in this repo; the first run found FOUR dead riders — `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-toast` (the repo's toaster is the custom zustand build in `src/components/ui/toast.tsx`), and `bun-types` (empirically dead: `tsc --noEmit` passes with the package physically removed). Retired via `bun remove` (package.json + bun.lock move together — the manifest is touched only through the package manager); pinned by `tests/dependency-census.test.ts`: every manifest package earns a live string reference across the executable surface (src/, tests/, scripts/ minus the archive, prisma/, the root config files, package.json's own scripts block — the CLI tools earn their place through the commands the gate runs) OR an explicit INFRA allowlist row documenting its role (react-dom the Next runtime peer; @types/react + @types/react-dom the TSX compilation layer); the census file ITSELF is excluded from its own surface — its prose cites the packages it retired, and a census must not count its instrument as evidence. (3) **Both pins born RED on the standing tree and mutation-proven**: the doc pin RED on both stale citations then GREEN after the sweep (a planted bogus scripts/ reference flips it RED at the exact doc); the census RED on all four dead packages then GREEN after the removal (a planted fake package row flips it RED at the exact package). Counts only move up (568→577 unit, 42→43 files; e2e unchanged at 203) | Accepted — Verified (577 unit + 203 e2e; the born-RED evidence + both mutation proofs + the manifest/lockfile diff + the four v28 evidence captures) |


---

## 2. High-Level System Topology `[MANDATORY]`

```mermaid
flowchart TB
  B["Browser (SPA: one page, 8 views)"]
  subgraph NextServer["Next.js 16 standalone server"]
    MW["Route rewrites + middleware-less auth gate"]
    subgraph API["Route handlers /api/**"]
      AUTH["/api/auth/*"]
      CRUD["products · categories · registers · cashiers"]
      FLOW["shifts · sales · settings · dashboard · reports"]
    end
    SEAM["src/lib/server: http factories + entity delegates + auth"]
  end
  DB[("SQLite · <repo>/db/custom.db")]
  B -->|JSON over fetch (cookie session)| API
  API --> SEAM --> DB
```

- Single process; no external services; SQLite file storage. **Verified.**
- The SPA authenticates through an httpOnly cookie; a 401 from
  `/api/auth/me` bounces the shell to `/login` via full reload. **Verified.**

---

## 3. Application Architecture `[MANDATORY]`

### 3.1 The view layer

- **One page** (`src/app/page.tsx`): auth gate → splash → shell (Sidebar +
  MobileChrome + view switcher). The view syncs with `location.pathname`
  through `viewFromPath` (`src/lib/router.ts`) — the rewrite map keeps URLs
  canonical while the SPA never reloads on nav. **Verified** (e2e
  navigation.spec asserts pushState URLs).
- **Views** (`src/components/views/*-view.tsx`): terminal (grid + ticket +
  payment dialog), dashboard (KPIs + charts + low stock), inventario (table +
  product dialog), ventas (history + ticket detail), cajas (register cards +
  shift dialogs), cajeros (cashier CRUD + shift history), reportes (period
  windows + KPIs + SVG area chart + method breakdown), ajustes (settings
  form, live theming, category chips).
- **Chrome**: desktop sidebar — dark, fixed, 220px expanded / 68px collapsed,
  bottom-parked toggle; mobile (<1024px) — app bar (hamburger + brand) and
  the w-72 drawer (Esc/backdrop/route-change close, body scroll lock). The
  drawer nav and sidebar share ONE `NavItemLink` source. **Verified** (e2e
  pins the widths, the 288px panel, and the uniform 44px link pitch — the
  Tailwind v4 space-y trap stays dead).

### 3.2 State

- `useAppStore` — view, sidebar collapse (localStorage-persisted), drawer.
- `usePosStore` — the retail collections + settings, the in-progress ticket
  (`ticketAdd/SetQty/Remove/Clear`), `activeShift` (derived from shifts), and
  `loadCollections(keys)` (parallel `Promise.allSettled` fetchers; failures
  never block the shell). **Verified.**
- Dialog form state initializes per mount (key-remount) — the
  `react-hooks/set-state-in-effect` lint rule forbids effect-driven writes.
  **Verified** (lint green).

### 3.3 The API layer

- **Factories** (`src/lib/server/http.ts`): `withUser`/`withUserParams`
  (session gate + error mapper), `parseWith` (Zod → 400), 
  `makeCollectionRoutes`/`makeItemRoutes` (GET/POST + PATCH/DELETE).
- **Delegates** (`src/lib/server/entities.ts`): every query scoped
  `where:{userId}`; updates/removes verify ownership BEFORE mutating;
  `sentKeysPatch` filters partial PATCHes to schema-validated sent keys.
- **Hand-rolled flows**: shifts (open: 409 on duplicate open register,
  flips register status in a transaction; close: stamps count, closes the
  register), sales (open-shift gate, DB-side price/IVA recompute, stock
  decrement in the same transaction, server-generated ticket `V-XXXXXXXX`
  with P2002 retry), settings (upsert singleton), dashboard/reports
  (aggregations over local-day buckets).
- **Error contract**: Zod → 400 · P2002 → 409 · P2025 → 404 · no session →
  401 · business rules → 422 (insufficient stock, no active shift) ·
  unknown → 500 (server log only). **Verified.**

---

## 4. Data Architecture `[MANDATORY]`

### 4.1 Model map (Prisma/SQLite)

```
User 1─1 StoreSetting          Store identity (name, colors, ticket footer…)
User 1─* Category              unique(userId, name)
User 1─* Product               unique(userId, name); optional category (SetNull)
User 1─* Register (Caja)       status closed|open
User 1─* Cashier               optional email, active flag
User 1─* Shift (Turno)         register + cashier; openingFloat; closedAt?
User 1─* Sale                  ticketNo unique; method efectivo|tarjeta;
                               subtotal/tax/total cents; register/shift (SetNull)
Sale 1─* SaleItem              product (SetNull); name/price/iva snapshots
User 1─* VerificationToken, PasswordResetToken   (auth, unchanged from scaffold)
```

All money columns are integer **cents**; every user-owned model cascades on
user delete; sale history survives product/register deletion via SetNull.
**Verified** (tests/schema.test.ts pins the model list, cascades, cents).

### 4.2 The db-path contract

`.env` `DATABASE_URL="file:../db/custom.db"`. The Prisma CLI anchors
shell-provided relative URLs against `prisma/schema.prisma` →
`<repo>/db/custom.db`. The runtime resolves the same value in
`src/lib/db-path.ts` (anchor order: standalone-root → module-root → CWD).
**v3 hardening**: Next dev (Turbopack) pre-resolves the relative URL one
level off (`<project>/../db/custom.db`) and *creates that stray file on
boot* — when an absolute target is the default's name inside a `/db`
directory outside the repo while the repo owns its own `db/custom.db`, the
repo wins. Pinned by three `tests/db-path.test.ts` cases. **Verified.**

### 4.3 Seeding

`prisma/seed.ts` upserts: the owner (`SEED_OWNER_*`, password hashed with the
app's own scrypt seam), 6 categories (reference order), the 12 reference
products (11 read live + the count-pinned 12th — dossier §8), 2 registers,
1 cashier, and the 2 verified historical sales inside their closed shifts
(`V-MO6BJT7G` $21.46, `V-MMPNY55Z` $61.48). Idempotent: sales/shifts only
when the store has none. **Verified.**

---

## 5. Design System Reference `[CONDITIONAL]`

| Token | Value | Source |
|---|---|---|
| Canvas | `#080a14` | computed `body` on the live reference — Verified |
| Surface / raised | `#0d0f1a` / `#12141f` | sidebar computed style — Verified |
| Border / strong border | `#1e2235` / `#262a36` | sidebar computed style — Verified |
| Primary / secondary | `#6366f1` / `#8b5cf6` | the reference's own settings inputs — Verified |
| Gradient | `linear-gradient(to right, var(--vx-secondary), var(--vx-primary-deep))` | explicit sRGB (v4 oklab trap) |
| Success / warning / info | emerald-500 / amber-orange / blue-500 | stat chips + pills — Verified visually |
| Headings | slate-800/900 on dark (24–30px bold) | computed h1 styles — Verified |
| Radius / font | 12px controls, 16px cards / system ui-sans | computed — Verified |

Typography: system stack (`ui-sans-serif, system-ui, …`); tables use
uppercase bold 11–12px headers. The auth surface is intentionally LIGHT
(self-contained `vx-auth-page` utility). The Ajustes color pickers write
`--vx-primary` / `--vx-secondary` at runtime — settings-driven theming is
live. **Verified** (settings.spec e2e).

---

## 6. Security Architecture `[MANDATORY]`

| Control | Implementation | Evidence |
|---|---|---|
| Password storage | scrypt (64-byte key, 16-byte salt), `scrypt$salt$key` format | src/lib/auth.ts — Verified |
| Sessions | HMAC-signed stateless token, httpOnly cookie `sf_session`, 7-day TTL; verification re-proves the user exists AND the token's `v` matches the user's `tokenVersion` (ADR-012) | Verified (auth.test.ts + security.spec.ts) |
| Rate limiting | In-memory per-IP buckets on login/forgot/verify/register (10/15min) with in-flight pruning; successful login RESETS the user's bucket; the client IP is the x-forwarded-for hop at the DECLARED trusted depth (`AUTH_PROXY_HOPS`, fail-closed) | Verified (security-hardening.test.ts + security.spec.ts) |
| Login timing | The unknown-email branch burns a real scrypt verify against a throwaway hash — no enumeration oracle | Verified (UNKNOWN_ACCOUNT_HASH pin) |
| Reset delivery | The one-shot reset token never rides a production response (ADR-011); the flow is completed via reset-password with the tokenVersion bump | Verified (security.spec.ts) |
| OTP lockout | verify-email: IP limiter + per-token atomic 6-strike counter (spent rows invisible to the fetch) | Verified (security.spec.ts) |
| Request bodies | 1MB budget (413), JSON-only content types (415), malformed → 400 | Verified (http-body.test.ts) |
| Error mapping | ZodError/ValidationError → 400, BusinessRuleError → 422, ConflictError → 409, P2002 → 409, P2025 → 404, 413/415, unauth → 401, unknown → 500 (detail logged server-side only) | Verified |
| Boot guard | Production fatals on missing/blank/public-dev/`.env.example` `AUTH_SECRET` values (exit 1, not a degraded server) | Verified (env-check.test.ts) |
| Ownership | Every retail query scoped `where:{userId}`; deletes verify ownership first | Verified (delegates) |
| Input validation | Zod strip-mode on every write path; unknown keys dropped; partial PATCH filtered by `sentKeysPatch` | Verified |
| Injection | Prisma parameterized queries only; no string-built SQL | Verified (code inspection) |
| Secret hygiene | `.env` gitignored; seed password default documented as demo-only; no credentials in src (the reference account's email/password never appear in committed code — seed reads env) | Verified |
| Money integrity | Prices/IVA recomputed server-side from DB rows; client cannot set totals; efectivo must cover the total (`paymentCoversTotal` → 422) | Verified (sale-integrity pins) |
| Shift/stock integrity | Open-shift gate + GUARDED in-transaction stock decrement (`stock:{gte:qty}` — no oversell); duplicate-open re-checked inside the transaction → 409; delete guards on registers/cashiers with open shifts | Verified (sale-integrity.spec.ts) |

Threat notes: the login limiter is in-memory (per-process) — acceptable for
single-tenant self-hosting; multi-instance deploys need a shared store.
Social-login buttons are intentionally honest placeholders (no OAuth apps
configured; they explain instead of dead-ending). **Reasoned/Assumed.**

---

## 7. Worker / Background Service Architecture `[CONDITIONAL]`

None. There are no queues, schedulers, or background workers; everything is
request-scoped. `src/instrumentation.ts` runs the AUTH_SECRET boot check once
per server start (fail-fast in production). The Next.js dev indicator and
`dev.log`/`server.log` tees are the only operational surfaces. **Verified.**

---

## 8. Testing Strategy `[MANDATORY]`

Two layers, two runners, disjoint file globs:

| Layer | Runner | Scope | Count |
|---|---|---|---|
| Unit | vitest (`tests/**/*.test.ts`, `src/**/*.test.ts`, node env) | Pure seams + source pins | 577 tests / 43 files — Verified |
| E2E | playwright (chromium, standalone server on :3100) | Browser contracts | 203 specs — Verified |

- **Unit seams**: money (the verified ticket math), ticket (V-ID shape),
  router (8-view map + aliases), date (es-MX formatters), validation
  (schemas + gates), schema (model/cascade/cents pins + .env contract),
  tailwind-traps (the v4 space-y/theme/shadow rules in source), db-path
  (anchors + the v3 mangled-form hardening), auth (scrypt/HMAC/limiter),
  api-timeout/api-offline (the fetch seam), env-check, site, dev-preflight,
  health-route (BOTH probe branches incl. the 503 DEGRADED pin),
  boot-guard-wiring (register(): fatal/warn/ok over the spied console +
  process.exit), deployment-surfaces (block 10: the SIX-live-doc
  script-reference truth — v28/ADR-037), dependency-census (every
  manifest package earns its place — v28/ADR-037).
- **E2E**: navigation (8 routes + 404 WITH its true-HTTP-status pin +
  collapse widths), mobile-navigation
  (the drawer contract incl. TRAP-4 geometry guard + no-overflow sweep
  + the drawer-open SPINE FREEZE geometry ledger + the lg-breakpoint
  close — v25/ADR-034, mutation-proven),
  auth (logged-out surface, bad/good credentials), inventory (CRUD + search +
  chips), terminal-sales (no-shift gate → open shift → sell → receipt →
  stock decrement → close; cash-short block), registers (CRUD + guards),
  cashiers (CRUD), settings (round-trip + live chrome rename), reports
  (periods + verified KPIs), health (the public body contract — v24),
  title-guard (the controlled-clobber correction + the
  post-nav re-arm — v27/ADR-036, mutation-proven), a11y smoke (axe minus
  color-contrast, disclosed; the 404 registered at
  both widths — v24).
- **Infrastructure**: e2e boots `.next/standalone/server.js` on an isolated
  port with `db/e2e.db` (force-reset + reseeded per run); one storageState
  login (rate-limiter budget); `AUTH_SECRET` pinned to the 64-hex shape;
  the child env is SHELL-STATE-PROOF (`RESET_INAPP_DELIVERY: ""` +
  `AUTH_PROXY_HOPS: "0"` pinned after the spread — v24/ADR-033); the
  harness contract frozen by `tests/e2e-harness.test.ts`.
- **Gates**: `lint → typecheck → build → test → test:e2e`, all green at
  PAD v1.5.0 (worklog entry). Failure policy: fix the cause; never weaken a
  pin (AGENTS.md).

---

## 9. Build & Deployment `[MANDATORY]`

- **Build**: `bun run build` → Next standalone output; the script then copies
  `.next/static` and `public/` into `.next/standalone/` (self-contained
  server at `.next/standalone/server.js`). `outputFileTracingRoot` pins
  tracing to this repo. **Verified.**
- **Run**: `bun run start` (NODE_ENV=production) or `bun
  .next/standalone/server.js` with `PORT`; `Dockerfile` + `docs/DEPLOYMENT.md`
  carry the container path (inherited from the scaffold — re-verify the
  healthcheck app label before shipping a container).
- **Env for production**: absolute `DATABASE_URL` (or the repo-anchored
  contract if deployed in-place), a real 64-hex `AUTH_SECRET`
  (`openssl rand -hex 32`), `NEXT_PUBLIC_SITE_URL`.
- **DB migration**: `bun run db:push` (SQLite file). The db directory is
  gitignored; the seed rebuilds the reference dataset.
- **Screenshots**: `scripts/capture-screenshots.sh` regenerates
  `docs/screenshots/` against a running server.

---

## 10. Developer Handbook `[MANDATORY]`

- **Setup → daily loop**: see README Quick Start; the gate order is
  `lint → typecheck → build → test → test:e2e`.
- **Add a view**: `src/lib/router.ts` (ViewId/NAV_ITEMS/VIEW_TITLES) →
  rewrite in `next.config.ts` → view component in `src/components/views/` →
  registry in `src/app/page.tsx` → tests: router.test + a navigation.spec
  entry.
- **Add a model**: schema.prisma → `bun run db:push` → Zod schema in
  `src/lib/validation.ts` → delegate in `src/lib/server/entities.ts` (or a
  hand-rolled route via `withUser`) → store keys in `src/lib/store.ts` →
  schema.test pins.
- **Money**: never floats; use `src/lib/money.ts` (+ moneyCents at the
  boundary); new ticket math gets a money.test pin.
- **Styling**: tokens in `globals.css`; respect the five v4 trap rules
  (flex gap, full-color theme vars, pinned shadow, explicit gradients);
  run `bun run test` — tailwind-traps.test.ts guards the source.
- **Docs discipline**: behavior changes update AGENTS.md/CLAUDE.md/README/
  this PAD + `worklog.md` in the same change.

---

## 11. Known Issues & Outstanding Tasks `[MANDATORY]`

| # | Item | Status |
|---|---|---|
| 1 | Reference dead ends designed-from-language (active-shift terminal UI, payment dialog, close-shift dialog are unobservable on the reference) | Disclosed — dossier §8; treated as superset designs, evidence-labeled Assumed |
| 2 | The 12th seeded product is count-pinned only (below the reference's fold) | Disclosed — dossier §8 |
| 3 | In-memory rate limiter (per-process) | Accepted for single-tenant; revisit for multi-instance |
| 4 | ~~Product images: the dialog accepts a file but the clone does not store/serve uploads~~ | CLOSED by v6/ADR-016 (data-URL storage) — retired from the open list |
| 5 | ~~Receipt email action (`Mail` icon) is present but not wired (no SMTP)~~ | CLOSED by v6/ADR-016 (`mailto:` with the full ticket) — retired from the open list |
| 6 | ~~Dockerfile/DEPLOYMENT.md inherited from the scaffold reference the old app name in prose~~ | CLOSED by v21/ADR-030 (the deployment-surface truth pass: Dockerfile + compose rebranded, DEPLOYMENT.md rewritten to the shipped app, the account-security routes documented + pinned) — retired from the open list |
| 7 | ~~`next.config.ts` sets `typescript.ignoreBuildErrors: true` (scaffold default)~~ | CLOSED by v22/ADR-031 as a docs-truth row — the config sets NO `typescript` key at all (the flag was retired in an earlier cycle; the row was never swept). The mandatory `bun run typecheck` gate stays the contract (§8) |
| 8 | a11y: the reference's own low-contrast headings are replicated for parity (axe color-contrast excluded, disclosed) | Disclosed deviation |
| 9 | Per-route og:url/canonical/twitter:url variance (the reference varies them per route; the single-page architecture serves one server-rendered card — SD-14) | Disclosed deviation (v7) |

---

## 12. Key Files Reference `[MANDATORY]`

| File | Role |
|---|---|
| `src/app/page.tsx` | The shell: auth gate, pre-warm, view registry, live theming |
| `src/lib/router.ts` | The single view↔path map (+ aliases, titles) |
| `src/lib/store.ts` | Both Zustand stores; ticket math; activeShift pick |
| `src/lib/money.ts` | Cents/IVA/change — the verified money seam |
| `src/lib/ticket.ts` | `V-XXXXXXXX` ticket ids |
| `src/lib/validation.ts` | Every API payload schema |
| `src/lib/api.ts` | The client fetch seam (offline/timeout classes) |
| `src/lib/db-path.ts` | The DATABASE_URL resolution contract (v3-hardened) |
| `src/lib/server/http.ts` | Route factories + error mapper |
| `src/lib/server/entities.ts` | Owned delegates + sentKeysPatch |
| `src/app/api/sales/route.ts` | The sale transaction (gate, recompute, decrement) |
| `src/components/layout/sidebar.tsx` · `mobile-chrome.tsx` | The chrome + drawer |
| `src/components/views/terminal-view.tsx` | Grid + ticket + payment dialog |
| `src/app/globals.css` | The v4 design system + trap pins |
| `prisma/schema.prisma` · `prisma/seed.ts` | Data model + reference dataset |
| `tests/e2e/mobile-navigation.spec.ts` | The drawer contract + TRAP-4 guard |
| `docs/reference-investigation.md` | The evidence dossier |
| `scripts/capture-screenshots.sh` | The screenshot evidence generator |

---

## 13. Glossary `[CONDITIONAL]`

| Term | Meaning |
|---|---|
| Caja | Register — a physical checkout drawer |
| Cajero | Cashier — the person operating a shift |
| Turno | Shift — an open/close session on a register with a float and a count |
| Ticket | A sale's receipt (id `V-XXXXXXXX`) |
| IVA | VAT (default 16% in the reference's MXN context), per-product, price-exclusive |
| Fondo de caja inicial | Opening float |
| COBRAR | Charge/check-out action on the terminal |
| AGREGADO | The ticket panel's "added" kicker label (reference copy) |
