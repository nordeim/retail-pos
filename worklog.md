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
