// S19 — the RUM diagnostics seam (docs/remediation-plan-session19.md).
//
// The panel at /rum renders the GET /api/rum aggregate. Everything
// display-logical is a PURE function here so the unit layer can pin it:
// the public CWV rating bounds (classifyP75 re-derives the rating from
// the p75 VALUE — the per-event ratings are the beacon's in-the-moment
// calls, p75 is what field data reports), the value formatting (ms 0dp,
// CLS unitless 2dp), and the display-model builder (cards + empty state).
import { describe, expect, it } from "vitest";
import {
  CWV_THRESHOLDS,
  RUM_METRIC_LABELS,
  RUM_METRIC_ORDER,
  buildPanelRows,
  buildSparklinePoints,
  classifyP75,
  formatMetricValue,
  toRumCsv,
} from "../src/lib/rum-diagnostics";

describe("CWV_THRESHOLDS + RUM_METRIC_ORDER (S19 seam shape)", () => {
  it("covers exactly the web-vitals v6 metric set, in order", () => {
    expect(RUM_METRIC_ORDER).toEqual(["TTFB", "FCP", "LCP", "CLS", "INP"]);
  });

  it("declares good/ni bounds for every metric (and nothing else)", () => {
    expect(Object.keys(CWV_THRESHOLDS).sort()).toEqual(["CLS", "FCP", "INP", "LCP", "TTFB"]);
    for (const bounds of Object.values(CWV_THRESHOLDS)) {
      expect(bounds.good).toBeGreaterThan(0);
      expect(bounds.ni).toBeGreaterThan(bounds.good);
    }
  });

  it("labels every metric with a human name", () => {
    expect(Object.keys(RUM_METRIC_LABELS).sort()).toEqual([...RUM_METRIC_ORDER].sort());
    for (const label of Object.values(RUM_METRIC_LABELS)) {
      expect(label.length).toBeGreaterThan(3);
    }
  });
});

describe("classifyP75 (the public CWV bounds — boundary-exact)", () => {
  it("TTFB: good ≤ 800ms, NI ≤ 1800ms, poor above", () => {
    expect(classifyP75("TTFB", 800)).toBe("good");
    expect(classifyP75("TTFB", 800.5)).toBe("needs-improvement");
    expect(classifyP75("TTFB", 1800)).toBe("needs-improvement");
    expect(classifyP75("TTFB", 1801)).toBe("poor");
  });

  it("FCP: good ≤ 1800ms, NI ≤ 3000ms, poor above", () => {
    expect(classifyP75("FCP", 1800)).toBe("good");
    expect(classifyP75("FCP", 1801)).toBe("needs-improvement");
    expect(classifyP75("FCP", 3000)).toBe("needs-improvement");
    expect(classifyP75("FCP", 3001)).toBe("poor");
  });

  it("LCP: good ≤ 2500ms, NI ≤ 4000ms, poor above", () => {
    expect(classifyP75("LCP", 2500)).toBe("good");
    expect(classifyP75("LCP", 2501)).toBe("needs-improvement");
    expect(classifyP75("LCP", 4000)).toBe("needs-improvement");
    expect(classifyP75("LCP", 4001)).toBe("poor");
  });

  it("CLS: good ≤ 0.1, NI ≤ 0.25, poor above (unitless)", () => {
    expect(classifyP75("CLS", 0.1)).toBe("good");
    expect(classifyP75("CLS", 0.11)).toBe("needs-improvement");
    expect(classifyP75("CLS", 0.25)).toBe("needs-improvement");
    expect(classifyP75("CLS", 0.26)).toBe("poor");
  });

  it("INP: good ≤ 200ms, NI ≤ 500ms, poor above", () => {
    expect(classifyP75("INP", 200)).toBe("good");
    expect(classifyP75("INP", 201)).toBe("needs-improvement");
    expect(classifyP75("INP", 500)).toBe("needs-improvement");
    expect(classifyP75("INP", 501)).toBe("poor");
  });
});

