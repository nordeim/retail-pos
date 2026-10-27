# Session 23 (V15) — the hover micro-interaction families + the toast
question closed by evidence

Baseline re-established first: `git pull` acquired the remote's
session_22 transcript (the V14 execution record — the cycle had closed
at `36cc460`, gates 458 unit / 162 e2e, pushed and verified). The
workspace survived intact (deps, the three DBs, the Playwright chromium
binary, the correct `.env`); the baseline re-ran fully green before any
probing: **lint 0 · tsc 0 · build ✓ · 458/458 unit · 162/162 e2e**.
This round is the V15 cycle — session_21's suggested "remaining motion
language" sweep.

The audit's first question was the toast family (session_21's explicit
suggestion). It resolved with hard evidence: **the reference NEVER fires
a toast in any observable flow**. The settings save (`Guardar Cambios`)
issues `PUT …/entities/StoreSettings/…` → **403 Forbidden** with ZERO
user feedback (a MutationObserver caught only one spinner svg — the
save is silently broken for this account; the changed value never
persists); the product modal save issues `PUT …/entities/Product/…` →
**200**, closes the modal, refreshes the collection, and renders NO
feedback UI; the failed login renders the v12-pinned inline shadcn
Alert. The base44 platform's `region "Notifications alt+T"` (visible in
the login snapshot) never mounts a child in any flow. The clone's
zustand toaster stays the disclosed functional superset — the question
is closed, recorded in AGENTS.md 28 so no future cycle chases it.

The systematic sweep then dumped EVERY hover-bearing element on BOTH
apps (per view, `[class*=hover:]` + computed styles under real mouse
hovers) and found four families:

**F1 the icon action button family**: the reference's grammar is
`p-2 rounded-lg hover:bg-{c}-50 text-slate-400 hover:text-{c}-{n}
transition-colors` on EVERY row action — the clone's 6 sites (inventory
edit/delete, sales Eye/mail, cashiers edit/delete) dropped the
`transition-colors` (the registers delete already shipped it — the
guard).

**F2 the mail button's color family**: the reference's Ventas mail
button rides **BLUE** (`hover:bg-blue-50 text-slate-400
hover:text-blue-600 transition-colors`) — the clone shipped the Eye
button's indigo on both buttons.

**F3 the category chip's remove control**: the reference's Ajustes
chips carry **lucide trash2 w-3.5 h-3.5** (14×14 measured, on
`text-slate-400 hover:text-red-500 transition-colors`) — the clone
shipped an X h-3 w-3. The classes already matched; the icon did not.

**F4 the badge hover tints**: the reference's status badges carry the
shadcn stock `hover:bg-primary/80` + `transition-colors` — measured
under a real mouse hover: green-100 `rgb(220,252,231)` → the platform
violet `rgba(127,98,244,0.8)` with the text tone unchanged, 150ms; the
categoría badge rides `hover:bg-secondary/80` the same way. The clone's
StatusPill and categoría span had no hover at all. The register-card
pill (the CARD variant) carries no hover on the reference — it stays
hover-free.

**Verified at parity with no work**: the nav links
(`transition-all duration-150`), the sidebar collapse toggle, the TR
rows (`transition-colors` + `hover:bg-white/40`), the reports window
chips, `.glass-button`'s own CSS `transition: 0.15s`, the badges' rest
skins, and — a near-miss worth recording — the Subir logo label: the
reference's class string carries `text-slate-700`, but `.glass-button`'s
lavender `color` WINS the cascade — both apps compute
`rgba(200,210,255,0.8)` (computed parity; the class-string diff is
invisible). The reference's data state re-verified UNCHANGED (KPIs
$0.00/0/12/1, the Atún Dolores row, the date line); the Terminal still
shift-gated; the Cajas cashier combobox still empty (the standing
dead-end disclosure). The mobile navigation re-checked at 390px: the
reference renders its plain sidebar (220px expanded fresh / 68px
collapsed persisted — no drawer, no app bar); the clone's v12 drawer
superset holds (pinned by the mobile-navigation specs, green in the
162/162 baseline).

Execution (TDD — 12 unit pins + 4 e2e pins, red first): all 6 icon
action sites adopt the grammar (B1); the mail button goes blue; the
StatusPill TABLE variant gains `transition-colors hover:bg-primary/80`
(one edit, 8 sites) and the categoría span `hover:bg-secondary/80`
(B2); the chip's X swaps to Trash2 w-3.5 h-3.5 (B3); the grammar
alignment reaches the unobservable superset surfaces — the cashiers
CRUD, the two Quitar image-remove buttons, the terminal ticket line
remove (red-500 + transition) and the qty steppers (B4, SD-62,
disclosed).

Three tooling lessons surfaced (all hardened, none weakened):
(1) Tailwind v4 computes `bg-primary/80` through color-mix and Chromium
serializes it as `oklab(… / 0.8)` — even canvas `fillStyle` preserves
the notation on Chrome 155; the e2e pin reads the sRGB PIXEL bytes via
getImageData (±1 per channel is color-space rounding — the red channel
read 128 vs the 127 source), and palette families stay class-pinned
(the v10/v11 idiom). (2) Every agent-browser command after a
`mouse move` resets the hover state (the first subsequent eval still
sees `:hover`; the second and the screenshot do not) — hover evidence
rides Playwright's `page.mouse` with the hover verified before the shot
(`scripts/capture-v15-shots.ts`; the v13 lesson re-confirmed after the
agent-browser attempt produced two identical rest-state PNGs).
(3) `agent-browser eval` output is JSON-quoted — `tr -d '"\r'` before
passing coordinates on to `mouse move`.

Verification: **lint 0 · tsc 0 · build ✓ · 470/470 unit · 166/166 e2e**
(458+12 / 162+4); evidence from the production build via
`scripts/capture-v15-shots.sh` + the Playwright capture, all three new
shots VLM-verified: desktop-ventas-mail-hover.png (the mail button
blue-hovered beside the Eye's resting indigo),
desktop-badge-hover-violet.png (the Completada badge violet at 80% with
the green text unchanged), desktop-ajustes-categorias.png (the chip's
14×14 trash), plus the refreshed standard desktop-ajustes.png. Docs
lockstep: AGENTS.md contract 28, CLAUDE.md counts + the v15 block,
README badge (470+166), PAD v2.3.0 + ADR-025 + §8 counts,
retail-pos_SKILL.md v1.10.0, the plan with the full execution ledger,
this log, worklog.

Known-open (disclosed): the reference's own broken flows (the settings
save 403, the shift-gated terminal, the empty cashier combobox) have no
clone-side work to mirror; the reports with-data skins remain
unobservable (no sales in any window); every standing v8–v14 disclosure
unchanged (SD-14, SD-18, SD-19, SD-20, SD-23, the in-memory limiter,
the terminal grid, the squeezed-mobile charts, the terminal card hover,
--primary/--border token hygiene, the drawer's 200ms slide, the
reference's dead focus-ring classes on non-interactive badges).

Suggested next steps: hover the Ventas mail button to feel the blue
family land (and Tab-free — it is a mouse-only state), and open Ajustes
to see the chips' trash controls. The next cycle could sweep the LAST
unmeasured motion surface — the login page's social-button hovers (the
v12 family) — or run a full-page pixel-diff pass at both viewports to
catch any accumulated sub-pixel drift, or begin the performance pass
(Core Web Vitals) as the parity families are now deeply pinned.
