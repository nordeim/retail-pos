import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// Pins for remediation-plan-v7 (session V7, 2026-10-26) — the per-route
// document title system (the reference titles EVERY route — v6 measured only
// the root), the product image "Quitar" clear path (the stored data URL
// survived a remove+save because undefined keys never ride the PATCH), the
// settings logo preview (the v6 plan promised one; no img ever rendered),
// and numeric-input parity (the reference's modal fields are type=number).
// Every finding was measured LIVE on both apps (agent-browser); see
// docs/remediation-plan-v7.md §0. Pins written RED first.
// ---------------------------------------------------------------------------

const root = resolve(import.meta.dirname, "..");
const src = (p: string) => readFileSync(resolve(root, p), "utf8");

const router = () => src("src/lib/router.ts");
const page = () => src("src/app/page.tsx");
const notFound = () => src("src/app/not-found.tsx");
const notFoundTitle = () => src("src/app/not-found-title.tsx");
const signupLayout = () => src("src/app/signup/layout.tsx");
const inventory = () => src("src/components/views/inventory-view.tsx");
const settings = () => src("src/components/views/settings-view.tsx");
const validation = () => src("src/lib/validation.ts");

// ---- B1/M1 — the per-route document titles --------------------------------------

describe("B1/M1 — the reference's per-route document titles", () => {
  it("DOCUMENT_TITLES carries the reference's exact strings for all 8 views", async () => {
    const { DOCUMENT_TITLES } = await import("@/lib/router");
    expect(DOCUMENT_TITLES.terminal).toBe("VeloxPOS");
    expect(DOCUMENT_TITLES.dashboard).toBe("Dashboard | VeloxPOS");
    expect(DOCUMENT_TITLES.inventario).toBe("Inventory | VeloxPOS");
    expect(DOCUMENT_TITLES.ventas).toBe("Sales | VeloxPOS");
    expect(DOCUMENT_TITLES.cajas).toBe("Registers | VeloxPOS");
    expect(DOCUMENT_TITLES.cajeros).toBe("Cashiers | VeloxPOS");
    expect(DOCUMENT_TITLES.reportes).toBe("Reports | VeloxPOS");
    expect(DOCUMENT_TITLES.ajustes).toBe("Store Settings | VeloxPOS");
  });

  it("documentTitleForPath maps every canonical path (case-insensitive)", async () => {
    const { documentTitleForPath } = await import("@/lib/router");
    expect(documentTitleForPath("/")).toBe("VeloxPOS");
    expect(documentTitleForPath("/Dashboard")).toBe("Dashboard | VeloxPOS");
    expect(documentTitleForPath("/Inventory")).toBe("Inventory | VeloxPOS");
    expect(documentTitleForPath("/Sales")).toBe("Sales | VeloxPOS");
    expect(documentTitleForPath("/Registers")).toBe("Registers | VeloxPOS");
    expect(documentTitleForPath("/Cashiers")).toBe("Cashiers | VeloxPOS");
    expect(documentTitleForPath("/Reports")).toBe("Reports | VeloxPOS");
    expect(documentTitleForPath("/StoreSettings")).toBe("Store Settings | VeloxPOS");
    // Lowercase canonical names resolve (viewFromPath is case-insensitive).
    expect(documentTitleForPath("/dashboard")).toBe("Dashboard | VeloxPOS");
    // The Spanish aliases are NOT in NAV_ITEMS (viewFromPath classes them
    // unknown → terminal) — the title helper is CONSISTENT with the router:
    // they get the slug treatment, exactly like the reference's own 404 on
    // /Inventario ("Inventario | VeloxPOS" — its routes are exact).
    expect(documentTitleForPath("/Inventario")).toBe("Inventario | VeloxPOS");
  });

  it("documentTitleForPath title-cases unknown routes like the reference's 404", async () => {
    const { documentTitleForPath } = await import("@/lib/router");
    // Live-measured on the reference: "/foo-bar-baz" → "Foo Bar Baz | VeloxPOS"
    expect(documentTitleForPath("/foo-bar-baz")).toBe("Foo Bar Baz | VeloxPOS");
    expect(documentTitleForPath("/Nonexistent-Route-XYZ")).toBe(
      "Nonexistent Route XYZ | VeloxPOS",
    );
    // Unknown paths NEVER resolve to a view title.
    expect(documentTitleForPath("/no-such-view")).toBe("No Such View | VeloxPOS");
  });

  it("the shell syncs document.title with the active route (source pin)", () => {
    // V9/F2 alignment: the title is PATH-driven now (the reference's own
    // algorithm — exact-case canonical match, slug-case fallback), so the
    // shell reads documentTitleForPath(pathname) instead of the view's
    // canonical title. The v9 spec owns the full matrix; this pin keeps
    // asserting the shell wires A title effect at all.
    const s = page();
    expect(s).toContain("documentTitleForPath(window.location.pathname)");
    expect(s).toMatch(/document\.title\s*=/);
  });

  it("signup ships the reference's title via a server layout (source pin)", () => {
    const s = signupLayout();
    expect(s).toContain('"Signup | VeloxPOS"');
    expect(s).toContain("export const metadata");
  });

  it("not-found sets the slug title through the same pure helper (source pin)", () => {
    const s = notFoundTitle();
    expect(s).toContain("documentTitleForPath");
    expect(s).toContain("document.title");
    // The server page renders the client leaf and keeps the reference copy.
    const nf = notFound();
    expect(nf).toContain("NotFoundTitle");
    expect(nf).toContain("Página no encontrada");
  });
});

