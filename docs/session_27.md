# Session 27 (V17) — the Core Web Vitals pass, the lazy view registry,
# and the mobile contract re-verified

Baseline re-established first: the workspace had been RESET (an empty
directory), so the cycle opened with a fresh `git clone` — main @
8250e12, the V16 close intact, the environment rebuilt from scratch
(bun install, `.env` from `.env.example`, db:push + db:seed, the
Playwright chromium-1243 install). The baseline re-ran fully green
before any probing: **lint 0 · tsc 0 · build ✓ · 478/478 unit ·
173/173 e2e** — matching the V16 close exactly. This round is the V17
cycle: session_25's suggested Core Web Vitals pass, plus the
task-mandated mobile-navigation re-verification and a fresh Tailwind v4
sweep.

**The mobile drawer contract re-verified LIVE, end-to-end** (the
task's particular emphasis — Playwright probes against the booted
standalone build, 390×844 + the short 390×480 viewport): the app bar
(64px, hamburger + brand), the drawer's full lifecycle (opens with
aria-expanded, closes via Esc / backdrop / route change, body scroll
locks and unlocks, focus lands IN the panel and RETURNS to the
hamburger), the geometry (288×844 panel, the computed `enter` 0.2s
animation, the transform −288 mid-flight, 8 links at the uniform 44px
pitch), the inside-panel scroll at short viewports (overflow-y auto,
the last link reachable after scrolling), and zero horizontal overflow
on all 8 routes. The reference re-confirmed live at 390px: NO menu
whatsoever — its 220px sidebar stays expanded and squeezes main to
170px wide. The drawer is the superset, working exactly as contracted.
The Tailwind v4 sweep found no new bugs: the drawer's `duration-200`
threads `--tw-duration` correctly (the INTENDED disclosed 200ms — the
v14 dialog trap forbids duration- on the DIALOG family only), the V16
palette pins hold, the trap tests are green.

**The CWV measurements (Lighthouse 13, desktop, both apps).** The
clone's public login: **86 / 100 / 100 / 100** (FCP 0.9s · LCP 2.4s ·
TBT 50ms · CLS 0). The reference's public login: **51** — FCP 5.4s,
LCP **14.4s**, 2,314 KiB (the clone ships 314 KiB — 7× lighter). The
clone outperforms the reference on every metric. The authed dashboard
(the methodology journey took two attempts): the first run attached
via CDP to a logged-in chromium — and measured the LOGGED-OUT BOUNCE,
because **Lighthouse opens a fresh incognito context on attach** (no
cookie sharing; the report's 401 console errors + the
`/Dashboard → /login?from_url` redirect chain gave it away). The
working channel: extract the `sf_session` cookie via a Playwright
login and inject it through `--extra-headers '{"Cookie": …}'` —
recorded as tooling lesson for every future authed audit.

**The finding and the fix.** The authed dashboard measured perf 54 —
TBT 550ms, LCP 3.7s — and the bootup breakdown pointed at the one
actionable cost: `page.tsx` statically imported ALL 8 views, so every
surface shipped ~69 KiB gz of view code it never runs (the react-dom
chunk at ~890ms is the framework floor). The fix (TDD — 8 unit pins
red first, then green; 3 e2e pins): the lazy view registry —
`VIEW_LOADERS` (one dynamic `import()` per view) through `React.lazy`,
with the boot effect prefetching the ACTIVE view's chunk in the same
parallel window as auth/me + the collection pre-warm (no Suspense gap
on the standard flow). The build split 17 → 27 chunks (terminal 12
KiB, dashboard 15, inventory 21 — none in the entry set). The e2e pin
scans every boot chunk's body for the terminal's "COBRAR" and proves
the dashboard never downloads it.

**The result: performance 54 → 67 (+13), TBT 550ms → 280ms (−49%),
LCP 3.7s → 3.5s** — with the full suite as the regression net. The
dashboard's Lighthouse a11y 94 decomposed into two reference-parity
deviations (color-contrast — the reference's own low-contrast family,
long disclosed; heading-order — H1→h3 measured IDENTICAL on the
reference's Dashboard the same day), so the record says parity wins
and no "fix" ships. The stale study-app Lighthouse reports
(localhost:3200, 2026-10-18 — the retired app's evidence) were
deleted; `docs/lighthouse/` now holds the v17 set + a methodology
README.

Verification: **lint 0 · tsc 0 · build ✓ · 486/486 unit · 176/176
e2e**; evidence: the refreshed standard 32-shot set +
`v17-mobile-drawer-short-viewport-scrolled.png` (the inside-scroll
proof) + the three Lighthouse reports. Docs lockstep: AGENTS.md
contract 30, CLAUDE.md counts + the v17 block, README badge + the
Views row + the lighthouse pointer, PAD v2.5.0 + ADR-027 + §8 counts,
retail-pos_SKILL.md v1.12.0, the plan with the full execution ledger,
this log, worklog.

Known-open (disclosed): the react-dom boot cost (~890ms — the
framework floor); the reference's own broken flows (the 403 settings
save, the shift-gated terminal, the empty cashier combobox) have no
clone-side work to mirror; the reports with-data skins remain
unobservable; every standing v8–v16 disclosure unchanged (SD-14,
SD-18..SD-23, SD-63..66, the viewport-locked reference scrolling, the
drawer's disclosed 200ms slide, the oklab gradient interpolation).

Suggested next steps: open the app on a phone-width window and switch
between views to feel the on-demand chunk loads (the first switch to
each view fetches its ~12-30 KiB chunk; the boot prefetch keeps the
initial route gap-free). The next cycle could sweep the reference's
REGISTER-card surfaces if its shift state ever changes, or profile the
terminal's product-grid interaction latency (INP) under a large
catalog.
