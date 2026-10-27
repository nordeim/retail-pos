# Worklog — /home/z/my-project

(created by Task 5-a; the file did not exist before this task)

---
Task ID: 5-a
Agent: general-purpose (code auditor)
Task: Mode C audit of the V1 pivot commits (8534fee..0519e30)

Work Log:
- Read AGENTS.md in full; read skills/web-application/SKILL.md (§5, §6, §7, §8, §14, §15, §16, §17, Appendix A/B), skills/code-review/SKILL.md, skills/code-review-and-audit/SKILL.md.
- Confirmed range via git log: pivot = ac818aa (feat), 0b78972 (test), 0519e30 (docs); base 8534fee. Diff scope: 455 files, dominated by R100 archive renames to scripts/archive-study-sweep/; audited the A/M source set (src/, prisma/, tests/, scripts/, next.config.ts, package.json, vitest.config.ts, playwright.config.ts).
- Read completely: money.ts, ticket.ts, db-path.ts, validation.ts, store.ts, api.ts, auth.ts, env-check.ts, server/auth.ts, server/http.ts, server/entities.ts, sales/route.ts, sales/[id], shifts/route.ts, shifts/[id]/close, products(+[id]), categories/registers/cashiers routes, dashboard, reports, settings, health, auth/login, auth/register, auth/forgot-password, auth/reset-password, auth/verify-email, auth/resend-verification, auth/change-password; prisma/schema.prisma, prisma/seed.ts; terminal-view.tsx, mobile-chrome.tsx, page.tsx, dashboard/sales/reports/settings views, pos/shared.tsx, login-surface.tsx, router.ts, site.ts; tests schema/money/tailwind-traps/date/validation/terminal-sales + global-setup.ts + helpers.ts; package.json, next.config.ts, vitest.config.ts, playwright.config.ts, tsconfig.json.
- Ran gates (read-only): bun run test → 147/147 in 14 files; bun run typecheck → 0; bun run lint → 0; bunx playwright test --list → 49 tests in 11 files.
- Live repro (temp file, deleted): delegate `.parse` path → toErrorResponse returns 500 for a ZodError; parseWith path → 400. Confirms the factory CRUD routes' 500-on-invalid bug.
- Greps: dangerouslySetInnerHTML/innerHTML/queryRawUnsafe/eval (1 hit = parameterized SELECT 1), unscoped Prisma queries (0 — every retail query carries userId), createContext (0), setState-in-effect patterns (none in the 8 views), StudyFlow/Omni-Study/MyDay terms in src/ (0) vs repo-root configs (package.json, next.config.ts:20, vitest.config.ts header).
- Count checks: CLAUDE.md "147 tests / 14 files" ✓, "49 specs" ✓ (Playwright's own total), README "147 + 49" ✓; vitest.config.ts header "28 files / 936 tests" ✗ stale.
- Checked omni-study1_SKILL.md (stale study-app skill, 44 study-domain term hits) and .env.example (present, VeloxPOS-branded, no real secrets; missing NEXT_PUBLIC_SITE_URL).

Stage Summary:
- Verdict: pivot conversion is disciplined (ownership scoping complete, integer-cents schema, 3-line route shells, key-remount dialogs, gates green, test counts truthful). Findings: 1 Critical / 3 High / 8 Medium / 11 Low / 6 Info.
- Critical: forgot-password returns the raw reset token in the unauthenticated 200 body (documented "response IS the delivery") → full account takeover on any network-reachable deploy; no prod disable knob.
- High: (1) entity-factory delegates call Zod `.parse` directly so invalid POST/PATCH on products/categories/registers/cashiers returns 500 not 400 (live-verified); (2) verify-email has no rate limit/attempt counter → 6-digit OTP brute force signs the attacker in; (3) clientIp trusts the first x-forwarded-for hop → all auth rate limits bypassable by header spoofing.
- Medium highlights: stock check outside the sale transaction (negative-stock race); dashboard weekly labels misaligned 6 days out of 7 (isoWeekday dead); terminal line display math diverges from money.lineTotalCents (1¢ discrepancies, AGENTS.md formula conflict); unbounded body reads + no Content-Type gate; unbounded sales/shifts list queries; no session revocation on reset (no tokenVersion); login timing enumeration; stale study identity (package.json "omni-study"/StudyFlow, dead quill/web-vitals/z-ai-sdk deps, dead src/lib/server/ai.ts).
- Docs/claims: test counts 147/49/14 all TRUE at runtime; stale counts only in vitest.config.ts header; .env.example exists, no secrets, missing NEXT_PUBLIC_SITE_URL; omni-study1_SKILL.md is stale.
- Suggested next actions: move delegate validation through parseWith (or map ZodError in toErrorResponse); add tokenVersion + revoke on reset; proxy-hop-aware clientIp; rate-limit verify-email; pull the stock check inside the sale transaction (guarded updateMany); relabel dashboard labels via isoWeekday; rename package.json + drop dead deps/ai.ts; decide the reset-delivery posture for anything beyond localhost.

---
Task ID: V3-R1..R5
Agent: general-purpose (remediation executor, session V3 2026-10-26)
Task: Execute remediation-plan-v3 end-to-end (the v2 batches were planned but
never executed before the prior crash), then ship: screenshots, docs
lockstep, retail-pos_SKILL.md, and the commit/push.

Work Log:
- Baseline re-verified after a fresh clone at `15c7020`: lint 0 · tsc 0 ·
  unit 147/147 · build ✓ · e2e 49/49 — matches the v2 plan's claim.
- Wrote `docs/remediation-plan-v3.md` (stable finding IDs + the live
  re-verification ledger from the 2026-10-26 reference sweep).
- R1 security (TDD, red→green): `inAppResetDeliveryEnabled` gate (C1),
  ZodError→400 in the mapper (H1), OTP IP-limit + 6-strike atomic counter
  (H2), `resolveClientIp` rightmost-hop fail-closed (H3), readJson 413/415
  (M4), tokenVersion revocation (M6), UNKNOWN_ACCOUNT_HASH timing equalizer
  (M7), in-flight bucket pruning (L10). Unit pins: security-hardening (12) +
  http-body (7) + schema (2). E2e: security.spec.ts ×5 in the true
  production posture (DB probe with ANSI-neutralized bun -e).
- R2 integrity (TDD): guarded in-tx stock decrement + BusinessRuleError 422
  (M1), terminal renders via lineTotalCents + AGENTS.md formula reconciled
  (M3), paymentCoversTotal cash gate 422 (L2), in-tx duplicate-open 409 via
  ConflictError (L4), sales list take:200 + shifts groupBy aggregates (M5),
  the @@index set (L8). E2e: sale-integrity.spec.ts ×5 (alphabetically after
  reports; afterAll restores shift state).
- R3 visual parity (TDD): SectionCard card/kicker variants (V1 —
  triple-verified slate-700 vs white/60), PageHeading fixed 24px (V2),
  thinLabelIndices ≤8 first+last (V3), weekWindow() rolling per-date labels
  (V4/M2), glass-button "Subir logo" control (V5), amber chip low-stock
  rows (V6). E2e: visual-parity.spec.ts ×7 with OKLCH probe comparison
  (Tailwind v4 never emits literal rgb); drawer geometry test hardened with
  expect.poll (the mid-animation flake).
- R4 hygiene (TDD): package.json identity `retail-pos` + bun remove quill/
  web-vitals/z-ai-web-dev-sdk + dead ai.ts deleted (M8), ignoreBuildErrors
  + noImplicitAny:false removed (L1), void hacks + identical ternary swept
  (L3), donut colorByName single map (L5), loadCollections burst toast (L6),
  .env.example NEXT_PUBLIC_SITE_URL + EXAMPLE_ENV_SECRET production-fatal
  (L9), drawer focus contract (L11) — rAF entry verified against
  activeElement WITH a latch (the unbounded retry shape was re-stealing
  focus from the user's first Tab — root-caused via error-context snapshot),
  Tab wrap, focus return. E2e: hygiene.spec.ts ×4.
- R5 ship: 18 screenshots regenerated via scripts/capture-screenshots.ts
  (same filenames, VLM spot-verified: title-case slate-700 headings, amber
  low-stock rows, integer axes); docs lockstep (AGENTS.md security contract
  section + drawer focus contract, CLAUDE.md counts/variants, README env
  table + badge, PAD v1.1.0 + ADR-011/012/013); retail-pos_SKILL.md
  distilled per skills/distill-codebase-skill + to-distill-project-into-skill;
  omni-study1_SKILL.md removed (history preserves it).
- Final gate: lint 0 · tsc 0 · build ✓ · unit 213/213 · e2e 70/70 — e2e run
  twice consecutively to confirm the drawer/flake fixes hold.

Stage Summary:
- All five remediation batches executed TDD with every batch's pins red
  first; 66 new unit pins + 21 new e2e specs; two e2e infra lessons became
  reusable patterns (poll-to-settle, OKLCH probe comparison).
- The mobile drawer is now the reference's own contract PLUS a full focus
  lifecycle; the re-steal latch is the pattern to copy (documented in
  retail-pos_SKILL.md §15 and AGENTS.md).
- Deliverables: docs/remediation-plan-v3.md, 4 new test files + 4 new e2e
  specs, scripts/capture-screenshots.ts, 18 refreshed screenshots, updated
  AGENTS/CLAUDE/README/PAD, retail-pos_SKILL.md, .env.example.
- Known-open (disclosed, out of scope): in-memory limiter single-instance
  only; no SMTP channel; image upload storage remains URL-based.

---
Task ID: V4-A..E
Agent: general-purpose (visual-parity auditor + remediation executor,
  session V4 2026-10-26)
Task: Deep visual/functional parity audit against the live reference
  (veloxposretail.base44.app) with computed-style probes, then execute
  remediation-plan-v4 TDD-first, ship screenshots/docs, and push.

Work Log:
- Baseline re-verified at `main @ 6606df3`: lint 0 · tsc 0 · unit
  213/213 · login 200 (`$Abcd1234` seed) · dev server healthy.
- Audit method: agent-browser logged into BOTH apps side by side; 10
  VLM pair-comparisons of the saved evidence screenshots, then every
  candidate gap re-verified with LIVE computed-style probes (DOM walks,
  getComputedStyle, pixel sampling, CSS rule extraction). Findings with
  hard evidence: V1 radius-scale drift (shadcn remap made every
  rounded-xl 16px vs the reference's native 12px), V2/V3 nav states
  (reference = translucent violet pill + white/40 inactive, clone =
  solid gradient pill + slate-400), V4/V5 sidebar brand row + toggle,
  V0 card system (reference = translucent rgba(16,18,32,.9) +
  white-alpha hairline + elevation shadow; clone = solid + flat), V6
  StatCard anatomy (blob + horizontal layout + gradient chips + 24px
  value), V7 reports cards icon-LEFT row layout, V7b period tabs,
  V8 login (card/socitals/inputs/submit/logo), V9 button system
  (.glass-button-primary/success CSS extracted live), V10 icon-button
  hovers, V11 low-stock amber-600, plus the route drift (/Inventario →
  /Inventory) and two nav icon mismatches (Dashboard=chart-column,
  Reportes=file-chart-column-increasing).
- Pixel-verified the reference's own bug: KPI values at text-slate-800
  on rgb(16,18,32) = 1.27:1 contrast (its Reports page uses white for
  the same element) — documented SD-1: clone keeps readable values.
- Wrote docs/remediation-plan-v4.md (ledger + decisions + 5 batches).
- B1 (TDD): native radius scale restored; nav active/inactive/brand/
  toggle contracts; mobile chrome brand chips aligned. The active
  pill's violet edge rides a RING, not a border — a border broke the
  drawer's pinned 44px pitch (caught by the TRAP-4 guard e2e).
- B2 (TDD): vx-card = the reference card system; StatCard restructured
  (blob + flex items-start justify-between + p-2.5 gradient chips +
  text-xs/slate-500 labels + text-2xl values); reports summary cards
  get layout="row" (icon-left, w-12 h-12 rounded-2xl chip, text-2xl
  font-black white values); period tabs = rounded-2xl container +
  bg-violet-600 active; low-stock row = the reference's light-amber
  tint (amber-50/50 + amber-100 chip + slate-700 name + amber-600
  count) — v3's V6 pins re-measured and updated to today's live DOM.
- B3 (TDD): glass-button re-probed (dark rgba(28,31,52,.85) variant —
  v3's white-glass measurement was stale) + glass-button-primary/
  success/warning utilities added (reference CSS verbatim); applied to
  every CTA (Nuevo Producto/Caja/Cajero, Guardar×2, Crear×3, Iniciar/
  Cerrar Turno, COBRAR 70px py-5 text-xl font-black, Confirmar,
  category chips, dialog Cancelars); icon-button hovers → indigo-50/
  red-50 per reference.
- B4 (TDD): AuthShell = rounded-2xl bg-white/95 backdrop-blur shadow-2xl
  on to-bottom-right slate-50→100; veloxpos-logo.png (downloaded from
  the reference CDN) in ring-4 ring-white/50 + glow; official social
  brand SVGs (Google/MS/FB/Apple paths extracted from the reference
  DOM); h-12 inputs (slate-50/50, text-base); near-black slate-900
  submits; signup refactored onto the shared AuthShell.
- Route alignment: /Inventario → /Inventory (router + next.config
  rewrite + all specs/helpers/scripts; /Inventario kept as alias);
  nav icons → ChartColumn + FileChartColumnIncreasing.
- Test deltas: +25 unit pins (tests/visual-parity-v4.test.ts, all red
  first) + 4 v4 e2e computed-style pins (nav pill 12px translucent,
  StatCard blob+24px, COBRAR 70px/900/16px, login card/social/submit/
  official-marks); v3's V6 unit+e2e pins re-measured to the live
  contract; TRAP-4 drawer pitch preserved (ring-not-border).
- Final gates: lint 0 · tsc 0 · build ✓ · unit 238/238 · e2e 74/74.
- Ship: 18 screenshots regenerated (same filenames); VLM spot-checks
  PASS (stat cards/nav/buttons/chips/login; logo areas EQUIVALENT —
  the reference's own white ring is invisible on its white card);
  docs lockstep (AGENTS.md contracts 6-10, CLAUDE.md counts, README
  tokens/badge, PAD v1.2.0 + ADR-014, retail-pos_SKILL.md §4 table +
  §15 patterns); .env.example verified complete.

Stage Summary:
- The v4 sweep closed every hard-evidence visual gap to the live
  reference; the clone remains the functional superset (drawer, cashier
  CRUD, ticket expansion, Cerrar Turno) with readable KPI values (SD-1)
  where the reference ships a 1.27:1 contrast bug.
- Reusable patterns: computed-style probe parity audits (screenshot
  VLM alone over-reports; probes + pixel sampling decide), ring-not-
  border for geometry-pinned active states, probe-identity color
  assertions for Tailwind v4 OKLCH, live CSS-rule extraction for
  design-system reproduction.
- Deliverables: docs/remediation-plan-v4.md, tests/visual-parity-v4
  .test.ts (+25), visual-parity.spec.ts v4 block (+4), public/
  veloxpos-logo.png, 18 refreshed screenshots, updated AGENTS/CLAUDE/
  README/PAD v1.2.0/retail-pos_SKILL.md.
- Known-open (unchanged from v3): in-memory limiter single-instance;
  no SMTP channel; image upload storage URL-based.

---
Task ID: V5-A..E
Agent: general-purpose (view-internals parity auditor + remediation
  executor, session V5 2026-10-26)
Task: Audit the v4-executed codebase for view-internals drift against the
  live reference (the systems v4 fixed vs the views they compose into),
  then execute remediation-plan-v5 TDD-first, ship screenshots/docs, and
  push.

Work Log:
- Baseline re-verified at `main @ 7ddacdb`: lint 0 · tsc 0 · unit
  239/239 · dev server healthy (docs said 238 — count drift noted).
- Audit method: agent-browser logged into BOTH apps (reference auth state
  reused); full-DOM dumps + computed-style probes of every view's
  internals + fresh 8-view screenshot sets on both sides; VLM pair
  comparisons used for discovery, every candidate then re-verified with
  live probes. 24-item ledger written into docs/remediation-plan-v5.md.
- Findings (hard evidence): G1 the shell gutter was DOUBLE-padded
  (ml-[244px] + px-6 → H1 at 268 vs the reference's 244); G2 the
  reference's Terminal is the ONE full-bleed view (flex h-screen, ticket
  as a border-l RAIL) while every other view is p-6; T1/T1b the table
  system (headers 11px-bold vs the reference's 12px/600, dark #1e2235
  hairlines vs slate-50, 2%-white hover vs 40%-white, violet ticket cells
  vs mono indigo-600, slate-400 body vs slate-600, misaligned paddings);
  T2 the reference ships TWO badge systems (6px soft table badges vs the
  register-card round pill) — the clone had one rounded-full emerald pill;
  T3 inputs were 6px-radius with solid fills (reference: 12px,
  transparent); T4 "Agregado" was misread as a permanent label — it is
  the reference's transient emerald success banner; T5 Ticket header is
  12px uppercase white/80 (not 18px slate-100); T6 COBRAR's icon is
  ShoppingBag (not Banknote); T7/T8 the terminal layout + muted
  empty-state card; R1 register-card anatomy (h-1 strip, 48px chip,
  slate-800 name); C1 the dense cajeros shifts table + title-case
  heading; F1 Reports is the reference's ONLY bright H1; F2 its chips are
  TINTED (15%/30%), not gradient (v4 had probed the wrong element
  family); F3/F4 dashboard grids + icon size; S1 settings (max-w-4xl,
  54px Guardar, square swatches, glass Agregar + glass category chips);
  H1 button.tsx carried dead study-app variants referencing sf-* classes
  that never existed in globals.css.
- B1-B9 executed TDD (37 unit pins + 9 e2e computed-style pins, all red
  first): flush gutter + terminal full-bleed (page.tsx); the reference
  table system across ventas/inventario/cajeros + the two-shape
  StatusPill + outline MethodPill + the neutral --secondary token
  (33 37 49 — a violet remnant the VLM caught post-fix, corrected +
  pinned); 12px transparent inputs (Input base + call-site sweep); the
  terminal rail restructure (transient Agregado banner with a handler
  timer — no set-state-in-effect, 12px Ticket header, 64px white/20
  empty state, totals only with lines, ShoppingBag COBRAR, muted
  empty-state card); register cards; cajeros; reports tone + tinted
  chips; dashboard grids; settings; button.tsx purged to real tokens.
- e2e pin lessons: locator-wait before every raw evaluate (three pins
  queried pre-hydration); border-color probes need their own
  borderBottomColor probe element (the shared helper reads .color); v4
  serializes opaque colors as bare lab() — no trailing alpha to assert.
- Final gates: lint 0 · tsc 0 · build ✓ · unit 277/277 · e2e 83/83.
- Ship: 18 screenshots regenerated; VLM spot-checks PASS (terminal
  rail/banner, inventory badges neutral-grey confirmed equivalent,
  remaining diffs = disclosed data/superset deltas only); docs lockstep
  (AGENTS.md contracts 11-13, CLAUDE.md counts + table contract, README
  badge/repo-name/capture-script, PAD v1.3.0 + ADR-015,
  retail-pos_SKILL.md §4 + §15 + v1.1.0, .env.example re-verified — no
  change).

Stage Summary:
- The v5 sweep closed every view-internals gap the live probe ledger
  surfaced; the clone remains the functional superset (drawer + focus
  lifecycle, cashier CRUD, ticket detail, Cerrar Turno, Agregado banner
  on real adds) at the reference's own muted design language.
- Reusable patterns: view-conditional shell geometry (one full-bleed
  view), transient banner with handler-owned timer (lint-safe), probe
  discipline for border-color vs color, the two-shape badge split.
- Deliverables: docs/remediation-plan-v5.md, tests/visual-parity-v5
  .test.ts (+38), visual-parity.spec.ts v5 block (+9), 18 refreshed
  screenshots, updated AGENTS/CLAUDE/README/PAD v1.3.0/SKILL v1.1.0.
- Known-open (unchanged): in-memory limiter single-instance; no SMTP
  channel; image upload storage URL-based; donut palette + populated
  legend design unobservable (reference renders empty); terminal product
  grid card design = superset decision (unobservable).

---
Task ID: V6-FULL
Agent: general-purpose (session V6, 2026-10-26)
Task: Full remediation-plan-v6 cycle for retail-pos (audit → plan → TDD
  execute → ship → push) — the functional-superset completion.

Work Log:
- Pulled to main @ 67ceea8 (the session-4 log commit); re-read all docs
  (AGENTS contracts 1-13, CLAUDE, README, PAD v1.3.0, SKILL v1.1.0,
  session_4, remediation-plan-v5, worklog).
- Baseline gates green (lint 0 · tsc 0 · 277/277 unit · build ✓ · 83/83
  e2e) — the v5 close state verified intact.
- Live audit both apps (fresh named agent-browser session): reference
  UNCHANGED vs the v5 ledger (shell/tables/badges/inputs/rail/reports all
  byte-identical); clone mobile drawer contract fully green (288px, 8
  links, 44px pitch, scroll-lock, focus lifecycle); sidebar collapse
  identical both sides.
- Findings (docs/remediation-plan-v6.md, 18-item ledger): UNITS enum
  missing Metro/Caja; product image input a no-op (void imageFile);
  settings logo the same; FOUR silent void-err deletes; the Ventas mail
  button dead (no onClick); dialog buttons 36px vs the reference's 42px
  (cva h-9) with a hidden Upload icon; sidebar tile missing the violet
  glow; 3 input fills + 0.00 placeholders (v5 misses); the ENTIRE head
  suite absent (title/OG/Twitter/apple/manifest/icon — the favicon was an
  orphaned study-app mark).
- Mid-execution discoveries: MORE dead sf-* tokens (switch rendered its
  checked state HOLLOW — live-caused the VLM's "toggle off" note; toast
  ramps, badge/card/skeleton/progress/checkbox/slider) — F5, purged to
  real tokens (switch → the measured #7f62f4); the F6 clobber — every
  glass Button site carried variant="outline"/default whose
  bg-transparent/bg-violet-600 utilities KILLED the glass fill/hairline
  → new EMPTY cva `glass` variant + all 21 sites converted; settings
  logoUrl must be .nullable() (the column boots NULL — caught by the
  settings e2e).
- TDD: 34 unit pins + 9 e2e pins written RED first
  (tests/functional-parity-v6.test.ts + tests/e2e/functional-parity-v6
  .spec.ts); new libs src/lib/image.ts + src/lib/ticket-mail.ts.
- Final gate: lint 0 · tsc 0 · build ✓ · 311/311 unit · 91/91 e2e.
- Screenshots regenerated ×2 (after the button fix); VLM modal pair →
  MATCH; head assets generated (scripts/generate-head-assets.py →
  icon.png/apple-icon.png/icon-192/icon-512/og-image.png/manifest.json).
- Docs lockstep: AGENTS.md contracts 14-16, CLAUDE.md + README counts,
  PAD v1.4.0 + ADR-016, retail-pos_SKILL.md v6 block, .env.example
  re-verified (no change).

Stage Summary:
- v6 closed the dead-control class of gap entirely: every rendered
  control now does something real (unit select, image/logo data-URL
  storage, error toasts, ticket mailto:), the dialog chrome matches the
  reference's 42px glass pair, and the shipped head/site identity is
  complete (favicon, cards, manifest, og-image).
- Probe lessons recorded: VLM claims need computed-style confirmation
  (three false positives caught by probes; one real F6 bug found);
  Tailwind v4 serializes palette alphas as oklab()/ — pin geometry, not
  serialization; window.location is unforgeable — e2e wiring proofs ride
  the network layer instead.
- Known-open (unchanged): in-memory limiter single-instance; no SMTP
  channel (mailto: is the local-first equivalent); donut palette +
  populated legend unobservable; terminal product-grid design = superset
  decision.

---
Task ID: V7-AUDIT
Agent: general-purpose (session V7, 2026-10-26)
Task: Pull refresh, docs re-read, baseline verification, and the v7
audit (source + live both apps) ahead of remediation-plan-v7.

Work Log:
- Pulled to main @ 9b82111 (remote added docs/session_6.md only — the
  v6-close code is untouched). Re-read AGENTS.md (16 contracts), CLAUDE,
  README, PAD v1.4.0, retail-pos_SKILL.md, session_5/6, remediation-plan-v6,
  worklog.
- Baseline gates at 9b82111: lint 0 · tsc 0 · unit 311/311 · build ✓ ·
  e2e 91/91 — the v6 close verified intact.
- Source audit of the v6 diff: image.ts/ticket-mail.ts clean (typed guards,
  bitmap.close, pure builders); toasts wired on all 4 deletes; glass variant
  clean; head suite + manifest complete; SaleItem.lineTotal type-safe.
- Source findings: F1 — product image "Quitar" sends imageUrl:undefined,
  sentKeysPatch skips undefined, schema not nullable → the stored image
  SURVIVES a remove+save (live-verified end to end: preview returns on
  fresh reopen, API still returns the data URL). F3 — the `!file` branch
  clears the local preview on picker-cancel. F2 — the settings logo preview
  promised by v6 B3 + the code comment does NOT exist (no img rendered; the
  reference live-renders a 56px data-URL preview at pick time), and the
  logo cannot be removed once set.
- Live audit (agent-browser, both apps): reference UNCHANGED on shell
  (220/244, vx-card rgba(16,18,32,.9)), tables (12px/600/slate-500 headers,
  slate-50 hairlines), tile glow (rgba(139,92,246,.3) pair), modal (11
  fields, 42px glass buttons), switch (#7f62f4), head suite, mobile flex
  sidebar (still no drawer — clone drawer stays the superset). Clone drawer
  contract re-verified live: 8 links, 40px links, uniform 44px pitch,
  scroll-lock, aria-expanded, focus in/out, Escape + focus return.
- NEW reference behavior found: PER-ROUTE document titles — root
  "VeloxPOS", "Dashboard | VeloxPOS", "Inventory | VeloxPOS", "Sales |
  VeloxPOS", "Registers | VeloxPOS", "Cashiers | VeloxPOS", "Reports |
  VeloxPOS", "Store Settings | VeloxPOS", "Signup | VeloxPOS", and a
  title-cased slug title on 404s ("/foo-bar-baz" → "Foo Bar Baz |
  VeloxPOS"); og:title/og:url/canonical vary per route too. The clone ships
  a static "VeloxPOS" everywhere (v6 M1 measured only the root).
- NEW: the reference's product modal numeric fields are type=number
  (spinners render, role=spinbutton); the clone uses text+inputMode
  (measured live both sides; Categoría/Unidad triggers + image input
  byte-match).
- Docs staleness: PAD §11 rows #4/#5 still "Known gap" (both fixed in v6);
  retail-pos_SKILL.md §2/§3/§12 still carry 238/70 counts (actual 311/91).

Stage Summary:
- Findings for v7: F1 (High, image-clear server no-op), V1 (Medium,
  per-route titles), F2 (Medium, settings logo preview + remove), V2
  (Low, number inputs), F3 (Low, picker-cancel clear), D1/D2 (docs).
- Everything else the v6 ledger pinned is unchanged and green — no
  reference drift beyond the title system.

---
Task ID: V7-FULL
Agent: general-purpose (session V7, 2026-10-26)
Task: Full remediation-plan-v7 cycle (audit → plan → TDD execute → ship →
push) — the per-route title system + the data-lifecycle fixes.

Work Log:
- Baseline at 9b82111: lint 0 · tsc 0 · 311/311 unit · build ✓ · 91/91
  e2e (the v6 close intact; the remote's only delta was session_6.md).
- Audit (see V7-AUDIT entry): reference unchanged on every pinned
  surface; NEW findings = per-route titles (M1), image "Quitar" server
  no-op (F1), picker-cancel clear (F3), missing settings logo preview +
  no remove (F2), type=number modal fields (V2), PAD §11 + SKILL count
  staleness (D1/D2).
- Wrote docs/remediation-plan-v7.md (16-item ledger, SD-14..SD-17,
  B1-B5 batches, F4/F5/F6 execution findings appended mid-stream).
- TDD execution, all pins red first:
  - B1 titles: DOCUMENT_TITLES + documentTitleForPath() (router, pure);
    the shell effect (post-ready); signup/layout.tsx server metadata;
    not-found-title.tsx — initially a bare effect, live-probe showed
    Next's metadata manager re-applies the root title ~0-50ms after
    mount (F4) → GUARDED MutationObserver (rewrite-on-diff, disconnect
    on unmount).
  - B2 image clear: imageUrl .nullable(); dialog sends null on clear;
    !file bare return; failed picks leave the stored value untouched.
  - B3 numeric inputs: the five product-dialog fields type=number with
    steps (0.01 money / 1 counts).
  - B4 settings logo: 56px preview (h-[56px] w-[56px] — the v5 pins
    rejected h-14 w-14 + a solid backdrop, F6) + Quitar → PATCH null.
  - B5 docs: AGENTS.md contracts 17-18; CLAUDE.md 324/98 + title note;
    README badge 324+98; PAD v1.5.0 + ADR-017 + §11 #4/#5 retired +
    §8 counts de-staled; retail-pos_SKILL.md v1.2.0 (counts + v7 block).
- Tests: tests/functional-parity-v7.test.ts (13 unit pins) +
  tests/e2e/functional-parity-v7.spec.ts (7 e2e pins: SPA-switch titles,
  full-load titles ×8, 404 slug title, signup title, image-clear server
  round-trip incl. API null + fresh-dialog agreement, number-input
  spinners + native filtering, settings logo pick/Quitar/PATCH null).
- e2e lessons: locator('aside') is strict-mode ambiguous (sidebar +
  ticket rail both <aside>) → getByTestId("desktop-sidebar"); fill()
  refuses invalid text on number inputs → pressSequentially; the file
  input's id is settings-logo (the -input suffix is the testid).
- Final gate: lint 0 · tsc 0 · build ✓ · unit 324/324 · e2e 98/98.
- Ship: 18 screenshots regenerated; VLM spot-checks (inventario, ajustes,
  404) PASS; live parity probes on the changed surfaces (modal number +
  spinners + 42px + title; settings 56×56 preview → Quitar → API null);
  docs/session_7.md; this entry.

Stage Summary:
- v7 closed the title-system gap (every route + the 404 slug + signup),
  made "Quitar" a real server-side clear on both media paths, converted
  the modal's numeric fields to the reference's control type, shipped
  the missing logo preview + remove, and de-staled the docs (PAD §11
  rows retired, SKILL counts corrected to the live gate numbers).
- Probe lessons recorded: Next's client metadata manager re-applies the
  root title once after mount (guarded-observer pattern wins the last
  write); rebuild before typecheck after adding route segments (stale
  .next/types globals); source-sweep pins double as design review (the
  v5 swatch pin correctly rejected the first preview geometry).
- Known-open (disclosed): per-route og:url/canonical variance (SD-14);
  aspect-true 56px preview vs the reference's squashed 56×14; text
  inputs stay on the unobservable dialogs. Standing disclosures
  unchanged (in-memory limiter, no SMTP, donut palette, terminal grid).

---
Task ID: V8-FULL
Agent: general-purpose (session V8, 2026-10-26)
Task: Full remediation-plan-v8 cycle (audit → plan → TDD execute → ship →
push) — the from_url deep-link round-trip + the measured dialog/modal
sweep.

Work Log:
- Baseline at 4d1ac4c: lint 0 · tsc 0 · 324/324 unit · build ✓ · 98/98
  e2e (the v7 close intact; the remote's only delta was session_8.md).
- Audit: v7 source diff clean (all contracts hold); reference UNCHANGED
  on every pinned surface (shell/card/tile/drawer/reports/charts/
  searches/login-while-authenticated). NEW findings: the from_url
  round-trip (F1 — logged-out deep routes bounce to
  /login?from_url=<url> and RETURN there post-login; even 404s and
  /signup gate, base44 artifacts, SD-20; the reference's token lives in
  localStorage — the clone's httpOnly cookie is stronger, kept); the
  ticket modal's measured layout (F2 — 2×2 stacked meta grid, {qty}x
  lines, slate-100/200 dividers, 18px bold Total with the reference's
  own unreadable slate-800 disclosed as SD-18, Receipt/indigo-500
  title icon, no footer Close); the mail prompt (F3 — "Enviar ticket
  a:" then platform SMTP; clone prompts + pre-addressed mailto:, SD-19);
  the Ajustes hex inputs (F4 — editable Input vs the static span); the
  dialog chrome (F5 — #0f121a/#e7e9ef vs #12141f/slate-100; F6 — the
  dropdown panels are a THIRD surface, #161922).
- Wrote docs/remediation-plan-v8.md (14-item ledger, SD-18..SD-22,
  B1-B5 batches, F6/F7/F8 execution findings appended mid-stream).
- TDD execution, all pins red first:
  - B1: safeReturnTo(raw, origin) in router.ts (9-case matrix:
    same-origin/relative pass; foreign/protocol-relative/javascript:/
    data: fail closed to "/"; /login maps to "/"); the 401 gate carries
    from_url (pathname+search encoded); login returns through the seam.
  - B2: SaleDetailDialog rebuilt to the measured layout (grid meta,
    {qty}x lines, light dividers, text-lg bold Total, Receipt indigo,
    footer Close removed); 10 DialogContent sites → bg-[#0f121a]
    text-[#e7e9ef]; 5 SelectContent sites → bg-[#161922].
  - B3: window.prompt("Enviar ticket a:") + buildTicketMailto(sale, to)
    (cancel = no-op; back-compat without a recipient).
  - B4: the Personalización hex Inputs (two-way with the swatch; the
    hexColor schema regex is the server gate).
  - B5 docs: AGENTS.md 19-20; CLAUDE.md 342/105 + the auth round-trip
    note; README badge + Ventas/Auth rows; PAD v1.6.0 + ADR-018 + §8;
    SKILL v1.3.0 (counts + the v8 block); session_9.md; this entry.
- Tests: tests/functional-parity-v8.test.ts (18 unit pins) +
  tests/e2e/functional-parity-v8.spec.ts (7 e2e pins: the bounce, the
  return, the open-redirect guard, the modal geometry incl. the 2×2
  grid + 18px/700 Total + the one-≤20px-Close rule, the prompt dialog
  (page.once + concurrent accept/dismiss — a sync prompt BLOCKS the
  click), the hex two-way, the computed #0f121a).
- F7 legacy-pin alignment (contracts changed deliberately, pins updated
  not weakened): terminal-sales "3 × " → "3x "; v6 B5 mail pin arms the
  prompt accept; v6 B9's static-title assertion retired (a latent race
  vs the v7 title effect — failed on a warm-server isolated run; the
  v7 spec owns titles).
- Final gate: lint 0 · tsc 0 · build ✓ · unit 342/342 · e2e 105/105.
- Ship: 18 screenshots regenerated; VLM spot-checks (ajustes hex pairs,
  cobrar panel) PASS; live parity probes on every changed surface
  (/Cashiers deep link → login → return with title; modal grid/lines/
  Total/chrome; hex two-way; prompt + cancel no-op).

Stage Summary:
- v8 closed the auth deep-link gap (the reference's from_url round-trip
  with a fail-closed validator), rebuilt the ticket modal to its
  measured layout, added the mail recipient prompt with the
  pre-addressed mailto:, shipped the Ajustes hex inputs, and measured
  the dialog/dropdown chrome family (three surfaces: #0f121a dialogs,
  #161922 dropdowns, #e7e9ef text).
- Probe lessons recorded: dialogs and dropdown panels are DIFFERENT
  reference surfaces (measure them separately); a synchronous
  window.prompt blocks a Playwright click until handled concurrently;
  shadcn's X close carries an sr-only "Close" name (pin by width);
  legacy pins can carry latent races (B9 passed only while the first
  poll preceded the v7 title effect).
- Known-open (disclosed): SD-18 (readable Total tone), SD-19 (mailto:
  transport), SD-20 (public 404/signup superset). Standing disclosures
  unchanged (SD-14 og:url/canonical, aspect-true preview, unobservable
  dialog inputs, in-memory limiter, donut palette, terminal grid).

---
Task ID: V9
Agent: general-purpose (remediation executor, session V9 2026-10-26)
Task: The v9 cycle — audit the route-alias/table/chart surfaces no prior
session had probed, write remediation-plan-v9, execute it TDD, and ship.

Work Log:
- Baseline re-verified after pull (b7f0237 = v8 close + session_10.md
  transcript): lint 0 · tsc 0 · build ✓ · 342/342 unit · 105/105 e2e.
- Live audit (agent-browser, BOTH apps): the Spanish route aliases render
  the TERMINAL (the rewrites accept them; viewFromPath never mapped them —
  F1); the ref's title algorithm pinned across 9 probes (exact-case
  canonical match → canonical title, else slug-case — "/SALES" is "SALES |
  VeloxPOS" — F2); the ref's tables are BARE w-full (16px base — the
  Ventas Total renders 16px there, 14px on the clone via table-level
  text-sm — F3); --foreground #e7e9ef vs #f8fafc (F4); the chart SVG
  internals measured for the first time — the ref renders TWO skins
  (dashboard: #e2e8f0 "3 3" gridlines, #94a3b8 12px labels, salesGrad
  gradient 0.3, #6366f1 line w2.5; reports: white/4% gridlines, white/30%
  11px labels, gradient 0.35, line w2 — F5-F8); the Next.js dev badge had
  leaked into the shipped screenshots (F9); a clone-invented
  ShoppingBasket+VeloxPOS dashboard footer (F10 — scrollHeight-verified
  absent on the ref; initially dismissed by a flawed leaf-node DOM probe).
- Pinned-parity re-checks: mobile drawer contract fully green live (288px
  panel, 8×40px links, 44px pitch, scroll-lock, aria, Escape + focus
  return); ref mobile still has no drawer; 404 pages identical; table
  cell classes identical; low-stock card 1012px both; KPI casing is
  CSS-uppercased on both (invisible).
- Wrote docs/remediation-plan-v9.md (15-item ledger, SD-23..SD-28,
  B1-B5 batches, F10 folded in mid-execution).
- TDD execution, all pins red first (21 unit + 10 e2e):
  - B1: SPANISH_ALIASES in router.ts (viewFromPath/isKnownPath consult it
    after the canonical case-insensitive paths); documentTitleForPath went
    exact-case; the shell title effect reads the PATH (the [status, view]
    deps stay sufficient — SPA nav pairs view+path changes).
  - B2: the four ref-aligned tables dropped text-sm (sales, inventory,
    cashiers ×2 — the reports table is unobservable, kept).
  - B3: --foreground family → 231 233 239 (body/card/popover).
  - B4: SalesAreaChart variant="dashboard"|"reports" (CHART_SKINS: the
    salesGrad gradient defs + per-skin gridline/label/line values); the
    call sites pass their variants.
  - B4b (F10): the dashboard footer removed (+ the unused import).
  - B5: 18 screenshots regenerated from the PRODUCTION standalone build
    (scripts/capture-screenshots-prod.sh, :3100, db/custom.db) — no dev
    badge (VLM-verified); the dashboard re-shot after the footer removal.
- Legacy-pin alignment: v7's DOCUMENT_TITLES[view] source pin → the new
  documentTitleForPath contract (updated, not weakened); every other v7
  title pin survived the exact-case change verbatim.
- Final gate: lint 0 · tsc 0 · build ✓ · unit 363/363 · e2e 115/115.
- Docs lockstep: AGENTS.md 21-22; CLAUDE.md counts + the v9 notes; README
  badge + row (363+115); PAD v1.7.0 + ADR-019 + §8; SKILL v1.4.0 (counts +
  the v9 block); session_11.md; this entry.

Stage Summary:
- v9 made the route-alias superset whole (the six Spanish names + /Terminal
  resolve to their views), aligned the tab title to the reference's
  path-driven algorithm, restored the ref's table typography (the Ventas
  Total at its measured 16px), aligned the foreground token, shipped the
  two measured chart skins, removed the clone-invented dashboard footer,
  and moved the screenshot methodology to the production build.
- Probe lessons recorded: a rewrite-listed path MUST resolve in
  viewFromPath (the alias space is a contract surface); DOM probes for
  "does the ref have X" must search ALL descendants (a leaf-node filter
  missed the footer the VLM caught); chart SVG internals (gridline stroke/
  dash, gradient stops, label fill/size) are measurable attributes — pin
  them; the dev server leaks the Next.js badge into captures (shoot the
  production build).
- Known-open (disclosed): the ref's Spanish-path 404s not replicated
  (SD-23 superset); the Detalle-por-método table unobservable; donut
  palette standing. Standing v8 disclosures unchanged (SD-18/19/20,
  SD-14, aspect-true preview, in-memory limiter, terminal grid).

---
Task ID: V10
Agent: general-purpose (remediation executor, session V10 2026-10-27)
Task: The v10 cycle — audit the surfaces the reference finally renders
with data (the donut, the full tables), write remediation-plan-v10,
execute it TDD, and ship.

Work Log:
- Baseline re-verified after a fresh clone of main @ ba55cdb (the v9
  close + session_12 transcript): lint 0 · tsc 0 · build ✓ · 363/363
  unit · 115/115 e2e; workspace rebuilt (.env, deps, db push + seed).
- v9 source diff audited in full — every v9 contract holds in code.
- Live audit (agent-browser, BOTH apps): the reference's category DONUT
  rendered with full data for the first time and measured completely —
  filled sector paths (recharts), ring innerR 50 / outerR 80 at
  (166.5,100) in a 333×200 box, CCW from 3 o'clock, trailing-only 4°
  gaps, #fff 1px strokes, palette #6366f1→#ddd6fe + #22c55e, legend =
  FIRST 5 rows stacked below with slate-600/700 rows and 12px swatches
  (F1 — the v5 "unobservable donut" disclosure closes); the low-stock
  header gap 12px vs the clone's 16px (F2); the Ajustes per-section
  header icons at w-5 h-5 vs the clone's uniform violet-400 18px (F3);
  the registers page order Caja 2 first (F4); the seeded products in a
  different order with the 12th row's ASSUMED values vs the now-measured
  "Jabón Zote 400g"/7501025403010/stock 19 (F5); the sales' relativized
  dates vs the ref's fixed 19/04/26 22:09 + 14/03/26 01:45 (F6); the
  second sale's items WRONG at the same total (2x Coca + Sabritas vs 1x
  Jabón Zote + 1x Papel Higiénico = $61.48, F7); the reports X-ticks by
  even index vs the ref's day-step rule (30 → every 4th day ending day
  28; 90 → every 10th; 14 → every day; last day not forced, F8).
- Pinned-surface re-checks: the mobile drawer contract fully green live;
  the ref's mobile unchanged (220px squeeze, no burger); toasts silent
  both; chips/COBRAR/Terminal/Turnos headers identical; two VLM misreads
  (the "semi-circular gauge" donut claim, the "N avatar") settled by
  pixel probes; Tailwind v4's compiled palette documented as genuinely
  different from v3 hex (indigo-500 → #625fff) — class-based pins stay
  the idiom.
- Wrote docs/remediation-plan-v10.md (18-item ledger, SD-29..SD-36,
  B1-B6 batches).
- TDD execution, all pins red first (16 unit + 12 e2e):
  - B1: sectorPath() + the DonutChart rewrite (measured geometry,
    palette, white strokes, stacked layout, 5-row legend) + the
    byCategory [{createdAt asc},{id asc}] tiebreaker (SQLite tie order
    had flipped Higiene/Alimentos live).
  - B2: SectionCard titleClassName + the low-stock mb-3.
  - B3: the five measured Ajustes icon+color pairs (FileText/Tag replace
    receipt-text/tags).
  - B4: the seed rewritten to the ref's exact observable state (product
    page order, the real 12th row, Caja 2 before Caja 1, the exact
    April/March datetimes, the second sale's real items, staggered
    createdAt) + id tiebreakers on the delegates/product list.
  - B5: thinLabelIndices on the ref's rule; 2 visual-parity pins + 2
    reports data pins realigned (the empty-window parity state); the
    terminal-sales spec gained the LIVE post-sale reports assertion
    (order-robust numerics).
- Legacy-pin alignment: SEEDED_PRODUCTS to the ref's order; the hygiene
  L5 pin held verbatim (both donut consumers still read colorByName).
- Final gate: lint 0 · tsc 0 · build ✓ · unit 379/379 · e2e 127/127.
- Evidence: all 18 screenshots regenerated from the production build
  (the first run captured 8 identical login pages — the db password
  didn't match the capture script's hardcoded login; reseeded with the
  default contract and re-ran clean); VLM + pixel-verified (both donuts
  full rings, the dashboard chart flat 0-4, the low-stock card 1172px
  both, the KPIs identical).
- Docs lockstep: AGENTS.md contract 23; CLAUDE.md counts + the v10
  block; README badge (379+127); PAD v1.8.0 + ADR-020 + §8; SKILL v1.5.0
  (counts + the v10 block); session_13.md; this entry.

Stage Summary:
- v10 closed the reference's donut completely (the last "unobservable"
  chart surface), aligned the seeded data to the reference account's
  exact observable state (order, values, datetimes, items — the clone's
  dashboard chart now renders flat and its reports empty like the
  reference), made every list ordering deterministic against SQLite tie
  order, and adopted the reference's reports X-tick rule.
- Probe lessons recorded: VLM shape claims need pixel settlement;
  computed-color pins must stay class-based (v4's compiled palette
  differs from v3 hex); e2e evaluates need data-loaded waits (the
  placeholder state is indistinguishable from loaded-empty); e2e
  test-order pollution is real (order-robust ≥ assertions); a running
  dev server holds the deleted SQLite inode (restart after a db reset);
  the capture script's hardcoded login is a reseed contract.
- Known-open (disclosed): the ref's "Demo Cashier" shift (platform
  activity, not mirrored); the ref's "0 usuarios" cashiers state (the
  documented superset); the legend's slice(0,5) cap is an inference; the
  ref's register ordering rule (seed order reproduces the observable);
  the donut tooltip; the S4/S5 2° recharts float anomaly. Standing v8/v9
  disclosures unchanged.

---
Task ID: V11
Agent: general-purpose (remediation executor, session V11 2026-10-27)
Task: The v11 cycle — audit the chart containers + the interactive focus
states (the surfaces no prior session could measure), write
remediation-plan-v11, execute it TDD, and ship.

Work Log:
- Baseline re-verified after a fresh clone of main @ ed1d5cd (the v10
  close + session_14 transcript): lint 0 · tsc 0 · build ✓ · 379/379
  unit · 127/127 e2e (playwright chromium reinstalled after the reset);
  workspace rebuilt (.env, deps, db push + seed).
- v10 source diff audited in full — every v10 contract holds in code.
- Reference data state re-verified BEFORE probing: UNCHANGED since v10
  (same 2 sales/datetimes, 12 products, KPIs, donut legend, low-stock
  row, empty reports) — no seeded-data work this cycle. Mobile drawer
  re-verified live at 390px: fully green (288px panel, 44px pitch,
  scroll lock, Escape + focus return).
- Live audit (agent-browser, BOTH apps, 1440/1280/1024/390): F1 the
  chart CONTAINERS — the reference's recharts ResponsiveContainers
  re-wrap the viewBox to the container width with FIXED heights
  (dashboard 280 / reports 220 / donut 200) and a FIXED donut ring
  (innerR 50/outerR 80, cx = box/2, cap 333); the clone's aspect-locked
  SVGs rendered 254px vs 280 (dashboard, 1280), 424px vs 220 (reports),
  134px vs 160 (donut ring) — unpinned because every prior chart pin was
  an attribute pin, immune to scale. F2 the form-control chrome — the
  reference's app controls focus ring-1 in #7f62f4 with no offset (the
  clone shipped the shadcn ring-2 + 2px-offset indigo halo everywhere);
  --ring indigo-400 vs 127 98 244; the Input base missing text-base
  md:text-sm + shadow-sm; Textarea/SelectTrigger 6px-radius; the gap
  mt-1.5 vs mt-1 at 27 call sites; the glass buttons' violet outline
  focus missing; the auth inputs' slate-400-over-WHITE focus (the ref's
  auth routes swap --background to white at root) vs the clone's indigo
  over the dark canvas; pl-10/h-11 sm:h-12/md:text-sm/slate-600
  placeholder bases; the 3px white submit outline. F3 the chart
  tooltip — the recharts default skin measured (white card, 12px
  radius, 10px padding, 0 4px 20px shadow); the ref's own tooltip text
  is #e7e9ef-on-white (unreadable platform bug).
- Wrote docs/remediation-plan-v11.md (25-item ledger, SD-37..SD-40,
  B1-B5 batches).
- TDD execution, all pins red first (18 unit + 12 e2e):
  - B1: useContainerWidth (callback-ref measure at commit + RO +
    React 19 ref cleanup); SalesAreaChart on SALES_CHART_HEIGHTS
    (280/220) with fixed paddings; DonutChart on the fixed ring with
    the 333-cap re-wrapping box.
  - B2: tokens (--ring/--primary 127 98 244, --background 15 18 26
    with the body painting the #080a14 canvas token, --border 38 42
    54); the Input/Textarea/SelectTrigger/Button/Switch measured
    bases; the glass focus outline; mt-1.5 → mt-1 ×27; the Ajustes
    raw textarea → the Textarea component.
  - B3: the AuthShell's scoped white --background (RGB triplet — the
    HSL form parses as blue through rgb(), caught by the e2e); the
    auth inputs' slate-400 focus family + measured bases; the 3px
    white submit outlines.
  - B4: ChartTooltip (the measured skin, readable dark text — the
    SD-18 precedent) + pointer tracking on both charts.
- Legacy-pin alignment: the v10 donut box/M-point to the responsive
  contract (dynamic box, M = box/2 + 80); the v4 signup input heights;
  the v10 reports tick pins DATE-RELATIVE (the windows anchor to the
  current day — the absolute strings rolled over at UTC midnight
  mid-session, caught live).
- Final gate: lint 0 · tsc 0 · build ✓ · unit 397/397 · e2e 139/139.
- Evidence: all 18 screenshots regenerated from the production build;
  live parity probes — the dashboard chart 625×280/454×280 EXACT
  (viewBox identical to the reference's own), the reports 714×220/
  970×220 EXACT, the donut ring 160px at every viewport; the input
  focus shadow rgb(127, 98, 244) 0px 0px 0px 1px byte-identical.
- Docs lockstep: AGENTS.md contract 24; CLAUDE.md counts + the v11
  block; README badge (397+139); PAD v1.9.0 + ADR-021; SKILL v1.6.0;
  session_15.md; this entry.

Stage Summary:
- v11 made the charts container-faithful (the recharts geometry rule:
  fixed heights/radii + re-wrapping boxes — exact rendered parity at
  every measured viewport), adopted the reference's focus grammar (the
  ring-1 #7f62f4 edge family, the token realignment, the auth surface's
  own light-theme focus), and shipped the measured tooltip (closing the
  v10 donut-tooltip disclosure with the readable-superset posture).
- Probe lessons recorded: chart CONTAINERS are a parity surface — pin
  rendered geometry, not just attributes; transition-colors fades a
  focused outline in from currentColor (settle-wait ~300ms); the ref's
  glass-outline style/width alternates across states (the color is the
  stable fact — a deterministic 3px solid ships, disclosed); scoped
  tokens must follow the repo's RGB-triplet convention; reports tick
  pins are date-relative by necessity; the observable label→control gap
  is 8px on BOTH apps (the margin is 4 — pin the geometry).
- Known-open (disclosed): the ref's squeezed-mobile chart widths (its
  own broken 220px-sidebar mobile — the geometry rule replicates, not
  the squeeze); the donut tooltip's populated content on the ref (not
  reliably triggerable headlessly — the recharts default shape ships);
  the terminal product-card hover (unobservable — the ref's Terminal is
  shift-gated); --primary/--border are token hygiene (unrendered today).
  Standing v8/v9/v10 disclosures unchanged.

---
Task ID: V12
Agent: general-purpose (remediation executor, session V12 2026-10-27)
Task: The v12 cycle — audit the auth surface family BELOW the card
(session_15's own suggested next step), write remediation-plan-v12,
execute it TDD, and ship.

Work Log:
- Baseline re-verified after a fresh clone of main @ d125bca (the v11
  close + session_16 transcript): lint 0 · tsc 0 · build ✓ · 397/397
  unit · 139/139 e2e (one first-run order flake re-run clean); workspace
  rebuilt (.env, deps, db push + seed, chromium reinstalled).
- v11 source diff audited in full — every v11 contract holds in code.
- Reference data state re-verified BEFORE probing: UNCHANGED since v11
  (same 2 sales, 12 products, KPIs, donut legend, low-stock row) — no
  seeded-data work. Mobile drawer re-verified live at 390px: fully green
  (288px panel, 44px pitch, scroll lock, Escape + focus return — a probe
  artifact initially suggested an aria bug: the query matched the HIDDEN
  desktop collapse toggle first; select aria-expanded buttons BY LABEL).
- Live audit (agent-browser, BOTH apps, 1280 + 390, the auth family
  below the card): F1 the card chrome — the reference's auth card
  carries a 4px slate gradient hairline at its top edge + overflow-hidden
  + the md:pt-12/pb-10/px-10 padding step + the text-center space-y-6/8
  column (the clone had none; 20px per-child margins vs 24/32px gaps).
  F2 the login grammar — the responsive H1 (24/30 vs the clone's fixed
  30), the subtext (14/16/500 vs 16/400), the social buttons 16px text /
  54px (vs 14px/50px) + hover:bg-slate-50 + the -ml-4 icon offset, the
  OR chip (literal "or", slate-500, tracking-wider), the sm-stepped form
  groups, the Forgot/Sign-up footer ROW inside the form (the clone
  stacked them outside), the h-11 sm:h-12 submit (44px mobile vs 48).
  F3 the forgot/sent screens — the clone's Spanish one-offs vs the
  reference's English family (24px H2, 16px slate-600 subtext, h-10
  sm:h-11 controls + slate-400 placeholders, back-at-top -mb-2, and the
  sent screen's icon circle + green Alert the clone lacked entirely).
  F4 the /reset-password page — the reference's base44 PLATFORM template
  (white page, rounded-lg shadow-lg card + 2px bg-gray-900 strip, the
  gray palette, New Password + Confirm at h-11, the 8-char helper, the
  Invalid Reset Link state) vs the clone's custom indigo design.
  F5 the error alert — the reference's shadcn Alert (bg-red-50/70
  border-red-200 rounded-xl p-4 + text-red-700 text-sm leading-relaxed,
  between the fields and actions groups) vs the clone's rounded-lg box.
- Wrote docs/remediation-plan-v12.md (19-item ledger, SD-41..SD-45,
  B1-B6 batches).
- TDD execution, all pins red first (32 unit + 14 e2e):
  - B1: the AuthShell card (hairline + overflow-hidden + md:padding +
    the space-y column).
  - B2: the login grammar (the column children, the responsive
    typography, the 16px social buttons with the -ml-4 offset, the OR
    Separator, the form groups + the footer ROW, the h-11 sm:h-12
    submit); the signup surface rode the same grammar with English
    labels.
  - B3: the forgot screen (back-at-top, 24px H2, the compact AuthInput
    h-10 sm:h-11); the sent screen (icon circle + green Alert + the
    in-app reset link INSIDE the alert — the superset; the in-card token
    screen retired, the flow landing on /reset-password).
  - B4: the /reset-password page as the platform template (white page,
    the gray card + 2px strip, the pair + helper + client gates, the
    invalid state, the 404→invalid mapping, success → /login).
  - B5: the shadcn Alert family on every auth note (red/green/slate).
- Legacy-pin alignment: the v4 social-height pin 50→54px + the 16px
  assertion; the auth.spec copy pins ("or" + the English notice); the
  v4/v11 unit pins all held substring-compatible.
- Final gate: lint 0 · tsc 0 · build ✓ · unit 429/429 · e2e 153/153.
- Evidence: 18 screenshots regenerated + 5 new auth-surface shots
  (forgot/sent/reset/reset-invalid/mobile-login); live parity probes —
  the hairline pixel-identical (the VLM claimed it was missing; the
  pixel crop settled it — the v10 settlement lesson), H1 24/30, social
  54/16, submit 44/48, the footer row exact, the forgot/sent/reset
  geometry exact; a full scratch-user reset round-trip green.
- Docs lockstep: AGENTS.md contract 25; CLAUDE.md counts + the v12
  block; README badge (429+153); PAD v2.0.0 + ADR-022 + §8 counts; SKILL
  v1.7.0 (+ the §4 auth-chrome rows); session_17.md; this entry.

Stage Summary:
- v12 made the auth surface family card-faithful and grammar-faithful:
  the card chrome (hairline + md:padding + the space-y column), the
  login typography/layout (responsive H1/subtext, 16px social buttons,
  the OR Separator, the footer ROW, the 44px-mobile submit), the
  forgot/sent screens rebuilt to the reference's English family (with
  the in-app reset link as the disclosed superset), the /reset-password
  page rebuilt to the platform template, and the shadcn Alert family on
  every auth note.
- Probe lessons recorded: kill :3100 before e2e (the webServer reuses a
  running server against the WRONG db); transition-all animates through
  viewport changes (settle-wait ~350ms); v4 palette colors resolve
  through oklab()/lab() (probe-compare or assert the alpha); login gates
  unverified accounts (scratch flows must verify); resetting the owner
  kills the storageState session (always a scratch user);
  page.evaluate cannot see Node consts; VLM hairline claims need pixel
  settlement.
- Known-open (disclosed): the social hover icon-transform (the platform
  micro-interaction); the card's text-card-foreground class (renders
  nothing new); the reference's /signup 404 (SD-20 — the clone's
  superset keeps the aligned chrome); the platform Notifications region
  (base44 chrome — the clone's toaster stays the superset). Standing
  v8/v9/v10/v11 disclosures unchanged.

---
Task ID: V13
Agent: general-purpose (remediation executor, session V13 2026-10-27)
Task: The v13 cycle — audit the chart hover micro-interactions
(session_17's own suggested next step), write remediation-plan-v13,
execute it TDD, and ship.

Work Log:
- Baseline re-verified after git pull to main @ 5e7415c (the v12 close
  0268bd8 + the remote's session_18 transcript): lint 0 · tsc 0 ·
  build ✓ · 429/429 unit · 153/153 e2e — the v12 close intact; the
  v12 source diff audited in full (all contracts hold); the reference's
  data state re-verified BEFORE probing: UNCHANGED since v12.
- Live audit (agent-browser, BOTH apps, 1280): the chart HOVER family —
  a synthetic mousemove on the reference's chart svg activates its
  recharts tooltip + activeDot + cursor (the probe that unlocks the
  family headlessly), and the donut's tooltip yields to mouseenter ON
  THE SECTOR PATH (the v10/v11 "not reliably triggerable" disclosure
  closes). F1 the activeDot (recharts default: r=4, fill #6366f1,
  stroke #fff 2px — the clone had none). F2 the cursor (a vertical #ccc
  1px line at the active x spanning the plot — the clone had none).
  F3 the tooltip content (the recharts DEFAULT: the margin-0 label p +
  the ul/li item in the LINE color at 4px pad-y — the literal "ventas"
  dataKey + " : " + the RAW value, 16px; the label's inherited
  #e7e9ef-on-white is INVISIBLE — the platform's inheritance bug, the
  SD-18 readable superset stays). F4 the position + motion (the hybrid
  anchor: x = the snapped point's x + 10, y = the POINTER's y + 10 —
  three probes; the right-edge left-flip at the mirrored −10 gap;
  transition: transform 400ms; the wrapper PERSISTS with visibility
  toggling — the clone anchored centered above, no flip, no glide,
  unmounted on leave). F5 the donut tooltip's OWN skin (the RAW
  recharts default — 1px #ccc border, NO radius, NO shadow, the EMPTY
  label p, the BLACK "Lácteos : 2" item, anchored at the sector
  centroid with the same flip + glide — the v11 white-card skin was
  the SALES chart's, wrongly shared).
- Two disclosures RETIRED with measurements: the v12 social-icon hover
  transform (zero group-hover utilities on the reference — dead code
  there too, exact parity) and the donut-tooltip triggerability. At
  parity with no work: the reports window chips (the active
  bg-violet-600 + shadow-lg exact), the dashboard chart labels, the
  low-stock rows (no hover on either app), the donut sectors (no hover
  state on the reference), the reference's Terminal still shift-gated.
- Wrote docs/remediation-plan-v13.md (21-item ledger, SD-46..SD-52,
  B1-B4 batches).
- TDD execution, all pins red first (16 unit + 5 e2e):
  - B1: the SalesAreaChart hover state {idx, pointerY, visible}; the
    cursor line + the activeDot g under the visibility gate; the new
    SalesTip (the white-card skin + the recharts default content — the
    literal ventas name, the " : " separator, String(value), 16px, the
    readable #1e293b label) with tipTransform ((point.x + 10,
    pointer.y + 10) + the right-edge left-flip + the bottom guard),
    transition: transform 400ms, the persistent visibility wrapper, and
    useSelfMeasure (callback-ref + ResizeObserver — no
    setState-in-effect).
  - B2: the DonutTip (the raw skin: 1px #ccc border, no radius, no
    shadow, the empty label p, the black name : count item, the
    ring-midpoint anchor, the same flip + glide); "N productos"
    retired; the white-card skin lives only on the sales chart.
  - B3: the legacy realignments (the v11 unit ChartTooltip → SalesTip;
    the v11 line-chart leave pin → the persistent-wrapper contract; the
    v11 donut pin → donut-tooltip + "Lácteos : 2").
- Final gate: lint 0 · tsc 0 · build ✓ · unit 445/445 (429+16) · e2e
  158/158 (153+5).
- Evidence: scripts/capture-hover-shots.ts → 2 pixel-verified hover
  shots (the cursor a 235px gray run, the dot 301 indigo samples, the
  donut border 33 #ccc pixels); live parity probes — the tip
  "sábventas : 0" (#6366f1 item, 16px), the dot r4/#6366f1/#fff/2px,
  the cursor x=332.5/#ccc, the donut's raw skin + black item + empty
  label, the flip transform math exact (translate(75.79, 77.5)).
- Docs lockstep: AGENTS.md contract 26; CLAUDE.md counts + the v13
  block; README badge (445+158); PAD v2.1.0 + ADR-023 + §8 counts;
  retail-pos_SKILL.md v1.8.0 (+ the stale 127/127 and 429/153 counts
  corrected); docs/session_19.md; this entry.

Stage Summary:
- v13 made the chart hover family recharts-faithful: the sales chart
  renders the reference's own hover artifacts (the #ccc cursor + the
  r-4 activeDot) and its default tooltip content on the measured
  white-card skin, anchored the reference's way ((point.x + 10,
  pointer.y + 10) with the left-flip and the 400ms glide on a
  persistent wrapper), and the donut got its OWN raw tooltip skin (the
  1px #ccc border, the empty label, the black "name : count" item).
- Probe lessons recorded: 0-width SVG lines and the flat-$0 area path
  have EMPTY Playwright bounding boxes (assert attachment + geometry,
  never toBeVisible); Chromium serializes 400ms as 0.4s; e2e hovers
  gate on the data before the mouse.move; the PIE tooltip activates
  only on the SECTOR PATH; waitFor() defaults to "visible" — degenerate
  shapes need {state: "attached"}.
- Known-open (disclosed): the readable tooltip label (SD-18 family);
  the reports tooltip content (unobservable — no data in any window);
  the empty item-unit span (renders nothing — not replicated); the
  Terminal product-card hover (the reference still shift-gated).
  Standing v8-v12 disclosures unchanged.

---
Task ID: V14
Agent: general-purpose (remediation executor, session V14 2026-10-27)
Task: The v14 cycle — audit the remaining interaction states
(session_19's own suggested next step: the dialog open/close
transitions, the focus rings in motion, the sidebar collapse), write
remediation-plan-v14, execute it TDD, and ship.

Work Log:
- Baseline re-established after a workspace reset (re-clone to
  main @ 20b68e4 — the v13 close 214e196 + the remote's session_20
  transcript): environment rebuilt (.env → db/custom.db, deps, seed,
  Playwright chromium reinstalled), gates green — lint 0 · tsc 0 ·
  build ✓ · 445/445 unit · 158/158 e2e (one documented sequential
  flake green in isolation + on rerun); the v13 diff audited in full
  (SalesTip, DonutTip, hybrid anchor, persistent wrapper, cursor +
  activeDot all hold); the reference's data state UNCHANGED since v13
  (Terminal still shift-gated, the Abrir Turno cashier combobox still
  empty).
- Live audit (agent-browser, BOTH apps, 1280 + 390): the reference's
  dialog caught MID-ENTER for the first time (scale + translate +
  opacity all in flight at 60ms); three finding families measured —
  F1 the dialog motion + geometry family (the full slide quartet +
  the fading overlay + the 150ms default + the shared 512px max-w-lg
  base + rounded-2xl sm:rounded-lg full-bleed mobile skin vs the
  clone's fade+zoom-only, snapping overlay, 200ms duration-200,
  max-w-md/sm overrides, flat rounded-lg), F2 the focus family (the
  platform's global violet outline-color rgba(127,98,244,0.5) vs the
  clone's retired indigo 129,140,248 vx-focus halo + the plain
  Button's missing focus color), F3 the reports empty-state skins
  (the measured h-40 centered text-white/25 boxes + the mb-5 heading
  gap vs the clone's plain text-slate-400 paragraphs + mb-4).
- The sidebar collapse (session_19's suggestion) measured AT PARITY
  end-to-end (220↔68px, the same 300ms curve, labels conditionally
  removed, chevron flip) — resolves with NO work; the X close button,
  the select motion, the reports chips, and the login card verified
  at parity.
- TDD execution: 13 unit + 4 e2e pins written red first; B1 the
  dialog family (dialog.tsx + alert-dialog.tsx adopt the complete
  grammar class-for-class, duration-200 removed — Tailwind 4.3.3
  threads --tw-duration to 200ms where the reference's own class is
  inert; all 10 call sites drop width overrides, the inventory editor
  keeps max-h-[90vh] overflow-y-auto); B2 the focus family (vx-focus →
  the deterministic 3px solid violet outline + the global base-layer
  outline-color platform line, no double rings); B3 the reports
  surfaces (the h-40 centered boxes + titleClassName="mb-5" ×3).
- E2e authoring lessons (hardened, not weakened): toBeVisible()
  resolves mid-enter and zoom-in-95 scales the rect (512 read
  508/510) — geometry reads settle via getAnimations().finished
  (applied to the v14 pins AND the v8 ticket-modal pin, assertions
  unchanged); test.use() is illegal in a test body — the mobile
  viewport rides page.setViewportSize (the v12 convention).
- Final gate: lint 0 · tsc 0 · build ✓ · unit 458/458 (445+13, 30
  files) · e2e 162/162 (158+4).
- Evidence: the standard set re-captured from the production build
  (only 2 shots changed — the cobrar dialog now 512px, the reports
  empty states; everything else pixel-identical); 3 new VLM-verified
  shots via scripts/capture-v14-shots.sh (desktop-dialog-abrir-turno,
  mobile-dialog-abrir-turno, desktop-focus-nav-violet).
- Docs lockstep: AGENTS.md contract 27; CLAUDE.md counts + the v14
  block; README badge (458+162); PAD v2.2.0 + ADR-024 + §8 counts;
  retail-pos_SKILL.md v1.9.0; docs/session_21.md; this entry.

Stage Summary:
- v14 made the interaction-state family reference-faithful: the dialog
  system rides the shared 512px base with the full tailwindcss-animate
  grammar (the slide quartet + the fading overlay at the 150ms
  default), the focus family lands the platform violet (the
  deterministic vx-focus outline + the global outline-color recolor —
  the indigo halo retired everywhere), and the reports empty states
  adopt the measured centered boxes with the 20px heading gap. The
  sidebar collapse resolved as verified parity.
- The Tailwind v4 duration trap recorded: tw-animate resolves
  --animate-in through --tw-duration — a duration-200 class makes the
  clone's animation 200ms where the reference's older stack leaves it
  inert at 150ms; the observable is the .15s default, so no duration-
  class ships on the dialog family.
- E2e lesson recorded: dialog geometry reads must settle the enter
  run first (getAnimations().finished) — mid-flight zoom-in-95 scales
  the rect.
- Known-open (disclosed): the reports with-data skins (unobservable —
  no sales in any window); the reference's bg-background vs the
  clone's dark skin (the v8 pins hold); the drawer's own 200ms slide
  (a superset surface). Standing v8-v13 disclosures unchanged.

---
Task ID: V15
Agent: general-purpose (remediation executor, session V15 2026-10-27)
Task: The v15 cycle — the hover micro-interaction families sweep
(session_21's suggested "remaining motion language": the toast
enter/exit, the view transitions) with the toast question resolved by
evidence, write remediation-plan-v15, execute it TDD, and ship.

Work Log:
- Baseline re-established via git pull (the remote's session_22
  transcript acquired; the workspace survived intact — deps, 3 DBs,
  chromium, .env): gates green — lint 0 · tsc 0 · build ✓ · 458/458
  unit · 162/162 e2e.
- The toast investigation (L1-L3): the reference's settings save PUT
  returns 403 with ZERO feedback (silently broken — MutationObserver
  caught one spinner svg only; the change never persists); the product
  save returns 200, closes the modal, refreshes, renders NO feedback;
  the failed login renders the v12 inline alert. NO observable toast
  anywhere — the clone's toaster stays the disclosed superset (AGENTS.md
  28 records the closure).
- The systematic hover sweep (every [class*=hover:] element per view on
  BOTH apps + computed styles under real mouse hovers): F1 the 6 icon
  action sites missing transition-colors (registers delete already
  compliant); F2 the mail button's BLUE family (hover:bg-blue-50
  hover:text-blue-600 — the clone shipped indigo on both); F3 the
  Ajustes chip's remove control = lucide trash2 w-3.5 h-3.5 14×14 (the
  clone shipped an X h-3 w-3); F4 the badge hover tints (the StatusPill
  table variant's hover:bg-primary/80 — measured green-100 →
  rgba(127,98,244,0.8) at 150ms — and the categoría
  hover:bg-secondary/80; the card pill variant hover-free).
- Near-miss recorded: the Subir logo label's text-slate-700 loses the
  cascade to .glass-button's lavender on the reference — both apps
  compute rgba(200,210,255,0.8) (computed parity, no work). Verified at
  parity: nav links, toggle, TR rows, reports chips, .glass-button's
  150ms, badge rest skins. Data state unchanged; Terminal shift-gated;
  the cashier combobox dead end persists; mobile re-checked at 390px
  (the reference's plain sidebar vs the clone's v12 drawer superset).
- TDD execution: 12 unit pins (10 red / 2 guards) + 4 e2e pins (4 red /
  1 family-agnostic pass by design), all green after B1-B4 (the 6 icon
  sites + mail blue; StatusPill table hover + categoría span; the chip
  Trash2 swap; the SD-62 grammar alignment on the cashiers CRUD, the
  Quitar buttons, the terminal ticket controls).
- Tooling lessons (hardened): Tailwind v4's bg-primary/80 serializes as
  oklab(… / 0.8) even through canvas fillStyle — the e2e pin reads the
  sRGB pixel bytes via getImageData (±1/channel); agent-browser resets
  hover on every command after a mouse move — hover evidence rides
  Playwright's page.mouse (capture-v15-shots.ts, hover verified before
  each shot); agent-browser eval output is JSON-quoted (tr -d '"\r').
- Final gate: lint 0 · tsc 0 · build ✓ · unit 470/470 (458+12, 31
  files) · e2e 166/166 (162+4).
- Evidence (VLM-verified): desktop-ventas-mail-hover.png (mail blue
  beside the Eye's resting indigo), desktop-badge-hover-violet.png (the
  violet-at-80% Completada with green text),
  desktop-ajustes-categorias.png (the 14×14 trash), + the refreshed
  standard desktop-ajustes.png.
- Docs lockstep: AGENTS.md contract 28; CLAUDE.md counts + the v15
  block; README badge (470+166); PAD v2.3.0 + ADR-025 + §8 counts;
  retail-pos_SKILL.md v1.10.0; docs/session_23.md; the plan's §6
  execution ledger; this entry.

Stage Summary:
- v15 made the hover micro-interaction families reference-faithful: the
  icon action buttons transition their measured per-action color
  families (edit indigo, delete red, MAIL blue), the table badges ride
  the shadcn hover tints (the platform violet at 80% on the StatusPill
  table variant, secondary/80 on the categoría badge — the card pill
  hover-free), and the category chips' remove control is the reference's
  14×14 lucide trash.
- The toast question closed by evidence: the reference never fires a
  toast in any observable flow (the settings save 403s silently, the
  product save is feedback-free, the failed login renders the inline
  alert) — the clone's toaster is the disclosed superset.
- Two Tailwind v4 / tooling traps recorded for posterity: the color-mix
  oklab serialization (read pixel bytes, pin classes) and the
  agent-browser hover reset (Playwright for hover evidence).
- Known-open (disclosed): the reference's own broken flows (403 save,
  shift-gated terminal, empty cashier combobox) have nothing to mirror;
  the reports with-data skins stay unobservable; all standing v8-v14
  disclosures unchanged.

