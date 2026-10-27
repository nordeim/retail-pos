#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# capture-v14-shots.sh — the v14 evidence set from the PRODUCTION standalone
# build: the remediated dialog family (512px max-w-lg + the slide quartet +
# the fading overlay), the mobile full-bleed 16px-radius skin, and the violet
# keyboard focus on a nav link (the platform outline). Boots
# .next/standalone/server.js on :3100 against db/custom.db, logs in with the
# seeded owner, captures 3 shots, then kills the server.
# ---------------------------------------------------------------------------
set -euo pipefail
cd /home/z/my-project/retail-pos

OUT="docs/screenshots"
BASE="http://localhost:3100"
EMAIL="${SEED_OWNER_EMAIL:-owner@veloxpos.local}"

mkdir -p "$OUT"

# --- boot the production standalone server ------------------------------------
PORT=3100 NODE_ENV=production \
DATABASE_URL="file:../db/custom.db" \
AUTH_SECRET="5f3a9c1e7b2d4f6a8c0e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f" \
bun .next/standalone/server.js > /tmp/prod-server.log 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

for i in $(seq 1 40); do
  if curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health" --max-time 2 | grep -q 200; then
    echo "server up"
    break
  fi
  sleep 1
done

shot() { agent-browser screenshot "$(pwd)/$OUT/$1.png" > /dev/null; }

# --- log in ---------------------------------------------------------------------
agent-browser set viewport 1280 800 > /dev/null
agent-browser open "$BASE/login" > /dev/null
sleep 4
EMAIL_REF=$(agent-browser snapshot -i | grep 'textbox "Email"' | grep -o 'ref=e[0-9]*' | cut -d= -f2)
PASS_REF=$(agent-browser snapshot -i | grep 'textbox "Password"' | grep -o 'ref=e[0-9]*' | cut -d= -f2)
agent-browser fill "$EMAIL_REF" "$EMAIL" > /dev/null
agent-browser fill "$PASS_REF" '$Abcd1234' > /dev/null
SIGNIN_REF=$(agent-browser snapshot -i | grep 'button "Sign in"' | grep -o 'ref=e[0-9]*' | cut -d= -f2)
agent-browser click "$SIGNIN_REF" > /dev/null
sleep 6

# --- shot 1: the desktop dialog (512px max-w-lg, the full motion family) --------
agent-browser open "$BASE/Registers" > /dev/null
sleep 3
ABRIR_REF=$(agent-browser snapshot -i | grep 'button "Abrir Turno"' | grep -o 'ref=e[0-9]*' | cut -d= -f2 | head -1)
agent-browser click "$ABRIR_REF" > /dev/null
sleep 0.6  # the 150ms enter run settles
shot desktop-dialog-abrir-turno
agent-browser press Escape > /dev/null
sleep 0.5

# --- shot 2: the mobile dialog (full-bleed 390px, rounded-2xl 16px) -------------
agent-browser set viewport 390 844 > /dev/null
sleep 0.5
ABRIR_REF=$(agent-browser snapshot -i | grep 'button "Abrir Turno"' | grep -o 'ref=e[0-9]*' | cut -d= -f2 | head -1)
agent-browser click "$ABRIR_REF" > /dev/null
sleep 0.6
shot mobile-dialog-abrir-turno
agent-browser press Escape > /dev/null
sleep 0.5

# --- shot 3: the violet keyboard focus on a nav link -----------------------------
agent-browser set viewport 1280 800 > /dev/null
agent-browser open "$BASE/Registers" > /dev/null
sleep 3
for i in $(seq 1 8); do
  agent-browser press Tab > /dev/null
  sleep 0.15
  ONNAV=$(agent-browser eval "!!document.activeElement && !!document.activeElement.closest('aside nav a')" 2>/dev/null || echo false)
  if echo "$ONNAV" | grep -qi "true"; then
    break
  fi
done
sleep 0.4  # transition-all settles the outline color
shot desktop-focus-nav-violet

echo "v14 shots captured"
