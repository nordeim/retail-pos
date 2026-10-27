// ---------------------------------------------------------------------------
// The F1 pins (remediation-plan-v20 / SD-77): the three recovery cards
// announce themselves through a live region. When a view chunk (or a
// segment, or the root) fails, the Spanish card MOUNTS fresh into the
// DOM — an element carrying role="alert" inserted with its content is
// the standard screen-reader announcement mechanism. The placement is
// LANDMARK-SAFE: the role never rides the <main> wrapper (an element
// carries exactly one role — role="alert" on <main> would delete the
// main landmark), always the inner card div that mounts with the
// failure.
//
// Source pins in the tailwind-traps idiom (comment-stripped source,
// regex pins); the e2e layer proves the attribute on the LIVE failure
// path (tests/e2e/functional-parity-v18.spec.ts SHELL SURVIVAL).
// ---------------------------------------------------------------------------

import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/** Strip // line comments and /* block comments so docs never trip code pins. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function read(...segments: string[]): string {
  return readFileSync(path.join(import.meta.dirname, "..", ...segments), "utf8");
}

const PAGE = stripComments(read("src", "app", "page.tsx"));
const SEGMENT = stripComments(read("src", "app", "error.tsx"));
const ROOT = stripComments(read("src", "app", "global-error.tsx"));

/** The view-boundary card: the div carrying data-testid="view-error-card"
 *  must carry role="alert" on the SAME element (the fresh mount is the
 *  announcement). */
describe("F1 — the view recovery card announces (page.tsx)", () => {
  it("the view-error-card element carries role=\"alert\"", () => {
    expect(PAGE).toMatch(
      /<div[^>]*data-testid="view-error-card"[^>]*role="alert"|<div[^>]*role="alert"[^>]*data-testid="view-error-card"/,
    );
  });
});

/** The segment net: the role rides the INNER vx-card div — the <main>
 *  wrapper keeps its implicit landmark role (adding role="alert" there
 *  would remove the main landmark from the accessibility tree). */
describe("F1 — the segment recovery card announces (error.tsx)", () => {
  it("the inner card div carries role=\"alert\"", () => {
    expect(SEGMENT).toMatch(
      /<div[^>]*role="alert"[^>]*className="vx-card w-full max-w-md/,
    );
  });

  it("the <main> wrapper keeps its landmark — NO role attribute on it", () => {
    const mainTag = SEGMENT.match(/<main[^>]*>/)?.[0] ?? "";
    expect(mainTag).toContain("data-testid=\"segment-error-card\"");
    expect(mainTag).not.toMatch(/role=/);
  });
});

/** The root net: the div carrying data-testid="global-error-card" must
 *  carry role="alert" on the same element. */
describe("F1 — the root recovery card announces (global-error.tsx)", () => {
  it("the global-error-card element carries role=\"alert\"", () => {
    const cardTag = ROOT.match(/<div[^>]*data-testid="global-error-card"[^>]*>/)?.[0] ?? "";
    expect(cardTag).toContain('role="alert"');
  });
});
