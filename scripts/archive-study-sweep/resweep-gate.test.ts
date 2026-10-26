// Unit pins for the S96 resweep exit-gate seam — src/lib/resweep-gate.ts.
//
// The doctrine under test (the s95 audit's L2, riding the S91/AR7 and
// S95/AV2 gate lineage): a resweep run that FAILED — a red invariant, the
// catch-path envelope, a probe-cleanup failure, or a sweep that never
// reached registration — must exit non-zero. An exit-code-checking wrapper
// that sees 0 on a failed sweep is the exact trap the capture-script class
// was hardened against; the resweep class carried the gap through three
// re-tags (s93/s94/s95) before this seam.
//
// The fixtures are the documented envelope shapes the resweep finally-block
// prints (scripts/ref-resweep-s95.mjs: the success envelope, the catch-path
// default, the probeCleanup vocabulary the AR4 restructure established).
import { describe, expect, it } from "vitest";

import { resweepExitCode } from "@/lib/resweep-gate";

describe("the resweep exit gate (S96/AW2)", () => {
  it("a fully-green sweep (ok + probeCleanup ok) exits 0", () => {
    expect(
      resweepExitCode({ ok: true, probeCleanup: "ok" }),
    ).toBe(0);
  });

  it("a failed verdict (a red invariant) exits 1 — even when the cleanup answered ok", () => {
    expect(
      resweepExitCode({ ok: false, probeCleanup: "ok" }),
    ).toBe(1);
  });

  it("the catch-path envelope (ok false, error carried) exits 1", () => {
    expect(
      resweepExitCode({ ok: false, probeCleanup: "not-run (registration never reached)", error: "Timeout 30000ms exceeded" }),
    ).toBe(1);
  });

  it("a failed probe cleanup exits 1 — the delete answered non-200 (a leaked probe user is a failed run)", () => {
    expect(
      resweepExitCode({ ok: true, probeCleanup: "delete answered 500" }),
    ).toBe(1);
  });

  it("a failed probe cleanup exits 1 — the delete threw", () => {
    expect(
      resweepExitCode({ ok: true, probeCleanup: "delete threw Error: net::ERR_CONNECTION_REFUSED" }),
    ).toBe(1);
  });

  it("a sweep that never reached registration (probeCleanup undefined) exits 1", () => {
    expect(
      resweepExitCode({ ok: true }),
    ).toBe(1);
  });
});