---

Task ID: v16-cycle
Agent: Z.ai (main agent, session 25)
Task: The V16 remediation cycle — the full-page pixel-diff pass, the
login-surface hover sweep, the mobile drawer timing carry-over, the
remediation plan, the TDD execution, the evidence, the docs lockstep,
the commit + the SSH-wrapper push.

Work Log:
- Baseline: git pull (acquired the remote's session_24 transcript);
  workspace intact; gates re-ran green (lint 0 · tsc 0 · build ✓ ·
  470/470 unit · 166/166 e2e) before any probing.
- The login sweep: CLEAN — the social/link/Sign-in hover classes match
  the reference exactly (source-verified), the v12 geometry pins hold,
  the card sections measure identical; the reference's /signup +
  /forgot direct URLs 404 (SD-20 unchanged).
- The mobile drawer carry-over CLOSED: the panel renders 288px with
  `enter 0.2s` (the `animate-in slide-in-from-left duration-200` — the
  disclosed 200ms slide), 8 links at the 44px pitch, zero horizontal
  overflow; the reference keeps its squeezed plain sidebar (standing).
- The pixel-diff pass (Playwright captures of both apps: 9 surfaces at
  1280×800 + the 390px mobile pair; per-view diff bands; VLM reads;
  computed-geometry verification of every VLM claim):
  * F1 THE HEADLINE — Tailwind v4's default palette is NOT the
    reference's palette: 17/22 spot-checked entries render beyond ±2
    per channel of the reference's v3 hexes (indigo-500 Δ56, red-500
    Δ24, green-700 Δ21, violet-600 Δ24, amber-600 Δ8; pixel-read in
    Chromium via scripts/palette-drift-v16.ts). The reference renders
    the v3 hexes; the class-pinning idiom had silently accepted the
    drift (class parity ≠ color parity).
  * F2 the category ENTITIES display order — the reference's chips +
    Ajustes render Snacks, Lácteos, Higiene, Limpieza, Alimentos,
    Bebidas (DOM-measured twice) while its donut renders another
    order; the clone's chips/Ajustes rendered the donut order.
  * F3 NEW EVIDENCE — the reference's pages are VIEWPORT-LOCKED (its
    document never scrolls: inventory rows 4-12, the settings lower
    sections, the low-stock card bottom are unreachable at 1280×800);
    the clone's flowing layout is the superset. Explains every
    full-page height delta the diff showed.
  * F4 tooling — a shift close must reset BOTH shift.status AND
    register.status (a direct DB write skipping the register leaves
    phantom "Abierta" cards); the capture scripts hardened.
  * Verified at parity (the L1-L24 ledger): the login surface, the
    KPI cards, the dashboard section anchors (y243/y689 identical),
    the reports KPI grid (x[244,587,929] gaps[16,16] exact), the
    settings inputs, the zap chip, the low-stock family classes, the
    donut legend; every VLM "difference" claim beyond the findings
    resolved to a misread under computed-geometry verification.
