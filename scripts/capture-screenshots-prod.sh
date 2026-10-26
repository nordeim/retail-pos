#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# capture-screenshots-prod.sh — the v9 evidence set from the PRODUCTION
# standalone build (no Next.js dev-tools badge — the v9/F9 fix). Boots
# .next/standalone/server.js on :3100 against db/custom.db, logs in with
# the seeded owner, captures the full 18-shot set, then kills the server.
# ---------------------------------------------------------------------------
set -euo pipefail
cd /home/z/my-project/retail-pos

OUT="docs/screenshots"
BASE="http://localhost:3100"
EMAIL="${SEED_OWNER_EMAIL:-owner@veloxpos.local}"
PASSWORD='${SEED_OWNER_PASSWORD:-\$Abcd1234}'

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

# --- logged-out: the light auth card -------------------------------------------
agent-browser set viewport 1280 800 > /dev/null
agent-browser open "$BASE/login" > /dev/null
sleep 4
shot desktop-login

# --- log in ----------------------------------------------------------------------
EMAIL_REF=$(agent-browser snapshot -i | grep 'textbox "Email"' | grep -o 'ref=e[0-9]*' | cut -d= -f2)
PASS_REF=$(agent-browser snapshot -i | grep 'textbox "Password"' | grep -o 'ref=e[0-9]*' | cut -d= -f2)
agent-browser fill "$EMAIL_REF" "$EMAIL" > /dev/null
agent-browser fill "$PASS_REF" '$Abcd1234' > /dev/null
SIGNIN_REF=$(agent-browser snapshot -i | grep 'button "Sign in"' | grep -o 'ref=e[0-9]*' | cut -d= -f2)
agent-browser click "$SIGNIN_REF" > /dev/null
sleep 6

# --- the 8 views -------------------------------------------------------------------
agent-browser open "$BASE/" > /dev/null; sleep 3; shot desktop-terminal-empty
agent-browser open "$BASE/Dashboard" > /dev/null; sleep 3; shot desktop-dashboard
agent-browser open "$BASE/Inventario" > /dev/null; sleep 3; shot desktop-inventario
agent-browser open "$BASE/Sales" > /dev/null; sleep 3; shot desktop-ventas
agent-browser open "$BASE/Registers" > /dev/null; sleep 3; shot desktop-cajas
agent-browser open "$BASE/Cashiers" > /dev/null; sleep 3; shot desktop-cajeros
agent-browser open "$BASE/Reports" > /dev/null; sleep 3; shot desktop-reportes
agent-browser open "$BASE/StoreSettings" > /dev/null; sleep 3; shot desktop-ajustes

# --- the 404 ------------------------------------------------------------------------
agent-browser open "$BASE/NonExistent" > /dev/null; sleep 3; shot desktop-404

# --- open a shift on Caja 1, build a ticket (superset evidence) ---------------------
agent-browser open "$BASE/Registers" > /dev/null; sleep 3
OPEN_REF=$(agent-browser snapshot -i | grep 'button "Abrir Turno"' | head -1 | grep -o 'ref=e[0-9]*' | cut -d= -f2)
agent-browser click "$OPEN_REF" > /dev/null; sleep 2
CAJ_REF=$(agent-browser snapshot -i | grep 'combobox' | head -1 | grep -o 'ref=e[0-9]*' | cut -d= -f2)
agent-browser click "$CAJ_REF" > /dev/null; sleep 1
agent-browser press ArrowDown > /dev/null 2>&1 || true
agent-browser press Enter > /dev/null 2>&1 || true
sleep 1
GO_REF=$(agent-browser snapshot -i | grep 'button "Iniciar Turno"' | grep -o 'ref=e[0-9]*' | cut -d= -f2)
agent-browser click "$GO_REF" > /dev/null; sleep 3

# terminal-live: the terminal with an open shift
agent-browser open "$BASE/" > /dev/null; sleep 3; shot desktop-terminal-live

# add Coca-Cola x2 → the ticket panel
agent-browser snapshot -i | grep -m1 'Coca-Cola 600ml' | grep -o 'ref=e[0-9]*' | cut -d= -f2 | xargs -I{} agent-browser click {} > /dev/null
sleep 1
agent-browser snapshot -i | grep -m1 'Coca-Cola 600ml' | grep -o 'ref=e[0-9]*' | cut -d= -f2 | xargs -I{} agent-browser click {} > /dev/null
sleep 1
shot desktop-terminal-ticket

# the cobrar dialog
COBRAR_REF=$(agent-browser snapshot -i | grep 'COBRAR' | grep -o 'ref=e[0-9]*' | cut -d= -f2 | head -1)
agent-browser click "$COBRAR_REF" > /dev/null; sleep 2
shot desktop-cobrar-dialog
agent-browser press Escape > /dev/null; sleep 1

# --- mobile (390x844): drawer, terminal, dashboard, ventas, cobrar ------------------
agent-browser set viewport 390 844 > /dev/null
agent-browser open "$BASE/" > /dev/null; sleep 3; shot mobile-terminal
MENU_REF=$(agent-browser snapshot -i | grep 'button "Open menu"' | grep -o 'ref=e[0-9]*' | cut -d= -f2 || true)
if [ -z "$MENU_REF" ]; then
  MENU_REF=$(agent-browser snapshot -i | grep -iE 'button .*menu|menú' | grep -o 'ref=e[0-9]*' | cut -d= -f2 | head -1)
fi
agent-browser click "$MENU_REF" > /dev/null; sleep 1.5
shot mobile-drawer-open
agent-browser press Escape > /dev/null; sleep 1
agent-browser open "$BASE/Dashboard" > /dev/null; sleep 3; shot mobile-dashboard
agent-browser open "$BASE/Sales" > /dev/null; sleep 3; shot mobile-ventas
agent-browser open "$BASE/" > /dev/null; sleep 3
COBRAR2_REF=$(agent-browser snapshot -i | grep 'COBRAR' | grep -o 'ref=e[0-9]*' | cut -d= -f2 | head -1)
agent-browser click "$COBRAR2_REF" > /dev/null; sleep 2
shot mobile-cobrar

echo "screenshots → $OUT (production build, no dev badge)"
