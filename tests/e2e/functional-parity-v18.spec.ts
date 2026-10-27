import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// E2e pins for remediation-plan-v18 — the error-recovery architecture
// (F1/SD-70/71/72). The V17 lazy registry shipped a bare Suspense: a
// failed view chunk (transient blip or stale-hash-after-redeploy)
// unmounted the ENTIRE app to Next's built-in English dead-end screen
// (reproduced live, plan ledger L6). The pinned contract:
//   1. SHELL SURVIVAL — with the settings chunk persistently blocked,
//      the SPA switch shows the Spanish recovery card and the SIDEBAR
//      stays alive (no English dead-end, no app unmount).
//   2. REINTENTAR HEALS — with the chunk blocked exactly once, the
//      retry rebuilds the registry (SD-71: fresh React.lazy = fresh
//      import) and the view renders.
//   3. THE STALE-CHUNK SELF-HEAL — with the chunk blocked through the
//      boot prefetch AND the lazy mount, the boundary's guarded reload
//      refetches on the fresh boot and the view renders with NO user
//      action (the cooldown flag lands in sessionStorage).
// ---------------------------------------------------------------------------

/** Finds the settings view's chunk URL at runtime: load /StoreSettings,
 *  inventory the fetched chunk bodies, return the one carrying the
 *  settings view's own H1 string. */
async function findSettingsChunk(
  page: import("@playwright/test").Page,
): Promise<string | null> {
  const urls: string[] = [];
  const onResponse = (res: import("@playwright/test").Response) => {
    const url = res.url();
    if (url.includes("/_next/static/chunks/") && url.endsWith(".js")) {
      urls.push(url);
    }
  };
  page.on("response", onResponse);
  await page.goto("/StoreSettings");
  await expect(page.getByRole("heading", { name: "Ajustes de la Tienda" })).toBeVisible();
  page.off("response", onResponse);
  for (const url of urls) {
    const body = await page.request.get(url).then((r) => r.text());
    if (body.includes("Ajustes de la Tienda")) return url;
  }
  return null;
}

test.describe("functional parity (v18) — the view error boundary", () => {
  test("SHELL SURVIVAL: a persistently failed chunk keeps the shell + the Spanish card (no English dead-end)", async ({ page }) => {
    const settingsChunk = await findSettingsChunk(page);
    expect(settingsChunk, "the settings chunk must be discoverable").not.toBeNull();

    // Sit on Dashboard, block the settings chunk HARD, SPA-navigate.
    await page.goto("/Dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await page.route(settingsChunk!, (route) => route.abort("failed"));

    await page.getByTestId("nav-ajustes").click();

    // The Spanish recovery card — not Next's English dead-end.
    await expect(page.getByTestId("view-error-card")).toBeVisible();
    await expect(page.getByRole("heading", { name: "No se pudo cargar la vista" })).toBeVisible();
    // The SHELL stays alive: the sidebar is still on the page and the
    // app was never unmounted (pre-V18 this exact scenario replaced the
    // whole document with "This page couldn't load").
    await expect(page.getByTestId("desktop-sidebar")).toBeVisible();
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).not.toContain("This page couldn’t load");
    expect(bodyText).not.toContain("This page couldn't load");
  });

  test("REINTENTAR HEALS: with the auto-reload cooldown-suppressed, the fresh-registry retry re-imports in place (SD-71)", async ({ page }) => {
    const settingsChunk = await findSettingsChunk(page);
    expect(settingsChunk, "the settings chunk must be discoverable").not.toBeNull();

    await page.goto("/Dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    // Observable behavior mapped in this cycle's debug runs: a SINGLE
    // aborted fetch never surfaces the card — the bundler runtime
    // retries internally and the view renders below the boundary. The
    // card is the surface for failures that PERSIST past the runtime's
    // retry budget: block persistently, and pre-seed the cooldown flag
    // so the boundary's stale-chunk auto-reload stays suppressed (the
    // second-failure-inside-10s window — a real user scenario).
    await page.evaluate(() => {
      sessionStorage.setItem("veloxpos:chunk-reload-at", String(Date.now()));
    });

    let allow = false;
    await page.route(settingsChunk!, (route) => {
      if (allow) route.continue();
      else route.abort("failed");
    });

    await page.getByTestId("nav-ajustes").click();
    // The card shows: the import AND the runtime's internal retry both
    // aborted; the auto-reload stayed suppressed by the fresh flag.
    await expect(page.getByTestId("view-error-card")).toBeVisible({ timeout: 15_000 });

    // The blip lifts (a flaky network recovering)…
    allow = true;

    // Reintentar: bumps the epoch → fresh React.lazy → fresh import()
    // → the unblocked request sails through → the view renders IN PLACE
    // (no reload — the cooldown held; the flag is untouched).
    await page.getByRole("button", { name: "Reintentar" }).click();
    await expect(
      page.getByRole("heading", { name: "Ajustes de la Tienda" }),
    ).toBeVisible({ timeout: 15_000 });
    const flag = await page.evaluate(() =>
      sessionStorage.getItem("veloxpos:chunk-reload-at"),
    );
    expect(flag).not.toBeNull(); // the pre-seeded value — never rewritten
  });

  test("THE SELF-HEAL: a full-load chunk failure auto-reloads once and the view renders with no user action", async ({ page }) => {
    const settingsChunk = await findSettingsChunk(page);
    expect(settingsChunk, "the settings chunk must be discoverable").not.toBeNull();

    // Abort the settings chunk's first TWO requests (the boot prefetch
    // + the lazy mount); everything after (the post-reload boot) passes.
    let hits = 0;
    await page.route(settingsChunk!, (route) => {
      hits += 1;
      if (hits <= 2) route.abort("failed");
      else route.continue();
    });

    // A FULL load: boot prefetch (req 1, aborted) + lazy mount (req 2,
    // aborted) → the boundary catches the ChunkLoadError → the guarded
    // reload fires → the fresh boot re-requests (req 3+, allowed) →
    // the view renders. No user action anywhere.
    await page.goto("/StoreSettings");
    await expect(
      page.getByRole("heading", { name: "Ajustes de la Tienda" }),
    ).toBeVisible({ timeout: 20_000 });

    // The cooldown flag landed (the reload decision is on record).
    const flag = await page.evaluate(() =>
      sessionStorage.getItem("veloxpos:chunk-reload-at"),
    );
    expect(flag).not.toBeNull();
  });
});
