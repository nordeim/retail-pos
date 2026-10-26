import { describe, expect, it } from "vitest";
import {
  computeGpa,
  convert,
  evaluate,
  formatCalcResult,
  gpaPoints,
  mapPhysicalKey,
  type GpaRow,
} from "@/lib/calculator";

describe("evaluate — basic arithmetic", () => {
  it("computes the four operations with correct precedence", () => {
    expect(evaluate("2 + 3 * 4")).toBe(14);
    expect(evaluate("(2 + 3) * 4")).toBe(20);
    expect(evaluate("10 / 4")).toBe(2.5);
    expect(evaluate("7 % 3")).toBe(1);
  });

  it("handles unary minus and leading operators", () => {
    expect(evaluate("-5 + 3")).toBe(-2);
    expect(evaluate("2 * -3")).toBe(-6);
    expect(evaluate("2 - -3")).toBe(5);
    expect(evaluate("--5")).toBe(5); // nested unary minus
    expect(evaluate("-sqrt(16)")).toBe(-4);
  });

  it("supports powers and right-associativity", () => {
    expect(evaluate("2 ^ 3")).toBe(8);
    expect(evaluate("2 ^ 3 ^ 2")).toBe(512); // right-assoc: 2^(3^2)
  });

  it("normalizes display symbols (× ÷ −)", () => {
    expect(evaluate("6 × 7")).toBe(42);
    expect(evaluate("10 ÷ 2")).toBe(5);
    expect(evaluate("5 − 3")).toBe(2);
  });

  it("rejects malformed input instead of throwing raw", () => {
    expect(() => evaluate("2 +")).toThrow();
    expect(() => evaluate("(2 + 3")).toThrow();
    expect(() => evaluate("2 + 3)")).toThrow();
    expect(() => evaluate("")).toThrow();
    expect(() => evaluate("foo(1)")).toThrow();
    expect(() => evaluate("1 / 0")).toThrow("Division by zero");
  });
});

describe("evaluate — scientific", () => {
  it("applies functions and constants", () => {
    expect(evaluate("sqrt(16)")).toBe(4);
    expect(evaluate("ln(e)")).toBeCloseTo(1);
    expect(evaluate("log(100)")).toBeCloseTo(2);
    expect(evaluate("abs(-3)")).toBe(3);
    expect(evaluate("sin(0)")).toBe(0);
    expect(evaluate("pi")).toBeCloseTo(Math.PI);
  });

  it("computes factorials as a postfix operator", () => {
    expect(evaluate("5!")).toBe(120);
    expect(evaluate("0!")).toBe(1);
    expect(() => evaluate("(-5)!")).toThrow();
    expect(() => evaluate("200!")).toThrow("overflow");
  });

  it("nests parentheses", () => {
    expect(evaluate("sqrt(sqrt(16))")).toBe(2);
    expect(evaluate("(1 + 2) * (3 + 4)")).toBe(21);
  });
});

describe("GPA calculator", () => {
  it("maps letters, points and percentages", () => {
    expect(gpaPoints("A")).toBe(4);
    expect(gpaPoints("a+")).toBe(4);
    expect(gpaPoints("B+")).toBe(3.3);
    expect(gpaPoints("F")).toBe(0);
    expect(gpaPoints("3.7")).toBe(3.7);
    expect(gpaPoints("88%")).toBeCloseTo(3.52);
    expect(gpaPoints("88")).toBeCloseTo(3.52);
    expect(gpaPoints("banana")).toBeNull();
  });

  it("weights by credits", () => {
    const rows: GpaRow[] = [
      { grade: "A", credits: 3 }, // 4.0 × 3 = 12
      { grade: "B+", credits: 4 }, // 3.3 × 4 = 13.2
    ];
    expect(computeGpa(rows)).toBeCloseTo(3.6, 2); // 25.2 / 7
  });

  it("returns 0 with no valid rows", () => {
    expect(computeGpa([])).toBe(0);
    expect(computeGpa([{ grade: "X", credits: 3 }])).toBe(0);
    expect(computeGpa([{ grade: "A", credits: 0 }])).toBe(0);
  });
});