- The plan: docs/remediation-plan-v16.md (the L1-L24 verification
  ledger, SD-63..66, the batches) — validated against the codebase
  before execution.
- TDD execution: 8 unit pins (5 red / 3 guards) + 7 e2e pins (red, the
  auth setup + the donut guard green by design) → B1 the @theme
  palette pin block (61 v3 hexes) → B2 the Category.sortOrder column +
  the seed stamps + the delegate's listOrderBy/prepareCreate (max+1
  append, never client-writable) → all green.
- E2e authoring lessons (hardened): the /opacity modifiers serialize
  oklab even over hex-pinned vars (color-mix — the pill pin reads the
  sRGB pixel bytes, the v15 idiom); the Ajustes chips are <li> rows.
- Final gate: lint 0 · tsc 0 · build ✓ · unit 478/478 (470+8, 32
  files) · e2e 173/173 (166+7).
- Evidence: desktop-inventory-chips.png (the chip sequence verified
  live + VLM-verified: Todos, Snacks, Lácteos, Higiene Personal,
  Limpieza, Alimentos, Bebidas) + the full standard set refreshed
  (the palette touches every surface).
- Docs lockstep: AGENTS.md contract 29; CLAUDE.md counts + the v16
  block; README badge (478+173); PAD v2.4.0 + ADR-026 + §8 counts;
  retail-pos_SKILL.md v1.11.0; docs/session_25.md; the plan's §6
  execution ledger; this entry.

