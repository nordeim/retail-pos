#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# capture-screenshots.sh — the dev-server evidence set for docs/screenshots/.
# Requires: the dev server on :3000 (bun run dev) and agent-browser on PATH.
# The session must be logged OUT first (the script logs in with the seeded
# owner from the environment; the password is read from SEED_OWNER_PASSWORD
# so no credential lands in this file).
# ---------------------------------------------------------------------------
set -euo pipefail

OUT="${1:-docs/screenshots}"
BASE="${2:-http://localhost:3000}"
EMAIL="${SEED_OWNER_EMAIL:-sepnetflix2023@outlook.com}"
PASSWORD="${SEED_OWNER_PASSWORD:-\$Abcd1234}"

mkdir -p "$OUT"

shot() { agent-browser screenshot "$(pwd)/$OUT/$1.png" > /dev/null; }

# --- logged-out: the light auth card -----------------------------------------
agent-browser set viewport 1280 800 > /dev/null
agent-browser open "$BASE/login" > /dev/null
sleep 4
shot desktop-login

# --- log in -------------------------------------------------------------------
agent-browser fill '@e-email' "$EMAIL" 2>/dev/null || true
EMAIL_REF=$(agent-browser snapshot -i | grep 'textbox "Email"' | grep -o 'ref=e[0-9]*' | cut -d= -f2)
PASS_REF=$(agent-browser snapshot -i | grep 'textbox "Password"' | grep -o 'ref=e[0-9]*' | cut -d= -f2)
agent-browser fill "$EMAIL_REF" "$EMAIL" > /dev/null
agent-browser fill "$PASS_REF" "$PASSWORD" > /dev/null
SIGNIN_REF=$(agent-browser snapshot -i | grep 'button "Sign in"' | grep -o 'ref=e[0-9]*' | cut -d= -f2)
agent-browser click "$SIGNIN_REF" > /dev/null
sleep 6

# --- the 8 views ---------------------------------------------------------------
agent-browser open "$BASE/" > /dev/null; sleep 3; shot desktop-terminal-empty
agent-browser open "$BASE/Dashboard" > /dev/null; sleep 3; shot desktop-dashboard
agent-browser open "$BASE/Inventario" > /dev/null; sleep 3; shot desktop-inventario
agent-browser open "$BASE/Sales" > /dev/null; sleep 3; shot desktop-ventas
agent-browser open "$BASE/Registers" > /dev/null; sleep 3; shot desktop-cajas
agent-browser open "$BASE/Cashiers" > /dev/null; sleep 3; shot desktop-cajeros
agent-browser open "$BASE/Reports" > /dev/null; sleep 3; shot desktop-reportes
agent-browser open "$BASE/StoreSettings" > /dev/null; sleep 3; shot desktop-ajustes

# --- the 404 -------------------------------------------------------------------
agent-browser open "$BASE/NonExistent" > /dev/null; sleep 3; shot desktop-404

# --- the live sale (superset evidence): open a shift, build a ticket -----------
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
agent-browser open "$BASE/" > /dev/null; sleep 3
agent-browser snapshot -i | grep -m1 'Coca-Cola 600ml' | grep -o 'ref=e[0-9]*' | cut -d= -f2 | xargs -I{} agent-browser click {} > /dev/null
agent-browser snapshot -i | grep -m1 'Coca-Cola 600ml' | grep -o 'ref=e[0-9]*' | cut -d= -f2 | xargs -I{} agent-browser click {} > /dev/null
sleep 1
shot desktop-terminal-ticket

echo "screenshots → $OUT"