describe("unit converter", () => {
  it("converts lengths via the base unit", () => {
    expect(convert(1, "m", "ft", "length")).toBeCloseTo(3.28084, 4);
    expect(convert(1, "km", "m", "length")).toBe(1000);
    expect(convert(1, "mi", "km", "length")).toBeCloseTo(1.609344, 5);
  });

  it("converts temperatures through Celsius", () => {
    expect(convert(0, "°C", "°F", "temperature")).toBeCloseTo(32);
    expect(convert(212, "°F", "°C", "temperature")).toBeCloseTo(100);
    expect(convert(0, "°C", "K", "temperature")).toBeCloseTo(273.15);
  });

  it("converts data units on the 1024 scale", () => {
    expect(convert(1, "KB", "B", "data")).toBe(1024);
    expect(convert(1, "GB", "MB", "data")).toBe(1024);
  });

  it("throws on unknown units", () => {
    expect(() => convert(1, "cubit", "m", "length")).toThrow();
    expect(() => convert(1, "°C", "m", "temperature")).toThrow();
  });
});

describe("formatCalcResult", () => {
  it("trims float noise", () => {
    expect(formatCalcResult(0.1 + 0.2)).toBe("0.3");
    expect(formatCalcResult(56)).toBe("56");
  });

  it("uses exponential form for extreme magnitudes", () => {
    expect(formatCalcResult(1e15)).toMatch(/e\+/i);
    expect(formatCalcResult(1e-10)).toMatch(/e-/i);
  });
});

// ---------------------------------------------------------------------------
// S15 — mapPhysicalKey: the physical-keyboard superset seam. The reference's
// calculator is click-only (verified); the clone additionally maps real keys
// onto the SAME press/submit pipeline the keypad buttons drive.
// ---------------------------------------------------------------------------

describe("mapPhysicalKey (S15 physical-keyboard superset)", () => {
  it("maps digits, dot, parens, %, and ^ straight through", () => {
    for (const d of ["0", "1", "5", "9"]) expect(mapPhysicalKey(d)).toBe(d);
    expect(mapPhysicalKey(".")).toBe(".");
    expect(mapPhysicalKey("(")).toBe("(");
    expect(mapPhysicalKey(")")).toBe(")");
    expect(mapPhysicalKey("%")).toBe("%");
    expect(mapPhysicalKey("^")).toBe("^");
  });

  it("maps physical operators to the keypad glyphs (* → ×, / → ÷)", () => {
    expect(mapPhysicalKey("*")).toBe("×");
    expect(mapPhysicalKey("/")).toBe("÷");
    expect(mapPhysicalKey("+")).toBe("+");
    expect(mapPhysicalKey("-")).toBe("-");
  });

  it("maps Enter/= to equals, Backspace to ⌫, Escape to C — null otherwise", () => {
    expect(mapPhysicalKey("Enter")).toBe("=");
    expect(mapPhysicalKey("=")).toBe("=");
    expect(mapPhysicalKey("Backspace")).toBe("⌫");
    expect(mapPhysicalKey("Escape")).toBe("C");
    expect(mapPhysicalKey("a")).toBeNull();
    expect(mapPhysicalKey("Shift")).toBeNull();
    expect(mapPhysicalKey("F5")).toBeNull();
    expect(mapPhysicalKey("ArrowLeft")).toBeNull();
    expect(mapPhysicalKey("×")).toBeNull(); // the glyph itself is keypad-only
  });

  it("round-trips with the engine: a physical-key expression evaluates", () => {
    // Typing 1 2 * 3 on a physical keyboard builds the display string via
    // the mapped tokens, then the tokenizer normalizes × back to *.
    const typed = ["1", "2", "*", "3"].map((k) => mapPhysicalKey(k)!).join("");
    expect(typed).toBe("12×3");
    expect(evaluate(typed)).toBe(36);
    expect(evaluate(mapPhysicalKey("5")! + mapPhysicalKey("/") + mapPhysicalKey("8")!)).toBe(0.625);
  });
});