Stage Summary:
- v16 made the clone's palette the reference's palette: the globals.css
  @theme block pins all 61 used entries to their v3 hexes (one source —
  utilities, /opacity modifiers, ring/shadow/border consumers inherit),
  with e2e v3-exactness pins reading the literal reference values (the
  badge text, the amber count, the ticket cell, the pill's pixel
  bytes). The rule is recorded: a new palette color requires its v3
  pin in the same commit.
- The category entities order (chips + Ajustes) now rides a
  server-managed sortOrder seeded to the reference's measured sequence,
  while the donut keeps its own createdAt order — both reference
  orders matched.
- New evidence recorded: the reference's viewport-locked scrolling
  (its long content unreachable below the fold) — the clone's scroll
  is the functional superset; probe tooling hardened (the dual-status
  shift close).
- Known-open (disclosed): the reference's own broken flows have
  nothing to mirror; the reports with-data skins stay unobservable;
  all standing v8-v15 disclosures unchanged.

---

Task ID: v17-cycle
Agent: Z.ai (main agent, session 27)
Task: The V17 remediation cycle — the Core Web Vitals pass (session_25's
suggestion), the task-mandated mobile-navigation re-verification, the
Tailwind v4 sweep, the remediation plan, the TDD execution, the
evidence, the docs lockstep, the commit + the SSH-wrapper push.

