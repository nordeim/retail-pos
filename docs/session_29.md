# Session 29 (V18) — the error-recovery architecture,
# the runtime-reality measurement, and the audit ledger

The cycle opened with a clean `git pull` (main @ 76a3bee — only
`docs/session_28.md` arrived; the working tree was intact this time, so
no re-clone was needed). The core docs were re-read (AGENTS.md's 30
contracts, CLAUDE.md, README, the PAD's ADR index, retail-pos_SKILL.md
v1.12.0), then the V17 close was validated against the codebase
(page.tsx's `VIEW_LOADERS` registry + the boot prefetch + the Suspense
all in contract shape) and the baseline gates re-ran:
**lint 0 · tsc 0 · build ✓ · 486/486 unit · 176/176 e2e** — with ONE
unreproduced flake in the first e2e run (`/Ajustes renders the settings
view`, functional-parity-v9: the heading never appeared; the isolated
re-run and two further full runs green). Recorded as an observation,
root-caused by hypothesis later (see F2 below).

**The audit** (agent-browser on the reference, Playwright probes on the
booted standalone :3101): the reference's data state is UNCHANGED from
the V17 record (both cajas "Cerrada", 12 products Shampoo → Pan Bimbo,
2 sales, the Dashboard H1 + 3× H3 headings) — nothing new to mirror.
The mobile drawer contract re-verified LIVE again at 390×844 (the 64px
app bar, the 288×844 panel, 8 links, the body scroll lock, focus in +
focus return, the backdrop close, the route-change close, zero
horizontal overflow) — and the reference re-confirmed at 390px: NO
menu, its 220px sidebar squeezing main to 170px. The Tailwind v4 sweep
found nothing new (the trap tests green, the 95 `--color-` entries in
globals.css, the drawer's disclosed 200ms unchanged). session_27's
suggested INP measurement ran (in-page rAF-bracketed click→ticket-paint
on the terminal grid): **5.3–14.4 ms, median 13.4 ms** — far under the
200 ms "good" bar; no action.

**The finding — reproduced live, then fixed.** The V17 lazy registry
shipped a bare `<React.Suspense>` with NO error boundary anywhere (no
error.tsx, no global-error.tsx, no class boundary). A Playwright
route-abort of the settings chunk (`scripts/probe-v18-chunk-failure.ts`)
reproduced the failure exactly: the SPA navigation threw
`ChunkLoadError: Failed to load chunk /_next/static/chunks/2w6vrdma1wc3u.js
from module 53770` (the Turbopack message form, captured) and the ENTIRE
app unmounted to Next 16's built-in ENGLISH dead-end screen ("This page
couldn't load — Reload to try again, or go back") — sidebar gone, title
wiped, no recovery, wrong language for a Spanish-UI app. The stale-hash
redeploy case and the transient-blip case share this blast radius, and
the observed e2e flake has exactly this failure shape (F2 — recorded as
a hypothesis, not a verified root cause).

**The fix** (the neo-crm session-170 pattern, read from the task's
tech-stack reference repo and ported): the three-layer architecture.
Layer 1 — the pure seam `src/lib/chunk-recovery.ts` (the injectable
`isStaleChunkError`/`shouldHardReload`/`reloadOnStaleChunk` family; the
`veloxpos:chunk-reload-at` sessionStorage flag written BEFORE the
reload fires — the crash-mid-reload loop guard; the 10 s cooldown;
guarded storage that disables rather than throws). Layer 2 — the
in-page `ViewErrorBoundary` in page.tsx wrapping the Suspense (keyed
`${view}-${viewEpoch}`): a failed view keeps the SHELL alive; stale
chunks auto-reload once per cooldown; everything else gets the Spanish
card ("No se pudo cargar la vista" + "Reintentar"); Reintentar bumps
the epoch — the lazy registry is a `useMemo` keyed on it, because
`React.lazy` caches a rejected initializer FOREVER (only a fresh
instance re-imports). Layer 3 — the outer nets `src/app/error.tsx`
(segment) + `src/app/global-error.tsx` (root, self-contained html/body
+ globals.css, zero component-tree imports). The boot prefetch became
fire-and-forget-SILENT (`.catch(() => undefined)`).

**The measurement lesson (the cycle's "one new thing").** The first
REINTENTAR e2e pin failed in a fascinating way: a SINGLE aborted chunk
fetch never surfaces the card — debug instrumentation proved the
bundler runtime retries the fetch internally (request → FAILED →
retry-request → render; no boundary catch, no reload, no card). The
card is the surface for failures that PERSIST past the runtime's retry
budget. The pin was redesigned to the realistic scenario: a persistent
block (exhausting the runtime retry) with the cooldown pre-seeded
(suppressing the auto-reload) → the card; the block lifts; Reintentar
→ the fresh-registry import renders the view IN PLACE (the flag
untouched — no reload ever fired).

Verification: **lint 0 · tsc 0 · build ✓ · 509/509 unit (486+23, 35
files) · 179/179 e2e (176+3)**. TDD throughout: the 10 source pins +
the seam module ran RED first, then green; the e2e pins were authored
against the live failure semantics. Evidence: the reproduction probe +
the INP probe + `docs/screenshots/v18-view-recovery-card.png` (the
card + the shell alive) + `v18-view-recovery-healed.png` (the view
rendered after Reintentar). Docs lockstep: AGENTS.md contract 31,
CLAUDE.md the v18 block + counts, README the badge + the error-recovery
row, PAD v2.6.0 + ADR-028 + §8 counts, retail-pos_SKILL.md v1.13.0,
the plan's §6 ledger, this log, worklog.

Known-open (disclosed): the react-dom boot floor (~890 ms); the
reference's own broken flows (the 403 settings save, the empty cashier
combobox, the shift-gated terminal) have no clone-side work to mirror;
the reports with-data skins remain unobservable; the e2e flake is
hypothesis-linked (F2) — if it recurs post-fix it gets its own
investigation; every standing v8–v17 disclosure unchanged.

Suggested next steps: none blocking. If the next cycle wants a target:
the reference's REGISTER-card surfaces remain the standing watch item
(its shift state has not changed in three cycles), and the error-card
surfaces could get a VLM-verified screenshot pass on mobile widths
(only the desktop 1280 shots exist today).
