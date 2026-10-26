import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Sale } from "@/lib/store";

// ---------------------------------------------------------------------------
// Pins for remediation-plan-v6 (session V6, 2026-10-26) — the
// functional-superset completion: dead controls wired (Unidad, image
// uploads, ticket mail), silent failure paths surfaced through the toaster,
// dialog chrome (42px glass buttons), the sidebar tile's violet glow, and
// the document head suite (title/OG/Twitter/apple/manifest/icon). Every
// finding was measured LIVE on both apps (agent-browser); see
// docs/remediation-plan-v6.md §0. Pins written RED first.
// ---------------------------------------------------------------------------

const root = resolve(import.meta.dirname, "..");
const src = (p: string) => readFileSync(resolve(root, p), "utf8");

const inventory = () => src("src/components/views/inventory-view.tsx");
const cashiers = () => src("src/components/views/cashiers-view.tsx");
const registers = () => src("src/components/views/registers-view.tsx");
const sales = () => src("src/components/views/sales-view.tsx");
const settings = () => src("src/components/views/settings-view.tsx");
const sidebar = () => src("src/components/layout/sidebar.tsx");
const mobileChrome = () => src("src/components/layout/mobile-chrome.tsx");
const layout = () => src("src/app/layout.tsx");
const validation = () => src("src/lib/validation.ts");
const store = () => src("src/lib/store.ts");

// ---- B1/F1 — the Unidad field ------------------------------------------------

describe("B1/F1 — UNITS is the reference's six plus the clone's Servicio", () => {
  it("carries Metro and Caja (the reference's extra units)", async () => {
    const { UNITS } = await import("@/lib/validation");
    expect(UNITS).toContain("Metro");
    expect(UNITS).toContain("Caja");
  });

  it("keeps the full reference set and the documented Servicio superset", async () => {
    const { UNITS } = await import("@/lib/validation");
    for (const u of ["Pieza", "Kilogramo", "Litro", "Metro", "Caja", "Paquete", "Servicio"]) {
      expect(UNITS).toContain(u);
    }
    expect(UNITS).toHaveLength(7);
  });

  it("the product dialog's Unidad select is wired (testid for e2e)", () => {
    const s = inventory();
    expect(s).toContain('data-testid="product-unit-select"');
    expect(s).toMatch(/Unidad/);
    expect(s).toContain("setUnit");
  });
});

// ---- B2/F2 — the product image upload ----------------------------------------

describe("B2/F2 — image files become stored data URLs", () => {
  it("image.ts exports the size guard and the data-URL conversion", async () => {
    const mod = await import("@/lib/image");
    expect(typeof mod.fileToDataUrl).toBe("function");
    expect(typeof mod.validateImageFile).toBe("function");
    expect(mod.MAX_IMAGE_BYTES).toBe(300 * 1024);
  });

  it("rejects oversized and non-image sources with typed reasons", async () => {
    const { validateImageFile } = await import("@/lib/image");
    expect(validateImageFile({ size: 1024, type: "image/png" }).ok).toBe(true);
    const oversize = validateImageFile({ size: 301 * 1024, type: "image/png" });
    expect(oversize.ok).toBe(false);
    if (!oversize.ok) expect(oversize.reason).toBe("too-large");
    const wrongType = validateImageFile({ size: 1024, type: "application/pdf" });
    expect(wrongType.ok).toBe(false);
    if (!wrongType.ok) expect(wrongType.reason).toBe("not-an-image");
  });

  it("the product payload sends imageUrl (no more void imageFile)", () => {
    const s = inventory();
    expect(s).toContain("imageUrl");
    expect(s).not.toContain("void imageFile");
  });

  it("the schema accepts data-URL-sized imageUrl values", async () => {
    const { productCreateSchema } = await import("@/lib/validation");
    const longDataUrl = `data:image/jpeg;base64,${"a".repeat(599_000)}`;
    const parsed = productCreateSchema.safeParse({
      name: "X",
      price: "100",
      imageUrl: longDataUrl,
    });
    expect(parsed.success).toBe(true);
    const tooLong = productCreateSchema.safeParse({
      name: "X",
      price: "100",
      imageUrl: `data:image/jpeg;base64,${"a".repeat(600_001)}`,
    });
    expect(tooLong.success).toBe(false);
  });
});

// ---- B3/F2b — the settings logo upload ---------------------------------------

