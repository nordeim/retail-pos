// ---------------------------------------------------------------------------
// Source pins for remediation-plan-v27 — the shell title-guard pass
// (SD-113b; the recovery-a11y idiom: comment-stripped source, regex pins).
//
// The shell's title effect in src/app/page.tsx must carry the GUARDED
// write + the armed MutationObserver — the not-found-title.tsx pattern
// (v7) ported to the shell (v27): apply the path-driven title only when
// it DIFFERS (no write-loop), observe document.head so any late write by
// Next's client metadata manager (the empirically documented 5-6
// re-applies per boot, the last as late as ~295ms — the v9 title flake's
// root cause) is corrected by the guard, and disconnect on cleanup. The
// e2e layer proves the defense LIVE (tests/e2e/title-guard.spec.ts —
// the controlled-clobber correction).
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
const NOT_FOUND_TITLE = stripComments(read("src", "app", "not-found-title.tsx"));

describe("v27 — the shell title effect carries the guarded observer (page.tsx)", () => {
  it("constructs a MutationObserver inside the title effect", () => {
    expect(PAGE).toMatch(/new MutationObserver\(/);
  });

  it("observes document.head with the subtree+childList+characterData shape", () => {
    expect(PAGE).toMatch(
      /observer\.observe\(document\.head,\s*\{\s*subtree:\s*true,\s*childList:\s*true,\s*characterData:\s*true,?\s*\}/,
    );
  });

  it("the write is GUARDED (apply-when-different — no write-loop)", () => {
    // The bare write (`document.title = …` unconditional) is the flake's
    // root-cause shape; the guard is the fix's load-bearing part.
    expect(PAGE).toMatch(/if \(document\.title !== desired\) document\.title = desired;/);
    expect(PAGE).toMatch(/const desired = documentTitleForPath\(window\.location\.pathname\);/);
  });

  it("the effect disconnects the observer on cleanup", () => {
    expect(PAGE).toMatch(/return \(\) => observer\.disconnect\(\);/);
  });
});

describe("v27 — the 404 surface keeps its own standing guard (not-found-title.tsx)", () => {
  it("the guarded observer the v7 fix shipped is still there", () => {
    expect(NOT_FOUND_TITLE).toMatch(/new MutationObserver\(apply\)/);
    expect(NOT_FOUND_TITLE).toMatch(/if \(document\.title !== desired\) document\.title = desired;/);
  });
});