Work Log:
- Baseline: the workspace had been RESET — a fresh git clone rebuilt it
  (main @ 8250e12, the V16 close intact); bun install + .env from
  .env.example + db:push + db:seed + the chromium-1243 install; the
  gates re-ran green (lint 0 · tsc 0 · build ✓ · 478/470 unit · 173/173
  e2e) before any probing.
- The mobile drawer contract re-verified LIVE end-to-end (Playwright
  probes at 390×844 + the short 390×480): the app bar 64px, the drawer
  lifecycle (Esc/backdrop/route close, focus in/out, scroll lock), the
  geometry (288px, enter 0.2s, 44px pitch), the inside-panel scroll
  (last link reachable), zero horizontal overflow on all 8 routes; the
  reference re-confirmed at 390px: NO menu (its 220px sidebar squeezes
  main to 170px) — the clone's drawer is the working superset.
- The Tailwind v4 sweep: no new bugs (the drawer's duration-200 is the
  intended disclosed 200ms — --tw-duration threads correctly on 4.3.3;
  the V16 palette pins hold; the trap tests green).
- The CWV measurements (Lighthouse 13, desktop): the clone's login
  86/100/100/100 (LCP 2.4s) vs the reference's 51 (LCP 14.4s, 2,314
  KiB vs the clone's 314 KiB); the authed dashboard 54 (TBT 550ms,
  LCP 3.7s) — measured via --extra-headers Cookie injection after the
  CDP-incognito lesson (a --port attach opens a fresh incognito context
  that shares NO cookies — the first run silently measured the
  logged-out bounce; the 401s + the from_url redirect chain exposed it).
