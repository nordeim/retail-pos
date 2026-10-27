#!/usr/bin/env python3
"""Build side-by-side ref|clone crops for VLM inspection of the top diff bands."""
from PIL import Image
import os

BASE = "/tmp/pixeldiff"
OUT = "/tmp/pixeldiff/side"
os.makedirs(OUT, exist_ok=True)

# view -> (y_start, y_end) top band(s) to inspect, full width
CROPS = {
    "terminal": [(0, 480)],
    "dashboard": [(0, 200), (600, 800)],
    "inventory": [(0, 240)],
    "sales": [(240, 400)],
    "registers": [(120, 340)],
    "cashiers": [(120, 340), (400, 520)],
    "reports": [(120, 240), (480, 600)],
    "settings": [(0, 200)],
    "login": [(700, 932)],
}

for name, bands in CROPS.items():
    r = Image.open(f"{BASE}/ref/{name}.png").convert("RGB")
    c = Image.open(f"{BASE}/clone/{name}.png").convert("RGB")
    for i, (y0, y1) in enumerate(bands):
        y1r = min(y1, r.height); y1c = min(y1, c.height)
        h = min(y1r - y0, y1c - y0)
        if h <= 0:
            continue
        rc = r.crop((0, y0, 1280, y0 + h))
        cc = c.crop((0, y0, 1280, y0 + h))
        side = Image.new("RGB", (2560, h + 20), (255, 0, 0))
        side.paste(rc, (0, 0))
        side.paste(cc, (1280, 20))
        side.save(f"{OUT}/{name}-band{i}-y{y0}-{y0+h}.png")
        print(f"built {name}-band{i}-y{y0}-{y0+h}.png")
