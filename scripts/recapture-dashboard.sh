#!/usr/bin/env bash
# Re-capture just the dashboard shot from the fresh production build (v9/F10).
set -euo pipefail
cd /home/z/my-project/retail-pos
BASE="http://localhost:3100"

PORT=3100 NODE_ENV=production \
DATABASE_URL="file:../db/custom.db" \
AUTH_SECRET="5f3a9c1e7b2d4f6a8c0e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f" \
bun .next/standalone/server.js > /tmp/prod-server2.log 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

for i in $(seq 1 40); do
  curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health" --max-time 2 | grep -q 200 && break
  sleep 1
done

agent-browser set viewport 1280 800 > /dev/null
agent-browser open "$BASE/login" > /dev/null
sleep 4
EMAIL_REF=$(agent-browser snapshot -i | grep 'textbox "Email"' | grep -o 'ref=e[0-9]*' | cut -d= -f2)
PASS_REF=$(agent-browser snapshot -i | grep 'textbox "Password"' | grep -o 'ref=e[0-9]*' | cut -d= -f2)
agent-browser fill "$EMAIL_REF" "owner@veloxpos.local" > /dev/null
agent-browser fill "$PASS_REF" '$Abcd1234' > /dev/null
SIGNIN_REF=$(agent-browser snapshot -i | grep 'button "Sign in"' | grep -o 'ref=e[0-9]*' | cut -d= -f2)
agent-browser click "$SIGNIN_REF" > /dev/null
sleep 6
agent-browser open "$BASE/Dashboard" > /dev/null
sleep 3
agent-browser screenshot "$(pwd)/docs/screenshots/desktop-dashboard.png" > /dev/null
echo "dashboard re-captured (no footer, no dev badge)"
