# VeloxPOS — Remediation Plan v29 (Session V28→v29, 2026-10-29)

> Scope: **the public-surface coverage audit** (the neo-crm session-197
> doctrine adopted). The V29 audit (14th cycle) found the reference
> UNCHANGED for the 14th consecutive cycle (data, views, the 390×844
> viewport lock — nothing new to mirror), the baseline gates green
> exactly as V28 closed them (577/577 unit · 203/203 e2e after the
> fresh-clone rebuild: install, .env, db:push, db:seed,
> chromium-1243, then the full ladder), the mobile drawer spine
> re-measured live at 390×844 EXACTLY matching the frozen v25 ledger
> (14th consecutive confirmation of the absent Tailwind v4
> mobile-menu trap; Esc + aria reset + focus return verified live),
> the repo-wide citation sweep clean (19 test citations across `src/`,
> all resolve), the V27 title-guard probe re-run 12/12 clean (min
> margins 12ms/13ms — the race shape live, the guard correcting every
> iteration), the Known-Issues register clean (zero live watch items),
> and neo-crm ADVANCED by two commits (`769ba13` → `a482f72` +
> `ba30355`): **session-197 — THE SWEEP-STATE COVERAGE AUDIT** — the
> first genuinely new doctrine in several cycles, read in full
> (commit message + the 246-line plan + session_416/417 transcripts).
>
> The doctrine, mapped to this repo: **a decoded, behavior-pinned
> surface can still have ZERO gate teeth on its designed content** —
> neo-crm's 404 had its faces decoded (s194), its TRUE-404 status and
> a11y registered (s195), and yet "NO gate held its PIXELS — a future
> NOT_FOUND_LAYOUT regression would keep every gate green." The cure
> there was the sweep registration + baselines, born-green,
> mutation-proven ×2. Retail-pos holds the SAME shape, plus one more
> from the same audit family: the coverage inventory (renderable
> routes vs gate inventories) surfaces the a11y register's own holes.

## 0. Verification ledger (all live unless noted; clone :3000 dev / :3102 probe vs reference)

- Baseline gates (fresh clone at `1469ff7`): lint 0 · tsc 0 · build ✓ ·
  **577/577 unit (43 files)** · **203/203 e2e (3.5m, zero flakes)** —
  exactly the V28 close.
- Reference (14th cycle, agent-browser login): dashboard $0.00 /
  0 / 12 / 0 KPIs, flat 7-day chart, 5-row donut legend, 12 inventory
  rows, 390×844 viewport-locked (scrollHeight 844 = innerHeight,
  scrollTop 0), no hamburger — UNCHANGED.
- Reference 404 (logged-in posture): h1 "Página no encontrada", the
  "404" badge, "La página que buscas no existe o fue movida.", the
  "Ir al Terminal" CTA — the clone's 404 mirrors this content family
  exactly (the two-app surface).
- Clone drawer spine (live, 390×844): panel [0,0,288,844] · nav
  [0,69,287,727] · close [235,16,36,36] · 8 links at [12,y,263,40]
  y=81+44k — EXACTLY the frozen v25 pin; Esc closes, aria resets,
  focus returns to the hamburger.
- Clone desktop spot-check: /Ventas renders "Ventas | VeloxPOS" (the
  V27 guard's face), H1 "Historial de Ventas", 2 seeded sales.
- Clone 404 content family (live, 1280×800): card [416,241,**448**,318]
  (max-w-md), badge [600,282,**80**,**80**] (h-20 w-20), h1 H1-tag
  "Página no encontrada", copy "La página que buscas no existe o fue
  movida.", CTA accessible name "Ir al Terminal", slug title
  "NonExistentAudit | VeloxPOS".
- Citation sweep: 19/19 resolve (trailing-period regex artifacts
  stripped — the known V28 lesson).
- Probe-v27 re-run: 12/12 clean (6 natural + 6 fast-auth; margins
  12ms/13ms).
- neo-crm: `a482f72` (session-197) + `ba30355` (session_417 transcript)
  read in full — the sweep-state coverage audit is the round material;
  D-197a1 (the 404 sweep registration) + D-197a2 (the count-proof NAME
  form) are the adoptable cures; the declined list (a third collector,
  ours-only sweep pages, the s120-era re-walk) informs our scope.

## 1. Findings

### F1 — the 404 content family has ZERO gate teeth (the s197 shape, precisely)

The designed 404 (`src/app/not-found.tsx` — reference-measured,
`docs/reference-investigation.md` §1) is pinned today by:

- the TRUE HTTP 404 status (V24/ADR-033, `navigation.spec.ts`, via
  `page.request.get` — `page.goto` tolerates any status);
- the card's VISIBILITY + one `getByText("Página no encontrada")` +
  the CTA CLICK (navigation.spec.ts);
- the slug-cased tab title (v7 M1 + the V27 title-guard family);
- the a11y smoke's axe scan at both widths (V24/F2 — critical/serious
  only).

