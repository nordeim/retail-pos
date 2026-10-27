# Session 17 (V12) — the auth surface, below the card

Baseline re-verified first: a fresh clone of `main @ d125bca` (the v11 close
`c4a7a8d` + the remote's session_16 transcript), the workspace rebuilt (.env,
bun install, db push + seed, playwright chromium reinstalled after the
workspace reset), gates green (lint 0 · tsc 0 · build ✓ · 397/397 unit ·
127+12→139/139 e2e — one first-run order flake re-run clean, the documented
v10 lesson) — the v11 close intact. The v11 source diff was audited in full
(clean — useContainerWidth, the chart contracts, the focus grammar, the
token realignment all hold in code), and the reference's data state
re-verified row-by-row BEFORE any new probing: UNCHANGED since v11 (the same
2 sales, 12 products, $0.00/0/12/1 KPIs, the 5-row donut legend, the Atún
Dolores low-stock row) — no seeded-data work this cycle. The mobile drawer
contract re-verified live at 390px: fully green (288px panel, 8×40px links,
44px pitch, aria-expanded, scroll lock, Escape + focus return — an initial
probe artifact suggested an aria bug; the query was matching the HIDDEN
desktop collapse toggle, not the hamburger — the probe lesson: select
aria-expanded buttons BY LABEL, never by DOM order).

