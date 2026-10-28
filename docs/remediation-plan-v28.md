# VeloxPOS — Remediation Plan v28 (Session V27→v28, 2026-10-28)

> Scope: **the shipped-artifacts truth pass.** The V28 audit (13th cycle)
> found the reference UNCHANGED for the 13th consecutive cycle (nothing
> new to mirror), the baseline gates green exactly as V27 closed them
> (568/568 unit · 203/203 e2e — after the fresh-clone rebuild: install,
> .env, db:push, db:seed, chromium-1243, then the full ladder), the
> mobile drawer contract live-verified at 390×844 with the spine ledger
> EXACTLY matching the frozen v25 pin (13th consecutive confirmation of
> the absent Tailwind v4 mobile-menu trap), the repo-wide citation sweep
> clean (19 test citations across `src/`, all resolve — the V27 count
> plus the two new title-guard citations), the Known-Issues register
> clean (zero live watch items — the F2 flake family retired with V27),
> the V27 title-guard probe re-run 12/12 clean in the fresh environment
> (the margin ledger still shows the single-digit-ms race shape; the
> guard corrects every iteration), and neo-crm ADVANCED by exactly one
> commit (`316fbe2` → `769ba13`) whose entire diff is
> `docs/session_415.md` — the raw transcript of the SAME session-196
> spine-freeze work retail-pos already adopted as V25/ADR-034 (no new
> doctrine; verified by full read). The cycle's findings come from the
> repo's own audit sweep, in the ADR-030/ADR-033 truth families:
> **F1 — two live operational docs cite
> `scripts/generate-head-assets.py`, a file that has NEVER been committed
> to this repository** (verified: `git log --all` empty for the path; not
> in `scripts/`, not in `scripts/archive-study-sweep/`) — the v6 session
> generated the head assets with a workspace-local Python script,
> committed the ASSETS and the DOC CLAIMS, but never the script. The
> shipped repo therefore claims an asset-regeneration path that does not
> exist. The standing pin that guards this claim family
> (`tests/deployment-surfaces.test.ts` — "references only scripts that
> exist") is scoped to `docs/DEPLOYMENT.md` ONLY, leaving the other five
> live docs unguarded — the exact ADR-033 gate-coverage shape that let
> the stale claim ship in v6 and survive 22 cycles. **F2 — four dead
> dependencies ride the manifest** (the web-application skill §2
> dead-dependency census, run for the first time in this repo):
> `@radix-ui/react-radio-group` (zero references — no
> `ui/radio-group.tsx` exists), `@radix-ui/react-scroll-area` (zero
> references), `@radix-ui/react-toast` (zero references — the repo's
> toaster is the custom zustand build in `src/components/ui/toast.tsx`,
> which imports no Radix), and `bun-types` (zero references; empirically
> dead — `tsc --noEmit` passes with the package physically removed).
> The census had never run here (every prior "census" mention in the
> docs is a data/user census). This cycle sweeps both findings, pins
> them deterministically, and mutation-proves the pins.

## 0. Verification ledger (all live unless noted; clone :3000 dev / :3102 probe vs reference)

| # | Item | Method | Result | Verdict |
|---|------|--------|--------|---------|
| L1 | Workspace state | fresh `git clone` (the sandbox workspace was RESET — twice this session: once before the audit, once mid-execution after B4; the mid-execution reset is itself a recorded environment fact — the whole cycle re-executed on the second clone with every step re-verified, born-RED included); main @ `f26630d` (V27 complete + session_49 + session_50), clean tree; locals rebuilt on each clone: `bun install` (488 pkgs), `.env` from `.env.example` with `DATABASE_URL="file:../db/custom.db"`, `bun run db:push` + `db:seed` (12 products / 6 categories / 2 registers / 2 sales / 2 shifts — the reference mirror), `bunx playwright install chromium` (the 1243 binary absent in the fresh sandbox — the same infra miss as V27's session, root-caused on the spot), `bun run build` | baseline current |
| L2 | V27 reference docs | full read: session_49 (the V27 raw log), session_50 (the V27 second raw log, Chinese), remediation-plan-v27 (ledger L1–L12 + execution results — B1–B5 all DONE), the worklog tail (the V27 entry); core docs re-read (AGENTS 31 contracts + traps + account UI + mobile drawer contract + the v27 title-guard paragraphs, CLAUDE, README, PAD v2.14.0/ADR-036, SKILL v1.21.0) | V27 closed the shell title-guard pass (the 9-cycle v9 flake root-caused and closed, ADR-036, mutation-proven both directions); the docs stay lockstep-true at 568+203 | aligned |
| L3 | Baseline gates | lint → tsc → build → unit → e2e (in that order, on the fresh clone; the e2e run required the chromium-1243 install first) | 0 · 0 · ✓ · 568/568 (42 files) · **203/203** (3.6m, first-try after the chromium install) | all green |
| L4 | Reference data state | agent-browser on the logged-in reference (Terminal / Dashboard / Inventory / Sales / Registers / Reports / Ajustes; mobile 390×844) | Terminal shift-gated ("No hay turno activo"), Dashboard $0.00/0/12/0 KPIs + the flat 7-day chart + the 5-row byCategory legend (Lácteos, Limpieza, Higiene Personal, Alimentos, Snacks), 12 products (Shampoo Pantene first, Pan Bimbo last), 2 sales (V-MO6BJT7G, V-MMPNY55Z), Caja 2 first + Caja 1 (both Cerrada), Reports "Sin datos en este período", Ajustes = exactly the five store sections; at 390px NO hamburger (the two `aria-expanded` buttons on StoreSettings are the Radix Select comboboxes — `role=combobox`, the V27 identification), viewport-locked (scrollH = clientH = 844 on both Terminal and StoreSettings) | unchanged — nothing new to mirror (13th cycle) |
| L5 | Clone mobile drawer live | agent-browser on the dev server @390×844 (the user's standing focus — the Tailwind v4 bug check) | the drawer spine RE-MEASURED live via the spec's own testids, EXACTLY the frozen ledger: panel `[0,0,288,844]` · header `[0,0,287,69]` · nav `[0,69,287,727]` · footer `[0,796,287,48]` ("VeloxPOS" wordmark) · close `[235,16,36,36]` · 8 links at `[12, 81+44k, 263, 40]`; Esc closes + resets `aria-expanded` + RETURNS focus to the hamburger (`Abrir menú de navegación`); zero horizontal overflow — the TailwindCSS v4 mobile-menu trap is NOT present (13th consecutive confirmation; `tests/tailwind-traps.test.ts` green in L3) | superset verified (13th cycle) |
| L6 | Citation sweep (the V26/V27 instrument, re-run) | `rg` every `tests/**` citation across `src/` + existence check (trailing punctuation stripped — the raw regex's false positives) | 19 citations found (17 + the two V27 title-guard citations), **all 19 resolve** | instrument clean |
| L7 | neo-crm pattern cross-check | `git ls-remote` (HEAD `769ba13` — ADVANCED from `316fbe2`) + full-clone diff read | ONE new commit, `769ba13` "update session log", whose entire diff is `docs/session_415.md` (+109 lines) — the raw step-by-step transcript of the SAME session-196 drawer-open spine-freeze work whose commit (`316fbe2`) retail-pos already reviewed and adopted as V25/ADR-034. The transcript's content (the walk50 re-walk, the D-196a1 born-green spine pin, the mutation proof, the count-ladder machinery, the VLM drawer-pair check) adds no doctrine the adoption missed. No adoption this cycle | no new doctrine |
| L8 | The V27 title-guard, live | `bun scripts/probe-v27-title-race.ts 6 6` on the fresh clone (the committed instrument; spawns its own standalone server on :3102 against `db/e2e.db`) | 6 natural + 6 fast-auth iterations, **12/12 clean** — every final title "Ventas | VeloxPOS"; the margin ledger shows the same race shape (min margin 9ms natural / 11ms fast; the metadata manager's last write as late as ~329ms) with the guard's corrections visible in every timeline (the post-clobber re-writes) | V27 holds in the fresh environment |
| L9 | **F1 scope — the script-reference truth family** | `rg` every `scripts/…` reference across the SIX live operational docs (README, AGENTS, CLAUDE, PAD, SKILL, DEPLOYMENT.md) + existence check; `git log --all -- scripts/generate-head-assets.py`; the archive listed; the pin's scope read (`tests/deployment-surfaces.test.ts:84-95`) | `scripts/generate-head-assets.py` is referenced by **AGENTS.md §15** ("Assets regenerate via `scripts/generate-head-assets.py` (repo scripts/)") and **retail-pos_SKILL.md** ("Regenerate the assets with `scripts/generate-head-assets.py`") — and the file has NEVER been committed (`git log --all` is EMPTY for the path; absent from `scripts/` and `scripts/archive-study-sweep/`; no other asset-generation script exists — `rg` for og-image/head-assets/icon.png across `scripts/` finds nothing). The standing pin ("references only scripts that exist") checks **DEPLOYMENT.md ONLY** — the other five live docs are unguarded for the identical claim family | the cycle's F1 |
| L10 | **F2 scope — the dead-dependency census** | the web-application skill §2 census, first run in this repo: every `package.json` dependency tested for a live string reference across `src/`, `tests/`, `scripts/` (minus the archive), and the config files; ambiguous candidates resolved empirically (bun-types removed from node_modules → `tsc --noEmit` → clean → restored) | 43 packages total; **4 dead**: `@radix-ui/react-radio-group` (zero references; no `ui/radio-group.tsx`), `@radix-ui/react-scroll-area` (zero references; no `ui/scroll-area.tsx`), `@radix-ui/react-toast` (zero references — `src/components/ui/toast.tsx` is the custom zustand toaster, imports no Radix), `bun-types` (zero references; empirically dead). Infrastructure-ruled NOT dead: `react-dom` (the Next runtime peer), `@types/react` + `@types/react-dom` (TSX compilation). No doc mentions any of the four (the removal is docs-clean); `components.json` carries no primitive aliases | the cycle's F2 |
| L11 | Docs-count lockstep | `rg` the 568 / 203 / 42-files / 28-routes counts across the live docs | every count mention true at baseline (badge 568+203; CLAUDE commands; PAD §8; SKILL counts) — the audit's own count sweep then caught THREE V27 residuals (the SKILL stack-table E2E row "201 specs" + two SKILL command-block e2e lines "201/201"), swept in this cycle's B5 | lockstep restored |
| L12 | Dependency health (disclosed, not acted) | `bun outdated` | minor Radix bumps available; Prisma 6.19.3 → 7.10.1 is a MAJOR. Per the surgical-change discipline (Appendix B #9) no upgrades ride this cycle — the visual-parity pins are green on the current set; a Prisma major is its own cycle if ever wanted | disclosed in §5 |
| L13 | Config pins + env contract | `rg` over playwright.config.ts (the V24 knob pins after the spread) + `.env` / `.env.example` round-trip (the install/db/login round-trip re-proved it during setup) | all V24 pins intact; `DATABASE_URL="file:../db/custom.db"` live in `.env`; `db/` at the repo root (custom.db fresh-seeded; e2e.db created by the probe run); vitest + playwright configs present and unmodified | contract holds |
| L14 | The user's standing checklist | `.env` DATABASE_URL ✓ · `db/` at root ✓ · vitest/playwright config files present ✓ (this cycle ADDS one unit spec + extends one — counts only move up) · `.env.example` matches the codebase ✓ · `skills/` excluded from checking/testing/compilation ✓ (tsconfig exclude + vitest include patterns) | all satisfied |

## 1. Findings

- **F1 — the script-reference truth family is under-scoped: two live docs
  cite a script that has never shipped.** AGENTS.md §15 and
  retail-pos_SKILL.md both claim the document-head assets (the
  `/og-image.png` render, `src/app/icon.png`, the logo) "regenerate via
  `scripts/generate-head-assets.py`" — a file with an EMPTY `git log
  --all`, absent from `scripts/` and from `scripts/archive-study-sweep/`.
  The v6 session generated the assets with a workspace-local script and
  committed the assets and the claims, but not the generator: an
  operator following AGENTS.md on a fresh clone hits a nonexistent file.
  The standing pin that owns this claim family (deployment-surfaces
  test: "references only scripts that exist") scans `docs/DEPLOYMENT.md`
  only, so the same class of lie can ship (and did ship, in v6) through
  every other live doc. This is the ADR-030 deployment-surface truth
  doctrine and the ADR-033 gate-coverage doctrine meeting: the claim
  family is real, the pin's scope is one doc wide.

- **F2 — four dead dependencies ride the manifest.** The web-application
  skill's §2 dead-dependency census ("every dependency must have a live
  import within one commit of being added; run a dead-dependency census
  periodically — the family repeatedly found and retired zero-import
  scaffold packages") had never run in this repo. The first run finds
  four: three scaffold-inherited Radix primitives with no consumer
  component (`react-radio-group`, `react-scroll-area`, `react-toast` —
  the repo's toaster is the custom zustand build) and `bun-types` (zero
  references; `tsc --noEmit` passes with the package physically
  removed — nothing loads it: tsconfig carries no `types` array). Dead
  weight in `dependencies` inflates install surface and audit surface
  for zero value, and the manifest's truth (like the docs') is a shipped
  surface.

- **No other real findings.** The baseline is green exactly as V27
  closed it (L3); the reference is unchanged for the 13th consecutive
  cycle (L4); the drawer spine matches the frozen ledger exactly (L5);
  the citation sweep is clean (L6); neo-crm's single new commit carries
  no new doctrine (L7); the V27 title-guard holds live (L8); the
  Known-Issues register is clean; the config pins hold (L13); the
  `.env.example` is bidirectional-true (the install/db/login round-trip
  proved it during setup); `skills/` excluded from all
  checking/compilation per the standing instruction.

## 2. Design decisions (resolved)

- **SD-116 — F1's cure: sweep the false claim, then pin the whole
  family.** The head assets are one-time-generated committed evidence
  (the og-image render, the icon, the logo — all pinned by standing
  e2e/head contracts); regenerating them is not a shipped capability and
  does not need to become one (writing a NEW generator would be
  speculative scaffolding — nothing requests it, and any re-render would
  byte-diff the v6-verified evidence). The truthful statement replaces
  the claim in both docs: the assets are committed brand evidence
  generated once in the v6 workspace; the generator never shipped; the
  assets are pinned as-is. The PIN then generalizes: a new describe
  block in `tests/deployment-surfaces.test.ts` (the ADR-030 family
  owner) iterates the SIX live operational docs (README.md, AGENTS.md,
  CLAUDE.md, Project_Architecture_Document.md, retail-pos_SKILL.md,
  docs/DEPLOYMENT.md) and asserts every `scripts/…` reference in each
  resolves to a real file (the same existsSync machinery, the same
  trailing-punctuation tolerance). Historical session logs and executed
  plans under `docs/` stay OUT of scope — they are archival records of
  what was true at their time, not live operational claims.

- **SD-117 — F2's cure: remove via the package manager, then pin the
  census.** `bun remove @radix-ui/react-radio-group
  @radix-ui/react-scroll-area @radix-ui/react-toast bun-types` (the
  manifest is touched ONLY through the package manager — package.json +
  bun.lock move together; the single-lockfile rule stays pinned). Then a
  NEW unit spec `tests/dependency-census.test.ts` (the skill's
  instrument, now standing): every package in `dependencies` +
  `devDependencies` must carry at least one live string reference
  across `src/`, `tests/`, `scripts/` (minus the archive), `prisma/`,
  and the root config files (next.config.ts, playwright.config.ts,
  vitest.config.ts, postcss.config.mjs, eslint.config.mjs,
  components.json) plus package.json's own scripts block (the CLI tools
  earn their place through the commands the gate runs) — OR appear in
  an explicit, commented INFRA allowlist (`react-dom` — the Next runtime
  peer; `@types/react`, `@types/react-dom` — TSX compilation). The
  allowlist is the census's documentation of WHY each exempt package
  earns its place; adding a dependency without a reference or an
  allowlist row fails the gate. The census file ITSELF is excluded from
  its own surface — its prose cites the packages it retired, and a
  census must not count its instrument as evidence.

- **SD-118 — the pins are born RED on the standing tree (TDD).** The
  live-docs script-reference pin, run before the doc sweep, FAILS on
  `generate-head-assets.py` (AGENTS + SKILL) — the pin proves it guards
  the real claim. The dependency census, run before the removal, FAILS
  on the four dead packages — the census proves it catches the real
  weight. Then the fixes land and both go GREEN.

- **SD-119 — the mutation proofs (the standing discipline).** (a) Plant
  a bogus `scripts/does-not-exist-probe.ts` reference in a live doc →
  the script-reference pin goes RED at exactly that doc → revert →
  GREEN. (b) Plant a fake `"acme-widget": "^1.0.0"` row in
  package.json → the census pin goes RED at exactly that package →
  revert → GREEN. Both pins guard their guards.

- **SD-120 — extend, never weaken.** No existing test is edited or
  deleted; ONE spec file gains a describe block (deployment-surfaces —
  its header comment updated to the widened scope in the same commit),
  ONE new unit file lands. Counts only move up (568 → 577 unit; e2e
  stays 203 — both findings are unit-layer; exact numbers recorded in
  §6).

## 3. Execution batches

### B1 — the audit (DONE)

- L1–L14 above. Reference 13th cycle unchanged; baseline green on the
  fresh clone; the drawer spine matching the frozen ledger exactly; the
  citation sweep clean; neo-crm's single new commit is the raw
  transcript of the already-adopted s196; the V27 probe re-run clean;
  the script-reference family scoped; the dead-dep census run for the
  first time.

### B2 — the pins (written FIRST, born RED)

- `tests/deployment-surfaces.test.ts` (EXTENDED — SD-116): the
  six-live-docs script-reference describe block.
- `tests/dependency-census.test.ts` (NEW — SD-117): the census with the
  INFRA allowlist.
- Both run against the standing tree → RED expected (the generate-head-
  assets.py citations; the four dead packages).

### B3 — the fixes

- AGENTS.md §15 + retail-pos_SKILL.md: the truthful asset-provenance
  statement replaces the regeneration claim (SD-116).
- `bun remove @radix-ui/react-radio-group @radix-ui/react-scroll-area
  @radix-ui/react-toast bun-types` (SD-117).
- Re-run both pins → GREEN expected.

### B4 — the mutation proofs + the full gates

- Plant the bogus script reference → RED at the exact doc → revert →
  GREEN (SD-119a).
- Plant the fake package row → RED at the exact package → revert →
  GREEN (SD-119b).
- Full gates: lint → typecheck → build → `bun run test` (expect 577, 43
  files) → `bun run test:e2e` (expect 203).
- The evidence set: four v28 captures under `docs/screenshots/`
  (`v28-desktop-ventas-1280.png` — the F1-adjacent surface whose title
  the V27 guard defends, verified live; `v28-desktop-dashboard-1280.png`
  — the standing desktop surface; `v28-mobile-terminal-390.png` — the
  closed chrome with the reference-matching shift-gated state;
  `v28-mobile-drawer-open-390.png` — the standing mobile surface, the
  spine freeze holding), all captured against the running dev server,
  PNG-validated at the expected dimensions.

### B5 — docs lockstep → commit + push

- README: the badge + the Testing-table counts (577 + 203).
- AGENTS.md: §15's truthful provenance; the repo-hygiene
  deployment-surfaces description widened (the six live docs); the
  commands-table unit count; the NEW manifest-census bullet.
- CLAUDE.md: the v28 contracts note + the counts.
- PAD: v2.15.0 history entry + **ADR-037** (the shipped-artifacts truth
  pass) + the §8 testing table (+ the census seam rows).
- retail-pos_SKILL.md: v1.22.0 + counts + the §12 **F12** lesson (a
  claim about a repo artifact — a script, a dependency — is only true
  if a pin says so; scope the pin to the whole claim family, not just
  the doc being fixed; run the dependency census periodically with an
  explicit infra allowlist).
- This plan (§6 filled); `docs/session_51.md` (the distilled session
  log) + `docs/session_52.md` (the second raw log); `worklog.md` (the
  V28 entry). Every count mention (568→577, 42→43 files) bumps in the
  same commit — plus the three V27 residuals (the SKILL E2E row "201
  specs" + two command-block lines "201/201") swept to 203/203.
- Commit to main; SSH-wrapper push (no new branches).

## 4. Test plan

- The born-RED pins prove the defenses deterministically: the
  script-reference pin catches a stale citation that has been live
  since v6; the census pin catches dead weight that has ridden the
  manifest since the scaffold. The RED runs are the primary proof.
- The mutation proofs (B4) demonstrate that removing either guard flips
  its pin RED at the exact planted defect — the pins guard the guards.
- The full suite re-runs as the regression proof — the removal of four
  unreferenced packages must not move a single existing assertion (the
  build/lint/tsc gates prove the manifest surgery is invisible to the
  app's compile and runtime surfaces; the 203 e2e specs prove the
  browser layer is untouched).

## 5. Out of scope (disclosed)

- Dependency UPGRADES: the Radix minor bumps and the Prisma 6→7 MAJOR
  available via `bun outdated` are deliberately not taken (the
  surgical-change discipline; the parity pins are green on the current
  set; a Prisma major migration is its own cycle if the operator wants
  it).
- Restoring an asset-generation script: the head assets are committed
  one-time evidence; a new generator would byte-diff the v6-verified
  assets and serve no standing need (SD-116's reasoning).
- Historical session logs / executed plans under `docs/` that reference
  workspace-local scripts from their own era — archival records, out of
  the live-doc pin's scope by design.
- The react-dom boot floor, the reference's own broken flows (nothing
  to mirror), and every standing v8–v27 disclosure — unchanged.

## 6. Execution results (filled on completion — 2026-10-28)

- **B1 — DONE.** The audit ledger L1–L14 above; the reference unchanged
  for the 13th consecutive cycle (the two `aria-expanded` buttons
  re-identified as the Radix Select comboboxes; viewport-locked on both
  surfaces); the baseline green exactly as V27 closed it (568/568 unit
  · 203/203 e2e — after the fresh-clone rebuild + the chromium-1243
  binary install, the same infra miss as V27's session, root-caused on
  the spot); the mobile drawer spine re-measured live via the spec's
  own testids, EXACTLY matching the frozen ledger (13th confirmation,
  no Tailwind v4 trap; Esc close + focus return verified); the citation
  sweep clean (19/19); neo-crm's single new commit (`769ba13`) read in
  full — the raw session_415 transcript of the already-adopted
  session-196 (no new doctrine); the V27 title-guard probe re-run
  12/12 clean (6 natural + 6 fast-auth; min margins 9ms/11ms — the
  race shape live, the guard correcting every iteration); F1 and F2
  scoped (L9/L10).
- **B2 — DONE (born RED, exactly as designed — RE-DEMONSTRATED after
  the mid-execution workspace reset on a second fresh clone).** The
  deployment-surfaces extension (block 10, the six-live-docs
  script-reference pin): **2 RED** — AGENTS.md and retail-pos_SKILL.md
  both fail on `scripts/generate-head-assets.py` ("references
  scripts/generate-head-assets.py but it does not exist"), the exact F1
  citations; the other four docs' assertions green. The dependency
  census: **1 RED** listing exactly the four dead packages (an initial
  draft's census self-reference was caught during the RED run itself —
  the pin's own prose cited bun-types and made it falsely "live"; fixed
  by excluding the census file from its own surface, the rule a census
  must not count its instrument as evidence). One implementation
  defect caught by the tsc gate during the RED phase (a
  `ReturnType<typeof readdirSync>` union typing `entry` as Buffer —
  fixed with an explicit `Dirent[]`); lint 0 · tsc 0 restored before
  the fixes landed.
- **B3 — DONE.** The truthful asset-provenance statement replaced the
  regeneration claim in AGENTS.md §15 and retail-pos_SKILL.md (the
  assets are one-time-generated committed evidence; the v6 workspace's
  generator never shipped; a first draft of the AGENTS wording
  accidentally retained the literal `scripts/generate-head-assets.py`
  path — caught by re-running the pin, reworded to "a repo script").
  `bun remove @radix-ui/react-radio-group @radix-ui/react-scroll-area
  @radix-ui/react-toast bun-types` → "4 packages removed"; the manifest
  verified clean; `git diff --stat` shows package.json (−4 lines) +
  bun.lock (−12 lines) moving together. Both pin layers GREEN:
  deployment-surfaces 22/22 · census 3/3.
- **B4 — DONE (mutation-proven both directions — re-proven on the
  second clone).** (a) The planted bogus
  `scripts/does-not-exist-probe.ts` reference in CLAUDE.md → RED at
  exactly "CLAUDE.md: every scripts/ reference resolves" → reverted →
  GREEN (22/22). (b) The planted fake `"acme-widget": "^1.0.0"` row in
  package.json → RED listing exactly `acme-widget` → reverted → GREEN
  (3/3). Full gates: **lint 0 · tsc 0 · build ✓ · 577/577 unit (43
  files, 568+9) · 203/203 e2e (3.7m, ZERO flakes)** — the removal of
  four unreferenced packages invisible to every layer. The evidence
  set: four v28 captures under docs/screenshots/ (v28-desktop-ventas-1280
  — the /Ventas surface with its title "Ventas | VeloxPOS" verified
  live pre-capture, the V27 guard's face; v28-desktop-dashboard-1280;
  v28-mobile-terminal-390 — the shift-gated chrome;
  v28-mobile-drawer-open-390 — the spine freeze holding), all
  PNG-validated at the exact expected dimensions (1280×800 / 390×844).
- **B5 — DONE.** Docs lockstep: README (badge 577+203 + the testing
  table), AGENTS (§15's truthful provenance + the repo-hygiene
  deployment-surfaces description widened to the six-live-doc scope +
  the NEW manifest-census bullet), CLAUDE (the v28 contracts note + the
  counts 577/43 — on the first clone a draft accidentally REPLACED the
  v27 note instead of adding before it; caught in review and restored;
  the second-clone application inserts correctly, both notes present,
  newest first), PAD v2.15.0 (the history entry + **ADR-037** + the §8
  testing table + the two new seam rows), SKILL v1.22.0 (the v28 close
  layer + counts + the §12 **F12** lesson). **A bonus count-lockstep
  sweep caught THREE V27 residuals** — the SKILL stack-table E2E row
  ("201 specs") and both SKILL command-block e2e lines ("201/201")
  still carried the pre-V27 count; all swept to 203/203 in this commit.
  This plan's §6, `docs/session_51.md` (the distilled log) +
  `docs/session_52.md` (the second raw log), and the worklog V28 entry.
  `.env.example` unchanged and bidirectional-true (the install/db/login
  round-trip proved it during setup). The unit suite re-ran green
  AFTER every doc edit (the census + doc pins read the live docs — the
  lockstep is itself gate-verified) — and the final re-run EARNED its
  keep: the doc pin went RED on the PAD/SKILL history layers because
  their narrative cited the literal swept path while describing the
  finding itself; the narrative reworded to the non-path form ("a
  generate-head-assets repo script") and the suite went GREEN — the
  pin demonstrably guards the whole claim family, including the docs
  that describe the sweep. Commit to main + the SSH-wrapper push
  close the cycle.
