# VeloxPOS — Remediation Plan v15 (Session V14→v15, 2026-10-27)

> Scope: the remaining motion language session_21 itself suggested next —
> **the hover/press micro-interaction families** the earlier cycles never
> swept systematically, and **the toast question resolved with evidence**.
> The reference's toast system was probed across every observable flow and
> NEVER fires (see L1–L3) — the clone's toaster stays the disclosed
> functional superset. What the sweep DID find: the reference's icon action
> buttons all carry `transition-colors` where the clone's snap, the Ventas
> mail button rides a **blue** hover family where the clone ships indigo,
> the Ajustes category chip's remove control is a **Trash2 w-3.5 h-3.5**
> where the clone ships an X h-3 w-3, and the table badges carry the
> shadcn hover tints (`hover:bg-primary/80` measured violet
> `rgba(127,98,244,0.8)` at 150ms) where the clone's have none. Four
> finding families, all small, all live-measured on BOTH apps:
> **F1 the icon action button family** (the reference's row action grammar
> is `p-2 rounded-lg hover:bg-{c}-50 text-slate-400 hover:text-{c}-{n}
> transition-colors` — the clone's 6 sites drop the transition;
> registers-view's delete button already ships it),
> **F2 the mail button's color family** (reference:
> `hover:bg-blue-50 text-slate-400 hover:text-blue-600`; the clone ships
> the Eye button's indigo on both),
> **F3 the category chip remove icon** (reference: lucide **trash2
> w-3.5 h-3.5** on `text-slate-400 hover:text-red-500 transition-colors`;
> clone: lucide **x h-3 w-3** — the classes already match, the icon does
> not),
> **F4 the badge hover tints** (the reference's status badges — green
> Completada, slate statuses — carry `hover:bg-primary/80` + the 150ms
> `transition-colors`: measured `rgb(220,252,231)` →
> `rgba(127,98,244,0.8)` under a real mouse hover, text staying green-700;
> the categoría badge carries `hover:bg-secondary/80` the same way; the
> clone's StatusPill and categoría span have no hover at all).
> Baseline re-verified before audit: main @ f9697e0 (the v14 close 36cc460
> + the remote's session_22 transcript), gates green (lint 0 · tsc 0 ·
> build ✓ · unit 458/458 · e2e 162/162), probe server live on :3101.

## 0. Verification ledger (all live unless noted; ref vs clone)

| # | Item | Method | Reference | Clone | Verdict |
|---|------|--------|-----------|-------|---------|
| L1 | Toast on settings save | network + MutationObserver on Guardar Cambios | `PUT …/entities/StoreSettings/…` → **403 Forbidden**, ZERO DOM feedback (one spinner svg only) — the save is silently broken for this account | working save + success toast (v6 B4) | ref unobservable; clone = superset (disclosed) |
| L2 | Toast on product save | network + observer on the Editar Producto modal's Guardar | `PUT …/entities/Product/…` → **200**, modal closes, collection GET refreshes — ZERO feedback UI, no toast | working save + toast | ref has NO toast on success; clone = superset |
| L3 | Toast on failed login | observer over the Sign in click | the inline shadcn Alert ("Invalid email or password") — the v12-pinned family; NO platform toast (the base44 `region "Notifications alt+T"` never mounts a child) | inline alert family (v12) ✓ | at parity; toast question CLOSED |
| L4 | Data state | Dashboard KPIs + headings | UNCHANGED since v13: $0.00 / 0 / 12 / 1 low-stock, "Ventas — Últimos 7 días", the Atún Dolores row | seeded to mirror (v10) | no work |
| L5 | Icon action buttons | hover-inventory dump per view | every row action carries `transition-colors`: edit `hover:bg-indigo-50 … hover:text-indigo-600`, delete `hover:bg-red-50 … hover:text-red-500`, mail `hover:bg-blue-50 … hover:text-blue-600` | 6 sites (inventory ×2, sales ×2, cashiers ×2) ship the same families WITHOUT the transition; registers delete ✓ has it | **F1** |
| L6 | The mail button's family | class dump on Ventas rows | `p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors` (Eye = indigo) | both buttons `hover:bg-indigo-50 hover:text-indigo-600` | **F2** |
| L7 | Category chip remove | Ajustes chips | `text-slate-400 hover:text-red-500 transition-colors`, **lucide-trash2 w-3.5 h-3.5**, 14×14px | `vx-focus text-slate-400 transition-colors hover:text-red-500`, **lucide-x h-3 w-3**, 12×12px | **F3** (icon only) |
| L8 | Status badge hover | real mouse hover + computed styles | rest `rgb(220,252,231)` → hover **`rgba(127,98,244,0.8)`** (bg-primary/80), text stays `rgb(21,128,61)`, transition `color, background-color, border-color, text-decoration-color, fill, stroke` **0.15s** | StatusPill: no hover, no transition | **F4** |
| L9 | Categoría badge hover | class dump | `…transition-colors … bg-secondary text-secondary-foreground hover:bg-secondary/80` | the span ships the skin without `transition-colors hover:bg-secondary/80` | **F4** |
| L10 | --primary token parity | globals.css vs measured hover | platform violet `127 98 244` | `--primary: 127 98 244` ✓ — `hover:bg-primary/80` computes to the exact measured value | no work |
| L11 | Table rows / reports chips / nav links / sidebar toggle / glass-button | hover-inventory dump both apps | TR `transition-colors` + `hover:bg-white/40`; chips `transition-all` + `text-white/40 hover:text-white/70`; nav `transition-all duration-150`; toggle `transition-all`; `.glass-button` CSS `transition: 0.15s` | all identical (clone adds vx-focus — the a11y superset) | at parity |
| L12 | Subir logo label | computed styles | class carries `text-slate-700` but `.glass-button`'s `color` wins the cascade → renders **lavender `rgba(200,210,255,0.8)`** | renders the same lavender (no text-slate-700 needed) | **computed parity** — class-string diff is invisible |
| L13 | Register-card status pill | Cajas hover dump | NOT in the hover inventory — the card pill has no hover | StatusPill `variant="card"` has no hover | at parity |
| L14 | Mobile navigation | 390px both apps | the plain sidebar persists (220px expanded fresh / 68px collapsed persisted), main squeezed, NO drawer, NO app bar | the v12 app bar + 288px drawer (superset, pinned by mobile-navigation.spec.ts — 12 specs green in the 162/162 baseline) | superset (standing) |
| L15 | Terminal card hover | terminal hover dump | the grid is UNREACHABLE (shift-gated; no hover elements in the empty state) | `vx-card … transition-colors hover:border-violet-500/60` | standing disclosure |
| L16 | Cajeros CRUD buttons | ref Cajeros dump | NO action buttons — the view is read-only | edit/delete (superset, v6) | grammar alignment only (F1) |

## 1. Design decisions (resolved)

- **SD-58 — the icon-button grammar is a family contract.** The reference's
  measured grammar is `p-2 rounded-lg hover:bg-{c}-50 text-slate-400
  hover:text-{c}-{n} transition-colors` with per-action color families
  (edit/detail indigo, delete red, **mail blue**). The clone adopts it
  verbatim INCLUDING on unobservable surfaces (cashiers CRUD — the
  reference has none) so the family reads as one system. The registers
  delete button already ships it (no change).
- **SD-59 — the badge hover rides the tokens, not literals.** `hover:bg-primary/80`
  / `hover:bg-secondary/80` + `transition-colors` — the clone's
  `--primary: 127 98 244` is the reference's platform violet, so the
  computed hover is the measured `rgba(127,98,244,0.8)` without any new
  literals. The CARD variant (register pills) gets NO hover — L13.
- **SD-60 — the chip's remove control is the trash, not the ×.** The
  reference's category chip carries `lucide-trash2 w-3.5 h-3.5` (14×14).
  The clone swaps X→Trash2 at the same 14px box; the class string (already
  `text-slate-400 transition-colors hover:text-red-500`) is unchanged.
- **SD-61 — the toast family closes as unobservable-with-evidence.** Three
  flows probed (L1–L3): the reference never renders a toast. The clone's
  zustand toaster (v6) stays the disclosed functional superset — no
  visual-parity work exists to do.
- **SD-62 — grammar alignment on unobservable superset surfaces.** The
  "Quitar" image-remove buttons (settings + inventory editor) and the
  terminal ticket controls (line remove + qty steppers) adopt the same
  measured small-red/transition grammar (`hover:text-red-500
  transition-colors`) for family consistency, disclosed as unobservable
  (the reference's flows 403 or are shift-gated).

## 2. Execution batches (TDD: red → green → gate)

### B1 — F1+F2: the icon action button family (6 call sites + the mail blue)

- `inventory-view.tsx:194` edit: + `transition-colors`
- `inventory-view.tsx:203` delete: + `transition-colors`
- `sales-view.tsx:153` Eye: + `transition-colors`
- `sales-view.tsx:162` Mail: `hover:bg-indigo-50 hover:text-indigo-600` →
  `hover:bg-blue-50 hover:text-blue-600` + `transition-colors`
- `cashiers-view.tsx:123` edit + `:132` delete: + `transition-colors`
  (unobservable surface — SD-58 family contract)

### B2 — F4: the badge hover tints

- `shared.tsx` StatusPill TABLE variant: + `transition-colors
  hover:bg-primary/80` (covers all 8 table sites)
- `inventory-view.tsx:176` categoría span: + `transition-colors
  hover:bg-secondary/80`

### B3 — F3: the chip remove icon

- `settings-view.tsx`: import Trash2; the chip button's icon
  `<X className="h-3 w-3" />` → `<Trash2 className="h-3.5 w-3.5" />`

### B4 — SD-62: grammar alignment on unobservable surfaces

- `settings-view.tsx:175` + `inventory-view.tsx:507` (Quitar):
  `hover:text-red-400` → `hover:text-red-500`, + `transition-colors`
- `terminal-view.tsx:262` line remove: `hover:text-red-400` →
  `hover:text-red-500`, + `transition-colors`
- `terminal-view.tsx:273,285` qty steppers: + `transition-colors`

### B5 — pins (all red first) → gates → evidence → docs

## 3. Test plan (pins first — red)

Unit pins (`tests/functional-parity-v15.test.ts`, source-pin convention):
1. inventory edit/delete + sales Eye/mail + cashiers edit/delete carry
   `transition-colors` and their measured color families (mail = blue)
2. the mail button is BLUE (not indigo) — the anti-regression pin
3. StatusPill table variant carries `transition-colors hover:bg-primary/80`;
   the card variant does NOT
4. the categoría span carries `transition-colors hover:bg-secondary/80`
5. the category chip button renders Trash2 at w-3.5 h-3.5 (not X)
6. the registers delete button keeps `transition-colors` (guard)
7. the Quitar buttons + terminal line remove ride red-500 + transition

E2e pins (`tests/e2e/functional-parity-v15.spec.ts`, computed-style
convention):
1. hover the mail button → `background-color: rgb(239, 246, 255)` (blue-50)
   and the Eye stays indigo-50 `rgb(238, 242, 255)`
2. hover a Completada badge → `rgba(127, 98, 244, 0.8)` with a 150ms
   color transition; rest state green-100
3. the category chip's svg is lucide-trash2 at 14×14

## 4. Ship

- Full gates: lint → typecheck → build → unit → e2e
- Evidence: hover shots (mail blue, badge violet, chip trash) + the
  refreshed ajustes shot (the chip icon changed) into `docs/screenshots/`
- Docs lockstep: AGENTS.md (rule 28), CLAUDE.md (v15 block + counts),
  README badge, PAD (v2.3.0 + ADR-025), retail-pos_SKILL.md v1.10.0,
  docs/session_23.md, worklog
- Commit + SSH-wrapper push to main

## 5. Out of scope (disclosed)

- The reference's settings-save 403 (its own broken flow) — nothing to
  mirror; the clone's working save + toast is the superset (L1)
- The with-data skins of the reports tables (unobservable — no sales);
  every standing v8–v14 disclosure (SD-14/18/19/20/23, the in-memory
  limiter, the terminal grid, the squeezed-mobile charts, the terminal
  card hover, --primary/--border token hygiene, the drawer's 200ms slide)
- The reference's badge focus-ring classes (`focus:ring-2 …`) — dead
  weight on non-interactive DIVs; the clone's a11y superset covers focus
  where it is reachable
- The Subir logo label's class-string diff (L12 — computed parity)

## 6. Execution results (filled on completion — 2026-10-27)

All batches executed TDD; every pin ran red before its implementation.

- **B1 (F1+F2, SD-58)** — DONE. All 6 icon action sites adopt
  `transition-colors` + their measured families (inventory edit/delete,
  sales Eye/mail, cashiers edit/delete); the mail button's hover family
  goes BLUE (`hover:bg-blue-50 hover:text-blue-600`). The registers
  delete (the guard) was already compliant.
- **B2 (F4, SD-59)** — DONE. The StatusPill TABLE variant gains
  `transition-colors hover:bg-primary/80` (one edit, all 8 table sites);
  the card variant stays hover-free (pinned). The categoría span gains
  `transition-colors hover:bg-secondary/80`.
- **B3 (F3, SD-60)** — DONE. The chip's remove control swaps
  `<X className="h-3 w-3" />` → `<Trash2 className="h-3.5 w-3.5" />`
  (the X import retires; the v5 comment re-anchored to the L7
  measurement).
- **B4 (SD-62)** — DONE. Both Quitar buttons + the terminal ticket line
  remove ride `transition-colors hover:text-red-500`; the qty steppers
  gain `transition-colors`.
- **B4-the-pins** — DONE. 12 unit pins
  (`tests/functional-parity-v15.test.ts`, 10 red / 2 pre-existing
  guards green) + 4 e2e pins
  (`tests/e2e/functional-parity-v15.spec.ts`, 4 red / 1
  family-agnostic pass — its computed check is intentionally
  family-neutral, the family pinned via classes), all green after.

**E2e authoring lessons (hardened, not weakened):**
1. Tailwind v4 computes `bg-primary/80` through color-mix and Chromium
   serializes the result as `oklab(0.602… / 0.8)` — even canvas
   `fillStyle` preserves the notation (Chrome 155). The fix: read the
   sRGB PIXEL bytes via `getImageData` (±1 per channel is color-space
   rounding — the red channel read 128 vs the 127 source). Palette
   families stay CLASS-pinned (the v10/v11 idiom).
2. agent-browser resets the hover state on every command after a
   `mouse move` (the first subsequent eval still sees `:hover`; the
   second and the screenshot do not) — hover evidence rides
   Playwright's `page.mouse` with the hover state verified before the
   shot (`scripts/capture-v15-shots.ts`, the v13 lesson re-confirmed).
3. A bash subtlety: `agent-browser eval` output is JSON-quoted —
   `$(… | tr -d '"\r')` before passing coordinates to `mouse move`.

**Final gate: lint 0 · tsc 0 · build ✓ (exit 0, the 1 documented
pre-existing instrumentation warning) · unit 470/470 (458+12, 31 files)
· e2e 166/166 (162+4).**

Evidence: `scripts/capture-v15-shots.sh` (server boot) +
`scripts/capture-v15-shots.ts` (Playwright capture, hover-verified):
desktop-ventas-mail-hover.png (the mail button blue-hovered beside the
Eye's resting indigo — VLM-verified), desktop-badge-hover-violet.png
(the Completada badge violet at 80% with the green text — the computed
bg read `oklab(0.602373 0.0630121 -0.199254 / 0.8)`, the pixel bytes
127/98/244@204 within ±1 — VLM-verified),
desktop-ajustes-categorias.png (the chip's 14×14 trash — VLM-verified),
and the refreshed desktop-ajustes.png (standard set). Docs lockstep:
AGENTS.md contract 28, CLAUDE.md counts + the v15 block, README badge
(470+166), PAD v2.3.0 + ADR-025 + §8 counts, retail-pos_SKILL.md
v1.10.0, docs/session_23.md, this ledger, worklog.

Environment audit: `.env` → `DATABASE_URL="file:../db/custom.db"` ✓;
`db/` at the repo root (custom.db pushed + seeded) ✓; `.env.example`
tracked and current ✓; vitest + playwright suites configured and
extended ✓.
