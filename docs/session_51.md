# Session 51 (V28) — raw work transcript

The workspace had been RESET (no retail-pos clone in /home/z/my-project
— reset twice this session; the second reset landed mid-execution,
AFTER B4's gates passed but BEFORE the commit — the whole cycle
re-executed on the second clone with every step re-verified, born-RED
included; the resets are themselves recorded environment facts). Fresh
`git clone https://github.com/nordeim/retail-pos.git` — main @
`f26630d` (V27 complete + session_49 + session_50 +
remediation-plan-v27 executed). My session is the **V28 cycle** (13th
audit loop).

Core docs read in full: AGENTS.md (31 contracts + the Tailwind v4 traps
+ the account UI contract + the mobile drawer contract with the v25
spine-freeze paragraphs + the v26 failure-path pins + the v27
title-guard paragraphs), CLAUDE.md, README.md, the PAD at
v2.14.0/ADR-036, retail-pos_SKILL.md v1.21.0. Then the V27 reference
docs: session_49 (the V27 raw log), session_50 (the second raw log,
Chinese), remediation-plan-v27 (ledger L1–L12 + §6 execution results —
B1–B5 all DONE), the worklog tail. The V27 close verified against the
codebase: the guarded title effect in `src/app/page.tsx` (the
MutationObserver on document.head, apply-when-different, disconnect on
cleanup), both pin files present, the probe committed.

Locals rebuilt from scratch on each clone: `.env` from `.env.example`
(`DATABASE_URL="file:../db/custom.db"`), `bun install` (488 packages),
`bun run db:push` + `bun run db:seed` (12 products / 6 categories /
2 registers / 2 sales / 2 shifts — the reference mirror),
`bunx playwright install chromium` (the 1243 binary absent in the fresh
sandbox — the SAME infra miss as V27's session, root-caused on the
spot, not a code failure).

Baseline gates, in order: lint 0 · tsc 0 · build ✓ · unit **568/568**
(42 files) · e2e **203/203** (3.6m) — exactly matching the V27 close.

The audit (13th cycle). agent-browser loaded; dev server started
daemonized — healthy. Reference site logged in
(sepnetflix2023@outlook.com): Terminal shift-gated, Dashboard
$0.00/0/12/0 KPIs + the flat 7-day chart + the 5-row byCategory legend
(Lácteos, Limpieza, Higiene Personal, Alimentos, Snacks), 12 products
(Shampoo Pantene first, Pan Bimbo last), 2 sales (V-MO6BJT7G,
V-MMPNY55Z), Registers Caja 2 first + Caja 1 (both Cerrada), Reports
"Sin datos en este período", Ajustes = exactly the five store sections;
at 390×844 viewport-locked (scrollH = clientH = 844 on both Terminal
and StoreSettings), NO hamburger (the two `aria-expanded` buttons on
StoreSettings are the Radix Select comboboxes — `role=combobox`, the
V27 identification). **Reference UNCHANGED for the 13th consecutive
cycle.**

neo-crm cross-check: `git ls-remote` → HEAD `769ba13` — ADVANCED from
`316fbe2` for the first time since the V25 review. Full-clone diff
read: ONE new commit, "update session log", whose entire diff is
`docs/session_415.md` (+109 lines) — the raw step-by-step transcript
of the SAME session-196 drawer-open spine-freeze work whose commit
(`316fbe2`) retail-pos already reviewed and adopted as V25/ADR-034.
The transcript adds no doctrine the adoption missed. **No adoption
this cycle.**

Clone live audit on :3000 (owner@veloxpos.local / the seed's
`$Abcd1234` default — the bun `$`-expansion contract; the e2e identity
`VeloxDemo123!` is e2e-only and bounces on the dev db): at 390×844 the
drawer spine re-measured via the spec's own testids — panel
[0,0,288,844] · header [0,0,287,69] · nav [0,69,287,727] · footer
[0,796,287,48] ("VeloxPOS") · close [235,16,36,36] · 8 links at
[12,y,263,40] y=81+44k — EXACTLY the frozen v25 pin. Esc close +
aria-expanded reset + focus return to the hamburger verified. **No
Tailwind v4 mobile-menu trap (13th consecutive confirmation).**

The audit sweep that found the cycle's targets:
1. The citation sweep re-run (the V26/V27 instrument): 19 test
   citations across `src/` (17 + the two V27 title-guard citations),
   all resolve — clean.
