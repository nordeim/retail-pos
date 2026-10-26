// ---------------------------------------------------------------------------
// The Prisma schema contract: the retail models, ownership cascades, money
// as integer cents, and the db/ folder placement the .env contract demands.
// ---------------------------------------------------------------------------

import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const SCHEMA_PATH = path.join(import.meta.dirname, "..", "prisma", "schema.prisma");

function schema(): string {
  return readFileSync(SCHEMA_PATH, "utf8");
}

describe("the retail schema", () => {
  it("declares exactly the retail models + the auth pair", () => {
    const models = [...schema().matchAll(/^model (\w+)/gm)].map((m) => m[1]);
    expect(models).toEqual([
      "User",
      "VerificationToken",
      "PasswordResetToken",
      "StoreSetting",
      "Category",
      "Product",
      "Register",
      "Cashier",
      "Shift",
      "Sale",
      "SaleItem",
    ]);
  });

  it("uses SQLite through the DATABASE_URL env", () => {
    expect(schema()).toContain('provider = "sqlite"');
    expect(schema()).toContain('url      = env("DATABASE_URL")');
  });

  it("scopes every retail model to the owner with cascade delete", () => {
    const text = schema();
    for (const model of ["StoreSetting", "Category", "Product", "Register", "Cashier", "Shift", "Sale"]) {
      const block = text.slice(text.indexOf(`model ${model} `));
      const body = block.slice(0, block.indexOf("\n}"));
      expect(body).toContain("userId");
      expect(body).toContain("onDelete: Cascade");
    }
  });

  it("stores money as integer cents (no Float anywhere)", () => {
    expect(schema()).not.toMatch(/^\s*\w+\s+Float/m);
    for (const field of ["price      Int", "subtotal    Int", "tax         Int", "total       Int", "openingFloat  Int", "lineTotal Int"]) {
      expect(schema()).toContain(field);
    }
  });

  it("keeps sale history when products/registers vanish (SetNull)", () => {
    expect(schema()).toContain("productId String?");
    expect(schema()).toContain("registerId  String?");
    expect(schema()).toContain("onDelete: SetNull");
  });

  it("names the product/category pair-unique for the seed upserts", () => {
    expect(schema()).toContain("@@unique([userId, name])");
  });

  it("carries the shift lifecycle fields", () => {
    const text = schema();
    expect(text).toContain("openingFloat  Int");
    expect(text).toContain("closingAmount Int?");
    expect(text).toContain('status        String    @default("open")');
  });
});

describe("the .env contract", () => {
  it("points DATABASE_URL at ../db/custom.db (schema-anchored → <repo>/db/custom.db)", () => {
    const env = readFileSync(path.join(import.meta.dirname, "..", ".env"), "utf8");
    expect(env).toContain('DATABASE_URL="file:../db/custom.db"');
  });

  it("keeps the documented default in .env.example", () => {
    const example = readFileSync(
      path.join(import.meta.dirname, "..", ".env.example"),
      "utf8",
    );
    expect(example).toContain("file:../db/custom.db");
  });
});