What NO gate holds — the designed CONTENT family itself:

| Element | The pin that would catch a regression | Today's truth |
|---|---|---|
| The h1's ROLE + LEVEL | `getByRole("heading", { level: 1, name: "Página no encontrada" })` | `getByText` matches a demoted `<div>`/`<p>` equally — an h1→div regression keeps every gate green (axe flags no critical/serious violation for a missing heading) |
| The body copy | exact string "La página que buscas no existe o fue movida." | completely unpinned — any copy drift keeps every gate green |
| The "404" badge | text "404" + the 80×80 box (h-20 w-20) | unpinned — badge removal keeps every gate green |
| The CTA's accessible name | "Ir al Terminal" | the click-only pin passes on ANY label |
| The card geometry | max-w-md = 448px at desktop | unpinned |

This is the neo-crm session-197 verdict verbatim-mapped: "the walk67
decode + the e2e/a11y registrations hold its FACES and its STATUS, but
a future pixel regression on the surface would keep every gate green."
The retail-pos cure in the house idiom (the v25 spine-freeze
precedent — exact-value e2e pins + mutation proof, not a pixel-baseline
sweep tool): **a born-green `tests/e2e/not-found-surface.spec.ts`**
freezing the measured content family, MUTATION-PROVEN by planting the
s197-identical regression shapes (the h1 demotion; the copy drift) →
RED at the exact assertion → restore → GREEN.

### F2 — the a11y smoke's register is missing /signup and /reset-password (the V24 doctrine's own words)

`AGENTS.md` (test-suite rules, V24/ADR-033): "every public surface
belongs in the a11y smoke's register." The register today
(`tests/e2e/a11y-smoke.spec.ts`): /Dashboard (shell), / (mobile
drawer), /login, /NonExistent (the 404). The clone's PUBLIC surfaces
per that same doctrine — SD-20 (v8): "the clone's public
404/signup are superset behaviors" — include **/signup** and
**/reset-password** (the platform-template page; the token-gated
content needs no session to render the page). Neither is registered:
the only `AxeBuilder` scans in the tree live in the a11y smoke, and
the smoke never visits them (verified by grep —
`functional-parity-v12.spec.ts` measures the auth family's geometry
but runs no axe; the v12 "axe" grep hit is a false positive on
"leading-relaxed"). The register was completed for the 404 at V24
(F2 there) — the same completion for the remaining two public
surfaces never happened. **The cure: register both** (born-green
expected — both pages ride the same light-theme label families the
login scan already passes on; verify at run time, fix-first if a real
violation surfaces).

### S (minor, the D-197a2 name-form doctrine) — count-anchored live descriptions of the LIVE_DOCS set

