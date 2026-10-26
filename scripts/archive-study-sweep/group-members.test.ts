import { describe, expect, it } from "vitest";
import { normalizeMembers } from "@/lib/group-members";
// The server-side read seam (S88/AO3) — imported here so both sides of
// the members boundary are pinned in ONE family (the sentKeysPatch
// precedent for importing entities' pure seams into unit tests).
import { membersFromRow } from "@/lib/server/entities";

// The normalizeMembers contract (S85/AL1): the API boundary ships `members`
// as an ARRAY (membersFromRow); the pre-seam parseMembers JSON.parsed that
// array into a throw and returned [] — every group rendered "0 members",
// addMember wiped the existing members, and the edit-dialog save wiped them
// too. This table pins the seam's every shape: the array the API ships, the
// legacy JSON string the column stores, and the malformed edges.

describe("normalizeMembers", () => {
  it("validates the API's ARRAY shape (the shipped boundary)", () => {
    expect(
      normalizeMembers([
        { name: "Ari", email: "ari@example.com" },
        { name: "Sam", email: "sam@example.com" },
      ]),
    ).toEqual([
      { name: "Ari", email: "ari@example.com" },
      { name: "Sam", email: "sam@example.com" },
    ]);
  });

  it("tolerates the legacy JSON-STRING shape (the column's own storage form)", () => {
    expect(
      normalizeMembers('[{"name":"Ari","email":"ari@example.com"}]'),
    ).toEqual([{ name: "Ari", email: "ari@example.com" }]);
  });

  it("an empty array stays empty (the fresh-group zero state)", () => {
    expect(normalizeMembers([])).toEqual([]);
  });

  it("an empty/absent/whitespace-only members value drops to []", () => {
    expect(normalizeMembers(undefined)).toEqual([]);
    expect(normalizeMembers(null)).toEqual([]);
    expect(normalizeMembers("")).toEqual([]);
    expect(normalizeMembers("   ")).toEqual([]);
  });

  it("corrupt JSON string drops to [] (never throws to the view)", () => {
    expect(normalizeMembers("[object Object]")).toEqual([]);
    expect(normalizeMembers('{"name":"not-an-array"}')).toEqual([]);
  });

  it("drops malformed items individually (the valid ones survive)", () => {
    expect(
      normalizeMembers([
        { name: "Ari", email: "ari@example.com" },
        { name: "", email: "x@example.com" }, // blank name drops
        { name: "No Email" }, // missing email drops
        { email: "no-name@example.com" }, // missing name drops
        "garbage", // non-object drops
        null, // null drops
      ]),
    ).toEqual([{ name: "Ari", email: "ari@example.com" }]);
  });

  it("a non-array non-string value drops to []", () => {
    expect(normalizeMembers({ name: "Ari", email: "a@b.c" })).toEqual([]);
    expect(normalizeMembers(42)).toEqual([]);
  });
});

// S87/AN4 (the s87 audit's I4): the read-side trim symmetry. The AM1
// fix trims at the SERVER boundary (writes), but legacy rows stored
// pre-AM1 carry padded values that the seam returns verbatim — they
// display padded until their first re-write. The seam now trims on
// read too: both sides of the boundary share the same normalization.
describe("normalizeMembers · the S87/AN4 read-side trim", () => {
  it("AN4: trims a padded member name on read (the AM1 write-side symmetry)", () => {
    expect(
      normalizeMembers([{ name: "  Ari  ", email: "ari@example.com" }]),
    ).toEqual([{ name: "Ari", email: "ari@example.com" }]);
  });

  it("AN4: trims a padded member email on read", () => {
    expect(
      normalizeMembers([{ name: "Ari", email: "  ari@example.com  " }]),
    ).toEqual([{ name: "Ari", email: "ari@example.com" }]);
  });
});

// S88/AO3 (the s88 audit's Info 1 — the S87 lesson-4 question, "which
// READ path still returns the old shape?"): the AN4 symmetry stopped one
// layer short — the API GET boundary (entities.ts membersFromRow)
// JSON.parsed the legacy column and returned the array VERBATIM, so only
// the client DISPLAY seam normalized; an API consumer reading a legacy
// padded row saw padded values until the row's first re-write. The
// server read now routes through the SAME normalizeMembers — trim +
// blank-drop + shape validation, both boundaries of the boundary agree.
// The pins ride the exported pure seam (the sentKeysPatch precedent).
describe("membersFromRow · the S88/AO3 server read symmetry", () => {
  it("AO3: a legacy padded row reads back trimmed at the API boundary", () => {
    const row = { id: "g1", name: "Buddies", members: '[{"name":"  Ari  ","email":"  ari@example.com  "}]' };
    const out = membersFromRow(row) as { members: Array<{ name: string; email: string }> };
    expect(out.members).toEqual([{ name: "Ari", email: "ari@example.com" }]);
    // The boundary's own ARRAY shape now SURVIVES the read too (pre-fix a
    // non-string members value was wiped to [] — the tolerant-not-trusting
    // doctrine; rows from Prisma always carry the JSON string, so this is
    // the alternate-boundary tolerance, same as the client seam's).
    const arr = membersFromRow({ members: [{ name: "  Ari  ", email: "ari@example.com" }] }) as {
      members: Array<{ name: string; email: string }>;
    };
    expect(arr.members).toEqual([{ name: "Ari", email: "ari@example.com" }]);
  });

  it("AO3: a blank-padded legacy member drops on read (the AM1 blank-drop, server-side)", () => {
    const row = {
      id: "g2",
      name: "Partners",
      members: '[{"name":"   ","email":"a@b.co"},{"name":"Sam","email":"sam@example.com"}]',
    };
    const out = membersFromRow(row) as { members: Array<{ name: string; email: string }> };
    expect(out.members).toEqual([{ name: "Sam", email: "sam@example.com" }]);
  });

  it("corrupt JSON and non-object rows keep their pre-AO3 error semantics (green-by-design guards)", () => {
    // The regression guards: the normalization must not change the
    // membersFromRow error semantics — garbage JSON → [], a non-row
    // value passes through untouched, an absent members value → [].
    // (These three were verified green on the PRE-fix build; the two pins
    // above carry the RED-first proof — the S87 lesson-1 split.)
    expect((membersFromRow({ members: "not json" }) as { members: unknown[] }).members).toEqual([]);
    expect(membersFromRow(42)).toBe(42);
    expect((membersFromRow({ members: null }) as { members: unknown[] }).members).toEqual([]);
    expect((membersFromRow({}) as { members: unknown[] }).members).toEqual([]);
  });
});
