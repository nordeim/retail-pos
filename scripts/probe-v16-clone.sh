#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# probe-v16-clone.sh — the V16 live-clone probe. Boots the production
# standalone build on :3101 against db/custom.db and captures the clone-side
# login-surface hover inventory + computed states (the V15-closing
# suggestion: the login social-button hovers), plus the mobile drawer
# animation timing at 390px (session_22's carry-over). Script-scoped server
# (the environment reaps background processes between tool calls).
# ---------------------------------------------------------------------------
set -euo pipefail
cd /home/z/my-project/retail-pos

BASE="http://127.0.0.1:3101"

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

echo "=== 1. LOGIN SURFACE — hover class inventory (clone) ==="
agent-browser open "$BASE/login" >/dev/null 2>&1
agent-browser set viewport 1280 800 >/dev/null 2>&1
agent-browser eval "JSON.stringify(Array.from(document.querySelectorAll('a,button')).filter(el => String(el.className).includes('hover')).map(el => ({t: (el.textContent||'').trim().slice(0,30), c: String(el.className).replace(/\s+/g,' ').slice(0,230)})))" 2>&1 | head -12

echo ""
echo "=== 2. LOGIN — Sign in button full class (clone) ==="
agent-browser eval "var b=Array.from(document.querySelectorAll('button')).find(x=>x.textContent.trim()==='Iniciar sesión'); b?JSON.stringify(String(b.className).replace(/\s+/g,' ')):'NOT FOUND'" 2>&1 | head -6

echo ""
echo "=== 3. SOCIAL BUTTON geometry (clone) ==="
agent-browser eval "var b=Array.from(document.querySelectorAll('button')).find(x=>x.textContent.includes('Google')); var r=b.getBoundingClientRect(); var c=getComputedStyle(b); JSON.stringify({h: r.height, fontSize: c.fontSize})" 2>&1 | head -6

echo ""
echo "=== 4. MOBILE DRAWER — animation timing at 390px (clone) ==="
agent-browser set viewport 390 844 >/dev/null 2>&1 || true
# Login (fault-tolerant; the drawer lives on app views)
agent-browser open "$BASE/login" >/dev/null 2>&1 || true
sleep 1
agent-browser fill 'input[type=email]' 'owner@veloxpos.local' >/dev/null 2>&1 || true
agent-browser fill 'input[type=password]' '$Abcd1234' >/dev/null 2>&1 || true
agent-browser eval "var b=Array.from(document.querySelectorAll('button')).find(x=>x.textContent.trim()==='Sign in'); if(b){b.click(); 'clicked'}else{'NO SIGN IN BTN'}" 2>&1 | head -3
sleep 3
agent-browser eval "JSON.stringify({title: document.title, path: location.pathname, hamburger: !!document.querySelector('[data-testid=mobile-menu-button]')})" 2>&1 | head -4
# Open the drawer via the data-testid, read the panel's animation state
agent-browser eval "var h=document.querySelector('[data-testid=mobile-menu-button]'); if(h){h.click(); 'opened'}else{'NO HAMBURGER'}" 2>&1 | head -3
# FIRST eval after the click still sees the animation/panel — read everything at once
agent-browser eval "var p=document.querySelector('[data-testid=mobile-drawer-panel]'); if(!p){'NO PANEL'}else{var c=getComputedStyle(p); JSON.stringify({w: p.getBoundingClientRect().width, animName: c.animationName, animDur: c.animationDuration, animFill: c.animationFillMode, overlay: !!document.querySelector('[data-testid=mobile-drawer-overlay]'), expanded: document.querySelector('[data-testid=mobile-menu-button]').getAttribute('aria-expanded')})}" 2>&1 | head -6

echo ""
echo "=== 5. DRAWER link geometry (clone) ==="
agent-browser eval "var links=Array.from(document.querySelectorAll('[data-testid=mobile-drawer-panel] nav a')).slice(0,9); JSON.stringify(links.map(l=>{var r=l.getBoundingClientRect(); return {t:(l.textContent||'').trim().slice(0,18), h:Math.round(r.height)}}))" 2>&1 | head -8

echo ""
echo "=== 6. MOBILE — horizontal overflow check (clone) ==="
agent-browser eval "JSON.stringify({scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth})" 2>&1 | head -4

echo ""
echo "=== 7. SIGN IN button full class (clone, slice 200-450) ==="
agent-browser open "$BASE/login" >/dev/null 2>&1 || true
agent-browser eval "var b=Array.from(document.querySelectorAll('button')).find(x=>x.textContent.trim()==='Sign in'); b?String(b.className).replace(/\s+/g,' ').slice(120,400):'NOT FOUND'" 2>&1 | head -6

echo "done"
