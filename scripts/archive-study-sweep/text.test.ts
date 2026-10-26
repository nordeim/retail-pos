import { describe, expect, it } from "vitest";

import { stripHtmlPreview } from "@/lib/text";

// S77/AD7 (measured on the reference): the note list row renders a plain-
// text preview of the note's HTML content — tags stripped, whitespace
// collapsed, length-capped. The reference's Quill editor persists content
// as HTML (`<p><strong>Probe paragraph one.</strong></p>`), so the preview
// seam must reduce HTML to readable text.
describe("stripHtmlPreview — the note list-row preview seam (S77/AD7)", () => {
  it("strips tags from simple paragraph HTML", () => {
    expect(stripHtmlPreview("<p><strong>Probe paragraph one.</strong></p>")).toBe(
      "Probe paragraph one.",
    );
  });

  it("joins block elements with a single space and collapses whitespace", () => {
    expect(stripHtmlPreview("<p>One.</p><p>Two.</p>")).toBe("One. Two.");
    expect(stripHtmlPreview("<p>A\n\nB</p>")).toBe("A B");
  });

  it("decodes the common HTML entities", () => {
    expect(stripHtmlPreview("<p>a &amp; b &lt;c&gt; &quot;d&quot;</p>")).toBe('a & b <c> "d"');
  });

  it("caps the preview length (default 60 chars) without cutting mid-word unnecessarily long", () => {
    const long = `<p>${"word ".repeat(30).trim()}</p>`;
    const out = stripHtmlPreview(long);
    expect(out.length).toBeLessThanOrEqual(60);
    expect(out.endsWith("…")).toBe(true);
  });

  it("respects a custom max length", () => {
    expect(stripHtmlPreview("<p>abcdefghij</p>", 5)).toBe("abcd…");
  });

  it("returns the empty string for empty/blank content", () => {
    expect(stripHtmlPreview("")).toBe("");
    expect(stripHtmlPreview("<p></p>")).toBe("");
    expect(stripHtmlPreview("<p>&nbsp;</p>")).toBe("");
  });

  it("passes plain text through untouched (legacy notes)", () => {
    // The seeded notes carry plain text (pre-Quill contract); the preview
    // must not mangle them.
    expect(stripHtmlPreview("The dot product of two vectors")).toBe(
      "The dot product of two vectors",
    );
  });
});

// S78/AE5 (the s78 code audit): the entity decoder must cover the forms
// Quill actually emits — numeric decimal/hex entities (&#8212; &#x2014;)
// and the common named typography entities (&ldquo; &rsquo; &hellip;) —
// and the cap must slice by CODE POINT, never by UTF-16 unit (an emoji
// straddling the cap would otherwise render as a replacement character).
describe("stripHtmlPreview — entity + surrogate hardening (S78/AE5)", () => {
  it("decodes numeric decimal entities", () => {
    expect(stripHtmlPreview("<p>a &#8212; b</p>")).toBe("a — b");
  });

  it("decodes numeric hex entities", () => {
    expect(stripHtmlPreview("<p>x &#x2014; y</p>")).toBe("x — y");
  });

  it("decodes the common named typography entities Quill emits", () => {
    expect(stripHtmlPreview("<p>&ldquo;quote&rdquo; it&rsquo;s &hellip; end</p>")).toBe(
      "\u201Cquote\u201D it\u2019s \u2026 end",
    );
  });

  it("caps by code point — an emoji straddling the cap never splits", () => {
    // 55 ASCII chars + one 2-unit emoji (🎓) + trailing text: the cap at 56
    // would slice the surrogate pair in half under a bare String.slice.
    const text = `${"a".repeat(55)}🎓tail`;
    const out = stripHtmlPreview(text, 56);
    expect(out.endsWith("…")).toBe(true);
    // No lone surrogate / replacement character may appear in the output.
    expect(out).not.toContain("\uFFFD");
    expect(out.includes("🎓")).toBe(false); // the emoji was pushed past the cap
  });

  it("keeps a cap-fitting emoji intact", () => {
    const out = stripHtmlPreview(`${"a".repeat(54)}🎓`, 56);
    expect(out.endsWith("🎓")).toBe(true);
    expect(out).not.toContain("\uFFFD");
  });
});

// S79/AF4 (the s79 code audit, F1): the two S78 surrogate-cap pins were
// NON-DISCRIMINATING — both chosen inputs cut BEFORE or AFTER the pair
// under the old UTF-16 String.slice too, so a regression to a bare slice
// would pass the suite. This pin supplies the discriminating case: at
// 54×"a" + 🎓 + "tail" the old slice cuts BETWEEN the surrogate halves
// (UTF-16 length 59 > 56 → slice(0,55) ends inside the pair), while the
// code-point cap keeps 🎓 whole or drops it whole.
describe("stripHtmlPreview — the discriminating surrogate cap (S79/AF4)", () => {
  it("keeps 🎓 whole when the UTF-16 cap would split it (54a+🎓+tail @56)", () => {
    const text = `${"a".repeat(54)}🎓tail`;
    const out = stripHtmlPreview(text, 56);
    // The cap counts CODE POINTS: 54 a's + 🎓 = 55 ≤ 56 — but "tail"
    // pushes the total to 59 code points, so the cap fires at 55 code
    // points and the emoji (code point 55) is KEPT WHOLE, followed by the
    // ellipsis. A bare String.slice(0, 55) cuts the surrogate pair and
    // emits a lone surrogate (U+D83C) — the assertion this pin exists to
    // catch.
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toContain("\uFFFD");
    // S80/AG10 (the s80 audit, I1): the exact output — an off-by-one
    // regression to `slice(0, max)` (emoji kept whole, 57 code points,
    // NO ellipsis logic change) or a cap drift passes the well-formedness
    // loop above; only the byte-exact assertion catches it.
    expect(out).toBe(`${"a".repeat(54)}🎓…`);
    // No lone surrogate in the output (the string is well-formed UTF-16).
    for (let i = 0; i < out.length; i++) {
      const c = out.charCodeAt(i);
      const isLone = (0xd800 <= c && c <= 0xdbff && (i + 1 >= out.length || !(0xdc00 <= out.charCodeAt(i + 1) && out.charCodeAt(i + 1) <= 0xdfff)))
        || (0xdc00 <= c && c <= 0xdfff && !(i > 0 && 0xd800 <= out.charCodeAt(i - 1) && out.charCodeAt(i - 1) <= 0xdbff));
      expect(isLone).toBe(false);
    }
  });

  it("surfaces an unlisted named entity literally — the pinned deviation (S79/AF4)", () => {
    // The decoder covers the forms Quill emits (the measured surface);
    // a real-but-unlisted named entity (&copy;) passes through literally.
    // Pinned so the deviation is a CONTRACT, not an accident.
    expect(stripHtmlPreview("<p>&copy; 2026</p>")).toBe("&copy; 2026");
  });
});
