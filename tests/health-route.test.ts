import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// V26/F1 — the health route's DEGRADED branch finally pinned.
//
// The standing picture: tests/e2e/health.spec.ts pins ONLY the 200 branch
// (its own comment disclosed "The DEGRADED branch (503) stays unpinned —
// forcing it would mean breaking the DB mid-suite"), and the branch has
// been carried as known-open since V24. But the objection is an E2E-layer
// objection only. Here at the unit layer vi.mock intercepts "@/lib/db"
// BEFORE the module graph ever constructs a PrismaClient, so the probe can
// be made to reject deterministically with zero DB involvement — the
// mid-suite breakage never happens.
//
// Why the branch needs a pin at all (the ADR-033 gate-coverage doctrine):
// docker-compose.yml's healthcheck is
//   fetch('…/api/health').then(r => process.exit(r.ok ? 0 : 1))
// — a consumer that LEANS on the 503. A regression to 200-with-degraded-
// body would report a broken-DB container as HEALTHY with every standing
// gate green: the latent-regression shape exactly. Mutation-proven per
// remediation-plan-v26 SD-110a (the planted 503→200 defect went RED at the
// status assertion; restored → GREEN).
//
// The mock is hoisted above the imports by vitest — the real src/lib/db
// (which instantiates PrismaClient at import time and rewrites
// process.env.DATABASE_URL) is never evaluated in this file's module graph.
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    $queryRaw: vi.fn(),
  },
}));

import { db } from "@/lib/db";
import { GET } from "@/app/api/health/route";

const queryRaw = db.$queryRaw as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  queryRaw.mockReset();
});

describe("GET /api/health (V26/F1 — both branches of the probe)", () => {
  it("ok: a resolving probe answers 200 with the documented body", async () => {
    queryRaw.mockResolvedValue([{ 1: 1 }]);

    const response = await GET();

    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, string>;
    expect(body).toEqual({ status: "ok", db: "up", app: "veloxpos" });
  });

  it("degraded: a rejecting probe answers 503 with the degraded body (the Docker healthcheck leans on this)", async () => {
    queryRaw.mockRejectedValue(new Error("probe failed (simulated)"));

    const response = await GET();

    // r.ok is false at 503 — docker-compose's healthcheck exits 1 here.
    expect(response.status).toBe(503);
    const body = (await response.json()) as Record<string, string>;
    expect(body).toEqual({ status: "degraded", db: "down", app: "veloxpos" });
  });
});
