# Session 5 (V6) — the functional-superset completion

Baseline re-verified first: `main @ 67ceea8`, gates green (lint 0 · tsc 0 ·
277/277 unit · build ✓ · 83/83 e2e) — the v5 close state intact. The
reference was then re-diffed against the v5 evidence ledger with fresh
computed-style probes: **no reference drift** (shell 220/244, table
contract, badge ramps, 12px inputs, reports H1, terminal rail, COBRAR —
all byte-identical), so this session chased clone-side gaps only.

The audit went where the three visual sweeps couldn't see — dead controls,
silent failures, and the document head. The mobile drawer contract was
re-verified end-to-end first (288px panel, 8 links, 40px+4px=44px pitch,
aria-expanded, scroll-lock, focus lifecycle, Escape) — fully green. The
sidebar collapse is identical on both apps (220→68px, all .3s).

Findings (docs/remediation-plan-v6.md — 18-item ledger): the UNITS enum
lacked the reference's Metro/Caja; the product image input and the settings
"Subir logo" were no-ops (the picked files were discarded — `void
imageFile` / filename-only); FOUR delete flows swallowed their failures
(`void err`, zero feedback, the mounted Toaster never called); the Ventas
mail button rendered with no onClick; the dialog buttons were 36px (cva
h-9) against the reference's 42px glass pair, with a deliberately hidden
Upload icon; the sidebar tile lacked the reference's violet glow; three
product-dialog inputs still carried solid fills plus 0.00 placeholders (v5
sweep misses); and the entire head suite was absent — the tab title had a
suffix, no OG/Twitter/apple/manifest, and the favicon was an orphaned
study-app graduation-cap mark while the reference serves its logo.

Execution (TDD, 34 unit + 9 e2e pins, all red first) surfaced three more
root causes mid-stream: the Switch's checked state used a dead token (it
rendered HOLLOW — the live cause behind the VLM's earlier "toggle off"
note) leading to the total sf-* purge across switch/toast/badge/card/
skeleton/progress/checkbox/slider; the F6 clobber — every glass Button
call site carried a cva variant whose bg utilities killed the glass fill
(fixed with a dedicated EMPTY `glass` variant, all 21 sites converted);
and settings `logoUrl` must be `.nullable()` because the column boots
NULL (caught by the settings e2e, pinned in units).

Shipped: `src/lib/image.ts` (canvas-resized data-URL storage for product
photos + the store logo), `src/lib/ticket-mail.ts` (the fully-formed
mailto: ticket), the completed Unidad enum, error toasts on every mutation
failure, the 42px dialog chrome, the violet tile glow, and the complete
head suite (title "VeloxPOS", the reference's description, OG/Twitter
cards, appleWebApp, a WORKING manifest, the app-router icon convention,
and the generated 1200×630 og-image — `scripts/generate-head-assets.py`).

Verification: **lint 0 · tsc 0 · build ✓ · 311/311 unit · 91/91 e2e**;
screenshots regenerated; VLM modal pair-comparison → MATCH (three earlier
VLM claims were probe-disproven false positives — every VLM finding is
confirmed by computed styles before it ships). Docs lockstep: AGENTS.md
contracts 14-16, CLAUDE.md + README counts, PAD v1.4.0 + ADR-016,
retail-pos_SKILL.md v6 block, .env.example re-verified unchanged.

Known-open (disclosed, unchanged): in-memory rate limiter single-instance;
no SMTP channel (mailto: is the local-first equivalent); donut palette +
populated legend unobservable on the reference; terminal product-grid
card design remains the documented superset decision.