describe("formatMetricValue (ms 0dp — CLS unitless 2dp)", () => {
  it("rounds the ms metrics to whole milliseconds", () => {
    expect(formatMetricValue("LCP", 2345.6)).toBe("2346 ms");
    expect(formatMetricValue("TTFB", 120)).toBe("120 ms");
    expect(formatMetricValue("FCP", 1899.4)).toBe("1899 ms");
    expect(formatMetricValue("INP", 0)).toBe("0 ms");
  });

  it("formats CLS with two decimals, no unit", () => {
    expect(formatMetricValue("CLS", 0.03456)).toBe("0.03");
    expect(formatMetricValue("CLS", 0)).toBe("0.00");
    expect(formatMetricValue("CLS", 0.25)).toBe("0.25");
  });
});

describe("buildPanelRows (the display model)", () => {
  const full = {
    p75: { TTFB: 120, FCP: 1900, LCP: 2345, CLS: 0.03, INP: 210 } as Record<string, number>,
    samples: 42,
    total: 118,
    recent: [
      {
        metric: "LCP",
        value: 2345,
        rating: "good",
        navigationType: "navigate",
        path: "/",
        sessionId: "s1",
        createdAt: "2026-10-09T02:00:00.000Z",
      },
    ],
  };

  it("builds one card per metric, in RUM_METRIC_ORDER, ratings derived from the p75 value", () => {
    const rows = buildPanelRows(full);
    expect(rows.hasData).toBe(true);
    expect(rows.cards.map((c) => c.metric)).toEqual(RUM_METRIC_ORDER);
    const byMetric = Object.fromEntries(rows.cards.map((c) => [c.metric, c]));
    expect(byMetric.TTFB.formatted).toBe("120 ms");
    expect(byMetric.TTFB.rating).toBe("good");
    expect(byMetric.LCP.rating).toBe("good"); // 2345 ≤ 2500
    expect(byMetric.FCP.rating).toBe("needs-improvement"); // 1900 in (1800, 3000]
    expect(byMetric.CLS.formatted).toBe("0.03");
    expect(byMetric.INP.rating).toBe("needs-improvement"); // 210 in (200, 500]
  });

  it("marks unsampled metrics (no p75) as unsampled, keeps the card slot", () => {
    const rows = buildPanelRows({
      p75: { LCP: 3000 },
      samples: 3,
      total: 3,
      recent: [],
    });
    expect(rows.hasData).toBe(true);
    expect(rows.cards).toHaveLength(5);
    const lcp = rows.cards.find((c) => c.metric === "LCP")!;
    expect(lcp.sampled).toBe(true);
    expect(lcp.rating).toBe("needs-improvement"); // 3000 in (2500, 4000]
    for (const card of rows.cards.filter((c) => c.metric !== "LCP")) {
      expect(card.sampled).toBe(false);
      expect(card.formatted).toBeNull();
    }
  });

  it("the empty aggregate renders the no-data state with all five card slots", () => {
    const rows = buildPanelRows({ p75: {}, samples: 0, total: 0, recent: [] });
    expect(rows.hasData).toBe(false);
    expect(rows.cards).toHaveLength(5);
    expect(rows.cards.every((c) => !c.sampled)).toBe(true);
  });

  it("passes the recent samples through untouched (the caller formats times)", () => {
    const rows = buildPanelRows(full);
    expect(rows.recent).toEqual(full.recent);
  });
});

// S20 — the v3 seam extensions (docs/remediation-plan-session20.md):
// the sparkline geometry (per-card trend lines from the GET's new
// `trends` field) and the CSV export body builder (RFC-4180 escaping,
// raw analysis-grade values).

