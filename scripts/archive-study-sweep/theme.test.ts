import { describe, expect, it } from "vitest";
import {
  ACCENTS,
  ACCENT_TOKENS,
  AVATAR_EMOJIS,
  NAV_ACTIVE_GRADIENT_STOPS,
  THEME_BOOT_SCRIPT,
  accentCssVars,
  isAccent,
  isThemeMode,
  resolveMode,
} from "@/lib/theme";

describe("ACCENT_TOKENS", () => {
  it("carries the measured violet default (139 92 246 = #8b5cf6)", () => {
    expect(ACCENT_TOKENS.violet.primary).toBe("139 92 246");
    expect(ACCENT_TOKENS.violet.primaryFg).toBe("255 255 255");
    expect(ACCENT_TOKENS.violet.strong).toBe("124 58 237"); // violet-600 links
  });

  it("pins the clock chip's second gradient stop to the measured indigo-50", () => {
    // Reference clock chip (measured): linear-gradient(to right bottom,
    // rgb(245,243,255), rgb(238,242,255)) — violet-50 → indigo-50 exactly.
    expect(ACCENT_TOKENS.violet.softest).toBe("245 243 255");
    expect(ACCENT_TOKENS.violet.softestAdjacent).toBe("238 242 255");
  });

  it("pins the S4-G gradient tokens to the measured reference stops", () => {
    // Brand chips + CTA end at indigo-600 (measured rgb(79,70,229)), the
    // avatar uses the LIGHTER violet-400 → indigo-500 pair (measured
    // rgb(167,139,250) → rgb(99,102,241)), and the empty-state block
    // runs violet-100 → indigo-100 (measured rgb(237,233,254) →
    // rgb(224,231,255)). The clone previously routed all of these through
    // primary/strong (violet-500 → violet-600).
    expect(ACCENT_TOKENS.violet.gradientTo).toBe("79 70 229"); // indigo-600
    expect(ACCENT_TOKENS.violet.avatarFrom).toBe("167 139 250"); // violet-400
    expect(ACCENT_TOKENS.violet.avatarTo).toBe("99 102 241"); // indigo-500
    expect(ACCENT_TOKENS.violet.emptyFrom).toBe("237 233 254"); // violet-100
    expect(ACCENT_TOKENS.violet.emptyTo).toBe("224 231 255"); // indigo-100
  });

  it("carries the S5 gradient hover stop (adjacent-hue 700-level)", () => {
    // The reference's gradient CTAs hover to from-violet-600 → to-indigo-700
    // (class list measured) — the hover pair needs its own token because the
    // 700-level of the ADJACENT hue cannot be derived from the accent.
    expect(ACCENT_TOKENS.violet.gradientToStrong).toBe("67 56 202"); // indigo-700 #4338CA
  });

  it("pins the active-nav gradient to primary → avatarTo (S8-A, measured)", () => {
    // Live reference (violet accent): the active nav item's tint renders
    // linear-gradient(to right, rgba(139,92,246,0.1), rgba(99,102,241,0.1))
    // — the second stop is indigo-500 (avatarTo), NOT violet-600 (strong).
    // The clone previously routed stop 2 through --sf-primary-strong.
    // toCssVar is the kebab-case CSS suffix consumed by nav-items.tsx
    // (a camelCase-only value silently resolves no var — the S8 e2e lesson).
    expect(NAV_ACTIVE_GRADIENT_STOPS).toEqual({
      from: "primary",
      to: "avatarTo",
      toCssVar: "avatar-to",
      alpha: 0.1,
    });
    expect(NAV_ACTIVE_GRADIENT_STOPS.toCssVar).not.toContain(/[A-Z]/);
  });

  it("migrated green to the EMERALD family (S5-F: the reference swatch is emerald-500)", () => {
    // The reference's Appearance accent swatches measured: green =
    // rgb(16,185,129) = emerald-500 (NOT green-500 rgb(34,197,94)). The
    // applied accent tokens now match the swatch face exactly.
    expect(ACCENT_TOKENS.green.primary).toBe("16 185 129"); // emerald-500
    expect(ACCENT_TOKENS.green.strong).toBe("5 150 105"); // emerald-600
    expect(ACCENT_TOKENS.green.deep).toBe("4 120 87"); // emerald-700
    expect(ACCENT_TOKENS.green.soft).toBe("209 250 229"); // emerald-100
    expect(ACCENT_TOKENS.green.softest).toBe("236 253 245"); // emerald-50
    expect(ACCENT_TOKENS.green.softDark).toBe("6 78 59"); // emerald-900
    expect(ACCENT_TOKENS.green.strongDark).toBe("110 231 183"); // emerald-300
    expect(ACCENT_TOKENS.green.avatarFrom).toBe("52 211 153"); // emerald-400
  });

  it("migrated orange to the AMBER family (S5-F: the reference swatch is amber-500)", () => {
    // The reference's orange swatch measured rgb(245,158,11) = amber-500
    // (NOT orange-500 rgb(249,115,22)).
    expect(ACCENT_TOKENS.orange.primary).toBe("245 158 11"); // amber-500
    expect(ACCENT_TOKENS.orange.strong).toBe("217 119 6"); // amber-600
    expect(ACCENT_TOKENS.orange.deep).toBe("180 83 9"); // amber-700
    expect(ACCENT_TOKENS.orange.soft).toBe("254 243 199"); // amber-100
    expect(ACCENT_TOKENS.orange.softest).toBe("255 251 235"); // amber-50
    expect(ACCENT_TOKENS.orange.softDark).toBe("120 53 15"); // amber-900
    expect(ACCENT_TOKENS.orange.strongDark).toBe("252 211 77"); // amber-300
    expect(ACCENT_TOKENS.orange.avatarFrom).toBe("251 191 36"); // amber-400
  });

  it("defines all seven reference accents", () => {
    expect([...ACCENTS]).toEqual([
      "violet",
      "blue",
      "green",
      "orange",
      "pink",
      "red",
      "teal",
    ]);
  });

  it("uses RGB-triplet strings for every token (the reference's convention)", () => {
    for (const accent of ACCENTS) {
      const token = ACCENT_TOKENS[accent];
      for (const value of Object.values(token)) {
        expect(value).toMatch(/^\d+ \d+ \d+$/);
      }
    }
  });
});

