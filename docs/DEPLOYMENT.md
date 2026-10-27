# Deployment Guide

VeloxPOS ships as a single Next.js **standalone** build with a SQLite file
database — one process, zero external services. This guide covers the
supported production paths, the environment contract, and the
account-security API that ships alongside the UI.

## 1. Build

```bash
bun install
bun run build          # next build + standalone assembly (.next/standalone)
```

The build compiles the page shell and the 27 route handlers (auth,
products, categories, registers, cashiers, shifts, sales, settings,
dashboard, reports, health), then copies `.next/static` and `public/`
into `.next/standalone/` (see the `build` script in `package.json`).
`next.config.ts` pins `outputFileTracingRoot` to the repo root — keep it;
the standalone trace depends on it.

## 2. Run

```bash
bun run start          # NODE_ENV=production bun .next/standalone/server.js
```

The server listens on port 3000 by default (`PORT` overrides). Always start
it from the repo root via the bun script — the scripts guarantee the
working directory that the SQLite path resolution and the standalone trace
rely on. Behind a reverse proxy, forward `X-Forwarded-Proto` so cookie
attributes derive the right scheme, and set `AUTH_PROXY_HOPS` to your
proxy chain depth (§3) so the auth rate limiters pick the right client IP.

## 3. Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | SQLite connection string. See §4. |
| `AUTH_SECRET` | **Yes in production — enforced at boot** | HMAC secret for session cookies. Generate with `openssl rand -hex 32`. **The boot guard refuses to start the production server without a real secret** (missing/empty/the public dev constant → the process exits with the remedy message; dev/test keep the zero-config fallback with a one-line boot warning). |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical public origin, used for metadata URLs and `sitemap.xml` (e.g. `https://pos.example.com`). |
| `RESET_INAPP_DELIVERY` | No | Set to `"1"` ONLY on a production deploy that deliberately wants the reset link carried by the forgot-password API response (the no-SMTP self-hosted recovery path). Production defaults to OFF — the response never carries the one-shot reset token unless this flag opts in. |
| `AUTH_PROXY_HOPS` | No | Trusted reverse-proxy depth for the auth rate limiters' client-IP selection (`resolveClientIp` — the rightmost x-forwarded-for hop at the declared depth, fail-closed). Default `0` = direct connection. |
| `SEED_OWNER_EMAIL` / `SEED_OWNER_NAME` | No | Seed identity overrides (§5). |
| `SEED_OWNER_PASSWORD` | No | Seed password override. The default lives in `prisma/seed.ts`, NOT in `.env` — bun's dotenv expands `$…` inside `.env` values, so a `'$Abcd1234'` value arrives as an empty string. Pin this var in the calling environment (the e2e global-setup does exactly this). |

## 4. Database location (§4 — the `.env.example` reference)

`DATABASE_URL` accepts three forms:

1. **Relative `file:` URL (the default, zero-config local story).**
   ```
   DATABASE_URL="file:../db/custom.db"
   ```
   Relative URLs resolve against the **`prisma/` directory that owns
   `schema.prisma`** — exactly like the Prisma CLI — so this string points
   at `<repo>/db/custom.db` for `prisma db push`, `prisma/seed.ts`,
   `next build` and the running server alike, regardless of the process
   working directory. The resolution rule lives in `src/lib/db-path.ts`
   and is pinned by `tests/db-path.test.ts` (which also hardens against
   Turbopack's one-level-off pre-resolution — see the README
   troubleshooting table).

2. **Absolute `file:` URL (recommended for production).**
   ```
   DATABASE_URL="file:/var/lib/veloxpos/custom.db"
   ```
   Absolute paths pass through untouched — immune to any working-directory
   ambiguity across service managers, containers, or cron wrappers. Point
   them at a persisted volume and back the file up.

3. **PostgreSQL.** Switch `provider = "postgresql"` in
   `prisma/schema.prisma`, set a `postgresql://` URL, then
   `bun run db:push && bun run db:seed`.

Initialize (or reset) the database with:

```bash
bun run db:push        # apply schema (db push — no migrations folder)
bun run db:seed        # idempotent demo dataset (wipes domain tables)
```

`db/*.db` is gitignored; every fresh clone recreates it from the two
commands above.

## 5. Seeding

`bun run db:seed` creates the owner account plus the reference-mirroring
demo dataset (6 categories, 12 products, 2 registers, a cashier, 2
completed sales). The owner identity rides the `SEED_OWNER_*` variables
(§3); the password default lives in `prisma/seed.ts` because of the bun
dotenv `$…` expansion. **Rotate the seeded password immediately on any
shared deploy** — it is a demo seed, not a secret store.

## 6. Updating

```bash
git pull
bun install
bunx prisma generate   # after schema changes
bun run db:push
bun run build
# restart the server process
```

## 7. Verification checklist

```bash
curl -s https://your-host/api/health          # {"status":"ok",...}
bun run lint && bun run typecheck && bun run test
bun run build && bun run test:e2e             # Playwright suite (local)
```

The full gate, in order: **lint → typecheck → build → unit → e2e**. The
e2e layer boots the standalone build on :3100 against its own reset-per-run
database (`db/e2e.db`) — see `playwright.config.ts`.

