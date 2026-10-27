#!/usr/bin/env python3
"""diff-v16-pixeldiff.py — compare ref vs clone full-page captures.

Per view: size match, % differing pixels (per-channel tolerance absorbs
antialiasing + oklab rounding), and the top diff row-bands (where drift
lives). Output is a compact table for the V16 audit ledger."""
from PIL import Image, ImageChops
import os

BASE = "/tmp/pixeldiff"
VIEWS = ["terminal", "dashboard", "inventory", "sales", "registers",
         "cashiers", "reports", "settings", "login"]
TOL = 12  # per-channel tolerance

for name in VIEWS:
    rp, cp = f"{BASE}/ref/{name}.png", f"{BASE}/clone/{name}.png"
    if not (os.path.exists(rp) and os.path.exists(cp)):
        print(f"{name:10s} MISSING")
        continue
    r, c = Image.open(rp).convert("RGB"), Image.open(cp).convert("RGB")
    if r.size != c.size:
        print(f"{name:10s} SIZE ref={r.size} clone={c.size}  <-- height/content drift")
        # normalize to common box for pixel stats
        w = min(r.width, c.width); h = min(r.height, c.height)
        r, c = r.crop((0, 0, w, h)), c.crop((0, 0, w, h))
    diff = ImageChops.difference(r, c).convert("RGB")
    px = diff.load()
    w, h = diff.size
    total = w * h
    bad = 0
    row_bad = [0] * h
    for y in range(h):
        for x in range(w):
            p = px[x, y]
            if p[0] > TOL or p[1] > TOL or p[2] > TOL:
                bad += 1
                row_bad[y] += 1
    pct = 100.0 * bad / total
    # top 3 bands of 40px with the most bad pixels
    bands = []
    for y0 in range(0, h, 40):
        s = sum(row_bad[y0:y0 + 40])
        if s > 0:
            bands.append((s, y0, y0 + 40))
    bands.sort(reverse=True)
    top = ", ".join(f"y{b[1]}-{b[2]}({b[0]})" for b in bands[:3]) if bands else "-"
    print(f"{name:10s} {w}x{h}  diff {pct:6.2f}%  bands: {top}")
