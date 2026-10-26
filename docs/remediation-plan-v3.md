# VeloxPOS — Remediation Plan v3 (Session V3, 2026-10-26)

> Scope: re-execution of the v2 audit remediation (the v2 plan was committed
> but its batches never ran before the crash) plus the live-reference parity
> re-verification sweep performed this session. Baseline re-verified before
> execution: `main @ 15c7020`, gates green (lint · tsc · unit 147/147 ·
> build · e2e 49/49).
>
> Method: every fix lands TDD — the pin (unit or e2e) is written red first,
> then the fix, then the full gate. Evidence labels: **Verified** (executed
> here), **Reasoned** (inference), **Assumed** (decision).
>
> History: v1 (`docs/remediation-plan.md`, study app, historical), v2
> (`docs/remediation-plan-v2.md`, the audit + parity findings). This v3
> carries the same finding IDs (stable cross-references) and adds the live
> re-verification results from the 2026-10-26 agent-browser sweep of
> `veloxposretail.base44.app`.

## 0. Verification ledger (this session)

| Check | Method | Result |
|---|---|---|
| Baseline gates | executed lint/tsc/vitest/build/playwright | all green (147 + 49) |
| C1 token-in-body | read forgot-password route + live e2e posture | **Verified present** |
| H1 ZodError→500 | read entities.ts delegates (`.parse` direct) | **Verified present** |
| H2 OTP no lockout | read verify-email route (no limiter/counter) | **Verified present** |
| H3 XFF first hop | read server/auth.ts `clientIp` | **Verified present** |
| M1 stock race | read sales route (check outside tx, unguarded decrement) | **Verified present** |
| M2 positional labels | read dashboard route (`WEEKDAY_MIN[index]`) | **Verified present** |
| M3 line math | read terminal-view.tsx:235 (`round(unit)×qty`) | **Verified present** |
| V1 kicker styles | live agent-browser computed styles | dashboard/ajustes h3 = 16px/700/`rgb(51,65,85)` title-case; reports h2 = 14px/700/`rgba(255,255,255,.6)` uppercase/0.7px |
| V2 H1 size | live computed style at 390 + 1280 | 24px fixed (clone: 30px ≥sm) |
| V3/V4 chart labels | live DOM + screenshots | ~8 thinned date X labels; integer `$` Y labels |
| V5 logo control | live Ajustes | `glass-button` styled label + upload icon wrapping the hidden input ("Subir logo") |
| V6 low-stock row | live Dashboard | amber box-icon chip + bold name + amber `N en stock (mín. M)` sub-line |
| Mobile nav parity | live site at 390×844 | reference has NO drawer (sidebar squeezes to 170px) — clone drawer remains the functional superset |
| Cajeros parity | live site | reference has no create button — clone cashier CRUD remains the superset |

## 1. Execution batches (TDD: red → green → gate)

### R1 — Security hardening (C1, H1, H2, H3, M4, M6, M7, L10)
1. **C1** forgot-password: `resetPath`/`resetUrl` ride the response ONLY
   when in-app delivery is enabled (non-production or `RESET_INAPP_DELIVERY=1`);
   production omits them. Pure `inAppResetDeliveryEnabled()` seam (explicit
   args, no env reads inside). Unit pins + e2e pin in true production posture.
2. **H1** `toErrorResponse` maps raw `ZodError` → 400 (single root fix).
   Unit pin + e2e pin (invalid POST/PATCH on factory routes → 400, not 500).
3. **H2** verify-email: IP rate limit (login-bucket shape) + per-user atomic
   attempt counter (`updateMany` guard; ≥6 failed strikes kills the code).
   Unit pins on the counter seam + e2e pin.
4. **H3** `resolveClientIp(xff, hops)` — pure, selects the hop at the declared
   trusted proxy depth (`AUTH_PROXY_HOPS`, default 0 = rightmost), fail-closed.
   Unit pins (single hop, rotated list, garbage, absent); routes switch to it.
5. **M4** `readJson`: 413 on `content-length` > 1MB; 415 on non-JSON content
   types (absent/empty tolerated). Unit pins on constructed Requests.
6. **M6** `tokenVersion Int @default(0)` on User; session token payload carries
   `v`; `reset-password` bumps it; `getCurrentUser` compares → revocation.
   Unit pins + e2e pin (pre-reset cookie 401 after reset).
7. **M7** unknown-email login burns a dummy scrypt verify before the 401
   (timing equalizer; seam-injected unit pin, no wall clock).
8. **L10** rate-limit buckets pruned during `checkRateLimit`. Unit pin.

### R2 — Data integrity & correctness (M1, M3, L2, L4, M5, L8)
1. **M1** guarded decrement INSIDE the sale transaction
   (`updateMany({ stock: { gte: qty } })`; `count<1` → 422 + rollback);
   the pre-transaction check becomes the fast-path only.