## 8. Common production issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Error code 14: Unable to open the database file` | Server started from a directory that has no `prisma/schema.prisma` and no absolute `DATABASE_URL` | Start via `bun run start`, or set an absolute `file:` URL (§4) |
| Logins loop back to `/login` | `AUTH_SECRET` changed between restarts | Keep the secret stable across restarts |
| The server exits at boot: `AUTH_SECRET is required in production` | The boot guard fired — the server refuses to sign sessions with a public dev constant | Generate a real secret (`openssl rand -hex 32`), export `AUTH_SECRET`, restart |
| Rate-limited logins (429) | 10 attempts/IP/15 min fixed window | Wait for `Retry-After`, or restart to clear the in-memory buckets (single-node) |
| Empty store after login (no products) | A stray `<parent>/db/custom.db` — Turbopack pre-resolves the relative `file:` URL one level off | Delete the stray; `src/lib/db-path.ts` (v3) makes the repo-owned db win |

## 9. Docker (one-command containerized deployment)

The repo ships a production `Dockerfile` + `docker-compose.yml`. The
container runs the same standalone server as `bun run start` — the app
code is unchanged by containerization; only the environment contract
moves (§4 form-2: the absolute `file:` URL).

```bash
# 1. First run — initialize the SQLite volume (schema + demo seed),
#    then start the app:
AUTH_SECRET="$(openssl rand -hex 32)" docker compose --profile init up -d

# 2. Subsequent runs:
docker compose up -d

# 3. Verify:
curl -s http://localhost:3000/api/health     # {"status":"ok","db":"up",...}
```

What the compose file does:

| Piece | Purpose |
|---|---|
| `veloxpos` service | The standalone server on :3000 (`VELOXPOS_PORT` remaps), `/data` volume for SQLite, healthcheck on `/api/health` |
| `init` service (`--profile init`) | One-shot `prisma db push` + the idempotent seed onto the same volume |
| `db-data` volume | The SQLite file (`file:/data/custom.db`) — survives container rebuilds |
| `AUTH_SECRET` | **Required** — compose refuses to boot with the placeholder (§3) |
| `NEXT_PUBLIC_SITE_URL` | Optional canonical origin (read at serve time by metadata/sitemap) |

Notes:

- **The image carries no database bytes.** The build context ignores
  `db/`, the output tracer's stale `.next/standalone/db/` snapshot is
  removed in the runtime stage, and the absolute `DATABASE_URL` points
  at the volume regardless.
- **Validation status (honest caveat):** the layout was validated
  OUTSIDE Docker (a local simulation of the exact runtime filesystem:
  the prod-deps overlay + standalone + `src/lib` + `prisma/`, then
  `db push` → seed → boot → health/login checks), but the authoring
  sandbox had no Docker daemon. The first
  `docker compose --profile init up` on a Docker host is the remaining
  verification step; report any divergence as an issue.
- **Schema updates:** re-run the init profile after `git pull` +
  rebuild (`docker compose build && docker compose --profile init run
  --rm init` — the push is additive/idempotent).
- **PostgreSQL** (§4 form-3) works in containers too: set the
  `DATABASE_URL` service environment to the postgres URL and leave the
  volume unmounted.

## 10. Account security API (the API-only superset)

Alongside the login/register/verify/reset flows the app ships four
account-security endpoints the hosted reference lacks entirely. They are
**API-only** — no UI surface ships for them (the reference has none to
mirror); drive them over HTTP as the owner. All four are rate-limited
(10 per 15 minutes per account/IP), verify the current password FIRST
(a wrong password is rejected with 400 PRE-WRITE), and never enumerate.
Pinned end-to-end by `tests/e2e/account-security.spec.ts`.

| Endpoint | Contract |
|---|---|
| `POST /api/auth/change-password` | `{ currentPassword, newPassword }` → 200. The session SURVIVES the rotation (the cookie is an HMAC over `AUTH_SECRET`, not the password). |
| `POST /api/auth/change-email` | `{ password, newEmail }` → 200 `{ email }`. Must-differ (400), uniqueness against ALL accounts (409). `emailVerified` stays true — the password proof is the verification. Sign in with the NEW address next time. |
| `POST /api/auth/delete-account` | `{ password }` → 200. ONE cascade write removes every owned row (products, categories, registers, cashiers, shifts, sales, settings, tokens); the session cookie is cleared with the account. No undo — there is no export surface; back up the SQLite file first (§4). |
| `POST /api/auth/resend-verification` | `{ email }` → uniform 200 for every caller; the 6-digit code rides the body only for an existing UNVERIFIED account (the no-SMTP self-hosted delivery). |

```bash
# Rotate the owner password on a live deploy:
curl -X POST https://your-host/api/auth/change-password \
  -H 'Content-Type: application/json' -b 'sf_session=…' \
  -d '{"currentPassword":"…","newPassword":"…"}'
```

## 11. Screenshots (optional, local evidence)

`scripts/capture-screenshots-prod.sh` regenerates the app's own evidence
set from the production build into `docs/screenshots/` — useful after
visual changes, not required for deploys.
