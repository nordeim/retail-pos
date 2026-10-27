#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# probe-v15-clone.sh — the V15 live-clone probe. Boots the production
# standalone build on :3101 against db/custom.db (the seeded canonical DB),
# logs in with the seeded owner, and captures the clone-side measurements
# the V15 audit needs (hover inventories per view + the Subir logo label's
# computed color). Tears the server down on exit.
# ---------------------------------------------------------------------------
set -euo pipefail
cd /home/z/my-project/retail-pos

BASE="http://127.0.0.1:3101"
EMAIL="${SEED_OWNER_EMAIL:-owner@veloxpos.local}"

PORT=3101 NODE_ENV=production \
DATABASE_URL="file:../db/custom.db" \
AUTH_SECRET="5f3a9c1e7b2d4f6a8c0e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f" \
bun .next/standalone/server.js > /tmp/probe-server.log 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

for i in $(seq 1 40); do
  if curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health" --max-time 2 | grep -q 200; then
    echo "server up"
    break
  fi
  sleep 1
done

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
sleep 4

navto() {
  agent-browser eval "(() => { const a = [...document.querySelectorAll('a')].find(x => x.textContent.trim() === '$1'); a.click(); return 'nav'; })()" > /dev/null
  sleep 2
}

echo "=== AJUSTES: Subir logo label computed ==="
navto "Ajustes"
agent-browser eval "(() => { const l = document.querySelector('label[data-testid=settings-logo-button]'); const cs = getComputedStyle(l); return JSON.stringify({cls: l.className.toString(), color: cs.color, bg: cs.backgroundColor}); })()"

echo "=== AJUSTES: hover inventory ==="
agent-browser eval "JSON.stringify([...new Set([...document.querySelectorAll('main [class*=hover\\\\:]')].map(e => e.tagName + '|' + e.className.toString().replace(/ +/g,' ').trim()))].slice(0,25))"

echo "=== AJUSTES: category chip X button ==="
agent-browser eval "(() => { const b = document.querySelector('[data-testid=settings-category-chips] button'); if (!b) return 'no chip button'; return JSON.stringify({cls: b.className.toString(), svg: b.querySelector('svg')?.getAttribute('class'), size: (r => Math.round(r.width)+'x'+Math.round(r.height))(b.getBoundingClientRect())}); })()"

echo "=== INVENTARIO: hover inventory ==="
navto "Inventario"
agent-browser eval "JSON.stringify([...new Set([...document.querySelectorAll('main [class*=hover\\\\:]')].map(e => e.tagName + '|' + e.className.toString().replace(/ +/g,' ').trim()))].slice(0,25))"

echo "=== VENTAS: row action buttons ==="
navto "Ventas"
agent-browser eval "JSON.stringify([...document.querySelectorAll('tbody tr')].slice(0,1).map(tr => [...tr.querySelectorAll('button')].map(b => ({aria: b.getAttribute('aria-label'), cls: b.className.toString().replace(/ +/g,' ')}))))"

echo "=== VENTAS: hover inventory ==="
agent-browser eval "JSON.stringify([...new Set([...document.querySelectorAll('main [class*=hover\\\\:]')].map(e => e.tagName + '|' + e.className.toString().replace(/ +/g,' ').trim()))].slice(0,25))"

echo "=== CAJAS: hover inventory ==="
navto "Cajas"
agent-browser eval "JSON.stringify([...new Set([...document.querySelectorAll('main [class*=hover\\\\:]')].map(e => e.tagName + '|' + e.className.toString().replace(/ +/g,' ').trim()))].slice(0,25))"

echo "=== REPORTES: hover inventory ==="
navto "Reportes"
agent-browser eval "JSON.stringify([...new Set([...document.querySelectorAll('main [class*=hover\\\\:]')].map(e => e.tagName + '|' + e.className.toString().replace(/ +/g,' ').trim()))].slice(0,25))"

echo "=== TERMINAL: hover inventory (empty/shift-gated) ==="
navto "Terminal"
agent-browser eval "JSON.stringify([...new Set([...document.querySelectorAll('main [class*=hover\\\\:]')].map(e => e.tagName + '|' + e.className.toString().replace(/ +/g,' ').trim()))].slice(0,25))"

echo "=== DASHBOARD: hover inventory ==="
navto "Dashboard"
agent-browser eval "JSON.stringify([...new Set([...document.querySelectorAll('main [class*=hover\\\\:]')].map(e => e.tagName + '|' + e.className.toString().replace(/ +/g,' ').trim()))].slice(0,25))"

echo "done"
