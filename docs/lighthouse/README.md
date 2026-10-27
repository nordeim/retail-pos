# Lighthouse evidence — the v17 Core Web Vitals set (2026-10-27)

The reports in this folder are the **v17 measurement set** — Lighthouse 13
run against the production standalone build (`.next/standalone/server.js`
on 127.0.0.1:3101, `db/custom.db`, desktop form factor, screen emulation
off) and against the live reference for the parity benchmark. The
study-app-era reports that previously lived here (localhost:3200,
2026-10-18) were **deleted** — they measured the retired application and
misrepresented this app's evidence (v17/F1).

## The set

| Report | Surface | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|---|
| `v17-login.json` | the clone's public `/login` | **86** | 100 | 100 | 100 | 0.9 s | 2.4 s | 50 ms | 0 |
| `v17-dashboard.json` | the clone's authed `/Dashboard` (post v17 split) | **67** | 94* | 100 | 100 | 1.0 s | 3.5 s | 280 ms | 0 |
| `v17-ref-login.json` | the reference's public login | **51** | — | — | — | 5.4 s | 14.4 s | 170 ms | 0.001 |

The clone ships 314 KiB total; the reference ships 2,314 KiB — the clone
outperforms the reference on every metric (LCP 2.4 s vs 14.4 s on the
directly comparable public surface).

\* The dashboard's a11y 94 decomposes into two **reference-parity
deviations** (v17/F3, plan §0 L11/L17): `color-contrast` (the reference's
own measured low-contrast heading family — the long-standing disclosed
deviation the a11y smoke excludes) and `heading-order` (H1→h3 with no h2 —
measured IDENTICAL on the reference's Dashboard on 2026-10-27). The parity
contract wins; neither is "fixed".

## Methodology (reproducible)

```bash
# The public surface (no cookie needed):
scripts/lighthouse-v17.sh                     # → v17-login.json

# The authed surface — session cookie injected:
scripts/lighthouse-v17-authed.sh              # → v17-dashboard.json
```

Flags: `--form-factor=desktop --screenEmulation.disabled
--chrome-flags="--headless=new --no-sandbox --disable-dev-shm-usage
--disable-gpu"`; `CHROME_PATH` must point at a Chrome/Chromium ≥ stable
(the Playwright chromium works:
`/home/z/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`).

### The two Lighthouse-on-authed-surface lessons (v17/L15)

1. **CDP attach opens a FRESH INCOGNITO context.** Running
   `lighthouse --port 9222` against an already-logged-in browser does NOT
   share that browser's cookies — the run measures the logged-out bounce
   (`/Dashboard` → 401 → `/login?from_url=…`), not the authed surface.
2. **`--extra-headers '{"Cookie":"sf_session=…"}'` is the working
   channel.** Extract the session cookie via a Playwright login
   (`scripts/lighthouse-v17-authed.sh` does exactly that), then inject it
   through `--extra-headers` — the DevTools extra-headers channel carries
   the Cookie header across the incognito boundary. The report's
   `redirects: none` + `console errors: 0` prove the authed surface was
   actually measured.

## The v17 before/after (the view code-split, plan §B1)

| Metric (authed /Dashboard) | Pre-split | Post-split | Δ |
|---|---|---|---|
| Performance | 54 | **67** | **+13** |
| Total Blocking Time | 550 ms | **280 ms** | **−49 %** |
| Largest Contentful Paint | 3.7 s | 3.5 s | −0.2 s |
| First Contentful Paint | 1.0 s | 1.0 s | = |
| CLS | 0 | 0 | = |

The remaining boot cost is the react-dom chunk (~890 ms script evaluation
— the framework floor, plan §5 out-of-scope).
