import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Sale } from "@/lib/store";

// ---------------------------------------------------------------------------
// Pins for remediation-plan-v8 (session V8, 2026-10-26) — the from_url
// deep-link round-trip (the reference bounces logged-out deep routes to
// /login?from_url=<url> and RETURNS there after sign-in; the clone landed
// on / unconditionally), the ticket-detail modal's measured layout (the
// reference's meta block is a 2×2 grid of stacked label/value cells, the
// lines read "{qty}x {name}" over light slate dividers, the Total is 18px
// bold, and there is no footer Close button), the mail action's recipient
// prompt ("Enviar ticket a:"), the Ajustes hex inputs, and the dialog
// family's measured chrome (#0f121a / #e7e9ef). Every finding was measured
// LIVE on both apps (agent-browser); see docs/remediation-plan-v8.md §0.
// Pins written RED first.
// ---------------------------------------------------------------------------

const root = resolve(import.meta.dirname, "..");
const src = (p: string) => readFileSync(resolve(root, p), "utf8");

const router = () => src("src/lib/router.ts");
const page = () => src("src/app/page.tsx");
const login = () => src("src/components/auth/login-surface.tsx");
const sales = () => src("src/components/views/sales-view.tsx");
const settings = () => src("src/components/views/settings-view.tsx");
const ticketMail = () => src("src/lib/ticket-mail.ts");
const terminal = () => src("src/components/views/terminal-view.tsx");
const inventory = () => src("src/components/views/inventory-view.tsx");
const cashiers = () => src("src/components/views/cashiers-view.tsx");
const registers = () => src("src/components/views/registers-view.tsx");

// ---- B1/F1 — the from_url deep-link round-trip -----------------------------------

describe("B1/F1 — safeReturnTo guards the post-login destination", () => {
  it("returns same-origin absolute URLs as their path (+search)", async () => {
    const { safeReturnTo } = await import("@/lib/router");
    const origin = "http://localhost:3000";
    expect(safeReturnTo("http://localhost:3000/Dashboard", origin)).toBe("/Dashboard");
    expect(safeReturnTo("http://localhost:3000/Reports?days=30", origin)).toBe(
      "/Reports?days=30",
    );
  });

  it("returns relative paths as-is (search preserved)", async () => {
    const { safeReturnTo } = await import("@/lib/router");
    const origin = "http://localhost:3000";
    expect(safeReturnTo("/Dashboard", origin)).toBe("/Dashboard");
    expect(safeReturnTo("/Reports?days=90", origin)).toBe("/Reports?days=90");
  });

  it("fails CLOSED on foreign origins and dangerous schemes", async () => {
    const { safeReturnTo } = await import("@/lib/router");
    const origin = "http://localhost:3000";
    expect(safeReturnTo("https://evil.example/steal", origin)).toBe("/");
    expect(safeReturnTo("http://localhost:9999/other", origin)).toBe("/");
    expect(safeReturnTo("//evil.example/x", origin)).toBe("/");
    expect(safeReturnTo("javascript:alert(1)", origin)).toBe("/");
    expect(safeReturnTo("data:text/html,hi", origin)).toBe("/");
  });

  it("never loops back to /login and treats empty as home", async () => {
    const { safeReturnTo } = await import("@/lib/router");
    const origin = "http://localhost:3000";
    expect(safeReturnTo("/login", origin)).toBe("/");
    expect(safeReturnTo("/login?from_url=x", origin)).toBe("/");
    expect(safeReturnTo("", origin)).toBe("/");
    expect(safeReturnTo(null, origin)).toBe("/");
    expect(safeReturnTo(undefined, origin)).toBe("/");
  });
});

describe("B1/F1 — the 401 gate carries from_url (source pins)", () => {
  it("page.tsx redirects to /login with the current URL encoded", () => {
    const s = page();
    expect(s).toMatch(/\/login\?from_url=/);
    expect(s).toContain("encodeURIComponent");
  });

  it("login-surface returns through safeReturnTo after sign-in", () => {
    const s = login();
    expect(s).toContain("from_url");
    expect(s).toContain("safeReturnTo");
  });
});

// ---- B2/F2 — the ticket-detail modal's measured layout ----------------------------