describe("B3/F2b — logoUrl flows through the settings seam", () => {
  it("settingsSchema accepts a data-URL logoUrl", async () => {
    const { settingsSchema } = await import("@/lib/validation");
    const parsed = settingsSchema.safeParse({
      name: "Mi Tienda",
      logoUrl: `data:image/jpeg;base64,${"a".repeat(599_000)}`,
    });
    expect(parsed.success).toBe(true);
    // The DB column boots as NULL (the untouched logo) — the round-trip
    // PATCH must accept it back (the e2e settings save caught this).
    expect(settingsSchema.safeParse({ name: "Mi Tienda", logoUrl: null }).success).toBe(true);
  });

  it("StoreSettings carries logoUrl for the client form", () => {
    expect(store()).toContain("logoUrl");
  });

  it("the settings form reads the picked file (no filename-only no-op)", () => {
    const s = settings();
    expect(s).toContain("fileToDataUrl");
    expect(s).toContain("logoUrl");
  });

  it("the sidebar does NOT render the store logo (reference parity — L9)", () => {
    expect(sidebar()).not.toContain("logoUrl");
  });
});

// ---- B4/F3 — mutation failures surface through the toaster --------------------

describe("B4/F3 — the four silent deletes toast their failures", () => {
  it("inventory delete surfaces the error (no bare void err)", () => {
    const s = inventory();
    expect(s).toContain("useToast");
    expect(s).toMatch(/toast\.error/);
  });

  it("cashiers delete surfaces the error", () => {
    const s = cashiers();
    expect(s).toContain("useToast");
    expect(s).toMatch(/toast\.error/);
  });

  it("registers delete surfaces the error", () => {
    const s = registers();
    expect(s).toContain("useToast");
    expect(s).toMatch(/toast\.error/);
  });

  it("settings category delete surfaces the error", () => {
    const s = settings();
    expect(s).toMatch(/toast\.error/);
  });
});

// ---- B5/F4 — the ticket mail button ------------------------------------------