describe("isAccent / isThemeMode", () => {
  it("accepts the valid values and rejects the rest", () => {
    expect(isAccent("violet")).toBe(true);
    expect(isAccent("teal")).toBe(true);
    expect(isAccent("purple")).toBe(false);
    expect(isAccent("")).toBe(false);
    expect(isThemeMode("light")).toBe(true);
    expect(isThemeMode("dark")).toBe(true);
    expect(isThemeMode("system")).toBe(true);
    expect(isThemeMode("auto")).toBe(false);
  });
});

describe("resolveMode", () => {
  it("passes explicit modes through and resolves system against the preference", () => {
    expect(resolveMode("light", true)).toBe("light");
    expect(resolveMode("dark", false)).toBe("dark");
    expect(resolveMode("system", true)).toBe("dark");
    expect(resolveMode("system", false)).toBe("light");
  });
});

describe("accentCssVars", () => {
  it("emits the --sf-* variable set for :root", () => {
    const vars = accentCssVars("violet");
    expect(vars["--sf-primary"]).toBe("139 92 246");
    expect(Object.keys(vars)).toContain("--sf-primary-soft");
    expect(Object.keys(vars)).toContain("--sf-primary-strong-dark");
    expect(vars["--sf-primary-softest-adjacent"]).toBe("238 242 255");
  });

  it("emits the COMPLETE token set — deep/softest/adjacent + S4-G gradients + S5 hover stop included (S3-J regression pin)", () => {
    // applyToDocument historically wrote only 6 of the tokens; the rest kept
    // the violet :root defaults, so non-violet accents left the clock violet.
    // S4-G extends the set with the gradient stops; S5 adds the gradient
    // hover stop; S88/AO5 adds the dedicated clock-date-dark text token
    // (16 vars total — the I2 cross-consumer decoupling: avatarFrom served
    // the avatar gradient AND the dark clock-date text; retuning the avatar
    // 400-step would have silently restyled the sidebar date on all 20
    // views. The dedicated token carries the SAME 400-step values, so every
    // computed color is byte-identical — the AF5 e2e pins are the
    // regression guards).
    for (const accent of ACCENTS) {
      const vars = accentCssVars(accent);
      const t = ACCENT_TOKENS[accent];
      expect(vars["--sf-primary-deep"]).toBe(t.deep);
      expect(vars["--sf-primary-softest"]).toBe(t.softest);
      expect(vars["--sf-primary-softest-adjacent"]).toBe(t.softestAdjacent);
      expect(vars["--sf-primary-gradient-to"]).toBe(t.gradientTo);
      expect(vars["--sf-primary-gradient-to-strong"]).toBe(t.gradientToStrong);
      expect(vars["--sf-primary-avatar-from"]).toBe(t.avatarFrom);
      expect(vars["--sf-primary-avatar-to"]).toBe(t.avatarTo);
      expect(vars["--sf-primary-clock-date-dark"]).toBe(t.clockDateDark);
      expect(vars["--sf-primary-clock-date-dark"]).toBe(t.avatarFrom); // the decoupling preserves the values
      expect(vars["--sf-primary-empty-from"]).toBe(t.emptyFrom);
      expect(vars["--sf-primary-empty-to"]).toBe(t.emptyTo);
      expect(Object.keys(vars)).toHaveLength(16);
    }
  });
});

