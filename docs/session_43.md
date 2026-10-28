# Session 43 (V25) — the drawer-contract
# completion: the drawer-open spine
# freeze

The cycle started from a RESET workspace (the sandbox had wiped the
retail-pos clone — `git clone https://github.com/nordeim/retail-pos.git`
re-materialized main @ `3631699`; the locals were rebuilt from scratch:
`bun install`, `.env` from `.env.example` with
`DATABASE_URL="file:../db/custom.db"`, `bun run db:push` + `db:seed`
(the 12-product / 6-category / 2-register / 2-sale reference mirror),
the Playwright chromium build). The V24 reference docs were read in
full (session_41, session_42, remediation-plan-v24 with its L1–L13
ledger and execution results, the worklog tail) against the re-read
core docs — AGENTS.md's contracts + the Tailwind v4 traps + the
account UI contract + the mobile drawer contract, CLAUDE.md, README,
the PAD at v2.11.0/ADR-033, SKILL v1.18.0 — and the repo-included
skills were used for the audit (web-application §5/§12 for the
security/Tailwind contracts, nextjs16-tailwind4 §9 for the mobile-nav
failure taxonomy, the tdd doctrine for the RED→GREEN loop,
clone-app-pat-pro's computed-styles doctrine, agent-browser for the
live walks).

**The baseline gates: lint 0 · tsc 0 · build ✓ · 556/556 unit ·
199/199 e2e (3.5m) — first-try on the fresh clone, zero code
changes.**

**The audit (10th cycle).** agent-browser on the reference: the data
state UNCHANGED — Terminal shift-gated, both cajas present with Caja 2
first, 12 products, 2 sales (V-MO6BJT7G, V-MMPNY55Z), Dashboard
$0.00 KPIs + 12 products, Reports $0.00 + "Sin datos en este período";
at 390px still NO hamburger (nav 220px, viewport-locked); Ajustes
carries exactly the five store sections — no account surface
anywhere. The clone's mobile drawer re-verified LIVE at 390×844 (the
drawer opens; Esc closes + returns focus to the hamburger) — the
TailwindCSS v4 mobile-menu trap is NOT present, the trap suite green
(the 10th consecutive confirmation). neo-crm ADVANCED by one material
commit since the V24 review (`a3ac674` → `316fbe2`, session-196: "THE
DRAWER-OPEN SPINE FREEZE") — its doctrine ADOPTED as this cycle's
headline: **behavior pins (the panel box, the pitch uniformity, the
close paths, the focus contract) cannot catch a computed-margin
regression — the drawer-open geometry must be frozen as a complete
box ledger, and the pin mutation-proven.** The spine was then
measured LIVE for the first time as a complete ledger (agent-browser
walk at 390×844): panel `[0,0,288,844]` · header `[0,0,287,69]` · nav
`[0,69,287,727]` · footer `[0,796,287,48]` · close `[235,16,36,36]` ·
8 links at `[12,y,263,40]` with y = 81+44k — perfectly regular and
fully integral.

**The findings (two, both in the drawer-contract family — the
standing user focus).** F1: the drawer-open spine carries no pin —
the geometry ledger above is rendered truth pinned by nothing; an
`mb-*` utility re-entering the drawer's flex column (the trap-4
family) would shift the header 69→77, cascade to every link and the
footer, and every standing gate stays green. F2: the lg-breakpoint
close (mobile-chrome's matchMedia listener, documented in the
component's own comment) carries no e2e pin — live-verified working
both directions (crossing to lg closes the drawer + resets
aria-expanded; resizing back below lg it stays closed, no state
leak), but a regression would leave `mobileMenuOpen` true under the
visually-vanished lg:hidden overlay and the drawer would reappear on
return.

**The fixes (born-green pins + the session-196 mutation proof,
ADR-034).** Two new tests EXTEND `tests/e2e/mobile-navigation.spec.ts`
(the drawer family's owner): the SPINE FREEZE (the full box ledger +
the footer "VeloxPOS" wordmark via the `expect.poll` starved-read
idiom with exact equality on rounded reads) and the BREAKPOINT CLOSE
(390→1280 → closed + hidden chrome; back to 390 → still closed). The
RED run earned its keep TWICE before going green — both first-draft
pin defects, not app defects: the transcribed first-link y of 12 vs
the measured 81, and a `toHaveCount(0)` on the lg:hidden hamburger
where `display:none` keeps the element in the DOM (`toBeHidden()` is
the correct assertion). Then the mutation proof: a planted `mb-2` on
the drawer header → build → the spine pin RED exactly at the shifted
boxes (nav 69→77, links +8) while the OTHER 11 drawer tests stayed
green — the battery gap demonstrated live — restored → GREEN.

**The evidence set.** Four captures under `docs/screenshots/`
(v25-mobile-drawer-open-390.png, v25-mobile-terminal-390.png,
v25-mobile-dashboard-390.png, v25-desktop-dashboard-1280.png), all
VLM-verified for correct rendering.

**The gates at close: lint 0 · tsc 0 · build ✓ · 556/556 unit (39
files, unchanged) · 201/201 e2e (3.5m, 199+2).** The docs lockstep
rode along: README (badge 556+201), AGENTS (the mobile drawer
contract gains the spine-freeze + breakpoint-close paragraphs),
CLAUDE (the v25 contracts note + counts), the PAD (v2.12.0 +
ADR-034 + the §8 testing table), SKILL v1.19.0 (the §12 F9 lesson) —
every count mention bumped 199→201 in the same commit.

Suggested next steps: none blocking. The watch items stand; the next
cycle could re-check neo-crm's newest sessions (the doctrine export
flows both ways), run another Known-Issues truth sweep, or target
another superset surface — the operator's call.