describe("B5/F4 — buildTicketMailto formats a real mailto: payload", () => {
  it("builds subject + body from a sale", async () => {
    const { buildTicketMailto } = await import("@/lib/ticket-mail");
    const sale: Sale = {
      id: "s1",
      ticketNo: "V-TEST0001",
      createdAt: "2026-10-26T12:00:00.000Z",
      cashierName: "Ana",
      registerName: "Caja 1",
      clientName: "Luis",
      method: "efectivo",
      status: "completada",
      registerId: "r1",
      shiftId: "sh1",
      items: [
        { id: "i1", productId: "p1", name: "Leche Lala 1L", qty: 2, unitPrice: 2650, ivaRate: 16, lineTotal: 5300 },
        { id: "i2", productId: "p2", name: "Pan", qty: 1, unitPrice: 2500, ivaRate: 0, lineTotal: 2500 },
      ],
      subtotal: 6923,
      tax: 877,
      total: 7800,
    };
    const mailto = buildTicketMailto(sale);
    expect(mailto.startsWith("mailto:?subject=")).toBe(true);
    const [head, body] = mailto.split("&body=");
    expect(decodeURIComponent(head)).toContain("V-TEST0001");
    const decoded = decodeURIComponent(body.replace(/\+/g, " "));
    expect(decoded).toContain("Leche Lala 1L");
    expect(decoded).toContain("2 x");
    expect(decoded).toContain("$78.00");
    expect(decoded).toContain("Total");
  });

  it("handles sales without client/register gracefully", async () => {
    const { buildTicketMailto } = await import("@/lib/ticket-mail");
    const mailto = buildTicketMailto({
      id: "s2",
      ticketNo: "V-TEST0002",
      createdAt: "2026-10-26T12:00:00.000Z",
      cashierName: "Ana",
      registerName: "",
      clientName: "",
      method: "tarjeta",
      status: "completada",
      registerId: null,
      shiftId: null,
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
    });
    expect(mailto.startsWith("mailto:?subject=")).toBe(true);
    const decoded = decodeURIComponent(mailto);
    expect(decoded).not.toContain("null");
    expect(decoded).not.toContain("undefined");
    expect(decoded).not.toContain("Caja:");
    expect(decoded).not.toContain("Cliente:");
  });

  it("the sales row mail button is wired to the handler", () => {
    const s = sales();
    expect(s).toContain("buildTicketMailto");
    const mailBtn = s.match(/aria-label=\{`Enviar ticket[^`]*`\}[\s\S]{0,400}?<\/button>/);
    expect(mailBtn).not.toBeNull();
    if (mailBtn) expect(mailBtn[0]).toContain("onClick");
  });
});

// ---- B6/V1 — dialog chrome (42px glass buttons) -------------------------------

describe("B6/V1 — dialog submit/cancel are the reference's 42px glass buttons", () => {
  it("the product dialog's submit carries h-auto + a visible Save icon", () => {
    const s = inventory();
    expect(s).toContain('glass-button-primary h-auto rounded-xl px-4 py-2.5 text-sm font-medium');
    expect(s).toContain("<Save");
    expect(s).not.toContain('className="mr-1 hidden"');
    expect(s).not.toContain("Upload");
  });

  it("the product dialog's cancel carries text-slate-700", () => {
    expect(inventory()).toContain(
      "glass-button h-auto rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700",
    );
  });

  it("the cashier dialog buttons match the same contract", () => {
    const s = cashiers();
    expect(s).toContain('glass-button-primary h-auto rounded-xl px-4 py-2.5 text-sm font-medium');
    expect(s).toContain(
      "glass-button h-auto rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700",
    );
  });

  it("the register dialog buttons match the same contract", () => {
    const s = registers();
    expect(s).toContain('glass-button-primary h-auto rounded-xl px-4 py-2.5 text-sm font-medium');
    expect(s).toContain(
      "glass-button h-auto rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700",
    );
  });
});

// ---- F6 — the glass channel (no cva utilities clobber the glass fills) --------

describe("F6 — Button ships a glass variant and every glass site uses it", () => {
  it("button.tsx declares the empty glass channel (utilities ride the call site)", () => {
    const s = src("src/components/ui/button.tsx");
    expect(s).toContain('glass: ""');
  });

  it("no glass call site still carries a clobbering variant", () => {
    const views = [
      "cashiers-view.tsx",
      "inventory-view.tsx",
      "registers-view.tsx",
      "settings-view.tsx",
      "terminal-view.tsx",
    ];
    for (const v of views) {
      const s = src(`src/components/views/${v}`);
      const blocks = s.match(/<Button\n(?:(?!<\/Button>|<Button>)[\s\S])*?className="glass-button/g) ?? [];
      for (const block of blocks) {
        expect(block, v).toContain('variant="glass"');
        expect(block, v).not.toContain('variant="outline"');
      }
    }
  });
});

// ---- B7/V2 — the sidebar tile's violet glow -----------------------------------

describe("B7/V2 — the branding tile carries the reference's violet glow", () => {
  it("the desktop sidebar tile: shadow-lg shadow-violet-500/30 + strokeWidth 2", () => {
    const s = sidebar();
    expect(s).toContain("bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30");
    expect(s).not.toMatch(/from-violet-500 to-indigo-600 shadow"\s*>/);
    expect(s).toContain('strokeWidth={2}');
  });

  it("the mobile chrome tiles match (drawer header + app bar)", () => {
    const s = mobileChrome();
    expect(s).toContain("shadow-lg shadow-violet-500/30");
    expect(s).toContain('strokeWidth={2}');
  });
});

// ---- B8/V3+V4 — product dialog polish -----------------------------------------

describe("B8/V3+V4 — the product dialog's controls follow contract 13", () => {
  it("no input in the product dialog carries a solid fill", () => {
    expect(inventory()).not.toContain('bg-[#0d0f1a]"');
  });

  it("price/cost ship no 0.00 placeholders (the reference has none)", () => {
    const s = inventory();
    expect(s).not.toContain('placeholder="0.00"');
  });
});

// ---- B9/M1-M3 — the document head suite ---------------------------------------

describe("B9/M1 — layout metadata matches the reference's head", () => {
  it('the tab title is exactly "VeloxPOS"', () => {
    const s = layout();
    expect(s).toContain('title: "VeloxPOS"');
    expect(s).not.toContain("Punto de venta");
  });

  it("carries the reference's description verbatim", () => {
    expect(layout()).toContain(
      "A sophisticated, glass-inspired point of sale and inventory management system for modern retailers.",
    );
  });

  it("ships the openGraph + twitter + appleWebApp + manifest config", () => {
    const s = layout();
    expect(s).toContain("openGraph:");
    expect(s).toContain("summary_large_image");
    expect(s).toContain("appleWebApp");
    expect(s).toContain('statusBarStyle: "black"');
    expect(s).toContain('manifest: "/manifest.json"');
  });
});

describe("B9/M2+M3 — head assets exist and the study-app remnant is gone", () => {
  it("the app-router icon + apple icon are the VeloxPOS logo", () => {
    expect(existsSync(resolve(root, "src/app/icon.png"))).toBe(true);
    expect(existsSync(resolve(root, "src/app/apple-icon.png"))).toBe(true);
  });

  it("the orphaned study-app favicon.svg is deleted", () => {
    expect(existsSync(resolve(root, "public/favicon.svg"))).toBe(false);
  });

  it("the og image + a working manifest ship in public/", () => {
    expect(existsSync(resolve(root, "public/og-image.png"))).toBe(true);
    const manifest = JSON.parse(readFileSync(resolve(root, "public/manifest.json"), "utf8"));
    expect(manifest.name).toBe("VeloxPOS");
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    expect(manifest.theme_color).toBe("#080a14");
  });
});