// ---- B2/F1+F3 — the image clear path -------------------------------------------

describe("B2/F1+F3 — Quitar actually clears the stored image", () => {
  it("the schema's imageUrl is nullable (null rides the PATCH)", async () => {
    const { productCreateSchema, productUpdateSchema } = await import("@/lib/validation");
    expect(productCreateSchema.safeParse({ name: "X", price: "10", imageUrl: null }).success).toBe(true);
    expect(productUpdateSchema.safeParse({ imageUrl: null }).success).toBe(true);
    // A data URL still parses.
    expect(
      productCreateSchema.safeParse({
        name: "X",
        price: "10",
        imageUrl: "data:image/jpeg;base64,abc",
      }).success,
    ).toBe(true);
  });

  it("the dialog sends null (not undefined) when the image is cleared", () => {
    const s = inventory();
    expect(s).toContain('imageUrl: imageUrl === "" ? null : imageUrl');
    expect(s).not.toContain("imageUrl: imageUrl === \"\" ? undefined : imageUrl");
  });

  it("the picker-cancel branch never touches the stored value (F3)", () => {
    const s = inventory();
    // The old branch cleared the preview on cancel; the new one returns bare.
    expect(s).not.toMatch(/if \(!file\) \{\s*setImageUrl\(""\);/);
  });
});

// ---- B3/V2 — numeric input parity ------------------------------------------------

describe("B3/V2 — the product dialog's numeric fields are type=number", () => {
  it("all five numeric fields carry type=\"number\" (source pin)", () => {
    const s = inventory();
    for (const id of ["product-price", "product-cost", "product-stock", "product-min-stock", "product-iva"]) {
      const re = new RegExp(`id="${id}"[\\s\\S]{0,200}?type="number"`);
      expect(s).toMatch(re);
    }
  });

  it("money fields step by cents, count fields by units (source pin)", () => {
    const s = inventory();
    expect(s).toMatch(/id="product-price"[\s\S]{0,200}?step="0\.01"/);
    expect(s).toMatch(/id="product-cost"[\s\S]{0,200}?step="0\.01"/);
  });
});

// ---- B4/F2 — the settings logo preview + remove ----------------------------------

describe("B4/F2 — the settings logo preview renders and clears", () => {
  it("the logo block renders an img preview of form.logoUrl (source pin)", () => {
    const s = settings();
    expect(s).toMatch(/form\.logoUrl\s*\?/);
    expect(s).toMatch(/<img[^>]+src=\{form\.logoUrl\}/);
  });

  it("a Quitar control clears the pending logo (source pin)", () => {
    const s = settings();
    expect(s).toMatch(/Quitar[\s\S]{0,400}/);
    expect(s).toMatch(/set\("logoUrl",\s*null\)/);
  });
});