describe("AVATAR_EMOJIS", () => {
  it("matches the reference's 24-emoji picker (re-dumped s70 — the s69 22-read dropped ⭐ and ⚽)", () => {
    // The s70 scoped visible-tile dump (probe #2, AP-108 re-measure): the
    // reference's picker vocabulary is these 24 glyphs in this order. The
    // s69 Z12 dump reported 22 — it dropped ⭐ (index 6) and ⚽ (index 19).
    // The S11-era 24-list had carried INVENTED entries (✏️ 🌱 🔥 ☕ 🐢 🐙
    // 🦄 🌈 ⚡) and missed 🐶 💡 🐸 🎮 🎾 🎪 — a coincidence of counts,
    // not a match.
    expect(AVATAR_EMOJIS).toEqual([
      "🎓", "📚", "🧠", "💡", "🎯", "🚀", "⭐", "🌟",
      "🦊", "🐱", "🐶", "🐼", "🦁", "🐸", "🦉", "🐧",
      "🎨", "🎵", "🎮", "⚽", "🏀", "🎾", "🏆", "🎪",
    ]);
    expect(AVATAR_EMOJIS).toHaveLength(24);
    expect(AVATAR_EMOJIS[0]).toBe("🎓");
    expect(AVATAR_EMOJIS[6]).toBe("⭐");
    expect(AVATAR_EMOJIS[19]).toBe("⚽");
  });
});

