import { describe, expect, it } from "vitest";
import {
  THEME_BOOT_SCRIPT,
  THEME_CACHE_KEY,
  parseThemeCache,
  themeCachePayload,
} from "@/lib/theme";

// S11-1 — the localStorage cache contract between applyToDocument (the
// writer, src/lib/store.ts) and the pre-paint boot script (the reader,
// injected into <head> by layout.tsx). The script is a hand-maintained
// inline string that cannot import this module — THESE tests are the sync
// contract: change the payload shape here and the script must follow.

describe("theme cache payload", () => {
  it("serializes mode + accent as compact JSON", () => {
    expect(themeCachePayload("dark", "violet")).toBe('{"mode":"dark","accent":"violet"}');
    expect(themeCachePayload("system", "teal")).toBe('{"mode":"system","accent":"teal"}');
  });

  it("round-trips through parseThemeCache", () => {
    for (const mode of ["light", "dark", "system"] as const) {
      const parsed = parseThemeCache(themeCachePayload(mode, "blue"));
      expect(parsed).toEqual({ mode, accent: "blue" });
    }
  });
});

describe("parseThemeCache (the boot script's parse, pinned)", () => {
  it("accepts a valid payload", () => {
    expect(parseThemeCache('{"mode":"dark","accent":"red"}')).toEqual({ mode: "dark", accent: "red" });
  });

  it("returns null for null / empty / garbage", () => {
    expect(parseThemeCache(null)).toBeNull();
    expect(parseThemeCache("")).toBeNull();
    expect(parseThemeCache("not json")).toBeNull();
    expect(parseThemeCache("{")).toBeNull();
  });

  it("returns null for structurally valid JSON with invalid values", () => {
    expect(parseThemeCache('{"mode":"neon","accent":"violet"}')).toBeNull();
    expect(parseThemeCache('{"mode":"dark","accent":"chartreuse"}')).toBeNull();
    expect(parseThemeCache('{"accent":"violet"}')).toBeNull();
    expect(parseThemeCache("[]")).toBeNull();
    expect(parseThemeCache("42")).toBeNull();
  });
});

describe("THEME_CACHE_KEY", () => {
  it("is the key the boot script reads (sf-theme)", () => {
    // The boot script hardcodes the literal — this pin fails if the key
    // drifts, forcing the script string to be updated in the same change.
    expect(THEME_CACHE_KEY).toBe("sf-theme");
  });
});

describe("THEME_BOOT_SCRIPT (S12-C1 — the print handlers, pinned)", () => {
  it("registers beforeprint/afterprint listeners that force light for print", () => {
    // The script is hand-maintained and cannot import this module — these
    // presence pins are the sync contract: removing or renaming the print
    // handlers must fail here and force the string to be updated in the
    // same change (the S11 cache-format convention, applied to S12).
    expect(THEME_BOOT_SCRIPT).toContain("beforeprint");
    expect(THEME_BOOT_SCRIPT).toContain("afterprint");
    // The handler must remember the pre-print dark state so afterprint can
    // restore it (the __sfPrintDark flag is the script's own convention).
    expect(THEME_BOOT_SCRIPT).toContain("__sfPrintDark");
  });

  it("still applies the cached mode pre-paint (the S11 contract holds)", () => {
    expect(THEME_BOOT_SCRIPT).toContain('localStorage.getItem("sf-theme")');
    expect(THEME_BOOT_SCRIPT).toContain("classList.add(\"dark\")");
  });
});
