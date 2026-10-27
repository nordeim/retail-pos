import { expect, test } from "@playwright/test";

// The V17 pins (docs/remediation-plan-v17.md §B1/F2):
//   The lazy view registry (SD-67) code-splits the 8 views — each surface
//   ships only its own view code. The observable contract, pinned here:
//   a cold /Dashboard boot NEVER downloads the terminal view's module
//   (the monolithic registry shipped every view to every surface), and a
//   first SPA switch to a view fetches its chunk on demand.

test.describe("functional parity (v17) — the code-split view registry", () => {
  test("the /Dashboard boot ships no terminal-view code", async ({ page }) => {
    const chunkUrls: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/_next/static/chunks/") && url.endsWith(".js")) {
        chunkUrls.push(url);
      }
    });

    await page.goto("/Dashboard");
    await expect(page.locator("main h1")).toHaveText("Dashboard");
    // Let any late-boot fetches (the prefetch + the background refresh)
    // settle before taking the inventory.
    await page.waitForTimeout(400);

    expect(chunkUrls.length).toBeGreaterThan(0);
    for (const url of chunkUrls) {
      const body = await page.request.get(url).then((r) => r.text());
      // "COBRAR" is the terminal view's unique CTA — its presence in any
      // boot chunk means the registry regressed to shipping all views.
      expect(body, `${url} must not ship the terminal view`).not.toContain("COBRAR");
    }
  });

  test("a first SPA switch to a view fetches its chunk on demand", async ({ page }) => {
    await page.goto("/Dashboard");
    await expect(page.locator("main h1")).toHaveText("Dashboard");

    const lateChunks: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/_next/static/chunks/") && url.endsWith(".js")) {
        lateChunks.push(url);
      }
    });

    await page.getByTestId("nav-inventario").click();
    await expect(page.locator("main h1")).toHaveText("Inventario");
    // The inventory view's chunk was fetched AFTER the dashboard boot —
    // the lazy registry loads views on demand.
    expect(lateChunks.length).toBeGreaterThan(0);
  });

  test("the boot prefetch makes the active view's chunk resident before ready (no Suspense gap)", async ({ page }) => {
    // The Splash→ready flip must not flash an empty main on the standard
    // flow: the prefetch settles in the same window as auth/me + the
    // pre-warm. Observable: the h1 is attached (not the null fallback)
    // immediately after data-app-hydrated lands.
    await page.goto("/Sales");
    await expect(page.locator("html[data-app-hydrated=true]")).toBeAttached();
    const h1 = page.locator("main h1");
    await expect(h1).toBeAttached();
    await expect(h1).toHaveText("Historial de Ventas");
  });
});
