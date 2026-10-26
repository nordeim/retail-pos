import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// The re-tag script-class runner-convention census (S98/AY1 — the s97
// audit's L1): every script in the capture-evidence / ref-resweep re-tag
// lineages that documents a Usage line must document the NODE runner. The
// S97/AX2 finding established the class convention (node ≥ 23.6; bun
// INCOMPATIBLE for the playwright request-API script class — the
// `_parseSetCookieHeader` crash on the verify-email POST), and the AX
// commit itself left capture-s96's own usage line saying `bun` — the
// convention lived in the resweep lineage and the s97 capture while TEN
// capture scripts (s87–s96) still said `bun`. This census makes the whole
// class self-guarding: a future re-tag copied from a stale template (or a
// hand-edited usage line) fails the unit layer BEFORE it misleads the
// next operator into a bun crash.
//
// S99/AZ2 (the s98 audit's I1): the census widened from the two-lineage
// PROXY to the TRUE class the AX2 convention governs — every script that
// imports playwright (the runner crash is a playwright-core behavior;
// 213 importers, 129 outside the lineages, 94 carrying Usage lines — the
// blind spot was demonstrated live: a planted bun line in z-probe-s70.mjs
// left the lineage-scoped pin GREEN). The lineage sanity legs stay (they
// prove the re-tag lineage census ran); the new sanity leg proves the
// playwright-class census ran.
//
// Scope honesty (the S93 machine-guard doctrine): files WITHOUT a Usage
// line are the pre-s87 historical era (39 capture scripts) — out of scope
// by design; the pin guards every line that EXISTS. Scripts that import
// NO playwright may document any runner (none currently do — the frozen
// historical-era doctrine, S99/AZ4).

const SCRIPTS_DIR = path.resolve(process.cwd(), "scripts");

function reTagScriptClass(): string[] {
  return readdirSync(SCRIPTS_DIR).filter(
    (f) => /^capture-s\d+-evidence\.mjs$/.test(f) || /^ref-resweep-s\d+\.mjs$/.test(f),
  );
}

// S99/AZ2: the TRUE convention class — every script importing playwright
// (the runner crash is a playwright-core behavior, so the convention
// governs every playwright carrier, not just the re-tag lineages).
function playwrightCarryingScripts(): string[] {
  return readdirSync(SCRIPTS_DIR).filter(
    (f) =>
      f.endsWith(".mjs") &&
      /from\s+["']playwright(-core)?["']/.test(readFileSync(path.join(SCRIPTS_DIR, f), "utf8")),
  );
}

function usageLine(file: string): string | undefined {
  const lines = readFileSync(path.join(SCRIPTS_DIR, file), "utf8").split("\n");
  return lines.find((l) => l.trim().startsWith("// Usage:"));
}

describe("the re-tag script-class runner convention (S98/AY1)", () => {
  it("censused the re-tag script class — both lineages present and non-trivial", () => {
    const files = reTagScriptClass();
    const captures = files.filter((f) => f.startsWith("capture-")).length;
    const resweeps = files.filter((f) => f.startsWith("ref-resweep-")).length;
    expect(captures, "the capture-evidence lineage census ran").toBeGreaterThan(40);
    expect(resweeps, "the ref-resweep lineage census ran").toBeGreaterThan(25);
  });

  it("censused the playwright-carrying class — the TRUE convention class (S99/AZ2, the s98 audit's I1)", () => {
    const carriers = playwrightCarryingScripts().length;
    expect(
      carriers,
      "the playwright-class census ran (213 importers at S99; a count below this threshold means the import-shape regex stopped matching — widen it)",
    ).toBeGreaterThan(200);
  });

  it("every Usage line in the playwright-carrying class documents the node runner — never bun (the S97/AX2 convention, widened S99/AZ2 from the lineage proxy to the true class)", () => {
    const stale: string[] = [];
    const documented: string[] = [];
    for (const file of playwrightCarryingScripts()) {
      const line = usageLine(file);
      if (line === undefined) continue; // the pre-s87 historical era carries no usage line
      documented.push(file);
      if (!line.includes("node scripts/") || line.includes("bun scripts/")) {
        stale.push(`${file}: ${line.trim()}`);
      }
    }
    expect(
      documented.length,
      "the convention census found documented scripts (the Usage-line carriers)",
    ).toBeGreaterThan(40);
    expect(
      stale,
      `scripts whose Usage line still names bun (or names no runner) — the S97/AX2 class convention is node ≥ 23.6; fix the usage line: ${stale.join(" | ")}`,
    ).toEqual([]);
  });
});
