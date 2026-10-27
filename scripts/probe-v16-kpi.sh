#!/usr/bin/env bash
# probe-v16-kpi.sh — clone-side KPI computed styles for the pixel-diff follow-up.
set -uo pipefail
cd /home/z/my-project/retail-pos
BASE="http://127.0.0.1:3101"

PORT=3101 NODE_ENV=production \
DATABASE_URL="file:../db/v16_probe.db" \
AUTH_SECRET="5f3a9c1e7b2d4f6a8c0e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f" \
bun .next/standalone/server.js > /tmp/probe-server.log 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

for i in $(seq 1 40); do
  curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health" --max-time 2 | grep -q 200 && break
  sleep 1
done

agent-browser open "$BASE/login" >/dev/null 2>&1
agent-browser fill 'input[type=email]' 'owner@veloxpos.local' >/dev/null 2>&1
agent-browser fill 'input[type=password]' '$Abcd1234' >/dev/null 2>&1
agent-browser eval "var b=Array.from(document.querySelectorAll('button')).find(x=>x.textContent.trim()==='Sign in'); b?b.click():0" >/dev/null 2>&1
sleep 3
agent-browser open "$BASE/Dashboard" >/dev/null 2>&1
sleep 2
echo "=== CLONE KPI values ==="
agent-browser eval "var vals=Array.from(document.querySelectorAll('p,span,h2,h3,div')).filter(e=>['\$0.00','0','12','1'].includes(e.textContent.trim())&&e.children.length===0).slice(0,4); var v=vals[0]; var card=v?v.closest('[class*=rounded]'):null; var cc(card)": 2>/dev/null || true
agent-browser eval "var vals=Array.from(document.querySelectorAll('p,span,h2,h3,div')).filter(e=>['\$0.00','0','12','1'].includes(e.textContent.trim())&&e.children.length===0).slice(0,4); var v=vals[0]; var card=v?v.closest('[class*=rounded]'):null; var cc=card?getComputedStyle(card):null; JSON.stringify({vals: vals.map(x=>({t:x.textContent.trim(),fw:getComputedStyle(x).fontWeight,fs:getComputedStyle(x).fontSize})), ff: getComputedStyle(document.body).fontFamily.slice(0,60), cardBg: cc?cc.backgroundColor:'', cardBorder: cc?cc.borderColor:''})" 2>&1 | head -5

echo "=== CLONE KPI grid gap ==="
agent-browser eval "var grid=Array.from(document.querySelectorAll('div[class*=grid]')).find(g=>g.querySelectorAll('*').length>20&&g.className.includes('gap')); JSON.stringify({gap: grid?getComputedStyle(grid).gap:'', cols: grid?getComputedStyle(grid).gridTemplateColumns.slice(0,60):''})" 2>&1 | head -4

echo "=== CLONE chip order (inventory) ==="
agent-browser open "$BASE/Inventory" >/dev/null 2>&1
sleep 2
agent-browser eval "var chips=Array.from(document.querySelectorAll('button')).filter(b=>b.textContent.trim().length>2&&b.textContent.trim().length<20&&!b.querySelector('svg')&&!b.className.includes('glass')).map(b=>b.textContent.trim()); JSON.stringify(chips.slice(0,10))" 2>&1 | head -4

echo "=== CLONE ajustes cat order ==="
agent-browser open "$BASE/StoreSettings" >/dev/null 2>&1
sleep 2
agent-browser eval "var all=Array.from(document.querySelectorAll('span,div,p')).map(e=>e.textContent.trim()).filter(t=>['Snacks','Lácteos','Limpieza','Higiene Personal','Alimentos','Bebidas'].includes(t)); JSON.stringify({found: all})" 2>&1 | head -4

echo "=== CLONE donut legend order ==="
agent-browser open "$BASE/Dashboard" >/dev/null 2>&1
sleep 2
agent-browser eval "var rows=Array.from(document.querySelectorAll('div.flex.items-center.gap-2')).map(e=>e.textContent.trim()).filter(t=>t.length>2&&t.length<30); JSON.stringify({legend: rows.slice(0,6)})" 2>&1 | head -4

echo done