2. The Known-Issues register: zero live watch items (the F2 flake
   family retired with V27).
3. The V27 probe re-run (`bun scripts/probe-v27-title-race.ts 6 6` on
   the fresh clone): 12/12 clean — every final title
   "Ventas | VeloxPOS"; the margin ledger still shows the
   single-digit-ms race shape (min 9ms natural / 11ms fast; the
   metadata manager's last write as late as ~329ms) with the guard's
   corrections visible in every timeline. **The V27 guard is
   live-verified in this fresh environment.**
4. **F1 — the script-reference truth family.** A sweep of every
   `scripts/…` reference across the SIX live operational docs found
   `scripts/generate-head-assets.py` cited by AGENTS.md §15 ("Assets
   regenerate via …") and retail-pos_SKILL.md ("Regenerate the assets
   with …") — and `git log --all` for the path is EMPTY: the v6
   workspace's generator was never committed (absent from `scripts/`
   and `scripts/archive-study-sweep/`; no other asset-generation
   script exists). The standing pin ("references only scripts that
   exist") scans `docs/DEPLOYMENT.md` ONLY — the claim family was
   real, the pin's scope was one doc wide. A stale-from-birth
   operational claim that survived 22 cycles.
5. **F2 — the dead-dependency census.** The web-application skill §2
   census, run for the FIRST time in this repo (every prior "census"
   mention in the docs is a data/user census): 43 packages, 4 dead —
   `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`,
   `@radix-ui/react-toast` (zero references; no ui/radio-group.tsx,
   no ui/scroll-area.tsx; the repo's toaster is the custom zustand
   build in `src/components/ui/toast.tsx`, which imports no Radix),
   and `bun-types` (zero references; EMPIRICALLY dead — tsc --noEmit
   passes with the package physically removed from node_modules).
   Infrastructure ruled NOT dead: react-dom (the Next runtime peer),
   @types/react + @types/react-dom (TSX compilation).
6. Dependency health (disclosed, not acted): `bun outdated` shows
   minor Radix bumps + a Prisma 6→7 MAJOR — no upgrades ride this
   cycle (the surgical-change discipline).

Wrote `docs/remediation-plan-v28.md` — the shipped-artifacts truth
pass: SD-116 (the truthful provenance + the six-live-docs
script-reference pin), SD-117 (bun remove + the census pin), SD-118
(born RED), SD-119 (the mutation proofs), SD-120 (extend, never
weaken). Batches B1–B5.

**B2 — the pins, born RED.** `tests/deployment-surfaces.test.ts`
gained block 10 (the six-live-docs script-reference describe — the
DEPLOYMENT regex generalized, trailing punctuation and directory
slashes tolerated). `tests/dependency-census.test.ts` (NEW): the
census over the executable surface (src/, tests/, scripts/ minus the
archive, prisma/, the root configs, package.json's own scripts block —
the CLI tools earn their place through the commands the gate runs)
with an explicit INFRA allowlist (react-dom, @types/react,
@types/react-dom). First runs: the doc pin **2 RED** (AGENTS + SKILL,
both on generate-head-assets.py — the exact F1); the census **1 RED**
listing the four dead packages. The RED phase itself caught two
implementation defects: (a) the census's own prose cited bun-types and
made it falsely "live" — fixed by excluding the census file from its
own surface (a census must not count its instrument as evidence);
(b) a `ReturnType<typeof readdirSync>` union typed `entry` as Buffer
and failed tsc — fixed with an explicit `Dirent[]`.

**B3 — the fixes.** AGENTS.md §15 + SKILL.md: the truthful
asset-provenance statement (one-time-generated committed evidence; the
v6 generator never shipped). A first AGENTS draft accidentally
retained the literal stale path — caught by re-running the pin,
reworded. `bun remove @radix-ui/react-radio-group
@radix-ui/react-scroll-area @radix-ui/react-toast bun-types` → "4
packages removed" (package.json −4 lines + bun.lock −12 lines, moving
together — the manifest touched only through the package manager).
Both pin layers GREEN: 22/22 · 3/3.

**B4 — the mutation proofs + the full gates.** (a) A planted bogus
`scripts/does-not-exist-probe.ts` reference in CLAUDE.md → RED at
exactly the CLAUDE.md test → reverted → GREEN. (b) A planted fake
`acme-widget` row in package.json → RED listing exactly acme-widget →
reverted → GREEN. Full gates: **lint 0 · tsc 0 · build ✓ · 577/577
unit (43 files, 568+9) · 203/203 e2e (3.6m, ZERO flakes)** — the
manifest surgery invisible to every layer. Four captures under
docs/screenshots/ (v28-desktop-ventas-1280 — the /Ventas surface, its
title "Ventas | VeloxPOS" verified live pre-capture, the V27 guard's
face; v28-desktop-dashboard-1280; v28-mobile-terminal-390;
v28-mobile-drawer-open-390 — the spine freeze holding), PNG-validated
at the exact expected dimensions.

[The mid-execution workspace reset: after the first pass through B4
the workspace was wiped a second time — every uncommitted artifact
lost. The whole cycle re-executed on a second fresh clone: the
environment rebuilt, the pins re-written, **born RED re-demonstrated**
(the doc pin again 2 RED on the exact F1 citations; the census again
RED on the exact four dead packages), the fixes re-applied (GREEN
22/22 · 3/3), both mutation proofs re-run (RED at the exact targets →
reverted → GREEN), the full gates re-passed (577/577 · 203/203,
3.7m), the four captures re-taken and re-validated. The reset cost
time, not truth — every claim below is evidenced on the SECOND pass.]

**B5 — docs lockstep.** README (badge 577+203), AGENTS (§15 + the
repo-hygiene six-live-doc scope + the NEW manifest-census bullet),
CLAUDE (the v28 contracts note + counts — on the first clone a draft
accidentally REPLACED the v27 note; caught and restored, the second
application inserts correctly, newest first), PAD v2.15.0 (history +
**ADR-037** + §8 table + the two new seam rows), SKILL v1.22.0 (the
v28 close layer + counts + the §12 **F12** lesson). **A bonus
count-lockstep sweep caught THREE V27 residuals** — the SKILL
stack-table E2E row ("201 specs") and both SKILL command-block e2e
lines ("201/201") still carried the pre-V27 count; all swept to
203/203. This plan's §6, session_51 + session_52, the worklog V28
entry. `.env.example` unchanged and bidirectional-true. The unit suite
re-ran green AFTER every doc edit (the census + doc pins read the live
docs — the lockstep is itself gate-verified).

A final validation event worth recording: the post-docs unit re-run
caught the PAD/SKILL history layers citing the literal swept path
inside their own narrative of the finding — the pin guards the whole
claim family, including the docs that describe the sweep. The
narrative reworded to the non-path form; GREEN restored (577/577).

**The V28 cycle is complete and pushed to main.**

**What this cycle delivered:**
- **Audit**: reference unchanged for the **13th consecutive cycle**;
  the clone's mobile drawer spine re-measured EXACTLY matching the
  frozen ledger (**no Tailwind v4 bug**, 13th confirmation); the
  citation sweep clean (19/19); neo-crm's single new commit read in
  full (the raw transcript of the already-adopted s196 — no new
  doctrine); the V27 title-guard probe re-run 12/12 clean.
- **The shipped-artifacts truth pass (ADR-037)**: F1 — the
  stale-from-birth "assets regenerate via a repo script" claim swept
  from two live docs (the v6 generator never shipped), and the
  script-reference pin widened from DEPLOYMENT.md-only to the whole
  SIX-live-doc set; F2 — four dead dependencies retired via the
  package manager (three scaffold Radix primitives + bun-types) and
  the dependency census made standing (every manifest package earns a
  live reference or an explicit INFRA allowlist row). Both pins born
  RED on the standing tree and **mutation-proven both directions**
  (a planted bogus script reference and a planted fake package each
  flip their pin RED at the exact target).
- **Gates**: lint 0 · tsc 0 · build ✓ · **577/577 unit · 203/203 e2e
  (zero flakes)**; 4 PNG-validated screenshots; full docs lockstep
  (PAD v2.15.0, SKILL v1.22.0, session_51/52, worklog) + three V27
  count residuals swept as a bonus.

**Suggested next steps**: everything is green and current — a future
cycle could re-check neo-crm's newest sessions (the s196 transcript
pattern suggests more rotation logs may land), re-run the citation
sweep + Known-Issues pass + the new census instruments, or target a
new superset surface. Your call.
