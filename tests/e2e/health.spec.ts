import { expect, test } from "@playwright/test";

// V24/F4 — the health body contract finally pinned. THREE consumers lean
// on this surface: the Playwright webServer boot gate (this suite itself —
// the poll only proves a 2xx, never the payload), the Docker healthcheck
// (docker-compose.yml's veloxpos service), and the README's verify-setup
// instruction (`curl -s localhost:3000/api/health` → the documented body).
// Until now ZERO assertions pinned the body — a payload regression could
// reshape it with every gate green (the gate-coverage doctrine: a shipped
// claim without a standing assertion is a latent regression).
//
// The unauthenticated posture is BY DESIGN (the route's own comment: the
// boot gate and the Docker healthcheck both poll before any session
// exists), so this rides the chromium project's logged-in context without
// caring about it. The DEGRADED branch (503) stays unpinned — forcing it
// would mean breaking the DB mid-suite (disclosed out-of-scope in
// remediation-plan-v24 §5).

test.describe("health", () => {
  test("the public health probe reports ok / db up / veloxpos", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const body = (await response.json()) as { status?: string; db?: string; app?: string };
    expect(body).toEqual({ status: "ok", db: "up", app: "veloxpos" });
  });
});