The s197a2 lesson: "a count-anchored comment survives additions and
goes stale — a name never goes stale when a page joins" (neo-crm's
"the ten pages" survived three page additions, and the F-98a1 guard's
own live face went stale WITH them). Retail-pos carries the same
shape in two LIVE places: the deployment-surfaces block 10 comment
("The six live operational docs") and AGENTS.md repo-hygiene ("the
whole SIX-LIVE-DOC set"). The LIVE_DOCS array is the source of truth
(the pin iterates it); the count-anchored PROSE around it goes stale
the day a seventh live doc joins. **The cure: the name form** ("the
live operational doc set" / "the LIVE_DOCS array") in the two live
spots. Historical records stay untouched — ADR-037's "SIX live
operational docs" is the true record of what V28 shipped.

## 2. Design decisions (resolved)

1. **e2e layer, not unit source pins.** The 404 content family is
   rendered truth; the v25 spine-freeze precedent (e2e exact-value
   pins, no unit mirror) is the house form. A source-string pin
   (tailwind-traps style) would freeze the FILE, not the RENDER —
   the s197 gap is precisely that the render's contract has no teeth.
2. **Born-green + mutation proof, not born-RED.** The pinned surfaces
   are CORRECT (measured live this cycle, both apps). The V28
   born-RED form applies when the pin catches a LIVE defect; the
   V25/s197 born-green + mutation-proof form applies when the pin
   closes a coverage gap on a correct surface. The mutation proofs
   (h1 demotion; copy drift) supply the RED evidence the gap is real.
3. **One new spec file, two tests.** `tests/e2e/not-found-surface.spec.ts`:
   T1 the content family (h1 role+level+name, exact copy, badge text,
   CTA accessible name); T2 the measured geometry (card 448px,
   badge 80×80, at the project's desktop viewport). Focused,
   self-describing, a clean mutation target — the title-guard.spec.ts
   precedent (a new doctrine family gets its own file).
4. **The a11y leg extends the smoke in place.** Two new tests in
   `a11y-smoke.spec.ts` ("the public signup surface is clean",
   "the public reset-password surface is clean") — the register is
   the smoke's own concept; a separate file would fragment it.
5. **No pixel-baseline sweep tool is ported.** neo-crm's sweep+
   baselines exist because that repo's parity contract is
   full-page-pixel drift across 14 pages at 4 bands. Retail-pos's
   parity contract is computed-style + geometry pins per family (the
   visual-parity specs) — the s197 ADOPTION is the doctrine (close
   the coverage gap with gate teeth + mutation proof), not the
   instrument. Porting the tool would be speculative scaffolding.
6. **The count ladder moves only e2e**: 203 → 207 (2 not-found-surface
   + 2 a11y registrations); unit 577 HELD; suites 43 → 45 files. All
   doc counts move in the same commit (the count-lockstep rule).

## 3. Execution batches

### B1 — the audit (DONE)

The 14th-cycle ledger in §0 — reference unchanged, spine exact,
probe clean, citations clean, Known-Issues zero, neo-crm s197 read.

### B2 — the pins (written FIRST, born-green verified, then mutation-proven)

1. `tests/e2e/not-found-surface.spec.ts` (new): T1 the content family
   (role+level+name h1, exact copy, badge "404", CTA accessible
   name); T2 the geometry family (card 448px, badge 80×80 at
   desktop). Run → born-GREEN expected (the surface measured live
   this cycle).
2. `tests/e2e/a11y-smoke.spec.ts` (extended): the signup + the
   reset-password registrations. Run → born-GREEN expected (fix-first
   if a real violation surfaces — never weaken the scan).

### B3 — the fixes

1. The D-197a2 name form: the block 10 comment + AGENTS repo-hygiene
   live description (the historical records untouched).
2. Nothing else — F1/F2 are coverage cures, not behavior changes.

### B4 — the mutation proofs + the full gates

1. Proof (a) the h1 demotion: `h1` → `div` in not-found.tsx →
   not-found-surface T1 RED at the heading assertion (the s197
   text-8xl proof's exact shape) → restore → GREEN.
2. Proof (b) the copy drift: change the p text → T1 RED at the copy
   assertion → restore → GREEN.
3. Proof (c) the register's teeth: strip a signup input's label
   wiring → the new signup scan RED → restore → GREEN.
4. Full ladder: lint → typecheck → build → 577/577 unit → 207/207 e2e.
5. The v29 captures (5): desktop-ventas-1280 (the title guard's
   face), desktop-dashboard-1280, **desktop-404-1280 (the cycle's own
   subject)**, mobile-terminal-390, mobile-drawer-open-390 —
   PNG-validated at exact dimensions.

### B5 — docs lockstep → commit + push

README (badge 577+207), AGENTS (the audit + the new spec + the
register completion + the name form), CLAUDE (the v29 contracts note +
counts), PAD v2.16.0 (history + **ADR-038** + §8 rows), SKILL v1.23.0
(the v29 close layer + counts + the §12 F13 lesson), worklog, this
plan's §6, session_54 (EN) + session_55 (ZH, the session_52
convention). Commit to main; push via the SSH wrapper.

## 4. Test plan

- `bunx playwright test tests/e2e/not-found-surface.spec.ts` — the
  new spec alone, then inside the full suite (no storageState
  interference: the 404 is session-independent).
- `bunx playwright test tests/e2e/a11y-smoke.spec.ts` — the extended
  smoke alone, then full.
- `bun run test` — 577 HELD (no unit changes; the census/doc pins
  read live docs — re-run after every doc edit in B5).
- The three mutation proofs, each: RED at the exact target → restore
  → GREEN (no collateral).
- Full gate ladder last; screenshots after; `git status` clean of
  gitignored artifacts before commit.

## 5. Out of scope (disclosed)

- neo-crm's sweep tool + four-band pixel baselines (decision #5).
- The reference's own broken flows (nothing to mirror, 14 cycles
  standing).
- Dependency UPGRADES (Radix minors + Prisma 6→7 major — their own
  cycle if ever wanted; the react-dom boot floor; every standing
  v8–v28 disclosure unchanged).
- The `/signup` + `/reset-password` OURS-ONLY note: no reference
  comparison is possible for them (the reference gates signup and has
  no reset surface observable) — the registrations pin the clone's
  own public surfaces, the SD-20 superset posture.
- Historical count anchors in ADR-037/session logs (archives of what
  was true at their own time — the six-doc pin's own scope rule).

## 6. Execution results (filled on completion — 2026-10-29)

- B2: the not-found-surface spec born-GREEN (2/2 — the content family
  and the geometry family); the a11y register completion born-GREEN
  (the smoke 4 → 6 tests; signup + reset-password both clean of
  critical/serious violations at desktop width).
- B3: the two name-form rewords applied (the block 10 comment + the
  AGENTS repo-hygiene live description; the worklog V28 entry and
  ADR-037's historical "SIX" records untouched by design); no other
  source changes — F1/F2 are coverage cures, not behavior changes.
- B4: all three mutation proofs RED-at-the-exact-target → restored →
  GREEN. Proof (a) the h1→div demotion: RED at the
  `getByRole('heading', …)` assertion ("element(s) not found"), T2
  green — zero collateral. Proof (b) the copy drift: RED at the
  `getByText(…, { exact: true })` assertion (the h1 step passed first
  — the proof-(a) restore implicitly verified), T2 green. Proof (c)
  the register's teeth: the first attempt (stripping `htmlFor` alone)
  stayed GREEN — axe-core's `label` rule ACCEPTS a placeholder as a
  label (the non-empty-placeholder check, verified against a minimal
  static page: the bare input flags, the placeholder input does not)
  — the proof strips BOTH the htmlFor and the Email field's
  placeholder: RED with `label:critical` at the exact signup
  registration, the other six smoke tests green. The placeholder
  lesson is recorded in AGENTS/CLAUDE/SKILL F13 and drove the
  mutation-proof design. Full gates after the restore:
  **lint 0 · tsc 0 · build ✓ · 577/577 unit (43 files, held) ·
  207/207 e2e (3.7m, zero flakes)** — the count ladder exactly as
  designed (203+2 not-found-surface +2 a11y registrations). Five v29
  captures
  PNG-validated at exact dimensions (desktop-ventas-1280,
  desktop-dashboard-1280, desktop-404-1280 — the cycle's own subject,
  mobile-terminal-390, mobile-drawer-open-390).
- B5: README (badge + Tested row 577+207), AGENTS (the gate-coverage
  doctrine's V29 completion + the probe lesson + the LIVE-DOC name
  form), CLAUDE (the v29 contracts note, newest-first + counts), PAD
  v2.16.0 (history entry + ADR-038 + the §8 e2e-row/seam-list/name-form
  updates + the not-found-surface seam row), SKILL v1.23.0 (the v29
  close layer live, the v28 layer demoted + counts + the §12 F13
  lesson), session_54 + session_55 (the dual raw logs), the worklog
  V29 entry, this §6. The unit suite re-ran green after every doc edit
  (the census + doc pins read the live docs). Committed to main;
  pushed via the SSH wrapper (remote == local HEAD verified by the
  wrapper's post-push check).