2. **M3** terminal line cells render via `lineTotalCents` (unit: 1234¢ @16% ×2
   → 2863); AGENTS.md formula wording reconciled in the same commit.
3. **L2** drop the vacuous refine; server-side: `efectivo` with
   `cashReceived < total` → 422 (`CashShortError`); card ignores it.
4. **L4** duplicate-open re-checked inside the transaction via a dedicated
   `ConflictError` → 409; route comment corrected.
5. **M5** sales list capped (`take` 200, newest-first); shift aggregates via
   `groupBy(shiftId, _sum)` — response shapes unchanged.
6. **L8** schema `@@index` set: `Sale([userId, createdAt])`, `SaleItem([saleId])`,
   `Shift([userId, registerId, status])`, per-user indexes. Schema test pin.

### R3 — Visual parity (V1–V6, M2)
1. **V1** `SectionCard` `variant: "card" | "kicker"` — card: h3/16px/700/
   slate-700 title-case (dashboard + ajustes); kicker: h2/14px/700/white-60
   uppercase/tracking 0.7px (reports). Computed-style e2e pins (resolved-color
   probe comparison — Tailwind v4 emits OKLCH/LAB, not literal rgb strings).
2. **V2** `PageHeading` fixed `text-2xl` (24px at all widths). E2e pin.
3. **V3** `SalesAreaChart` X-label thinning (≤8, first+last always) + integer
   `$` Y labels on Reports. E2e pins.
4. **V4/M2** `weekWindow()` pure helper in date.ts (rolling 7 days, per-date
   `WEEKDAY_MIN[isoWeekday(d)]` labels, today LAST) feeding the dashboard
   route + chart; Y labels plain integers. Unit + e2e pins.
5. **V5** Ajustes logotipo: styled glass "Subir logo" button (upload icon +
   filename feedback) wrapping the hidden input. E2e pin.
6. **V6** low-stock rows: amber box-icon chip, bold name, amber sub-line on
   the second row. E2e structure pin.

### R4 — Repo hygiene & UX (M8, L1, L3, L5, L6, L9, L11)
1. **M8** identity: `package.json` name/description → retail-pos/VeloxPOS;
   drop dead deps (`quill`, `web-vitals`, `z-ai-web-dev-sdk`); delete dead
   `src/lib/server/ai.ts`; rewrite vitest.config.ts header; fix the
   next.config.ts route comment.
2. **L1** drop `ignoreBuildErrors` (next.config.ts) + `noImplicitAny: false`
   (tsconfig) — strict gates restored, build must stay green.
3. **L3** delete the `void formatDayDash;` hack, the built-then-voided
   `productById`, and the identical `"Agregado"/"Agregado"` ternary.
4. **L5** donut: single `colorByName` map feeding arcs AND legend swatches.
5. **L6** `loadCollections`: one `sonner` error toast per failed burst
   ("No se pudieron cargar los datos"); views keep empty states. E2e pin.
6. **L9** `.env.example` + `NEXT_PUBLIC_SITE_URL`; env-check fatals in
   production on the EXAMPLE `AUTH_SECRET` value. Unit pins.
7. **L11** drawer focus contract (neo-crm pattern): focus INTO the panel on
   open (`tabIndex={-1}` + rAF retry), Tab wraps inside, focus RETURNS to the
   hamburger on close, `activeElement` verified. E2e pins.

### R5 — Docs, evidence, ship
1. 16 screenshots of the remediated dev server → `docs/screenshots/`.
2. `.env.example` final (R4.6) committed.
3. Docs lockstep: AGENTS.md (error contract + delivery gate + tokenVersion),
   CLAUDE.md (counts/variants), README.md (env table), PAD (ADR-011 reset
   delivery, ADR-012 tokenVersion, ADR-013 audit remediation; revision bump),
   `worklog.md` session entry.
4. `retail-pos_SKILL.md` distilled per `skills/distill-codebase-skill` +
   `skills/to-distill-project-into-skill` (replaces the stale
   `omni-study1_SKILL.md`; git history preserves the old).
5. Full gate: lint → typecheck → build → unit → e2e.
6. Single-branch commits on `main`; push via `docs/ssh_git_wrapper_v3.py`
   per `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`.

## 2. Risk notes (unchanged from v2, re-validated)

- M6 touches auth on every request — additive default (0), full e2e coverage.
- R3 restyles shared components — existing pins are testId/text-based
  (Verified: none assert the old styles); new computed-style pins use
  resolved-color probe comparison (Tailwind v4 OKLCH).
- L1 may surface hidden type errors — fix, never suppress.
- e2e DB is force-reset per run; sqlite `db push` for tokenVersion/indexes is
  additive and automatic via global-setup.
- Superset features (mobile drawer, cashier CRUD) stay — parity targets only
  what the reference renders.

Out of scope (disclosed): image upload storage (imageUrl stays a URL),
SMTP delivery, multi-instance limiter, the reference's own dead ends.