describe("THEME_BOOT_SCRIPT", () => {
  it("S89/AP3 — the seven hand-maintained TOKENS lists stay index-synced with accentCssVars and Object.values (the insertion-order contract)", () => {
    // The boot script cannot import this module (it is an inline string),
    // so its seven TOKENS name-lists ride the Object.values(ACCENT_TOKENS[a])
    // insertion-order sync contract BY HAND — AO5 extended all seven at
    // the same index manually; a value-equal misalignment would stay green
    // forever (the s88 audit's I2: every accent's clockDateDark === avatarFrom
    // today, so an index slip between those two never shows). This pin is
    // the mechanical guard the contract never had: for every accent, the
    // parsed TOKENS list must equal the accentCssVars key sequence's
    // --sf-primary(-...) suffixes AND its length must equal Object.values'
    // — any future token add/drop that misses ANY of the three sites (the
    // AccentToken interface, accentCssVars, the script's lists) goes RED
    // here. Green-by-design: the current state IS synced (verified live).
    const m = THEME_BOOT_SCRIPT.match(/var TOKENS = \{([\s\S]*?)\n    \};/);
    expect(m, "the TOKENS literal is parseable").not.toBeNull();
    const lists: Record<string, string[]> = {};
    for (const line of m![1].split("\n")) {
      const lm = line.match(/^\s*(\w+): \[(.*)\],?$/);
      if (lm) lists[lm[1]] = lm[2].split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
    }
    expect(Object.keys(lists).sort()).toEqual([...ACCENTS].sort());
    for (const a of ACCENTS) {
      const cssVarSuffixes = Object.keys(accentCssVars(a)).map((k) =>
        k === "--sf-primary" ? "primary" : k.replace("--sf-primary-", ""),
      );
      expect(lists[a], `${a}: the TOKENS list matches the accentCssVars key order`).toEqual(cssVarSuffixes);
      expect(lists[a].length, `${a}: the TOKENS list length matches Object.values`).toBe(
        Object.values(ACCENT_TOKENS[a]).length,
      );
    }
  });

  it("S90/AQ1 — the script TOKENS lists equal the ACCENT_TOKENS literals' own key insertion order (the Object.values ride — the third leg)", () => {
    // The s90 audit's L3: the AP3 pin above pins script-names ↔
    // accentCssVars key-order (accentCssVars reads the literal BY NAME, so
    // its key order is fixed by the accentCssVars code, NOT the literal's
    // line order) and length ↔ Object.values length — but it never pinned
    // the ACCENT_TOKENS literal's OWN key insertion order, the exact order
    // `Object.values(ACCENT_TOKENS[a])` (the boot script's VALUES
    // generator, theme.ts) emits. A value-equal key REORDER inside a
    // literal (e.g. emptyTo moved above emptyFrom) keeps BOTH existing
    // assertions green while the pre-paint script pairs names with wrong
    // values — the misalignment ships a visibly wrong accent with the
    // "mechanical guard" green. This third leg closes the triangle
    // transitively: accentCssVars keys == script names == literal
    // insertion order == Object.values order. MUTATION-PROVEN live in the
    // s90 cycle: reordering two adjacent keys in the violet literal turned
    // EXACTLY this pin RED while the AP3 pin above stayed green — the
    // blind spot demonstrated, then reverted to green.
    const m = THEME_BOOT_SCRIPT.match(/var TOKENS = \{([\s\S]*?)\n    \};/);
    expect(m, "the TOKENS literal is parseable").not.toBeNull();
    const lists: Record<string, string[]> = {};
    for (const line of m![1].split("\n")) {
      const lm = line.match(/^\s*(\w+): \[(.*)\],?$/);
      if (lm) lists[lm[1]] = lm[2].split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
    }
    expect(Object.keys(lists).sort()).toEqual([...ACCENTS].sort());
    for (const a of ACCENTS) {
      // The vocabulary exception (verified against accentCssVars): the
      // literal key `primaryFg` reads --sf-primary-foreground — the ONE
      // key whose script name is not the mechanical kebab of the literal
      // key. Every other key kebab-cases exactly (strongDark →
      // strong-dark, softestAdjacent → softest-adjacent, …).
      const literalKeys = Object.keys(ACCENT_TOKENS[a]).map((k) =>
        k === "primaryFg" ? "foreground" : k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()),
      );
      expect(
        lists[a],
        `${a}: the TOKENS list matches the ACCENT_TOKENS literal's own key insertion order (the Object.values ride)`,
      ).toEqual(literalKeys);
    }
  });
});
