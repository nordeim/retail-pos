#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# lighthouse-v17.sh — the V17 Core Web Vitals pass (session_25's top
# suggestion). Boots the production standalone build on :3101 against
# db/custom.db and runs Lighthouse 13 on:
#   1. /login (the public auth surface — cold, no cookie)
#   2. /Dashboard (the authed landing view — via a pre-logged-in chromium
#      driven over the CDP port; Lighthouse attaches with --port)
# Reports land in docs/lighthouse/v17-*.json (+ .html). The stale study-app
# reports (localhost:3200, 2026-10-18) are superseded by this set.
# ---------------------------------------------------------------------------
set -euo pipefail
cd /home/z/my-project/retail-pos

BASE="http://127.0.0.1:3101"
CDP=9222
OUT="docs/lighthouse"

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

# --- 1. The public login surface (no cookie needed) -----------------------
echo "=== lighthouse: /login ==="
bunx lighthouse "$BASE/login" \
  --output=json --output-path="$OUT/v17-login.json" \
  --form-factor=desktop --screenEmulation.disabled \
  --chrome-flags="--headless=new --no-sandbox" \
  --only-categories=performance,accessibility,best-practices,seo \
  --quiet 2>&1 | tail -2 || echo "(login run logged errors above)"

# --- 2. The authed Dashboard via a logged-in chromium on the CDP port ------
cat > scripts/lh-authed-browser.ts <<'EOF'
import { chromium } from "@playwright/test";

// Boots a chromium with a CDP port open, logs into the clone, then idles
// (keeps the process alive) so `lighthouse --port <CDP>` can attach and
// audit the authed surface with the session cookie in place.
const BASE = process.env.BASE ?? "http://127.0.0.1:3101";
const CDP = Number(process.env.CDP ?? 9222);

async function main() {
  const browser = await chromium.launch({
    args: [`--remote-debugging-port=${CDP}`, "--no-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${BASE}/login`);
  await page.locator('input[type="email"]').fill("owner@veloxpos.local");
  await page.locator('input[type="password"]').fill("$Abcd1234");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
  console.log("AUTHED_BROWSER_READY");
  // Idle so Lighthouse can attach; the runner kills us when done.
  await new Promise(() => {});
}

main().catch((e) => {
  console.error("AUTHED_BROWSER_FAILED:", e);
  process.exit(1);
});
EOF

BASE="$BASE" CDP="$CDP" bun scripts/lh-authed-browser.ts > /tmp/lh-authed.log 2>&1 &
BROWSER_PID=$!

for i in $(seq 1 30); do
  if grep -q "AUTHED_BROWSER_READY" /tmp/lh-authed.log 2>/dev/null; then
    echo "authed browser ready (cdp :$CDP)"
    break
  fi
  sleep 1
done

kill -0 $BROWSER_PID 2>/dev/null || { echo "authed browser died:"; cat /tmp/lh-authed.log; exit 1; }

echo "=== lighthouse: /Dashboard (authed, via CDP $CDP) ==="
bunx lighthouse "$BASE/Dashboard" \
  --port="$CDP" \
  --output=json --output-path="$OUT/v17-dashboard.json" \
  --form-factor=desktop --screenEmulation.disabled \
  --only-categories=performance,accessibility,best-practices,seo \
  --quiet 2>&1 | tail -2 || echo "(dashboard run logged errors above)"

kill $BROWSER_PID 2>/dev/null || true
rm -f scripts/lh-authed-browser.ts

# --- 3. Summaries -----------------------------------------------------------
python3 - <<'EOF'
import json, pathlib
for name in ["v17-login", "v17-dashboard"]:
    p = pathlib.Path(f"docs/lighthouse/{name}.json")
    if not p.exists():
        print(f"{name}: MISSING")
        continue
    d = json.loads(p.read_text())
    cats = d.get("categories", {})
    scores = {c: round((v.get("score") or 0) * 100) for c, v in cats.items()}
    a = d.get("audits", {})
    def metric(k):
        x = a.get(k, {})
        return x.get("displayValue") or f"{x.get('numericValue', 'n/a')}"
    print(f"{name}: scores={scores}")
    print(f"  FCP={metric('first-contentful-paint')} LCP={metric('largest-contentful-paint')} "
          f"TBT={metric('total-blocking-time')} CLS={metric('cumulative-layout-shift')} "
          f"SI={metric('speed-index')}")
EOF
