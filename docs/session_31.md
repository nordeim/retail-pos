# Session 31 (V19) — the audit-clean cycle, the mobile
# evidence set, and the self-contained probe

The cycle opened with the workspace RESET (the retail-pos directory was
absent — the second reset in three cycles), so a fresh clone rebuilt it:
main @ `f347032` (the V18 close + session_30), clean tree, V18 history
intact. The environment bootstrap followed the web-application skill's
fresh-clone sequence end-to-end: `bun install` (488 packages), `.env`
from `.env.example` (`DATABASE_URL="file:../db/custom.db"`), `db/` at
the repo root, `db:push` + `db:seed` (12 products / 6 categories /
2 registers / 2 sales / 2 shifts), and `bunx playwright install
chromium` — the fresh cache lacked the 1243 build the lockfile's
Playwright 1.63 needs, which the FIRST e2e run surfaced as three
`Executable doesn't exist` failures (an infra miss, root-caused on the
spot — NOT the V18/F2 flake shape; the post-install run went 179/179).

The core docs were re-read in full (AGENTS.md's 31 contracts, CLAUDE.md,
README, the PAD's ADR-028, retail-pos_SKILL.md v1.13.0), then
session_29/30 + remediation-plan-v18 + the worklog tail — and the V18
close was validated against the codebase: the chunk-recovery seam, the
`ViewErrorBoundary` + epoch-keyed registry in page.tsx, the segment and
root nets, and the mobile drawer all in exact contract shape. The
baseline gates re-ran green on the fresh clone:
**lint 0 · tsc 0 · build ✓ · 509/509 unit · 179/179 e2e** — identical
to the documented V18 close.

**The audit** (agent-browser on the reference, the self-contained probe
on the clone): the reference's data state is UNCHANGED for the fourth
consecutive cycle — both cajas "Cerrada" (Caja 2 first), 12 products,
2 sales, the same Dashboard headings, Reports empty, Terminal
shift-gated, and at 390px still NO hamburger (its 220px sidebar
squeezes main to 170px) — nothing new to mirror. The Tailwind v4 sweep
found nothing new (95 `--color-` pins, no trap surfaces in the error
cards, the drawer's disclosed 200ms, the trap tests green). The
neo-crm cross-check confirmed the V18 port stays faithful (and that
neo-crm's own error cards carry no `role="alert"` — recorded here as an
informational observation, not a finding).

**The sandbox lesson (the cycle's "one new thing").** This environment
now kills background processes between tool invocations — a
setsid+nohup+disown `sleep 60` does not survive the next command, so
the prior cycles' "keep a probe server on :3101 across commands"
pattern is impossible. The adaptation: `scripts/probe-v19-mobile-recovery.ts`
owns its server's WHOLE lifecycle (spawn → health-poll → probe →
SIGTERM in a finally) inside one invocation — the probe-tooling shape
for this environment, documented in the script header.

**The deliverable — session_29's suggested next step, closed.** The
mobile evidence set for the error-recovery surfaces (only desktop 1280
shots existed): the probe re-verified the FULL mobile drawer contract
live at 390×844 — **10/10 checks PASS** (login + app bar; the drawer
open with aria-expanded and the exact 288×844 panel; 8 links at a
uniform 44.0px pitch; scroll lock + focus in; Esc close with focus
returned to the hamburger; backdrop close; drawer route navigation;
zero horizontal overflow on all 8 routes) — then captured the recovery
card at 390px via the realistic failure path (persistent block +
pre-seeded cooldown, SPA navigation FROM THE DRAWER) and the healed
view after Reintentar. All three shots VLM-verified (z-ai vision): the
drawer renders the 8 links and the Mi Tienda header; the card reads
"No se pudo cargar la vista" + "Reintentar" with the app bar alive (the
shell survived); the healed view shows "Ajustes de la Tienda" with no
layout issues.

**No code changes** — the audit found no parity gaps and no bugs, and
the honest position is to say so (SD-75): the 509 + 179 pins stay the
regression contract, untouched and re-proven on a fresh clone. The
diff is the probe script, the three evidence shots, this log, the v19
plan with its verification ledger, and the worklog entry.

Verification: **lint 0 · tsc 0 · build ✓ · 509/509 unit · 179/179 e2e**
(re-run with the probe in scope). Known-open (disclosed): F1
(`role="alert"` on the recovery cards — informational); the react-dom
boot floor; the reference's own broken flows have nothing to mirror;
every standing v8–v18 disclosure unchanged.

Suggested next steps: none blocking. If the next cycle wants a target:
the reference's register-card surfaces remain the standing watch item
(four cycles unchanged), and the F2 flake watch stays open (no
recurrence since the V18 fix — this cycle's first-run failure was
root-caused to the missing browser binary and cleared on install).
