import { describe, expect, it } from "vitest";

import { buildContentDisposition } from "@/lib/server/http";

// S13-C3: the file-download Content-Disposition must speak BOTH filename
// dialects — an ASCII-safe quoted fallback (RFC 2183) AND the RFC 5987
// filename*=UTF-8'' extended form (which every modern browser prefers for
// non-ASCII names). The pre-fix code percent-encoded the name INSIDE the
// quoted string, so browsers saved "%D1%84%D0%B0%D0%B9%D0%BB.txt" as the
// literal filename.

describe("buildContentDisposition", () => {
  it("passes a plain ASCII filename through both forms unchanged", () => {
    const header = buildContentDisposition("notes.txt");
    expect(header).toContain('filename="notes.txt"');
    expect(header).toContain("filename*=UTF-8''notes.txt");
  });

  it("percent-encodes a unicode filename in the RFC 5987 form only", () => {
    const header = buildContentDisposition("файл.txt");
    // The extended form carries the UTF-8 percent-encoding…
    expect(header).toContain("filename*=UTF-8''%D1%84%D0%B0%D0%B9%D0%BB.txt");
    // …and the quoted fallback stays ASCII-safe (no raw Cyrillic inside quotes).
    expect(header).toMatch(/filename="[^"]*"/);
    expect(header.match(/filename="([^"]*)"/)![1]).not.toMatch(/[^\x20-\x7e]/);
  });

  it("neutralizes embedded quotes and backslashes in the ASCII fallback", () => {
    const header = buildContentDisposition('she said "hi"\\bad.txt');
    const fallback = header.match(/filename="([^"]*)"/)![1];
    // No raw quote may terminate the quoted-string early.
    expect(fallback).not.toContain('"');
    // The RFC 5987 form still encodes the exact original name.
    expect(header).toContain(
      "filename*=UTF-8''she%20said%20%22hi%22%5Cbad.txt",
    );
  });

  it("falls back to a usable name when the input is empty", () => {
    const header = buildContentDisposition("");
    expect(header).toContain('filename="download"');
    expect(header).toContain("filename*=UTF-8''download");
  });

  it("keeps spaces percent-encoded in the extended form (not raw)", () => {
    const header = buildContentDisposition("my notes v2.txt");
    expect(header).toContain("filename*=UTF-8''my%20notes%20v2.txt");
    expect(header).toContain('filename="my notes v2.txt"');
  });
});
