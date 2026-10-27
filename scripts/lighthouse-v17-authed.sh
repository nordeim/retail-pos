#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# lighthouse-v17-authed.sh — the CORRECT authed-dashboard Lighthouse run.
# The first CDP-attach attempt failed conceptually: Lighthouse opens a fresh
# INCOGNITO context on attach (cookies not shared), so the run measured the
# logged-out bounce (/Dashboard → 401 → /login?from_url=…), not the dashboard.
# This version extracts the session cookie (sf_session) via Playwright and
# injects it through --extra-headers — the DevTools extra-headers channel
# carries Cookie across the incognito boundary.
# ---------------------------------------------------------------------------
set -euo pipefail
cd /home/z/my-project/retail-pos

BASE="http://127.0.0.1:3101"
CHROME=/home/z/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome

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

cat > scripts/lh-cookie.ts <<'EOF'
// Log in via the real form and print the sf_session cookie (value only —
// it never lands in a log elsewhere; the wrapper deletes this file).
import { chromium } from "@playwright/test";
const BASE = "http://127.0.0.1:3101";
async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await page.locator('input[type="email"]').fill("owner@veloxpos.local");
  await page.locator('input[type="password"]').fill("$Abcd1234");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
  const cookies = await ctx.cookies(BASE);
  const session = cookies.find((c) => c.name === "sf_session");
  if (!session) throw new Error("no sf_session cookie");
  console.log(session.value);
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
EOF

COOKIE=$(bun scripts/lh-cookie.ts)
rm -f scripts/lh-cookie.ts
echo "cookie acquired (${#COOKIE} chars)"

echo "=== lighthouse: /Dashboard (authed via injected cookie) ==="
CHROME_PATH="$CHROME" bunx lighthouse "$BASE/Dashboard" \
  --output=json --output-path="docs/lighthouse/v17-dashboard.json" \
  --extra-headers "{\"Cookie\":\"sf_session=$COOKIE\"}" \
  --form-factor=desktop --screenEmulation.disabled \
  --chrome-flags="--headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu" \
  --only-categories=performance,accessibility,best-practices,seo \
  --quiet > /tmp/lh-dash.log 2>&1 || echo "(run logged errors)"

python3 - <<'EOF'
import json, pathlib
p = pathlib.Path("docs/lighthouse/v17-dashboard.json")
if not p.exists():
    print("dashboard report MISSING")
    raise SystemExit
d = json.loads(p.read_text())
cats = d.get("categories", {})
print("dashboard scores:", {c: round((v.get("score") or 0) * 100) for c, v in cats.items()})
a = d.get("audits", {})
for k in ["first-contentful-paint", "largest-contentful-paint", "total-blocking-time",
          "cumulative-layout-shift", "speed-index", "interactive"]:
    x = a.get(k, {})
    print(f"  {k}: {x.get('displayValue')}")
# verify the bounce did not happen (redirects audit should be clean)
rd = a.get("redirects", {})
print("redirects:", rd.get("displayValue") or "none")
ec = a.get("errors-in-console", {})
errs = (ec.get("details") or {}).get("items") or []
print("console errors:", len(errs))
for e in errs[:3]:
    print("  ", (e.get("description") or "")[:120])
EOF
