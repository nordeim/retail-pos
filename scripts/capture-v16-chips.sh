#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# capture-v16-chips.sh — the V16/F2 evidence: the Inventario category chips
# rendering the reference's measured sequence (Todos, Snacks, Lácteos,
# Higiene Personal, Limpieza, Alimentos, Bebidas).
# ---------------------------------------------------------------------------
set -euo pipefail
cd /home/z/my-project/retail-pos
BASE="http://127.0.0.1:3102"

PORT=3102 NODE_ENV=production \
DATABASE_URL="file:../db/custom.db" \
AUTH_SECRET="5f3a9c1e7b2d4f6a8c0e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f" \
bun .next/standalone/server.js > /tmp/v16-chips-server.log 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

for i in $(seq 1 40); do
  curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health" --max-time 2 | grep -q 200 && break
  sleep 1
done

agent-browser set viewport 1280 800 >/dev/null
agent-browser open "$BASE/login" >/dev/null
sleep 2
agent-browser fill 'input[type=email]' 'owner@veloxpos.local' >/dev/null
agent-browser fill 'input[type=password]' '$Abcd1234' >/dev/null
agent-browser eval "var b=Array.from(document.querySelectorAll('button')).find(x=>x.textContent.trim()==='Sign in'); b?b.click():0" >/dev/null
sleep 3
agent-browser open "$BASE/Inventory" >/dev/null
sleep 2
# Verify the chip order BEFORE the shot (self-verifying capture).
agent-browser eval "var names=['Todos','Snacks','Lácteos','Higiene Personal','Limpieza','Alimentos','Bebidas']; var out=[]; Array.from(document.querySelectorAll('button')).forEach(b=>{var t=b.textContent.trim(); if(names.includes(t)) out.push(t)}); JSON.stringify(out)" 2>&1 | tr -d '"\r'
agent-browser screenshot "$(pwd)/docs/screenshots/desktop-inventory-chips.png" >/dev/null
echo "shot saved: docs/screenshots/desktop-inventory-chips.png"
