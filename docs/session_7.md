# Session 7 (V7) — the per-route title system + the data-lifecycle fixes

Baseline re-verified first: `main @ 9b82111` (the v6 close + the session-6
log commit), gates green (lint 0 · tsc 0 · 311/311 unit · build ✓ · 91/91
e2e). The reference was then re-probed across every pinned surface — shell
(220/244, vx-card), tables, tile glow, modal (11 fields, 42px glass pair),
switch (#7f62f4), head suite, mobile flex sidebar — **no drift**; the
clone's mobile drawer contract re-verified live (8 links, 44px pitch,
scroll-lock, focus lifecycle, Escape + focus return) and via its e2e pins.

The audit then went where prior sessions hadn't probed. **The reference
titles EVERY route** — "Dashboard | VeloxPOS", "Inventory | VeloxPOS", …
"Store Settings | VeloxPOS", "Signup | VeloxPOS", and a title-cased route
slug on 404s ("/foo-bar-baz" → "Foo Bar Baz | VeloxPOS") — v6 had measured
only the root's bare "VeloxPOS". Source audit found the **"Quitar" image
clear was a silent server no-op** (the dialog sent `imageUrl: undefined`;
JSON.stringify drops the key and `sentKeysPatch` skips it — live-verified:
the preview returned on fresh reopen while the API still served the data
URL), the **settings logo preview the v6 plan promised never shipped** (no
img rendered; the reference live-renders a 56px data-URL preview at pick
time), and the **reference's product modal uses type=number** (spinners,
role=spinbutton) where the clone used text+inputMode. Plus docs staleness:
PAD §11 still listed the v6-closed items #4/#5 as open, and
retail-pos_SKILL.md carried 238/70 counts from the v4 era.

Execution (TDD — 13 unit pins + 7 e2e pins, all red first) surfaced three
more lessons mid-stream: **F4** — Next's client metadata manager re-applies
the root title once ~0-50ms after mount, so the 404's bare effect write was
overwritten before paint (probed at five delays: the custom title landed at
t=0, read "VeloxPOS" again at t=50, survived from t=200) — fixed with a
GUARDED MutationObserver that rewrites only when the title differs and
disconnects on unmount; **F5** — adding `src/app/signup/layout.tsx` made
`tsc` fail inside the GENERATED `.next/dev/types/validator.ts` until a
rebuild regenerated the stale global `LayoutRoutes` (rebuild before
typecheck after adding route segments); **F6** — the first logo-preview
implementation tripped the v5 swatch/no-fill source pins (`h-14`, a solid
backdrop) and was rebuilt at the reference-measured `h-[56px] w-[56px]`
with no backdrop — the pins were right to complain.

Shipped: `DOCUMENT_TITLES` + `documentTitleForPath()` in the router (pure,
unit-pinned on every route incl. aliases and the 404 slug transform), the
shell's post-ready title effect, the signup server layout ("Signup |
VeloxPOS"), `src/app/not-found-title.tsx` (the guarded observer), the
real `imageUrl: null` clear path (schema `.nullable()`; picker-cancel and
failed picks never touch the stored value), the five type=number dialog
fields with steps, and the Ajustes logo preview + Quitar (PATCHes
`logoUrl: null` — the full round-trip e2e-pinned).

Verification: **lint 0 · tsc 0 · build ✓ · 324/324 unit · 98/98 e2e**;
live parity probes on the changed surfaces (number+spinners+42px+title on
the modal; 56×56 preview → Quitar → API null on settings); 18 screenshots
regenerated; VLM spot-checks (inventario, ajustes, 404) → PASS. Docs
lockstep: AGENTS.md contracts 17-18, CLAUDE.md counts + title note,
README badge (324+98), PAD v1.5.0 + ADR-017 + §11 rows #4/#5 retired +
§8 counts, retail-pos_SKILL.md v1.2.0 (stale counts fixed + the v7 block),
.env.example re-verified (no change — nothing env-facing moved).

Known-open (disclosed): per-route og:url/canonical/twitter:url variance
(SD-14 — the single-page architecture serves one server-rendered card);
the reference's squashed 56×14 logo preview geometry (ours renders
aspect-true at 56px); numeric input types stay text+inputMode on the
payment/register/cashier dialogs (unobservable on the reference). All the
standing disclosures (in-memory limiter, no SMTP, donut palette, terminal
grid design) unchanged.
