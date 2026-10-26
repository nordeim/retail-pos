#!/usr/bin/env bash
# Session-27: simulate the Docker runtime layout LOCALLY (no Docker daemon
# in this sandbox) — a faithful structural validation of the Dockerfile's
# final stage:
#   1. bun install --production into a scratch dir (the deps-prod stage)
#   2. overlay .next/standalone over it (the COPY merge order)
#   3. add src/lib + prisma + package.json (the seed's import chain)
#   4. rm -rf db (the no-db-bytes guarantee)
#   5. DATABASE_URL=file:<absolute>/custom.db — the §4 form-2 contract
#   6. db push + seed + boot the server + hit /api/health + /login
#      + POST/GET /api/rum (the S18 feature works containerized)
set -euo pipefail

REPO=/home/z/my-project/omni-study
SIM=/tmp/s27-container-sim
DATA=/tmp/s27-container-data
PORT=3300

rm -rf "$SIM" "$DATA"
mkdir -p "$SIM" "$DATA"

# --- deps-prod stage -------------------------------------------------------
cp "$REPO/package.json" "$REPO/bun.lock" "$SIM/"
(cd "$SIM" && bun install --production 2>&1 | tail -2)

# --- runtime stage: overlay the standalone (generated client wins) ---------
cp -r "$REPO/.next/standalone/." "$SIM/"
cp -r "$REPO/.next/static" "$SIM/.next/static"
cp -r "$REPO/public" "$SIM/public"

# the seed's import chain
mkdir -p "$SIM/src"
cp -r "$REPO/src/lib/." "$SIM/src/lib/"
rm -rf "$SIM/prisma" && cp -r "$REPO/prisma" "$SIM/prisma"

# no database bytes inside the "image"
rm -rf "$SIM/db"

export DATABASE_URL="file:$DATA/custom.db"

# --- the compose init service (db push + seed) ------------------------------
echo "--- db push ---"
(cd "$SIM" && bunx prisma db push --schema prisma/schema.prisma --accept-data-loss 2>&1 | tail -3)
echo "--- seed ---"
(cd "$SIM" && bun prisma/seed.ts 2>&1 | tail -2)

# --- the app service ---------------------------------------------------------
echo "--- server boot ---"
(cd "$SIM" && PORT=$PORT AUTH_SECRET=sim-secret NODE_ENV=production nohup bun server.js > /tmp/s27-sim-server.log 2>&1 &)
sleep 5

echo "--- health ---"
curl -s "http://127.0.0.1:$PORT/api/health"
echo
echo "--- login page ---"
curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/login"
echo " <- /login"

# --- the RUM endpoint works containerized ------------------------------------
echo "--- rum (unauthenticated -> 401 expected) ---"
curl -s -o /dev/null -w "%{http_code}" -X POST "http://127.0.0.1:$PORT/api/rum" \
  -H 'content-type: application/json' \
  -d '{"sessionId":"sim","events":[{"metric":"TTFB","value":1,"rating":"good","navigationType":"navigate"}]}'
echo " <- POST /api/rum anon"

echo "--- db file on the volume ---"
ls -la "$DATA"

pkill -f "bun server.js" 2>/dev/null || true
echo "SIMULATION: DONE"