describe("buildSparklinePoints (the card trend geometry — S20)", () => {
  it("returns [] for an empty series (the caller renders no SVG)", () => {
    expect(buildSparklinePoints([], 100, 28)).toEqual([]);
  });

  it("renders a single value as a VISIBLE flat line: two centered points spanning the width", () => {
    // A one-point polyline is invisible — the seam must promote it.
    expect(buildSparklinePoints([123], 100, 28)).toEqual([
      { x: 0, y: 14 },
      { x: 100, y: 14 },
    ]);
  });

  it("guards a flat series (min === max): all points at the vertical center", () => {
    const points = buildSparklinePoints([5, 5, 5, 5], 100, 28);
    expect(points).toHaveLength(4);
    for (const p of points) expect(p.y).toBe(14);
    expect(points.map((p) => p.x)).toEqual([0, 100 / 3, (2 * 100) / 3, 100]);
  });

  it("normalizes a known 4-value series to EXACT coordinates (worked example)", () => {
    // values 100..400 over width 100 / height 28 / PAD 2:
    //   y = 2 + (1 - (v - min)/range) * (28 - 4)  →  26, 18, 10, 2
    //   x evenly spaced: 0, 100/3, 200/3, 100
    const points = buildSparklinePoints([100, 200, 300, 400], 100, 28);
    expect(points.map((p) => p.x)).toEqual([0, 100 / 3, (2 * 100) / 3, 100]);
    expect(points.map((p) => p.y)).toEqual([26, 18, 10, 2]);
  });

  it("inverts y (larger value → smaller y) and respects the PAD inset + width", () => {
    const points = buildSparklinePoints([1, 9, 5, 7], 80, 30);
    expect(points).toHaveLength(4);
    for (const p of points) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(80);
      expect(p.y).toBeGreaterThanOrEqual(2);
      expect(p.y).toBeLessThanOrEqual(30 - 2);
    }
    // value 9 (index 1) is the max → the smallest y; value 1 (index 0) → the largest.
    expect(points[1]!.y).toBeLessThan(points[0]!.y);
    expect(points[0]!.y).toBeGreaterThan(points[2]!.y);
  });
});

describe("toRumCsv (the export body — S20)", () => {
  const event = {
    metric: "LCP",
    value: 2345,
    rating: "good",
    navigationType: "navigate",
    path: "/",
    sessionId: "s1",
    createdAt: "2026-10-09T02:00:00.000Z",
  };

  it("renders the header line only for an empty input", () => {
    expect(toRumCsv([])).toBe("metric,value,rating,navigationType,path,sessionId,createdAt\n");
  });

  it("renders a known event as one RAW row under the header (no display formatting)", () => {
    expect(toRumCsv([event])).toBe(
      "metric,value,rating,navigationType,path,sessionId,createdAt\n" +
        "LCP,2345,good,navigate,/,s1,2026-10-09T02:00:00.000Z\n",
    );
  });

  it("keeps CLS values raw (unitless, no 'ms', no rounding)", () => {
    const cls = { ...event, metric: "CLS", value: 0.03456 };
    const csv = toRumCsv([cls]);
    expect(csv.split("\n")[1]).toContain(",0.03456,");
  });

  it("escapes RFC-4180 style: comma/quote-bearing fields are quoted with doubled inner quotes", () => {
    const tricky = { ...event, path: '/lab, "alpha"' };
    const csv = toRumCsv([tricky]);
    expect(csv.split("\n")[1]).toContain(',"/lab, ""alpha""",');
  });

  it("preserves the caller's ordering (rows in input order)", () => {
    const a = { ...event, sessionId: "a" };
    const b = { ...event, sessionId: "b", metric: "TTFB" };
    const csv = toRumCsv([a, b]);
    const rows = csv.trim().split("\n");
    expect(rows).toHaveLength(3); // header + 2
    expect(rows[1]).toContain(",a,");
    expect(rows[2]).toContain(",b,");
  });
});

describe("buildPanelRows + trends (the v3 display model — S20)", () => {
  it("carries each metric's trend values (oldest → newest) onto its card", () => {
    const rows = buildPanelRows({
      p75: { LCP: 2345 },
      samples: 3,
      total: 3,
      recent: [],
      trends: { LCP: [100, 200, 300] },
    });
    const lcp = rows.cards.find((c) => c.metric === "LCP")!;
    expect(lcp.points).toEqual([100, 200, 300]);
    // metrics without trend data carry an empty series
    for (const card of rows.cards.filter((c) => c.metric !== "LCP")) {
      expect(card.points).toEqual([]);
    }
  });

  it("omitting trends entirely keeps every card's points [] (backward compat)", () => {
    const rows = buildPanelRows({ p75: { TTFB: 120 }, samples: 1, total: 1, recent: [] });
    expect(rows.cards.every((c) => c.points.length === 0)).toBe(true);
  });

  it("filters non-finite trend values out of the card's series", () => {
    const rows = buildPanelRows({
      p75: {},
      samples: 0,
      total: 0,
      recent: [],
      trends: { LCP: [100, Number.NaN, 300, Number.POSITIVE_INFINITY] },
    });
    const lcp = rows.cards.find((c) => c.metric === "LCP")!;
    expect(lcp.points).toEqual([100, 300]);
  });
});