The audit then went where no prior session had measured: **the auth surface
family BELOW the card** (session_15's own suggested next step — the auth
verify/reset interaction states). Five finding families unlocked immediately.
**F1 the auth card chrome**: the reference's card carries a 4px slate
gradient HAIRLINE at its top edge (`absolute top-0 left-0 right-0 h-1
bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200`) clipped by
`overflow-hidden`, an `md:` padding step (`md:pt-12 md:pb-10 md:px-10`), and
a `text-center space-y-6 sm:space-y-8` column — the clone's card had none of
these (per-child margins at 20px vs the reference's 24/32px block gaps).
**F2 the login typography + layout grammar**: the reference's H1 is
RESPONSIVE (`text-2xl sm:text-3xl` — 24px mobile vs the clone's fixed 30px),
the subtext `text-sm sm:text-base font-medium` (14/16px, 500 — the clone
16px/400 always), the social buttons render `text-[16px]` (54px tall vs the
clone's text-sm/50px) with `hover:bg-slate-50 … hover:shadow-sm` and the
icon wrapper's `-ml-4` optical offset, the OR divider is a shadcn Separator
(the literal "or" uppercased by CSS, slate-500, tracking-wider — the clone
shipped a slate-400 "OR"), the form steps `space-y-4 sm:space-y-5` with
fields/actions groups, the Forgot/Sign-up pair is a sm:flex-row
justify-between ROW INSIDE the form (the clone stacked them full-width
outside), and the submit is `h-11 sm:h-12 … shadow-sm … transition-all
duration-200` (44px mobile vs the clone's fixed 48px). **F3 the forgot/sent
screens**: the clone's screens were Spanish one-offs — the reference's are
ENGLISH ("Reset your password", "Send reset link", "Back to sign in",
"Check your email") with a 24px H2 (the clone 20px), a 16px slate-600
subtext, the SMALLER controls (`h-10 sm:h-11`, placeholder slate-400 — one
notch below the login inputs), the back button at the TOP (`w-fit … -mb-2`),
and a sent screen the clone lacked entirely: the `w-14 h-14 sm:w-16
sm:h-16 bg-slate-100` icon circle + lucide-mail, the email as a
`font-medium text-slate-900` span, and the GREEN shadcn Alert
(`bg-green-50/70 border-green-200 rounded-xl p-4` + `text-green-700 text-sm
leading-relaxed`). **F4 the /reset-password page**: the reference's page is
the base44 PLATFORM template — a plain WHITE page (not the app gradient),
a `rounded-lg … shadow-lg bg-white overflow-hidden` card with a 2px
`bg-gray-900` top strip, the GRAY palette (`bg-gray-50/50 border-gray-200
focus:gray-400` inputs with lucide-lock gray-400), "Set new password" +
"Enter your new password for VeloxPOS", the New Password + Confirm New
Password pair (`pl-10 h-11`), the `text-xs text-gray-500` "Must be at least
8 characters" helper, the `h-11 bg-gray-900` "Reset password" submit, the
`w-full text-gray-600` "Back to login" — and NO token → the "Invalid Reset
Link" state (the `w-20 h-20 bg-red-100` circle + lucide-circle-alert). The
clone shipped a custom rounded-3xl indigo design. **F5 the error alert**:
the reference's login error is the shadcn Alert (`bg-red-50/70
border-red-200 rounded-xl p-4` + `text-red-700 text-sm leading-relaxed`,
rendered between the fields group and the actions group) — the clone shipped
`rounded-lg bg-red-50 px-3 py-2 text-red-600`.

Execution (TDD — 32 unit pins + 14 e2e pins, all red first): the AuthShell
rebuilt to the reference's card (hairline + overflow-hidden + md:padding +
the space-y column); the login surface reorganized to the column grammar
([logo] [h1+subtext wrapper] [the w-full block: social space-y-3 + OR +
form] with the footer row inside the form's actions group); the
AuthInput gained the `compact` variant (h-10 sm:h-11 + slate-400
placeholder — the forgot screen's own size); the forgot screen rebuilt
(back-at-top `w-fit … -mb-2`, 24px H2, English copy); the sent screen built
(icon circle + copy + green alert, with the in-app reset link riding INSIDE
the alert as the no-SMTP superset — the in-card token screen retired, the
flow landing on /reset-password like the email link would); the signup
surface aligned to the same grammar (English labels "Full name" /
"Verification code", the alert family); the /reset-password page rebuilt to
the platform template (white page, the gray card + 2px strip, the pair +
helper + client gates, the invalid state); and the shadcn Alert family
adopted for every auth error/success note (red/green/slate siblings). The
legacy pins realigned: the v4 social-height e2e pin 50→54px (the 16px
text's 24px line — updated, not weakened), the auth.spec copy pins ("or"
literal, the English social notice), and the v11 focus/outline pins all
held untouched.

Verification: **lint 0 · tsc 0 · build ✓ · 429/429 unit · 153/153 e2e**;
live parity probes on both apps — the hairline pixel-identical (the
reference's 4 rows of rgb(203,213,225) vs the clone's 4 rows of
rgb(202,213,226), oklab rounding only — a VLM spot-check CLAIMED the clone
lacked the strip; the pixel crop settled it, the v10 "VLM needs pixel
settlement" lesson again), the H1 24/30px, the social 54px/16px, the
submit 44/48px, the footer row side-by-side with Forgot at the content's
left edge (x=456 both apps), the forgot H2 24px + inputs 44px + back
12px above the H2, the sent circle 64px + alert 12px/p-4, the reset strip
2px + the English labels. All 18 screenshots regenerated from the
production build + 5 new auth-surface evidence shots (forgot, sent, reset,
reset-invalid, mobile-login). Docs lockstep: AGENTS.md contract 25,
CLAUDE.md counts + the v12 block, README badge (429+153), PAD v2.0.0 +
ADR-022 + §8 counts, retail-pos_SKILL.md v1.7.0, the plan with the full
execution ledger, this log, worklog.

Probe lessons recorded mid-flight: (1) the e2e webServer REUSES a running
:3100 server (`reuseExistingServer`) — a leftover probe server on the e2e
port makes the setup log in against the WRONG db (kill :3100 before e2e);
(2) `transition-all duration-200` buttons animate through viewport changes
— settle-wait ~350ms before reading heights (the v11 outline lesson
generalized to layout); (3) Tailwind v4 resolves palette colors through
oklab()/lab() in Chromium — probe-compare or assert the alpha ("/ 0.7)"),
never literal rgb strings; (4) login gates UNVERIFIED accounts — a
scratch-user round-trip must complete the verify step (the OTP rides the
register response); (5) resetting the OWNER mid-suite bumps tokenVersion
and kills the storageState session (the v10 order lesson) — always a
scratch user; (6) `page.evaluate` cannot reference Node-side consts (the
browser context) — inline the selectors.

Known-open (disclosed): the reference's social-button hover icon-transform
(the platform micro-interaction behind the OAuth dead-end — the wrapper
ships without the translate); the reference's login-card
`text-card-foreground` class (renders nothing new — the light card's
foreground is explicit slate-900 everywhere); the reference's /signup 404s
(SD-20 — the clone's public signup keeps its fields with the aligned
chrome only); the reference's platform "Notifications" region (base44
chrome, not the app — the clone's toaster stays the superset). All standing
v8/v9/v10/v11 disclosures unchanged (SD-14, SD-18, SD-19, SD-20, SD-23,
the "Detalle por método" table, in-memory limiter, terminal grid, the
squeezed-mobile charts, the donut tooltip content, the terminal card
hover, --primary/--border token hygiene).