- F2 the fix (TDD): the lazy view registry — 8 unit pins red →
  VIEW_LOADERS (one dynamic import() per view) through React.lazy +
  the boot prefetch of the ACTIVE view's chunk (parallel with auth/me
  + the pre-warm; Suspense fallback null) → green; the build split
  17 → 27 chunks (terminal 12 KiB, dashboard 15, none in the entry
  set); 3 e2e pins (the boot-ships-no-terminal-code chunk-body scan,
  the on-demand SPA chunk fetch, the no-gap h1 attachment).
- The result: performance 54 → 67 (+13), TBT 550ms → 280ms (−49%),
  LCP 3.7s → 3.5s, CLS 0.
- F1: the stale study-app Lighthouse reports (localhost:3200,
  2026-10-18) deleted; the v17 set + the methodology README landed in
  docs/lighthouse/ (the scores table, the CHROME_PATH/flags, the
  CDP-incognito lesson, the cookie-injection channel).
- F3: the dashboard's Lighthouse a11y 94 decomposed — color-contrast
  (the reference's own low-contrast family, standing) + heading-order
  (H1→h3 measured IDENTICAL on the reference the same day); recorded
  as reference-parity deviations (AGENTS.md 30, ADR-027) — no code
  change; parity wins.
- Final gate: lint 0 · tsc 0 · build ✓ · unit 486/486 (478+8, 33
  files) · e2e 176/176 (173+3).
- Evidence: the refreshed standard 32-shot set (production build) +
  v17-mobile-drawer-short-viewport-scrolled.png + the three Lighthouse
  reports.
- Docs lockstep: AGENTS.md contract 30; CLAUDE.md counts + the v17
  block; README badge (486+176) + the Views row + the lighthouse
  pointer; PAD v2.5.0 + ADR-027 + §8 counts; retail-pos_SKILL.md
  v1.12.0; docs/session_27.md; the plan's §6 execution ledger; this
  entry.

Stage Summary:
- v17 made the app measurably faster where it was actionable: every
  surface now ships only its own view code (the lazy registry + the
  boot prefetch), halving the authed dashboard's total blocking time
  (550→280ms) and lifting its Lighthouse performance 54→67 — with the
  176-spec e2e suite proving zero behavioral drift.
- The clone now CARRIES its CWV evidence: the reference measures 51 on
  its public login (LCP 14.4s, 2.3 MiB); the clone measures 86 (LCP
  2.4s, 314 KiB) — the production-readiness claim is measured, not
  asserted.
- Tooling lessons recorded: the Lighthouse CDP-incognito trap (authed
  audits need --extra-headers Cookie) and the reference's identical
  heading-order structure (H1→h3 — a parity deviation, not a bug).
- Known-open (disclosed): the react-dom boot floor (~890ms); the
  reference's own broken flows have nothing to mirror; the reports
  with-data skins stay unobservable; all standing v8-v16 disclosures
  unchanged.
