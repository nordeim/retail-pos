import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// The V13 pins — the chart hover micro-interactions, measured live on BOTH
// apps for the first time (docs/remediation-plan-v13.md §0 L3-L16):
//   F1 the sales-chart activeDot (the recharts default: r=4, the line color
//      fill, the #fff 2px stroke)
//   F2 the sales-chart tooltip CURSOR (the vertical #ccc line at the active
//      x spanning the plot area)
//   F3 the tooltip CONTENT grammar (the recharts default item line: the
//      label p + the ul/li item in the LINE color — the literal "ventas"
//      series name, the " : " separator, the RAW value, 16px)
//   F4 the tooltip POSITION + motion ((point.x + 10, pointer.y + 10), the
//      right-edge left-flip, the transform 400ms glide, the persistent
//      visibility wrapper)
//   F5 the donut tooltip's OWN skin (the RAW recharts default: the 1px #ccc
//      border, NO radius, NO shadow, the empty label p, the black
//      "name : count" item — the v11 white-card skin was the sales chart's)

const root = resolve(import.meta.dirname, "..");
const shared = () => readFileSync(resolve(root, "src/components/pos/shared.tsx"), "utf8");

// ---- B1/F1 + F2 — the activeDot + the tooltip cursor ---------------------------

describe("B1 — the sales-chart activeDot + cursor (the recharts defaults)", () => {
  it("the active dot renders the reference's default: r=4, the line-color fill, the #fff 2px stroke", () => {
    const s = shared();
    expect(s).toContain('data-testid="active-dot"');
    expect(s).toMatch(/r=\{4\}/);
    expect(s).toContain("fill={skin.lineStroke}");
    expect(s).toContain('stroke="#fff"');
    expect(s).toMatch(/strokeWidth=\{2\}/);
  });

  it("the cursor is the vertical #ccc line at the active x spanning the plot area", () => {
    const s = shared();
    expect(s).toContain('data-testid="tooltip-cursor"');
    expect(s).toContain('stroke="#ccc"');
    expect(s).toMatch(/y1=\{padTop\}/);
    expect(s).toMatch(/y2=\{padTop \+ innerH\}/);
    expect(s).toMatch(/x1=\{x\(hover\.idx\)\}/);
    expect(s).toMatch(/x2=\{x\(hover\.idx\)\}/);
  });

  it("the dot + cursor render under the hover-visibility gate (leave clears them)", () => {
    const s = shared();
    expect(s).toMatch(/hover\?\.visible \? \(/);
    expect(s).toContain('data-testid="tooltip-cursor"');
    expect(s).toContain('data-testid="active-dot"');
  });
});

// ---- B1/F3 — the sales tooltip content grammar ----------------------------------

describe("B1 — the sales tooltip content (the recharts default item line)", () => {
  it("the card keeps the measured white skin and grows to the reference's 16px", () => {
    const s = shared();
    expect(s).toContain('data-testid="chart-tooltip"');
    expect(s).toMatch(/fontSize:\s*16/);
    expect(s).toMatch(/backgroundColor:\s*"#fff"/);
    expect(s).toMatch(/borderRadius:\s*12/);
    expect(s).toMatch(/padding:\s*10/);
    expect(s).toMatch(/rgba\(0, 0, 0, 0\.1\) 0px 4px 20px/);
  });

  it("the label is the margin-0 p (the day) — readable dark, the SD-18 superset", () => {
    const s = shared();
    expect(s).toMatch(/<p style=\{\{ margin: 0 \}\}>\{label\}<\/p>/);
    expect(s).toContain('color: "#1e293b"');
  });

  it("the item is the ul/li line: 4px pad-y, the LINE color, the literal ventas name, the ' : ' separator", () => {
    const s = shared();
    expect(s).toMatch(/paddingTop: 4, paddingBottom: 4, color: lineColor/);
    expect(s).toContain("SALES_SERIES_NAME");
    expect(s).toMatch(/SALES_SERIES_NAME = "ventas"/);
    expect(s).toContain('{" : "}');
  });

  it("the value is the RAW number — never the formatted Y string", () => {
    const s = shared();
    expect(s).toMatch(/String\(points\[hover\.idx\]\.value\)/);
    // formatY still feeds the Y axis only — the tip path must not carry it.
    const tipCall = s.match(/<SalesTip[\s\S]{0,400}?\/>/)?.[0] ?? "";
    expect(tipCall).not.toContain("formatY");
  });
});

// ---- B1/F4 — the tooltip anchor + motion ----------------------------------------

describe("B1 — the tooltip anchor, the flip, and the glide", () => {
  it("the anchor is (point.x + 10, pointer.y + 10) — the x snaps, the y follows the pointer", () => {
    const s = shared();
    expect(s).toContain("pointerY");
    expect(s).toMatch(/anchorX \+ 10/);
    expect(s).toMatch(/anchorY \+ 10/);
  });

  it("the wrapper flips to the mirrored -10 gap at the container's right edge (and above at the bottom)", () => {
    const s = shared();
    expect(s).toMatch(/anchorX \+ 10 \+ w > containerW/);
    expect(s).toMatch(/anchorX - w - 10/);
    expect(s).toMatch(/anchorY \+ 10 \+ h > containerH/);
    expect(s).toMatch(/anchorY - h - 10/);
  });

  it("the wrapper glides with the measured 400ms transform transition", () => {
    expect(shared()).toContain('transition: "transform 400ms"');
  });

  it("the wrapper PERSISTS after leave (visibility), never unmounts — the re-enter glide", () => {
    const s = shared();
    expect(s).toMatch(/visibility: visible && box \? "visible" : "hidden"/);
    // The leave handler hides, keeping the data — no null reset.
    expect(s).toMatch(/setHover\(\(h\) => \(h \? \{ \.\.\.h, visible: false \} : null\)\)/);
  });

  it("the tip measures itself via the callback-ref + ResizeObserver pattern (no setState-in-effect)", () => {
    const s = shared();
    expect(s).toContain("useSelfMeasure");
    expect(s).toMatch(/new ResizeObserver/);
  });
});

// ---- B2/F5 — the donut tooltip's raw skin ---------------------------------------

describe("B2 — the donut tooltip (the RAW recharts default skin)", () => {
  it("the raw skin: the 1px #ccc border, NO radius, NO shadow, 10px padding, nowrap, 16px", () => {
    const s = shared();
    expect(s).toContain('data-testid="donut-tooltip"');
    expect(s).toContain('border: "1px solid #ccc"');
    const start = s.indexOf("function DonutTip");
    const end = s.indexOf("\nfunction ", start + 1);
    const donutTip = s.slice(start, end);
    expect(donutTip).not.toContain("borderRadius");
    expect(donutTip).not.toContain("boxShadow");
    expect(donutTip).toMatch(/padding:\s*10/);
    expect(donutTip).toMatch(/whiteSpace:\s*"nowrap"/);
    expect(donutTip).toMatch(/fontSize:\s*16/);
  });

  it("the label p renders EMPTY (the pie tooltip's own shape)", () => {
    const s = shared();
    expect(s).toMatch(/<p style=\{\{ margin: 0 \}\} \/>/);
  });

  it("the item is BLACK: the name + ' : ' + the raw count — 'N productos' retires", () => {
    const s = shared();
    expect(s).toMatch(/color: "#000"/);
    expect(s).not.toContain('"producto"');
    expect(s).not.toContain('"productos"');
  });

  it("the anchor is the sector's ring midpoint (the measured centroid) + the same flip + glide", () => {
    const s = shared();
    expect(s).toContain("tooltipForDonut");
    expect(s).toMatch(/function DonutTip\(\{[\s\S]{0,200}anchorX/);
  });
});