describe("B2/F2 — the ticket-detail modal matches the reference's layout", () => {
  it("the meta block is the reference's 2×2 grid of stacked cells", () => {
    const s = sales();
    expect(s).toContain("grid grid-cols-2 gap-3 text-sm");
    // Stacked label/value cells: slate-500 label, font-medium value.
    expect(s).toMatch(/dt[^>]*text-slate-500/);
    expect(s).toMatch(/dd[^>]*font-medium/);
  });

  it("item lines read '{qty}x {name}' — the reference's format", () => {
    const s = sales();
    expect(s).toContain("{item.qty}x {item.name}");
    expect(s).not.toContain("{item.qty}</strong> ×");
  });

  it("the dividers are the reference's light slate hairlines", () => {
    const s = sales();
    expect(s).toMatch(/border-t border-slate-100 pt-3/);
    expect(s).toMatch(/border-t border-slate-200 pt-3/);
    expect(s).not.toContain("border-t border-[#1e2235]");
  });

  it("the Total row is the reference's 18px bold closer", () => {
    const s = sales();
    expect(s).toMatch(/text-lg font-bold/);
    expect(s).not.toContain("text-base font-bold text-slate-100");
  });

  it("the title icon is the reference's Receipt in indigo", () => {
    const s = sales();
    expect(s).toContain('<Receipt className="h-5 w-5 text-indigo-500" />');
    // The modal title no longer uses the old violet ReceiptText (the
    // table's empty-state icon may keep its own).
    expect(s).not.toMatch(/DialogTitle[\s\S]{0,200}ReceiptText/);
  });

  it("there is NO footer Close button (the X alone closes)", () => {
    const s = sales();
    expect(s).not.toMatch(/Close<\/Button>/);
    expect(s).not.toContain("flex justify-end");
  });
});

// ---- B2/F5 — the dialog family's measured chrome ----------------------------------

describe("B2/F5 — every dialog rides the measured #0f121a / #e7e9ef chrome", () => {
  const dialogSites = [
    ["sales-view", sales],
    ["terminal-view", terminal],
    ["inventory-view", inventory],
    ["cashiers-view", cashiers],
    ["registers-view", registers],
  ] as const;

  it("every DialogContent carries bg-[#0f121a] text-[#e7e9ef]", () => {
    for (const [name, read] of dialogSites) {
      const s = read();
      const sites = s.match(/DialogContent className="[^"]*"/g) ?? [];
      expect(sites.length, `${name} has dialogs`).toBeGreaterThan(0);
      for (const site of sites) {
        expect(site, `${name}: ${site}`).toContain("bg-[#0f121a]");
        expect(site, `${name}: ${site}`).toContain("text-[#e7e9ef]");
        expect(site, `${name}: ${site}`).not.toContain("bg-[#12141f]");
        expect(site, `${name}: ${site}`).not.toContain("text-slate-100");
      }
    }
  });
});

// ---- B3/F3 — the mail recipient prompt --------------------------------------------

describe("B3/F3 — the mail action prompts for the recipient first", () => {
  it("sendByEmail prompts with the reference's copy (source pin)", () => {
    const s = sales();
    expect(s).toContain('window.prompt("Enviar ticket a:")');
  });

  it("a cancelled prompt is a no-op (source pin)", () => {
    const s = sales();
    expect(s).toMatch(/if \(!to\) return;/);
  });

  it("buildTicketMailto carries the entered address", async () => {
    const { buildTicketMailto } = await import("@/lib/ticket-mail");
    const sale: Sale = {
      id: "s1",
      ticketNo: "V-TEST0008",
      createdAt: "2026-10-26T12:00:00.000Z",
      cashierName: "Ana",
      registerName: "Caja 1",
      clientName: "",
      method: "efectivo",
      status: "completada",
      registerId: "r1",
      shiftId: "sh1",
      items: [
        { id: "i1", productId: "p1", name: "Coca-Cola 600ml", qty: 1, unitPrice: 1850, ivaRate: 16, lineTotal: 2146 },
      ],
      subtotal: 1850,
      tax: 296,
      total: 2146,
    };
    const addressed = buildTicketMailto(sale, "cliente@tienda.mx");
    expect(addressed.startsWith("mailto:cliente@tienda.mx?subject=")).toBe(true);
    // Back-compat: without a recipient the old shape holds (v6 pins rely on it).
    const bare = buildTicketMailto(sale);
    expect(bare.startsWith("mailto:?subject=")).toBe(true);
  });
});

// ---- B4/F4 — the Ajustes hex inputs ------------------------------------------------

describe("B4/F4 — each color swatch pairs with an editable hex input", () => {
  it("the Personalización rows bind hex Inputs to the same fields (source pin)", () => {
    const s = settings();
    expect(s).toMatch(/value=\{form\.primaryColor\}[\s\S]{0,400}?onChange=\{\(event\) => set\("primaryColor", event\.target\.value\)\}/);
    expect(s).toMatch(/value=\{form\.secondaryColor\}[\s\S]{0,400}?onChange=\{\(event\) => set\("secondaryColor", event\.target\.value\)\}/);
    expect(s).toContain('data-testid="settings-primary-hex"');
    expect(s).toContain('data-testid="settings-secondary-hex"');
    // The static spans are gone.
    expect(s).not.toMatch(/<span className="text-sm text-slate-400">\{form\.(primary|secondary)Color\}<\/span>/);
  });

  it("the wrapper + rows match the reference's geometry (source pin)", () => {
    const s = settings();
    expect(s).toContain("grid grid-cols-1 gap-4 md:grid-cols-2");
    expect(s).toContain("flex items-center gap-3 mt-1");
  });
});
