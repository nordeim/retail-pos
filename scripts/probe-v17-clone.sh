#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# probe-v17-clone.sh — the V17 live-clone probe. Boots the production
# standalone build on :3101 against db/custom.db and runs the mobile-390
# audit (the task's emphasis): the drawer's open/close lifecycle, geometry,
# animation timing, scroll lock, focus contract, inside-panel scroll
# behavior at short viewports, and the app's 390px page overflow posture
# across every route. Playwright drives the probe (hover-free geometry
# reads; agent-browser stays on the reference session).
# ---------------------------------------------------------------------------
set -euo pipefail
cd /home/z/my-project/retail-pos

BASE="http://127.0.0.1:3101"

PORT=3101 NODE_ENV=production \
DATABASE_URL="file:../db/custom.db" \
AUTH_SECRET="5f3a9c1e7b2d4f6a8c0e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f" \
bun .next/standalone/server.js > /tmp/probe-server-v17.log 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

for i in $(seq 1 40); do
  if curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health" --max-time 2 | grep -q 200; then
    echo "server up"
    break
  fi
  sleep 1
done

bun scripts/probe-v17.ts
