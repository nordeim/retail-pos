import { defineConfig } from "vitest/config";
import path from "node:path";

// Unit-test layer for the VeloxPOS retail suite (R2 of the v3 remediation:
// the stale study-app census narrative is retired with the pivot's own
// headers). The pure domain seams — money, auth, validation, date, router,
// db-path, env-check, schema contract, terminal/sale integrity, security
// hardening, visual parity, hygiene — live in tests/*.test.ts (Vitest,
// node environment). Coverage intent: every pure seam that a route or view
// consumes is behavior-pinned; server files that need next/headers at
// import time are pinned via source contracts instead (the codebase's
// established idiom).
//
// Browser/E2E coverage lives in tests/e2e/*.spec.ts (Playwright — never
// picked up by this config, which matches *.test.ts only; the standalone
// production server is booted by playwright.config.ts's webServer).
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
});
