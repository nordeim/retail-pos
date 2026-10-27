#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# capture-v15-shots.sh — boots the production standalone build on :3100
# against db/custom.db and runs the Playwright capture (the v13 hover-evidence
# pattern: agent-browser resets hover state between commands, Playwright's
# page.mouse does not — see capture-v15-shots.ts).
# ---------------------------------------------------------------------------
set -euo pipefail
cd /home/z/my-project/retail-pos

PORT=3100 NODE_ENV=production \
DATABASE_URL="file:../db/custom.db" \
AUTH_SECRET="5f3a9c1e7b2d4f6a8c0e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f" \
bun .next/standalone/server.js > /tmp/prod-server.log 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

for i in $(seq 1 40); do
  if curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3100/api/health" --max-time 2 | grep -q 200; then
    echo "server up"
    break
  fi
  sleep 1
done

CAPTURE_BASE_URL="http://127.0.0.1:3100" bun scripts/capture-v15-shots.ts
